/**
 * gmg —— 后台「毛玻璃」菜单图标集（Iconify JSON 格式，运行时 addCollection 注册）
 *
 * 为什么单独一族：
 *  侧栏/导航需要的是「有色彩、有材质」的图标块，而工具栏、按钮里的图标必须跟随文字色
 *  （currentColor）才不会在深浅主题下打架。所以分成两族：
 *    gm  —— 线性 duotone，跟随 currentColor，用在按钮/工具条/表格操作
 *    gmg —— 毛玻璃方块，固定配色，用在侧栏菜单与导航卡
 *
 * 设计语言（24×24 网格，与 gm 共用同一套笔画骨架）：
 *  · 底板：22×22 圆角 6.6 的方块，双色渐变（同色系由浅到深）
 *  · 玻璃感：顶部白色高光渐变 + 底部暗角 + 1px 白色描边（38% 不透明）
 *  · 图形：复用 gm 的笔画（currentColor 替换为白色），缩放 0.7 居中，形成「玻璃里嵌白色图形」
 *
 * 工程注意：
 *  · 渐变 id 必须带图标名做前缀，不然同一页面多个图标会互相串色
 *  · 源码里不要写「前缀:名称」字面量，用下面的 gmg() 拼接，否则 purge-icons 整批收集失败
 */
import { GM_COLLECTION } from './gmIcons';

type GmIcon = { body: string };

/** 六组色相，语义分配见 GLASS_SPEC（深端压得足够重，白图形在 18px 下才有对比） */
const HUES = {
  blue: ['#4f9ee8', '#1f55b6'],
  violet: ['#8a7bf2', '#4c39bd'],
  teal: ['#2fc4b0', '#0a7d75'],
  amber: ['#f0ae4e', '#c06e13'],
  rose: ['#ef6d8d', '#b8325a'],
  green: ['#57c483', '#1a7a50'],
} as const;

type HueName = keyof typeof HUES;

/**
 * 每个菜单项一支玻璃图标：key = gm 里的笔画名，value = 色相。
 * 色相按功能分组，不是随手配的：
 *   blue   核心入口（首页 / 控制台 / 导航）
 *   violet 数据与分析（总览 / 大屏 / 数据库 / 审计 / 诊断）
 *   amber  人与关系（群 / 用户 / AI 私聊）
 *   rose   权限与安全（后台用户 / 账号凭证）
 *   teal   内容与运营（图库 / 签到 / 插件数据的心脏）
 *   green  结构与系统（文件 / 插件 / 配置 / 日志 / 关于）
 */
const GLASS_SPEC: Record<string, HueName> = {
  home: 'blue',
  console: 'blue',
  nav: 'blue',

  dashboard: 'violet',
  gauge: 'violet',
  database: 'violet',
  dbcheck: 'violet',
  clipboard: 'violet',
  pulse: 'violet',
  'plugin-chart': 'violet',

  users: 'amber',
  user: 'amber',
  bot: 'amber',

  shield: 'rose',
  fingerprint: 'rose',
  bell: 'rose',

  image: 'teal',
  'calendar-check': 'teal',
  heart: 'teal',

  folder: 'green',
  cpu: 'green',
  puzzle: 'green',
  sliders: 'green',
  terminal: 'green',
  info: 'green',
  gamepad: 'green',
  'plugins-data': 'green',
  'plugin-list': 'green',
  'plugin-config': 'green',
};

/**
 * 部分菜单的 gm 笔画自带外框（卡片式），嵌进玻璃底板后会变成「框套框」，很脏。
 * 这里换成不带外框的同类笔画，语义不变：
 *   插件列表 → 列表点线   插件配置 → 滑杆   插件数据 → 方块阵   插件图表 → 柱状图
 */
const GLYPH_OVERRIDE: Record<string, string> = {
  'plugin-list': 'list',
  'plugin-config': 'sliders',
  'plugin-chart': 'chart',
  'plugins-data': 'grid',
};

/** 图形缩放：24 → 17.8，四周留 3.1 的内边距，让玻璃底板露得出来 */
const GLYPH_SCALE = 0.74;
const GLYPH_OFFSET = 3.1;

/**
 * 小尺寸下 duotone 的浅色填充会整片糊掉，把填充透明度整体提亮 15%。
 * 图形轮廓靠描边撑住，填充只做"体积感"，所以提亮不会脏。
 */
function liftFills(body: string): string {
  return body.replace(/fill-opacity="\.(\d+)"/g, (_, d) => {
    const v = Math.min(1, Number(`0.${d}`) + 0.15);
    return `fill-opacity="${v.toFixed(2).replace(/^0/, '')}"`;
  });
}

function glassBody(key: string, hue: HueName): string {
  const [light, deep] = HUES[hue];
  const glyphKey = GLYPH_OVERRIDE[key] ?? key;
  const glyph = (GM_COLLECTION.icons as Record<string, GmIcon>)[glyphKey];
  if (!glyph) return '';
  const art = liftFills(glyph.body.replaceAll('currentColor', '#fff'));
  const id = `gmg-${key}`;

  return (
    `<defs>` +
    `<linearGradient id="${id}-fill" x1=".1" y1="0" x2=".9" y2="1">` +
    `<stop offset="0" stop-color="${light}"/>` +
    `<stop offset="1" stop-color="${deep}"/>` +
    `</linearGradient>` +
    `<linearGradient id="${id}-hi" x1="0" y1="0" x2=".25" y2="1">` +
    `<stop offset="0" stop-color="#fff" stop-opacity=".42"/>` +
    `<stop offset=".55" stop-color="#fff" stop-opacity=".07"/>` +
    `<stop offset="1" stop-color="#fff" stop-opacity="0"/>` +
    `</linearGradient>` +
    `<linearGradient id="${id}-shade" x1="0" y1=".4" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#000" stop-opacity="0"/>` +
    `<stop offset="1" stop-color="#000" stop-opacity=".22"/>` +
    `</linearGradient>` +
    `</defs>` +
    /* 底板 + 顶部高光 + 底部暗角 + 玻璃描边 */
    `<rect x="1.1" y="1.1" width="21.8" height="21.8" rx="6.2" fill="url(#${id}-fill)"/>` +
    `<rect x="1.1" y="1.1" width="21.8" height="21.8" rx="6.2" fill="url(#${id}-hi)"/>` +
    `<rect x="1.1" y="1.1" width="21.8" height="21.8" rx="6.2" fill="url(#${id}-shade)"/>` +
    `<rect x="1.55" y="1.55" width="20.9" height="20.9" rx="5.75" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width=".9"/>` +
    /* 高光弧：左上角一道反光，玻璃的"厚度"就靠它 */
    `<path d="M4 6.2c1-1.9 3-3.2 5.3-3.6" fill="none" stroke="#fff" stroke-opacity=".46" stroke-width="1.1" stroke-linecap="round"/>` +
    /* 白色图形 */
    `<g transform="translate(${GLYPH_OFFSET} ${GLYPH_OFFSET}) scale(${GLYPH_SCALE})">${art}</g>`
  );
}

const icons: Record<string, GmIcon> = {};
for (const [key, hue] of Object.entries(GLASS_SPEC)) {
  const body = glassBody(key, hue);
  if (body) icons[key] = { body };
}

export const GMC_COLLECTION = {
  prefix: 'gmg',
  icons,
  width: 24,
  height: 24,
} as const;

/** 运行时拼玻璃图标名（避免源码出现「前缀:名称」字面量） */
export const gmg = (name: string) => GMC_COLLECTION.prefix + ':' + name;

/** 全部玻璃图标名（预览页 / 覆盖率自检用） */
export const GMC_ICON_NAMES: string[] = Object.keys(GMC_COLLECTION.icons);

/** 每个图标用的色相，预览页据此分组展示 */
export const GMC_ICON_HUES = GLASS_SPEC;
