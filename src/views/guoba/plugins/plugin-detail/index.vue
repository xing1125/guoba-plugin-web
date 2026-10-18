<template>
  <div :class="[prefixCls]">
    <Skeleton v-if="pageLoading" active />
    <div v-else-if="errorRef.isError">
      <Exception :status="errorRef.status" :title="errorRef.title" :subTitle="errorRef.message" btnText="返回插件管理" goPath="/plugins" />
    </div>
    <PageWrapper v-else :loading="loading">
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">PLUGIN CONFIG</div>
          <div class="db-hero__title">
            <span class="pd-icon">
              <PluginIcon :plugin="plugin!" :size="19" />
            </span>
            <a class="pd-title" @click="onOpenPluginModal">{{ plugin!.title }}</a>
            <a v-if="plugin!.link" :href="plugin!.link" target="_blank" class="pd-link">
              <Icon icon="bx:link" :size="14" />
            </a>
          </div>
          <div class="db-hero__desc">{{ plugin!.description }}</div>
          <div class="pd-chips">
            <span v-for="(c, i) in chips" :key="i" class="pd-chip" :class="`is-${c.tone}`">{{ c.text }}</span>
          </div>
        </div>
        <div class="db-hero__side">
          <a-button size="small" pre-icon="ant-design:info-circle" @click="onOpenPluginModal">插件信息</a-button>
        </div>
      </section>

      <div v-if="groupList.length > 1" class="db-cfg">
        <!-- 左侧：配置分组 -->
        <aside class="db-cfg__nav">
          <div class="db-cfg__nav-head">
            <span>配置分组</span>
            <span>{{ pad(groupList.length) }}</span>
          </div>
          <div
            v-for="(group, idx) of groupList"
            :key="group.name"
            class="db-cfg__nav-item"
            :class="{ 'is-active': activeGroupKey === group.name }"
            @click="activeGroupKey = group.name"
          >
            <span class="db-cfg__nav-idx">{{ pad(idx + 1) }}</span>
            <span class="db-cfg__nav-name" :title="group.title">{{ group.title }}</span>
            <span v-if="groupFieldCount[group.name]" class="db-cfg__nav-cnt">{{ groupFieldCount[group.name] }}</span>
          </div>
          <div class="db-cfg__nav-foot">切换分组查看不同配置区块，保存后写入 {{ plugin!.name }} 的配置文件。</div>
        </aside>

        <div class="db-cfg__body">
          <div class="db-cfg__bar">
            <div class="db-cfg__bar-main">
              <span class="db-cfg__bar-title">{{ activeGroupTitle }}</span>
              <span class="db-cfg__bar-sub">{{ activeFieldCount }} 项配置</span>
            </div>
            <div class="db-cfg__bar-ops">
              <a-button type="primary" size="small" pre-icon="ant-design:save" :loading="loading" @click="onSave">保存配置</a-button>
            </div>
          </div>

          <div class="g-card pd-form">
            <PluginConfigForm
              ref="configFormRef"
              soft-grouping
              v-model:activeGroupKey="activeGroupKey"
              v-model:softGroupList="groupList"
              :plugin="plugin!"
            />
          </div>
        </div>
      </div>

      <!-- 只有一个分组时不需要导航，直接铺满 -->
      <div v-else class="g-card pd-form pd-form--flat">
        <PluginConfigForm
          ref="configFormRef"
          soft-grouping
          v-model:activeGroupKey="activeGroupKey"
          v-model:softGroupList="groupList"
          :plugin="plugin!"
        />
        <div class="pd-save">
          <a-button type="primary" pre-icon="ant-design:save" :loading="loading" @click="onSave">保存配置</a-button>
        </div>
      </div>

      <GPluginModal @register="registerModal" />
    </PageWrapper>
  </div>
</template>

<script lang="ts" setup>
  import type { Plugin } from '/#/guoba';
  import { computed, reactive, ref } from 'vue';
  import { router } from '/@/router';
  import Icon from '/@/components/Icon';
  import { Skeleton } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import { Exception } from '/@/views/sys/exception';
  import { useDesign } from '/@/hooks/web/useDesign';
  import { useGuobaStore } from '/@/store/guoba';
  import { ExceptionEnum } from '/@/enums/exceptionEnum';
  import PluginConfigForm from '/@/components/Guoba/src/components/PluginConfigForm.vue';
  import GPluginModal from '/@/components/Guoba/src/GPluginModal.vue';
  import { useModal } from '/@/components/Modal';
  import PluginIcon from '/@/components/Guoba/src/components/PluginIcon.vue';

  const { prefixCls } = useDesign('plugin-detail');
  const guobaStore = useGuobaStore();

  const configFormRef = ref();
  const loading = ref(true);
  const pageLoading = ref(true);

  const errorRef = reactive({
    isError: false,
    status: ExceptionEnum.PAGE_NOT_FOUND,
    title: '404',
    message: '未找到该插件',
  });

  const name = computed(() => (router.currentRoute.value.params?.name ?? '') as string);
  const plugin = ref<Plugin>();

  const activeGroupKey = ref('default');
  const groupList = ref<{ name: string; title: string }[]>([]);

  const activeGroupTitle = computed(() => groupList.value.find((g) => g.name === activeGroupKey.value)?.title ?? '配置项');

  const fieldCount = computed(() => {
    const schemas = (plugin.value?.schemas ?? []) as any[];
    return schemas.filter((s) => s && s.component !== 'SOFT_GROUP_BEGIN' && s.component !== 'Divider').length;
  });

  // 按软分组标记切分，统计每个分组内的字段数
  const groupFieldCount = computed(() => {
    const schemas = (plugin.value?.schemas ?? []) as any[];
    const counts: Record<string, number> = {};
    let cur = 'default';
    for (const s of schemas) {
      if (!s) continue;
      if (s.component === 'SOFT_GROUP_BEGIN') {
        cur = s.label as string;
        counts[cur] = counts[cur] ?? 0;
        continue;
      }
      if (s.component === 'Divider') continue;
      counts[cur] = (counts[cur] ?? 0) + 1;
    }
    return counts;
  });

  const activeFieldCount = computed(() => groupFieldCount.value[activeGroupKey.value] ?? fieldCount.value);

  const chips = computed(() => {
    const p = plugin.value;
    if (!p) return [];
    const list: { text: string; tone: string }[] = [{ text: '已安装', tone: 'ok' }];
    if (p.hasConfig) list.push({ text: '可配置', tone: 'info' });
    if (p.isV3) list.push({ text: 'V3', tone: 'blue' });
    if (p.isV2) list.push({ text: 'V2', tone: 'amber' });
    if (p.isDeleted) list.push({ text: '已失效', tone: 'danger' });
    list.push({ text: `${fieldCount.value} 项配置`, tone: 'muted' });
    list.push({ text: p.name, tone: 'mono' });
    return list;
  });

  function pad(n: number) {
    return String(n).padStart(2, '0');
  }

  async function loadPlugin() {
    try {
      if (!name.value) {
        errorRef.isError = true;
        errorRef.title = '非法的插件名';
        errorRef.message = '遇到该问题请刷新页面重试！';
        errorRef.status = ExceptionEnum.ERROR;
        return;
      }
      const plugins = await guobaStore.getPlugins();
      const find = plugins.find((item) => item.name === name.value);
      if (!find) {
        errorRef.isError = true;
        errorRef.title = '插件不存在';
        errorRef.message = ' ';
        return;
      }
      if (!find.installed) {
        errorRef.isError = true;
        errorRef.status = ExceptionEnum.PAGE_NOT_DATA;
        errorRef.title = '插件未安装';
        errorRef.message = ' ';
        return;
      }
      plugin.value = find;
    } finally {
      pageLoading.value = false;
      loading.value = false;
    }
  }

  loadPlugin();

  async function onSave() {
    try {
      loading.value = true;
      await configFormRef.value!.savePluginConfigData();
    } finally {
      loading.value = false;
    }
  }

  const [registerModal, { openModal }] = useModal();

  function onOpenPluginModal() {
    openModal(true, { plugin: plugin.value });
  }
</script>

<style lang="less">
  //noinspection LessUnresolvedVariable
  @prefix-cls: ~'@{namespace}-plugin-detail';

  .@{prefix-cls} {
    .pd-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      background: var(--g-card-bg-soft);
      border: 1px solid var(--g-card-border);
      border-radius: 10px;
    }

    .pd-title {
      margin-left: 2px;
      color: var(--g-text);
    }

    .pd-link {
      display: inline-flex;
      align-items: center;
      color: var(--g-text-mute);
      transition: color 0.18s ease;
    }

    .pd-link:hover {
      color: var(--g-blue);
    }

    /* 状态与元信息胶囊 */
    .pd-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
    }

    .pd-chip {
      padding: 2px 9px;
      font-size: 11px;
      font-weight: 550;
      line-height: 17px;
      border-radius: 20px;
    }

    .pd-chip.is-ok {
      color: var(--g-green);
      background: rgb(69 185 124 / 14%);
    }

    .pd-chip.is-info {
      color: var(--g-violet);
      background: rgb(157 141 240 / 15%);
    }

    .pd-chip.is-blue {
      color: var(--g-blue);
      background: rgb(98 168 234 / 15%);
    }

    .pd-chip.is-amber {
      color: var(--g-amber);
      background: rgb(211 188 141 / 18%);
    }

    .pd-chip.is-danger {
      color: var(--g-rose);
      background: rgb(255 138 101 / 15%);
    }

    .pd-chip.is-muted {
      color: var(--g-text-sub);
      background: var(--g-chip-bg);
    }

    .pd-chip.is-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10.5px;
      color: var(--g-text-mute);
      background: var(--g-chip-bg);
    }

    .pd-form {
      padding: 18px 18px 4px;
    }

    .pd-form--flat {
      margin-top: 16px;
    }

    .pd-save {
      display: flex;
      justify-content: flex-end;
      padding: 12px 0 14px;
      margin-top: 6px;
      border-top: 1px dashed var(--g-card-border);
    }

    /* 配置表单密度与输入框跟随主题 */
    .pd-form .ant-form-item {
      margin-bottom: 14px;
    }

    .pd-form .ant-form-item-label > label {
      font-size: 12.5px;
      color: var(--g-text-sub);
    }

    .pd-form .ant-input,
    .pd-form .ant-input-number,
    .pd-form .ant-select:not(.ant-select-customize-input) .ant-select-selector {
      background: var(--g-card-bg-soft);
      border-color: var(--g-card-border);
    }
  }
</style>
