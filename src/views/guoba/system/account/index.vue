<template>
  <PageWrapper title="">
    <div class="db g-page">
      <!-- 页头 -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">MIYOUSHE ACCOUNTS</div>
          <div class="db-hero__title">米游社账号</div>
          <div class="db-hero__desc">
            CK / Stoken 状态、逾期监控与 UID 绑定关系
            <span v-if="demoMode" class="db-hero__time">· 演示数据（后端未接入）</span>
          </div>
        </div>
        <div class="db-hero__side">
          <Button @click="openBin">删除记录</Button>
          <Button :loading="loading" @click="loadAll">刷新数据</Button>
        </div>
      </section>

      <!-- 概览指标 -->
      <section class="db-kpi">
        <div v-for="item in statCards" :key="item.key" class="db-kpi__card">
          <div
            class="db-kpi__icon"
            :style="{ background: `linear-gradient(135deg, ${item.color}, ${item.color2})` }"
          >
            <Icon :icon="item.icon" :size="19" />
          </div>
          <div class="db-kpi__body">
            <div class="db-kpi__label">{{ item.title }}</div>
            <div class="db-kpi__value">{{ item.display }}</div>
            <div class="db-kpi__foot">{{ item.sub }}</div>
          </div>
        </div>
      </section>

      <div class="g-card">
        <div class="gm-panel__head">
          <div class="gm-panel__title">
            <i><Icon icon="ant-design:idcard-outlined" :size="13" /></i>
            账号列表
            <span class="gm-panel__extra" style="margin-left: 8px">共 {{ pager.total ?? list.length }} 个</span>
          </div>
          <div class="toolbar">
            <Input
              v-model:value="query.q"
              class="w-240"
              placeholder="搜索 ltuid / 账号标识"
              allow-clear
              @press-enter="handleSearch"
            />
            <Select
              v-model:value="query.ckStatus"
              class="w-140"
              :options="statusOpts"
              placeholder="CK 状态"
              allow-clear
            />
            <Select v-model:value="query.game" class="w-140" :options="gameOpts" placeholder="游戏" allow-clear />
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
            <span class="muted">已选 {{ selected.length }} 项</span>
            <Button :loading="verifying" :disabled="!selected.length" @click="handleVerify(selected)">
              批量校验
            </Button>
            <Button danger :disabled="!selected.length" @click="openDelete(selected)">批量删除</Button>
            <Button danger @click="openDeleteExpired">清理失效</Button>
            <Button :loading="loading" @click="loadAll">刷新</Button>
          </div>
        </div>

        <Table
          row-key="ltuid"
          size="middle"
          :columns="columns"
          :data-source="list"
          :loading="loading"
          :pagination="pagination"
          :row-selection="{ selectedRowKeys: selected, onChange: onSelectChange }"
          :scroll="{ x: 1180 }"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'ltuid'">
              <div class="mono strong">{{ record.ltuid }}</div>
              <div class="muted fs-12">{{ record.accountType }} · {{ record.ckLen }} 字符</div>
            </template>

            <template v-else-if="column.key === 'bindIds'">
              <div v-if="record.bindIds && record.bindIds.length" class="bind-cell">
                <span
                  v-for="(id, i) in record.bindIds.slice(0, 2)"
                  :key="id"
                  class="bind-chip"
                  :title="id"
                >
                  {{ record.bindNames?.[i] || maskId(id) }}
                </span>
                <span v-if="record.bindIds.length > 2" class="bind-more">
                  +{{ record.bindIds.length - 2 }}
                </span>
              </div>
              <span v-else class="muted">未绑定</span>
            </template>

            <template v-else-if="column.key === 'ckMask'">
              <Tooltip :title="record.hasDeviceFp ? '已存 device_fp' : '缺少 device_fp，部分接口可能失败'">
                <span class="mono fs-12">{{ record.ckMask }}</span>
              </Tooltip>
            </template>

            <template v-else-if="column.key === 'uids'">
              <template v-if="hasUids(record)">
                <Tag v-for="g in uidTags(record)" :key="g.key" :color="g.color">{{ g.text }}</Tag>
              </template>
              <span v-else class="muted">无</span>
            </template>

            <template v-else-if="column.key === 'ckStatus'">
              <Tag :color="statusOf(record.ckStatus).color">{{ statusOf(record.ckStatus).text }}</Tag>
            </template>

            <template v-else-if="column.key === 'checkedAt'">
              <span :class="record.checkedAt ? 'fs-12' : 'muted'">{{ record.checkedAt || '—' }}</span>
            </template>

            <template v-else-if="column.key === 'action'">
              <Button type="link" size="small" :loading="verifying" @click="handleVerify([record.ltuid])">
                校验
              </Button>
              <Button type="link" size="small" @click="openDetail(record)">详情</Button>
              <Button type="link" size="small" @click="openEdit(record)">编辑</Button>
              <Button type="link" size="small" danger @click="openDelete([record.ltuid])">删除</Button>
            </template>
          </template>
        </Table>
      </div>
    </div>

    <Drawer :visible="drawer.visible" title="账号详情" width="520" @close="drawer.visible = false">
      <template v-if="drawer.record">
        <Descriptions :column="1" size="small" bordered>
          <Descriptions.Item label="ltuid">{{ drawer.record.ltuid }}</Descriptions.Item>
          <Descriptions.Item label="账号类型">{{ drawer.record.accountType }}</Descriptions.Item>
          <Descriptions.Item label="CK（脱敏）">
            <span class="mono fs-12">{{ drawer.record.ckMask }}</span>
          </Descriptions.Item>
          <Descriptions.Item label="CK 状态">
            <Tag :color="statusOf(drawer.record.ckStatus).color">
              {{ statusOf(drawer.record.ckStatus).text }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="device_fp">
            {{ drawer.record.hasDeviceFp ? '已存在' : '缺失' }}
          </Descriptions.Item>
          <Descriptions.Item label="最后校验">{{ drawer.record.checkedAt || '—' }}</Descriptions.Item>
          <Descriptions.Item label="数据更新时间">{{ drawer.record.updatedAt || '—' }}</Descriptions.Item>
        </Descriptions>

        <div class="drawer-block">
          <div class="block-title">绑定的 UID</div>
          <template v-if="hasUids(drawer.record)">
            <div v-for="g in uidTags(drawer.record)" :key="g.key" class="uid-line">
              <Tag :color="g.color">{{ g.name }}</Tag>
              <span class="mono fs-12">{{ (drawer.record.uids[g.key] || []).join('、') }}</span>
            </div>
          </template>
          <span v-else class="muted">该账号暂无绑定 UID</span>
        </div>

        <div class="drawer-block">
          <div class="block-title">绑定的 Bot 用户</div>
          <template v-if="drawer.record.bindIds && drawer.record.bindIds.length">
            <div class="bind-cell">
              <span
                v-for="(id, i) in drawer.record.bindIds"
                :key="id"
                class="bind-chip"
                style="max-width: 180px"
                :title="id"
              >
                {{ drawer.record.bindNames?.[i] || id }}
              </span>
            </div>
          </template>
          <span v-else class="muted">暂无绑定</span>
        </div>

        <div class="drawer-actions">
          <Button @click="openEdit(drawer.record)">编辑 CK / UID</Button>
          <Button danger @click="openDelete([drawer.record.ltuid])">删除该账号</Button>
        </div>
      </template>
    </Drawer>

    <!-- 编辑账号 -->
    <GFormModal
      v-model:visible="editModal.visible"
      title="编辑账号"
      :schema="editModal.schema"
      :values="editModal.values"
      :loading="editModal.loading"
      ok-text="保存"
      :width="720"
      @ok="submitEdit"
    />

    <!-- 删除确认 -->
    <GConfirmModal
      v-model:visible="deleteModal.visible"
      title="删除账号"
      :content="deleteModal.content"
      :hint="deleteModal.hint"
      danger
      :loading="deleteModal.loading"
      ok-text="确认删除"
      @ok="submitDelete"
    />

    <!-- 清理失效账号 -->
    <GConfirmModal
      v-model:visible="expiredModal.visible"
      title="清理全部失效账号"
      :content="expiredModal.content"
      hint="只会删除「CK 已失效」的账号；删除前会自动备份到后台库，可在「删除记录」里恢复"
      danger
      :loading="expiredModal.loading"
      ok-text="确认清理"
      @ok="submitDeleteExpired"
    />

    <!-- 删除记录 / 恢复 -->
    <Drawer :visible="binDrawer.visible" title="删除记录（可恢复）" width="560" @close="binDrawer.visible = false">
      <div class="bin-tip">删除账号前会把整行备份到后台库；这里是最近 100 条记录。</div>
      <Table
        row-key="id"
        size="small"
        :columns="binColumns"
        :data-source="binList"
        :loading="binDrawer.loading"
        :pagination="{ pageSize: 10, size: 'small' }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <Button type="link" size="small" :loading="binDrawer.restoring" @click="doRestore(record)">恢复</Button>
          </template>
        </template>
      </Table>
    </Drawer>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, unref } from 'vue';
  import {
    Button,
    Descriptions,
    Drawer,
    Input,
    Select,
    Table,
    Tag,
    Tooltip,
    message,
  } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import GConfirmModal from '../_shared/dialog/GConfirmModal.vue';
  import GFormModal from '../_shared/dialog/GFormModal.vue';
  import { Icon } from '/@/components/Icon';
  import { useRootSetting } from '/@/hooks/setting/useRootSetting';
  import { ThemeEnum } from '/@/enums/appEnum';
  import type { AccountRow, AccountQuery, CkStatus, OverviewResult } from './api';
  import { adminApi } from './api';
  import { GAME_MAP, GAME_OPTIONS, MOCK_ACCOUNTS, MOCK_OVERVIEW, STATUS_MAP, STATUS_OPTIONS } from './data';
  import { kpiPalette } from '../_shared/stats';

  defineOptions({ name: 'Account' });

  const { getDarkMode } = useRootSetting();
  const isDark = computed(() => unref(getDarkMode) === ThemeEnum.DARK);

  const loading = ref(false);
  const verifying = ref(false);
  const demoMode = ref(false);
  const list = ref<AccountRow[]>([]);
  const selected = ref<number[]>([]);
  const overview = ref<OverviewResult>(MOCK_OVERVIEW);

  const query = reactive<AccountQuery>({ q: '', ckStatus: '', game: '' });
  const pager = reactive({ page: 1, size: 20, total: 0 });

  const statusOpts = STATUS_OPTIONS;
  const gameOpts = GAME_OPTIONS;

  const columns = [
    { title: 'ltuid', dataIndex: 'ltuid', key: 'ltuid', width: 150 },
    { title: '绑定标识', dataIndex: 'bindIds', key: 'bindIds', width: 220 },
    { title: 'Cookie', dataIndex: 'ckMask', key: 'ckMask', width: 230 },
    { title: '游戏 UID', dataIndex: 'uids', key: 'uids' },
    { title: '状态', dataIndex: 'ckStatus', key: 'ckStatus', width: 110 },
    { title: '最后校验', dataIndex: 'checkedAt', key: 'checkedAt', width: 170 },
    { title: '操作', key: 'action', width: 200, fixed: 'right' as const },
  ];

  const pagination = computed(() => ({
    current: pager.page,
    pageSize: pager.size,
    total: pager.total,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (total: number) => `共 ${total} 条`,
  }));

  const statCards = computed(() => {
    const p = kpiPalette(isDark.value);
    return [
      {
        key: 'total',
        title: '账号总数',
        icon: 'ant-design:user-outlined',
        display: String(overview.value.accounts.total),
        sub: `绑定用户 ${overview.value.users.bound} / ${overview.value.users.total}`,
        color: p.blue[0],
        color2: p.blue[1],
      },
      {
        key: 'ok',
        title: '有效 CK',
        icon: 'ant-design:check-circle-outlined',
        display: String(overview.value.accounts.ckOk),
        sub: `未校验 ${overview.value.accounts.unknown} 个`,
        color: p.green[0],
        color2: p.green[1],
      },
      {
        key: 'expired',
        title: '已失效',
        icon: 'ant-design:warning-outlined',
        display: String(overview.value.accounts.expired),
        sub: '需重新抓取 CK',
        color: p.rose[0],
        color2: p.rose[1],
      },
      {
        key: 'uids',
        title: '绑定 UID',
        icon: 'ant-design:trophy-outlined',
        display: String(overview.value.uids.total),
        sub: '覆盖 6 款游戏',
        color: p.violet[0],
        color2: p.violet[1],
      },
    ];
  });

  const drawer = reactive<{ visible: boolean; record: AccountRow | null }>({
    visible: false,
    record: null,
  });

  function statusOf(s: CkStatus) {
    return STATUS_MAP[s] ?? STATUS_MAP.unknown;
  }

  function maskId(id: string) {
    if (!id) return '';
    if (id.length <= 10) return id;
    return `${id.slice(0, 8)}****${id.slice(-2)}`;
  }

  function hasUids(row: AccountRow) {
    return Object.values(row.uids || {}).some((arr) => Array.isArray(arr) && arr.length);
  }

  function uidTags(row: AccountRow) {
    return Object.entries(GAME_MAP)
      .filter(([key]) => (row.uids?.[key] || []).length)
      .map(([key, meta]) => ({
        key,
        name: meta.name,
        color: meta.color,
        text: `${meta.short} ${row.uids[key].length}`,
      }));
  }

  function onSelectChange(keys: number[]) {
    selected.value = keys;
  }

  function openDetail(record: AccountRow) {
    drawer.record = record;
    drawer.visible = true;
    adminApi
      .getAccount(record.ltuid)
      .then((res) => {
        if (res && res.ltuid) drawer.record = res;
      })
      .catch(() => void 0);
  }

  /** 演示数据兜底：按当前筛选条件做本地过滤 + 分页 */
  function applyMock() {
    demoMode.value = true;
    const q = (query.q || '').toLowerCase();
    let rows = MOCK_ACCOUNTS.filter((r) => {
      if (query.ckStatus && r.ckStatus !== query.ckStatus) return false;
      if (query.game && !(r.uids?.[query.game as string] || []).length) return false;
      if (!q) return true;
      return String(r.ltuid).includes(q) || r.bindIds.some((id) => id.toLowerCase().includes(q));
    });
    pager.total = rows.length;
    const start = (pager.page - 1) * pager.size;
    rows = rows.slice(start, start + pager.size);
    list.value = rows;
  }

  async function loadData() {
    loading.value = true;
    try {
      const res = await adminApi.getAccounts({
        page: pager.page,
        size: pager.size,
        q: query.q || undefined,
        ckStatus: (query.ckStatus || undefined) as CkStatus | undefined,
        game: query.game || undefined,
      });
      list.value = res?.list ?? [];
      pager.total = res?.total ?? 0;
      demoMode.value = false;
    } catch {
      applyMock();
    } finally {
      loading.value = false;
    }
  }

  async function loadOverview() {
    try {
      overview.value = await adminApi.getOverview();
    } catch {
      overview.value = MOCK_OVERVIEW;
      demoMode.value = true;
    }
  }

  function handleSearch() {
    pager.page = 1;
    selected.value = [];
    loadData();
  }

  function handleReset() {
    query.q = '';
    query.ckStatus = '';
    query.game = '';
    handleSearch();
  }

  function handleTableChange(pag: any) {
    pager.page = pag?.current ?? 1;
    pager.size = pag?.pageSize ?? 20;
    loadData();
  }

  async function handleVerify(ltuids: number[]) {
    if (!ltuids.length) return;
    if (demoMode.value) {
      message.info('演示模式：后端接口未接入，不会执行真实校验');
      return;
    }
    verifying.value = true;
    try {
      const res = await adminApi.verifyAccounts(ltuids);
      message.success(`校验完成：有效 ${res.ok} / 失效 ${res.expired}`);
      await Promise.all([loadData(), loadOverview()]);
    } catch {
      message.error('校验失败，请检查后端服务');
    } finally {
      verifying.value = false;
    }
  }

  function loadAll() {
    loadOverview();
    loadData();
  }

  /* ------------------------------ 编辑 ------------------------------ */

  const editModal = reactive({
    visible: false,
    ltuid: 0,
    loading: false,
    values: {} as Record<string, any>,
    schema: [
      {
        field: 'ck',
        label: 'Cookie',
        type: 'textarea',
        tip: '整串 Cookie，形如 ltoken=...;ltuid=...;cookie_token=...;account_id=...;',
      },
      { field: 'device', label: 'device', type: 'input', tip: '设备 ID，可留空' },
      { field: 'device_fp', label: 'device_fp', type: 'textarea', tip: '设备指纹 JSON，可留空' },
      {
        field: 'uids',
        label: '游戏 UID',
        type: 'textarea',
        tip: 'JSON，形如 {"gs":["123"],"sr":["456"]}；只保留数组值',
      },
    ],
  });

  function openEdit(row: any) {
    if (!row) return;
    editModal.ltuid = row.ltuid;
    editModal.values = {
      ck: row.ckMask?.includes('****') ? '' : '',
      device: '',
      device_fp: '',
      uids: JSON.stringify(row.uids || {}, null, 2),
    };
    editModal.visible = true;
  }

  async function submitEdit(values: Record<string, any>) {
    const patch: Record<string, any> = {};
    if (values.ck) patch.ck = String(values.ck).trim();
    if (values.device) patch.device = String(values.device).trim();
    if (values.device_fp) patch.device_fp = String(values.device_fp).trim();
    if (values.uids) {
      try {
        patch.uids = JSON.parse(values.uids);
      } catch {
        message.error('游戏 UID 不是合法 JSON');
        return;
      }
    }
    if (Object.keys(patch).length === 0) {
      message.warning('没有填写任何要修改的内容');
      return;
    }
    editModal.loading = true;
    try {
      const res = await adminApi.updateAccount(editModal.ltuid, patch);
      message.success(`已更新 ${res?.changed?.join('、') || '账号'}`);
      editModal.visible = false;
      await loadAll();
    } catch (e: any) {
      message.error(e?.message || '保存失败');
    } finally {
      editModal.loading = false;
    }
  }

  /* ------------------------------ 删除 ------------------------------ */

  const deleteModal = reactive({
    visible: false,
    loading: false,
    ltuids: [] as number[],
    content: '',
    hint: '',
  });

  function openDelete(ltuids: number[]) {
    const ids = (ltuids || []).filter(Boolean);
    if (!ids.length) return;
    deleteModal.ltuids = ids;
    deleteModal.content =
      ids.length === 1
        ? `确定删除账号 ${ids[0]} 吗？将从 Bot 主库移除该账号及其 CK、UID 绑定关系。`
        : `确定删除选中的 ${ids.length} 个账号吗？将从 Bot 主库移除这些账号及其 CK、UID 绑定关系。`;
    deleteModal.hint = '删除前会自动备份到后台库，可在「删除记录」里恢复；Bot 侧绑定关系也会同步清理。';
    deleteModal.visible = true;
  }

  async function submitDelete() {
    deleteModal.loading = true;
    try {
      const res = await adminApi.deleteAccounts(deleteModal.ltuids);
      if (res?.failed?.length) {
        message.warning(`删除完成 ${res.deleted} 个，失败 ${res.failed.length} 个：${res.failed[0].error}`);
      } else {
        message.success(`已删除 ${res?.deleted ?? 0} 个账号，备份已保存`);
      }
      deleteModal.visible = false;
      selected.value = [];
      drawer.visible = false;
      await loadAll();
    } catch (e: any) {
      message.error(e?.message || '删除失败');
    } finally {
      deleteModal.loading = false;
    }
  }

  /* ------------------------------ 清理失效 ------------------------------ */

  const expiredModal = reactive({ visible: false, loading: false, content: '' });

  function openDeleteExpired() {
    const n = overview.value.accounts.expired;
    expiredModal.content = n
      ? `当前有 ${n} 个账号 CK 已失效，确认全部移除吗？`
      : '当前没有标记为「CK 失效」的账号。仍可执行，但不会有任何账号被删除。';
    expiredModal.visible = true;
  }

  async function submitDeleteExpired() {
    expiredModal.loading = true;
    try {
      const res = await adminApi.deleteExpired();
      message.success(`已清理 ${res?.deleted ?? 0} 个失效账号（扫描 ${res?.scanned ?? 0} 个）`);
      expiredModal.visible = false;
      selected.value = [];
      await loadAll();
    } catch (e: any) {
      message.error(e?.message || '清理失败');
    } finally {
      expiredModal.loading = false;
    }
  }

  /* ------------------------------ 删除记录 / 恢复 ------------------------------ */

  const binDrawer = reactive({ visible: false, loading: false, restoring: false });
  const binList = ref<any[]>([]);
  const binColumns = [
    { title: '备份 ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'ltuid', dataIndex: 'ltuid', key: 'ltuid', width: 110 },
    { title: '操作人', dataIndex: 'actor', key: 'actor', width: 100 },
    { title: '删除时间', dataIndex: 'deleted_at', key: 'deleted_at' },
    { title: '操作', key: 'action', width: 70 },
  ];

  async function openBin() {
    binDrawer.visible = true;
    binDrawer.loading = true;
    try {
      const res = await adminApi.getDeleted(100);
      binList.value = (res?.list ?? []).map((x) => ({ ...x, deleted_at: (x.deleted_at || '').replace('T', ' ').slice(0, 19) }));
    } catch {
      binList.value = [];
    } finally {
      binDrawer.loading = false;
    }
  }

  async function doRestore(row: any) {
    binDrawer.restoring = true;
    try {
      await adminApi.restoreAccount(row.id);
      message.success(`账号 ${row.ltuid} 已恢复`);
      await openBin();
      await loadAll();
    } catch (e: any) {
      message.error(e?.message || '恢复失败');
    } finally {
      binDrawer.restoring = false;
    }
  }

  onMounted(loadAll);
</script>

<style scoped lang="less">

  .toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .flex-1 {
    flex: 1;
  }

  .w-240 {
    width: 240px;
  }

  .w-140 {
    width: 140px;
  }

  .mono {
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  }

  .strong {
    font-weight: 600;
  }

  .fs-12 {
    font-size: 12px;
  }

  .muted {
    opacity: 0.5;
    font-size: 12px;
  }

  .drawer-block {
    margin-top: 20px;
  }

  .drawer-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding-top: 16px;
    margin-top: 8px;
    border-top: 1px dashed var(--g-card-border);
  }

  .bin-tip {
    padding: 10px 12px;
    margin-bottom: 12px;
    font-size: 12.5px;
    color: var(--g-text-sub);
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 10px;
  }

  .block-title {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .uid-line {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .bind-cell {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    align-items: center;
  }

  .bind-chip {
    display: inline-flex;
    align-items: center;
    max-width: 110px;
    padding: 1px 7px;
    overflow: hidden;
    font-size: 11.5px;
    color: var(--g-text-sub);
    white-space: nowrap;
    text-overflow: ellipsis;
    background: var(--g-chip-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 5px;
  }

  .bind-more {
    font-size: 11px;
    color: var(--g-text-mute);
  }
</style>
