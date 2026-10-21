<template>
  <PageWrapper title="">
    <div class="ws g-page" :class="{ 'is-dark': isDark }">
      <!-- ============================ 页头 ============================ -->
      <section class="ws-hero">
        <div class="ws-hero__main">
          <div class="ws-hero__eyebrow">WORKSPACE</div>
          <div class="ws-hero__title">文件管理</div>
          <div class="ws-hero__desc">
            浏览与编辑云崽的配置和插件文件；保存自动备份，删除进回收站
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
          <Button size="small" :loading="treeLoading" @click="refreshAll">刷新</Button>
          <Button size="small" type="primary" @click="openCreate(false)">新建文件</Button>
          <Button size="small" @click="openCreate(true)">新建目录</Button>
        </div>
      </section>

      <!-- ============================ 主体 ============================ -->
      <div class="ws-body" :class="{ 'is-editing': viewMode === 'edit' }">
        <!-- 左：目录树 -->
        <aside class="ws-side">
          <div class="ws-side__tree">
            <Tree
              v-if="treeData.length"
              :tree-data="treeData"
              :expanded-keys="expandedKeys"
              :selected-keys="selectedKeys"
              block-node
              @expand="onExpand"
              @select="onTreeSelect"
            >
              <template #title="{ key, title }">
                <span class="ws-tree-item">
                  <FolderOpenOutlined v-if="key === currentDir" class="ws-tree-item__icon is-open" />
                  <FolderOutlined v-else class="ws-tree-item__icon" />
                  <span class="ws-tree-item__name">{{ title }}</span>
                </span>
              </template>
            </Tree>
            <div v-else class="ws-side__empty">{{ treeLoading ? '加载中…' : '暂无内容' }}</div>
          </div>
          <div class="ws-side__foot">
            <Button size="small" block @click="openTrash">
              <template #icon><DeleteOutlined /></template>
              回收站
            </Button>
          </div>
        </aside>

        <!-- 右：文件表格 / 编辑器 -->
        <main class="ws-main">
          <!-- 浏览态 -->
          <template v-if="viewMode === 'list'">
            <div class="ws-main__bar">
              <div class="ws-crumb">
                <span class="ws-crumb__item" @click="openDir('')">{{ currentLabel }}</span>
                <template v-for="(seg, i) in crumbSegs" :key="seg.path">
                  <span class="ws-crumb__sep">/</span>
                  <span
                    class="ws-crumb__item"
                    :class="{ 'is-last': i === crumbSegs.length - 1 }"
                    @click="openDir(seg.path)"
                  >
                    {{ seg.name }}
                  </span>
                </template>
              </div>
              <div class="ws-main__tools">
                <Input
                  v-model:value="keyword"
                  size="small"
                  allow-clear
                  placeholder="搜索当前目录…"
                  class="ws-search"
                >
                  <template #prefix><SearchOutlined /></template>
                </Input>
              </div>
            </div>
            <div class="ws-table-wrap">
              <Table
                :columns="columns"
                :data-source="filteredRows"
                :loading="tableLoading"
                :pagination="false"
                :scroll="{ x: 620 }"
                size="small"
                row-key="path"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'name'">
                    <span class="ws-file" @click="onRowNameClick(record)">
                      <component :is="iconFor(record).icon" class="ws-file__icon" :style="{ color: iconFor(record).color }" />
                      <span class="ws-file__name">{{ record.name }}</span>
                    </span>
                  </template>
                  <template v-else-if="column.key === 'type'">
                    <span class="ws-type" :class="{ 'is-dir': record.dir }">{{ typeLabel(record) }}</span>
                  </template>
                  <template v-else-if="column.key === 'size'">
                    <span class="ws-dim">{{ record.dir ? `${record.childCount ?? 0} 项` : fmtSize(record.size) }}</span>
                  </template>
                  <template v-else-if="column.key === 'mtime'">
                    <span class="ws-dim">{{ fmtTime(record.mtime) }}</span>
                  </template>
                  <template v-else-if="column.key === 'action'">
                    <span class="ws-acts">
                      <a v-if="!record.dir && record.editable" @click="openEdit(record.path)">编辑</a>
                      <a :href="downloadHref(record.path)" target="_blank" @click.stop>下载</a>
                      <Dropdown :trigger="['click']" placement="bottomRight">
                        <a class="ws-acts__more" @click.stop>更多<DownOutlined /></a>
                        <template #overlay>
                          <Menu>
                            <Menu.Item key="rename" @click="openRename(record)">
                              <EditOutlined /> 重命名
                            </Menu.Item>
                            <Menu.Item key="remove" danger @click="askRemove(record)">
                              <DeleteOutlined /> 删除
                            </Menu.Item>
                          </Menu>
                        </template>
                      </Dropdown>
                    </span>
                  </template>
                </template>
              </Table>
            </div>
          </template>

          <!-- 编辑态 -->
          <template v-else>
            <div class="ws-main__bar">
              <div class="ws-edit-head">
                <Button size="small" @click="backToList">
                  <template #icon><ArrowLeftOutlined /></template>
                  返回列表
                </Button>
                <span class="ws-edit-head__path" :title="opened?.path || ''">
                  {{ opened ? opened.path : '' }}
                  <em v-if="dirty" class="ws-edit-head__dot">未保存</em>
                </span>
              </div>
              <div class="ws-main__tools">
                <Button size="small" @click="openBackups">备份({{ backupCount }})</Button>
                <Button size="small" danger @click="askRemove(null)">删除</Button>
                <Button
                  size="small"
                  type="primary"
                  :loading="saving"
                  :disabled="!dirty"
                  @click="save"
                >
                  保存 (Ctrl+S)
                </Button>
              </div>
            </div>
            <div v-if="opened" class="ws-editor">
              <CodeEditor
                :value="draft"
                :mode="editorMode"
                :auto-format="false"
                @change="(v) => (draft = v)"
              />
            </div>
          </template>
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
        hint="不会直接删除，会先移入 temp/guoba-trash 回收站，可在左下角「回收站」查看"
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
          <span class="ws-backup-row__name">{{ fmtTime(b.time) }}</span>
          <span class="ws-backup-row__size">{{ fmtSize(b.size) }}</span>
          <Button size="small" @click="doRestore(b)">恢复</Button>
        </div>
      </Modal>

      <!-- ============================ 回收站 ============================ -->
      <Modal
        :visible="trashModal.visible"
        title="回收站（temp/guoba-trash）"
        :footer="null"
        width="640px"
        @cancel="trashModal.visible = false"
      >
        <div class="ws-trash-head">
          <span class="ws-dim">共 {{ trashModal.list.length }} 项，彻底删除后不可找回</span>
          <Button
            v-if="trashModal.list.length"
            size="small"
            danger
            :loading="trashModal.loading"
            @click="askTrashClear"
          >
            <template #icon><ClearOutlined /></template>
            清空回收站
          </Button>
        </div>
        <div v-if="!trashModal.list.length" class="ws-backup-empty">回收站是空的</div>
        <div v-for="t in trashModal.list" :key="t.name" class="ws-backup-row">
          <span class="ws-backup-row__name" :title="t.name">
            <FolderOutlined v-if="t.dir" style="color: #fbbf24; margin-right: 4px" />
            {{ t.name.slice(t.name.indexOf('_') + 1) }}
          </span>
          <span class="ws-dim ws-backup-row__time">{{ fmtTime(t.time) }}</span>
          <span class="ws-backup-row__size">{{ t.dir ? '目录' : fmtSize(t.size) }}</span>
          <Button size="small" danger :loading="trashModal.loading" @click="askTrashRemove(t)">删除</Button>
        </div>
      </Modal>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, reactive, ref, unref } from 'vue';
  import { Button, Dropdown, Input, Menu, Modal, Table, Tree, message } from 'ant-design-vue';
  import {
    ArrowLeftOutlined,
    ClearOutlined,
    DeleteOutlined,
    DownOutlined,
    EditOutlined,
    FileExcelOutlined,
    FileImageOutlined,
    FileMarkdownOutlined,
    FileOutlined,
    FilePdfOutlined,
    FileTextOutlined,
    FileZipOutlined,
    FolderOpenOutlined,
    FolderOutlined,
    SearchOutlined,
  } from '@ant-design/icons-vue';
  import { PageWrapper } from '/@/components/Page';
  import GConfirmModal from '../_shared/dialog/GConfirmModal.vue';
  import { CodeEditor } from '/@/components/CodeEditor';
  import { MODE } from '/@/components/CodeEditor/src/typing';
  import { useRootSetting } from '/@/hooks/setting/useRootSetting';
  import { ThemeEnum } from '/@/enums/appEnum';
  import type { WsBackup, WsItem, WsReadResult, WsRoot, WsTrashItem } from './api';
  import { downloadUrl, workspaceApi } from './api';

  defineOptions({ name: 'WorkspaceFiles' });

  const { getDarkMode } = useRootSetting();
  const isDark = computed(() => unref(getDarkMode) === ThemeEnum.DARK);

  interface TreeNode {
    key: string;
    title: string;
    dir: boolean;
    root?: boolean;
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

  const viewMode = ref<'list' | 'edit'>('list');
  const currentDir = ref('');
  const tableRows = ref<WsItem[]>([]);
  const tableLoading = ref(false);
  const keyword = ref('');

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
  function fmtTime(iso: string | null) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    const p = (x: number) => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  const editorMode = computed(() => {
    const ext = opened.value ? opened.value.ext : '';
    if (ext === '.json' || ext === '.jsonl' || ext === '.ndjson') return MODE.JSON;
    if (['.js', '.mjs', '.cjs', '.ts', '.vue', '.jsx', '.tsx'].includes(ext)) return MODE.JS;
    if (ext === '.html' || ext === '.htm') return MODE.HTML;
    if (ext === '.yaml' || ext === '.yml') return MODE.YAML;
    return MODE.TEXT;
  });

  const ICON_MAP: { exts: string[]; icon: any; color: string }[] = [
    { exts: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp'], icon: FileImageOutlined, color: '#10b981' },
    { exts: ['zip', 'rar', '7z', 'gz', 'tar'], icon: FileZipOutlined, color: '#f59e0b' },
    { exts: ['md', 'markdown'], icon: FileMarkdownOutlined, color: '#3b82f6' },
    { exts: ['pdf'], icon: FilePdfOutlined, color: '#ef4444' },
    { exts: ['xls', 'xlsx', 'csv'], icon: FileExcelOutlined, color: '#16a34a' },
    { exts: ['js', 'mjs', 'cjs', 'ts', 'vue', 'jsx', 'tsx', 'json', 'jsonl', 'yaml', 'yml', 'html', 'css', 'less', 'scss', 'xml', 'txt', 'log', 'sh', 'bat', 'cmd', 'conf', 'ini'], icon: FileTextOutlined, color: '#6366f1' },
  ];
  function iconFor(record: WsItem) {
    if (record.dir) return { icon: FolderOutlined, color: '#fbbf24' };
    const ext = String(record.ext || '').replace('.', '').toLowerCase();
    const hit = ICON_MAP.find((m) => m.exts.includes(ext));
    return hit ? { icon: hit.icon, color: hit.color } : { icon: FileOutlined, color: '#94a3b8' };
  }
  function typeLabel(record: WsItem) {
    if (record.dir) return '目录';
    const ext = String(record.ext || '').replace('.', '');
    return ext ? ext.toUpperCase() : '文件';
  }
  function downloadHref(path: string) {
    return downloadUrl(root.value, path);
  }
  function parentOf(p: string) {
    const i = p.lastIndexOf('/');
    return i >= 0 ? p.slice(0, i) : '';
  }

  const columns = [
    { title: '文件名', key: 'name', sorter: (a: WsItem, b: WsItem) => a.name.localeCompare(b.name, 'zh-Hans-CN') },
    { title: '类型', key: 'type', width: 90 },
    { title: '大小', key: 'size', width: 110, sorter: (a: WsItem, b: WsItem) => a.size - b.size },
    {
      title: '修改时间',
      key: 'mtime',
      width: 165,
      defaultSortOrder: 'descend' as const,
      sorter: (a: WsItem, b: WsItem) => {
        const ta = a.mtime ? new Date(a.mtime).getTime() : 0;
        const tb = b.mtime ? new Date(b.mtime).getTime() : 0;
        return ta - tb;
      },
    },
    { title: '操作', key: 'action', width: 235 },
  ];

  const filteredRows = computed(() => {
    const kw = keyword.value.trim().toLowerCase();
    if (!kw) return tableRows.value;
    return tableRows.value.filter((r) => r.name.toLowerCase().includes(kw));
  });

  const currentLabel = computed(() => {
    const r = roots.value.find((x) => x.key === root.value);
    return r ? r.label.split('(')[0].trim() : root.value;
  });
  const crumbSegs = computed(() => {
    if (!currentDir.value) return [];
    const segs = currentDir.value.split('/');
    return segs.map((name, i) => ({ name, path: segs.slice(0, i + 1).join('/') }));
  });

  /* ----------------------------- 目录树（只放目录） ----------------------------- */
  function dirNode(it: WsItem): TreeNode | null {
    if (!it.dir) return null;
    return { key: it.path, title: it.name, dir: true, isLeaf: false };
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
    viewMode.value = 'list';
    selectedKeys.value = [];
    expandedKeys.value = [];
    currentDir.value = '';
    keyword.value = '';
    await refreshAll();
  }

  async function refreshAll() {
    await reloadTree();
    await loadDir(currentDir.value);
  }

  async function reloadTree() {
    if (!root.value) return;
    const prevExpanded = expandedKeys.value.filter((k) => k !== '');
    treeLoading.value = true;
    try {
      const res = await workspaceApi.list(root.value, '');
      treeData.value = [
        {
          key: '',
          title: currentLabel.value,
          dir: true,
          root: true,
          isLeaf: false,
          loaded: true,
          children: (res.list || []).map(dirNode).filter(Boolean) as TreeNode[],
        },
      ];
      expandedKeys.value = [''];
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
    node.children = (res.list || []).map(dirNode).filter(Boolean) as TreeNode[];
    node.loaded = true;
  }

  async function onExpand(keys: (string | number)[]) {
    const next = (keys as string[]) || [];
    const added = next.find((k) => !expandedKeys.value.includes(k));
    expandedKeys.value = next;
    if (added !== undefined) {
      try {
        await ensureChildren(String(added));
      } catch (e: any) {
        message.error(e?.message || '读取目录失败');
      }
    }
  }

  /** 树点目录 = 进入该目录（同时展开、加载），并让表格跟随 */
  async function onTreeSelect(keys: (string | number)[]) {
    const key = String(keys?.[0] ?? '');
    if (!key) return;
    const node = findNode(treeData.value, key);
    if (!node || !node.dir) return;
    await openDir(key);
  }

  /* ----------------------------- 目录导航 ----------------------------- */
  async function openDir(key: string) {
    // 沿路径逐层加载树节点
    const segs = key ? key.split('/') : [];
    let prefix = '';
    for (const s of segs) {
      prefix = prefix ? `${prefix}/${s}` : s;
      try {
        await ensureChildren(prefix);
      } catch {}
    }
    if (key && !expandedKeys.value.includes(key)) {
      expandedKeys.value = [...expandedKeys.value, key];
    }
    currentDir.value = key;
    selectedKeys.value = [key];
    if (viewMode.value === 'edit') {
      if (dirty.value) {
        Modal.confirm({
          title: '当前文件有未保存修改',
          content: '切换后将丢弃这些修改，是否继续？',
          onOk: () => {
            opened.value = null;
            viewMode.value = 'list';
          },
        });
        return;
      }
      opened.value = null;
      viewMode.value = 'list';
    }
    await loadDir(key);
  }

  async function loadDir(key: string) {
    tableLoading.value = true;
    try {
      const res = await workspaceApi.list(root.value, key);
      tableRows.value = res?.list || [];
    } catch (e: any) {
      message.error(e?.message || '读取目录失败');
      tableRows.value = [];
    } finally {
      tableLoading.value = false;
    }
  }

  function onRowNameClick(record: WsItem) {
    if (record.dir) {
      openDir(record.path);
    } else if (record.editable) {
      openEdit(record.path);
    } else {
      message.info('该类型不支持在线编辑，可下载查看');
    }
  }

  /* ----------------------------- 打开 / 保存 ----------------------------- */
  async function openEdit(path: string) {
    try {
      const res = await workspaceApi.read(root.value, path);
      if (opened.value && dirty.value && opened.value.path !== path) {
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
    viewMode.value = 'edit';
  }

  function backToList() {
    if (dirty.value) {
      Modal.confirm({
        title: '当前文件有未保存修改',
        content: '返回后将丢弃这些修改，是否继续？',
        onOk: () => {
          opened.value = null;
          viewMode.value = 'list';
        },
      });
      return;
    }
    opened.value = null;
    viewMode.value = 'list';
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
    target: '', // create: 父目录；rename: 原路径
  });

  function openCreate(isDir: boolean) {
    nameModal.mode = isDir ? 'create-dir' : 'create-file';
    nameModal.title = isDir ? '新建目录' : '新建文件';
    nameModal.hint = `位置：${currentDir.value || root.value}`;
    nameModal.name = '';
    nameModal.target = currentDir.value;
    nameModal.visible = true;
  }

  function openRename(record: WsItem) {
    nameModal.mode = 'rename';
    nameModal.title = '重命名';
    nameModal.hint = `原路径：${record.path}`;
    nameModal.name = record.name;
    nameModal.target = record.path;
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
          viewMode.value = 'list';
        }
        const dir = parentOf(nameModal.target);
        await refreshAfterMutate(dir);
      } else {
        const isDir = nameModal.mode === 'create-dir';
        await workspaceApi.create(root.value, nameModal.target, name, isDir);
        message.success(isDir ? '目录已创建' : '文件已创建');
        await refreshAfterMutate(nameModal.target);
        if (!isDir) {
          const childPath = nameModal.target ? `${nameModal.target}/${name}` : name;
          try {
            await openEdit(childPath);
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

  /** 变更后刷新：受影响目录 + 树（保持展开状态） */
  async function refreshAfterMutate(dir: string) {
    const target = dir || currentDir.value;
    if (target === currentDir.value) {
      await loadDir(currentDir.value);
    }
    // 若受影响目录是 currentDir 的祖先或自身，重载树以同步
    if (!currentDir.value || currentDir.value === target || currentDir.value.startsWith(target + '/')) {
      await reloadTree();
    }
  }

  const removeModal = reactive({ visible: false, loading: false, path: '' });

  function askRemove(record: WsItem | null) {
    const p = record ? record.path : opened.value?.path || '';
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
        viewMode.value = 'list';
      }
      const dir = parentOf(removeModal.path);
      if (dir === currentDir.value) {
        await loadDir(currentDir.value);
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

  /* ----------------------------- 回收站 ----------------------------- */
  const trashModal = reactive({ visible: false, loading: false, list: [] as WsTrashItem[] });

  async function openTrash() {
    trashModal.visible = true;
    await loadTrash();
  }

  async function loadTrash() {
    trashModal.loading = true;
    try {
      const res = await workspaceApi.trash();
      trashModal.list = res?.list || [];
    } catch (e: any) {
      message.error(e?.message || '读取回收站失败');
    } finally {
      trashModal.loading = false;
    }
  }

  function askTrashRemove(t: WsTrashItem) {
    Modal.confirm({
      title: '彻底删除该条目？',
      content: t.name,
      okText: '彻底删除',
      okType: 'danger',
      onOk: async () => {
        await workspaceApi.trashRemove(t.name);
        message.success('已彻底删除');
        await loadTrash();
      },
    });
  }

  function askTrashClear() {
    Modal.confirm({
      title: '清空回收站？',
      content: `共 ${trashModal.list.length} 项，彻底删除后不可找回`,
      okText: '全部删除',
      okType: 'danger',
      onOk: async () => {
        const res = await workspaceApi.trashClear();
        message.success(`已清空 ${res?.cleared ?? 0} 项`);
        await loadTrash();
      },
    });
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
    height: calc(100vh - 250px);
    min-height: 460px;
  }

  /* ----------------------------- 左侧目录树 ----------------------------- */
  .ws-side {
    width: 300px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--ws-line);
    border-radius: 12px;
    background: var(--ws-panel);
    backdrop-filter: blur(10px);
    overflow: hidden;

    &__tree {
      flex: 1;
      min-height: 0;
      overflow: auto;
      padding: 10px 6px;
    }
    &__empty {
      text-align: center;
      color: var(--ws-text-dim);
      font-size: 12px;
      padding: 24px 0;
    }
    &__foot {
      padding: 8px 10px;
      border-top: 1px solid var(--ws-line);
    }
  }

  .ws-tree-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;

    .ws-tree-item__icon {
      color: #fbbf24;
      flex-shrink: 0;

      &.is-open {
        color: var(--ws-accent);
      }
    }
    .ws-tree-item__name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  /* ----------------------------- 右侧主区 ----------------------------- */
  .ws-main {
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
      flex-wrap: wrap;
    }
    &__tools {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }
  }

  .ws-crumb {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    min-width: 0;
    flex-wrap: wrap;

    &__item {
      color: var(--ws-text-dim);
      cursor: pointer;

      &:hover {
        color: var(--ws-accent);
      }
      &.is-last {
        color: var(--ws-text);
        font-weight: 600;
        cursor: default;

        &:hover {
          color: var(--ws-text);
        }
      }
    }
    &__sep {
      color: var(--ws-text-dim);
      opacity: 0.5;
    }
  }

  .ws-search {
    width: 220px;
  }

  /* 窄屏：搜索框整行、工具条换行，避免横向溢出 */
  @media (max-width: 768px) {
    .ws-main__bar {
      flex-wrap: wrap;
      gap: 8px;
    }
    .ws-search {
      width: 100%;
    }

    /* 手机：三栏改为上下堆叠，目录树限高，主区占满剩余 */
    .ws-body {
      flex-direction: column;
      height: auto;
      min-height: 0;
      gap: 10px;
    }

    .ws-side {
      width: 100%;
      max-height: 176px;
    }

    .ws-side__tree {
      padding: 4px 6px;
    }

    .ws-main {
      min-height: 340px;
    }

    /* 编辑文件时目录树没有意义，让编辑器独占屏幕 */
    .ws-body.is-editing .ws-side {
      display: none;
    }

    .ws-edit-head__path {
      display: none;
    }
  }

  .ws-table-wrap {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 0 6px 6px;
  }

  .ws-file {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    min-width: 0;
    max-width: 100%;

    &:hover .ws-file__name {
      color: var(--ws-accent);
    }
    &__icon {
      font-size: 16px;
      flex-shrink: 0;
    }
    &__name {
      color: var(--ws-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .ws-type {
    font-size: 11px;
    padding: 1px 8px;
    border-radius: 999px;
    background: rgba(99, 102, 241, 0.12);
    color: #6366f1;
    font-weight: 600;

    &.is-dir {
      background: rgba(251, 191, 36, 0.16);
      color: #d97706;
    }
  }

  .ws-dim {
    color: var(--ws-text-dim);
    font-size: 12px;
    /* 表格已开 :scroll="{ x: 620 }"，单元格不需要再自己换行；
     * 否则「修改时间」会在窄列里折成两行，把行高从 36px 顶到 56px。 */
    white-space: nowrap;
  }

  .ws-acts {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    white-space: nowrap;

    a {
      font-size: 12px;
      color: var(--ws-accent);

      &.is-danger {
        color: #ef4444;
      }
    }

    &__more {
      display: inline-flex;
      gap: 2px;
      align-items: center;
      color: var(--g-text-mute) !important;

      :deep(svg) {
        width: 10px;
        height: 10px;
      }
    }
  }

  .ws-edit-head {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;

    &__path {
      font-size: 12px;
      color: var(--ws-text);
      font-family: Consolas, Monaco, monospace;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      em.ws-edit-head__dot {
        font-style: normal;
        margin-left: 8px;
        padding: 1px 8px;
        border-radius: 999px;
        font-size: 11px;
        color: #fff;
        background: #f59e0b;
      }
    }
  }

  .ws-editor {
    flex: 1;
    min-height: 0;

    :deep(.CodeMirror) {
      height: 100%;
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
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    &__time {
      flex-shrink: 0;
    }
    &__size {
      color: var(--ws-text-dim);
      width: 70px;
      text-align: right;
      flex-shrink: 0;
    }
  }

  .ws-trash-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;
  }
</style>
