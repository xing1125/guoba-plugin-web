<template>
  <GModal
    v-model:visible="open"
    size="xl"
    eyebrow="CONFIG VERSION"
    :title="`历史版本 · ${cardTitle || configKey}`"
    :subtitle="configKey"
    body-height="72vh"
    :footer-hint="footerHint"
  >
    <template #tools>
      <Button class="cvm-tool" size="small" :loading="exporting" @click="onExport">
        <Icon :icon="$gm('download')" :size="12" />
        <span class="cvm-tool__label">导出当前配置</span>
      </Button>
      <Button class="cvm-tool" size="small" @click="pickFile">
        <Icon :icon="$gm('upload')" :size="12" />
        <span class="cvm-tool__label">导入配置…</span>
      </Button>
    </template>

    <div class="cvm">
      <!-- ============================ 左栏 · 版本列表 ============================ -->
      <aside class="cvm__side">
        <div class="cvm__side-head">
          <template v-if="list">共 {{ versions.length }} 个历史版本 · 每个配置保留最近 10 份</template>
          <template v-else>历史备份</template>
        </div>

        <div v-if="listLoading" class="cvm__empty">读取备份列表…</div>
        <div v-else-if="listError" class="cvm__empty">{{ listError }}</div>
        <div v-else-if="!versions.length" class="cvm__empty">
          这个配置还没有历史版本
          <span class="cvm__empty-sub">（每次保存会自动备份一份）</span>
        </div>
        <div v-else class="cvm__list">
          <button
            v-for="v in versions"
            :key="v.file"
            type="button"
            class="cvm__row"
            :class="{ 'is-active': selected?.file === v.file }"
            :title="`${fmtDateTime(isoTime(v.time))} · ${fmtFromNow(isoTime(v.time))}`"
            @click="selectVersion(v)"
          >
            <span class="cvm__row-time">{{ fmtRowTime(v.time) }}</span>
            <span class="cvm__row-meta">
              <em>{{ fmtSize(v.size) }}</em>
              <span class="cvm__row-target">{{ v.target }}</span>
            </span>
          </button>
        </div>
      </aside>

      <!-- ============================ 右栏 · 对比 ============================ -->
      <section class="cvm__main">
        <div v-if="diff" class="cvm__stat">
          <span class="is-add">+{{ diff.added }} 新增</span>
          <span class="cvm__dot">·</span>
          <span class="is-del">-{{ diff.removed }} 删除</span>
          <span class="cvm__dot">·</span>
          <span>{{ diff.unchanged }} 未变</span>
          <span class="cvm__stat-file">{{ diff.stamp }}</span>
        </div>

        <div v-if="truncated" class="cvm__note">文件过大，仅统计变更数量，不显示逐行差异</div>

        <div v-if="diffLoading" class="cvm__empty">正在对比…</div>
        <div v-else-if="!selected" class="cvm__empty">
          左侧选一个版本
          <span class="cvm__empty-sub">或先导入 / 导出一份当前配置</span>
        </div>
        <div v-else-if="!diff" class="cvm__empty">对比数据读取失败</div>
        <div v-else-if="isIdentical" class="cvm__empty">
          与当前内容完全一致
          <span class="cvm__empty-sub">这个备份和现在的配置文件没有差别</span>
        </div>
        <div v-else-if="truncated" class="cvm__empty">仅显示变更统计（文件过大）</div>
        <div v-else-if="!diffLines.length" class="cvm__empty">没有可显示的行</div>
        <div v-else class="cvm__diff">
          <div
            v-for="(line, idx) of diffLines"
            :key="idx"
            class="cvm__line"
            :class="lineClass(line.type)"
          >
            <span class="cvm__sign">{{ line.type === ' ' ? '\u00a0' : line.type }}</span>
            <span class="cvm__code">{{ line.text || '\u00a0' }}</span>
          </div>
        </div>
      </section>
    </div>

    <template #footer>
      <Button @click="open = false">关闭</Button>
      <Button danger :disabled="!selected" :loading="restoring" @click="askRestore">恢复此版本</Button>
    </template>
  </GModal>

  <!-- 恢复二次确认 -->
  <GConfirmModal
    v-model:visible="restoreConfirm"
    title="恢复此版本"
    :content="restoreContent"
    hint="恢复动作会写入配置文件，请确认当前内容确实需要被覆盖。"
    danger
    :loading="restoring"
    ok-text="确认恢复"
    @ok="doRestore"
  />

  <!-- 导入二次确认 -->
  <GConfirmModal
    v-model:visible="importConfirm"
    title="导入配置"
    :content="importContent"
    hint="导入的是本地文件全文，会覆盖当前配置内容；导入前会自动备份当前状态。"
    danger
    :loading="importing"
    ok-text="确认导入"
    @ok="doImport"
  />

  <input ref="fileInput" class="cvm__file" type="file" accept=".yaml,.yml" @change="onFileChange" />
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { Button } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import GModal from '/@/views/guoba/system/_shared/dialog/GModal.vue';
  import GConfirmModal from '/@/views/guoba/system/_shared/dialog/GConfirmModal.vue';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { fmtDateTime, fmtFromNow } from '/@/utils/localTime';
  import {
    exportConfigContent,
    importConfigContent,
    queryConfigDiff,
    queryConfigVersions,
    restoreConfigVersion,
    type ConfigDiff,
    type ConfigDiffLine,
    type ConfigVersion,
    type ConfigVersionList,
  } from '../config.api';

  /**
   * ConfigVersionModal —— 配置块的历史版本 / 对比 / 导出导入
   *
   * 左栏：最近 10 份自动备份（时间倒序，默认选中最新）
   * 右栏：历史版本 vs 当前磁盘 的行级 diff（'-' 版本有现在没有，'+' 现在有版本没有）
   * 恢复 / 导入都是破坏性操作，一律走 GConfirmModal 二次确认，成功后通知父组件刷新配置。
   */

  defineOptions({ name: 'ConfigVersionModal' });

  const props = defineProps({
    visible: { type: Boolean, default: false },
    /** 配置块 key，同 card.key */
    configKey: { type: String, required: true },
    cardTitle: { type: String, default: '' },
  });

  const emit = defineEmits(['update:visible', 'changed']);

  const { createMessage } = useMessage();

  const open = computed({
    get: () => props.visible,
    set: (v: boolean) => emit('update:visible', v),
  });

  const list = ref<ConfigVersionList | null>(null);
  const listLoading = ref(false);
  const listError = ref('');
  const selected = ref<ConfigVersion | null>(null);

  const diff = ref<ConfigDiff | null>(null);
  const diffLoading = ref(false);

  const restoring = ref(false);
  const importing = ref(false);
  const exporting = ref(false);

  const restoreConfirm = ref(false);
  const importConfirm = ref(false);
  const pendingImport = ref<{ name: string; content: string } | null>(null);
  const fileInput = ref<HTMLInputElement | null>(null);

  const versions = computed<ConfigVersion[]>(() => list.value?.versions ?? []);

  const diffLines = computed<ConfigDiffLine[]>(() => diff.value?.lines ?? []);

  const isIdentical = computed(() => {
    const d = diff.value;
    return !!d && d.added === 0 && d.removed === 0;
  });

  const truncated = computed(() => diff.value?.truncated === true);

  const footerHint = computed(() => {
    const v = selected.value;
    if (!v) return '未选中版本';
    return `选中版本：${v.stamp}（${fmtFromNow(isoTime(v.time)) || '—'}）`;
  });

  const restoreContent = computed(() => {
    const v = selected.value;
    if (!v) return '';
    return (
      `把当前配置替换为所选版本 ${v.stamp}（${fmtDateTime(isoTime(v.time))}）。\n` +
      '恢复前会先把当前状态备份一份，随时可以再回滚到你现在的配置。\n' +
      '恢复后按热更新规则生效：涉及需重启的字段需要重启 Bot 才会完全生效。'
    );
  });

  const importContent = computed(() => {
    const p = pendingImport.value;
    const name = p?.name || '所选文件';
    const size = p ? fmtSize(new Blob([p.content]).size) : '';
    return (
      `会用本地文件「${name}」${size ? `（${size}）` : ''}覆盖当前 ${props.cardTitle || props.configKey} 配置，导入前会自动备份。\n` +
      '导入内容按 YAML 原文整体替换，字段缺失不会被补全。'
    );
  });

  /* ------------------------------ 格式化 ------------------------------ */

  /** 后端 time 是毫秒时间戳，转成统一时间工具能吃的字符串 */
  function isoTime(t?: number | string): string {
    if (t === undefined || t === null || t === '') return '';
    return typeof t === 'number' ? new Date(t).toISOString() : String(t);
  }

  /** 列表行要求精确到秒（同一分钟内可能连存两次），按 Date 本地时区补零，不做字符串裁切 */
  function fmtRowTime(t: number): string {
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) return '';
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  function fmtSize(bytes?: number): string {
    const n = Number(bytes ?? 0);
    if (!n || n < 0) return '0 B';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  }

  function lineClass(type: string) {
    if (type === '+') return 'is-add';
    if (type === '-') return 'is-del';
    return 'is-same';
  }

  /* ------------------------------ 数据 ------------------------------ */

  async function loadVersions() {
    listLoading.value = true;
    listError.value = '';
    try {
      list.value = await queryConfigVersions(props.configKey);
      const first = list.value?.versions?.[0] ?? null;
      if (first) {
        await selectVersion(first);
      } else {
        selected.value = null;
        diff.value = null;
      }
    } catch (e: any) {
      list.value = null;
      selected.value = null;
      diff.value = null;
      listError.value = e?.message || '读取备份列表失败';
    } finally {
      listLoading.value = false;
    }
  }

  async function selectVersion(v: ConfigVersion) {
    if (!v) return;
    selected.value = v;
    await loadDiff(v.file);
  }

  async function loadDiff(file: string) {
    diffLoading.value = true;
    diff.value = null;
    try {
      diff.value = await queryConfigDiff(props.configKey, file);
    } catch {
      diff.value = null;
    } finally {
      diffLoading.value = false;
    }
  }

  // 每次打开都重新拉一次（关弹窗后可能又保存过），并重置选择
  watch(
    () => props.visible,
    (v) => {
      if (!v) return;
      selected.value = null;
      diff.value = null;
      pendingImport.value = null;
      void loadVersions();
    },
    { immediate: true },
  );

  /* ------------------------------ 导出 / 导入 ------------------------------ */

  async function onExport() {
    if (exporting.value) return;
    exporting.value = true;
    try {
      const r = await exportConfigContent(props.configKey);
      const blob = new Blob([r?.content ?? ''], { type: 'text/yaml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = r?.filename || `${props.configKey.replace(/[^\w.-]+/g, '-')}.yaml`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // 立即 revoke 在部分浏览器会打断下载，延后释放
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      createMessage.success(`已导出 ${a.download}`);
    } catch (e: any) {
      createMessage.error(e?.message || '导出失败');
    } finally {
      exporting.value = false;
    }
  }

  function pickFile() {
    fileInput.value?.click();
  }

  function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    // 允许下次选同一个文件也能触发 change
    input.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      pendingImport.value = { name: file.name, content: String(reader.result ?? '') };
      importConfirm.value = true;
    };
    reader.onerror = () => createMessage.error('读取文件失败，请确认文件可读');
    reader.readAsText(file, 'utf-8');
  }

  async function doImport() {
    const p = pendingImport.value;
    if (!p) {
      importConfirm.value = false;
      return;
    }
    importing.value = true;
    try {
      const r = await importConfigContent(props.configKey, p.content);
      const base = `已导入 ${r?.bytes ?? 0} 字节，原配置备份为 ${r?.backupOf || '—'}`;
      if (r?.hot === false) {
        createMessage.warning(`${base}，需重启 Bot 后生效${r?.reason ? '：' + r.reason : ''}`, 6);
      } else if (r?.hot === true) {
        createMessage.success(`${base}，已即时生效`);
      } else {
        createMessage.success(base);
      }
      importConfirm.value = false;
      pendingImport.value = null;
      open.value = false;
      emit('changed');
    } catch (e: any) {
      createMessage.error(e?.message || '导入失败');
    } finally {
      importing.value = false;
    }
  }

  /* ------------------------------ 恢复 ------------------------------ */

  function askRestore() {
    if (!selected.value || restoring.value) return;
    restoreConfirm.value = true;
  }

  async function doRestore() {
    const v = selected.value;
    if (!v) {
      restoreConfirm.value = false;
      return;
    }
    restoring.value = true;
    try {
      const r = await restoreConfigVersion(props.configKey, v.file);
      const base = `已恢复到 ${r?.restoredFrom || v.stamp}，当前状态已备份为 ${r?.backupOf || '—'}`;
      if (r?.hot === false) {
        createMessage.warning(`${base}，需重启 Bot 后生效${r?.reason ? '：' + r.reason : ''}`, 6);
      } else if (r?.hot === true) {
        createMessage.success(`${base}，已即时生效`);
      } else {
        createMessage.success(base);
      }
      restoreConfirm.value = false;
      open.value = false;
      emit('changed');
    } catch (e: any) {
      createMessage.error(e?.message || '恢复失败');
    } finally {
      restoring.value = false;
    }
  }
</script>

<style scoped lang="less">
  .cvm {
    display: flex;
    gap: 16px;
    align-items: stretch;
  }

  /* header 工具条：窄屏只留图标，避免挤掉标题 */
  .cvm-tool__label {
    margin-left: 5px;
  }

  /* ------------------------------ 左栏：版本列表 ------------------------------ */

  .cvm__side {
    display: flex;
    flex: 0 0 300px;
    flex-direction: column;
    min-width: 0;
    padding-right: 14px;
    border-right: 1px solid var(--g-row-sep);
  }

  .cvm__side-head {
    margin-bottom: 8px;
    font-size: 11.5px;
    line-height: 1.5;
    color: var(--g-text-mute);
  }

  .cvm__list {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-height: 0;
    max-height: 52vh;
    overflow-y: auto;
  }

  .cvm__row {
    display: flex;
    flex-direction: column;
    gap: 3px;
    width: 100%;
    padding: 7px 10px;
    font: inherit;
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    transition: background 0.16s ease, border-color 0.16s ease;

    &:hover {
      background: var(--g-hover);
    }

    &:focus-visible {
      outline: 2px solid var(--g-blue);
      outline-offset: 1px;
    }

    &.is-active {
      background: var(--g-hover);
      border-color: var(--g-card-border);
    }
  }

  .cvm__row-time {
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: 12px;
    line-height: 1.4;
    color: var(--g-text);
    font-variant-numeric: tabular-nums;
  }

  .cvm__row-meta {
    display: flex;
    gap: 8px;
    align-items: baseline;
    min-width: 0;
    font-size: 11px;
    color: var(--g-text-mute);

    em {
      flex-shrink: 0;
      font-family: ui-monospace, Menlo, Consolas, monospace;
      font-style: normal;
      font-variant-numeric: tabular-nums;
    }
  }

  .cvm__row-target {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  /* ------------------------------ 右栏：对比 ------------------------------ */

  .cvm__main {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  .cvm__stat {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: baseline;
    font-size: 11.5px;
    color: var(--g-text-sub);
    font-variant-numeric: tabular-nums;

    .is-add {
      font-weight: 600;
      color: var(--g-green);
    }

    .is-del {
      font-weight: 600;
      color: var(--g-rose);
    }
  }

  .cvm__dot {
    color: var(--g-text-mute);
  }

  .cvm__stat-file {
    margin-left: auto;
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: 10.5px;
    color: var(--g-text-mute);
  }

  .cvm__note {
    padding: 7px 10px;
    font-size: 11.5px;
    line-height: 1.5;
    color: var(--g-text-sub);
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 8px;
  }

  .cvm__diff {
    max-height: 52vh;
    padding: 6px 0;
    overflow: auto;
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: 12px;
    line-height: 1.6;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 10px;
  }

  .cvm__line {
    display: flex;
    gap: 8px;
    padding: 0 10px 0 7px;
    color: var(--g-text-sub);
    border-left: 3px solid transparent;

    &.is-add {
      color: var(--g-text);
      background: color-mix(in srgb, var(--g-green) 14%, transparent);
      border-left-color: var(--g-green);
    }

    &.is-del {
      color: var(--g-text);
      background: color-mix(in srgb, var(--g-rose) 14%, transparent);
      border-left-color: var(--g-rose);
    }
  }

  .cvm__sign {
    flex: 0 0 7px;
    color: var(--g-text-mute);
    user-select: none;
  }

  .cvm__line.is-add .cvm__sign {
    color: var(--g-green);
  }

  .cvm__line.is-del .cvm__sign {
    color: var(--g-rose);
  }

  .cvm__code {
    flex: 1;
    min-width: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* ------------------------------ 空态 ------------------------------ */

  .cvm__empty {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4px;
    align-items: center;
    justify-content: center;
    padding: 40px 12px;
    font-size: 12.5px;
    line-height: 1.6;
    color: var(--g-text-mute);
    text-align: center;
  }

  .cvm__empty-sub {
    font-size: 11px;
    opacity: 0.75;
  }

  .cvm__file {
    display: none;
  }

  /* ------------------------------ 窄屏：上下堆叠 ------------------------------ */

  @media (max-width: 900px) {
    .cvm-tool__label {
      display: none;
    }

    .cvm {
      flex-direction: column;
      gap: 12px;
    }

    .cvm__side {
      flex: 0 0 auto;
      padding-right: 0;
      padding-bottom: 10px;
      border-right: none;
      border-bottom: 1px solid var(--g-row-sep);
    }

    .cvm__list {
      max-height: 30vh;
    }

    .cvm__diff {
      max-height: 40vh;
    }
  }
</style>
