<template>
  <GInput
    :model-value="modelValue"
    type="text"
    :size="gcSize"
    :placeholder="placeholder"
    :width="width"
    :loading="loading"
    :clearable="clearable"
    :disabled="disabled"
    @update:model-value="onInput"
    @press-enter="emitSearch"
  >
    <template v-if="!loading" #prefix>
      <Icon icon="ant-design:search-outlined" :size="13" />
    </template>
  </GInput>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { Icon } from '/@/components/Icon';
  import GInput from './GInput.vue';

  /**
   * GSearch —— 列表页搜索框（GInput 的搜索形态）
   *
   * 统一外观：前缀搜索图标 / 清除即回收结果 / 回车触发 / loading 转圈。
   *
   *   <GSearch v-model="query.keyword" placeholder="搜索昵称 / ID" @search="reload" />
   */
  defineOptions({ name: 'GSearch' });

  const props = withDefaults(
    defineProps<{
      modelValue?: string;
      placeholder?: string;
      /** 兼容旧用法（small/middle/large）与 gc 尺寸（sm/md/lg） */
      size?: 'small' | 'middle' | 'large' | 'sm' | 'md' | 'lg';
      width?: string;
      loading?: boolean;
      clearable?: boolean;
      disabled?: boolean;
    }>(),
    {
      modelValue: '',
      placeholder: '搜索',
      size: 'middle',
      width: '240px',
      loading: false,
      clearable: true,
      disabled: false,
    },
  );

  const emit = defineEmits<{
    (e: 'update:modelValue', v: string): void;
    (e: 'search', v: string): void;
  }>();

  const gcSize = computed(() => {
    const s = props.size;
    if (s === 'small' || s === 'sm') return 'sm';
    if (s === 'large' || s === 'lg') return 'lg';
    return 'md';
  });

  function onInput(v: string) {
    const val = v ?? '';
    emit('update:modelValue', val);
    // 清空即回收结果，不用再按回车
    if (!val) emit('search', '');
  }

  function emitSearch() {
    emit('search', props.modelValue || '');
  }
</script>
