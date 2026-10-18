<template>
  <PageWrapper title="">
    <div class="db g-page">
      <!-- ============================ 页头 ============================ -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">CHECK-IN ANALYTICS</div>
          <div class="db-hero__title">游戏签到</div>
          <div class="db-hero__desc">
            每日签到人次、各游戏完成度与账号级明细
            <span v-if="overview.meta.lastAt" class="db-hero__time">
              · 最近一条 {{ shortTime(overview.meta.lastAt) }}
            </span>
          </div>
        </div>
        <div class="db-hero__side">
          <span class="gm-seg">
            <span
              v-for="d in [7, 14, 30]"
              :key="d"
              class="gm-seg__item"
              :class="{ 'is-active': days === d }"
              @click="setDays(d)"
            >
              {{ d }} 天
            </span>
          </span>
          <Button size="small" :loading="loading" @click="loadAll">刷新</Button>
        </div>
      </section>

      <!-- ============================ 指标卡 ============================ -->
      <section class="db-kpi db-kpi--6">
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

      <!-- ============================ 趋势 + 今日游戏 ============================ -->
      <section class="db-grid db-grid--8-4">
        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon icon="ant-design:line-chart-outlined" :size="13" /></i>
              每日签到趋势
            </div>
            <div class="gm-panel__extra">
              <span class="db-dot" :style="{ background: primary }" />签到人次
              <span class="db-dot" :style="{ background: secondary, marginLeft: 10 }" />成功
              <span class="db-dot" :style="{ background: '#E0664A', marginLeft: 10 }" />失败
            </div>
          </div>
          <div v-show="!booting && overview.trend.length" ref="trendRef" class="db-chart" />
          <div v-if="booting" class="gm-skeleton db-chart" />
          <GEmpty v-if="!booting && !overview.trend.length" title="暂无签到数据" desc="抓到一次签到后就会出现趋势" />
        </div>

        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon icon="ant-design:trophy-outlined" :size="13" /></i>
              今日游戏完成度
            </div>
            <span class="gm-panel__extra">{{ overview.today?.date || '—' }}</span>
          </div>
          <div v-if="overview.games.length" class="sign-games">
            <div v-for="g in overview.games" :key="g.key" class="sign-game">
              <div class="sign-game__top">
                <span class="sign-game__name">
                  <i :style="{ background: g.color }" />
                  {{ g.label }}
                </span>
                <span class="sign-game__val">
                  <b>{{ g.signed }}</b>
                  <em>已签</em>
                  <span v-if="g.unbound" class="sign-game__unbound">未绑 {{ g.unbound }}</span>
                </span>
              </div>
              <div class="sign-game__track">
                <div class="sign-game__fill" :style="{ width: `${g.rate}%`, background: g.color }" />
              </div>
            </div>
          </div>
          <GEmpty v-else-if="!booting" title="暂无游戏维度数据" desc="签到流水里没有解析到游戏段落" />
        </div>
      </section>

      <!-- ============================ 每日汇总 ============================ -->
      <div class="g-card">
        <div class="gm-panel__head">
          <div class="gm-panel__title">
            <i><Icon icon="ant-design:calendar-outlined" :size="13" /></i>
            每日签到汇总
          </div>
          <span class="gm-panel__extra">点「明细」查看当天每个账号的签到结果</span>
        </div>
        <Table
          row-key="date"
          size="middle"
          :columns="dayColumns"
          :data-source="dailyRows"
          :pagination="false"
          :loading="booting"
          :scroll="{ x: 860 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'date'">
              <span class="sign-date">{{ record.date }}</span>
              <span v-if="record.date === overview.today?.date" class="gm-chip" style="margin-left: 6px">今天</span>
            </template>
            <template v-else-if="column.key === 'total'">
              <b class="sign-num">{{ record.total }}</b>
            </template>
            <template v-else-if="column.key === 'ok'">
              <span class="sign-ok">{{ record.ok }}</span>
            </template>
            <template v-else-if="column.key === 'fail'">
              <span :class="record.fail ? 'sign-fail' : 'g-muted'">{{ record.fail }}</span>
            </template>
            <template v-else-if="column.key === 'users'">
              {{ record.users }} 人
            </template>
            <template v-else-if="column.key === 'rate'">
              <div class="sign-rate">
                <div class="sign-rate__track">
                  <div class="sign-rate__fill" :style="{ width: `${record.rate}%` }" />
                </div>
                <span>{{ record.rate }}%</span>
              </div>
            </template>
            <template v-else-if="column.key === 'coinAvg'">
              {{ thousands(record.coinAvg) }}
            </template>
            <template v-else-if="column.key === 'maxDays'">
              {{ record.maxDays }} 天
            </template>
            <template v-else-if="column.key === 'action'">
              <Button type="link" size="small" @click="openDay(record.date)">明细</Button>
            </template>
          </template>
        </Table>
      </div>

      <!-- ============================ 明细 ============================ -->
      <div class="g-card">
        <div class="gm-panel__head">
          <div class="gm-panel__title">
            <i><Icon icon="ant-design:unordered-list-outlined" :size="13" /></i>
            签到流水
            <span class="gm-panel__extra" style="margin-left: 8px">共 {{ pager.total }} 条</span>
          </div>
          <div class="toolbar">
            <Input v-model:value="query.q" class="w-200" placeholder="搜索账号 / 内容" allow-clear @press-enter="search" />
            <Select v-model:value="query.ok" class="w-120" :options="okOptions" placeholder="结果" allow-clear @change="search" />
            <Select v-model:value="query.game" class="w-160" :options="gameOptions" placeholder="游戏" allow-clear @change="search" />
            <Button type="primary" @click="search">查询</Button>
          </div>
        </div>

        <Table
          row-key="time"
          size="middle"
          :columns="recordColumns"
          :data-source="records"
          :loading="loading"
          :pagination="pagination"
          :scroll="{ x: 980 }"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'time'">
              <div class="sign-date">{{ record.time.slice(11, 19) }}</div>
              <div class="g-muted">{{ record.date }}</div>
            </template>
            <template v-else-if="column.key === 'qq'">
              <div class="sign-user">{{ userName(record.qq) }}</div>
              <div class="g-muted mono">{{ record.qq }}</div>
            </template>
            <template v-else-if="column.key === 'result'">
              <span class="gm-chip" :class="record.ok ? 'sign-chip--ok' : 'sign-chip--fail'">
                {{ record.ok ? '成功' : '失败' }}
              </span>
              <span class="g-muted" style="margin-left: 6px">{{ record.source }}</span>
            </template>
            <template v-else-if="column.key === 'games'">
              <div class="sign-tags">
                <span
                  v-for="g in record.games"
                  :key="g.key"
                  class="sign-tag"
                  :class="`is-${g.status}`"
                  :title="g.text"
                >
                  {{ gameShort(g.key) }}
                  <em v-if="g.status === 'signed' && g.days">{{ g.days }}d</em>
                </span>
                <span v-if="!record.games.length" class="g-muted">—</span>
              </div>
            </template>
            <template v-else-if="column.key === 'coins'">
              <span v-if="record.coins?.current != null">{{ thousands(record.coins.current) }}</span>
              <span v-else class="g-muted">—</span>
            </template>
            <template v-else-if="column.key === 'action'">
              <Button type="link" size="small" @click="openRecord(record)">查看</Button>
            </template>
          </template>
        </Table>
      </div>

      <div v-if="!booting && !overview.available" class="g-card db-tip">
        <Icon icon="ant-design:info-circle-outlined" :size="16" />
        <div>
          <b>没有找到签到流水</b>
          <div class="g-muted">
            数据来自荷花签到插件：
            <span class="mono">Lotus-Plugin/data/audit/checkin.jsonl</span>，执行一次签到后即会生成。
          </div>
        </div>
      </div>
    </div>

    <!-- ============================ 某天明细抽屉 ============================ -->
    <Drawer :visible="dayDrawer.visible" :title="`${dayDrawer.date} 签到明细`" width="720" @close="dayDrawer.visible = false">
      <template v-if="dayData">
        <div class="day-stats">
          <div v-for="s in dayStats" :key="s.label" class="day-stat">
            <div class="g-muted">{{ s.label }}</div>
            <div class="day-stat__value">{{ s.value }}</div>
          </div>
        </div>

        <div class="drawer-block">
          <div class="block-title">各游戏签到人数</div>
          <div class="sign-games">
            <div v-for="g in dayGames" :key="g.key" class="sign-game">
              <div class="sign-game__top">
                <span class="sign-game__name"><i :style="{ background: g.color }" />{{ g.label }}</span>
                <span class="sign-game__val"><b>{{ g.signed }}</b><em>已签</em></span>
              </div>
              <div class="sign-game__track">
                <div class="sign-game__fill" :style="{ width: `${g.rate}%`, background: g.color }" />
              </div>
            </div>
          </div>
        </div>

        <div class="drawer-block">
          <div class="block-title">账号明细（{{ dayData.userList.length }} 人）</div>
          <Table
            row-key="qq"
            size="small"
            :columns="dayUserColumns"
            :data-source="dayData.userList"
            :pagination="{ pageSize: 10, size: 'small' }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'qq'">
                <div class="sign-user">{{ userName(record.qq) }}</div>
                <div class="g-muted mono">{{ record.qq }}</div>
              </template>
              <template v-else-if="column.key === 'games'">
                <div class="sign-tags">
                  <span v-for="(d, k) in record.games" :key="k" class="sign-tag is-signed">
                    {{ gameShort(k) }}<em v-if="d">{{ d }}d</em>
                  </span>
                </div>
              </template>
              <template v-else-if="column.key === 'coins'">
                {{ record.coins != null ? thousands(record.coins) : '—' }}
              </template>
            </template>
          </Table>
        </div>
      </template>
      <div v-else class="gm-skeleton" style="height: 240px" />
    </Drawer>

    <!-- 单条流水详情 -->
    <Modal
      v-model:visible="recordModal.visible"
      title="签到记录详情"
      :width="640"
      :footer="null"
    >
      <Descriptions :column="2" size="small" bordered>
        <DescriptionsItem label="时间">{{ recordModal.model.time }}</DescriptionsItem>
        <DescriptionsItem label="账号">{{ recordModal.model.qqName }}</DescriptionsItem>
        <DescriptionsItem label="结果">{{ recordModal.model.result }}</DescriptionsItem>
        <DescriptionsItem label="来源">{{ recordModal.model.source }}</DescriptionsItem>
        <DescriptionsItem label="游戏" :span="2">{{ recordModal.model.games }}</DescriptionsItem>
      </Descriptions>
      <div class="record-raw">
        <div class="record-raw__title">原始返回</div>
        <pre class="record-raw__body">{{ recordModal.model.message }}</pre>
      </div>
    </Modal>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, nextTick, onMounted, reactive, ref, unref, watch } from 'vue';
  import {
    Button,
    Descriptions,
    Drawer,
    Input,
    Modal,
    Select,
    Table,
    message,
  } from 'ant-design-vue';

  const DescriptionsItem = Descriptions.Item;
  import { PageWrapper } from '/@/components/Page';
  import { Icon } from '/@/components/Icon';
  import { useECharts } from '/@/hooks/web/useECharts';
  import { useRootSetting } from '/@/hooks/setting/useRootSetting';
  import { ThemeEnum } from '/@/enums/appEnum';
  import GEmpty from '../_shared/GEmpty.vue';
  import type { SignDay, SignOverview, SignRecord } from './api';
  import { signApi } from './api';
  import {
    areaGradient,
    chartBase,
    chartColors,
    fmtNum,
    kpiPalette,
    primaryColor,
    secondaryColor,
    statsApi,
    thousands,
  } from '../_shared/stats';

  defineOptions({ name: 'SignData' });

  const { getDarkMode } = useRootSetting();
  const isDark = computed(() => unref(getDarkMode) === ThemeEnum.DARK);
  const primary = computed(() => primaryColor(isDark.value));
  const secondary = computed(() => secondaryColor(isDark.value));

  const loading = ref(false);
  const booting = ref(true);
  const days = ref(14);
  const trendRef = ref<HTMLElement | null>(null);
  const trendChart = useECharts(trendRef);

  const overview = ref<SignOverview>({
    available: false,
    meta: { available: false },
    today: null,
    trend: [],
    games: [],
    matrix: { dates: [], games: [] },
    recent: [],
  });

  const records = ref<SignRecord[]>([]);
  const pager = reactive({ page: 1, size: 20, total: 0 });
  const query = reactive<{ q: string; ok: '' | 'ok' | 'fail'; game: string }>({ q: '', ok: '', game: '' });

  const okOptions = [
    { label: '成功', value: 'ok' },
    { label: '失败', value: 'fail' },
  ];
  const GAME_LIST = [
    { label: '米游社', value: 'mys' },
    { label: '原神', value: 'gs' },
    { label: '崩坏：星穹铁道', value: 'sr' },
    { label: '绝区零', value: 'zzz' },
    { label: '崩坏3', value: 'bh3' },
    { label: '崩坏学园2', value: 'bh2' },
    { label: '未定事件簿', value: 'wd' },
  ];
  const gameOptions = GAME_LIST;

  function gameShort(key: string) {
    return GAME_LIST.find((g) => g.value === key)?.label.replace('崩坏：', '').replace('未定事件簿', '未定') ?? key;
  }

  /* ------------------------------ 指标卡 ------------------------------ */

  const cards = computed(() => {
    const p = kpiPalette(isDark.value);
    const t = overview.value.today;
    const s = overview.value.summary;
    return [
      {
        key: 'total',
        label: '今日签到人次',
        icon: 'ant-design:check-square-outlined',
        value: t ? thousands(t.total) : '—',
        unit: t ? '次' : '',
        foot: `${t?.users ?? 0} 个账号 / ${t?.accounts ?? 0} 个 uid`,
        color: p.blue[0],
        color2: p.blue[1],
      },
      {
        key: 'ok',
        label: '今日成功',
        icon: 'ant-design:check-circle-outlined',
        value: t ? thousands(t.ok) : '—',
        unit: t ? '次' : '',
        foot: `成功率 ${t?.rate ?? 0}%`,
        color: p.green[0],
        color2: p.green[1],
      },
      {
        key: 'fail',
        label: '今日失败',
        icon: 'ant-design:close-circle-outlined',
        value: t ? thousands(t.fail) : '—',
        unit: t ? '次' : '',
        foot: t && t.fail ? '需要检查 CK 或绑定' : '全部成功',
        color: p.rose[0],
        color2: p.rose[1],
      },
      {
        key: 'users',
        label: '覆盖账号',
        icon: 'ant-design:team-outlined',
        value: t ? thousands(t.users) : '—',
        unit: t ? '人' : '',
        foot: `历史累计 ${s?.users ?? 0} 人`,
        color: p.violet[0],
        color2: p.violet[1],
      },
      {
        key: 'coin',
        label: '人均米游币',
        icon: 'ant-design:pay-circle-outlined',
        value: t ? fmtNum(t.coinAvg) : '—',
        foot: t ? `今日合计 ${fmtNum(t.coinTotal)}` : '未解析到米游币',
        color: p.amber[0],
        color2: p.amber[1],
      },
      {
        key: 'days',
        label: '最长连续',
        icon: 'ant-design:fire-outlined',
        value: t?.maxDays ?? '—',
        unit: t?.maxDays ? '天' : '',
        foot: `近 ${days.value} 天平均成功率 ${s?.avgOkRate ?? 0}%`,
        color: p.cyan[0],
        color2: p.cyan[1],
      },
    ];
  });

  /* ------------------------------ 每日汇总表 ------------------------------ */

  const dailyRows = computed(() =>
    overview.value.trend
      .slice()
      .reverse()
      .map((t) => ({
        ...t,
        rate: t.total ? Math.round((t.ok / t.total) * 1000) / 10 : 0,
      })),
  );

  const dayColumns = [
    { title: '日期', key: 'date', width: 160, fixed: 'left' as const },
    { title: '签到人次', key: 'total', width: 110 },
    { title: '成功', key: 'ok', width: 90 },
    { title: '失败', key: 'fail', width: 90 },
    { title: '覆盖人数', key: 'users', width: 110 },
    { title: '成功率', key: 'rate', width: 160 },
    { title: '人均米游币', key: 'coinAvg', width: 120 },
    { title: '最长连续', key: 'maxDays', width: 110 },
    { title: '操作', key: 'action', width: 80, fixed: 'right' as const },
  ];

  const recordColumns = [
    { title: '时间', key: 'time', width: 120, fixed: 'left' as const },
    { title: '账号', key: 'qq', width: 200 },
    { title: '结果', key: 'result', width: 140 },
    { title: '游戏状态', key: 'games', width: 300 },
    { title: '米游币', key: 'coins', width: 110 },
    { title: '操作', key: 'action', width: 80, fixed: 'right' as const },
  ];

  const dayUserColumns = [
    { title: '账号', key: 'qq', width: 200 },
    { title: '成功 / 次数', key: 'ok', width: 120 },
    { title: '已签游戏', key: 'games', width: 220 },
    { title: '最长连续', dataIndex: 'days', key: 'days', width: 100 },
    { title: '米游币', key: 'coins', width: 110 },
  ];

  const pagination = computed(() => ({
    current: pager.page,
    pageSize: pager.size,
    total: pager.total,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (t: number) => `共 ${t} 条`,
  }));

  /* ------------------------------ 名字映射 ------------------------------ */

  const nameMap = ref<Record<string, string>>({});

  function userName(qq: string) {
    return nameMap.value[qq] || qq;
  }

  async function loadNames() {
    try {
      const res = await statsApi.getUsers({ page: 1, size: 500, sort: 'total', order: 'desc' });
      const map: Record<string, string> = {};
      for (const u of res?.list ?? []) {
        if (u.uid && u.name) {
          map[u.uid] = u.name;
        }
      }
      nameMap.value = map;
    } catch {
      /* 名字只是锦上添花，失败不影响主流程 */
    }
  }

  /* ------------------------------ 图表 ------------------------------ */

  function renderTrend() {
    if (!trendRef.value || !overview.value.trend.length) {
      return;
    }
    const base = chartBase(isDark.value);
    trendChart.setOptions({
      grid: { top: 18, right: 18, bottom: 26, left: 40 },
      tooltip: { ...base.tooltip, trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: overview.value.trend.map((t) => t.date.slice(5)),
        boundaryGap: false,
        axisLine: { lineStyle: { color: base.grid } },
        axisTick: { show: false },
        axisLabel: base.axisLabel,
      },
      yAxis: { type: 'value', axisLabel: base.axisLabel, splitLine: base.splitLine },
      series: [
        {
          name: '签到人次',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: overview.value.trend.map((t) => t.total),
          lineStyle: { width: 2.4, color: primary.value },
          itemStyle: { color: primary.value },
          areaStyle: { color: areaGradient(trendChart.echarts, primary.value, 0.24) },
        },
        {
          name: '成功',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: overview.value.trend.map((t) => t.ok),
          lineStyle: { width: 2.2, color: secondary.value },
          itemStyle: { color: secondary.value },
          areaStyle: { color: areaGradient(trendChart.echarts, secondary.value, 0.14) },
        },
        {
          name: '失败',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: overview.value.trend.map((t) => t.fail),
          lineStyle: { width: 1.8, color: '#E0664A' },
          itemStyle: { color: '#E0664A' },
        },
      ],
    });
  }

  watch(isDark, () => nextTick(renderTrend));

  /* ------------------------------ 数据 ------------------------------ */

  function shortTime(iso?: string | null) {
    if (!iso) {
      return '';
    }
    return iso.slice(5, 16).replace('T', ' ');
  }

  async function loadAll() {
    loading.value = true;
    try {
      const [ov] = await Promise.all([signApi.getOverview(days.value), loadRecords()]);
      overview.value = ov;
      await nextTick();
      renderTrend();
    } catch (e: any) {
      message.error(e?.message || '加载签到数据失败');
    } finally {
      loading.value = false;
      booting.value = false;
    }
  }

  async function loadRecords() {
    try {
      const res = await signApi.getRecords({
        q: query.q || undefined,
        ok: query.ok || undefined,
        game: query.game || undefined,
        page: pager.page,
        size: pager.size,
      });
      records.value = res?.list ?? [];
      pager.total = res?.total ?? 0;
    } catch (e: any) {
      records.value = [];
      pager.total = 0;
    }
  }

  function search() {
    pager.page = 1;
    loadRecords();
  }

  function setDays(d: number) {
    days.value = d;
    loadAll();
  }

  function handleTableChange(pag: any) {
    pager.page = pag?.current ?? 1;
    pager.size = pag?.pageSize ?? 20;
    loadRecords();
  }

  /* ------------------------------ 某天明细 ------------------------------ */

  const dayDrawer = reactive({ visible: false, date: '' });
  const dayData = ref<SignDay | null>(null);

  async function openDay(date: string) {
    dayDrawer.visible = true;
    dayDrawer.date = date;
    dayData.value = null;
    try {
      dayData.value = await signApi.getDay(date);
    } catch {
      dayData.value = null;
    }
  }

  const dayStats = computed(() => {
    const d = dayData.value;
    if (!d) {
      return [];
    }
    return [
      { label: '签到人次', value: d.total },
      { label: '成功', value: d.ok },
      { label: '失败', value: d.fail },
      { label: '覆盖人数', value: d.users },
      { label: '成功率', value: `${d.rate}%` },
      { label: '人均米游币', value: thousands(d.coinAvg) },
    ];
  });

  const dayGames = computed(() => {
    const d = dayData.value;
    if (!d) {
      return [];
    }
    return GAME_LIST.map((g) => {
      const st = d.gameStat?.[g.value] || { signed: 0, unbound: 0, failed: 0 };
      const base = st.signed + st.unbound + st.failed;
      return {
        key: g.value,
        label: g.label,
        color: chartColors(isDark.value)[GAME_LIST.findIndex((x) => x.value === g.value) % 8],
        signed: st.signed,
        rate: base ? Math.round((st.signed / base) * 100) : 0,
      };
    });
  });

  /* ------------------------------ 单条详情 ------------------------------ */

  const recordModal = reactive({
    visible: false,
    model: {} as Record<string, any>,
  });

  function openRecord(r: SignRecord) {
    recordModal.model = {
      time: r.time.replace('T', ' ').slice(0, 19),
      qqName: `${userName(r.qq)}（${r.qq}）`,
      result: r.ok ? '成功' : `失败（${r.stage || 'unknown'}）`,
      source: r.source,
      games: r.games.map((g) => `${g.key}:${g.status}${g.days ? `/${g.days}天` : ''}`).join('  ') || '—',
      message: r.message,
    };
    recordModal.visible = true;
  }

  onMounted(async () => {
    await loadAll();
    loadNames();
  });
</script>

<style scoped lang="less">
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .w-120 {
    width: 120px;
  }

  .w-160 {
    width: 160px;
  }

  .w-200 {
    width: 200px;
  }

  .mono {
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  }

  .sign-date {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    color: var(--g-text);
  }

  .sign-num {
    font-size: 13.5px;
    color: var(--g-text);
  }

  .sign-ok {
    color: var(--g-green);
    font-weight: 600;
  }

  .sign-fail {
    color: #e0664a;
    font-weight: 600;
  }

  .sign-user {
    font-size: 13px;
    font-weight: 600;
    color: var(--g-text);
  }

  .sign-rate {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .sign-rate__track {
    flex: 1 1 auto;
    height: 6px;
    overflow: hidden;
    background: var(--g-track);
    border-radius: 4px;
  }

  .sign-rate__fill {
    height: 100%;
    background: linear-gradient(90deg, var(--g-blue), var(--g-green));
    border-radius: 4px;
    transition: width 0.4s;
  }

  /* 游戏完成度 */
  .sign-games {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .sign-game__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 5px;
  }

  .sign-game__name {
    display: flex;
    gap: 6px;
    align-items: center;
    font-size: 12.5px;
    color: var(--g-text);
  }

  .sign-game__name i {
    width: 8px;
    height: 8px;
    border-radius: 3px;
  }

  .sign-game__val {
    display: flex;
    gap: 6px;
    align-items: baseline;
  }

  .sign-game__val b {
    font-size: 13px;
    color: var(--g-text);
    font-variant-numeric: tabular-nums;
  }

  .sign-game__val em {
    font-size: 11px;
    font-style: normal;
    color: var(--g-text-mute);
  }

  .sign-game__unbound {
    margin-left: 4px;
    font-size: 10.5px;
    color: var(--g-text-mute);
  }

  .sign-game__track {
    height: 7px;
    overflow: hidden;
    background: var(--g-track);
    border-radius: 4px;
  }

  .sign-game__fill {
    height: 100%;
    border-radius: 4px;
    opacity: 0.85;
    transition: width 0.45s;
  }

  /* 游戏徽标 */
  .sign-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .sign-tag {
    display: inline-flex;
    gap: 3px;
    align-items: center;
    padding: 1px 6px;
    font-size: 11px;
    color: var(--g-text-sub);
    background: var(--g-chip-bg);
    border-radius: 5px;
  }

  .sign-tag em {
    font-style: normal;
    color: var(--g-text-mute);
  }

  .sign-tag.is-signed {
    color: var(--g-green);
    background: rgb(69 185 124 / 12%);
  }

  .sign-tag.is-unbound {
    color: var(--g-text-mute);
    background: var(--g-chip-bg);
    opacity: 0.75;
  }

  .sign-tag.is-failed {
    color: #e0664a;
    background: rgb(224 102 74 / 12%);
  }

  .sign-chip--ok {
    color: var(--g-green);
    background: rgb(69 185 124 / 14%);
  }

  .sign-chip--fail {
    color: #e0664a;
    background: rgb(224 102 74 / 14%);
  }

  /* 抽屉 */
  .day-stats {
    display: grid;
    gap: 10px;
    padding: 14px 16px;
    margin-bottom: 16px;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 12px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .day-stat__value {
    margin-top: 3px;
    font-size: 17px;
    font-weight: 650;
    color: var(--g-text);
    font-variant-numeric: tabular-nums;
  }

  .drawer-block {
    margin-bottom: 18px;
  }

  .block-title {
    margin-bottom: 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--g-text);
  }

  .record-raw {
    margin-top: 14px;
  }

  .record-raw__title {
    margin-bottom: 6px;
    font-size: 12.5px;
    color: var(--g-text-sub);
  }

  .record-raw__body {
    max-height: 280px;
    padding: 10px 12px;
    overflow: auto;
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 11.5px;
    line-height: 1.7;
    color: var(--g-text-sub);
    white-space: pre-wrap;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 10px;
  }
</style>
