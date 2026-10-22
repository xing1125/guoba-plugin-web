<template>
  <div
    v-if="getShowDarkModeToggle"
    :class="getClass"
    :title="`主题：${label}（点击切换 跟随系统 → 浅色 → 深色）`"
    role="button"
    tabindex="0"
    @click="cycle"
    @keydown.enter.prevent="cycle"
    @keydown.space.prevent="cycle"
  >
    <div :class="`${prefixCls}-inner`"></div>
    <SvgIcon size="14" name="sun" />
    <SvgIcon size="14" name="moon" />
  </div>
</template>
<script lang="ts" setup>
  import { computed, nextTick, onMounted, ref } from 'vue';
  import { SvgIcon } from '/@/components/Icon';
  import { darkCssIsReady, loadDarkThemeCss } from '@rys-fe/vite-plugin-theme/es/client';
  import { useDesign } from '/@/hooks/web/useDesign';
  import { useRootSetting } from '/@/hooks/setting/useRootSetting';
  import { updateHeaderBgColor, updateSidebarBgColor } from '/@/logics/theme/updateBackground';
  import { updateDarkTheme } from '/@/logics/theme/dark';
  import { ThemeEnum } from '/@/enums/appEnum';
  import { getThemePref, nextThemePref, resolveTheme, setThemePref, themePrefLabel, type ThemePref } from '/@/logics/theme/preference';
  import { useAppStore } from '/@/store/modules/app';

  /**
   * 三态主题开关：跟随系统 → 浅色 → 深色 → 跟随系统
   *
   * 「跟随系统」是默认态：面板读 prefers-color-scheme，系统切深色它跟着切。
   * 用户显式点过之后就锁定，不再被系统改动打断；点回中间那一档恢复跟随。
   */
  const { prefixCls } = useDesign('dark-switch');
  const { getShowDarkModeToggle } = useRootSetting();
  const appStore = useAppStore();

  const pref = ref<ThemePref>(getThemePref());
  const label = computed(() => themePrefLabel(pref.value));

  const getClass = computed(() => [prefixCls, `${prefixCls}--${pref.value}`]);

  /**
   * 深色样式是独立的 css 文件，生产环境下首次切换要等它加载完才生效 ——
   * 表现为「点了没反应，过一会儿才变」，这就是切换不跟手的主因。
   * 提前在挂载时静默预热，切换时就不用等网络了。
   */
  let preloading: Promise<unknown> | null = null;
  function preloadDarkCss() {
    if (!import.meta.env.PROD || darkCssIsReady) return;
    if (!preloading) {
      preloading = loadDarkThemeCss().catch(() => {
        preloading = null;
      });
    }
  }

  onMounted(() => {
    // 不阻塞首屏：空闲时再预取
    const idle = (window as any).requestIdleCallback || ((fn: any) => setTimeout(fn, 1200));
    idle(() => preloadDarkCss());
  });

  /** 切换期间给 html 挂过渡类，让背景/文字颜色平滑过渡而不是硬切 */
  let transitionTimer = 0;
  function withThemeTransition(fn: () => unknown) {
    const htmlRoot = document.getElementById('htmlRoot');
    if (!htmlRoot) {
      fn();
      return;
    }
    htmlRoot.classList.add('theme-switching');
    fn();
    window.clearTimeout(transitionTimer);
    transitionTimer = window.setTimeout(() => {
      htmlRoot.classList.remove('theme-switching');
    }, 380);
  }

  function apply(next: ThemePref) {
    pref.value = next;
    setThemePref(next);
    const mode = resolveTheme(next);

    /** 真正落地主题的一步（改 store + 换 class + 重算头/侧栏底色） */
    const commit = () => {
      appStore.setResolvedDarkMode(mode === ThemeEnum.DARK ? ThemeEnum.DARK : ThemeEnum.LIGHT);
      updateDarkTheme(mode);
      updateHeaderBgColor();
      updateSidebarBgColor();
    };

    preloadDarkCss();

    /**
     * 换主题要重新匹配整份 antd 深色样式表，实测一次切换有 0.4~0.9s 的
     * 全文档样式重算（主线程被占住，期间一帧都出不来）。
     * 用 View Transition 把「旧画面」先拍成快照，重算期间画面不动，
     * 算完再做 260ms 交叉淡入 —— 观感从「卡一下再硬切」变成一次顺滑的过渡。
     * 深色样式还没就绪时不能走这条路（class 是异步生效，快照会拍错），退回颜色过渡。
     */
    const startVT = (document as any).startViewTransition?.bind(document);
    const cssReady = !import.meta.env.PROD || darkCssIsReady;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (startVT && cssReady && !calm) {
      startVT(() => {
        commit();
        return nextTick();
      });
      return;
    }

    // 兜底：挂过渡类让颜色平滑过渡，380ms 后摘掉（常驻 transition 会拖慢滚动）
    withThemeTransition(commit);
  }

  function cycle() {
    apply(nextThemePref(pref.value));
  }
</script>
<style lang="less" scoped>
  @prefix-cls: ~'@{namespace}-dark-switch';

  html[data-theme='dark'] {
    .@{prefix-cls} {
      border: 1px solid rgb(196 188 188);
    }
  }

  .@{prefix-cls} {
    position: relative;
    display: flex;
    /* 三个档位：左 = 浅色，中 = 跟随系统，右 = 深色 */
    width: 66px;
    height: 26px;
    padding: 0 6px;
    margin-left: auto;
    cursor: pointer;
    background-color: #151515;
    border-radius: 30px;
    outline: none;
    justify-content: space-between;
    align-items: center;

    &-inner {
      position: absolute;
      z-index: 1;
      width: 18px;
      height: 18px;
      background-color: #fff;
      border-radius: 50%;
      transition: transform 0.36s cubic-bezier(0.22, 1, 0.36, 1), background 0.36s;
      will-change: transform;
    }

    /* 浅色：滑块在左 */
    &--light &-inner {
      transform: translateX(0);
    }

    /* 深色：滑块在右 */
    &--dark &-inner {
      transform: translateX(36px);
    }

    /* 跟随系统：滑块居中，半白半深灰读作「自动」 */
    &--auto &-inner {
      background: linear-gradient(90deg, #fff 0 50%, #33475b 50% 100%);
      transform: translateX(18px);
    }
  }
</style>
