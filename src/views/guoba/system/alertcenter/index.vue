<template>
  <PageWrapper title="">
    <div class="db g-page ac">
      <!-- ============================ 页头 ============================ -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">ALERT CENTER</div>
          <div class="db-hero__title">告警中心</div>
          <div class="db-hero__desc">
            签到健康、插件装载、系统资源三类告警聚合一处，出问题不用翻页找
            <span v-if="checkedAt" class="db-hero__time">· 检查于 {{ fmtDateTime(checkedAt) }}</span>
          </div>
        </div>
        <div class="db-hero__side">
          <Button size="small" :loading="loading" @click="loadAll">重新检查</Button>
        </div>
      </section>

      <!-- ============================ 概览 KPI ============================ -->
      <section class="db-kpi">
        <div class="db-kpi__card">
          <div class="db-kpi__icon" style="background: linear-gradient(135deg, #ef6d8d, #b8325a)">
            <Icon :icon="$gm('error')" :size="19" />
          </div>
          <div class="db-kpi__body">
            <div class="db-kpi__label">严重告警</div>
            <div class="db-kpi__value">{{ result?.critical ?? 0 }}</div>
            <div class="db-kpi__foot">需要立即处理</div>
          </div>
        </div>
        <div class="db-kpi__card">
          <div class="db-kpi__icon" style="background: linear-gradient(135deg, #f0ae4e, #c06e13)">
            <Icon :icon="$gm('warning')" :size="19" />
          </div>
          <div class="db-kpi__body">
            <div class="db-kpi__label">警告</div>
            <div class="db-kpi__value">{{ result?.warn ?? 0 }}</div>
            <div class="db-kpi__foot">建议尽快关注</div>
          </div>
        </div>
        <div class="db-kpi__card">
          <div class="db-kpi__icon" style="background: linear-gradient(135deg, #57c483, #1a7a50)">
            <Icon :icon="$gm('success')" :size="19" />
          </div>
          <div class="db-kpi__body">
            <div class="db-kpi__label">整体状态</div>
            <div class="db-kpi__value">{{ (result?.critical ?? 0) + (result?.warn ?? 0) === 0 ? '正常' : '待处理' }}</div>
            <div class="db-kpi__foot">{{ result ? `检查耗时 ${result.costMs}ms` : '—' }}</div>
          </div>
        </div>
      </section>

      <!-- ============================ 告警列表 ============================ -->
      <section class="g-card">
        <div class="gm-panel__head">
          <div class="gm-panel__title">
            <i><Icon :icon="$gm('bell')" :size="13" /></i>
            告警清单
            <span class="gm-panel__extra" style="margin-left: 8px">严重在前</span>
          </div>
        </div>

        <div v-if="!alerts.length" class="ac-empty">
          <svg viewBox="0 0 48 48" width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.6">
            <path d="M24 6a13 13 0 0 1 13 13v8l3 6H8l3-6v-8A13 13 0 0 1 24 6z" stroke-linejoin="round" />
            <path d="M20 37a4 4 0 0 0 8 0" stroke-linecap="round" />
          </svg>
          <p>一切正常，没有待处理的告警</p>
          <p class="ac-empty__sub">签到、插件装载、系统资源都在健康范围内</p>
        </div>

        <div v-else class="ac-list">
          <div v-for="a in alerts" :key="a.key" class="ac-item" :class="a.level === 'bad' ? 'is-bad' : 'is-warn'">
            <span class="ac-item__level">{{ a.level === 'bad' ? '严重' : '警告' }}</span>
            <span class="ac-item__source">{{ a.source }}</span>
            <div class="ac-item__main">
              <div class="ac-item__title">{{ a.title }}</div>
              <div class="ac-item__detail">{{ a.detail }}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { Button } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import { Icon } from '/@/components/Icon';
  import { fmtDateTime } from '/@/utils/localTime';
  import { alertCenterApi, type AlertItem, type AlertListResult } from './api';

  defineOptions({ name: 'AlertCenter' });

  const result = ref<AlertListResult | null>(null);
  const loading = ref(false);

  const alerts = computed<AlertItem[]>(() => result.value?.alerts ?? []);
  const checkedAt = computed(() => result.value?.checkedAt ?? 0);

  async function loadAll() {
    loading.value = true;
    try {
      result.value = await alertCenterApi.list();
    } catch {
      result.value = null;
    } finally {
      loading.value = false;
    }
  }

  onMounted(loadAll);
</script>

<style scoped lang="less">
  .ac-empty {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
    justify-content: center;
    padding: 56px 16px;
    color: var(--g-text-mute);
    font-size: 13px;

    svg {
      opacity: 0.5;
      margin-bottom: 6px;
      color: var(--g-green);
    }

    &__sub {
      font-size: 11.5px;
      opacity: 0.7;
    }
  }

  .ac-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 16px;
  }

  .ac-item {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 12px 14px;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-left: 3px solid var(--g-card-border-strong);
    border-radius: 10px;

    &.is-bad {
      border-left-color: var(--g-rose);

      .ac-item__level {
        color: var(--g-rose);
        background: rgb(239 109 141 / 14%);
      }
    }

    &.is-warn {
      border-left-color: var(--g-amber);

      .ac-item__level {
        color: var(--g-amber);
        background: rgb(240 174 78 / 14%);
      }
    }

    &__level {
      flex-shrink: 0;
      padding: 1px 8px;
      border-radius: 4px;
      font-size: 10.5px;
      line-height: 17px;
      font-weight: 600;
    }

    &__source {
      flex-shrink: 0;
      padding: 1px 8px;
      border-radius: 4px;
      font-size: 10.5px;
      line-height: 17px;
      color: var(--g-text-mute);
      background: var(--g-chip-bg);
    }

    &__main {
      flex: 1;
      min-width: 0;
    }

    &__title {
      font-size: 13px;
      font-weight: 600;
      color: var(--g-text);
    }

    &__detail {
      margin-top: 3px;
      font-size: 11.5px;
      line-height: 1.6;
      color: var(--g-text-sub);
      word-break: break-word;
    }
  }
</style>
