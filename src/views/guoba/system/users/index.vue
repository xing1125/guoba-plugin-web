<template>
  <PageWrapper title="">
    <div class="db g-page">
      <!-- 页头 -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">USER ANALYTICS</div>
          <div class="db-hero__title">用户数据</div>
          <div class="db-hero__desc">按用户聚合的消息量、活跃天数与首末活跃时间</div>
        </div>
        <div class="db-hero__side">
          <Button :loading="loading" @click="loadAll">刷新数据</Button>
        </div>
      </section>

      <!-- 概览 -->
      <section class="db-kpi">
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
      </section>

      <!-- 趋势 -->
      <div class="g-card">
        <div class="gm-panel__head">
          <div class="gm-panel__title">
            <i><Icon icon="ant-design:line-chart-outlined" :size="13" /></i>
            用户消息趋势
          </div>
          <span class="gm-panel__extra">最近 {{ trend.length }} 天 · 私聊 + 全部用户维度</span>
        </div>
        <div v-if="loading && !trend.length" class="g-chart g-chart--sm">
          <div class="g-skeleton g-skeleton--chart" />
        </div>
        <div v-show="trend.length" ref="trendRef" class="g-chart g-chart--sm" />
        <GEmpty
          v-if="!loading && !trend.length"
          title="暂无趋势数据"
          desc="用户消息日计数（Yz:count:*:msg:user:*）尚未生成"
        />
      </div>

      <!-- 列表 -->
      <div class="g-card">
        <div class="gm-panel__head">
          <div class="gm-panel__title">
            <i><Icon icon="ant-design:team-outlined" :size="13" /></i>
            用户列表
            <span class="gm-panel__extra" style="margin-left: 8px">共 {{ pager.total }} 人</span>
          </div>
          <div class="toolbar">
            <Input
              v-model:value="query.keyword"
              class="w-220"
              placeholder="搜索用户 ID / 昵称"
              allow-clear
              @press-enter="handleSearch"
            />
            <Select v-model:value="query.sort" class="w-150" :options="sortOptions" @change="handleSearch" />
            <Select v-model:value="query.order" class="w-110" :options="orderOptions" @change="handleSearch" />
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button :loading="loading" @click="loadAll">刷新</Button>
          </div>
        </div>

        <Table
          row-key="uid"
          size="middle"
          :columns="columns"
          :data-source="list"
          :loading="loading"
          :pagination="pagination"
          :scroll="{ x: 1080 }"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'uid'">
              <div class="uid">{{ record.name || shortUid(record.uid) }}</div>
              <div class="g-muted">{{ shortUid(record.uid) }}</div>
            </template>

            <template v-else-if="column.key === 'total'">
              <div class="g-strong">{{ thousands(record.total) }}</div>
              <div class="g-muted">日均 {{ thousands(record.avgDaily) }}</div>
            </template>

            <template v-else-if="column.key === 'ratio'">
              <div class="ratio">
                <div class="ratio__recv" :style="{ width: recvRatio(record), background: primary }" />
                <div class="ratio__send" :style="{ width: sendRatio(record), background: secondary }" />
              </div>
              <div class="ratio__text g-muted">
                收 {{ fmtNum(record.recv) }} · 发 {{ fmtNum(record.send) }}
              </div>
            </template>

            <template v-else-if="column.key === 'span'">
              <div>{{ record.firstDate || '—' }} ~ {{ record.lastDate || '—' }}</div>
              <div class="g-muted">{{ activeText(record.lastDate) }}</div>
            </template>

            <template v-else-if="column.key === 'action'">
              <Button type="link" size="small" @click="openDetail(record)">详情</Button>
            </template>
          </template>
        </Table>
      </div>

      <div v-if="!available && !loading" class="g-card g-section tip">
        <InfoCircleOutlined class="tip__icon" />
        <div>
          <div class="g-strong">暂无用户统计数据</div>
          <div class="g-muted">
            请重启 Bot 让 <span class="g-mono">/api/admin/stats/*</span> 生效，并确认 Redis 中存在
            <span class="g-mono">Yz:count:*:msg:user:*</span> 计数键。
          </div>
        </div>
      </div>
    </div>

    <!-- 用户详情抽屉 -->
    <Drawer :visible="drawer.visible" :title="drawerTitle" width="640" @close="drawer.visible = false">
      <template v-if="detail">
        <div class="detail-stats">
          <div v-for="s in detailStats" :key="s.label" class="detail-stat">
            <div class="g-muted">{{ s.label }}</div>
            <div class="detail-stat__value">{{ s.value }}</div>
          </div>
        </div>

        <div class="drawer-block">
          <div class="block-title">近 30 天消息量</div>
          <div v-if="detail.daily?.length" ref="detailRef" class="g-chart g-chart--sm" />
          <GEmpty v-else title="无逐日数据" desc="该用户近期没有日级计数键" :size="64" />
        </div>

        <div class="drawer-block" v-if="detail.monthly?.length">
          <div class="block-title">月度分布（近 12 个月）</div>
          <div ref="monthRef" class="g-chart g-chart--sm" />
        </div>
      </template>
    </Drawer>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, nextTick, onMounted, reactive, ref, unref, watch } from 'vue';
  import { Button, Drawer, Input, Select, Table } from 'ant-design-vue';
  import { InfoCircleOutlined } from '@ant-design/icons-vue';
  import { PageWrapper } from '/@/components/Page';
  import { Icon } from '/@/components/Icon';
  import { useECharts } from '/@/hooks/web/useECharts';
  import { useRootSetting } from '/@/hooks/setting/useRootSetting';
  import { ThemeEnum } from '/@/enums/appEnum';
  import GEmpty from '../_shared/GEmpty.vue';
  import type { TrendPoint, UserDetailResult, UserRow, UserSummary } from '../_shared/stats';
  import {
    activeText,
    areaGradient,
    chartBase,
    fmtNum,
    hexToRgba,
    kpiPalette,
    primaryColor,
    secondaryColor,
    statsApi,
    thousands,
  } from '../_shared/stats';

  defineOptions({ name: 'Users' });

  const { getDarkMode } = useRootSetting();
  const isDark = computed(() => unref(getDarkMode) === ThemeEnum.DARK);
  const primary = computed(() => primaryColor(isDark.value));
  const secondary = computed(() => secondaryColor(isDark.value));

  const loading = ref(false);
  const available = ref(true);
  const list = ref<UserRow[]>([]);
  const trend = ref<TrendPoint[]>([]);
  const summary = ref<UserSummary>({
    userCount: 0,
    totalMsg: 0,
    activeToday: 0,
    avgPerUser: 0,
  });
  const pager = reactive({ page: 1, size: 20, total: 0 });
  const query = reactive({ keyword: '', sort: 'total', order: 'desc' });

  const sortOptions = [
    { label: '按消息总量', value: 'total' },
    { label: '按接收量', value: 'recv' },
    { label: '按发送量', value: 'send' },
    { label: '按活跃天数', value: 'activeDays' },
    { label: '按日均消息', value: 'avgDaily' },
    { label: '按最近活跃', value: 'lastDate' },
  ];
  const orderOptions = [
    { label: '降序', value: 'desc' },
    { label: '升序', value: 'asc' },
  ];

  const columns = [
    { title: '用户', dataIndex: 'uid', key: 'uid', width: 200, fixed: 'left' as const },
    { title: '消息总量', key: 'total', width: 140 },
    { title: '收发占比', key: 'ratio', width: 190 },
    { title: '活跃天数', dataIndex: 'activeDays', key: 'activeDays', width: 100 },
    { title: '活跃区间', key: 'span', width: 220 },
    { title: '操作', key: 'action', width: 80, fixed: 'right' as const },
  ];

  const pagination = computed(() => ({
    current: pager.page,
    pageSize: pager.size,
    total: pager.total,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (t: number) => `共 ${t} 个用户`,
  }));

  const cards = computed(() => {
    const p = kpiPalette(isDark.value);
    return [
      {
        key: 'users',
        label: '用户总数',
        icon: 'ant-design:team-outlined',
        value: thousands(summary.value.userCount),
        unit: '人',
        foot: `今日活跃 ${summary.value.activeToday} 人`,
        color: p.violet[0],
        color2: p.violet[1],
      },
      {
        key: 'today',
        label: '今日活跃',
        icon: 'ant-design:fire-outlined',
        value: String(summary.value.activeToday),
        unit: '人',
        foot: '今天有消息往来的用户',
        color: p.green[0],
        color2: p.green[1],
      },
      {
        key: 'total',
        label: '累计消息',
        icon: 'ant-design:message-outlined',
        value: fmtNum(summary.value.totalMsg),
        unit: '条',
        foot: '全部用户收发合计',
        color: p.blue[0],
        color2: p.blue[1],
      },
      {
        key: 'avg',
        label: '人均累计',
        icon: 'ant-design:fund-outlined',
        value: fmtNum(summary.value.avgPerUser),
        unit: '条',
        foot: '累计消息 / 用户数',
        color: p.amber[0],
        color2: p.amber[1],
      },
    ];
  });

  function recvRatio(r: UserRow) {
    const t = Math.max(r.recv + r.send, 1);
    return `${(r.recv / t) * 100}%`;
  }

  function sendRatio(r: UserRow) {
    const t = Math.max(r.recv + r.send, 1);
    return `${(r.send / t) * 100}%`;
  }

  function shortUid(uid: string) {
    const s = String(uid || '');
    return s.length <= 24 ? s : `${s.slice(0, 18)}…`;
  }

  /* ------------------------------ 图表 ------------------------------ */

  const trendRef = ref<HTMLDivElement | null>(null);
  const trendChart = useECharts(trendRef);

  function renderTrend() {
    const base = chartBase(isDark.value);
    trendChart.setOptions({
      grid: { top: 20, right: 16, bottom: 24, left: 44 },
      tooltip: { ...base.tooltip, trigger: 'axis' },
      legend: {
        data: ['收到消息', '发送消息'],
        textStyle: { color: base.text, fontSize: 11 },
        top: 0,
        right: 0,
        itemWidth: 14,
      },
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
          name: '收到消息',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: trend.value.map((t) => t.recv),
          lineStyle: { width: 2.4, color: primary.value },
          itemStyle: { color: primary.value },
          areaStyle: { color: areaGradient(trendChart.echarts, primary.value, 0.26) },
        },
        {
          name: '发送消息',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: trend.value.map((t) => t.send),
          lineStyle: { width: 2.4, color: secondary.value },
          itemStyle: { color: secondary.value },
          areaStyle: { color: areaGradient(trendChart.echarts, secondary.value, 0.18) },
        },
      ],
    });
  }

  /* ------------------------------ 数据 ------------------------------ */

  async function loadData() {
    loading.value = true;
    try {
      const res = await statsApi.getUsers({
        keyword: query.keyword || undefined,
        sort: query.sort,
        order: query.order,
        page: pager.page,
        size: pager.size,
      });
      list.value = res?.list ?? [];
      pager.total = res?.total ?? 0;
      trend.value = (res?.trend ?? []).slice(-30);
      if (res?.summary) summary.value = res.summary;
      available.value = !!res?.available;
    } catch {
      list.value = [];
      available.value = false;
    } finally {
      loading.value = false;
      await nextTick();
      renderTrend();
    }
  }

  function loadAll() {
    loadData();
  }

  function handleSearch() {
    pager.page = 1;
    loadData();
  }

  function handleTableChange(pag: any) {
    pager.page = pag?.current ?? 1;
    pager.size = pag?.pageSize ?? 20;
    loadData();
  }

  /* ------------------------------ 详情 ------------------------------ */

  const drawer = reactive<{ visible: boolean; uid: string }>({ visible: false, uid: '' });
  const detail = ref<UserDetailResult | null>(null);
  const detailRef = ref<HTMLDivElement | null>(null);
  const detailChart = useECharts(detailRef);
  const monthRef = ref<HTMLDivElement | null>(null);
  const monthChart = useECharts(monthRef);

  const drawerTitle = computed(() => `用户 ${shortUid(drawer.uid) || ''} 详情`);

  const detailStats = computed(() => {
    const d = detail.value;
    if (!d) return [];
    return [
      { label: '消息总量', value: thousands(d.total) },
      { label: '接收', value: thousands(d.recv) },
      { label: '发送', value: thousands(d.send) },
      { label: '活跃天数', value: `${d.activeDays} 天` },
      { label: '首次活跃', value: d.firstDate || '—' },
      { label: '最近活跃', value: d.lastDate || '—' },
    ];
  });

  async function openDetail(record: UserRow) {
    drawer.uid = record.uid;
    detail.value = { ...record, available: true, daily: [], monthly: [] } as UserDetailResult;
    drawer.visible = true;
    try {
      const res = await statsApi.getUserDetail(record.uid);
      if (res?.available) detail.value = res;
    } catch {
      /* 保持列表数据兜底 */
    }
    await nextTick();
    renderDetail();
    // 抽屉有展开动画，容器高度可能仍为 0，延迟补一次渲染
    setTimeout(() => renderDetail(), 320);
  }

  function renderDetail() {
    const d = detail.value;
    if (!d) return;
    const base = chartBase(isDark.value);
    const daily = d.daily || [];
    if (daily.length && detailRef.value) {
      detailChart.setOptions({
        grid: { top: 16, right: 12, bottom: 24, left: 40 },
        tooltip: { ...base.tooltip, trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: daily.map((x) => x.date.slice(5)),
          axisLine: { lineStyle: { color: base.grid } },
          axisTick: { show: false },
          axisLabel: base.axisLabel,
        },
        yAxis: { type: 'value', axisLabel: base.axisLabel, splitLine: base.splitLine },
        series: [
          {
            type: 'bar',
            data: daily.map((x) => x.n),
            barMaxWidth: 14,
            itemStyle: {
              borderRadius: [4, 4, 0, 0],
              color: new detailChart.echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: secondary.value },
                { offset: 1, color: hexToRgba(primary.value, 0.35) },
              ]),
            },
          },
        ],
      });
    }
    const monthly = d.monthly || [];
    if (monthly.length && monthRef.value) {
      monthChart.setOptions({
        grid: { top: 16, right: 12, bottom: 24, left: 44 },
        tooltip: { ...base.tooltip, trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: monthly.map((x) => x.date),
          axisLine: { lineStyle: { color: base.grid } },
          axisTick: { show: false },
          axisLabel: base.axisLabel,
        },
        yAxis: { type: 'value', axisLabel: base.axisLabel, splitLine: base.splitLine },
        series: [
          {
            type: 'line',
            smooth: true,
            showSymbol: true,
            symbolSize: 5,
            data: monthly.map((x) => x.n),
            lineStyle: { width: 2.4, color: primary.value },
            itemStyle: { color: primary.value },
            areaStyle: { color: areaGradient(monthChart.echarts, primary.value, 0.24) },
          },
        ],
      });
    }
  }

  watch(isDark, () =>
    nextTick(() => {
      renderTrend();
      if (drawer.visible) renderDetail();
    }),
  );

  onMounted(loadAll);
</script>

<style scoped lang="less">

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .w-220 {
    width: 220px;
  }

  .w-150 {
    width: 150px;
  }

  .w-110 {
    width: 110px;
  }

  .ratio {
    display: flex;
    height: 7px;
    overflow: hidden;
    background: var(--g-track);
    border-radius: 4px;
  }

  .ratio__recv {
    background: linear-gradient(90deg, var(--g-gold), var(--g-blue));
    transition: width 0.5s;
  }

  .ratio__send {
    background: linear-gradient(90deg, var(--g-blue), var(--g-violet));
    transition: width 0.5s;
  }

  .ratio__text {
    margin-top: 5px;
  }

  .uid {
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 13px;
    font-weight: 600;
    color: var(--g-text);
    letter-spacing: -0.2px;
  }

  .detail-stats {
    display: grid;
    gap: 10px;
    padding: 14px 16px;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 12px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .detail-stat__value {
    margin-top: 3px;
    font-size: 17px;
    font-weight: 650;
    color: var(--g-text);
    font-variant-numeric: tabular-nums;
  }

  .drawer-block {
    margin-top: 20px;
  }

  .block-title {
    display: flex;
    gap: 8px;
    align-items: baseline;
    margin-bottom: 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--g-text);
  }

  .tip {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    border-color: var(--g-gold-soft);
  }

  .tip__icon {
    margin-top: 2px;
    font-size: 16px;
    color: var(--g-gold);
  }
</style>
