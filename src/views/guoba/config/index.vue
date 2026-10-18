<template>
  <Skeleton v-if="pageLoading" active />
  <PageWrapper v-else title="" :loading="loading">
    <section class="db-hero">
      <div class="db-hero__main">
        <div class="db-hero__eyebrow">CONFIGURATION</div>
        <div class="db-hero__title">配置管理</div>
        <div class="db-hero__desc">机器人基础设置、消息策略与各插件配置项，改完即时写入配置文件</div>
      </div>
    </section>

    <div class="db-config">
      <Tabs v-model:activeKey="activeKey" class="db-config__tabs">
        <template v-for="tab in configTabs" :key="tab.key">
          <TabPane :tab="tab.title" />
        </template>
      </Tabs>
    </div>

    <div v-if="!loading && !configTabs.length" class="g-card db-tip" style="margin-top: 14px">
      <div>
        <b>没有读到配置项</b>
        <div class="g-muted">请确认 Bot 的 config 目录可读，或刷新页面重试。</div>
      </div>
    </div>

    <a-row :class="[prefixCls]" justify="center">
      <a-col :xxl="16" :xl="18" :lg="20" :md="22" :sm="24" :xs="24">
        <template v-for="tab of configTabs" :key="tab.key">
          <transition name="scroll-x-transition" mode="out-in">
            <keep-alive>
              <ConfigForm v-if="activeKey === tab.key" :cards="tab.cards" />
            </keep-alive>
          </transition>
        </template>
      </a-col>
    </a-row>
  </PageWrapper>
</template>

<script lang="ts">
  import type { ConfigTabs } from './types';
  import { defineComponent, ref } from 'vue';
  import { Skeleton, Tabs } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import { useDesign } from '/@/hooks/web/useDesign';
  import ConfigForm from './components/ConfigForm.vue';
  import { queryConfigTabs } from './config.api';

  export default defineComponent({
    components: {
      PageWrapper,
      Skeleton,
      Tabs,
      TabPane: Tabs.TabPane,
      ConfigForm,
    },
    setup() {
      const { prefixCls } = useDesign('system-config');
      const loading = ref(true);
      const pageLoading = ref(true);
      const configTabs = ref<ConfigTabs>([]);
      const activeKey = ref('');

      async function loadConfig() {
        loading.value = true;
        try {
          configTabs.value = (await queryConfigTabs()) || [];
          activeKey.value = configTabs.value[0]?.key ?? '';
        } finally {
          loading.value = false;
          pageLoading.value = false;
        }
      }

      loadConfig();

      return {
        prefixCls,
        pageLoading,
        loading,
        configTabs,
        activeKey,
      };
    },
  });
</script>
<style lang="less">
  //noinspection LessUnresolvedVariable
  @ns: ~'@{namespace}';
  @prefix-cls: ~'@{ns}-system-config';

  .@{prefix-cls} {
  }

  .db-config {
    padding: 4px 18px 0;
    margin-top: 14px;
    background: var(--g-card-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 14px;
    box-shadow: var(--g-card-shadow);
  }

  .db-config__tabs {
    margin-bottom: 0;
  }
  .fade-enter-active,
  .fade-leave-active {
    opacity: 1;
    transition: opacity 0.5s;
  }

  .fade-enter,
  .fade-leave-to {
    opacity: 0;
  }
</style>
