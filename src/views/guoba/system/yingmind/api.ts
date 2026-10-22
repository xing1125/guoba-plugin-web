import { defHttp } from '/@/utils/http/axios';

/** 荧之心智（YingAI 记忆/关系/情绪）接口封装 */
const enum YingMindApi {
  groups = '/admin/yingmind/groups',
  memories = '/admin/yingmind/memories',
  relations = '/admin/yingmind/relations',
  emotion = '/admin/yingmind/emotion',
  health = '/admin/yingmind/health',
  cleanup = '/admin/yingmind/cleanup',
}

/** 后台快照服务（独立于 yingmind，按天堆积） */
const enum SnapshotApi {
  emotion = '/admin/snapshots/emotion',
}

export interface MindGroup {
  gid: string;
  name?: string;
  memoryCount: number;
  relationCount: number;
  mood: string;
  moodValue: number;
}

export interface MindMemory {
  id: number;
  text: string;
  value: number;
  tier: string;
  createdAt: number;
  lastTouched: number;
  consolidation: number;
}

export interface MindRelation {
  uid: string;
  trust: number;
  affection: number;
  affinity: number;
  friction: number;
  interactionCount: number;
  activeDays: number;
  lastInteractionAt: number;
  interactionTypes: Record<string, number>;
}

export interface MindMilestone {
  type: string;
  uid: string;
  timestamp: number;
  importance: number;
  description: string;
}

export interface MindEmotion {
  mood: string;
  value: number;
  updatedAt: number;
}

/** 情绪趋势上的一个采样点（一天一个） */
export interface MindEmotionPoint {
  /** YYYY-MM-DD */
  date: string;
  mood: string;
  /** 0~100 */
  value: number;
}

/**
 * 情绪趋势（后台快照按天堆积）
 * count = 实际有快照的天数，points 已按日期正序（旧 → 新）
 */
export interface MindEmotionTrend {
  /** 空字符串 = 全站平均 */
  gid: string;
  days: number;
  count: number;
  points: MindEmotionPoint[];
}

/** 命中原因：低价值 / 僵尸 / 未巩固 / 跨群重复 */
export type MindIssueReason = 'lowValue' | 'stale' | 'unconsolidated' | 'duplicate';

/** 记忆体检候选（可清理的一条记忆） */
export interface MindCandidate {
  gid: string;
  gname: string;
  index: number;
  text: string;
  value: number;
  tier: string;
  createdAt: number;
  lastTouched: number;
  ageDays: number;
  reasons: MindIssueReason[];
  dupWith: string[];
}

/** 探针 / 测试残留文件（只展示，不可清理） */
export interface MindProbeFile {
  file: string;
  count: number;
}

/** 记忆体检结果 */
export interface YingMindHealth {
  scope: 'all' | 'group';
  gid: string;
  total: number;
  groups: number;
  byTier: { short: number; mid: number; long: number; unknown: number };
  score: number;
  issues: { lowValue: number; stale: number; unconsolidated: number; duplicate: number; probe: number };
  candidates: MindCandidate[];
  probeFiles: MindProbeFile[];
}

/** 批量清理结果 */
export interface MindCleanupResult {
  removed: number;
  skipped: number;
  files: number;
  backupDir: string;
  remainingTotal: number;
}

export const yingMindApi = {
  groups: () => defHttp.get<MindGroup[]>({ url: YingMindApi.groups }),
  memories: (gid: string) => defHttp.get<MindMemory[]>({ url: YingMindApi.memories, params: { gid } }),
  relations: (gid: string) =>
    defHttp.get<{ list: MindRelation[]; milestones: Record<string, MindMilestone[]> }>({
      url: YingMindApi.relations,
      params: { gid },
    }),
  emotion: (gid: string) => defHttp.get<MindEmotion>({ url: YingMindApi.emotion, params: { gid } }),
  deleteMemory: (gid: string, index: number, oldText: string) =>
    defHttp.post<{ text: string; remaining: number }>({
      url: '/admin/yingmind/memories/delete',
      data: { gid, index, oldText, confirm: true },
    }),
  updateMemory: (gid: string, index: number, text: string, value: number, oldText: string) =>
    defHttp.post<{ text: string; value: number }>({
      url: '/admin/yingmind/memories/update',
      data: { gid, index, text, value, oldText, confirm: true },
    }),
  setEmotion: (gid: string, mood: string, value: number) =>
    defHttp.post<{ mood: string; value: number }>({
      url: '/admin/yingmind/emotion/set',
      data: { gid, mood, value, confirm: true },
    }),
  /** 记忆体检：gid 传空 = 全站 */
  health: (params: { gid?: string; staleDays?: number; lowValue?: number; minAge?: number }) =>
    defHttp.get<YingMindHealth>({ url: YingMindApi.health, params }),
  /** 批量清理候选记忆：oldText 必须传候选原文（后端做漂移校验） */
  cleanup: (payload: { confirm: true; keys: Array<{ gid: string; index: number; oldText: string }> }) =>
    defHttp.post<MindCleanupResult>({ url: YingMindApi.cleanup, data: payload }),
  /** 情绪趋势：gid 传空 = 全站平均；快照按天积累，count 可能只有 0 / 1 */
  emotionTrend: (params: { gid?: string; days?: number }) =>
    defHttp.get<MindEmotionTrend>({ url: SnapshotApi.emotion, params }),
};
