import { defHttp } from '/@/utils/http/axios';

/**
 * 群战力榜（只读）
 *
 * 数据来源是 miao-plugin 写在 Redis 里的 `miao:rank:<gid>:<type>:<charId>` zset，
 * 后台只做读取与展示，不写回、不改变插件行为。
 */

/** 榜单类型：伤害 / 评分 / 暴击 / 有效词条，实际有数据的基本只有前两种 */
export type RankType = 'dmg' | 'mark' | 'crit' | 'valid';

export interface RankGroup {
  gid: string;
  /** 群名来自 Bot 运行时内存，Bot 重启前推送过消息的群才有 */
  name: string;
  /** type -> 该类型下的角色数 */
  types: Partial<Record<RankType, number>>;
  total: number;
  charCount: number;
}

export interface RankGroupList {
  available: boolean;
  groups: RankGroup[];
  /** miao 角色元数据条数，为 0 说明 meta 没读到（角色会退化成 #id） */
  charMeta: number;
  scannedAt?: string;
}

export interface RankChar {
  id: string;
  name: string;
  abbr: string;
  /** gs = 原神，sr = 星铁，空 = meta 里没找到 */
  game: '' | 'gs' | 'sr';
  star: number;
  elem: string;
  /** 该角色在这个榜里有多少人参与 */
  count: number;
}

export interface RankRow {
  rank: number;
  uid: string;
  /** miao 记录的 uid → qq/wxid 映射，取不到时为空 */
  wxid: string;
  /** 后台用户表里的昵称，取不到时为空 */
  name: string;
  score: number;
}

export interface RankBoard {
  available: boolean;
  empty?: boolean;
  /** 空榜时的原因说明 */
  reason?: string;
  gid?: string;
  gidName?: string;
  type?: RankType;
  typeLabel?: string;
  /** 这个群有数据的榜类型 */
  types?: { key: RankType; label: string; chars: number }[];
  char?: RankChar;
  chars?: RankChar[];
  rows: RankRow[];
  summary?: { total: number; shown: number; avg: number; max: number };
}

const enum RankApi {
  groups = '/admin/rank/groups',
  board = '/admin/rank/board',
}

export const rankApi = {
  /** force=true 跳过 60 秒键扫描缓存 */
  getGroups(force = false) {
    return defHttp.get<RankGroupList>({ url: RankApi.groups, params: { force: force ? 'true' : '' } });
  },
  getBoard(params: { gid: string; type?: RankType; charId?: string; limit?: number }) {
    return defHttp.get<RankBoard>({ url: RankApi.board, params });
  },
};
