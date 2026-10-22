import { defHttp } from '/@/utils/http/axios';

/** 指令使用统计接口封装 */
const enum CmdStatsApi {
  list = '/admin/cmd-stats/list',
}

export interface CmdCount {
  name: string;
  count: number;
}

export interface CmdGroup {
  gid: string;
  name: string;
  count: number;
}

export interface CmdUser {
  uid: string;
  nick: string;
  count: number;
}

/** 每日趋势：后端已按日期正序（旧 → 新），长度等于请求的 days */
export interface CmdDailyItem {
  date: string;
  total: number;
  cmds: number;
  groups: number;
  users: number;
}

export interface CmdStatsResult {
  days: number;
  parsedDays: string[];
  skippedDays: string[];
  total: number;
  cmds: CmdCount[];
  groups: CmdGroup[];
  users: CmdUser[];
  plugins: CmdCount[];
  daily: CmdDailyItem[];
}

export const cmdStatsApi = {
  list: (days: number) => defHttp.get<CmdStatsResult>({ url: CmdStatsApi.list, params: { days } }),
};
