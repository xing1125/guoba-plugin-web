import { defHttp } from '/@/utils/http/axios';

export interface WsRoot {
  key: string;
  label: string;
  rel: string;
}

export interface WsItem {
  name: string;
  path: string;
  dir: boolean;
  size: number;
  mtime: string | null;
  ext: string;
  editable: boolean;
  childCount?: number;
}

export interface WsListResult {
  root: string;
  label: string;
  path: string;
  list: WsItem[];
}

export interface WsReadResult {
  root: string;
  path: string;
  size: number;
  mtime: string;
  ext: string;
  content: string;
  backups: number;
}

export interface WsBackup {
  name: string;
  ts: number;
  time: string | null;
  size: number;
}

const Api = {
  roots: '/admin/workspace/roots',
  list: '/admin/workspace/list',
  read: '/admin/workspace/read',
  write: '/admin/workspace/write',
  create: '/admin/workspace/create',
  remove: '/admin/workspace/delete',
  rename: '/admin/workspace/rename',
  backups: '/admin/workspace/backups',
  restore: '/admin/workspace/backup/restore',
};

export const workspaceApi = {
  roots: () => defHttp.get<{ list: WsRoot[] }>({ url: Api.roots }),
  list: (root: string, path = '') =>
    defHttp.get<WsListResult>({ url: Api.list, params: { root, path } }),
  read: (root: string, path: string) =>
    defHttp.get<WsReadResult>({ url: Api.read, params: { root, path } }),
  write: (root: string, path: string, content: string) =>
    defHttp.post<{ bytes: number; backup: string | null }>({ url: Api.write, params: { root, path, content } }),
  create: (root: string, path: string, name: string, isDir: boolean, content = '') =>
    defHttp.post({ url: Api.create, params: { root, path, name, isDir, content } }),
  remove: (root: string, path: string) =>
    defHttp.post<{ trash: string }>({ url: Api.remove, params: { root, path, confirm: true } }),
  rename: (root: string, path: string, newName: string) =>
    defHttp.post<{ to: string }>({ url: Api.rename, params: { root, path, newName } }),
  backups: (root: string, path: string) =>
    defHttp.get<{ list: WsBackup[] }>({ url: Api.backups, params: { root, path } }),
  restore: (root: string, path: string, backup: string) =>
    defHttp.post({ url: Api.restore, params: { root, path, backup } }),
};
