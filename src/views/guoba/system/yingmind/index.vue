<template>
  <PageWrapper title="">
    <div class="db g-page ym">
      <!-- ============================ 页头 ============================ -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">YING MEMORY</div>
          <div class="db-hero__title">荧之心智</div>
          <div class="db-hero__desc">
            荧对每个群的记忆、与每个人的关系、当下的情绪，都在这里——只读观测，不干扰她的心智
            <span v-if="groups.length" class="db-hero__time">· {{ groups.length }} 个群有数据</span>
          </div>
        </div>
        <div class="db-hero__side">
          <GSelect
            v-if="groups.length"
            :model-value="gid"
            :options="groupOptions"
            size="md"
            width="240px"
            searchable
            placeholder="选择一个群"
            @change="onGroupChange"
          />
          <Button size="small" :loading="loading" @click="loadAll">刷新</Button>
        </div>
      </section>

      <!-- ============================ 情绪卡 ============================ -->
      <section v-if="emotion" class="ym-emotion">
        <div class="ym-emotion__mood">
          <span class="ym-emotion__label">当前情绪</span>
          <span class="ym-emotion__word">{{ emotion.mood || '—' }}</span>
        </div>
        <div class="ym-emotion__bar">
          <div class="ym-emotion__track">
            <i :style="{ width: clamp01(emotion.value) + '%' }" :class="moodTone(emotion.value)" />
          </div>
          <span class="ym-emotion__val">{{ emotion.value.toFixed(1) }}</span>
        </div>
        <span class="ym-emotion__time">{{ emotion.updatedAt ? fmtDateTime(emotion.updatedAt) : '暂无记录' }}</span>
      </section>

      <!-- ============================ 概览 KPI ============================ -->
      <section class="db-kpi">
        <div class="db-kpi__card">
          <div class="db-kpi__icon" style="background: linear-gradient(135deg, #8a7bf2, #4c39bd)">
            <Icon :icon="$gm('memory')" :size="19" />
          </div>
          <div class="db-kpi__body">
            <div class="db-kpi__label">记忆条数</div>
            <div class="db-kpi__value">{{ memories.length }}</div>
            <div class="db-kpi__foot">{{ tierCounts.mid }} 中期 · {{ tierCounts.long }} 长期</div>
          </div>
        </div>
        <div class="db-kpi__card">
          <div class="db-kpi__icon" style="background: linear-gradient(135deg, #f0ae4e, #c06e13)">
            <Icon :icon="$gm('users')" :size="19" />
          </div>
          <div class="db-kpi__body">
            <div class="db-kpi__label">认识的人</div>
            <div class="db-kpi__value">{{ relations.length }}</div>
            <div class="db-kpi__foot">{{ milestoneCount }} 个关键节点</div>
          </div>
        </div>
        <div class="db-kpi__card">
          <div class="db-kpi__icon" style="background: linear-gradient(135deg, #57c483, #1a7a50)">
            <Icon :icon="$gm('heart')" :size="19" />
          </div>
          <div class="db-kpi__body">
            <div class="db-kpi__label">最亲密的人</div>
            <div class="db-kpi__value">{{ topRel.name }}</div>
            <div class="db-kpi__foot">亲密度 {{ topRel.affinity.toFixed(1) }}</div>
          </div>
        </div>
      </section>

      <!-- ============================ 记忆 + 关系 两栏 ============================ -->
      <div class="ym-grid">
        <!-- 记忆库 -->
        <section class="g-card ym-panel">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('memory')" :size="13" /></i>
              记忆库
              <span class="gm-panel__extra" style="margin-left: 8px">按重要度排序</span>
            </div>
            <div class="ym-tiers">
              <span class="ym-tier is-short">短期</span>
              <span class="ym-tier is-mid">中期</span>
              <span class="ym-tier is-long">长期</span>
            </div>
          </div>
          <div v-if="!memories.length" class="ym-empty">
            <span>这个群荧还没有沉淀记忆</span>
            <span class="ym-empty__sub">多聊几次、多互动，记忆会慢慢积累起来</span>
          </div>
          <div v-else class="ym-memories">
            <div v-for="m in memories" :key="m.id" class="ym-mem">
              <i class="ym-mem__bar" :class="'is-' + tierClass(m.tier)" />
              <div class="ym-mem__body">
                <div class="ym-mem__text" :title="m.text">{{ m.text }}</div>
                <div class="ym-mem__meta">
                  <span class="ym-tier" :class="'is-' + tierClass(m.tier)">{{ tierText(m.tier) }}</span>
                  <span class="ym-mem__val">重要度 {{ (m.value * 100).toFixed(0) }}</span>
                  <span class="ym-mem__time">{{ fmtDateTime(m.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 关系面板 -->
        <section class="g-card ym-panel">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('users')" :size="13" /></i>
              与每个人的关系
              <span class="gm-panel__extra" style="margin-left: 8px">按亲密度排序</span>
            </div>
          </div>
          <div v-if="!relations.length" class="ym-empty">
            <span>这个群荧还没有关系数据</span>
          </div>
          <div v-else class="ym-rels">
            <div v-for="r in relations" :key="r.uid" class="ym-rel">
              <div class="ym-rel__avatar" :style="avatarStyle(r.uid)">{{ r.uid.slice(-2) }}</div>
              <div class="ym-rel__main">
                <div class="ym-rel__name" :title="r.uid">{{ r.uid }}</div>
                <div class="ym-rel__stats">
                  <span class="ym-rel__stat" :title="'信任'">
                    <em>{{ r.trust }}</em> 信任
                  </span>
                  <span class="ym-rel__stat" :title="'好感'">
                    <em>{{ r.affection }}</em> 好感
                  </span>
                  <span class="ym-rel__stat" :title="'摩擦'">
                    <em>{{ r.friction }}</em> 摩擦
                  </span>
                </div>
                <div class="ym-rel__milestones">
                  <span
                    v-for="ms in milestonesOf(r.uid).slice(0, 3)"
                    :key="ms.type + ms.timestamp"
                    class="ym-milestone"
                    :title="ms.description"
                  >
                    {{ milestoneText(ms.type) }}
                  </span>
                  <span class="ym-rel__meta">{{ r.interactionCount }} 次互动 · {{ r.activeDays }} 天活跃</span>
                </div>
              </div>
              <div class="ym-rel__affinity">
                <div class="ym-rel__affinity-num">{{ r.affinity.toFixed(1) }}</div>
                <div class="ym-rel__affinity-label">亲密度</div>
              </div>
            </div>
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
  import GSelect from '../_shared/form/GSelect.vue';
  import { fmtDateTime } from '/@/utils/localTime';
  import { yingMindApi, type MindEmotion, type MindGroup, type MindMemory, type MindRelation } from './api';

  defineOptions({ name: 'YingMind' });

  const groups = ref<MindGroup[]>([]);
  const gid = ref('');
  const memories = ref<MindMemory[]>([]);
  const relations = ref<MindRelation[]>([]);
  const milestones = ref<Record<string, any[]>>({});
  const emotion = ref<MindEmotion | null>(null);
  const loading = ref(false);

  const groupOptions = computed(() =>
    groups.value.map((g) => ({
      value: g.gid,
      label: g.name || g.gid,
    })),
  );

  const tierCounts = computed(() => {
    let mid = 0;
    let long = 0;
    let short = 0;
    for (const m of memories.value) {
      if (m.tier === 'long') long++;
      else if (m.tier === 'short') short++;
      else mid++;
    }
    return { short, mid, long };
  });

  const milestoneCount = computed(() => Object.values(milestones.value).reduce((s, a) => s + a.length, 0));

  const topRel = computed(() => {
    if (!relations.value.length) return { name: '—', affinity: 0 };
    const r = relations.value[0];
    return { name: r.uid.slice(-6), affinity: r.affinity };
  });

  function clamp01(n: number) {
    return Math.max(0, Math.min(100, Number(n) || 0));
  }

  function tierClass(t: string) {
    return t === 'long' ? 'long' : t === 'short' ? 'short' : 'mid';
  }

  function tierText(t: string) {
    return t === 'long' ? '长期' : t === 'short' ? '短期' : '中期';
  }

  function moodTone(v: number) {
    if (v >= 60) return 'is-good';
    if (v <= 40) return 'is-bad';
    return 'is-mid';
  }

  function milestoneText(t: string) {
    const map: Record<string, string> = {
      first_meet: '初识',
      first_mention: '主动互动',
      first_long_chat: '长聊',
      played: '玩闹',
      helped: '互助',
      deep_comfort: '深度交心',
      conflict: '冲突',
    };
    return map[t] || t;
  }

  function milestonesOf(uid: string) {
    return milestones.value[uid] ?? [];
  }

  function avatarStyle(uid: string) {
    let h = 0;
    for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
    const hue = h % 360;
    return `background: linear-gradient(135deg, hsl(${hue} 60% 55%), hsl(${(hue + 40) % 360} 60% 40%))`;
  }

  async function loadGroups() {
    try {
      groups.value = await yingMindApi.groups();
      if (groups.value.length && !gid.value) {
        gid.value = groups.value[0].gid;
        await loadDetail();
      }
    } catch {}
  }

  async function loadDetail() {
    if (!gid.value) return;
    try {
      const [m, r, e] = await Promise.all([
        yingMindApi.memories(gid.value),
        yingMindApi.relations(gid.value),
        yingMindApi.emotion(gid.value),
      ]);
      memories.value = m ?? [];
      relations.value = r?.list ?? [];
      milestones.value = r?.milestones ?? {};
      emotion.value = e ?? null;
    } catch {}
  }

  async function onGroupChange(v: any) {
    gid.value = String(v ?? '');
    await loadDetail();
  }

  async function loadAll() {
    loading.value = true;
    try {
      await loadGroups();
      if (gid.value) await loadDetail();
    } finally {
      loading.value = false;
    }
  }

  onMounted(loadGroups);
</script>

<style scoped lang="less">
  .ym-emotion {
    display: flex;
    gap: 16px;
    align-items: center;
    padding: 14px 18px;
    margin-bottom: 14px;
    background: var(--g-card-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 16px;

    &__mood {
      display: flex;
      gap: 8px;
      align-items: baseline;
      flex-shrink: 0;
    }

    &__label {
      font-size: 12px;
      color: var(--g-text-mute);
    }

    &__word {
      font-size: 18px;
      font-weight: 650;
      color: var(--g-text);
    }

    &__bar {
      display: flex;
      gap: 10px;
      align-items: center;
      flex: 1;
      min-width: 0;
    }

    &__track {
      flex: 1;
      height: 8px;
      overflow: hidden;
      background: var(--g-chip-bg);
      border-radius: 4px;

      i {
        display: block;
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;

        &.is-good {
          background: linear-gradient(90deg, var(--g-green), #2fc4b0);
        }
        &.is-mid {
          background: linear-gradient(90deg, var(--g-amber), var(--g-gold));
        }
        &.is-bad {
          background: linear-gradient(90deg, var(--g-rose), var(--g-red));
        }
      }
    }

    &__val {
      flex-shrink: 0;
      font-family: var(--cs-mono, monospace);
      font-size: 14px;
      font-weight: 650;
      color: var(--g-text);
      font-variant-numeric: tabular-nums;
    }

    &__time {
      flex-shrink: 0;
      font-size: 11px;
      color: var(--g-text-mute);
    }
  }

  .ym-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    gap: 14px;

    @media (max-width: 900px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .ym-panel {
    min-width: 0;
  }

  .ym-tiers {
    display: flex;
    gap: 5px;
  }

  .ym-tier {
    padding: 1px 7px;
    border-radius: 4px;
    font-size: 10px;
    line-height: 16px;
    color: var(--g-text-mute);
    background: var(--g-chip-bg);

    &.is-short {
      color: var(--g-gold);
    }
    &.is-mid {
      color: var(--g-blue);
    }
    &.is-long {
      color: var(--g-violet);
    }
  }

  .ym-empty {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
    justify-content: center;
    padding: 48px 16px;
    color: var(--g-text-mute);
    font-size: 13px;

    &__sub {
      font-size: 11.5px;
      opacity: 0.7;
    }
  }

  .ym-memories {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
    max-height: 560px;
    overflow-y: auto;
  }

  .ym-mem {
    position: relative;
    flex-shrink: 0;
    padding: 10px 12px 10px 16px;
    overflow: hidden;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 10px;

    &__bar {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 3px;
      border-radius: 0 3px 3px 0;

      &.is-short {
        background: var(--g-gold);
      }
      &.is-mid {
        background: var(--g-blue);
      }
      &.is-long {
        background: var(--g-violet);
      }
    }

    &__body {
      min-width: 0;
    }

    &__text {
      display: -webkit-box;
      overflow: hidden;
      font-size: 12.5px;
      line-height: 1.65;
      color: var(--g-text);
      word-break: break-word;
      cursor: default;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
    }

    &__meta {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-top: 6px;
    }

    &__val {
      font-family: var(--cs-mono, monospace);
      font-size: 10.5px;
      color: var(--g-text-mute);
      font-variant-numeric: tabular-nums;
    }

    &__time {
      font-family: var(--cs-mono, monospace);
      font-size: 10.5px;
      color: var(--g-text-mute);
      font-variant-numeric: tabular-nums;
    }
  }

  .ym-rels {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 16px;
    max-height: 560px;
    overflow-y: auto;
  }

  .ym-rel {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    flex-shrink: 0;
    padding: 10px 12px;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 10px;

    &__avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      flex-shrink: 0;
      border-radius: 9px;
      font-family: var(--cs-mono, monospace);
      font-size: 11px;
      color: #fff;
    }

    &__main {
      flex: 1;
      min-width: 0;
    }

    &__name {
      overflow: hidden;
      font-family: var(--cs-mono, monospace);
      font-size: 12px;
      color: var(--g-text);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__stats {
      display: flex;
      gap: 10px;
      margin-top: 5px;
    }

    &__stat {
      font-size: 10.5px;
      color: var(--g-text-mute);

      em {
        font-style: normal;
        font-weight: 650;
        color: var(--g-text-sub);
        font-variant-numeric: tabular-nums;
      }
    }

    &__milestones {
      display: flex;
      gap: 5px;
      align-items: center;
      flex-wrap: wrap;
      margin-top: 6px;
    }

    &__meta {
      font-size: 10px;
      color: var(--g-text-mute);
    }

    &__affinity {
      flex-shrink: 0;
      text-align: center;
    }

    &__affinity-num {
      font-family: var(--cs-mono, monospace);
      font-size: 16px;
      font-weight: 650;
      color: var(--g-text);
      font-variant-numeric: tabular-nums;
    }

    &__affinity-label {
      font-size: 10px;
      color: var(--g-text-mute);
    }
  }

  .ym-milestone {
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 10px;
    line-height: 16px;
    color: #2fc4b0;
    background: rgb(47 196 176 / 12%);
  }
</style>
