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
  import { computed, ref } from 'vue';
  import { SvgIcon } from '/@/components/Icon';
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

  function apply(next: ThemePref) {
    pref.value = next;
    setThemePref(next);
    const mode = resolveTheme(next);
    appStore.setResolvedDarkMode(mode === ThemeEnum.DARK ? ThemeEnum.DARK : ThemeEnum.LIGHT);
    updateDarkTheme(mode);
    updateHeaderBgColor();
    updateSidebarBgColor();
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
