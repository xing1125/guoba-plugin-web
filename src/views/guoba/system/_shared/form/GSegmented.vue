<template>
  <div class="g-seg" :class="{ 'g-seg--sm': size === 'sm' }" role="tablist" :aria-label="label">
    <button
      v-for="o in normalized"
      :key="String(o.value)"
      type="button"
      role="tab"
      class="g-seg__item"
      :class="{ 'is-active': o.value === modelValue }"
      :aria-selected="o.value === modelValue"
      :disabled="o.disabled"
      @click="pick(o)"
    >
      {{ o.label }}
      <span v-if="o.count !== undefined && o.count !== null" class="g-seg__count">{{ o.count }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  /**
   * GSegmented —— 分段切换
   *
   * 收编原先散落在各页的 `.gm-seg` 手写结构：选项更规范（label / count / disabled），
   * 支持键盘 Tab 聚焦与 aria-selected，样式见 guoba-controls.less §10。
   *
   *   <GSegmented v-model:value="tab" :options="[{ value: 'a', label: '概览' }, { value: 'b', label: '明细', count: 12 }]" />
   *
   * 注意：切换后需要重新拉数据的场景，用 @change 触发（不要只依赖 v-model 的 watch）。
   */
  defineOptions({ name: 'GSegmented' });

  export interface SegOption {
    value: string | number;
    label: string;
    count?: number | string;
    disabled?: boolean;
  }

  const props = withDefaults(
    defineProps<{
      modelValue: string | number;
      options: SegOption[];
      size?: 'sm' | 'md';
      /** 无障碍标签，如「数据视图」 */
      label?: string;
    }>(),
    { size: 'md', label: '' },
  );

  const emit = defineEmits<{
    (e: 'update:modelValue', v: string | number): void;
    (e: 'change', v: string | number): void;
  }>();

  const normalized = computed(() => props.options || []);

  function pick(o: SegOption) {
    if (o.disabled || o.value === props.modelValue) return;
    emit('update:modelValue', o.value);
    emit('change', o.value);
  }
</script>
