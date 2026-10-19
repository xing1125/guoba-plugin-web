<template>
  <div class="g-tags">
    <a-tooltip v-for="tag in tags" :key="tag" :title="tag.length > 20 ? tag : ''">
      <a-tag class="g-tags__item" closable @close="handleClose(tag)">
        {{ tag.length > 20 ? `${tag.slice(0, 20)}...` : tag }}
      </a-tag>
    </a-tooltip>
    <a-input
      v-if="inputVisible"
      ref="inputRef"
      v-model:value="inputValue"
      class="g-tags__input"
      type="text"
      size="small"
      @blur="handleInputConfirm"
      @keyup.enter="handleInputConfirm"
    />
    <span v-else class="g-tags__add" @click="showInput">
      <icon icon="ant-design:plus" :size="11" />
      新增
    </span>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, watch, reactive, toRefs, nextTick } from 'vue';
  import { propTypes } from '/@/utils/propTypes';
  import { usePrompt } from '/@/components/Guoba';

  export default defineComponent({
    name: 'GTags',
    inheritAttrs: false,
    props: {
      value: propTypes.array.def(() => []),
      // 允许新增
      allowAdd: propTypes.bool.def(false),
      // 允许删除
      allowDel: propTypes.bool.def(false),
      // 是否是弹出输入框
      showPrompt: propTypes.bool.def(false),
      // 弹出配置
      promptProps: propTypes.object.def(() => ({})),
      // 值格式化方法
      valueFormatter: propTypes.oneOfType([propTypes.func, propTypes.string]),
    },
    emits: ['change'],
    setup(props, { emit }) {
      const { createPrompt } = usePrompt();
      const inputRef = ref();

      const state = reactive({
        tags: [] as string[],
        inputVisible: false,
        inputValue: '',
      });

      watch(
        () => props.value,
        (val: Nullable<string[]>) => {
          if (val == null) {
            state.tags = [];
          } else {
            state.tags = val;
          }
        },
        { immediate: true },
      );

      function showInput() {
        if (props.showPrompt) {
          createPrompt({
            title: '添加',
            required: true,
            ...props.promptProps,
            onOk(value) {
              state.inputValue = value;
              handleInputConfirm();
            },
          });
        } else {
          state.inputVisible = true;
          nextTick(() => {
            inputRef.value.focus();
          });
        }
      }

      function handleInputConfirm() {
        const inputValue = state.inputValue;
        let tags = state.tags;
        if (inputValue && tags.indexOf(inputValue) === -1) {
          tags = [...tags, formatter(inputValue)];
        }
        Object.assign(state, {
          tags,
          inputVisible: false,
          inputValue: '',
        });
        onChange();
      }

      function formatter(value) {
        if (props.valueFormatter) {
          if (typeof props.valueFormatter === 'function') {
            props.valueFormatter(value);
          } else {
            return new Function(`return ${props.valueFormatter}`)()(value);
          }
        }
        return value;
      }

      function handleClose(removedTag: string) {
        state.tags = state.tags.filter((tag) => tag !== removedTag);
        onChange();
      }

      function onChange() {
        emit('change', state.tags);
      }

      return {
        ...toRefs(state),
        handleClose,
        showInput,
        handleInputConfirm,
        inputRef,
      };
    },
  });
</script>

<style scoped lang="less">
  /* 标签型列表：深色下不再是一块白底（原来写死 background:#fff） */
  .g-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    min-height: 32px;
  }

  .g-tags__item {
    margin: 0;
  }

  .g-tags__input {
    width: 88px;
    height: 24px;
  }

  .g-tags__add {
    display: inline-flex;
    gap: 3px;
    align-items: center;
    height: 24px;
    padding: 0 10px;
    font-size: 12px;
    color: var(--g-text-sub);
    cursor: pointer;
    background: var(--g-card-bg-soft);
    border: 1px dashed var(--g-card-border-strong);
    border-radius: 6px;
    transition: color 0.18s, border-color 0.18s, background 0.18s;

    &:hover {
      color: var(--g-blue);
      background: var(--g-blue-soft);
      border-color: var(--g-blue);
    }
  }
</style>
