<template>
  <Select
    :value="modelValue"
    :options="options"
    :size="size"
    :placeholder="placeholder"
    :allow-clear="clearable"
    :show-search="searchable"
    :option-filter-prop="optionFilterProp"
    :filter-option="filterOption"
    :loading="loading"
    :disabled="disabled"
    :mode="mode"
    :status="status"
    :style="{ width }"
    class="g-select"
    @update:value="onChange"
    @search="(v: string) => emit('search', v)"
    @dropdown-visible-change="(v: boolean) => emit('open', v)"
  >
    <template #notFoundContent>
      <div class="g-select__empty">
        <slot name="empty">
          <Icon icon="ant-design:inbox-outlined" :size="15" />
          <span>{{ emptyText }}</span>
        </slot>
      </div>
    </template>
  </Select>
</template>

<script setup lang="ts">
  import { Select } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';

  /**
   * GSelect —— 统一选择器
   *
   * 与原生 Select 的差别：
   *  - 默认 `allowClear` + 空态文案（不再是一行英文 No Data）
   *  - 尺寸 / 圆角 / 下拉面板由 guoba-controls.less 统一接管
   *  - `width` 一次说清，不再各页写 w-150 / style
   *
   *   <GSelect v-model:value="query.sort" :options="sortOptions" width="150px" @change="reload" />
   */
  defineOptions({ name: 'GSelect' });

  withDefaults(
    defineProps<{
      modelValue?: any;
      options?: any[];
      size?: 'small' | 'middle' | 'large';
      placeholder?: string;
      width?: string;
      clearable?: boolean;
      searchable?: boolean;
      optionFilterProp?: string;
      /** 自定义搜索匹配（需要匹配 label 以外的字段时传） */
      filterOption?: (input: string, option: any) => boolean;
      loading?: boolean;
      disabled?: boolean;
      mode?: 'multiple' | 'tags';
      status?: 'error' | 'warning';
      emptyText?: string;
    }>(),
    {
      options: () => [],
      size: 'middle',
      placeholder: '请选择',
      width: '100%',
      clearable: true,
      searchable: false,
      optionFilterProp: 'label',
      loading: false,
      disabled: false,
      emptyText: '暂无可选项',
    },
  );

  const emit = defineEmits<{
    (e: 'update:modelValue', v: any): void;
    (e: 'change', v: any): void;
    (e: 'search', v: string): void;
    (e: 'open', v: boolean): void;
  }>();

  function onChange(v: any) {
    emit('update:modelValue', v);
    emit('change', v);
  }
</script>

<style scoped lang="less">
  .g-select__empty {
    display: flex;
    gap: 6px;
    align-items: center;
    justify-content: center;
    padding: 12px 4px;
    font-size: 12px;
    color: var(--g-text-mute);
  }
</style>
