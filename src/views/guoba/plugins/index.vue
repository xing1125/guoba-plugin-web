<template>
  <PageWrapper title="" :loading="loading">
    <section class="db-hero">
      <div class="db-hero__main">
        <div class="db-hero__eyebrow">PLUGINS</div>
        <div class="db-hero__title">插件管理</div>
        <div class="db-hero__desc">
          安装、卸载与配置云崽插件；列表来源
          <a href="https://gitee.com/yhArcadia/Yunzai-Bot-plugins-index" target="_blank">Yunzai-Bot 插件索引</a>
        </div>
      </div>
      <div class="db-hero__side">
        <span class="db-hero__time">{{ installedCount }} 已安装 · {{ allPlugins.length }} 收录</span>
      </div>
    </section>

    <!-- 指标概览：点击「已安装 / 未安装」可直接切换列表口径 -->
    <div class="db-kpi pf-kpi">
      <div
        v-for="item in kpiList"
        :key="item.key"
        class="db-kpi__card"
        :class="{ 'is-clickable': item.clickable, 'is-active': item.clickable && pluginStatus === item.status }"
        @click="item.clickable && (pluginStatus = item.status)"
      >
        <span class="db-kpi__icon is-plain" :style="{ color: item.color, background: item.bg }">
          <Icon :icon="item.icon" :size="17" />
        </span>
        <div class="db-kpi__body">
          <div class="db-kpi__label">{{ item.label }}</div>
          <div class="db-kpi__value">{{ item.value }}</div>
        </div>
      </div>
    </div>

    <section class="g-card db-plugins">
      <!-- 工具栏 -->
      <div class="pf-bar">
        <div class="pf-bar__filters">
          <GSearch
            v-model="keyword"
            width="300px"
            placeholder="搜索插件标题 / 名称 / 说明，支持正则"
            @search="applyKeyword"
          />
          <GSelect
            v-model="authorFilter"
            width="200px"
            mode="multiple"
            placeholder="插件作者"
            :options="authorOptions"
          />
          <GSegmented
            :model-value="pluginStatus"
            :options="[
              { value: 1, label: '已安装' },
              { value: 0, label: '未安装' },
            ]"
            size="sm"
            label="安装状态"
            @update:model-value="pluginStatus = $event as any"
          />
        </div>
        <div class="pf-bar__ops">
          <span class="pf-count">共 {{ filteredPlugins.length }} 个</span>
          <a-button :pre-icon="$gm('plus')" @click="onInstall">安装自定义插件</a-button>
          <a-tooltip title="重新加载插件列表">
            <span class="db-cfg__icon-btn" @click="reloadPlugins">
              <Icon :icon="$gm('refresh')" :size="14" />
            </span>
          </a-tooltip>
        </div>
      </div>

      <!-- 批量操作条 -->
      <transition name="fade">
        <div v-if="selectedKeys.length" class="pf-batch">
          <span class="pf-batch__txt">已选中 <b>{{ selectedKeys.length }}</b> 个插件</span>
          <div class="pf-batch__ops">
            <a-button size="small" danger :pre-icon="$gm('trash')" @click="onUninstallBatch">批量卸载</a-button>
            <a-button size="small" type="text" @click="selectedKeys = []">清除选择</a-button>
          </div>
        </div>
      </transition>

      <Table
        :columns="columns"
        :data-source="pagedPlugins"
        :pagination="false"
        :row-selection="rowSelection"
        :custom-row="customRow"
        :scroll="{ x: 1040 }"
        row-key="name"
        class="pf-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'plugin'">
            <div class="pf-plug">
              <span class="pf-plug__icon">
                <PluginIcon :plugin="record" :size="17" />
              </span>
              <div class="pf-plug__body">
                <div class="pf-plug__name" :title="record.title">{{ record.title }}</div>
                <div class="pf-plug__pkg">{{ record.name }}</div>
              </div>
            </div>
          </template>

          <template v-else-if="column.key === 'author'">
            <div class="pf-authors__list">
              <a
                v-for="(a, i) in authorListOf(record)"
                :key="i"
                class="g-chip pf-author"
                :href="a.link || undefined"
                :target="a.link ? '_blank' : undefined"
                @click.stop
              >
                {{ a.name }}
              </a>
              <span v-if="!authorListOf(record).length" class="g-muted">—</span>
            </div>
          </template>

          <template v-else-if="column.key === 'desc'">
            <div class="pf-desc" :title="record.description">{{ record.description || '—' }}</div>
          </template>

          <template v-else-if="column.key === 'status'">
            <div class="pf-tags">
              <span v-for="(s, i) in statusesOf(record)" :key="i" class="pf-tag" :class="`is-${s.tone}`">{{ s.text }}</span>
            </div>
          </template>

          <template v-else-if="column.key === 'action'">
            <div class="pf-actions">
              <a-button
                v-if="record.installed && record.hasConfig"
                type="link"
                size="small"
                :pre-icon="$gm('gear')"
                @click.stop="goConfig(record)"
              >
                配置
              </a-button>
              <a-button type="link" size="small" :pre-icon="$gm('info')" @click.stop="handleView(record)">
                详情
              </a-button>
            </div>
          </template>
        </template>
      </Table>

      <div class="pf-foot">
        <span class="pf-foot__tip">
          {{ pluginStatus === 1 ? '点击行可查看插件详情，或在右侧直接进入配置' : '未安装插件来自插件索引仓库，可通过 Git 地址安装' }}
        </span>
        <Pagination
          :current="page.current"
          :page-size="page.size"
          :total="filteredPlugins.length"
          :page-size-options="['10', '20', '50']"
          show-size-changer
          :show-total="(t) => `共 ${t} 个插件`"
          size="small"
          @change="onPageChange"
          @showSizeChange="onPageChange"
        />
      </div>
    </section>

    <GPluginModal @register="registerModal" @success="handleSuccess" />
  </PageWrapper>
</template>

<script lang="tsx" setup>
  import type { Plugin, Plugins } from '/#/guoba';
  import { computed, reactive, ref, watch } from 'vue';
  import { Pagination, Table } from 'ant-design-vue';
  import { router } from '/@/router';
  import { PageWrapper } from '/@/components/Page';
  import Icon from '/@/components/Icon';
  import { useModal } from '/@/components/Modal';
  import { useGuobaStore } from '/@/store/guoba';
  import { pluginApi } from '/@/api/guoba';
  import { usePrompt } from '/@/components/Guoba';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { sleep } from '/@/utils/common';
  import GPluginModal from '/@/components/Guoba/src/GPluginModal.vue';
  import GSegmented from '/@/views/guoba/system/_shared/form/GSegmented.vue';
  import GSearch from '/@/views/guoba/system/_shared/form/GSearch.vue';
  import GSelect from '/@/views/guoba/system/_shared/form/GSelect.vue';
  import PluginIcon from '/@/components/Guoba/src/components/PluginIcon.vue';
  import { gm } from '/@/design/gmIcons';

  const guobaStore = useGuobaStore();
  const { createPrompt } = usePrompt();
  const { createMessage: $message, createConfirm, createInfoModal } = useMessage();
  const [registerModal, { openModal }] = useModal();

  const loading = ref(false);
  // 插件状态，0 = 未安装，1 = 已安装
  const pluginStatus = ref(1);

  const allPlugins = ref<Plugins>([]);
  const keyword = ref('');
  // 提交后的关键字（回车或清空时才生效，避免每次输入都触发重算）
  const keywordApplied = ref('');
  const authorFilter = ref<string[]>([]);
  const selectedKeys = ref<string[]>([]);
  const page = reactive({ current: 1, size: 10 });

  // 列宽总和（含 48px 勾选列）≈ 1040，正好等于 scroll.x；
  // 之前「说明」列留空随内容撑宽，会把右侧「操作」列顶出可视区
  const columns = [
    { title: '插件', dataIndex: 'title', key: 'plugin', width: 268 },
    { title: '作者', dataIndex: 'author', key: 'author', width: 132 },
    { title: '说明', dataIndex: 'description', key: 'desc', width: 300 },
    { title: '状态', dataIndex: 'installed', key: 'status', width: 176 },
    { title: '操作', key: 'action', width: 116, align: 'right' as const },
  ];

  const rowSelection = computed(() => ({
    selectedRowKeys: selectedKeys.value,
    onChange: (keys: string[]) => (selectedKeys.value = keys),
    // 未安装插件不允许选中（批量卸载只对已安装有意义）
    getCheckboxProps: (record: Plugin) => ({ disabled: !record.installed }),
  }));

  function customRow(record: Plugin) {
    return { onClick: () => handleView(record) };
  }

  const installedCount = computed(() => allPlugins.value.filter((p) => p.installed).length);

  const kpiList = computed(() => {
    const total = allPlugins.value.length;
    const installed = installedCount.value;
    return [
      {
        key: 'installed',
        label: '已安装',
        value: installed,
        icon: gm('success'),
        color: 'var(--g-green)',
        bg: 'rgb(69 185 124 / 14%)',
        status: 1,
        clickable: true,
      },
      {
        key: 'not-installed',
        label: '未安装',
        value: total - installed,
        icon: gm('cloud'),
        color: 'var(--g-amber)',
        bg: 'rgb(211 188 141 / 16%)',
        status: 0,
        clickable: true,
      },
      {
        key: 'configurable',
        label: '可配置',
        value: allPlugins.value.filter((p) => p.installed && p.hasConfig).length,
        icon: gm('gear'),
        color: 'var(--g-violet)',
        bg: 'rgb(157 141 240 / 14%)',
        status: 1,
        clickable: false,
      },
      {
        key: 'deleted',
        label: '已失效',
        value: allPlugins.value.filter((p) => p.isDeleted).length,
        icon: gm('warning'),
        color: 'var(--g-rose)',
        bg: 'rgb(255 138 101 / 14%)',
        status: 1,
        clickable: false,
      },
    ];
  });

  const authorOptions = computed(() => {
    const authors = allPlugins.value.reduce((prev: string[], curr) => {
      let author = curr.author;
      if (!Array.isArray(author)) {
        author = [author];
      }
      author.filter(Boolean).forEach((item) => {
        if (!prev.includes(item)) {
          prev.push(item);
        }
      });
      return prev;
    }, []);
    return authors.map((item) => ({ label: String(item).replace(/^@/, ''), value: item }));
  });

  const filteredPlugins = computed(() => {
    const kw = keywordApplied.value.trim();
    let reg: RegExp | null = null;
    if (kw) {
      try {
        reg = new RegExp(kw, 'i');
      } catch {
        // 非法正则退回普通包含匹配，避免整页报错
        reg = null;
      }
    }
    const authors = authorFilter.value ?? [];
    return allPlugins.value.filter((plugin) => {
      const installedFlag = pluginStatus.value === 1 ? plugin.installed : !plugin.installed;
      if (!installedFlag) return false;
      if (kw) {
        const text = `${plugin.title ?? ''} ${plugin.name ?? ''} ${plugin.description ?? ''}`;
        if (reg ? !reg.test(text) : !text.toLowerCase().includes(kw.toLowerCase())) return false;
      }
      if (authors.length > 0) {
        let author = plugin.author;
        if (!Array.isArray(author)) author = [author];
        if (!author.some((item) => authors.includes(item as string))) return false;
      }
      return true;
    });
  });

  const pagedPlugins = computed(() => {
    const start = (page.current - 1) * page.size;
    return filteredPlugins.value.slice(start, start + page.size);
  });

  function onPageChange(current: number, size: number) {
    page.size = size;
    page.current = Math.max(1, Math.min(current, Math.ceil(filteredPlugins.value.length / size) || 1));
  }

  function applyKeyword() {
    keywordApplied.value = keyword.value;
    page.current = 1;
  }

  // 分段切换时回到第一页并清空选择
  const stopWatch = () => {
    page.current = 1;
    selectedKeys.value = [];
  };
  watch(pluginStatus, stopWatch);
  watch(authorFilter, () => {
    page.current = 1;
  });

  function authorListOf(record: Recordable) {
    let author = record.author;
    let link = record.authorLink;
    if (!Array.isArray(author)) author = author ? [author] : [];
    if (link && !Array.isArray(link)) link = [link];
    return (author as string[]).filter(Boolean).map((name, i) => ({
      name: String(name).replace(/^@/, ''),
      link: Array.isArray(link) ? link[i] : undefined,
    }));
  }

  function statusesOf(record: Plugin) {
    const list: { text: string; tone: string }[] = [];
    list.push(record.installed ? { text: '已安装', tone: 'ok' } : { text: '未安装', tone: 'muted' });
    if (record.hasConfig) list.push({ text: '可配置', tone: 'info' });
    if (record.isV3) list.push({ text: 'V3', tone: 'blue' });
    if (record.isV2) list.push({ text: 'V2', tone: 'amber' });
    if (record.isDeleted) list.push({ text: '已失效', tone: 'danger' });
    return list;
  }

  async function loadPlugins(force = false) {
    loading.value = true;
    try {
      allPlugins.value = (await guobaStore.getPlugins(force)) ?? [];
    } finally {
      loading.value = false;
    }
  }

  function reloadPlugins() {
    loadPlugins(true);
  }

  loadPlugins();

  function handleView(record: Recordable) {
    openModal(true, { plugin: record });
  }

  function goConfig(record: Recordable) {
    router.push(`/plugin/@/${record.name}`);
  }

  function handleSuccess() {
    loadPlugins(true);
  }

  async function onInstall() {
    createPrompt({
      title: '安装自定义插件',
      required: true,
      placeholder: '请输入插件 Git 地址',
      bottomHelpMessage: '仅支持安装 Plugin 插件，请自行验证插件是否安全',
      rules: [
        { required: true, message: '请输入插件 Git 地址' },
        { type: 'url', message: '请输入正确的 Git 地址' },
      ],
      okText: '安装',
      async onOk(value) {
        let data = await pluginApi.installPlugin(value);
        if (data.status === 'success') {
          $message.success(data.message);
          await sleep(3000);
          window.location.reload();
        } else {
          $message.error(data.message);
        }
      },
    });
  }

  function onUninstallBatch() {
    const names = [...selectedKeys.value];
    createConfirm({
      title: '批量卸载',
      iconType: 'warning',
      content: (
        <div>
          <p>确定要批量卸载以下 {names.length} 个插件吗？</p>
          <ul>
            {names.map((name, idx) => (
              <li key={name}>
                {idx + 1}. {name}
              </li>
            ))}
          </ul>
          <p>将会删除插件目录包括可能产生的数据以及配置，且无法恢复！</p>
          <p>请谨慎操作，卸载后会立即重启！</p>
        </div>
      ),
      onOk: async () => {
        try {
          loading.value = true;
          const data = await pluginApi.uninstallPlugin(names.join(','));
          if (data.status === 'success') {
            const msgLines = data.message.split('\n');
            createInfoModal({
              title: '批量卸载完成',
              content: (
                <div>
                  {msgLines.map((line) => (
                    <span>
                      {line}
                      <br />
                    </span>
                  ))}
                </div>
              ),
              async onOk() {
                await sleep(3000);
                window.location.reload();
              },
            });
          } else {
            $message.error(data.message);
          }
        } finally {
          loading.value = false;
        }
      },
    });
  }
</script>

<style scoped lang="less">
  .db-hero__desc a {
    color: var(--g-blue);
  }

  .pf-kpi {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin-bottom: 14px;
  }

  .db-kpi__icon.is-plain {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    background: transparent;
    border: none;
    border-radius: 10px;
  }

  .db-plugins {
    padding: 0;
    overflow: hidden;
  }

  /* ---------------- 工具栏 ---------------- */
  .pf-bar {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--g-card-border);
  }

  .pf-bar__filters {
    display: flex;
    gap: 8px;
    align-items: center;
    min-width: 0;
  }

  .pf-bar__ops {
    display: flex;
    flex: none;
    gap: 8px;
    align-items: center;
  }

  .pf-search {
    width: 268px;
  }

  .pf-authors {
    width: 190px;
  }

  .pf-count {
    font-size: 11.5px;
    color: var(--g-text-mute);
    font-variant-numeric: tabular-nums;
  }

  /* 输入框跟随主题 */
  :deep(.ant-input) {
    background: var(--g-card-bg-soft);
    border-color: var(--g-card-border);
  }

  :deep(.ant-select:not(.ant-select-customize-input) .ant-select-selector) {
    background: var(--g-card-bg-soft);
    border-color: var(--g-card-border);
  }

  /* ---------------- 批量条 ---------------- */
  .pf-batch {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    margin: 10px 16px 0;
    background: rgb(98 168 234 / 10%);
    border: 1px solid rgb(98 168 234 / 26%);
    border-radius: 10px;
  }

  .pf-batch__txt {
    font-size: 12px;
    color: var(--g-text-sub);
  }

  .pf-batch__txt b {
    color: var(--g-blue);
  }

  .pf-batch__ops {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  /* ---------------- 表格 ---------------- */
  .pf-table {
    padding: 4px 6px 0;
  }

  :deep(.ant-table) {
    background: transparent;
  }

  :deep(.ant-table-thead > tr > th) {
    height: 36px;
    padding: 8px 12px;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--g-text-mute);
    letter-spacing: 0.4px;
    background: var(--g-card-bg-soft) !important;
    border-bottom: 1px solid var(--g-card-border);
  }

  :deep(.ant-table-thead > tr > th::before) {
    display: none;
  }

  :deep(.ant-table-tbody > tr > td) {
    padding: 9px 12px;
    border-bottom: 1px solid var(--g-card-border);
  }

  :deep(.ant-table-tbody > tr) {
    cursor: pointer;
    transition: background 0.16s ease;
  }

  :deep(.ant-table-tbody > tr:hover > td) {
    background: var(--g-hover) !important;
  }

  :deep(.ant-table-column-sorters) {
    font-size: 11.5px;
  }

  /* 插件单元 */
  .pf-plug {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
  }

  .pf-plug__icon {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 9px;
  }

  .pf-plug__body {
    min-width: 0;
  }

  .pf-plug__name {
    overflow: hidden;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--g-text);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pf-plug__pkg {
    overflow: hidden;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10.5px;
    color: var(--g-text-mute);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* 作者 */
  .pf-authors__list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .pf-author {
    padding: 1px 7px;
    font-size: 11px;
    color: var(--g-text-sub) !important;
    text-decoration: none;
  }

  .pf-author:hover {
    color: var(--g-blue) !important;
  }

  /* 说明 */
  .pf-desc {
    display: -webkit-box;
    overflow: hidden;
    font-size: 12px;
    line-height: 1.55;
    color: var(--g-text-sub);
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  /* 状态徽标 */
  .pf-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .pf-tag {
    padding: 1px 7px;
    font-size: 10.5px;
    font-weight: 550;
    line-height: 16px;
    white-space: nowrap;
    border-radius: 5px;
  }

  .pf-tag.is-ok {
    color: var(--g-green);
    background: rgb(69 185 124 / 14%);
  }

  .pf-tag.is-info {
    color: var(--g-violet);
    background: rgb(157 141 240 / 15%);
  }

  .pf-tag.is-blue {
    color: var(--g-blue);
    background: rgb(98 168 234 / 15%);
  }

  .pf-tag.is-amber {
    color: var(--g-amber);
    background: rgb(211 188 141 / 18%);
  }

  .pf-tag.is-danger {
    color: var(--g-rose);
    background: rgb(255 138 101 / 15%);
  }

  .pf-tag.is-muted {
    color: var(--g-text-mute);
    background: var(--g-chip-bg);
  }

  /* 行内操作 */
  .pf-actions {
    display: flex;
    gap: 2px;
    align-items: center;
    justify-content: flex-end;
  }

  :deep(.pf-actions .ant-btn-link) {
    height: 24px;
    padding: 0 6px;
    font-size: 12px;
  }

  /* ---------------- 页脚 ---------------- */
  .pf-foot {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    padding: 11px 16px;
    border-top: 1px solid var(--g-card-border);
  }

  .pf-foot__tip {
    font-size: 11.5px;
    color: var(--g-text-mute);
  }

  @media (max-width: 1280px) {
    .pf-kpi {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .pf-search {
      width: 210px;
    }
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
