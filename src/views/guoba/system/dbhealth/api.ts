import { defHttp } from '/@/utils/http/axios';

/** 数据健康与备份接口封装 */
const enum DbApi {
  health = '/admin/db/health',
  backups = '/admin/db/backups',
  backup = '/admin/db/backup',
  checkpoint = '/admin/db/checkpoint',
  prune = '/admin/db/prune',
  restore = '/admin/db/restore',
}

export interface DbTableInfo {
  name: string;
  rows: number;
}

export interface DbHealthItem {
  key: 'data' | 'admin';
  label: string;
  file: string;
  exists: boolean;
  size?: number;
  mtime?: string;
  wal?: { size: number };
  integrity?: string;
  tables?: DbTableInfo[];
}

export interface DbHealth {
  dbs: DbHealthItem[];
  backupDir: string;
  backupCount: number;
  lastBackupAt: string | null;
  redisKeys: number;
}

export interface BackupFileInfo {
  name: string;
  label?: string;
  size?: number;
  sha256?: string;
  integrity?: string;
}

export interface BackupItem {
  ts: string;
  at: string;
  total: number;
  files: BackupFileInfo[];
  complete: boolean;
}

export interface BackupManifest {
  at: string;
  ts: string;
  files: BackupFileInfo[];
}

export const dbApi = {
  getHealth: () => defHttp.get<DbHealth>({ url: DbApi.health }),
  getBackups: (limit = 20) => defHttp.get<BackupItem[]>({ url: DbApi.backups, params: { limit } }),
  createBackup: () => defHttp.post<BackupManifest>({ url: DbApi.backup }),
  checkpoint: () => defHttp.post({ url: DbApi.checkpoint }),
  prune: (keep = 10) => defHttp.post({ url: DbApi.prune, params: { keep } }),
  restore: (ts: string, confirm: boolean) => defHttp.post({ url: DbApi.restore, params: { ts, confirm } }),
};
