<template>
  <Modal
    :visible="visible"
    :title="title"
    :width="width"
    :confirm-loading="loading"
    :ok-text="okText"
    cancel-text="取消"
    :mask-closable="false"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <Form ref="formRef" class="gfm-form" :label-col="{ span: 5 }" :wrapper-col="{ span: 17 }" :model="values">
      <FormItem
        v-for="f in schema"
        :key="f.field"
        :name="f.field"
        :label="f.label"
        :rules="buildRules(f)"
      >
        <!-- 下拉 -->
        <Select
          v-if="f.type === 'select'"
          v-model:value="values[f.field]"
          :options="f.options || []"
          :placeholder="f.placeholder || `请选择${f.label}`"
          allow-clear
        />
        <!-- 开关 -->
        <Switch v-else-if="f.type === 'switch'" v-model:checked="values[f.field]" />
        <!-- 数字 -->
        <InputNumber
          v-else-if="f.type === 'number'"
          v-model:value="values[f.field]"
          :placeholder="f.placeholder || `请输入${f.label}`"
          style="width: 100%"
        />
        <!-- 多行文本 -->
        <Textarea
          v-else-if="f.type === 'textarea'"
          v-model:value="values[f.field]"
          :rows="3"
          :placeholder="f.placeholder || `请输入${f.label}`"
        />
        <!-- 单行文本（默认） -->
        <Input
          v-else
          v-model:value="values[f.field]"
          :placeholder="f.placeholder || `请输入${f.label}`"
          allow-clear
        />
        <div v-if="f.tip" class="gfm-field-tip">{{ f.tip }}</div>
      </FormItem>
    </Form>
    <slot />
  </Modal>
</template>

<script setup lang="ts">
  import { reactive, ref, watch } from 'vue';
  import { Form, FormItem, Input, InputNumber, Modal, Select, Switch } from 'ant-design-vue';
  const Textarea = Input.TextArea;

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
  .gfm-form {
    padding-top: 4px;
  }

  .gfm-field-tip {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--g-text-mute);
  }
</style>
