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

export interface CmdStatsResult {
  days: number;
  parsedDays: string[];
  skippedDays: string[];
  total: number;
  cmds: CmdCount[];
  groups: CmdGroup[];
  users: CmdUser[];
  plugins: CmdCount[];
}

export const cmdStatsApi = {
  list: (days: number) => defHttp.get<CmdStatsResult>({ url: CmdStatsApi.list, params: { days } }),
};
