# Guoba 云崽管理后台（前端）

> 云崽 Bot 锅巴插件的后台管理前端，基于 [guoba-yunzai/guoba-plugin-web](https://github.com/guoba-yunzai/guoba-plugin-web) 深度定制。
>
> 目标很直接：把锅巴原来那些零散的配置表单，做成一套**真正能用的后台管理系统** —— 有数据看板、有账号与群聊管理、有统一的组件语言，而不是一堆「施工中」占位页。

![Vue](https://img.shields.io/badge/Vue-3.2-42b883) ![Vite](https://img.shields.io/badge/Vite-5-646cff) ![AntD](https://img.shields.io/badge/Ant%20Design%20Vue-3-1677ff)

## 它做了什么

原版锅巴的管理界面只有「配置」和「插件列表」，账号、群、统计这些要么是占位页，要么得去 Redis 里翻。这个分支补齐了整条链路：

| 模块 | 能干什么 |
|---|---|
| 数据总览 | 消息量、活跃群、缓存占用、游戏分布的趋势看板 |
| 群数据 | 全群趋势、单群收发结构、活跃榜、数据新鲜度 |
| 用户数据 | 用户维度消息量、收发占比、活跃区间 |
| 插件数据 | Redis 命名空间占比、游戏维度分布、键样例 |
| 账号管理 | CK 状态、UID 绑定、批量校验、编辑/删除、失效清理、删除可恢复 |
| 游戏 UID | 六款游戏分布、UID 归属表、解绑 |
| 游戏签到 | 每日汇总、完成度、流水明细、单日下钻 |
| 数据管理 | Redis 键浏览编辑、插件 data 文件编辑，带备份与审计 |
| 配置管理 | 分组导航 + 双栏工作台 + 配置块折叠总控 |
| 插件管理 | KPI 概览、作者/状态筛选、结构化表格、批量操作 |
| 登录 / 锁屏 / 异常页 | 统一的设计语言，403/404/500 不再是 antd 裸 `Result` |

所有页面**深浅双主题**，配色走一套设计令牌（`--g-*`），换主题不需要改组件。

## 快速开始

```bash
# 前端开发
yarn install
yarn dev            # 前端热更新，代理到本地锅巴

# 构建 + 部署到锅巴插件
yarn build
bash deploy-to-guoba.sh
```

`deploy-to-guoba.sh` 会把 `dist` 拷到 `Guoba-Plugin/server/static`，旧版本自动备份成 `static.bak.<时间戳>`，**重启 Bot 后生效**。

> ⚠️ `VITE_PUBLIC_PATH` 必须保持 `/guoba-plugin-mock-root`，与锅巴 `utils/paths.js` 的 `realMountPrefix` 一致，否则静态资源 404。
>
> ⚠️ 锅巴默认 `helloTRSS: true`，会与 Bot 共享端口，后台地址是 `http://<IP>:<Bot端口>/guoba/`，不是 `application.yaml` 里的 50831。

## 目录介绍

### 顶层

```
guoba-web-fork/
├── build/                     # Vite 构建配置（purgeIconsOffline、styleImport 等插件）
├── docs/upstream/             # 上游 vben 的历史变更日志（已归档，不再更新）
├── src/                       # 源码（见下方）
├── CHANGELOG.md               # 本项目的版本记录
├── FORK-NOTES.md              # 逐页实现说明 + 上游同步策略 + 踩坑记录（最详细的文档）
├── deploy-to-guoba.sh         # 构建产物部署脚本（改名备份 + 拷贝）
└── preview-server.mjs         # 本地预览服务（不入库，含真实样例数据）
```

### `src/` 源码

```
src/
├── design/                    # ★ 设计层（本项目最重要的一层）
│   ├── guoba-admin.less       #   全局令牌 --g-*（页面底/卡片/边框/文字/语义六色）
│   │                          #   + 布局外壳 + 暗色浮层接管
│   ├── guoba-modules.less     #   页面级模块样式（.db-* 工作台 / .gm-* 弹窗 / .g-card）
│   ├── menuIcons.ts           #   菜单图标名白名单（离线图标按需收集，新增菜单要同步这里）
│   └── var/ index.less        #   上游 vben 原有的变量与入口（index.less 引入本 fork 的两个 less）
│
├── views/
│   ├── guoba/                 # ★ 锅巴页面（本 fork 的主战场）
│   │   ├── system/            #   后台数据模块
│   │   │   ├── dashboard/     #     数据总览 /dashboard
│   │   │   ├── groups/        #     群数据 /groups
│   │   │   ├── users/         #     用户数据 /users
│   │   │   ├── plugins/       #     插件数据 /plugins-data
│   │   │   ├── account/       #     账号管理 /account（原「施工中」占位页）
│   │   │   ├── uids/          #     游戏 UID /uid（原「施工中」占位页）
│   │   │   ├── sign/          #     游戏签到 /sign
│   │   │   ├── data/          #     数据管理 /data（Redis 键 + 插件文件）
│   │   │   └── _shared/       #     共享组件（弹窗、空态、游戏图标）
│   │   ├── config/            #   配置管理 /config（双栏工作台 + 折叠总控）
│   │   ├── plugins/           #   插件管理 /plugins + 插件配置 /plugin/@/:name
│   │   │   └── extra-config/  #     喵喵帮助 v1 / v2（含共享页头 MiaoHero）
│   │   ├── home/  about/  v2/ #   首页 / 关于页 / 迁移页
│   │   └── login/             #   群聊登录入口 /ml/:code（MasterLogin，配合 loginInGroup 配置）
│   │
│   └── sys/                   # 框架级页面（登录/锁屏/异常）
│       ├── login/             #   登录页（品牌区 + 登录卡 + 三步引导）
│       ├── lock/              #   锁屏（毛玻璃时钟 + 解锁面板）
│       ├── exception/         #   403 / 404 / 500（渐变状态码单卡）
│       ├── iframe/            #   内嵌页容器
│       └── error-log/         #   错误日志（开发者调试页，不在菜单）
│
├── components/Guoba/          # 锅巴业务组件（GPluginModal 插件详情弹窗等）
├── layouts/                   # 框架布局（顶栏深浅开关挂在 header/index.vue）
├── router/                    # 路由（菜单由后端 systemMenus.js 下发，前端靠
│                              #   import.meta.glob 把菜单的 component 字符串解析成组件）
├── store/                     # Pinia 状态（user / lock / app 等）
├── api/                       # 接口封装
└── logics/ initAppConfig.ts   # 应用初始化（强制开启深浅色开关、覆盖旧缓存）
```

### 约定速览

| 约定 | 说明 |
|---|---|
| 类名前缀 | 全局组件用 `g-`，后台工作台 `db-`，弹窗 `gm-`，页面特例用页面缩写（`pf-` 插件管理、`mh-` 喵喵帮助、`glf-` 登录表单） |
| 颜色 | 一律走 `--g-*` 令牌，**禁止硬编码**；深浅两套主题靠同一令牌切换 |
| 全局 less | 不能用 `:deep()`，它只允许出现在页面 scoped 样式里 |
| antd 组件 | `a-table` / `a-pagination` 未全局注册，用到必须显式 `import { Table, Pagination } from 'ant-design-vue'` |
| 新增菜单 | 后端 `systemMenus.js` 下发 + 前端 `menuIcons.ts` 同步图标名，缺图标会导致整批图标收集失败 |

## 文档

- **[FORK-NOTES.md](./FORK-NOTES.md)** —— 逐页的实现说明、上游同步策略，以及踩过的坑（`a-table` 未全局注册、antd 浮层不吃令牌、vben `min-height:0` 压掉内容区高度等）
- **[CHANGELOG.md](./CHANGELOG.md)** —— 本项目的版本记录；上游 vben 的历史变更归档在 [docs/upstream/](./docs/upstream/)
- 设计约束：配色与组件全部走 `--g-*` 令牌，不硬编码；同一套令牌深浅两套主题同时生效

## 上游同步

```bash
git fetch upstream
git merge upstream/master
```

冲突面集中在 `src/design/`、`src/views/guoba/`，以及构建侧的 `build/vite/plugin/`。

## 许可

沿用上游 MIT License。
