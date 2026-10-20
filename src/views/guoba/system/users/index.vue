<template>
  <PageWrapper title="">
    <div class="db g-page">
      <!-- 页头 -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">USER ANALYTICS</div>
          <div class="db-hero__title">用户统计</div>
          <div class="db-hero__desc">账号绑定、活跃度、游戏档案与消息行为的用户维度总览</div>
        </div>
        <div class="db-hero__side">
          <Button :loading="loading" @click="loadAll">刷新数据</Button>
        </div>
      </section>

      <!-- 绑定率 + 指标 -->
      <section class="ur-top">
        <div class="g-card ur-bind">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('link')" :size="13" /></i>
              账号绑定率
            </div>
            <span class="gm-panel__extra">米游社 UID</span>
          </div>

          <div class="ur-bind__body">
            <div class="ur-ring">
              <svg viewBox="0 0 120 120" class="ur-ring__svg">
                <circle cx="60" cy="60" r="52" class="ur-ring__track" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  class="ur-ring__value"
                  :stroke-dasharray="ringDash"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div class="ur-ring__label">
                <div class="ur-ring__num">
                  {{ heroReady ? hero.users.bindRate : '—' }}<small v-if="heroReady">%</small>
                </div>
                <div class="ur-ring__cap">已绑定</div>
              </div>
            </div>

            <div class="ur-bind__facts">
              <div class="ur-fact">
                <span class="ur-fact__dot is-total" />
                <span class="ur-fact__label">用户总数</span>
                <span class="ur-fact__value">{{ heroReady ? thousands(hero.users.total) : '—' }}</span>
              </div>
              <div class="ur-fact">
                <span class="ur-fact__dot is-bound" />
                <span class="ur-fact__label">已绑定</span>
                <span class="ur-fact__value">{{ heroReady ? thousands(hero.users.bound) : '—' }}</span>
              </div>
              <div class="ur-fact">
                <span class="ur-fact__dot is-unbound" />
                <span class="ur-fact__label">未绑定</span>
                <span class="ur-fact__value">{{ heroReady ? thousands(unbound) : '—' }}</span>
              </div>
              <div class="ur-bind__hint">
                绑定率来自 <span class="g-mono">Users.ltuids</span>，与账号管理页的
                <span class="g-mono">MysUsers</span> 账号数分开统计。
              </div>
            </div>
          </div>
        </div>

        <div class="ur-metrics">
          <div v-for="m in metrics" :key="m.key" class="g-card ur-metric">
            <div class="ur-metric__top">
              <span class="ur-metric__icon" :style="{ background: m.bg, color: m.fg }">
                <Icon :icon="m.icon" :size="14" />
              </span>
              <span class="ur-metric__label">{{ m.label }}</span>
            </div>
            <div class="ur-metric__value">
              {{ m.value }}<small v-if="m.unit">{{ m.unit }}</small>
            </div>
            <div class="ur-metric__foot">{{ m.foot }}</div>
          </div>
        </div>
      </section>

      <!-- TOP5 + 7 日活性 -->
      <section class="ur-mid">
        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('trophy')" :size="13" /></i>
              最活跃用户 TOP5
            </div>
            <span class="gm-panel__extra">按累计消息量</span>
          </div>
          <div v-if="!heroReady" class="gm-skeleton" style="height: 236px; margin: 12px 0" />
          <GEmpty
            v-else-if="!hero.top.length"
            title="暂无排行"
            desc="用户消息日计数尚未生成"
            :size="64"
          />
          <div v-else class="ur-top5">
            <div v-for="(t, i) in hero.top" :key="t.uid" class="ur-top5__row">
              <span class="ur-top5__rank" :class="`is-${i + 1}`">{{ i + 1 }}</span>
              <span class="ur-top5__avatar" :style="avatarStyle(t.uid)">{{ (t.name || '?').slice(0, 1) }}</span>
              <div class="ur-top5__body">
                <div class="ur-top5__name">{{ t.name || '未命名用户' }}</div>
                <div class="ur-top5__meta">{{ shortUid(t.uid) }} · 活跃 {{ t.activeDays }} 天</div>
              </div>
              <span class="ur-top5__value">{{ fmtNum(t.total) }}</span>
            </div>
          </div>
        </div>

        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('chart-bar')" :size="13" /></i>
              近 7 日消息活性
            </div>
            <span class="gm-panel__extra">合计 {{ fmtNum(hero.message.last7) }} 条</span>
          </div>
          <div class="ur-spark">
            <div v-for="s in spark" :key="s.date" class="ur-spark__col">
              <span class="ur-spark__num">{{ sparkMax ? fmtNum(s.total) : '' }}</span>
              <div class="ur-spark__track">
                <i class="ur-spark__bar" :style="{ height: barHeight(s.total) }" :title="`${s.date} ${s.total} 条`" />
              </div>
              <span class="ur-spark__label">{{ s.date.slice(5) }}</span>
            </div>
          </div>
          <div class="ur-spark__foot">
            <span>今日 {{ fmtNum(hero.message.today) }} 条</span>
            <span>昨日 {{ fmtNum(hero.message.yesterday) }} 条</span>
            <span>近 7 日活跃 {{ hero.active.last7 }} 人</span>
          </div>
        </div>
      </section>

      <!-- 游戏绑定矩阵 -->
      <div class="g-card">
        <div class="gm-panel__head">
          <div class="gm-panel__title">
            <i><Icon :icon="$gm('grid')" :size="13" /></i>
            游戏绑定矩阵
          </div>
          <div class="toolbar">
            <span class="gm-panel__extra">米游社 6 款 + 鸣潮（库街区）</span>
            <button class="ur-link" @click="goAccounts()">进入账号管理 →</button>
          </div>
        </div>

        <div v-if="gamesLoading && !games.length" class="ur-games">
          <div v-for="i in 7" :key="i" class="g-skeleton ur-game-skeleton" />
        </div>
        <div v-else class="ur-games">
          <button
            v-for="g in games"
            :key="g.key"
            class="ur-game"
            :style="{ '--g1': g.from, '--g2': g.to, '--gfg': g.fg }"
            @click="goAccounts(g.key)"
          >
            <div class="ur-game__head">
              <GameIcon :game="g.key" :size="24" />
              <div class="ur-game__title">
                <div class="ur-game__name">{{ g.name }}</div>
                <div class="ur-game__en">{{ g.en }}</div>
              </div>
              <span class="ur-game__rate">{{ g.rate }}%</span>
            </div>

            <div class="ur-game__nums">
              <div>
                <span class="ur-game__num">{{ fmtNum(g.uidCount) }}</span>
                <span class="ur-game__cap">个 UID</span>
              </div>
              <div>
                <span class="ur-game__num">{{ fmtNum(g.accountCount) }}</span>
                <span class="ur-game__cap">个账号</span>
              </div>
            </div>

            <div class="ur-game__bar">
              <i :style="{ width: `${Math.min(100, g.rate)}%` }" />
            </div>

            <div class="ur-game__tags">
              <span class="ur-tag" :class="{ 'is-off': !g.ckSaved }">
                {{ g.source === 'waves' ? '令牌' : 'CK' }} {{ g.ckSaved }}
              </span>
              <span v-if="g.skSupported" class="ur-tag" :class="{ 'is-off': !g.skSaved }">SK {{ g.skSaved }}</span>
              <span v-else class="ur-tag is-ghost">无 SK 体系</span>
            </div>
          </button>
        </div>
      </div>

      <!-- 趋势 -->
      <div class="g-card">
        <div class="gm-panel__head">
          <div class="gm-panel__title">
            <i><Icon :icon="$gm('chart')" :size="13" /></i>
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
            <i><Icon :icon="$gm('users')" :size="13" /></i>
            用户列表
            <span class="gm-panel__extra" style="margin-left: 8px">共 {{ pager.total }} 人</span>
          </div>
          <GToolbar>
            <GSearch v-model="query.keyword" placeholder="搜索用户 ID / 昵称" width="230px" @search="handleSearch" />
            <GSelect v-model="query.sort" :options="sortOptions" width="150px" @change="handleSearch" />
            <GSelect v-model="query.order" :options="orderOptions" width="110px" @change="handleSearch" />
            <template #right>
              <Button type="primary" @click="handleSearch">查询</Button>
              <Button :loading="exporting" :disabled="!pager.total" @click="exportCsv">导出 CSV</Button>
              <Button :loading="loading" @click="loadAll">刷新</Button>
            </template>
          </GToolbar>
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
              <div class="ucell">
                <span class="ucell__avatar" :style="avatarStyle(record.uid)">{{ initialOf(record) }}</span>
                <div class="ucell__body">
                  <div class="ucell__name">{{ record.name || '未命名用户' }}</div>
                  <div class="ucell__id">{{ shortUid(record.uid) }}</div>
                </div>
              </div>
            </template>

            <template v-else-if="column.key === 'total'">
              <div class="g-strong">{{ thousands(record.total) }}</div>
              <div class="g-muted">日均 {{ thousands(record.avgDaily) }}</div>
            </template>

            <template v-else-if="column.key === 'ratio'">
              <div class="mcell__bar">
                <i class="is-recv" :style="{ width: pct(record.recv, record.total) }" />
                <i class="is-send" :style="{ width: pct(record.send, record.total) }" />
              </div>
              <div class="mcell__legend">
                <span><i class="is-recv" />收 {{ fmtNum(record.recv) }}</span>
                <span><i class="is-send" />发 {{ fmtNum(record.send) }}</span>
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

    <!-- 用户详情弹窗（统一居中弹窗，规范见 docs/design-spec.md） -->
    <GModal
      v-model:visible="drawer.visible"
      eyebrow="USER PROFILE"
      title="用户详情"
      :subtitle="drawer.uid"
      size="xl"
      body-height="64vh"
    >
      <div v-if="detail" class="dm">
        <aside class="dm__side">
          <div class="dm-panel">
            <div class="dm-user">
              <span class="dm-user__avatar" :style="avatarStyle(drawer.uid || '')">
                {{ drawerName ? drawerName.slice(0, 1) : '?' }}
              </span>
              <div class="dm-user__body">
                <div class="dm-user__name" :title="drawerName">{{ drawerName || '未命名用户' }}</div>
                <div class="dm-user__id" :title="drawer.uid">{{ drawer.uid }}</div>
              </div>
            </div>

            <div class="dm-stats dm-stats--cols2 dm-stats--divider">
              <div v-for="s in detailStats" :key="s.label" class="dm-stat">
                <span class="dm-stat__label">{{ s.label }}</span>
                <span class="dm-stat__value">{{ s.value }}</span>
              </div>
            </div>
          </div>

          <p class="dm-hint">
            数据来自 <span class="g-mono">Yz:count:*:msg:user:*</span> 日计数键；昵称取自 Bot 运行时好友列表。
          </p>
        </aside>

        <div class="dm__main">
          <section class="dm-block">
            <header class="dm-block__head">
              <span class="dm-block__title">近 30 天消息量</span>
              <span class="dm-block__meta">{{ detail.daily?.length || 0 }} 天有记录</span>
            </header>
            <div v-if="detail.daily?.length" ref="detailRef" class="g-chart g-chart--sm" />
            <GEmpty v-else title="无逐日数据" desc="该用户近期没有日级计数键" :size="64" />
          </section>

          <section v-if="detail.monthly?.length" class="dm-block">
            <header class="dm-block__head">
              <span class="dm-block__title">月度分布</span>
              <span class="dm-block__meta">近 12 个月</span>
            </header>
            <div ref="monthRef" class="g-chart g-chart--sm" />
          </section>
        </div>
      </div>

      <template #footer>
        <Button @click="drawer.visible = false">关闭</Button>
      </template>
    </GModal>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, nextTick, onMounted, reactive, ref, unref, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { Button, Table, message } from 'ant-design-vue';
  import { InfoCircleOutlined } from '@ant-design/icons-vue';
  import { PageWrapper } from '/@/components/Page';
  import { Icon } from '/@/components/Icon';
  import { useECharts } from '/@/hooks/web/useECharts';
  import { useRootSetting } from '/@/hooks/setting/useRootSetting';
  import { ThemeEnum } from '/@/enums/appEnum';
  import GEmpty from '../_shared/GEmpty.vue';
  import GSearch from '../_shared/form/GSearch.vue';
  import GSelect from '../_shared/form/GSelect.vue';
  import GToolbar from '../_shared/form/GToolbar.vue';
  import GModal from '../_shared/dialog/GModal.vue';
  import GameIcon from '../_shared/GameIcon.vue';
  import type {
    TrendPoint,
    UserDetailResult,
    UserHero,
    UserRow,
    UserSummary,
  } from '../_shared/stats';
  import {
    activeText,
    areaGradient,
    chartBase,
    fmtNum,
    hexToRgba,
    primaryColor,
    secondaryColor,
    statsApi,
    thousands,
  } from '../_shared/stats';
  import type { GameOverviewItem } from '../account/gameApi';
  import { gameApi } from '../account/gameApi';
  import { downloadCsv } from '/@/utils/export/csv';
  import { gm } from '/@/design/gmIcons';

  defineOptions({ name: 'Users' });

  const router = useRouter();
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

  /* ------------------------------ hero / 游戏矩阵 ------------------------------ */

  const emptyHero = (): UserHero => ({
    available: false,
    users: { total: 0, bound: 0, bindRate: 0 },
    active: { today: 0, last7: 0, new7: 0 },
    message: { today: 0, yesterday: 0, last7: 0 },
    spark: [],
    top: [],
  });

  const hero = ref<UserHero>(emptyHero());
  /** 首屏未拿到 hero 前不显示 0，避免「先全是 0 再跳数」 */
  const heroReady = ref(false);
  const games = ref<GameOverviewItem[]>([]);
  const gamesLoading = ref(false);

  const unbound = computed(() => Math.max(0, hero.value.users.total - hero.value.users.bound));

  /** 近 7 日活性（hero.spark 为空时补 7 个空点，避免柱区塌陷） */
  const spark = computed(() => {
    const src = hero.value.spark || [];
    if (src.length) return src;
    const out: { date: string; total: number }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(Date.now() - i * 86400000);
      out.push({ date: d.toISOString().slice(0, 10), total: 0 });
    }
    return out;
  });

  const sparkMax = computed(() => Math.max(...spark.value.map((s) => s.total), 1));

  function barHeight(v: number) {
    if (!v) return '4px';
    return `${Math.max(6, Math.round((v / sparkMax.value) * 100))}%`;
  }

  const ringDash = computed(() => {
    const c = 2 * Math.PI * 52;
    const p = Math.min(100, Math.max(0, hero.value.users.bindRate)) / 100;
    return `${(c * p).toFixed(1)} ${(c * (1 - p)).toFixed(1)}`;
  });

  const metrics = computed(() => {
    const v = (n: number) => (heroReady.value ? fmtNum(n) : '—');
    return [
    {
      key: 'today',
      label: '今日活跃',
      icon: gm('fire'),
      value: v(hero.value.active.today),
      unit: '人',
      foot: '今天有消息往来的用户',
      bg: 'rgb(240 164 107 / 16%)',
      fg: '#D07A3C',
    },
    {
      key: 'last7',
      label: '近 7 日活跃',
      icon: gm('calendar-check'),
      value: v(hero.value.active.last7),
      unit: '人',
      foot: `7 日内新增 ${hero.value.active.new7} 人`,
      bg: 'rgb(87 199 149 / 16%)',
      fg: '#329C6C',
    },
    {
      key: 'msg',
      label: '今日消息',
      icon: gm('pulse'),
      value: v(hero.value.message.today),
      unit: '条',
      foot: `昨日 ${fmtNum(hero.value.message.yesterday)} 条`,
      bg: 'rgb(110 155 255 / 16%)',
      fg: '#3F6FD8',
    },
    {
      key: 'avg',
      label: '人均累计',
      icon: gm('chart'),
      value: fmtNum(summary.value.avgPerUser),
      unit: '条',
      foot: `累计 ${fmtNum(summary.value.totalMsg)} 条`,
      bg: 'rgb(155 139 240 / 16%)',
      fg: '#6C5CD6',
    },
    ];
  });

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

  /** 跳到账号管理页并带上游戏参数 */
  function goAccounts(game?: string) {
    router.push({ path: '/account', query: game ? { game } : {} });
  }

  /** 收发结构占比（与群数据页保持同一套视觉） */
  function pct(v: number, total: number) {
    const t = Math.max(total || 0, 1);
    return `${Math.min(100, (v / t) * 100).toFixed(2)}%`;
  }

  function shortUid(uid: string) {
    const s = String(uid || '');
    return s.length <= 24 ? s : `${s.slice(0, 18)}…`;
  }

  /** 头像色板：按 uid 哈希稳定取色，同一用户始终同色 */
  const AVATAR_TONES: [string, string][] = [
    ['#6E9BFF', '#3F6FD8'],
    ['#9B8BF0', '#6C5CD6'],
    ['#57C795', '#329C6C'],
    ['#F0A46B', '#D07A3C'],
    ['#EC7FA9', '#C95B87'],
    ['#4FC0DE', '#2E93B4'],
  ];

  function avatarStyle(uid: string) {
    const s = String(uid || '');
    let h = 0;
    for (let i = 0; i < s.length; i += 1) {
      h = (h * 31 + s.charCodeAt(i)) >>> 0;
    }
    const [a, b] = AVATAR_TONES[h % AVATAR_TONES.length];
    return { background: `linear-gradient(135deg, ${a}, ${b})` };
  }

  function initialOf(row: UserRow) {
    const name = String(row.name || '').trim();
    return name ? name.slice(0, 1) : '?';
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

  async function loadHero(force = false) {
    try {
      const res = await statsApi.getUserHero(force);
      if (res) hero.value = { ...emptyHero(), ...res };
    } catch {
      hero.value = emptyHero();
    } finally {
      heroReady.value = true;
    }
  }

  async function loadGames(force = false) {
    gamesLoading.value = true;
    try {
      const res = await gameApi.overview(force);
      games.value = res?.games ?? [];
    } catch {
      games.value = [];
    } finally {
      gamesLoading.value = false;
    }
  }

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
    loadHero(true);
    loadGames(true);
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

  /* ------------------------------ 导出 CSV（按当前筛选，分页拉全量，上限 2000） ------------------------------ */

  const exporting = ref(false);
  const EXPORT_CAP = 2000;

  async function exportCsv() {
    if (exporting.value) return;
    exporting.value = true;
    try {
      const rows: any[] = [];
      for (let page = 1; rows.length < EXPORT_CAP; page++) {
        const res: any = await statsApi.getUsers({
          keyword: query.keyword || undefined,
          sort: query.sort,
          order: query.order,
          page,
          size: 100,
        });
        const list = res?.list ?? [];
        rows.push(...list);
        const total = res?.total ?? 0;
        if (!list.length || rows.length >= total) break;
      }
      const slice = rows.slice(0, EXPORT_CAP);
      if (!slice.length) {
        message.warning('当前筛选条件下没有可导出的用户');
        return;
      }
      downloadCsv(
        `users-${new Date().toISOString().slice(0, 10)}`,
        [
          { title: '用户ID', key: 'uid' },
          { title: '昵称', format: (r: any) => r.name || '' },
          { title: '消息总量', key: 'total' },
          { title: '收消息', key: 'recv' },
          { title: '发消息', key: 'send' },
          { title: '日均', key: 'avgDaily' },
          { title: '活跃天数', key: 'activeDays' },
          { title: '首次发言', key: 'firstDate' },
          { title: '最后发言', key: 'lastDate' },
        ],
        slice,
      );
      message.success(`已导出 ${slice.length} 条${slice.length >= EXPORT_CAP ? '（已达上限，建议缩小筛选范围）' : ''}`);
    } catch (e: any) {
      message.error(e?.message || '导出失败');
    } finally {
      exporting.value = false;
    }
  }

  /* ------------------------------ 详情 ------------------------------ */

  const drawer = reactive<{ visible: boolean; uid: string }>({ visible: false, uid: '' });
  const detail = ref<UserDetailResult | null>(null);
  const detailRef = ref<HTMLDivElement | null>(null);
  const detailChart = useECharts(detailRef);
  const monthRef = ref<HTMLDivElement | null>(null);
  const monthChart = useECharts(monthRef);

  const drawerTitle = computed(() => '用户详情');

  /** 当前弹窗用户的昵称（取自列表行，详情接口不返回昵称） */
  const drawerName = computed(() => list.value.find((r) => r.uid === drawer.uid)?.name || '');

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
    // 弹窗有入场动画，容器高度可能仍为 0，延迟补一次渲染
    setTimeout(() => renderDetail(), 420);
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

  onMounted(() => {
    loadHero();
    loadGames();
    loadData();
  });
</script>

<style scoped lang="less">
  @import '../_shared/dialog/dm.less';

  .w-220 {
    width: 220px;
  }

  .w-150 {
    width: 150px;
  }

  .w-110 {
    width: 110px;
  }

  /* --------------------------- 绑定率 + 指标 --------------------------- */

  .ur-top {
    display: grid;
    gap: 14px;
    grid-template-columns: minmax(0, 0.86fr) minmax(0, 1.4fr);
  }

  .ur-bind__body {
    display: flex;
    gap: 18px;
    align-items: center;
    padding: 4px 2px 2px;
  }

  .ur-ring {
    position: relative;
    flex: 0 0 auto;
    width: 132px;
    height: 132px;
  }

  .ur-ring__svg {
    width: 100%;
    height: 100%;
  }

  .ur-ring__track {
    fill: none;
    stroke: var(--g-track);
    stroke-width: 11;
  }

  .ur-ring__value {
    fill: none;
    stroke: var(--g-blue);
    stroke-width: 11;
    stroke-linecap: round;
    transition: stroke-dasharray 0.5s ease;
  }

  .ur-ring__label {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    align-items: center;
    justify-content: center;
  }

  .ur-ring__num {
    font-size: 27px;
    font-weight: 700;
    color: var(--g-text);
    font-variant-numeric: tabular-nums;

    small {
      margin-left: 1px;
      font-size: 13px;
      font-weight: 600;
      color: var(--g-text-mute);
    }
  }

  .ur-ring__cap {
    font-size: 11px;
    color: var(--g-text-mute);
    letter-spacing: 0.4px;
  }

  .ur-bind__facts {
    flex: 1;
    min-width: 0;
  }

  .ur-fact {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 6px 0;
    font-size: 12.5px;

    & + .ur-fact {
      border-top: 1px solid var(--g-card-border);
    }
  }

  .ur-fact__dot {
    width: 7px;
    height: 7px;
    border-radius: 2px;

    &.is-total {
      background: var(--g-violet);
    }

    &.is-bound {
      background: var(--g-blue);
    }

    &.is-unbound {
      background: var(--g-track);
    }
  }

  .ur-fact__label {
    color: var(--g-text-mute);
  }

  .ur-fact__value {
    margin-left: auto;
    font-weight: 650;
    color: var(--g-text);
    font-variant-numeric: tabular-nums;
  }

  .ur-bind__hint {
    margin-top: 8px;
    font-size: 11px;
    line-height: 1.6;
    color: var(--g-text-mute);
  }

  .ur-metrics {
    display: grid;
    gap: 14px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ur-metric {
    display: flex;
    flex-direction: column;
    gap: 4px;
    justify-content: center;
    padding: 14px 16px !important;
  }

  .ur-metric__top {
    display: flex;
    gap: 7px;
    align-items: center;
  }

  .ur-metric__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 7px;
  }

  .ur-metric__label {
    font-size: 12px;
    color: var(--g-text-mute);
  }

  .ur-metric__value {
    font-size: 23px;
    font-weight: 700;
    color: var(--g-text);
    font-variant-numeric: tabular-nums;

    small {
      margin-left: 2px;
      font-size: 11px;
      font-weight: 500;
      color: var(--g-text-mute);
    }
  }

  .ur-metric__foot {
    font-size: 11px;
    color: var(--g-text-mute);
  }

  /* --------------------------- TOP5 + 活性 --------------------------- */

  .ur-mid {
    display: grid;
    gap: 14px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ur-top5 {
    display: flex;
    flex-direction: column;
  }

  .ur-top5__row {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 8px 0;

    & + .ur-top5__row {
      border-top: 1px solid var(--g-card-border);
    }
  }

  .ur-top5__rank {
    flex: 0 0 auto;
    width: 18px;
    font-size: 12px;
    font-weight: 700;
    color: var(--g-text-mute);
    text-align: center;
    font-variant-numeric: tabular-nums;

    &.is-1 {
      color: #D8A62B;
    }

    &.is-2 {
      color: #94A9BC;
    }

    &.is-3 {
      color: #C08050;
    }
  }

  .ur-top5__avatar {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    border-radius: 8px;
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 18%);
  }

  .ur-top5__body {
    min-width: 0;
  }

  .ur-top5__name {
    overflow: hidden;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--g-text);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .ur-top5__meta {
    margin-top: 2px;
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 10.5px;
    color: var(--g-text-mute);
  }

  .ur-top5__value {
    margin-left: auto;
    font-size: 13px;
    font-weight: 650;
    color: var(--g-text);
    font-variant-numeric: tabular-nums;
  }

  .ur-spark {
    display: flex;
    gap: 8px;
    align-items: flex-end;
    height: 158px;
    padding: 6px 2px 0;
  }

  .ur-spark__col {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4px;
    align-items: center;
    height: 100%;
  }

  .ur-spark__num {
    font-size: 10px;
    color: var(--g-text-mute);
    font-variant-numeric: tabular-nums;
  }

  .ur-spark__track {
    display: flex;
    flex: 1;
    align-items: flex-end;
    width: 100%;
    max-width: 34px;
    background: var(--g-chip-bg);
    border-radius: 6px;
  }

  .ur-spark__bar {
    display: block;
    width: 100%;
    background: linear-gradient(180deg, var(--g-cyan), var(--g-blue));
    border-radius: 6px;
    transition: height 0.4s ease;
  }

  .ur-spark__label {
    font-size: 10.5px;
    color: var(--g-text-mute);
  }

  .ur-spark__foot {
    display: flex;
    gap: 16px;
    padding-top: 10px;
    margin-top: 8px;
    font-size: 11.5px;
    color: var(--g-text-mute);
    border-top: 1px solid var(--g-card-border);
  }

  /* --------------------------- 游戏矩阵 --------------------------- */

  .ur-games {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .ur-game {
    display: flex;
    flex-direction: column;
    gap: 9px;
    padding: 13px 14px;
    text-align: left;
    cursor: pointer;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 13px;
    transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;

    &:hover {
      border-color: var(--g-card-border-strong);
      box-shadow: var(--g-card-shadow);
      transform: translateY(-2px);
    }
  }

  .ur-game__head {
    display: flex;
    gap: 9px;
    align-items: center;
  }

  .ur-game__title {
    min-width: 0;
  }

  .ur-game__name {
    overflow: hidden;
    font-size: 12.5px;
    font-weight: 650;
    color: var(--g-text);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .ur-game__en {
    margin-top: 1px;
    overflow: hidden;
    font-size: 10px;
    color: var(--g-text-mute);
    letter-spacing: 0.4px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .ur-game__rate {
    margin-left: auto;
    padding: 2px 7px;
    font-size: 11px;
    font-weight: 650;
    color: var(--g-text-sub);
    background: var(--g-chip-bg);
    border-radius: 7px;
    font-variant-numeric: tabular-nums;
  }

  .ur-game__nums {
    display: flex;
    gap: 16px;
    align-items: baseline;
  }

  .ur-game__num {
    font-size: 18px;
    font-weight: 700;
    color: var(--g-text);
    font-variant-numeric: tabular-nums;
  }

  .ur-game__cap {
    margin-left: 3px;
    font-size: 10.5px;
    color: var(--g-text-mute);
  }

  .ur-game__bar {
    height: 4px;
    overflow: hidden;
    background: var(--g-track);
    border-radius: 3px;

    i {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, var(--g1), var(--g2));
      border-radius: 3px;
      transition: width 0.4s ease;
    }
  }

  .ur-game__tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .ur-tag {
    padding: 1px 7px;
    font-size: 10.5px;
    color: var(--g-text-sub);
    background: var(--g-chip-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 6px;

    &.is-off {
      color: var(--g-text-mute);
      opacity: 0.7;
    }

    &.is-ghost {
      font-style: italic;
      opacity: 0.65;
    }
  }

  .ur-game-skeleton {
    height: 108px;
    border-radius: 13px;
  }

  .ur-link {
    padding: 0;
    font-size: 11.5px;
    color: var(--g-blue);
    cursor: pointer;
    background: none;
    border: none;

    &:hover {
      text-decoration: underline;
    }
  }

  /* --------------------------- 列表 --------------------------- */

  .mcell__bar {
    display: flex;
    gap: 2px;
    height: 5px;
    overflow: hidden;
    background: var(--g-track);
    border-radius: 3px;
  }

  .mcell__bar i,
  .mcell__legend i {
    display: block;
    height: 100%;
    border-radius: 3px;
  }

  .mcell__bar .is-recv,
  .mcell__legend .is-recv {
    background: var(--g-blue);
  }

  .mcell__bar .is-send,
  .mcell__legend .is-send {
    background: var(--g-violet);
  }

  .mcell__legend {
    display: flex;
    gap: 10px;
    margin-top: 5px;
    font-size: 11px;
    color: var(--g-text-mute);
    font-variant-numeric: tabular-nums;

    span {
      display: inline-flex;
      gap: 4px;
      align-items: center;
    }

    i {
      width: 6px;
      height: 6px;
      border-radius: 2px;
    }
  }

  :deep(.ant-table-thead > tr > th) {
    height: 40px;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--g-text-mute) !important;
    letter-spacing: 0.3px;
    background: var(--g-card-bg-soft) !important;
    border-bottom: 1px solid var(--g-card-border) !important;

    &::before {
      display: none !important;
    }
  }

  :deep(.ant-table-tbody > tr > td) {
    border-bottom: 1px solid var(--g-card-border);
  }

  :deep(.ant-table-tbody > tr:hover > td) {
    background: var(--g-hover) !important;
  }

  /* 详情弹窗：左身份 + 指标卡片，右图表区块 */
  .dm {
    display: grid;
    gap: 18px;
    grid-template-columns: 286px minmax(0, 1fr);
    align-items: start;
  }

  .dm__side {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }

  .dm__main {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }

  .dm-panel {
    padding: 14px;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 12px;
  }

  .dm-user {
    display: flex;
    gap: 11px;
    align-items: center;
    padding-bottom: 13px;
    border-bottom: 1px solid var(--g-card-border);
  }

  .dm-user__avatar {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    border-radius: 11px;
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 18%);
  }

  .dm-user__body {
    flex: 1;
    min-width: 0;
  }

  .dm-user__name {
    overflow: hidden;
    font-size: 14.5px;
    font-weight: 650;
    line-height: 1.35;
    color: var(--g-text);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dm-user__id {
    margin-top: 3px;
    overflow: hidden;
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 11px;
    line-height: 1.4;
    color: var(--g-text-mute);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 900px) {
    .dm {
      gap: 16px;
      grid-template-columns: minmax(0, 1fr);
    }

    .dm__main {
      gap: 16px;
    }
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

  /* 用户单元格：头像 + 昵称 + ID */
  .ucell {
    display: flex;
    gap: 9px;
    align-items: center;
    min-width: 0;
  }

  .ucell__avatar {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    border-radius: 9px;
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 18%);
  }

  .ucell__body {
    min-width: 0;
  }

  .ucell__name {
    overflow: hidden;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--g-text);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .ucell__id {
    margin-top: 2px;
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 11px;
    color: var(--g-text-mute);
  }

  @media (max-width: 1180px) {
    .ur-top,
    .ur-mid {
      grid-template-columns: minmax(0, 1fr);
    }

    .ur-games {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
