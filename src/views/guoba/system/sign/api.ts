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
  count: number;
  ok: number;
  fail: number;
  days: number;
  coins: number | null;
  games: Record<string, number>;
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
}

const enum SignApi {
  overview = '/admin/sign/overview',
  records = '/admin/sign/records',
  day = '/admin/sign/day',
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
