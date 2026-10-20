# 锅巴后台改配置 → Bot 是否立即生效（实测）

> 结论先行：**核心配置 5 秒内自动生效，不用重启；插件配置取决于插件自己怎么读盘**。
> 锅巴这边只做「备份 + 写文件」，**不发任何事件**，所以没有统一的热更新开关。

## 一、实测记录

环境：TRSS-Yunzai 3.1.3，Bot 工作目录 `D:/yunzai-yingbot/Yunzai/app`，锅巴 v3，2026-10-21 实测。

### 1. 核心配置（system.bot → `config/config/bot.yaml`）

```
GET  /guoba/api/config/data?key=system.bot      → 200  log_level=info
POST /guoba/api/config/data {log_level:debug}   → 200  "保存成功~"
文件 mtime 变化 ✔  文件内容含 level: debug ✔
5s 后 Bot 日志：
  [04:28:38.919][MARK][  Config  ] [修改配置文件][config][bot]
之后日志开始出现 [DEBU] 行 → 说明运行中的实例确实换了日志级别
```

**逐字对应代码**：`app/lib/config/config.js` 的 `watch()` 用 chokidar 监听文件，`_.debounce(..., 5000)`
里 `delete this.config[key]`，然后调 `change_bot()`（重新初始化日志）。所以：

| 改的东西 | 目标文件 | 生效时间 |
| --- | --- | --- |
| 机器人配置（日志等级/截图为等） | `config/config/bot.yaml` | ≈5 秒 |
| 服务器配置 | `config/config/server.yaml` | ≈5 秒 |
| Redis 配置 | `config/config/redis.yaml` | ≈5 秒（连接参数这类仍需重启才重建连接池） |
| 群配置（各群开关/权限） | `config/config/group.yaml` | ≈5 秒 |
| 其他配置（主人/黑白名单） | `config/config/other.yaml` | ≈5 秒 |

### 2. 插件配置（genshin.gacha → `plugins/genshin/config/config/gacha.set.yaml`）

```
POST /guoba/api/config/data {key:genshin.gacha,count:1001} → 200
文件内容变成 count: 1001 ✔
12s 内 Bot 日志无 [修改配置文件][config][gacha][set]
```

这条「没有日志」不代表没生效，原因见下一节：**插件侧的 chokidar 是懒注册的** —— 该配置被读过一次才会挂监听。
本次是全新实例，还没跑过抽卡指令，所以既没监听、也没缓存，下次读盘拿到的本来就是新值。

## 二、机制：生效与否，全看读方

锅巴保存链路（`server/service/v3/config/ConfigServiceImpl.js`）：

```
setConfigData(key, data)
  → backupConfigFile()         # 备份到 data/guobaConfigBackup/<key>/，保留 10 份
  → reader.setData(data)       # 用 YamlReader 写 YAML
```

全仓 grep 过：**没有 `Bot.em` / `event.emit` / redis `publish`**。所以锅巴不会通知 Bot，谁想热更新谁自己监听。

| 插件 / 模块 | 读配置的时机 | 改完是否立刻生效 |
| --- | --- | --- |
| 核心 Config（bot/server/redis/group/other） | 首次读时挂 chokidar，变更 5s 防抖重载 | ✅ 5 秒 |
| `genshin`（喵喵 gsCfg） | `getYaml()` 首次读取时挂 chokidar，变更即删缓存 + `[修改配置文件][config][app][name]` | ✅（首次用到后） |
| `Lotus-Plugin`（荷花） | 每条指令里 `await loadGlobalConfig()` 重新读盘 | ✅ 下一条指令 |
| `group-manage`（群管拓展） | 函数内 `fs.readFileSync` 现读 | ✅ 下一条指令 |
| `Cloudtide Waves`（鸣潮） | `model/pluginConfig.js#getConfig()` 现读；`model/damage.js` 有 `_configCache` 且无失效入口 | 大部分 ✅，伤害配置 ❌ 需重启 |
| 用 `new YamlReader()` 在模块顶层缓存、又不 watch 的插件 | 只在加载时读一次 | ❌ 必须重启 |

**判断某个插件要不要重启的快捷方法**（在插件目录下）：

```bash
grep -rn "chokidar\|fs.watch" --include=*.js . | grep -v node_modules   # 有 → 热更新
grep -rn "readFileSync" --include=*.js . | grep -i yaml                 # 在函数体内 → 每次现读，热
grep -rn "new YamlReader\|= YAML.parse" --include=*.js .                # 在顶层赋值 → 需重启
```

## 三、三个容易误判的坑

1. **`[修改配置文件]` 是 MARK 级日志**。`log_level: info` 时根本看不到（实测第一次 info 下 15s 静默，改成 debug 才冒出来）。别把这个当成「没生效」的证据。
2. **插件侧 chokidar 懒注册**。没跑过相关指令 → 没缓存也没监听；跑过之后改动才会有重载日志。
3. **保存会先备份**。`data/guobaConfigBackup/<key>/<时间戳>_xxx.yaml`，每个 key 保留最近 10 份，改错了直接复制回去重启即可。

## 四、复跑方法

```bash
# 必须与 Bot 同一条命令（Bot 起来 → 跑脚本 → 杀掉）
cd /d/yunzai-yingbot/Yunzai/app; BOTLOG=/tmp/bot-verify.log; node . > $BOTLOG 2>&1 & BOT=$!
for i in $(seq 1 60); do code=$(curl -s --noproxy '*' -o /dev/null -w "%{http_code}" http://127.0.0.1:2536/guoba/); [ "$code" = "200" ] && break; sleep 2; done
cd /d/yunzai-yingbot/Yunzai/guoba-web-fork && BOT_LOG=$BOTLOG node build/preview/verify-config-hotreload.mjs
kill $BOT
```

脚本会：查页签 → 把 `log_level` 临时改成 debug 并观察日志 → 还原 → 把 `gacha.count` +1 并观察 → 还原。
**改的都是会被还原的临时值**，跑完 `bot.yaml` 与 `gacha.set.yaml` 保持原样（脚本内做了字节级备份回写）。

---

## 五、想彻底统一成「改完即生效」，需要做什么

锅巴上游没做广播，是因为历史包袱（v1 的 `guoba.support.js` 各插件寄存器）。要统一，最低成本方案是：

1. 在 `ConfigServiceImpl.setConfigData()` 末尾加一次 redis publish，例如 `guoba:config:changed = {key, file}`；
2. 核心已在 chokidar，不动；给各插件留一个约定：订阅该频道后 `delete cache`；
3. 对没有读取者的插件（顶层缓存的），退化为「提示需要重启」—— 这类已经能在保存成功提示里标注。

暂未实施，因为第 2 步要动 20 个插件的配置模块，收益只有「少等一次重启」。
