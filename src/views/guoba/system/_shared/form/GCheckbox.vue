<template>
  <label class="gc-check" :class="{ 'is-disabled': disabled, 'is-checked': checked || indeterminate }">
    <input class="gc-check__native" type="checkbox" :checked="checked" :disabled="disabled" @change="onChange" />
    <span class="gc-check__box" :class="{ 'is-indet': indeterminate }" aria-hidden="true">
      <svg viewBox="0 0 12 12" width="9" height="9">
        <path d="M2 6.4L4.8 9 10 3.4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
    <span v-if="label || $slots.default" class="gc-check__label"
      ><slot>{{ label }}</slot></span
    >
  </label>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  /**
   * GCheckbox —— 自研复选框（替代 antd Checkbox）
   *
   *   <GCheckbox v-model="onlyKnown">只看已识别</GCheckbox>
   */
  defineOptions({ name: 'GCheckbox' });

  const props = withDefaults(
    defineProps<{
      modelValue?: boolean;
      label?: string;
      disabled?: boolean;
      /** 半选（父列表部分选中） */
      indeterminate?: boolean;
    }>(),
    { modelValue: false, label: '', disabled: false, indeterminate: false },
  );

  const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'change', v: boolean): void }>();

  const checked = computed(() => !!props.modelValue);

  function onChange(ev: Event) {
    const v = (ev.target as HTMLInputElement).checked;
    emit('update:modelValue', v);
    emit('change', v);
  }
</script>
