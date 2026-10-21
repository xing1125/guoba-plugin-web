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
      <!-- 左：品牌区（>940 显示完整叙事，小屏只留锁定区） -->
      <section class="db-login__brand">
        <div class="db-login__brandtext">
          <!-- 品牌锁定区：图标 + 字标。不复用 AppLogo —— 它自带标题，会和字标重复产品名 -->
          <div class="db-login__lockup">
            <span class="db-login__mark">
              <img :src="logoUrl" alt="荧后台" />
            </span>
            <span class="db-login__wordmark">
              <strong class="db-login__name">荧后台</strong>
              <em class="db-login__en">YINGPANEL · YUNZAI ADMIN CONSOLE</em>
            </span>
          </div>

          <h1 class="db-login__title">把云崽的每件事，<br /><span>都收进这块面板</span></h1>
          <p class="db-login__desc">账号、群聊、插件、签到与数据健康——<br />从一条指令，到一块面板。</p>

          <ul class="db-login__feats">
            <li v-for="feat of feats" :key="feat.title">
              <span class="db-login__feat-icon">
                <Icon :icon="feat.icon" :size="17" />
              </span>
              <span class="db-login__feat-body">
                <b>{{ feat.title }}</b>
                <em>{{ feat.text }}</em>
              </span>
            </li>
          </ul>

          <!-- 一句操作提示：比再堆一条卖点更有用，也把品牌区下部的空白填住 -->
          <div class="db-login__tip">
            <span class="db-login__tip-icon">
              <Icon :icon="gm('terminal')" :size="14" />
            </span>
            <span>群里发送 <code>#荧后台登录</code>，主人可直接拿到一次性登录链接</span>
          </div>

          <div class="db-login__foot">
            <span v-if="version">{{ version }}</span>
            <a v-if="ICPNo" href="https://beian.miit.gov.cn/" target="_blank" class="db-login__icp">{{ ICPNo }}</a>
          </div>
        </div>

        <!-- 右侧插画：二创图直接落地，白色底 + 气泡与水手服本身就是品牌视觉 -->
        <figure class="db-login__art">
          <img :src="artUrl" alt="荧 · 水手服插画" />
        </figure>
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
  import Icon from '/@/components/Icon';
  import GuobaLoginForm from './GuobaLoginForm.vue';
  import ForgetPasswordForm from './ForgetPasswordForm.vue';
  import RegisterForm from './RegisterForm.vue';
  import MobileForm from './MobileForm.vue';
  import QrCodeForm from './QrCodeForm.vue';
  import { useGlobSetting } from '/@/hooks/setting';
  import { gm } from '/@/design/gmIcons';
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

  /* 三条卖点：一条能力一行，标题 + 一句说明，比原来的单行短句更好扫读 */
  const feats = [
    { icon: gm('dashboard'), title: '数据总览', text: '群聊、用户、签到的实时趋势' },
    { icon: gm('users'), title: '账号与群聊', text: 'UID / CK 绑定、群权限一处管' },
    { icon: gm('puzzle'), title: '插件与数据', text: '配置热更新、在线备份与恢复' },
  ];

  /* 气泡只放 7 个：再多会盖住文字，而且动画会抢注意力 */
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

  /* ---------------- 布局 ---------------- */
  .@{prefix-cls}__inner {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 420px);
    gap: 64px;
    align-items: center;
    width: 100%;
    max-width: 1260px;
    padding: 56px 40px;
    margin: 0 auto;
  }

  /* ---------------- 品牌区 ---------------- */
  .@{prefix-cls}__brand {
    display: flex;
    gap: 30px;
    align-items: center;
    min-height: 452px;
    padding-right: 8px;
  }

  /* 文字列：固定读到左侧，插画贴在右侧、靠近登录卡 */
  .@{prefix-cls}__brandtext {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
  }

  /* ---------------- 插画（竖版卡片） ----------------
   * 直接用二创原图：白底 + 气泡 + 水手服本身就是这套品牌视觉，
   * 不再手绘。图由 build/brand/gen-login-art.py 从截图裁黑边后导出。 */
  .@{prefix-cls}__art {
    position: relative;
    flex: 0 0 auto;
    width: clamp(200px, 19vw, 250px);
    aspect-ratio: 520 / 927;
    margin: 0;
    border-radius: 22px;
    box-shadow: 0 30px 70px -34px rgb(53 99 180 / 58%);
  }

  .@{prefix-cls}__art img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
  }

  /* 身后一层天蓝柔光，避免白底卡片像"贴"上去 */
  .@{prefix-cls}__art::before {
    position: absolute;
    inset: -12% -16% -8%;
    z-index: -1;
    background:
      radial-gradient(62% 54% at 50% 40%, rgb(142 199 243 / 44%), transparent 72%),
      radial-gradient(52% 40% at 50% 96%, rgb(226 171 74 / 22%), transparent 76%);
    content: '';
    filter: blur(14px);
  }

  /* 深色下才需要底部收暗；浅色页面本身是白的，再叠一层反而把裙摆洗白。
   * 内描边也放这里 —— 图铺满 figure，figure 自身的 inset 阴影会被盖住。 */
  .@{prefix-cls}__art::after {
    position: absolute;
    inset: 0;
    pointer-events: none;
    content: '';
    border-radius: inherit;
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 66%);
  }

  html[data-theme='dark'] .@{prefix-cls}__art {
    box-shadow: 0 34px 80px -30px rgb(0 0 0 / 90%);
  }

  /* 白底原图在深色下刺眼，压一点亮度即可 —— 压太狠会发灰发脏，
   * 深色底 + 一张亮色挂画本来就是好看的对比。 */
  html[data-theme='dark'] .@{prefix-cls}__art img {
    filter: brightness(0.88) saturate(1.02);
  }

  html[data-theme='dark'] .@{prefix-cls}__art::after {
    background: linear-gradient(180deg, rgb(0 0 0 / 0) 76%, rgb(6 14 26 / 26%));
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 18%);
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

  .@{prefix-cls}__title {
    margin: 34px 0 0;
    font-size: 38px;
    font-weight: 700;
    line-height: 1.34;
    color: var(--g-text);
    letter-spacing: -0.8px;
  }

  .@{prefix-cls}__title span {
    color: @sky-500;
  }

  html[data-theme='dark'] .@{prefix-cls}__title span {
    color: @sky-300;
  }

  .@{prefix-cls}__desc {
    max-width: 420px;
    margin: 16px 0 0;
    font-size: 13.5px;
    line-height: 1.8;
    color: var(--g-text-sub);
  }

  /* 卖点：图标块 + 标题/说明两行 */
  .@{prefix-cls}__feats {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 0;
    margin: 30px 0 0;
    list-style: none;
  }

  .@{prefix-cls}__feats li {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .@{prefix-cls}__feat-icon {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    color: @sky-500;
    background: linear-gradient(160deg, rgb(142 199 243 / 30%), rgb(142 199 243 / 12%));
    border: 1px solid rgb(142 199 243 / 38%);
    border-radius: 11px;
  }

  html[data-theme='dark'] .@{prefix-cls}__feat-icon {
    color: @sky-300;
    background: linear-gradient(160deg, rgb(80 140 210 / 26%), rgb(80 140 210 / 8%));
    border-color: rgb(142 199 243 / 18%);
  }

  .@{prefix-cls}__feat-body {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .@{prefix-cls}__feat-body b {
    font-size: 13px;
    font-weight: 650;
    color: var(--g-text);
  }

  .@{prefix-cls}__feat-body em {
    font-size: 12px;
    font-style: normal;
    color: var(--g-text-mute);
  }

  .@{prefix-cls}__foot {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    margin-top: auto;
    padding-top: 30px;
    font-size: 11.5px;
    color: var(--g-text-mute);
  }

  /* 操作提示条 */
  .@{prefix-cls}__tip {
    display: inline-flex;
    gap: 9px;
    align-items: center;
    padding: 9px 13px 9px 10px;
    margin-top: 28px;
    font-size: 12px;
    color: var(--g-text-sub);
    background: rgb(255 255 255 / 56%);
    border: 1px solid var(--g-card-border);
    border-radius: 12px;
  }

  html[data-theme='dark'] .@{prefix-cls}__tip {
    background: rgb(255 255 255 / 4%);
  }

  .@{prefix-cls}__tip-icon {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    color: @sky-500;
  }

  .@{prefix-cls}__tip code {
    padding: 1px 6px;
    font-family: ui-monospace, Consolas, monospace;
    font-size: 11.5px;
    color: darken(@sky-500, 10%);
    background: rgb(142 199 243 / 22%);
    border-radius: 5px;
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
    max-width: 420px;
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
      grid-template-columns: minmax(0, 1fr) minmax(0, 400px);
      gap: 40px;
      padding: 40px 28px;
    }

    .@{prefix-cls}__title {
      font-size: 32px;
    }
  }

  /* 插画占宽较多，右侧文字少于 ~410px 时先撤掉它，文字优先。
   * 1260 正好是容器上限，低于此值时文字列会明显变窄，宁可不放图。 */
  @media (max-width: 1259px) {
    .@{prefix-cls}__art {
      display: none;
    }
  }

  /* 单列：品牌区收成「锁定区」，其余叙事隐藏，让登录卡尽快进入视线 */
  @media (max-width: 940px) {
    .@{prefix-cls}__inner {
      grid-template-columns: minmax(0, 1fr);
      gap: 22px;
      align-content: center; /* 不把两行摊满整屏，否则锁定区与卡片之间会空出一大块 */
      justify-items: center;
      padding: 34px 20px 44px;
    }

    .@{prefix-cls}__brand {
      flex-direction: column;
      align-items: center;
      min-height: 0;
      padding-right: 0;
      text-align: center;
    }

    .@{prefix-cls}__brandtext {
      align-items: center;
    }

    .@{prefix-cls}__title,
    .@{prefix-cls}__desc,
    .@{prefix-cls}__feats,
    .@{prefix-cls}__tip,
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
