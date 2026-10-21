<template>
  <PageWrapper title="">
    <div class="db g-page">
      <!-- ============================ 页头 ============================ -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">GROUP POWER RANK</div>
          <div class="db-hero__title">群战力榜</div>
          <div class="db-hero__desc">
            miao-plugin 记录的群内角色伤害 / 评分排行 · 只读展示，不改动插件数据
            <span v-if="groups.scannedAt" class="db-hero__time">
              · 扫描于 {{ fmtTimeShort(groups.scannedAt) }}
            </span>
          </div>
        </div>
        <div class="db-hero__side">
          <GSegmented
            v-if="typeOptions.length"
            :model-value="query.type"
            :options="typeOptions"
            size="sm"
            label="榜单类型"
            @change="onTypeChange"
          />
          <Button size="small" :loading="scanning" @click="scan">
            <Icon :icon="$gm('redo')" :size="13" style="margin-right: 4px" />
            重新扫描
          </Button>
          <Button size="small" :loading="loadingBoard" :disabled="!query.gid" @click="loadBoard()">
            <Icon :icon="$gm('refresh')" :size="13" style="margin-right: 4px" />
            刷新榜单
          </Button>
        </div>
      </section>

      <!-- ============================ 指标卡 ============================ -->
      <section class="db-kpi">
        <template v-if="booting">
          <div v-for="i in 4" :key="i" class="gm-skeleton" style="height: 108px" />
        </template>
        <template v-else>
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
        </template>
      </section>

      <!-- ============================ 群列表 + 榜单 ============================ -->
      <section class="db-grid db-grid--5-7 rk-grid">
        <!-- 左：有榜单的群 -->
        <div class="g-card rk-panel">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('users')" :size="13" /></i>
              有榜单的群
              <span class="gm-panel__extra" style="margin-left: 8px">{{ filteredGroups.length }} 个</span>
            </div>
          </div>

          <div v-if="groups.groups.length > 1" class="rk-search">
            <GSearch v-model="groupKeyword" size="small" width="100%" placeholder="搜索群名 / 群号" @search="noop" />
          </div>

          <div v-if="booting" class="rk-groups">
            <div v-for="i in 6" :key="i" class="g-skeleton g-skeleton--text" style="margin-bottom: 8px" />
          </div>
          <div v-else-if="filteredGroups.length" class="rk-groups">
            <button
              v-for="g in filteredGroups"
              :key="g.gid"
              type="button"
              class="rk-group"
              :class="{ 'is-active': g.gid === query.gid }"
              @click="pickGroup(g)"
            >
              <span class="rk-group__body">
                <span class="rk-group__name">{{ g.name || '未命名群' }}</span>
                <span class="rk-group__meta">{{ g.gid }} · {{ g.charCount }} 个角色</span>
              </span>
              <span class="rk-group__num">{{ g.total }}</span>
            </button>
          </div>
          <GEmpty
            v-else
            :title="groupKeyword.trim() ? '没有匹配的群' : '还没有群产生排行数据'"
            :desc="
              groupKeyword.trim()
                ? ''
                : '在群里用一次 #伤害 或 #评级 之类的指令，miao-plugin 就会把排名写进 Redis'
            "
            height="220px"
          />
        </div>

        <!-- 右：榜单明细 -->
        <div class="g-card rk-panel">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('trophy')" :size="13" /></i>
              {{ board.char?.name || '榜单明细' }}
              <span v-if="board.typeLabel" class="gm-panel__extra" style="margin-left: 8px">
                {{ board.typeLabel }} · 前 {{ board.summary?.shown || 0 }} 名
              </span>
            </div>
            <div class="rk-tools">
              <GSelect
                :model-value="query.charId"
                :options="charOptions"
                size="sm"
                width="176px"
                searchable
                placeholder="选择角色"
                :clearable="false"
                :loading="loadingBoard"
                @change="onCharChange"
              >
                <template #option="{ option }">
                  <span class="rk-opt">
                    <span class="rk-opt__name">{{ option.label }}</span>
                    <span class="rk-opt__meta">{{ gameLabel(option.game) }}{{ option.count }} 人</span>
                  </span>
                </template>
              </GSelect>
              <GSelect
                :model-value="query.limit"
                :options="limitOptions"
                size="sm"
                width="96px"
                :clearable="false"
                @change="onLimitChange"
              />
            </div>
          </div>

          <!-- 不可用 / 空态 -->
          <GEmpty
            v-if="!booting && !board.available"
            title="群战力榜暂不可用"
            :desc="board.reason || '需要 miao-plugin 与 Redis 同时就绪'"
            height="300px"
          />
          <GEmpty
            v-else-if="!booting && !board.rows.length"
            title="这个群还没有排行数据"
            :desc="board.reason || '直接用一次对应的指令，排名就会出现在这里'"
            height="300px"
          />

          <!-- 明细 -->
          <div v-else-if="!booting" class="rk-body">
            <Table
              row-key="uid"
              size="middle"
              :columns="columns as any"
              :data-source="board.rows"
              :pagination="false"
              :loading="loadingBoard"
              :scroll="{ x: 520 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'rank'">
                  <span class="rk-rank" :class="record.rank <= 3 ? `is-${record.rank}` : 'is-n'">
                    {{ record.rank }}
                  </span>
                </template>
                <template v-else-if="column.key === 'player'">
                  <div class="rk-user">
                    <span class="rk-user__name">{{ record.name || record.wxid || '未记录' }}</span>
                    <span class="rk-user__meta">
                      {{ record.wxid ? `QQ ${record.wxid}` : '未绑定' }} · UID {{ record.uid }}
                    </span>
                  </div>
                </template>
                <template v-else-if="column.key === 'score'">
                  <div class="rk-score">
                    <span class="rk-score__num">{{ fmtScore(record.score) }}</span>
                    <span class="rk-score__bar">
                      <i :style="{ width: barWidth(record.score) }" />
                    </span>
                  </div>
                </template>
              </template>
            </Table>
          </div>
          <div v-else class="rk-body">
            <div v-for="i in 5" :key="i" class="g-skeleton g-skeleton--text" style="margin: 10px 0" />
          </div>
        </div>
      </section>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, unref } from 'vue';
  import { Button, Table } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import { Icon } from '/@/components/Icon';
  import { useRootSetting } from '/@/hooks/setting/useRootSetting';
  import { ThemeEnum } from '/@/enums/appEnum';
  import { gm } from '/@/design/gmIcons';
  import { fmtTimeShort } from '/@/utils/localTime';
  import GEmpty from '../_shared/GEmpty.vue';
  import GSearch from '../_shared/form/GSearch.vue';
  import GSelect from '../_shared/form/GSelect.vue';
  import GSegmented from '../_shared/form/GSegmented.vue';
  import { kpiPalette, thousands } from '../_shared/stats';
  import { rankApi, type RankBoard, type RankGroupList, type RankType } from './api';

  defineOptions({ name: 'GroupRank' });

  /**
   * 群战力榜
   *
   * 左侧是所有「miao 写过排行数据」的群，右侧是该群某个角色某个维度的 Top N。
   * 数据只读：不做任何写回，也不会因为打开页面而改动 Redis。
   */

  const TYPE_LABEL: Record<string, string> = {
    dmg: '伤害',
    mark: '评分',
    crit: '暴击',
    valid: '有效词条',
  };

  const { getDarkMode } = useRootSetting();
  const isDark = computed(() => unref(getDarkMode) === ThemeEnum.DARK);

  const booting = ref(true);
  const scanning = ref(false);
  const loadingBoard = ref(false);
  const groupKeyword = ref('');

  const query = reactive({
    gid: '',
    type: 'dmg' as RankType,
    charId: '',
    limit: 20,
  });

  const groups = ref<RankGroupList>({ available: true, groups: [], charMeta: 0 });
  const board = ref<RankBoard>({ available: true, rows: [] });

  /* ------------------------------ 数据加载 ------------------------------ */

  async function loadGroups(force = false) {
    const data = await rankApi.getGroups(force);
    groups.value = data;
    return data;
  }

  async function loadBoard() {
    if (!query.gid) return;
    loadingBoard.value = true;
    try {
      const data = await rankApi.getBoard({
        gid: query.gid,
        type: query.type,
        charId: query.charId,
        limit: query.limit,
      });
      board.value = data;
      // 后端会纠正「这个群没有该类型 / 该角色」的选择，同步回来避免控件与内容不一致
      if (data.type) query.type = data.type;
      if (data.char?.id) query.charId = data.char.id;
    } catch {
      board.value = { available: true, rows: [], reason: '读取榜单失败，稍后再试' };
    } finally {
      loadingBoard.value = false;
    }
  }

  /** 群列表变了以后，尽量保住当前选中的群，否则落到条目最多的那个 */
  async function syncSelection() {
    const list = groups.value.groups || [];
    if (!list.length) {
      query.gid = '';
      board.value = { available: true, rows: [], reason: '没有任何群产生排行数据' };
      return;
    }
    if (!list.some((g) => g.gid === query.gid)) {
      query.gid = list[0].gid;
      query.charId = '';
    }
    await loadBoard();
  }

  async function scan() {
    scanning.value = true;
    try {
      await loadGroups(true);
      await syncSelection();
    } finally {
      scanning.value = false;
    }
  }

  onMounted(async () => {
    try {
      await loadGroups(false);
      await syncSelection();
    } catch {
      board.value = { available: true, rows: [], reason: '读取群列表失败，稍后点「重新扫描」再试' };
    } finally {
      booting.value = false;
    }
  });

  /* ------------------------------ 交互 ------------------------------ */

  function pickGroup(g: { gid: string }) {
    if (g.gid === query.gid) return;
    query.gid = g.gid;
    query.charId = ''; // 换群后角色集合完全不同，清空让后端选参与最多的
    loadBoard();
  }

  function onTypeChange(v: string | number) {
    query.type = String(v) as RankType;
    query.charId = '';
    loadBoard();
  }

  function onCharChange(v: any) {
    query.charId = v == null ? '' : String(v);
    loadBoard();
  }

  function onLimitChange(v: any) {
    query.limit = Number(v) || 20;
    loadBoard();
  }

  const noop = () => undefined;

  /* ------------------------------ 派生数据 ------------------------------ */

  const activeGroup = computed(() => groups.value.groups.find((g) => g.gid === query.gid) || null);

  const filteredGroups = computed(() => {
    const kw = groupKeyword.value.trim().toLowerCase();
    const list = groups.value.groups || [];
    if (!kw) return list;
    return list.filter((g) => (g.name || '').toLowerCase().includes(kw) || String(g.gid).includes(kw));
  });

  /** 类型选项优先取当前群的，没有就退回榜单返回的 */
  const typeOptions = computed(() => {
    const g = activeGroup.value;
    if (g) {
      return Object.entries(g.types || {})
        .map(([key, n]) => ({ value: key, label: TYPE_LABEL[key] || key, count: n as number }))
        .sort((a, b) => (b.count || 0) - (a.count || 0));
    }
    return (board.value.types || []).map((t) => ({ value: t.key, label: t.label, count: t.chars }));
  });

  const charOptions = computed(() =>
    (board.value.chars || []).map((c) => ({
      label: c.name,
      value: c.id,
      count: c.count,
      game: c.game,
    })),
  );

  const limitOptions = [
    { label: '前 10', value: 10 },
    { label: '前 20', value: 20 },
    { label: '前 50', value: 50 },
    { label: '前 100', value: 100 },
  ];

  const columns = [
    { title: '名次', key: 'rank', width: 76, align: 'center' },
    { title: '玩家', key: 'player' },
    { title: '分数', key: 'score', width: 230, align: 'right' },
  ];

  const cards = computed(() => {
    const p = kpiPalette(isDark.value);
    const s = board.value.summary;
    const c = board.value.char;
    const g = activeGroup.value;
    const groupCount = (groups.value.groups || []).length;
    return [
      {
        key: 'groups',
        label: '有榜单的群',
        icon: gm('users'),
        value: groupCount || '—',
        unit: groupCount ? '个' : '',
        foot: g ? `${g.charCount} 个角色有排行` : '点左侧切换查看',
        color: p.blue[0],
        color2: p.blue[1],
      },
      {
        key: 'total',
        label: '当前榜参与',
        icon: gm('gamepad'),
        value: s ? thousands(s.total) : '—',
        unit: s ? '人' : '',
        foot: board.value.typeLabel ? `${board.value.typeLabel}榜 · 展示前 ${s?.shown ?? 0} 名` : '—',
        color: p.cyan[0],
        color2: p.cyan[1],
      },
      {
        key: 'max',
        label: '榜首分数',
        icon: gm('trophy'),
        value: s ? fmtScore(s.max) : '—',
        unit: '',
        foot: c ? `${c.name} · ${gameLabel(c.game).replace(' · ', '')}` : '—',
        color: p.amber[0],
        color2: p.amber[1],
      },
      {
        key: 'avg',
        label: '榜单均值',
        icon: gm('chart'),
        value: s ? fmtScore(s.avg) : '—',
        unit: '',
        foot: s ? `前 ${s.shown} 名的平均分` : '—',
        color: p.violet[0],
        color2: p.violet[1],
      },
    ];
  });

  /* ------------------------------ 格式化 ------------------------------ */

  function gameLabel(game?: string) {
    if (game === 'gs') return '原神 · ';
    if (game === 'sr') return '星铁 · ';
    return '';
  }

  function fmtScore(n: number | null | undefined) {
    const v = Number(n);
    if (!Number.isFinite(v)) return '—';
    const r = Math.round(v * 10) / 10;
    if (Number.isInteger(r)) return thousands(r);
    return r.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  function barWidth(score: number) {
    const max = board.value.summary?.max || 0;
    if (!max) return '0%';
    return `${Math.max(3, Math.round((Number(score) / max) * 100))}%`;
  }
</script>

<style lang="less" scoped>
  /* 左列表 / 右榜单：左右各自滚动，页面整体不跟着抖 */
  .rk-panel {
    display: flex;
    flex-direction: column;
    padding: 14px 16px 12px;
  }

  .rk-search {
    margin-bottom: 8px;
  }

  .rk-groups {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 524px;
    padding-right: 2px;
    overflow-y: auto;
  }

  .rk-group {
    display: flex;
    gap: 10px;
    align-items: center;
    width: 100%;
    padding: 8px 10px;
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 10px;
    transition:
      background 0.15s,
      border-color 0.15s;

    &:hover {
      background: var(--g-hover);
    }

    &.is-active {
      background: var(--g-chip-bg);
      border-color: var(--g-card-border-strong);
    }

    &.is-active .rk-group__name {
      color: var(--g-text);
    }
  }

  .rk-group__body {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .rk-group__name {
    overflow: hidden;
    font-size: 13px;
    color: var(--g-text-sub);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rk-group__meta {
    overflow: hidden;
    font-size: 11.5px;
    color: var(--g-text-mute);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rk-group__num {
    flex: 0 0 auto;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    color: var(--g-text-mute);
  }

  /* 右侧工具条：窄屏时换行，不挤压标题 */
  .rk-tools {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    justify-content: flex-end;
  }

  .rk-body {
    flex: 1 1 auto;
    min-width: 0;
    margin-top: 8px;
  }

  /* 名次奖牌 */
  .rk-rank {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 12px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--g-text-mute);
    background: var(--g-chip-bg);
    border-radius: 8px;

    &.is-1 {
      color: #8a6420;
      background: linear-gradient(135deg, #f7d774, #e0b344);
    }

    &.is-2 {
      color: #5a6472;
      background: linear-gradient(135deg, #e3e8ef, #bfc8d4);
    }

    &.is-3 {
      color: #7c4c25;
      background: linear-gradient(135deg, #e8bb92, #cc8f5e);
    }
  }

  html[data-theme='dark'] .rk-rank.is-1 {
    color: #2a1f08;
  }

  html[data-theme='dark'] .rk-rank.is-2 {
    color: #1e242c;
  }

  html[data-theme='dark'] .rk-rank.is-3 {
    color: #2a1a0c;
  }

  .rk-user {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .rk-user__name {
    overflow: hidden;
    font-size: 13px;
    color: var(--g-text);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rk-user__meta {
    overflow: hidden;
    font-size: 11.5px;
    color: var(--g-text-mute);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rk-score {
    display: flex;
    flex-direction: column;
    gap: 5px;
    align-items: flex-end;
  }

  .rk-score__num {
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--g-text);
  }

  .rk-score__bar {
    display: block;
    width: 100%;
    height: 4px;
    overflow: hidden;
    background: var(--g-chip-bg);
    border-radius: 3px;
  }

  .rk-score__bar i {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, var(--g-blue), var(--g-cyan));
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  /* 下拉里的「游戏 · N 人」副标题 */
  .rk-opt {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .rk-opt__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rk-opt__meta {
    flex: 0 0 auto;
    font-size: 11.5px;
    color: var(--g-text-mute);
  }

  /* 页面级窄屏：栅格堆叠由 db-grid 全局处理，这里只压高度 */
  @media (max-width: 1180px) {
    .rk-groups {
      max-height: 260px;
    }

    .rk-tools {
      justify-content: flex-start;
    }
  }
</style>
