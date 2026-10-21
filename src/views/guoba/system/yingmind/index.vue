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
        <Button size="small" @click="openEmotion">校正</Button>
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

      <!-- ============================ 记忆体检 ============================ -->
      <section class="g-card ym-health">
        <div class="gm-panel__head">
          <div class="gm-panel__title">
            <i><Icon :icon="$gm('pulse')" :size="13" /></i>
            记忆体检
            <span class="gm-panel__extra" style="margin-left: 8px">只读扫描 · 清理需二次确认</span>
          </div>
          <div class="ym-health__tools">
            <GSegmented
              v-model="healthScope"
              :options="healthScopeOptions"
              size="sm"
              label="体检范围"
              @change="loadHealth"
            />
            <Button size="small" :loading="healthLoading" @click="loadHealth">重新体检</Button>
          </div>
        </div>

        <div v-if="healthLoading && !health" class="gm-skeleton" style="height: 92px" />
        <div v-else-if="!health" class="ym-empty">
          <span>还没有体检数据</span>
          <span class="ym-empty__sub">点「重新体检」扫一次荧的记忆库</span>
        </div>
        <div v-else class="ym-health__body">
          <div class="ym-health__score" :class="scoreTone(health.score)">
            <div class="ym-health__score-num">{{ health.score }}<em>分</em></div>
            <div class="ym-health__track"><i :style="{ width: clamp01(health.score) + '%' }" /></div>
            <div class="ym-health__meta">
              真实群 {{ health.groups }} 个 · 共 {{ health.total }} 条记忆
            </div>
          </div>
          <div class="ym-health__issues">
            <button
              v-for="c in issueChips"
              :key="c.key"
              type="button"
              class="ym-hchip"
              :class="c.tone"
              @click="onIssueClick(c.key)"
            >
              {{ c.label }}
              <b>{{ c.count }}</b>
            </button>
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
                  <span class="ym-mem__ops">
                    <button type="button" class="g-link" @click="openEditMem(m)">编辑</button>
                    <button type="button" class="g-link is-danger" @click="askDelMem(m)">删除</button>
                  </span>
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

      <!-- ============================ 编辑记忆弹窗 ============================ -->
      <GModal v-model:visible="editModal.visible" eyebrow="MEMORY EDIT" title="编辑记忆" :subtitle="gid" size="md">
        <GField label="记忆内容">
          <GInput v-model="editModal.text" type="textarea" :rows="6" />
        </GField>
        <GField label="重要度（0~100）" extra="影响荧回忆这段记忆的优先级">
          <GNumber v-model="editModal.value" :min="0" :max="100" style="width: 140px" />
        </GField>
        <template #footer>
          <Button @click="editModal.visible = false">取消</Button>
          <Button type="primary" :loading="editModal.saving" @click="doEditMem">保存</Button>
        </template>
      </GModal>

      <!-- ============================ 情绪校正弹窗 ============================ -->
      <GModal v-model:visible="emoModal.visible" eyebrow="MOOD CALIBRATION" title="校正情绪" :subtitle="gid" size="sm">
        <GField label="情绪词" extra="如：开心、平静、兴奋">
          <GInput v-model="emoModal.mood" />
        </GField>
        <GField label="情绪值（0~100）" extra="影响荧说话的语气与主动性">
          <GNumber v-model="emoModal.value" :min="0" :max="100" style="width: 140px" />
        </GField>
        <template #footer>
          <Button @click="emoModal.visible = false">取消</Button>
          <Button type="primary" :loading="emoModal.saving" @click="doEmotion">保存</Button>
        </template>
      </GModal>

      <!-- ============================ 删除记忆确认 ============================ -->
      <GConfirmModal
        v-model:visible="delModal.visible"
        title="删除这条记忆"
        :content="delModal.text"
        hint="删除后荧会彻底忘记这件事；她后续可能在群里重新认识、重新记忆。"
        danger
        :loading="delModal.loading"
        ok-text="确认删除"
        @ok="doDelMem"
      />

      <!-- ============================ 体检候选清理弹窗 ============================ -->
      <GModal
        v-model:visible="candModal.visible"
        eyebrow="MEMORY HEALTH"
        :title="`记忆体检候选（${candItems.length}）`"
        :subtitle="health?.scope === 'group' ? `当前群 ${gid}` : '全站'"
        :footer-hint="`共 ${candItems.length} 条候选 · 默认全不选`"
        size="xl"
        body-height="60vh"
      >
        <div class="ym-hfilter">
          <button
            v-for="f in CAND_FILTERS"
            :key="f.value"
            type="button"
            class="ym-hfilter__item"
            :class="{ 'is-active': candModal.filter === f.value }"
            @click="candModal.filter = f.value"
          >
            {{ f.label }}
            <em>{{ filterCount(f.value) }}</em>
          </button>
        </div>

        <div v-if="!candItems.length" class="ym-empty">
          <span>没有需要清理的记忆，荧的状态很健康</span>
        </div>
        <div v-else-if="!filteredCandidates.length" class="ym-empty">
          <span>这个原因下没有候选记忆</span>
        </div>
        <div v-else class="ym-cands">
          <div
            v-for="c in filteredCandidates"
            :key="candKey(c)"
            class="ym-cand"
            :class="{ 'is-on': isSelected(c) }"
            @click="toggleCand(c)"
          >
            <div class="ym-cand__check" @click.stop>
              <GCheckbox :model-value="isSelected(c)" @update:model-value="toggleCand(c)" />
            </div>
            <div class="ym-cand__main">
              <div class="ym-cand__top">
                <span class="ym-cand__g" :title="c.gid">{{ c.gname || c.gid }}</span>
                <span class="ym-cand__val">重要度 {{ Math.round(c.value * 100) }}</span>
                <span class="ym-cand__age">已 {{ Math.round(c.ageDays) }} 天</span>
              </div>
              <div class="ym-cand__text" :title="c.text">{{ clipText(c.text) }}</div>
              <div class="g-chip-row">
                <span v-for="r in c.reasons" :key="r" class="g-chip" :class="reasonTone(r)">
                  {{ reasonText(r) }}
                </span>
                <span v-if="c.dupWith.length" class="g-chip">与 {{ c.dupWith.length }} 条重复</span>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <span class="ym-cands__count">已选 <b>{{ candSel.length }}</b> 条</span>
          <Button @click="candModal.visible = false">取消</Button>
          <Button danger :disabled="!candSel.length" @click="askCleanup">清理选中</Button>
        </template>
      </GModal>

      <!-- ============================ 测试残留文件（只读） ============================ -->
      <GModal
        v-model:visible="probeModal.visible"
        eyebrow="PROBE FILES"
        title="测试残留文件"
        subtitle="探针 / 测试数据，需手工处理"
        size="md"
      >
        <div class="ym-probe">
          <div class="ym-probe__hint">
            这些是探针 / 测试数据留下的文件，后台不提供清理，请到荧的记忆目录手工处理。
          </div>
          <div v-if="!probeFiles.length" class="ym-empty">
            <span>没有发现残留文件</span>
          </div>
          <div v-else class="ym-probe__list">
            <div v-for="p in probeFiles" :key="p.file" class="ym-probe__row">
              <span class="ym-probe__file" :title="p.file">{{ p.file }}</span>
              <span class="ym-probe__count">{{ p.count }} 条</span>
            </div>
          </div>
        </div>
        <template #footer>
          <Button @click="probeModal.visible = false">关闭</Button>
        </template>
      </GModal>

      <!-- ============================ 批量清理二次确认 ============================ -->
      <GConfirmModal
        v-model:visible="cleanModal.visible"
        title="清理选中记忆"
        :content="cleanContent"
        hint="清理前会先整体备份；文本已被改动（漂移）的条目会被跳过。"
        danger
        :loading="cleanModal.loading"
        ok-text="确认清理"
        @ok="doCleanup"
      />
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue';
  import { Button, message } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import { Icon } from '/@/components/Icon';
  import GModal from '../_shared/dialog/GModal.vue';
  import GConfirmModal from '../_shared/dialog/GConfirmModal.vue';
  import GCheckbox from '../_shared/form/GCheckbox.vue';
  import GField from '../_shared/form/GField.vue';
  import GInput from '../_shared/form/GInput.vue';
  import GNumber from '../_shared/form/GNumber.vue';
  import GSegmented from '../_shared/form/GSegmented.vue';
  import GSelect from '../_shared/form/GSelect.vue';
  import { fmtDateTime } from '/@/utils/localTime';
  import {
    yingMindApi,
    type MindCandidate,
    type MindEmotion,
    type MindGroup,
    type MindIssueReason,
    type MindMemory,
    type MindProbeFile,
    type MindRelation,
    type YingMindHealth,
  } from './api';

  defineOptions({ name: 'YingMind' });

  const groups = ref<MindGroup[]>([]);
  const gid = ref('');
  const memories = ref<MindMemory[]>([]);
  const relations = ref<MindRelation[]>([]);
  const milestones = ref<Record<string, any[]>>({});
  const emotion = ref<MindEmotion | null>(null);
  const loading = ref(false);

  /* ------------------------------ 记忆体检 ------------------------------ */

  type CandFilter = 'all' | MindIssueReason;

  const health = ref<YingMindHealth | null>(null);
  const healthLoading = ref(false);
  const healthScope = ref<string>('all');

  const healthScopeOptions = computed(() => [
    { value: 'all', label: '全站' },
    { value: 'group', label: '当前群', disabled: !gid.value },
  ]);

  const issueChips = computed(() => {
    const h = health.value;
    if (!h) return [] as Array<{ key: string; label: string; count: number; tone: string }>;
    return [
      { key: 'lowValue', label: '低价值', count: h.issues.lowValue, tone: 'is-amber' },
      { key: 'stale', label: '僵尸', count: h.issues.stale, tone: 'is-rose' },
      { key: 'unconsolidated', label: '未巩固', count: h.issues.unconsolidated, tone: 'is-blue' },
      { key: 'duplicate', label: '跨群重复', count: h.issues.duplicate, tone: 'is-violet' },
      { key: 'probe', label: '测试残留', count: h.issues.probe, tone: 'is-mute' },
    ];
  });

  const probeFiles = computed<MindProbeFile[]>(() => health.value?.probeFiles ?? []);

  const candItems = ref<MindCandidate[]>([]);
  const candSel = ref<string[]>([]);
  const candModal = reactive({ visible: false, filter: 'all' as CandFilter });
  const probeModal = reactive({ visible: false });
  const cleanModal = reactive({ visible: false, loading: false });

  const CAND_FILTERS: Array<{ value: CandFilter; label: string }> = [
    { value: 'all', label: '全部' },
    { value: 'lowValue', label: '低价值' },
    { value: 'stale', label: '僵尸' },
    { value: 'unconsolidated', label: '未巩固' },
    { value: 'duplicate', label: '重复' },
  ];

  const REASON_TEXT: Record<string, string> = {
    lowValue: '低价值',
    stale: '僵尸',
    unconsolidated: '未巩固',
    duplicate: '跨群重复',
  };

  const REASON_TONE: Record<string, string> = {
    lowValue: 'is-amber',
    stale: 'is-rose',
    unconsolidated: 'is-blue',
    duplicate: 'is-violet',
  };

  function reasonText(r: string) {
    return REASON_TEXT[r] || r;
  }

  function reasonTone(r: string) {
    return REASON_TONE[r] || 'is-mute';
  }

  const filteredCandidates = computed(() => {
    if (candModal.filter === 'all') return candItems.value;
    return candItems.value.filter((c) => c.reasons.includes(candModal.filter as MindIssueReason));
  });

  const selSet = computed(() => new Set(candSel.value));

  const cleanContent = computed(
    () =>
      `将删除 ${candSel.value.length} 条记忆。\n` +
      '删除前会先把这些记忆完整备份到 _backup_memory_cleanup_* 目录。\n' +
      '该操作不可撤销。',
  );

  function filterCount(f: CandFilter) {
    if (f === 'all') return candItems.value.length;
    return candItems.value.filter((c) => c.reasons.includes(f)).length;
  }

  function candKey(c: MindCandidate) {
    return `${c.gid}#${c.index}`;
  }

  function isSelected(c: MindCandidate) {
    return selSet.value.has(candKey(c));
  }

  function toggleCand(c: MindCandidate) {
    const k = candKey(c);
    const next = new Set(candSel.value);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    candSel.value = Array.from(next);
  }

  function clipText(t: string) {
    return t.length > 60 ? `${t.slice(0, 60)}…` : t;
  }

  function scoreTone(s: number) {
    if (s >= 80) return 'is-good';
    if (s >= 60) return 'is-mid';
    return 'is-bad';
  }

  async function loadHealth() {
    healthLoading.value = true;
    try {
      health.value = await yingMindApi.health({ gid: healthScope.value === 'group' ? gid.value : '' });
    } catch {
      /* 体检失败不影响主面板 */
    } finally {
      healthLoading.value = false;
    }
  }

  function onIssueClick(key: string) {
    if (key === 'probe') {
      probeModal.visible = true;
      return;
    }
    openCandidates(key as MindIssueReason);
  }

  /** 打开候选弹窗；默认全不选（危险操作不预选） */
  function openCandidates(reason: CandFilter = 'all') {
    candItems.value = health.value?.candidates ?? [];
    candSel.value = [];
    candModal.filter = reason;
    candModal.visible = true;
  }

  function askCleanup() {
    if (!candSel.value.length) {
      message.warning('请先勾选要清理的记忆');
      return;
    }
    cleanModal.visible = true;
  }

  async function doCleanup() {
    // 按候选列表顺序收集，oldText 必须是原文（后端做漂移校验）
    const keys = candItems.value.filter(isSelected).map((c) => ({ gid: c.gid, index: c.index, oldText: c.text }));
    if (!keys.length) {
      message.warning('没有选中任何记忆');
      cleanModal.visible = false;
      return;
    }
    cleanModal.loading = true;
    try {
      const r = await yingMindApi.cleanup({ confirm: true, keys });
      message.success(`已清理 ${r.removed} 条（跳过 ${r.skipped} 条），备份于 ${r.backupDir}`, 6);
      cleanModal.visible = false;
      candModal.visible = false;
      candSel.value = [];
      candItems.value = [];
      await Promise.all([loadHealth(), loadDetail()]);
    } catch (e: any) {
      message.error(e?.message || '清理失败');
    } finally {
      cleanModal.loading = false;
    }
  }

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
    void loadHealth();
  }

  async function loadAll() {
    loading.value = true;
    try {
      await loadGroups();
      if (gid.value) await loadDetail();
      void loadHealth();
    } finally {
      loading.value = false;
    }
  }

  /* ------------------------------ 干预：记忆编辑 / 删除 / 情绪校正 ------------------------------ */

  const editModal = reactive({ visible: false, saving: false, index: -1, text: '', value: 50, oldText: '' });
  const emoModal = reactive({ visible: false, saving: false, mood: '', value: 50 });
  const delModal = reactive({ visible: false, loading: false, index: -1, text: '' });

  function openEditMem(m: MindMemory) {
    editModal.index = m.id;
    editModal.text = m.text;
    editModal.value = Math.round(m.value * 100);
    editModal.oldText = m.text;
    editModal.visible = true;
  }

  async function doEditMem() {
    if (!editModal.text.trim()) {
      message.warning('记忆内容不能为空');
      return;
    }
    editModal.saving = true;
    try {
      await yingMindApi.updateMemory(gid.value, editModal.index, editModal.text, editModal.value, editModal.oldText);
      message.success('已保存');
      editModal.visible = false;
      await loadDetail();
    } catch (e: any) {
      message.error(e?.message || '保存失败');
    } finally {
      editModal.saving = false;
    }
  }

  function askDelMem(m: MindMemory) {
    delModal.index = m.id;
    delModal.text = m.text;
    delModal.visible = true;
  }

  async function doDelMem() {
    delModal.loading = true;
    try {
      await yingMindApi.deleteMemory(gid.value, delModal.index, delModal.text);
      message.success('已删除');
      delModal.visible = false;
      await loadDetail();
    } catch (e: any) {
      message.error(e?.message || '删除失败');
    } finally {
      delModal.loading = false;
    }
  }

  function openEmotion() {
    emoModal.mood = emotion.value?.mood || '';
    emoModal.value = Math.round(emotion.value?.value ?? 50);
    emoModal.visible = true;
  }

  async function doEmotion() {
    emoModal.saving = true;
    try {
      await yingMindApi.setEmotion(gid.value, emoModal.mood, emoModal.value);
      message.success('已校正');
      emoModal.visible = false;
      await loadDetail();
    } catch (e: any) {
      message.error(e?.message || '校正失败');
    } finally {
      emoModal.saving = false;
    }
  }

  onMounted(async () => {
    await loadGroups();
    // 体检不阻塞主数据：主面板渲染后再扫
    void loadHealth();
  });
</script>

<style scoped lang="less">
  @media (max-width: 768px) {
    .ym-health .gm-panel__head {
      flex-wrap: wrap;
    }

    .ym-health .gm-panel__extra {
      display: none;
    }

    .ym-health__tools {
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .ym-health__body {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }

    .ym-health__score {
      flex: 0 0 auto;
    }

    .ym-health__issues {
      justify-content: flex-start;
    }
  }

  /* ------------------------------ 记忆体检 ------------------------------ */

  .ym-health {
    margin-bottom: 14px;
  }

  .ym-health__tools {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
    align-items: center;
  }

  .ym-health__body {
    display: flex;
    gap: 24px;
    align-items: center;
  }

  .ym-health__score {
    flex: 0 0 220px;
    min-width: 0;
  }

  .ym-health__score-num {
    font-family: var(--cs-mono, monospace);
    font-size: 30px;
    font-weight: 700;
    line-height: 1.1;
    color: var(--g-text);
    font-variant-numeric: tabular-nums;

    em {
      margin-left: 3px;
      font-size: 11px;
      font-style: normal;
      font-weight: 500;
      color: var(--g-text-mute);
    }
  }

  .ym-health__track {
    height: 8px;
    margin-top: 9px;
    overflow: hidden;
    background: var(--g-chip-bg);
    border-radius: 4px;

    i {
      display: block;
      height: 100%;
      background: var(--g-text-mute);
      border-radius: 4px;
      transition: width 0.3s ease;
    }
  }

  .ym-health__score.is-good .ym-health__track i {
    background: linear-gradient(90deg, var(--g-green), var(--g-cyan));
  }

  .ym-health__score.is-mid .ym-health__track i {
    background: linear-gradient(90deg, var(--g-amber), var(--g-gold));
  }

  .ym-health__score.is-bad .ym-health__track i {
    background: linear-gradient(90deg, var(--g-rose), var(--g-red));
  }

  .ym-health__meta {
    margin-top: 8px;
    font-size: 11px;
    color: var(--g-text-mute);
    font-variant-numeric: tabular-nums;
  }

  .ym-health__issues {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    justify-content: flex-end;
    min-width: 0;
  }

  .ym-hchip {
    display: inline-flex;
    gap: 7px;
    align-items: center;
    height: 30px;
    padding: 0 12px;
    font-size: 12px;
    color: var(--g-text-sub);
    cursor: pointer;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 8px;
    transition: background 0.16s ease, border-color 0.16s ease;

    b {
      font-family: var(--cs-mono, monospace);
      font-size: 13px;
      font-weight: 700;
      color: var(--g-text);
      font-variant-numeric: tabular-nums;
    }

    &:hover {
      background: var(--g-hover);
      border-color: var(--g-card-border);
    }

    &:focus-visible {
      outline: 2px solid var(--g-blue);
      outline-offset: 1px;
    }

    &.is-amber b {
      color: var(--g-amber);
    }

    &.is-rose b {
      color: var(--g-rose);
    }

    &.is-blue b {
      color: var(--g-blue);
    }

    &.is-violet b {
      color: var(--g-violet);
    }

    &.is-mute b {
      color: var(--g-text-mute);
    }
  }

  /* ------------------------------ 候选筛选 / 列表 ------------------------------ */

  .ym-hfilter {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding-bottom: 12px;
  }

  .ym-hfilter__item {
    display: inline-flex;
    gap: 5px;
    align-items: center;
    height: 26px;
    padding: 0 10px;
    font-size: 11.5px;
    color: var(--g-text-sub);
    cursor: pointer;
    background: transparent;
    border: 1px solid var(--g-card-border);
    border-radius: 7px;
    transition: background 0.16s ease, color 0.16s ease, border-color 0.16s ease;

    em {
      font-style: normal;
      font-size: 11px;
      color: var(--g-text-mute);
      font-variant-numeric: tabular-nums;
    }

    &:hover {
      background: var(--g-hover);
    }

    &:focus-visible {
      outline: 2px solid var(--g-blue);
      outline-offset: 1px;
    }

    &.is-active {
      font-weight: 600;
      color: var(--g-blue);
      background: var(--g-hover);
      border-color: var(--g-blue);

      em {
        color: var(--g-blue);
      }
    }
  }

  .ym-cands {
    display: flex;
    flex-direction: column;
  }

  .ym-cand {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 10px 6px;
    cursor: pointer;
    border-bottom: 1px solid var(--g-row-sep);
    transition: background 0.14s ease;

    &:last-child {
      border-bottom: none;
    }

    &:hover,
    &.is-on {
      background: var(--g-hover);
    }
  }

  .ym-cand__check {
    flex-shrink: 0;
    padding-top: 1px;
  }

  .ym-cand__main {
    flex: 1;
    min-width: 0;
  }

  .ym-cand__top {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: baseline;
  }

  .ym-cand__g {
    max-width: 280px;
    overflow: hidden;
    font-size: 12px;
    font-weight: 600;
    color: var(--g-text);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .ym-cand__val,
  .ym-cand__age {
    font-family: var(--cs-mono, monospace);
    font-size: 10.5px;
    color: var(--g-text-mute);
    font-variant-numeric: tabular-nums;
  }

  .ym-cand__text {
    margin: 4px 0 6px;
    font-size: 12.5px;
    line-height: 1.6;
    color: var(--g-text-sub);
    word-break: break-word;
  }

  /* 原因 chip：全局 .g-chip 只有 signed / unbound / failed / warn 四档，这里补上体检语义色 */
  .ym-cand .g-chip {
    &.is-amber {
      color: var(--g-amber);
    }

    &.is-rose {
      color: var(--g-rose);
    }

    &.is-blue {
      color: var(--g-blue);
    }

    &.is-violet {
      color: var(--g-violet);
    }
  }

  .ym-cands__count {
    margin-right: auto;
    font-size: 11.5px;
    color: var(--g-text-mute);

    b {
      color: var(--g-text);
      font-variant-numeric: tabular-nums;
    }
  }

  /* ------------------------------ 测试残留文件 ------------------------------ */

  .ym-probe__hint {
    margin-bottom: 12px;
    font-size: 12px;
    line-height: 1.7;
    color: var(--g-text-mute);
  }

  .ym-probe__list {
    display: flex;
    flex-direction: column;
  }

  .ym-probe__row {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    padding: 8px 2px;
    border-bottom: 1px solid var(--g-row-sep);

    &:last-child {
      border-bottom: none;
    }
  }

  .ym-probe__file {
    overflow: hidden;
    font-family: var(--cs-mono, monospace);
    font-size: 11.5px;
    color: var(--g-text-sub);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .ym-probe__count {
    flex-shrink: 0;
    font-family: var(--cs-mono, monospace);
    font-size: 11px;
    color: var(--g-text-mute);
    font-variant-numeric: tabular-nums;
  }

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

    &__ops {
      display: inline-flex;
      gap: 8px;
      margin-left: auto;
      opacity: 0;
      transition: opacity 0.15s ease;

      .g-link {
        font-size: 11px;
        color: var(--g-blue);
        cursor: pointer;

        &.is-danger {
          color: var(--g-rose);
        }
      }
    }

    &:hover &__ops {
      opacity: 1;
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
