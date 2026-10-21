<template>
  <PageWrapper title="">
    <div class="ya">
      <!-- 页头 -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">YING AI · PRIVATE</div>
          <div class="db-hero__title">荧 · 私聊管理</div>
          <div class="db-hero__desc">
            用户关系、聊天记录与回复风格智能诊断
            <span class="g-chip ya-hero__chip" :class="overview.globalEnabled ? 'is-on' : 'is-off'">
              <span class="ya-hero__dot" />全局私聊{{ overview.globalEnabled ? '已开启' : '已关闭' }}
            </span>
          </div>
        </div>
        <div class="db-hero__side">
          <span class="ya-updated">更新于 {{ updatedText }}</span>
          <Button size="small" :loading="loading" @click="loadAll">刷新</Button>
        </div>
      </section>

      <!-- KPI -->
      <section class="ya-kpi">
        <div v-for="c in kpiCards" :key="c.label" class="g-stat" :class="c.tone">
          <div class="g-stat__label">
            <span class="g-stat__dot" />{{ c.label }}
          </div>
          <div class="g-stat__value">
            {{ c.value }}<span v-if="c.unit" class="g-stat__unit">{{ c.unit }}</span>
          </div>
          <div class="g-stat__foot">{{ c.foot }}</div>
        </div>
      </section>

      <!-- 关系与消息分布 -->
      <section class="ya-viz">
        <div class="g-card ya-panel ya-viz__donut">
          <div class="gm-panel__head">
            <div class="gm-panel__title"><i><Icon :icon="$gm('chart-pie')" :size="13" /></i>阶段分布</div>
            <span class="gm-panel__extra">按关系阶段</span>
          </div>
          <div ref="stageRef" class="ya-chart ya-chart--donut" />
          <div v-if="!stageData.length" class="g-empty ya-chart__empty">
            <div class="g-empty__title">暂无关系阶段</div>
            <div class="g-empty__desc">用户与荧聊过天后才会归档阶段</div>
          </div>
        </div>

        <div class="g-card ya-panel ya-viz__scatter">
          <div class="gm-panel__head">
            <div class="gm-panel__title"><i><Icon :icon="$gm('chart-dot')" :size="13" /></i>亲密 × 熟悉</div>
            <span class="gm-panel__extra">点越大消息越多 · 共 {{ distRows.length }} 位</span>
          </div>
          <div ref="scatterRef" class="ya-chart ya-chart--scatter" />
          <div v-if="!distRows.length" class="g-empty ya-chart__empty">
            <div class="g-empty__title">暂无关系数据</div>
            <div class="g-empty__desc">关系值来自私聊记忆里的 closeness / familiarity</div>
          </div>
        </div>

        <div class="g-card ya-panel ya-viz__rank">
          <div class="gm-panel__head">
            <div class="gm-panel__title"><i><Icon :icon="$gm('chart-bar')" :size="13" /></i>消息量 TOP 8</div>
            <span class="gm-panel__extra">用户 / 荧</span>
          </div>
          <div ref="rankRef" class="ya-chart ya-chart--rank" />
          <div v-if="!rankData.length" class="g-empty ya-chart__empty">
            <div class="g-empty__title">暂无消息</div>
            <div class="g-empty__desc">私聊会话窗口内还没有收发记录</div>
          </div>
        </div>
      </section>

      <!-- 用户表 -->
      <div class="g-card ya-panel">
        <div class="ya-panel__head">
          <div class="ya-panel__title"><Icon :icon="$gm('users')" :size="15" /> 用户表</div>
          <div class="ya-panel__tools">
            <GSearch
              v-model="query.q"
              size="small"
              width="200px"
              placeholder="搜索昵称 / uid"
              @update:model-value="onSearchChange"
            />
            <GSegmented
              :model-value="query.enabled"
              :options="enabledOptions"
              size="sm"
              label="开启状态筛选"
              @update:model-value="setEnabledFilter($event as string)"
            />
          </div>
        </div>
        <Table
          :data-source="rows"
          :columns="columns"
          :loading="tableLoading"
          row-key="uid"
          size="small"
          :pagination="pagination"
          :scroll="{ x: 900 }"
          @change="onTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'user'">
              <div class="ya-user">
                <span class="ya-user__name">{{ record.name }}</span>
                <span class="ya-user__uid">{{ record.uid }}</span>
              </div>
            </template>
            <template v-else-if="column.key === 'stage'">
              <Tag :color="stageColor(record.stage)">{{ stageLabel(record.stage) }}</Tag>
            </template>
            <template v-else-if="column.key === 'rel'">
              <span class="ya-num">{{ (record.closeness * 100).toFixed(0) }}</span>
              <span class="ya-sub">亲密</span>
            </template>
            <template v-else-if="column.key === 'mood'">
              <span class="ya-mood" :class="`is-${record.mood}`">{{ moodLabel(record.mood) }}</span>
            </template>
            <template v-else-if="column.key === 'msgs'">
              {{ record.userMsgs }}<span class="ya-sub"> / {{ record.aiMsgs }}</span>
            </template>
            <template v-else-if="column.key === 'last'">
              {{ fmtTime(record.lastAt) }}
            </template>
            <template v-else-if="column.key === 'enabled'">
              <GSwitch
                :model-value="record.enabled"
                size="sm"
                :disabled="toggling === record.uid"
                @update:model-value="(v) => onToggle(record, v)"
              />
            </template>
            <template v-else-if="column.key === 'ops'">
              <Button type="link" size="small" @click="openChat(record)">聊天记录</Button>
            </template>
          </template>
        </Table>
      </div>

      <!-- 用户对比 · 综合 -->
      <div class="g-card ya-panel">
        <div class="ya-panel__head">
          <div class="ya-panel__title"><Icon :icon="$gm('chart-bar')" :size="15" /> 用户对比 · 综合</div>
          <span class="ya-panel__extra">
            {{ compare.total }} 位有回复的用户 · 按需要打磨程度排序 · 点行切单用户视角（样本 &lt;15 条的占比噪声大）
          </span>
        </div>
        <Table
          :data-source="compare.list"
          :columns="compareColumns"
          row-key="uid"
          size="small"
          :pagination="false"
          :scroll="{ x: 860, y: 300 }"
          :custom-row="cmpRow"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'who'">
              <div class="ya-user">
                <span class="ya-user__name">{{ record.label }}</span>
                <span class="ya-user__uid">{{ stageLabel(record.stage) }} · {{ fmtTime(record.lastAt) }}</span>
              </div>
            </template>
            <template v-else-if="column.key === 'n'">
              {{ record.n }}
              <Tag v-if="record.n < 15" class="ya-thin">样本少</Tag>
            </template>
            <template v-else-if="column.key === 'score'">
              <Tag :color="scoreColor(record.score)">{{ record.score }}</Tag>
            </template>
          </template>
        </Table>
        <div v-if="!compare.list.length" class="ya-empty">暂无有回复的用户</div>
      </div>

      <!-- 智能诊断 -->
      <div class="g-card ya-panel">
        <div class="ya-panel__head">
          <div class="ya-panel__title"><Icon :icon="$gm('bulb')" :size="15" /> 智能诊断</div>
          <div class="ya-panel__tools">
            <span class="ya-seg">
              <span class="ya-seg__item" :class="{ 'is-active': !scope }" @click="setScope('')">全体</span>
              <span class="ya-seg__item" :class="{ 'is-active': !!scope }">{{ scopeLabel }}</span>
            </span>
            <span class="ya-panel__extra">
              {{ insights.metrics.aiMessages }} 条真实回复 · 规则统计，不调模型
            </span>
          </div>
        </div>
        <div class="ya-metrics">
          <div v-for="m in metricCards" :key="m.label" class="ya-metric">
            <div class="ya-metric__value">{{ m.value }}</div>
            <div class="ya-metric__label">{{ m.label }}</div>
          </div>
        </div>
        <div class="ya-issues">
          <div v-for="(it, i) in insights.issues" :key="i" class="ya-issue" :class="`is-${it.level}`">
            <div class="ya-issue__title">
              <Tag :color="it.level === 'warn' ? 'orange' : 'blue'" size="small">
                {{ it.level === 'warn' ? '需处理' : '提示' }}
              </Tag>
              {{ it.title }}
            </div>
            <div class="ya-issue__detail">{{ it.detail }}</div>
            <div class="ya-issue__sug">→ {{ it.suggestion }}</div>
          </div>
          <div v-if="!insights.issues.length" class="ya-empty">暂无异常，风格指标健康</div>
        </div>
        <div v-if="insights.openings.length" class="ya-openings">
          <span class="ya-openings__label">高频开头：</span>
          <Tag v-for="o in insights.openings" :key="o.prefix">{{ o.prefix }}… ×{{ o.count }}</Tag>
        </div>
      </div>

      <!-- 聊天记录弹窗 -->
      <GModal
        v-model:visible="chat.visible"
        eyebrow="CHAT LOG"
        title="聊天记录"
        :subtitle="chat.user?.name || ''"
        size="xl"
        body-height="64vh"
      >
        <div v-if="chat.user" class="ya-chat__meta">
          <Tag>{{ stageLabel(chat.user.stage) }}</Tag>
          <span>亲密 {{ (chat.user.closeness * 100).toFixed(0) }}</span>
          <span>情绪 {{ moodLabel(chat.user.mood) }}</span>
          <span>平均回复 {{ chat.user.style.avgLen }} 字</span>
          <span>问号率 {{ Math.round(chat.user.style.questionRate * 100) }}%</span>
        </div>
        <div class="ya-chat">
          <div
            v-for="m in chat.list"
            :key="m.index"
            class="ya-chat__row"
            :class="m.role === 'assistant' ? 'is-ai' : 'is-user'"
          >
            <div class="ya-chat__bubble">
              <pre class="ya-chat__text">{{ m.text }}</pre>
              <span class="ya-chat__len">{{ m.len }} 字</span>
            </div>
          </div>
          <div v-if="!chat.list.length" class="ya-empty">暂无聊天记录</div>
        </div>
        <template #footer>
          <div class="ya-chat__pager">
            <Button size="small" :disabled="chat.page >= chat.pages" @click="loadMessages(chat.page + 1)">更早</Button>
            <span>第 {{ chat.page }} / {{ chat.pages }} 页</span>
            <Button size="small" :disabled="chat.page <= 1" @click="loadMessages(chat.page - 1)">更新</Button>
          </div>
          <Button @click="chat.visible = false">关闭</Button>
        </template>
      </GModal>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, nextTick, onMounted, reactive, ref, unref, watch } from 'vue';
  import { Button, Table, Tag, message } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import GModal from '../_shared/dialog/GModal.vue';
  import GSearch from '../_shared/form/GSearch.vue';
  import GSegmented from '../_shared/form/GSegmented.vue';
  import GSwitch from '../_shared/form/GSwitch.vue';
  import { Icon } from '/@/components/Icon';
  import { useECharts } from '/@/hooks/web/useECharts';
  import { useRootSetting } from '/@/hooks/setting/useRootSetting';
  import { ThemeEnum } from '/@/enums/appEnum';
  import { chartBase, chartColors, hexToRgba } from '../_shared/stats';
  import { fmtDateTime } from '/@/utils/localTime';
  import type { YingCompare, YingCompareRow, YingInsights, YingMessage, YingOverview, YingUserRow } from './api';
  import { yingaiApi } from './api';

  defineOptions({ name: 'YingAi' });

  /** 后端给的是 UTC ISO 串（…Z），直接插值会显示成 2026-10-21T00:25:52.894Z */
  const updatedText = computed(() => fmtDateTime(overview.value.updatedAt) || '—');

  const { getDarkMode } = useRootSetting();
  const isDark = computed(() => unref(getDarkMode) === ThemeEnum.DARK);
  const palette = computed(() => chartColors(isDark.value));

  const loading = ref(false);
  const tableLoading = ref(false);
  const toggling = ref('');
  const rows = ref<YingUserRow[]>([]);
  const total = ref(0);
  const overview = ref<YingOverview>({
    users: 0, withChat: 0, enabled: 0, globalEnabled: false, totalMsgs: 0,
    active7d: 0, avgAiLen: 0, questionRate: 0, multiLineRate: 0, repeatOpenRate: 0,
    stageDist: {}, updatedAt: '',
  });
  const insights = ref<YingInsights>({
    uid: '', scope: 'all',
    metrics: { aiMessages: 0, avgLen: 0, maxLen: 0, over40Rate: 0, questionRate: 0, multiLineRate: 0, codeBlockRate: 0, repeatOpenRate: 0 },
    baseline: { avg: 0, over40: 0, question: 0, multi: 0, tpl: 0 },
    openings: [], issues: [], samples: [], updatedAt: '',
  });
  const compare = ref<YingCompare>({
    total: 0,
    baseline: { avg: 0, over40: 0, question: 0, multi: 0, tpl: 0 },
    list: [] as YingCompareRow[],
  });
  /** 诊断视角：'' = 全体（综合），否则为 uid（单用户） */
  const scope = ref('');

  const query = reactive({ page: 1, size: 20, q: '', enabled: '' });
  const enabledOptions = [
    { label: '全部', value: '' },
    { label: '已开启', value: '1' },
    { label: '已关闭', value: '0' },
  ];

  const columns = [
    { title: '用户', key: 'user', width: 200 },
    { title: '阶段', key: 'stage', width: 90 },
    { title: '关系', key: 'rel', width: 90 },
    { title: '情绪', key: 'mood', width: 90 },
    { title: '消息 用户/荧', key: 'msgs', width: 120 },
    { title: '最后互动', key: 'last', width: 150 },
    { title: '聊天', key: 'enabled', width: 80 },
    { title: '', key: 'ops', width: 90 },
  ];

  /** 比率字段后端给 0~1，表格统一按百分比展示 */
  const pct = (v: any) => `${Math.round(Number(v || 0) * 100)}%`;

  const compareColumns = [
    { title: '用户', key: 'who', width: 190 },
    { title: '条数', key: 'n', width: 100 },
    { title: '均长', dataIndex: 'avg', key: 'avg', width: 70 },
    { title: '超40字', dataIndex: 'over40', key: 'over40', width: 80, customRender: ({ text }: any) => pct(text) },
    { title: '问号', dataIndex: 'question', key: 'question', width: 70, customRender: ({ text }: any) => pct(text) },
    { title: '换行', dataIndex: 'multi', key: 'multi', width: 70, customRender: ({ text }: any) => pct(text) },
    { title: '模板句', dataIndex: 'tpl', key: 'tpl', width: 75, customRender: ({ text }: any) => pct(text) },
    { title: '优先级', key: 'score', width: 80 },
  ];

  /** 优先级分档：与群聊诊断大屏一致（≥50 红 / ≥30 橙 / 其余蓝） */
  function scoreColor(v: number) {
    if (v >= 50) return 'magenta';
    if (v >= 30) return 'orange';
    return 'blue';
  }

  const scopeLabel = computed(() => {
    if (!scope.value) return '全体';
    const hit = compare.value.list.find((r) => r.uid === scope.value);
    return hit ? hit.label : '单用户';
  });

  function cmpRow(record: YingCompareRow) {
    return {
      onClick: () => setScope(record.uid),
      style: { cursor: 'pointer' },
      class: scope.value === record.uid ? 'ya-cmp-on' : '',
    };
  }

  const pagination = computed(() => ({
    current: query.page,
    pageSize: query.size,
    total: total.value,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50'],
    showTotal: (t: number) => `共 ${t} 位`,
    size: 'small' as const,
  }));

  const kpiCards = computed(() => [
    { label: '用户总数', value: overview.value.users, unit: '位', foot: `${overview.value.withChat} 位有聊天记录`, tone: 'g-stat--blue' },
    { label: '已开启私聊', value: overview.value.enabled, unit: '位', foot: `近 7 天活跃 ${overview.value.active7d} 位`, tone: 'g-stat--green' },
    { label: '消息总量', value: overview.value.totalMsgs, unit: '条', foot: '会话窗口内最近消息', tone: 'g-stat--cyan' },
    { label: '平均回复', value: overview.value.avgAiLen, unit: '字', foot: `问号率 ${Math.round(overview.value.questionRate * 100)}%`, tone: 'g-stat--violet' },
    {
      label: '风格偏离',
      value: `${Math.round(overview.value.multiLineRate * 100)}% / ${Math.round(overview.value.repeatOpenRate * 100)}%`,
      unit: '',
      foot: '换行率 / 模板句率，越低越像真人',
      tone: 'g-stat--amber',
    },
  ]);

  const metricCards = computed(() => {
    const m = insights.value.metrics;
    return [
      { label: '样本回复', value: m.aiMessages },
      { label: '平均字数', value: m.avgLen },
      { label: '最长', value: m.maxLen },
      { label: '超40字率', value: `${Math.round(m.over40Rate * 100)}%` },
      { label: '问号率', value: `${Math.round(m.questionRate * 100)}%` },
      { label: '换行率', value: `${Math.round(m.multiLineRate * 100)}%` },
      { label: '模板句率', value: `${Math.round(m.repeatOpenRate * 100)}%` },
    ];
  });

  const chat = reactive({
    visible: false,
    user: null as YingUserRow | null,
    list: [] as YingMessage[],
    page: 1,
    pages: 1,
  });

  function stageLabel(s: string) {
    return ({ stranger: '陌生', acquaintance: '初识', familiar: '熟悉', close: '亲近', intimate: '亲密' } as any)[s] || s;
  }
  /** 荧的记忆里情绪是英文枚举，界面上统一转中文 */
  function moodLabel(m: string) {
    return (
      ({
        neutral: '平静',
        calm: '平静',
        happy: '愉快',
        joyful: '愉快',
        excited: '兴奋',
        sad: '低落',
        tired: '疲惫',
        angry: '烦躁',
        annoyed: '烦躁',
        anxious: '不安',
        shy: '害羞',
        curious: '好奇',
      } as any)[String(m || '').toLowerCase()] || m || '—'
    );
  }
  function stageColor(s: string) {
    return ({ stranger: 'default', acquaintance: 'blue', familiar: 'cyan', close: 'green', intimate: 'magenta' } as any)[s] || 'default';
  }
  function fmtTime(ts: number | null) {
    if (!ts) return '—';
    const d = new Date(ts);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  async function loadUsers() {
    tableLoading.value = true;
    try {
      const r = await yingaiApi.getUsers({ page: query.page, size: query.size, q: query.q, enabled: query.enabled });
      rows.value = r.list || [];
      total.value = r.total || 0;
    } finally {
      tableLoading.value = false;
    }
  }

  async function loadAll() {
    loading.value = true;
    try {
      const [o, ins, cmp] = await Promise.all([
        yingaiApi.getOverview(),
        yingaiApi.getInsights(scope.value || undefined),
        yingaiApi.getCompare(),
      ]);
      overview.value = o;
      insights.value = ins;
      compare.value = cmp;
      // 视角失效（用户被删/改 uid）→ 回落到全体，避免诊断卡停在空状态
      if (scope.value && !cmp.list.some((r) => r.uid === scope.value)) scope.value = '';
      await Promise.all([loadUsers(), loadDist()]);
      renderViz();
    } finally {
      loading.value = false;
    }
  }

  /** 切诊断视角：'' = 全体，uid = 单用户（只刷诊断卡，不动用户表） */
  async function setScope(uid: string) {
    if (scope.value === uid) return;
    scope.value = uid;
    try {
      insights.value = await yingaiApi.getInsights(uid || undefined);
    } catch (e: any) {
      message.error(e?.message || '加载诊断失败');
    }
  }

  function reloadUsers() {
    query.page = 1;
    loadUsers();
  }
  let searchTimer: any = null;
  function onSearchChange() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(reloadUsers, 300);
  }
  function setEnabledFilter(v: string) {
    query.enabled = v;
    reloadUsers();
  }
  function onTableChange(pag: any) {
    query.page = pag.current;
    query.size = pag.pageSize;
    loadUsers();
  }

  async function onToggle(row: YingUserRow, v: boolean) {
    toggling.value = row.uid;
    try {
      await yingaiApi.setEnabled(row.uid, v);
      row.enabled = v;
      message.success(`${row.name} 已${v ? '开启' : '关闭'}私聊`);
      overview.value = await yingaiApi.getOverview();
    } catch (e: any) {
      message.error(e?.message || '保存失败');
    } finally {
      toggling.value = '';
    }
  }

  async function loadMessages(page: number) {
    if (!chat.user) return;
    const r = await yingaiApi.getMessages({ uid: chat.user.uid, page, size: 40 });
    chat.list = r.list || [];
    chat.page = page;
    chat.pages = Math.max(1, Math.ceil((r.total || 1) / 40));
  }

  async function openChat(row: YingUserRow) {
    chat.user = row;
    chat.visible = true;
    chat.list = [];
    chat.page = 1;
    chat.pages = 1;
    await loadMessages(1);
  }

  /* ------------------------------ 分布可视化 ------------------------------ */

  /** 全量用户（不受表格分页影响），只用于图表 */
  const distRows = ref<YingUserRow[]>([]);

  const STAGE_META: Record<string, { label: string; color: string }> = {
    stranger: { label: '陌生', color: '#7f97ab' },
    acquaintance: { label: '初识', color: '#4fa8d8' },
    familiar: { label: '熟悉', color: '#45b97c' },
    close: { label: '亲近', color: '#d3a13f' },
    intimate: { label: '亲密', color: '#e0698e' },
  };

  const stageData = computed(() =>
    Object.entries(overview.value.stageDist || {})
      .filter(([, n]) => Number(n) > 0)
      .map(([k, n]) => ({ name: STAGE_META[k]?.label || k, value: Number(n), color: STAGE_META[k]?.color || '#7f97ab' })),
  );

  const rankData = computed(() =>
    [...distRows.value]
      .sort((a, b) => b.msgs - a.msgs)
      .slice(0, 8)
      .map((r) => ({ name: r.name || r.uid.slice(0, 8), user: r.userMsgs, ai: r.aiMsgs })),
  );

  const stageRef = ref<HTMLDivElement | null>(null);
  const scatterRef = ref<HTMLDivElement | null>(null);
  const rankRef = ref<HTMLDivElement | null>(null);
  const stageChart = useECharts(stageRef);
  const scatterChart = useECharts(scatterRef);
  const rankChart = useECharts(rankRef);

  function renderStage() {
    const base = chartBase(isDark.value);
    stageChart.setOptions({
      tooltip: { ...base.tooltip, trigger: 'item', formatter: '{b}：{c} 位（{d}%）' },
      legend: {
        orient: 'vertical',
        right: 4,
        top: 'center',
        itemWidth: 8,
        itemHeight: 8,
        icon: 'circle',
        textStyle: { color: base.text, fontSize: 11.5 },
      },
      series: [
        {
          type: 'pie',
          radius: ['58%', '82%'],
          center: ['36%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: 'transparent', borderWidth: 2, borderRadius: 4 },
          label: { show: false },
          emphasis: { scale: true, scaleSize: 4 },
          data: stageData.value.map((d) => ({ name: d.name, value: d.value, itemStyle: { color: d.color } })),
        },
      ],
    });
  }

  function renderScatter() {
    const base = chartBase(isDark.value);
    const list = distRows.value;
    scatterChart.setOptions({
      grid: { top: 14, right: 18, bottom: 30, left: 40 },
      tooltip: {
        ...base.tooltip,
        formatter: (p: any) => {
          const r = list[p.dataIndex];
          return `${r?.name || ''}<br/>亲密 ${Math.round((r?.closeness || 0) * 100)} · 熟悉 ${Math.round((r?.familiarity || 0) * 100)}<br/>消息 ${r?.msgs || 0} 条`;
        },
      },
      xAxis: {
        type: 'value',
        min: 0,
        max: 100,
        name: '亲密',
        nameTextStyle: { color: base.text, fontSize: 10 },
        axisLabel: base.axisLabel,
        splitLine: base.splitLine,
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        name: '熟悉',
        nameTextStyle: { color: base.text, fontSize: 10 },
        axisLabel: base.axisLabel,
        splitLine: base.splitLine,
      },
      series: [
        {
          type: 'scatter',
          data: list.map((r) => ({
            value: [Math.round(r.closeness * 100), Math.round(r.familiarity * 100)],
            msgs: r.msgs,
            name: r.name,
          })),
          // 点大小随消息量走（4~18px），小样本不抢视觉
          symbolSize: (v: any, p: any) => {
            const n = Number(p?.data?.msgs || 0);
            return Math.max(5, Math.min(18, 5 + Math.sqrt(n) * 1.6));
          },
          itemStyle: { color: hexToRgba(palette.value[0], 0.6), borderColor: palette.value[0], borderWidth: 1 },
          emphasis: { itemStyle: { color: palette.value[0] } },
        },
      ],
    });
  }

  function renderRank() {
    const base = chartBase(isDark.value);
    const rows = rankData.value;
    rankChart.setOptions({
      grid: { top: 26, right: 18, bottom: 4, left: 6, containLabel: true },
      tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: {
        data: ['用户', '荧'],
        right: 0,
        top: 0,
        itemWidth: 9,
        itemHeight: 9,
        icon: 'circle',
        textStyle: { color: base.text, fontSize: 11 },
      },
      xAxis: { type: 'value', axisLabel: base.axisLabel, splitLine: base.splitLine },
      yAxis: {
        type: 'category',
        inverse: true,
        data: rows.map((r) => r.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: base.text, fontSize: 11, width: 82, overflow: 'truncate' },
      },
      series: [
        {
          name: '用户',
          type: 'bar',
          stack: 'msg',
          barWidth: 10,
          itemStyle: { color: palette.value[0], borderRadius: [0, 0, 0, 0] },
          data: rows.map((r) => r.user),
        },
        {
          name: '荧',
          type: 'bar',
          stack: 'msg',
          barWidth: 10,
          itemStyle: { color: palette.value[1], borderRadius: [0, 3, 3, 0] },
          data: rows.map((r) => r.ai),
        },
      ],
    });
  }

  function renderViz() {
    nextTick(() => {
      renderStage();
      renderScatter();
      renderRank();
    });
  }

  watch(isDark, renderViz);
  watch([stageData, rankData, distRows], renderViz);

  async function loadDist() {
    try {
      const r = await yingaiApi.getUsers({ page: 1, size: 200 });
      distRows.value = r.list || [];
    } catch {
      distRows.value = [];
    }
  }

  onMounted(loadAll);
</script>

<style scoped lang="less">
  .ya { display: flex; flex-direction: column; gap: 14px; }

  .ya-hero__chip {
    margin-left: 8px;
    padding: 1px 8px;
    font-size: 11px;
    border: 1px solid transparent;
  }
  .ya-hero__chip.is-on { color: var(--g-green); background: rgb(69 185 124 / 13%); border-color: rgb(69 185 124 / 26%); }
  .ya-hero__chip.is-off { color: var(--g-text-mute); background: var(--g-chip-bg); border-color: var(--g-card-border); }
  .ya-hero__dot { width: 5px; height: 5px; border-radius: 50%; background: currentcolor; }
  .ya-updated { font-size: 11.5px; color: var(--g-text-mute); font-variant-numeric: tabular-nums; }

  /* KPI：直接复用 g-stat，五列在此收口 */
  .ya-kpi { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
  @media (max-width: 1180px) { .ya-kpi { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @media (max-width: 900px) { .ya-kpi { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  /* 手机上 5 张 KPI 单列要滚 5 屏，改 2 列（与 db-kpi 一致） */
  @media (max-width: 620px) { .ya-kpi { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; } }

  /* 分布可视化：环形 + 散点 + 排行 */
  .ya-viz { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr) minmax(0, 1.1fr); gap: 12px; }
  @media (max-width: 1180px) { .ya-viz { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } .ya-viz__rank { grid-column: 1 / -1; } }
  @media (max-width: 900px) { .ya-viz { grid-template-columns: minmax(0, 1fr); } .ya-viz__rank { grid-column: auto; } }
  .ya-chart { width: 100%; height: 188px; }
  .ya-chart__empty { padding: 24px 0 30px; }
  .ya-chart__empty + .ya-chart { display: none; }

  .ya-panel { padding: 16px 18px; }
  .ya-panel__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
  .ya-panel__title { font-weight: 600; display: flex; align-items: center; gap: 6px; }
  .ya-panel__tools { display: flex; align-items: center; gap: 10px; }
  .ya-panel__extra { font-size: 12px; opacity: 0.55; }

  .ya-seg { display: inline-flex; border-radius: 8px; overflow: hidden; border: 1px solid var(--g-card-border-strong); }
  .ya-seg__item { padding: 3px 11px; font-size: 12px; color: var(--g-text-sub); cursor: pointer; }
  .ya-seg__item.is-active { background: var(--g-blue-soft); color: var(--g-blue); font-weight: 600; }

  /* 情绪：按语义走设计色，未知值保持中性 */
  .ya-mood { font-size: 12px; color: var(--g-text-sub); }
  .ya-mood.is-happy, .ya-mood.is-joyful, .ya-mood.is-excited { color: var(--g-green); }
  .ya-mood.is-sad, .ya-mood.is-tired { color: var(--g-text-mute); }
  .ya-mood.is-angry, .ya-mood.is-annoyed { color: var(--g-rose); }
  .ya-mood.is-shy, .ya-mood.is-curious { color: var(--g-violet); }

  .ya-user { display: flex; flex-direction: column; line-height: 1.3; }
  .ya-user__name { font-weight: 600; }
  .ya-user__uid { font-size: 11px; opacity: 0.45; }
  .ya-thin { margin-left: 4px; font-size: 10px; opacity: 0.6; }
  .ya-num { font-weight: 600; margin-right: 4px; }
  .ya-sub { font-size: 11px; opacity: 0.5; }
  /* 当前诊断视角对应的对比行（customRow 加在 tr 上，需穿透 scoped） */
  :deep(.ya-cmp-on) > td { background: var(--g-blue-soft) !important; }

  .ya-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(104px, 1fr)); gap: 10px; margin-bottom: 14px; }
  .ya-metric { padding: 10px 12px; border-radius: 10px; background: var(--g-card-bg-soft); border: 1px solid var(--g-card-border); text-align: center; }
  .ya-metric__value { font-size: 18px; font-weight: 650; color: var(--g-text); font-variant-numeric: tabular-nums; }
  .ya-metric__label { font-size: 11px; color: var(--g-text-mute); margin-top: 2px; }

  .ya-issues { display: flex; flex-direction: column; gap: 10px; }
  .ya-issue { padding: 10px 14px; border-radius: 10px; border-left: 3px solid var(--g-card-border-strong); background: var(--g-card-bg-soft); }
  .ya-issue.is-warn { border-left-color: var(--g-gold); background: rgb(211 188 141 / 10%); }
  .ya-issue.is-info { border-left-color: var(--g-blue); background: rgb(98 168 234 / 8%); }
  .ya-issue__title { font-weight: 600; display: flex; align-items: center; gap: 6px; color: var(--g-text); }
  .ya-issue__detail { font-size: 12px; color: var(--g-text-sub); margin-top: 4px; }
  .ya-issue__sug { font-size: 12px; margin-top: 4px; color: var(--g-blue); }
  .ya-openings { margin-top: 12px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .ya-openings__label { font-size: 12px; opacity: 0.55; }
  .ya-empty { font-size: 12px; opacity: 0.5; padding: 8px 0; }

  .ya-chat__meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; font-size: 12px; opacity: 0.8; margin-bottom: 12px; }
  .ya-chat { display: flex; flex-direction: column; gap: 8px; }
  .ya-chat__row { display: flex; }
  .ya-chat__row.is-ai { justify-content: flex-start; }
  .ya-chat__row.is-user { justify-content: flex-end; }
  .ya-chat__bubble { max-width: 76%; padding: 8px 12px; border-radius: 12px; position: relative; }
  .is-ai .ya-chat__bubble { background: rgba(127, 127, 160, 0.13); border-top-left-radius: 4px; }
  .is-user .ya-chat__bubble { background: rgba(37, 211, 102, 0.16); border-top-right-radius: 4px; }
  .ya-chat__text { margin: 0; white-space: pre-wrap; word-break: break-word; font-family: inherit; font-size: 13px; line-height: 1.6; }
  .ya-chat__len { display: block; font-size: 10px; opacity: 0.4; margin-top: 2px; text-align: right; }
  .ya-chat__pager { display: flex; align-items: center; gap: 10px; margin-right: auto; font-size: 11.5px; color: var(--g-text-mute); }
</style>
