<template>
  <PageWrapper title="">
    <div class="db g-page">
      <!-- 页头 -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">GROUP ANALYTICS</div>
          <div class="db-hero__title">群数据</div>
          <div class="db-hero__desc">按群聚合的消息量、活跃榜参与度与绑定关系</div>
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
            全群消息趋势
          </div>
          <span class="gm-panel__extra">最近 {{ trend.length }} 天 · 按群计数汇总</span>
        </div>
        <div v-if="loading && !trend.length" class="g-chart g-chart--sm">
          <div class="g-skeleton g-skeleton--chart" />
        </div>
        <div v-show="trend.length" ref="trendRef" class="g-chart g-chart--sm" />
        <GEmpty
          v-if="!loading && !trend.length"
          title="暂无趋势数据"
          desc="群消息日计数（Yz:count:*:msg:group:*）尚未生成"
        />
      </div>

      <!-- 列表 -->
      <div class="g-card">
        <div class="gm-panel__head">
          <div class="gm-panel__title">
            <i><Icon icon="ant-design:appstore-outlined" :size="13" /></i>
            群列表
            <span class="gm-panel__extra" style="margin-left: 8px">共 {{ pager.total }} 个群</span>
          </div>
          <div class="toolbar">
            <Input
              v-model:value="query.keyword"
              class="w-200"
              placeholder="搜索群号 / 群名"
              allow-clear
              @press-enter="handleSearch"
            />
            <Select v-model:value="query.sort" class="w-140" :options="sortOptions" @change="handleSearch" />
            <Button class="order-btn" :title="query.order === 'desc' ? '当前降序' : '当前升序'" @click="toggleOrder">
              <Icon :icon="query.order === 'desc' ? 'ant-design:arrow-down-outlined' : 'ant-design:arrow-up-outlined'" :size="13" />
            </Button>
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button class="icon-btn" :loading="loading" title="刷新" @click="loadAll">
              <Icon icon="ant-design:reload-outlined" :size="14" />
            </Button>
            <Button :loading="invalidDrawer.loading" @click="openInvalid">
              <Icon icon="ant-design:clear-outlined" :size="13" />
              无效群检测
            </Button>
          </div>
        </div>

        <!-- 批量操作栏 -->
        <div v-if="selectedRowKeys.length" class="batch-bar">
          <span class="batch-bar__count">已选 {{ selectedRowKeys.length }} 个群</span>
          <Button size="small" @click="openBatchConfirm('activity')">清空活跃榜</Button>
          <Button size="small" @click="openBatchConfirm('ext')">清空拓展数据</Button>
          <Button size="small" @click="openAIConfirm('ying', true)">开启荧</Button>
          <Button size="small" @click="openAIConfirm('ying', false)">关闭荧</Button>
          <Button size="small" @click="openAIConfirm('gm', true)">开启群管AI</Button>
          <Button size="small" @click="openAIConfirm('gm', false)">关闭群管AI</Button>
          <Button size="small" type="text" @click="selectedRowKeys = []">取消选择</Button>
        </div>

        <Table
          row-key="gid"
          size="middle"
          :columns="columns"
          :data-source="list"
          :loading="loading"
          :pagination="pagination"
          :scroll="{ x: 988 }"
          :row-selection="rowSelection"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <!-- 群身份 -->
            <template v-if="column.key === 'gid'">
              <div class="gcell">
                <div class="gcell__dot" :class="`is-${fresh(record.lastDate).level}`" />
                <div class="gcell__body">
                  <div class="gcell__name">{{ record.name || '未命名群' }}</div>
                  <div class="gcell__gid">{{ record.gid.replace(/@chatroom$/i, '') }}</div>
                </div>
              </div>
            </template>

            <!-- 消息量 + 收发结构 -->
            <template v-else-if="column.key === 'total'">
              <div class="mcell">
                <div class="mcell__top">
                  <span class="mcell__num">{{ thousands(record.total) }}</span>
                  <span class="mcell__avg">日均 {{ thousands(record.avgDaily) }}</span>
                </div>
                <div class="mcell__bar" :title="`收 ${thousands(record.recv)} · 发 ${thousands(record.send)}`">
                  <i class="is-recv" :style="{ width: pct(record.recv, record.total) }" />
                  <i class="is-send" :style="{ width: pct(record.send, record.total) }" />
                </div>
                <div class="mcell__legend">
                  <span><i class="is-recv" />收 {{ fmtNum(record.recv) }}</span>
                  <span><i class="is-send" />发 {{ fmtNum(record.send) }}</span>
                </div>
              </div>
            </template>

            <!-- 14 天走势 -->
            <template v-else-if="column.key === 'spark'">
              <div class="spk" :title="sparkTitle(record)">
                <svg viewBox="0 0 168 34" preserveAspectRatio="none">
                  <defs>
                    <linearGradient :id="`spk-${record.gid}`" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" :stop-color="primary" stop-opacity="0.3" />
                      <stop offset="100%" :stop-color="primary" stop-opacity="0" />
                    </linearGradient>
                  </defs>
                  <path :d="spark(record).area" :fill="`url(#spk-${record.gid})`" />
                  <path
                    :d="spark(record).line"
                    fill="none"
                    :stroke="primary"
                    stroke-width="1.5"
                    stroke-linejoin="round"
                    stroke-linecap="round"
                  />
                </svg>
                <div class="spk__foot">
                  <span>峰值 {{ thousands(spark(record).max) }}</span>
                </div>
              </div>
            </template>

            <!-- 活跃榜 -->
            <template v-else-if="column.key === 'active'">
              <div v-if="hasActive(record)" class="actline">
                <span v-if="record.active?.N" class="act is-day">日<b>{{ record.active.N }}</b></span>
                <span v-if="record.active?.W" class="act is-week">周<b>{{ record.active.W }}</b></span>
                <span v-if="record.active?.M" class="act is-month">月<b>{{ record.active.M }}</b></span>
              </div>
              <span v-else class="mute-cell">暂无活跃榜</span>
            </template>

            <!-- 扩展指标 -->
            <template v-else-if="column.key === 'extras'">
              <div class="metaline">
                <span title="群管增强的当日消息总计">
                  <Icon icon="ant-design:calendar-outlined" :size="12" />
                  <b>{{ thousands(record.dayTotal) }}</b>
                </span>
                <span title="该群参与的角色排行榜数">
                  <Icon icon="ant-design:trophy-outlined" :size="12" />
                  <b>{{ record.rankKeys }}</b>
                </span>
                <span title="绑定到该群的用户数">
                  <Icon icon="ant-design:team-outlined" :size="12" />
                  <b>{{ record.boundUsers }}</b>
                </span>
              </div>
            </template>

            <!-- 最近活跃 -->
            <template v-else-if="column.key === 'lastDate'">
              <div class="fresh" :class="`is-${fresh(record.lastDate).level}`">
                <i />
                {{ fresh(record.lastDate).text }}
              </div>
              <div class="fresh__date">{{ record.lastDate || '—' }}</div>
            </template>

            <template v-else-if="column.key === 'action'">
              <Button type="link" size="small" class="row-more" @click="openDetail(record)">详情</Button>
            </template>
          </template>
        </Table>
      </div>

      <div v-if="!available && !loading" class="g-card db-tip">
        <InfoCircleOutlined class="tip__icon" />
        <div>
          <div class="g-strong">暂无群统计数据</div>
          <div class="g-muted">
            请重启 Bot 让 <span class="g-mono">/api/admin/stats/*</span> 生效，并确认 Redis 中存在
            <span class="g-mono">Yz:count:*:msg:group:*</span> 计数键。
          </div>
        </div>
      </div>
    </div>

    <!-- 群详情抽屉 -->
    <Drawer :visible="drawer.visible" :title="drawerTitle" width="640" @close="drawer.visible = false">
      <template v-if="detail">
        <div class="detail-stats">
          <div v-for="s in detailStats" :key="s.label" class="detail-stat">
            <div class="g-muted">{{ s.label }}</div>
            <div class="detail-stat__value">{{ s.value }}</div>
          </div>
        </div>

        <div class="drawer-block">
          <div class="block-title">近 14 天消息量</div>
          <div ref="detailRef" class="g-chart g-chart--sm" />
        </div>

        <div class="drawer-block">
          <div class="block-title">
            群主 / 群管名单
            <Button type="link" size="small" @click="openRoleModal('groupAdmin')">添加群管</Button>
            <Button type="link" size="small" @click="openRoleModal('owner')">设置群主</Button>
          </div>
          <div class="roles">
            <div class="roles__row">
              <span class="roles__label">群主</span>
              <div class="roles__chips">
                <template v-if="roles.owner.length">
                  <span v-for="u in roles.owner" :key="u" class="g-chip roles__chip">
                    {{ shortGid(u) }}
                    <CloseOutlined class="roles__remove" @click="removeRole('owner', u)" />
                  </span>
                </template>
                <span v-else class="g-muted">未设置（Redis 名单）</span>
              </div>
            </div>
            <div class="roles__row">
              <span class="roles__label">群管</span>
              <div class="roles__chips">
                <template v-if="roles.groupAdmin.length">
                  <span v-for="u in roles.groupAdmin" :key="u" class="g-chip roles__chip">
                    {{ shortGid(u) }}
                    <CloseOutlined class="roles__remove" @click="removeRole('groupAdmin', u)" />
                  </span>
                </template>
                <span v-else class="g-muted">未设置（Redis 名单）</span>
              </div>
            </div>
            <div class="roles__tip g-muted">
              名单存于 Redis（Yz:GM:owner / Yz:GM:groupAdmin），与群管拓展指令共用，改动即时生效。
            </div>
          </div>
        </div>

        <div class="drawer-block">
          <div class="block-title">AI 分群开关</div>
          <div class="ai-switches">
            <div class="ai-switch">
              <div>
                <div class="ai-switch__name">荧（YingAI）</div>
                <div class="g-muted ai-switch__desc">本群的 AI 聊天与主动发言</div>
              </div>
              <Switch
                :checked="aiState.ying"
                :loading="aiLoading.ying"
                checked-children="开"
                un-checked-children="关"
                @change="(v: any) => toggleAI('ying', !!v)"
              />
            </div>
            <div class="ai-switch">
              <div>
                <div class="ai-switch__name">群管拓展 AI</div>
                <div class="g-muted ai-switch__desc">风控 / 日报 / 欢迎语 / 指令解析等</div>
              </div>
              <Switch
                :checked="aiState.gm"
                :loading="aiLoading.gm"
                checked-children="开"
                un-checked-children="关"
                @change="(v: any) => toggleAI('gm', !!v)"
              />
            </div>
          </div>
        </div>

        <div class="drawer-block">
          <div class="block-title">
            活跃榜 TOP
            <span class="g-muted" v-if="detail.topSlot">周期：{{ slotName(detail.topSlot) }}</span>
          </div>
          <div v-if="detail.top && detail.top.length" class="g-rank">
            <div v-for="(u, i) in detail.top" :key="u.user" class="g-rank__row">
              <div class="g-rank__idx" :class="{ 'g-rank__idx--top': i < 3 }">{{ i + 1 }}</div>
              <div class="g-rank__main">
                <div class="g-rank__name">{{ u.name || maskUser(u.user) }}</div>
                <div v-if="u.name" class="g-rank__id">{{ maskUser(u.user) }}</div>
              </div>
              <div class="g-rank__val">{{ thousands(u.score) }}</div>
            </div>
          </div>
          <div v-else class="g-empty" style="height: 100px">该群暂无群管活跃榜数据</div>
        </div>
      </template>
    </Drawer>

    <!-- 无效群检测抽屉 -->
    <Drawer :visible="invalidDrawer.visible" title="无效群检测" width="700" @close="invalidDrawer.visible = false">
      <template v-if="invalidDrawer.data">
        <div class="inv-summary">
          跟踪 <b>{{ invalidDrawer.data.trackedCount }}</b> 个群 · Bot 当前在
          <b>{{ invalidDrawer.data.botGroupCount }}</b> 个群 · 已退群
          <b class="inv-warn">{{ invalidDrawer.data.left.length }}</b> · 零活跃
          <b class="inv-warn">{{ invalidDrawer.data.idle.length }}</b> · 低活跃
          <b>{{ invalidDrawer.data.low.length }}</b>
          <span class="inv-summary__time">检测于 {{ shortTime(invalidDrawer.data.updatedAt) }}</span>
        </div>

        <div class="inv-tabs">
          <span class="gm-seg">
            <span
              v-for="t in invTabs"
              :key="t.key"
              class="gm-seg__item"
              :class="{ 'is-active': invalidDrawer.tab === t.key }"
              @click="switchInvTab(t.key)"
            >
              {{ t.label }} · {{ (invalidDrawer.data[t.key] || []).length }}
            </span>
          </span>
          <Checkbox
            :checked="allCurrentChecked"
            :indeterminate="someCurrentChecked"
            @change="toggleAllCurrent"
          >
            全选本组
          </Checkbox>
        </div>

        <div v-if="currentInvList.length" class="inv-list">
          <div v-for="g in currentInvList" :key="g.gid" class="inv-row">
            <Checkbox
              :checked="invChecked.includes(g.gid)"
              @change="(e: any) => toggleInv(g.gid, e?.target?.checked)"
            />
            <div class="inv-row__main">
              <b>{{ g.name || shortGid(g.gid) }}</b>
              <span class="g-mono">{{ shortGid(g.gid) }}</span>
            </div>
            <div class="inv-row__meta">
              <span>累计 <b>{{ thousands(g.total) }}</b></span>
              <span>近14天 <b>{{ thousands(g.recent14) }}</b></span>
              <span>最后活跃 {{ g.lastDate ? g.lastDate.slice(5) : '—' }}</span>
            </div>
            <span v-if="invalidDrawer.tab === 'left'" class="inv-chip inv-chip--warn">Bot 已退出</span>
            <Button
              v-else
              type="link"
              danger
              size="small"
              @click="openQuit(g)"
            >
              退群
            </Button>
          </div>
        </div>
        <div v-else class="g-empty" style="padding: 30px 0">该分组没有检测到群 🎉</div>

        <div class="inv-actions">
          <span>已选 {{ invChecked.length }} 个群</span>
          <Button danger :disabled="!invChecked.length" :loading="invClearModal.loading" @click="openInvClear">
            清空选中群数据（活跃+拓展）
          </Button>
        </div>
      </template>
      <div v-else class="gm-skeleton" style="height: 300px" />
    </Drawer>

    <!-- 退群确认 -->
    <GConfirmModal
      v-model:visible="quitModal.visible"
      title="Bot 退群确认"
      :content="quitModal.content"
      hint="将调用适配器接口让 Bot 退出该群，操作不可撤销。清数据可在退群前或退群后另行执行。"
      danger
      :loading="quitModal.loading"
      @ok="doQuit"
    />

    <!-- 无效群批量清数据确认 -->
    <GConfirmModal
      v-model:visible="invClearModal.visible"
      title="批量清空无效群数据"
      :content="invClearModal.content"
      hint="等同 #清活跃 + #清拓展，删除后不可恢复。"
      danger
      :loading="invClearModal.loading"
      @ok="doInvClear"
    />

    <!-- 批量清数据确认 -->
    <GConfirmModal
      v-model:visible="batchModal.visible"
      :title="batchModal.title"
      :content="batchModal.content"
      :hint="batchModal.hint"
      danger
      :loading="batchModal.loading"
      @ok="doBatchClear"
    />

    <!-- 批量 AI 开关确认 -->
    <GConfirmModal
      v-model:visible="aiModal.visible"
      :title="aiModal.title"
      :content="aiModal.content"
      :loading="aiModal.loading"
      @ok="doAISet"
    />

    <!-- 添加群主/群管 -->
    <GFormModal
      v-model:visible="roleModal.visible"
      :title="roleModal.title"
      :schema="roleModal.schema"
      :loading="roleModal.loading"
      ok-text="确认添加"
      hint="名单按群存入 Redis，仅本群生效；群主可执行群管操作，管理员可执行群管增强的基础指令。"
      @ok="submitRole"
    />
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, nextTick, onMounted, reactive, ref, unref, watch } from 'vue';
  import { Button, Checkbox, Drawer, Input, message, Select, Switch, Table, Tag } from 'ant-design-vue';
  import { CloseOutlined, InfoCircleOutlined } from '@ant-design/icons-vue';
  import { PageWrapper } from '/@/components/Page';
  import { Icon } from '/@/components/Icon';
  import { useECharts } from '/@/hooks/web/useECharts';
  import { useRootSetting } from '/@/hooks/setting/useRootSetting';
  import { ThemeEnum } from '/@/enums/appEnum';
  import GEmpty from '../_shared/GEmpty.vue';
  import GConfirmModal from '../_shared/dialog/GConfirmModal.vue';
  import GFormModal from '../_shared/dialog/GFormModal.vue';
  import type { GroupDetailResult, GroupRow, GroupSummary, InvalidGroupItem, InvalidGroupsResult, TrendPoint } from '../_shared/stats';
  import {
    chartBase,
    daysAgo,
    fmtNum,
    hexToRgba,
    kpiPalette,
    primaryColor,
    secondaryColor,
    shortGid,
    statsApi,
    thousands,
  } from '../_shared/stats';

  defineOptions({ name: 'Groups' });

  const { getDarkMode } = useRootSetting();
  const isDark = computed(() => unref(getDarkMode) === ThemeEnum.DARK);
  const primary = computed(() => primaryColor(isDark.value));
  const secondary = computed(() => secondaryColor(isDark.value));

  const loading = ref(false);
  const available = ref(true);
  const list = ref<GroupRow[]>([]);
  const trend = ref<TrendPoint[]>([]);
  const summary = ref<GroupSummary>({
    groupCount: 0,
    todayMsg: 0,
    totalMsg: 0,
    activeToday: 0,
    avgPerGroup: 0,
  });
  const pager = reactive({ page: 1, size: 20, total: 0 });
  const query = reactive({ keyword: '', sort: 'total', order: 'desc' });

  const sortOptions = [
    { label: '按消息总量', value: 'total' },
    { label: '按接收量', value: 'recv' },
    { label: '按发送量', value: 'send' },
    { label: '按活跃天数', value: 'activeDays' },
    { label: '按日均消息', value: 'avgDaily' },
    { label: '按排行参与', value: 'rankKeys' },
    { label: '按绑定用户', value: 'boundUsers' },
    { label: '按最近活跃', value: 'lastDate' },
  ];

  const columns = [
    { title: '群', dataIndex: 'gid', key: 'gid', width: 200, fixed: 'left' as const },
    { title: '消息量', key: 'total', width: 178 },
    { title: '近 14 天', key: 'spark', width: 152 },
    { title: '活跃榜人数', key: 'active', width: 142 },
    { title: '扩展指标', key: 'extras', width: 148 },
    { title: '最近活跃', key: 'lastDate', width: 106 },
    { title: '操作', key: 'action', width: 62, fixed: 'right' as const },
  ];

  const pagination = computed(() => ({
    current: pager.page,
    pageSize: pager.size,
    total: pager.total,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (t: number) => `共 ${t} 个群`,
  }));

  const cards = computed(() => {
    const p = kpiPalette(isDark.value);
    return [
      {
        key: 'groups',
        label: '群总数',
        icon: 'ant-design:appstore-outlined',
        value: thousands(summary.value.groupCount),
        unit: '个',
        foot: `今日活跃 ${summary.value.activeToday} 个`,
        color: p.blue[0],
        color2: p.blue[1],
      },
      {
        key: 'today',
        label: '今日消息',
        icon: 'ant-design:message-outlined',
        value: thousands(summary.value.todayMsg),
        unit: '条',
        foot: '今日全群收发合计',
        color: p.green[0],
        color2: p.green[1],
      },
      {
        key: 'total',
        label: '累计消息',
        icon: 'ant-design:database-outlined',
        value: fmtNum(summary.value.totalMsg),
        unit: '条',
        foot: '历史全部群消息',
        color: p.violet[0],
        color2: p.violet[1],
      },
      {
        key: 'avg',
        label: '群均累计',
        icon: 'ant-design:fund-outlined',
        value: fmtNum(summary.value.avgPerGroup),
        unit: '条',
        foot: '累计消息 / 群数',
        color: p.amber[0],
        color2: p.amber[1],
      },
    ];
  });

  /** 收发结构占比（相对收+发） */
  function pct(v: number, total: number) {
    const t = Math.max(total || 0, 1);
    return `${Math.min(100, (v / t) * 100).toFixed(2)}%`;
  }

  function hasActive(r: GroupRow) {
    return Boolean(r.active?.N || r.active?.W || r.active?.M);
  }

  /** 相对新鲜度：热（今天/昨天）→ 温（一周内）→ 凉（一月内）→ 冷 */
  function fresh(date?: string) {
    const d = daysAgo(date);
    if (d === null) return { level: 'cold', text: '无记录' };
    if (d <= 0) return { level: 'hot', text: '今天活跃' };
    if (d === 1) return { level: 'warm', text: '昨天活跃' };
    if (d <= 7) return { level: 'warm', text: `${d} 天前` };
    if (d <= 30) return { level: 'cool', text: `${Math.floor(d / 7)} 周前` };
    if (d <= 365) return { level: 'cold', text: `${Math.floor(d / 30)} 个月前` };
    return { level: 'cold', text: `${Math.floor(d / 365)} 年前` };
  }

  const SPARK_W = 168;
  const SPARK_H = 34;
  const sparkCache = new Map<string, { line: string; area: string; max: number; trend: number }>();

  /** 迷你面积图路径（按行缓存，主题切换时换 key） */
  function spark(r: GroupRow) {
    const key = `${isDark.value ? 'd' : 'l'}|${r.gid}|${r.total}`;
    const hit = sparkCache.get(key);
    if (hit) return hit;
    const ns = (r.daily || []).map((d) => Number(d.n) || 0);
    const max = Math.max(1, ...ns);
    const step = ns.length > 1 ? SPARK_W / (ns.length - 1) : SPARK_W;
    const pts = ns.map((n, i) => [i * step, SPARK_H - 2 - (n / max) * (SPARK_H - 6)] as const);
    const line =
      pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ') || `M0,${SPARK_H}`;
    const area = `${line} L${SPARK_W},${SPARK_H} L0,${SPARK_H} Z`;
    /* 后半段 vs 前半段的变化率，用来给一个趋势箭头 */
    const half = Math.floor(ns.length / 2) || 1;
    const a = ns.slice(0, half).reduce((s, n) => s + n, 0);
    const b = ns.slice(half).reduce((s, n) => s + n, 0);
    const trend = a > 0 ? Math.round(((b - a) / a) * 100) : b > 0 ? 100 : 0;
    const res = { line, area, max, trend };
    sparkCache.set(key, res);
    return res;
  }

  function sparkTitle(r: GroupRow) {
    const total = (r.daily || []).reduce((s, d) => s + (Number(d.n) || 0), 0);
    const t = spark(r).trend;
    const dir = t > 0 ? `较前 7 天 +${t}%` : t < 0 ? `较前 7 天 ${t}%` : '与前 7 天持平';
    return `近 ${r.daily?.length ?? 0} 天共 ${thousands(total)} 条 · ${dir}`;
  }

  function toggleOrder() {
    query.order = query.order === 'desc' ? 'asc' : 'desc';
    handleSearch();
  }

  function maskUser(id: string) {
    if (!id) return '';
    return id.length <= 12 ? id : `${id.slice(0, 6)}****${id.slice(-4)}`;
  }

  function slotName(slot: string) {
    return (
      { N: '今日', D: '日榜', W: '周榜', M: '月榜', all: '累计' }[slot] ?? slot
    );
  }

  /* ------------------------------ 图表 ------------------------------ */

  const trendRef = ref<HTMLDivElement | null>(null);
  const trendChart = useECharts(trendRef);

  function renderTrend() {
    const base = chartBase(isDark.value);
    trendChart.setOptions({
      grid: { top: 20, right: 16, bottom: 24, left: 44 },
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
          name: '群消息',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: trend.value.map((t) => t.total),
          lineStyle: { width: 2.4, color: primary.value },
          itemStyle: { color: primary.value },
          areaStyle: { color: areaGradient(primary.value, 0.3) },
        },
      ],
    });
  }

  function areaGradient(color: string, topOpacity = 0.28) {
    return new trendChart.echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: hexToRgba(color, topOpacity) },
      { offset: 1, color: hexToRgba(color, 0) },
    ]);
  }

  /* ------------------------------ 数据 ------------------------------ */

  async function loadData() {
    loading.value = true;
    try {
      const res = await statsApi.getGroups({
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

  /* ------------------------------ 批量操作 ------------------------------ */

  const selectedRowKeys = ref<string[]>([]);
  const rowSelection = computed(() => ({
    selectedRowKeys: selectedRowKeys.value,
    onChange: (keys: string[]) => (selectedRowKeys.value = keys),
    // 固定列右侧的“操作”列不出现选择框冲突，仅数据行可选
    selections: true,
  }));

  const batchModal = reactive({
    visible: false,
    title: '',
    content: '',
    hint: '',
    scope: 'activity' as 'activity' | 'ext',
    loading: false,
  });

  function openBatchConfirm(scope: 'activity' | 'ext') {
    const n = selectedRowKeys.value.length;
    const names = list.value
      .filter((g) => selectedRowKeys.value.includes(g.gid))
      .slice(0, 5)
      .map((g) => shortGid(g.gid))
      .join('、');
    const more = n > 5 ? ` 等 ${n} 个群` : '';
    if (scope === 'activity') {
      batchModal.title = '批量清空活跃榜';
      batchModal.content = `即将清空 ${names}${more} 的活跃榜数据（总榜/日/周/月/夜晚榜 + 近 60 天日总计）。`;
    } else {
      batchModal.title = '批量清空拓展数据';
      batchModal.content = `即将清空 ${names}${more} 的签到 / 积分 / 复读 / 撤回 / 风控记录。`;
    }
    batchModal.hint = '该操作与群管拓展的 #清活跃 / #清拓展 指令效果一致，删除后不可恢复。';
    batchModal.scope = scope;
    batchModal.visible = true;
  }

  async function doBatchClear() {
    batchModal.loading = true;
    try {
      const res = await statsApi.batchClearGroups(selectedRowKeys.value, batchModal.scope);
      message.success(`${batchModal.title}完成：${selectedRowKeys.value.length} 个群，共删除 ${res?.total ?? 0} 个键`);
      batchModal.visible = false;
      selectedRowKeys.value = [];
      loadData();
    } catch (e: any) {
      message.error(e?.message || '操作失败');
    } finally {
      batchModal.loading = false;
    }
  }

  /* ------------------------------ 无效群检测 ------------------------------ */

  const invTabs = [
    { key: 'left', label: '已退群' },
    { key: 'idle', label: '零活跃' },
    { key: 'low', label: '低活跃' },
  ] as const;

  const invalidDrawer = reactive({
    visible: false,
    loading: false,
    tab: 'left' as 'left' | 'idle' | 'low',
    data: null as InvalidGroupsResult | null,
  });
  const invChecked = ref<string[]>([]);

  const currentInvList = computed<InvalidGroupItem[]>(() => invalidDrawer.data?.[invalidDrawer.tab] ?? []);

  const allCurrentChecked = computed(
    () => currentInvList.value.length > 0 && currentInvList.value.every((g) => invChecked.value.includes(g.gid)),
  );
  const someCurrentChecked = computed(
    () => !allCurrentChecked.value && currentInvList.value.some((g) => invChecked.value.includes(g.gid)),
  );

  function shortTime(iso?: string | null) {
    return String(iso || '').replace('T', ' ').slice(5, 16);
  }

  function switchInvTab(key: 'left' | 'idle' | 'low') {
    invalidDrawer.tab = key;
  }

  function toggleInv(gid: string, checked: boolean) {
    invChecked.value = checked ? [...invChecked.value, gid] : invChecked.value.filter((x) => x !== gid);
  }

  function toggleAllCurrent(e: any) {
    const checked = e?.target?.checked;
    const ids = currentInvList.value.map((g) => g.gid);
    invChecked.value = checked
      ? [...new Set([...invChecked.value, ...ids])]
      : invChecked.value.filter((x) => !ids.includes(x));
  }

  async function openInvalid() {
    invalidDrawer.visible = true;
    invalidDrawer.loading = true;
    invalidDrawer.data = null;
    invChecked.value = [];
    try {
      const res = await statsApi.getInvalidGroups();
      invalidDrawer.data = res;
      if (res) {
        invalidDrawer.tab = res.left.length ? 'left' : res.idle.length ? 'idle' : 'low';
        // 已退群 + 零活跃默认全选；低活跃仅提醒，不默认选中
        invChecked.value = [...res.left.map((g) => g.gid), ...res.idle.map((g) => g.gid)];
      }
    } catch (e: any) {
      message.error(e?.message || '检测失败，请确认 Bot 已重启（接口 /admin/groups/invalid）');
      invalidDrawer.visible = false;
    } finally {
      invalidDrawer.loading = false;
    }
  }

  const invClearModal = reactive({ visible: false, content: '', loading: false });

  function openInvClear() {
    const n = invChecked.value.length;
    invClearModal.content = `即将清空 ${n} 个群的活跃榜与拓展数据（签到/积分/复读/撤回/风控记录等）。`;
    invClearModal.visible = true;
  }

  async function doInvClear() {
    invClearModal.loading = true;
    try {
      const res = await statsApi.batchClearGroups(invChecked.value, 'all');
      message.success(`清理完成：${invChecked.value.length} 个群，共删除 ${res?.total ?? 0} 个键`);
      invClearModal.visible = false;
      invChecked.value = [];
      await openInvalid();
    } catch (e: any) {
      message.error(e?.message || '操作失败');
    } finally {
      invClearModal.loading = false;
    }
  }

  const quitModal = reactive({ visible: false, gid: '', name: '', content: '', loading: false });

  function openQuit(g: InvalidGroupItem) {
    quitModal.gid = g.gid;
    quitModal.name = g.name || shortGid(g.gid);
    quitModal.content = `即将让 Bot 退出「${quitModal.name}」（${shortGid(g.gid)}）。退群后该群的后续消息不会再产生统计。`;
    quitModal.visible = true;
  }

  async function doQuit() {
    quitModal.loading = true;
    try {
      const res = await statsApi.quitGroup(quitModal.gid);
      message.success(`退群指令已发送（Bot：${(res?.bots || []).join('、') || '—'}）`);
      quitModal.visible = false;
      await openInvalid();
      loadData();
    } catch (e: any) {
      message.error(e?.message || '退群失败');
    } finally {
      quitModal.loading = false;
    }
  }

  /* ------------------------------ 群管名单 ------------------------------ */

  const roles = reactive<{ owner: string[]; groupAdmin: string[] }>({ owner: [], groupAdmin: [] });

  async function loadRoles(gid: string) {
    try {
      const res = await statsApi.getGroupRoles(gid);
      roles.owner = res?.owner ?? [];
      roles.groupAdmin = res?.groupAdmin ?? [];
    } catch {
      roles.owner = [];
      roles.groupAdmin = [];
    }
  }

  const roleModal = reactive({
    visible: false,
    title: '',
    role: 'groupAdmin' as 'owner' | 'groupAdmin',
    loading: false,
    schema: [
      {
        field: 'uid',
        label: '用户 ID',
        type: 'input' as const,
        required: true,
        placeholder: 'wxid 或 数字 ID',
        tip: '支持逗号/空格分隔多个，一次添加多人',
      },
    ],
  });

  function openRoleModal(role: 'owner' | 'groupAdmin') {
    roleModal.role = role;
    roleModal.title = role === 'owner' ? '设置本群群主' : '添加本群群管理员';
    roleModal.visible = true;
  }

  async function submitRole(values: { uid: string }) {
    const uids = String(values?.uid || '')
      .split(/[,，\s]+/)
      .filter(Boolean);
    if (!uids.length) return;
    roleModal.loading = true;
    try {
      await statsApi.setGroupRole(drawer.gid, roleModal.role, uids, true);
      message.success(`已添加 ${uids.length} 人到${roleModal.role === 'owner' ? '群主' : '群管'}名单`);
      roleModal.visible = false;
      await loadRoles(drawer.gid);
    } catch (e: any) {
      message.error(e?.message || '操作失败');
    } finally {
      roleModal.loading = false;
    }
  }

  async function removeRole(role: 'owner' | 'groupAdmin', uid: string) {
    try {
      await statsApi.setGroupRole(drawer.gid, role, uid, false);
      message.success('已移除');
      await loadRoles(drawer.gid);
    } catch (e: any) {
      message.error(e?.message || '操作失败');
    }
  }

  /* ------------------------------ AI 分群开关 ------------------------------ */

  const aiState = reactive({ ying: true, gm: true });
  const aiLoading = reactive({ ying: false, gm: false });

  async function loadAIState(gid: string) {
    try {
      const res = await statsApi.getAISwitches([gid]);
      aiState.ying = res?.ying?.[gid] !== false;
      aiState.gm = res?.gm?.[gid] !== false;
    } catch {
      aiState.ying = true;
      aiState.gm = true;
    }
  }

  async function toggleAI(scope: 'ying' | 'gm', on: boolean) {
    aiLoading[scope] = true;
    try {
      await statsApi.setAISwitch(scope, [drawer.gid], !on);
      message.success(`${scope === 'ying' ? '荧' : '群管拓展 AI'} 已在该群${on ? '开启' : '关闭'}`);
      aiState[scope] = on;
    } catch (e: any) {
      message.error(e?.message || '操作失败');
    } finally {
      aiLoading[scope] = false;
    }
  }

  const aiModal = reactive({
    visible: false,
    title: '',
    content: '',
    scope: 'ying' as 'ying' | 'gm',
    off: true,
    loading: false,
  });

  function openAIConfirm(scope: 'ying' | 'gm', on: boolean) {
    const n = selectedRowKeys.value.length;
    aiModal.scope = scope;
    aiModal.off = !on;
    aiModal.title = `批量${on ? '开启' : '关闭'}${scope === 'ying' ? '荧（YingAI）' : '群管拓展 AI'}`;
    aiModal.content = `将对选中的 ${n} 个群${on ? '开启' : '关闭'}${
      scope === 'ying' ? '荧的 AI 聊天与主动发言（写 YingAI 群配置）' : '群管拓展的风控/日报/欢迎语等 AI 功能'
    }。`;
    aiModal.visible = true;
  }

  async function doAISet() {
    aiModal.loading = true;
    try {
      await statsApi.setAISwitch(aiModal.scope, selectedRowKeys.value, aiModal.off);
      message.success('操作完成');
      aiModal.visible = false;
    } catch (e: any) {
      message.error(e?.message || '操作失败');
    } finally {
      aiModal.loading = false;
    }
  }

  /* ------------------------------ 详情 ------------------------------ */

  const drawer = reactive<{ visible: boolean; gid: string }>({ visible: false, gid: '' });
  const detail = ref<GroupDetailResult | null>(null);
  const detailRef = ref<HTMLDivElement | null>(null);
  const detailChart = useECharts(detailRef);

  const drawerTitle = computed(() => {
    const name = detail.value?.name || '';
    return name ? `${name} · 群详情` : `群 ${shortGid(drawer.gid) || ''} 详情`;
  });

  const detailStats = computed(() => {
    const d = detail.value;
    if (!d) return [];
    return [
      { label: '消息总量', value: thousands(d.total) },
      { label: '接收', value: thousands(d.recv) },
      { label: '机器人发送', value: thousands(d.send) },
      { label: '活跃天数', value: `${d.activeDays} 天` },
      { label: '日总计', value: thousands(d.dayTotal) },
      { label: '绑定用户', value: `${d.boundUsers} 人` },
    ];
  });

  async function openDetail(record: GroupRow) {
    drawer.gid = record.gid;
    detail.value = { ...record, available: true, top: [] } as GroupDetailResult;
    drawer.visible = true;
    loadRoles(record.gid);
    loadAIState(record.gid);
    try {
      const res = await statsApi.getGroupDetail(record.gid);
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
          barMaxWidth: 18,
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

  watch(isDark, () =>
    nextTick(() => {
      renderTrend();
      if (drawer.visible) renderDetail();
    }),
  );

  onMounted(loadAll);
</script>

<style scoped lang="less">
  /* ---------------- 无效群检测抽屉 ---------------- */
  .inv-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    align-items: baseline;
    padding: 10px 14px;
    margin-bottom: 12px;
    font-size: 12.5px;
    color: var(--g-text-sub);
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 10px;

    b {
      color: var(--g-text);
      font-variant-numeric: tabular-nums;
    }

    .inv-warn {
      color: var(--g-amber, #d4af37);
    }
  }

  .inv-summary__time {
    margin-left: auto;
    font-size: 11px;
    color: var(--g-text-mute);
  }

  .inv-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .inv-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
    max-height: 46vh;
    overflow-y: auto;
  }

  .inv-row {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 8px 12px;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 10px;
    transition: border-color 0.18s;

    &:hover {
      border-color: var(--g-card-border-strong);
    }
  }

  .inv-row__main {
    display: flex;
    flex: 1 1 auto;
    gap: 8px;
    align-items: baseline;
    min-width: 0;

    b {
      overflow: hidden;
      font-size: 13px;
      color: var(--g-text);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      flex-shrink: 0;
      font-size: 11px;
      color: var(--g-text-mute);
    }
  }

  .inv-row__meta {
    display: flex;
    flex-shrink: 0;
    gap: 12px;
    font-size: 11.5px;
    color: var(--g-text-mute);

    b {
      color: var(--g-text-sub);
      font-variant-numeric: tabular-nums;
    }
  }

  .inv-chip {
    flex-shrink: 0;
    padding: 1px 8px;
    font-size: 11px;
    border-radius: 20px;
  }

  .inv-chip--warn {
    color: var(--g-amber, #d4af37);
    background: rgb(212 175 55 / 12%);
  }

  .inv-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: flex-end;
    padding-top: 12px;
    margin-top: 4px;
    font-size: 12.5px;
    color: var(--g-text-sub);
    border-top: 1px dashed var(--g-card-border);
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .batch-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    margin-bottom: 12px;
    padding: 8px 14px;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-gold-soft);
    border-radius: 8px;
  }

  .batch-bar__count {
    font-size: 13px;
    font-weight: 600;
    color: var(--g-text);
  }

  .roles {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 10px;
  }

  .g-rank__id {
    margin-top: 2px;
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 10.5px;
    color: var(--g-text-mute);
    opacity: 0.8;
  }

  .roles__row {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }

  .roles__label {
    flex-shrink: 0;
    width: 36px;
    padding-top: 2px;
    font-size: 12px;
    color: var(--g-text-mute);
  }

  .roles__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .roles__chip {
    display: inline-flex;
    gap: 4px;
    align-items: center;
  }

  .roles__remove {
    cursor: pointer;
    color: var(--g-text-mute);

    &:hover {
      color: #ff5722;
    }
  }

  .roles__tip {
    font-size: 12px;
  }

  .ai-switches {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px 14px;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 10px;
  }

  .ai-switch {
    display: flex;
    flex: 1;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
  }

  .ai-switch__name {
    font-size: 13px;
    font-weight: 600;
    color: var(--g-text);
  }

  .ai-switch__desc {
    font-size: 12px;
  }

  .w-200 {
    width: 200px;
  }

  .w-140 {
    width: 140px;
  }

  .order-btn,
  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    padding: 0;
  }

  /* ---------- 群列表：结构化行 ---------- */

  .gcell {
    display: flex;
    gap: 9px;
    align-items: center;
    min-width: 0;
  }

  .gcell__dot {
    flex: 0 0 auto;
    width: 7px;
    height: 7px;
    background: var(--g-text-mute);
    border-radius: 50%;
    opacity: 0.55;

    &.is-hot {
      background: var(--g-green);
      opacity: 1;
      box-shadow: 0 0 0 3px rgb(69 185 124 / 18%);
    }

    &.is-warm {
      background: var(--g-blue);
      opacity: 1;
    }

    &.is-cool {
      background: var(--g-amber);
      opacity: 1;
    }
  }

  .gcell__body {
    min-width: 0;
  }

  .gcell__name {
    overflow: hidden;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--g-text);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .gcell__gid {
    margin-top: 2px;
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 11px;
    color: var(--g-text-mute);
    letter-spacing: 0.2px;
  }

  .mcell__top {
    display: flex;
    gap: 8px;
    align-items: baseline;
  }

  .mcell__num {
    font-size: 16px;
    font-weight: 650;
    color: var(--g-text);
    font-variant-numeric: tabular-nums;
  }

  .mcell__avg {
    font-size: 11px;
    color: var(--g-text-mute);
  }

  .mcell__bar {
    display: flex;
    gap: 2px;
    height: 5px;
    margin-top: 6px;
    overflow: hidden;
    border-radius: 3px;
    background: var(--g-track);
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

  .spk {
    svg {
      display: block;
      width: 100%;
      height: 34px;
      overflow: visible;
    }
  }

  .spk__foot {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
    font-size: 10.5px;
    color: var(--g-text-mute);
    font-variant-numeric: tabular-nums;

    span {
      display: inline-flex;
      gap: 2px;
      align-items: center;
    }
  }

  .actline {
    display: flex;
    gap: 6px;
  }

  .act {
    display: inline-flex;
    gap: 2px;
    align-items: center;
    padding: 2px 6px;
    font-size: 10.5px;
    color: var(--g-text-sub);
    background: var(--g-chip-bg);
    border: 1px solid transparent;
    border-radius: 6px;

    b {
      font-size: 11.5px;
      font-variant-numeric: tabular-nums;
    }

    &.is-day {
      color: var(--g-green);
      background: rgb(69 185 124 / 11%);
      border-color: rgb(69 185 124 / 22%);
    }

    &.is-week {
      color: var(--g-blue);
      background: rgb(98 168 234 / 11%);
      border-color: rgb(98 168 234 / 22%);
    }

    &.is-month {
      color: var(--g-violet);
      background: rgb(157 141 240 / 11%);
      border-color: rgb(157 141 240 / 22%);
    }
  }

  .metaline {
    display: flex;
    flex-wrap: nowrap;
    gap: 0;
    align-items: center;
    font-size: 10.5px;
    color: var(--g-text-mute);
    white-space: nowrap;

    span {
      display: inline-flex;
      gap: 4px;
      align-items: center;
    }

    span + span::before {
      margin: 0 7px;
      color: var(--g-text-mute);
      content: '·';
      opacity: 0.5;
    }

    b {
      font-size: 12px;
      font-weight: 600;
      color: var(--g-text-sub);
      font-variant-numeric: tabular-nums;
    }

    .anticon,
    svg {
      opacity: 0.7;
    }
  }

  .fresh {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    font-size: 12px;
    font-weight: 600;
    color: var(--g-text-sub);

    i {
      width: 6px;
      height: 6px;
      background: var(--g-text-mute);
      border-radius: 50%;
    }

    &.is-hot {
      color: var(--g-green);

      i {
        background: var(--g-green);
        box-shadow: 0 0 0 3px rgb(69 185 124 / 16%);
      }
    }

    &.is-warm {
      color: var(--g-blue);

      i {
        background: var(--g-blue);
      }
    }

    &.is-cool {
      color: var(--g-amber);

      i {
        background: var(--g-amber);
      }
    }

    &.is-cold {
      color: var(--g-text-mute);
      font-weight: 500;
    }
  }

  .fresh__date {
    margin-top: 2px;
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 10.5px;
    color: var(--g-text-mute);
    opacity: 0.8;
  }

  .mute-cell {
    font-size: 12px;
    color: var(--g-text-mute);
    opacity: 0.75;
  }

  .row-more {
    padding: 0;
    opacity: 0.7;
  }

  /* 表头与行：去掉 antd 默认粗分隔，改成细线 + hover 层次 */
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

  /* 去掉表头多选列右侧那个“全选下拉”箭头，容易误认成排序 */
  :deep(.ant-table-selection-extra) {
    display: none;
  }

  :deep(.ant-table-tbody > tr > td) {
    border-bottom: 1px solid var(--g-card-border);
  }

  :deep(.ant-table-tbody > tr:hover > td) {
    background: var(--g-hover) !important;
  }

  /* 固定列要有实心背景，否则滚动时会透出内容 */
  :deep(.ant-table-cell-fix-left),
  :deep(.ant-table-cell-fix-right) {
    background: var(--g-card-bg);
  }

  :deep(.ant-table-tbody > tr:hover > td.ant-table-cell-fix-left),
  :deep(.ant-table-tbody > tr:hover > td.ant-table-cell-fix-right) {
    background: var(--g-card-bg-soft) !important;
  }

  :deep(.ant-table-tbody > tr:hover .row-more) {
    opacity: 1;
  }

  :deep(.ant-table-tbody > tr > td:first-child) {
    position: relative;
  }

  :deep(.ant-table-tbody > tr:hover > td:first-child)::after {
    position: absolute;
    top: 8px;
    bottom: 8px;
    left: 0;
    width: 2px;
    background: var(--g-blue);
    border-radius: 2px;
    content: '';
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

  .tip__icon {
    margin-top: 2px;
    font-size: 16px;
    color: var(--g-gold);
  }
</style>
