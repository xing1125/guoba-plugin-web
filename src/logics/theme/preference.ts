import { ThemeEnum } from '/@/enums/appEnum';
import { APP_DARK_MODE_KEY_ } from '/@/enums/cacheEnum';

/**
 * 主题偏好（三态）
 *   auto  —— 跟随系统（默认）。系统切深色，面板跟着深色
 *   light / dark —— 用户在头部开关里显式选过，之后不再跟随系统
 *
 * 只在 localStorage 里存「偏好」，store 里的 darkMode 永远是可用的 light/dark，
 * 这样所有 `getDarkMode === 'dark'` 的地方都不用改。
 */
export type ThemePref = 'auto' | 'light' | 'dark';

const PREF_KEY = '__YING__THEME__PREF__';

const isPref = (v: any): v is ThemePref => v === 'auto' || v === 'light' || v === 'dark';

export function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
}

export function getThemePref(): ThemePref {
  const saved = localStorage.getItem(PREF_KEY);
  if (isPref(saved)) return saved;
  // 老版本只存过显式深浅色：那就算用户已经选过，不硬改成 auto
  const legacy = localStorage.getItem(APP_DARK_MODE_KEY_);
  if (legacy === ThemeEnum.DARK || legacy === ThemeEnum.LIGHT) return legacy as ThemePref;
  return 'auto';
}

export function setThemePref(pref: ThemePref): void {
  localStorage.setItem(PREF_KEY, pref);
  // 同步写入旧键：别的代码（以及降级版本）还在读它
  localStorage.setItem(APP_DARK_MODE_KEY_, resolveTheme(pref));
}

export function resolveTheme(pref: ThemePref): ThemeEnum.LIGHT | ThemeEnum.DARK {
  if (pref === 'auto') return systemPrefersDark() ? ThemeEnum.DARK : ThemeEnum.LIGHT;
  return pref === 'dark' ? ThemeEnum.DARK : ThemeEnum.LIGHT;
}

/** 自动 → 浅色 → 深色 → 自动，开关点一下走一步 */
export function nextThemePref(pref: ThemePref): ThemePref {
  return pref === 'auto' ? 'light' : pref === 'light' ? 'dark' : 'auto';
}

/**
 * 首次进入把偏好落盘：新用户写 auto，老用户把旧的显式选择迁移过来。
 * 这样 localStorage 里永远有明确值，排查「为什么没跟随系统」时不用猜。
 */
export function ensureThemePref(): ThemePref {
  const pref = getThemePref();
  if (localStorage.getItem(PREF_KEY) !== pref) setThemePref(pref);
  return pref;
}

export function themePrefLabel(pref: ThemePref): string {
  return pref === 'auto' ? '跟随系统' : pref === 'light' ? '浅色' : '深色';
}
