<template>
  <Modal
    :visible="visible"
    centered
    :title="title"
    :width="width"
    :confirm-loading="loading"
    :ok-text="okText"
    :cancel-text="cancelText"
    :ok-button-props="{ danger }"
    :mask-closable="false"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <div class="gfm-body">
      <div v-if="content" class="gfm-content" :class="{ 'gfm-content--danger': danger }">
        {{ content }}
      </div>
      <slot />
      <div v-if="hint" class="gfm-hint">{{ hint }}</div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
  import { Modal } from 'ant-design-vue';

  /**
   * GConfirmModal —— 危险操作确认弹窗（受控组件）
   *
   * 用法：
   *   <GConfirmModal v-model:visible="visible" title="清空活跃榜" content="将对 N 个群清空..."
   *                  danger hint="该操作不可撤销" :loading="doing" @ok="doIt" />
   *
   * danger=true 时确认按钮为红色（破坏性操作分级约定：改配置=普通，删数据=danger）
   */

  defineOptions({ name: 'GConfirmModal' });

  const props = defineProps({
    visible: { type: Boolean, default: false },
    title: { type: String, default: '确认操作' },
    content: { type: String, default: '' },
    hint: { type: String, default: '' },
    danger: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    okText: { type: String, default: '确认' },
    cancelText: { type: String, default: '取消' },
    width: { type: Number, default: 460 },
  });

  const emit = defineEmits(['ok', 'cancel', 'update:visible']);

  function handleOk() {
    emit('ok');
  }

  function handleCancel() {
    emit('cancel');
    emit('update:visible', false);
  }
</script>

<style scoped lang="less">
  .gfm-body {
    padding: 2px 0;
  }

  .gfm-content {
    font-size: 14px;
    line-height: 1.7;
    color: var(--g-text);
    white-space: pre-wrap;
  }

  .gfm-content--danger {
    padding: 10px 14px;
    background: rgb(255 87 34 / 8%);
    border: 1px solid rgb(255 87 34 / 30%);
    border-radius: 8px;
  }

  .gfm-hint {
    margin-top: 10px;
    font-size: 12px;
    color: var(--g-text-mute);
  }
</style>
