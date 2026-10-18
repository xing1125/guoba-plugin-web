import { defHttp } from '/@/utils/http/axios';

/** 后台账号（RBAC） */
export interface AdminUser {
  id: number;
  username: string;
  nickname?: string;
  role: string;
  status: 'active' | 'disabled';
  must_change?: boolean;
  created_at?: string;
  last_login_at?: string;
}

/** 角色定义 */
export interface AdminRole {
  role: string;
  name: string;
  menus: string[];
  ops: string[];
  builtin: boolean;
  description?: string;
}

export interface LoginLogRow {
  id: number;
  username: string;
  ip: string;
  ua: string;
  success: number;
  reason?: string;
  created_at: string;
}

export interface Catalogue {
  menus: { perm: string; name: string }[];
  ops: { group: string; items: { op: string; name: string }[] }[];
}

const enum AuthApi {
  users = '/admin/auth/users',
  roles = '/admin/auth/roles',
  catalogue = '/admin/auth/catalogue',
  password = '/admin/auth/password',
  loginLog = '/admin/auth/login-log',
}

export const authApi = {
  getUsers(keyword = '') {
    return defHttp.get<AdminUser[]>({ url: AuthApi.users, params: { keyword } });
  },

  createUser(data: { username: string; password: string; nickname?: string; role: string }) {
    return defHttp.post<AdminUser>({ url: AuthApi.users, data });
  },

  updateUser(id: number, data: Record<string, any>) {
    return defHttp.post<AdminUser>({ url: `${AuthApi.users}/${id}`, data });
  },

  deleteUser(id: number) {
    return defHttp.delete<string>({ url: `${AuthApi.users}/${id}`, data: { confirm: true } });
  },

  getRoles() {
    return defHttp.get<AdminRole[]>({ url: AuthApi.roles });
  },

  saveRole(data: Partial<AdminRole>) {
    return defHttp.post<AdminRole>({ url: AuthApi.roles, data });
  },

  deleteRole(role: string) {
    return defHttp.delete<string>({ url: `${AuthApi.roles}/${encodeURIComponent(role)}` });
  },

  getCatalogue() {
    return defHttp.get<Catalogue>({ url: AuthApi.catalogue });
  },

  changePassword(oldPassword: string, newPassword: string) {
    return defHttp.post<string>({ url: AuthApi.password, data: { oldPassword, newPassword } });
  },

  getLoginLog(params: { page?: number; size?: number; username?: string; success?: boolean | '' }) {
    return defHttp.get<{ list: LoginLogRow[]; total: number }>({
      url: AuthApi.loginLog,
      params,
    });
  },
};

/* ------------------------------ 审计日志 ------------------------------ */

export interface AuditRow {
  id: number;
  actor: string;
  action: string;
  target: string;
  detail: string;
  ip: string;
  created_at: string;
}

export interface AuditQuery {
  page?: number;
  size?: number;
  actor?: string;
  action?: string;
  from?: string;
  to?: string;
  keyword?: string;
}

const enum AuditApi {
  list = '/admin/audit/list',
  stats = '/admin/audit/stats',
  actions = '/admin/audit/actions',
  feed = '/admin/audit/feed',
}

export const auditApi = {
  getList(params: AuditQuery) {
    return defHttp.get<{ list: AuditRow[]; total: number }>({ url: AuditApi.list, params });
  },
  getStats() {
    return defHttp.get<{ total: number; today: number; risky: number; byAction: { action: string; c: number }[] }>({
      url: AuditApi.stats,
    });
  },
  getActions() {
    return defHttp.get<{ action: string; c: number }[]>({ url: AuditApi.actions });
  },
  getFeed(limit = 8) {
    return defHttp.get<{ list: any[]; unread: number }>({ url: AuditApi.feed, params: { limit } });
  },
};
