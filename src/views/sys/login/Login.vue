<template>
  <div class="db-login">
    <!-- 柔光底料：深浅主题各一套色场 -->
    <div class="db-login__aurora"></div>

    <div v-if="!sessionTimeout" class="db-login__theme">
      <AppDarkModeToggle />
    </div>

    <div class="db-login__inner">
      <!-- 左：品牌区（xl 以上显示） -->
      <section class="db-login__brand">
        <AppLogo class="db-login__logo" />

        <div class="db-login__eyebrow">YUNZAI BOT · ADMIN CONSOLE</div>
        <h1 class="db-login__title">云崽管理后台</h1>
        <p class="db-login__desc">账号、群聊、插件与签到数据，一个面板全部管起来。用主人身份登录后即可开始。</p>

        <ul class="db-login__feats">
          <li v-for="feat of feats" :key="feat.text">
            <span class="db-login__feat-icon">
              <Icon :icon="feat.icon" :size="13" />
            </span>
            {{ feat.text }}
          </li>
        </ul>

        <img :alt="title" :src="artUrl" class="db-login__art" />

        <div class="db-login__foot">
          <span v-if="version">{{ version }}</span>
          <a v-if="ICPNo" href="https://beian.miit.gov.cn/" target="_blank" class="db-login__icp">{{ ICPNo }}</a>
        </div>
      </section>

      <!-- 右：登录卡 -->
      <section class="db-login__panel">
        <div class="db-login__card">
          <header class="db-login__cardhead">
            <div class="db-login__cardtitle">登录管理后台</div>
            <div class="db-login__cardsub">仅限机器人主人身份登录</div>
          </header>

          <GuobaLoginForm />
          <ForgetPasswordForm />
          <RegisterForm />
          <MobileForm />
          <QrCodeForm />
        </div>
      </section>
    </div>
  </div>
</template>
<script lang="ts" setup>
  import { computed } from 'vue';
  import { AppLogo, AppDarkModeToggle } from '/@/components/Application';
  import Icon from '/@/components/Icon';
  import GuobaLoginForm from './GuobaLoginForm.vue';
  import ForgetPasswordForm from './ForgetPasswordForm.vue';
  import RegisterForm from './RegisterForm.vue';
  import MobileForm from './MobileForm.vue';
  import QrCodeForm from './QrCodeForm.vue';
  import { useGlobSetting } from '/@/hooks/setting';
  import artUrl from '/@/assets/images/yunzai-right.png';

  defineProps({
    sessionTimeout: {
      type: Boolean,
    },
  });

  const globSetting = useGlobSetting();

  const title = computed(() => globSetting?.title ?? '');
  const ICPNo = computed(() => globSetting?.ICPNo ?? '');
  const version = computed(() => {
    const conf = (window as any)['__GUOBA_CONF__'] || {};
    const bot = (window as any)['__YUNZAI_BOT_CONF__'] || {};
    if (conf.VERSION && bot.VERSION) return `锅巴 v${conf.VERSION} · 云崽 v${bot.VERSION}`;
    if (conf.VERSION) return `锅巴 v${conf.VERSION}`;
    return '';
  });

  const feats = [
    { icon: 'ant-design:dashboard-outlined', text: '数据总览与趋势看板' },
    { icon: 'ant-design:team-outlined', text: '账号 / 群聊 / UID 统一管理' },
    { icon: 'ant-design:appstore-outlined', text: '插件配置与数据编辑' },
  ];
</script>

<style lang="less">
  /* 登录页独立命名空间：与框架的 guoba-login 解耦，避免旧样式干扰 */
  @prefix-cls: ~'db-login';
  @ns: ~'@{namespace}';

  .@{prefix-cls} {
    position: relative;
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 100vh;
    overflow: hidden;
    background: var(--g-page-bg);
  }

  /* ---------------- 底料 ---------------- */
  .@{prefix-cls}__aurora {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(680px 460px at 12% 8%, rgb(98 168 234 / 26%), transparent 70%),
      radial-gradient(620px 440px at 88% 18%, rgb(157 141 240 / 22%), transparent 70%),
      radial-gradient(560px 420px at 70% 96%, rgb(211 188 141 / 18%), transparent 72%);
  }

  html[data-theme='dark'] .@{prefix-cls}__aurora {
    background:
      radial-gradient(680px 460px at 10% 4%, rgb(46 63 143 / 46%), transparent 70%),
      radial-gradient(620px 440px at 92% 22%, rgb(91 74 158 / 38%), transparent 70%),
      radial-gradient(560px 420px at 72% 98%, rgb(211 188 141 / 16%), transparent 72%);
  }

  .@{prefix-cls}__theme {
    position: absolute;
    top: 18px;
    right: 22px;
    z-index: 5;
  }

  /* ---------------- 布局 ---------------- */
  .@{prefix-cls}__inner {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 24px;
    align-items: center;
    width: 100%;
    max-width: 1240px;
    padding: 48px 40px;
    margin: 0 auto;
  }

  /* ---------------- 品牌区 ---------------- */
  .@{prefix-cls}__brand {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-height: 420px;
    padding-right: 12px;
  }

  .@{prefix-cls}__logo {
    height: 34px;
    margin-bottom: 26px;
  }

  .@{prefix-cls}__logo .@{namespace}-app-logo__title {
    font-size: 18px;
    font-weight: 650;
    color: var(--g-text);
    letter-spacing: 0.3px;
  }

  .@{prefix-cls}__eyebrow {
    font-size: 11px;
    font-weight: 600;
    color: var(--g-text-mute);
    letter-spacing: 2.2px;
  }

  .@{prefix-cls}__title {
    margin: 10px 0 0;
    font-size: 34px;
    font-weight: 700;
    line-height: 1.25;
    color: var(--g-text);
    letter-spacing: -0.5px;
  }

  .@{prefix-cls}__desc {
    max-width: 380px;
    margin: 12px 0 0;
    font-size: 13.5px;
    line-height: 1.75;
    color: var(--g-text-sub);
  }

  .@{prefix-cls}__feats {
    display: flex;
    flex-direction: column;
    gap: 9px;
    padding: 0;
    margin: 22px 0 0;
    list-style: none;
  }

  .@{prefix-cls}__feats li {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 12.5px;
    color: var(--g-text-sub);
  }

  .@{prefix-cls}__feat-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    color: var(--g-blue);
    background: rgb(98 168 234 / 14%);
    border-radius: 8px;
  }

  .@{prefix-cls}__art {
    position: absolute;
    right: -34px;
    bottom: -18px;
    width: 300px;
    pointer-events: none;
    user-select: none;
    opacity: 0.95;
    filter: drop-shadow(0 18px 36px rgb(0 0 0 / 18%));
    /* 原图带不透明浅底，用椭圆遮罩把四角淡出，避免暗色下露出方块边界 */
    mask-image: radial-gradient(closest-side at 50% 52%, #000 76%, transparent 100%);
  }

  html[data-theme='dark'] .@{prefix-cls}__art {
    opacity: 0.92;
    filter: drop-shadow(0 18px 40px rgb(0 0 0 / 55%));
    mask-image: radial-gradient(closest-side at 50% 52%, #000 72%, transparent 100%);
  }

  .@{prefix-cls}__foot {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    margin-top: auto;
    padding-top: 28px;
    font-size: 11.5px;
    color: var(--g-text-mute);
  }

  .@{prefix-cls}__icp {
    color: var(--g-text-mute);
  }

  .@{prefix-cls}__icp:hover {
    color: var(--g-blue);
  }

  /* ---------------- 登录卡 ---------------- */
  .@{prefix-cls}__panel {
    display: flex;
    justify-content: center;
  }

  .@{prefix-cls}__card {
    width: 100%;
    max-width: 420px;
    padding: 26px 28px 24px;
    background: var(--g-card-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 18px;
    box-shadow: var(--g-card-shadow);
  }

  html[data-theme='dark'] .@{prefix-cls}__card {
    box-shadow:
      0 24px 60px -28px rgb(0 0 0 / 80%),
      0 0 0 1px rgb(255 255 255 / 4%);
  }

  .@{prefix-cls}__cardhead {
    margin-bottom: 18px;
  }

  .@{prefix-cls}__cardtitle {
    font-size: 17px;
    font-weight: 650;
    color: var(--g-text);
    letter-spacing: 0.2px;
  }

  .@{prefix-cls}__cardsub {
    margin-top: 5px;
    font-size: 12px;
    color: var(--g-text-mute);
  }

  /* ---------------- 卡内表单（ant 组件） ---------------- */
  .@{prefix-cls}__card {
    .ant-input {
      min-width: 0 !important;
      background: var(--g-card-bg-soft);
      border-color: var(--g-card-border);
    }

    .ant-input:focus,
    .ant-input-focused {
      border-color: var(--g-blue);
      box-shadow: none;
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
      height: 40px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
  }

  /* ---------------- 响应式 ---------------- */
  @media (max-width: 1100px) {
    .@{prefix-cls}__inner {
      grid-template-columns: minmax(0, 1fr);
      padding: 32px 20px;
    }

    .@{prefix-cls}__brand {
      display: none;
    }

    .@{prefix-cls}__panel {
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .@{prefix-cls}__card {
      padding: 22px 18px 20px;
      border-radius: 16px;
    }
  }
</style>
