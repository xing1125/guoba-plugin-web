<template>
  <section :class="[prefixCls, 'db-card', { 'is-foldable': allowFold, 'is-folded': folded }]">
    <header class="db-card__head" @click="onClickTitle">
      <span class="db-card__mark"></span>
      <div class="db-card__title-wrap">
        <div class="db-card__title" :title="cardTitle">{{ cardTitle }}</div>
        <div v-if="card.desc" class="db-card__desc">{{ card.desc }}</div>
      </div>
      <div class="db-card__meta">
        <span v-if="fieldCount > 0" class="db-card__cnt">{{ fieldCount }} 项</span>
        <a-tooltip title="历史版本 / 对比 / 导出">
          <span class="db-card__act" @click.stop="onOpenVersion">
            <Icon :icon="$gm('clock')" :size="13" />
          </span>
        </a-tooltip>
        <a-tooltip title="重新读取">
          <span class="db-card__act" @click.stop="() => emit('redo', form)">
            <Icon :icon="$gm('redo')" :size="13" />
          </span>
        </a-tooltip>
        <a-tooltip v-if="allowFold" :title="folded ? '展开此配置块' : '收起此配置块'">
          <span class="db-card__act" @click.stop="onClickTitle">
            <Icon :icon="folded ? $gm('chevron-down') : $gm('chevron-up')" :size="12" />
          </span>
        </a-tooltip>
      </div>
    </header>

    <div v-show="!folded" class="db-card__body">
      <a-spin :spinning="form.loading">
        <BasicForm @register="form.register" />
        <footer class="db-card__foot">
          <span class="db-card__foot-left">{{ footHint }}</span>
          <a-popconfirm v-if="!isDefault && card.allowDel" title="确定要删除当前配置吗？" @confirm="onRemoveCard">
            <a-button danger :pre-icon="$gm('trash')">删除当前配置</a-button>
          </a-popconfirm>
          <a-button v-if="isDefault && card.allowAdd" :pre-icon="$gm('plus')" @click="onAddCard">
            {{ addBtnText }}
          </a-button>
          <a-button type="primary" :pre-icon="$gm('save')" :loading="form.loading" @click="onSubmit">
            保存
          </a-button>
        </footer>
      </a-spin>
    </div>

    <!-- 历史版本 / 对比 / 导出导入：首次点击才挂载，未用过的配置块不产生弹窗 DOM -->
    <ConfigVersionModal
      v-if="versionMounted"
      v-model:visible="versionVisible"
      :config-key="configKey"
      :card-title="cardTitle"
      @changed="onVersionChanged"
    />
  </section>
</template>

<script lang="ts">
  import type { PropType } from 'vue';
  import { computed, defineComponent, inject, ref, watch, provide } from 'vue';
  import type { IConfigCard, FormType } from '../types';
  import { propTypes } from '/@/utils/propTypes';
  import { BasicForm } from '/@/components/Form';
  import Icon from '/@/components/Icon';
  import { useDesign } from '/@/hooks/web/useDesign';
  import { usePrompt } from '/@/components/Guoba';
  import ConfigVersionModal from './ConfigVersionModal.vue';

  export default defineComponent({
    name: 'CardForm',
    components: { BasicForm, Icon, ConfigVersionModal },
    props: {
      card: propTypes.object.isRequired.type as PropType<IConfigCard>,
      form: propTypes.object.isRequired.type as PropType<FormType>,
      isDefault: propTypes.bool.def(false),
      // 允许折叠
      allowFold: propTypes.bool.def(false),
      // 默认折叠
      defaultFold: propTypes.bool.def(false),
    },
    emits: ['redo', 'submit', 'addCard', 'delCard'],
    setup(props, { emit }) {
      const { createPrompt } = usePrompt();
      const { prefixCls } = useDesign('card-form');

      // 由页面 provide 的折叠信号（驱动「展开/收起全部」）
      const foldSignal = inject<{ mode: 'expand' | 'collapse'; tick: number } | null>('cfgFoldSignal', null);
      const folded = ref<boolean>(!!props.defaultFold);

      watch(
        () => foldSignal?.tick,
        () => {
          if (foldSignal) {
            folded.value = foldSignal.mode === 'collapse';
          }
        },
      );

      const cardTitle = computed(() => decodeTitle(props.card!, props.form!));

      // 配置块 key（历史版本接口用）
      const configKey = computed(() => props.card?.key ?? '');

      // 配置项数量（软分组的标记字段不计入）
      const fieldCount = computed(() => {
        const schemas = (props.card?.schemas ?? []) as any[];
        return schemas.filter((s) => s && s.component !== 'SOFT_GROUP_BEGIN' && s.component !== 'Divider').length;
      });

      const addBtnText = computed(() => props.card?.addBtnText ?? '新增配置');

      const footHint = computed(() => {
        if (!props.isDefault && props.card?.allowDel) return '此配置块可单独保存或删除';
        return '保存后立即写入配置文件';
      });

      function decodeTitle(card: IConfigCard, form: FormType) {
        return card.title.replace(/{{([^}]+)}}/g, (_, $1) => {
          return new Function('card', 'form', `return ${$1}`)(card, form);
        });
      }

      function onClickTitle() {
        if (props.allowFold) {
          folded.value = !folded.value;
        }
      }

      function onAddCard() {
        createPrompt({
          title: addBtnText.value,
          required: true,
          ...props.card?.promptProps,
          async onOk(value) {
            emit('addCard', { form: props.form, key: value });
          },
        });
      }

      function onRemoveCard() {
        emit('delCard', { form: props.form });
      }

      function onSubmit() {
        emit('submit', props.form);
      }

      // 历史版本弹窗
      const versionVisible = ref(false);
      const versionMounted = ref(false);

      function onOpenVersion() {
        versionMounted.value = true;
        versionVisible.value = true;
      }

      // 恢复 / 导入后让父级重新读一遍当前配置块
      function onVersionChanged() {
        emit('redo', props.form);
      }

      provide('doFormSubmit', onSubmit);

      return {
        emit,
        prefixCls,
        folded,
        cardTitle,
        configKey,
        fieldCount,
        addBtnText,
        footHint,
        versionVisible,
        versionMounted,

        onClickTitle,
        onSubmit,
        onAddCard,
        onRemoveCard,
        onOpenVersion,
        onVersionChanged,
      };
    },
  });
</script>

<style lang="less" scoped>
  //noinspection LessUnresolvedVariable
  @prefix-cls: ~'@{namespace}-card-form';

  .@{prefix-cls} {
    /* 面板外观由 design/guoba-modules.less 的 .db-card 统一提供 */
    :deep(.ant-form) {
      margin-bottom: 2px;
    }

    /* 输入控件统一边框色，深浅主题跟随令牌 */
    :deep(.ant-input),
    :deep(.ant-input-number),
    :deep(.ant-select:not(.ant-select-customize-input) .ant-select-selector),
    :deep(.ant-picker) {
      background: var(--g-card-bg-soft);
      border-color: var(--g-card-border);
    }

    :deep(.ant-input:focus),
    :deep(.ant-input-focused),
    :deep(.ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selector) {
      border-color: var(--g-blue);
      box-shadow: none;
    }

    :deep(.ant-form-item-extra) {
      font-size: 11.5px;
      color: var(--g-text-mute);
    }

    /* 分区分隔更适合浅色底 */
    :deep(.ant-divider) {
      border-color: var(--g-card-border);
    }
  }
</style>
