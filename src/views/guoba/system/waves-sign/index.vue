<template>
  <PageWrapper title="">
    <div class="g-page ws-page">
      <!-- 页头 -->
      <section class="db-hero ws-hero">
        <div class="ws-hero__main">
          <div class="ws-hero__eyebrow">WAVES SIGN-IN BOARD</div>
          <div class="ws-hero__title">鸣潮签到</div>
          <div class="ws-hero__desc">群签到计划、完成度与漏签明细 · 数据来自 waves-js 签到计划（每日 {{ fixedTime }} 触发）</div>
        </div>
        <div class="ws-hero__side">
          <Button size="small" :loading="checking" @click="probeBoard">
            {{ boardOk ? '重新检测' : '检测看板' }}
          </Button>
        </div>
      </section>

      <!-- 看板 -->
      <section class="ws-frame-wrap">
        <template v-if="boardOk">
          <iframe :src="boardUrl" class="ws-frame" frameborder="0" @load="loaded = true" />
          <div v-if="!loaded" class="ws-frame__loading"><Spin /></div>
        </template>
        <div v-else class="ws-frame-empty">
          <div class="ws-frame-empty__main">签到看板服务未启动</div>
          <div class="ws-frame-empty__sub"> 在「{{ '\u200b' }}配置管理 → Cloudtide Waves-plugin → 看板服务」开启 dashboard.enable 并重启后生效 </div>
        </div>
      </section>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { Button, Spin } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';

  defineOptions({ name: 'WavesSign' });

  const boardUrl = `${location.origin}/waves-dashboard`;
  const boardOk = ref(false);
  const checking = ref(false);
  const loaded = ref(false);
  const fixedTime = ref('00:15');

  async function probeBoard() {
    checking.value = true;
    try {
      /* 同源挂载的是看板 HTML（页面内部自己跨端口调 6177 API，CORS 已放开） */
      const res = await fetch(boardUrl, { cache: 'no-store' });
      const html = res.ok ? await res.text() : '';
      boardOk.value = res.ok && /waves-dashboard|WAVES_API_PORT/i.test(html);
      if (boardOk.value) {
        /* 尝试拿计划时刻做副标题展示（失败不影响主功能） */
        try {
          const s = await fetch(`${location.origin.replace(/:\d+$/, '')}:6177/api/summary`, { cache: 'no-store' });
          if (s.ok) {
            const data = await s.json();
            const m = /固定时刻\s*(\d{2}:\d{2})/.exec(data?.subtitle || '');
            if (m) fixedTime.value = m[1];
          }
        } catch {}
      }
    } catch {
      boardOk.value = false;
    } finally {
      checking.value = false;
    }
  }

  onMounted(probeBoard);
</script>

<style lang="less" scoped>
  .ws-page {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .ws-hero {
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
      color: var(--g-blue);
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

  .ws-frame-wrap {
    position: relative;
    flex: 1;
    min-height: 0;
    margin-top: 12px;
    border: 1px solid var(--g-card-border);
    border-radius: 14px;
    overflow: hidden;
    background: var(--g-card-bg);
    height: calc(100vh - 230px);
  }

  .ws-frame {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
  }

  .ws-frame__loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--g-card-bg);
  }

  .ws-frame-empty {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &__main {
      font-size: 15px;
      color: var(--g-text);
      font-weight: 600;
    }
    &__sub {
      font-size: 12px;
      color: var(--g-text-dim);
    }
  }
</style>
