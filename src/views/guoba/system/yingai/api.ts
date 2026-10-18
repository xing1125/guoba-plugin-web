import { defHttp } from '/@/utils/http/axios';

/** 单个用户的风格度量 */
export interface YingStyle {
  count: number;
  avgLen: number;
  maxLen: number;
  over40Rate: number;
  questionRate: number;
  multiLineRate: number;
  codeBlockRate: number;
  /** 含高频模板片段（3-gram）的回复占比 —— 不是"开头重复率" */
  repeatOpenRate: number;
  openings: { prefix: string; count: number }[];
}

export interface YingUserRow {
  uid: string;
  name: string;
  stage: string;
  closeness: number;
  familiarity: number;
  interactionCount: number;
  mood: string;
  energy: number | null;
  msgs: number;
  aiMsgs: number;
  userMsgs: number;
  lastAt: number | null;
  firstSeen: number | null;
  enabled: boolean;
  explicit: boolean | null;
  style: YingStyle;
  /** 打磨优先级（0~100，越大越该修） */
  score: number;
  sample: string[];
}

export interface YingOverview {
  users: number;
  withChat: number;
  enabled: number;
  globalEnabled: boolean;
  totalMsgs: number;
  active7d: number;
  avgAiLen: number;
  questionRate: number;
  multiLineRate: number;
  repeatOpenRate: number;
  stageDist: Record<string, number>;
  updatedAt: string;
}

export interface YingMessage {
  index: number;
  role: 'user' | 'assistant';
  text: string;
  len: number;
  at: number | null;
}

/** 全体均值，单用户视角的对照基准 */
export interface YingBaseline {
  avg: number;
  over40: number;
  question: number;
  multi: number;
  tpl: number;
}

/** 用户对比行（与群聊端 groupCompare 字段同构） */
export interface YingCompareRow {
  uid: string;
  name: string;
  label: string;
  short: string;
  n: number;
  avg: number;
  over40: number;
  question: number;
  multi: number;
  tpl: number;
  score: number;
  stage: string;
  enabled: boolean;
  lastAt: number | null;
}

export interface YingCompare {
  total: number;
  baseline: YingBaseline;
  list: YingCompareRow[];
}

export interface YingInsight {
  level: 'warn' | 'info' | 'ok';
  title: string;
  detail: string;
  suggestion: string;
}

export interface YingInsights {
  uid: string;
  scope: 'all' | 'user';
  missing?: boolean;
  metrics: {
    aiMessages: number;
    avgLen: number;
    maxLen: number;
    over40Rate: number;
    questionRate: number;
    multiLineRate: number;
    codeBlockRate: number;
    /** 含高频模板片段的回复占比 */
    repeatOpenRate: number;
  };
  baseline: YingBaseline;
  openings: { prefix: string; count: number }[];
  issues: YingInsight[];
  samples: { uid: string; name: string; sample: string[] }[];
  updatedAt: string;
}

const enum YingApi {
  overview = '/admin/yingai/overview',
  users = '/admin/yingai/users',
  compare = '/admin/yingai/compare',
  messages = '/admin/yingai/messages',
  insights = '/admin/yingai/insights',
  enabled = '/admin/yingai/user/enabled',
}

export const yingaiApi = {
  getOverview() {
    return defHttp.get<YingOverview>({ url: YingApi.overview });
  },
  getUsers(params: { page?: number; size?: number; q?: string; enabled?: string }) {
    return defHttp.get<{ total: number; page: number; size: number; list: YingUserRow[] }>({
      url: YingApi.users,
      params,
    });
  },
  getCompare() {
    return defHttp.get<YingCompare>({ url: YingApi.compare });
  },
  getMessages(params: { uid: string; page?: number; size?: number }) {
    return defHttp.get<{ total: number; page: number; size: number; list: YingMessage[] }>({
      url: YingApi.messages,
      params,
    });
  },
  /** uid 为空 = 综合视角；带 uid = 单用户视角 */
  getInsights(uid?: string) {
    return defHttp.get<YingInsights>({ url: YingApi.insights, params: uid ? { uid } : {} });
  },
  setEnabled(uid: string, enabled: boolean) {
    return defHttp.post<{ uid: string; enabled: boolean; followsGlobal: boolean }>({
      url: YingApi.enabled,
      data: { uid, enabled },
    });
  },
};
