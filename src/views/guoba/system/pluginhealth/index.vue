<template>
  <PageWrapper title="">
    <div class="db g-page ph">
      <!-- ============================ 页头 ============================ -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">PLUGIN HEALTH</div>
          <div class="db-hero__title">插件健康</div>
          <div class="db-hero__desc">
            磁盘上的插件哪些真的活着、各占了多少空间——「挂着但其实是死的」一眼看穿
            <span v-if="rows.length" class="db-hero__time">· 共 {{ rows.length }} 个插件</span>
          </div>
        </div>
        <div class="db-hero__side">
          <GSearch v-model="q" placeholder="搜索插件名" width="220px" @search="() => {}" />
          <Button size="small" :loading="loading" @click="loadAll">刷新</Button>
        </div>
      </section>

      <!-- ============================ 概览 KPI ============================ -->
      <section class="db-kpi">
        <div class="db-kpi__card">
          <div class="db-kpi__icon" style="background: linear-gradient(135deg, #57c483, #1a7a50)">
            <Icon :icon="$gm('dbcheck')" :size="19" />
          </div>
          <div class="db-kpi__body">
            <div class="db-kpi__label">已加载</div>
            <div class="db-kpi__value">{{ loadedCount }}</div>
            <div class="db-kpi__foot">出现在 Yunzai 插件加载器里</div>
          </div>
        </div>
        <div class="db-kpi__card">
          <div class="db-kpi__icon" style="background: linear-gradient(135deg, #ef6d8d, #b8325a)">
            <Icon :icon="$gm('pulse')" :size="19" />
          </div>
          <div class="db-kpi__body">
            <div class="db-kpi__label">未加载</div>
            <div class="db-kpi__value">{{ deadCount }}</div>
            <div class="db-kpi__foot">{{ deadCount ? '磁盘有文件但 Yunzai 没装载' : '全部插件都正常装载' }}</div>
          </div>
        </div>
        <div class="db-kpi__card">
          <div class="db-kpi__icon" style="background: linear-gradient(135deg, #4f9ee8, #1f55b6)">
            <Icon :icon="$gm('database')" :size="19" />
          </div>
          <div class="db-kpi__body">
            <div class="db-kpi__label">数据总量</div>
            <div class="db-kpi__value">{{ fmtBytes(totalBytes) }}</div>
            <div class="db-kpi__foot">排除 node_modules 与隐藏文件</div>
          </div>
        </div>
      </section>

      <!-- ============================ 未加载警示条 ============================ -->
      <div v-if="deadList.length" class="ph-warn">
        <Icon :icon="$gm('pulse')" :size="13" />
        <span>
          有 <b>{{ deadList.length }}</b> 个插件未被加载：
          {{ deadList.map((d) => d.name).join('、') }}
          ——多半是语法错误或加载超时，详情见「运行日志」
        </span>
      </div>

      <!-- ============================ 插件网格 ============================ -->
      <section class="g-card">
        <div class="gm-panel__head">
          <div class="gm-panel__title">
            <i><Icon :icon="$gm('plugin-list')" :size="13" /></i>
            插件列表
            <span class="gm-panel__extra" style="margin-left: 8px">已加载在前 · 按数据体积排序</span>
          </div>
        </div>
        <div class="ph-grid">
          <div v-for="p in filtered" :key="p.name" class="ph-card" :class="{ 'is-dead': !p.loaded }">
            <div class="ph-card__head">
              <span class="ph-card__name" :title="p.name">{{ p.name }}</span>
              <span class="ph-status" :class="p.loaded ? 'is-ok' : 'is-dead'">
                {{ p.loaded ? '已加载' : '未加载' }}
              </span>
            </div>
            <div class="ph-card__stats">
              <span><em>{{ p.classes }}</em> 插件类</span>
              <span><em>{{ p.appsCount }}</em> apps 文件</span>
              <span><em>{{ fmtBytes(p.dataBytes) }}</em></span>
            </div>
          </div>
          <div v-if="!filtered.length && !loading" class="ph-empty">没有匹配的插件</div>
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
  import GSearch from '../_shared/form/GSearch.vue';
  import { pluginHealthApi, type PluginHealthRow } from './api';

  defineOptions({ name: 'PluginHealth' });

  const rows = ref<PluginHealthRow[]>([]);
  const q = ref('');
  const loading = ref(false);

  const filtered = computed(() => {
    const kw = q.value.trim().toLowerCase();
    if (!kw) return rows.value;
    return rows.value.filter((r) => r.name.toLowerCase().includes(kw));
  });

  const loadedCount = computed(() => rows.value.filter((r) => r.loaded).length);
  const deadCount = computed(() => rows.value.filter((r) => !r.loaded).length);
  const deadList = computed(() => rows.value.filter((r) => !r.loaded));
  const totalBytes = computed(() => rows.value.reduce((s, r) => s + r.dataBytes, 0));

  function fmtBytes(n: number) {
    if (!n) return '0';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let v = Number(n) || 0;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return `${v >= 100 ? v.toFixed(0) : v.toFixed(1)} ${units[i]}`;
  }

  async function loadAll() {
    loading.value = true;
    try {
      rows.value = (await pluginHealthApi.list()) ?? [];
    } catch {
      rows.value = [];
    } finally {
      loading.value = false;
    }
  }

  onMounted(loadAll);
</script>

<style scoped lang="less">
  .ph-warn {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 10px 14px;
    margin-bottom: 14px;
    font-size: 12px;
    color: var(--g-amber);
    background: var(--g-gold-soft, rgb(168 129 63 / 10%));
    border: 1px solid rgb(217 164 65 / 30%);
    border-radius: 10px;

    b {
      font-weight: 650;
    }
  }

  .ph-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(0, 1fr));
    gap: 10px;
    padding: 14px 16px;

    @media (min-width: 900px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    @media (min-width: 1400px) {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  .ph-card {
    padding: 12px 14px;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 10px;
    transition: border-color 0.16s ease;

    &:hover {
      border-color: var(--g-card-border-strong);
    }

    &.is-dead {
      border-color: rgb(239 109 141 / 40%);
    }

    &__head {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
    }

    &__name {
      overflow: hidden;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--g-text);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__stats {
      display: flex;
      gap: 12px;
      margin-top: 8px;
      font-size: 10.5px;
      color: var(--g-text-mute);

      em {
        font-style: normal;
        font-weight: 650;
        color: var(--g-text-sub);
        font-variant-numeric: tabular-nums;
      }
    }
  }

  .ph-status {
    flex-shrink: 0;
    padding: 1px 7px;
    border-radius: 4px;
    font-size: 10px;
    line-height: 16px;

    &.is-ok {
      color: var(--g-green);
      background: rgb(69 185 124 / 14%);
    }

    &.is-dead {
      color: var(--g-rose);
      background: rgb(239 109 141 / 14%);
    }
  }

  .ph-empty {
    grid-column: 1 / -1;
    padding: 40px 0;
    color: var(--g-text-mute);
    font-size: 13px;
    text-align: center;
  }
</style>
