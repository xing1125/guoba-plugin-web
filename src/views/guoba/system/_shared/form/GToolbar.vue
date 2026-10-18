<template>
  <div class="g-toolbar" :class="{ 'is-stacked': stacked }">
    <div class="g-toolbar__left">
      <slot />
    </div>
    <div v-if="$slots.right" class="g-toolbar__right">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup lang="ts">
  /**
   * GToolbar —— 列表页筛选条
   *
   * 左筛选、右操作，统一 8px 间距与 32px 行高对齐，
   * 窄屏自动换行（is-stacked 时上下两行）。
   *
   *   <GToolbar>
   *     <GSearch v-model:value="kw" @search="reload" />
   *     <GSelect v-model:value="sort" :options="sorts" width="150px" />
   *     <template #right><Button type="primary">导出</Button></template>
   *   </GToolbar>
   */
  defineOptions({ name: 'GToolbar' });

  withDefaults(defineProps<{ stacked?: boolean }>(), { stacked: false });
</script>
