import type { UidRow } from './api';

/** 与 MysUsers.uids 的 key 对齐 */
export const GAME_TABS = [
  { key: 'gs', label: '原神', color: 'gold' },
  { key: 'sr', label: '星穹铁道', color: 'blue' },
  { key: 'zzz', label: '绝区零', color: 'purple' },
  { key: 'waves', label: '鸣潮', color: 'volcano' },
  { key: 'bh3', label: '崩坏3', color: 'cyan' },
  { key: 'bh2', label: '崩坏学园2', color: 'geekblue' },
  { key: 'wd', label: '未定事件簿', color: 'magenta' },
];

/** 演示数据：按游戏分组的 UID 列表 */
export const MOCK_UIDS: UidRow[] = [
  { uid: '101201451', game: 'gs', ltuid: 7184612, bindIds: ['wxid_3t6vrie4sv522'] },
  { uid: '176513512', game: 'gs', ltuid: 10344360, bindIds: ['xml25821665'] },
  { uid: '265328741', game: 'gs', ltuid: 17906159, bindIds: ['wxid_0cryzhxja0r532'] },
  { uid: '114231496', game: 'gs', ltuid: 189971228, bindIds: [] },
  { uid: '100398381', game: 'sr', ltuid: 7184612, bindIds: ['wxid_3t6vrie4sv522'] },
  { uid: '114477930', game: 'sr', ltuid: 10344360, bindIds: ['xml25821665'] },
  { uid: '123709363', game: 'sr', ltuid: 17906159, bindIds: ['wxid_0cryzhxja0r532'] },
  { uid: '103407985', game: 'sr', ltuid: 189971228, bindIds: [] },
  { uid: '13085206', game: 'zzz', ltuid: 7184612, bindIds: ['wxid_3t6vrie4sv522'] },
  { uid: '15459972', game: 'zzz', ltuid: 17906159, bindIds: ['wxid_0cryzhxja0r532'] },
  { uid: '10295834', game: 'zzz', ltuid: 189971228, bindIds: [] },
  { uid: '10856736', game: 'bh3', ltuid: 7184612, bindIds: ['wxid_3t6vrie4sv522'] },
  { uid: '215318290', game: 'bh3', ltuid: 7184612, bindIds: ['wxid_3t6vrie4sv522'] },
  { uid: '274622747', game: 'bh3', ltuid: 17906159, bindIds: ['wxid_0cryzhxja0r532'] },
  { uid: '16080583', game: 'bh3', ltuid: 17906159, bindIds: ['wxid_0cryzhxja0r532'] },
  { uid: '10730320', game: 'wd', ltuid: 189971228, bindIds: [] },
];
