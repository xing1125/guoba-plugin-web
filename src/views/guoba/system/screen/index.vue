<template>
  <div class="scr" :data-state="health.level">
    <!-- ==================== 顶栏 ==================== -->
    <header class="scr-head">
      <div class="scr-head__brand">
        <i class="scr-lamp" :data-s="health.level" />
        <div class="scr-head__names">
          <div class="scr-head__name">{{ botLabel }}</div>
          <div class="scr-head__sub">{{ runtime.system?.hostname || 'Yunzai' }} · 运行状态大屏</div>
        </div>
      </div>

      <div class="scr-head__state">
        {{ health.title }}<em>{{ health.desc }}</em>
      </div>

      <div class="scr-head__tags">
        <span v-for="t in health.tags" :key="t.text" class="scr-tag" :data-s="t.level">{{ t.text }}</span>
      </div>

      <div class="scr-head__right">
        <span class="scr-live" :data-s="freshLevel" :title="`上次采集：${freshText}`">
          <i class="scr-live__dot" />
          实时
          <b>{{ freshSec }}s</b>
        </span>
        <span class="scr-clock">{{ clock }}</span>
        <Button size="small" ghost class="scr-full-btn" @click="toggleFull">
          <Icon :icon="$gm('fullscreen')" :size="12" />
          {{ isFull ? '退出全屏' : '全屏' }}
        </Button>
      </div>
    </header>

    <!-- ==================== KPI ==================== -->
    <section class="scr-kpi">
      <div v-for="k in kpis" :key="k.label" class="scr-kpi__card" :data-tone="k.tone">
        <div class="scr-kpi__hd">
          <Icon :icon="k.icon" :size="11" :style="{ color: k.color }" />
          {{ k.label }}
        </div>
        <div class="scr-kpi__val" :key="k.value">
          {{ k.value }}<small>{{ k.unit }}</small>
        </div>
        <div class="scr-kpi__ft" v-html="k.foot" />
        <i class="corner corner--tl" /><i class="corner corner--br" />
      </div>
    </section>

    <!-- ==================== 主区 ==================== -->
    <section class="scr-main">
      <!-- 消息趋势 -->
      <div class="scr-panel scr-panel--trend">
        <div class="scr-panel__head">
          <span class="scr-panel__tag" />
          消息趋势
          <em class="scr-panel__extra">
            <i class="lg lg--ice" />接收
            <i class="lg lg--gold" />发送
            <span>近 14 天</span>
          </em>
        </div>
        <div v-show="hasTrend" ref="trendRef" class="scr-chart scr-chart--trend" />
        <div v-if="!hasTrend" class="scr-empty">{{ booting ? '数据加载中…' : '暂无趋势数据' }}</div>
        <i class="corner corner--tl" /><i class="corner corner--tr" />
        <i class="corner corner--bl" /><i class="corner corner--br" />
      </div>

      <!-- 运行核心 -->
      <div class="scr-panel scr-panel--core">
        <div class="scr-panel__head">
          <span class="scr-panel__tag" />
          运行核心
          <em class="scr-panel__extra">CPU / 内存</em>
        </div>
        <div class="scr-gauges">
          <div ref="cpuRef" class="scr-chart scr-chart--gauge" />
          <div ref="memRef" class="scr-chart scr-chart--gauge" />
        </div>
        <div class="scr-bars">
          <div class="scr-bar">
            <div class="scr-bar__hd">
              <span>系统内存</span>
              <b>{{ fmtBytes(runtime.memory?.used) }} / {{ fmtBytes(runtime.memory?.total) }}</b>
              <em>{{ runtime.memory?.usagePct ?? 0 }}%</em>
            </div>
            <div class="scr-bar__track">
              <i :style="{ width: `${runtime.memory?.usagePct ?? 0}%`, background: barColor(runtime.memory?.usagePct) }" />
            </div>
          </div>
          <div class="scr-bar">
            <div class="scr-bar__hd">
              <span>磁盘</span>
              <b v-if="runtime.disk">{{ fmtBytes(runtime.disk.used) }} / {{ fmtBytes(runtime.disk.total) }}</b>
              <b v-else class="is-na">取不到</b>
              <em :class="{ 'is-na': !runtime.disk }">{{ runtime.disk ? `${runtime.disk.usagePct}%` : 'N/A' }}</em>
            </div>
            <div class="scr-bar__track">
              <i :style="{ width: `${runtime.disk?.usagePct ?? 0}%`, background: barColor(runtime.disk?.usagePct) }" />
            </div>
          </div>
        </div>
        <i class="corner corner--tl" /><i class="corner corner--tr" />
        <i class="corner corner--bl" /><i class="corner corner--br" />
      </div>

      <!-- AI 引擎 -->
      <div class="scr-panel scr-panel--ai">
        <div class="scr-panel__head">
          <span class="scr-panel__tag" />
          AI 引擎
          <em class="scr-panel__extra">{{ aiHead }}</em>
        </div>

        <div v-if="runtime.ai" class="scr-ai">
          <div class="scr-ai__ring">
            <div v-show="aiSlices.length" ref="aiRef" class="scr-chart scr-chart--ring" />
            <div v-if="!aiSlices.length" class="scr-empty scr-empty--sm">今日无调用</div>
            <div class="scr-ai__cen">
              <b>{{ thousands(runtime.ai.calls) }}</b>
              <span>今日调用</span>
            </div>
          </div>
          <div class="scr-ai__side">
            <div v-for="(m, i) in aiSlices.slice(0, 3)" :key="m.name" class="scr-ai__row">
              <i :style="{ background: aiColors[i] }" />
              <span :title="m.name">{{ m.short }}</span>
              <b>{{ m.pct }}%</b>
            </div>
            <div class="scr-ai__note">
              token {{ fmtNum(runtime.ai.total) }} · prompt 占 {{ promptPct }}%
            </div>
          </div>
        </div>
        <div v-else class="scr-empty">{{ booting ? '数据加载中…' : '未接入 AI 插件' }}</div>

        <div class="scr-ai__kv">
          <div>
            <span>今日 token</span>
            <b>{{ runtime.ai ? fmtNum(runtime.ai.total) : '—' }}</b>
          </div>
          <div>
            <span>限流命中</span>
            <b :class="{ 'is-warn': (runtime.ai?.rateLimit?.hits ?? 0) > 0 }">
              {{ runtime.ai ? runtime.ai.rateLimit.hits : '—' }}
            </b>
          </div>
          <div>
            <span>模型数</span>
            <b>{{ aiSlices.length || '—' }}</b>
          </div>
          <div>
            <span>预估成本</span>
            <b class="is-na" title="未接入计费口径，不展示估算值">—</b>
          </div>
        </div>
        <i class="corner corner--tl" /><i class="corner corner--tr" />
        <i class="corner corner--bl" /><i class="corner corner--br" />
      </div>

      <!-- 群消息排行 -->
      <div class="scr-panel scr-panel--rank">
        <div class="scr-panel__head">
          <span class="scr-panel__tag" />
          群消息排行
          <em class="scr-panel__extra">TOP 5 · 累计</em>
        </div>
        <div v-if="topGroups.length" class="scr-rank">
          <div v-for="(g, i) in topGroups" :key="g.gid" class="scr-rank__row">
            <span class="scr-rank__no" :class="`is-${i + 1}`">{{ i + 1 }}</span>
            <b class="scr-rank__name" :class="{ 'is-plain': !g.name }" :title="g.name || g.gid">
              {{ g.name || `群 ${shortGid(g.gid)}` }}
            </b>
            <div class="scr-rank__track"><i :style="{ width: rankPct(g.total) }" /></div>
            <span class="scr-rank__val">{{ fmtNum(g.total) }}</span>
            <em class="scr-rank__live" :class="{ 'is-hot': liveToday(g.gid) > 0 }">
              {{ liveToday(g.gid) ? `+${liveToday(g.gid)}` : '' }}
            </em>
          </div>
        </div>
        <div v-else class="scr-empty">{{ booting ? '数据加载中…' : '暂无群数据' }}</div>
        <i class="corner corner--tl" /><i class="corner corner--tr" />
        <i class="corner corner--bl" /><i class="corner corner--br" />
      </div>

      <!-- 群活跃走势 -->
      <div class="scr-panel scr-panel--spark">
        <div class="scr-panel__head">
          <span class="scr-panel__tag" />
          群活跃走势
          <em class="scr-panel__extra">近 14 天 · 按最近活跃</em>
        </div>
        <div v-if="sparkRows.length" class="scr-spark">
          <div v-for="g in sparkRows" :key="g.gid" class="scr-spark__row">
            <b class="scr-spark__name" :class="{ 'is-plain': !g.name }" :title="g.name || g.gid">
              {{ g.name || `群 ${shortGid(g.gid)}` }}
            </b>
            <svg class="scr-spark__svg" viewBox="0 0 120 34" preserveAspectRatio="none">
              <line x1="0" y1="29" x2="120" y2="29" stroke="rgba(79,195,247,0.14)" stroke-width="1" vector-effect="non-scaling-stroke" />
              <path :d="g.area" fill="rgba(79,195,247,0.10)" />
              <path
                :d="g.line"
                fill="none"
                stroke="rgba(79,195,247,0.62)"
                stroke-width="1.4"
                stroke-linejoin="round"
                stroke-linecap="round"
                vector-effect="non-scaling-stroke"
              />
            </svg>
            <span class="scr-spark__meta">
              <b>{{ fmtNum(g.total) }}</b>
              <em>峰值 {{ g.peak }}</em>
            </span>
          </div>
        </div>
        <div v-else class="scr-empty">{{ booting ? '数据加载中…' : '暂无群活跃数据' }}</div>
        <i class="corner corner--tl" /><i class="corner corner--tr" />
        <i class="corner corner--bl" /><i class="corner corner--br" />
      </div>

      <!-- 系统与账号 -->
      <div class="scr-panel scr-panel--sys">
        <div class="scr-panel__head">
          <span class="scr-panel__tag" />
          系统与账号
          <em class="scr-panel__extra">{{ runtime.nodeVersion || '—' }}</em>
        </div>
        <div class="scr-info">
          <div v-for="it in sysInfo" :key="it.k" class="scr-info__item">
            <span>{{ it.k }}</span>
            <b :title="String(it.v)" :class="{ 'is-na': it.v === '—' || it.v === 'N/A' }">{{ it.v }}</b>
          </div>
        </div>
        <div class="scr-bots">
          <div class="scr-bots__title">在线账号（UIN 已脱敏）</div>
          <div v-if="runtime.bots?.length" class="scr-bots__list">
            <div v-for="b in runtime.bots" :key="b.uin" class="scr-bot-row">
              <i class="scr-bot__dot" :class="{ 'is-off': b.online === false }" />
              <b class="scr-bot-row__uin">{{ maskUin(b.uin) }}</b>
              <span class="scr-bot-row__pf">{{ b.nickname || b.platform || '未知适配器' }}</span>
              <em :class="{ 'is-off': b.online === false }">{{ b.online === false ? '离线' : '在线' }}</em>
            </div>
          </div>
          <div v-else class="scr-empty scr-empty--sm">暂无在线账号</div>
        </div>
        <div class="scr-sysline">
          <span>Redis {{ runtime.redis?.version ? `v${runtime.redis.version}` : '—' }} · {{ thousands(live?.redisKeys ?? runtime.redis?.keys) }} 键</span>
          <span>error.log {{ runtime.logs?.errorSize != null ? fmtBytes(runtime.logs.errorSize) : '无' }}</span>
        </div>
        <i class="corner corner--tl" /><i class="corner corner--tr" />
        <i class="corner corner--bl" /><i class="corner corner--br" />
      </div>

      <!-- 断采遮罩：全屏级，覆盖主区 -->
      <div v-if="stale" class="scr-stale">
        <div class="scr-stale__box">
          <b><i />采集链路中断</b>
          <p>最后一次成功刷新 {{ lastOkText }}，已超过 {{ STALE_SEC }} 秒未更新。</p>
          <p>当前显示的是最后快照，<em>不代表机器人此刻的状态</em>。</p>
          <span>接口 {{ failedApis }} 项失败 · 每 2 秒自动重试</span>
        </div>
      </div>
    </section>

    <!-- ==================== 告警带 ==================== -->
    <footer class="scr-alarm" :data-s="health.level">
      <div class="scr-alarm__left">
        <b>异常与告警</b>
        <span>{{ health.alarms.length }}</span>
        <em>{{ health.alarms.length ? '需要处理' : '暂无异常' }}</em>
      </div>
      <div class="scr-alarm__list">
        <div v-for="(a, i) in alarmSlots" :key="i" class="scr-alarm__item" :data-lv="a.lv">
          <i class="scr-alarm__bar" />
          <div>
            <b>{{ a.title }}</b>
            <span>{{ a.desc }}</span>
          </div>
        </div>
      </div>
      <div class="scr-alarm__right">
        <span>刷新 <b>2s 快 / 30s 全</b></span>
        <span>CPU 采样 <b>{{ runtime.cpuUsage == null ? '待采样' : '已就绪' }}</b></span>
        <span>数据源 <b>{{ sourceOk }}/6</b></span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { Button } from 'ant-design-vue';
  import { useFullscreen } from '@vueuse/core';
  import { Icon } from '/@/components/Icon';
  import { useECharts } from '/@/hooks/web/useECharts';
  import type { BotRuntime, DailyPoint, GroupRow, LiveInfo, OverviewCards, TrendPoint } from '../_shared/stats';
  import { areaGradient, chartBase, fmtNum, shortGid, statsApi, thousands } from '../_shared/stats';
  import { gm } from '/@/design/gmIcons';

  defineOptions({ name: 'BotScreen' });

  /* ============================== 状态 ============================== */

  const booting = ref(true);
  const clock = ref('');
  const overview = ref<Partial<OverviewCards>>({});
  const userCount = ref(0);
  const trend = ref<TrendPoint[]>([]);
  const groups = ref<GroupRow[]>([]);
  const runtime = ref<Partial<BotRuntime>>({ memory: {}, redis: {}, bots: [] });
  /** 实时脉冲（今日/累计计数），2 秒层，代价只有 1 次 MGET */
  const live = ref<LiveInfo | null>(null);

  /**
   * 消息计数只增不减：若某次实时采样因群缓存换轮而少算了一个群，
   * 直接用原始值会让 KPI 往回跳。这里保留「当日最大值」，跨天自动重置。
   */
  const liveGuard = ref({ day: '', today: 0, total: 0, active: 0 });

  /** 最近一次全量刷新成功的时间戳 */
  const lastOkAt = ref(0);
  /** 快/慢两层各自失败的接口数 */
  const fastFail = ref(0);
  const slowFail = ref(0);
  const failedApis = computed(() => fastFail.value + slowFail.value);
  /** 现在时刻，用于推算「最后采集 x 秒前」而不必额外定时器 */
  const nowTick = ref(Date.now());
  const STALE_SEC = 90;
  /** 快层：进程/系统/实时计数；慢层：需要聚合的统计 */
  const FAST_MS = 2000;
  const SLOW_MS = 30_000;

  const hasTrend = computed(() => trend.value.length > 0);

  const freshSec = computed(() => {
    if (!lastOkAt.value) return 0;
    return Math.max(0, Math.round((nowTick.value - lastOkAt.value) / 1000));
  });
  const freshText = computed(() => (lastOkAt.value ? `${freshSec.value}s 前` : '等待首次采集'));
  const freshLevel = computed(() => (freshSec.value > STALE_SEC ? 'bad' : freshSec.value > 10 ? 'warn' : 'ok'));

  /**
   * 断采判定：快层每 2 秒跑一次，所以「90 秒没成功过」已经很不正常。
   * 首次加载就全挂（没有任何成功记录）时，也要给用户明确提示。
   */
  const stale = computed(() => {
    if (booting.value) return false;
    if (!lastOkAt.value) return failedApis.value >= 2;
    return freshSec.value > STALE_SEC;
  });
  const lastOkText = computed(() =>
    lastOkAt.value ? new Date(lastOkAt.value).toLocaleTimeString('zh-CN', { hour12: false }) : '—',
  );

  const sourceOk = computed(() => {
    let n = 0;
    if (runtime.value.available) n++;
    if ((overview.value.totalMsg ?? 0) > 0 || (overview.value.groupCount ?? 0) > 0) n++;
    if (trend.value.length) n++;
    if (groups.value.length) n++;
    if (runtime.value.ai) n++;
    if (userCount.value) n++;
    return n;
  });

  /* ============================== 健康判定 ============================== */

  type Level = 'ok' | 'warn' | 'bad';
  interface AlarmItem { lv: Level; title: string; desc: string }

  const health = computed(() => {
    const r = runtime.value;
    const alarms: AlarmItem[] = [];
    const oks: AlarmItem[] = [];

    if (!r.available) {
      alarms.push({ lv: 'bad', title: 'Redis 未就绪', desc: 'Bot 可能未正常启动，统计数据全部不可用' });
    }
    if (!r.bots?.length) {
      alarms.push({ lv: 'bad', title: '无在线账号', desc: '所有适配器均未连接，机器人无法收发消息' });
    }
    if ((r.cpuUsage ?? 0) >= 85) {
      alarms.push({ lv: 'warn', title: `CPU 占用 ${r.cpuUsage}%`, desc: '全机负载偏高，响应可能变慢' });
    }
    const heap = r.memory?.heapPct ?? 0;
    // V8 会按需扩堆，80~90% 属常态；超过 95% 且持续才值得关注
    if (heap >= 95) {
      alarms.push({ lv: 'warn', title: `堆内存 ${heap}%`, desc: 'V8 将自动扩堆，持续高位需排查内存泄漏' });
    }
    const diskPct = r.disk?.usagePct ?? 0;
    if (diskPct >= 88) {
      alarms.push({ lv: 'warn', title: `磁盘占用 ${diskPct}%`, desc: '剩余空间不足，日志与缓存可能写失败' });
    }
    const hits = r.ai?.rateLimit?.hits ?? 0;
    if (hits > 0) {
      alarms.push({ lv: 'warn', title: `模型限流 ${hits} 次`, desc: '上游返回 429，已进入退避' });
    }
    // error.log 近 30 分钟有写入 → 近期有报错
    const mtime = r.logs?.errorMtime ? new Date(r.logs.errorMtime).getTime() : 0;
    if (mtime && Date.now() - mtime < 30 * 60 * 1000) {
      alarms.push({ lv: 'warn', title: '错误日志近 30 分钟有写入', desc: `当前体积 ${fmtBytes(r.logs?.errorSize ?? 0)}` });
    }

    // 无异常时给健康快照，避免告警带空着
    if (r.available) oks.push({ lv: 'ok', title: 'Redis 响应正常', desc: `${thousands(r.redis?.keys)} 键 · ${r.redis?.version ? `v${r.redis.version}` : '版本未知'}` });
    if (r.bots?.length) oks.push({ lv: 'ok', title: `${r.bots.length} 个账号在线`, desc: '适配器连接正常' });
    if (r.ai) oks.push({ lv: 'ok', title: `今日 AI 调用 ${thousands(r.ai.calls)} 次`, desc: `token ${fmtNum(r.ai.total)}，无限流` });
    if (mtime === 0) oks.push({ lv: 'ok', title: '错误日志无新增', desc: 'logs/error.log 未写入' });

    const level: Level = alarms.some((a) => a.lv === 'bad') ? 'bad' : alarms.length ? 'warn' : 'ok';

    return {
      level,
      title: level === 'bad' ? '服务异常' : level === 'warn' ? '需要关注' : '运行正常',
      desc:
        level === 'bad'
          ? `${alarms.length} 项故障，功能可能不可用`
          : level === 'warn'
            ? `${alarms.length} 项指标越界，尚可服务`
            : '全链路可服务',
      alarms,
      tags: [
        { text: `${r.bots?.length ?? 0} 账号在线`, level: (r.bots?.length ? 'ok' : 'bad') as Level },
        { text: r.available ? 'Redis 正常' : 'Redis 异常', level: (r.available ? 'ok' : 'bad') as Level },
        {
          text: hits ? `限流 ${hits} 次` : '无限流',
          level: (hits ? 'warn' : 'ok') as Level,
        },
      ],
      oks,
    };
  });

  /** 告警带固定 4 格：有告警优先显示告警，剩余位置补健康快照 */
  const alarmSlots = computed(() => {
    const list: AlarmItem[] = [...health.value.alarms];
    for (const o of health.value.oks) {
      if (list.length >= 4) break;
      list.push(o);
    }
    if (!list.length) list.push({ lv: 'ok', title: '暂无数据', desc: '等待首次采集完成' });
    return list.slice(0, 4);
  });

  /* ============================== KPI ============================== */

  const botPlatforms = computed(() => {
    const names = (runtime.value.bots || [])
      .map((b) => (typeof b.platform === 'string' ? b.platform.trim() : ''))
      .filter(Boolean);
    return [...new Set(names)].slice(0, 2).join(' · ');
  });

  const kpis = computed(() => {
    const ice = '#4FC3F7';
    const gold = '#D4AF37';
    const green = '#45B97C';
    const violet = '#9D8DF0';
    const r = runtime.value;
    // 有实时脉冲就用它（2 秒更新），没有则退回 30 秒层的聚合结果
    const g = liveGuard.value;
    const hasLive = !!g.day;
    const todayMsg = hasLive ? g.today : overview.value.todayMsg ?? 0;
    const totalMsg = hasLive ? g.total : overview.value.totalMsg ?? 0;
    const activeToday = hasLive ? g.active : overview.value.activeToday ?? 0;
    const groupCount = overview.value.groupCount ?? 0;

    return [
      {
        label: '今日消息',
        icon: gm('pulse'),
        color: ice,
        value: thousands(todayMsg),
        unit: '条',
        tone: 'ice',
        foot: `<span class="mu">活跃群</span> ${thousands(activeToday)} <span class="mu">个</span>`,
      },
      {
        label: '累计消息',
        icon: gm('database'),
        color: gold,
        value: fmtNum(totalMsg),
        unit: '条',
        tone: 'gold',
        foot: `<span class="mu">群均</span> ${thousands(groupCount ? Math.round(totalMsg / groupCount) : 0)} <span class="mu">条</span>`,
      },
      {
        label: '群总数',
        icon: gm('grid'),
        color: green,
        value: thousands(overview.value.groupCount ?? 0),
        unit: '个',
        tone: 'green',
        foot: `<span class="mu">命名空间</span> ${thousands(overview.value.namespaces ?? 0)}`,
      },
      {
        label: '用户总数',
        icon: gm('users'),
        color: violet,
        value: thousands(userCount.value),
        unit: '人',
        tone: 'violet',
        foot: `<span class="mu">已绑定统计</span>`,
      },
      {
        label: '进程内存',
        icon: gm('dashboard'),
        color: ice,
        value: fmtBytes(r.memory?.rss),
        unit: '',
        tone: 'ice',
        foot: `<span class="mu">堆</span> ${r.memory?.heapPct ?? 0}% <span class="mu">· RSS</span>`,
      },
      {
        label: '在线账号',
        icon: gm('bot'),
        color: r.bots?.length ? green : '#E5533D',
        value: String(r.bots?.length ?? 0),
        unit: '个',
        tone: r.bots?.length ? 'green' : 'red',
        foot: r.bots?.length
          ? `<span class="mu">${botPlatforms.value || '适配器已连接'}</span>`
          : `<span class="mu">适配器未连接</span>`,
      },
    ];
  });

  /* ============================== 系统信息 ============================== */

  function cleanOs(s: string) {
    return String(s || '').replace('Windows_NT', 'Windows').replace(/_/g, ' ');
  }

  function cleanCpu(m: string) {
    return String(m || '')
      .replace(/\((R|TM)\)/g, '')
      .replace(/\s*CPU\s*@.*$/, '')
      .replace(/\s+with\s+.*$/i, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /**
   * 运行时长按「上次采集的秒数 + 本地流逝时间」推算 → 每秒自增，不用请求后端。
   * 这是大屏上最便宜的真·实时数字。
   */
  function elapsedSec(base?: number) {
    if (!base) return 0;
    const at = runtime.value.updatedAt ? Date.parse(runtime.value.updatedAt) : 0;
    if (!at) return base;
    return base + Math.max(0, Math.round((nowTick.value - at) / 1000));
  }

  const sysInfo = computed(() => {
    const s = runtime.value.system;
    return [
      { k: '操作系统', v: s?.osRelease ? cleanOs(s.osRelease) : '—' },
      { k: '处理器', v: s?.cpuModel ? cleanCpu(s.cpuModel) : '—' },
      // os.cpus().length 是逻辑核心（含超线程），不谎称物理核
      { k: '逻辑核心', v: s?.cpuCores ? `${s.cpuCores} 线程` : '—' },
      { k: '运行平台', v: s ? `${s.platform} / ${s.arch}` : '—' },
      { k: '进程内存', v: fmtBytes(runtime.value.memory?.rss) },
      { k: 'Node', v: runtime.value.nodeVersion || '—' },
      { k: 'Bot 运行', v: fmtDuration(elapsedSec(runtime.value.botUptime)) },
      { k: '主机在线', v: fmtDuration(elapsedSec(runtime.value.osUptime)) },
    ];
  });

  function maskUin(uin?: string) {
    const s = String(uin || '');
    if (s.length <= 3) return s || '—';
    return `${s.slice(0, 1)}**${s.slice(-3)}`;
  }

  /* ============================== 群数据 ============================== */

  const topGroups = computed(() => [...groups.value].sort((a, b) => b.total - a.total).slice(0, 5));

  /** 某群今日条数（实时脉冲） */
  function liveToday(gid: string) {
    return live.value?.groups?.[gid] ?? 0;
  }

  /** 走势按「最近活跃」排序，与上方累计排行走不同维度，避免两张卡内容重复 */
  const sparkRows = computed(() => {
    return [...groups.value]
      .filter((g) => g.total > 0)
      .sort((a, b) => (a.lastDate < b.lastDate ? 1 : a.lastDate > b.lastDate ? -1 : b.total - a.total))
      .slice(0, 5)
      .map((g) => {
        const p = sparkPath(g.daily || []);
        const peak = peakOf(g.daily || []);
        return { ...g, ...p, peak };
      });
  });

  function sparkPath(daily: DailyPoint[]) {
    const arr = daily.slice(-12).map((d) => d.n);
    const W = 120;
    const H = 34;
    const PAD = 5;
    if (arr.length < 2) return { line: '', area: '' };
    const max = Math.max(...arr, 1);
    const pts = arr.map((v, i) => [(i / (arr.length - 1)) * W, H - PAD - (v / max) * (H - PAD * 2)]);
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
    return { line, area: `${line} L ${W} ${H - PAD} L 0 ${H - PAD} Z` };
  }

  function peakOf(daily: DailyPoint[]) {
    if (!daily.length) return '—';
    let best = daily[0];
    for (const d of daily) if (d.n > best.n) best = d;
    return String(best.date || '').slice(5) || '—';
  }

  const maxRank = computed(() => topGroups.value[0]?.total || 1);
  function rankPct(n: number) {
    return `${Math.max(4, Math.round((n / maxRank.value) * 100))}%`;
  }

  /* ============================== AI ============================== */

  const aiColors = ['#4FC3F7', '#D4AF37', '#9D8DF0'];
  const aiSlices = computed(() => {
    const list = runtime.value.ai?.byModel ?? [];
    const sum = list.reduce((s, m) => s + m.calls, 0) || 1;
    return list.map((m) => ({
      name: m.model,
      short: shortenModel(m.model),
      value: m.calls,
      pct: Math.round((m.calls / sum) * 100),
    }));
  });

  function shortenModel(m: string) {
    return String(m || '').replace(/^.*\//, '').slice(0, 16) || '未知';
  }

  const promptPct = computed(() => {
    const a = runtime.value.ai;
    if (!a || !a.total) return 0;
    return Math.round((a.prompt / a.total) * 100);
  });

  const aiHead = computed(() => {
    const a = runtime.value.ai;
    if (!a) return '未接入';
    if (!a.isToday) return '今日暂无调用';
    return `${a.byModel.length} 个模型`;
  });

  /* ============================== 工具 ============================== */

  function fmtBytes(n?: number | null) {
    if (n == null) return '—';
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

  const botLabel = computed(() => {
    const b = runtime.value.bots?.[0];
    return b?.nickname ? `${b.nickname}（${maskUin(b.uin)}）` : 'Yunzai Bot';
  });

  function barColor(pct?: number | null) {
    if (pct == null) return 'rgba(255,255,255,0.12)';
    if (pct >= 90) return '#E5533D';
    if (pct >= 80) return '#E0A23C';
    return 'linear-gradient(90deg,#2E9BD6,#4FC3F7)';
  }

  /* ============================== 图表 ============================== */

  const trendRef = ref<HTMLDivElement | null>(null);
  const aiRef = ref<HTMLDivElement | null>(null);
  const cpuRef = ref<HTMLDivElement | null>(null);
  const memRef = ref<HTMLDivElement | null>(null);

  const trendChart = useECharts(trendRef);
  const aiChart = useECharts(aiRef);
  const cpuChart = useECharts(cpuRef);
  const memChart = useECharts(memRef);

  const ICE = '#4FC3F7';
  const GOLD = '#D4AF37';

  /**
   * useECharts.setOptions 默认 clear=true（先 clear 再 set），高频刷新下会整张闪掉。
   * 首帧仍用 clear 拿到干净实例，之后传 false 走合并 → 数值变化才有平滑过渡动画。
   */
  const ready = { trend: false, ai: false, cpu: false, mem: false };
  function resetCharts() {
    ready.trend = ready.ai = ready.cpu = ready.mem = false;
  }

  function renderTrend() {
    if (!trend.value.length) return;
    const base = chartBase(true);
    trendChart.setOptions({
      grid: { top: 16, right: 14, bottom: 22, left: 44 },
      tooltip: { ...base.tooltip, trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: trend.value.map((t) => t.date.slice(5)),
        boundaryGap: false,
        axisLine: { lineStyle: { color: base.grid } },
        axisTick: { show: false },
        axisLabel: { ...base.axisLabel, fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { ...base.axisLabel, fontSize: 10 },
        splitLine: base.splitLine,
      },
      series: [
        {
          name: '接收',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: trend.value.map((t) => t.recv),
          lineStyle: { width: 2.2, color: ICE },
          itemStyle: { color: ICE },
          areaStyle: { color: areaGradient(trendChart.echarts, ICE, 0.3) },
        },
        {
          name: '发送',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: trend.value.map((t) => t.send),
          lineStyle: { width: 1.8, color: GOLD },
          itemStyle: { color: GOLD },
          areaStyle: { color: areaGradient(trendChart.echarts, GOLD, 0.14) },
        },
      ],
    }, !ready.trend);
    ready.trend = true;
  }

  function renderAi() {
    if (!aiSlices.value.length) return;
    const base = chartBase(true);
    aiChart.setOptions({
      tooltip: { ...base.tooltip, trigger: 'item', formatter: '{b}<br/>{c} 次（{d}%）' },
      series: [
        {
          type: 'pie',
          radius: ['66%', '86%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: { borderWidth: 2, borderColor: 'rgba(8,20,34,0.9)', borderRadius: 4 },
          label: { show: false },
          labelLine: { show: false },
          data: aiSlices.value.map((s, i) => ({
            name: s.name,
            value: s.value,
            itemStyle: { color: aiColors[i % aiColors.length] },
          })),
        },
      ],
    }, !ready.ai);
    ready.ai = true;
  }

  /** 全环仪表：比原来的 240° 弧更符合「占比」直觉 */
  function renderGauge(key: 'cpu' | 'mem', chart: any, val: number | null, name: string, color: string) {
    const v = val == null ? 0 : Math.min(100, Math.max(0, val));
    const auto = v >= 97 ? '#E5533D' : v >= 90 ? '#E0A23C' : color;
    chart.setOptions({
      // 高频刷新时靠 update 动画把指针「推」过去，而不是瞬间跳变
      animationDurationUpdate: 700,
      animationEasingUpdate: 'cubicOut',
      series: [
        {
          type: 'gauge',
          startAngle: 90,
          endAngle: -270,
          min: 0,
          max: 100,
          radius: '92%',
          center: ['50%', '50%'],
          progress: { show: true, width: 9, roundCap: true, itemStyle: { color: auto } },
          axisLine: { roundCap: true, lineStyle: { width: 9, color: [[1, 'rgba(255,255,255,0.09)']] } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          pointer: { show: false },
          anchor: { show: false },
          title: { show: false },
          detail: {
            offsetCenter: [0, '2%'],
            formatter: val == null ? '--' : `${val}%`,
            color: '#eaf3ff',
            fontSize: 21,
            fontWeight: 700,
          },
          data: [{ value: v, name }],
        },
      ],
    }, !ready[key]);
    ready[key] = true;
  }

  function renderGauges() {
    // value 为 number 时 ECharts 才会做过渡；null 传 0 会显示成 0%，所以单独处理 detail
    renderGauge('cpu', cpuChart, runtime.value.cpuUsage ?? null, 'CPU', ICE);
    // 堆内存用紫色：金色/琥珀留给告警语义，避免「正常态看着像告警」
    renderGauge('mem', memChart, runtime.value.memory?.heapPct ?? null, '堆', '#9D8DF0');
  }

  function renderAll() {
    renderTrend();
    renderAi();
    renderGauges();
  }

  /* ============================== 数据加载 ============================== */

  /**
   * 两层刷新：快层 2 秒、慢层 30 秒。
   *
   * 快层只打 /runtime 与 /live —— 前者是系统/进程读数，后者是 1 次 MGET 的计数快照，
   * 都跟「有没有人发消息」无关，代价极低，可以高频。
   * 慢层是 Redis 聚合（直方图 SCAN、群/用户汇总），本身还带 60 秒后端缓存，
   * 打再快也没有新数据，只会白白增加主进程负担。
   */
  let fastBusy = false;
  let slowBusy = false;
  /** 慢层预热兜底只补拉一次，避免适配器未连完时空表被反复请求 */
  let slowRetried = false;
  /** 上一次渲染仪表时的关键值，没变就不重绘 */
  let gaugeSig = '';

  function makeTracker() {
    let fail = 0;
    const track = <T,>(p: Promise<T>, onOk: (v: T) => void) =>
      p
        .then((v) => {
          onOk(v);
        })
        .catch(() => {
          fail++;
        });
    return { track, fails: () => fail };
  }

  /**
   * 实时采样结果落地：消息计数只增不减，避免群缓存换轮时 KPI 往回跳。
   */
  function applyLive(v: LiveInfo | null) {
    live.value = v;
    if (!v?.available || !v.groups || !Object.keys(v.groups).length) return;
    const g = liveGuard.value;
    const sameDay = g.day === v.day;
    liveGuard.value = {
      day: v.day,
      today: sameDay ? Math.max(g.today, v.todayMsg) : v.todayMsg,
      total: sameDay ? Math.max(g.total, v.totalMsg) : v.totalMsg,
      active: v.activeToday,
    };
  }

  async function loadFast() {
    if (fastBusy) return;
    fastBusy = true;
    const prevAi = runtime.value.ai?.calls ?? -1;
    const { track, fails } = makeTracker();

    try {
      await Promise.all([
        track(statsApi.getRuntime(), (r) => r && (runtime.value = r)),
        track(statsApi.getLive(), (r) => applyLive(r ?? null)),
      ]);
    } finally {
      fastBusy = false;
    }

    const fail = fails();
    fastFail.value = fail;
    if (fail < 2) lastOkAt.value = Date.now();
    booting.value = false;

    await nextTick();
    const sig = `${runtime.value.cpuUsage}|${runtime.value.memory?.heapPct}`;
    if (sig !== gaugeSig) {
      gaugeSig = sig;
      renderGauges();
    }
    // AI 调用数变了才重绘甜甜圈，否则每 2 秒重画一次会一直转
    if ((runtime.value.ai?.calls ?? -1) !== prevAi) renderAi();
  }

  async function loadSlow() {
    if (slowBusy) return;
    slowBusy = true;
    const { track, fails } = makeTracker();

    try {
      await Promise.all([
        track(statsApi.getOverview(), (r) => r && (overview.value = r)),
        track(statsApi.getTrend(14), (r) => (trend.value = r?.trend ?? [])),
        track(
          statsApi.getGroups({ page: 1, size: 100, sort: 'total', order: 'desc' }),
          (r) => (groups.value = r?.list ?? []),
        ),
        track(statsApi.getUsers({ page: 1, size: 1 }), (r) => {
          if (r?.summary) userCount.value = r.summary.userCount;
        }),
      ]);
    } finally {
      slowBusy = false;
    }

    const fail = fails();
    slowFail.value = fail;
    if (fail < 4) lastOkAt.value = Date.now();
    booting.value = false;

    await nextTick();
    renderTrend();

    // 预热期兜底：Bot 刚重启时适配器可能还没连完，后端会返回空群表（3 秒短缓存）。
    // 与其等下一个 30 秒慢轮询，4 秒后主动补拉一次，用户就不用看 30 秒「暂无群数据」。
    if (
      !slowRetried &&
      !groups.value.length &&
      !trend.value.length &&
      (overview.value.groupCount ?? 0) > 0
    ) {
      slowRetried = true;
      setTimeout(() => {
        loadSlow();
      }, 4000);
    }
  }

  /** 全屏切换后容器尺寸变了，清掉首帧标记，让图表按新尺寸重建一次 */
  function rerenderAll() {
    resetCharts();
    renderAll();
  }

  /* ============================== 生命周期 ============================== */

  let clockTimer: ReturnType<typeof setInterval> | null = null;
  let fastTimer: ReturnType<typeof setInterval> | null = null;
  let slowTimer: ReturnType<typeof setInterval> | null = null;

  function tickClock() {
    const d = new Date();
    nowTick.value = d.getTime();
    const p = (n: number) => String(n).padStart(2, '0');
    clock.value = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const isFull = isFullscreen;
  function toggleFull() {
    toggleFullscreen();
  }

  watch(isFullscreen, () => nextTick(rerenderAll));

  /** 切回标签页时补一次，避免后台节流导致的「数据停住」 */
  function onVisible() {
    if (!document.hidden) {
      tickClock();
      loadFast();
    }
  }

  onMounted(() => {
    tickClock();
    loadFast();
    loadSlow();
    clockTimer = setInterval(tickClock, 1000);
    // 快层：系统/进程读数 + 今日/累计计数（1 次 MGET），2 秒一次
    fastTimer = setInterval(() => {
      if (document.hidden) return;
      loadFast();
    }, FAST_MS);
    // 慢层：Redis 聚合（后端本身有 60 秒缓存），30 秒一次
    slowTimer = setInterval(() => {
      if (document.hidden) return;
      loadSlow();
    }, SLOW_MS);
    document.addEventListener('visibilitychange', onVisible);
  });

  onBeforeUnmount(() => {
    if (clockTimer) clearInterval(clockTimer);
    if (fastTimer) clearInterval(fastTimer);
    if (slowTimer) clearInterval(slowTimer);
    document.removeEventListener('visibilitychange', onVisible);
  });
</script>

<style lang="less">
  /* 大屏页固定深海蓝科技风，不随主题切换 —— 用全局样式便于覆盖 echarts 容器 */
  .scr {
    --scr-ice: #4fc3f7;
    --scr-gold: #d4af37;
    --scr-text: #e6f2fc;
    --scr-sub: #a7bdd2;
    --scr-mute: rgba(167, 189, 210, 0.62);
    --scr-line: rgba(79, 195, 247, 0.22);
    --scr-panel: rgba(13, 32, 51, 0.72);
    --scr-cyan-hi: #6fd4ff;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: calc(100vh - 130px);
    padding: 12px 14px 10px;
    color: var(--scr-text);
    background:
      radial-gradient(900px 300px at 50% -60px, rgba(79, 195, 247, 0.14), transparent 70%),
      linear-gradient(0deg, rgba(79, 195, 247, 0.04) 1px, transparent 1px) 0 0 / 100% 30px,
      linear-gradient(90deg, rgba(79, 195, 247, 0.04) 1px, transparent 1px) 0 0 / 30px 100%,
      linear-gradient(165deg, #081422 0%, #0b1c2e 55%, #0d2033 100%);
    border-radius: 14px;
    border: 1px solid var(--scr-line);
  }

  /* ---------------- 角标 ---------------- */
  .scr .corner {
    position: absolute;
    width: 7px;
    height: 7px;
    border-color: rgba(79, 195, 247, 0.55);
    border-style: solid;
    border-width: 0;
    pointer-events: none;
  }
  .scr .corner--tl { top: -1px; left: -1px; border-top-width: 1px; border-left-width: 1px; }
  .scr .corner--tr { top: -1px; right: -1px; border-top-width: 1px; border-right-width: 1px; }
  .scr .corner--bl { bottom: -1px; left: -1px; border-bottom-width: 1px; border-left-width: 1px; }
  .scr .corner--br { bottom: -1px; right: -1px; border-bottom-width: 1px; border-right-width: 1px; }

  /* ---------------- 顶栏 ---------------- */
  .scr-head {
    position: relative;
    display: flex;
    gap: 16px;
    align-items: center;
    flex: none;
    height: 54px;
    padding: 0 16px;
    background: linear-gradient(90deg, rgba(79, 195, 247, 0.09), rgba(79, 195, 247, 0.015));
    border: 1px solid var(--scr-line);
    border-left: 2px solid #45b97c;
    border-radius: 11px;
    transition: border-color 0.35s, background 0.35s;
  }
  .scr[data-state='warn'] .scr-head {
    border-left-color: #e0a23c;
    background: linear-gradient(90deg, rgba(224, 162, 60, 0.11), rgba(79, 195, 247, 0.015));
  }
  .scr[data-state='bad'] .scr-head {
    border-left-color: #e5533d;
    background: linear-gradient(90deg, rgba(229, 83, 61, 0.12), rgba(79, 195, 247, 0.015));
  }

  .scr-lamp {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #45b97c;
    flex: none;
    box-shadow: 0 0 0 3px rgba(69, 185, 124, 0.14);
    animation: scr-pulse 2.4s ease-in-out infinite;
  }
  .scr-lamp[data-s='warn'] { background: #e0a23c; box-shadow: 0 0 0 3px rgba(224, 162, 60, 0.14); }
  .scr-lamp[data-s='bad'] { background: #e5533d; box-shadow: 0 0 0 3px rgba(229, 83, 61, 0.14); }
  @keyframes scr-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.42; }
  }
  @media (prefers-reduced-motion: reduce) {
    .scr-lamp { animation: none; }
  }

  .scr-head__brand {
    display: flex;
    gap: 9px;
    align-items: center;
    flex: none;
    padding-right: 14px;
    border-right: 1px solid var(--scr-line);
  }
  .scr-head__names { line-height: 1.25; }
  .scr-head__name {
    font-size: 13px;
    font-weight: 600;
    color: var(--scr-text);
    white-space: nowrap;
  }
  .scr-head__sub {
    font-size: 10px;
    color: var(--scr-mute);
    white-space: nowrap;
  }

  .scr-head__state {
    flex: none;
    font-size: 13.5px;
    font-weight: 600;
  }
  .scr-head__state em {
    margin-left: 7px;
    font-size: 11px;
    font-style: normal;
    font-weight: 400;
    color: var(--scr-sub);
  }
  .scr[data-state='warn'] .scr-head__state { color: #f0c072; }
  .scr[data-state='bad'] .scr-head__state { color: #ff8b78; }

  .scr-head__tags {
    display: flex;
    gap: 6px;
    overflow: hidden;
  }
  .scr-tag {
    flex: none;
    font-size: 10.5px;
    color: var(--scr-sub);
    padding: 2px 8px;
    border-radius: 20px;
    background: rgba(30, 62, 96, 0.6);
    border: 1px solid var(--scr-line);
    white-space: nowrap;
  }
  .scr-tag[data-s='warn'] {
    color: #f0c072;
    border-color: rgba(224, 162, 60, 0.34);
    background: rgba(224, 162, 60, 0.1);
  }
  .scr-tag[data-s='bad'] {
    color: #ff8b78;
    border-color: rgba(229, 83, 61, 0.34);
    background: rgba(229, 83, 61, 0.1);
  }

  .scr-head__right {
    display: flex;
    gap: 12px;
    align-items: center;
    flex: none;
    margin-left: auto;
  }
  /* 顶部「实时」指示：呼吸点 + 距上次采集秒数，秒数每秒+1 本身就在动 */
  .scr-live {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    color: var(--scr-mute);
    white-space: nowrap;
  }
  .scr-live__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #45b97c;
    box-shadow: 0 0 0 0 rgba(69, 185, 124, 0.55);
    animation: livePulse 1.8s ease-out infinite;
  }
  .scr-live b {
    font-size: 11px;
    font-weight: 600;
    color: #45b97c;
    font-variant-numeric: tabular-nums;
    min-width: 20px;
  }
  .scr-live[data-s='warn'] .scr-live__dot { background: #e0a23c; box-shadow: 0 0 0 0 rgba(224, 162, 60, 0.55); }
  .scr-live[data-s='warn'] b { color: #e0a23c; }
  .scr-live[data-s='bad'] .scr-live__dot { background: #e5533d; box-shadow: 0 0 0 0 rgba(229, 83, 61, 0.55); animation-duration: 0.9s; }
  .scr-live[data-s='bad'] b { color: #e5533d; }

  @keyframes livePulse {
    0% { box-shadow: 0 0 0 0 rgba(69, 185, 124, 0.5); }
    70% { box-shadow: 0 0 0 6px rgba(69, 185, 124, 0); }
    100% { box-shadow: 0 0 0 0 rgba(69, 185, 124, 0); }
  }

  .scr-clock {
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 17px;
    font-weight: 700;
    color: var(--scr-ice);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.5px;
    padding-left: 12px;
    border-left: 1px solid var(--scr-line);
    text-shadow: 0 0 12px rgba(79, 195, 247, 0.45);
  }
  .scr-full-btn.ant-btn {
    color: var(--scr-sub);
    background: transparent;
    border-color: var(--scr-line);
  }
  .scr-full-btn.ant-btn:hover {
    color: var(--scr-cyan-hi);
    border-color: rgba(79, 195, 247, 0.45);
  }

  /* ---------------- KPI ---------------- */
  .scr-kpi {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;
    flex: none;
  }
  .scr-kpi__card {
    position: relative;
    padding: 9px 12px 8px;
    background: linear-gradient(180deg, rgba(18, 42, 66, 0.85), rgba(10, 24, 40, 0.78));
    border: 1px solid var(--scr-line);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .scr-kpi__card::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(79, 195, 247, 0.45), transparent);
  }
  .scr-kpi__hd {
    display: flex;
    gap: 5px;
    align-items: center;
    font-size: 10.5px;
    color: var(--scr-sub);
    letter-spacing: 0.3px;
  }
  .scr-kpi__val {
    margin-top: 5px;
    font-size: 26px;
    font-weight: 600;
    line-height: 1.1;
    letter-spacing: -0.6px;
    font-variant-numeric: tabular-nums;
    color: #eaf3ff;
    /* 数值变化时整个节点会重挂（模板里 :key 绑了 value），动画自然重放 */
    animation: kpiBump 0.42s cubic-bezier(0.22, 0.61, 0.36, 1);
  }
  @keyframes kpiBump {
    from {
      opacity: 0.3;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  .scr-kpi__val small {
    margin-left: 3px;
    font-size: 11px;
    font-weight: 400;
    color: var(--scr-mute);
  }
  .scr-kpi__ft {
    margin-top: auto;
    padding-top: 4px;
    font-size: 10px;
    color: var(--scr-sub);
    font-variant-numeric: tabular-nums;
  }
  .scr-kpi__ft .mu { color: var(--scr-mute); }
  .scr-kpi__card[data-tone='gold'] .scr-kpi__val { color: #f0c072; }
  .scr-kpi__card[data-tone='green'] .scr-kpi__val { color: #6fdcb0; }
  .scr-kpi__card[data-tone='violet'] .scr-kpi__val { color: #b3a7f5; }
  .scr-kpi__card[data-tone='red'] .scr-kpi__val { color: #ff8b78; }

  /* ---------------- 主区 ---------------- */
  .scr-main {
    position: relative;
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-template-rows: 1fr 1fr;
    gap: 10px;
  }
  .scr-panel {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 8px 11px 9px;
    background: var(--scr-panel);
    border: 1px solid var(--scr-line);
    border-radius: 10px;
    overflow: hidden;
  }
  .scr-panel--trend { grid-column: span 5; }
  .scr-panel--core { grid-column: span 3; }
  .scr-panel--ai { grid-column: span 4; }
  .scr-panel--rank { grid-column: span 4; }
  .scr-panel--spark { grid-column: span 4; }
  .scr-panel--sys { grid-column: span 4; }

  .scr-panel__head {
    display: flex;
    gap: 7px;
    align-items: center;
    flex: none;
    min-height: 18px;
    margin-bottom: 6px;
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: 0.8px;
    color: #c3d6ec;
  }
  .scr-panel__tag {
    width: 2px;
    height: 11px;
    border-radius: 1px;
    background: var(--scr-ice);
    flex: none;
    opacity: 0.85;
  }
  .scr-panel__extra {
    margin-left: auto;
    display: flex;
    gap: 6px;
    align-items: center;
    font-size: 10px;
    font-style: normal;
    font-weight: 400;
    color: var(--scr-mute);
    letter-spacing: 0;
  }
  .scr-panel__extra .lg {
    width: 7px;
    height: 2px;
    border-radius: 1px;
    display: inline-block;
  }
  .scr-panel__extra .lg--ice { background: #4fc3f7; }
  .scr-panel__extra .lg--gold { background: #d4af37; }

  .scr-chart { width: 100%; }
  .scr-chart--trend { flex: 1; min-height: 0; }
  .scr-chart--gauge { width: 42%; height: 100%; min-width: 74px; }
  .scr-chart--ring { width: 100%; height: 100%; }

  .scr-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11.5px;
    color: var(--scr-mute);
  }
  .scr-empty--sm { flex: none; padding: 8px 0; font-size: 10.5px; }

  /* ---------------- 运行核心 ---------------- */
  .scr-gauges {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: space-around;
    gap: 6px;
  }
  .scr-bars {
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding-top: 4px;
  }
  .scr-bar__hd {
    display: flex;
    align-items: baseline;
    gap: 5px;
    font-size: 10px;
    color: var(--scr-mute);
    margin-bottom: 3px;
  }
  .scr-bar__hd b {
    font-weight: 500;
    color: var(--scr-sub);
    font-variant-numeric: tabular-nums;
  }
  .scr-bar__hd em {
    margin-left: auto;
    font-style: normal;
    font-variant-numeric: tabular-nums;
    color: var(--scr-sub);
  }
  .scr-bar__hd .is-na,
  .scr-bar__hd em.is-na { color: rgba(167, 189, 210, 0.42); }
  .scr-bar__track {
    height: 5px;
    border-radius: 3px;
    background: rgba(30, 62, 96, 0.9);
    overflow: hidden;
  }
  .scr-bar__track i {
    display: block;
    height: 100%;
    border-radius: 3px;
    transition: width 0.6s ease, background 0.3s;
  }

  /* ---------------- AI ---------------- */
  .scr-ai {
    flex: 1;
    min-height: 0;
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .scr-ai__ring {
    position: relative;
    width: 108px;
    height: 108px;
    flex: none;
  }
  .scr-ai__cen {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    line-height: 1.15;
  }
  .scr-ai__cen b {
    font-size: 17px;
    font-weight: 600;
    color: #eaf3ff;
    font-variant-numeric: tabular-nums;
  }
  .scr-ai__cen span {
    font-size: 10px;
    color: var(--scr-mute);
  }
  .scr-ai__side {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .scr-ai__row {
    display: flex;
    gap: 5px;
    align-items: center;
    font-size: 10px;
    color: var(--scr-sub);
  }
  .scr-ai__row i {
    width: 6px;
    height: 6px;
    border-radius: 1.5px;
    flex: none;
  }
  .scr-ai__row span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .scr-ai__row b {
    margin-left: auto;
    font-weight: 600;
    color: var(--scr-text);
    font-variant-numeric: tabular-nums;
  }
  .scr-ai__note {
    margin-top: 2px;
    font-size: 10px;
    color: var(--scr-mute);
  }
  .scr-ai__kv {
    flex: none;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 5px;
    margin-top: 6px;
  }
  .scr-ai__kv div {
    padding: 5px 6px;
    border-radius: 6px;
    background: rgba(20, 44, 70, 0.6);
    border: 1px solid rgba(79, 195, 247, 0.1);
    text-align: center;
    line-height: 1.25;
  }
  .scr-ai__kv span {
    display: block;
    font-size: 10px;
    color: var(--scr-mute);
  }
  .scr-ai__kv b {
    font-size: 12px;
    font-weight: 600;
    color: var(--scr-text);
    font-variant-numeric: tabular-nums;
  }
  .scr-ai__kv b.is-warn { color: #f0c072; }
  .scr-ai__kv b.is-na { color: rgba(167, 189, 210, 0.4); }

  /* ---------------- 排行 ---------------- */
  .scr-rank {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 9px;
    justify-content: center;
  }
  .scr-rank__row {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 11px;
  }
  .scr-rank__no {
    width: 15px;
    height: 15px;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    border-radius: 3px;
    color: var(--scr-mute);
    background: rgba(30, 62, 96, 0.7);
  }
  .scr-rank__no.is-1 { background: rgba(212, 175, 55, 0.22); color: #f0c072; }
  .scr-rank__no.is-2 { background: rgba(79, 195, 247, 0.18); color: var(--scr-cyan-hi); }
  .scr-rank__no.is-3 { background: rgba(157, 141, 240, 0.18); color: #b3a7f5; }
  .scr-rank__name {
    width: 116px;
    flex: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--scr-sub);
    font-weight: 500;
  }
  .scr-rank__name.is-plain { color: var(--scr-mute); font-weight: 400; }
  .scr-rank__track {
    flex: 1;
    height: 5px;
    border-radius: 3px;
    background: rgba(30, 62, 96, 0.8);
    overflow: hidden;
  }
  .scr-rank__track i {
    display: block;
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, rgba(79, 195, 247, 0.45), rgba(111, 212, 255, 0.95));
    transition: width 0.6s ease;
  }
  .scr-rank__val {
    width: 50px;
    flex: none;
    text-align: right;
    color: var(--scr-text);
    font-variant-numeric: tabular-nums;
  }
  /* 今日增量：永远占位，避免 0 与有值时轨道宽度来回抽动 */
  .scr-rank__live {
    width: 34px;
    flex: none;
    text-align: right;
    font-size: 10px;
    font-style: normal;
    color: var(--scr-mute);
    font-variant-numeric: tabular-nums;
  }
  .scr-rank__live.is-hot { color: #45b97c; }

  /* ---------------- 群活跃走势 ---------------- */
  .scr-spark {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 7px;
    justify-content: center;
  }
  .scr-spark__row {
    display: grid;
    grid-template-columns: 108px 1fr 58px;
    gap: 9px;
    align-items: center;
  }
  .scr-spark__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 10.5px;
    font-weight: 500;
    color: var(--scr-sub);
  }
  .scr-spark__name.is-plain { color: var(--scr-mute); font-weight: 400; }
  .scr-spark__svg {
    width: 100%;
    height: 30px;
    display: block;
  }
  .scr-spark__meta {
    text-align: right;
    line-height: 1.25;
  }
  .scr-spark__meta b {
    display: block;
    font-size: 10px;
    font-weight: 600;
    color: var(--scr-text);
    font-variant-numeric: tabular-nums;
  }
  .scr-spark__meta em {
    font-size: 10px;
    font-style: normal;
    color: var(--scr-mute);
  }

  /* ---------------- 系统与账号 ---------------- */
  .scr-info {
    flex: none;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 12px;
  }
  .scr-info__item {
    display: flex;
    font-size: 10px;
    line-height: 1.6;
    padding: 2px 0;
    border-bottom: 1px solid rgba(79, 195, 247, 0.07);
  }
  .scr-info__item span {
    flex: none;
    margin-right: 6px;
    color: var(--scr-mute);
  }
  .scr-info__item b {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
    color: var(--scr-sub);
  }
  .scr-info__item b.is-na { color: rgba(167, 189, 210, 0.4); }

  .scr-bots {
    flex: none;
    margin-top: 6px;
  }
  .scr-bots__title {
    font-size: 10px;
    letter-spacing: 0.5px;
    color: var(--scr-mute);
    margin-bottom: 3px;
  }
  .scr-bots__list {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .scr-bot-row {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 3px 7px;
    border-radius: 5px;
    background: rgba(20, 44, 70, 0.55);
    border: 1px solid rgba(79, 195, 247, 0.09);
    font-size: 10px;
  }
  .scr-bot-row__uin {
    flex: none;
    width: 66px;
    color: var(--scr-text);
    font-variant-numeric: tabular-nums;
    font-weight: 500;
  }
  .scr-bot-row__pf {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--scr-mute);
    font-size: 10px;
  }
  .scr-bot-row em {
    flex: none;
    font-style: normal;
    font-size: 10px;
    color: #45b97c;
  }
  .scr-bot-row em.is-off { color: #e5533d; }
  .scr-bot__dot.is-off { background: #e5533d; }
  .scr-bot__dot,
  .scr-bot-row i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #45b97c;
    flex: none;
  }
  .scr-bot__dot.is-off { background: #e5533d; }

  .scr-sysline {
    flex: none;
    display: flex;
    gap: 10px;
    margin-top: 5px;
    padding-top: 4px;
    border-top: 1px solid rgba(79, 195, 247, 0.08);
    font-size: 10px;
    color: var(--scr-mute);
  }

  /* ---------------- 断采遮罩 ---------------- */
  .scr-stale {
    position: absolute;
    inset: -1px;
    z-index: 6;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(6, 14, 24, 0.9);
    border-radius: 10px;
  }
  .scr-stale__box {
    text-align: center;
    max-width: 440px;
    padding: 18px 22px;
    border: 1px solid rgba(229, 83, 61, 0.34);
    border-radius: 10px;
    background: rgba(38, 14, 14, 0.55);
  }
  .scr-stale__box b {
    display: flex;
    gap: 6px;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    color: #ff8b78;
    margin-bottom: 8px;
  }
  .scr-stale__box b i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #e5533d;
  }
  .scr-stale__box p {
    margin: 0 0 4px;
    font-size: 11px;
    line-height: 1.6;
    color: var(--scr-sub);
  }
  .scr-stale__box p em {
    font-style: normal;
    color: #ff8b78;
  }
  .scr-stale__box span {
    display: block;
    margin-top: 8px;
    font-size: 10px;
    color: var(--scr-mute);
  }

  /* ---------------- 告警带 ---------------- */
  .scr-alarm {
    flex: none;
    display: flex;
    gap: 10px;
    align-items: stretch;
    height: 92px;
    padding: 9px 12px;
    background: var(--scr-panel);
    border: 1px solid var(--scr-line);
    border-radius: 10px;
  }
  .scr-alarm[data-s='warn'] { border-color: rgba(224, 162, 60, 0.3); }
  .scr-alarm[data-s='bad'] { border-color: rgba(229, 83, 61, 0.3); }

  .scr-alarm__left {
    flex: none;
    width: 100px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1px;
    padding-right: 10px;
    border-right: 1px solid var(--scr-line);
  }
  .scr-alarm__left b {
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: 0.8px;
    color: #c3d6ec;
  }
  .scr-alarm__left span {
    font-size: 22px;
    font-weight: 600;
    line-height: 1.1;
    color: #45b97c;
    font-variant-numeric: tabular-nums;
  }
  .scr-alarm[data-s='warn'] .scr-alarm__left span { color: #e0a23c; }
  .scr-alarm[data-s='bad'] .scr-alarm__left span { color: #e5533d; }
  .scr-alarm__left em {
    font-size: 10px;
    font-style: normal;
    color: var(--scr-mute);
  }

  .scr-alarm__list {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    align-items: center;
  }
  .scr-alarm__item {
    display: flex;
    gap: 7px;
    min-width: 0;
    padding: 6px 8px;
    border-radius: 7px;
    background: rgba(20, 44, 70, 0.55);
    border: 1px solid rgba(79, 195, 247, 0.1);
  }
  .scr-alarm__bar {
    width: 2px;
    border-radius: 2px;
    flex: none;
    background: #45b97c;
  }
  .scr-alarm__item[data-lv='warn'] .scr-alarm__bar { background: #e0a23c; }
  .scr-alarm__item[data-lv='bad'] .scr-alarm__bar { background: #e5533d; }
  .scr-alarm__item > div {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .scr-alarm__item b {
    font-size: 10.5px;
    font-weight: 500;
    color: var(--scr-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .scr-alarm__item span {
    font-size: 10px;
    color: var(--scr-mute);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .scr-alarm__right {
    flex: none;
    width: 116px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    padding-left: 10px;
    border-left: 1px solid var(--scr-line);
    font-size: 10px;
    color: var(--scr-mute);
  }
  .scr-alarm__right b {
    color: var(--scr-sub);
    font-weight: 500;
  }

  /* ---------------- 自适应 ---------------- */
  @media (max-width: 1600px) {
    .scr-kpi__val { font-size: 23px; }
    .scr-rank__name { width: 92px; }
    .scr-spark__row { grid-template-columns: 88px 1fr 52px; gap: 7px; }
    .scr-ai__ring { width: 92px; height: 92px; }
  }
  @media (max-width: 1280px) {
    .scr { min-height: auto; }
    .scr-kpi { grid-template-columns: repeat(3, 1fr); }
    .scr-main { grid-template-columns: repeat(6, 1fr); grid-template-rows: none; }
    .scr-panel--trend,
    .scr-panel--core,
    .scr-panel--ai,
    .scr-panel--rank,
    .scr-panel--spark,
    .scr-panel--sys { grid-column: span 3; min-height: 210px; }
    .scr-panel--trend,
    .scr-panel--ai { grid-column: span 6; }
    .scr-alarm { height: auto; flex-direction: column; }
    .scr-alarm__left {
      width: auto;
      flex-direction: row;
      align-items: baseline;
      gap: 10px;
      padding: 0 0 7px;
      border-right: 0;
      border-bottom: 1px solid var(--scr-line);
    }
    .scr-alarm__list { grid-template-columns: repeat(2, 1fr); }
    .scr-alarm__right {
      width: auto;
      flex-direction: row;
      gap: 12px;
      padding: 7px 0 0;
      border-left: 0;
      border-top: 1px solid var(--scr-line);
    }
    .scr-head { height: auto; flex-wrap: wrap; padding: 9px 12px; }
    .scr-head__right { width: 100%; margin-left: 0; justify-content: space-between; }
  }
  @media (max-width: 760px) {
    .scr-kpi { grid-template-columns: repeat(2, 1fr); }
    .scr-panel--trend,
    .scr-panel--core,
    .scr-panel--ai,
    .scr-panel--rank,
    .scr-panel--spark,
    .scr-panel--sys { grid-column: span 6; }
    .scr-alarm__list { grid-template-columns: 1fr; }
  }
</style>
