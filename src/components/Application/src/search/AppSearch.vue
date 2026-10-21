<template>
  <!-- 单根节点：头部会把 __item / is-cmd 透传到这里，多根节点会导致 class 丢失 -->
  <div class="cmd-wrap is-cmd">
    <div
      class="cmd-trigger"
      role="button"
      tabindex="0"
      :title="`搜索页面（${hotkeyLabel}）`"
      @click="open"
      @keydown.enter.prevent="open"
      @keydown.space.prevent="open"
    >
      <Icon :icon="searchIcon" :size="14" class="cmd-trigger__icon" />
      <span class="cmd-trigger__text">搜索</span>
      <kbd class="cmd-trigger__kbd">{{ hotkeyLabel }}</kbd>
    </div>
    <AppSearchModal :visible="visible" @close="visible = false" />
  </div>
</template>

<script lang="ts" setup>
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
  import Icon from '/@/components/Icon';
  import AppSearchModal from './AppSearchModal.vue';
  import { gm } from '/@/design/gmIcons';

  defineOptions({ name: 'AppSearch' });

  const visible = ref(false);
  const searchIcon = gm('search');

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  /** Windows 上 ⌘ 不存在，直接写 Ctrl，别让用户猜 */
  const hotkeyLabel = computed(() => (isMac ? '⌘K' : 'Ctrl K'));

  function open() {
    visible.value = true;
  }

  function onKeydown(e: KeyboardEvent) {
    if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
    if (String(e.key).toLowerCase() !== 'k') return;
    // 浏览器里 Ctrl+K 默认是搜索框聚焦，这里要接管
    e.preventDefault();
    visible.value = !visible.value;
  }

  onMounted(() => window.addEventListener('keydown', onKeydown));
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<style lang="less" scoped>
  .cmd-wrap {
    display: flex;
    align-items: center;
  }

  .cmd-trigger {
    display: flex;
    height: 30px;
    padding: 0 7px 0 9px;
    margin-left: 4px;
    color: var(--g-text-mute);
    cursor: pointer;
    background: var(--g-chip-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 8px;
    outline: none;
    align-items: center;
    gap: 6px;
    transition: color 0.14s, border-color 0.14s, background 0.14s;

    &:hover,
    &:focus-visible {
      color: var(--g-text-sub);
      background: var(--g-hover);
      border-color: var(--g-card-border-strong);
    }
  }

  .cmd-trigger__icon {
    flex-shrink: 0;
  }

  .cmd-trigger__text {
    font-size: 12px;
    line-height: 1;
    white-space: nowrap;
  }

  .cmd-trigger__kbd {
    padding: 1px 4px;
    font-family: var(--g-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
    font-size: 10px;
    line-height: 1.35;
    color: var(--g-text-mute);
    background: var(--g-card-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 4px;
    white-space: nowrap;
  }

  /* 窄一点的屏收起文字，只留图标和快捷键（1440 是常见宽度，要保住文字） */
  @media (max-width: 1380px) {
    .cmd-trigger__text {
      display: none;
    }
  }

  @media (max-width: 768px) {
    .cmd-trigger {
      padding: 0 8px;
      margin-left: 0;
    }

    .cmd-trigger__kbd {
      display: none;
    }
  }
</style>
