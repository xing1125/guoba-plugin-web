import { defHttp } from '/@/utils/http/axios';

/** 统一告警中心接口封装 */
const enum AlertCenterApi {
  list = '/admin/alert-center/list',
}

export interface AlertItem {
  key: string;
  level: 'bad' | 'warn';
  source: string;
  title: string;
  detail: string;
}

export interface AlertListResult {
  alerts: AlertItem[];
  critical: number;
  warn: number;
  checkedAt: number;
  costMs: number;
}

export const alertCenterApi = {
  list: () => defHttp.get<AlertListResult>({ url: AlertCenterApi.list }),
};
