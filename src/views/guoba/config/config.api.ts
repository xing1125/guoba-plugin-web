import { defHttp } from '/@/utils/http/axios';
import { adaptTimeSchemasForTabs } from './timeAdapt';

export enum Api {
  configTabs = '/config/tabs',
  configData = '/config/data',
  configCardForm = '/config/card-Form',
}

// 获取配置列表
export function queryConfigTabs() {
  return defHttp.get({ url: Api.configTabs }).then(adaptTimeSchemasForTabs);
}

/**
 * 获取配置具体数据
 * @param key 配置文件key
 */
export function queryConfigData(key: string) {
  return defHttp.get({ url: Api.configData, params: { key } }, { errorMessageMode: 'modal' });
}

/**
 * 保存配置数据
 * @param key
 * @param data
 */
export function saveConfigData(key: string, data: Recordable) {
  return defHttp.post({ url: Api.configData, params: { key, data } }, { trimValues: false });
}

/**
 * 删除cardForm某一项配置
 * @param formKey
 * @param cardKey
 */
export function removeCardForm(formKey: string, cardKey: string) {
  return defHttp.delete({ url: Api.configCardForm, params: { formKey, cardKey } }, { errorMessageMode: 'modal' });
}

/* ------------------------------ 历史版本 / 对比 / 导出导入 ------------------------------ */

export enum ConfigVersionApi {
  versions = '/config/versions',
  version = '/config/version',
  diff = '/config/diff',
  restore = '/config/restore',
  export = '/config/export',
  import = '/config/import',
}

/** 一份历史备份（每次保存自动生成） */
export interface ConfigVersion {
  /** 备份文件名，如 20261021-050134_bot.yaml */
  file: string;
  /** 时间戳串，如 20261021-050134 */
  stamp: string;
  /** 毫秒时间戳 */
  time: number;
  /** 字节数 */
  size: number;
  /** 被备份的原始文件名，如 bot.yaml */
  target: string;
}

export interface ConfigVersionList {
  key: string;
  /** 当前配置的仓库内相对路径 */
  currentFile: string;
  /** 当前配置的磁盘绝对路径 */
  currentPath: string;
  /** 时间倒序 */
  versions: ConfigVersion[];
}

export interface ConfigVersionContent {
  file: string;
  stamp: string;
  time: number;
  size: number;
  /** 历史版本原文 */
  content: string;
  /** 当前磁盘原文（用于对比） */
  currentContent: string;
}

/** type：' ' 未变 / '-' 版本有而当前没有 / '+' 当前有而版本没有 */
export interface ConfigDiffLine {
  type: ' ' | '-' | '+';
  text: string;
}

export interface ConfigDiff {
  file: string;
  stamp: string;
  time: number;
  added: number;
  removed: number;
  unchanged: number;
  /** 文件过大时只统计不逐行返回 */
  truncated?: boolean;
  lines: ConfigDiffLine[];
}

export interface ConfigRestoreResult {
  /** false 表示需要重启 Bot 才生效 */
  hot: boolean;
  reason: string;
  /** 被恢复的历史版本 stamp */
  restoredFrom: string;
  /** 恢复前的当前状态备份文件 */
  backupOf: string;
  key: string;
}

export interface ConfigExportResult {
  key: string;
  filename: string;
  content: string;
}

export interface ConfigImportResult {
  hot: boolean;
  reason: string;
  /** 导入内容的字节数 */
  bytes: number;
  /** 导入前的原配置备份文件 */
  backupOf: string;
  key: string;
}

/** 列出某配置的历史版本（时间倒序，最新 10 份） */
export function queryConfigVersions(key: string) {
  return defHttp.get<ConfigVersionList>({ url: ConfigVersionApi.versions, params: { key } }, { errorMessageMode: 'modal' });
}

/** 取单个历史版本内容 + 当前内容 */
export function queryConfigVersion(key: string, file: string) {
  return defHttp.get<ConfigVersionContent>(
    { url: ConfigVersionApi.version, params: { key, file } },
    { errorMessageMode: 'modal' },
  );
}

/** 历史版本 vs 当前磁盘 的行级 diff */
export function queryConfigDiff(key: string, file: string) {
  return defHttp.get<ConfigDiff>({ url: ConfigVersionApi.diff, params: { key, file } }, { errorMessageMode: 'modal' });
}

/** 恢复历史版本（会先备份当前状态） */
export function restoreConfigVersion(key: string, file: string) {
  return defHttp.post<ConfigRestoreResult>({ url: ConfigVersionApi.restore, params: { key, file, confirm: true } });
}

/** 导出当前配置文本 */
export function exportConfigContent(key: string) {
  return defHttp.get<ConfigExportResult>({ url: ConfigVersionApi.export, params: { key } }, { errorMessageMode: 'modal' });
}

/** 导入配置文本（会先备份当前状态） */
export function importConfigContent(key: string, content: string) {
  return defHttp.post<ConfigImportResult>({ url: ConfigVersionApi.import, params: { key, content, confirm: true } });
}
