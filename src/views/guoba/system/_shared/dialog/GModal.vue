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
          <div class="g-modal__title">{{ title }}</div>
          <div v-if="subtitle" class="g-modal__sub">{{ subtitle }}</div>
        </div>
        <button class="g-modal__close" type="button" aria-label="关闭" @click="close">
          <Icon icon="ant-design:close-outlined" :size="14" />
        </button>
      </header>

      <div class="g-modal__body" :style="{ maxHeight: bodyHeight }">
        <slot />
      </div>

      <footer v-if="$slots.footer" class="g-modal__foot">
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
   *  - 头部 = eyebrow + 标题 + 副标题 + 右上关闭；底部按钮右对齐（次要左、主按钮右）
   *  - body 独立滚动（默认 62vh 上限），头部与底部常驻
   *  - 遮罩点击默认不关闭（maskClosable=false），避免填了一半误触丢失
   *
   * 用法：
   *   <GModal v-model:visible="open" title="用户详情" subtitle="wxid_xxx" size="lg">
   *     ...
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
    overflow: hidden;
    border-radius: 16px;
  }

  .g-modal__head {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 18px 20px 12px;
    border-bottom: 1px solid var(--g-card-border);
  }

  .g-modal__titles {
    min-width: 0;
  }

  .g-modal__eyebrow {
    margin-bottom: 3px;
    font-size: 10px;
    font-weight: 600;
    color: var(--g-text-mute);
    letter-spacing: 1.2px;
    text-transform: uppercase;
  }

  .g-modal__title {
    overflow: hidden;
    font-size: 15.5px;
    font-weight: 650;
    color: var(--g-text);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .g-modal__sub {
    margin-top: 3px;
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 11.5px;
    color: var(--g-text-mute);
    word-break: break-all;
  }

  .g-modal__close {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    margin-left: auto;
    color: var(--g-text-mute);
    cursor: pointer;
    background: var(--g-chip-bg);
    border: 1px solid transparent;
    border-radius: 8px;
    transition: color 0.15s ease, background 0.15s ease;

    &:hover {
      color: var(--g-text);
      background: var(--g-hover);
    }
  }

  .g-modal__body {
    padding: 16px 20px;
    overflow: auto;
  }

  .g-modal__foot {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding: 12px 20px 16px;
    background: var(--g-card-bg-soft);
    border-top: 1px solid var(--g-card-border);
  }

  /* 覆盖 antd 弹窗默认内边距，交给内部布局接管 */
  :global(.g-modal-wrap .ant-modal-content) {
    padding: 0;
    overflow: hidden;
    background: var(--g-card-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 16px;
    box-shadow: 0 24px 64px -20px rgb(8 20 34 / 42%);
  }

  :global(.g-modal-wrap .ant-modal-body) {
    padding: 0;
  }
</style>
