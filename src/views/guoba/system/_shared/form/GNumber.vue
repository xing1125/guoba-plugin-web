<template>
  <span class="gc-num" :class="[`gc-${size}`, { 'is-disabled': disabled, 'is-error': status === 'error' }]" :style="{ width }">
    <input
      class="gc-num__inner"
      type="text"
      inputmode="numeric"
      :value="draft"
      :disabled="disabled"
      :placeholder="placeholder"
      spellcheck="false"
      @input="onInput"
      @focus="focused = true"
      @blur="onBlur"
      @keydown.up.prevent="stepBy(step)"
      @keydown.down.prevent="stepBy(-step)"
      @keydown.enter="onBlur"
    />
    <span v-if="!disabled" class="gc-num__handlers">
      <button type="button" class="gc-num__btn" tabindex="-1" :disabled="reachedMax" @mousedown.prevent @click="stepBy(step)">
        <svg viewBox="0 0 10 6" width="9" height="5">
          <path d="M1 5l4-4 4 4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" />
        </svg>
      </button>
      <button type="button" class="gc-num__btn" tabindex="-1" :disabled="reachedMin" @mousedown.prevent @click="stepBy(-step)">
        <svg viewBox="0 0 10 6" width="9" height="5">
          <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" />
        </svg>
      </button>
    </span>
  </span>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue';

  /**
   * GNumber —— 自研数字输入（替代 antd InputNumber）
   *
   *   <GNumber v-model="ttl" :min="-1" :max="2592000" :step="60" />
   *
   * 编辑态允许随手打字（草稿值），失焦 / 回车 / 上下键时才 clamp 回 [min, max]；
   * 步进按钮 hover 才显形（guoba-controls.less §11）。
   */
  defineOptions({ name: 'GNumber' });

  const props = withDefaults(
    defineProps<{
      modelValue?: number | string | null;
      min?: number;
      max?: number;
      step?: number;
      placeholder?: string;
      size?: 'sm' | 'md' | 'lg';
      width?: string;
      disabled?: boolean;
      status?: '' | 'error' | 'warning';
    }>(),
    {
      modelValue: null,
      min: -Infinity,
      max: Infinity,
      step: 1,
      placeholder: '',
      size: 'md',
      width: '100%',
      disabled: false,
      status: '',
    },
  );

  const emit = defineEmits<{ (e: 'update:modelValue', v: number | null): void }>();

  const draft = ref(format(props.modelValue));
  const focused = ref(false);

  function format(v: number | string | null | undefined) {
    if (v === null || v === undefined || v === '') return '';
    return String(v);
  }

  function toNum(v: string): number | null {
    const s = String(v).trim();
    if (!s || !/^-?\d*\.?\d+$/.test(s)) return null;
    return Number(s);
  }

  const reachedMax = computed(() => toNum(draft.value) !== null && Number(draft.value) >= props.max);
  const reachedMin = computed(() => toNum(draft.value) !== null && Number(draft.value) <= props.min);

  watch(
    () => props.modelValue,
    (v) => {
      if (!focused.value) draft.value = format(v);
    },
  );

  function clamp(n: number) {
    return Math.min(Math.max(n, props.min), props.max);
  }

  function commit(v: number | null) {
    draft.value = v === null ? '' : String(v);
    emit('update:modelValue', v);
  }

  function onBlur() {
    focused.value = false;
    const n = toNum(draft.value);
    if (n === null) {
      commit(null);
    } else {
      commit(clamp(n));
    }
  }

  function onInput(ev: Event) {
    draft.value = (ev.target as HTMLInputElement).value;
    const n = toNum(draft.value);
    if (n !== null && n >= props.min && n <= props.max) {
      emit('update:modelValue', n);
    }
  }

  function stepBy(delta: number) {
    const base = toNum(draft.value) ?? (props.min === -Infinity ? 0 : props.min > 0 ? props.min : Math.min(0, props.max));
    const next = clamp(Number((base + delta).toFixed(6)));
    commit(next);
  }
</script>
