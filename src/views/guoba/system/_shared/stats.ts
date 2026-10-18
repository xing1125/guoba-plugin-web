import { defHttp } from '/@/utils/http/axios';

/* ---------------------------------- 类型 ---------------------------------- */

export interface NsDetail {
  key: string;
  count: number;
}

export interface NsBucket {
  ns: string;
  keys: number;
  ratio: number;
  label: string;
  owner: string;
  desc: string;
  known: boolean;
  types: Record<string, number>;
  detail: NsDetail[];
  samples: string[];
}

export interface HistogramResult {
  available: boolean;
  totalKeys: number;
  dbsize: number;
  bucketCount: number;
  knownCount: number;
  scannedAt: string | null;
  buckets: NsBucket[];
}

export interface DailyPoint {
  date: string;
  n: number;
}

export interface GroupRow {
  gid: string;
  name: string;
  recv: number;
  send: number;
  total: number;
  activeDays: number;
  lastDate: string;
  active: Record<string, number>;
  dayTotal: number;
  dayTotalDate: string | null;
  rankKeys: number;
  boundUsers: number;
  avgDaily: number;
  daily: DailyPoint[];
}

export interface GroupSummary {
  groupCount: number;
  todayMsg: number;
  totalMsg: number;
  activeToday: number;
  avgPerGroup: number;
}

export interface TrendPoint {
  date: string;
  recv: number;
  send: number;
  total: number;
}

export interface GroupListResult {
  available: boolean;
  total: number;
  page: number;
  size: number;
  updatedAt?: string;
  summary?: GroupSummary;
  list: GroupRow[];
  trend: TrendPoint[];
}

export interface GroupDetailResult extends GroupRow {
  available: boolean;
  top: { user: string; score: number; name?: string }[];
  topSlot?: string;
}

export interface OverviewCards {
  available: boolean;
  redisKeys: number;
  namespaces: number;
  groupCount: number;
  todayMsg: number;
  totalMsg: number;
  activeToday: number;
  avgPerGroup: number;
  scannedAt: string | null;
  updatedAt: string | null;
}

export interface GameSlice {
  game: string;
  label: string;
  count: number;
}

export interface GameDistResult {
  available: boolean;
  cache: GameSlice[];
  profile: GameSlice[];
}

export interface UserRow {
  uid: string;
  name?: string;
  recv: number;
  send: number;
  total: number;
  activeDays: number;
  firstDate: string;
  lastDate: string;
  avgDaily: number;
}

export interface UserSummary {
  userCount: number;
  totalMsg: number;
  activeToday: number;
  avgPerUser: number;
}

export interface UserListResult {
  available: boolean;
  total: number;
  page: number;
  size: number;
  updatedAt?: string;
  summary?: UserSummary;
  list: UserRow[];
  trend: TrendPoint[];
}

export interface UserDetailResult extends UserRow {
  available: boolean;
  daily: DailyPoint[];
  monthly: DailyPoint[];
}

/* ---------------------------------- 接口 ---------------------------------- */

const enum StatsApi {
  overview = '/admin/stats/overview',
  plugins = '/admin/stats/plugins',
  groups = '/admin/stats/groups',
  trend = '/admin/stats/trend',
  games = '/admin/stats/games',
}

export const statsApi = {
  getOverview() {
    return defHttp.get<OverviewCards>({ url: StatsApi.overview });
  },
  getPlugins(force = false) {
    return defHttp.get<HistogramResult>({ url: StatsApi.plugins, params: force ? { force: 1 } : {} });
  },
  getGroups(params: { keyword?: string; sort?: string; order?: string; page?: number; size?: number }) {
    return defHttp.get<GroupListResult>({ url: StatsApi.groups, params });
  },
  getGroupDetail(gid: string) {
    return defHttp.get<GroupDetailResult>({ url: `/admin/stats/group/${encodeURIComponent(gid)}` });
  },
  getTrend(days = 14) {
    return defHttp.get<{ available: boolean; trend: TrendPoint[] }>({
      url: StatsApi.trend,
      params: { days },
    });
  },
  getGames() {
    return defHttp.get<GameDistResult>({ url: StatsApi.games });
  },
  getUsers(params: { keyword?: string; sort?: string; order?: string; page?: number; size?: number }) {
    return defHttp.get<UserListResult>({ url: '/admin/stats/users', params });
  },
  getUserDetail(uid: string) {
    return defHttp.get<UserDetailResult>({ url: `/admin/stats/user/${encodeURIComponent(uid)}` });
  },
  batchClearGroups(gids: string[], scope: 'activity' | 'ext' | 'all') {
    return defHttp.post<{ total: number; results: { gid: string; deleted: number }[] }>({
      url: '/admin/groups/batch-clear',
      data: { gids, scope },
    });
  },
  getGroupRoles(gid: string) {
    return defHttp.get<{ gid: string; owner: string[]; groupAdmin: string[] }>({
      url: `/admin/groups/roles/${encodeURIComponent(gid)}`,
    });
  },
  setGroupRole(gid: string, role: 'owner' | 'groupAdmin', uids: string | string[], add: boolean) {
    return defHttp.post<{ gid: string; role: string; changed: number }>({
      url: '/admin/groups/role',
      data: { gid, role, uids, add },
    });
  },
  getAISwitches(gids: string[]) {
    return defHttp.get<{ ying: Record<string, boolean>; gm: Record<string, boolean> }>({
      url: '/admin/groups/ai',
      params: { gids: gids.join(',') },
    });
  },
  setAISwitch(scope: 'ying' | 'gm', gids: string[], off: boolean) {
    return defHttp.post<{ scope: string; off: boolean; changed: number }>({
      url: '/admin/groups/ai',
      data: { scope, gids, off },
    });
  },
  getOpsLog(limit = 50) {
    return defHttp.get<{ available: boolean; list: { at: string; action: string; detail: any; by: string }[] }>({
      url: '/admin/groups/ops-log',
      params: { limit },
    });
  },
};

/* ---------------------------------- 工具 ---------------------------------- */

/** 数字格式化：12345 -> 1.23 万 */
export function fmtNum(n: number | null | undefined): string {
  const v = Number(n) || 0;
  if (v >= 100000000) return `${(v / 100000000).toFixed(2)} 亿`;
  if (v >= 10000) return `${(v / 10000).toFixed(2)} 万`;
  return String(v);
}

/** 千分位 */
export function thousands(n: number | null | undefined): string {
  return (Number(n) || 0).toLocaleString('zh-CN');
}

/** 群的短名：123@chatroom -> 123 */
export function shortGid(gid: string): string {
  return String(gid || '').replace(/@chatroom$/, '').replace(/^group-/, '');
}

/** 从日期字符串算「几天前」 */
export function daysAgo(date: string): number | null {
  if (!date) return null;
  const t = new Date(`${date}T00:00:00`).getTime();
  if (Number.isNaN(t)) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((today - t) / 86400000);
}

/** 相对活跃度描述 */
export function activeText(date: string): string {
  const d = daysAgo(date);
  if (d === null) return '—';
  if (d <= 0) return '今天活跃';
  if (d === 1) return '昨天活跃';
  if (d <= 7) return `${d} 天前`;
  if (d <= 30) return `${Math.floor(d / 7)} 周前`;
  if (d <= 365) return `${Math.floor(d / 30)} 个月前`;
  return `${Math.floor(d / 365)} 年前`;
}

/**
 * 图表色板（取自荷花插件主题真源）：
 * 深色 = abyss（深蓝金）：金 #D3BC8D / 蓝 #62A8EA / 绿 #45B97C / 紫 #9D8DF0 / 橙 #FF8A65 / 冰青 #4FC3D9
 * 浅色 = crystal（清透冰雾）：冰川蓝 #2F86C4 / 薰衣草 #8D83E8 / 薄荷 #2E7A58 / 粉 #CE7C9B / 金 #A8813F / 浅蓝 #4FA8D8
 */
export function chartColors(isDark: boolean): string[] {
  return isDark
    ? ['#D3BC8D', '#62A8EA', '#45B97C', '#9D8DF0', '#FF8A65', '#4FC3D9', '#E6EBFF', '#C8A2E8']
    : ['#2F86C4', '#8D83E8', '#2E7A58', '#CE7C9B', '#A8813F', '#4FA8D8', '#1B2430', '#7AAFE5'];
}

/** 主强调色 */
export function primaryColor(isDark: boolean): string {
  return isDark ? '#D3BC8D' : '#2F86C4';
}

/** 次强调色 */
export function secondaryColor(isDark: boolean): string {
  return isDark ? '#62A8EA' : '#8D83E8';
}

/** 根据深浅主题返回 echarts 公共配置 */
export function chartBase(isDark: boolean) {
  const text = isDark ? 'rgba(170,180,223,0.85)' : 'rgba(27,36,48,0.55)';
  const textStrong = isDark ? '#E6EBFF' : '#1B2430';
  const grid = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(38,55,70,0.10)';
  const tooltipBg = isDark ? 'rgba(24,23,54,0.96)' : 'rgba(255,255,255,0.98)';
  return {
    text,
    textStrong,
    grid,
    tooltip: {
      backgroundColor: tooltipBg,
      borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(120,150,180,0.30)',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: textStrong, fontSize: 12 },
      extraCssText: 'border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.24);',
    },
    axisLabel: { color: text, fontSize: 11 },
    splitLine: { lineStyle: { color: grid, type: 'dashed' as const } },
  };
}

/** 双色强调渐变（abyss: 金→蓝 / crystal: 浅蓝→蓝） */
export function accentGradient(echarts: any, isDark: boolean) {
  return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
    { offset: 0, color: isDark ? 'rgba(211,188,141,0.55)' : 'rgba(140,207,240,0.65)' },
    { offset: 1, color: isDark ? '#62A8EA' : '#2F86C4' },
  ]);
}

/** 面积渐变 */
export function areaGradient(echarts: any, color: string, topOpacity = 0.28) {
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: hexToRgba(color, topOpacity) },
    { offset: 1, color: hexToRgba(color, 0) },
  ]);
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** 统一 KPI 渐变色板（每项为一对渐变起止色） */
export function kpiPalette(isDark: boolean) {
  return isDark
    ? {
        blue: ['#62A8EA', '#3C7FD1'],
        cyan: ['#4FC3D9', '#2E9CB8'],
        green: ['#45B97C', '#2F8F60'],
        amber: ['#E0C79A', '#C2A166'],
        violet: ['#9D8DF0', '#7B6AD8'],
        rose: ['#FF9A7A', '#E0664A'],
      }
    : {
        blue: ['#5BA7EA', '#2F86C4'],
        cyan: ['#5FC5DE', '#2E93B8'],
        green: ['#4FBF8B', '#2E7A58'],
        amber: ['#D8B877', '#A8813F'],
        violet: ['#9A90F0', '#6F63D6'],
        rose: ['#F09A7E', '#C25A6E'],
      };
}
