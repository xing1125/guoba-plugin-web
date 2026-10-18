<template>
  <Input
    :value="modelValue"
    :size="size"
    :placeholder="placeholder"
    :allow-clear="clearable"
    :disabled="disabled"
    class="g-input-search"
    :style="{ width }"
    @update:value="onInput"
    @press-enter="emitSearch"
  >
    <template #prefix>
      <LoadingOutlined v-if="loading" spin />
      <Icon v-else icon="ant-design:search-outlined" />
    </template>
  </Input>
</template>

<script setup lang="ts">
  import { Input } from 'ant-design-vue';
  import { LoadingOutlined } from '@ant-design/icons-vue';
  import { Icon } from '/@/components/Icon';

  /**
   * GSearch —— 列表页搜索框
   *
   * 统一外观（前缀搜索图标 / 清除 / 回车触发 / loading 态），
   * 样式见 design/guoba-controls.less §7。
   *
   *   <GSearch v-model:value="query.keyword" placeholder="搜索昵称 / ID" @search="reload" />
   */
  defineOptions({ name: 'GSearch' });

  const props = withDefaults(
    defineProps<{
      modelValue?: string;
      placeholder?: string;
      size?: 'small' | 'middle' | 'large';
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
