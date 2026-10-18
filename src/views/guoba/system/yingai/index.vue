<template>
  <PageWrapper title="">
    <div class="ya">
      <!-- 页头 -->
      <section class="ya-hero">
        <div>
          <div class="ya-hero__eyebrow">YING AI · PRIVATE</div>
          <div class="ya-hero__title">荧 · 私聊管理</div>
          <div class="ya-hero__desc">
            用户关系、聊天记录与回复风格智能诊断
            <Tag :color="overview.globalEnabled ? 'green' : 'default'" class="ya-hero__tag">
              全局私聊{{ overview.globalEnabled ? '已开启' : '已关闭' }}
            </Tag>
          </div>
        </div>
        <Button size="small" :loading="loading" @click="loadAll">刷新</Button>
      </section>

      <!-- KPI -->
      <section class="ya-kpi">
        <div v-for="c in kpiCards" :key="c.label" class="ya-kpi__card">
          <div class="ya-kpi__label">{{ c.label }}</div>
          <div class="ya-kpi__value">
            {{ c.value }}<small v-if="c.unit">{{ c.unit }}</small>
          </div>
          <div class="ya-kpi__foot">{{ c.foot }}</div>
        </div>
      </section>

      <!-- 用户表 -->
      <div class="g-card ya-panel">
        <div class="ya-panel__head">
          <div class="ya-panel__title"><Icon icon="mdi:account-multiple-outline" :size="15" /> 用户表</div>
          <div class="ya-panel__tools">
            <Input
              v-model:value="query.q"
              size="small"
              allow-clear
              placeholder="搜索昵称 / uid"
              style="width: 200px"
              @press-enter="reloadUsers"
              @change="onSearchChange"
            />
            <span class="ya-seg">
              <span
                v-for="s in enabledOptions"
                :key="s.value"
                class="ya-seg__item"
                :class="{ 'is-active': query.enabled === s.value }"
                @click="setEnabledFilter(s.value)"
              >{{ s.label }}</span>
            </span>
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
            <template v-else-if="column.key === 'msgs'">
              {{ record.userMsgs }}<span class="ya-sub"> / {{ record.aiMsgs }}</span>
            </template>
            <template v-else-if="column.key === 'last'">
              {{ fmtTime(record.lastAt) }}
            </template>
            <template v-else-if="column.key === 'enabled'">
              <Switch
                :checked="record.enabled"
                size="small"
                :loading="toggling === record.uid"
                @change="(v) => onToggle(record, v)"
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
          <div class="ya-panel__title"><Icon icon="mdi:chart-box-outline" :size="15" /> 用户对比 · 综合</div>
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
          <div class="ya-panel__title"><Icon icon="ant-design:bulb-outlined" :size="15" /> 智能诊断</div>
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

      <!-- 聊天记录抽屉 -->
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
          <span>情绪 {{ chat.user.mood }}</span>
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
  import { computed, onMounted, reactive, ref } from 'vue';
  import { Button, Input, Switch, Table, Tag, message } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import GModal from '../_shared/dialog/GModal.vue';
  import { Icon } from '/@/components/Icon';
  import type { YingCompare, YingCompareRow, YingInsights, YingMessage, YingOverview, YingUserRow } from './api';
  import { yingaiApi } from './api';

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
    { title: '情绪', dataIndex: 'mood', key: 'mood', width: 90 },
    { title: '消息 用户/荧', key: 'msgs', width: 120 },
    { title: '最后互动', key: 'last', width: 150 },
    { title: '聊天', key: 'enabled', width: 80 },
    { title: '', key: 'ops', width: 90 },
  ];

  const compareColumns = [
    { title: '用户', key: 'who', width: 190 },
    { title: '条数', key: 'n', width: 100 },
    { title: '均长', dataIndex: 'avg', key: 'avg', width: 70 },
    { title: '超40字', dataIndex: 'over40', key: 'over40', width: 80 },
    { title: '问号', dataIndex: 'question', key: 'question', width: 70 },
    { title: '换行', dataIndex: 'multi', key: 'multi', width: 70 },
    { title: '模板句', dataIndex: 'tpl', key: 'tpl', width: 75 },
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
    { label: '用户总数', value: overview.value.users, unit: '位', foot: `${overview.value.withChat} 位有聊天记录` },
    { label: '已开启私聊', value: overview.value.enabled, unit: '位', foot: `近 7 天活跃 ${overview.value.active7d} 位` },
    { label: '消息总量', value: overview.value.totalMsgs, unit: '条', foot: '会话窗口内最近消息' },
    { label: '平均回复', value: overview.value.avgAiLen, unit: '字', foot: `问号率 ${Math.round(overview.value.questionRate * 100)}%` },
    { label: '换行/模板率', value: `${Math.round(overview.value.multiLineRate * 100)}/${Math.round(overview.value.repeatOpenRate * 100)}`, unit: '%', foot: '越低越像真人' },
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
      await loadUsers();
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

  onMounted(loadAll);
</script>

<style scoped lang="less">
  .ya { display: flex; flex-direction: column; gap: 14px; }

  .ya-hero {
    display: flex; align-items: flex-end; justify-content: space-between; gap: 16px;
    padding: 18px 22px; border-radius: 14px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.16), rgba(236, 72, 153, 0.10));
    border: 1px solid rgba(127, 127, 160, 0.18);
  }
  .ya-hero__eyebrow { font-size: 11px; letter-spacing: 0.18em; opacity: 0.55; }
  .ya-hero__title { font-size: 22px; font-weight: 700; margin-top: 4px; }
  .ya-hero__desc { font-size: 12px; opacity: 0.65; margin-top: 4px; }
  .ya-hero__tag { margin-left: 8px; }

  .ya-kpi { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
  @media (max-width: 1100px) { .ya-kpi { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .ya-kpi__card { padding: 14px 16px; border-radius: 12px; background: rgba(127, 127, 160, 0.07); border: 1px solid rgba(127, 127, 160, 0.14); }
  .ya-kpi__label { font-size: 12px; opacity: 0.65; }
  .ya-kpi__value { font-size: 24px; font-weight: 700; line-height: 1.3; }
  .ya-kpi__value small { font-size: 12px; font-weight: 400; opacity: 0.6; margin-left: 2px; }
  .ya-kpi__foot { font-size: 11px; opacity: 0.5; margin-top: 2px; }

  .ya-panel { padding: 16px 18px; }
  .ya-panel__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
  .ya-panel__title { font-weight: 600; display: flex; align-items: center; gap: 6px; }
  .ya-panel__tools { display: flex; align-items: center; gap: 10px; }
  .ya-panel__extra { font-size: 12px; opacity: 0.55; }

  .ya-seg { display: inline-flex; border-radius: 8px; overflow: hidden; border: 1px solid rgba(127, 127, 160, 0.22); }
  .ya-seg__item { padding: 2px 10px; font-size: 12px; cursor: pointer; opacity: 0.7; }
  .ya-seg__item.is-active { background: rgba(99, 102, 241, 0.18); opacity: 1; font-weight: 600; }

  .ya-user { display: flex; flex-direction: column; line-height: 1.3; }
  .ya-user__name { font-weight: 600; }
  .ya-user__uid { font-size: 11px; opacity: 0.45; }
  .ya-thin { margin-left: 4px; font-size: 10px; opacity: 0.6; }
  .ya-num { font-weight: 600; margin-right: 4px; }
  .ya-sub { font-size: 11px; opacity: 0.5; }
  /* 当前诊断视角对应的对比行（customRow 加在 tr 上，需穿透 scoped） */
  :deep(.ya-cmp-on) > td { background: rgba(99, 102, 241, 0.14) !important; }

  .ya-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(104px, 1fr)); gap: 10px; margin-bottom: 14px; }
  .ya-metric { padding: 10px 12px; border-radius: 10px; background: rgba(127, 127, 160, 0.07); text-align: center; }
  .ya-metric__value { font-size: 18px; font-weight: 700; }
  .ya-metric__label { font-size: 11px; opacity: 0.55; margin-top: 2px; }

  .ya-issues { display: flex; flex-direction: column; gap: 10px; }
  .ya-issue { padding: 10px 14px; border-radius: 10px; border-left: 3px solid rgba(127, 127, 160, 0.3); background: rgba(127, 127, 160, 0.06); }
  .ya-issue.is-warn { border-left-color: #fa8c16; background: rgba(250, 140, 22, 0.08); }
  .ya-issue.is-info { border-left-color: #1677ff; background: rgba(22, 119, 255, 0.06); }
  .ya-issue__title { font-weight: 600; display: flex; align-items: center; gap: 6px; }
  .ya-issue__detail { font-size: 12px; opacity: 0.75; margin-top: 4px; }
  .ya-issue__sug { font-size: 12px; margin-top: 4px; color: #1677ff; }
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
