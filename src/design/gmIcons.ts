/**
 * gm —— 后台自绘 duotone 图标集（Iconify JSON 格式，运行时 addCollection 注册）
 *
 * 设计语言：
 *  - 24×24 viewBox，主线 stroke 1.7 / 圆头圆角
 *  - duotone 双层：主色描边 + 同色低透明度填充（fill-opacity 0.18~0.45）
 *    → 跟随 currentColor，深浅主题自适应，比单线图标更有层次
 *  - 菜单由后端下发 `gm:xxx`，Icon.vue 模块加载时注册，无需本地图标库
 */

type GmIcon = { body: string };

const S = 'stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"';
const SD = 'stroke="currentColor" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"';

export const GM_COLLECTION = {
  prefix: 'gm',
  icons: {
    /* 首页 —— 屋顶 + 门洞双层 */
    home: {
      body: `<g ${S}><path d="M4.6 10.9 12 4.4l7.4 6.5"/><path d="M6.2 9.6v8.6c0 1 .8 1.9 1.9 1.9h7.8c1 0 1.9-.8 1.9-1.9V9.6"/></g><path d="M6.4 10.4 12 5.6l5.6 4.8z" fill="currentColor" fill-opacity=".25"/><rect x="10.2" y="13.6" width="3.6" height="6.5" rx="1.3" fill="currentColor" fill-opacity=".4"/>`,
    },
    /* 数据总览 —— 圆角面板 + 三柱 */
    dashboard: {
      body: `<rect x="3.6" y="4.6" width="16.8" height="14.8" rx="3" ${S}/><rect x="7" y="12.2" width="2.8" height="4" rx="1.1" fill="currentColor" fill-opacity=".35"/><rect x="10.7" y="9" width="2.8" height="7.2" rx="1.1" fill="currentColor" fill-opacity=".6"/><rect x="14.4" y="10.8" width="2.8" height="5.4" rx="1.1" fill="currentColor" fill-opacity=".35"/>`,
    },
    /* 状态大屏 —— 仪表盘 + 指针 */
    gauge: {
      body: `<path d="M4.6 15.5a7.4 7.4 0 0 1 14.8 0" ${S}/><path d="M12 15.5l3.5-5.4" ${S}/><circle cx="12" cy="15.7" r="2" fill="currentColor" fill-opacity=".45"/><path d="M4.9 19.4h14.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-opacity=".4"/>`,
    },
    /* 系统信息 —— 芯片 */
    cpu: {
      body: `<rect x="6.4" y="6.4" width="11.2" height="11.2" rx="2.2" ${S}/><path d="M9.2 6.4V4.2M14.8 6.4V4.2M9.2 19.8v-2.2M14.8 19.8v-2.2M6.4 9.2H4.2M6.4 14.8H4.2M19.8 9.2h-2.2M19.8 14.8h-2.2" ${S}/><rect x="9.4" y="9.4" width="5.2" height="5.2" rx="1.4" fill="currentColor" fill-opacity=".38"/>`,
    },
    /* 文件管理 —— 文件夹 + 双层标签 */
    folder: {
      body: `<path d="M3.9 7.4c0-1.2 1-2.2 2.2-2.2h3.6c.6 0 1.2.25 1.6.7l1.2 1.3h5.6c1.2 0 2.2 1 2.2 2.2v.9H3.9z" fill="currentColor" fill-opacity=".25"/><path d="M3.9 8.1c0-1.2 1-2.2 2.2-2.2h3.5c.6 0 1.2.26 1.6.7l1.2 1.4h5.7c1.2 0 2.2 1 2.2 2.2v6.6c0 1.2-1 2.2-2.2 2.2H6.1c-1.2 0-2.2-1-2.2-2.2z" ${S}/>`,
    },
    /* 喵喵面板图 —— 相框 + 猫耳朵（彩蛋） */
    image: {
      body: `<g ${S}><rect x="3.8" y="6.2" width="16.4" height="13.6" rx="3"/><path d="M6.8 6.4 8.3 3l2.5 3.4"/><path d="M13.2 6.4 15.7 3l1.5 3.4"/></g><path d="M7.7 5.9l.6-1.6 1.2 1.7z" fill="currentColor" fill-opacity=".4"/><path d="M16.3 5.9l-.6-1.6-1.2 1.7z" fill="currentColor" fill-opacity=".4"/><circle cx="9" cy="10.9" r="1.5" fill="currentColor" fill-opacity=".45"/><path d="M6.5 17.5l3.3-3.8 2.3 2.4 2.4-2.9 3.2 4.3z" fill="currentColor" fill-opacity=".3"/>`,
    },
    /* 群数据 —— 双人 */
    users: {
      body: `<g ${S}><circle cx="9.6" cy="9.2" r="3"/><path d="M4.4 19.4c.5-3 2.6-4.7 5.2-4.7s4.7 1.7 5.2 4.7"/></g><circle cx="16.6" cy="9.6" r="2.5" fill="currentColor" fill-opacity=".32"/><path d="M15.6 14.9c2.2.3 3.9 1.9 4.3 4.4" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-opacity=".45"/>`,
    },
    /* 用户数据 —— 人 + 消息泡 */
    user: {
      body: `<g ${S}><circle cx="11.2" cy="8.8" r="3.2"/><path d="M5.4 19.6c.6-3.3 2.9-5.2 5.8-5.2 1.2 0 2.3.3 3.2.9"/></g><path d="M15.2 4.2h3.9c.9 0 1.6.7 1.6 1.6v2.4c0 .9-.7 1.6-1.6 1.6h-2.2l-1.7 1.7z" fill="currentColor" fill-opacity=".32"/>`,
    },
    /* 账号管理 —— 指纹 */
    fingerprint: {
      body: `<g ${S} stroke-width="1.6"><path d="M5.9 9.4a6.9 6.9 0 0 1 12.2 0"/><path d="M7.6 18.6a6.9 6.9 0 0 1-1.2-3.9c0-1 .2-2 .6-2.8"/><path d="M16.4 18.6c.7-1.1 1.2-2.5 1.2-3.9"/><path d="M9.4 20.2a5 5 0 0 1-.9-5.6"/><path d="M14.6 20.2a5 5 0 0 0 .9-5.6 3.7 3.7 0 0 0-7 0c-.2.8-.2 1.6 0 2.4"/></g><circle cx="12" cy="13.6" r="1.4" fill="currentColor" fill-opacity=".45"/>`,
    },
    /* 游戏 UID —— 手柄 */
    gamepad: {
      body: `<rect x="2.9" y="7.6" width="18.2" height="9.8" rx="4.9" fill="currentColor" fill-opacity=".2"/><rect x="2.9" y="7.6" width="18.2" height="9.8" rx="4.9" ${S}/><path d="M8 10.7v4.1M5.9 12.7h4.2" ${S}/><circle cx="15.4" cy="11.5" r="1.15" fill="currentColor"/><circle cx="17.9" cy="13.9" r="1.15" fill="currentColor"/>`,
    },
    /* 数据管理 —— 数据库 */
    database: {
      body: `<path d="M4.7 6.3c0-1.5 3.3-2.8 7.3-2.8s7.3 1.3 7.3 2.8-3.3 2.8-7.3 2.8-7.3-1.3-7.3-2.8z" fill="currentColor" fill-opacity=".28"/><g ${S}><ellipse cx="12" cy="6.3" rx="7.3" ry="2.8"/><path d="M4.7 6.3v11.4c0 1.5 3.3 2.8 7.3 2.8s7.3-1.3 7.3-2.8V6.3"/></g><path d="M4.7 11.4c0 1.5 3.3 2.8 7.3 2.8s7.3-1.3 7.3-2.8M4.7 16c0 1.5 3.3 2.8 7.3 2.8s7.3-1.3 7.3-2.8" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-opacity=".5"/>`,
    },
    /* 签到中心 —— 日历 + 对勾 */
    'calendar-check': {
      body: `<path d="M3.9 8.4c0-1.7 1.3-3 3-3h10.2c1.7 0 3 1.3 3 3v1.2H3.9z" fill="currentColor" fill-opacity=".25"/><g ${S}><rect x="3.9" y="5.4" width="16.2" height="14.6" rx="3"/><path d="M8.3 3.4v3M15.7 3.4v3"/><path d="M8.8 14.3l2.3 2.3 4.3-4.5" stroke-width="1.9"/></g>`,
    },
    /* 导航管理 —— 清单 + 对点 */
    nav: {
      body: `<path d="M11 7h8.2M11 12h8.2M11 17h8.2" ${S}/><circle cx="6.3" cy="7" r="1.5" fill="currentColor" fill-opacity=".45"/><circle cx="6.3" cy="12" r="1.5" fill="currentColor" fill-opacity=".45"/><path d="M4.9 17l1.4 1.4 2.2-2.3" ${SD}/>`,
    },
    /* 聊天诊断 —— 对话泡 + 心电波 */
    pulse: {
      body: `<path d="M12 4.4c4.9 0 8.6 3.1 8.6 7.2s-3.7 7.2-8.6 7.2c-1 0-2-.14-2.9-.4L5 20l.9-3.2c-1.6-1.3-2.5-3.1-2.5-5.2 0-4.1 3.7-7.2 8.6-7.2z" fill="currentColor" fill-opacity=".16"/><path d="M12 4.4c4.9 0 8.6 3.1 8.6 7.2s-3.7 7.2-8.6 7.2c-1 0-2-.14-2.9-.4L5 20l.9-3.2c-1.6-1.3-2.5-3.1-2.5-5.2 0-4.1 3.7-7.2 8.6-7.2z" ${S}/><path d="M7.4 11.6h2l1.3-2.7 1.7 5.2 1.5-2.5h2.7" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    },
    /* 插件数据 —— 叠块 */
    puzzle: {
      body: `<rect x="3.9" y="3.9" width="10.4" height="10.4" rx="2.4" fill="currentColor" fill-opacity=".22"/><rect x="3.9" y="3.9" width="10.4" height="10.4" rx="2.4" ${S}/><rect x="9.7" y="9.7" width="10.4" height="10.4" rx="2.4" fill="currentColor" fill-opacity=".38"/><rect x="9.7" y="9.7" width="10.4" height="10.4" rx="2.4" ${S}/>`,
    },
    /* 配置管理 —— 滑杆 */
    sliders: {
      body: `<path d="M4.5 7.3h15M4.5 12h15M4.5 16.7h15" ${S}/><circle cx="9.4" cy="7.3" r="2" fill="currentColor" fill-opacity=".9"/><circle cx="15.2" cy="12" r="2" fill="currentColor" fill-opacity=".9"/><circle cx="7.6" cy="16.7" r="2" fill="currentColor" fill-opacity=".9"/>`,
    },
    /* 后台用户 —— 盾 + 对勾 */
    shield: {
      body: `<path d="M12 3.6l6.8 2.6v5.2c0 4.3-2.8 7.4-6.8 9-4-1.6-6.8-4.7-6.8-9V6.2z" fill="currentColor" fill-opacity=".2"/><path d="M12 3.6l6.8 2.6v5.2c0 4.3-2.8 7.4-6.8 9-4-1.6-6.8-4.7-6.8-9V6.2z" ${S}/><path d="M9.2 11.8l2 2 3.6-3.9" ${SD}/>`,
    },
    /* 审计日志 —— 板夹 + 流水线 */
    clipboard: {
      body: `<rect x="5.4" y="4.8" width="13.2" height="15.8" rx="2.4" fill="currentColor" fill-opacity=".14"/><g ${S}><rect x="5.4" y="4.8" width="13.2" height="15.8" rx="2.4"/><rect x="9" y="3" width="6" height="3.4" rx="1.4" fill="currentColor" fill-opacity=".4"/></g><path d="M8.6 10.8h6.8M8.6 13.9h6.8M8.6 17h4.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-opacity=".55"/>`,
    },
    /* 运行日志 —— 终端 */
    terminal: {
      body: `<rect x="3.5" y="4.4" width="17" height="15.2" rx="3" fill="currentColor" fill-opacity=".14"/><g ${S}><rect x="3.5" y="4.4" width="17" height="15.2" rx="3"/><path d="M7.2 9.7l3.1 2.7-3.1 2.7"/></g><circle cx="6.7" cy="7" r=".9" fill="currentColor" fill-opacity=".55"/><circle cx="9.3" cy="7" r=".9" fill="currentColor" fill-opacity=".55"/><path d="M12.9 15.3h4.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-opacity=".6"/>`,
    },
    /* 关于 —— 信息 */
    info: {
      body: `<circle cx="12" cy="12" r="8.4" fill="currentColor" fill-opacity=".16"/><circle cx="12" cy="12" r="8.4" ${S}/><circle cx="12" cy="8.2" r="1.05" fill="currentColor"/><path d="M12 11.3v5.1" ${SD}/>`,
    },
    /* AI 私聊 —— 机器人 */
    bot: {
      body: `<rect x="5.2" y="8" width="13.6" height="9.6" rx="3" fill="currentColor" fill-opacity=".16"/><g ${S}><rect x="5.2" y="8" width="13.6" height="9.6" rx="3"/><path d="M12 8V5.3"/><path d="M3.4 12.4v2.6M20.6 12.4v2.6"/></g><circle cx="12" cy="4.3" r="1.15" fill="currentColor"/><circle cx="9.4" cy="12.5" r="1.2" fill="currentColor"/><circle cx="14.6" cy="12.5" r="1.2" fill="currentColor"/><path d="M9.8 15.3h4.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-opacity=".55"/>`,
    },
    /* 插件清单 —— 列表 */
    list: {
      body: `<path d="M9.4 6.6h9M9.4 12h9M9.4 17.4h9" ${S}/><circle cx="5.5" cy="6.6" r="1.2" fill="currentColor" fill-opacity=".5"/><circle cx="5.5" cy="12" r="1.2" fill="currentColor" fill-opacity=".5"/><circle cx="5.5" cy="17.4" r="1.2" fill="currentColor" fill-opacity=".5"/>`,
    },
    /* 子配置 —— 齿轮 */
    gear: {
      body: `<circle cx="12" cy="12" r="3.1" fill="currentColor" fill-opacity=".35"/><circle cx="12" cy="12" r="3.1" ${S}/><path d="M12 4.5v2.2M12 17.3v2.2M4.5 12h2.2M17.3 12h2.2M6.7 6.7l1.6 1.6M15.7 15.7l1.6 1.6M17.3 6.7l-1.6 1.6M8.3 15.7l-1.6 1.6" ${S}/>`,
    },
    /* 荧 —— 心 + 微光 */
    heart: {
      body: `<path d="M12 19.8C7.2 16.9 4.4 13.9 4.4 10.6 4.4 8 6.4 6 8.9 6c1.3 0 2.4.6 3.1 1.5C12.7 6.6 13.8 6 15.1 6c2.5 0 4.5 2 4.5 4.6 0 3.3-2.8 6.3-7.6 9.2z" fill="currentColor" fill-opacity=".24"/><path d="M12 19.8C7.2 16.9 4.4 13.9 4.4 10.6 4.4 8 6.4 6 8.9 6c1.3 0 2.4.6 3.1 1.5C12.7 6.6 13.8 6 15.1 6c2.5 0 4.5 2 4.5 4.6 0 3.3-2.8 6.3-7.6 9.2z" ${S}/><path d="M18.7 2.7v2.6M17.4 4h2.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
    },
    /* 统计 —— 折线 + 面积 */
    chart: {
      body: `<path d="M7.4 14.2l3.4-3.6 2.6 2.2 4.2-4.8v7h-10.2z" fill="currentColor" fill-opacity=".2"/><path d="M4.4 4.4v15.2h15.2" ${S}/><path d="M7.4 14.2l3.4-3.6 2.6 2.2 4.2-4.8" ${S}/>`,
    },
  } as Record<string, GmIcon>,
  width: 24,
  height: 24,
} as const;
