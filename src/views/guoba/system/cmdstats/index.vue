<template>
  <PageWrapper title="">
    <div class="db g-page cs2">
      <!-- ============================ 页头 ============================ -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">COMMAND STATS</div>
          <div class="db-hero__title">指令统计</div>
          <div class="db-hero__desc">
            谁在用哪些指令、哪个群最活跃——从运行日志里挖出来的真实使用数据
            <span v-if="data?.parsedDays?.length" class="db-hero__time">· 已解析 {{ data.parsedDays.length }} 天</span>
          </div>
        </div>
        <div class="db-hero__side">
          <GSegmented :model-value="days" :options="dayOptions" label="统计范围" @update:model-value="switchDays($event as any)" />
          <Button size="small" :loading="loading" @click="loadAll">刷新</Button>
        </div>
      </section>

      <!-- ============================ 概览 KPI ============================ -->
      <section class="db-kpi">
        <div class="db-kpi__card">
          <div class="db-kpi__icon" style="background: linear-gradient(135deg, #4f9ee8, #1f55b6)">
            <Icon :icon="$gm('zap')" :size="19" />
          </div>
          <div class="db-kpi__body">
            <div class="db-kpi__label">指令执行</div>
            <div class="db-kpi__value">{{ thousands(data?.total ?? 0) }}<small>次</small></div>
            <div class="db-kpi__foot">最近 {{ data?.days ?? days }} 天</div>
          </div>
        </div>
        <div class="db-kpi__card">
          <div class="db-kpi__icon" style="background: linear-gradient(135deg, #8a7bf2, #4c39bd)">
            <Icon :icon="$gm('plugin-chart')" :size="19" />
          </div>
          <div class="db-kpi__body">
            <div class="db-kpi__label">指令种类</div>
            <div class="db-kpi__value">{{ data?.cmds?.length ?? 0 }}</div>
            <div class="db-kpi__foot">最热：{{ data?.cmds?.[0]?.name || '—' }}</div>
          </div>
        </div>
        <div class="db-kpi__card">
          <div class="db-kpi__icon" style="background: linear-gradient(135deg, #f0ae4e, #c06e13)">
            <Icon :icon="$gm('users')" :size="19" />
          </div>
          <div class="db-kpi__body">
            <div class="db-kpi__label">最活跃用户</div>
            <div class="db-kpi__value">{{ topUserNick }}</div>
            <div class="db-kpi__foot">{{ topUserCount }} 次</div>
          </div>
        </div>
      </section>

      <div v-if="data?.skippedDays?.length" class="cs2-note">
        有 {{ data.skippedDays.length }} 天日志缺失或无法读取（{{ data.skippedDays.slice(0, 3).join('、') }}…），统计范围可能偏小
      </div>

      <!-- ============================ 四个排行 ============================ -->
      <div class="cs2-grid">
        <section v-for="panel in panels" :key="panel.key" class="g-card cs2-panel">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm(panel.icon)" :size="13" /></i>
              {{ panel.title }}
            </div>
          </div>
          <div class="cs2-list">
            <div v-for="(row, i) in panel.rows" :key="i" class="cs2-row">
              <span class="cs2-rank" :class="{ 'is-top': i === 0 }">{{ i + 1 }}</span>
              <span class="cs2-name" :title="panel.nameOf(row)">{{ panel.nameOf(row) }}</span>
              <div class="cs2-bar">
                <i :style="{ width: barWidth(row.count, panel.rows) + '%' }" />
              </div>
              <span class="cs2-count">{{ thousands(row.count) }}</span>
            </div>
            <div v-if="!panel.rows.length" class="cs2-empty">范围内没有数据</div>
          </div>
        </section>
      </div>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { Button } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import { Icon } from '/@/components/Icon';
  import GSegmented from '../_shared/form/GSegmented.vue';
  import { cmdStatsApi, type CmdStatsResult } from './api';

  defineOptions({ name: 'CmdStats' });

  const data = ref<CmdStatsResult | null>(null);
  const days = ref<number>(7);
  const loading = ref(false);

  const dayOptions = [
    { value: 3, label: '3 天' },
    { value: 7, label: '7 天' },
    { value: 14, label: '14 天' },
  ];

  function switchDays(v: any) {
    days.value = Number(v) || 7;
    loadAll();
  }

  const topUserNick = computed(() => data.value?.users?.[0]?.nick || '—');
  const topUserCount = computed(() => data.value?.users?.[0]?.count ?? 0);

  const panels = computed(() => {
    const d = data.value;
    return [
      {
        key: 'cmds',
        title: '指令排行',
        icon: 'zap',
        rows: d?.cmds ?? [],
        nameOf: (r) => r.name,
      },
      {
        key: 'groups',
        title: '群排行',
        icon: 'users',
        rows: d?.groups ?? [],
        nameOf: (r) => r.name || r.gid,
      },
      {
        key: 'users',
        title: '用户排行',
        icon: 'user',
        rows: d?.users ?? [],
        nameOf: (r) => r.nick || r.uid,
      },
      {
        key: 'plugins',
        title: '插件排行',
        icon: 'puzzle',
        rows: d?.plugins ?? [],
        nameOf: (r) => r.name,
      },
    ];
  });

  function barWidth(count: number, rows: { count: number }[]) {
    const max = rows[0]?.count || 1;
    return Math.max(4, Math.round((count / max) * 100));
  }

  function thousands(n: number) {
    return String(n ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  async function loadAll() {
    loading.value = true;
    try {
      data.value = await cmdStatsApi.list(days.value);
    } catch {
      data.value = null;
    } finally {
      loading.value = false;
    }
  }

  onMounted(loadAll);
</script>

<style scoped lang="less">
  .cs2-note {
    padding: 8px 14px;
    margin-bottom: 14px;
    font-size: 11.5px;
    color: var(--g-text-mute);
    background: var(--g-chip-bg);
    border-radius: 8px;
  }

  .cs2-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;

    @media (max-width: 900px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .cs2-panel {
    min-width: 0;
  }

  .cs2-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px 16px;
    max-height: 420px;
    overflow-y: auto;
  }

  .cs2-row {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 4px 6px;
    border-radius: 6px;

    &:hover {
      background: var(--g-hover);
    }
  }

  .cs2-rank {
    flex-shrink: 0;
    width: 20px;
    font-family: var(--cs-mono, monospace);
    font-size: 11px;
    color: var(--g-text-mute);
    text-align: center;

    &.is-top {
      color: var(--g-gold);
      font-weight: 700;
    }
  }

  .cs2-name {
    flex-shrink: 0;
    width: 110px;
    overflow: hidden;
    font-size: 12px;
    color: var(--g-text);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cs2-bar {
    flex: 1;
    min-width: 0;
    height: 6px;
    background: var(--g-chip-bg);
    border-radius: 3px;

    i {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, var(--g-blue), var(--g-cyan));
      border-radius: 3px;
      transition: width 0.3s ease;
    }
  }

  .cs2-count {
    flex-shrink: 0;
    min-width: 44px;
    font-family: var(--cs-mono, monospace);
    font-size: 11.5px;
    color: var(--g-text-sub);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .cs2-empty {
    padding: 32px 0;
    color: var(--g-text-mute);
    font-size: 12.5px;
    text-align: center;
  }
</style>
