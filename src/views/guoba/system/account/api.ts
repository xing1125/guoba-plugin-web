import { defHttp } from '/@/utils/http/axios';

/** 账号 CK 状态 */
export type CkStatus = 'ok' | 'expired' | 'error' | 'unknown';

export interface AccountRow {
  ltuid: number;
  accountType: string;
  /** 脱敏后的 CK，形如 ltoken=v2_xxxx****xxxx */
  ckMask: string;
  ckLen: number;
  hasDeviceFp: boolean;
  /** 游戏 -> UID 列表 */
  uids: Record<string, string[]>;
  /** 绑定的 Bot 用户标识（wxid / qq） */
  bindIds: string[];
  /** 与 bindIds 一一对应的昵称，取不到时为空串 */
  bindNames?: string[];
  ckStatus: CkStatus;
  checkedAt?: string | null;
  updatedAt?: string | null;
}

export interface PageResult<T> {
  total: number;
  page: number;
  size: number;
  list: T[];
}

export interface OverviewResult {
  accounts: { total: number; ckOk: number; expired: number; unknown: number; lastCheck?: string };
  uids: { total: number; byGame: Record<string, number> };
  users: { total: number; bound: number };
  groups: { total: number; active7d: number };
  message: { todaySend: number; todayRecv: number };
}

export interface VerifyResult {
  total: number;
  ok: number;
  expired: number;
  detail: { ltuid: number; ckStatus: CkStatus; errMsg?: string }[];
}

export interface AccountQuery {
  page?: number;
  size?: number;
  q?: string;
  ckStatus?: CkStatus | '';
  game?: string | '';
}

export interface DeleteResult {
  deleted: number;
  scanned?: number;
  failed: { ltuid: number; error: string }[];
  detail: { ltuid: number; uids: number; users: number; games: number }[];
}

export interface DeletedBackup {
  id: number;
  ltuid: number;
  actor: string;
  deleted_at: string;
}

const enum AdminApi {
  overview = '/admin/overview',
  accounts = '/admin/accounts',
  verify = '/admin/accounts/verify',
  syncStatus = '/admin/sync/status',
  update = '/admin/accounts/update',
  remove = '/admin/accounts/delete',
  restore = '/admin/accounts/restore',
  deleteExpired = '/admin/accounts/delete-expired',
  deleted = '/admin/accounts/deleted',
  deleteUid = '/admin/uids/delete',
  audit = '/admin/audit',
}

export const adminApi = {
  /** 概览统计 */
  getOverview() {
    return defHttp.get<OverviewResult>({ url: AdminApi.overview });
  },

  /** 账号分页列表 */
  getAccounts(params: AccountQuery) {
    return defHttp.get<PageResult<AccountRow>>({ url: AdminApi.accounts, params });
  },

  /** 单账号详情 */
  getAccount(ltuid: number) {
    return defHttp.get<AccountRow>({ url: `${AdminApi.accounts}/${ltuid}` });
  },

  /** 校验 CK 有效性 */
  verifyAccounts(ltuids: number[], concurrency = 3) {
    return defHttp.post<VerifyResult>({
      url: AdminApi.verify,
      params: { ltuids, concurrency },
    });
  },

  /** 同步任务状态 */
  getSyncStatus() {
    return defHttp.get<{ tasks: any[] }>({ url: AdminApi.syncStatus });
  },

  /** 编辑账号（ck / device / device_fp / uids） */
  updateAccount(ltuid: number, patch: Record<string, any>) {
    return defHttp.post<{ ltuid: number; changed: string[] }>({
      url: AdminApi.update,
      params: { ltuid, patch },
    });
  },

  /** 删除账号（会先备份到后台库） */
  deleteAccounts(ltuids: number[]) {
    return defHttp.post<DeleteResult>({
      url: AdminApi.remove,
      params: { ltuids, confirm: true },
    });
  },

  /** 清理全部 CK 失效账号 */
  deleteExpired() {
    return defHttp.post<DeleteResult>({
      url: AdminApi.deleteExpired,
      params: { confirm: true },
    });
  },

  /** 删除备份列表 */
  getDeleted(limit = 100) {
    return defHttp.get<{ list: DeletedBackup[] }>({ url: AdminApi.deleted, params: { limit } });
  },

  /** 从备份恢复 */
  restoreAccount(id: number) {
    return defHttp.post<{ ltuid: number; restored: boolean }>({
      url: AdminApi.restore,
      params: { id },
    });
  },

  /** 解绑单个 UID */
  deleteUid(ltuid: number, game: string, uid: string) {
    return defHttp.post<{ ltuid: number; game: string; uid: string; bound: number }>({
      url: AdminApi.deleteUid,
      params: { ltuid, game, uid, confirm: true },
    });
  },

  /** 操作审计 */
  getAudit(limit = 50) {
    return defHttp.get<{ list: any[] }>({ url: AdminApi.audit, params: { limit } });
  },
};
