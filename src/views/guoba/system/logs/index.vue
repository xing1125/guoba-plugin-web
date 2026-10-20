<template>
  <PageWrapper title="">
    <div class="db g-page lg">
      <!-- 页头 -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">LOG CENTER</div>
          <div class="db-hero__title">运行日志</div>
          <div class="db-hero__desc">
            Bot 运行流水与错误堆栈，按级别筛选、关键字定位、实时跟随 —— 不用再去翻 app/logs
            <span v-if="summary.dir" class="db-hero__time">· {{ summary.dir }}</span>
          </div>
        </div>
        <div class="db-hero__side">
          <label class="lg-follow" :class="{ 'is-on': follow }">
            <span class="lg-follow__dot" />
            <span class="lg-follow__text">{{ follow ? '跟随中' : '已暂停' }}</span>
            <Switch v-model:checked="follow" size="small" @change="onFollowChange" />
          </label>
          <Button size="small" :loading="loading" @click="reload">刷新</Button>
        </div>
      </section>

      <!-- 概览 -->
      <section class="db-kpi">
        <div v-for="c in cards" :key="c.key" class="db-kpi__card">
          <div class="db-kpi__icon" :style="{ background: `linear-gradient(135deg, ${c.color}, ${c.color2})` }">
            <Icon :icon="c.icon" :size="19" />
          </div>
          <div class="db-kpi__body">
            <div class="db-kpi__label">{{ c.label }}</div>
            <div class="db-kpi__value">
              {{ c.value }}<small v-if="c.unit">{{ c.unit }}</small>
            </div>
            <div class="db-kpi__foot">{{ c.foot }}</div>
          </div>
        </div>
      </section>

      <div class="lg-grid">
        <!-- 左：文件列表 -->
        <div class="g-card lg-files">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('folder-open')" :size="13" /></i>
              日志文件
              <span class="gm-panel__extra" style="margin-left: 8px">{{ files.length }} 个</span>
            </div>
          </div>

          <div v-if="filesLoading && !files.length" class="lg-files__sk">
            <div v-for="i in 5" :key="i" class="g-skeleton g-skeleton--text" />
          </div>
          <GEmpty v-else-if="!files.length" title="没有日志文件" desc="Bot 还没有产生 app/logs 下的流水" />
          <div v-else class="lg-files__list">
            <button v-for="f in files" :key="f.file" type="button" class="lg-file" :class="{ 'is-active': f.file === activeFile, 'is-error': f.kind === 'error' }" @click="switchFile(f)">
              <span class="lg-file__main">
                <span class="lg-file__name">
                  {{ f.label }}
                  <em v-if="f.today" class="lg-file__tag">今天</em>
                  <em v-else-if="f.gz" class="lg-file__tag is-dim">归档</em>
                </span>
                <span class="lg-file__meta">{{ fmtSize(f.size) }} · {{ fmtDate(f.mtime) }}</span>
              </span>
              <span class="lg-file__bar">
                <i :style="{ width: `${fileBar(f.size)}%` }" />
              </span>
            </button>
          </div>
        </div>

        <!-- 右：内容 -->
        <div class="g-card lg-view">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('file-text')" :size="13" /></i>
              {{ activeLabel }}
              <span class="gm-panel__extra" style="margin-left: 8px">
                {{ data.matched }} 条<template v-if="data.matched !== data.total"> / 共 {{ data.total }}</template>
              </span>
            </div>
            <div class="toolbar">
              <GSearch v-model="query.q" size="sm" width="200px" placeholder="搜索内容 / 上下文" @search="loadEntries()" />
              <GSelect v-model="query.level" size="sm" width="120px" :options="levelOptions" @change="loadEntries" />
              <GSegmented
                :model-value="query.lines"
                :options="[
                  { value: 100, label: '100' },
                  { value: 300, label: '300' },
                  { value: 800, label: '800' },
                ]"
                size="sm"
                label="显示行数"
                @update:model-value="onLinesChange($event as number)"
              />
              <Button size="small" :disabled="!data.matched" @click="copyAll">复制</Button>
              <Button size="small" @click="download">
                <Icon :icon="$gm('download')" :size="13" />
              </Button>
              <Button size="small" danger :disabled="!activeFile" @click="clearVisible = true">清空</Button>
            </div>
          </div>

          <div v-if="data.windowed" class="lg-note"> 文件较大，仅解析最后 {{ fmtSize(data.windowBytes) }}；更早的内容请下载原文件查看。 </div>

          <div v-if="loading && !data.entries.length" class="lg-skeleton">
            <div v-for="i in 8" :key="i" class="g-skeleton g-skeleton--text" />
          </div>
          <GEmpty
            v-else-if="!data.entries.length"
            :title="query.q || query.level !== 'ALL' ? '没有匹配的日志行' : '该文件暂时没有内容'"
            :desc="query.q || query.level !== 'ALL' ? '换个关键字或把级别切回「全部」' : '有请求进来后会写入新的流水'"
          />
          <div v-else ref="streamRef" class="lg-stream" @scroll="onScroll">
            <div v-for="(e, i) in data.entries" :key="`${e.time}-${i}`" class="lg-row" :class="[`is-${e.level.toLowerCase()}`, { 'is-open': expanded.has(i) }]">
              <div class="lg-row__head" @click="toggle(i)">
                <span class="lg-row__time">{{ e.time || '—' }}</span>
                <span class="lg-row__lv">{{ e.level }}</span>
                <span class="lg-row__ctx" :title="e.ctx">{{ e.ctx || '—' }}</span>
                <span class="lg-row__msg" v-html="hl(e.msg)" />
                <span v-if="e.detail.length" class="lg-row__more">{{ expanded.has(i) ? '−' : '+' }}</span>
              </div>
              <pre v-if="expanded.has(i) && e.detail.length" class="lg-row__detail">{{ e.detail.join('\n') }}</pre>
            </div>
          </div>
        </div>
      </div>

      <GConfirmModal
        v-model:visible="clearVisible"
        title="清空日志"
        :content="`将把 ${activeLabel}（${fmtSize(data.size)}）内容清空为 0 字节，操作会写入审计日志。`"
        hint="清空不可撤销；归档文件（.gz）不支持清空。"
        danger
        ok-text="确认清空"
        :loading="clearing"
        @ok="doClear"
      />
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, unref } from 'vue';
  import { Button, Switch } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import { Icon } from '/@/components/Icon';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useRootSetting } from '/@/hooks/setting/useRootSetting';
  import { ThemeEnum } from '/@/enums/appEnum';
  import { kpiPalette, thousands } from '../_shared/stats';
  import GEmpty from '../_shared/GEmpty.vue';
  import GSearch from '../_shared/form/GSearch.vue';
  import GSelect from '../_shared/form/GSelect.vue';
  import GSegmented from '../_shared/form/GSegmented.vue';
  import GConfirmModal from '../_shared/dialog/GConfirmModal.vue';
  import { logApi, type LogEntriesResult, type LogEntry, type LogFile, type LogSummary } from './api';
  import { gm } from '/@/design/gmIcons';

  /**
   * 运行日志中心
   *
   * 左侧文件清单（error.log 置顶 + 按天流水），右侧日志流：
   * 级别筛选走服务端（避免只筛窗口尾部），关键字也走服务端后前端再高亮。
   * 自动跟随用轮询（2.5s），用户手动上滚离开底部即暂停，回到底部自动恢复。
   */

  defineOptions({ name: 'RunLogs' });

  const { createMessage: $message } = useMessage();
  const { getDarkMode } = useRootSetting();
  const isDark = computed(() => unref(getDarkMode) === ThemeEnum.DARK);
  const palette = computed(() => kpiPalette(isDark.value));

  const files = ref<LogFile[]>([]);
  const filesLoading = ref(false);
  const loading = ref(false);
  const clearing = ref(false);
  const clearVisible = ref(false);
  const follow = ref(true);
  const expanded = ref<Set<number>>(new Set());
  const streamRef = ref<HTMLDivElement | null>(null);

  const query = reactive({ q: '', level: 'ALL', lines: 300 });

  const empty = (): LogEntriesResult => ({
    file: '',
    gz: false,
    size: 0,
    mtime: '',
    total: 0,
    matched: 0,
    windowed: false,
    windowBytes: 0,
    limit: 300,
    counts: {},
    entries: [],
  });

  const data = ref<LogEntriesResult>(empty());
  const summary = ref<LogSummary>({
    available: false,
    dir: '',
    fileCount: 0,
    totalSize: 0,
    todayErrors: 0,
    todayWarns: 0,
    todayMarks: 0,
    lastError: null,
    latestFile: null,
  });

  const activeFile = ref('');
  const activeLabel = computed(() => files.value.find((f) => f.file === activeFile.value)?.label || '日志');
  const maxSize = computed(() => Math.max(1, ...files.value.map((f) => f.size)));

  const levelOptions = [
    { label: '全部级别', value: 'ALL' },
    { label: '错误 ERROR', value: 'ERROR' },
    { label: '告警 WARN', value: 'WARN' },
    { label: '标记 MARK', value: 'MARK' },
    { label: '信息 INFO', value: 'INFO' },
  ];

  const cards = computed(() => {
    const p = palette.value;
    return [
      {
        key: 'err',
        label: '今日错误',
        value: thousands(summary.value.todayErrors),
        unit: '条',
        foot: summary.value.lastError ? `最近 ${summary.value.lastError.time}` : '窗口内无错误',
        icon: gm('error'),
        color: p.rose[0],
        color2: p.rose[1],
      },
      {
        key: 'warn',
        label: '今日告警',
        value: thousands(summary.value.todayWarns),
        unit: '条',
        foot: `标记 ${thousands(summary.value.todayMarks)} 条`,
        icon: gm('warning'),
        color: p.amber[0],
        color2: p.amber[1],
      },
      {
        key: 'files',
        label: '日志文件',
        value: thousands(summary.value.fileCount),
        unit: '个',
        foot: summary.value.available ? 'app/logs' : '目录不存在',
        icon: gm('file-text'),
        color: p.blue[0],
        color2: p.blue[1],
      },
      {
        key: 'size',
        label: '占用空间',
        value: fmtSize(summary.value.totalSize),
        unit: '',
        foot: '含历史归档',
        icon: gm('database'),
        color: p.violet[0],
        color2: p.violet[1],
      },
    ];
  });

  /* ------------------------------ 工具 ------------------------------ */

  function fmtSize(n: number) {
    if (!n) return '0 B';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
  }

  function fmtDate(iso: string) {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (x: number) => String(x).padStart(2, '0');
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function fileBar(size: number) {
    return Math.max(3, Math.round((size / unref(maxSize)) * 100));
  }

  const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s: string) {
    return s.replace(/[&<>"']/g, (c) => ESC[c]);
  }

  /** 关键字高亮：先转义再包 <mark>，避免把日志内容当 HTML 执行 */
  function hl(text: string) {
    const safe = esc(text || '');
    const q = query.q.trim();
    if (!q) return safe;
    const needle = esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return safe.replace(new RegExp(needle, 'gi'), (m) => `<mark>${m}</mark>`);
  }

  /* ------------------------------ 加载 ------------------------------ */

  async function loadSummary() {
    try {
      summary.value = await logApi.getSummary();
    } catch {
      /* 摘要失败不影响主流程 */
    }
  }

  async function loadFiles(silent = false) {
    if (!silent) filesLoading.value = true;
    try {
      const res = await logApi.getFiles();
      files.value = res.files || [];
      if (!activeFile.value && files.value.length) {
        const today = files.value.find((f) => f.today && f.kind === 'command' && !f.gz);
        activeFile.value = (today || files.value[0]).file;
      }
    } catch (e: any) {
      $message.error(e?.message || '读取日志文件列表失败');
    } finally {
      filesLoading.value = false;
    }
  }

  async function loadEntries(keepScroll = false) {
    if (!activeFile.value) return;
    if (!keepScroll) loading.value = true;
    try {
      const res = await logApi.getEntries({
        file: activeFile.value,
        lines: query.lines,
        level: query.level,
        q: query.q,
      });
      data.value = res;
      if (!keepScroll) expanded.value = new Set();
      if (follow.value) {
        await nextTick();
        scrollBottom();
      }
    } catch (e: any) {
      $message.error(e?.message || '读取日志失败');
    } finally {
      loading.value = false;
    }
  }

  async function reload() {
    await Promise.all([loadSummary(), loadFiles(true)]);
    await loadEntries(true);
  }

  function switchFile(f: LogFile) {
    if (activeFile.value === f.file) return;
    activeFile.value = f.file;
    expanded.value = new Set();
    loadEntries();
  }

  function onLinesChange(v: number) {
    query.lines = v;
    loadEntries();
  }

  /* ------------------------------ 跟随 ------------------------------ */

  let timer: any = null;

  function scrollBottom() {
    const el = streamRef.value;
    if (el) el.scrollTop = el.scrollHeight;
  }

  function nearBottom() {
    const el = streamRef.value;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  function onScroll() {
    if (!follow.value && nearBottom()) {
      follow.value = true;
      return;
    }
    if (follow.value && !nearBottom()) {
      follow.value = false;
    }
  }

  function onFollowChange(v: any) {
    if (v) {
      scrollBottom();
      loadEntries(true);
    }
  }

  function tick() {
    if (document.hidden || !follow.value) return;
    loadEntries(true);
    loadSummary();
  }

  onMounted(async () => {
    await Promise.all([loadSummary(), loadFiles()]);
    await loadEntries();
    await nextTick();
    scrollBottom();
    timer = setInterval(tick, 2500);
  });

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
  });

  /* ------------------------------ 行操作 ------------------------------ */

  function toggle(i: number) {
    const set = expanded.value;
    if (set.has(i)) set.delete(i);
    else set.add(i);
    expanded.value = new Set(set);
  }

  /* ------------------------------ 下载 / 复制 / 清空 ------------------------------ */

  async function download() {
    if (!activeFile.value) return;
    try {
      const res: any = await logApi.download(activeFile.value);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = activeFile.value;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e: any) {
      $message.error(e?.message || '下载失败');
    }
  }

  async function copyAll() {
    const text = data.value.entries.map((e: LogEntry) => [e.raw, ...e.detail].join('\n')).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      $message.success(`已复制 ${data.value.entries.length} 条日志`);
    } catch {
      $message.error('浏览器拒绝了剪贴板访问，请改用下载');
    }
  }

  async function doClear() {
    clearing.value = true;
    try {
      const res: any = await logApi.clear(activeFile.value);
      $message.success(`已清空 ${res.clearedBytes ? fmtSize(res.clearedBytes) : ''} 内容`);
      clearVisible.value = false;
      await reload();
    } catch (e: any) {
      $message.error(e?.message || '清空失败');
    } finally {
      clearing.value = false;
    }
  }
</script>

<style scoped lang="less">
  .lg {
    --lg-h: calc(100vh - 344px);
  }

  @media (max-height: 720px) {
    .lg {
      --lg-h: calc(100vh - 300px);
    }
  }

  .lg-grid {
    display: grid;
    grid-template-columns: 268px minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }

  @media (max-width: 1180px) {
    .lg-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  /* ---------------- 跟随开关 ---------------- */
  .lg-follow {
    display: inline-flex;
    gap: 7px;
    align-items: center;
    padding: 3px 8px 3px 10px;
    font-size: 11.5px;
    color: var(--g-text-mute);
    cursor: pointer;
    background: var(--g-chip-bg);
    border-radius: 999px;
    transition: color 0.16s ease, background 0.16s ease;

    &.is-on {
      color: var(--g-green);
      background: color-mix(in srgb, var(--g-green) 12%, transparent);
    }
  }

  .lg-follow__dot {
    width: 6px;
    height: 6px;
    background: currentColor;
    border-radius: 50%;
    opacity: 0.55;
  }

  .lg-follow.is-on .lg-follow__dot {
    opacity: 1;
    animation: lgPulse 1.6s ease-in-out infinite;
  }

  @keyframes lgPulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 currentColor;
      opacity: 1;
    }

    60% {
      box-shadow: 0 0 0 5px transparent;
      opacity: 0.5;
    }
  }

  /* ---------------- 文件列表 ---------------- */
  .lg-files {
    padding: 14px 12px 12px;
  }

  .lg-files__list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: var(--lg-h);
    padding-top: 8px;
    overflow-y: auto;
    scrollbar-width: thin;
  }

  .lg-files__sk {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px 2px;
  }

  .lg-file {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    padding: 8px 9px;
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 9px;
    transition: background 0.16s ease, border-color 0.16s ease;

    &:hover {
      background: var(--g-hover);
    }

    &.is-active {
      background: var(--g-blue-soft);
      border-color: color-mix(in srgb, var(--g-blue) 34%, transparent);
    }

    &.is-error .lg-file__name {
      color: var(--g-red);
    }
  }

  .lg-file__main {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .lg-file__name {
    display: flex;
    gap: 5px;
    align-items: center;
    font-size: 12px;
    font-weight: 600;
    color: var(--g-text-sub);
  }

  .lg-file__tag {
    padding: 0 5px;
    font-size: 10px;
    font-style: normal;
    font-weight: 500;
    color: var(--g-blue);
    background: var(--g-blue-soft);
    border-radius: 4px;

    &.is-dim {
      color: var(--g-text-mute);
      background: var(--g-chip-bg);
    }
  }

  .lg-file__meta {
    font-size: 11px;
    color: var(--g-text-mute);
    font-variant-numeric: tabular-nums;
  }

  .lg-file__bar {
    display: block;
    height: 2px;
    overflow: hidden;
    background: var(--g-track);
    border-radius: 2px;

    i {
      display: block;
      height: 100%;
      background: var(--g-blue);
      border-radius: 2px;
      opacity: 0.65;
    }
  }

  /* ---------------- 日志流 ---------------- */
  .lg-view {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 14px 0 8px;
  }

  .lg-view .gm-panel__head {
    padding: 0 16px;
  }

  .lg-note {
    margin: 8px 16px 0;
    padding: 7px 10px;
    font-size: 11px;
    color: var(--g-amber);
    background: var(--g-gold-soft, var(--g-chip-bg));
    border-radius: 8px;
  }

  .lg-skeleton {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
  }

  .lg-stream {
    height: var(--lg-h);
    min-height: 300px;
    padding: 6px 0 8px;
    margin-top: 8px;
    overflow: auto;
    background: var(--g-card-bg-soft);
    border-top: 1px solid var(--g-card-border);
    font-family: 'JetBrains Mono', 'Cascadia Mono', Consolas, monospace;
    scrollbar-width: thin;
  }

  .lg-row {
    padding: 0 16px;
    border-left: 2px solid transparent;

    &:hover {
      background: var(--g-hover);
    }

    &.is-error {
      border-left-color: var(--g-red);
    }

    &.is-warn {
      border-left-color: var(--g-amber);
    }
  }

  .lg-row__head {
    display: grid;
    grid-template-columns: 86px 46px minmax(0, 190px) minmax(0, 1fr) 12px;
    gap: 8px;
    align-items: baseline;
    padding: 3px 0;
    font-size: 11.5px;
    line-height: 1.65;
    cursor: pointer;
  }

  .lg-row__lv {
    font-size: 10px;
    font-weight: 700;
    color: var(--g-text-mute);
    letter-spacing: 0.04em;
  }

  .lg-row.is-error .lg-row__lv {
    color: var(--g-red);
  }

  .lg-row.is-warn .lg-row__lv {
    color: var(--g-amber);
  }

  .lg-row.is-mark .lg-row__lv {
    color: var(--g-text-mute);
    opacity: 0.75;
  }

  .lg-row__time {
    overflow: hidden;
    color: var(--g-text-mute);
    text-overflow: ellipsis;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .lg-row__ctx {
    overflow: hidden;
    color: var(--g-cyan, var(--g-text-mute));
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .lg-row__msg {
    color: var(--g-text-sub);
    word-break: break-word;

    :deep(mark) {
      padding: 0 1px;
      color: var(--g-text);
      background: var(--g-gold-soft, rgb(211 188 141 / 35%));
      border-radius: 2px;
    }
  }

  .lg-row.is-error .lg-row__msg {
    color: var(--g-text);
  }

  .lg-row__more {
    color: var(--g-text-mute);
    text-align: right;
    opacity: 0.6;
  }

  .lg-row__detail {
    max-height: 320px;
    padding: 6px 10px;
    margin: 2px 0 6px 46px;
    overflow: auto;
    font-size: 11px;
    line-height: 1.6;
    color: var(--g-text-mute);
    background: var(--g-card-bg-soft);
    border-radius: 8px;
    scrollbar-width: thin;
  }
</style>
