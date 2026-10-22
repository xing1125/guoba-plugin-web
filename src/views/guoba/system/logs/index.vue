<template>
  <PageWrapper title="">
    <div class="db g-page lg">
      <!-- 页头 -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">LOG CENTER</div>
          <div class="db-hero__title">运行日志</div>
          <div class="db-hero__desc">
            实时控制台（启动 → 连接微信全过程）+ 运行流水与错误堆栈，按级别筛选、关键字定位、自动跟随
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
            <button v-for="f in files" :key="f.file" type="button" class="lg-file" :class="{ 'is-active': f.file === activeFile, 'is-error': f.kind === 'error', 'is-console': f.console }" @click="switchFile(f)">
              <span class="lg-file__main">
                <span class="lg-file__name">
                  {{ f.label }}
                  <em v-if="f.console" class="lg-file__tag is-live">实时</em>
                  <em v-if="f.today && !f.console" class="lg-file__tag">今天</em>
                  <em v-else-if="f.gz" class="lg-file__tag is-dim">归档</em>
                </span>
                <span class="lg-file__meta">{{ f.desc || `${fmtSize(f.size)} · ${fmtDate(f.mtime)}` }}</span>
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
              <Button size="small" danger :disabled="!activeFile || isConsoleFile" @click="clearVisible = true">清空</Button>
            </div>
          </div>

          <div v-if="data.windowed" class="lg-note"> 文件较大，仅解析最后 {{ fmtSize(data.windowBytes) }}；更早的内容请下载原文件查看。 </div>

          <div class="lg-body" :class="{ 'is-console': isConsoleFile }" :style="{ '--console-bg': `url(${bgUrl})` }">
            <div class="lg-term-bar">
              <span class="lg-term-dot is-r" />
              <span class="lg-term-dot is-y" />
              <span class="lg-term-dot is-g" />
              <span class="lg-term-name">{{ activeLabel }}</span>
              <em v-if="isConsoleFile" class="lg-term-live"><i />LIVE</em>
              <span class="lg-term-count">{{ data.matched }} 条</span>
            </div>
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
                  <span class="lg-row__no">{{ i + 1 }}</span>
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
  import bgUrl from '/@/assets/images/console-bg.jpg';

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
  const activeMeta = computed(() => files.value.find((f) => f.file === activeFile.value));
  const isConsoleFile = computed(() => !!activeMeta.value?.console);
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
        // 默认打开「实时控制台」：覆盖启动 → 连接微信全过程
        const consoleFile = files.value.find((f) => f.console && /stdout/i.test(f.file));
        const today = files.value.find((f) => f.today && f.kind === 'command' && !f.gz);
        activeFile.value = (consoleFile || today || files.value[0]).file;
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
      // 轮询时若文件没长、匹配数也没变，就别整体替换 entries：
      // 300 行 v-html 重渲染 + 全文档样式重算，是实时页最主要的卡顿来源。
      if (
        keepScroll &&
        data.value.entries.length &&
        res.size === data.value.size &&
        res.matched === data.value.matched &&
        res.entries.length === data.value.entries.length
      ) {
        return;
      }
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
    startTimer();
    loadEntries();
  }

  function onLinesChange(v: number) {
    query.lines = v;
    loadEntries();
  }

  /* ------------------------------ 跟随 ------------------------------ */

  let timer: any = null;

  /** 轮询频率：控制台文件 1.5s（启动/连接过程变化快），普通日志 2.5s */
  function pollInterval() {
    const f = files.value.find((x) => x.file === activeFile.value);
    return f?.console ? 1500 : 2500;
  }

  function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(tick, pollInterval());
  }

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
    startTimer();
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

    /* ---- 页头：渐变辉光 + 左侧光柱 ---- */
    .db-hero {
      position: relative;
      overflow: hidden;
      border: 1px solid var(--g-card-border);

      &::before,
      &::after {
        position: absolute;
        z-index: 0;
        width: 340px;
        height: 340px;
        pointer-events: none;
        content: '';
        border-radius: 50%;
        filter: blur(70px);
      }

      &::before {
        top: -160px;
        right: -60px;
        background: radial-gradient(circle, rgb(96 165 250 / 26%), transparent 65%);
      }

      &::after {
        bottom: -180px;
        left: 14%;
        background: radial-gradient(circle, rgb(167 139 250 / 18%), transparent 65%);
      }

      > * {
        position: relative;
        z-index: 1;
      }
    }

    .db-hero__title {
      background: linear-gradient(100deg, var(--g-text) 30%, var(--g-blue) 75%, var(--g-cyan, var(--g-blue)));
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    /* ---- KPI：悬浮抬升 + 图标辉光 ---- */
    .db-kpi__card {
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;

      &:hover {
        border-color: color-mix(in srgb, var(--g-blue) 30%, var(--g-card-border));
        box-shadow: 0 16px 30px -18px rgb(9 18 36 / 55%);
        transform: translateY(-2px);
      }
    }

    .db-kpi__icon {
      position: relative;

      &::after {
        position: absolute;
        inset: -4px;
        content: '';
        background: inherit;
        border-radius: inherit;
        filter: blur(9px);
        opacity: 0.55;
      }
    }

    .db-kpi__value {
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.01em;
    }
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
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    padding: 9px 10px 9px 13px;
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 10px;
    transition: background 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;

    /* 左侧状态轨 */
    &::before {
      position: absolute;
      top: 10px;
      bottom: 10px;
      left: 4px;
      width: 3px;
      content: '';
      background: transparent;
      border-radius: 3px;
      opacity: 0.55;
      transition: opacity 0.16s ease;
    }

    &:hover {
      background: var(--g-hover);
      transform: translateX(2px);

      &::before {
        opacity: 0.8;
      }
    }

    &.is-active {
      background: linear-gradient(135deg, color-mix(in srgb, var(--g-blue) 14%, transparent), color-mix(in srgb, var(--g-blue) 5%, transparent));
      border-color: color-mix(in srgb, var(--g-blue) 38%, transparent);
      box-shadow: 0 6px 18px -10px color-mix(in srgb, var(--g-blue) 60%, transparent);

      &::before {
        background: var(--g-blue);
        opacity: 1;
      }
    }

    &.is-error {
      &::before {
        background: var(--g-red);
      }

      .lg-file__name {
        color: var(--g-red);
      }

      &.is-active::before {
        opacity: 1;
      }
    }

    &.is-console {
      &::before {
        background: var(--g-green);
      }

      &.is-active::before {
        opacity: 1;
      }
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

    &.is-live {
      color: var(--g-green);
      background: color-mix(in srgb, var(--g-green) 14%, transparent);
    }

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
      background: linear-gradient(90deg, var(--g-blue), color-mix(in srgb, var(--g-blue) 45%, transparent));
      border-radius: 2px;
      opacity: 0.75;
    }
  }

  .lg-file__tag.is-live {
    animation: lg-tag-glow 2.4s ease-in-out infinite;
  }

  @keyframes lg-tag-glow {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgb(74 222 128 / 0%);
    }

    50% {
      box-shadow: 0 0 8px 0 rgb(74 222 128 / 35%);
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
    position: relative;
    z-index: 1;
    height: var(--lg-h);
    min-height: 300px;
    padding: 6px 0 10px;
    overflow: auto;
    background: transparent;
    font-family: 'JetBrains Mono', 'Cascadia Mono', Consolas, monospace;
    scrollbar-width: thin;
    scrollbar-color: rgb(255 255 255 / 18%) transparent;

    &::-webkit-scrollbar {
      width: 9px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgb(255 255 255 / 14%);
      border: 2px solid transparent;
      border-radius: 8px;
      background-clip: padding-box;

      &:hover {
        background-color: rgb(255 255 255 / 24%);
      }
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }

  /* ---------------- 日志区：终端窗口（固定暗色调，两套主题一致） ---------------- */
  .lg-body {
    /* 终端内覆盖设计变量：所有子组件（空态/骨架/详情/mark）自动适配暗色 */
    --g-text: #e9f2fd;
    --g-text-sub: #c9d9ef;
    --g-text-mute: #8199bd;
    --g-cyan: #6fd3e7;
    --g-hover: rgb(255 255 255 / 4%);
    --g-track: rgb(255 255 255 / 9%);
    --g-card-bg-soft: rgb(255 255 255 / 4%);
    --g-chip-bg: rgb(255 255 255 / 8%);
    --g-blue-soft: rgb(96 165 250 / 16%);
    --g-gold-soft: rgb(250 204 21 / 22%);

    position: relative;
    margin: 10px 16px 14px;
    overflow: hidden;
    background:
      radial-gradient(120% 90% at 85% -10%, rgb(64 106 178 / 28%) 0%, transparent 55%),
      radial-gradient(90% 70% at 8% 108%, rgb(46 88 148 / 30%) 0%, transparent 52%),
      linear-gradient(168deg, #101b2f 0%, #0b1424 48%, #0d1830 100%);
    border: 1px solid rgb(126 166 224 / 20%);
    border-radius: 13px;
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 6%),
      0 14px 34px -18px rgb(4 10 22 / 55%);

    /* 底图：终端窗内常显，径向渐隐 */
    &::before {
      position: absolute;
      inset: -8% -2% auto;
      z-index: 0;
      height: 116%;
      pointer-events: none;
      content: '';
      background-image: var(--console-bg);
      background-repeat: no-repeat;
      background-position: center 22%;
      background-size: cover;
      opacity: 0;
      transition: opacity 0.4s ease;
      mask-image: radial-gradient(126% 94% at 50% 4%, rgb(0 0 0 / 92%) 0%, rgb(0 0 0 / 52%) 48%, transparent 90%);
    }

    /* 可读性蒙层：上下压回终端底色 */
    &::after {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      content: '';
      background: linear-gradient(
        180deg,
        rgb(13 24 43 / 48%) 0%,
        rgb(13 24 43 / 8%) 26%,
        transparent 52%,
        rgb(11 20 36 / 86%) 100%
      );
    }

    &.is-console::before {
      opacity: 0.38;
    }

    .lg-skeleton,
    .lg-stream {
      position: relative;
      z-index: 1;
    }

    .lg-skeleton .g-skeleton {
      background: rgb(255 255 255 / 9%);
    }
  }

  /* 终端标题栏 */
  .lg-term-bar {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 7px;
    align-items: center;
    padding: 9px 14px;
    background: linear-gradient(180deg, rgb(255 255 255 / 5%), rgb(255 255 255 / 2%));
    border-bottom: 1px solid rgb(255 255 255 / 8%);
  }

  .lg-term-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    box-shadow: inset 0 -1px 1px rgb(0 0 0 / 25%);

    &.is-r {
      background: #ff5f57;
    }

    &.is-y {
      background: #febc2e;
    }

    &.is-g {
      background: #28c840;
    }
  }

  .lg-term-name {
    margin-left: 7px;
    font-family: 'JetBrains Mono', 'Cascadia Mono', Consolas, monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: #9db4d8;
  }

  .lg-term-count {
    font-family: 'JetBrains Mono', 'Cascadia Mono', Consolas, monospace;
    font-size: 10.5px;
    color: #7b92b6;
    font-variant-numeric: tabular-nums;
  }

  .lg-term-live {
    display: inline-flex;
    gap: 5px;
    align-items: center;
    margin-left: auto;
    font-size: 10px;
    font-style: normal;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: #4ade80;

    i {
      width: 6px;
      height: 6px;
      background: currentColor;
      border-radius: 50%;
      animation: lg-pulse 1.6s ease-out infinite;
    }
  }

  @keyframes lg-pulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgb(74 222 128 / 55%);
    }

    60% {
      box-shadow: 0 0 0 6px transparent;
    }
  }

  .lg-row {
    /* 屏幕外的行不参与样式重算/布局：切换主题这类「全文档重算」从 ~700ms 降到几十毫秒 */
    content-visibility: auto;
    contain-intrinsic-size: auto 22px;
    border-left: 2px solid transparent;

    &.is-error {
      background: linear-gradient(90deg, rgb(248 113 113 / 10%), transparent 72%);
      border-left-color: #f87171;
    }

    &.is-warn {
      background: linear-gradient(90deg, rgb(251 191 36 / 8%), transparent 72%);
      border-left-color: #fbbf24;
    }
  }

  .lg-row__head {
    display: grid;
    grid-template-columns: 40px 88px 46px minmax(0, 186px) minmax(0, 1fr) 12px;
    gap: 8px;
    align-items: baseline;
    padding: 3px 14px 3px 12px;
    font-size: 11.5px;
    line-height: 1.65;
    cursor: pointer;
    transition: background 0.14s ease;

    &:hover {
      background: rgb(255 255 255 / 4%);
    }
  }

  .lg-row__no {
    overflow: hidden;
    font-size: 10px;
    color: #5b7194;
    text-align: right;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    user-select: none;
  }

  .lg-row__lv {
    padding: 0 5px;
    font-size: 9.5px;
    font-weight: 700;
    line-height: 15px;
    color: #9db4d8;
    letter-spacing: 0.05em;
    text-align: center;
    background: rgb(255 255 255 / 7%);
    border-radius: 4px;
  }

  .lg-row.is-error .lg-row__lv {
    color: #fca5a5;
    background: rgb(248 113 113 / 16%);
  }

  .lg-row.is-warn .lg-row__lv {
    color: #fcd34d;
    background: rgb(251 191 36 / 15%);
  }

  .lg-row.is-mark .lg-row__lv {
    color: #7b92b6;
    background: rgb(255 255 255 / 5%);
  }

  .lg-row__time {
    overflow: hidden;
    color: #7b92b6;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .lg-row__ctx {
    overflow: hidden;
    color: #6fd3e7;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .lg-row__msg {
    color: #c9d9ef;
    word-break: break-word;

    :deep(mark) {
      padding: 0 1px;
      color: #ffe9a8;
      background: rgb(250 204 21 / 22%);
      border-radius: 2px;
    }
  }

  .lg-row.is-error .lg-row__msg {
    color: #fbd5d5;
  }

  .lg-row__more {
    color: var(--g-text-mute);
    text-align: right;
    opacity: 0.6;
  }

  .lg-row__detail {
    max-height: 320px;
    padding: 8px 12px;
    margin: 2px 14px 8px 60px;
    overflow: auto;
    font-size: 11px;
    line-height: 1.6;
    color: #a9bdd9;
    background: rgb(3 8 18 / 45%);
    border: 1px solid rgb(255 255 255 / 7%);
    border-radius: 8px;
    scrollbar-width: thin;
  }
</style>
