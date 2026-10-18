<template>
  <PageWrapper title="">
    <div class="g-page home">
      <!-- ============================ 横幅（角色立绘） ============================ -->
      <section class="gm-hero">
        <div class="gm-hero__main">
          <div class="gm-hero__eyebrow">YUNZAI BOT · 运营控制台</div>
          <div class="gm-hero__title">
            {{ greeting }}，管理员
            <em>{{ tip }}</em>
          </div>
          <div class="gm-hero__desc">
            Yunzai-Bot <b class="mono">v{{ conf.version }}</b> · 锅巴 <b class="mono">v{{ conf.guobaVersion }}</b>
            <template v-if="overview.updatedAt"> · 数据更新于 {{ shortTime(overview.updatedAt) }}</template>
          </div>
          <div class="gm-hero__chips">
            <span class="gm-hero__chip">好友 <b>{{ thousands(homeData.friendCount) }}</b></span>
            <span class="gm-hero__chip">群聊 <b>{{ thousands(homeData.groupCount) }}</b></span>
            <span class="gm-hero__chip">Cookie 用户 <b>{{ thousands(homeData.cookieCount) }}</b></span>
            <span class="gm-hero__chip">今日消息 <b>{{ thousands(overview.todayMsg) }}</b></span>
          </div>
        </div>
        <div v-if="artUrl" class="gm-hero__art">
          <div class="gm-hero__art-fg" :style="{ backgroundImage: `url(${artUrl})` }" />
        </div>
        <div class="gm-hero__refresh" :class="{ 'is-loading': artLoading }" @click="loadArt">
          <Icon class="gm-hero__refresh-icon" icon="ant-design:reload-outlined" :size="12" />
          换一张
        </div>
      </section>

      <!-- ============================ 指标卡 ============================ -->
      <section class="gm-kpi">
        <div
          v-for="k in kpis"
          :key="k.key"
          class="gm-kpi__card"
          :style="{ '--g-kpi-accent': k.color, '--g-kpi-soft': k.soft }"
        >
          <span class="gm-kpi__icon">
            <Icon :icon="k.icon" :size="17" />
          </span>
          <div class="gm-kpi__body">
            <div class="gm-kpi__label">{{ k.label }}</div>
            <div class="gm-kpi__value">
              {{ k.value }}<small v-if="k.unit">{{ k.unit }}</small>
            </div>
            <div class="gm-kpi__foot">
              <span v-if="k.delta !== null && k.delta !== undefined" class="gm-delta" :class="deltaClass(k.delta)">
                {{ deltaText(k.delta) }}
              </span>
              <span>{{ k.foot }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================ 趋势 + 游戏分布 ============================ -->
      <section class="gm-grid gm-grid--2-1">
        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon icon="ant-design:line-chart-outlined" :size="13" /></i>
              消息趋势
            </div>
            <div class="gm-panel__extra">
              <GSegmented
                :model-value="trendDays"
                :options="[
                  { value: 7, label: '7 天' },
                  { value: 14, label: '14 天' },
                  { value: 30, label: '30 天' },
                ]"
                size="sm"
                label="趋势区间"
                @update:model-value="setTrendDays($event as number)"
              />
            </div>
          </div>
          <div v-show="!booting" ref="trendRef" class="hm-chart" />
          <div v-if="booting" class="gm-skeleton hm-chart" />
        </div>

        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon icon="ant-design:pie-chart-outlined" :size="13" /></i>
              米游社缓存分布
            </div>
            <span class="gm-panel__extra">{{ thousands(gamesTotal) }} 键</span>
          </div>
          <div v-show="!booting && games.length" ref="gameRef" class="hm-chart" />
          <div v-if="booting" class="gm-skeleton hm-chart" />
          <GEmpty v-if="!booting && !games.length" title="暂无缓存数据" desc="米游社接口产生缓存后自动统计" />
        </div>
      </section>

      <!-- ============================ 群排行 + 运行状态 ============================ -->
      <section class="gm-grid gm-grid--2-1">
        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon icon="ant-design:bar-chart-outlined" :size="13" /></i>
              群活跃排行
            </div>
            <span class="gm-panel__link" @click="go('/groups')">
              查看全部<IonIcon />
            </span>
          </div>
          <div v-if="topGroups.length" class="gm-rank">
            <div v-for="(g, i) in topGroups" :key="g.gid" class="gm-rank__row">
              <span class="gm-rank__no">{{ i + 1 }}</span>
              <div class="gm-rank__name">
                {{ g.name }}
                <span>{{ g.label }}</span>
              </div>
              <div class="gm-rank__bar">
                <div class="gm-rank__fill" :style="{ width: `${g.pct}%` }" />
              </div>
              <span class="gm-rank__val">{{ fmtNum(g.total) }}</span>
            </div>
          </div>
          <GEmpty v-else-if="!booting" title="暂无群消息数据" desc="群内产生消息后即可统计" />
          <div v-else class="gm-skeleton hm-rank-skeleton" />
        </div>

        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon icon="ant-design:thunderbolt-outlined" :size="13" /></i>
              运行状态
            </div>
            <span class="gm-panel__extra">实时</span>
          </div>
          <div class="gm-meter" v-for="m in meters" :key="m.label" :style="`--g-meter-from:${m.from};--g-meter-to:${m.to}`">
            <div class="gm-meter__head">
              <span>{{ m.label }}</span>
              <b>{{ m.value }}%</b>
            </div>
            <div class="gm-meter__track">
              <div class="gm-meter__fill" :style="{ width: `${m.value}%` }" />
            </div>
            <div class="gm-meter__note">{{ m.note }}</div>
          </div>
        </div>
      </section>

      <!-- ============================ 用户排行 + 插件体量 ============================ -->
      <section class="gm-grid gm-grid--1-1">
        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon icon="ant-design:team-outlined" :size="13" /></i>
              用户消息排行
            </div>
            <span class="gm-panel__link" @click="go('/users-data')">查看全部›</span>
          </div>
          <div v-if="userRows.length" class="gm-rank">
            <div v-for="(u, i) in userRows" :key="u.uid" class="gm-rank__row">
              <span class="gm-rank__no">{{ i + 1 }}</span>
              <div class="gm-rank__name">
                {{ u.name || u.uid }}
                <span>{{ u.activeDays }} 天活跃</span>
              </div>
              <div class="gm-rank__bar">
                <div class="gm-rank__fill" :style="{ width: `${u.pct}%` }" />
              </div>
              <span class="gm-rank__val">{{ fmtNum(u.total) }}</span>
            </div>
          </div>
          <GEmpty v-else-if="!booting" title="暂无用户消息数据" desc="用户维度计数键尚未生成" />
          <div v-else class="gm-skeleton hm-rank-skeleton" />
        </div>

        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon icon="ant-design:api-outlined" :size="13" /></i>
              插件数据体量
            </div>
            <span class="gm-panel__link" @click="go('/plugins-data')">查看全部›</span>
          </div>
          <div v-if="nsRows.length" class="gm-rank">
            <div v-for="(n, i) in nsRows" :key="n.ns" class="gm-rank__row">
              <span class="gm-rank__no">{{ i + 1 }}</span>
              <div class="gm-rank__name">
                {{ n.label }}
                <span>{{ n.owner }}</span>
              </div>
              <div class="gm-rank__bar">
                <div class="gm-rank__fill" :style="{ width: `${n.pct}%` }" />
              </div>
              <span class="gm-rank__val">{{ fmtNum(n.keys) }}</span>
            </div>
          </div>
          <GEmpty v-else-if="!booting" title="暂无命名空间数据" desc="Redis 扫描完成后即可查看" />
          <div v-else class="gm-skeleton hm-rank-skeleton" />
        </div>
      </section>

      <!-- ============================ 快捷入口 ============================ -->
      <section class="g-card">
        <div class="gm-panel__head">
          <div class="gm-panel__title">
            <i><Icon icon="ant-design:appstore-outlined" :size="13" /></i>
            快捷入口
          </div>
          <span class="gm-panel__extra">常用模块直达</span>
        </div>
        <div class="gm-tiles">
          <div
            v-for="t in tiles"
            :key="t.path"
            class="gm-tile"
            :style="{ '--g-tile-accent': t.color, '--g-tile-soft': t.soft }"
            @click="go(t.path)"
          >
            <span class="gm-tile__icon"><Icon :icon="t.icon" :size="17" /></span>
            <span class="gm-tile__name">{{ t.title }}</span>
            <span class="gm-tile__desc">{{ t.desc }}</span>
          </div>
        </div>
      </section>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { PageWrapper } from '/@/components/Page';
  import { Icon } from '/@/components/Icon';
  import { defHttp } from '/@/utils/http/axios';
  import { useECharts } from '/@/hooks/web/useECharts';
  import { useRootSetting } from '/@/hooks/setting/useRootSetting';
  import { ThemeEnum } from '/@/enums/appEnum';
  import { sysApi } from '/@/api/guoba';
  import GEmpty from '../system/_shared/GEmpty.vue';
  import GSegmented from '../system/_shared/form/GSegmented.vue';
  import { adminApi } from '../system/account/api';
  import type { OverviewCards, TrendPoint } from '../system/_shared/stats';
  import {
    areaGradient,
    chartBase,
    chartColors,
    fmtNum,
    hexToRgba,
    primaryColor,
    secondaryColor,
    shortGid,
    statsApi,
    thousands,
  } from '../system/_shared/stats';

  defineOptions({ name: 'Home' });

  /** 小箭头（避免额外图标依赖） */
  const IonIcon = defineComponent({
    name: 'IonIcon',
    render: () => h('span', { style: 'font-size:11px;opacity:.7' }, '›'),
  });

  const router = useRouter();
  const { getDarkMode } = useRootSetting();
  const isDark = computed(() => unref(getDarkMode) === ThemeEnum.DARK);
  const primary = computed(() => primaryColor(isDark.value));
  const secondary = computed(() => secondaryColor(isDark.value));

  const booting = ref(true);
  const overview = ref<Partial<OverviewCards>>({});
  const homeData = ref<Record<string, any>>({});
  const admin = ref<any>({});
  const userSummary = ref<any>({});
  const trendAll = ref<TrendPoint[]>([]);
  const trend = ref<TrendPoint[]>([]);
  const trendDays = ref(14);
  const games = ref<{ label: string; count: number }[]>([]);
  const groupRows = ref<any[]>([]);
  const userRows = ref<{ uid: string; name?: string; total: number; activeDays: number; pct: number }[]>([]);
  const nsRows = ref<{ ns: string; label: string; owner: string; keys: number; pct: number }[]>([]);

  const conf = computed(() => (window as any).__YUNZAI_BOT_CONF__ ?? {});

  const greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 6) return '夜深了';
    if (h < 9) return '早上好';
    if (h < 12) return '上午好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    return '晚上好';
  });

  const tip = computed(() => {
    const h = new Date().getHours();
    if (h < 6) return '机器人还在值守';
    if (h < 9) return '今日又是新的一天';
    if (h < 18) return '一切运行正常';
    return '今日数据已汇总';
  });

  function mk(color: string, alpha = 0.14) {
    return { color, soft: hexToRgba(color, alpha) };
  }

  const palette = computed(() => {
    const d = isDark.value;
    return {
      blue: mk(d ? '#62A8EA' : '#2F86C4'),
      cyan: mk(d ? '#4FC3D9' : '#2E93B8'),
      green: mk(d ? '#45B97C' : '#2E7A58'),
      violet: mk(d ? '#9D8DF0' : '#8D83E8'),
      amber: mk(d ? '#D3BC8D' : '#A8813F'),
      rose: mk(d ? '#FF8A65' : '#A9496B'),
    };
  });

  function pct(a: number, b: number) {
    if (!b) return 0;
    return Math.min(100, Math.round((a / b) * 100));
  }

  const todayDelta = computed(() => {
    const t = trendAll.value;
    if (t.length < 2) return null;
    const cur = t[t.length - 1]?.total ?? 0;
    const prev = t[t.length - 2]?.total ?? 0;
    if (!prev) return cur ? 100 : 0;
    return Math.round(((cur - prev) / prev) * 1000) / 10;
  });

  const kpis = computed(() => {
    const p = palette.value;
    const today = overview.value.todayMsg ?? 0;
    const total = overview.value.totalMsg ?? 0;
    const users = userSummary.value.userCount ?? 0;
    const activeUsers = userSummary.value.activeToday ?? 0;
    const groups = overview.value.groupCount ?? homeData.value.groupCount ?? 0;
    const acc = admin.value.accounts ?? {};
    const pv = trendAll.value;
    const yesterday = pv.length >= 2 ? pv[pv.length - 2]?.total ?? 0 : 0;
    return [
      {
        key: 'today',
        label: '今日消息',
        icon: 'ant-design:message-outlined',
        value: thousands(today),
        unit: '条',
        delta: todayDelta.value,
        foot: `较昨日 ${thousands(yesterday)} 条`,
        ...p.blue,
      },
      {
        key: 'total',
        label: '累计消息',
        icon: 'ant-design:database-outlined',
        value: fmtNum(total),
        unit: '条',
        delta: null,
        foot: `群维度收发合计`,
        ...p.cyan,
      },
      {
        key: 'users',
        label: '用户总数',
        icon: 'ant-design:team-outlined',
        value: thousands(users),
        unit: '人',
        delta: null,
        foot: `今日活跃 ${thousands(activeUsers)} 人`,
        ...p.violet,
      },
      {
        key: 'groups',
        label: '群聊数量',
        icon: 'ant-design:appstore-outlined',
        value: thousands(groups),
        unit: '个',
        delta: null,
        foot: `今日活跃 ${overview.value.activeToday ?? 0} 个`,
        ...p.green,
      },
      {
        key: 'ck',
        label: 'Cookie 账号',
        icon: 'ant-design:key-outlined',
        value: thousands(acc.total ?? 0),
        unit: '个',
        delta: null,
        foot: `有效 ${acc.ckOk ?? 0} · 异常 ${acc.expired ?? 0}`,
        ...p.amber,
      },
      {
        key: 'redis',
        label: 'Redis 键数',
        icon: 'ant-design:cloud-server-outlined',
        value: thousands(overview.value.redisKeys ?? 0),
        unit: '条',
        delta: null,
        foot: `${overview.value.namespaces ?? 0} 个命名空间`,
        ...p.rose,
      },
    ];
  });

  function deltaClass(d: number) {
    if (!d) return 'gm-delta--flat';
    return d > 0 ? 'gm-delta--up' : 'gm-delta--down';
  }

  function deltaText(d: number) {
    const arrow = d > 0 ? '↑' : d < 0 ? '↓' : '·';
    return `${arrow} ${Math.abs(d)}%`;
  }

  const gamesTotal = computed(() => games.value.reduce((s, g) => s + (g.count || 0), 0));

  const topGroups = computed(() => {
    const rows = [...groupRows.value].slice(0, 8);
    const max = rows.reduce((m, r) => Math.max(m, r.total || 0), 0) || 1;
    return rows.map((r) => ({
      gid: r.gid,
      name: r.name || `群 ${shortGid(r.gid)}`,
      label: r.activeDays ? `活跃 ${r.activeDays} 天` : '今日新增',
      total: r.total || 0,
      pct: Math.max(3, Math.round(((r.total || 0) / max) * 100)),
    }));
  });

  const meters = computed(() => {
    const d = isDark.value;
    const groupTotal = overview.value.groupCount || homeData.value.groupCount || 0;
    const activeGroups = overview.value.activeToday || 0;
    const acc = admin.value.accounts ?? {};
    const u = admin.value.users ?? {};
    const activeUsers = userSummary.value.activeToday || 0;
    const userTotal = userSummary.value.userCount || 0;
    return [
      {
        label: '群活跃率',
        value: pct(activeGroups, groupTotal),
        note: `${activeGroups} / ${groupTotal} 个群今日有消息`,
        from: d ? '#62A8EA' : '#2F86C4',
        to: d ? '#4FC3D9' : '#4FA8D8',
      },
      {
        label: '用户活跃率',
        value: pct(activeUsers, userTotal),
        note: `${thousands(activeUsers)} / ${thousands(userTotal)} 位用户今日发言`,
        from: d ? '#9D8DF0' : '#8D83E8',
        to: d ? '#62A8EA' : '#4FA8D8',
      },
      {
        label: 'Cookie 有效率',
        value: pct(acc.ckOk ?? 0, acc.total ?? 0),
        note: `有效 ${acc.ckOk ?? 0} 个 · 异常 ${acc.expired ?? 0} 个 · 未校验 ${acc.unknown ?? 0} 个`,
        from: d ? '#45B97C' : '#2E7A58',
        to: d ? '#4FC3D9' : '#4FA8D8',
      },
      {
        label: '账号绑定率',
        value: pct(u.bound ?? 0, u.total ?? 0),
        note: `${u.bound ?? 0} / ${u.total ?? 0} 位用户已绑定米游社账号`,
        from: d ? '#D3BC8D' : '#A8813F',
        to: d ? '#FF8A65' : '#CE7C9B',
      },
    ];
  });

  const tiles = computed(() => {
    const p = palette.value;
    return [
      { path: '/dashboard', title: '数据总览', desc: '命名空间分布', icon: 'ant-design:dashboard-outlined', ...p.blue },
      { path: '/groups', title: '群数据', desc: '活跃与趋势', icon: 'ant-design:appstore-outlined', ...p.green },
      { path: '/users-data', title: '用户数据', desc: '消息排行', icon: 'ant-design:team-outlined', ...p.violet },
      { path: '/plugins-data', title: '插件数据', desc: '键数占比', icon: 'ant-design:api-outlined', ...p.cyan },
      { path: '/account', title: '米游社账号', desc: 'CK 与绑定', icon: 'ant-design:key-outlined', ...p.amber },
      { path: '/uid', title: '游戏 UID', desc: '六游戏归属', icon: 'ant-design:fund-outlined', ...p.rose },
      { path: '/config', title: '配置管理', desc: '写前自动备份', icon: 'ant-design:safety-certificate-outlined', ...p.blue },
      { path: '/plugins', title: '插件管理', desc: '安装与启停', icon: 'ant-design:thunderbolt-outlined', ...p.violet },
    ];
  });

  function go(path: string) {
    router.push(path).catch(() => {});
  }

  function shortTime(iso: string) {
    return String(iso || '').replace('T', ' ').slice(5, 16);
  }

  /* ------------------------------ 立绘 ------------------------------ */

  const artUrl = ref('');
  const artLoading = ref(false);

  async function loadArt() {
    if (artLoading.value) return;
    artLoading.value = true;
    try {
      const res: any = await defHttp.get(
        { url: '/home/random-image', responseType: 'blob' },
        { isTransformResponse: false, isReturnNativeResponse: true },
      );
      const next = URL.createObjectURL(res.data);
      if (artUrl.value) URL.revokeObjectURL(artUrl.value);
      artUrl.value = next;
    } catch {
      artUrl.value = '';
    } finally {
      artLoading.value = false;
    }
  }

  /* ------------------------------ 图表 ------------------------------ */

  const trendRef = ref<HTMLDivElement | null>(null);
  const trendChart = useECharts(trendRef);

  function renderTrend() {
    if (!trend.value.length) return;
    const base = chartBase(isDark.value);
    trendChart.setOptions({
      grid: { top: 34, right: 18, bottom: 26, left: 46 },
      tooltip: { ...base.tooltip, trigger: 'axis' },
      legend: {
        data: ['接收消息', '机器人发送'],
        textStyle: { color: base.text, fontSize: 11 },
        top: 0,
        left: 0,
        itemWidth: 14,
        itemHeight: 8,
        icon: 'roundRect',
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
          name: '接收消息',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: trend.value.map((t) => t.recv),
          lineStyle: { width: 2.4, color: primary.value },
          itemStyle: { color: primary.value },
          areaStyle: { color: areaGradient(trendChart.echarts, primary.value, 0.28) },
        },
        {
          name: '机器人发送',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: trend.value.map((t) => t.send),
          lineStyle: { width: 2.4, color: secondary.value },
          itemStyle: { color: secondary.value },
          areaStyle: { color: areaGradient(trendChart.echarts, secondary.value, 0.16) },
        },
      ],
    });
  }

  const gameRef = ref<HTMLDivElement | null>(null);
  const gameChart = useECharts(gameRef);

  function renderGames() {
    if (!games.value.length) return;
    const base = chartBase(isDark.value);
    const colors = chartColors(isDark.value);
    gameChart.setOptions({
      tooltip: { ...base.tooltip, trigger: 'item', formatter: '{b}<br/>{c} 键（{d}%）' },
      legend: {
        orient: 'vertical',
        right: 4,
        top: 'center',
        itemWidth: 8,
        itemHeight: 8,
        icon: 'circle',
        textStyle: { color: base.text, fontSize: 11.5 },
        formatter: (name: string) => {
          const it = games.value.find((g) => g.label === name);
          return `${name}  ${it?.count ?? 0}`;
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['52%', '74%'],
          center: ['28%', '52%'],
          avoidLabelOverlap: false,
          itemStyle: { borderWidth: 0, borderRadius: 4 },
          label: { show: false },
          labelLine: { show: false },
          data: games.value.map((g, i) => ({
            name: g.label,
            value: g.count,
            itemStyle: { color: colors[i % colors.length] },
          })),
        },
      ],
      graphic: [
        {
          type: 'text',
          left: '20%',
          top: '44%',
          style: {
            text: `共 ${gamesTotal.value}`,
            fill: base.textStrong,
            fontSize: 17,
            fontWeight: 700,
            textAlign: 'center',
          },
        },
        {
          type: 'text',
          left: '23%',
          top: '58%',
          style: { text: '缓存键', fill: base.text, fontSize: 11, textAlign: 'center' },
        },
      ],
    });
  }

  function renderAll() {
    renderTrend();
    renderGames();
  }

  function setTrendDays(d: number) {
    trendDays.value = d;
    trend.value = trendAll.value.slice(-d);
    nextTick(renderTrend);
  }

  /* ------------------------------ 加载 ------------------------------ */

  async function loadData() {
    booting.value = true;
    sysApi
      .getHomeData()
      .then((d) => (homeData.value = d || {}))
      .catch(() => {});
    const [ov, users, tr, gs, ao] = await Promise.allSettled([
      statsApi.getOverview(),
      statsApi.getUsers({ page: 1, size: 1 }),
      statsApi.getTrend(30),
      statsApi.getGames(),
      adminApi.getOverview(),
    ]);
    if (ov.status === 'fulfilled' && ov.value) overview.value = ov.value;
    if (users.status === 'fulfilled') userSummary.value = users.value?.summary ?? {};
    if (tr.status === 'fulfilled') {
      trendAll.value = tr.value?.trend ?? [];
      trend.value = trendAll.value.slice(-trendDays.value);
    }
    if (gs.status === 'fulfilled') {
      const cache = (gs.value?.cache ?? []).filter((g) => (g.count || 0) > 0);
      games.value = [...cache].sort((a, b) => (b.count || 0) - (a.count || 0));
    }
    if (ao.status === 'fulfilled' && ao.value) admin.value = ao.value;

    const [gr, ur, pl] = await Promise.allSettled([
      statsApi.getGroups({ page: 1, size: 8, sort: 'total', order: 'desc' }),
      statsApi.getUsers({ page: 1, size: 8, sort: 'total', order: 'desc' }),
      statsApi.getPlugins(),
    ]);
    if (gr.status === 'fulfilled') groupRows.value = gr.value?.list ?? [];

    if (ur.status === 'fulfilled') {
      const list = (ur.value?.list ?? []).slice(0, 8);
      const max = list.reduce((m: number, r: any) => Math.max(m, r.total || 0), 0) || 1;
      userRows.value = list.map((r: any) => ({
        uid: String(r.uid ?? ''),
        name: r.name || '',
        total: r.total || 0,
        activeDays: r.activeDays || 0,
        pct: Math.max(3, Math.round(((r.total || 0) / max) * 100)),
      }));
    }

    if (pl.status === 'fulfilled') {
      const buckets = [...(pl.value?.buckets ?? [])].sort((a: any, b: any) => (b.keys || 0) - (a.keys || 0));
      const maxKeys = buckets[0]?.keys || 1;
      nsRows.value = buckets.slice(0, 8).map((b: any) => ({
        ns: b.ns,
        label: b.label,
        owner: b.owner || '',
        keys: b.keys || 0,
        pct: Math.max(3, Math.round(((b.keys || 0) / maxKeys) * 100)),
      }));
    }

    booting.value = false;
    await nextTick();
    renderAll();
  }

  watch(isDark, () => nextTick(renderAll));

  // 立绘每 60 秒自动轮换一张
  let artTimer: ReturnType<typeof setInterval> | null = null;

  onMounted(() => {
    loadData();
    loadArt();
    artTimer = setInterval(loadArt, 60_000);
  });

  onBeforeUnmount(() => {
    if (artTimer) clearInterval(artTimer);
  });
</script>

<style scoped lang="less">
  .home {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-weight: 600;
  }

  .hm-chart {
    height: 236px;
  }

  .hm-rank-skeleton {
    height: 236px;
  }
</style>
