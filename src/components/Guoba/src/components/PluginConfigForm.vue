<template>
  <a-spin :spinning="loading">
    <div class="g-cfg-form">
      <BasicForm @register="registerForm" />
    </div>
  </a-spin>
</template>

<script lang="ts">
  import type { Plugin } from '/#/guoba';
  import type { FormSchemas } from '/@/components/Form';
  import { BasicForm, useForm } from '/@/components/Form';
  import { computed, defineComponent, PropType, ref, provide } from 'vue';
  import lodash from 'lodash-es';
  import { defHttp } from '/@/utils/http/axios';
  import { useMessage } from '/@/hooks/web/useMessage';

  export default defineComponent({
    name: 'PluginConfigForm',
    components: { BasicForm },
    props: {
      plugin: {
        type: Object as PropType<Plugin>,
        required: true,
      },
      // 是否启用软分组，即通过分组字段进行分组
      softGrouping: {
        type: Boolean,
        default: false,
      },
      // （v-model） 如果启用软分组，指定默认激活的分组
      activeGroupKey: {
        type: String,
        default: 'default',
      },
      // （v-model） 如果启用软分组，用于获取所有分组的列表
      softGroupList: {
        type: Array as PropType<{ name: string; title: string }[]>,
        default: () => [],
      },
    },
    emits: ['register', 'update:activeGroupKey', 'update:softGroupList'],
    setup(props, { emit }) {
      const { createMessage: $message, createErrorModal } = useMessage();

      const loading = ref(false);

      type SoftGroupItem = {
        name: string;
        title?: string;
        count: number;
      };

      let initGroupKey = '';
      const defGroupKey = 'default';
      const softGroupMap = new Map<string, SoftGroupItem>();

      /** 紧凑控件：宽屏下可以和别的字段并排占半列 */
      const COMPACT = new Set(['Switch', 'InputNumber', 'Select', 'RadioGroup', 'EasyCron', 'InputPassword', 'Input']);
      /** 必须通栏的控件：多行文本 / 标签组 / 子表单 / 群选择 */
      const MUST_WIDE = new Set(['InputTextArea', 'GTags', 'GSelectGroup', 'GSubForm', 'Divider', 'Editor']);

      const schemas = initSchemas();

      const [registerForm, formActions] = useForm({
        // 120px 会让「成功发送回复文本」这类 8 字 label 被截成省略号；
        // 156px + 允许两行换行，能装下绝大多数插件字段名（实测中位数仅 6 字）
        labelWidth: 156,
        schemas: normalizeSchemas(schemas),
        labelAlign: 'right',
        showActionButtonGroup: false,
        // 后台规格：1440 及以下单列（label 左、控件右），1600+ 才拆两列，
        // 且只有「短 label + 紧凑控件」才占半列，其余一律通栏（见 normalizeSchemas）
        baseColProps: { xs: 24, sm: 24, md: 24, lg: 24, xl: 24, xxl: 12 },
      });

      provide('formActions', formActions);
      provide('pluginInfo', props.plugin);
      const { setFieldsValue, validate } = formActions;

      /**
       * 字段排版兜底（第三方插件的 schema 完全不可控，这里统一收口）：
       * 1. 多行文本固定 4 行，不在两三行高度里滚
       * 2. 帮助文案过长 / label 过长 / 重型控件 → 通栏，否则半栏里会被压成细条
       * 3. 只有短 label 的紧凑控件才允许宽屏两列，避免「两列里塞不下还留 200px 空白」
       */
      function normalizeSchemas(list: FormSchemas): FormSchemas {
        const longText = (t: any) => typeof t === 'string' && t.length > 40;
        const textWidth = (s: any) =>
          [...String(s ?? '')].reduce((n, c) => n + (/[\u2E80-\uFFEF]/.test(c) ? 2 : 1), 0);
        return (list || []).map((schema) => {
          if (!schema || !schema.component) return schema;
          const next: any = { ...schema };
          if (next.component === 'InputTextArea') {
            // 插件侧常用 `autosize`（小写），antd 只认 `autoSize`；两者都收，
            // 并把行数夹在合理区间，免得 11 行的模板把整页顶到几屏高
            const cp: any = { ...(next.componentProps || {}) };
            const src = cp.autoSize ?? cp.autosize;
            delete cp.autosize;
            const clamp = (v: any, lo: number, hi: number, def: number) =>
              Math.min(hi, Math.max(lo, Number(v) || def));
            cp.autoSize =
              src && typeof src === 'object'
                ? { minRows: clamp(src.minRows, 2, 6, 4), maxRows: clamp(src.maxRows, 4, 12, 8) }
                : { minRows: 3, maxRows: 8 };
            next.componentProps = cp;
          }
          const isGroupMark = next.component === 'SOFT_GROUP_BEGIN';
          const wide =
            !isGroupMark &&
            (next.component === 'InputTextArea' ||
              MUST_WIDE.has(next.component) ||
              longText(next.bottomHelpMessage) ||
              textWidth(next.label) > 26);
          next.colProps = {
            span: 24,
            xs: 24,
            sm: 24,
            md: 24,
            lg: 24,
            xl: 24,
            xxl: !wide && COMPACT.has(next.component) ? 12 : 24,
            ...(next.colProps || {}),
          };
          return next;
        });
      }

      function initSchemas(): FormSchemas {
        if (!props.softGrouping) {
          return props.plugin.schemas;
        }
        softGroupMap.clear();
        // 启用软分组 分组规则：
        // 1. 遍历 schemas，找到所有的 group 标记字段（component = 'SOFT_GROUP_BEGIN'）
        // 2. 以 group 字段为起点，找到下一个 group 标记字段之间的字段，作为一个分组
        //    若没有找到下一个 group 字段，则直到遍历结束的字段，作为一个分组
        // 3. 重复 1-2 步骤，直到遍历完所有字段
        const schemas = lodash.cloneDeep(props.plugin.schemas);
        const genIfShowFn = (groupKey: string) => () => props.activeGroupKey === groupKey;
        const active = { name: defGroupKey, show: genIfShowFn(defGroupKey) };

        softGroupMap.set(active.name, { name: active.name, title: '默认', count: 0 });
        for (const schema of schemas) {
          if (schema.component === 'SOFT_GROUP_BEGIN') {
          // if (schema.component === 'Divider') {
            schema.ifShow = false;
            active.name = schema.label as string;
            active.show = genIfShowFn(active.name);
            continue;
          }
          if (typeof schema.show === 'function') {
            const oldShow = schema.show;
            schema.show = (...args) => active.show() && oldShow(...args);
          } else {
            schema.show = active.show;
          }
          const group = softGroupMap.get(active.name) || { name: active.name, count: 0 };
          group.count++;
          softGroupMap.set(active.name, group);
        }
        // 去除所有的空分组
        let groupKeys = Array.from(softGroupMap.keys());
        for (const key of groupKeys) {
          if (!softGroupMap.get(key)?.count) {
            softGroupMap.delete(key);
          }
        }
        groupKeys = Array.from(softGroupMap.keys());
        // 当仅有一个分组时，不显示分组导航，但仍把分组名抛给页面当标题用
        if (groupKeys.length == 1) {
          const only = softGroupMap.get(groupKeys[0])!;
          emit('update:activeGroupKey', only.name);
          emit('update:softGroupList', [{ name: only.name, title: only.title || only.name }]);
          // 单分组时页面顶栏已经显示分组名，表单里不用再来一条同名标题
          return props.plugin.schemas.filter((s: any) => s.component !== 'SOFT_GROUP_BEGIN');
        }
        // 获取激活的分组
        let activeGroup = softGroupMap.get(props.activeGroupKey);
        if (!activeGroup?.count) {
          initGroupKey = groupKeys[0];
          emit('update:activeGroupKey', initGroupKey);
        }
        const softGroupList: { name: string; title: string }[] = [];
        Array.from(softGroupMap.entries()).forEach(([key, value]) =>
          softGroupList.push({
            name: key,
            title: value.title || key,
          }),
        );
        emit('update:softGroupList', softGroupList);
        return schemas;
      }

      const url = computed(() => `/plugin/s/${props.plugin.name}/config`);

      // 获取插件配置数据
      async function getPluginConfigData() {
        try {
          loading.value = true;
          let result = await defHttp.get({ url: url.value }, { errorMessageMode: 'modal' });
          await setFieldsValue(result);
        } finally {
          loading.value = false;
        }
      }

      async function savePluginConfigData() {
        let values = await validate();
        let { ok, message } = await defHttp.put(
          { url: url.value, params: values },
          {
            trimValues: false,
            isTransformResponse: false,
          },
        );
        if (ok) {
          $message.success(message || '保存成功！');
          await getPluginConfigData();
        } else {
          createErrorModal({ title: '错误', content: message || '保存失败！' });
        }
      }

      provide('doFormSubmit', savePluginConfigData);

      return {
        registerForm: (...args) => {
          // @ts-ignored
          registerForm(...args);
          getPluginConfigData();
        },
        loading,
        savePluginConfigData,
      };
    },
  });
</script>

<style scoped></style>
