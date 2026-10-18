<template>
  <section :class="[prefixCls, 'db-card']">
    <header class="db-card__head">
      <span class="db-card__mark"></span>
      <div class="db-card__title-wrap">
        <div class="db-card__title" :title="card.title">{{ card.title }}</div>
        <div v-if="card.desc" class="db-card__desc">{{ card.desc }}</div>
      </div>
      <div class="db-card__meta">
        <span class="db-card__cnt">{{ innerValue.length }} 条</span>
        <a-tooltip title="重新读取">
          <span class="db-card__act" @click="() => emit('redo', form)">
            <Icon icon="ant-design:redo" :size="13" />
          </span>
        </a-tooltip>
      </div>
    </header>

    <div class="db-card__body">
      <a-spin :spinning="form.loading">
        <div class="af-list">
          <div v-for="(val, idx) of innerValue" :key="idx" class="af-row">
            <span class="af-idx">{{ pad(idx + 1) }}</span>
            <a-input v-model:value="innerValue[idx]" :placeholder="`第 ${idx + 1} 项`" />
            <a-popconfirm v-if="card.allowDel" title="确定要删除吗？" @confirm="() => onRemove(idx)">
              <a-button danger type="text" class="af-del">
                <Icon icon="ant-design:delete" :size="14" />
              </a-button>
            </a-popconfirm>
          </div>
          <div v-if="!innerValue.length" class="af-empty">暂无条目</div>
        </div>

        <a-button v-if="card.allowAdd" class="af-add" type="dashed" block pre-icon="ant-design:plus" @click="onAdd">
          {{ addBtnText }}
        </a-button>

        <footer class="db-card__foot">
          <span class="db-card__foot-left">{{ limitText }}</span>
          <a-button type="primary" pre-icon="ant-design:save" :loading="form.loading" @click="onSubmit">保存</a-button>
        </footer>
      </a-spin>
    </div>
  </section>
</template>

<script lang="ts">
  import type { PropType } from 'vue';
  import { defineComponent, ref, watch, computed } from 'vue';
  import type { IConfigCard, FormType } from '../types';
  import { propTypes } from '/@/utils/propTypes';
  import Icon from '/@/components/Icon';
  import { useDesign } from '/@/hooks/web/useDesign';
  import { useMessage } from '/@/hooks/web/useMessage';

  export default defineComponent({
    name: 'ArrayForm',
    components: { Icon },
    props: {
      card: propTypes.object.isRequired.type as PropType<IConfigCard>,
      form: propTypes.object.isRequired.type as PropType<FormType>,
      value: propTypes.array.def(() => []),
    },
    emits: ['redo', 'submit'],
    setup(props, { emit }) {
      const { prefixCls } = useDesign('array-form');
      const { createMessage } = useMessage();

      const innerValue = ref<any[]>(props.value);
      const addBtnText = computed(() => props.card?.addBtnText ?? '新增条目');

      const limitText = computed(() => {
        const { lengthMin, lengthMax } = props.card ?? {};
        if (lengthMin != null && lengthMax != null) return `允许 ${lengthMin} ~ ${lengthMax} 项`;
        if (lengthMin != null) return `至少保留 ${lengthMin} 项`;
        if (lengthMax != null) return `最多 ${lengthMax} 项`;
        return '数组型配置，逐条填写';
      });

      watch(
        () => props.value,
        () => (innerValue.value = props.value),
      );

      function pad(n: number) {
        return String(n).padStart(2, '0');
      }

      function onAdd() {
        let lengthMax = props.card?.lengthMax;
        if (lengthMax != null && innerValue.value.length >= lengthMax) {
          createMessage.warn(`最多只能添加${lengthMax}个`);
          return;
        }
        innerValue.value.push('');
      }

      function onRemove(idx) {
        let lengthMin = props.card?.lengthMin;
        if (lengthMin != null && innerValue.value.length <= lengthMin) {
          createMessage.warn(`至少要留${lengthMin}个`);
          return;
        }
        innerValue.value.splice(idx, 1);
      }

      function onSubmit() {
        if (!props.form?.actions) {
          props.form!.actions = { validate } as any;
        }
        emit('submit', props.form);
      }

      async function validate() {
        return innerValue.value.filter((v) => !(v == null || v == ''));
      }

      return {
        emit,
        prefixCls,
        innerValue,
        addBtnText,
        limitText,
        pad,
        onAdd,
        onRemove,
        onSubmit,
      };
    },
  });
</script>

<style lang="less" scoped>
  //noinspection LessUnresolvedVariable
  @prefix-cls: ~'@{namespace}-array-form';

  .@{prefix-cls} {
    .af-list {
      margin-bottom: 10px;
    }

    .af-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .af-row + .af-row {
      margin-top: 8px;
    }

    .af-idx {
      flex: none;
      width: 22px;
      font-size: 10.5px;
      font-variant-numeric: tabular-nums;
      color: var(--g-text-mute);
      text-align: center;
    }

    .af-del {
      flex: none;
      width: 30px;
      height: 30px;
      padding: 0;
    }

    .af-empty {
      padding: 18px 0;
      font-size: 12px;
      color: var(--g-text-mute);
      text-align: center;
      background: var(--g-card-bg-soft);
      border: 1px dashed var(--g-card-border);
      border-radius: 10px;
    }

    .af-add {
      height: 34px;
      font-size: 12.5px;
      color: var(--g-text-sub);
      background: transparent;
      border-color: var(--g-card-border);
    }

    .af-add:hover {
      color: var(--g-blue);
      border-color: var(--g-blue);
    }

    :deep(.ant-input) {
      background: var(--g-card-bg-soft);
      border-color: var(--g-card-border);
    }

    :deep(.ant-input:focus) {
      border-color: var(--g-blue);
      box-shadow: none;
    }
  }
</style>
