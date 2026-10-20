<template>
  <div v-if="type !== 'textarea'" class="gc-input" :class="[`gc-${size}`, { 'is-disabled': disabled, 'is-error': status === 'error', 'is-focused': focused }]" :style="{ width }">
    <span v-if="loading || $slots.prefix" class="gc-input__fix gc-input__prefix">
      <LoadingOutlined v-if="loading" spin />
      <slot v-else name="prefix" />
    </span>

    <input
      class="gc-input__inner"
      :type="showType"
      :value="innerValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxlength"
      spellcheck="false"
      @input="onInput"
      @compositionstart="composing = true"
      @compositionend="onComposeEnd"
      @keydown.enter="emit('press-enter', innerValue)"
      @focus="focused = true"
      @blur="focused = false"
    />

    <span v-if="showClear" class="gc-input__fix gc-input__clear" role="button" tabindex="-1" @mousedown.prevent @click="clear">
      <svg viewBox="0 0 12 12" width="9" height="9">
        <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none" />
      </svg>
    </span>

    <!-- 密码框的眼睛与清除钮可以并存：有值时先清除钮、后眼睛，否则打完字就看不到明文切换了 -->
    <span v-if="type === 'password'" class="gc-input__fix gc-input__eye" role="button" tabindex="-1" @mousedown.prevent @click="visible = !visible">
      <svg v-if="visible" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4">
        <path d="M1.5 8s2.4-4.2 6.5-4.2S14.5 8 14.5 8 12.1 12.2 8 12.2 1.5 8 1.5 8z" />
        <circle cx="8" cy="8" r="2" />
      </svg>
      <svg v-else viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4">
        <path d="M1.5 8s2.4-4.2 6.5-4.2S14.5 8 14.5 8 12.1 12.2 8 12.2 1.5 8 1.5 8z" />
        <path d="M3 13L13 3" stroke-linecap="round" />
      </svg>
    </span>

    <span v-if="$slots.suffix" class="gc-input__fix gc-input__suffix"><slot name="suffix" /></span>
  </div>

  <textarea
    v-else
    class="gc-input gc-textarea"
    :class="{ 'is-disabled': disabled, 'is-error': status === 'error', 'is-focused': focused }"
    :style="{ width }"
    :value="innerValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows"
    spellcheck="false"
    @input="onInput"
    @compositionstart="composing = true"
    @compositionend="onComposeEnd"
    @focus="focused = true"
    @blur="focused = false"
  />
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { LoadingOutlined } from '@ant-design/icons-vue';

  /**
   * GInput —— 自研输入框（替代 antd Input / Input.Password / Textarea）
   *
   *   <GInput v-model="name" placeholder="…" :maxlength="32" />
   *   <GInput v-model="pwd" type="password" />
   *   <GInput v-model="desc" type="textarea" :rows="4" />
   *
   * 交互：中文输入法组字期间不回写 model；有值出现清除钮；密码框自带可见切换；
   * 禁用 / 错误态 / 尺寸（sm 28 / 默认 32 / lg 38）由 guoba-controls.less §11 统一。
   */
  defineOptions({ name: 'GInput' });

  const props = withDefaults(
    defineProps<{
      modelValue?: string | number;
      type?: 'text' | 'password' | 'textarea';
      placeholder?: string;
      size?: 'sm' | 'md' | 'lg';
      width?: string;
      maxlength?: number;
      rows?: number;
      disabled?: boolean;
      clearable?: boolean;
      loading?: boolean;
      status?: '' | 'error' | 'warning';
    }>(),
    {
      modelValue: '',
      type: 'text',
      placeholder: '',
      size: 'md',
      width: '100%',
      maxlength: undefined,
      rows: 3,
      disabled: false,
      clearable: true,
      loading: false,
      status: '',
    },
  );

  const emit = defineEmits<{
    (e: 'update:modelValue', v: string): void;
    (e: 'press-enter', v: string): void;
  }>();

  const composing = ref(false);
  const focused = ref(false);
  const visible = ref(false);

  const innerValue = computed(() => (props.modelValue === undefined || props.modelValue === null ? '' : String(props.modelValue)));
  const showType = computed(() => (props.type === 'password' ? (visible.value ? 'text' : 'password') : 'text'));
  const showClear = computed(() => props.clearable && !props.disabled && props.type !== 'textarea' && innerValue.value.length > 0);

  function commit(v: string) {
    emit('update:modelValue', v);
  }

  function onInput(ev: Event) {
    const v = (ev.target as HTMLInputElement).value;
    if (!composing.value) commit(v);
  }

  /** 组字结束：把最终结果回写（composing 期间 input 事件被跳过） */
  function onComposeEnd(ev: CompositionEvent) {
    composing.value = false;
    commit((ev.target as HTMLInputElement).value);
  }

  function clear() {
    commit('');
  }
</script>
