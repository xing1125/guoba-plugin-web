import { defHttp } from '/@/utils/http/axios';

/** 日志文件条目 */
export interface LogFile {
  file: string;
  kind: 'error' | 'command' | 'other';
  gz: boolean;
  pinned: boolean;
  date: string;
  label: string;
  size: number;
  mtime: string;
  today: boolean;
}

export interface LogFilesResult {
  dir: string;
  files: LogFile[];
  totalSize: number;
  today: string;
  available: boolean;
}

/** 单条日志（续行已并入 detail） */
export interface LogEntry {
  time: string;
  level: 'ERROR' | 'WARN' | 'MARK' | 'INFO' | 'DEBUG' | 'TRACE' | 'FATAL' | string;
  levelRaw: string;
  ctx: string;
  msg: string;
  raw: string;
  detail: string[];
  file: string;
  archive: boolean;
}

export interface LogEntriesResult {
  file: string;
  gz: boolean;
  size: number;
  mtime: string;
  /** 窗口内解析出的条目总数 */
  total: number;
  /** 过滤后命中数 */
  matched: number;
  windowed: boolean;
  windowBytes: number;
  limit: number;
  counts: Record<string, number>;
  entries: LogEntry[];
}

export interface LogSummary {
  available: boolean;
  dir: string;
  fileCount: number;
  totalSize: number;
  todayErrors: number;
  todayWarns: number;
  todayMarks: number;
  lastError: { time: string; msg: string; ctx: string; level: string } | null;
  latestFile: LogFile | null;
}

const enum LogApi {
  files = '/admin/logs/files',
  entries = '/admin/logs/entries',
  summary = '/admin/logs/summary',
  download = '/admin/logs/download',
  clear = '/admin/logs/clear',
}

export interface LogQuery {
  file: string;
  lines?: number;
  level?: string;
  q?: string;
}

export const logApi = {
  getFiles() {
    return defHttp.get<LogFilesResult>({ url: LogApi.files });
  },
  getEntries(params: LogQuery) {
    return defHttp.get<LogEntriesResult>({ url: LogApi.entries, params });
  },
  getSummary() {
    return defHttp.get<LogSummary>({ url: LogApi.summary });
  },
  /** 下载原始日志（返回 Blob，由页面保存） */
  download(file: string) {
    return defHttp.get({ url: LogApi.download, params: { file }, responseType: 'blob', timeout: -1 }, { isTransformResponse: false, isReturnNativeResponse: true });
  },
  clear(file: string) {
    return defHttp.post({ url: LogApi.clear, data: { file, confirm: true } });
  },
};
