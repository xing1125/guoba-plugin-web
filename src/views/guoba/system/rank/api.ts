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

/* ------------------------------ 跨群视图 ------------------------------ */

/** 群总览里的一行：一个群的体量（角色数 / 键数 / 人数） */
export interface RankOverviewGroup {
  /** 归一后的群号，不带 @chatroom 与 group- 前缀 */
  gid: string;
  /** 可以直接回传给 /board 的群号（保留 @chatroom） */
  boardGid: string;
  /** Redis 里的原始前缀，可能带 group- */
  rawGid: string;
  name: string;
  /** 去重后的 type:charId 数 */
  charCount: number;
  /** 原始 zset 键数（两种前缀合计） */
  keys: number;
  /** 各角色榜单人数取最大后求和 */
  members: number;
  types: Partial<Record<RankType, number>>;
  topChar: { id: string; name: string; count: number } | null;
}

export interface RankOverview {
  available: boolean;
  types: { key: RankType; label: string; groups: number }[];
  groups: RankOverviewGroup[];
  scannedAt?: string;
}

/** 单个角色在所有群里的普及度 */
export interface CharUsageItem {
  id: string;
  name: string;
  game: '' | 'gs' | 'sr';
  star: number;
  /** 属性原值：原神是英文（pyro / hydro …），星铁是中文（火 / 雷 …），展示前需映射 */
  elem: string;
  /** 有该角色榜单的群数 */
  groups: number;
  /** 各群榜单人数之和 */
  count: number;
  /** 平均每群人数 */
  avg: number;
}

export interface CharUsageResult {
  available: boolean;
  type: RankType;
  typeLabel: string;
  game: '' | 'gs' | 'sr';
  /** 过滤后的角色总数（不只是返回的 limit 条） */
  total: number;
  chars: CharUsageItem[];
  scannedAt?: string;
}

/** 同一个角色在某个群的榜首 */
export interface RankCompareTop {
  uid: string;
  wxid: string;
  name: string;
  score: number;
}

export interface RankCompareGroup {
  gid: string;
  name: string;
  /** 原始 Redis 前缀，可能带 group-；回跳单群榜单时用它 */
  rawGid: string;
  count: number;
  /** 该群这个角色还没有榜单数据时为 null */
  top: RankCompareTop | null;
}

export interface RankCompareResult {
  available: boolean;
  empty?: boolean;
  type: RankType;
  typeLabel: string;
  char: { id: string; name: string; game: '' | 'gs' | 'sr'; star: number; elem: string } | null;
  groups: RankCompareGroup[];
  scannedAt?: string;
}

const enum RankApi {
  groups = '/admin/rank/groups',
  board = '/admin/rank/board',
  overview = '/admin/rank/overview',
  charUsage = '/admin/rank/char-usage',
  compare = '/admin/rank/compare',
}

export const rankApi = {
  /** force=true 跳过 60 秒键扫描缓存 */
  getGroups(force = false) {
    return defHttp.get<RankGroupList>({ url: RankApi.groups, params: { force: force ? 'true' : '' } });
  },
  getBoard(params: { gid: string; type?: RankType; charId?: string; limit?: number }) {
    return defHttp.get<RankBoard>({ url: RankApi.board, params });
  },
  /** 每群体量总览（force=true 跳过聚合缓存） */
  getOverview(force = false) {
    return defHttp.get<RankOverview>({ url: RankApi.overview, params: { force: force ? 'true' : '' } });
  },
  /** 角色使用率：type 固定 dmg/mark，game 为空表示不过滤 */
  getCharUsage(params: { type?: RankType; game?: '' | 'gs' | 'sr'; limit?: number; force?: boolean }) {
    return defHttp.get<CharUsageResult>({
      url: RankApi.charUsage,
      params: { ...params, force: params.force ? 'true' : '' },
    });
  },
  /** 同角色跨群对比：charId 为空时后端自动挑人数最多的角色 */
  getCompare(params: { type?: RankType; charId?: string }) {
    return defHttp.get<RankCompareResult>({ url: RankApi.compare, params });
  },
};
