<template>
  <PageWrapper title="">
    <div class="db g-page">
      <!-- 页头 -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">PLUGIN DATA</div>
          <div class="db-hero__title">插件数据</div>
          <div class="db-hero__desc">
            Redis 命名空间占用、插件数据体量与游戏维度分布
            <span v-if="data?.scannedAt" class="db-hero__time">· 扫描于 {{ data.scannedAt.slice(11, 19) }}</span>
          </div>
        </div>
        <div class="db-hero__side">
          <Button :loading="loading" @click="load(true)">重新扫描</Button>
        </div>
      </section>

      <!-- 概览 -->
      <section class="db-kpi">
        <template v-if="!data && loading">
          <div v-for="i in 4" :key="i" class="gm-skeleton" style="height: 108px" />
        </template>
        <template v-else>
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
      </section>

      <!-- 占比 + 游戏分布 -->
      <Row :gutter="[14, 14]" class="g-section">
        <Col :xs="24" :xl="13">
          <div class="g-card">
            <div class="gm-panel__head">
              <div class="gm-panel__title">
                <i><Icon :icon="$gm('chart-bar')" :size="13" /></i>
                命名空间占用 TOP 8
              </div>
              <span class="gm-panel__extra">TOP 8 + 其他</span>
            </div>
            <div v-if="nsTop.length" class="ns-bars">
              <div v-for="(b, i) in nsTop" :key="b.ns" class="ns-bar">
                <div class="ns-bar__top">
                  <span class="ns-bar__no" :class="`is-${['gold', 'silver', 'bronze'][i] ?? 'plain'}`">{{ i + 1 }}</span>
                  <div class="ns-bar__name">
                    <b :title="`${b.label}（${b.owner}）`">{{ b.label }}</b>
                    <span class="g-mono">{{ b.ns }}</span>
                  </div>
                  <div class="ns-bar__val">
                    <b>{{ thousands(b.keys) }}</b>
                    <span>{{ b.ratio }}%</span>
                  </div>
                </div>
                <div class="ns-bar__track">
                  <i :style="{ width: nsPct(b.keys) }" />
                </div>
              </div>
              <div v-if="restCount > 0" class="ns-bar ns-bar--rest">
                <div class="ns-bar__top">
                  <span class="ns-bar__no">…</span>
                  <div class="ns-bar__name"><b>其他 {{ restN }} 个命名空间</b></div>
                  <div class="ns-bar__val"><b>{{ thousands(restCount) }}</b></div>
                </div>
                <div class="ns-bar__track"><i style="width: 100%; opacity: 0.28" /></div>
              </div>
            </div>
            <GEmpty v-else-if="!loading" title="暂无命名空间数据" desc="执行一次扫描后即可看到占比" />
          </div>
        </Col>

        <Col :xs="24" :xl="11">
          <div class="g-card">
            <div class="gm-panel__head">
              <div class="gm-panel__title">
                <i><Icon :icon="$gm('zap')" :size="13" /></i>
                游戏维度分布
              </div>
              <GSegmented
                :model-value="gameMode"
                :options="[
                  { value: 'cache', label: '接口缓存' },
                  { value: 'profile', label: '玩家档案' },
                ]"
                size="sm"
                label="游戏维度来源"
                @update:model-value="gameMode = $event as any"
              />
            </div>
            <div v-if="currentGames.length" class="game-bars">
              <div v-for="(g, i) in currentGames" :key="g.game" class="game-bar">
                <div class="game-bar__name">
                  <span class="g-legend__swatch" :style="{ background: palette[i % palette.length] }" />
                  {{ g.label }}
                </div>
                <div class="game-bar__track">
                  <div
                    class="game-bar__fill"
                    :style="{
                      width: `${(g.count / maxGameCount) * 100}%`,
                      background: palette[i % palette.length],
                    }"
                  />
                </div>
                <div class="game-bar__val">{{ thousands(g.count) }}</div>
              </div>
            </div>
            <GEmpty
              v-else-if="!loading"
              title="暂无游戏维度数据"
              desc="米游社查询缓存（Yz:cache / miao:profile）生成后，这里会按六款游戏展示分布"
            />
          </div>
        </Col>
      </Row>

      <!-- 命名空间卡片 -->
      <div class="g-card">
        <div class="gm-panel__head">
          <div class="gm-panel__title">
            <i><Icon :icon="$gm('database')" :size="13" /></i>
            命名空间明细
          </div>
          <div class="toolbar">
            <GSearch v-model="keyword" placeholder="搜索命名空间 / 插件名" width="200px" />
            <Checkbox v-model:checked="onlyKnown">只看已识别</Checkbox>
            <Button :loading="loading" @click="load(true)">重新扫描</Button>
          </div>
        </div>

        <div v-if="filtered.length" class="ns-grid">
          <div v-for="b in filtered" :key="b.ns" class="g-card g-card--hover ns-card">
            <div class="ns-card__top">
              <div class="ns-card__title">
                <span class="ns-card__name">{{ b.label }}</span>
                <span class="g-chip">{{ b.owner }}</span>
              </div>
              <div class="ns-card__keys">{{ thousands(b.keys) }}</div>
            </div>

            <div class="g-bar ns-card__bar">
              <div class="g-bar__inner" :style="{ width: barWidth(b) }" />
            </div>
            <div class="ns-card__meta">
              <span class="g-mono">{{ b.ns }}</span>
              <span class="g-muted">{{ b.ratio }}%</span>
            </div>

            <div v-if="b.desc" class="ns-card__desc">{{ b.desc }}</div>

            <div class="ns-card__types">
              <span v-for="(v, t) in b.types" :key="t" class="g-chip">{{ t }}</span>
              <span v-if="!b.known" class="g-chip" style="color: var(--g-amber)">未收录</span>
            </div>

            <div v-if="b.detail.length" class="ns-card__detail">
              <div v-for="d in b.detail.slice(0, 3)" :key="d.key" class="ns-detail">
                <span class="g-mono ns-detail__key">{{ d.key.split(':').slice(-1)[0] }}</span>
                <span class="g-muted">{{ thousands(d.count) }}</span>
              </div>
            </div>

            <div v-if="b.samples.length" class="g-sample" :title="b.samples.join('\n')">{{ b.samples[0] }}</div>
          </div>
        </div>
        <div v-else class="g-empty">没有匹配的命名空间</div>
      </div>

      <div v-if="!available && !loading" class="g-card db-tip">
        <InfoCircleOutlined class="tip__icon" />
        <div>
          <div class="g-strong">暂无插件数据</div>
          <div class="g-muted">
            请重启 Bot 使 <span class="g-mono">/api/admin/stats/plugins</span> 生效，并确认 Redis 可访问。
          </div>
        </div>
      </div>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, unref } from 'vue';
  import {
    Button,
    Checkbox,
    Col,
    Row,
  } from 'ant-design-vue';
  import { InfoCircleOutlined } from '@ant-design/icons-vue';
  import { PageWrapper } from '/@/components/Page';
  import { Icon } from '/@/components/Icon';
  import { useRootSetting } from '/@/hooks/setting/useRootSetting';
  import { ThemeEnum } from '/@/enums/appEnum';
  import GEmpty from '../_shared/GEmpty.vue';
  import GSearch from '../_shared/form/GSearch.vue';
  import GSegmented from '../_shared/form/GSegmented.vue';
  import type { GameSlice, HistogramResult, NsBucket } from '../_shared/stats';
  import { gm } from '/@/design/gmIcons';
  import {
    chartColors,
    fmtNum,
    kpiPalette,
    statsApi,
    thousands,
  } from '../_shared/stats';

  defineOptions({ name: 'PluginsData' });

  const { getDarkMode } = useRootSetting();
  const isDark = computed(() => unref(getDarkMode) === ThemeEnum.DARK);
  const palette = computed(() => chartColors(isDark.value));

  const loading = ref(false);
  const available = ref(true);
  const data = ref<HistogramResult | null>(null);
  const keyword = ref('');
  const onlyKnown = ref(false);
  const gameMode = ref<'cache' | 'profile'>('cache');
  const games = ref<{ cache: GameSlice[]; profile: GameSlice[] }>({ cache: [], profile: [] });

  const cards = computed(() => {
    const d = data.value;
    const top = d?.buckets?.[0];
    const p = kpiPalette(isDark.value);
    return [
      {
        key: 'keys',
        label: 'Redis 键总数',
        icon: gm('server'),
        value: thousands(d?.dbsize ?? 0),
        foot: d?.scannedAt ? `扫描于 ${d.scannedAt.slice(11, 19)}` : '等待扫描',
        color: p.blue[0],
        color2: p.blue[1],
      },
      {
        key: 'ns',
        label: '命名空间',
        icon: gm('lock'),
        value: thousands(d?.bucketCount ?? 0),
        unit: '个',
        foot: `已识别 ${d?.knownCount ?? 0} 个`,
        color: p.cyan[0],
        color2: p.cyan[1],
      },
      {
        key: 'top',
        label: '最大占用',
        icon: gm('chart-pie'),
        value: top ? `${top.ratio}%` : '—',
        foot: top ? `${top.label} · ${top.owner}` : '—',
        color: p.violet[0],
        color2: p.violet[1],
      },
      {
        key: 'scan',
        label: '已扫描键',
        icon: gm('search'),
        value: fmtNum(d?.totalKeys ?? 0),
        unit: '个',
        foot: 'SCAN 全量遍历',
        color: p.green[0],
        color2: p.green[1],
      },
    ];
  });

  const filtered = computed(() => {
    let list = data.value?.buckets ?? [];
    if (onlyKnown.value) list = list.filter((b) => b.known);
    const kw = keyword.value.trim().toLowerCase();
    if (kw) {
      list = list.filter(
        (b) =>
          b.ns.toLowerCase().includes(kw) ||
          b.label.toLowerCase().includes(kw) ||
          b.owner.toLowerCase().includes(kw),
      );
    }
    return list;
  });

  const currentGames = computed(() => (gameMode.value === 'cache' ? games.value.cache : games.value.profile));
  const maxGameCount = computed(() => Math.max(...currentGames.value.map((g) => g.count), 1));

  function barWidth(b: NsBucket) {
    const max = data.value?.buckets?.[0]?.keys || 1;
    return `${Math.max(1, (b.keys / max) * 100)}%`;
  }

  /* ------------------------------ 命名空间 TOP 榜 ------------------------------ */

  const nsBuckets = computed(() => data.value?.buckets ?? []);
  const nsTop = computed(() => nsBuckets.value.slice(0, 8));
  const restN = computed(() => Math.max(0, nsBuckets.value.length - 8));
  const restCount = computed(() => nsBuckets.value.slice(8).reduce((s, b) => s + b.keys, 0));

  function nsPct(keys: number) {
    const max = nsBuckets.value[0]?.keys || 1;
    return `${Math.max(3, (keys / max) * 100)}%`;
  }

  /* ------------------------------ 数据 ------------------------------ */

  async function load(force = false) {
    loading.value = true;
    try {
      const [hist, game] = await Promise.all([statsApi.getPlugins(force), statsApi.getGames()]);
      if (hist) {
        data.value = hist;
        available.value = hist.available;
      }
      if (game) games.value = { cache: game.cache ?? [], profile: game.profile ?? [] };
    } catch {
      available.value = false;
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => load(false));
</script>

<style scoped lang="less">


  .w-200 {
    width: 200px;
  }

  /* 命名空间 TOP 榜：信息行 + 通栏进度条 */
  .ns-bars {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding-top: 2px;
  }

  .ns-bar {
    padding: 7px 10px 9px;
    border-radius: 10px;
    transition: background 0.18s;
  }

  .ns-bar:hover {
    background: var(--g-hover);
  }

  .ns-bar--rest {
    opacity: 0.72;
  }

  .ns-bar__top {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 7px;
  }

  .ns-bar__no {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 21px;
    height: 21px;
    font-size: 11px;
    font-weight: 700;
    color: var(--g-text-mute);
    background: var(--g-chip-bg);
    border-radius: 7px;
  }

  .ns-bar__no.is-gold {
    color: #6b4d00;
    background: linear-gradient(135deg, #f5dd9a, #dcae4e);
    box-shadow: 0 3px 8px -3px rgb(220 174 78 / 55%);
  }

  .ns-bar__no.is-silver {
    color: #45535f;
    background: linear-gradient(135deg, #dfe7ee, #a9b9c6);
  }

  .ns-bar__no.is-bronze {
    color: #5e3a1c;
    background: linear-gradient(135deg, #eec9a8, #c98a58);
  }

  .ns-bar__name {
    display: flex;
    flex: 1 1 auto;
    gap: 8px;
    align-items: baseline;
    min-width: 0;
  }

  .ns-bar__name b {
    overflow: hidden;
    flex-shrink: 0;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--g-text);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ns-bar__name span {
    overflow: hidden;
    font-size: 10.5px;
    color: var(--g-text-mute);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ns-bar__val {
    display: flex;
    flex-shrink: 0;
    gap: 6px;
    align-items: baseline;
  }

  .ns-bar__val b {
    font-size: 13.5px;
    font-weight: 650;
    color: var(--g-text);
    font-variant-numeric: tabular-nums;
  }

  .ns-bar__val span {
    font-size: 11px;
    color: var(--g-text-mute);
    font-variant-numeric: tabular-nums;
  }

  .ns-bar__track {
    height: 9px;
    overflow: hidden;
    background: var(--g-track);
    border: 1px solid var(--g-card-border);
    border-radius: 5px;
  }

  .ns-bar__track i {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, var(--g-blue), var(--g-cyan));
    border-radius: 4px;
    transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }

  /* 前三名条身用徽标同色系，尾端一点亮 */
  .ns-bar:nth-child(1) .ns-bar__track i {
    background: linear-gradient(90deg, #dcae4e, #f0d491);
    box-shadow: 0 0 10px -2px rgb(220 174 78 / 60%);
  }

  .ns-bar:nth-child(2) .ns-bar__track i {
    background: linear-gradient(90deg, #8fa3b5, #c6d3de);
  }

  .ns-bar:nth-child(3) .ns-bar__track i {
    background: linear-gradient(90deg, #c98a58, #e3b48b);
  }

  .ns-bar:nth-child(n + 5) .ns-bar__track i {
    opacity: 0.82;
  }

  /* 游戏分布条 */
  .game-bars {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-top: 4px;
  }

  .game-bar {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .game-bar__name {
    display: flex;
    gap: 6px;
    align-items: center;
    width: 92px;
    font-size: 12.5px;
    color: var(--g-text-sub);
  }

  .game-bar__track {
    flex: 1;
    height: 6px;
    overflow: hidden;
    background: var(--g-track);
    border-radius: 4px;
  }

  .game-bar__fill {
    height: 100%;
    border-radius: 4px;
    opacity: 0.9;
    transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .game-bar__val {
    width: 64px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--g-text);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* 命名空间卡片 */
  .ns-grid {
    display: grid;
    gap: 14px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 1400px) {
    .ns-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 860px) {
    .ns-grid {
      grid-template-columns: 1fr;
    }
  }

  .ns-card {
    display: flex;
    flex-direction: column;
    gap: 9px;
    padding: 15px 16px;
  }

  .ns-card__top {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
  }

  .ns-card__title {
    display: flex;
    gap: 8px;
    align-items: center;
    min-width: 0;
  }

  .ns-card__name {
    overflow: hidden;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--g-text);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ns-card__keys {
    font-size: 17px;
    font-weight: 650;
    color: var(--g-text);
    font-variant-numeric: tabular-nums;
  }

  .ns-card__bar {
    height: 5px;
  }

  .ns-card__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .ns-card__desc {
    font-size: 12px;
    line-height: 1.5;
    color: var(--g-text-mute);
  }

  .ns-card__types {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .ns-card__detail {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-top: 4px;
    border-top: 1px dashed var(--g-card-border);
  }

  .ns-detail {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
  }

  .ns-detail__key {
    color: var(--g-text-sub);
  }


  .tip__icon {
    margin-top: 2px;
    font-size: 16px;
    color: var(--g-gold);
  }
</style>
