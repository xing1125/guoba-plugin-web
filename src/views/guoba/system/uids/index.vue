<template>
  <PageWrapper title="">
    <div class="db g-page">
      <!-- 页头 -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">GAME UID</div>
          <div class="db-hero__title">游戏 UID</div>
          <div class="db-hero__desc">
            按游戏维度查看 UID 归属，一个 UID 仅归属一个 ltuid
            <span v-if="demoMode" class="db-hero__time">· 演示数据（后端未接入）</span>
          </div>
        </div>
        <div class="db-hero__side">
          <Button :loading="loading" @click="loadData">刷新数据</Button>
        </div>
      </section>

      <!-- 各游戏 UID 分布 -->
      <section class="db-kpi db-kpi--6">
        <div
          v-for="(g, i) in GAME_TABS"
          :key="g.key"
          class="db-kpi__card is-clickable"
          :class="{ 'is-active': activeGame === g.key }"
          @click="switchGame(g.key)"
        >
          <div class="db-kpi__icon is-plain">
            <GameIcon :game="g.key" :size="26" />
          </div>
          <div class="db-kpi__body">
            <div class="db-kpi__label">{{ g.label }}</div>
            <div class="db-kpi__value">
              {{ thousands(gameTotals[g.key] ?? 0) }}<small>个</small>
            </div>
            <div class="db-kpi__foot">{{ activeGame === g.key ? '当前查看' : '点击切换' }}</div>
          </div>
        </div>
      </section>

      <div class="g-card">
        <div class="gm-panel__head">
          <div class="gm-panel__title">
            <i><Icon icon="ant-design:trophy-outlined" :size="13" /></i>
            {{ gameName(activeGame) }} UID 列表
            <span class="gm-panel__extra" style="margin-left: 8px">共 {{ pager.total ?? list.length }} 个</span>
          </div>
          <div class="toolbar">
            <Button type="primary" @click="openEdit()">添加 UID</Button>
            <GSearch v-model="q" placeholder="搜索 UID / ltuid" width="240px" @search="handleSearch" />
            <Button type="primary" ghost @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
            <Button :loading="loading" @click="loadData">刷新</Button>
          </div>
        </div>

        <Table
          row-key="uid"
          size="middle"
          :columns="columns"
          :data-source="list"
          :loading="loading"
          :pagination="pagination"
          :scroll="{ x: 820 }"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'uid'">
              <span class="mono strong">{{ record.uid }}</span>
            </template>

            <template v-else-if="column.key === 'game'">
              <span class="game-cell">
                <GameIcon :game="record.game" :size="22" />
                <span>{{ gameName(record.game) }}</span>
              </span>
            </template>

            <template v-else-if="column.key === 'ltuid'">
              <span class="mono">{{ record.ltuid }}</span>
            </template>

            <template v-else-if="column.key === 'bindIds'">
              <div v-if="record.bindIds && record.bindIds.length" class="bind-cell">
                <span
                  v-for="(id, i) in record.bindIds.slice(0, 3)"
                  :key="id"
                  class="bind-chip"
                  :title="id"
                >
                  {{ bindLabel(record, i) }}
                </span>
                <span v-if="record.bindIds.length > 3" class="bind-more">
                  +{{ record.bindIds.length - 3 }}
                </span>
              </div>
              <span v-else class="muted">未绑定用户</span>
            </template>

            <template v-else-if="column.key === 'action'">
              <Button type="link" size="small" @click="openEdit(record)">编辑</Button>
              <Button type="link" size="small" danger @click="openUnbind(record)">解绑</Button>
            </template>
          </template>
        </Table>

        <div class="footnote">
          支持手动添加 / 编辑 / 解绑：只改动该账号（ltuid）下这一个 UID，不影响其它账号；全部操作写入后台审计日志。
        </div>
      </div>
    </div>

    <GConfirmModal
      v-model:visible="unbind.visible"
      title="解绑 UID"
      :content="unbind.content"
      hint="解绑后该 UID 不再归属此账号；重新绑定需要用户重新登录米游社。"
      danger
      :loading="unbind.loading"
      ok-text="确认解绑"
      @ok="doUnbind"
    />

    <!-- 添加 / 编辑 UID -->
    <Modal
      v-model:visible="edit.visible"
      :title="edit.origin ? '编辑 UID' : '添加 UID'"
      :confirm-loading="edit.loading"
      :mask-closable="false"
      ok-text="保存"
      cancel-text="取消"
      @ok="doSave"
    >
      <div class="edit-form">
        <div class="gfm-hint">
          <Icon icon="ant-design:info-circle-outlined" :size="14" style="flex-shrink: 0; margin-top: 2px" />
          <span>
            {{ edit.origin ? `将把 ${edit.origin} 改为新 UID；` : '' }}只能为已存在的米游社账号维护 UID，保存后立即生效并写入审计日志。
          </span>
        </div>
        <GField label="归属账号 ltuid" required>
          <GSelect
            v-model="edit.ltuid"
            :options="accountOptions"
            :filter-option="filterAccount"
            :disabled="!!edit.origin"
            placeholder="选择米游社账号"
            searchable
          />
        </GField>
        <GField label="游戏" required>
          <GSelect v-model="edit.game" :options="gameOptions" :disabled="!!edit.origin" />
        </GField>
        <GField label="UID" required hint="4~20 位纯数字">
          <Input v-model:value="edit.uid" placeholder="4~20 位纯数字" allow-clear />
        </GField>
      </div>
    </Modal>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, unref } from 'vue';
  import { Button, Input, Modal, Table, Tag, message } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import { Icon } from '/@/components/Icon';
  import { useRootSetting } from '/@/hooks/setting/useRootSetting';
  import { ThemeEnum } from '/@/enums/appEnum';
  import type { UidRow } from './api';
  import { uidApi } from './api';
  import { GAME_TABS, MOCK_UIDS } from './data';
  import GameIcon from '../_shared/GameIcon.vue';
  import GConfirmModal from '../_shared/dialog/GConfirmModal.vue';
  import GSearch from '../_shared/form/GSearch.vue';
  import GSelect from '../_shared/form/GSelect.vue';
  import GField from '../_shared/form/GField.vue';
  import { adminApi } from '../account/api';

  defineOptions({ name: 'Uids' });

  /* ------------------------------ 添加 / 编辑 UID ------------------------------ */
  const gameOptions = GAME_TABS.map((g) => ({ label: g.label, value: g.key }));
  const accountOptions = ref<{ label: string; value: number }[]>([]);

  const edit = reactive({
    visible: false,
    loading: false,
    origin: '',
    ltuid: undefined as number | undefined,
    game: 'gs',
    uid: '',
  });

  function openEdit(row?: UidRow) {
    if (row) {
      edit.origin = String(row.uid);
      edit.ltuid = Number(row.ltuid);
      edit.game = String(row.game);
      edit.uid = String(row.uid);
    } else {
      edit.origin = '';
      edit.ltuid = undefined;
      edit.game = activeGame.value || 'gs';
      edit.uid = '';
      loadAccounts();
    }
    edit.visible = true;
  }

  async function loadAccounts() {
    if (accountOptions.value.length) return;
    try {
      const res = await adminApi.getAccounts({ page: 1, size: 100 });
      accountOptions.value = (res?.list || []).map((a: any) => ({
        label: `${a.ltuid}${a.accountType ? ' · ' + a.accountType : ''}`,
        value: Number(a.ltuid),
      }));
    } catch {
      /* 下拉拉不到就留空，用户仍可直接看列表里的 ltuid */
    }
  }

  function filterAccount(input: string, option: any) {
    const text = `${option?.value ?? ''} ${option?.label ?? ''}`.toLowerCase();
    return text.includes(String(input || '').toLowerCase());
  }

  async function doSave() {
    if (!edit.ltuid) {
      message.error('请选择归属账号');
      return;
    }
    const uid = edit.uid.trim();
    if (!/^\d{4,20}$/.test(uid)) {
      message.error('UID 需为 4~20 位纯数字');
      return;
    }
    edit.loading = true;
    try {
      await uidApi.upsertUid({
        ltuid: Number(edit.ltuid),
        game: edit.game,
        uid,
        origin: edit.origin || undefined,
      });
      message.success(edit.origin ? 'UID 已更新' : 'UID 已添加');
      edit.visible = false;
      activeGame.value = edit.game;
      pager.page = 1;
      await loadData();
    } catch (e: any) {
      message.error(e?.message || '保存失败');
    } finally {
      edit.loading = false;
    }
  }

  const unbind = reactive({
    visible: false,
    loading: false,
    content: '',
    row: null as UidRow | null,
  });

  function openUnbind(row: UidRow) {
    unbind.row = row;
    unbind.content = `确定把 UID ${row.uid}（${row.game}）从账号 ${row.ltuid} 上解绑吗？`;
    unbind.visible = true;
  }

  async function doUnbind() {
    if (!unbind.row) return;
    unbind.loading = true;
    try {
      await adminApi.deleteUid(Number(unbind.row.ltuid), String(unbind.row.game), String(unbind.row.uid));
      message.success('已解绑');
      unbind.visible = false;
      await loadData();
    } catch (e: any) {
      message.error(e?.message || '解绑失败');
    } finally {
      unbind.loading = false;
    }
  }

  const { getDarkMode } = useRootSetting();
  const isDark = computed(() => unref(getDarkMode) === ThemeEnum.DARK);

  const loading = ref(false);
  const demoMode = ref(false);
  const activeGame = ref('gs');
  const q = ref('');
  const list = ref<UidRow[]>([]);
  const pager = reactive({ page: 1, size: 20, total: 0 });
  const gameTotals = reactive<Record<string, number>>({});

  const columns = [
    { title: 'UID', dataIndex: 'uid', key: 'uid', width: 170 },
    { title: '游戏', key: 'game', width: 158 },
    { title: '归属账号', key: 'ltuid', width: 145 },
    { title: '绑定用户', dataIndex: 'bindIds', key: 'bindIds' },
    { title: '操作', key: 'action', width: 130, fixed: 'right' as const },
  ];

  const pagination = computed(() => ({
    current: pager.page,
    pageSize: pager.size,
    total: pager.total,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50'],
    showTotal: (total: number) => `共 ${total} 条`,
  }));

  function countOf(game: string) {
    return MOCK_UIDS.filter((u) => u.game === game).length;
  }

  function thousands(n: number | undefined) {
    return (Number(n) || 0).toLocaleString('zh-CN');
  }

  /** 拉取 6 款游戏的 UID 总量，用于顶部分布卡 */
  async function loadGameTotals() {
    await Promise.all(
      GAME_TABS.map(async (g) => {
        try {
          const res = await uidApi.getUids({ game: g.key, page: 1, size: 1 });
          gameTotals[g.key] = res?.total ?? 0;
        } catch {
          gameTotals[g.key] = countOf(g.key);
        }
      }),
    );
  }

  function switchGame(game: string) {
    if (activeGame.value === game) return;
    activeGame.value = game;
    pager.page = 1;
    q.value = '';
    loadData();
  }

  function gameName(key: string) {
    return GAME_TABS.find((g) => g.key === key)?.label ?? key;
  }

  function maskId(id: string) {
    if (!id) return '';
    if (id.length <= 10) return id;
    return `${id.slice(0, 8)}****${id.slice(-2)}`;
  }

  /** 绑定用户展示：昵称优先，取不到时回退脱敏 id */
  function bindLabel(row: UidRow, index: number) {
    const name = row.bindNames?.[index];
    if (name) return name;
    return maskId(row.bindIds?.[index] ?? '');
  }

  function applyMock() {
    demoMode.value = true;
    const kw = q.value.trim().toLowerCase();
    let rows = MOCK_UIDS.filter((u) => u.game === activeGame.value).filter((u) => {
      if (!kw) return true;
      return u.uid.includes(kw) || String(u.ltuid).includes(kw);
    });
    pager.total = rows.length;
    const start = (pager.page - 1) * pager.size;
    rows = rows.slice(start, start + pager.size);
    list.value = rows;
  }

  async function loadData() {
    loading.value = true;
    try {
      const res = await uidApi.getUids({
        game: activeGame.value,
        page: pager.page,
        size: pager.size,
        q: q.value || undefined,
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

  function handleSearch() {
    pager.page = 1;
    loadData();
  }

  function handleReset() {
    q.value = '';
    handleSearch();
  }

  function handleTableChange(pag: any) {
    pager.page = pag?.current ?? 1;
    pager.size = pag?.pageSize ?? 20;
    loadData();
  }

  onMounted(() => {
    loadGameTotals();
    loadData();
  });
</script>

<style scoped lang="less">

  .flex-1 {
    flex: 1;
  }

  .w-240 {
    width: 240px;
  }

  .mono {
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  }

  .strong {
    font-weight: 600;
  }

  .muted {
    opacity: 0.5;
    font-size: 12px;
  }

  .footnote {
    margin-top: 12px;
    font-size: 12px;
    opacity: 0.45;
  }

  /* KPI 卡图标：统一容器 + 游戏徽标 */
  .db-kpi__icon.is-plain {
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
  }

  .game-cell {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    font-size: 13px;
    color: var(--g-text);
  }

  .bind-cell {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .bind-chip {
    display: inline-flex;
    align-items: center;
    max-width: 160px;
    padding: 2px 8px;
    overflow: hidden;
    font-size: 12px;
    color: var(--g-text-sub);
    white-space: nowrap;
    text-overflow: ellipsis;
    background: var(--g-chip-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 6px;
  }

  .bind-more {
    font-size: 11.5px;
    color: var(--g-text-mute);
  }

  /* 添加 / 编辑 UID 表单 */
  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-top: 4px;
  }

  .edit-form__item {
    display: flex;
    flex-direction: column;
    gap: 6px;

    label {
      font-size: 12px;
      font-weight: 600;
      color: var(--g-text-sub);
    }
  }

</style>
