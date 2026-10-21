/**
 * Application configuration
 */
import type { ProjectConfig } from '/#/config';

import { PROJ_CFG_KEY } from '/@/enums/cacheEnum';
import projectSetting from '/@/settings/projectSetting';

import { updateHeaderBgColor, updateSidebarBgColor } from '/@/logics/theme/updateBackground';
import { updateColorWeak } from '/@/logics/theme/updateColorWeak';
import { updateGrayMode } from '/@/logics/theme/updateGrayMode';
import { updateDarkTheme } from '/@/logics/theme/dark';
import { changeTheme } from '/@/logics/theme';

import { useAppStore } from '/@/store/modules/app';
import { useLocaleStore } from '/@/store/modules/locale';

import { getCommonStoragePrefix, getStorageShortName } from '/@/utils/env';

import { primaryColor } from '../../build/config/themeConfig';
import { Persistent } from '/@/utils/cache/persistent';
import { deepMerge } from '/@/utils';
import { ThemeEnum } from '/@/enums/appEnum';
import { ensureThemePref, getThemePref, systemPrefersDark } from '/@/logics/theme/preference';

/** 历史主色（浅蓝），命中即迁移到当前主色 */
const LEGACY_THEME_COLORS = ['#6495ed', '#7180ff'];

// Initial project configuration
export function initAppConfigStore() {
  const localeStore = useLocaleStore();
  const appStore = useAppStore();
  let projCfg: ProjectConfig = Persistent.getLocal(PROJ_CFG_KEY) as ProjectConfig;
  projCfg = deepMerge(projectSetting, projCfg || {});
  // 强制开启深浅色切换按钮：老版本 localStorage 里缓存的 false 会覆盖默认值
  projCfg.showDarkModeToggle = true;
  // 主色换代：旧版本缓存里仍是 #6495ED（偏浅、白字对比不足），直接升到新主色
  if (LEGACY_THEME_COLORS.includes(String(projCfg.themeColor).toLowerCase())) {
    projCfg.themeColor = primaryColor;
  }
  const darkMode = appStore.getDarkMode;
  const {
    colorWeak,
    grayMode,
    themeColor,

    headerSetting: { bgColor: headerBgColor } = {},
    menuSetting: { bgColor } = {},
  } = projCfg;
  try {
    if (themeColor && themeColor !== primaryColor) {
      changeTheme(themeColor);
    }

    grayMode && updateGrayMode(grayMode);
    colorWeak && updateColorWeak(colorWeak);
  } catch (error) {
    console.log(error);
  }
  appStore.setProjectConfig(projCfg);

  // 手机 / 窄屏（<768px）默认折叠侧栏为 mini 模式，保证内容区可用；桌面端不受影响
  if (window.innerWidth < 768) {
    appStore.setProjectConfig({ menuSetting: { collapsed: true } });
  }

  // 首次进入把主题偏好落盘（新用户 auto / 老用户迁移显式选择），必须在 updateDarkTheme 之前
  ensureThemePref();

  // init dark mode
  updateDarkTheme(darkMode);
  if (darkMode === ThemeEnum.DARK) {
    updateHeaderBgColor();
    updateSidebarBgColor();
  } else {
    headerBgColor && updateHeaderBgColor(headerBgColor);
    bgColor && updateSidebarBgColor(bgColor);
  }

  // 跟随系统：系统在深浅色之间切的时候，没显式选过就跟着变（不用刷新页面）
  watchSystemTheme(appStore);

  // init store
  localeStore.initLocale();

  setTimeout(() => {
    clearObsoleteStorage();
  }, 16);
}

/**
 * 监听系统深浅色变化。
 * 只在偏好为 auto（用户没显式选过）时跟随，显式选择后不打断用户。
 */
function watchSystemTheme(appStore: ReturnType<typeof useAppStore>) {
  const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
  if (!mql?.addEventListener) return;
  mql.addEventListener('change', () => {
    if (getThemePref() !== 'auto') return;
    const mode = systemPrefersDark() ? ThemeEnum.DARK : ThemeEnum.LIGHT;
    appStore.setResolvedDarkMode(mode);
    updateDarkTheme(mode);
    updateHeaderBgColor();
    updateSidebarBgColor();
  });
}

/**
 * As the version continues to iterate, there will be more and more cache keys stored in localStorage.
 * This method is used to delete useless keys
 */
export function clearObsoleteStorage() {
  const commonPrefix = getCommonStoragePrefix();
  const shortPrefix = getStorageShortName();

  [localStorage, sessionStorage].forEach((item: Storage) => {
    Object.keys(item).forEach((key) => {
      if (key && key.startsWith(commonPrefix) && !key.startsWith(shortPrefix)) {
        item.removeItem(key);
      }
    });
  });
}
