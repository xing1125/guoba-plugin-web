import type { AccountRow, CkStatus, OverviewResult } from './api';

/** 游戏字典（与 MysUsers.uids 的 key 对齐） */
export const GAME_MAP: Record<string, { name: string; color: string; short: string }> = {
  gs: { name: '原神', short: '原', color: 'gold' },
  sr: { name: '星穹铁道', short: '星', color: 'blue' },
  zzz: { name: '绝区零', short: '绝', color: 'purple' },
  bh3: { name: '崩坏3', short: '崩3', color: 'cyan' },
  bh2: { name: '崩坏学园2', short: '崩2', color: 'geekblue' },
  wd: { name: '未定事件簿', short: '未', color: 'magenta' },
};

export const GAME_OPTIONS = Object.entries(GAME_MAP).map(([value, v]) => ({
  value,
  label: v.name,
}));

export const STATUS_MAP: Record<CkStatus, { text: string; color: string }> = {
  ok: { text: '有效', color: 'success' },
  expired: { text: '已失效', color: 'error' },
  error: { text: '异常', color: 'warning' },
  unknown: { text: '未校验', color: 'default' },
};

export const STATUS_OPTIONS = Object.entries(STATUS_MAP).map(([value, v]) => ({
  value,
  label: v.text,
}));

/** ---------------- 演示数据（后端未接入时兜底，便于 UI 评审） ---------------- */

export const MOCK_OVERVIEW: OverviewResult = {
  accounts: { total: 42, ckOk: 30, expired: 5, unknown: 7, lastCheck: '2026-10-18 01:40:12' },
  uids: { total: 68, byGame: { gs: 27, sr: 19, zzz: 12, bh3: 8, wd: 2 } },
  users: { total: 41, bound: 26 },
  groups: { total: 12, active7d: 9 },
  message: { todaySend: 3847, todayRecv: 2810 },
};

const MOCK_UIDS: Record<string, string[][]> = {
  gs: [['101201451'], ['176513512'], ['265328741'], ['114231496']],
  sr: [['100398381'], ['114477930'], ['123709363'], ['103407985']],
  zzz: [['13085206'], ['15459972'], ['10295834'], []],
  bh3: [['10856736', '215318290'], [], ['274622747', '16080583'], []],
  wd: [['10730320'], [], [], []],
};

export const MOCK_ACCOUNTS: AccountRow[] = [
  {
    ltuid: 7184612,
    accountType: 'mys',
    ckMask: 'ltoken=v2_lZcxUye****9f2a',
    ckLen: 243,
    hasDeviceFp: true,
    uids: { gs: MOCK_UIDS.gs[0], sr: MOCK_UIDS.sr[0], zzz: MOCK_UIDS.zzz[0], bh3: [], bh2: [], wd: [] },
    bindIds: ['wxid_3t6v****22', 'wxid_hqbf****22'],
    ckStatus: 'ok',
    checkedAt: '2026-10-18 01:40:12',
    updatedAt: '2026-09-17 21:25:01',
  },
  {
    ltuid: 10344360,
    accountType: 'mys',
    ckMask: 'ltoken=v2_DmZVYYHB****a31c',
    ckLen: 245,
    hasDeviceFp: false,
    uids: { gs: MOCK_UIDS.gs[1], sr: MOCK_UIDS.sr[1], zzz: [], bh3: [], bh2: [], wd: [] },
    bindIds: ['xml2582****65'],
    ckStatus: 'expired',
    checkedAt: '2026-10-16 04:00:31',
    updatedAt: '2026-08-21 17:51:13',
  },
  {
    ltuid: 17906159,
    accountType: 'mys',
    ckMask: 'ltoken=v2_KpaVvqgn****7bd0',
    ckLen: 245,
    hasDeviceFp: false,
    uids: { gs: MOCK_UIDS.gs[2], sr: MOCK_UIDS.sr[2], zzz: MOCK_UIDS.zzz[1], bh3: MOCK_UIDS.bh3[2], bh2: [], wd: [] },
    bindIds: ['wxid_0cry****32'],
    ckStatus: 'ok',
    checkedAt: '2026-10-18 01:40:13',
    updatedAt: '2026-09-17 15:30:51',
  },
  {
    ltuid: 189971228,
    accountType: 'mys',
    ckMask: 'ltoken=v2_Q55Wy1JT****c9e4',
    ckLen: 248,
    hasDeviceFp: false,
    uids: { gs: MOCK_UIDS.gs[3], sr: MOCK_UIDS.sr[3], zzz: MOCK_UIDS.zzz[2], bh3: MOCK_UIDS.bh3[0], bh2: [], wd: MOCK_UIDS.wd[0] },
    bindIds: [],
    ckStatus: 'unknown',
    checkedAt: null,
    updatedAt: '2026-06-02 16:59:27',
  },
  {
    ltuid: 290389857,
    accountType: 'mys',
    ckMask: 'ltoken=v2_hR8kQ2mN****0a7f',
    ckLen: 244,
    hasDeviceFp: true,
    uids: { gs: [], sr: [], zzz: [], bh3: [], bh2: [], wd: [] },
    bindIds: ['wxid_3t6v****22'],
    ckStatus: 'error',
    checkedAt: '2026-10-17 04:00:08',
    updatedAt: '2026-07-11 09:13:44',
  },
  {
    ltuid: 415863435,
    accountType: 'mys',
    ckMask: 'ltoken=v2_pL3xT9wB****55d1',
    ckLen: 246,
    hasDeviceFp: true,
    uids: { gs: [], sr: [], zzz: [], bh3: [], bh2: [], wd: [] },
    bindIds: ['wxid_0cry****32'],
    ckStatus: 'ok',
    checkedAt: '2026-10-18 01:40:15',
    updatedAt: '2026-09-02 11:22:09',
  },
];
