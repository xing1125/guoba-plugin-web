<template>
  <div class="scr">
    <!-- ============ 顶栏 ============ -->
    <header class="scr-head">
      <div class="scr-head__side scr-head__side--l">
        <span class="scr-bot">
          <i class="scr-bot__dot" :class="{ 'is-off': !runtime.available }" />
          {{ botLabel }}
        </span>
        <span class="scr-chip">云崽管理后台</span>
      </div>
      <div class="scr-head__title">
        <i class="scr-head__wing scr-head__wing--l" />
        <h1>机器人运行状态大屏</h1>
        <i class="scr-head__wing scr-head__wing--r" />
      </div>
      <div class="scr-head__side scr-head__side--r">
        <span class="scr-clock">{{ clock }}</span>
        <Button size="small" ghost @click="toggleFull">
          <Icon icon="ant-design:fullscreen-outlined" :size="13" />
          {{ isFull ? '退出全屏' : '全屏' }}
        </Button>
      </div>
    </header>

    <!-- ============ KPI 行 ============ -->
    <section class="scr-kpi">
      <div v-for="k in kpis" :key="k.label" class="scr-kpi__card">
        <span class="scr-kpi__icon" :style="{ color: k.color, background: k.soft }">
          <Icon :icon="k.icon" :size="16" />
        </span>
        <div class="scr-kpi__body">
          <div class="scr-kpi__label">{{ k.label }}</div>
          <div class="scr-kpi__value">{{ k.value }}<small>{{ k.unit }}</small></div>
        </div>
        <i class="corner corner--tl" /><i class="corner corner--br" />
      </div>
    </section>

    <!-- ============ 主区三列 ============ -->
    <section class="scr-main">
      <!-- 左列 -->
      <div class="scr-col">
        <div class="scr-panel">
          <div class="scr-panel__head">
            <span class="scr-panel__tag" />
            消息趋势
            <em class="scr-panel__extra">近 14 天 · 收 / 发</em>
          </div>
          <div v-show="hasTrend" ref="trendRef" class="scr-chart scr-chart--trend" />
          <div v-if="!hasTrend" class="scr-empty">{{ booting ? '数据加载中…' : '暂无趋势数据' }}</div>
          <i class="corner corner--tl" /><i class="corner corner--tr" />
          <i class="corner corner--bl" /><i class="corner corner--br" />
        </div>

        <div class="scr-panel scr-panel--grow">
          <div class="scr-panel__head">
            <span class="scr-panel__tag" />
            群消息排行
            <em class="scr-panel__extra">TOP 8 · 累计</em>
          </div>
          <div v-if="topGroups.length" class="scr-rank">
            <div v-for="(g, i) in topGroups" :key="g.gid" class="scr-rank__row">
              <span class="scr-rank__no" :class="`is-${i + 1}`">{{ i + 1 }}</span>
              <b class="scr-rank__name" :title="g.name || g.gid">{{ g.name || shortGid(g.gid) }}</b>
              <div class="scr-rank__track">
                <i :style="{ width: rankPct(g.total) }" />
              </div>
              <span class="scr-rank__val">{{ fmtNum(g.total) }}</span>
            </div>
          </div>
          <div v-else class="scr-empty">{{ booting ? '数据加载中…' : '暂无群数据' }}</div>
          <i class="corner corner--tl" /><i class="corner corner--tr" />
          <i class="corner corner--bl" /><i class="corner corner--br" />
        </div>
      </div>

      <!-- 中列 -->
      <div class="scr-col scr-col--mid">
        <div class="scr-panel">
          <div class="scr-panel__head">
            <span class="scr-panel__tag" />
            运行核心
            <em class="scr-panel__extra">CPU / 内存</em>
          </div>
          <div class="scr-gauges">
            <div ref="cpuRef" class="scr-chart scr-chart--gauge" />
            <div ref="memRef" class="scr-chart scr-chart--gauge" />
          </div>
          <div class="scr-membar">
            <div class="scr-membar__label">
              系统内存
              <b>{{ fmtBytes(runtime.memory?.used) }}</b> / {{ fmtBytes(runtime.memory?.total) }}
            </div>
            <div class="scr-membar__track">
              <i :style="{ width: `${runtime.memory?.usagePct ?? 0}%` }" />
            </div>
            <div class="scr-membar__pct">{{ runtime.memory?.usagePct ?? 0 }}%</div>
          </div>
          <i class="corner corner--tl" /><i class="corner corner--tr" />
          <i class="corner corner--bl" /><i class="corner corner--br" />
        </div>

        <div class="scr-panel scr-panel--grow">
          <div class="scr-panel__head">
            <span class="scr-panel__tag" />
            系统信息
          </div>
          <div class="scr-info">
            <div v-for="it in sysInfo" :key="it.k" class="scr-info__item">
              <span>{{ it.k }}</span>
              <b :title="String(it.v)">{{ it.v }}</b>
            </div>
          </div>
          <div class="scr-bots">
            <div class="scr-bots__title">在线账号</div>
            <div v-if="runtime.bots?.length" class="scr-bots__list">
              <div v-for="b in runtime.bots" :key="b.uin" class="scr-bot-row">
                <i class="scr-bot__dot" />
                <b>{{ b.nickname || 'Bot' }}</b>
                <span class="g-mono">{{ b.uin }}</span>
              </div>
            </div>
            <div v-else class="scr-empty scr-empty--sm">暂无账号信息</div>
          </div>
          <i class="corner corner--tl" /><i class="corner corner--tr" />
          <i class="corner corner--bl" /><i class="corner corner--br" />
        </div>
      </div>

      <!-- 右列 -->
      <div class="scr-col">
        <div class="scr-panel">
          <div class="scr-panel__head">
            <span class="scr-panel__tag" />
            米游社缓存分布
            <em class="scr-panel__extra">按游戏</em>
          </div>
          <div v-show="cacheSlices.length" ref="gameRef" class="scr-chart scr-chart--donut" />
          <div v-if="!cacheSlices.length" class="scr-empty">{{ booting ? '数据加载中…' : '暂无缓存数据' }}</div>
          <i class="corner corner--tl" /><i class="corner corner--tr" />
          <i class="corner corner--bl" /><i class="corner corner--br" />
        </div>

        <div class="scr-panel scr-panel--grow">
          <div class="scr-panel__head">
            <span class="scr-panel__tag" />
            最近活跃群
            <em class="scr-panel__extra">14 天消息量</em>
          </div>
          <div v-if="recentGroups.length" class="scr-recent">
            <div v-for="g in recentGroups" :key="g.gid" class="scr-recent__row">
              <b class="scr-recent__name" :title="g.name || g.gid">{{ g.name || shortGid(g.gid) }}</b>
              <div class="scr-spark">
                <i
                  v-for="(d, di) in g.daily.slice(-14)"
                  :key="di"
                  :style="{ height: sparkHeight(g, d.n) }"
                  :title="`${d.date} · ${d.n} 条`"
                />
              </div>
              <span class="scr-recent__val">{{ fmtNum(g.total) }}</span>
            </div>
          </div>
          <div v-else class="scr-empty">{{ booting ? '数据加载中…' : '暂无群活跃数据' }}</div>
          <i class="corner corner--tl" /><i class="corner corner--tr" />
          <i class="corner corner--bl" /><i class="corner corner--br" />
        </div>
      </div>
    </section>

    <!-- ============ 底栏 ============ -->
    <footer class="scr-foot">
      <span>数据每 30 秒自动刷新 · 最近更新 {{ shortTime(runtime.updatedAt) }}</span>
      <span class="scr-foot__right">
        Node {{ runtime.nodeVersion || '—' }}
        <template v-if="runtime.redis?.version"> · Redis v{{ runtime.redis.version }}</template>
      </span>
    </footer>
  </div>
</template>

<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue';
  import { Button } from 'ant-design-vue';
  import { useFullscreen } from '@vueuse/core';
  import { Icon } from '/@/components/Icon';
  import { useECharts } from '/@/hooks/web/useECharts';
  import type { GameSlice, GroupRow, OverviewCards, TrendPoint } from '../_shared/stats';
  import { areaGradient, chartBase, chartColors, fmtNum, hexToRgba, statsApi, shortGid, thousands } from '../_shared/stats';
  import type { BotRuntime } from '../_shared/stats';

  defineOptions({ name: 'BotScreen' });

  /* ------------------------------ 状态 ------------------------------ */

  const booting = ref(true);
  const clock = ref('');
  const overview = ref<Partial<OverviewCards>>({});
  const userCount = ref(0);
  const trend = ref<TrendPoint[]>([]);
  const groups = ref<GroupRow[]>([]);
  const cacheSlices = ref<GameSlice[]>([]);
  const runtime = ref<Partial<BotRuntime>>({ memory: {}, redis: {}, bots: [] });

  const hasTrend = computed(() => trend.value.length > 0);
  const topGroups = computed(() => [...groups.value].sort((a, b) => b.total - a.total).slice(0, 8));
  const recentGroups = computed(() => [...groups.value].sort((a, b) => (a.lastDate < b.lastDate ? 1 : -1)).slice(0, 6));
  const maxRank = computed(() => topGroups.value[0]?.total || 1);

  const botLabel = computed(() => {
    const b = runtime.value.bots?.[0];
    return b?.nickname ? `${b.nickname}（${b.uin}）` : 'Yunzai Bot';
  });

  const sysInfo = computed(() => {
    const s = runtime.value.system;
    const up = runtime.value.botUptime ?? 0;
    return [
      { k: '操作系统', v: s?.osRelease || '—' },
      { k: '处理器', v: s?.cpuModel || '—' },
      { k: 'CPU 核心', v: s?.cpuCores ? `${s.cpuCores} 核` : '—' },
      { k: '运行平台', v: s ? `${s.platform} / ${s.arch}` : '—' },
      { k: 'Bot 运行时长', v: fmtDuration(up) },
      { k: '主机在线', v: fmtDuration(runtime.value.osUptime ?? 0) },
      { k: '进程内存 RSS', v: fmtBytes(runtime.value.memory?.rss) },
      { k: 'Redis 键数', v: thousands(runtime.value.redis?.keys ?? 0) },
    ];
  });

  const kpis = computed(() => {
    const ice = '#4FC3F7';
    const gold = '#D4AF37';
    const green = '#45B97C';
    const violet = '#9D8DF0';
    const soft = (c: string) => hexToRgba(c, 0.14);
    return [
      { label: '今日消息', icon: 'ant-design:message-outlined', value: thousands(overview.value.todayMsg ?? 0), unit: '条', color: ice, soft: soft(ice) },
      { label: '累计消息', icon: 'ant-design:database-outlined', value: fmtNum(overview.value.totalMsg ?? 0), unit: '条', color: gold, soft: soft(gold) },
      { label: '群总数', icon: 'ant-design:appstore-outlined', value: thousands(overview.value.groupCount ?? 0), unit: '个', color: green, soft: soft(green) },
      { label: '用户总数', icon: 'ant-design:team-outlined', value: thousands(userCount.value), unit: '人', color: violet, soft: soft(violet) },
      { label: 'Redis 键', icon: 'ant-design:cloud-server-outlined', value: thousands(overview.value.redisKeys ?? 0), unit: '个', color: ice, soft: soft(ice) },
      { label: '在线账号', icon: 'ant-design:robot-outlined', value: String(runtime.value.bots?.length ?? 0), unit: '个', color: green, soft: soft(green) },
    ];
  });

  /* ------------------------------ 工具 ------------------------------ */

  function fmtNum(n?: number) {
    if (!n) return '0';
    if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(2)} 亿`;
    if (n >= 10_000) return `${(n / 10_000).toFixed(1)} 万`;
    return thousands(n);
  }

  function fmtBytes(n?: number) {
    if (!n) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let v = n;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
  }

  function fmtDuration(sec: number) {
    if (!sec) return '—';
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (d > 0) return `${d} 天 ${h} 时`;
    if (h > 0) return `${h} 时 ${m} 分`;
    return `${m} 分`;
  }

  function shortTime(iso?: string | null) {
    return String(iso || '').replace('T', ' ').slice(5, 19);
  }

  function rankPct(n: number) {
    return `${Math.max(4, Math.round((n / maxRank.value) * 100))}%`;
  }

  function sparkHeight(g: GroupRow, n: number) {
    const max = Math.max(...g.daily.map((d) => d.n), 1);
    return `${Math.max(3, Math.round((n / max) * 100))}%`;
  }

  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const isFull = isFullscreen;
  function toggleFull() {
    toggleFullscreen();
  }

  /* ------------------------------ 图表 ------------------------------ */

  const trendRef = ref<HTMLDivElement | null>(null);
  const gameRef = ref<HTMLDivElement | null>(null);
  const cpuRef = ref<HTMLDivElement | null>(null);
  const memRef = ref<HTMLDivElement | null>(null);

  const trendChart = useECharts(trendRef);
  const gameChart = useECharts(gameRef);
  const cpuChart = useECharts(cpuRef);
  const memChart = useECharts(memRef);

  const ICE = '#4FC3F7';
  const GOLD = '#D4AF37';
  const SKY = '#62A8EA';

  function renderTrend() {
    if (!trend.value.length) return;
    const base = chartBase(true);
    trendChart.setOptions({
      grid: { top: 20, right: 16, bottom: 24, left: 48 },
      tooltip: { ...base.tooltip, trigger: 'axis' },
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
          name: '接收',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: trend.value.map((t) => t.recv),
          lineStyle: { width: 2.4, color: ICE },
          itemStyle: { color: ICE },
          areaStyle: { color: areaGradient(trendChart.echarts, ICE, 0.32) },
        },
        {
          name: '发送',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: trend.value.map((t) => t.send),
          lineStyle: { width: 2, color: GOLD },
          itemStyle: { color: GOLD },
          areaStyle: { color: areaGradient(trendChart.echarts, GOLD, 0.16) },
        },
      ],
    });
  }

  function renderGames() {
    if (!cacheSlices.value.length) return;
    const base = chartBase(true);
    const colors = chartColors(true);
    const total = cacheSlices.value.reduce((s, g) => s + g.count, 0);
    gameChart.setOptions({
      tooltip: { ...base.tooltip, trigger: 'item', formatter: '{b}<br/>{c} 键（{d}%）' },
      legend: {
        orient: 'vertical',
        right: 4,
        top: 'middle',
        itemWidth: 8,
        itemHeight: 8,
        icon: 'circle',
        itemGap: 9,
        textStyle: { color: base.text, fontSize: 11.5 },
      },
      series: [
        {
          type: 'pie',
          radius: ['58%', '78%'],
          center: ['32%', '50%'],
          itemStyle: { borderWidth: 2, borderColor: 'transparent', borderRadius: 5 },
          label: { show: false },
          labelLine: { show: false },
          data: cacheSlices.value.map((s, i) => ({
            name: s.label,
            value: s.count,
            itemStyle: { color: colors[i % colors.length] },
          })),
        },
      ],
      graphic: [
        { type: 'text', left: '24%', top: '43%', style: { text: thousands(total), fill: '#e6f2fc', fontSize: 16, fontWeight: 700, textAlign: 'center' } },
        { type: 'text', left: '27%', top: '56%', style: { text: '缓存键', fill: base.text, fontSize: 10.5, textAlign: 'center' } },
      ],
    });
  }

  function renderGauge(chart: any, val: number | null, name: string, color: string) {
    const v = val == null ? 0 : Math.min(100, Math.max(0, val));
    chart.setOptions({
      series: [
        {
          type: 'gauge',
          startAngle: 210,
          endAngle: -30,
          min: 0,
          max: 100,
          radius: '96%',
          center: ['50%', '58%'],
          progress: { show: true, width: 12, roundCap: true, itemStyle: { color } },
          axisLine: { roundCap: true, lineStyle: { width: 12, color: [[1, 'rgba(255,255,255,0.10)']] } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          pointer: { show: false },
          anchor: { show: false },
          title: { offsetCenter: [0, '38%'], color: 'rgba(167,189,210,0.85)', fontSize: 12 },
          detail: {
            offsetCenter: [0, '-4%'],
            formatter: val == null ? '采样中' : `${val}%`,
            color: '#e6f2fc',
            fontSize: 24,
            fontWeight: 700,
          },
          data: [{ value: v, name }],
        },
      ],
    });
  }

  function renderGauges() {
    renderGauge(cpuChart, runtime.value.cpuUsage ?? null, 'CPU 占用', ICE);
    renderGauge(memChart, runtime.value.memory?.usagePct ?? null, '内存占用', SKY);
  }

  function renderAll() {
    renderTrend();
    renderGames();
    renderGauges();
  }

  /* ------------------------------ 数据 ------------------------------ */

  async function loadAll() {
    const jobs = [
      statsApi.getRuntime().then((r) => r && (runtime.value = r)).catch(() => {}),
      statsApi.getOverview().then((r) => r && (overview.value = r)).catch(() => {}),
      statsApi.getTrend(14).then((r) => (trend.value = r?.trend ?? [])).catch(() => (trend.value = [])),
      statsApi
        .getGroups({ page: 1, size: 200, sort: 'total', order: 'desc' })
        .then((r) => (groups.value = r?.list ?? []))
        .catch(() => (groups.value = [])),
      statsApi.getGames().then((r) => (cacheSlices.value = r?.cache?.length ? r.cache : (r?.profile ?? []))).catch(() => (cacheSlices.value = [])),
      statsApi
        .getUsers({ page: 1, size: 1 })
        .then((r) => {
          if (r?.summary) userCount.value = r.summary.userCount;
        })
        .catch(() => {}),
    ];
    await Promise.all(jobs);
    booting.value = false;
    await nextTick();
    renderAll();
  }

  /* 时钟 + 轮询 */
  let clockTimer: ReturnType<typeof setInterval> | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  function tickClock() {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    clock.value = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  watch(isFullscreen, () => nextTick(renderAll));

  onMounted(() => {
    tickClock();
    loadAll();
    clockTimer = setInterval(tickClock, 1000);
    pollTimer = setInterval(loadAll, 30_000);
  });

  onBeforeUnmount(() => {
    if (clockTimer) clearInterval(clockTimer);
    if (pollTimer) clearInterval(pollTimer);
  });
</script>

<style lang="less">
  /* 大屏页固定深海蓝科技风，不随主题切换 —— 故用全局样式（非 scoped）便于覆盖 echarts 容器 */

  .scr {
    --scr-ice: #4fc3f7;
    --scr-gold: #d4af37;
    --scr-text: #e6f2fc;
    --scr-sub: #a7bdd2;
    --scr-mute: rgba(167, 189, 210, 0.62);
    --scr-line: rgba(79, 195, 247, 0.22);
    --scr-panel: rgba(13, 32, 51, 0.72);
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: calc(100vh - 130px);
    padding: 14px 16px 10px;
    color: var(--scr-text);
    background:
      radial-gradient(900px 300px at 50% -60px, rgba(79, 195, 247, 0.14), transparent 70%),
      linear-gradient(0deg, rgba(79, 195, 247, 0.045) 1px, transparent 1px) 0 0 / 100% 30px,
      linear-gradient(90deg, rgba(79, 195, 247, 0.045) 1px, transparent 1px) 0 0 / 30px 100%,
      linear-gradient(165deg, #081422 0%, #0b1c2e 55%, #0d2033 100%);
    border-radius: 14px;
    border: 1px solid var(--scr-line);
  }

  /* ---------------- 顶栏 ---------------- */
  .scr-head {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 14px;
    align-items: center;
    padding: 10px 18px;
    background: linear-gradient(180deg, rgba(79, 195, 247, 0.10), rgba(79, 195, 247, 0.02));
    border: 1px solid var(--scr-line);
    border-radius: 12px;
  }

  .scr-head__title {
    display: flex;
    gap: 14px;
    align-items: center;
  }

  .scr-head__title h1 {
    margin: 0;
    font-size: 21px;
    font-weight: 800;
    letter-spacing: 6px;
    color: var(--scr-text);
    text-shadow: 0 0 18px rgba(79, 195, 247, 0.55);
    white-space: nowrap;
  }

  .scr-head__wing {
    width: 120px;
    height: 8px;
    opacity: 0.8;
    clip-path: polygon(0 50%, 18% 0, 100% 0, 100% 100%, 18% 100%);
  }

  .scr-head__wing--l {
    background: linear-gradient(90deg, transparent, var(--scr-ice));
    clip-path: polygon(0 50%, 18% 0, 100% 0, 100% 100%, 18% 100%);
  }

  .scr-head__wing--r {
    transform: scaleX(-1);
    background: linear-gradient(90deg, transparent, var(--scr-ice));
  }

  .scr-head__side {
    display: flex;
    gap: 10px;
    align-items: center;
    font-size: 12.5px;
    color: var(--scr-sub);
  }

  .scr-head__side--r {
    justify-content: flex-end;
  }

  .scr-clock {
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 14px;
    font-weight: 650;
    color: var(--scr-ice);
    font-variant-numeric: tabular-nums;
    text-shadow: 0 0 12px rgba(79, 195, 247, 0.5);
  }

  .scr-head__side .ant-btn-theme {
    color: var(--scr-sub);
    background: transparent;
    border-color: var(--scr-line);
  }

  .scr-bot {
    display: inline-flex;
    gap: 7px;
    align-items: center;
    font-weight: 600;
    color: var(--scr-text);
  }

  .scr-bot__dot,
  .scr-bot-row i {
    width: 8px;
    height: 8px;
    background: var(--scr-ice);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--scr-ice);
    animation: scr-breathe 2.2s ease-in-out infinite;
  }

  .scr-bot__dot.is-off {
    background: #e0664a;
    box-shadow: 0 0 8px #e0664a;
  }

  @keyframes scr-breathe {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.45;
    }
  }

  .scr-chip {
    padding: 2px 9px;
    font-size: 11px;
    color: var(--scr-ice);
    background: rgba(79, 195, 247, 0.10);
    border: 1px solid var(--scr-line);
    border-radius: 20px;
  }

  /* ---------------- KPI ---------------- */
  .scr-kpi {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .scr-kpi__card {
    position: relative;
    display: flex;
    gap: 11px;
    align-items: center;
    padding: 13px 15px;
    background: var(--scr-panel);
    border: 1px solid var(--scr-line);
    border-radius: 12px;
  }

  .scr-kpi__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .scr-kpi__label {
    font-size: 11.5px;
    color: var(--scr-mute);
    white-space: nowrap;
  }

  .scr-kpi__value {
    margin-top: 1px;
    font-size: 20px;
    font-weight: 750;
    color: var(--scr-text);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.3px;
  }

  .scr-kpi__value small {
    margin-left: 3px;
    font-size: 10.5px;
    font-weight: 400;
    color: var(--scr-mute);
  }

  /* 面板四角折角装饰（大屏经典元素） */
  .corner {
    position: absolute;
    width: 12px;
    height: 12px;
    border: 2px solid var(--scr-ice);
    opacity: 0.75;
    pointer-events: none;
  }

  .corner--tl {
    top: -1px;
    left: -1px;
    border-right: 0;
    border-bottom: 0;
    border-top-left-radius: 8px;
  }

  .corner--tr {
    top: -1px;
    right: -1px;
    border-bottom: 0;
    border-left: 0;
    border-top-right-radius: 8px;
  }

  .corner--bl {
    bottom: -1px;
    left: -1px;
    border-top: 0;
    border-right: 0;
    border-bottom-left-radius: 8px;
  }

  .corner--br {
    right: -1px;
    bottom: -1px;
    border-top: 0;
    border-left: 0;
    border-bottom-right-radius: 8px;
  }

  .scr-kpi__card .corner--tl,
  .scr-kpi__card .corner--br {
    opacity: 0.5;
  }

  /* ---------------- 主区 ---------------- */
  .scr-main {
    display: grid;
    flex: 1 1 auto;
    gap: 12px;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.95fr) minmax(0, 1.15fr);
  }

  .scr-col {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }

  .scr-panel {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 12px 14px;
    background: var(--scr-panel);
    border: 1px solid var(--scr-line);
    border-radius: 12px;
  }

  .scr-panel--grow {
    flex: 1 1 auto;
  }

  .scr-panel__head {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
    font-size: 13.5px;
    font-weight: 650;
    color: var(--scr-text);
    letter-spacing: 1px;
  }

  .scr-panel__tag {
    width: 4px;
    height: 14px;
    background: linear-gradient(180deg, var(--scr-ice), transparent);
    border-radius: 2px;
    box-shadow: 0 0 8px rgba(79, 195, 247, 0.6);
  }

  .scr-panel__extra {
    margin-left: auto;
    font-size: 10.5px;
    font-style: normal;
    font-weight: 400;
    letter-spacing: 0;
    color: var(--scr-mute);
  }

  .scr-chart--trend {
    height: 218px;
  }

  .scr-chart--donut {
    height: 208px;
  }

  .scr-chart--gauge {
    width: 50%;
    height: 168px;
  }

  .scr-gauges {
    display: flex;
  }

  .scr-empty {
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    font-size: 12px;
    color: var(--scr-mute);
  }

  .scr-empty--sm {
    min-height: 48px;
  }

  /* 群消息排行 */
  .scr-rank {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    justify-content: space-around;
  }

  .scr-rank__row {
    display: grid;
    grid-template-columns: 22px minmax(80px, 0.9fr) minmax(0, 1fr) 56px;
    gap: 10px;
    align-items: center;
  }

  .scr-rank__no {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    font-size: 11px;
    font-weight: 700;
    color: var(--scr-mute);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 5px;
  }

  .scr-rank__no.is-1,
  .scr-rank__no.is-2,
  .scr-rank__no.is-3 {
    color: #0a1929;
    border-color: transparent;
  }

  .scr-rank__no.is-1 {
    background: linear-gradient(135deg, #f5dd9a, var(--scr-gold));
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
  }

  .scr-rank__no.is-2 {
    background: linear-gradient(135deg, #dfe7ee, #a9b9c6);
  }

  .scr-rank__no.is-3 {
    background: linear-gradient(135deg, #eec9a8, #c98a58);
  }

  .scr-rank__name {
    overflow: hidden;
    font-size: 12px;
    font-weight: 600;
    color: var(--scr-sub);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .scr-rank__track {
    height: 6px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 4px;
  }

  .scr-rank__track i {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, rgba(79, 195, 247, 0.35), var(--scr-ice));
    border-radius: 4px;
    box-shadow: 0 0 8px rgba(79, 195, 247, 0.45);
    transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .scr-rank__val {
    font-size: 12px;
    font-weight: 650;
    color: var(--scr-text);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* 内存条 */
  .scr-membar {
    display: grid;
    grid-template-columns: 1fr minmax(0, 1.4fr) 44px;
    gap: 10px;
    align-items: center;
    padding-top: 8px;
    margin-top: 2px;
    border-top: 1px dashed rgba(79, 195, 247, 0.18);
  }

  .scr-membar__label {
    font-size: 11px;
    color: var(--scr-mute);

    b {
      margin: 0 3px;
      color: var(--scr-sub);
      font-variant-numeric: tabular-nums;
    }
  }

  .scr-membar__track {
    height: 7px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 4px;
  }

  .scr-membar__track i {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, rgba(98, 168, 234, 0.4), #62a8ea);
    border-radius: 4px;
    transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .scr-membar__pct {
    font-size: 12px;
    font-weight: 650;
    color: var(--scr-text);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* 系统信息 */
  .scr-info {
    display: grid;
    gap: 6px 14px;
    grid-template-columns: 1fr 1fr;
    margin-bottom: 10px;
  }

  .scr-info__item {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 7px 10px;
    background: rgba(79, 195, 247, 0.05);
    border: 1px solid rgba(79, 195, 247, 0.12);
    border-radius: 9px;

    span {
      font-size: 10.5px;
      color: var(--scr-mute);
    }

    b {
      overflow: hidden;
      margin-top: 2px;
      font-size: 11.5px;
      font-weight: 600;
      color: var(--scr-text);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .scr-bots__title {
    margin-bottom: 6px;
    font-size: 12px;
    color: var(--scr-mute);
  }

  .scr-bot-row {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 7px 10px;
    background: rgba(69, 185, 124, 0.07);
    border: 1px solid rgba(69, 185, 124, 0.18);
    border-radius: 9px;

    b {
      font-size: 12.5px;
      color: var(--scr-text);
    }

    span {
      margin-left: auto;
      font-size: 11px;
      color: var(--scr-mute);
    }
  }

  /* 最近活跃群 */
  .scr-recent {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    justify-content: space-around;
    gap: 4px;
  }

  .scr-recent__row {
    display: grid;
    grid-template-columns: minmax(70px, 0.85fr) minmax(0, 1.1fr) 56px;
    gap: 10px;
    align-items: center;
  }

  .scr-recent__name {
    overflow: hidden;
    font-size: 12px;
    font-weight: 600;
    color: var(--scr-sub);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .scr-spark {
    display: flex;
    gap: 2px;
    align-items: flex-end;
    justify-content: flex-end;
    height: 26px;
  }

  .scr-spark i {
    flex: 1 1 0;
    min-width: 2px;
    max-width: 6px;
    background: linear-gradient(180deg, var(--scr-ice), rgba(79, 195, 247, 0.25));
    border-radius: 2px;
    opacity: 0.9;
  }

  .scr-recent__val {
    font-size: 12px;
    font-weight: 650;
    color: var(--scr-text);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* 底栏 */
  .scr-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 14px;
    font-size: 11px;
    color: var(--scr-mute);
    background: rgba(79, 195, 247, 0.04);
    border: 1px solid rgba(79, 195, 247, 0.12);
    border-radius: 9px;
  }

  /* ---------------- 响应式 ---------------- */
  @media (max-width: 1360px) {
    .scr-main {
      grid-template-columns: 1fr 1fr;
    }

    .scr-col--mid {
      grid-column: span 2;
      flex-direction: row;

      .scr-panel {
        flex: 1 1 0;
      }
    }
  }

  @media (max-width: 1500px) and (min-width: 1361px) {
    .scr-kpi {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 900px) {
    .scr-main {
      grid-template-columns: 1fr;
    }

    .scr-col--mid {
      grid-column: auto;
      flex-direction: column;

      .scr-panel {
        flex: initial;
      }
    }

    .scr-kpi {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .scr-head {
      grid-template-columns: 1fr;

      .scr-head__side--l {
        display: none;
      }
    }
  }
</style>
