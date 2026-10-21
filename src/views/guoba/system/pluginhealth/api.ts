import { defHttp } from '/@/utils/http/axios';

/** 插件健康度接口封装 */
const enum PluginHealthApi {
  list = '/admin/plugin-health/list',
}

export interface PluginHealthRow {
  name: string;
  loaded: boolean;
  classes: number;
  appsCount: number;
  hasIndex: boolean;
  dataBytes: number;
}

export const pluginHealthApi = {
  list: () => defHttp.get<PluginHealthRow[]>({ url: PluginHealthApi.list }),
};
