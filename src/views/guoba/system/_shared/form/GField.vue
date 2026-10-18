<template>
  <div class="g-field" :class="{ 'is-error': !!error }">
    <label v-if="label || $slots.label" class="g-field__label">
      <slot name="label">{{ label }}</slot>
      <span v-if="required" class="g-field__req">*</span>
      <span v-if="extra" class="g-field__extra">{{ extra }}</span>
    </label>

    <slot />

    <div v-if="error" class="g-field__error">{{ error }}</div>
    <div v-else-if="hint" class="g-field__hint">{{ hint }}</div>
  </div>
</template>

<script setup lang="ts">
  /**
   * GField —— 表单行容器
   *
   * label（必填星号 + 右侧补充说明）+ 控件 + hint / error 三段式，
   * 替代各页自己写的 div+label 与 antd FormItem（轻表单场景不引 Form 实例）。
   *
   *   <GField label="显示名称" required hint="仅用于后台展示">
   *     <Input v-model:value="model.name" />
   *   </GField>
   */
  defineOptions({ name: 'GField' });

  withDefaults(
    defineProps<{
      label?: string;
      required?: boolean;
      /** label 右侧的弱化补充，如「可选」「最多 32 字」 */
      extra?: string;
      hint?: string;
      error?: string;
    }>(),
    { label: '', required: false, extra: '', hint: '', error: '' },
  );
</script>
