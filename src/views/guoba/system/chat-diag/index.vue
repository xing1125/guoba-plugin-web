<template>
  <PageWrapper title="">
    <div class="g-page cd-page">
      <!-- 页头 -->
      <section class="db-hero cd-hero">
        <div class="cd-hero__main">
          <div class="cd-hero__eyebrow">CHAT DIAGNOSIS</div>
          <div class="cd-hero__title">聊天诊断</div>
          <div class="cd-hero__desc">荧 · 群聊聊天记录诊断大屏：回复质量、优先级分档与用户关系视图</div>
        </div>
        <div class="cd-hero__side">
          <Button size="small" @click="openStandalone">独立窗口打开</Button>
        </div>
      </section>

      <!-- 大屏 -->
      <section class="cd-frame-wrap">
        <iframe :src="boardUrl" class="cd-frame" frameborder="0" @load="loaded = true" />
        <div v-if="!loaded" class="cd-frame__loading"><Spin /></div>
      </section>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { Button, Spin } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import { useGlobSetting } from '/@/hooks/setting';
  import { useUserStore } from '/@/store/modules/user';

  defineOptions({ name: 'ChatDiag' });

  const glob = useGlobSetting();
  /** 诊断大屏由 YingAIGroupPageController 免登录宿主，数据走登录态 API */
  const base = (glob.apiUrl || '/guoba').replace(/\/api\/?$/, '');
  const boardUrl = `${location.origin}${base}/yingai-group`;
  const loaded = ref(false);

  /* 兼容旧会话：持久化缓存是加密的，大屏读不到；进页时把明文 token 镜像一份 */
  onMounted(() => {
    try {
      const t = useUserStore().getToken;
      if (t) localStorage.setItem('GDT_TOKEN', t);
    } catch {}
  });

  function openStandalone() {
    window.open(boardUrl, '_blank', 'noopener');
  }
</script>

<style lang="less" scoped>
  .cd-page {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .cd-hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    padding: 18px 20px;
    border: 1px solid var(--g-card-border);
    border-radius: 14px;
    background: var(--g-card-bg);
    flex-shrink: 0;

    &__eyebrow {
      font-size: 11px;
      letter-spacing: 0.28em;
      color: var(--g-violet);
      font-weight: 600;
    }
    &__title {
      font-size: 22px;
      font-weight: 700;
      color: var(--g-text);
      margin-top: 2px;
    }
    &__desc {
      font-size: 12px;
      color: var(--g-text-dim);
      margin-top: 4px;
    }
    &__main {
      min-width: 0;
    }
    &__side {
      display: flex;
      gap: 8px;
      align-items: center;
    }
  }

  .cd-frame-wrap {
    position: relative;
    flex: 1;
    min-height: 0;
    margin-top: 12px;
    border: 1px solid var(--g-card-border);
    border-radius: 14px;
    overflow: hidden;
    background: #0a0c14;
    height: calc(100vh - 210px);
  }

  .cd-frame {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
  }

  .cd-frame__loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0a0c14;
  }
</style>
