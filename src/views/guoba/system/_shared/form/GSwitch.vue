<template>
  <button type="button" role="switch" class="gc-switch" :class="[`gc-${size}`, { 'is-checked': checked, 'is-disabled': disabled }]" :aria-checked="checked" :disabled="disabled" @click="toggle">
    <span v-if="checkedLabel && checked" class="gc-switch__text">{{ checkedLabel }}</span>
    <span v-else-if="uncheckedLabel && !checked" class="gc-switch__text">{{ uncheckedLabel }}</span>
    <span class="gc-switch__knob" />
  </button>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  /**
   * GSwitch —— 自研开关（替代 antd Switch）
   *
   *   <GSwitch v-model="on" checked-label="启用" unchecked-label="停用" />
   */
  defineOptions({ name: 'GSwitch' });

  const props = withDefaults(
    defineProps<{
      modelValue?: boolean;
      disabled?: boolean;
      size?: 'sm' | 'md';
      checkedLabel?: string;
      uncheckedLabel?: string;
    }>(),
    { modelValue: false, disabled: false, size: 'md', checkedLabel: '', uncheckedLabel: '' },
  );

  const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'change', v: boolean): void }>();

  const checked = computed(() => !!props.modelValue);

  function toggle() {
    if (props.disabled) return;
    emit('update:modelValue', !checked.value);
    emit('change', !checked.value);
  }
</script>
