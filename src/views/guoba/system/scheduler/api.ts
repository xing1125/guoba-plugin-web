import { defHttp } from '/@/utils/http/axios';

/**
 * 定时任务中心
 *
 * 任务 = 到点后在某个群 / 好友那里执行一条指令（模拟真实消息，老插件零改造）。
 * cron 是标准 5 段写法（分 时 日 月 周）。
 */

export interface CronTask {
  id: number;
  name: string;
  cron: string;
  kind: 'group' | 'private';
  target_id: string;
  target_name?: string;
  cmd: string;
  deliver: boolean;
  enabled: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  last_run_at?: string | null;
  last_status?: 'ok' | 'fail' | null;
  last_msg?: string;
  runs: number;
  fails: number;
  /** 表达式不合法时的说明 */
  cronError?: string;
  /** 表达式的中文描述，如「8 点 0 分 · 每天」 */
  cronDesc?: string;
  /** 下次触发时间（ISO） */
  nextRunAt?: string | null;
}

export interface CronList {
  tasks: CronTask[];
  running: number;
  lastTickAt?: string | null;
  enabledCount: number;
  failCount: number;
}

export interface CronTarget {
  kind: string;
  id: string;
  name: string;
}

export interface CronPreview {
  cron: string;
  desc: string;
  next: string[];
}

export interface CronHistoryItem {
  id: number;
  name: string;
  at: string;
  ok: boolean;
  msg: string;
  cmd: string;
  targetId: string;
  targetName?: string;
  source: 'cron' | 'manual';
}

export interface CronSavePayload {
  id?: number;
  name: string;
  cron: string;
  kind: 'group' | 'private';
  targetId: string;
  targetName?: string;
  cmd: string;
  deliver?: boolean;
  enabled?: boolean;
  confirm: true;
}

const enum CronApi {
  tasks = '/admin/cron/tasks',
  targets = '/admin/cron/targets',
  history = '/admin/cron/history',
  preview = '/admin/cron/preview',
  save = '/admin/cron/save',
  toggle = '/admin/cron/toggle',
  remove = '/admin/cron/delete',
  run = '/admin/cron/run',
}

export const cronApi = {
  getTasks() {
    return defHttp.get<CronList>({ url: CronApi.tasks });
  },
  getTargets() {
    return defHttp.get<{ groups: CronTarget[]; total: number }>({ url: CronApi.targets });
  },
  getHistory(limit = 30) {
    return defHttp.get<CronHistoryItem[]>({ url: CronApi.history, params: { limit } });
  },
  preview(cron: string) {
    return defHttp.get<CronPreview>({ url: CronApi.preview, params: { cron } });
  },
  save(payload: CronSavePayload) {
    return defHttp.post<CronTask>({ url: CronApi.save, params: payload });
  },
  toggle(id: number, enabled: boolean) {
    return defHttp.post<CronTask>({ url: CronApi.toggle, params: { id, enabled } });
  },
  remove(id: number) {
    return defHttp.post<{ deleted: boolean }>({ url: CronApi.remove, params: { id, confirm: true } });
  },
  run(id: number) {
    return defHttp.post<{ ok: boolean; message: string; task: CronTask }>({ url: CronApi.run, params: { id } });
  },
};
