<template>
  <PageWrapper :class="[prefixCls]" title="" :loading="loading">
    <MiaoHero
      eyebrow="MIAO V1 · HELP EDITOR"
      title="喵喵帮助配置"
      desc="编辑 miao-plugin 1.x 的帮助卡片：标题、分组、条目与背景图，改动实时预览"
      :chips="heroChips"
      :showTheme="false"
      @save="saveData"
      @rollback="onRollback"
      @backup="onBackup"
    />

    <section class="g-card mh-canvas">
      <header class="db-card__head">
        <span class="db-card__mark"></span>
        <div class="db-card__title-wrap">
          <div class="db-card__title">帮助卡预览</div>
          <div class="db-card__desc">点击标题或任意条目可直接编辑；右上角按钮可更换背景与图标</div>
        </div>
        <div class="db-card__meta">
          <span class="db-card__cnt">{{ helpList?.length ?? 0 }} 组</span>
        </div>
      </header>
      <div class="mh-canvas__body">
        <Transition name="scroll-y-reverse-transition">
          <HelpPanel
            v-if="!pageLoading"
            :cacheVer="cacheVer"
            :versions="versions"
            v-model:helpCfg="helpCfg"
            v-model:helpList="helpList"
            v-model:bgB64="bgB64"
            v-model:mainB64="mainB64"
            v-model:iconB64List="iconB64List"
            v-model:modelData="modelData"
          />
        </Transition>
      </div>
    </section>

    <BackupDrawer @register="registerDrawer" @reload="loadData" />
  </PageWrapper>
</template>

<script lang="ts">
  import { computed, defineComponent, reactive, ref } from 'vue';
  import type { helpCfgType, helpListType, modelDataType } from './types';

  import { useMessage } from '/@/hooks/web/useMessage';
  import { PageWrapper } from '/@/components/Page';
  import MiaoHero from '../_shared/MiaoHero.vue';
  import HelpPanel from './components/HelpPanel.vue';
  import BackupDrawer from './components/BackupDrawer.vue';
  import { useDesign } from '/@/hooks/web/useDesign';
  import { getHelpIconList, getMiaoHelpCfg, saveMiaoHelpCfg } from './miao.api';
  import { useDrawer } from '/@/components/Drawer';

  export default defineComponent({
    name: 'MiaoPluginExtra',
    components: { HelpPanel, MiaoHero, PageWrapper, BackupDrawer },
    setup() {
      const { prefixCls } = useDesign('edit-miao-help');
      const { createMessage: $message, createConfirm } = useMessage();
      const pageLoading = ref<boolean>(true);
      const loading = ref<boolean>(true);
      const cacheVer = ref<number>(0);
      const helpCfg = ref<Nullable<helpCfgType>>(null);
      const helpList = ref<Nullable<helpListType>>(null);
      const bgB64 = ref<Nullable<string>>(null);
      const mainB64 = ref<Nullable<string>>(null);
      const iconB64List = ref<Nullable<string[]>>(null);
      const versions = reactive({
        miao: 'x.x.x',
        yunzai: 'x.x.x',
      });
      const modelData = ref<modelDataType>({
        show: false,
        cell: null,
        cellIndex: null,
        group: null,
        groupIndex: null,
      });
      const [registerDrawer, { openDrawer }] = useDrawer();

      // 页头状态胶囊
      const heroChips = computed(() => {
        const groups = helpList.value?.length ?? 0;
        const items = (helpList.value ?? []).reduce((sum: number, g: any) => sum + (g?.list?.length ?? 0), 0);
        return [
          { text: `${groups} 组 / ${items} 条`, tone: 'ok' },
          { text: `miao ${versions.miao}`, tone: 'mono' },
          { text: `yunzai ${versions.yunzai}`, tone: 'mono' },
        ];
      });

      const saveData = async () => {
        try {
          loading.value = true;
          // 保存配置
          await saveMiaoHelpCfg(helpCfg, helpList, iconB64List, mainB64);
          await loadData();
          $message.success('保存成功~');
        } finally {
          loading.value = false;
        }
      };

      const loadData = async () => {
        try {
          loading.value = true;
          let result = await getMiaoHelpCfg();
          helpCfg.value = result.helpCfg;
          helpList.value = result.helpList;
          versions.miao = result.miaoVersion;
          versions.yunzai = result.yunzaiVersion;
          bgB64.value = null;
          mainB64.value = null;
          iconB64List.value = await getHelpIconList();
        } finally {
          loading.value = false;
          pageLoading.value = false;
          cacheVer.value++;
        }
      };

      loadData();

      function onBackup() {
        openDrawer(true, {});
      }

      function onRollback() {
        createConfirm({
          title: '提示',
          iconType: 'warning',
          content: '确定要放弃所有修改吗？',
          onOk: () => {
            loadData();
          },
        });
      }

      return {
        prefixCls,
        loading,
        pageLoading,
        helpCfg,
        helpList,
        bgB64,
        mainB64,
        iconB64List,
        cacheVer,
        versions,
        modelData,
        heroChips,
        onBackup,
        onRollback,
        loadData,
        saveData,
        registerDrawer,
      };
    },
  });
</script>
<style lang="less">
  //noinspection LessUnresolvedVariable
  @prefix-cls: ~'@{namespace}-edit-miao-help';

  .@{prefix-cls} {
    .ant-page-header {
      padding-right: 8px;
      padding-bottom: 8px;
    }

    @media screen and (max-width: 800px) {
      .size {
        height: 0;
        padding-top: 15.16%;
        position: relative;
      }
    }
  }
</style>
