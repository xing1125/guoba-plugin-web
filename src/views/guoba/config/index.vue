<template>
  <Skeleton v-if="pageLoading" active />
  <PageWrapper v-else title="" :loading="loading">
    <section class="db-hero">
      <div class="db-hero__main">
        <div class="db-hero__eyebrow">CONFIGURATION</div>
        <div class="db-hero__title">配置管理</div>
        <div class="db-hero__desc">机器人基础设置、消息策略与各插件配置项，改完即时写入配置文件</div>
      </div>
      <div class="db-hero__side">
        <span class="db-hero__time">{{ configTabs.length }} 个分组 · {{ totalFieldCount }} 项配置</span>
      </div>
    </section>

    <div v-if="!loading && !configTabs.length" class="g-card db-tip" style="margin-top: 14px">
      <div>
        <b>没有读到配置项</b>
        <div class="g-muted">请确认 Bot 的 config 目录可读，或刷新页面重试。</div>
      </div>
    </div>

    <div v-else-if="activeTab" class="db-cfg">
      <!-- 左侧：配置分组导航 -->
      <aside class="db-cfg__nav">
        <div class="db-cfg__nav-head">
          <span>配置分组</span>
          <span>{{ pad(configTabs.length) }}</span>
        </div>
        <div
          v-for="(tab, idx) of configTabs"
          :key="tab.key"
          class="db-cfg__nav-item"
          :class="{ 'is-active': activeKey === tab.key }"
          @click="activeKey = tab.key"
        >
          <span class="db-cfg__nav-idx">{{ pad(idx + 1) }}</span>
          <span class="db-cfg__nav-name" :title="tab.title">{{ tab.title }}</span>
          <span class="db-cfg__nav-cnt">{{ tab.cards.length }}</span>
        </div>
        <div class="db-cfg__nav-foot">选择左侧分组切换配置集，改动保存后立即写入配置文件。</div>
      </aside>

      <!-- 右侧：配置工作区 -->
      <div class="db-cfg__body">
        <div class="db-cfg__bar">
          <div class="db-cfg__bar-main">
            <span class="db-cfg__bar-title">{{ activeTab.title }}</span>
            <span class="db-cfg__bar-sub">{{ activeTab.cards.length }} 个配置块 · {{ activeFieldCount }} 项</span>
          </div>
          <div class="db-cfg__bar-ops">
            <a-button size="small" @click="toggleAll">{{ allFolded ? '展开全部' : '收起全部' }}</a-button>
            <a-tooltip title="重新读取配置">
              <span class="db-cfg__icon-btn" @click="reloadConfig">
                <Icon :icon="$gm('refresh')" :size="14" />
              </span>
            </a-tooltip>
          </div>
        </div>

        <ConfigForm ref="configFormRef" :key="activeTab.key" :cards="activeTab.cards" />
      </div>
    </div>

    <!-- 全局悬浮保存：fixed 右下角，不随内容滚动 -->
    <div v-if="activeTab" class="cfg-fab" :class="{ 'is-busy': fabSaving }" @click="onSaveAll">
      <Icon :icon="fabSaving ? $gm('refresh') : $gm('save')" :size="15" :spin="fabSaving" />
      <span>{{ fabSaving ? '保存中…' : '保存全部' }}</span>
      <span class="cfg-fab__cnt">{{ activeTab.cards.length }} 块</span>
    </div>
  </PageWrapper>
</template>

<script lang="ts">
  import type { ConfigTabs } from './types';
  import { computed, defineComponent, provide, reactive, ref, watch } from 'vue';
  import { Skeleton } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import Icon from '/@/components/Icon';
  import { useDesign } from '/@/hooks/web/useDesign';
  import ConfigForm from './components/ConfigForm.vue';
  import { queryConfigTabs } from './config.api';

  export default defineComponent({
    components: {
      PageWrapper,
      Skeleton,
      Icon,
      ConfigForm,
    },
    setup() {
      const { prefixCls } = useDesign('system-config');
      const loading = ref(true);
      const pageLoading = ref(true);
      const configTabs = ref<ConfigTabs>([]);
      const activeKey = ref('');
      const configFormRef = ref<any>(null);
      const fabSaving = ref(false);

      async function onSaveAll() {
        if (fabSaving.value) return;
        fabSaving.value = true;
        try {
          await configFormRef.value?.saveAll();
        } finally {
          fabSaving.value = false;
        }
      }

      // 折叠信号：CardForm 通过 inject 读取，实现「收起/展开全部」
      const foldSignal = reactive({ mode: 'expand' as 'expand' | 'collapse', tick: 0 });
      provide('cfgFoldSignal', foldSignal);
      const allFolded = ref(false);

      const activeTab = computed(() => configTabs.value.find((tab) => tab.key === activeKey.value) ?? null);

      function countFields(cards: any[] | undefined) {
        return (cards ?? []).reduce((sum, card) => {
          const schemas = (card?.schemas ?? []) as any[];
          return sum + schemas.filter((s) => s && s.component !== 'SOFT_GROUP_BEGIN' && s.component !== 'Divider').length;
        }, 0);
      }

      const totalFieldCount = computed(() => configTabs.value.reduce((sum, tab) => sum + countFields(tab.cards as any[]), 0));
      const activeFieldCount = computed(() => countFields(activeTab.value?.cards as any[]));

      function toggleAll() {
        allFolded.value = !allFolded.value;
        foldSignal.mode = allFolded.value ? 'collapse' : 'expand';
        foldSignal.tick++;
      }

      function pad(n: number) {
        return String(n).padStart(2, '0');
      }

      async function loadConfig() {
        loading.value = true;
        try {
          configTabs.value = (await queryConfigTabs()) || [];
          if (!configTabs.value.some((tab) => tab.key === activeKey.value)) {
            activeKey.value = configTabs.value[0]?.key ?? '';
          }
        } finally {
          loading.value = false;
          pageLoading.value = false;
        }
      }

      function reloadConfig() {
        allFolded.value = false;
        foldSignal.mode = 'expand';
        foldSignal.tick++;
        loadConfig();
      }

      loadConfig();

      // 切换分组后卡片会重新挂载，折叠状态回到默认
      watch(activeKey, () => {
        allFolded.value = false;
      });

      return {
        prefixCls,
        pageLoading,
        loading,
        configTabs,
        activeKey,
        activeTab,
        allFolded,
        totalFieldCount,
        activeFieldCount,
        pad,
        toggleAll,
        reloadConfig,
        configFormRef,
        fabSaving,
        onSaveAll,
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

  .fade-enter-active,
  .fade-leave-active {
    opacity: 1;
    transition: opacity 0.5s;
  }

  .fade-enter,
  .fade-leave-to {
    opacity: 0;
  }

  /* 全局悬浮保存胶囊：fixed 右下角，与插件配置页 .pd-save 同一视觉语言 */
  .cfg-fab {
    position: fixed;
    right: 30px;
    bottom: 34px;
    z-index: 90;
    display: inline-flex;
    gap: 8px;
    align-items: center;
    padding: 0 20px;
    height: 42px;
    font-size: 13.5px;
    font-weight: 650;
    color: #fff;
    cursor: pointer;
    user-select: none;
    background: linear-gradient(135deg, var(--g-blue), #2f86d8);
    border-radius: 999px;
    box-shadow:
      0 10px 26px -8px rgb(47 134 196 / 55%),
      0 2px 8px rgb(0 0 0 / 18%);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      filter 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow:
        0 14px 30px -8px rgb(47 134 196 / 65%),
        0 4px 12px rgb(0 0 0 / 22%);
    }

    &.is-busy {
      cursor: wait;
      filter: saturate(0.7);
    }

    .cfg-fab__cnt {
      padding: 1px 9px;
      font-size: 10.5px;
      font-weight: 500;
      color: rgb(255 255 255 / 88%);
      background: rgb(255 255 255 / 18%);
      border-radius: 20px;
    }
  }

  /* ---------------- 移动端 ----------------
   * 悬浮保存胶囊在 390px 下会压住最后一个配置项（截图里盖住「日志 ID」输入框）。
   * 改成贴底通栏；.db-cfg__body 已有 64px 底部留白，正好挡住高度。 */
  @media (max-width: 768px) {
    .cfg-fab {
      right: 12px;
      bottom: calc(12px + env(safe-area-inset-bottom, 0px));
      left: 12px;
      justify-content: center;
      height: 44px;
      padding: 0 16px;
      font-size: 13px;
      border-radius: 12px;
    }

    .db-hero__time {
      font-size: 11.5px;
    }
  }
</style>
