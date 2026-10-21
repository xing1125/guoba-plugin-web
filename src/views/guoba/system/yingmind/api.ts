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
};
