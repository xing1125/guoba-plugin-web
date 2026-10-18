<template>
  <PageWrapper title="">
    <div class="ws g-page" :class="{ 'is-dark': isDark }">
      <!-- ============================ 页头 ============================ -->
      <section class="ws-hero">
        <div class="ws-hero__main">
          <div class="ws-hero__eyebrow">WORKSPACE</div>
          <div class="ws-hero__title">文件管理</div>
          <div class="ws-hero__desc">
            浏览与编辑云崽的配置和插件文件，不必再逐个开文件夹；保存自动备份，删除进回收站
          </div>
        </div>
        <div class="ws-hero__side">
          <span class="gm-seg">
            <span
              v-for="r in roots"
              :key="r.key"
              class="gm-seg__item"
              :class="{ 'is-active': root === r.key }"
              @click="switchRoot(r.key)"
            >
              {{ r.label }}
            </span>
          </span>
          <Button size="small" :loading="treeLoading" @click="reloadTree">刷新</Button>
          <Button size="small" type="primary" @click="openCreate(false)">新建文件</Button>
          <Button size="small" @click="openCreate(true)">新建目录</Button>
        </div>
      </section>

      <!-- ============================ 主体 ============================ -->
      <div class="ws-body">
        <aside class="ws-tree">
          <Tree
            v-if="treeData.length"
            :tree-data="treeData"
            :expanded-keys="expandedKeys"
            :selected-keys="selectedKeys"
            block-node
            @expand="onExpand"
            @select="onSelect"
          />
          <div v-else class="ws-tree__empty">{{ treeLoading ? '加载中…' : '暂无内容' }}</div>
        </aside>

        <main class="ws-editor">
          <div class="ws-editor__bar">
            <span class="ws-editor__path" :title="opened?.path || ''">
              {{ opened ? opened.path : '未打开文件' }}
              <em v-if="dirty" class="ws-editor__dot">未保存</em>
            </span>
            <span class="ws-editor__tools">
              <Button v-if="opened" size="small" @click="openBackups">备份({{ backupCount }})</Button>
              <Button v-if="opened" size="small" @click="openRename">重命名</Button>
              <Button v-if="opened" size="small" danger @click="askRemove">删除</Button>
              <Button
                v-if="opened"
                size="small"
                type="primary"
                :loading="saving"
                :disabled="!dirty"
                @click="save"
              >
                保存 (Ctrl+S)
              </Button>
            </span>
          </div>
          <div v-if="opened" class="ws-editor__code">
            <CodeEditor
              :value="draft"
              :mode="editorMode"
              :auto-format="false"
              @change="(v) => (draft = v)"
            />
          </div>
          <div v-else class="ws-editor__empty">
            <div class="ws-editor__empty-main">在左侧选择文件开始编辑</div>
            <div class="ws-editor__empty-sub">支持 js / json / yaml / css / html / md / txt 等文本文件（≤1MB）</div>
          </div>
        </main>
      </div>

      <!-- ============================ 新建/重命名弹窗 ============================ -->
      <Modal
        :visible="nameModal.visible"
        :title="nameModal.title"
        :confirm-loading="nameModal.loading"
        @cancel="nameModal.visible = false"
        @ok="submitName"
      >
        <div class="ws-name-row">
          <span class="ws-name-row__hint">{{ nameModal.hint }}</span>
          <Input v-model:value="nameModal.name" placeholder="输入名称" @pressEnter="submitName" />
        </div>
      </Modal>

      <!-- ============================ 删除确认 ============================ -->
      <GConfirmModal
        :visible="removeModal.visible"
        title="删除确认"
        :content="removeModal.path"
        hint="不会直接删除，会先移入 temp/guoba-trash 回收站，可手工找回"
        danger
        :loading="removeModal.loading"
        ok-text="移入回收站"
        @ok="doRemove"
        @cancel="removeModal.visible = false"
      />

      <!-- ============================ 备份列表 ============================ -->
      <Modal
        :visible="backupModal.visible"
        title="备份记录"
        :footer="null"
        @cancel="backupModal.visible = false"
      >
        <div v-if="!backupModal.list.length" class="ws-backup-empty">还没有备份（保存时自动生成）</div>
        <div v-for="b in backupModal.list" :key="b.name" class="ws-backup-row">
          <span class="ws-backup-row__name">{{ shortTime(b.time) }}</span>
          <span class="ws-backup-row__size">{{ fmtSize(b.size) }}</span>
          <Button size="small" @click="doRestore(b)">恢复</Button>
        </div>
      </Modal>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, reactive, ref, unref } from 'vue';
  import { Button, Input, Modal, Tree, message } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import GConfirmModal from '../_shared/dialog/GConfirmModal.vue';
  import { CodeEditor } from '/@/components/CodeEditor';
  import { MODE } from '/@/components/CodeEditor/src/typing';
  import { useRootSetting } from '/@/hooks/setting/useRootSetting';
  import { ThemeEnum } from '/@/enums/appEnum';
  import type { WsBackup, WsItem, WsReadResult, WsRoot } from './api';
  import { workspaceApi } from './api';

  defineOptions({ name: 'WorkspaceFiles' });

  const { getDarkMode } = useRootSetting();
  const isDark = computed(() => unref(getDarkMode) === ThemeEnum.DARK);

  interface TreeNode {
    key: string;
    title: string;
    dir: boolean;
    root?: boolean;
    editable?: boolean;
    isLeaf: boolean;
    children?: TreeNode[];
    loaded?: boolean;
  }

  /* ----------------------------- 状态 ----------------------------- */
  const roots = ref<WsRoot[]>([]);
  const root = ref('');
  const treeData = ref<TreeNode[]>([]);
  const treeLoading = ref(false);
  const expandedKeys = ref<string[]>([]);
  const selectedKeys = ref<string[]>([]);

  const opened = ref<WsReadResult | null>(null);
  const savedContent = ref('');
  const draft = ref('');
  const saving = ref(false);
  const backupCount = computed(() => opened.value?.backups ?? 0);
  const dirty = computed(() => opened.value !== null && draft.value !== savedContent.value);

  /* ----------------------------- 工具 ----------------------------- */
  function fmtSize(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
  }
  function shortTime(iso: string | null) {
    if (!iso) return '-';
    return String(iso).replace('T', ' ').slice(0, 19);
  }
  function extOf(p: string) {
    const i = p.lastIndexOf('.');
    return i >= 0 ? p.slice(i).toLowerCase() : '';
  }
  const editorMode = computed(() => {
    const ext = opened.value ? extOf(opened.value.path) : '';
    if (ext === '.json' || ext === '.jsonl' || ext === '.ndjson') return MODE.JSON;
    if (['.js', '.mjs', '.cjs', '.ts', '.vue', '.jsx', '.tsx'].includes(ext)) return MODE.JS;
    if (ext === '.html' || ext === '.htm') return MODE.HTML;
    if (ext === '.yaml' || ext === '.yml') return MODE.YAML;
    return MODE.TEXT;
  });

  /* ----------------------------- 目录树 ----------------------------- */
  function itemToNode(it: WsItem): TreeNode {
    return {
      key: it.path,
      title: it.dir ? `${it.name}/` : `${it.name}  ${fmtSize(it.size)}`,
      dir: it.dir,
      editable: it.editable,
      isLeaf: !it.dir,
    };
  }

  async function loadRoots() {
    const res = await workspaceApi.roots();
    roots.value = res?.list || [];
    if (!root.value && roots.value.length) {
      await switchRoot(roots.value[0].key);
    }
  }

  async function switchRoot(key: string) {
    if (root.value === key && treeData.value.length) return;
    root.value = key;
    opened.value = null;
    selectedKeys.value = [];
    expandedKeys.value = [];
    await reloadTree();
  }

  async function reloadTree() {
    if (!root.value) return;
    const prevExpanded = expandedKeys.value.filter((k) => k && k !== '');
    treeLoading.value = true;
    try {
      const res = await workspaceApi.list(root.value, '');
      treeData.value = [
        {
          key: '',
          title: res.label,
          dir: true,
          root: true,
          isLeaf: false,
          loaded: true,
          children: (res.list || []).map(itemToNode),
        },
      ];
      expandedKeys.value = [''];
      // 重新展开之前展开过的目录
      for (const k of prevExpanded) {
        try {
          await ensureChildren(k);
        } catch {}
      }
      expandedKeys.value = ['', ...prevExpanded];
    } finally {
      treeLoading.value = false;
    }
  }

  function findNode(list: TreeNode[], key: string): TreeNode | null {
    for (const n of list) {
      if (n.key === key) return n;
      if (n.children) {
        const hit = findNode(n.children, key);
        if (hit) return hit;
      }
    }
    return null;
  }

  async function ensureChildren(key: string) {
    const node = findNode(treeData.value, key);
    if (!node || !node.dir || node.loaded) return;
    const res = await workspaceApi.list(root.value, key);
    node.children = (res.list || []).map(itemToNode);
    node.loaded = true;
  }

  async function onExpand(keys: (string | number)[], info?: unknown) {
    const next = (keys as string[]) || [];
    // 只对「新展开」的目录懒加载子节点（不依赖事件内部结构，用 key 差集判断）
    const added = next.find((k) => !expandedKeys.value.includes(k));
    expandedKeys.value = next;
    if (added) {
      try {
        await ensureChildren(String(added));
      } catch (e: any) {
        message.error(e?.message || '读取目录失败');
      }
    }
  }

  /* ----------------------------- 打开 / 保存 ----------------------------- */
  async function onSelect(keys: (string | number)[], info?: unknown) {
    const key = String(keys?.[0] ?? '');
    if (!key) return;
    const node = findNode(treeData.value, key);
    if (!node || node.dir) return;
    if (node.editable === false) {
      message.warning('该文件类型或大小不支持在线编辑');
      return;
    }
    try {
      const res = await workspaceApi.read(root.value, key);
      if (opened.value && dirty.value && opened.value.path !== key) {
        // 切换文件前丢弃未保存提示
        Modal.confirm({
          title: '当前文件有未保存修改',
          content: '切换后将丢弃这些修改，是否继续？',
          onOk: () => applyOpened(res),
        });
        return;
      }
      applyOpened(res);
    } catch (e: any) {
      message.error(e?.message || '读取失败');
    }
  }

  function applyOpened(res: WsReadResult) {
    opened.value = res;
    savedContent.value = res.content;
    draft.value = res.content;
    selectedKeys.value = [res.path];
  }

  async function save() {
    if (!opened.value || !dirty.value) return;
    saving.value = true;
    try {
      const res = await workspaceApi.write(root.value, opened.value.path, draft.value);
      savedContent.value = draft.value;
      if (opened.value) opened.value.backups = res?.backup ? opened.value.backups + 1 : opened.value.backups;
      message.success(res?.backup ? `已保存（备份 ${res.backup}）` : '已保存');
    } catch (e: any) {
      message.error(e?.message || '保存失败');
    } finally {
      saving.value = false;
    }
  }

  /* ----------------------------- 新建 / 重命名 / 删除 ----------------------------- */
  const nameModal = reactive({
    visible: false,
    loading: false,
    mode: 'create-file' as 'create-file' | 'create-dir' | 'rename',
    title: '',
    hint: '',
    name: '',
    target: '',
  });

  /** 当前操作目录：选中目录用之，选中文件用其父目录，否则根 */
  function currentDir(): string {
    const key = selectedKeys.value[0] || '';
    if (!key) return '';
    const node = findNode(treeData.value, key);
    if (!node) return '';
    if (node.dir) return key;
    const i = key.lastIndexOf('/');
    return i >= 0 ? key.slice(0, i) : '';
  }

  function openCreate(isDir: boolean) {
    const dir = currentDir();
    nameModal.mode = isDir ? 'create-dir' : 'create-file';
    nameModal.title = isDir ? '新建目录' : '新建文件';
    nameModal.hint = `位置：${dir || root.value}`;
    nameModal.name = '';
    nameModal.target = dir;
    nameModal.visible = true;
  }

  function openRename() {
    if (!opened.value) return;
    const p = opened.value.path;
    nameModal.mode = 'rename';
    nameModal.title = '重命名';
    nameModal.hint = `原路径：${p}`;
    nameModal.name = p.slice(p.lastIndexOf('/') + 1);
    nameModal.target = p;
    nameModal.visible = true;
  }

  async function submitName() {
    const name = nameModal.name.trim();
    if (!name) return;
    nameModal.loading = true;
    try {
      if (nameModal.mode === 'rename') {
        const res = await workspaceApi.rename(root.value, nameModal.target, name);
        message.success(`已重命名为 ${res?.to || name}`);
        if (opened.value && opened.value.path === nameModal.target) {
          opened.value = null;
          savedContent.value = '';
          draft.value = '';
          try {
            applyOpened(await workspaceApi.read(root.value, res.to));
          } catch {}
        }
      } else {
        const isDir = nameModal.mode === 'create-dir';
        await workspaceApi.create(root.value, nameModal.target, name, isDir);
        message.success(isDir ? '目录已创建' : '文件已创建');
        const node = findNode(treeData.value, nameModal.target);
        if (node && node.dir && node.loaded) {
          const res = await workspaceApi.list(root.value, nameModal.target);
          node.children = (res.list || []).map(itemToNode);
        } else {
          await reloadTree();
        }
        if (!isDir && nameModal.target !== undefined) {
          const childPath = nameModal.target ? `${nameModal.target}/${name}` : name;
          try {
            applyOpened(await workspaceApi.read(root.value, childPath));
          } catch {}
        }
      }
      nameModal.visible = false;
    } catch (e: any) {
      message.error(e?.message || '操作失败');
    } finally {
      nameModal.loading = false;
    }
  }

  const removeModal = reactive({ visible: false, loading: false, path: '' });

  function askRemove() {
    const p = opened.value?.path || selectedKeys.value[0] || '';
    if (!p) return;
    removeModal.path = p;
    removeModal.visible = true;
  }

  async function doRemove() {
    removeModal.loading = true;
    try {
      const res = await workspaceApi.remove(root.value, removeModal.path);
      message.success(`已移入回收站：${res?.trash || ''}`);
      removeModal.visible = false;
      if (opened.value?.path === removeModal.path) {
        opened.value = null;
        savedContent.value = '';
        draft.value = '';
      }
      await reloadTree();
    } catch (e: any) {
      message.error(e?.message || '删除失败');
    } finally {
      removeModal.loading = false;
    }
  }

  /* ----------------------------- 备份 ----------------------------- */
  const backupModal = reactive({ visible: false, list: [] as WsBackup[] });

  async function openBackups() {
    if (!opened.value) return;
    try {
      const res = await workspaceApi.backups(root.value, opened.value.path);
      backupModal.list = res?.list || [];
      backupModal.visible = true;
    } catch (e: any) {
      message.error(e?.message || '读取备份失败');
    }
  }

  async function doRestore(b: WsBackup) {
    if (!opened.value) return;
    try {
      await workspaceApi.restore(root.value, opened.value.path, b.name);
      message.success('已恢复（恢复前自动备份了当前内容）');
      backupModal.visible = false;
      applyOpened(await workspaceApi.read(root.value, opened.value.path));
    } catch (e: any) {
      message.error(e?.message || '恢复失败');
    }
  }

  /* ----------------------------- 快捷键 / 生命周期 ----------------------------- */
  function onKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === 's') {
      if (opened.value && dirty.value) {
        e.preventDefault();
        save();
      }
    }
  }

  onMounted(async () => {
    window.addEventListener('keydown', onKeydown);
    try {
      await loadRoots();
    } catch (e: any) {
      message.error(e?.message || '加载工作区失败');
    }
  });
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<style lang="less" scoped>
  .ws {
    --ws-line: rgba(15, 23, 42, 0.1);
    --ws-panel: rgba(255, 255, 255, 0.72);
    --ws-panel-strong: #fff;
    --ws-text: #1f2937;
    --ws-text-dim: #6b7280;
    --ws-accent: #2563eb;

    &.is-dark {
      --ws-line: rgba(148, 163, 184, 0.18);
      --ws-panel: rgba(15, 23, 42, 0.55);
      --ws-panel-strong: #0f172a;
      --ws-text: #e5e7eb;
      --ws-text-dim: #94a3b8;
      --ws-accent: #60a5fa;
    }
  }

  .ws-hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    padding: 18px 20px;
    border: 1px solid var(--ws-line);
    border-radius: 14px;
    background: var(--ws-panel);
    backdrop-filter: blur(10px);

    &__eyebrow {
      font-size: 11px;
      letter-spacing: 0.28em;
      color: var(--ws-accent);
      font-weight: 600;
    }
    &__title {
      font-size: 22px;
      font-weight: 700;
      color: var(--ws-text);
      margin-top: 2px;
    }
    &__desc {
      font-size: 12px;
      color: var(--ws-text-dim);
      margin-top: 4px;
    }
    &__side {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
  }

  .gm-seg {
    display: inline-flex;
    border: 1px solid var(--ws-line);
    border-radius: 8px;
    overflow: hidden;

    &__item {
      padding: 4px 12px;
      font-size: 12px;
      cursor: pointer;
      color: var(--ws-text-dim);
      transition: all 0.2s;

      &.is-active {
        background: var(--ws-accent);
        color: #fff;
      }
    }
  }

  .ws-body {
    display: flex;
    gap: 12px;
    margin-top: 12px;
    height: calc(100vh - 260px);
    min-height: 420px;
  }

  .ws-tree {
    width: 340px;
    flex-shrink: 0;
    overflow: auto;
    padding: 10px;
    border: 1px solid var(--ws-line);
    border-radius: 12px;
    background: var(--ws-panel);
    backdrop-filter: blur(10px);

    &__empty {
      text-align: center;
      color: var(--ws-text-dim);
      font-size: 12px;
      padding: 24px 0;
    }
  }

  .ws-editor {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--ws-line);
    border-radius: 12px;
    background: var(--ws-panel);
    backdrop-filter: blur(10px);
    overflow: hidden;

    &__bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--ws-line);
    }
    &__path {
      font-size: 12px;
      color: var(--ws-text);
      font-family: Consolas, Monaco, monospace;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      em.ws-editor__dot {
        font-style: normal;
        margin-left: 8px;
        padding: 1px 8px;
        border-radius: 999px;
        font-size: 11px;
        color: #fff;
        background: #f59e0b;
      }
    }
    &__tools {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    &__code {
      flex: 1;
      min-height: 0;

      :deep(.CodeMirror) {
        height: 100%;
      }
    }
    &__empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;

      &-main {
        font-size: 14px;
        color: var(--ws-text);
      }
      &-sub {
        font-size: 12px;
        color: var(--ws-text-dim);
      }
    }
  }

  .ws-name-row {
    &__hint {
      display: block;
      font-size: 12px;
      color: var(--ws-text-dim);
      margin-bottom: 8px;
      word-break: break-all;
    }
  }

  .ws-backup-empty {
    text-align: center;
    color: var(--ws-text-dim);
    font-size: 12px;
    padding: 18px 0;
  }

  .ws-backup-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 2px;
    border-bottom: 1px dashed var(--ws-line);
    font-size: 12px;

    &:last-child {
      border-bottom: none;
    }
    &__name {
      color: var(--ws-text);
      flex: 1;
    }
    &__size {
      color: var(--ws-text-dim);
    }
  }
</style>
