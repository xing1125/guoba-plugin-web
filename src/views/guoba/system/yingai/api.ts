import { defHttp } from '/@/utils/http/axios';

/** 单个用户的风格度量 */
export interface YingStyle {
  count: number;
  avgLen: number;
  maxLen: number;
  questionRate: number;
  multiLineRate: number;
  codeBlockRate: number;
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

export interface YingInsight {
  level: 'warn' | 'info' | 'ok';
  title: string;
  detail: string;
  suggestion: string;
}

export interface YingInsights {
  metrics: {
    aiMessages: number;
    avgLen: number;
    maxLen: number;
    questionRate: number;
    multiLineRate: number;
    codeBlockRate: number;
    repeatOpenRate: number;
  };
  openings: { prefix: string; count: number }[];
  issues: YingInsight[];
  samples: { uid: string; name: string; sample: string[] }[];
  updatedAt: string;
}

const enum YingApi {
  overview = '/admin/yingai/overview',
  users = '/admin/yingai/users',
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
  getMessages(params: { uid: string; page?: number; size?: number }) {
    return defHttp.get<{ total: number; page: number; size: number; list: YingMessage[] }>({
      url: YingApi.messages,
      params,
    });
  },
  getInsights() {
    return defHttp.get<YingInsights>({ url: YingApi.insights });
  },
  setEnabled(uid: string, enabled: boolean) {
    return defHttp.post<{ uid: string; enabled: boolean; followsGlobal: boolean }>({
      url: YingApi.enabled,
      data: { uid, enabled },
    });
  },
};
