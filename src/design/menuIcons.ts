/**
 * 后台菜单图标清单
 *
 * 菜单由后端下发（systemMenus.js），图标名是运行时字符串，
 * 构建期无法静态分析到，会导致 purge-icons 漏收集、离线环境下图标缺失。
 * 这里集中声明一遍，供构建期扫描打包。
 *
 * 新增菜单时请同步在此追加图标名。
 */
export const MENU_ICONS = [
  'bx:bx-home',
  'ant-design:dashboard-outlined',
  'ant-design:fund-projection-screen-outlined',
  'ant-design:desktop-outlined',
  'mdi:account-group-outline',
  'mdi:account-multiple-outline',
  'mdi:puzzle-outline',
  'ion:settings-outline',
  'clarity:plugin-line',
  'ant-design:user-outlined',
  'mdi:gamepad-variant-outline',
  'ant-design:info-circle-outlined',
  'ant-design:team-outlined',
  'ant-design:audit-outlined',
];
