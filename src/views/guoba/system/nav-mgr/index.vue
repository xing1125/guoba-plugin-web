<template>
  <PageWrapper title="">
    <div class="g-page">
      <!-- ============================ 页头 ============================ -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">NAV MANAGER</div>
          <div class="db-hero__title">导航管理</div>
          <div class="db-hero__desc">
            控制侧边栏各功能页的显示与排序 · 屏蔽只影响后台界面，不影响权限与数据
            <span class="db-hero__time">· 保存后自动刷新生效</span>
          </div>
        </div>
        <div class="db-hero__side">
          <Button :disabled="!dirty" @click="reset">还原</Button>
          <Button type="primary" :loading="saving" :disabled="!dirty" @click="save">保存</Button>
        </div>
      </section>

      <div class="g-card">
        <div class="gm-panel__head">
          <div class="gm-panel__title">
            <i><Icon icon="ion:settings-outline" :size="13" /></i>
            菜单列表
          </div>
          <span class="gm-panel__extra">拖动「≡」调整顺序 · 开关控制显隐 · 插件页暂不参与</span>
        </div>

        <div class="nv-list">
          <div
            v-for="(it, i) in rows"
            :key="it.key"
            class="nv-row"
            :class="{ 'is-hidden': it.hidden && !it.fixed, 'is-drag': dragIndex === i, 'is-over': overIndex === i && dragIndex !== i }"
            :draggable="canDrag(it)"
            @dragstart="onDragStart(i, $event)"
            @dragover.prevent="onDragOver(i)"
            @drop.prevent="onDrop(i)"
            @dragend="onDragEnd"
          >
            <span class="nv-row__handle" :class="{ 'is-off': !canDrag(it) }">
              <Icon icon="ant-design:drag-outlined" :size="13" />
            </span>
            <span class="nv-row__icon"><Icon :icon="it.icon || 'ant-design:appstore-outlined'" :size="15" /></span>
            <span class="nv-row__name" :title="it.title">{{ it.title }}</span>
            <span class="nv-row__path mono" :title="it.path">{{ it.path }}</span>
            <span v-if="it.plugin" class="gm-chip">插件页</span>
            <span v-else-if="it.fixed" class="gm-chip nv-chip--muted">固定显示</span>
            <GSwitch
              :model-value="!it.hidden"
              :disabled="it.fixed || it.plugin"
              size="sm"
              @change="(v: any) => toggle(it, v)"
            />
          </div>
          <div v-if="!rows.length" class="gm-skeleton" style="height: 320px" />
        </div>

        <div v-if="dirty" class="nv-dirty">
          <Icon icon="ant-design:info-circle-outlined" :size="14" />
          有未保存的修改，点右上角「保存」生效
        </div>
      </div>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { Button, message } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import { Icon } from '/@/components/Icon';
  import GSwitch from '../_shared/form/GSwitch.vue';
  import type { NavMenuItem } from './api';
  import { navApi } from './api';

  defineOptions({ name: 'NavMgr' });

  const rows = ref<NavMenuItem[]>([]);
  /** 已保存的基线，用于判断 dirty 与「还原」 */
  let baseline: { hidden: string[]; order: string[] } = { hidden: [], order: [] };
  const saving = ref(false);

  const dirty = computed(() => {
    const hidden = rows.value.filter((r) => r.hidden && !r.fixed && !r.plugin).map((r) => r.key);
    const order = rows.value.map((r) => r.key);
    const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
    return !(same(hidden.slice().sort(), baseline.hidden.slice().sort()) && same(order, baseline.order));
  });

  function canDrag(it: NavMenuItem) {
    return !it.plugin;
  }

  function toggle(it: NavMenuItem, v: any) {
    it.hidden = !v;
  }

  /* ------------------------------ 拖拽排序 ------------------------------ */

  const dragIndex = ref(-1);
  const overIndex = ref(-1);

  function onDragStart(i: number, ev: DragEvent) {
    if (!canDrag(rows.value[i])) {
      ev.preventDefault();
      return;
    }
    dragIndex.value = i;
    ev.dataTransfer?.setData('text/plain', String(i));
    ev.dataTransfer && (ev.dataTransfer.effectAllowed = 'move');
  }

  function onDragOver(i: number) {
    if (dragIndex.value === -1) return;
    overIndex.value = i;
  }

  function onDrop(i: number) {
    if (dragIndex.value === -1 || dragIndex.value === i) {
      onDragEnd();
      return;
    }
    const list = rows.value.slice();
    const [moved] = list.splice(dragIndex.value, 1);
    list.splice(i, 0, moved);
    rows.value = list;
    onDragEnd();
  }

  function onDragEnd() {
    dragIndex.value = -1;
    overIndex.value = -1;
  }

  /* ------------------------------ 加载 / 保存 ------------------------------ */

  async function load() {
    const res = await navApi.getPrefs();
    baseline = { hidden: res.hidden || [], order: res.order || [] };
    const items = res.items || [];
    if (baseline.order.length) {
      const idx = new Map(baseline.order.map((k, i) => [k, i]));
      const positioned = items.map((it, i) => ({ it, i, o: idx.get(it.key) }));
      positioned.sort((a, b) => {
        const ao = a.o ?? baseline.order.length + a.i;
        const bo = b.o ?? baseline.order.length + b.i;
        return ao - bo;
      });
      rows.value = positioned.map((x) => x.it);
    } else {
      rows.value = items;
    }
  }

  function reset() {
    load().catch(() => {});
  }

  async function save() {
    saving.value = true;
    try {
      await navApi.setPrefs({
        hidden: rows.value.filter((r) => r.hidden && !r.fixed && !r.plugin).map((r) => r.key),
        order: rows.value.map((r) => r.key),
      });
      message.success('已保存，正在刷新…');
      setTimeout(() => location.reload(), 700);
    } catch (e: any) {
      message.error(e?.message || '保存失败');
    } finally {
      saving.value = false;
    }
  }

  onMounted(() => load().catch((e: any) => message.error(e?.message || '加载失败')));
</script>

<style lang="less" scoped>
  .mono {
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  }

  .nv-list {
    display: flex;
    flex-direction: column;
  }

  .nv-row {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 9px 12px;
    background: transparent;
    border-bottom: 1px dashed var(--g-card-border);
    transition: background 0.15s, opacity 0.2s;

    &:last-child {
      border-bottom: none;
    }
    &:hover {
      background: var(--g-card-bg-soft);
    }
    &.is-drag {
      opacity: 0.45;
    }
    &.is-over {
      box-shadow: inset 0 2px 0 0 var(--g-blue);
    }
    &.is-hidden {
      .nv-row__name,
      .nv-row__path {
        opacity: 0.45;
      }
    }
  }

  .nv-row__handle {
    display: inline-flex;
    flex-shrink: 0;
    color: var(--g-text-mute);
    cursor: grab;

    &.is-off {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }

  .nv-row__icon {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    color: var(--g-text-sub);
  }

  .nv-row__name {
    flex-shrink: 0;
    min-width: 96px;
    font-size: 13px;
    font-weight: 600;
    color: var(--g-text);
  }

  .nv-row__path {
    flex: 1 1 auto;
    overflow: hidden;
    font-size: 11.5px;
    color: var(--g-text-mute);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .nv-chip--muted {
    opacity: 0.7;
  }

  .nv-dirty {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 10px 12px;
    font-size: 12px;
    color: var(--g-blue);
    border-top: 1px dashed var(--g-card-border);
  }
</style>
