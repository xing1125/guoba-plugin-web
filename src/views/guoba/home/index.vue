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
            Yunzai-Bot <b class="mono">v{{ conf.VERSION }}</b> · 荧后台 <b class="mono">v{{ conf.GUOBA_VERSION }}</b>
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
          <Icon class="gm-hero__refresh-icon" :icon="$gm('refresh')" :size="12" />
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

      <!-- ============================ 系统运行态 + 运行状态 ============================ -->
      <section class="gm-grid gm-grid--2-1">
        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('dashboard')" :size="13" /></i>
              系统运行态
            </div>
            <span v-if="sysinfoVisible" class="gm-panel__link" @click="go('/sysinfo')">系统信息›</span>
          </div>
          <div v-if="runtime" class="hm-rt">
            <div class="hm-rt__gauges">
              <div v-for="g in gauges" :key="g.label" class="hm-rt__gauge">
                <div class="hm-rt__gauge-head">
                  <span>{{ g.label }}</span>
                  <b>{{ g.text }}</b>
                </div>
                <div class="hm-rt__track">
                  <i :style="{ width: `${g.pct}%`, background: g.color }" />
                </div>
              </div>
            </div>
            <dl class="hm-rt__rows">
              <div v-for="r in rtRows" :key="r.k" class="hm-rt__row">
                <dt>{{ r.k }}</dt>
                <dd :class="{ mono: r.mono }">{{ r.v }}</dd>
              </div>
            </dl>
          </div>
          <div v-else class="gm-skeleton" style="height: 176px" />
        </div>

        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('zap')" :size="13" /></i>
              运行状态
            </div>
            <span class="gm-panel__extra">实时</span>
          </div>
          <div class="hm-meters">
            <div
              v-for="m in meters"
              :key="m.label"
              class="gm-meter"
              :style="`--g-meter-from:${m.from};--g-meter-to:${m.to}`"
            >
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
        </div>
      </section>

      <!-- ============================ 快捷入口 ============================ -->
      <section class="g-card">
        <div class="gm-panel__head">
          <div class="gm-panel__title">
            <i><Icon :icon="$gm('grid')" :size="13" /></i>
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
  import { computed, nextTick, onBeforeUnmount, onMounted, ref, unref } from 'vue';
  import { useRouter } from 'vue-router';
  import { PageWrapper } from '/@/components/Page';
  import { Icon } from '/@/components/Icon';
  import { defHttp } from '/@/utils/http/axios';
  import { useRootSetting } from '/@/hooks/setting/useRootSetting';
  import { ThemeEnum } from '/@/enums/appEnum';
  import { usePermissionStore } from '/@/store/modules/permission';
  import { sysApi } from '/@/api/guoba';
  import { adminApi } from '../system/account/api';
  import type { BotRuntime, OverviewCards, TrendPoint } from '../system/_shared/stats';
  import { fmtNum, hexToRgba, statsApi, thousands } from '../system/_shared/stats';
  import { gm } from '/@/design/gmIcons';
  import { fmtTimeShort } from '/@/utils/localTime';

  defineOptions({ name: 'Home' });

  const router = useRouter();
  const { getDarkMode } = useRootSetting();
  const isDark = computed(() => unref(getDarkMode) === ThemeEnum.DARK);

  const overview = ref<Partial<OverviewCards>>({});
  const homeData = ref<Record<string, any>>({});
  const admin = ref<any>({});
  const userSummary = ref<any>({});
  const trendAll = ref<TrendPoint[]>([]);
  const runtime = ref<BotRuntime | null>(null);

  const conf = computed(() => (window as any).__YUNZAI_BOT_CONF__ ?? {});

  /* 导航管理屏蔽的页面，入口链接同步隐藏 */
  const sysinfoVisible = computed(() =>
    usePermissionStore()
      .getBackMenuList.map((m: any) => m?.path)
      .includes('/sysinfo'),
  );

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
        icon: gm('pulse'),
        value: thousands(today),
        unit: '条',
        delta: todayDelta.value,
        foot: `较昨日 ${thousands(yesterday)} 条`,
        ...p.blue,
      },
      {
        key: 'total',
        label: '累计消息',
        icon: gm('database'),
        value: fmtNum(total),
        unit: '条',
        delta: null,
        foot: `群维度收发合计`,
        ...p.cyan,
      },
      {
        key: 'users',
        label: '用户总数',
        icon: gm('users'),
        value: thousands(users),
        unit: '人',
        delta: null,
        foot: `今日活跃 ${thousands(activeUsers)} 人`,
        ...p.violet,
      },
      {
        key: 'groups',
        label: '群聊数量',
        icon: gm('grid'),
        value: thousands(groups),
        unit: '个',
        delta: null,
        foot: `今日活跃 ${overview.value.activeToday ?? 0} 个`,
        ...p.green,
      },
      {
        key: 'ck',
        label: 'Cookie 账号',
        icon: gm('key'),
        value: thousands(acc.total ?? 0),
        unit: '个',
        delta: null,
        foot: `有效 ${acc.ckOk ?? 0} · 异常 ${acc.expired ?? 0}`,
        ...p.amber,
      },
      {
        key: 'redis',
        label: 'Redis 键数',
        icon: gm('server'),
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

  /* ------------------------------ 系统运行态 ------------------------------ */

  const gauges = computed(() => {
    const r = runtime.value;
    const d = isDark.value;
    const cpu = r?.cpuUsage;
    const mem = r?.memory?.usagePct ?? 0;
    return [
      {
        label: 'CPU 占用',
        text: cpu == null ? '—' : `${cpu}%`,
        pct: Math.min(100, Math.round(cpu ?? 0)),
        color: d ? 'linear-gradient(90deg,#62A8EA,#4FC3D9)' : 'linear-gradient(90deg,#2F86C4,#4FA8D8)',
      },
      {
        label: '内存占用',
        text: `${Math.round(mem)}%`,
        pct: Math.min(100, Math.round(mem)),
        color: d ? 'linear-gradient(90deg,#9D8DF0,#62A8EA)' : 'linear-gradient(90deg,#8D83E8,#4FA8D8)',
      },
    ];
  });

  function uptimeText(sec: number) {
    const s = Number(sec) || 0;
    if (!s) return '—';
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d) return `${d} 天 ${h} 小时`;
    if (h) return `${h} 小时 ${m} 分`;
    return `${m} 分钟`;
  }

  function mb(bytes: number) {
    return `${Math.round((Number(bytes) || 0) / 1048576)} MB`;
  }

  const rtRows = computed(() => {
    const r = runtime.value;
    if (!r) return [];
    const bots = r.bots ?? [];
    return [
      { k: '运行时长', v: uptimeText(r.botUptime), mono: false },
      { k: 'Node.js', v: r.nodeVersion || '—', mono: true },
      { k: '运行平台', v: `${r.system?.platform || '—'} ${r.system?.arch || ''}`.trim(), mono: true },
      { k: '进程内存', v: `${mb(r.memory?.rss)} · 堆 ${mb(r.memory?.heapUsed)}`, mono: false },
      { k: 'Redis', v: `${r.redis?.version || '—'} · ${thousands(r.redis?.keys)} 键`, mono: true },
      {
        k: 'Bot 实例',
        v: bots.length ? `${bots.length} 个已加载` : '未连接',
        mono: false,
      },
    ];
  });

  const tiles = computed(() => {
    const p = palette.value;
    /* 导航管理屏蔽的页面，快捷入口同步隐藏 */
    const visible = new Set(usePermissionStore().getBackMenuList.map((m: any) => m?.path).filter(Boolean));
    const all = [
      { path: '/dashboard', title: '数据总览', desc: '趋势与缓存分布', icon: gm('dashboard'), ...p.blue },
      { path: '/groups', title: '群数据', desc: '活跃与趋势', icon: gm('grid'), ...p.green },
      { path: '/users-data', title: '用户数据', desc: '消息排行', icon: gm('users'), ...p.violet },
      { path: '/plugins-data', title: '插件数据', desc: '键数占比', icon: gm('api'), ...p.cyan },
      { path: '/account', title: '米游社账号', desc: 'CK 与绑定', icon: gm('key'), ...p.amber },
      { path: '/uid', title: '游戏 UID', desc: '六游戏归属', icon: gm('chart'), ...p.rose },
      { path: '/config', title: '配置管理', desc: '写前自动备份', icon: gm('shield'), ...p.blue },
      { path: '/plugins', title: '插件管理', desc: '安装与启停', icon: gm('zap'), ...p.violet },
    ];
    return visible.size ? all.filter((t) => visible.has(t.path)) : all;
  });

  function go(path: string) {
    router.push(path).catch(() => {});
  }

  function shortTime(iso: string) {
    return fmtTimeShort(iso);
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

  /* ------------------------------ 加载 ------------------------------ */

  async function loadData() {
    sysApi
      .getHomeData()
      .then((d) => (homeData.value = d || {}))
      .catch(() => {});
    const [ov, users, tr, ao, rt] = await Promise.allSettled([
      statsApi.getOverview(),
      statsApi.getUsers({ page: 1, size: 1 }),
      statsApi.getTrend(7),
      adminApi.getOverview(),
      statsApi.getRuntime(),
    ]);
    if (ov.status === 'fulfilled' && ov.value) overview.value = ov.value;
    if (users.status === 'fulfilled') userSummary.value = users.value?.summary ?? {};
    if (tr.status === 'fulfilled') trendAll.value = tr.value?.trend ?? [];
    if (ao.status === 'fulfilled' && ao.value) admin.value = ao.value;
    if (rt.status === 'fulfilled' && rt.value?.available) runtime.value = rt.value;

    await nextTick();
  }

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

  /* ---------------- 运行状态：宽卡内两列摆放 ---------------- */
  .hm-meters {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 2px 0 4px;
  }

  /* ---------------- 系统运行态 ---------------- */
  .hm-rt {
    display: grid;
    gap: 18px 10px;
    grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
    align-items: start;
  }

  .hm-rt__gauges {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-top: 2px;
  }

  .hm-rt__gauge-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 5px;
    font-size: 12px;
    color: var(--g-text-sub);
  }

  .hm-rt__gauge-head b {
    font-size: 12.5px;
    font-weight: 650;
    color: var(--g-text);
    font-variant-numeric: tabular-nums;
  }

  .hm-rt__track {
    height: 6px;
    overflow: hidden;
    background: var(--g-track);
    border-radius: 4px;
  }

  .hm-rt__track i {
    display: block;
    height: 100%;
    border-radius: 4px;
    transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .hm-rt__rows {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding-left: 18px;
    border-left: 1px dashed var(--g-card-border);
  }

  .hm-rt__row {
    display: flex;
    gap: 12px;
    align-items: baseline;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 12px;
    border-bottom: 1px dashed var(--g-card-border);
  }

  .hm-rt__row:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }

  .hm-rt__row dt {
    flex: 0 0 auto;
    color: var(--g-text-mute);
  }

  .hm-rt__row dd {
    min-width: 0;
    overflow: hidden;
    font-weight: 600;
    color: var(--g-text);
    text-align: right;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 900px) {
    .hm-rt {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
