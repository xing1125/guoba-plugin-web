import { defHttp } from '/@/utils/http/axios';

/* ------------------------------ 类型 ------------------------------ */

export interface GameMeta {
  key: string;
  name: string;
  en: string;
  char: string;
  source: 'mihoyo' | 'waves';
  from: string;
  to: string;
  fg: string;
}

export interface GameOverviewItem extends GameMeta {
  uidCount: number;
  accountCount: number;
  totalAccounts: number;
  rate: number;
  ckSaved: number;
  skSaved: number;
  skSupported: boolean;
}

export interface GameOverview {
  games: GameOverviewItem[];
  accounts: number;
  users: number;
}

export interface GameUid {
  uid: string;
  nickname: string;
  level: string;
  /** 仅鸣潮：库街区 kuroUid / 区服 */
  kuroUid?: string;
  server?: string;
}

export interface GameAccount {
  id: string;
  /** 米游社账号为数字 ltuid；鸣潮为 null */
  ltuid: number | null;
  /** 仅鸣潮：绑定 QQ */
  qq?: string;
  bindIds: string[];
  bindNames: string[];
  uidCount: number;
  hasCk: boolean;
  hasSk: boolean;
  ckStatus: string;
  ckMask: string;
  checkedAt: string | null;
  uids: GameUid[];
}

export interface GameAccountHero {
  uidCount: number;
  ckSaved: number;
  skSaved: number;
  skSupported: boolean;
  accountCount: number;
}

export interface GameAccountsResult {
  game: string;
  meta: GameMeta;
  total: number;
  list: GameAccount[];
  hero: GameAccountHero;
}

export interface StokenRow {
  ltuid: number;
  hasStoken: boolean;
  hasLtoken: boolean;
  stuid: string;
  source: string;
  uids: number;
}

export interface StokenReport {
  total: number;
  saved: number;
  list: StokenRow[];
}

/* ------------------------------ 接口 ------------------------------ */

export const gameApi = {
  /** 7 游戏绑定概览（用户统计页网格 + 账号页侧栏计数） */
  overview(force = false) {
    return defHttp.get<GameOverview>({
      url: '/admin/games/overview',
      params: force ? { force: 'true' } : {},
    });
  },
  /** 单游戏账号明细（账号页手风琴） */
  accounts(game: string, q = '') {
    return defHttp.get<GameAccountsResult>({
      url: `/admin/games/${encodeURIComponent(game)}/accounts`,
      params: q ? { q } : {},
    });
  },
  /** Stoken 覆盖报告（米游社 6 游戏） */
  stokenReport(game = '') {
    return defHttp.get<StokenReport>({
      url: '/admin/games/stoken/report',
      params: game ? { game } : {},
    });
  },
};
