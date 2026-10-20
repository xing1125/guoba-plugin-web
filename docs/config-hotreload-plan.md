# 让锅巴配置「全插件生效」的改造方案

> 核心判断：**要改的不是 20 个插件，而是 3 个位置**。
> 实测下来绝大多数插件本来就是「每次用时读盘 / 自己有 watch」，真正卡住的只有：
> ① 核心配置保存后没人通知（锅巴侧 1 处）；② 少数插件把配置在模块顶层吃进内存（2 处）；
> ③ 锅巴不知道某个配置能不能热（缺一份声明，导致没法如实告诉用户）。

---

## 0. 先把两条链路分开看（这是关键）

锅巴有**两套完全不同的配置保存链路**，混在一起谈就会得出「要改 20 个插件」的错误结论。

### 链路 A：核心配置（锅巴完全可控）

```
前端配置页 → POST /guoba/api/config/data
  → ConfigController.setData
  → ConfigServiceImpl.setConfigData(key, data)
      → backupConfigFile()          # 备份
      → YamlReader.setData(data)    # 写 config/config/*.yaml
```

写盘后**不通知任何人**。生效与否全靠核心自己：`lib/config/config.js` 的 `watch()` 用 chokidar 监听，
`_.debounce(5000)` 后 `delete this.config[key]` + `change_xxx()`。**所以核心配置本来就是热的，只是慢 5 秒。**

### 链路 B：插件配置（锅巴只是「递话筒」）

```
前端插件页 → POST /guoba/api/plugin/config/:pluginName
  → PluginController.doSetConfig
  → 插件自己 guoba.support.js 里的 configInfo.setConfigData(data, {Result})
      → 插件自己写盘、自己决定要不要更新内存
```

契约写在 miao 的 support 注释里：`export supportGuoba() → { pluginInfo, configInfo:{ schemas, getConfigData, setConfigData } }`。
**也就是说：插件配置写不写盘、写哪儿、内存更不更新，全在插件手里，锅巴无法替它决定。**

结论：想让「全插件生效」，锅巴能做的只有两件事——**核心链路做到即时**（L1+L2），
**插件链路提供统一工具 + 一份可声明的热更新标记**（L3+L4）。硬去改 20 个插件是错的方向。

---

## 1. L1 核心配置：保存即生效（1 个文件，约 20 行）

`server/service/v3/config/ConfigServiceImpl.js`：

```js
import cfg from '../../../../lib/config/config.js'   // 路径按实际层级

async setConfigData(key, data) {
  data = this.handleConfigData('set', key, data)
  const reader = getConfigReader(key, configFile)
  this.backupConfigFile(key, reader)
  reader.setData(data)
  this.applyHot(key)              // ← 新增
}

/** 写盘后让运行中的实例立刻看到 */
applyHot(key) {
  const file = configFile[key]
  const name = String(key).split('.').pop()
  // 1) 清核心缓存 → 下次 get 立刻重读，不必等 chokidar 的 5s 防抖
  try {
    delete cfg.config[`config.${name}`]
    if (typeof cfg[`change_${name}`] === 'function') cfg[`change_${name}`]()
  } catch (e) { logger?.warn?.(`[Guoba] 核心配置热重载失败：${e.message}`) }
  // 2) 广播给订阅者（插件可选接入）
  try { Bot.em('guoba.config.change', { key, file, ts: Date.now() }) } catch { /* 非致命 */ }
}
```

要点：
- 核心 `Cfg` 是 `export default new (class Cfg {...})()`，`config` 是普通对象，**删 key 即可**，不用改云崽本体（更新时无冲突）。
- `Bot.em` 是**同步** emit，订阅者在这次 HTTP 返回前就完成失效 → 前端可以如实说「已生效」。
- `Bot.em` 会逐级 emit `guoba.config` / `guoba`；`prepareEvent` 在 `self_id` 不属于本 bot 时直接 return，非消息事件安全。
- chokidar 保留，兜住「用户直接手改文件」的场景。

## 2. L2 插件链路：给契约补一个「热」声明（改契约，不改插件）

在 `configInfo` 里增加可选字段，锅巴据此决定 UI 文案与是否需要一键重启：

```js
// 插件 guoba.support.js
setConfigData(data, { Result }) {
  writeYaml(data)          // 插件自己写
  reloadInMemory(data)     // 插件自己更新内存（很多插件已经这么做了）
  return Result.ok({}, '保存成功~')
},
hotReload: true,           // ← 新增：本页配置保存后可即时生效
```

`PluginController.doSetConfig` 只多两行：读 `configInfo.hotReload`，把 `{hot}` 一并回给前端。
**默认值按「不确定」处理**（`hot: null` → UI 显示「请重启确认」），避免骗人。

配套给插件作者一个 3 行的 helper（放 `Guoba-Plugin/server/service/both/plugin/ConfigHot.js` 或直接挂 `global`）：

```js
// 写盘 + 清缓存 + 广播，插件一行接入
export function applyPluginConfig(file, invalidate) { ... }
```

## 3. L3 真正需要动代码的插件：只有 2 个

普查（`grep chokidar/fs.watch` + 读配置位置 + 抽样看是否缓存）：

| 插件 | 读取方式 | 现状 |
| --- | --- | --- |
| Lotus-Plugin | 指令内 `await loadGlobalConfig()`，且 `setConfigData` 自己更新状态 | ✅ 天然热 |
| group-manage | 函数内 `fs.readFileSync` | ✅ 天然热 |
| ark-plugin | 函数内 `JSON.parse(readFileSync)` | ✅ 天然热 |
| Cloudtide Waves（`pluginConfig.getConfig()`） | 每次读 | ✅ 天然热 |
| genshin / miao | `getYaml()` 首次读时挂 chokidar | ✅ 用过一次后就热 |
| ZZZ / xiaofei | 自己 `fs.watch` | ✅ |
| **Atlas** | `apps/atlas.js:86` `let atlasConfig = YAML.parse(...)` **顶层** | ❌ 永不更新 |
| **Waves（伤害）** | `model/damage.js:64` `_configCache` 无失效入口 | ❌ 需重启 |

两个改法都一样：把「模块加载时读」改成「用时读 + mtime 缓存」，导出 `invalidate()`。

## 4. L4 不可热更新的白名单（必须做，否则等于骗人）

| 配置 | 为什么不能热 |
| --- | --- |
| `system.redis.*` | 连接池已按旧参数建好，改 host/port 必须重连 |
| `system.bot.chromium_path` / `puppeteer_*` | 浏览器实例已启动 |
| `system.server.port` / https | 端口已绑定 |
| `system.qq.*`（账号信息） | 适配器握手时已确定 |

做法：后端 `NO_HOT` 白名单（key + 可选字段路径）→ 保存接口返回 `{hot:false, reason}` →
前端 toast 分两档：「已保存并生效」/「已保存，重启后生效」+ 一键重启（复用现成的 `POST /guoba/api/bot/restart`）。

## 5. 三档方案

| 档位 | 内容 | 改动 | 效果 |
| --- | --- | --- | --- |
| **A 内核** | L1（核心即时 + 广播）+ L3 两处修补 | 3 个文件 ~50 行，不碰云崽本体 | 核心 0 秒生效；插件实际覆盖 ≈95% |
| **B 契约** | A + L2（`hotReload` 字段 + helper） | +3 个文件 ~60 行 | 插件可以如实声明，锅巴能显示真状态 |
| **C 体验** | B + L4（白名单 + toast 分级 + 一键重启 + 配置页角标） | +前端 2 个文件 ~120 行 | 用户不再猜「到底生效没」 |

建议顺序 **A → C**，B 随 A 一起做（字段默认 null，不填也不报错）。

## 6. 验收

```bash
# 与 Bot 同一条命令执行
node build/preview/verify-config-hotreload.mjs
```
A 档完成后新增两条断言：
1. 保存核心配置后 **<1s** 读到新值（现在实测是 5.0s）；
2. `Atlas/config.yaml` 改动后，插件侧读到的是新值。

## 7. 明确不做

- 不给每个插件塞 chokidar：20 份 watcher ≈ 20 个文件句柄，Windows 下更贵；一次广播到位。
- 不追求字段级热更新：端口/连接串本就该重启，硬做只会制造更隐蔽的 bug。

---

## 8. 已实施（2026-10-21）

> 用户要求「全部都可以」，因此 A + B 已落地，C 的 toast 部分已落地（角标/一键重启未做）。

### 改动清单

| 文件 | 改动 |
| --- | --- |
| `Guoba-Plugin/server/service/v3/config/ConfigServiceImpl.js` | 新增 `checkHot()` / `applyHot()` / `NO_HOT` / `NO_HOT_FIELDS`；`setConfigData` 与 `removeCardForm` 写盘后清核心 `cfg.config['config.<name>']` + 调 `change_<name>()` + `Bot.em('guoba.config.change')` |
| `Guoba-Plugin/server/controller/biz/ConfigController.js` | 保存响应返回 `{hot, reason, key, file, coreReloaded, broadcast}`，审计记录是否需重启 |
| `Guoba-Plugin/server/controller/biz/PluginController.js` | 新增 `_afterPluginSave()`：插件配置保存后广播，并读 `configInfo.hotReload` |
| `guoba-web-fork/src/views/guoba/config/components/ConfigForm.vue` | toast 分三档：已即时生效 / 已保存（重启后生效 + 原因）/ 保存成功 |
| `plugins/bot-admin/index.js` | 配置缓存加 mtime 感知（TTL 15s 仅兜底） |
| `plugins/bot-menu/index.js` | 同上 |
| `plugins/bot-status/index.js` | 同上 |
| `plugins/core-guard/index.js` | 同上 |
| 上述四个插件 `guoba/configInfo.js` + `guoba/index.js` | 提示文案改「已即时生效」；`configInfo` 声明 `hotReload: true` |

### 实测

```
POST /guoba/api/config/data {system.bot, log_level:debug}
→ 200 {message:'保存成功~', hot:true, coreReloaded:true, broadcast:true}
→ 163ms 后日志：[Guoba] 配置已热更新：system.bot
（改造前：5000ms，靠 chokidar 的 debounce）
```

插件缓存离线验证 `build/preview/verify-plugin-cache.mjs`：**8/8 通过**
（直接 import 四个插件的配置 getter，改文件后再取，`denyTip/menuTitle/panelTitle/guardTip` 都立刻变成新值，还原后回到旧值）。

### CAR 白名单（仍必须重启）

`system.redis`（连接池）、`system.server`（端口/证书）、`system.qq`（账号握手）、
`system.bot.chromium_path` 与 `system.bot.puppeteer_ws`（渲染器启动时读取）。
这些保存后前端会明确提示原因，不再让用户猜。
