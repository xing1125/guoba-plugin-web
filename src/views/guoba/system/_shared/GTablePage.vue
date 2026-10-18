<template>
  <div class="g-card gtp">
    <!-- 头部：标题 + 工具栏 -->
    <div class="gm-panel__head">
      <div class="gm-panel__title">
        <i v-if="icon"><Icon :icon="icon" :size="13" /></i>
        {{ title }}
        <span class="gm-panel__extra" style="margin-left: 8px">共 {{ total }} 条</span>
      </div>
      <div class="gtp__tools">
        <slot name="toolbar" />
        <Button v-if="csvName && csvColumns.length" size="small" :disabled="!dataSource.length" @click="exportCsv">
          <Icon icon="ant-design:download-outlined" :size="13" style="margin-right: 4px" />
          导出 CSV
        </Button>
        <Button size="small" :loading="loading" @click="$emit('refresh')">
          <Icon icon="ant-design:reload-outlined" :size="13" />
        </Button>
      </div>
    </div>

    <!-- 筛选条 -->
    <div v-if="searchable || $slots.filters" class="gtp__bar">
      <GSearch v-if="searchable" v-model="searchModel" :placeholder="searchPlaceholder" size="small" width="240px" @search="$emit('search')" />
      <slot name="filters" />
      <Button v-if="searchable" size="small" type="primary" ghost @click="$emit('search')">查询</Button>
    </div>

    <!-- 表格 -->
    <div class="gtp__body">
      <div v-if="loading && !dataSource.length" class="gtp__skeleton">
        <div v-for="i in 6" :key="i" class="g-skeleton g-skeleton--text" />
      </div>
      <Table v-else :columns="columns" :data-source="dataSource" :row-key="rowKey" :pagination="false" :scroll="scroll" size="middle" :row-class-name="rowClassName">
        <template #emptyText>
          <GEmpty :title="emptyTitle" :desc="emptyDesc" />
        </template>
        <template #bodyCell="scope">
          <slot name="bodyCell" v-bind="scope">{{ scope.text }}</slot>
        </template>
      </Table>
    </div>

    <!-- 分页 -->
    <div v-if="total > 0" class="gtp__foot">
      <span class="gtp__density">
        每页
        <GSelect :model-value="pageSize" size="sm" width="72px" :clearable="false" :options="sizeOptions" @update:model-value="onSizeChange" />
      </span>
      <Pagination :current="page" :page-size="pageSize" :total="total" size="small" :show-total="(t: number) => `共 ${t} 条`" @change="onPageChange" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { Table, Button, Pagination } from 'ant-design-vue';
  import GEmpty from './GEmpty.vue';
  import GSearch from './form/GSearch.vue';
  import GSelect from './form/GSelect.vue';
  import { downloadCsv, type CsvColumn } from '/@/utils/export/csv';

  /**
   * GTablePage —— 统一列表页骨架（B 端规范）
   *
   * 组成：标题条（含总数）+ 工具栏插槽 + 搜索/筛选条 + 表格 + 分页 + 骨架屏 + 空态 + CSV 导出
   *
   * 用法：
   *   <GTablePage v-model:page="page" v-model:page-size="size" v-model:search-value="q"
   *               title="用户" :columns="columns" :data-source="rows" :total="total"
   *               :loading="loading" csv-name="users" :csv-columns="csvCols" @search="load">
   *     <template #toolbar><Button>新建</Button></template>
   *     <template #filters><Select ... /></template>
   *   </GTablePage>
   */

  defineOptions({ name: 'GTablePage' });

  const props = withDefaults(
    defineProps<{
      title?: string;
      icon?: string;
      loading?: boolean;
      columns: any[];
      dataSource: any[];
      total?: number;
      page?: number;
      pageSize?: number;
      rowKey?: string;
      searchable?: boolean;
      searchValue?: string;
      searchPlaceholder?: string;
      csvName?: string;
      csvColumns?: CsvColumn[];
      emptyTitle?: string;
      emptyDesc?: string;
      scroll?: any;
      rowClassName?: any;
    }>(),
    {
      title: '',
      icon: 'ant-design:unordered-list-outlined',
      loading: false,
      total: 0,
      page: 1,
      pageSize: 20,
      rowKey: 'id',
      searchable: false,
      searchValue: '',
      searchPlaceholder: '搜索…',
      csvName: '',
      csvColumns: () => [],
      emptyTitle: '暂无数据',
      emptyDesc: '',
      scroll: undefined,
      rowClassName: undefined,
    },
  );

  const emit = defineEmits(['update:page', 'update:pageSize', 'update:searchValue', 'search', 'refresh', 'sizeChange']);

  const sizeOptions = [
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
  ];

  /** 搜索框双向绑定：对外仍是 v-model:search-value */
  const searchModel = computed({
    get: () => props.searchValue ?? '',
    set: (v: string) => emit('update:searchValue', v),
  });

  const total = computed(() => props.total || 0);

  function onPageChange(p: number) {
    emit('update:page', p);
    emit('search');
  }

  function onSizeChange(v: any) {
    emit('update:pageSize', Number(v) || 20);
    emit('update:page', 1);
    emit('sizeChange', Number(v) || 20);
    emit('search');
  }

  function exportCsv() {
    downloadCsv(props.csvName, props.csvColumns, props.dataSource);
  }
</script>

<style lang="less" scoped>
  .gtp {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px 16px 12px;
  }

  .gtp__tools {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .gtp__bar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .gtp__search {
    width: 240px;
  }

  .gtp__skeleton {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 6px 0;
  }

  .gtp__foot {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: flex-end;
    padding-top: 2px;
  }

  .gtp__density {
    font-size: 12px;
    color: var(--g-text-mute);
  }

  :deep(.ant-table) {
    background: transparent;
  }

  :deep(.ant-table-thead > tr > th) {
    font-size: 12px;
    font-weight: 600;
    color: var(--g-text-sub);
    background: var(--g-card-bg-soft);
    border-bottom: 1px solid var(--g-card-border);
  }

  :deep(.ant-table-tbody > tr > td) {
    font-size: 12.5px;
    color: var(--g-text);
    border-bottom: 1px solid var(--g-card-border);
  }

  :deep(.ant-table-tbody > tr:hover > td) {
    background: var(--g-hover);
  }

  /* 输入类控件的底色/描边统一由 design/guoba-controls.less 接管，这里不再重复覆盖 */

  :deep(.ant-pagination-item) {
    background: var(--g-card-bg-soft);
    border-color: var(--g-card-border);

    a {
      color: var(--g-text-sub);
    }
  }

  :deep(.ant-pagination-item-active) {
    border-color: var(--g-blue);

    a {
      color: var(--g-blue);
    }
  }
</style>
