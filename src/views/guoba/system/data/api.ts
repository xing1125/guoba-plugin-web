import { defHttp } from '/@/utils/http/axios';

export interface DomainMeta {
  prefix: string;
  plugin: string;
  label: string;
  risk: 'low' | 'mid' | 'high';
  desc: string;
  count?: number;
  samples?: string[];
}

export interface DomainPlugin {
  plugin: string;
  count: number;
  domains: DomainMeta[];
}

export interface DomainsResult {
  available: boolean;
  totalKeys: number;
  unknownCount: number;
  unknownSamples: string[];
  plugins: DomainPlugin[];
  domains: DomainMeta[];
  scannedAt?: string;
}

export interface KeyRow {
  key: string;
  type: string;
  ttl: number;
  domain: DomainMeta | null;
}

export interface KeyPage {
  total: number;
  page: number;
  size: number;
  truncated: boolean;
  list: KeyRow[];
}

export interface KeyDetail {
  key: string;
  type: string;
  ttl: number;
  size: number;
  value: any;
  editable: boolean;
  risk: string;
  domain: DomainMeta | null;
}

export interface FilePlugin {
  plugin: string;
  files: number;
  bytes: number;
}

export interface FileItem {
  name: string;
  path: string;
  dir: boolean;
  size: number;
  mtime: string | null;
  childCount?: number;
  ext?: string;
  editable?: boolean;
  backupCount?: number;
}

export interface FileContent {
  plugin: string;
  path: string;
  size: number;
  mtime: string;
  ext: string;
  content: string;
  backups: number;
}

const enum Api {
  domains = '/admin/data/domains',
  keys = '/admin/data/keys',
  key = '/admin/data/key',
  keySet = '/admin/data/key/set',
  keyDelete = '/admin/data/key/delete',
  keyTtl = '/admin/data/key/ttl',
  deletePrefix = '/admin/data/keys/delete-prefix',
  backups = '/admin/data/backups',
  restoreBackup = '/admin/data/backups/restore',
  filePlugins = '/admin/data/files/plugins',
  files = '/admin/data/files',
  file = '/admin/data/file',
  fileSave = '/admin/data/file/save',
  fileBackups = '/admin/data/file/backups',
  fileRestore = '/admin/data/file/restore',
}

export const dataApi = {
  getDomains(force = false) {
    return defHttp.get<DomainsResult>({ url: Api.domains, params: { force: force ? 1 : 0 } });
  },
  getKeys(params: { prefix?: string; q?: string; page?: number; size?: number }) {
    return defHttp.get<KeyPage>({ url: Api.keys, params });
  },
  getKey(key: string) {
    return defHttp.get<KeyDetail>({ url: Api.key, params: { key } });
  },
  setKey(payload: { key: string; type?: string; value: any; ttl?: number }) {
    return defHttp.post({ url: Api.keySet, params: payload });
  },
  deleteKey(key: string, confirmKey?: string) {
    return defHttp.post({ url: Api.keyDelete, params: { key, confirm: true, confirmKey } });
  },
  setTtl(key: string, ttl: number) {
    return defHttp.post({ url: Api.keyTtl, params: { key, ttl } });
  },
  deletePrefix(prefix: string) {
    return defHttp.post<{ deleted: number; failed: any[]; prefix: string }>({
      url: Api.deletePrefix,
      params: { prefix, confirm: true },
    });
  },
  getBackups(limit = 100) {
    return defHttp.get<{ list: any[] }>({ url: Api.backups, params: { limit } });
  },
  restoreBackup(id: number) {
    return defHttp.post({ url: Api.restoreBackup, params: { id } });
  },

  getFilePlugins() {
    return defHttp.get<{ list: FilePlugin[] }>({ url: Api.filePlugins });
  },
  getFiles(plugin: string, path = '') {
    return defHttp.get<{ plugin: string; path: string; list: FileItem[] }>({
      url: Api.files,
      params: { plugin, path },
    });
  },
  readFile(plugin: string, path: string) {
    return defHttp.get<FileContent>({ url: Api.file, params: { plugin, path } });
  },
  saveFile(plugin: string, path: string, content: string) {
    return defHttp.post<{ bytes: number; backup: string }>({
      url: Api.fileSave,
      params: { plugin, path, content },
    });
  },
  getFileBackups(plugin: string, path: string) {
    return defHttp.get<{ list: any[] }>({ url: Api.fileBackups, params: { plugin, path } });
  },
  restoreFile(plugin: string, path: string, backup: string) {
    return defHttp.post({ url: Api.fileRestore, params: { plugin, path, backup } });
  },
};
