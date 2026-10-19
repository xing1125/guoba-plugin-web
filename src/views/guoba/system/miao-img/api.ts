import { defHttp } from '/@/utils/http/axios';
import { getToken } from '/@/utils/auth';

export interface MiaoChar {
  name: string;
  count: number;
}

export interface MiaoImgItem {
  name: string;
  size: number;
  mtime: string | null;
  ext: string;
  rel: string;
}

export interface MiaoCharsResult {
  kind: string;
  label: string;
  list: MiaoChar[];
}

export interface MiaoListResult {
  kind: string;
  label: string;
  name: string;
  list: MiaoImgItem[];
}

export interface MiaoSaveItem {
  kind: string;
  name: string;
  file: string;
  rel: string;
  existed: boolean;
  bytes: number;
}

const Api = {
  characters: '/admin/miao-img/characters',
  list: '/admin/miao-img/list',
  upload: '/admin/miao-img/upload',
  mkdir: '/admin/miao-img/mkdir',
  rename: '/admin/miao-img/rename',
  renameDir: '/admin/miao-img/rename-dir',
  remove: '/admin/miao-img/delete',
  /** 图片直出走 /guoba 前缀（与 defHttp 基址等价），token 走 query 便于 <img> 引用 */
  img: '/guoba/api/admin/miao-img/img',
};

export function imgUrl(rel: string) {
  return `${Api.img}?rel=${encodeURIComponent(rel)}&token=${getToken() || ''}`;
}

export const miaoImgApi = {
  characters: (kind: string) =>
    defHttp.get<MiaoCharsResult>({ url: Api.characters, params: { kind } }),
  list: (kind: string, name: string) =>
    defHttp.get<MiaoListResult>({ url: Api.list, params: { kind, name } }),
  upload: (kind: string, name: string, files: File[]) => {
    const fd = new FormData();
    fd.append('kind', kind);
    fd.append('name', name);
    for (const f of files) fd.append('files', f);
    return defHttp.post<{ saved: MiaoSaveItem[]; failed: { file: string; reason: string }[]; count: number }>({
      url: Api.upload,
      params: fd,
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60 * 1000,
    });
  },
  remove: (kind: string, name: string, file: string) =>
    defHttp.post<{ trash: string }>({ url: Api.remove, params: { kind, name, file, confirm: true } }),
  mkdir: (kind: string, name: string) =>
    defHttp.post<{ kind: string; name: string; existed: boolean; dir: string }>({
      url: Api.mkdir,
      params: { kind, name },
    }),
  rename: (kind: string, name: string, from: string, to: string) =>
    defHttp.post<{ kind: string; name: string; from: string; to: string; rel: string }>({
      url: Api.rename,
      params: { kind, name, from, to },
    }),
  renameDir: (kind: string, from: string, to: string) =>
    defHttp.post<{ kind: string; from: string; to: string }>({
      url: Api.renameDir,
      params: { kind, from, to },
    }),
};
