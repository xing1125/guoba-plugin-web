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
    /* 控制台 —— 侧栏面板 + 内容行（与终端窗口区分） */
    console: {
      body: `<rect x="3.4" y="4.4" width="17.2" height="15.2" rx="3" fill="currentColor" fill-opacity=".12"/><g ${S}><rect x="3.4" y="4.4" width="17.2" height="15.2" rx="3"/><path d="M8.6 4.6v14.8"/><path d="M11.4 9.2h6.2"/><path d="M11.4 12.4h4.2"/></g><path d="M11.4 15.8h6.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-opacity=".45"/><circle cx="6" cy="8.2" r=".9" fill="currentColor" fill-opacity=".5"/><circle cx="6" cy="11.6" r=".9" fill="currentColor" fill-opacity=".34"/>`,
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
    /* 设置 —— 齿轮：外圈 + 八颗短齿（粗圆头）+ 实心轴心 */
    gear: {
      body: `<circle cx="12" cy="12" r="7.1" fill="currentColor" fill-opacity=".12"/><circle cx="12" cy="12" r="7.1" ${S}/><circle cx="12" cy="12" r="2.9" fill="currentColor" fill-opacity=".34"/><circle cx="12" cy="12" r="2.9" ${S}/><path d="M12 3.2v1.9M12 18.9v1.9M3.2 12h1.9M18.9 12h1.9M5.9 5.9l1.3 1.3M16.8 16.8l1.3 1.3M18.1 5.9l-1.3 1.3M7.2 16.8l-1.3 1.3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`,
    },
    /* 荧 —— 心 + 微光 */
    heart: {
      body: `<path d="M12 19.8C7.2 16.9 4.4 13.9 4.4 10.6 4.4 8 6.4 6 8.9 6c1.3 0 2.4.6 3.1 1.5C12.7 6.6 13.8 6 15.1 6c2.5 0 4.5 2 4.5 4.6 0 3.3-2.8 6.3-7.6 9.2z" fill="currentColor" fill-opacity=".24"/><path d="M12 19.8C7.2 16.9 4.4 13.9 4.4 10.6 4.4 8 6.4 6 8.9 6c1.3 0 2.4.6 3.1 1.5C12.7 6.6 13.8 6 15.1 6c2.5 0 4.5 2 4.5 4.6 0 3.3-2.8 6.3-7.6 9.2z" ${S}/><path d="M18.7 2.7v2.6M17.4 4h2.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
    },
    /* 统计 —— 折线 + 面积 */
    chart: {
      body: `<path d="M7.4 14.2l3.4-3.6 2.6 2.2 4.2-4.8v7h-10.2z" fill="currentColor" fill-opacity=".2"/><path d="M4.4 4.4v15.2h15.2" ${S}/><path d="M7.4 14.2l3.4-3.6 2.6 2.2 4.2-4.8" ${S}/>`,
    },

    /* ======================= 操作类（按钮 / 表格行内动作） ======================= */

    /* 新增 —— 纯十字，按钮里最不需要装饰 */
    plus: { body: `<path d="M12 6.2v11.6M6.2 12h11.6" ${SD}/>` },
    minus: { body: `<path d="M6.2 12h11.6" ${SD}/>` },

    /* 编辑 —— 笔身 + 笔尖，斜向 45° */
    edit: {
      body: `<path d="M4.8 19.2l.9-4.3 9.3-9.3a2.2 2.2 0 0 1 3.1 3.1l-9.3 9.3z" fill="currentColor" fill-opacity=".16"/><path d="M4.8 19.2l.9-4.3 9.3-9.3a2.2 2.2 0 0 1 3.1 3.1l-9.3 9.3z" ${S}/><path d="M13.2 7l3.8 3.8" ${S}/>`,
    },

    /* 删除 —— 桶身带两道棱，桶盖单独一根横线 */
    trash: {
      body: `<path d="M7.1 8.2h9.8l-.6 8.6c-.1 1-.9 1.7-1.9 1.7h-4.8c-1 0-1.8-.7-1.9-1.7z" fill="currentColor" fill-opacity=".16"/><path d="M4.9 7.4h14.2" ${S}/><path d="M9.4 7.4V5.6c0-.8.6-1.4 1.4-1.4h2.4c.8 0 1.4.6 1.4 1.4v1.8" ${S}/><path d="M6.7 7.4l.8 11.2c.1 1 .9 1.8 1.9 1.8h5.2c1 0 1.8-.8 1.9-1.8l.8-11.2" ${S}/><path d="M10.4 10.8v5.8M13.6 10.8v5.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-opacity=".5"/>`,
    },

    /* 保存 —— 软盘造型，上标签实心 */
    save: {
      body: `<path d="M5.6 5.4h9.4l3.4 3.4v9.4c0 1-.8 1.8-1.8 1.8H5.6c-1 0-1.8-.8-1.8-1.8V7.2c0-1 .8-1.8 1.8-1.8z" fill="currentColor" fill-opacity=".14"/><path d="M5.6 5.4h9.4l3.4 3.4v9.4c0 1-.8 1.8-1.8 1.8H5.6c-1 0-1.8-.8-1.8-1.8V7.2c0-1 .8-1.8 1.8-1.8z" ${S}/><path d="M8.6 5.6h6v3.7h-6z" fill="currentColor" fill-opacity=".4"/><rect x="8.4" y="13.4" width="7.2" height="6.2" rx="1.2" ${S}/>`,
    },

    /* 复制 —— 后页 + 前页，前页里放内容块 */
    copy: {
      body: `<rect x="8.4" y="8.4" width="10.4" height="11" rx="2.4" fill="currentColor" fill-opacity=".12"/><rect x="8.4" y="8.4" width="10.4" height="11" rx="2.4" ${S}/><path d="M15.4 8.4V6.8c0-1-.8-1.8-1.8-1.8H6.8c-1 0-1.8.8-1.8 1.8v7.8c0 1 .8 1.8 1.8 1.8h1.6" ${S}/><rect x="11.2" y="11.4" width="4.8" height="4.6" rx="1.1" fill="currentColor" fill-opacity=".3"/>`,
    },

    /* 下载 —— 落箭头 + 底部托盘，箭头体内实心 */
    download: {
      body: `<path d="M12 3.9l-4.1 4.1h2.7v4.6h2.8V8h2.7z" fill="currentColor" fill-opacity=".22"/><path d="M12 4.6v9.4" ${S}/><path d="M8 10.6l4 3.8 4-3.8" ${SD}/><path d="M4.9 16.6v1.5c0 1 .8 1.8 1.8 1.8h10.6c1 0 1.8-.8 1.8-1.8v-1.5" ${S}/>`,
    },

    /* 上传 —— 与下载镜像 */
    upload: {
      body: `<path d="M12 3.9l4.1 4.1H13.4v4.6h-2.8V8H7.9z" fill="currentColor" fill-opacity=".22"/><path d="M12 13.4V4.6" ${S}/><path d="M8 8.6l4-3.8 4 3.8" ${SD}/><path d="M4.9 16.6v1.5c0 1 .8 1.8 1.8 1.8h10.6c1 0 1.8-.8 1.8-1.8v-1.5" ${S}/>`,
    },

    /* 刷新 —— 两段圆弧 + 箭头，顺时针 */
    refresh: {
      body: `<path d="M18.9 8.4A7.7 7.7 0 0 0 5.4 9.2" ${S}/><path d="M5.1 15.6a7.7 7.7 0 0 0 13.5-.8" ${S}/><path d="M19.4 4.9v3.9h-3.9" ${S}/><path d="M4.6 19.1v-3.9h3.9" ${S}/>`,
    },

    /* 重做 —— 回环箭头 */
    redo: {
      body: `<path d="M4.9 16.2c.2-3.9 3.3-6.7 7.2-6.7h6.2" ${S}/><path d="M14.9 5.9l3.9 3.6-3.9 3.6" ${S}/><path d="M4.9 16.2c0-.3 0-.6.1-.9" ${S}/>`,
    },

    /* 撤销 / 回滚 —— redo 的镜像 */
    undo: {
      body: `<path d="M19.1 16.2c-.2-3.9-3.3-6.7-7.2-6.7H5.7" ${S}/><path d="M9.1 5.9 5.2 9.5l3.9 3.6" ${S}/><path d="M19.1 16.2c0-.3 0-.6-.1-.9" ${S}/>`,
    },

    /* 搜索 —— 放大镜，镜片里再套一层淡色 */
    search: {
      body: `<circle cx="10.7" cy="10.7" r="6.1" fill="currentColor" fill-opacity=".12"/><circle cx="10.7" cy="10.7" r="6.1" ${S}/><circle cx="10.7" cy="10.7" r="3" fill="currentColor" fill-opacity=".18"/><path d="M15.4 15.4l4.1 4.1" ${SD}/>`,
    },

    /* 筛选 —— 漏斗 */
    filter: {
      body: `<path d="M4.4 6.2h15.2l-5.7 6.7v5.4l-3.8 1.9v-7.3z" fill="currentColor" fill-opacity=".18"/><path d="M4.4 6.2h15.2l-5.7 6.7v5.4l-3.8 1.9v-7.3z" ${S}/>`,
    },

    close: { body: `<path d="M6.4 6.4l11.2 11.2M17.6 6.4L6.4 17.6" ${SD}/>` },
    check: { body: `<path d="M5.8 12.6l4.2 4.2 8.4-9.2" ${SD}/>` },

    /* 电源 —— 竖线 + 缺口圆环 */
    power: {
      body: `<path d="M12 4.2v7.4" ${SD}/><path d="M8.4 6.6a7 7 0 1 0 7.2 0" ${S}/>`,
    },

    /* 全屏 —— 四个角标 */
    fullscreen: {
      body: `<path d="M4.8 9.2V6.6c0-1 .8-1.8 1.8-1.8h2.6M15.2 4.8h2.6c1 0 1.8.8 1.8 1.8v2.6M19.2 14.8v2.6c0 1-.8 1.8-1.8 1.8h-2.6M9.2 19.2H6.6c-1 0-1.8-.8-1.8-1.8v-2.6" ${SD}/>`,
    },

    /* 闪电 —— 快捷动作 / 即时生效 */
    zap: {
      body: `<path d="M13.4 2.8 6.2 13.2h4.6l-.8 8 7.4-10.6h-4.8z" fill="currentColor" fill-opacity=".2"/><path d="M13.4 2.8 6.2 13.2h4.6l-.8 8 7.4-10.6h-4.8z" ${S}/>`,
    },

    /* 登录 —— 门框 + 进入箭头 */
    login: {
      body: `<path d="M13.4 5.2h4.2c1 0 1.8.8 1.8 1.8v10c0 1-.8 1.8-1.8 1.8h-4.2" ${S}/><path d="M4.6 12h10.2" ${S}/><path d="M11.4 8.6 14.8 12l-3.4 3.4" ${S}/><path d="M8.2 6.6h3.4v10.8H8.2z" fill="currentColor" fill-opacity=".14"/>`,
    },

    /* ======================= 插件菜单专用（后端 pluginMenus 下发） ======================= */

    /* 插件列表 —— 卡片框 + 三行条目 */
    'plugin-list': {
      body: `<rect x="3.6" y="4.4" width="16.8" height="15.2" rx="3" fill="currentColor" fill-opacity=".1"/><rect x="3.6" y="4.4" width="16.8" height="15.2" rx="3" ${S}/><path d="M3.6 8.6h16.8" ${S}/><circle cx="6.6" cy="6.5" r=".9" fill="currentColor" fill-opacity=".5"/><circle cx="9.2" cy="6.5" r=".9" fill="currentColor" fill-opacity=".5"/><path d="M7 12h10M7 15.4h10M7 17.4h5.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-opacity=".55"/>`,
    },

    /* 插件配置 —— 卡片框 + 两组滑杆 */
    'plugin-config': {
      body: `<rect x="3.6" y="4.4" width="16.8" height="15.2" rx="3" fill="currentColor" fill-opacity=".1"/><rect x="3.6" y="4.4" width="16.8" height="15.2" rx="3" ${S}/><path d="M3.6 8.6h16.8" ${S}/><path d="M7.4 12.4h9.2M7.4 16.2h9.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-opacity=".45"/><circle cx="10.2" cy="12.4" r="1.7" fill="currentColor" fill-opacity=".55"/><circle cx="14.2" cy="16.2" r="1.7" fill="currentColor" fill-opacity=".55"/>`,
    },

    /* 插件数据 —— 卡片框 + 三根柱 */
    'plugin-chart': {
      body: `<rect x="3.6" y="4.4" width="16.8" height="15.2" rx="3" fill="currentColor" fill-opacity=".1"/><rect x="3.6" y="4.4" width="16.8" height="15.2" rx="3" ${S}/><path d="M3.6 8.6h16.8" ${S}/><rect x="7" y="13.4" width="2.6" height="3.4" rx=".9" fill="currentColor" fill-opacity=".4"/><rect x="10.7" y="11" width="2.6" height="5.8" rx=".9" fill="currentColor" fill-opacity=".65"/><rect x="14.4" y="12.4" width="2.6" height="4.4" rx=".9" fill="currentColor" fill-opacity=".4"/>`,
    },

    /* 插件数据（库）—— 卡片框 + 数据柱 */
    'plugins-data': {
      body: `<rect x="3.6" y="4.4" width="16.8" height="15.2" rx="3" fill="currentColor" fill-opacity=".1"/><rect x="3.6" y="4.4" width="16.8" height="15.2" rx="3" ${S}/><path d="M3.6 8.6h16.8" ${S}/><rect x="6.8" y="11.4" width="10.4" height="2.6" rx="1.1" fill="currentColor" fill-opacity=".5"/><rect x="6.8" y="15.4" width="7.2" height="2.6" rx="1.1" fill="currentColor" fill-opacity=".28"/>`,
    },

    /* 拖拽把手 —— 六点 */
    drag: {
      body: `<circle cx="9.2" cy="7" r="1.25" fill="currentColor" fill-opacity=".55"/><circle cx="14.8" cy="7" r="1.25" fill="currentColor" fill-opacity=".55"/><circle cx="9.2" cy="12" r="1.25" fill="currentColor" fill-opacity=".55"/><circle cx="14.8" cy="12" r="1.25" fill="currentColor" fill-opacity=".55"/><circle cx="9.2" cy="17" r="1.25" fill="currentColor" fill-opacity=".55"/><circle cx="14.8" cy="17" r="1.25" fill="currentColor" fill-opacity=".55"/>`,
    },

    /* 链接 —— 两节链条 */
    link: {
      body: `<path d="M10.4 13.6a3.5 3.5 0 0 0 4.9 0l2.5-2.5a3.5 3.5 0 0 0-4.9-4.9l-1.3 1.3" ${S}/><path d="M13.6 10.4a3.5 3.5 0 0 0-4.9 0l-2.5 2.5a3.5 3.5 0 0 0 4.9 4.9l1.3-1.3" ${S}/><path d="M9.4 14.6l5.2-5.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-opacity=".45"/>`,
    },

    /* 外链 —— 方框 + 斜向箭头 */
    external: {
      body: `<path d="M13.6 5.4h5v5" ${S}/><path d="M18.6 5.4l-7.2 7.2" ${S}/><path d="M17.4 13.8v3.8c0 1-.8 1.8-1.8 1.8H6.6c-1 0-1.8-.8-1.8-1.8V8.4c0-1 .8-1.8 1.8-1.8h3.8" ${S}/>`,
    },

    /* 更多 —— 三点 */
    more: {
      body: `<circle cx="6.4" cy="12" r="1.4" fill="currentColor" fill-opacity=".6"/><circle cx="12" cy="12" r="1.4" fill="currentColor" fill-opacity=".6"/><circle cx="17.6" cy="12" r="1.4" fill="currentColor" fill-opacity=".6"/>`,
    },

    /* ======================= 状态 / 提示类 ======================= */

    warning: {
      body: `<path d="M12 4.6l8.3 14.4H3.7z" fill="currentColor" fill-opacity=".18"/><path d="M12 4.6l8.3 14.4H3.7z" ${S}/><path d="M12 9.7v4.2" ${SD}/><circle cx="12" cy="16.4" r="1.05" fill="currentColor"/>`,
    },
    error: {
      body: `<circle cx="12" cy="12" r="8.2" fill="currentColor" fill-opacity=".14"/><circle cx="12" cy="12" r="8.2" ${S}/><path d="M9.4 9.4l5.2 5.2M14.6 9.4l-5.2 5.2" ${SD}/>`,
    },
    success: {
      body: `<circle cx="12" cy="12" r="8.2" fill="currentColor" fill-opacity=".14"/><circle cx="12" cy="12" r="8.2" ${S}/><path d="M8.4 12.2l2.6 2.5 4.6-5" ${SD}/>`,
    },
    question: {
      body: `<circle cx="12" cy="12" r="8.2" fill="currentColor" fill-opacity=".12"/><circle cx="12" cy="12" r="8.2" ${S}/><path d="M9.7 9.7c.2-1.4 1.3-2.3 2.5-2.3 1.4 0 2.5.9 2.5 2.2 0 1.9-2.6 2-2.6 3.9" ${S}/><circle cx="12" cy="16.7" r="1.05" fill="currentColor"/>`,
    },

    /* 灯泡 —— 提示 / 建议 */
    bulb: {
      body: `<path d="M8.4 14.5a5.4 5.4 0 1 1 7.2 0c-.7.7-1 1.3-1 2.2H9.4c0-.9-.3-1.5-1-2.2z" fill="currentColor" fill-opacity=".2"/><path d="M8.4 14.5a5.4 5.4 0 1 1 7.2 0c-.7.7-1 1.3-1 2.2H9.4c0-.9-.3-1.5-1-2.2z" ${S}/><path d="M10 18.6h4M10.7 20.9h2.6" ${S}/><path d="M12 5.9v2.4M8.6 7.4l1.2 1.5M15.4 7.4l-1.2 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-opacity=".55"/>`,
    },

    bell: {
      body: `<path d="M6.6 10.6a5.4 5.4 0 0 1 10.8 0c0 3 .7 4.6 1.5 5.4H5.1c.8-.8 1.5-2.4 1.5-5.4z" fill="currentColor" fill-opacity=".18"/><path d="M6.6 10.6a5.4 5.4 0 0 1 10.8 0c0 3 .7 4.6 1.5 5.4H5.1c.8-.8 1.5-2.4 1.5-5.4z" ${S}/><path d="M10.3 18.4a1.9 1.9 0 0 0 3.4 0" ${S}/>`,
    },

    /* 缺陷 —— 甲壳 + 中缝 + 六足两触角 */
    bug: {
      body: `<rect x="7.8" y="7.6" width="8.4" height="10.8" rx="4.2" fill="currentColor" fill-opacity=".18"/><rect x="7.8" y="7.6" width="8.4" height="10.8" rx="4.2" ${S}/><path d="M12 8.4v9.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-opacity=".45"/><path d="M7.8 10.8H5.3M16.2 10.8h2.5M7.8 14.2H5.5M16.2 14.2h2.3M9.1 17.4 7.2 19M14.9 17.4 16.8 19M9.5 7.4 8.5 5M14.5 7.4 15.5 5" ${S}/>`,
    },

    /* 热门 —— 外焰 + 内焰双层 */
    fire: {
      body: `<path d="M12 3.6c1.2 2.2 2.3 3.5 3.3 4.9 1 1.4 1.5 2.6 1.5 4 0 3-2.2 5.3-4.8 5.3S7.2 15.5 7.2 12.5c0-1.6.6-2.8 1.6-4 .4.5.8.9 1.4 1.2-.2-2.2.3-4.3 1.8-6.1z" fill="currentColor" fill-opacity=".22"/><path d="M12 3.6c1.2 2.2 2.3 3.5 3.3 4.9 1 1.4 1.5 2.6 1.5 4 0 3-2.2 5.3-4.8 5.3S7.2 15.5 7.2 12.5c0-1.6.6-2.8 1.6-4 .4.5.8.9 1.4 1.2-.2-2.2.3-4.3 1.8-6.1z" ${S}/><path d="M12 12.2c.9 1 1.4 1.9 1.4 2.7a1.4 1.4 0 0 1-2.8 0c0-.8.5-1.7 1.4-2.7z" fill="currentColor" fill-opacity=".4"/><path d="M9.4 20.4h5.2" ${S}/>`,
    },

    lock: {
      body: `<rect x="5" y="10.4" width="14" height="9.4" rx="2.6" fill="currentColor" fill-opacity=".18"/><rect x="5" y="10.4" width="14" height="9.4" rx="2.6" ${S}/><path d="M8.2 10.4V8.2a3.8 3.8 0 0 1 7.6 0v2.2" ${S}/><circle cx="12" cy="15" r="1.4" fill="currentColor"/>`,
    },
    unlock: {
      body: `<rect x="5" y="10.4" width="14" height="9.4" rx="2.6" fill="currentColor" fill-opacity=".12"/><rect x="5" y="10.4" width="14" height="9.4" rx="2.6" ${S}/><path d="M8.2 10.4V8.2a3.8 3.8 0 0 1 7.2-1.4" ${S}/><circle cx="12" cy="15" r="1.4" fill="currentColor" fill-opacity=".5"/>`,
    },

    key: {
      body: `<circle cx="8.6" cy="15.4" r="3.4" fill="currentColor" fill-opacity=".16"/><circle cx="8.6" cy="15.4" r="3.4" ${S}/><path d="M11 13l7.3-7.3" ${S}/><path d="M15.4 8.6l2.3 2.3M13.3 10.7l2.3 2.3" ${S}/><circle cx="8.6" cy="15.4" r="1.2" fill="currentColor" fill-opacity=".5"/>`,
    },

    eye: {
      body: `<path d="M2.8 12S6.4 5.9 12 5.9 21.2 12 21.2 12 17.6 18.1 12 18.1 2.8 12 2.8 12z" fill="currentColor" fill-opacity=".14"/><path d="M2.8 12S6.4 5.9 12 5.9 21.2 12 21.2 12 17.6 18.1 12 18.1 2.8 12 2.8 12z" ${S}/><circle cx="12" cy="12" r="2.7" ${S}/><circle cx="12" cy="12" r="1.1" fill="currentColor"/>`,
    },

    star: {
      body: `<path d="M12 4.2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.9l5.4-.8z" fill="currentColor" fill-opacity=".24"/><path d="M12 4.2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.9l5.4-.8z" ${S}/>`,
    },

    /* ======================= 数据 / 文件类 ======================= */

    'chart-bar': {
      body: `<path d="M4.4 4.6v14.8h15" ${S}/><rect x="7.2" y="12.2" width="3" height="5.2" rx="1" fill="currentColor" fill-opacity=".4"/><rect x="11.8" y="8.4" width="3" height="9" rx="1" fill="currentColor" fill-opacity=".7"/><rect x="16.4" y="10.4" width="3" height="7" rx="1" fill="currentColor" fill-opacity=".4"/>`,
    },
    'chart-pie': {
      body: `<circle cx="12" cy="12" r="8" ${S}/><path d="M12 4a8 8 0 0 1 8 8h-8z" fill="currentColor" fill-opacity=".36"/><path d="M12 12V4M12 12h8" stroke="currentColor" stroke-width="1.5" stroke-opacity=".5"/>`,
    },
    'chart-dot': {
      body: `<path d="M4.4 4.6v14.8h15" ${S}/><circle cx="8.2" cy="14.6" r="1.5" fill="currentColor" fill-opacity=".55"/><circle cx="12" cy="10.2" r="1.5" fill="currentColor" fill-opacity=".75"/><circle cx="16.4" cy="12.6" r="1.5" fill="currentColor" fill-opacity=".55"/><circle cx="18.6" cy="7.6" r="1.5" fill="currentColor" fill-opacity=".4"/>`,
    },
    table: {
      body: `<rect x="4" y="5.2" width="16" height="13.6" rx="2.4" fill="currentColor" fill-opacity=".1"/><rect x="4" y="5.2" width="16" height="13.6" rx="2.4" ${S}/><path d="M4 9.6h16M9.8 9.6v9.2" ${S}/><rect x="4.6" y="5.8" width="14.8" height="3.2" rx="1.4" fill="currentColor" fill-opacity=".26"/>`,
    },
    grid: {
      body: `<rect x="4.2" y="4.2" width="6.6" height="6.6" rx="2" fill="currentColor" fill-opacity=".28"/><rect x="13.2" y="4.2" width="6.6" height="6.6" rx="2" ${S}/><rect x="4.2" y="13.2" width="6.6" height="6.6" rx="2" ${S}/><rect x="13.2" y="13.2" width="6.6" height="6.6" rx="2" fill="currentColor" fill-opacity=".28"/>`,
    },
    tags: {
      body: `<path d="M4.2 6.2c0-1.1.9-2 2-2h4.3c.5 0 1 .2 1.4.6l6.5 6.5c.8.8.8 2 0 2.8l-3.4 3.4c-.8.8-2 .8-2.8 0L5.2 10.9c-.4-.4-.6-.9-.6-1.4z" fill="currentColor" fill-opacity=".14"/><path d="M4.2 6.2c0-1.1.9-2 2-2h4.3c.5 0 1 .2 1.4.6l6.5 6.5c.8.8.8 2 0 2.8l-3.4 3.4c-.8.8-2 .8-2.8 0L5.2 10.9c-.4-.4-.6-.9-.6-1.4z" ${S}/><circle cx="8.4" cy="8.4" r="1.5" fill="currentColor" fill-opacity=".5"/>`,
    },
    inbox: {
      body: `<path d="M4.4 13.2l2.3-7.1c.3-.9 1.1-1.5 2-1.5h6.6c.9 0 1.7.6 2 1.5l2.3 7.1v3.4c0 1-.8 1.8-1.8 1.8H6.2c-1 0-1.8-.8-1.8-1.8z" fill="currentColor" fill-opacity=".12"/><path d="M4.4 13.2h4.2l.8 1.7h5.2l.8-1.7h4.2" ${S}/><path d="M4.4 13.2l2.3-7.1c.3-.9 1.1-1.5 2-1.5h6.6c.9 0 1.7.6 2 1.5l2.3 7.1v3.4c0 1-.8 1.8-1.8 1.8H6.2c-1 0-1.8-.8-1.8-1.8z" ${S}/>`,
    },
    'file-text': {
      body: `<path d="M6.6 3.9h7l4.2 4.2v11.9c0 .4-.3.7-.7.7H6.6c-.4 0-.7-.3-.7-.7V4.6c0-.4.3-.7.7-.7z" fill="currentColor" fill-opacity=".12"/><path d="M13.4 3.9l4.4 4.4h-4.4z" fill="currentColor" fill-opacity=".3"/><path d="M6.6 3.9h7l4.2 4.1v11.9c0 .5-.4.9-.9.9H6.9c-.5 0-.9-.4-.9-.9V4.8c0-.5.4-.9.9-.9z" ${S}/><path d="M9 12h6M9 15.2h6M9 17.9h3.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-opacity=".55"/>`,
    },
    'file-code': {
      body: `<path d="M6.6 3.9h7l4.2 4.2v11.9c0 .4-.3.7-.7.7H6.6c-.4 0-.7-.3-.7-.7V4.6c0-.4.3-.7.7-.7z" fill="currentColor" fill-opacity=".12"/><path d="M13.4 3.9l4.4 4.4h-4.4z" fill="currentColor" fill-opacity=".3"/><path d="M6.6 3.9h7l4.2 4.1v11.9c0 .5-.4.9-.9.9H6.9c-.5 0-.9-.4-.9-.9V4.8c0-.5.4-.9.9-.9z" ${S}/><path d="M10 12.6l-1.6 1.7 1.6 1.7M14 12.6l1.6 1.7-1.6 1.7" ${S}/>`,
    },
    'folder-open': {
      body: `<path d="M3.7 8.2c0-1.1.9-2 2-2h3.5c.5 0 1 .2 1.4.6l1.2 1.3h5.6c1.1 0 2 .9 2 2v1H3.7z" fill="currentColor" fill-opacity=".26"/><path d="M3.7 10.1h17.1l-2.1 7.6c-.2.9-1 1.5-1.9 1.5H5.8c-1.1 0-2-.9-2-2z" fill="currentColor" fill-opacity=".14"/><path d="M3.7 8.2c0-1.1.9-2 2-2h3.5c.5 0 1 .2 1.4.6l1.2 1.3h5.6c1.1 0 2 .9 2 2" ${S}/><path d="M3.7 10.1h17.1l-2.1 7.6c-.2.9-1 1.5-1.9 1.5H5.8c-1.1 0-2-.9-2-2z" ${S}/>`,
    },
    harddisk: {
      body: `<rect x="3.8" y="5.4" width="16.4" height="13.2" rx="3" fill="currentColor" fill-opacity=".12"/><rect x="3.8" y="5.4" width="16.4" height="13.2" rx="3" ${S}/><path d="M3.8 13.2h16.4" ${S}/><circle cx="16.4" cy="16" r="1.15" fill="currentColor"/><rect x="4.4" y="6" width="15.2" height="6.6" rx="1.6" fill="currentColor" fill-opacity=".16"/>`,
    },
    memory: {
      body: `<rect x="5.4" y="7.4" width="13.2" height="9.2" rx="2.2" fill="currentColor" fill-opacity=".1"/><rect x="5.4" y="7.4" width="13.2" height="9.2" rx="2.2" ${S}/><rect x="8.4" y="10.2" width="3" height="3.6" rx="1" fill="currentColor" fill-opacity=".4"/><rect x="12.6" y="10.2" width="3" height="3.6" rx="1" fill="currentColor" fill-opacity=".4"/><path d="M4.4 10.4v3.2M19.6 10.4v3.2" ${S}/>`,
    },
    server: {
      body: `<rect x="4.2" y="4.6" width="15.6" height="6.2" rx="2.2" fill="currentColor" fill-opacity=".14"/><rect x="4.2" y="4.6" width="15.6" height="6.2" rx="2.2" ${S}/><rect x="4.2" y="13.2" width="15.6" height="6.2" rx="2.2" ${S}/><circle cx="7.4" cy="7.7" r="1" fill="currentColor" fill-opacity=".6"/><circle cx="7.4" cy="16.3" r="1" fill="currentColor" fill-opacity=".6"/>`,
    },
    cluster: {
      body: `<circle cx="12" cy="5.6" r="2.4" ${S}/><circle cx="6" cy="17.6" r="2.4" ${S}/><circle cx="18" cy="17.6" r="2.4" ${S}/><path d="M10.6 7.7 7.4 15.4M13.4 7.7l3.2 7.7M8.4 17.6h7.2" stroke="currentColor" stroke-width="1.6" stroke-opacity=".5" fill="none" stroke-linecap="round"/><circle cx="12" cy="5.6" r="1" fill="currentColor" fill-opacity=".5"/>`,
    },
    api: {
      body: `<path d="M8.2 8.2 4.4 12l3.8 3.8M15.8 8.2 19.6 12l-3.8 3.8" ${S}/><circle cx="12" cy="12" r="1.9" fill="currentColor" fill-opacity=".45"/><circle cx="12" cy="12" r="1.9" ${S}/>`,
    },
    qrcode: {
      body: `<rect x="3.8" y="3.8" width="6" height="6" rx="1.6" ${S}/><rect x="14.2" y="3.8" width="6" height="6" rx="1.6" ${S}/><rect x="3.8" y="14.2" width="6" height="6" rx="1.6" ${S}/><rect x="5.6" y="5.6" width="2.4" height="2.4" rx=".6" fill="currentColor" fill-opacity=".55"/><rect x="16" y="5.6" width="2.4" height="2.4" rx=".6" fill="currentColor" fill-opacity=".55"/><rect x="5.6" y="16" width="2.4" height="2.4" rx=".6" fill="currentColor" fill-opacity=".55"/><rect x="13.6" y="13.6" width="2.2" height="2.2" rx=".6" fill="currentColor" fill-opacity=".45"/><rect x="17.8" y="13.6" width="2.2" height="2.2" rx=".6" fill="currentColor" fill-opacity=".45"/><rect x="13.6" y="17.8" width="2.2" height="2.2" rx=".6" fill="currentColor" fill-opacity=".45"/><rect x="17.8" y="17.8" width="2.2" height="2.2" rx=".6" fill="currentColor" fill-opacity=".45"/>`,
    },
    monitor: {
      body: `<rect x="3.4" y="4.6" width="17.2" height="11.4" rx="2.4" fill="currentColor" fill-opacity=".14"/><rect x="3.4" y="4.6" width="17.2" height="11.4" rx="2.4" ${S}/><path d="M9 19.4h6M12 16.2v3.2" ${S}/><path d="M5.6 7.4h5.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-opacity=".4"/>`,
    },
    clock: {
      body: `<circle cx="12" cy="12" r="8.2" fill="currentColor" fill-opacity=".12"/><circle cx="12" cy="12" r="8.2" ${S}/><path d="M12 7.4V12l3.4 2.1" ${SD}/>`,
    },
    trophy: {
      body: `<path d="M7.6 4.6h8.8v4.2a4.4 4.4 0 0 1-8.8 0z" fill="currentColor" fill-opacity=".22"/><path d="M7.6 4.6h8.8v4.2a4.4 4.4 0 0 1-8.8 0z" ${S}/><path d="M7.6 5.8H5.2a2.6 2.6 0 0 0 2.6 4.2M16.4 5.8h2.4a2.6 2.6 0 0 1-2.6 4.2" ${S}/><path d="M12 13.2v3.2M9 19.4h6M10.4 16.4h3.2v3H10.4z" ${S}/>`,
    },
    idcard: {
      body: `<rect x="3.4" y="6" width="17.2" height="12" rx="2.6" fill="currentColor" fill-opacity=".12"/><rect x="3.4" y="6" width="17.2" height="12" rx="2.6" ${S}/><circle cx="8.8" cy="11.2" r="1.9" fill="currentColor" fill-opacity=".45"/><path d="M5.8 15.6c.4-1.5 1.5-2.2 3-2.2s2.6.7 3 2.2" ${S}/><path d="M14 10.6h4.2M14 13.4h4.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-opacity=".5"/>`,
    },
    mail: {
      body: `<rect x="3.4" y="5.6" width="17.2" height="12.8" rx="2.6" fill="currentColor" fill-opacity=".12"/><rect x="3.4" y="5.6" width="17.2" height="12.8" rx="2.6" ${S}/><path d="M4.2 7.2 12 12.6l7.8-5.4" ${S}/>`,
    },
    cloud: {
      body: `<path d="M7.6 18.2a3.9 3.9 0 0 1-.5-7.7 5.2 5.2 0 0 1 9.9-1.2 3.6 3.6 0 0 1 .6 7.1z" fill="currentColor" fill-opacity=".16"/><path d="M7.6 18.2a3.9 3.9 0 0 1-.5-7.7 5.2 5.2 0 0 1 9.9-1.2 3.6 3.6 0 0 1 .6 7.1z" ${S}/>`,
    },
    /* 控制台 —— 终端窗 + 提示符 */
    console: {
      body: `<rect x="3.4" y="4.8" width="17.2" height="14.4" rx="2.8" fill="currentColor" fill-opacity=".12"/><rect x="3.4" y="4.8" width="17.2" height="14.4" rx="2.8" ${S}/><path d="M7.4 9.8l2.6 2.3-2.6 2.3" ${SD}/><path d="M12.6 14.4h4.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-opacity=".55"/>`,
    },

    /* ======================= 方向 / 导航类 ======================= */

    'arrow-up': { body: `<path d="M12 19.2V5.4" ${S}/><path d="M6.6 10.8 12 5.4l5.4 5.4" ${S}/>` },
    'arrow-down': { body: `<path d="M12 4.8v13.8" ${S}/><path d="M6.6 13.2 12 18.6l5.4-5.4" ${S}/>` },
    'arrow-left': { body: `<path d="M19.2 12H5.4" ${S}/><path d="M10.8 6.6 5.4 12l5.4 5.4" ${S}/>` },
    'arrow-right': { body: `<path d="M4.8 12h13.8" ${S}/><path d="M13.2 6.6 18.6 12l-5.4 5.4" ${S}/>` },
    'chevron-down': { body: `<path d="M7.2 10l4.8 4.8L16.8 10" ${SD}/>` },
    'chevron-up': { body: `<path d="M7.2 14l4.8-4.8L16.8 14" ${SD}/>` },
    menu: { body: `<path d="M4.6 7h14.8M4.6 12h14.8M4.6 17h14.8" ${SD}/>` },
  } as Record<string, GmIcon>,
  width: 24,
  height: 24,
} as const;

/**
 * 运行时拼图标名。
 * 源码里千万别直接写「前缀:名称」形式的完整字面量——purge-icons 离线收集会把它当真实图标名，
 * 本地 @iconify/json 里没有这一族 → 整批收集失败 → 构建期图标全丢。走这个函数拼安全。
 *
 *   :icon="gm('plus')"
 */
export const gm = (name: string) => GM_COLLECTION.prefix + ':' + name;

/** 全部 gm 图标名（预览页 / 覆盖率自检用） */
export const GM_ICON_NAMES: string[] = Object.keys(GM_COLLECTION.icons);

