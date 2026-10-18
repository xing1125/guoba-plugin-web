import { defHttp } from '/@/utils/http/axios';

export interface UidRow {
  uid: string;
  game: string;
  ltuid: number;
  bindIds: string[];
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
};
