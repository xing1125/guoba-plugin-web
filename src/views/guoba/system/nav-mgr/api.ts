import { defHttp } from '/@/utils/http/axios';

export interface NavMenuItem {
  /** meta.perm（插件菜单为 path） */
  key: string;
  title: string;
  path: string;
  icon: string;
  /** 平台自带插件菜单页，暂不参与屏蔽/排序 */
  plugin: boolean;
  /** 固定显示项（首页 / 导航管理），开关禁用 */
  fixed: boolean;
  hidden: boolean;
}

export interface NavPrefs {
  items: NavMenuItem[];
  hidden: string[];
  order: string[];
}

export const navApi = {
  getPrefs() {
    return defHttp.get<NavPrefs>({ url: '/admin/menus/prefs' });
  },
  setPrefs(params: { hidden: string[]; order: string[] }) {
    return defHttp.put({ url: '/admin/menus/prefs', params });
  },
};
