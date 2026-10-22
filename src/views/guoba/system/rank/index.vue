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
          <GSegmented :model-value="view" :options="viewOptions" size="sm" label="数据视图" @change="onViewChange" />
          <!-- 榜单类型 / 重扫 / 刷新只服务单群榜单，另两个视图各有自己的工具条 -->
          <template v-if="view === 'board'">
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
          </template>
        </div>
      </section>

      <!-- ==================== 视图一：单群榜单（原有内容，未改动） ==================== -->
      <template v-if="view === 'board'">
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
      </template>

      <!-- ==================== 视图二：角色热度 ==================== -->
      <section v-else-if="view === 'usage'" class="rk-view">
        <div class="g-card rk-panel">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('users')" :size="13" /></i>
              角色热度
              <span class="gm-panel__extra" style="margin-left: 8px">
                {{ usage ? `共 ${usage.total} 个角色有榜单数据` : '加载中…' }}
              </span>
            </div>
            <div class="rk-tools">
              <GSegmented :model-value="usageType" :options="rankTypeOptions" size="sm" label="榜单类型" @change="onUsageTypeChange" />
              <GSegmented :model-value="usageGame" :options="gameOptions" size="sm" label="游戏" @change="onUsageGameChange" />
              <Button size="small" :loading="usageLoading" @click="loadUsage(true)">
                <Icon :icon="$gm('refresh')" :size="13" style="margin-right: 4px" />
                刷新
              </Button>
            </div>
          </div>

          <GEmpty v-if="usageError" title="角色热度加载失败" :desc="usageError" height="260px" />
          <GEmpty
            v-else-if="usage && !usage.available"
            title="角色热度暂不可用"
            desc="需要 miao-plugin 与 Redis 同时就绪"
            height="260px"
          />
          <GEmpty
            v-else-if="usage && !usage.chars.length"
            title="还没有角色热度数据"
            :desc="usageGame ? '换个游戏筛选试试' : '在群里用一次 #伤害 或 #评级，角色热度就会出现在这里'"
            height="260px"
          />
          <div v-else class="rk-ulist">
            <template v-if="!usage">
              <div v-for="i in 8" :key="i" class="g-skeleton g-skeleton--text" style="margin: 8px 0" />
            </template>
            <button
              v-for="(c, i) in usage?.chars ?? []"
              :key="`${c.game}-${c.id}`"
              type="button"
              class="rk-urow"
              :title="`${c.name} · ${elemLabel(c.elem)} · ${c.count} 人 / ${c.groups} 群`"
              @click="openCompare(c)"
            >
              <span class="rk-urow__rank" :class="i === 0 ? 'is-1' : i < 3 ? 'is-top' : ''">{{ i + 1 }}</span>
              <span class="rk-urow__main">
                <span class="rk-urow__name">{{ c.name }}</span>
                <span v-if="c.star" class="rk-tag">★{{ c.star }}</span>
                <span v-if="c.elem" class="rk-tag rk-tag--elem" :style="{ color: elemColor(c.elem) }">
                  {{ elemLabel(c.elem) }}
                </span>
              </span>
              <span class="rk-urow__bar"><i :style="{ width: usageBar(c.count) }" /></span>
              <span class="rk-urow__num">{{ c.count }}<small>人</small></span>
              <span class="rk-urow__num rk-urow__num--sub">{{ c.groups }}<small>群</small></span>
            </button>
          </div>
        </div>
      </section>

      <!-- ==================== 视图三：跨群对比 ==================== -->
      <section v-else class="rk-view">
        <div class="g-card rk-panel">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('chart')" :size="13" /></i>
              {{ compareTitle }}
              <span v-if="compare?.typeLabel" class="gm-panel__extra" style="margin-left: 8px">
                {{ compare.typeLabel }}榜 · {{ compareRows.length }} 个群
              </span>
            </div>
            <div class="rk-tools">
              <GSelect
                :model-value="compareCharId"
                :options="compareCharOptions"
                size="sm"
                width="228px"
                searchable
                placeholder="选择角色"
                :clearable="false"
                :loading="compareLoading"
                @change="onCompareCharChange"
              />
              <GSegmented
                :model-value="compareType"
                :options="rankTypeOptions"
                size="sm"
                label="榜单类型"
                @change="onCompareTypeChange"
              />
              <Button size="small" :loading="compareLoading" @click="loadCompare(true)">
                <Icon :icon="$gm('refresh')" :size="13" style="margin-right: 4px" />
                刷新
              </Button>
            </div>
          </div>

          <GEmpty v-if="compareError" title="跨群对比加载失败" :desc="compareError" height="260px" />
          <GEmpty
            v-else-if="compare && !compare.available"
            title="跨群对比暂不可用"
            desc="需要 miao-plugin 与 Redis 同时就绪"
            height="260px"
          />
          <GEmpty
            v-else-if="compare && !compareRows.length"
            title="这个角色还没有跨群数据"
            desc="换一个角色或榜单类型再试"
            height="260px"
          />
          <div v-else class="rk-ctable">
            <div class="rk-crow rk-crow--head">
              <span>群</span>
              <span>榜单人数</span>
              <span>榜首</span>
              <span class="rk-crow__score">榜首分数</span>
            </div>
            <template v-if="!compare">
              <div v-for="i in 6" :key="i" class="g-skeleton g-skeleton--text" style="margin: 8px 0" />
            </template>
            <div v-for="row in compareRows" :key="`${row.gid}-${row.rawGid}`" class="rk-crow">
              <span class="rk-crow__g">
                <button type="button" class="rk-crow__gname" :title="`查看 ${row.name || row.gid} 的单群榜单`" @click="jumpToBoard(row)">
                  {{ row.name || row.gid }}
                </button>
                <span class="rk-crow__gid">{{ row.gid }}</span>
              </span>
              <span class="rk-crow__n">{{ row.count ? `${row.count} 人` : '—' }}</span>
              <span class="rk-crow__top" :class="{ 'is-empty': !row.top }">
                {{ row.top ? row.top.name || row.top.wxid || row.top.uid : '暂无数据' }}
              </span>
              <span class="rk-crow__score" :class="{ 'is-empty': !row.top }">
                {{ row.top ? fmtScore(row.top.score) : '—' }}
              </span>
            </div>
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
  import {
    rankApi,
    type CharUsageItem,
    type CharUsageResult,
    type RankBoard,
    type RankCompareGroup,
    type RankCompareResult,
    type RankGroupList,
    type RankType,
  } from './api';

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

  /* ------------------------------ 视图切换 ------------------------------ */

  type ViewKey = 'board' | 'usage' | 'compare';

  const view = ref<ViewKey>('board');
  const viewOptions = [
    { value: 'board', label: '单群榜单' },
    { value: 'usage', label: '角色热度' },
    { value: 'compare', label: '跨群对比' },
  ];

  const rankTypeOptions = [
    { value: 'dmg', label: '伤害' },
    { value: 'mark', label: '评分' },
  ];

  const gameOptions = [
    { value: '', label: '全部' },
    { value: 'gs', label: '原神' },
    { value: 'sr', label: '星铁' },
  ];

  /** 切视图才拉数据；已有缓存就直接用 ref，不重复请求 */
  function onViewChange(v: string | number) {
    const next = String(v) as ViewKey;
    if (next === view.value) return;
    view.value = next;
    if (next === 'usage') loadUsage();
    else if (next === 'compare') enterCompare();
  }

  /* ------------------------------ 角色热度 ------------------------------ */

  const usageType = ref<RankType>('dmg');
  const usageGame = ref<'' | 'gs' | 'sr'>('');
  const usage = ref<CharUsageResult | null>(null);
  const usageLoading = ref(false);
  const usageError = ref('');

  /** key = `${type}|${game}`，切回视图不重复请求；跨群对比的角色下拉也复用这份缓存（game 传空） */
  const usageCache = ref<Record<string, CharUsageResult>>({});

  async function fetchUsage(type: RankType, game: '' | 'gs' | 'sr', force = false) {
    const key = `${type}|${game}`;
    if (!force && usageCache.value[key]) return usageCache.value[key];
    const data = await rankApi.getCharUsage({ type, game, limit: 30, force });
    usageCache.value[key] = data;
    // 后端可能把类型纠正成实际有数据的那个，两个 key 都记住，切回来不必再请求
    if (data.type && data.type !== type) usageCache.value[`${data.type}|${game}`] = data;
    return data;
  }

  async function loadUsage(force = false) {
    const key = `${usageType.value}|${usageGame.value}`;
    const hit = usageCache.value[key];
    if (!force && hit) {
      usage.value = hit;
      usageError.value = '';
      return;
    }
    // 换筛选条件时先清空，避免加载期间短暂显示上一份数据
    if (!hit) usage.value = null;
    usageLoading.value = true;
    usageError.value = '';
    try {
      const data = await fetchUsage(usageType.value, usageGame.value, force);
      if (data.type) usageType.value = data.type;
      usage.value = data;
    } catch {
      usage.value = null;
      usageError.value = '读取角色热度失败，稍后再试';
    } finally {
      usageLoading.value = false;
    }
  }

  function onUsageTypeChange(v: string | number) {
    usageType.value = String(v) as RankType;
    loadUsage();
  }

  function onUsageGameChange(v: string | number) {
    usageGame.value = String(v) as '' | 'gs' | 'sr';
    loadUsage();
  }

  /* ------------------------------ 跨群对比 ------------------------------ */

  const compareType = ref<RankType>('dmg');
  const compareCharId = ref('');
  const compare = ref<RankCompareResult | null>(null);
  const compareLoading = ref(false);
  const compareError = ref('');
  const compareCache = ref<Record<string, RankCompareResult>>({});
  /** 角色下拉的选项来自 char-usage（不按游戏过滤） */
  const compareCharList = ref<CharUsageItem[]>([]);

  const compareCharOptions = computed(() =>
    compareCharList.value.map((c) => ({
      label: `${c.name}（${c.groups} 群 / ${c.count} 人）`,
      value: c.id,
    })),
  );

  async function loadCompareOptions() {
    try {
      const data = await fetchUsage(compareType.value, '');
      compareCharList.value = data.chars || [];
    } catch {
      compareCharList.value = [];
    }
  }

  async function loadCompare(force = false) {
    const key = `${compareType.value}|${compareCharId.value}`;
    const hit = compareCache.value[key];
    if (!force && hit) {
      compare.value = hit;
      compareError.value = '';
      return;
    }
    // 换角色 / 换类型时先清空，避免加载期间短暂显示上一个角色的数据
    if (!hit) compare.value = null;
    compareLoading.value = true;
    compareError.value = '';
    try {
      const data = await rankApi.getCompare({ type: compareType.value, charId: compareCharId.value });
      if (data.type) compareType.value = data.type;
      if (data.char?.id) compareCharId.value = data.char.id;
      compare.value = data;
      compareCache.value[`${compareType.value}|${compareCharId.value}`] = data;
    } catch {
      compare.value = null;
      compareError.value = '读取跨群对比失败，稍后再试';
    } finally {
      compareLoading.value = false;
    }
  }

  /** 进视图 / 从热度行跳进来：补齐选项列表，未指定角色时落到第一位（人数最多） */
  async function enterCompare(charId = '') {
    if (charId) compareCharId.value = charId;
    await loadCompareOptions();
    const valid = compareCharOptions.value.some((o) => o.value === compareCharId.value);
    if (!valid) compareCharId.value = compareCharOptions.value[0]?.value || '';
    await loadCompare();
  }

  function openCompare(c: CharUsageItem) {
    view.value = 'compare';
    compareType.value = usageType.value;
    compareCharId.value = c.id;
    enterCompare(c.id);
  }

  function onCompareCharChange(v: any) {
    compareCharId.value = v == null ? '' : String(v);
    loadCompare();
  }

  async function onCompareTypeChange(v: string | number) {
    compareType.value = String(v) as RankType;
    compareCharId.value = ''; // 换类型后角色集合不同，重新从第一位开始
    compareCharList.value = [];
    await enterCompare();
  }

  /** 跨群某行 → 单群榜单：gid 去掉 group- 前缀（保留 @chatroom），与 /groups 的形态一致 */
  async function jumpToBoard(row: RankCompareGroup) {
    const gid = String(row.rawGid || row.gid || '').replace(/^group-/, '');
    if (!gid) return;
    view.value = 'board';
    query.type = compareType.value;
    query.gid = gid;
    query.charId = '';
    await loadBoard();
  }

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

  /** 热度条以第一名（后端已按 count 降序）为 100% */
  const usageMax = computed(() => usage.value?.chars?.[0]?.count || 1);

  function usageBar(count: number) {
    return `${Math.max(4, Math.round((Number(count) / usageMax.value) * 100))}%`;
  }

  const compareTitle = computed(() => {
    const c = compare.value?.char;
    if (!c) return '同角色跨群对比';
    const bits = [c.name];
    const el = elemLabel(c.elem);
    if (el) bits.push(el);
    if (c.star) bits.push(`★${c.star}`);
    return `${bits.join(' · ')} 在各群的表现`;
  });

  /** 有榜首的按分数降序在前，没有的排最后（后端已排过，这里兜一次底） */
  const compareRows = computed(() =>
    [...(compare.value?.groups || [])].sort((a, b) => {
      if (!a.top && !b.top) return b.count - a.count;
      if (!a.top) return 1;
      if (!b.top) return -1;
      return b.top.score - a.top.score;
    }),
  );

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

  /**
   * elem 是 miao meta 里的原值：原神是英文（pyro / hydro …），星铁已经是中文（火 / 雷 …）。
   * 这里两种都收，映射不到就原样显示（例如 meta 里缺 elem 的情况）。
   */
  const ELEM_LABEL: Record<string, string> = {
    // 原神
    anemo: '风',
    geo: '岩',
    electro: '雷',
    dendro: '草',
    hydro: '水',
    pyro: '火',
    cryo: '冰',
    /** 旅行者 / 空 / 荧，miao 里标成 multi */
    multi: '多元素',
    // 星铁
    physical: '物理',
    fire: '火',
    ice: '冰',
    lightning: '雷',
    wind: '风',
    quantum: '量子',
    imaginary: '虚数',
  };

  /** 元素色沿用现有强调色令牌（项目没有 --g-elem-*），映射不到落到 --g-blue */
  const ELEM_COLOR: Record<string, string> = {
    anemo: 'var(--g-green)',
    geo: 'var(--g-gold)',
    electro: 'var(--g-violet)',
    dendro: 'var(--g-green)',
    hydro: 'var(--g-blue)',
    pyro: 'var(--g-rose)',
    cryo: 'var(--g-cyan)',
    multi: 'var(--g-gold)',
    physical: 'var(--g-text-sub)',
    fire: 'var(--g-rose)',
    ice: 'var(--g-cyan)',
    lightning: 'var(--g-violet)',
    wind: 'var(--g-green)',
    quantum: 'var(--g-violet)',
    imaginary: 'var(--g-gold)',
    // 星铁 meta 直接写中文，补一份中文键
    物理: 'var(--g-text-sub)',
    火: 'var(--g-rose)',
    冰: 'var(--g-cyan)',
    雷: 'var(--g-violet)',
    风: 'var(--g-green)',
    量子: 'var(--g-violet)',
    虚数: 'var(--g-gold)',
    水: 'var(--g-blue)',
    岩: 'var(--g-gold)',
    草: 'var(--g-green)',
  };

  function elemLabel(elem?: string) {
    if (!elem) return '';
    return ELEM_LABEL[elem] || elem;
  }

  function elemColor(elem?: string) {
    return (elem && ELEM_COLOR[elem]) || 'var(--g-blue)';
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

  /* ==================== 角色热度 / 跨群对比 ==================== */

  .rk-view {
    min-width: 0;
  }

  /* 角色热度：名次 + 角色名 + 标签 + 条 + 两个数字 */
  .rk-ulist {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 640px;
    padding-right: 2px;
    margin-top: 8px;
    overflow-y: auto;
  }

  .rk-urow {
    display: grid;
    grid-template-columns: 26px minmax(120px, 200px) minmax(0, 1fr) 64px 52px;
    gap: 10px;
    align-items: center;
    width: 100%;
    padding: 7px 8px;
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    transition: background 0.15s;

    &:hover {
      background: var(--g-hover);
    }
  }

  .rk-urow__rank {
    font-size: 11.5px;
    font-variant-numeric: tabular-nums;
    color: var(--g-text-mute);
    text-align: center;

    &.is-top {
      font-weight: 600;
      color: var(--g-text);
    }

    &.is-1 {
      font-weight: 700;
      color: var(--g-gold);
    }
  }

  .rk-urow__main {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 6px;
    align-items: center;
    min-width: 0;
  }

  .rk-urow__name {
    min-width: 0;
    overflow: hidden;
    font-size: 13px;
    color: var(--g-text);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rk-tag {
    flex: 0 0 auto;
    padding: 0 5px;
    font-size: 10.5px;
    line-height: 16px;
    color: var(--g-text-mute);
    background: var(--g-chip-bg);
    border-radius: 5px;
  }

  /* 属性色由内联 style 写入，这里只给兜底色 */
  .rk-tag--elem {
    color: var(--g-blue);
  }

  .rk-urow__bar {
    display: block;
    min-width: 0;
    height: 6px;
    overflow: hidden;
    background: var(--g-chip-bg);
    border-radius: 3px;

    i {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, var(--g-blue), var(--g-cyan));
      border-radius: 3px;
      transition: width 0.3s ease;
    }
  }

  .rk-urow__num {
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    color: var(--g-text);
    text-align: right;

    small {
      margin-left: 1px;
      font-size: 10.5px;
      color: var(--g-text-mute);
    }

    &--sub {
      color: var(--g-text-sub);
    }
  }

  /* 跨群对比：群 / 人数 / 榜首 / 分数 */
  .rk-ctable {
    margin-top: 8px;
  }

  .rk-crow {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) 92px minmax(0, 1fr) 116px;
    gap: 10px;
    align-items: center;
    padding: 8px;
    border-bottom: 1px solid var(--g-row-sep);

    &--head {
      padding-top: 2px;
      padding-bottom: 4px;
      font-size: 11px;
      color: var(--g-text-mute);
      border-bottom-color: var(--g-card-border);
    }

    &:not(.rk-crow--head):hover {
      background: var(--g-hover);
      border-radius: 8px;
    }
  }

  .rk-crow__g {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .rk-crow__gname {
    display: block;
    max-width: 100%;
    padding: 0;
    overflow: hidden;
    font-size: 13px;
    color: var(--g-blue);
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
    background: none;
    border: 0;

    &:hover {
      text-decoration: underline;
    }
  }

  .rk-crow__gid {
    overflow: hidden;
    font-size: 11px;
    color: var(--g-text-mute);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rk-crow__n {
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    color: var(--g-text-sub);
  }

  .rk-crow__top {
    overflow: hidden;
    font-size: 12.5px;
    color: var(--g-text);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rk-crow__score {
    font-size: 12.5px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--g-text);
    text-align: right;
  }

  .rk-crow__top.is-empty,
  .rk-crow__score.is-empty {
    font-weight: 400;
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

  @media (max-width: 768px) {
    .rk-ulist {
      max-height: 520px;
    }

    /* 热度行：名次 / 名字 / 人数 / 群数 占第一行，条形独占第二行 */
    .rk-urow {
      grid-template-columns: 22px minmax(0, 1fr) 58px 44px;
      gap: 4px 8px;
    }

    .rk-urow__rank {
      grid-row: 1;
    }

    .rk-urow__main {
      grid-row: 1;
      grid-column: 2 / 3;
    }

    .rk-urow__num {
      grid-row: 1;
    }

    .rk-urow__bar {
      grid-row: 2;
      grid-column: 2 / -1;
    }

    /* 跨群行：群名独占第一行，人数/榜首依次下移，分数贴右 */
    .rk-crow--head {
      display: none;
    }

    .rk-crow {
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 4px 10px;
      align-items: start;
    }

    .rk-crow__g {
      grid-row: 1;
      grid-column: 1 / 2;
    }

    .rk-crow__n {
      grid-row: 2;
      grid-column: 1 / 2;
    }

    .rk-crow__top {
      grid-row: 3;
      grid-column: 1 / 2;
      white-space: normal;
    }

    .rk-crow__score {
      grid-row: 1 / 4;
      grid-column: 2 / 3;
    }
  }
</style>
