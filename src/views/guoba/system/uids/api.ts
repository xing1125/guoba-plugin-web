import { defHttp } from '/@/utils/http/axios';

export interface UidRow {
  uid: string;
  game: string;
  ltuid: number;
  bindIds: string[];
  /** 与 bindIds 一一对应的昵称，取不到时为空串 */
  bindNames?: string[];
}

export interface PageResult<T> {
  total: number;
  page: number;
  size: number;
  list: T[];
}

export interface UidQuery {
  game?: string;
  page?: number;
  size?: number;
  q?: string;
}

export const uidApi = {
  getUids(params: UidQuery) {
    return defHttp.get<PageResult<UidRow>>({ url: '/admin/uids', params });
  },
  /** 手动添加 / 修改一个 UID（origin 传原 UID 即为编辑） */
  upsertUid(data: { ltuid: number; game: string; uid: string; origin?: string }) {
    return defHttp.post({ url: '/admin/uids/upsert', data });
  },
};
