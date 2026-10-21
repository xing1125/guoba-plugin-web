import { defHttp } from '/@/utils/http/axios';

/** 荧之心智（YingAI 记忆/关系/情绪）接口封装 */
const enum YingMindApi {
  groups = '/admin/yingmind/groups',
  memories = '/admin/yingmind/memories',
  relations = '/admin/yingmind/relations',
  emotion = '/admin/yingmind/emotion',
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
};
