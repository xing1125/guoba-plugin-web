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

## 目录结构

```
src/
├── design/                    # 设计层：令牌 + 模块样式（.g-card / .db-* / .gm-*）
│   ├── guoba-admin.less       # 全局令牌、布局、浮层主题化
│   └── guoba-modules.less     # 页面级模块样式
├── views/
│   ├── guoba/
│   │   ├── system/            # 后台各数据模块（dashboard/groups/users/account/...）
│   │   ├── config/            # 配置管理（双栏工作台）
│   │   ├── plugins/           # 插件管理 + 插件配置 + 喵喵帮助
│   │   ├── about/  home/  v2/ # 关于、首页、迁移页
│   └── sys/
│       ├── login/             # 登录页（品牌区 + 登录卡）
│       ├── lock/              # 锁屏
│       └── exception/         # 403/404/500
```

## 文档

- **[FORK-NOTES.md](./FORK-NOTES.md)** —— 逐页的实现说明、上游同步策略，以及踩过的坑（`a-table` 未全局注册、antd 浮层不吃令牌、vben `min-height:0` 压掉内容区高度等）
- 设计约束：配色与组件全部走 `--g-*` 令牌，不硬编码；同一套令牌深浅两套主题同时生效

## 上游同步

```bash
git fetch upstream
git merge upstream/master
```

冲突面集中在 `src/design/`、`src/views/guoba/`，以及构建侧的 `build/vite/plugin/`。

## 许可

沿用上游 MIT License。
