<template>
  <PageWrapper title="">
    <div class="db g-page">
      <!-- ============================ 页头横幅 ============================ -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">DATA OVERVIEW</div>
          <div class="db-hero__title">数据总览</div>
          <div class="db-hero__desc">
            云崽运行态、消息趋势与各插件数据体量一屏掌握
            <span v-if="overview.updatedAt" class="db-hero__time">· 更新于 {{ shortTime(overview.updatedAt) }}</span>
          </div>
        </div>
        <div class="db-hero__side">
          <GSegmented
            :model-value="trendDays"
            :options="[
              { value: 7, label: '7 天' },
              { value: 14, label: '14 天' },
              { value: 30, label: '30 天' },
            ]"
            label="趋势区间"
            @update:model-value="setDays($event as number)"
          />
          <Button size="small" :loading="loading" @click="loadAll">刷新</Button>
        </div>
      </section>

      <!-- ============================ 指标卡 ============================ -->
      <section class="db-kpi">
        <template v-if="booting">
          <div v-for="i in 6" :key="i" class="gm-skeleton" style="height: 108px" />
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

      <!-- ============================ 趋势 + 缓存分布 ============================ -->
      <section class="db-grid db-grid--8-4">
        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('chart')" :size="13" /></i>
              消息趋势
            </div>
            <div class="gm-panel__extra">
              <span class="db-dot" :style="{ background: primary }" />接收
              <span class="db-dot" :style="{ background: secondary, marginLeft: 10 }" />发送
            </div>
          </div>
          <div v-show="!booting" ref="trendRef" class="db-chart" />
          <div v-if="booting" class="gm-skeleton db-chart" />
        </div>

        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('chart-pie')" :size="13" /></i>
              米游社缓存分布
            </div>
            <span class="gm-panel__extra">按游戏</span>
          </div>
          <div v-show="!booting && cacheSlices.length" ref="gameRef" class="db-chart db-chart--donut" />
          <div v-if="booting" class="gm-skeleton db-chart db-chart--donut" />
          <GEmpty v-if="!booting && !cacheSlices.length" title="暂无缓存数据" desc="使用一次米游社查询后即可看到分布" />
        </div>
      </section>

      <!-- ============================ 群 TOP + 活跃群 ============================ -->
      <section class="db-grid db-grid--5-7">
        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('chart-bar')" :size="13" /></i>
              群消息量 TOP 8
            </div>
            <span class="gm-panel__link" @click="go('/groups')">查看全部›</span>
          </div>
          <div v-if="topGroups.length" class="db-rank">
            <div v-for="(g, i) in topGroups" :key="g.gid" class="db-rank__row">
              <span class="db-rank__no" :class="`is-${['gold', 'silver', 'bronze'][i] ?? 'plain'}`">{{ i + 1 }}</span>
              <div class="db-rank__info">
                <div class="db-rank__name">
                  <b>{{ g.name || shortGid(g.gid) }}</b>
                  <span>{{ shortGid(g.gid) }}</span>
                  <span class="db-rank__avg">日均 {{ fmtNum(g.avgDaily) }}</span>
                </div>
                <div class="db-rank__track">
                  <i :style="{ width: barPct(g.total) }" />
                </div>
              </div>
              <div class="db-rank__val">
                <b>{{ fmtNum(g.total) }}</b>
                <span>条</span>
              </div>
            </div>
          </div>
          <GEmpty v-else-if="!booting" title="暂无群消息数据" desc="群内产生消息后即可统计" />
          <div v-else class="gm-skeleton" style="height: 288px" />
        </div>

        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('fire')" :size="13" /></i>
              最近活跃群
            </div>
            <span class="gm-panel__link" @click="go('/groups')">查看全部›</span>
          </div>
          <div v-if="recentGroups.length" class="db-recent">
            <div v-for="(g, i) in recentGroups" :key="g.gid" class="db-recent__row">
              <span class="db-recent__no" :class="{ 'is-top': i < 3 }">{{ i + 1 }}</span>
              <div class="db-recent__name">
                <b>{{ g.name || shortGid(g.gid) }}</b>
                <span>{{ shortGid(g.gid) }}</span>
              </div>
              <div class="db-spark">
                <i
                  v-for="(d, di) in g.daily.slice(-14)"
                  :key="di"
                  :style="{ height: sparkHeight(g, d.n) }"
                  :title="`${d.date} · ${d.n} 条`"
                />
              </div>
              <div class="db-recent__val">
                <b>{{ fmtNum(g.total) }}</b>
                <span>{{ activeText(g.lastDate) }}</span>
              </div>
            </div>
          </div>
          <GEmpty v-else-if="!booting" title="暂无群活跃数据" desc="群消息计数键尚未生成" />
          <div v-else class="gm-skeleton" style="height: 240px" />
        </div>
      </section>

      <!-- ============================ 用户 TOP + 插件体量 ============================ -->
      <section class="db-grid db-grid--6-6">
        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('users')" :size="13" /></i>
              用户消息量 TOP 8
            </div>
            <span class="gm-panel__link" @click="go('/users-data')">查看全部›</span>
          </div>
          <div v-if="userRows.length" class="db-rank db-rank--user">
            <div v-for="(u, i) in userRows" :key="u.uid" class="db-rank__row">
              <span class="db-rank__no" :class="`is-${['gold', 'silver', 'bronze'][i] ?? 'plain'}`">{{ i + 1 }}</span>
              <div class="db-rank__info">
                <div class="db-rank__name">
                  <b>{{ u.name || u.uid }}</b>
                  <span>{{ u.uid }}</span>
                  <span class="db-rank__avg">{{ u.activeDays }} 天活跃</span>
                </div>
                <div class="db-rank__track">
                  <i :style="{ width: u.pct }" />
                </div>
              </div>
              <div class="db-rank__val">
                <b>{{ fmtNum(u.total) }}</b>
                <span>条</span>
              </div>
            </div>
          </div>
          <GEmpty v-else-if="!booting" title="暂无用户消息数据" desc="用户维度计数键生成后即可统计" />
          <div v-else class="gm-skeleton" style="height: 288px" />
        </div>

        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('api')" :size="13" /></i>
              插件数据体量
            </div>
            <span class="gm-panel__link" @click="go('/plugins-data')">查看全部›</span>
          </div>
          <div v-if="nsRows.length" class="db-rank db-rank--user">
            <div v-for="(n, i) in nsRows" :key="n.ns" class="db-rank__row">
              <span class="db-rank__no" :class="`is-${['gold', 'silver', 'bronze'][i] ?? 'plain'}`">{{ i + 1 }}</span>
              <div class="db-rank__info">
                <div class="db-rank__name">
                  <b>{{ n.label }}</b>
                  <span>{{ n.owner }}</span>
                  <span class="db-rank__avg mono">{{ n.ns }}</span>
                </div>
                <div class="db-rank__track">
                  <i :style="{ width: n.pct }" />
                </div>
              </div>
              <div class="db-rank__val">
                <b>{{ fmtNum(n.keys) }}</b>
                <span>键</span>
              </div>
            </div>
          </div>
          <GEmpty v-else-if="!booting" title="暂无命名空间数据" desc="Redis 扫描完成后即可查看" />
          <div v-else class="gm-skeleton" style="height: 288px" />
        </div>
      </section>

      <div v-if="!available && !booting" class="g-card db-tip">
        <Icon :icon="$gm('info')" :size="16" />
        <div>
          <b>后端接口暂时没有数据</b>
          <div class="g-muted">
            请确认 Bot 已重启（<span class="mono">/api/admin/stats/*</span>）且 Redis 正常连接。
          </div>
        </div>
      </div>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, nextTick, onMounted, ref, unref, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { Button } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import { Icon } from '/@/components/Icon';
  import { useECharts } from '/@/hooks/web/useECharts';
  import { useRootSetting } from '/@/hooks/setting/useRootSetting';
  import { ThemeEnum } from '/@/enums/appEnum';
  import GEmpty from '../_shared/GEmpty.vue';
  import GSegmented from '../_shared/form/GSegmented.vue';
  import type { GameSlice, GroupRow, OverviewCards, TrendPoint } from '../_shared/stats';
  import { gm } from '/@/design/gmIcons';
  import {
    activeText,
    areaGradient,
    chartBase,
    chartColors,
    fmtNum,
    primaryColor,
    secondaryColor,
    shortGid,
    statsApi,
    thousands,
  } from '../_shared/stats';

  defineOptions({ name: 'Dashboard' });

  const router = useRouter();
  const { getDarkMode } = useRootSetting();
  const isDark = computed(() => unref(getDarkMode) === ThemeEnum.DARK);

  const loading = ref(false);
  const booting = ref(true);
  const available = ref(true);
  const trendDays = ref(14);

  const primary = computed(() => primaryColor(isDark.value));
  const secondary = computed(() => secondaryColor(isDark.value));

  const overview = ref<OverviewCards>({
    available: false,
    redisKeys: 0,
    namespaces: 0,
    groupCount: 0,
    todayMsg: 0,
    totalMsg: 0,
    activeToday: 0,
    avgPerGroup: 0,
    scannedAt: null,
    updatedAt: null,
  });
  const trend = ref<TrendPoint[]>([]);
  const groups = ref<GroupRow[]>([]);
  const cacheSlices = ref<GameSlice[]>([]);
  const userSummary = ref<{ userCount: number; activeToday: number }>({ userCount: 0, activeToday: 0 });
  const userRows = ref<{ uid: string; name?: string; total: number; activeDays: number; pct: string }[]>([]);
  const nsRows = ref<{ ns: string; label: string; owner: string; keys: number; pct: string }[]>([]);

  /** KPI 渐变色板（每张卡一对渐变色） */
  const palette = computed(() => {
    const d = isDark.value;
    return {
      blue: d ? ['#62A8EA', '#3C7FD1'] : ['#5BA7EA', '#2F86C4'],
      cyan: d ? ['#4FC3D9', '#2E9CB8'] : ['#5FC5DE', '#2E93B8'],
      green: d ? ['#45B97C', '#2F8F60'] : ['#4FBF8B', '#2E7A58'],
      amber: d ? ['#E0C79A', '#C2A166'] : ['#D8B877', '#A8813F'],
      violet: d ? ['#9D8DF0', '#7B6AD8'] : ['#9A90F0', '#6F63D6'],
      rose: d ? ['#FF9A7A', '#E0664A'] : ['#F09A7E', '#C25A6E'],
    };
  });

  const cards = computed(() => {
    const p = palette.value;
    return [
      {
        key: 'keys',
        label: 'Redis 键',
        icon: gm('server'),
        value: thousands(overview.value.redisKeys),
        foot: `覆盖 ${overview.value.namespaces} 个命名空间`,
        color: p.blue[0],
        color2: p.blue[1],
      },
      {
        key: 'groups',
        label: '群总数',
        icon: gm('grid'),
        value: thousands(overview.value.groupCount),
        unit: '个',
        foot: `今日活跃 ${overview.value.activeToday} 个`,
        color: p.cyan[0],
        color2: p.cyan[1],
      },
      {
        key: 'today',
        label: '今日消息',
        icon: gm('pulse'),
        value: thousands(overview.value.todayMsg),
        unit: '条',
        foot: `群均 ${fmtNum(overview.value.avgPerGroup)} 条`,
        color: p.green[0],
        color2: p.green[1],
      },
      {
        key: 'total',
        label: '累计消息',
        icon: gm('database'),
        value: fmtNum(overview.value.totalMsg),
        unit: '条',
        foot: `群平均 ${fmtNum(overview.value.avgPerGroup)} 条`,
        color: p.amber[0],
        color2: p.amber[1],
      },
      {
        key: 'users',
        label: '用户总数',
        icon: gm('users'),
        value: thousands(userSummary.value.userCount),
        unit: '人',
        foot: `今日活跃 ${thousands(userSummary.value.activeToday)} 人`,
        color: p.violet[0],
        color2: p.violet[1],
      },
      {
        key: 'avg',
        label: '单群日均',
        icon: gm('chart-bar'),
        value: fmtNum(avgPerGroupDaily.value),
        unit: '条',
        foot: '按有记录天数平均',
        color: p.rose[0],
        color2: p.rose[1],
      },
    ];
  });

  const avgPerGroupDaily = computed(() =>
    groups.value.length ? Math.round(groups.value.reduce((s, g) => s + g.avgDaily, 0) / groups.value.length) : 0,
  );

  const recentGroups = computed(() =>
    [...groups.value].sort((a, b) => (a.lastDate < b.lastDate ? 1 : -1)).slice(0, 6),
  );

  /** 消息量 TOP 8 排行榜 */
  const topGroups = computed(() => [...groups.value].sort((a, b) => b.total - a.total).slice(0, 8));

  function barPct(n: number) {
    const max = topGroups.value[0]?.total || 1;
    return `${Math.max(4, Math.round((n / max) * 100))}%`;
  }

  /** 用户消息量 TOP 8 */
  function buildUserRows(list: any[]) {
    const rows = list.slice(0, 8);
    const max = rows.reduce((m, r) => Math.max(m, r.total || 0), 0) || 1;
    userRows.value = rows.map((r) => ({
      uid: String(r.uid ?? ''),
      name: r.name || '',
      total: r.total || 0,
      activeDays: r.activeDays || 0,
      pct: `${Math.max(4, Math.round(((r.total || 0) / max) * 100))}%`,
    }));
  }

  /** 插件命名空间体量 TOP 8 */
  function buildNsRows(buckets: any[]) {
    const rows = [...buckets].sort((a, b) => (b.keys || 0) - (a.keys || 0)).slice(0, 8);
    const max = rows[0]?.keys || 1;
    nsRows.value = rows.map((b) => ({
      ns: b.ns,
      label: b.label || b.ns,
      owner: b.owner || '',
      keys: b.keys || 0,
      pct: `${Math.max(4, Math.round(((b.keys || 0) / max) * 100))}%`,
    }));
  }

  function sparkHeight(g: GroupRow, n: number) {
    const max = Math.max(...g.daily.map((d) => d.n), 1);
    return `${Math.max(3, Math.round((n / max) * 100))}%`;
  }

  function shortTime(iso: string | null) {
    return String(iso || '').replace('T', ' ').slice(5, 16);
  }

  function go(path: string) {
    router.push(path).catch(() => {});
  }

  /* ------------------------------ 图表 ------------------------------ */

  const trendRef = ref<HTMLDivElement | null>(null);
  const gameRef = ref<HTMLDivElement | null>(null);

  const trendChart = useECharts(trendRef);
  const gameChart = useECharts(gameRef);

  function renderTrend() {
    if (!trend.value.length) return;
    const base = chartBase(isDark.value);
    trendChart.setOptions({
      grid: { top: 18, right: 14, bottom: 24, left: 44 },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: base.grid } } },
      xAxis: {
        type: 'category',
        data: trend.value.map((t) => t.date.slice(5)),
        boundaryGap: false,
        axisLine: { lineStyle: { color: base.grid } },
        axisTick: { show: false },
        axisLabel: base.axisLabel,
      },
      yAxis: { type: 'value', axisLabel: base.axisLabel, splitLine: base.splitLine },
      series: [
        {
          name: '接收消息',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: trend.value.map((t) => t.recv),
          lineStyle: { width: 2.6, color: primary.value },
          itemStyle: { color: primary.value },
          areaStyle: { color: areaGradient(trendChart.echarts, primary.value, 0.3) },
        },
        {
          name: '机器人发送',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: trend.value.map((t) => t.send),
          lineStyle: { width: 2.2, color: secondary.value },
          itemStyle: { color: secondary.value },
          areaStyle: { color: areaGradient(trendChart.echarts, secondary.value, 0.18) },
        },
      ],
    });
  }

  function renderGames() {
    if (!cacheSlices.value.length) return;
    const base = chartBase(isDark.value);
    const paletteColors = chartColors(isDark.value);
    const total = cacheSlices.value.reduce((s, g) => s + g.count, 0);
    gameChart.setOptions({
      tooltip: { ...base.tooltip, trigger: 'item', formatter: '{b}<br/>{c} 键（{d}%）' },
      legend: {
        orient: 'vertical',
        right: 2,
        top: 'middle',
        itemWidth: 8,
        itemHeight: 8,
        icon: 'circle',
        itemGap: 10,
        textStyle: { color: base.text, fontSize: 11.5 },
      },
      series: [
        {
          type: 'pie',
          radius: ['54%', '76%'],
          center: ['30%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: { borderWidth: 2, borderColor: 'transparent', borderRadius: 5 },
          label: { show: false },
          labelLine: { show: false },
          data: cacheSlices.value.map((s, i) => ({
            name: s.label,
            value: s.count,
            itemStyle: { color: paletteColors[i % paletteColors.length] },
          })),
        },
      ],
      graphic: [
        {
          type: 'text',
          left: '23%',
          top: '42%',
          style: { text: thousands(total), fill: base.textStrong, fontSize: 18, fontWeight: 700, textAlign: 'center' },
        },
        {
          type: 'text',
          left: '26%',
          top: '56%',
          style: { text: '缓存键', fill: base.text, fontSize: 11, textAlign: 'center' },
        },
      ],
    });
  }

  function renderAll() {
    renderTrend();
    renderGames();
  }

  function setDays(d: number) {
    if (trendDays.value === d) return;
    trendDays.value = d;
    loadTrend();
  }

  /* ------------------------------ 数据 ------------------------------ */

  async function loadOverview() {
    try {
      const res = await statsApi.getOverview();
      if (res) {
        overview.value = res;
        available.value = res.available;
      }
    } catch {
      available.value = false;
    }
  }

  async function loadGroups() {
    try {
      const res = await statsApi.getGroups({ page: 1, size: 200, sort: 'total', order: 'desc' });
      groups.value = res?.list ?? [];
      if (res?.summary) {
        overview.value = { ...overview.value, ...res.summary };
      }
    } catch {
      groups.value = [];
    }
  }

  async function loadTrend() {
    try {
      const res = await statsApi.getTrend(trendDays.value);
      trend.value = res?.trend ?? [];
      await nextTick();
      renderTrend();
    } catch {
      trend.value = [];
    }
  }

  async function loadGames() {
    try {
      const res = await statsApi.getGames();
      cacheSlices.value = res?.cache?.length ? res.cache : (res?.profile ?? []);
    } catch {
      cacheSlices.value = [];
    }
  }

  async function loadUsers() {
    try {
      const res = await statsApi.getUsers({ page: 1, size: 1 });
      userSummary.value = {
        userCount: res?.summary?.userCount ?? 0,
        activeToday: res?.summary?.activeToday ?? 0,
      };
    } catch {
      userSummary.value = { userCount: 0, activeToday: 0 };
    }
  }

  async function loadUserRank() {
    try {
      const res = await statsApi.getUsers({ page: 1, size: 8, sort: 'total', order: 'desc' });
      buildUserRows(res?.list ?? []);
    } catch {
      userRows.value = [];
    }
  }

  async function loadPluginVol() {
    try {
      const res = await statsApi.getPlugins();
      buildNsRows(res?.buckets ?? []);
    } catch {
      nsRows.value = [];
    }
  }

  async function loadAll() {
    loading.value = true;
    await Promise.all([
      loadOverview(),
      loadGroups(),
      loadTrend(),
      loadGames(),
      loadUsers(),
      loadUserRank(),
      loadPluginVol(),
    ]);
    loading.value = false;
    booting.value = false;
    await nextTick();
    renderAll();
  }

  watch(isDark, () => nextTick(() => renderAll()));

  onMounted(loadAll);
</script>

<style scoped lang="less">
  .db {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* ---------------- 页头 ---------------- */
  .db-hero {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    align-items: center;
    justify-content: space-between;
    padding: 18px 22px;
    border-radius: 16px;
  }

  html[data-theme='light'] .db-hero {
    background:
      radial-gradient(520px 180px at 88% 0%, rgb(255 255 255 / 90%), transparent 70%),
      linear-gradient(108deg, #e9f3ff 0%, #e2efff 46%, #f3f9ff 100%);
    border: 1px solid rgb(120 150 180 / 18%);
    box-shadow: 0 10px 30px -18px rgb(47 134 196 / 40%);
  }

  html[data-theme='dark'] .db-hero {
    background:
      radial-gradient(520px 180px at 88% 0%, rgb(98 168 234 / 18%), transparent 70%),
      linear-gradient(108deg, #0d2033 0%, #112a42 52%, #14334a 100%);
    border: 1px solid rgb(255 255 255 / 12%);
    box-shadow: 0 12px 34px -20px rgb(0 0 0 / 70%);
  }

  .db-hero__main {
    min-width: 0;
  }

  .db-hero__eyebrow {
    font-size: 10.5px;
    font-weight: 600;
    color: var(--g-text-mute);
    letter-spacing: 2px;
  }

  .db-hero__title {
    margin-top: 3px;
    font-size: 21px;
    font-weight: 700;
    line-height: 1.25;
    color: var(--g-text);
  }

  .db-hero__desc {
    margin-top: 5px;
    font-size: 12.5px;
    color: var(--g-text-sub);
  }

  .db-hero__time {
    color: var(--g-text-mute);
  }

  .db-hero__side {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  /* ---------------- 指标卡 ---------------- */
  .db-kpi {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .db-kpi__card {
    position: relative;
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 15px 16px;
    overflow: hidden;
    background: var(--g-card-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 14px;
    box-shadow: var(--g-card-shadow);
    transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
  }

  .db-kpi__card:hover {
    border-color: var(--g-card-border-strong);
    box-shadow: 0 4px 10px rgb(0 0 0 / 6%), 0 20px 38px -24px rgb(47 134 196 / 55%);
    transform: translateY(-2px);
  }

  .db-kpi__icon {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    color: #fff;
    border-radius: 13px;
    box-shadow: 0 8px 18px -10px rgb(0 0 0 / 45%);
  }

  .db-kpi__label {
    font-size: 12px;
    color: var(--g-text-sub);
    white-space: nowrap;
  }

  .db-kpi__value {
    margin-top: 1px;
    font-size: 22px;
    font-weight: 700;
    line-height: 1.2;
    color: var(--g-text);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.4px;
  }

  .db-kpi__value small {
    margin-left: 3px;
    font-size: 11px;
    font-weight: 400;
    color: var(--g-text-mute);
  }

  .db-kpi__foot {
    margin-top: 3px;
    overflow: hidden;
    font-size: 11.5px;
    color: var(--g-text-mute);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ---------------- 栅格 ---------------- */
  .db-grid {
    display: grid;
    gap: 14px;
    align-items: start;
  }

  .db-grid--8-4 {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  }

  .db-grid--5-7 {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
  }

  .db-grid--6-6 {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .db-chart {
    height: 262px;
  }

  .db-chart--donut {
    height: 262px;
  }

  /* ---------------- 群消息 TOP 榜 ---------------- */
  .db-rank {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 288px;
  }

  .db-rank__row {
    display: grid;
    grid-template-columns: 26px minmax(0, 1fr) 86px;
    gap: 12px;
    align-items: center;
    padding: 5px 8px;
    border-radius: 10px;
    transition: background 0.18s;
  }

  .db-rank__row:hover {
    background: var(--g-hover);
  }

  .db-rank__no {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    font-size: 11.5px;
    font-weight: 700;
    color: var(--g-text-mute);
    background: var(--g-chip-bg);
    border-radius: 7px;
  }

  .db-rank__no.is-gold {
    color: #6b4d00;
    background: linear-gradient(135deg, #f5dd9a, #dcae4e);
    box-shadow: 0 4px 10px -4px rgb(220 174 78 / 60%);
  }

  .db-rank__no.is-silver {
    color: #45535f;
    background: linear-gradient(135deg, #dfe7ee, #a9b9c6);
    box-shadow: 0 4px 10px -4px rgb(169 185 198 / 55%);
  }

  .db-rank__no.is-bronze {
    color: #5e3a1c;
    background: linear-gradient(135deg, #eec9a8, #c98a58);
    box-shadow: 0 4px 10px -4px rgb(201 138 88 / 55%);
  }

  .db-rank__info {
    min-width: 0;
  }

  .db-rank__name {
    display: flex;
    gap: 8px;
    align-items: baseline;
    min-width: 0;
    margin-bottom: 5px;
  }

  .db-rank__name b {
    overflow: hidden;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--g-text);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .db-rank__name span {
    flex-shrink: 0;
    font-size: 11px;
    color: var(--g-text-mute);
  }

  .db-rank__avg {
    margin-left: auto;
    color: var(--g-text-mute) !important;
  }

  .db-rank__track {
    height: 6px;
    overflow: hidden;
    background: var(--g-track);
    border-radius: 4px;
  }

  .db-rank__track i {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, var(--g-blue), var(--g-cyan));
    border-radius: 4px;
    transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .db-rank__row:nth-child(1) .db-rank__track i {
    background: linear-gradient(90deg, #dcae4e, #f0d491);
  }

  .db-rank__row:nth-child(2) .db-rank__track i {
    background: linear-gradient(90deg, #94a9bb, #c6d3de);
  }

  .db-rank__row:nth-child(3) .db-rank__track i {
    background: linear-gradient(90deg, #c98a58, #e3b48b);
  }

  /* 用户/插件榜：名字列允许收缩，长命名空间省略 */
  .db-rank--user .db-rank__name span {
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .db-rank__val {
    text-align: right;
  }

  .db-rank__val b {
    font-size: 13px;
    font-weight: 650;
    color: var(--g-text);
    font-variant-numeric: tabular-nums;
  }

  .db-rank__val span {
    margin-left: 2px;
    font-size: 11px;
    color: var(--g-text-mute);
  }

  .db-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 4px;
    border-radius: 50%;
  }

  /* ---------------- 最近活跃群 ---------------- */
  .db-recent {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  .db-recent__row {
    display: grid;
    grid-template-columns: 20px minmax(120px, 1.25fr) minmax(90px, 1fr) 72px;
    gap: 10px;
    align-items: center;
    padding: 6px 8px;
    border-radius: 9px;
    transition: background 0.18s;
  }

  .db-recent__row:hover {
    background: var(--g-hover);
  }

  .db-recent__no {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    font-size: 11px;
    font-weight: 700;
    color: var(--g-text-mute);
    background: var(--g-chip-bg);
    border-radius: 6px;
  }

  .db-recent__no.is-top {
    color: #fff;
    background: linear-gradient(135deg, #6cb4f0, #2f86c4);
  }

  .db-recent__name {
    min-width: 0;
  }

  .db-recent__name b {
    display: block;
    overflow: hidden;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--g-text);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .db-recent__name span {
    font-size: 11px;
    color: var(--g-text-mute);
  }

  .db-spark {
    display: flex;
    gap: 3px;
    align-items: flex-end;
    justify-content: flex-end;
    height: 34px;
  }

  .db-spark i {
    flex: 1 1 0;
    min-width: 3px;
    max-width: 7px;
    background: linear-gradient(180deg, var(--g-blue), var(--g-cyan));
    border-radius: 3px 3px 1px 1px;
    opacity: 0.85;
  }

  .db-spark i:hover {
    opacity: 1;
  }

  .db-recent__val {
    text-align: right;
  }

  .db-recent__val b {
    display: block;
    font-size: 12.5px;
    font-weight: 650;
    color: var(--g-text);
    font-variant-numeric: tabular-nums;
  }

  .db-recent__val span {
    font-size: 11px;
    color: var(--g-text-mute);
  }

  .db-tip {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    color: var(--g-text-sub);
  }

  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  /* ---------------- 响应式 ---------------- */
  @media (max-width: 1440px) {
    .db-kpi {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 1180px) {
    .db-grid--8-4,
    .db-grid--5-7,
    .db-grid--6-6 {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .db-kpi {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
