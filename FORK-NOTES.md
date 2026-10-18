# Fork 说明：云崽管理后台前端

本仓库 fork 自 [guoba-yunzai/guoba-plugin-web](https://github.com/guoba-yunzai/guoba-plugin-web)，
用于实现「云崽管理后台」的数据管理能力。

## 上游同步策略

- 远端 `upstream` 保持官方仓库，`origin` 指向自建仓库
- 本地改动以新增文件为主；修改的上游文件集中在：
  - `src/views/guoba/system/account/index.vue`（原「施工中」占位页）
  - `src/views/guoba/system/uids/index.vue`（原「施工中」占位页）
  - `src/layouts/default/header/index.vue`（挂深浅色开关）
  - `src/logics/initAppConfig.ts`（强制开启深浅色开关）
  - `src/settings/projectSetting.ts`（`showDarkModeToggle: true`）
  - `src/design/index.less`（引入设计层）
  - `build/vite/plugin/index.ts`、`build/vite/plugin/styleImport.ts`、`build/vite/plugin/purgeIconsOffline.ts`（构建侧）
  - `src/layouts/default/header/components/user-dropdown/index.vue`（图标名 `solar:restart-bold` → `mdi:restart`，见下文）
- 升级上游：`git fetch upstream && git merge upstream/master`，冲突面集中在上述文件

## 页面与模块

| 页面 | 路径 | 组件 | 说明 |
|---|---|---|---|
| 数据总览 | `/dashboard` | `system/dashboard/index.vue` | 渐变页头 + 6 张 KPI + 消息趋势 + 缓存环形 + 群 TOP8 + 活跃群 sparkline + 模块入口 |
| 群数据 | `/groups` | `system/groups/index.vue` | 概览卡、全群趋势、群列表（状态点/收发结构条/SVG 面积图/活跃榜胶囊/新鲜度分级）、单群抽屉 |
| 用户数据 | `/users` | `system/users/index.vue` | 用户维度消息量、收发占比、活跃区间、详情抽屉 |
| 插件数据 | `/plugins-data` | `system/plugins/index.vue` | 命名空间占比环形、游戏维度分布条、命名空间卡片网格（含细分与样例键） |
| 账号管理 | `/account` | `system/account/index.vue` | CK 状态、UID 绑定、批量校验、编辑/删除/清理失效、删除记录恢复、审计 |
| 游戏 UID | `/uid` | `system/uids/index.vue` | 6 款游戏分布卡（可点击切换）+ UID 归属表 + 解绑 |
| 游戏签到 | `/sign` | `system/sign/index.vue` | 签到 KPI、每日趋势、游戏完成度、每日汇总表、流水明细、单日明细抽屉 |
| 数据管理 | `/data` | `system/data/index.vue` | 三段式：数据域总览 / Redis 键浏览编辑 / 插件 data 文件编辑（含备份恢复） |

### 控制类页面（后台管理系统规格）

| 页面 | 路径 | 组件 | 说明 |
|---|---|---|---|
| 插件管理 | `/plugins` | `plugins/index.vue` | 4 张可点击 KPI（已安装/未安装/可配置/已失效）+ 工具栏（正则搜索、作者多选、口径分段）+ 结构化行（图标/标题/包名、作者胶囊、状态徽标、行内「配置 / 详情」）+ 批量卸载 + 自定义分页 |
| 插件配置 | `/plugin/@/:name` | `plugins/plugin-detail/index.vue` | 页头（图标/标题/仓库链接/状态胶囊）+ 左侧软分组导航（带字段数）+ 吸顶操作条（保存配置）+ 双列表单 |
| 配置管理 | `/config` | `config/index.vue` | 「左分组导航 + 右工作区」双栏；吸顶条含分组名、字段数、展开/收起全部、重载；配置块为统一面板（标题/描述/项数/折叠/底部操作条） |

配置块组件 `config/components/{CardForm,ArrayForm}.vue` 统一使用设计层的 `.db-card` 面板语言，
折叠由页面 `provide('cfgFoldSignal')` 总控，`ConfigForm.vue` 的表单为宽屏两列网格（`baseColProps` md/lg/xl = 12）。

> 注意：`a-table` / `a-pagination` 没有在 `registerGlobComp.ts` 全局注册，用到时必须
> `import { Table, Pagination } from 'ant-design-vue'`，否则会渲染为空。

菜单由后端 `server/service/both/system/model/menus/systemMenus.js` 下发，
`menus/index.js` 注册。**前端路由无需改动**，前端通过 `import.meta.glob` 按 `component` 字符串解析。

### 共享层

| 文件 | 作用 |
|---|---|
| `src/views/guoba/system/_shared/stats.ts` | 统计接口封装、TS 类型、数字格式化、图表主题基座（深浅自适应）、`kpiPalette()` |
| `src/design/guoba-admin.less` | 设计层：深浅双主题设计令牌 + `.g-card` / `.g-stat` / `.g-bar` / `.g-spark` / `.g-rank` 等复用样式 |
| `src/design/guoba-modules.less` | 模块化组件层：`.gm-*`（面板、瓦片、分段控件）、`.db-*`（页头、KPI、栅格、图表卡）、`.db-cfg` / `.db-card`（配置工作台外壳与配置面板） |
| `src/design/menuIcons.ts` | 菜单图标静态清单，供构建期收集打包 |

## 深浅色主题

- vben 内置 `AppDarkModeToggle`（组件 `src/components/Application/src/AppDarkModeToggle.vue`）
- 本次改动：`showDarkModeToggle: true` + 在 header 动作区挂载 + `initAppConfig` 里强制覆盖（老 localStorage 缓存会覆盖默认值）
- 主题由 `html[data-theme='dark'|'light']` 驱动，设计令牌见 `guoba-admin.less`
- ECharts 通过 `useECharts` 的 dark 主题自动重建，页面侧监听 `isDark` 重新 `setOptions`
- 组件类名前缀是 **`guoba`**（不是 `vben`），选择器为 `.guoba-dark-switch`

## 后端接口

### 账号 / UID（第 1 期）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/overview` | 概览统计 |
| GET | `/api/admin/accounts` | 账号分页（page/size/q/ckStatus/game） |
| GET | `/api/admin/accounts/:ltuid` | 账号详情 |
| POST | `/api/admin/accounts/verify` | CK 校验（ltuids[]、concurrency） |
| GET | `/api/admin/uids` | UID 分页（game/page/size/q） |
| GET | `/api/admin/sync/status` | 同步任务状态 |

### 账号写操作（第 2 期，均需 `confirm: true`）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/admin/accounts/update` | 改 CK / device / device_fp / uids |
| POST | `/api/admin/accounts/delete` | 批量删除（先快照到 `deleted_account`） |
| POST | `/api/admin/accounts/restore` | 从删除记录恢复 |
| POST | `/api/admin/accounts/delete-expired` | 清理失效账号 |
| POST | `/api/admin/uids/delete` | 解绑单个 UID |
| GET | `/api/admin/accounts/deleted` | 删除记录列表 |
| GET | `/api/admin/audit` | 操作审计 |

### 签到（第 2 期）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/sign/overview` | 签到总览（days，按天聚合 + 游戏完成度） |
| GET | `/api/admin/sign/records` | 签到流水（date/q/status/game/page） |
| GET | `/api/admin/sign/day/:date` | 某天明细（账号 × 游戏） |

### 数据管理（第 3 期）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/data/domains` | 数据域总览（一次全量 SCAN，缓存 5 分钟） |
| GET | `/api/admin/data/keys` | 键列表（prefix/q/page/size，最多取样 4000 键） |
| GET | `/api/admin/data/key` | 单键详情（type/ttl/size/value/归属/风险） |
| POST | `/api/admin/data/key/set` | 改值（写前备份到 `redis_backup`） |
| POST | `/api/admin/data/key/delete` | 删键（`Yz:count:*` 还需 `confirmKey`） |
| POST | `/api/admin/data/key/ttl` | 设置过期时间 |
| POST | `/api/admin/data/keys/delete-prefix` | 按前缀批量删除（逐个备份） |
| GET/POST | `/api/admin/data/backups`、`/backups/restore` | 备份记录与回滚 |
| GET | `/api/admin/data/files/plugins` | 有 `data/` 目录的插件清单 |
| GET | `/api/admin/data/files`、`/file` | 目录列举 / 读文件 |
| POST | `/api/admin/data/file/save`、`/file/restore` | 保存 / 恢复上一版 |

后端实现：
- `server/service/both/admin/StatsService.js` — Redis 聚合（SCAN + mGet 分批 + 内存缓存 60s/3min）
- `server/service/both/admin/SignService.js` — 签到流水解析（`Lotus-Plugin/data/audit/checkin.jsonl`）
- `server/service/both/admin/AccountOpsService.js` — 账号删除/恢复/编辑/解绑 + 审计
- `server/service/both/admin/DataService.js` — Redis 命名空间映射与键管理
- `server/service/both/admin/FileService.js` — 插件 data 目录文件读写（路径越界防护 + 写前备份）
- `server/service/both/admin/SyncService.js` — 群快照落 `admin.db`
- 控制器：`StatsController.js` / `SignController.js` / `AdminController.js` / `PluginDataController.js`

### 数据可视化（只读）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/stats/overview` | Redis 键数、命名空间数、群数、今日/累计消息 |
| GET | `/api/admin/stats/plugins` | 命名空间直方图（含细分、类型抽样、样例键） |
| GET | `/api/admin/stats/groups` | 群聚合列表（keyword/sort/order/page/size）+ 全群趋势 |
| GET | `/api/admin/stats/group/:gid` | 单群详情 + 活跃榜 TOP20 |
| GET | `/api/admin/stats/users` | 用户聚合列表（keyword/sort/order/page/size/scope） |
| GET | `/api/admin/stats/user/:uid` | 单用户详情 |
| GET | `/api/admin/stats/trend` | 按天消息趋势（days） |
| GET | `/api/admin/stats/games` | 游戏维度分布（接口缓存 / 玩家档案） |

数据来源（本机实测 51,993 keys）：

| 命名空间 | 键数 | 用途 |
|---|---|---|
| `Yz:count:*` | 38,751 | 消息计数，群维度键 `Yz:count:*:msg:group:<gid>:YYYY:MM:DD` |
| `miao:rank:*` | 4,371 | miao 排行，含 `@chatroom` 群榜 |
| `Yz:cache:*` | 4,201 | 米游社接口缓存（按游戏分区） |
| `miao:profile:*` | 2,278 | 玩家档案 |
| `CHATGPT:*` | 1,193 | AI 会话 |
| `Yz:GMx:dayTotal:*` | 347 | 群管日总计 |
| `Yz:group_id:*` | 198 | 用户→群映射 |
| `Yz:GM:active{D,W,M,N}:*` | 91 | 群管活跃榜（zset） |

> 注意：本机 Redis 版本 **5.0.14**，不支持 `ZRANGE ... REV`，活跃榜读取需用 `ZREVRANGE`。

### 数据安全约束

- Redis 旧值在覆盖/删除前写入 `admin.db` 的 `redis_backup`，可回滚
- 插件文件保存前 copy 为 `<file>.bak.<ts>`，只允许 `.json/.jsonl/.yaml/.yml/.txt/.csv/.log/.md`，单文件 ≤ 1MB，目录深度 ≤ 4
- 文件路径经 `realpathSync` 校验必须落在 `plugins/<plugin>/data` 内
- 高危命名空间（`Yz:count:*` 消息计数）删除时要求二次输入键名前缀
- 全部写操作落 `audit_log`

## 构建修复：图标插件离线化

两处问题叠加，导致图标**从未真正打进产物**，一直靠运行时联网拉取（离线环境必然缺失）：

1. 官方 `vite-plugin-purge-icons` 的 ESM 构建使用 esbuild `__require` 垫片，在 ESM 上下文恒抛异常，
   本地 `@iconify/json` 永远读不到，只能回退 `raw.githubusercontent.com`。
2. 即便改成 CJS 入口，`node_modules/@purge-icons/generated` 存在**真实占位包**，
   Vite 的 `vite:resolve` 会优先解析到它，插件的虚拟模块永远不生效。

修复（`build/vite/plugin/purgeIconsOffline.ts`）：
- 用 `createRequire` 走 `@purge-icons/core` 的 CJS 入口，全部读取本地 `node_modules/@iconify/json`
- 插件加 `enforce: 'pre'`，抢在 `vite:resolve` 之前接管 id
- 收集失败时打印显式告警（否则会静默退化）

另：`solar:restart-bold` 在本地 `@iconify/json`（v2.1.73）中不存在，
只要有**一个**图标找不到，整批收集就会抛错并全部丢失。已替换为 `mdi:restart`。
新增图标若本地库没有，会触发上述告警 —— 优先换成库内已有的集合。

## 本地开发

```bash
npm install --legacy-peer-deps
npm run dev          # 默认 50832，需配合后端 50831
```

开发态代理配置见 `vite.config.ts` 的 `server.proxy`，将 `/guoba-plugin-mock-root/api` 指向
`http://127.0.0.1:50831/api`。

## 预览与验收

> `preview-server.mjs` 与 `build/preview/` **未纳入本仓库**：里面含本机真实账号样例数据
> （ltuid / uid / wxid）与截图产物，仅作本地调试用。需要时按下面方式自建即可。

```bash
npm run build
node preview-server.mjs
# → http://127.0.0.1:50999/guoba-plugin-mock-root/index.html
# 登录页点「获取验证码」（mock 固定 000000）→ 填 000000 → 登录
```

- `preview-server.mjs` 托管 `dist`，注入 `window.__YUNZAI_BOT_CONF__`（真实环境由 `ConfigPreload` 提供）
- `/api/admin/stats/*` 通过桥接脚本**直连真实 Redis**，账号/UID 接口为 mock 数据
- 截图验收：`node build/preview/shot.mjs` → 输出 `build/preview/shots/*.png`（深浅两套）
- 局部放大复盘：`node build/preview/probe-clip.mjs groups 180 600 1060 260 2 light`

## 构建与部署

```bash
npm run build
bash deploy-to-guoba.sh
```

`deploy-to-guoba.sh` 用「改名备份 + 重新拷贝」替代批量删除，产物替换
`Guoba-Plugin/server/static/`，重启锅巴后生效。

> `dist` 的 `VITE_PUBLIC_PATH` 与 `_app.config.js` 的 `VITE_GLOB_API_URL` 必须保持
> `/guoba-plugin-mock-root`，与锅巴 `utils/paths.js` 的 `realMountPrefix` 一致（上游默认值）。

## 设计约束

1. CK 明文永不出现在前端：接口只返回 `ckMask`
2. 写操作一律需要 `confirm: true`，先备份后执行，并落 `audit_log`
3. 配色走设计令牌（`--g-*` CSS 变量），不硬编码，深浅两套主题同时生效
4. 表格/图表在暗色下不覆盖 antd 默认变量，只做必要微调，避免上游升级冲突
5. 数据页不引入新依赖（sparkline 用 inline SVG，图表用现有 echarts）
