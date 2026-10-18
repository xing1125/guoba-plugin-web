<template>
  <Modal v-model:visible="visible" title="键盘快捷键" :footer="null" :width="420">
    <div class="gk">
      <div v-for="k in keys" :key="k.label" class="gk__row">
        <span class="gk__label">{{ k.label }}</span>
        <span class="gk__keys">
          <kbd v-for="(s, i) in k.keys" :key="i">{{ s }}</kbd>
        </span>
      </div>
      <p class="gk__tip">输入框聚焦时快捷键不生效</p>
    </div>
  </Modal>
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref } from 'vue';
  import { Modal } from 'ant-design-vue';
  import { useRouter } from 'vue-router';

  /**
   * 全局快捷键：
   *   ?        打开本帮助
   *   g → h    回首页
   *   g → a    审计日志
   *   g → u    后台用户
   *   g → g    群数据
   */
  defineOptions({ name: 'GuobaShortcuts' });

  const router = useRouter();
  const visible = ref(false);

  const keys = [
    { label: '打开快捷键帮助', keys: ['?'] },
    { label: '回到首页', keys: ['g', 'h'] },
    { label: '审计日志', keys: ['g', 'a'] },
    { label: '后台用户', keys: ['g', 'u'] },
    { label: '群数据', keys: ['g', 'g'] },
  ];

  const routes: Record<string, string> = {
    h: '/home',
    a: '/audit',
    u: '/sys-users',
    g: '/groups',
  };

  let pending = false;
  let pendingTimer: any = null;

  function isTyping(el: any): boolean {
    if (!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || el.isContentEditable;
  }

  function onKey(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (isTyping(e.target)) return;
    if (visible.value && e.key === 'Escape') {
      visible.value = false;
      return;
    }
    if (e.key === '?') {
      e.preventDefault();
      visible.value = !visible.value;
      return;
    }
    if (pending) {
      const path = routes[e.key.toLowerCase()];
      pending = false;
      clearTimeout(pendingTimer);
      if (path) {
        e.preventDefault();
        router.push(path);
      }
      return;
    }
    if (e.key === 'g') {
      pending = true;
      pendingTimer = setTimeout(() => (pending = false), 1200);
    }
  }

  onMounted(() => window.addEventListener('keydown', onKey));
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKey);
    clearTimeout(pendingTimer);
  });
</script>

<style lang="less" scoped>
  .gk {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .gk__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12.5px;
    color: var(--g-text);
  }

  .gk__keys {
    display: flex;
    gap: 4px;
  }

  kbd {
    min-width: 20px;
    padding: 2px 6px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    color: var(--g-text-sub);
    text-align: center;
    background: var(--g-chip-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 5px;
  }

  .gk__tip {
    margin: 6px 0 0;
    font-size: 11.5px;
    color: var(--g-text-mute);
  }
</style>
