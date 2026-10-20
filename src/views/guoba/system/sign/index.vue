<template>
  <PageWrapper title="">
    <div class="db g-page">
      <!-- ============================ 页头 ============================ -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">CHECK-IN ANALYTICS</div>
          <div class="db-hero__title">{{ scope === 'mys' ? '游戏签到' : '鸣潮签到' }}</div>
          <div class="db-hero__desc" v-if="scope === 'mys'">
            每日签到人次、各游戏完成度与账号级明细
            <span v-if="overview.meta.lastAt" class="db-hero__time">
              · 最近一条 {{ shortTime(overview.meta.lastAt) }}
            </span>
          </div>
          <div class="db-hero__desc" v-else>
            连续天数、漏签与奖励明细 · 数据来自 Cloudtide Waves-plugin 签到计划（每日 {{ wFixedTime }} 触发）
            <span v-if="wOverview.meta.lastAt" class="db-hero__time">
              · 最近一条 {{ shortTime(wOverview.meta.lastAt) }}
            </span>
          </div>
        </div>
        <div class="db-hero__side">
          <GSegmented
            v-model="scope"
            :options="[
              { value: 'mys', label: '游戏签到' },
              { value: 'waves', label: '鸣潮签到' },
            ]"
            label="签到数据源"
            @update:model-value="switchScope"
          />
          <GSegmented
            :model-value="days"
            :options="[
              { value: 7, label: '7 天' },
              { value: 14, label: '14 天' },
              { value: 30, label: '30 天' },
            ]"
            label="统计区间"
            @update:model-value="setDays($event as number)"
          />
          <Button size="small" :loading="scope === 'mys' ? loading : wLoading" @click="refresh">刷新</Button>
          <Button v-if="scope === 'mys'" size="small" class="sign-issue-btn" @click="openIssues">
            账号体检
            <span v-if="issueBadge" class="sign-issue-btn__badge">{{ issueBadge }}</span>
          </Button>
        </div>
      </section>

      <!-- ============================ 指标卡 ============================ -->
      <section class="db-kpi db-kpi--6">
        <template v-if="scope === 'mys' ? booting : wBooting">
          <div v-for="i in 6" :key="i" class="gm-skeleton" style="height: 108px" />
        </template>
        <template v-else-if="scope === 'mys'">
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
        <template v-else>
          <div v-for="c in wavesCards" :key="c.key" class="db-kpi__card">
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

      <!-- ============================ 趋势 + 今日游戏 / 最近流水 ============================ -->
      <section class="db-grid db-grid--8-4">
        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('chart')" :size="13" /></i>
              每日签到趋势
            </div>
            <div class="gm-panel__extra">
              <span class="db-dot" :style="{ background: primary }" />签到人次
              <span class="db-dot" :style="{ background: secondary, marginLeft: 10 }" />成功
              <span class="db-dot" :style="{ background: '#E0664A', marginLeft: 10 }" />失败
            </div>
          </div>
          <div v-show="!activeBooting && activeTrend.length" ref="trendRef" class="db-chart" />
          <div v-if="activeBooting" class="gm-skeleton db-chart" />
          <GEmpty
            v-if="!activeBooting && !activeTrend.length"
            :title="scope === 'mys' ? '暂无签到数据' : '暂无鸣潮签到归档'"
            :desc="scope === 'mys' ? '抓到一次签到后就会出现趋势' : 'Cloudtide Waves-plugin 执行一次计划签到后生成'"
          />
        </div>

        <!-- 游戏签到：今日各游戏完成度 -->
        <div v-if="scope === 'mys'" class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('trophy')" :size="13" /></i>
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

        <!-- 鸣潮签到：最近流水 -->
        <div v-else class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('list')" :size="13" /></i>
              最近签到流水
            </div>
            <span class="gm-panel__extra">{{ wOverview.today?.date || '—' }}</span>
          </div>
          <div v-if="wOverview.recent.length" class="ws-recent">
            <div v-for="(r, i) in wOverview.recent" :key="i" class="ws-recent__row">
              <span class="ws-recent__dot" :class="r.done ? (r.ok ? 'is-ok' : 'is-fail') : 'is-wait'" />
              <div class="ws-recent__main">
                <div class="ws-recent__name">
                  {{ r.name || r.qq }}
                  <em>{{ r.date.slice(5) }} {{ r.time.slice(11, 16) }}</em>
                </div>
                <div class="ws-recent__sub" :title="r.ok ? r.rewardText : r.msg">
                  {{ r.done ? (r.ok ? r.rewardText || '签到成功' : r.msg) : '待执行' }}
                </div>
              </div>
              <span class="ws-recent__days" v-if="r.done && r.ok">{{ r.sigInNum }}<em>d</em></span>
            </div>
          </div>
          <GEmpty v-else-if="!wBooting" title="暂无流水" desc="计划签到执行后生成" />
        </div>
      </section>

      <!-- ============================ 每日汇总 ============================ -->
      <div class="g-card">
        <div class="gm-panel__head">
          <div class="gm-panel__title">
            <i><Icon :icon="$gm('calendar-check')" :size="13" /></i>
            每日签到汇总
          </div>
          <span class="gm-panel__extra">点「明细」查看当天每个账号的签到结果</span>
        </div>
        <Table
          :row-key="scope === 'mys' ? 'date' : 'date'"
          size="middle"
          :columns="scope === 'mys' ? dayColumns : waveDayColumns"
          :data-source="scope === 'mys' ? dailyRows : waveDailyRows"
          :pagination="false"
          :loading="scope === 'mys' ? booting : wBooting"
          :scroll="{ x: scope === 'mys' ? 860 : 940 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'date'">
              <span class="sign-date">{{ record.date }}</span>
              <span
                v-if="record.date === (scope === 'mys' ? overview.today?.date : wOverview.today?.date)"
                class="gm-chip"
                style="margin-left: 6px"
                >今天</span
              >
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
            <template v-else-if="column.key === 'maxSigIn'">
              {{ record.maxSigIn }} 天
            </template>
            <template v-else-if="column.key === 'omission'">
              <span :class="record.omission ? 'sign-fail' : 'g-muted'">{{ record.omission }}</span>
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
            <i><Icon :icon="$gm('list')" :size="13" /></i>
            签到流水
            <span class="gm-panel__extra" style="margin-left: 8px">共 {{ scope === 'mys' ? pager.total : wPager.total }} 条</span>
          </div>
          <div class="toolbar">
            <GSearch
              :model-value="scope === 'mys' ? query.q : wQuery.q"
              :placeholder="scope === 'mys' ? '搜索账号 / 内容' : '搜索账号 / 角色 / 奖励'"
              width="200px"
              @search="search"
              @update:model-value="(v: string) => (scope === 'mys' ? (query.q = v) : (wQuery.q = v))"
            />
            <GSelect
              :model-value="scope === 'mys' ? query.ok : wQuery.ok"
              width="120px"
              :options="okOptions"
              placeholder="结果"
              @change="search"
              @update:model-value="(v: any) => (scope === 'mys' ? (query.ok = v) : (wQuery.ok = v))"
            />
            <GSelect
              v-if="scope === 'mys'"
              v-model="query.game"
              width="160px"
              :options="gameOptions"
              placeholder="游戏"
              @change="search"
            />
            <Button type="primary" @click="search">查询</Button>
            <Button :loading="exporting" :disabled="!(scope === 'mys' ? pager.total : wPager.total)" @click="exportCsv">导出 CSV</Button>
          </div>
        </div>

        <Table
          :row-key="scope === 'mys' ? (r: any) => `${r.time}|${r.qq}|${r.profileId}` : (r: any) => `${r.date}|${r.time}|${r.qq}`"
          size="middle"
          :columns="scope === 'mys' ? recordColumns : waveRecordColumns"
          :data-source="scope === 'mys' ? records : wRecords"
          :loading="scope === 'mys' ? loading : wLoading"
          :pagination="scope === 'mys' ? pagination : wavePagination"
          :scroll="{ x: scope === 'mys' ? 980 : 960 }"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <!-- 游戏签到 -->
            <template v-if="scope === 'mys'">
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

            <!-- 鸣潮签到 -->
            <template v-else>
              <template v-if="column.key === 'time'">
                <div class="sign-date">{{ record.time }}</div>
                <div class="g-muted">{{ record.date }}</div>
              </template>
              <template v-else-if="column.key === 'account'">
                <div class="sign-user">{{ record.name || record.qq }}</div>
                <div class="g-muted mono">{{ record.roleId || record.qq }}</div>
              </template>
              <template v-else-if="column.key === 'result'">
                <span class="gm-chip" :class="record.ok ? 'sign-chip--ok' : 'sign-chip--fail'">
                  {{ record.ok ? '成功' : '失败' }}
                </span>
              </template>
              <template v-else-if="column.key === 'sigInNum'">
                <span class="sign-num">{{ record.sigInNum || '—' }}<small v-if="record.sigInNum" class="g-muted"> 天</small></span>
              </template>
              <template v-else-if="column.key === 'omission'">
                <span :class="record.omission ? 'sign-fail' : 'g-muted'">{{ record.omission }}</span>
              </template>
              <template v-else-if="column.key === 'rewards'">
                <span class="ws-reward" :title="record.rewardText">{{ record.rewardText || '—' }}</span>
              </template>
              <template v-else-if="column.key === 'action'">
                <Button type="link" size="small" @click="openRecord(record)">查看</Button>
              </template>
            </template>
          </template>
        </Table>
      </div>

      <div v-if="scope === 'mys' && !booting && !overview.available" class="g-card db-tip">
        <Icon :icon="$gm('info')" :size="16" />
        <div>
          <b>没有找到签到流水</b>
          <div class="g-muted">
            数据来自荷花签到插件：
            <span class="mono">Lotus-Plugin/data/audit/checkin.jsonl</span>，执行一次签到后即会生成。
          </div>
        </div>
      </div>
      <div v-if="scope === 'waves' && !wBooting && !wOverview.available" class="g-card db-tip">
        <Icon :icon="$gm('info')" :size="16" />
        <div>
          <b>没有找到鸣潮签到归档</b>
          <div class="g-muted">
            数据来自 Cloudtide Waves-plugin 签到计划：
            <span class="mono">Cloudtide Waves-plugin/data/schedules/YYYY-MM-DD.json</span>，计划执行一次后即会生成。
          </div>
        </div>
      </div>
    </div>

    <!-- ============================ 某天明细弹窗 ============================ -->
    <GModal v-model:visible="dayDrawer.visible" eyebrow="SIGN DETAIL" title="签到明细" :subtitle="dayDrawer.date" size="xl" body-height="62vh">
      <!-- 游戏签到 -->
      <template v-if="scope === 'mys' && dayData">
        <div class="dm-tabs">
          <GSegmented
            v-model="dayTab"
            :options="[
              { value: 'overview', label: '当日概览' },
              { value: 'accounts', label: '账号明细', count: dayAccounts.length },
              { value: 'fail', label: '失败原因', count: dayData.reasonAccounts || 0 },
            ]"
            label="签到数据视图"
          />
        </div>

        <template v-if="dayTab === 'overview'">
          <div class="dm-stats dm-stats--panel">
            <div v-for="s in dayStats" :key="s.label" class="dm-stat">
              <div class="dm-stat__label">{{ s.label }}</div>
              <div class="dm-stat__value" :class="s.cls">{{ s.value }}</div>
            </div>
          </div>

          <div class="dm-block">
            <div class="dm-block__head"><span class="dm-block__title">各游戏签到人数</span></div>
            <div class="sign-games">
              <div v-for="g in dayGames" :key="g.key" class="sign-game">
                <div class="sign-game__top">
                  <span class="sign-game__name"><i :style="{ background: g.color }" />{{ g.label }}</span>
                  <span class="sign-game__val">
                    <b>{{ g.signed }}</b>
                    <em>已签 · 成功率 {{ g.rate }}%</em>
                    <span v-if="g.unbound" class="sign-game__unbound">未绑 {{ g.unbound }}</span>
                  </span>
                </div>
                <div class="sign-game__track">
                  <div class="sign-game__fill" :style="{ width: `${g.rate}%`, background: g.color }" />
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 账号粒度：一个微信号绑几个米游社账号就出几行 -->
        <template v-else-if="dayTab === 'accounts'">
          <div class="sign-daybar">
            <GSegmented
              v-model="dayAccountFilter"
              :options="[
                { value: 'all', label: '全部', count: dayAccounts.length },
                { value: 'fail', label: '仅失败', count: dayData.failAccounts || 0 },
                { value: 'ok', label: '仅成功', count: dayAccounts.length - (dayData.failAccounts || 0) },
                { value: 'unbound', label: '有未绑', count: dayAccounts.filter((a) => a.unboundGames.length).length },
              ]"
              size="sm"
              label="账号筛选"
            />
            <span v-if="(dayData.multiAccountUsers || 0) > 0" class="dm-hint">
              {{ dayData.multiAccountUsers }} 个微信号绑了多个米游社账号，已拆开统计
            </span>
          </div>
          <Table
            row-key="__key"
            size="small"
            :columns="dayAccountColumns"
            :data-source="dayAccountRows"
            :pagination="{ pageSize: 15, size: 'small' }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'account'">
                <div class="sign-user">
                  <span class="sign-acct-no">#{{ record.accountNo }}</span>
                  {{ record.name || userName(record.qq) }}
                </div>
                <div class="g-muted mono">{{ record.qq }}</div>
                <div class="sign-acct-meta">
                  <span v-if="record.days">连续 {{ record.days }} 天</span>
                  <span v-if="record.coins != null">米游币 {{ thousands(record.coins) }}</span>
                </div>
              </template>
              <template v-else-if="column.key === 'result'">
                <span class="gm-chip" :class="record.fail ? 'sign-chip--fail' : 'sign-chip--ok'">
                  {{ record.fail ? '失败' : '成功' }}
                </span>
                <span v-if="record.count > 1" class="sign-acct-ratio">{{ record.ok }}/{{ record.count }}</span>
                <span v-if="record.unboundGames.length" class="sign-acct-unbound" :title="record.unboundLabels.join('、')">
                  未绑 {{ record.unboundGames.length }}
                </span>
              </template>
              <template v-else-if="column.key === 'games'">
                <div class="sign-tags">
                  <span v-for="k in record.signedGames" :key="k" class="sign-tag is-signed">
                    {{ gameShort(k) }}<em v-if="record.games[k]">{{ record.games[k] }}d</em>
                  </span>
                  <span v-if="!record.signedGames.length" class="g-muted">—</span>
                </div>
              </template>
              <template v-else-if="column.key === 'reasons'">
                <div v-if="!record.failReasons.length" class="g-muted">—</div>
                <div v-else class="sign-reasons">
                  <div
                    v-for="(r, i) in record.failReasons"
                    :key="i"
                    class="sign-reason"
                    :class="`is-${r.kind}`"
                  >
                    <span class="sign-reason__tag">{{ r.label }}</span>
                    <span class="sign-reason__text" :title="r.reason">{{ r.reason }}</span>
                  </div>
                </div>
              </template>
            </template>
          </Table>
        </template>

        <!-- 失败原因聚合：按原因文案归类，便于一眼看出是 CK 掉了还是没绑角色 -->
        <template v-else>
          <div v-if="!dayFailGroups.length" class="sign-empty">当天没有失败记录</div>
          <div v-else class="sign-failgroups">
            <div v-for="(g, i) in dayFailGroups" :key="i" class="sign-failgroup">
              <div class="sign-failgroup__top">
                <span class="sign-failgroup__tag" :class="`is-${g.kind}`">{{ g.label }}</span>
                <span class="sign-failgroup__reason">{{ g.reason }}</span>
                <span class="sign-failgroup__count">{{ g.accounts.length }} 个账号</span>
              </div>
              <div class="sign-failgroup__who">
                <span v-for="a in g.accounts" :key="a.__key" class="sign-failgroup__chip">
                  {{ a.name || userName(a.qq) }} <em>#{{ a.accountNo }}</em>
                </span>
              </div>
            </div>
          </div>
        </template>
      </template>

      <!-- 鸣潮签到 -->
      <template v-else-if="scope === 'waves' && waveDayData">
        <div class="dm-stats dm-stats--panel">
          <div v-for="s in waveDayStats" :key="s.label" class="dm-stat">
            <div class="dm-stat__label">{{ s.label }}</div>
            <div class="dm-stat__value" :class="s.cls">{{ s.value }}</div>
          </div>
        </div>

        <div class="dm-block">
          <div class="dm-block__head"><span class="dm-block__title">账号明细</span></div>
          <Table
            row-key="qq"
            size="small"
            class="sign-fix-table"
            :columns="waveDayUserColumns"
            :data-source="waveDayData.userList"
            :pagination="{ pageSize: 12, size: 'small' }"
            :scroll="{ x: 862 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'account'">
                <div class="sign-user">{{ record.name || record.qq }}</div>
                <div class="g-muted mono">{{ record.roleId || record.qq }}</div>
              </template>
              <template v-else-if="column.key === 'result'">
                <span class="gm-chip" :class="record.ok ? 'sign-chip--ok' : 'sign-chip--fail'">
                  {{ record.ok ? '成功' : '失败' }}
                </span>
              </template>
              <template v-else-if="column.key === 'sigInNum'">
                {{ record.sigInNum || '—' }}
              </template>
              <template v-else-if="column.key === 'omission'">
                <span :class="record.omission ? 'sign-fail' : 'g-muted'">{{ record.omission }}</span>
              </template>
              <template v-else-if="column.key === 'rewards'">
                <span class="ws-reward" :title="record.rewards">{{ record.rewards || '—' }}</span>
              </template>
              <template v-else-if="column.key === 'msg'">
                <span class="ws-reward" :title="record.msg">{{ record.ok ? '—' : record.msg }}</span>
              </template>
            </template>
          </Table>
        </div>
      </template>
      <div v-else class="gm-skeleton" style="height: 240px" />
      <template #footer>
        <Button @click="dayDrawer.visible = false">关闭</Button>
      </template>
    </GModal>

    <!-- ======================== 账号体检 / 异常清理 ======================== -->
    <GModal
      v-model:visible="issueModal.visible"
      eyebrow="ACCOUNT HEALTH"
      title="账号体检与清理"
      :subtitle="issueModal.subtitle"
      size="xl"
      body-height="62vh"
    >
      <div class="dm-tabs">
        <GSegmented v-model="issueTab" :options="issueTabs" label="异常类型" @update:model-value="resetIssueSel" />
      </div>

      <div v-if="issuesLoading" class="gm-skeleton" style="height: 260px" />

      <template v-else>
        <!-- 1. CK 失效 -->
        <template v-if="issueTab === 'expired'">
          <div class="sign-issue-hint">
            CK / Cookie 已失效的米游社账号 —— 这类账号每次签到必然失败，且不会自己恢复。
            清理前会整行备份到后台库，可在审计日志里追溯。
          </div>
          <Table
            v-if="issues.expired.length"
            row-key="ltuid"
            size="small"
            :columns="expiredColumns"
            :data-source="issues.expired"
            :row-selection="{ selectedRowKeys: selKeys, onChange: onSelChange }"
            :pagination="{ pageSize: 10, size: 'small' }"
            :scroll="{ x: 860 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'ltuid'">
                <div class="sign-user mono">{{ record.ltuid }}</div>
                <div v-if="!record.exists" class="g-muted">主库已无此行</div>
              </template>
              <template v-else-if="column.key === 'uidCount'">
                {{ record.uidCount || 0 }}
              </template>
              <template v-else-if="column.key === 'games'">
                <div class="sign-tags">
                  <span v-for="g in record.games" :key="g" class="sign-tag is-signed">{{ g }}</span>
                  <span v-if="!record.games.length" class="g-muted">无绑定</span>
                </div>
              </template>
              <template v-else-if="column.key === 'binds'">
                <div v-if="!record.bindIds.length" class="g-muted">无人绑定</div>
                <div v-else class="sign-binds">
                  <span v-for="(id, i) in record.bindIds" :key="id" class="sign-bind">
                    {{ record.bindNames[i] || id }}
                  </span>
                </div>
              </template>
              <template v-else-if="column.key === 'checkedAt'">
                <span class="g-muted">{{ record.checkedAt ? shortTime(record.checkedAt) : '—' }}</span>
              </template>
            </template>
          </Table>
          <div v-else class="sign-empty">没有 CK 失效的账号，状态很好</div>
        </template>

        <!-- 2. 无效用户 -->
        <template v-else-if="issueTab === 'orphan'">
          <div class="sign-issue-hint">
            微信号层面没有可用绑定 —— 完全没绑过 / 绑的米游社账号都已被删 / 部分绑定已悬空。
            清理只删 <code>Users</code> 这一行，不会动共用的米游社账号。
          </div>
          <Table
            v-if="issues.orphan.length"
            row-key="id"
            size="small"
            :columns="orphanColumns"
            :data-source="issues.orphan"
            :row-selection="{ selectedRowKeys: selKeys, onChange: onSelChange }"
            :pagination="{ pageSize: 10, size: 'small' }"
            :scroll="{ x: 820 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'id'">
                <div class="sign-user">{{ record.name || '未命名' }}</div>
                <div class="g-muted mono">{{ record.id }}</div>
              </template>
              <template v-else-if="column.key === 'kind'">
                <span class="sign-badge" :class="`is-${record.kind}`">
                  {{ record.kind === 'empty' ? '无绑定' : record.kind === 'dangling' ? '全部失效' : '部分失效' }}
                </span>
              </template>
              <template v-else-if="column.key === 'ltuids'">
                <span v-if="!record.ltuids.length" class="g-muted">—</span>
                <span v-else class="mono g-muted">{{ record.ltuids.join(', ') }}</span>
              </template>
              <template v-else-if="column.key === 'reason'">
                <span class="sign-issue-reason">{{ record.reason }}</span>
              </template>
            </template>
          </Table>
          <div v-else class="sign-empty">没有无效用户</div>
        </template>

        <!-- 3. 长期失败（只读） -->
        <template v-else>
          <div class="sign-issue-hint">
            近 {{ issues.days }} 天签到次数里出现过失败的账号。<b>仅作展示、不支持自动清理</b> ——
            失败可能只是临时风控、游戏维护或角色还没绑到该账号，删了会误伤。
          </div>
          <Table
            v-if="issues.stale.length"
            row-key="__key"
            size="small"
            :columns="staleColumns"
            :data-source="staleRows"
            :pagination="{ pageSize: 10, size: 'small' }"
            :scroll="{ x: 860 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'account'">
                <div class="sign-user">
                  <span class="sign-acct-no">#{{ record.profileId }}</span>
                  {{ record.name || userName(record.qq) }}
                </div>
                <div class="g-muted mono">{{ record.qq }}</div>
              </template>
              <template v-else-if="column.key === 'stat'">
                <span class="gm-chip" :class="record.allFail ? 'sign-chip--fail' : 'sign-chip--ok'">
                  {{ record.ok }}/{{ record.total }}
                </span>
                <span v-if="record.allFail" class="sign-acct-ratio is-fail">全失败</span>
              </template>
              <template v-else-if="column.key === 'reasons'">
                <div class="sign-reasons">
                  <div v-for="(r, i) in record.reasons" :key="i" class="sign-reason is-failed">
                    <span class="sign-reason__text" :title="r">{{ r }}</span>
                  </div>
                </div>
              </template>
              <template v-else-if="column.key === 'lastAt'">
                <span class="g-muted">{{ record.lastAt ? shortTime(record.lastAt) : '—' }}</span>
              </template>
            </template>
          </Table>
          <div v-else class="sign-empty">近 {{ issues.days }} 天没有失败账号</div>
        </template>
      </template>

      <template #footer>
        <span class="sign-issue-foot">
          <template v-if="issueTab !== 'stale'">已选 <b>{{ selKeys.length }}</b> 项 · </template>
          <template v-if="issueTab === 'expired'">共 {{ issues.counts.expired }} 个失效 CK</template>
          <template v-else-if="issueTab === 'orphan'">共 {{ issues.counts.orphan }} 个无效用户</template>
          <template v-else>共 {{ issues.counts.stale }} 个失败账号（只读）</template>
        </span>
        <Button size="small" :loading="issuesLoading" @click="loadIssues">重新体检</Button>
        <Button @click="issueModal.visible = false">关闭</Button>
        <Button
          v-if="issueTab !== 'stale'"
          danger
          :loading="cleaning"
          :disabled="!selKeys.length"
          @click="askClean"
        >
          {{ issueTab === 'expired' ? '清除选中失效账号' : '清除选中无效用户' }}
        </Button>
      </template>
    </GModal>

    <!-- 清理确认 -->
    <GConfirmModal
      v-model:visible="cleanModal.visible"
      :title="issueTab === 'expired' ? '删除失效账号' : '删除无效用户'"
      :content="cleanModal.content"
      :hint="issueTab === 'expired'
        ? '删除前会整行备份到后台库，可在审计日志里追溯；Bot 侧绑定关系同步清理。'
        : '只删 Users 表里这一行和各游戏缓存，不会删除共用的米游社账号。'"
      danger
      :loading="cleaning"
      :ok-text="issueTab === 'expired' ? '确认删除账号' : '确认删除用户'"
      @ok="doClean"
    />

    <!-- 单条流水详情 -->
    <Modal
      v-model:visible="recordModal.visible"
      title="签到记录详情"
      :width="640"
      :footer="null"
    >
      <template v-if="scope === 'mys'">
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
      </template>
      <template v-else>
        <Descriptions :column="2" size="small" bordered>
          <DescriptionsItem label="日期">{{ recordModal.model.date }}</DescriptionsItem>
          <DescriptionsItem label="触发时刻">{{ recordModal.model.time }}</DescriptionsItem>
          <DescriptionsItem label="角色">{{ recordModal.model.name || '—' }}</DescriptionsItem>
          <DescriptionsItem label="结果">{{ recordModal.model.result }}</DescriptionsItem>
          <DescriptionsItem label="累计签到">{{ recordModal.model.sigInNum ? `${recordModal.model.sigInNum} 天` : '—' }}</DescriptionsItem>
          <DescriptionsItem label="漏签">{{ recordModal.model.omission }} 次</DescriptionsItem>
          <DescriptionsItem label="奖励" :span="2">{{ recordModal.model.rewards || '—' }}</DescriptionsItem>
        </Descriptions>
        <div v-if="recordModal.model.msg" class="record-raw">
          <div class="record-raw__title">失败原因</div>
          <pre class="record-raw__body">{{ recordModal.model.msg }}</pre>
        </div>
      </template>
    </Modal>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, nextTick, onMounted, reactive, ref, unref, watch } from 'vue';
  import {
    Button,
    Descriptions,
    Modal,
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
  import GSearch from '../_shared/form/GSearch.vue';
  import GSelect from '../_shared/form/GSelect.vue';
  import GSegmented from '../_shared/form/GSegmented.vue';
  import GModal from '../_shared/dialog/GModal.vue';
  import GConfirmModal from '../_shared/dialog/GConfirmModal.vue';
  import type { SignDay, SignIssues, SignOverview, SignRecord, WavesDay, WavesOverview } from './api';
  import { signApi, wavesApi } from './api';
  import { downloadCsv } from '/@/utils/export/csv';
  import { gm } from '/@/design/gmIcons';
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

  /* ------------------------------ 数据源切换（游戏 / 鸣潮） ------------------------------ */

  const scope = ref<'mys' | 'waves'>('mys');
  const wBooting = ref(true);
  const wLoading = ref(false);
  const wOverview = ref<WavesOverview>({
    available: false,
    meta: { available: false },
    today: null,
    trend: [],
    recent: [],
  });
  const wRecords = ref<any[]>([]);
  const wPager = reactive({ page: 1, size: 20, total: 0 });
  const wQuery = reactive<{ q: string; ok: '' | 'ok' | 'fail' }>({ q: '', ok: '' });

  const activeBooting = computed(() => (scope.value === 'mys' ? booting.value : wBooting.value));
  const activeTrend = computed<any[]>(() => (scope.value === 'mys' ? overview.value.trend : wOverview.value.trend));
  const wFixedTime = computed(() => wOverview.value.meta?.fixedTime || '00:15');

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
        icon: gm('success'),
        value: t ? thousands(t.total) : '—',
        unit: t ? '次' : '',
        foot: `${t?.users ?? 0} 个账号 / ${t?.accounts ?? 0} 个 uid`,
        color: p.blue[0],
        color2: p.blue[1],
      },
      {
        key: 'ok',
        label: '今日成功',
        icon: gm('success'),
        value: t ? thousands(t.ok) : '—',
        unit: t ? '次' : '',
        foot: `成功率 ${t?.rate ?? 0}%`,
        color: p.green[0],
        color2: p.green[1],
      },
      {
        key: 'fail',
        label: '今日失败',
        icon: gm('error'),
        value: t ? thousands(t.fail) : '—',
        unit: t ? '次' : '',
        foot: t && t.fail ? '需要检查 CK 或绑定' : '全部成功',
        color: p.rose[0],
        color2: p.rose[1],
      },
      {
        key: 'users',
        label: '覆盖账号',
        icon: gm('users'),
        value: t ? thousands(t.users) : '—',
        unit: t ? '人' : '',
        foot: `历史累计 ${s?.users ?? 0} 人`,
        color: p.violet[0],
        color2: p.violet[1],
      },
      {
        key: 'coin',
        label: '人均米游币',
        icon: gm('heart'),
        value: t ? fmtNum(t.coinAvg) : '—',
        foot: t ? `今日合计 ${fmtNum(t.coinTotal)}` : '未解析到米游币',
        color: p.amber[0],
        color2: p.amber[1],
      },
      {
        key: 'days',
        label: '最长连续',
        icon: gm('fire'),
        value: t?.maxDays ?? '—',
        unit: t?.maxDays ? '天' : '',
        foot: `近 ${days.value} 天平均成功率 ${s?.avgOkRate ?? 0}%`,
        color: p.cyan[0],
        color2: p.cyan[1],
      },
    ];
  });

  /* ------------------------------ 鸣潮指标卡 ------------------------------ */

  const wavesCards = computed(() => {
    const p = kpiPalette(isDark.value);
    const t = wOverview.value.today;
    const s = wOverview.value.summary;
    return [
      {
        key: 'total',
        label: '今日签到人次',
        icon: gm('success'),
        value: t ? thousands(t.total) : '—',
        unit: t ? '次' : '',
        foot: `${t?.users ?? 0} 个账号`,
        color: p.blue[0],
        color2: p.blue[1],
      },
      {
        key: 'ok',
        label: '今日成功',
        icon: gm('success'),
        value: t ? thousands(t.ok) : '—',
        unit: t ? '次' : '',
        foot: `成功率 ${t?.rate ?? 0}%`,
        color: p.green[0],
        color2: p.green[1],
      },
      {
        key: 'fail',
        label: '今日失败',
        icon: gm('error'),
        value: t ? thousands(t.fail) : '—',
        unit: t ? '次' : '',
        foot: t && t.fail ? '多为 token 失效，需重新绑定' : '全部成功',
        color: p.rose[0],
        color2: p.rose[1],
      },
      {
        key: 'users',
        label: '覆盖账号',
        icon: gm('users'),
        value: t ? thousands(t.users) : '—',
        unit: t ? '人' : '',
        foot: `历史累计 ${s?.users ?? 0} 人`,
        color: p.violet[0],
        color2: p.violet[1],
      },
      {
        key: 'sig',
        label: '最长累计签到',
        icon: gm('fire'),
        value: t?.maxSigIn ?? '—',
        unit: t?.maxSigIn ? '天' : '',
        foot: `近 ${days.value} 天平均成功率 ${s?.avgOkRate ?? 0}%`,
        color: p.cyan[0],
        color2: p.cyan[1],
      },
      {
        key: 'omission',
        label: '漏签次数',
        icon: gm('warning'),
        value: t ? thousands(t.omission) : '—',
        unit: t ? '次' : '',
        foot: t && t.omission ? '存在断签，注意补签' : '无人漏签',
        color: p.amber[0],
        color2: p.amber[1],
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

  /* 鸣潮：每日汇总 / 流水列 */
  const waveDailyRows = computed(() =>
    wOverview.value.trend
      .slice()
      .reverse()
      .map((t) => ({
        ...t,
        rate: t.total ? Math.round((t.ok / t.total) * 1000) / 10 : 0,
      })),
  );

  const waveDayColumns = [
    { title: '日期', key: 'date', width: 150, fixed: 'left' as const },
    { title: '签到人次', key: 'total', width: 100 },
    { title: '成功', key: 'ok', width: 84 },
    { title: '失败', key: 'fail', width: 84 },
    { title: '覆盖人数', key: 'users', width: 100 },
    { title: '成功率', key: 'rate', width: 160 },
    { title: '最长累计', key: 'maxSigIn', width: 96 },
    { title: '漏签', key: 'omission', width: 80 },
    { title: '操作', key: 'action', width: 80, fixed: 'right' as const },
  ];

  const waveRecordColumns = [
    { title: '时间', key: 'time', width: 110, fixed: 'left' as const },
    { title: '账号', key: 'account', width: 180 },
    { title: '结果', key: 'result', width: 90 },
    { title: '累计签到', key: 'sigInNum', width: 100 },
    { title: '漏签', key: 'omission', width: 80 },
    { title: '奖励', key: 'rewards', width: 260 },
    { title: '操作', key: 'action', width: 80, fixed: 'right' as const },
  ];

  const waveDayUserColumns = [
    { title: '账号', key: 'account', width: 170 },
    { title: '结果', key: 'result', width: 92 },
    { title: '累计签到', key: 'sigInNum', width: 104 },
    { title: '漏签', key: 'omission', width: 72 },
    { title: '奖励', key: 'rewards', width: 190 },
    { title: '失败原因', key: 'msg', width: 280 },
  ];

  const wavePagination = computed(() => ({
    current: wPager.page,
    pageSize: wPager.size,
    total: wPager.total,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (t: number) => `共 ${t} 条`,
  }));

  const dayAccountColumns = [
    { title: '账号', key: 'account', width: 178 },
    { title: '结果', key: 'result', width: 104 },
    { title: '已签游戏', key: 'games', width: 136 },
    { title: '失败原因', key: 'reasons' },
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
    const trend = activeTrend.value;
    if (!trendRef.value || !trend.length) {
      return;
    }
    const base = chartBase(isDark.value);
    trendChart.setOptions({
      grid: { top: 18, right: 18, bottom: 26, left: 40 },
      tooltip: { ...base.tooltip, trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: trend.map((t) => t.date.slice(5)),
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
          data: trend.map((t) => t.total),
          lineStyle: { width: 2.4, color: primary.value },
          itemStyle: { color: primary.value },
          areaStyle: { color: areaGradient(trendChart.echarts, primary.value, 0.24) },
        },
        {
          name: '成功',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: trend.map((t) => t.ok),
          lineStyle: { width: 2.2, color: secondary.value },
          itemStyle: { color: secondary.value },
          areaStyle: { color: areaGradient(trendChart.echarts, secondary.value, 0.14) },
        },
        {
          name: '失败',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: trend.map((t) => t.fail),
          lineStyle: { width: 1.8, color: '#E0664A' },
          itemStyle: { color: '#E0664A' },
        },
      ],
    });
  }

  watch(isDark, () => nextTick(renderTrend));
  watch(scope, () => nextTick(renderTrend));

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

  async function loadWaves() {
    wLoading.value = true;
    try {
      const [ov] = await Promise.all([wavesApi.getOverview(days.value), loadWaveRecords()]);
      wOverview.value = ov;
      await nextTick();
      renderTrend();
    } catch (e: any) {
      message.error(e?.message || '加载鸣潮签到数据失败');
    } finally {
      wLoading.value = false;
      wBooting.value = false;
    }
  }

  async function loadWaveRecords() {
    try {
      const res = await wavesApi.getRecords({
        q: wQuery.q || undefined,
        ok: wQuery.ok || undefined,
        page: wPager.page,
        size: wPager.size,
      });
      wRecords.value = res?.list ?? [];
      wPager.total = res?.total ?? 0;
    } catch {
      wRecords.value = [];
      wPager.total = 0;
    }
  }

  function refresh() {
    if (scope.value === 'mys') {
      loadAll();
    } else {
      loadWaves();
    }
  }

  function switchScope(v: any) {
    scope.value = v === 'waves' ? 'waves' : 'mys';
    if (scope.value === 'waves' && wBooting.value) {
      loadWaves();
    } else {
      nextTick(renderTrend);
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
    if (scope.value === 'mys') {
      pager.page = 1;
      loadRecords();
    } else {
      wPager.page = 1;
      loadWaveRecords();
    }
  }

  function setDays(d: number) {
    days.value = d;
    if (scope.value === 'mys') {
      loadAll();
    } else {
      loadWaves();
    }
  }

  function handleTableChange(pag: any) {
    if (scope.value === 'mys') {
      pager.page = pag?.current ?? 1;
      pager.size = pag?.pageSize ?? 20;
      loadRecords();
    } else {
      wPager.page = pag?.current ?? 1;
      wPager.size = pag?.pageSize ?? 20;
      loadWaveRecords();
    }
  }

  /* ------------------------------ 导出 CSV（按当前筛选，分页拉全量，上限 5000） ------------------------------ */

  const exporting = ref(false);
  const EXPORT_PAGE = 200;
  const EXPORT_CAP = 5000;

  async function fetchAllRecords() {
    const rows: any[] = [];
    if (scope.value === 'mys') {
      for (let page = 1; rows.length < EXPORT_CAP; page++) {
        const res: any = await signApi.getRecords({
          q: query.q || undefined,
          ok: query.ok || undefined,
          game: query.game || undefined,
          page,
          size: EXPORT_PAGE,
        });
        const list = res?.list ?? [];
        rows.push(...list);
        const total = res?.total ?? 0;
        if (!list.length || rows.length >= total) break;
      }
    } else {
      for (let page = 1; rows.length < EXPORT_CAP; page++) {
        const res: any = await wavesApi.getRecords({
          q: wQuery.q || undefined,
          ok: wQuery.ok || undefined,
          page,
          size: EXPORT_PAGE,
        });
        const list = res?.list ?? [];
        rows.push(...list);
        const total = res?.total ?? 0;
        if (!list.length || rows.length >= total) break;
      }
    }
    return rows.slice(0, EXPORT_CAP);
  }

  async function exportCsv() {
    if (exporting.value) return;
    exporting.value = true;
    try {
      const rows = await fetchAllRecords();
      if (!rows.length) {
        message.warning('当前筛选条件下没有可导出的记录');
        return;
      }
      if (scope.value === 'mys') {
        downloadCsv(
          `sign-mys-${new Date().toISOString().slice(0, 10)}`,
          [
            { title: '时间', key: 'time' },
            { title: 'QQ', key: 'qq' },
            { title: '账号', format: (r: any) => userName(r.qq) },
            { title: '结果', format: (r: any) => (r.ok ? '成功' : '失败') },
            { title: '来源', key: 'source' },
            {
              title: '游戏状态',
              format: (r: any) =>
                (r.games ?? [])
                  .map((g: any) => `${gameShort(g.key)}=${g.status}${g.days ? `(${g.days}d)` : ''}`)
                  .join(' '),
            },
            { title: '米游币', format: (r: any) => r.coins?.current ?? '' },
          ],
          rows,
        );
      } else {
        downloadCsv(
          `sign-waves-${new Date().toISOString().slice(0, 10)}`,
          [
            { title: '日期', key: 'date' },
            { title: '时间', key: 'time' },
            { title: 'QQ', key: 'qq' },
            { title: '账号', key: 'name' },
            { title: '角色ID', key: 'roleId' },
            { title: '结果', format: (r: any) => (r.ok ? '成功' : r.done === false ? '未签' : '失败') },
            { title: '累计签到', key: 'sigInNum' },
            { title: '漏签', key: 'omission' },
            { title: '奖励', key: 'rewardText' },
            { title: '失败原因', key: 'msg' },
          ],
          rows,
        );
      }
      message.success(`已导出 ${rows.length} 条${rows.length >= EXPORT_CAP ? '（已达上限，建议缩小筛选范围）' : ''}`);
    } catch (e: any) {
      message.error(e?.message || '导出失败');
    } finally {
      exporting.value = false;
    }
  }

  /* ------------------------ 账号体检 / 异常清理 ------------------------ */

  const issueModal = reactive({ visible: false, subtitle: '' });
  const issueTab = ref<'expired' | 'orphan' | 'stale'>('expired');
  const issuesLoading = ref(false);
  const cleaning = ref(false);
  const selKeys = ref<(string | number)[]>([]);
  const issues = ref<SignIssues>({
    generatedAt: '',
    days: 7,
    expired: [],
    orphan: [],
    stale: [],
    counts: { expired: 0, orphan: 0, stale: 0, orphanEmpty: 0, orphanDangling: 0, staleAllFail: 0 },
  });

  const issueTabs = computed(() => [
    { value: 'expired', label: 'CK 失效', count: issues.value.counts.expired },
    { value: 'orphan', label: '无效用户', count: issues.value.counts.orphan },
    { value: 'stale', label: '长期失败', count: issues.value.counts.stale },
  ]);

  /** 需要处理的（可直接清理的）数量，用于页头角标 */
  const issueBadge = computed(() => (issues.value.counts.expired || 0) + (issues.value.counts.orphan || 0));

  const expiredColumns = [
    { title: '米游社账号', key: 'ltuid', width: 170 },
    { title: 'UID 数', key: 'uidCount', width: 84 },
    { title: '游戏', key: 'games', width: 240 },
    { title: '绑定微信', key: 'binds', width: 220 },
    { title: '失效检测', key: 'checkedAt', width: 140 },
  ];

  const orphanColumns = [
    { title: '微信号', key: 'id', width: 210 },
    { title: '类型', key: 'kind', width: 100 },
    { title: '绑定 ltuid', key: 'ltuids', width: 200 },
    { title: '说明', key: 'reason' },
  ];

  const staleColumns = [
    { title: '账号', key: 'account', width: 200 },
    { title: '成功 / 次数', key: 'stat', width: 150 },
    { title: '最近失败原因', key: 'reasons' },
    { title: '最近一次', key: 'lastAt', width: 120 },
  ];

  const staleRows = computed(() =>
    issues.value.stale.map((s, i) => ({ ...s, __key: `${s.qq}|${s.profileId}|${i}` })),
  );

  async function loadIssues() {
    issuesLoading.value = true;
    try {
      issues.value = await signApi.getIssues(7);
    } catch (e: any) {
      message.error(e?.message || '体检数据加载失败');
    } finally {
      issuesLoading.value = false;
    }
  }

  async function openIssues() {
    issueModal.visible = true;
    resetIssueSel();
    await loadIssues();
  }

  function resetIssueSel() {
    selKeys.value = [];
  }

  function onSelChange(keys: (string | number)[]) {
    selKeys.value = keys;
  }

  const cleanModal = reactive({ visible: false, content: '' });

  function askClean() {
    const n = selKeys.value.length;
    if (!n) {
      message.warning('请先勾选要清理的项');
      return;
    }
    cleanModal.content =
      issueTab.value === 'expired'
        ? `将删除 ${n} 个 CK 已失效的米游社账号，其在各游戏下的 UID 记录会一并清理。`
        : `将删除 ${n} 个无效微信号（Users 行 + 游戏缓存），共用的米游社账号不受影响。`;
    cleanModal.visible = true;
  }

  async function doClean() {
    if (!selKeys.value.length) {
      return;
    }
    cleaning.value = true;
    try {
      const res = await signApi.cleanIssues({
        scope: issueTab.value,
        ids: selKeys.value.map(String),
        confirm: true,
      });
      if (res.skipped) {
        message.info(res.message || '该类型不支持清理');
      } else {
        const bad = res.failed?.length || 0;
        if (bad) {
          message.warning(`已清理 ${res.deleted || 0} 项，${bad} 项失败`);
        } else {
          message.success(`已清理 ${res.deleted || 0} 项`);
        }
      }
      cleanModal.visible = false;
      resetIssueSel();
      await Promise.all([loadIssues(), loadAll()]);
    } catch (e: any) {
      message.error(e?.message || '清理失败');
    } finally {
      cleaning.value = false;
    }
  }

  /* ------------------------------ 某天明细 ------------------------------ */

  const dayDrawer = reactive({ visible: false, date: '' });
  const dayData = ref<SignDay | null>(null);
  const dayTab = ref('overview');

  async function openDay(date: string) {
    dayDrawer.visible = true;
    dayDrawer.date = date;
    dayTab.value = 'overview';
    dayAccountFilter.value = 'all';
    if (scope.value === 'mys') {
      dayData.value = null;
      try {
        dayData.value = await signApi.getDay(date);
      } catch {
        dayData.value = null;
      }
    } else {
      waveDayData.value = null;
      try {
        waveDayData.value = await wavesApi.getDay(date);
      } catch {
        waveDayData.value = null;
      }
    }
  }

  const waveDayData = ref<WavesDay | null>(null);

  const waveDayStats = computed(() => {
    const d = waveDayData.value;
    if (!d) {
      return [];
    }
    return [
      { label: '签到人次', value: d.total },
      { label: '成功', value: d.ok, cls: 'is-ok' },
      { label: '失败', value: d.fail, cls: d.fail ? 'is-fail' : '' },
      { label: '覆盖人数', value: d.users },
      { label: '成功率', value: `${d.rate}%`, cls: 'is-ok' },
      { label: '漏签合计', value: d.omission, cls: d.omission ? 'is-fail' : '' },
    ];
  });

  const dayStats = computed(() => {
    const d = dayData.value;
    if (!d) {
      return [];
    }
    return [
      { label: '签到人次', value: d.total },
      { label: '成功', value: d.ok, cls: 'is-ok' },
      { label: '失败', value: d.fail, cls: d.fail ? 'is-fail' : '' },
      { label: '覆盖人数', value: d.users },
      { label: '成功率', value: `${d.rate}%`, cls: 'is-ok' },
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
        unbound: st.unbound,
        rate: base ? Math.round((st.signed / base) * 100) : 0,
      };
    });
  });

  /* -------------------- 账号明细（每个米游社账号一行） -------------------- */

  const dayAccountFilter = ref<'all' | 'fail' | 'ok' | 'unbound'>('all');

  const dayAccounts = computed(() => {
    const list = dayData.value?.accountList || [];
    return list.map((a, i) => ({ ...a, __key: `${a.qq}|${a.profileId}|${i}` }));
  });

  const dayAccountRows = computed(() => {
    if (dayAccountFilter.value === 'fail') {
      // 只算真正签到失败；「没绑某游戏」在行内单独提示，不混进失败
      return dayAccounts.value.filter((a) => a.fail > 0);
    }
    if (dayAccountFilter.value === 'ok') {
      return dayAccounts.value.filter((a) => a.fail === 0);
    }
    if (dayAccountFilter.value === 'unbound') {
      return dayAccounts.value.filter((a) => a.unboundGames.length > 0);
    }
    return dayAccounts.value;
  });

  /** 失败原因聚合：同一条文案归一组，列出涉及账号 */
  const dayFailGroups = computed(() => {
    const map = new Map<string, { label: string; kind: string; reason: string; accounts: any[] }>();
    for (const a of dayAccounts.value) {
      for (const r of a.failReasons || []) {
        const key = `${r.kind}|${r.label}|${r.reason}`;
        const g = map.get(key) || { label: r.label, kind: r.kind, reason: r.reason, accounts: [] };
        if (!g.accounts.some((x) => x.__key === a.__key)) {
          g.accounts.push(a);
        }
        map.set(key, g);
      }
    }
    return [...map.values()].sort((x, y) => y.accounts.length - x.accounts.length);
  });

  /* ------------------------------ 单条详情 ------------------------------ */

  const recordModal = reactive({
    visible: false,
    model: {} as Record<string, any>,
  });

  function openRecord(r: any) {
    if (scope.value === 'mys') {
      recordModal.model = {
        time: r.time.replace('T', ' ').slice(0, 19),
        qqName: `${userName(r.qq)}（${r.qq}）`,
        result: r.ok ? '成功' : `失败（${r.stage || 'unknown'}）`,
        source: r.source,
        games: r.games.map((g) => `${g.key}:${g.status}${g.days ? `/${g.days}天` : ''}`).join('  ') || '—',
        message: r.message,
      };
    } else {
      recordModal.model = {
        date: r.date,
        time: r.time,
        name: r.name,
        result: r.done ? (r.ok ? '成功' : '失败') : '待执行',
        sigInNum: r.sigInNum,
        omission: r.omission,
        rewards: r.rewardText,
        msg: r.msg,
      };
    }
    recordModal.visible = true;
  }

  onMounted(async () => {
    await loadAll();
    loadNames();
    loadIssues();
  });
</script>

<style scoped lang="less">

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

  /* 鸣潮：最近流水 / 奖励 */
  .ws-recent {
    display: flex;
    flex-direction: column;
  }

  .ws-recent__row {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 8px 0;

    & + .ws-recent__row {
      border-top: 1px dashed var(--g-card-border);
    }
  }

  .ws-recent__dot {
    flex-shrink: 0;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--g-track);

    &.is-ok {
      background: var(--g-green);
      box-shadow: 0 0 0 3px rgb(69 185 124 / 16%);
    }

    &.is-fail {
      background: #e0664a;
      box-shadow: 0 0 0 3px rgb(224 102 74 / 16%);
    }
  }

  .ws-recent__main {
    flex: 1 1 auto;
    min-width: 0;
  }

  .ws-recent__name {
    display: flex;
    gap: 8px;
    align-items: baseline;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--g-text);

    em {
      font-size: 10.5px;
      font-weight: 400;
      font-style: normal;
      color: var(--g-text-mute);
      font-variant-numeric: tabular-nums;
    }
  }

  .ws-recent__sub {
    overflow: hidden;
    margin-top: 1px;
    font-size: 11px;
    color: var(--g-text-mute);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ws-recent__days {
    flex-shrink: 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--g-green);
    font-variant-numeric: tabular-nums;

    em {
      margin-left: 1px;
      font-size: 10px;
      font-style: normal;
      font-weight: 400;
    }
  }

  .ws-reward {
    display: inline-block;
    overflow: hidden;
    max-width: 100%;
    font-size: 12px;
    color: var(--g-text-sub);
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: bottom;
  }

  /* antd v3 scroll.x 仍是 table-layout:auto，长内容会把窄列挤扁 —— 弹窗小表强制固定布局 */
  .sign-fix-table {
    :deep(table) {
      table-layout: fixed !important;
    }
  }

  /* 抽屉 */
  .dm-tabs {
    display: flex;
    margin-bottom: 14px;
  }

  @import '../_shared/dialog/dm.less';

  .dm-stats {
    margin-bottom: 16px;
  }

  .dm-block {
    margin-bottom: 18px;
  }

  .dm-stat__value.is-ok {
    color: var(--g-green);
  }

  .dm-stat__value.is-fail {
    color: #e0664a;
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

  /* ---------------- 账号明细（按米游社账号拆分） ---------------- */

  .sign-daybar {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .sign-acct-no {
    display: inline-block;
    min-width: 26px;
    margin-right: 4px;
    padding: 0 5px;
    font-size: 10.5px;
    font-weight: 700;
    line-height: 16px;
    color: var(--g-blue);
    text-align: center;
    background: rgb(64 132 224 / 12%);
    border-radius: 5px;
  }

  .sign-acct-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    margin-top: 3px;
    font-size: 10.5px;
    color: var(--g-text-mute);
    font-variant-numeric: tabular-nums;
  }

  .sign-acct-ratio {
    margin-left: 6px;
    font-size: 11px;
    color: var(--g-text-mute);
    font-variant-numeric: tabular-nums;
  }

  .sign-acct-unbound {
    display: inline-block;
    margin-left: 6px;
    padding: 0 5px;
    font-size: 10px;
    line-height: 15px;
    color: var(--g-text-sub);
    background: var(--g-card-border);
    border-radius: 5px;
  }

  .sign-acct-ratio.is-fail {
    color: #e0664a;
    font-weight: 600;
  }

  .sign-reasons {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .sign-reason {
    display: flex;
    gap: 6px;
    align-items: baseline;
    font-size: 11.5px;
    line-height: 1.5;
  }

  .sign-reason__tag {
    flex: 0 0 auto;
    padding: 0 5px;
    font-size: 10.5px;
    line-height: 15px;
    color: var(--g-text-sub);
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 5px;
  }

  .sign-reason__text {
    overflow: hidden;
    color: var(--g-text-mute);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sign-reason.is-failed .sign-reason__text {
    color: #e0664a;
  }

  .sign-reason.is-unbound .sign-reason__text {
    color: var(--g-text-mute);
  }

  .sign-reason.is-record .sign-reason__text {
    color: #d99b3a;
  }

  /* ---------------- 失败原因聚合 ---------------- */

  .sign-failgroups {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sign-failgroup {
    padding: 10px 12px;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 12px;
  }

  .sign-failgroup__top {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: baseline;
  }

  .sign-failgroup__tag {
    padding: 0 6px;
    font-size: 10.5px;
    font-weight: 700;
    line-height: 17px;
    border-radius: 5px;
  }

  .sign-failgroup__tag.is-failed {
    color: #e0664a;
    background: rgb(224 102 74 / 12%);
  }

  .sign-failgroup__tag.is-unbound {
    color: var(--g-text-sub);
    background: var(--g-card-border);
  }

  .sign-failgroup__tag.is-record {
    color: #d99b3a;
    background: rgb(217 155 58 / 14%);
  }

  .sign-failgroup__reason {
    flex: 1 1 200px;
    min-width: 0;
    font-size: 12.5px;
    color: var(--g-text);
  }

  .sign-failgroup__count {
    font-size: 11.5px;
    color: var(--g-text-mute);
    font-variant-numeric: tabular-nums;
  }

  .sign-failgroup__who {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 7px;
  }

  .sign-failgroup__chip {
    padding: 1px 7px;
    font-size: 11px;
    color: var(--g-text-sub);
    background: var(--g-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 20px;
  }

  .sign-failgroup__chip em {
    font-style: normal;
    color: var(--g-text-mute);
  }

  /* ---------------- 账号体检弹窗 ---------------- */

  .sign-issue-btn {
    position: relative;
  }

  .sign-issue-btn__badge {
    display: inline-block;
    min-width: 16px;
    margin-left: 5px;
    padding: 0 4px;
    font-size: 10px;
    font-weight: 700;
    line-height: 16px;
    color: #fff;
    text-align: center;
    background: #e0664a;
    border-radius: 9px;
  }

  .sign-issue-hint {
    margin-bottom: 10px;
    padding: 9px 12px;
    font-size: 12px;
    line-height: 1.65;
    color: var(--g-text-sub);
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 10px;
  }

  .sign-issue-hint code {
    padding: 0 4px;
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 11px;
    background: var(--g-bg);
    border-radius: 4px;
  }

  .sign-issue-reason {
    font-size: 12px;
    color: var(--g-text-sub);
  }

  .sign-issue-foot {
    margin-right: auto;
    font-size: 12px;
    color: var(--g-text-mute);
  }

  .sign-issue-foot b {
    color: var(--g-text);
    font-variant-numeric: tabular-nums;
  }

  .sign-badge {
    padding: 0 6px;
    font-size: 10.5px;
    font-weight: 700;
    line-height: 17px;
    border-radius: 5px;
  }

  .sign-badge.is-empty {
    color: var(--g-text-sub);
    background: var(--g-card-border);
  }

  .sign-badge.is-dangling {
    color: #e0664a;
    background: rgb(224 102 74 / 12%);
  }

  .sign-badge.is-partial {
    color: #d99b3a;
    background: rgb(217 155 58 / 14%);
  }

  .sign-binds {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .sign-bind {
    padding: 0 6px;
    font-size: 11px;
    line-height: 17px;
    color: var(--g-text-sub);
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 5px;
  }

  .sign-empty {
    padding: 44px 0;
    font-size: 12.5px;
    color: var(--g-text-mute);
    text-align: center;
    background: var(--g-card-bg-soft);
    border: 1px dashed var(--g-card-border);
    border-radius: 12px;
  }
</style>
