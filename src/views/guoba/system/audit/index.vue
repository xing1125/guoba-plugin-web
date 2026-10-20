<template>
  <PageWrapper title="">
    <div class="db g-page">
      <!-- 页头 -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">AUDIT TRAIL</div>
          <div class="db-hero__title">审计日志</div>
          <div class="db-hero__desc">全部写操作留痕 · 操作人取自登录态，高危操作单独标红</div>
        </div>
        <div class="db-hero__side">
          <Button size="small" :loading="loading" @click="loadAll">刷新</Button>
        </div>
      </section>

      <!-- 概览 -->
      <section class="db-kpi db-kpi--3">
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

      <!-- 列表 -->
      <GTablePage
        v-model:page="page"
        v-model:page-size="size"
        title="操作记录"
        :icon="$gm('clipboard')"
        :columns="columns"
        :data-source="rows"
        :total="total"
        :loading="loading"
        row-key="id"
        csv-name="audit-log"
        :csv-columns="csvColumns"
        empty-title="暂无审计记录"
        empty-desc="执行任意写操作后，这里会出现对应的操作留痕"
        @search="load"
        @refresh="loadAll"
      >
        <template #filters>
          <GSearch v-model="q.actor" size="small" width="130px" placeholder="操作人" @search="page = 1; load()" />
          <GSelect v-model="q.action" size="small" width="190px" :options="actionOptions" @change="page = 1; load()" />
          <GSelect v-model="q.range" size="small" width="110px" :options="rangeOptions" @change="page = 1; load()" />
          <GSearch
            v-model="q.keyword"
            size="small"
            width="190px"
            placeholder="目标 / 详情关键词"
            @search="page = 1; load()"
          />
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'time'">
            <span class="au-time">{{ fmtTime(record.created_at) }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Tag :color="risky(record.action) ? 'red' : 'blue'">{{ record.action }}</Tag>
          </template>
          <template v-else-if="column.key === 'target'">
            <span class="au-target" :title="record.target">{{ record.target || '-' }}</span>
          </template>
          <template v-else-if="column.key === 'detail'">
            <span class="au-detail" :title="record.detail">{{ record.detail || '-' }}</span>
          </template>
          <template v-else>{{ record[column.dataIndex] ?? '-' }}</template>
        </template>
      </GTablePage>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue';
  import { Button, Tag } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import { Icon } from '/@/components/Icon';
  import { useMessage } from '/@/hooks/web/useMessage';
  import GTablePage from '../_shared/GTablePage.vue';
  import GSearch from '../_shared/form/GSearch.vue';
  import GSelect from '../_shared/form/GSelect.vue';
  import { auditApi, type AuditRow } from '../sys-users/api';
  import { gm } from '/@/design/gmIcons';

  defineOptions({ name: 'AuditLog' });

  const { createMessage: $message } = useMessage();

  const rows = ref<AuditRow[]>([]);
  const total = ref(0);
  const page = ref(1);
  const size = ref(20);
  const loading = ref(false);
  const stats = reactive({ total: 0, today: 0, risky: 0 });
  const actions = ref<{ action: string; c: number }[]>([]);

  const q = reactive({ actor: '', action: '', keyword: '', range: 7 as number | 0 });

  const rangeOptions = [
    { label: '最近 7 天', value: 7 },
    { label: '最近 30 天', value: 30 },
    { label: '全部时间', value: 0 },
  ];

  const actionOptions = computed(() => [
    { label: '全部动作', value: '' },
    ...actions.value.map((a) => ({ label: `${a.action}（${a.c}）`, value: a.action })),
  ]);

  const columns = [
    { title: '时间', key: 'time', width: 170 },
    { title: '操作人', dataIndex: 'actor', key: 'actor', width: 120 },
    { title: '动作', key: 'action', width: 170 },
    { title: '目标', key: 'target', width: 200 },
    { title: 'IP', dataIndex: 'ip', key: 'ip', width: 140 },
    { title: '详情', key: 'detail' },
  ];

  const csvColumns = [
    { title: '时间', key: 'created_at' },
    { title: '操作人', key: 'actor' },
    { title: '动作', key: 'action' },
    { title: '目标', key: 'target' },
    { title: 'IP', key: 'ip' },
    { title: '详情', key: 'detail' },
  ];

  const cards = computed(() => [
    {
      key: 'total',
      label: '累计写入',
      value: stats.total,
      unit: ' 条',
      foot: '全部历史操作留痕',
      icon: gm('database'),
      color: '#3b82f6',
      color2: '#22d3ee',
    },
    {
      key: 'today',
      label: '今日操作',
      value: stats.today,
      unit: ' 条',
      foot: '当天 00:00 起',
      icon: gm('clock'),
      color: '#8b5cf6',
      color2: '#6366f1',
    },
    {
      key: 'risky',
      label: '高危操作',
      value: stats.risky,
      unit: ' 条',
      foot: '删除 / 清理 / 退群 / 权限变更',
      icon: gm('warning'),
      color: '#ef4444',
      color2: '#f97316',
    },
  ]);

  function fmtTime(t?: string) {
    if (!t) return '-';
    return String(t).replace('T', ' ').replace('Z', '').slice(0, 19);
  }

  function risky(action: string): boolean {
    const a = String(action || '');
    return a.includes('delete') || a.includes('clear') || a.includes('quit') || a.includes('role');
  }

  function rangeTo() {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  function rangeFrom() {
    if (!q.range) return '';
    const d = new Date(Date.now() - q.range * 86400 * 1000);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T00:00:00`;
  }

  async function load() {
    loading.value = true;
    try {
      const res = await auditApi.getList({
        page: page.value,
        size: size.value,
        actor: q.actor,
        action: q.action,
        keyword: q.keyword,
        from: rangeFrom(),
        to: q.range ? rangeTo() : '',
      });
      rows.value = res?.list || [];
      total.value = res?.total || 0;
    } catch (e: any) {
      $message.error(e?.message || '加载审计日志失败');
    } finally {
      loading.value = false;
    }
  }

  async function loadStats() {
    try {
      const res = await auditApi.getStats();
      stats.total = res?.total || 0;
      stats.today = res?.today || 0;
      stats.risky = res?.risky || 0;
    } catch {
      /* 概览失败不阻断列表 */
    }
  }

  async function loadActions() {
    try {
      actions.value = (await auditApi.getActions()) || [];
    } catch {
      actions.value = [];
    }
  }

  async function loadAll() {
    await Promise.all([load(), loadStats(), loadActions()]);
  }

  onMounted(loadAll);
</script>

<style lang="less" scoped>
  .au-target,
  .au-detail {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: bottom;
  }

  .au-time {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11.5px;
    color: var(--g-text-sub);
  }

  .au-target {
    max-width: 190px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11.5px;
  }

  .au-detail {
    max-width: 380px;
    color: var(--g-text-sub);
  }
</style>
