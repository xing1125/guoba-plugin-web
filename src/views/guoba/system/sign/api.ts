import { defHttp } from '/@/utils/http/axios';

/** 单条流水里某个游戏的签到状态 */
export interface SignGameState {
  key: string;
  status: 'signed' | 'unbound' | 'failed' | 'unknown';
  days: number | null;
  reward: string | null;
  text: string;
}

export interface SignRecord {
  time: string;
  date: string;
  qq: string;
  profileId: number;
  ok: boolean;
  stage: string;
  source: string;
  coins: { current: number | null; todayGain: number | null; rest: number | null } | null;
  games: SignGameState[];
  message: string;
}

export interface SignTrendPoint {
  date: string;
  total: number;
  ok: number;
  fail: number;
  users: number;
  accounts: number;
  coinAvg: number;
  maxDays: number;
}

export interface SignGameSummary {
  key: string;
  label: string;
  color: string;
  signed: number;
  unbound: number;
  failed: number;
  rate: number;
}

export interface SignToday {
  date: string;
  total: number;
  ok: number;
  fail: number;
  users: number;
  accounts: number;
  coinAvg: number;
  coinTotal: number;
  maxDays: number;
  rate: number;
}

export interface SignOverview {
  available: boolean;
  meta: {
    available: boolean;
    path?: string;
    fileSize?: number;
    lines?: number;
    firstDate?: string | null;
    lastDate?: string | null;
    lastAt?: string | null;
    updatedAt?: string;
  };
  today: SignToday | null;
  trend: SignTrendPoint[];
  games: SignGameSummary[];
  matrix: { dates: string[]; games: { key: string; label: string; color: string; values: number[] }[] };
  recent: {
    time: string;
    qq: string;
    ok: boolean;
    source: string;
    stage: string;
    games: { key: string; status: string; days: number | null }[];
    message: string;
  }[];
  summary?: { days: number; records: number; users: number; avgOkRate: number };
}

export interface SignPage {
  total: number;
  page: number;
  size: number;
  list: SignRecord[];
}

export interface SignRecordQuery {
  date?: string;
  q?: string;
  ok?: '' | 'ok' | 'fail';
  game?: string;
  status?: string;
  page?: number;
  size?: number;
}

export interface SignDayUser {
  qq: string;
  name?: string;
  count: number;
  ok: number;
  fail: number;
  days: number;
  coins: number | null;
  games: Record<string, number>;
  accounts?: number;
  accountNos?: number[];
}

/** 单条失败原因（按游戏粒度） */
export interface SignFailReason {
  game: string;
  label: string;
  /** failed = 签到失败；unbound = 没绑这个游戏；record = 整轮流水兜底说明 */
  kind: 'failed' | 'unbound' | 'record';
  reason: string;
}

/**
 * 账号行：一个微信号下**每个米游社账号（profileId）单独一条**
 * 绑了 3 个号就是 3 条，各自统计，不再合并。
 */
export interface SignDayAccount {
  qq: string;
  name?: string;
  profileId: number;
  accountNo: number;
  count: number;
  ok: number;
  fail: number;
  allOk: boolean;
  days: number;
  coins: number | null;
  games: Record<string, number>;
  signedGames: string[];
  unboundGames: string[];
  failedGames: string[];
  signedLabels: string[];
  unboundLabels: string[];
  failedLabels: string[];
  failReasons: SignFailReason[];
  firstAt: string;
  lastAt: string;
}

export interface SignDay {
  date: string;
  available: boolean;
  total: number;
  ok: number;
  fail: number;
  users: number;
  accounts: number;
  coinAvg: number;
  coinTotal: number;
  maxDays: number;
  rate: number;
  gameStat: Record<string, { signed: number; unbound: number; failed: number }>;
  userList: SignDayUser[];
  accountList?: SignDayAccount[];
  failList?: SignDayAccount[];
  failAccounts?: number;
  reasonAccounts?: number;
  multiAccountUsers?: number;
}

/* ------------------------------ 异常清单 ------------------------------ */

export interface SignIssueExpired {
  ltuid: number;
  checkedAt: string | null;
  uidCount: number;
  games: string[];
  bindIds: string[];
  bindNames: string[];
  exists: boolean;
}

export interface SignIssueOrphan {
  id: string;
  name: string;
  /** empty = 完全没绑；dangling = 全部失效；partial = 部分失效 */
  kind: 'empty' | 'dangling' | 'partial';
  ltuids: number[];
  dangling: number[];
  reason: string;
}

export interface SignIssueStale {
  qq: string;
  name: string;
  profileId: number;
  days: number;
  total: number;
  ok: number;
  fail: number;
  allFail: boolean;
  lastAt: string;
  lastOk: boolean;
  reasons: string[];
}

export interface SignIssues {
  generatedAt: string;
  days: number;
  expired: SignIssueExpired[];
  orphan: SignIssueOrphan[];
  stale: SignIssueStale[];
  counts: {
    expired: number;
    orphan: number;
    stale: number;
    orphanEmpty: number;
    orphanDangling: number;
    staleAllFail: number;
  };
}

export interface SignCleanResult {
  scope: 'expired' | 'orphan' | 'stale';
  skipped?: boolean;
  message?: string;
  deleted?: number;
  scanned?: number;
  failed?: { ltuid?: number; uid?: string; error: string }[];
  detail?: any[];
}

const enum SignApi {
  overview = '/admin/sign/overview',
  records = '/admin/sign/records',
  day = '/admin/sign/day',
  issues = '/admin/sign/issues',
  clean = '/admin/sign/issues/clean',
  userDelete = '/admin/sign/users/delete',
  userRestore = '/admin/sign/users/restore',
}

export const signApi = {
  getOverview(days = 14) {
    return defHttp.get<SignOverview>({ url: SignApi.overview, params: { days } });
  },
  getRecords(params: SignRecordQuery) {
    return defHttp.get<SignPage>({ url: SignApi.records, params });
  },
  getDay(date: string) {
    return defHttp.get<SignDay>({ url: `${SignApi.day}/${date}` });
  },
  getIssues(days = 7) {
    return defHttp.get<SignIssues>({ url: SignApi.issues, params: { days } });
  },
  /** scope=expired 且不传 ids 表示全量清理 CK 失效账号 */
  cleanIssues(payload: { scope: 'expired' | 'orphan' | 'stale'; ids?: string[]; confirm: true }) {
    return defHttp.post<SignCleanResult>({ url: SignApi.clean, params: payload });
  },
  deleteUsers(ids: string[]) {
    return defHttp.post<SignCleanResult>({ url: SignApi.userDelete, params: { ids, confirm: true } });
  },
  restoreUser(id: number) {
    return defHttp.post<{ uid: string; restored: boolean; games: number }>({
      url: SignApi.userRestore,
      params: { id },
    });
  },
};

/* ================================ 鸣潮签到 ================================ */

/** 鸣潮单条流水（对应 schedules 归档里的一个 entry） */
export interface WavesRecord {
  date: string;
  /** 计划触发时刻，如 00:15 */
  time: string;
  qq: string;
  done: boolean;
  ok: boolean;
  /** 失败原因，如「[鸣潮] token 已失效…」 */
  msg: string;
  /** 库街区角色名 */
  name: string;
  roleId: string;
  /** 累计签到天数 */
  sigInNum: number;
  /** 漏签次数 */
  omission: number;
  rewards: { name: string; num: number }[];
  rewardText: string;
}

export interface WavesTrendPoint {
  date: string;
  total: number;
  ok: number;
  fail: number;
  pending: number;
  users: number;
  maxSigIn: number;
  omission: number;
}

export interface WavesToday {
  date: string;
  total: number;
  ok: number;
  fail: number;
  pending: number;
  users: number;
  maxSigIn: number;
  omission: number;
  rate: number;
}

export interface WavesOverview {
  available: boolean;
  meta: {
    available: boolean;
    path?: string;
    files?: number;
    firstDate?: string | null;
    lastDate?: string | null;
    lastAt?: string | null;
    fixedTime?: string;
    mode?: string;
    updatedAt?: string;
  };
  today: WavesToday | null;
  trend: WavesTrendPoint[];
  recent: (WavesRecord & { time: string })[];
  summary?: { days: number; records: number; users: number; avgOkRate: number };
}

export interface WavesDayUser {
  qq: string;
  name: string;
  roleId: string;
  ok: number;
  fail: number;
  sigInNum: number;
  omission: number;
  rewards: string;
  msg: string;
}

export interface WavesDay {
  date: string;
  available: boolean;
  total: number;
  ok: number;
  fail: number;
  pending: number;
  users: number;
  maxSigIn: number;
  omission: number;
  rate: number;
  userList: WavesDayUser[];
}

const enum WavesApi {
  overview = '/admin/sign/waves/overview',
  records = '/admin/sign/waves/records',
  day = '/admin/sign/waves/day',
}

export const wavesApi = {
  getOverview(days = 14) {
    return defHttp.get<WavesOverview>({ url: WavesApi.overview, params: { days } });
  },
  getRecords(params: { date?: string; q?: string; ok?: string; page?: number; size?: number }) {
    return defHttp.get<SignPage>({ url: WavesApi.records, params });
  },
  getDay(date: string) {
    return defHttp.get<WavesDay>({ url: `${WavesApi.day}/${date}` });
  },
};
