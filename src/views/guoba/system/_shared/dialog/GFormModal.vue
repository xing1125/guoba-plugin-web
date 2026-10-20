<template>
  <Modal :visible="visible" :title="title" :width="width" :confirm-loading="loading" :ok-text="okText" cancel-text="取消" :mask-closable="false" @ok="handleOk" @cancel="handleCancel">
    <Form ref="formRef" class="gfm-form" :label-col="{ span: 5 }" :wrapper-col="{ span: 17 }" :model="values">
      <div v-if="hint" class="gfm-hint">
        <Icon :icon="$gm('info')" :size="14" style="flex-shrink: 0; margin-top: 2px" />
        <span>{{ hint }}</span>
      </div>
      <FormItem v-for="f in schema" :key="f.field" :name="f.field" :label="f.label" :rules="buildRules(f)">
        <!-- 下拉 -->
        <GSelect v-if="f.type === 'select'" v-model="values[f.field]" :options="f.options || []" :placeholder="f.placeholder || `请选择${f.label}`" />
        <!-- 开关 -->
        <GSwitch v-else-if="f.type === 'switch'" v-model="values[f.field]" />
        <!-- 数字 -->
        <GNumber v-else-if="f.type === 'number'" v-model="values[f.field]" :placeholder="f.placeholder || `请输入${f.label}`" />
        <!-- 多行文本 -->
        <GInput v-else-if="f.type === 'textarea'" v-model="values[f.field]" type="textarea" :rows="3" :placeholder="f.placeholder || `请输入${f.label}`" />
        <!-- 单行文本（默认） -->
        <GInput v-else v-model="values[f.field]" :placeholder="f.placeholder || `请输入${f.label}`" />
        <div v-if="f.tip" class="gfm-field-tip">{{ f.tip }}</div>
      </FormItem>
    </Form>
    <slot />
  </Modal>
</template>

<script setup lang="ts">
  import { reactive, ref, watch } from 'vue';
  import { Form, FormItem, Modal } from 'ant-design-vue';
  import { Icon } from '/@/components/Icon';
  import GInput from '../form/GInput.vue';
  import GNumber from '../form/GNumber.vue';
  import GSelect from '../form/GSelect.vue';
  import GSwitch from '../form/GSwitch.vue';

  /**
   * GFormModal —— schema 驱动的表单弹窗（受控组件）
   *
   * 用法：
   *   <GFormModal v-model:visible="visible" title="添加群管理员" :schema="schema"
   *               :loading="doing" @ok="onSubmit" />
   *   const schema = [{ field: 'uid', label: '用户 ID', type: 'input', required: true, tip: '...' }]
   *
   * 提交：@ok 回调里调接口，成功后自行把 visible 置 false
   * 回填：传 values 属性（对象）或用 openWith(values) —— v-model:values
   */

  defineOptions({ name: 'GFormModal' });

  interface FieldSchema {
    field: string;
    label: string;
    type?: 'input' | 'textarea' | 'number' | 'select' | 'switch';
    required?: boolean;
    placeholder?: string;
    tip?: string;
    options?: { label: string; value: any }[];
    pattern?: RegExp;
    message?: string;
  }

  const props = defineProps<{
    visible: boolean;
    title: string;
    schema: FieldSchema[];
    loading?: boolean;
    okText?: string;
    width?: number;
    values?: Record<string, any>;
    /** 表单顶部说明条（浅蓝信息卡） */
    hint?: string;
  }>();

  const emit = defineEmits(['ok', 'cancel', 'update:visible']);

  const formRef = ref();
  const values = reactive<Record<string, any>>({});

  // 打开时按 schema 初始化 / 回填
  watch(
    () => props.visible,
    (v) => {
      if (!v) return;
      for (const f of props.schema) {
        const back = props.values?.[f.field];
        values[f.field] = back !== undefined ? back : f.type === 'switch' ? false : f.type === 'number' ? undefined : '';
      }
    },
  );

  function buildRules(f: FieldSchema) {
    const rules: any[] = [];
    if (f.required) {
      rules.push({ required: true, message: f.message || `${f.label}不能为空`, trigger: 'blur' });
    }
    if (f.pattern) {
      rules.push({ pattern: f.pattern, message: f.message || `${f.label}格式不正确`, trigger: 'blur' });
    }
    return rules;
  }

  async function handleOk() {
    try {
      await formRef.value?.validate();
    } catch {
      return; // 校验失败不提交
    }
    emit('ok', { ...values });
  }

  function handleCancel() {
    emit('cancel');
    emit('update:visible', false);
  }
</script>

<style scoped lang="less">
  .gfm-field-tip {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--g-text-mute);
  }
</style>
