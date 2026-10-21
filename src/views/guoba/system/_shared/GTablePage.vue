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
          <Icon :icon="$gm('download')" :size="13" style="margin-right: 4px" />
          导出 CSV
        </Button>
        <Button size="small" :loading="loading" @click="$emit('refresh')">
          <Icon :icon="$gm('refresh')" :size="13" />
        </Button>
      </div>
    </div>

    <!-- 筛选条 -->
    <div v-if="searchable || $slots.filters" class="gtp__bar">
      <GSearch v-if="searchable" v-model="searchModel" :placeholder="searchPlaceholder" size="small" width="240px" @search="$emit('search')" />
      <slot name="filters" />
      <Button v-if="searchable" size="small" type="primary" @click="$emit('search')">查询</Button>
    </div>

    <!-- 表格 -->
    <div class="gtp__body" :class="{ 'is-refreshing': loading && !!dataSource.length }">
      <div v-if="loading && !dataSource.length" class="gtp__skeleton">
        <div v-for="i in 6" :key="i" class="g-skeleton g-skeleton--text" />
      </div>
      <Table v-else :columns="columns" :data-source="dataSource" :row-key="rowKey" :pagination="false" :scroll="scroll" size="middle" :row-class-name="rowClassName">
        <template #emptyText>
          <slot name="empty">
            <GEmpty :title="emptyTitleText" :desc="emptyDescText">
              <Button v-if="hasFilter" size="small" @click="clearFilter">清空筛选</Button>
            </GEmpty>
          </slot>
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
  import { computed, onBeforeMount } from 'vue';
  import { Table, Button, Pagination } from 'ant-design-vue';
  import GEmpty from './GEmpty.vue';
  import GSearch from './form/GSearch.vue';
  import GSelect from './form/GSelect.vue';
  import { downloadCsv, type CsvColumn } from '/@/utils/export/csv';
  import { gm } from '/@/design/gmIcons';

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
      icon: gm('list'),
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

  /* ---------------- 空态：区分「本来就没有」和「筛掉了」 ---------------- */
  const hasFilter = computed(() => !!String(props.searchValue ?? '').trim());

  const emptyTitleText = computed(() => (hasFilter.value ? '没有匹配的结果' : props.emptyTitle));

  const emptyDescText = computed(() =>
    hasFilter.value
      ? // desc 走 v-html，用户输入里的尖括号要剔掉
        `「${String(props.searchValue).trim().replace(/[<>&]/g, '')}」没有命中任何记录，换个关键字或清空筛选试试`
      : props.emptyDesc,
  );

  function clearFilter() {
    emit('update:searchValue', '');
    emit('update:page', 1);
    emit('search');
  }

  /* ---------------- 每页条数按页面记住，不必每次重新选 ---------------- */
  const SIZE_STORE = 'guoba:gtp:size:';
  const SIZES = [10, 20, 50, 100];

  const sizeStoreKey = () => `${SIZE_STORE}${props.csvName || props.title || 'default'}`;

  onBeforeMount(() => {
    try {
      const n = Number(localStorage.getItem(sizeStoreKey()));
      if (SIZES.includes(n) && n !== props.pageSize) emit('update:pageSize', n);
    } catch {
      /* 隐私模式下 localStorage 不可用，忽略即可 */
    }
  });

  function rememberSize(n: number) {
    try {
      localStorage.setItem(sizeStoreKey(), String(n));
    } catch {
      /* 同上 */
    }
  }

  function onPageChange(p: number) {
    emit('update:page', p);
    emit('search');
  }

  function onSizeChange(v: any) {
    const n = Number(v) || 20;
    rememberSize(n);
    emit('update:pageSize', n);
    emit('update:page', 1);
    emit('sizeChange', n);
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

  /* 左密度、中分页的三段式：分页居中，密度条绝对定位贴左，互不挤压 */
  .gtp__foot {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 2px;
  }

  .gtp__foot :deep(.ant-pagination) {
    padding-top: 0;
  }

  .gtp__density {
    position: absolute;
    left: 0;
    display: flex;
    gap: 6px;
    align-items: center;
    font-size: 12px;
    color: var(--g-text-mute);
  }

  /* 二次加载（翻页 / 筛选 / 刷新）：不清空表格，只压暗加一条扫光，
     避免整块闪白造成的"页面重载"错觉 */
  .gtp__body {
    position: relative;

    &.is-refreshing :deep(.ant-table) {
      opacity: 0.5;
      transition: opacity 0.15s;
    }

    &.is-refreshing::before {
      position: absolute;
      top: 0;
      right: 0;
      left: 0;
      z-index: 3;
      height: 2px;
      content: '';
      background: linear-gradient(90deg, transparent, var(--g-blue), transparent);
      background-repeat: no-repeat;
      background-size: 40% 100%;
      border-radius: 2px;
      animation: gtp-sweep 0.9s linear infinite;
    }
  }

  @keyframes gtp-sweep {
    from {
      background-position: -40% 0;
    }

    to {
      background-position: 140% 0;
    }
  }

  /* 表格与分页样式统一由 design/guoba-table.less 接管，页面不再各自覆盖 */
</style>
