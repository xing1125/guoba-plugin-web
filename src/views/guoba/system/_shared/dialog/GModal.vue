<template>
  <Modal
    :visible="visible"
    :width="pxWidth"
    centered
    :footer="null"
    :closable="false"
    :mask-closable="maskClosable"
    :destroy-on-close="destroyOnClose"
    wrap-class-name="g-modal-wrap"
    @cancel="close"
  >
    <div class="g-modal">
      <header class="g-modal__head">
        <div class="g-modal__titles">
          <div v-if="eyebrow" class="g-modal__eyebrow">{{ eyebrow }}</div>
          <div class="g-modal__title" :title="title">{{ title }}</div>
          <div v-if="subtitle" class="g-modal__sub" :title="subtitle">{{ subtitle }}</div>
        </div>

        <div class="g-modal__tools">
          <slot name="tools" />
          <button class="g-modal__close" type="button" aria-label="关闭" @click="close">
            <Icon icon="ant-design:close-outlined" :size="13" />
          </button>
        </div>
      </header>

      <div class="g-modal__body" :style="{ maxHeight: bodyHeight }">
        <slot />
      </div>

      <footer v-if="$slots.footer" class="g-modal__foot">
        <span v-if="footerHint" class="g-modal__hint">{{ footerHint }}</span>
        <slot name="footer" />
      </footer>
    </div>
  </Modal>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { Modal } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';

  /**
   * GModal —— 后台统一「居中弹窗」
   *
   * 规范（见 docs/design-spec.md）：
   *  - 详情、记录、确认、轻表单 → 一律居中弹窗，禁止右侧抽屉
   *  - 宽度四档：sm 440 / md 600 / lg 760 / xl 920，默认 md
   *  - 头部 = eyebrow + 标题 + 副标题 + 右上工具位（#tools）+ 关闭
   *  - body 独立滚动（默认 62vh 上限），头尾常驻；滚动条细轨、不顶到圆角
   *  - 遮罩点击默认不关闭；ESC 关闭；`prefers-reduced-motion` 下关闭动效
   *
   * 用法：
   *   <GModal v-model:visible="open" title="用户详情" subtitle="wxid_xxx" size="lg" footer-hint="ESC 关闭">
   *     ...
   *     <template #tools><Button size="small">导出</Button></template>
   *     <template #footer>
   *       <Button @click="open = false">关闭</Button>
   *       <Button type="primary">保存</Button>
   *     </template>
   *   </GModal>
   */

  defineOptions({ name: 'GModal' });

  const props = defineProps({
    visible: { type: Boolean, default: false },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    eyebrow: { type: String, default: '' },
    /** 四档宽度，或直接传数字 */
    size: { type: String, default: 'md' },
    bodyHeight: { type: String, default: '62vh' },
    /** footer 左侧弱化提示，如「ESC 关闭」「共 128 条」 */
    footerHint: { type: String, default: '' },
    maskClosable: { type: Boolean, default: false },
    destroyOnClose: { type: Boolean, default: true },
  });

  const emit = defineEmits(['close', 'update:visible']);

  const WIDTHS: Record<string, number> = { sm: 440, md: 600, lg: 760, xl: 920 };

  const pxWidth = computed(() => {
    const n = Number(props.size);
    if (!Number.isNaN(n) && n > 0) return n;
    return WIDTHS[props.size] ?? WIDTHS.md;
  });

  function close() {
    emit('update:visible', false);
    emit('close');
  }
</script>

<style scoped lang="less">
  .g-modal {
    display: flex;
    flex-direction: column;
    max-height: 86vh;
    overflow: hidden;
  }

  /* ------------------------------ 头部 ------------------------------ */

  .g-modal__head {
    display: flex;
    gap: 16px;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--g-card-border);
  }

  .g-modal__titles {
    min-width: 0;
    flex: 1;
  }

  .g-modal__eyebrow {
    margin-bottom: 5px;
    font-size: 10px;
    font-weight: 600;
    line-height: 1;
    color: var(--g-text-mute);
    letter-spacing: 0.14em;
  }

  .g-modal__title {
    overflow: hidden;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.35;
    color: var(--g-text);
    letter-spacing: -0.01em;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .g-modal__sub {
    margin-top: 4px;
    overflow: hidden;
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 11.5px;
    line-height: 1.4;
    color: var(--g-text-mute);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .g-modal__tools {
    display: flex;
    flex: 0 0 auto;
    gap: 8px;
    align-items: center;
  }

  .g-modal__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    color: var(--g-text-mute);
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    transition: color 0.16s ease, background 0.16s ease, border-color 0.16s ease;

    &:hover {
      color: var(--g-text);
      background: var(--g-chip-bg);
      border-color: var(--g-card-border);
    }

    &:active {
      transform: scale(0.96);
    }

    &:focus-visible {
      outline: 2px solid var(--g-blue);
      outline-offset: 1px;
    }
  }

  /* ------------------------------ 主体 ------------------------------ */

  .g-modal__body {
    /* flex-basis 用 auto：内容少时按内容高度，内容多时在 max-height 内滚动 */
    flex: 1 1 auto;
    min-height: 0;
    padding: 18px 20px;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: var(--g-track) transparent;

    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--g-track);
      background-clip: content-box;
      border: 2px solid transparent;
      border-radius: 8px;
    }

    &::-webkit-scrollbar-thumb:hover {
      background: var(--g-card-border-strong);
      background-clip: content-box;
    }
  }

  /* ------------------------------ 底部 ------------------------------ */

  .g-modal__foot {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: flex-end;
    padding: 12px 20px;
    background: var(--g-card-bg-soft);
    border-top: 1px solid var(--g-card-border);

    :deep(.ant-btn) {
      min-width: 64px;
      height: 32px;
      border-radius: 8px;
      font-size: 12.5px;
    }
  }

  .g-modal__hint {
    margin-right: auto;
    font-size: 11px;
    color: var(--g-text-mute);
    letter-spacing: 0.02em;
  }

  /* ------------------------------ 容器外观 ------------------------------ */

  :global(.g-modal-wrap .ant-modal),
  :global(.g-modal-wrap .ant-zoom-enter-active),
  :global(.g-modal-wrap .ant-zoom-appear-active) {
    animation: g-modal-rise 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  :global(.g-modal-wrap .ant-modal-content) {
    padding: 0;
    overflow: hidden;
    background: var(--g-card-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 16px;
    box-shadow:
      0 32px 72px -28px rgb(12 30 52 / 46%),
      0 3px 10px rgb(12 30 52 / 8%);
  }

  :global(.g-modal-wrap .ant-modal-body) {
    padding: 0;
  }

  /* mask 是 .ant-modal-wrap 的兄弟节点，不在 wrap 内，只能全局命中 */
  :global(.ant-modal-mask) {
    backdrop-filter: blur(2px);
  }

  @keyframes g-modal-rise {
    from {
      opacity: 0;
      transform: translateY(6px) scale(0.985);
    }

    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.g-modal-wrap .ant-modal),
    :global(.g-modal-wrap .ant-zoom-enter-active),
    :global(.g-modal-wrap .ant-zoom-appear-active) {
      animation: none;
    }
  }
</style>
