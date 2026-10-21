import { defHttp } from '/@/utils/http/axios';

/** 荧实时对话接口封装 */
const enum YingAiLiveApi {
  stream = '/admin/yingai-live/stream',
  groups = '/admin/yingai-live/groups',
  reply = '/admin/yingai-live/reply',
}

/** 一条实时对话记录（荧的回复 / 后台代发） */
export interface LiveRow {
  ts: number;
  gid: string;
  uid: string;
  nick: string;
  msg: string;
  reply: string;
  model: string;
  fellBack: boolean;
  strategy?: string;
  fromConsole?: boolean;
}

export interface LiveStreamResult {
  rows: LiveRow[];
  cursor: number;
  count: number;
  total: number;
}

export interface LiveGroup {
  gid: string;
  nick: string;
  lastTs: number;
  lastReply: string;
}

export const yingAiLiveApi = {
  stream: (params: { after?: number; gid?: string; limit?: number }) =>
    defHttp.get<LiveStreamResult>({ url: YingAiLiveApi.stream, params }),
  groups: () => defHttp.get<LiveGroup[]>({ url: YingAiLiveApi.groups }),
  reply: (gid: string, text: string) =>
    defHttp.post<{ sent: boolean; id: string }>({ url: YingAiLiveApi.reply, params: { gid, text } }),
};
