import { defHttp } from '/@/utils/http/axios';

/** 控制台接口封装 */
const enum ConsoleApi {
  status = '/admin/console/status',
  targets = '/admin/console/targets',
  send = '/admin/console/send',
  exec = '/admin/console/exec',
  history = '/admin/console/history',
}

export interface ConsoleStatus {
  online: boolean;
  uins: string[];
  groupCount: number;
  friendCount: number;
  selfId: string;
  master: string;
}

export interface ConsoleTarget {
  id: string;
  name: string;
  count?: number;
  botId?: string;
}

export interface ExecResult {
  kind: 'group' | 'private';
  id: string;
  name: string;
  cmd: string;
  delivered: boolean;
  replies: string[];
  elapsed: number;
}

export interface ConsoleHistoryItem {
  action: 'send' | 'exec';
  kind: 'group' | 'private';
  id: string;
  name: string;
  text?: string;
  cmd?: string;
  delivered?: boolean;
  replies?: string[];
  at: string;
}

export const consoleApi = {
  getStatus: () => defHttp.get<ConsoleStatus>({ url: ConsoleApi.status }),

  getTargets: (kind: 'group' | 'friend', keyword = '') =>
    defHttp.get<ConsoleTarget[]>({ url: ConsoleApi.targets, params: { kind, keyword } }),

  send: (params: { kind: string; id: string; text: string }) =>
    defHttp.post({ url: ConsoleApi.send, params }),

  exec: (params: {
    kind: string;
    id: string;
    cmd: string;
    deliver: boolean;
    asOwner: boolean;
    confirm: boolean;
  }) => defHttp.post<ExecResult>({ url: ConsoleApi.exec, params }),

  getHistory: (limit = 30) => defHttp.get<ConsoleHistoryItem[]>({ url: ConsoleApi.history, params: { limit } }),
};
