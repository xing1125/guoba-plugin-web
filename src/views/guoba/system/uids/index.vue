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
          <div
            class="db-kpi__icon"
            :style="{ background: `linear-gradient(135deg, ${toneOf(i)[0]}, ${toneOf(i)[1]})` }"
          >
            <Icon :icon="g.icon || 'ant-design:trophy-outlined'" :size="19" />
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
            <Input
              v-model:value="q"
              class="w-240"
              placeholder="搜索 UID / ltuid"
              allow-clear
              @press-enter="handleSearch"
            />
            <Button type="primary" @click="handleSearch">查询</Button>
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
          :scroll="{ x: 860 }"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'uid'">
              <span class="mono strong">{{ record.uid }}</span>
            </template>

            <template v-else-if="column.key === 'game'">
              <Tag :color="GAME_TABS.find((g) => g.key === record.game)?.color">
                {{ gameName(record.game) }}
              </Tag>
            </template>

            <template v-else-if="column.key === 'ltuid'">
              <span class="mono">{{ record.ltuid }}</span>
            </template>

            <template v-else-if="column.key === 'bindIds'">
              <template v-if="record.bindIds && record.bindIds.length">
                <Tag v-for="id in record.bindIds" :key="id" class="mono">{{ maskId(id) }}</Tag>
              </template>
              <span v-else class="muted">未绑定用户</span>
            </template>

            <template v-else-if="column.key === 'action'">
              <Button type="link" size="small" danger @click="openUnbind(record)">解绑</Button>
            </template>
          </template>
        </Table>

        <div class="footnote">
          解绑只会移除该账号（ltuid）下的这一个 UID，不影响其它账号；操作会写入后台审计日志。
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
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, unref } from 'vue';
  import { Button, Input, Table, Tag, message } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import { Icon } from '/@/components/Icon';
  import { useRootSetting } from '/@/hooks/setting/useRootSetting';
  import { ThemeEnum } from '/@/enums/appEnum';
  import type { UidRow } from './api';
  import { uidApi } from './api';
  import { GAME_TABS, MOCK_UIDS } from './data';
  import { kpiPalette } from '../_shared/stats';
  import GConfirmModal from '../_shared/dialog/GConfirmModal.vue';
  import { adminApi } from '../account/api';

  defineOptions({ name: 'Uids' });

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

  const TONES = ['blue', 'cyan', 'violet', 'green', 'amber', 'rose'] as const;

  const { getDarkMode } = useRootSetting();
  const isDark = computed(() => unref(getDarkMode) === ThemeEnum.DARK);
  const palette = computed(() => kpiPalette(isDark.value));

  /** 第 i 个游戏 tab 的渐变色 */
  function toneOf(i: number) {
    return palette.value[TONES[i % TONES.length]];
  }

  const loading = ref(false);
  const demoMode = ref(false);
  const activeGame = ref('gs');
  const q = ref('');
  const list = ref<UidRow[]>([]);
  const pager = reactive({ page: 1, size: 20, total: 0 });
  const gameTotals = reactive<Record<string, number>>({});

  const columns = [
    { title: 'UID', dataIndex: 'uid', key: 'uid', width: 160 },
    { title: '游戏', dataIndex: 'game', key: 'game', width: 120 },
    { title: '归属 ltuid', dataIndex: 'ltuid', key: 'ltuid', width: 150 },
    { title: '绑定用户', dataIndex: 'bindIds', key: 'bindIds' },
    { title: '操作', key: 'action', width: 100, fixed: 'right' as const },
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
</style>
