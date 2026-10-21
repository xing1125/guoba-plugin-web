<template>
  <div class="db-login">
    <!-- 底料：天空渐变 + 漂浮气泡（元素取自品牌参考图：水手服天蓝 / 金发暖金 / 背景气泡） -->
    <div class="db-login__sky" aria-hidden="true">
      <span v-for="b of BUBBLES" :key="b" class="db-login__bubble" :class="`is-${b}`" />
    </div>

    <div v-if="!sessionTimeout" class="db-login__theme">
      <AppDarkModeToggle />
    </div>

    <div class="db-login__inner">
      <!-- 左：品牌区 = 锁定区 + 插画 + 版本行，不放任何营销文案 -->
      <section class="db-login__brand">
        <div class="db-login__lockup">
          <span class="db-login__mark">
            <img :src="logoUrl" alt="荧后台" />
          </span>
          <span class="db-login__wordmark">
            <strong class="db-login__name">荧后台</strong>
            <em class="db-login__en">YINGPANEL · YUNZAI ADMIN CONSOLE</em>
          </span>
        </div>

        <!-- 插画：白底已抠成 alpha，整身站在天空底料上 -->
        <figure class="db-login__art">
          <img :src="artUrl" alt="荧 · 水手服插画" />
        </figure>

        <div class="db-login__foot">
          <span v-if="version">{{ version }}</span>
          <a v-if="ICPNo" href="https://beian.miit.gov.cn/" target="_blank" class="db-login__icp">{{ ICPNo }}</a>
        </div>
      </section>

      <!-- 右：登录卡 -->
      <section class="db-login__panel">
        <div class="db-login__card">
          <header class="db-login__cardhead">
            <div class="db-login__cardtitle">登录荧后台</div>
            <div class="db-login__cardsub">仅限机器人主人身份登录</div>
          </header>

          <GuobaLoginForm />
          <ForgetPasswordForm />
          <RegisterForm />
          <MobileForm />
          <QrCodeForm />

          <footer class="db-login__cardfoot">
            <span class="db-login__spark" />
            令牌 24 小时有效 · 退出后需重新验证主人身份
          </footer>
        </div>
      </section>
    </div>
  </div>
</template>
<script lang="ts" setup>
  import { computed } from 'vue';
  import { AppDarkModeToggle } from '/@/components/Application';
  import GuobaLoginForm from './GuobaLoginForm.vue';
  import ForgetPasswordForm from './ForgetPasswordForm.vue';
  import RegisterForm from './RegisterForm.vue';
  import MobileForm from './MobileForm.vue';
  import QrCodeForm from './QrCodeForm.vue';
  import { useGlobSetting } from '/@/hooks/setting';
  import logoUrl from '/@/assets/images/logo.png';
  import artUrl from '/@/assets/images/ying-art.webp';

  defineProps({
    sessionTimeout: {
      type: Boolean,
    },
  });

  const globSetting = useGlobSetting();

  const ICPNo = computed(() => globSetting?.ICPNo ?? '');
  const version = computed(() => {
    const conf = (window as any)['__GUOBA_CONF__'] || {};
    const bot = (window as any)['__YUNZAI_BOT_CONF__'] || {};
    if (conf.VERSION && bot.VERSION) return `荧后台 v${conf.VERSION} · 云崽 v${bot.VERSION}`;
    if (conf.VERSION) return `荧后台 v${conf.VERSION}`;
    return '';
  });

  /* 气泡只放 7 个：再多会盖住画面，而且动画会抢注意力 */
  const BUBBLES = ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const;
</script>

<style lang="less">
  /* 登录页独立命名空间：与框架的 guoba-login 解耦，避免旧样式干扰 */
  @prefix-cls: ~'db-login';

  /* 品牌色（取自参考图：水手服天蓝 / 金发暖金） */
  @sky-500: #4f8fd8;
  @sky-300: #8ec7f3;
  @gold-500: #e2ab4a;

  .@{prefix-cls} {
    position: relative;
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 100vh;
    overflow: hidden;
    background: var(--g-page-bg);
    isolation: isolate;
  }

  /* ---------------- 底料：天空 + 气泡 ---------------- */
  .@{prefix-cls}__sky {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    background:
      radial-gradient(760px 520px at 8% 6%, rgb(142 199 243 / 34%), transparent 68%),
      radial-gradient(620px 460px at 92% 14%, rgb(226 171 74 / 16%), transparent 70%),
      radial-gradient(680px 520px at 68% 96%, rgb(120 190 240 / 16%), transparent 72%);
  }

  html[data-theme='dark'] .@{prefix-cls}__sky {
    background:
      radial-gradient(760px 520px at 6% 2%, rgb(30 88 146 / 62%), transparent 68%),
      radial-gradient(620px 460px at 94% 18%, rgb(120 92 40 / 34%), transparent 70%),
      radial-gradient(680px 520px at 66% 98%, rgb(24 68 118 / 52%), transparent 72%);
  }

  .@{prefix-cls}__bubble {
    position: absolute;
    display: block;
    background:
      radial-gradient(circle at 34% 26%, rgb(255 255 255 / 62%), rgb(255 255 255 / 14%) 46%, rgb(255 255 255 / 0) 70%);
    border: 1px solid rgb(255 255 255 / 46%);
    border-radius: 50%;
    box-shadow: inset -8px -10px 22px rgb(255 255 255 / 28%);
    opacity: 0.9;
    animation: db-bubble-float 16s ease-in-out infinite alternate;
  }

  html[data-theme='dark'] .@{prefix-cls}__bubble {
    border-color: rgb(255 255 255 / 16%);
    box-shadow: inset -8px -10px 22px rgb(255 255 255 / 8%);
    opacity: 0.62;
  }

  .@{prefix-cls}__bubble.is-a { top: 10%; left: 6%; width: 132px; height: 132px; animation-duration: 19s; }
  .@{prefix-cls}__bubble.is-b { top: 66%; left: 16%; width: 62px; height: 62px; animation-duration: 14s; animation-delay: -4s; }
  .@{prefix-cls}__bubble.is-c { top: 6%; left: 74%; width: 96px; height: 96px; animation-duration: 21s; animation-delay: -7s; }
  .@{prefix-cls}__bubble.is-d { top: 72%; left: 82%; width: 168px; height: 168px; animation-duration: 24s; animation-delay: -11s; }
  .@{prefix-cls}__bubble.is-e { top: 30%; left: 48%; width: 38px; height: 38px; animation-duration: 12s; animation-delay: -2s; }
  .@{prefix-cls}__bubble.is-f { top: 44%; left: 90%; width: 28px; height: 28px; animation-duration: 15s; animation-delay: -6s; }
  .@{prefix-cls}__bubble.is-g { top: 88%; left: 6%; width: 34px; height: 34px; animation-duration: 17s; animation-delay: -9s; }

  @keyframes db-bubble-float {
    from {
      transform: translate3d(0, 0, 0) scale(1);
    }

    to {
      transform: translate3d(6px, -22px, 0) scale(1.04);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .@{prefix-cls}__bubble {
      animation: none;
    }
  }

  .@{prefix-cls}__theme {
    position: absolute;
    top: 18px;
    right: 22px;
    z-index: 5;
  }

  /* ---------------- 布局：左右两栏，左边只放品牌与插画 ---------------- */
  .@{prefix-cls}__inner {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 400px);
    gap: 72px;
    align-items: center;
    width: 100%;
    /* 容器 1120：左栏距屏边 200（比 1040 时的 240 收、比 1200 时的 160 松），
       卡片右侧留白与左栏一致，整组往里收一档不至于贴边 */
    max-width: 1120px;
    padding: 56px 40px;
    margin: 0 auto;
  }

  /* ---------------- 品牌区：锁定区 / 插画 / 版本行，三件，无文案 ---------------- */
  .@{prefix-cls}__brand {
    display: flex;
    flex-direction: column;
    gap: 26px;
    align-items: flex-start; /* 三件都贴左：锁定区、立绘、版本行同一条竖线 */
    justify-content: center;
    min-width: 0;
  }

  /* ---------------- 插画（整身立绘） ----------------
   * 白底在 build/brand/gen-login-art.py 里从四边 flood fill 抠成 alpha，
   * 所以既没有白方块也没有卡片边，人物直接站在天空底料上。 */
  .@{prefix-cls}__art {
    /* 同时受视口高约束：矮屏上别把版本行顶出屏幕 */
    width: clamp(200px, min(24vw, 40vh), 320px);
    margin: 0;
    aspect-ratio: 520 / 927;
    pointer-events: none;
  }

  .@{prefix-cls}__art img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  /* 深色下白衬衫会有点刺眼，压一点亮度即可（没有白底了，不需要压很狠） */
  html[data-theme='dark'] .@{prefix-cls}__art img {
    filter: brightness(0.82) saturate(1.04);
  }

  .@{prefix-cls}__lockup {
    display: flex;
    gap: 14px;
    align-items: center;
  }

  .@{prefix-cls}__mark {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    overflow: hidden;
    border-radius: 15px;
    box-shadow: 0 10px 26px -10px rgb(53 99 180 / 62%);
  }

  .@{prefix-cls}__mark img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .@{prefix-cls}__wordmark {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }

  .@{prefix-cls}__name {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.1;
    color: var(--g-text);
    letter-spacing: 0.4px;
  }

  .@{prefix-cls}__en {
    font-size: 9.5px;
    font-style: normal;
    font-weight: 600;
    line-height: 1;
    color: var(--g-text-mute);
    letter-spacing: 2px;
    white-space: nowrap;
  }

  .@{prefix-cls}__foot {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    font-size: 11.5px;
    color: var(--g-text-mute);
  }

  .@{prefix-cls}__icp {
    color: var(--g-text-mute);
  }

  .@{prefix-cls}__icp:hover {
    color: @sky-500;
  }

  /* ---------------- 登录卡 ---------------- */
  .@{prefix-cls}__panel {
    display: flex;
    justify-content: flex-end;
  }

  .@{prefix-cls}__card {
    position: relative;
    width: 100%;
    max-width: 400px;
    padding: 28px 28px 20px;
    overflow: hidden;
    background: var(--g-card-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 20px;
    box-shadow: var(--g-card-shadow);
  }

  /* 顶部一道天蓝→暖金的发丝线，替代原来纯色描边，给卡片一点品牌暗示 */
  .@{prefix-cls}__card::before {
    position: absolute;
    inset: 0 0 auto;
    height: 2px;
    background: linear-gradient(90deg, @sky-300, @sky-500 46%, @gold-500);
    content: '';
  }

  html[data-theme='dark'] .@{prefix-cls}__card {
    box-shadow:
      0 24px 60px -28px rgb(0 0 0 / 80%),
      0 0 0 1px rgb(255 255 255 / 4%);
  }

  .@{prefix-cls}__cardhead {
    margin-bottom: 20px;
  }

  .@{prefix-cls}__cardtitle {
    font-size: 17px;
    font-weight: 650;
    color: var(--g-text);
    letter-spacing: 0.2px;
  }

  .@{prefix-cls}__cardsub {
    margin-top: 6px;
    font-size: 12px;
    color: var(--g-text-mute);
  }

  .@{prefix-cls}__cardfoot {
    display: flex;
    gap: 7px;
    align-items: center;
    justify-content: center;
    margin-top: 16px;
    font-size: 11px;
    color: var(--g-text-mute);
  }

  .@{prefix-cls}__spark {
    width: 5px;
    height: 5px;
    background: @gold-500;
    border-radius: 50%;
    box-shadow: 0 0 6px rgb(226 171 74 / 72%);
  }

  /* ---------------- 卡内表单（ant 组件） ---------------- */
  .@{prefix-cls}__card {
    /* 控件外观交给 design/guoba-controls.less（白底 + 46% 描边 + 聚焦 3px 软环），
     * 这里只放大字号、加宽左右内边距，避免和全局权重打架。 */
    .ant-input,
    .ant-input-affix-wrapper {
      min-width: 0 !important;
      padding: 0 13px;
      font-size: 13.5px;
      border-radius: 11px;
    }

    .ant-input-affix-wrapper > input.ant-input {
      padding: 0;
    }

    .ant-input::placeholder,
    .ant-input-affix-wrapper .ant-input::placeholder {
      font-size: 13px;
      color: var(--g-text-mute);
    }

    .ant-input-affix-wrapper .ant-input-suffix {
      margin-left: 10px;
    }

    .ant-divider {
      margin: 18px 0;
      font-size: 11.5px;
      color: var(--g-text-mute);
      border-color: var(--g-card-border);
    }

    .ant-divider-inner-text {
      font-size: 11.5px;
      color: var(--g-text-mute);
    }

    .ant-empty {
      margin: 0 0 4px;
    }

    .ant-empty-description {
      font-size: 12.5px;
      line-height: 1.7;
      color: var(--g-text-sub);
      text-align: left;
    }

    .ant-btn {
      font-size: 13px;
    }

    .ant-btn-block {
      height: 42px;
      margin-top: 4px;
      font-weight: 600;
      letter-spacing: 1px;
      border-radius: 11px;
    }
  }

  /* ---------------- 响应式 ---------------- */
  @media (max-width: 1180px) {
    .@{prefix-cls}__inner {
      gap: 36px;
      padding: 40px 28px;
    }
  }

  /* 单列：只留锁定区 + 卡片，插画与版本行收起，让登录卡尽快进入视线 */
  @media (max-width: 940px) {
    .@{prefix-cls}__inner {
      grid-template-columns: minmax(0, 1fr);
      gap: 22px;
      align-content: center; /* 不把两行摊满整屏，否则锁定区与卡片之间会空出一大块 */
      justify-items: center;
      padding: 34px 20px 44px;
    }

    .@{prefix-cls}__brand {
      gap: 14px;
    }

    .@{prefix-cls}__art,
    .@{prefix-cls}__foot {
      display: none;
    }

    .@{prefix-cls}__panel {
      justify-content: center;
    }

    .@{prefix-cls}__bubble.is-a,
    .@{prefix-cls}__bubble.is-d {
      opacity: 0.5;
    }
  }

  @media (max-width: 480px) {
    .@{prefix-cls}__mark {
      width: 44px;
      height: 44px;
      border-radius: 13px;
    }

    .@{prefix-cls}__name {
      font-size: 19px;
    }

    .@{prefix-cls}__en {
      font-size: 8.5px;
      letter-spacing: 1.5px;
    }

    .@{prefix-cls}__card {
      padding: 22px 18px 16px;
      border-radius: 16px;
    }
  }
</style>
