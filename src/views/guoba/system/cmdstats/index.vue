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

      <!-- ============================ 每日趋势 ============================ -->
      <section class="g-card cs2-trend">
        <div class="gm-panel__head">
          <div class="gm-panel__title">
            <i><Icon :icon="$gm('chart-bar')" :size="13" /></i>
            每日趋势
          </div>
          <div v-if="trendBars.length" class="cs2-trend__meta">
            {{ data?.days ?? days }} 天共 {{ thousands(trendTotal) }} 次 · 日均 {{ trendAvg }}
          </div>
        </div>

        <div v-if="trendBars.length" class="cs2-trend__chart">
          <div v-for="bar in trendBars" :key="bar.date" class="cs2-trend__col" :title="bar.tip">
            <div class="cs2-trend__track">
              <div class="cs2-trend__bar" :style="{ height: bar.h + '%' }">
                <i
                  class="cs2-trend__fill"
                  :class="{ 'is-max': bar.isMax, 'is-zero': bar.total === 0 }"
                  :style="{ opacity: bar.op }"
                />
                <span class="cs2-trend__val">{{ bar.total }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="cs2-empty">这个范围内没有指令记录</div>

        <div v-if="trendBars.length" class="cs2-trend__axis">
          <span v-for="bar in trendBars" :key="bar.date" class="cs2-trend__date">
            <span class="cs2-trend__d-full">{{ bar.label }}</span>
            <span class="cs2-trend__d-short">{{ bar.short }}</span>
          </span>
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

  // ---- 每日趋势：高度归一 / 透明度 / 日均都在这里算好，模板只负责画 ----
  const trendTotal = computed(() => (data.value?.daily ?? []).reduce((sum, d) => sum + d.total, 0));

  const trendAvg = computed(() => {
    const list = data.value?.daily ?? [];
    const activeDays = list.filter((d) => d.total > 0).length;
    return activeDays ? Math.round(trendTotal.value / activeDays) : 0;
  });

  const trendBars = computed(() => {
    const list = data.value?.daily ?? [];
    const max = list.reduce((m, d) => Math.max(m, d.total), 0);
    // 没有 daily、或整段全是 0：交给模板走空态
    if (!list.length || max <= 0) return [];
    return list.map((d) => {
      const ratio = d.total / max;
      return {
        date: d.date,
        label: d.date.slice(5),
        short: d.date.slice(8),
        total: d.total,
        // 百分比高度，最高那天 = 100%；0 的那天交给 CSS 的 min-height 兜底
        h: Math.round(ratio * 1000) / 10,
        // 高的更实：0.55 → 1；无日志那天固定 0.9 让灰条看得清
        op: d.total === 0 ? 0.9 : Math.round((0.55 + 0.45 * ratio) * 100) / 100,
        isMax: d.total === max,
        tip:
          d.total === 0
            ? `${d.date} · 这天没有日志`
            : `${d.date} · ${d.total} 次 · ${d.cmds} 种指令 · ${d.groups} 个群 · ${d.users} 人`,
      };
    });
  });

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

  /* ---------------------------- 每日趋势（纯 CSS 柱状图） ---------------------------- */
  .cs2-trend__meta {
    flex: none;
    font-family: var(--cs-mono, monospace);
    font-size: 11.5px;
    color: var(--g-text-sub);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .cs2-trend__chart {
    display: flex;
    gap: 6px;
    height: 120px;
    padding: 10px 8px 0;
    background: var(--g-card-bg-soft);
    border-bottom: 1px solid var(--g-row-sep);
    border-radius: 10px;
    box-sizing: border-box;
  }

  /* 每列均分：天数再多也不撑破卡片 */
  .cs2-trend__col {
    display: flex;
    flex: 1 1 0;
    min-width: 0;
    height: 100%;
  }

  .cs2-trend__track {
    display: flex;
    flex: 1 1 auto;
    align-items: flex-end;
    justify-content: center;
    width: 100%;
    height: 100%;
    min-height: 0;
    padding-top: 20px; // 给 hover 数值留出头上的空间
    box-sizing: border-box;
  }

  .cs2-trend__bar {
    position: relative;
    display: block;
    width: 100%;
    max-width: 44px;
    min-height: 3px;
  }

  .cs2-trend__fill {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 3px;
    background: var(--g-blue);
    border-radius: 4px 4px 2px 2px;
    transition: filter 0.18s ease, opacity 0.18s ease;

    &.is-max {
      background: var(--g-gold);
    }

    &.is-zero {
      background: var(--g-text-mute);
    }
  }

  .cs2-trend__col:hover .cs2-trend__fill {
    filter: brightness(1.12);
  }

  /* 平时不显示数字，hover 整列才出来 */
  .cs2-trend__val {
    position: absolute;
    bottom: calc(100% + 4px);
    left: 50%;
    font-family: var(--cs-mono, monospace);
    font-size: 10.5px;
    color: var(--g-text-sub);
    white-space: nowrap;
    opacity: 0;
    transform: translateX(-50%);
    transition: opacity 0.16s ease;
    pointer-events: none;
  }

  .cs2-trend__col:hover .cs2-trend__val {
    opacity: 1;
  }

  .cs2-trend__axis {
    display: flex;
    gap: 6px;
    padding: 0 8px; // 与柱状图左右内边距一致，列才能对齐
    margin-top: 7px;
  }

  .cs2-trend__date {
    flex: 1 1 0;
    min-width: 0;
    overflow: hidden;
    font-family: var(--cs-mono, monospace);
    font-size: 10.5px;
    color: var(--g-text-mute);
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .cs2-trend__d-short {
    display: none;
  }

  @media (max-width: 480px) {
    .cs2-trend__d-full {
      display: none;
    }

    .cs2-trend__d-short {
      display: inline;
    }

    .cs2-trend__meta {
      font-size: 11px;
    }
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
