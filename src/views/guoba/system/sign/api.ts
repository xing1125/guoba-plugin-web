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
