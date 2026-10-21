<template>
  <PageWrapper title="">
    <div class="g-page cs-page">
      <!-- 页头 -->
      <section class="db-hero cs-hero">
        <div class="cs-hero__main">
          <div class="cs-hero__eyebrow">CONSOLE</div>
          <div class="cs-hero__title">控制台</div>
          <div class="cs-hero__desc">以 Bot 身份直发消息 / 模拟指令执行 · 同进程直达，不走协议端，不重启内核</div>
        </div>
        <div class="cs-hero__aside">
          <div class="cs-hero__bot">
            <span class="cs-hero__bot-label">当前 Bot</span>
            <span class="cs-hero__bot-id">{{ status.selfId || '未识别' }}</span>
          </div>
          <Button size="small" :loading="loading" @click="reloadAll">刷新</Button>
        </div>
      </section>

      <!-- 指标带 -->
      <section class="cs-metrics">
        <article class="cs-metric">
          <span class="cs-metric__icon" :class="status.online ? 'is-on' : 'is-off'">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M3.5 12h4l2.5 6 4-12L16.5 12h4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <div class="cs-metric__body">
            <span class="cs-metric__label">运行状态</span>
            <span class="cs-metric__value" :class="status.online ? 'is-on' : 'is-off'">
              {{ status.online ? '在线' : '离线' }}
            </span>
            <span class="cs-metric__sub">{{ status.uins.length }} 个实例在线</span>
          </div>
        </article>

        <article class="cs-metric">
          <span class="cs-metric__icon">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="9" cy="8.5" r="3.2" />
              <path d="M3.6 19.4c0-3 2.4-5.2 5.4-5.2s5.4 2.2 5.4 5.2" stroke-linecap="round" />
              <circle cx="16.8" cy="9.4" r="2.4" />
              <path d="M15.4 14.6c2.6.2 4.6 2.2 4.6 4.8" stroke-linecap="round" />
            </svg>
          </span>
          <div class="cs-metric__body">
            <span class="cs-metric__label">群聊</span>
            <span class="cs-metric__value">{{ status.groupCount }}</span>
            <span class="cs-metric__sub">可发送会话</span>
          </div>
        </article>

        <article class="cs-metric">
          <span class="cs-metric__icon">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="8" r="3.6" />
              <path d="M5 20c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2" stroke-linecap="round" />
            </svg>
          </span>
          <div class="cs-metric__body">
            <span class="cs-metric__label">好友</span>
            <span class="cs-metric__value">{{ status.friendCount }}</span>
            <span class="cs-metric__sub">私聊可达</span>
          </div>
        </article>

        <article class="cs-metric">
          <span class="cs-metric__icon">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="8.4" />
              <path d="M12 7.4V12l3 1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <div class="cs-metric__body">
            <span class="cs-metric__label">今日操作</span>
            <span class="cs-metric__value">{{ todayOps }}</span>
            <span class="cs-metric__sub">最近 30 条内</span>
          </div>
        </article>
      </section>

      <!-- 三栏工作台 -->
      <div class="cs-body">
        <!-- 会话列表 -->
        <section class="cs-panel cs-targets">
          <header class="cs-targets__head">
            <GSegmented v-model="kind" :options="kindOpts" size="sm" label="会话类型" @change="onKindChange" />
            <span class="cs-targets__count">共 {{ targets.length }} 个</span>
          </header>

          <div class="cs-targets__search">
            <GInput v-model="keyword" size="sm" placeholder="搜索群号 / 名称" @press-enter="loadTargets">
              <template #prefix>
                <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="7" cy="7" r="4.6" />
                  <path d="M10.4 10.4 14 14" stroke-linecap="round" />
                </svg>
              </template>
            </GInput>
          </div>

          <div class="cs-targets__list">
            <template v-if="loadingTargets">
              <div v-for="i in 5" :key="i" class="cs-target cs-target--skeleton">
                <span class="cs-sk-avatar" />
                <span class="cs-sk-lines">
                  <i class="cs-sk-line cs-sk-line--w70" />
                  <i class="cs-sk-line cs-sk-line--w40" />
                </span>
              </div>
            </template>

            <template v-else>
              <button
                v-for="t in targets"
                :key="t.id"
                type="button"
                class="cs-target"
                :class="{ 'is-active': current?.id === t.id }"
                @click="select(t)"
              >
                <span class="cs-target__avatar" :style="avatarStyle(t.id)">{{ initial(t.name) }}</span>
                <span class="cs-target__main">
                  <span class="cs-target__name">{{ displayName(t) }}</span>
                  <span class="cs-target__id">{{ shortId(t.id) }}</span>
                </span>
                <span class="cs-target__go" aria-hidden="true">
                  <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M6 3.5 10.5 8 6 12.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </button>

              <div v-if="!targets.length" class="cs-empty cs-empty--list">
                <div class="cs-empty__icon">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="10" cy="10" r="5.5" />
                    <path d="M14.4 14.4 19 19" stroke-linecap="round" />
                  </svg>
                </div>
                <p class="cs-empty__text">{{ keyword ? '没有匹配的会话' : `暂无${kind === 'group' ? '群聊' : '好友'}` }}</p>
              </div>
            </template>
          </div>
        </section>

        <!-- 工作区 -->
        <section class="cs-panel cs-workspace">
          <header v-if="current" class="cs-ws__target">
            <span class="cs-ws__avatar" :style="avatarStyle(current.id)">{{ initial(current.name) }}</span>
            <div class="cs-ws__meta">
              <div class="cs-ws__name">
                {{ displayName(current) }}
                <span class="g-chip">{{ kind === 'group' ? '群聊' : '好友' }}</span>
              </div>
              <div class="cs-ws__id">
                <span class="cs-ws__id-text">{{ current.id }}</span>
                <button type="button" class="cs-copy" @click="copyId">
                  <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.4">
                    <rect x="5.2" y="5.2" width="8" height="8" rx="1.8" />
                    <path d="M10.8 5.2V4a1.6 1.6 0 0 0-1.6-1.6H4A1.6 1.6 0 0 0 2.4 4v5.2A1.6 1.6 0 0 0 4 10.8h1.2" stroke-linecap="round" />
                  </svg>
                  复制
                </button>
              </div>
            </div>
            <GSegmented v-model="tab" :options="tabOpts" size="sm" label="控制台模式" class="cs-ws__tabs" @change="onTabChange" />
          </header>

          <div v-else class="cs-ws__blank">
            <div class="cs-blank">
              <div class="cs-blank__art">
                <svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.6">
                  <rect x="6" y="9" width="36" height="26" rx="4" />
                  <path d="M6 16h36" stroke-opacity=".5" />
                  <circle cx="10.5" cy="12.5" r="1.2" fill="currentColor" stroke="none" />
                  <circle cx="14.5" cy="12.5" r="1.2" fill="currentColor" stroke="none" stroke-opacity=".5" />
                  <path d="M13 23l4.5 4L13 31" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M21 31h7" stroke-linecap="round" />
                </svg>
              </div>
              <p class="cs-blank__title">从左侧选择一个会话</p>
              <p class="cs-blank__desc">选中群聊或好友后，可在此以 Bot 身份发消息、执行指令并查看捕获的回复</p>
            </div>
          </div>

          <!-- 发消息 -->
          <div v-if="current && tab === 'send'" class="cs-pane">
            <div class="cs-editor">
              <textarea
                ref="sendRef"
                v-model="sendText"
                class="cs-editor__area"
                maxlength="4000"
                placeholder="输入要发送的内容…"
                @keydown="onEditorKeydown"
              />
              <div class="cs-editor__foot">
                <span class="cs-editor__hint">
                  <span class="cs-kbd">Ctrl</span><span class="cs-kbd">Enter</span> 发送 · 直接调用协议端，插件不会收到
                </span>
                <span class="cs-editor__count">{{ sendText.length }} / 4000</span>
                <div class="cs-editor__actions">
                  <Button size="small" :disabled="!sendText" @click="sendText = ''">清空</Button>
                  <Button type="primary" :loading="sending" :disabled="!canSend" @click="doSend">发送</Button>
                </div>
              </div>
            </div>
          </div>

          <!-- 执行指令 -->
          <div v-else-if="current && tab === 'exec'" class="cs-pane">
            <div class="cs-cmd">
              <GInput
                ref="cmdRef"
                v-model="cmdText"
                size="lg"
                placeholder="输入指令，例如 #状态 / #帮助 · 回车执行"
                @press-enter="doExec"
              />
              <Button type="primary" :loading="execing" :disabled="!canExec" @click="doExec">执行</Button>
            </div>

            <div class="cs-opts">
              <label class="cs-opt" :class="{ 'is-on': opts.deliver }">
                <div class="cs-opt__top">
                  <span class="cs-opt__title">真实发送</span>
                  <GSwitch v-model="opts.deliver" size="sm" />
                </div>
                <p class="cs-opt__desc">回复真的发到会话，关闭则仅本地预览</p>
              </label>
              <label class="cs-opt" :class="{ 'is-on': opts.asOwner }">
                <div class="cs-opt__top">
                  <span class="cs-opt__title">群主身份</span>
                  <GSwitch v-model="opts.asOwner" size="sm" />
                </div>
                <p class="cs-opt__desc">以群主权限执行，用于测试管理指令</p>
              </label>
              <label class="cs-opt" :class="{ 'is-on': opts.confirm, 'is-danger': opts.confirm }">
                <div class="cs-opt__top">
                  <span class="cs-opt__title">允许危险指令</span>
                  <GSwitch v-model="opts.confirm" size="sm" />
                </div>
                <p class="cs-opt__desc">放开二次确认，慎用</p>
              </label>
            </div>

            <div class="cs-output">
              <div class="cs-output__head">
                <span class="cs-output__title">捕获回复</span>
                <span v-if="execResult" class="cs-output__meta">
                  {{ execResult.replies.length }} 条 · {{ execResult.elapsed }}ms
                  <span class="g-chip" :class="execResult.delivered ? 'is-warn' : ''">
                    {{ execResult.delivered ? '已发送' : '仅预览' }}
                  </span>
                </span>
              </div>
              <div class="cs-output__body">
                <template v-if="execResult?.replies.length">
                  <div v-for="(r, i) in execResult.replies" :key="i" class="cs-log">
                    <span class="cs-log__idx">{{ String(i + 1).padStart(2, '0') }}</span>
                    <span class="cs-log__text">{{ r }}</span>
                  </div>
                </template>
                <p v-else-if="execResult" class="cs-output__empty">
                  没有捕获到回复：可能没有插件命中这条指令，或该插件已被禁用
                </p>
                <p v-else class="cs-output__empty">执行后这里会显示插件的回复内容</p>
              </div>
            </div>
          </div>

          <!-- 最近记录 -->
          <div v-else-if="current" class="cs-pane">
            <div class="cs-history__head">
              <span class="cs-history__title">全部操作记录</span>
              <Button size="small" :loading="loadingHistory" @click="loadHistory">刷新</Button>
            </div>
            <div class="cs-history">
              <div v-for="(h, i) in history" :key="i" class="cs-history__row">
                <span class="g-chip" :class="h.action === 'exec' ? 'is-warn' : 'is-signed'">
                  {{ h.action === 'exec' ? '指令' : '消息' }}
                </span>
                <div class="cs-history__main">
                  <div class="cs-history__line">
                    <span class="cs-history__target">{{ displayName({ id: h.id, name: h.name || '' }, h.kind) }}</span>
                    <span class="cs-history__text">{{ h.cmd || h.text }}</span>
                  </div>
                  <div v-if="h.replies?.length" class="cs-history__reply">↳ {{ h.replies[0] }}</div>
                </div>
                <span class="cs-history__time">{{ fmtTime(h.at) }}</span>
              </div>
              <div v-if="!history.length" class="cs-empty">
                <p class="cs-empty__text">暂无操作记录</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 右栏：动态 + 快捷指令 -->
        <aside class="cs-aside">
          <section class="cs-panel cs-activity">
            <header class="cs-activity__head">
              <span class="cs-activity__title">最近动态</span>
              <button type="button" class="cs-link" @click="gotoHistory">全部</button>
            </header>
            <div class="cs-activity__body">
              <div v-for="(h, i) in recentOps" :key="i" class="cs-act">
                <span class="cs-act__dot" :class="h.action === 'exec' ? 'is-exec' : 'is-send'" />
                <div class="cs-act__main">
                  <div class="cs-act__line">
                    <span class="cs-act__target">{{ displayName({ id: h.id, name: h.name || '' }, h.kind) }}</span>
                    <span class="cs-act__time">{{ fmtTime(h.at) }}</span>
                  </div>
                  <div class="cs-act__text">{{ h.cmd || h.text }}</div>
                </div>
              </div>
              <p v-if="!recentOps.length" class="cs-act__empty">还没有操作记录</p>
            </div>
          </section>

          <section class="cs-panel cs-quick">
            <header class="cs-quick__head">
              <span class="cs-quick__title">常用指令</span>
              <span class="cs-quick__tip">点击填入</span>
            </header>
            <div class="cs-quick__list">
              <button v-for="q in quickCmds" :key="q" type="button" class="cs-quick__item" @click="useCmd(q)">
                <span class="cs-quick__cmd">{{ q }}</span>
                <span class="cs-quick__desc">{{ quickDesc[q] || '模拟执行' }}</span>
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
  import { Button, message } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import GSegmented from '../_shared/form/GSegmented.vue';
  import GInput from '../_shared/form/GInput.vue';
  import GSwitch from '../_shared/form/GSwitch.vue';
  import { fmtTimeShort } from '/@/utils/localTime';
  import { consoleApi, type ConsoleHistoryItem, type ConsoleStatus, type ConsoleTarget, type ExecResult } from './api';

  defineOptions({ name: 'Console' });

  const kindOpts = [
    { value: 'group', label: '群聊' },
    { value: 'friend', label: '好友' },
  ];
  const tabOpts = [
    { value: 'send', label: '发消息' },
    { value: 'exec', label: '执行指令' },
    { value: 'history', label: '最近记录' },
  ];
  const quickCmds = ['#状态', '#帮助', '#菜单', '#插件列表'];
  const quickDesc: Record<string, string> = {
    '#状态': '查看运行状态',
    '#帮助': '指令帮助',
    '#菜单': '功能菜单',
    '#插件列表': '已装插件',
  };

  const status = ref<ConsoleStatus>({
    online: false,
    uins: [],
    groupCount: 0,
    friendCount: 0,
    selfId: '',
    master: '',
  });
  const kind = ref<'group' | 'friend'>('group');
  const tab = ref<'send' | 'exec' | 'history'>('send');
  const keyword = ref('');
  const targets = ref<ConsoleTarget[]>([]);
  const current = ref<ConsoleTarget | null>(null);
  const loading = ref(false);
  const loadingTargets = ref(false);
  const loadingHistory = ref(false);

  const sendText = ref('');
  const sending = ref(false);
  const cmdText = ref('');
  const execing = ref(false);
  const execResult = ref<ExecResult | null>(null);
  const history = ref<ConsoleHistoryItem[]>([]);
  const opts = reactive({ deliver: false, asOwner: true, confirm: false });

  const sendRef = ref<HTMLTextAreaElement>();
  const cmdRef = ref<any>();

  const canSend = computed(() => !!current.value && !!sendText.value.trim() && !sending.value);
  const canExec = computed(() => !!current.value && !!cmdText.value.trim() && !execing.value);
  const recentOps = computed(() => history.value.slice(0, 7));
  const todayOps = computed(() => {
    const today = new Date().toDateString();
    return history.value.filter((h) => h.at && new Date(h.at).toDateString() === today).length;
  });

  let searchTimer: any = null;

  /* ---------------- 展示工具 ---------------- */
  /** 后端部分群/好友没有昵称，会返回字符串 'null'，统一按未命名处理 */
  function displayName(t: ConsoleTarget | null, k?: string) {
    const raw = (t?.name || '').trim();
    if (raw && raw !== 'null' && raw !== 'undefined') return raw;
    const kk = k || kind.value;
    const tail = (t?.id || '').replace(/@chatroom$/, '').slice(-4);
    return `${kk === 'group' ? '未命名群' : '未命名好友'} · ${tail}`;
  }

  function shortId(id: string) {
    return (id || '').replace(/@chatroom$/, '');
  }

  function initial(name: string) {
    const s = (name || '').trim();
    if (!s || s === 'null' || s === 'undefined') return '#';
    return s.slice(0, 1).toUpperCase();
  }

  /** 按 id 散列出色相，色相只体现在底色上，深浅主题都安全 */
  function avatarStyle(id: string) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
    return { background: `hsl(${h} 55% 50% / 0.18)` };
  }

  function fmtTime(at: string) {
    return fmtTimeShort(at) || '';
  }

  async function copyId() {
    const id = current.value?.id;
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      message.success('已复制 ID');
    } catch {
      message.warning('复制失败，请手动选择');
    }
  }

  /** 右栏快捷指令：填值并切到执行指令 tab */
  function useCmd(q: string) {
    cmdText.value = q;
    if (tab.value !== 'exec') {
      tab.value = 'exec';
    }
    nextTick(() => cmdRef.value?.focus?.());
  }

  function gotoHistory() {
    tab.value = 'history';
    loadHistory();
  }

  function onEditorKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (canSend.value) doSend();
    }
  }

  /* ---------------- 数据加载 ---------------- */
  async function loadStatus() {
    try {
      status.value = await consoleApi.getStatus();
    } catch (e: any) {
      message.error(e?.message || '读取 Bot 状态失败');
    }
  }

  async function loadTargets() {
    loadingTargets.value = true;
    try {
      targets.value = await consoleApi.getTargets(kind.value, keyword.value);
      if (!targets.value.some((t) => t.id === current.value?.id)) current.value = targets.value[0] || null;
    } catch (e: any) {
      targets.value = [];
      message.error(e?.message || '读取会话列表失败');
    } finally {
      loadingTargets.value = false;
    }
  }

  function onKindChange() {
    current.value = null;
    keyword.value = '';
    loadTargets();
  }

  function onTabChange() {
    if (tab.value === 'history') loadHistory();
  }

  function select(t: ConsoleTarget) {
    if (current.value?.id === t.id) return;
    current.value = t;
    execResult.value = null;
  }

  function onSearch() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadTargets, 260);
  }

  watch(keyword, onSearch);

  async function reloadAll() {
    loading.value = true;
    await loadStatus();
    await loadTargets();
    loading.value = false;
  }

  async function loadHistory() {
    loadingHistory.value = true;
    try {
      history.value = await consoleApi.getHistory(30);
    } catch {
      history.value = [];
    } finally {
      loadingHistory.value = false;
    }
  }

  async function doSend() {
    if (!current.value) return;
    sending.value = true;
    try {
      await consoleApi.send({ kind: kind.value, id: current.value.id, text: sendText.value });
      message.success('已发送');
      sendText.value = '';
      loadHistory();
    } catch (e: any) {
      message.error(e?.message || '发送失败');
    } finally {
      sending.value = false;
    }
  }

  async function doExec() {
    if (!current.value) return;
    execing.value = true;
    try {
      execResult.value = await consoleApi.exec({
        kind: kind.value,
        id: current.value.id,
        cmd: cmdText.value,
        deliver: opts.deliver,
        asOwner: opts.asOwner,
        confirm: opts.confirm,
      });
      loadHistory();
    } catch (e: any) {
      message.error(e?.message || '执行失败');
      execResult.value = null;
    } finally {
      execing.value = false;
    }
  }

  onMounted(async () => {
    await reloadAll();
    await loadHistory();
  });
</script>

<style lang="less" scoped>
  /* ---------------- 局部色板 ---------------- */
  .cs-page {
    --cs-accent: #2f86c4;
    --cs-accent-soft: rgb(47 134 196 / 9%);
    --cs-accent-line: rgb(47 134 196 / 30%);
    --cs-ok: #1f9d55;
    --cs-ok-soft: rgb(31 157 85 / 12%);
    --cs-danger: #d9534f;
    --cs-danger-soft: rgb(217 83 79 / 10%);
    --cs-mono: 'JetBrains Mono', 'Cascadia Code', Consolas, monospace;

    display: flex;
    flex-direction: column;
    gap: 14px;
    min-height: 0;
  }

  html[data-theme='dark'] .cs-page {
    --cs-accent: #62a8ea;
    --cs-accent-soft: rgb(98 168 234 / 14%);
    --cs-accent-line: rgb(98 168 234 / 36%);
    --cs-ok: #4ec97f;
    --cs-ok-soft: rgb(78 201 127 / 14%);
    --cs-danger: #f08a86;
    --cs-danger-soft: rgb(240 138 134 / 14%);
  }

  /* ---------------- 页头 ---------------- */
  .cs-hero {
    flex-shrink: 0;

    &__main {
      position: relative;
      z-index: 1;
      min-width: 0;
    }

    &__eyebrow {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.24em;
      color: var(--cs-accent);
    }

    &__title {
      margin-top: 2px;
      font-size: 22px;
      font-weight: 700;
      color: var(--g-text);
    }

    &__desc {
      margin-top: 4px;
      font-size: 12px;
      color: var(--g-text-mute);
    }

    &__aside {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    &__bot {
      display: flex;
      flex-direction: column;
      gap: 1px;
      padding-right: 14px;
      text-align: right;
      border-right: 1px solid var(--g-card-border);
    }

    &__bot-label {
      font-size: 10.5px;
      letter-spacing: 0.06em;
      color: var(--g-text-mute);
    }

    &__bot-id {
      font-family: var(--cs-mono);
      font-size: 11.5px;
      color: var(--g-text-sub);
    }
  }

  /* ---------------- 指标带 ---------------- */
  .cs-metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    flex-shrink: 0;
  }

  .cs-metric {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 16px 18px;
    background: var(--g-card-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 16px;
    transition: border-color 0.18s ease, transform 0.18s ease;

    &:hover {
      border-color: var(--g-card-border-strong);
      transform: translateY(-1px);
    }

    &__icon {
      display: grid;
      flex-shrink: 0;
      place-items: center;
      width: 34px;
      height: 34px;
      color: var(--cs-accent);
      background: var(--cs-accent-soft);
      border-radius: 11px;

      &.is-on {
        color: var(--cs-ok);
        background: var(--cs-ok-soft);
      }

      &.is-off {
        color: var(--cs-danger);
        background: var(--cs-danger-soft);
      }
    }

    &__body {
      display: flex;
      flex-direction: column;
      gap: 1px;
      min-width: 0;
    }

    &__label {
      font-size: 11px;
      letter-spacing: 0.02em;
      color: var(--g-text-mute);
    }

    &__value {
      font-size: 23px;
      font-weight: 700;
      line-height: 1.25;
      color: var(--g-text);
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;

      &.is-on {
        color: var(--cs-ok);
      }

      &.is-off {
        color: var(--cs-danger);
      }
    }

    &__sub {
      overflow: hidden;
      font-size: 11px;
      color: var(--g-text-mute);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  /* ---------------- 三栏 ---------------- */
  .cs-body {
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr) 296px;
    gap: 12px;
    flex: 1;
    height: calc(100vh - 330px);
    min-height: 520px;
  }

  .cs-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    background: var(--g-card-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 16px;
  }

  /* ---------------- 左栏 ---------------- */
  .cs-targets {
    &__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 12px 12px 0;
    }

    &__count {
      font-size: 11.5px;
      color: var(--g-text-mute);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    &__search {
      padding: 10px 12px;
      border-bottom: 1px solid var(--g-card-border);
    }

    &__list {
      flex: 1;
      padding: 8px;
      overflow-y: auto;
    }
  }

  .cs-target {
    display: flex;
    gap: 10px;
    align-items: center;
    width: 100%;
    padding: 8px 9px;
    margin-bottom: 2px;
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 11px;
    transition: background 0.16s ease, border-color 0.16s ease;

    &:hover {
      background: var(--g-hover);

      .cs-target__go {
        opacity: 1;
        transform: none;
      }
    }

    &:focus-visible {
      outline: 2px solid var(--cs-accent);
      outline-offset: -2px;
    }

    &.is-active {
      background: var(--cs-accent-soft);
      border-color: var(--cs-accent-line);

      .cs-target__name {
        color: var(--cs-accent);
        font-weight: 650;
      }

      .cs-target__go {
        color: var(--cs-accent);
        opacity: 1;
        transform: none;
      }
    }

    &__avatar {
      display: grid;
      flex-shrink: 0;
      place-items: center;
      width: 32px;
      height: 32px;
      font-size: 13px;
      font-weight: 650;
      color: var(--g-text);
      border-radius: 10px;
    }

    &__main {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 1px;
      min-width: 0;
    }

    &__name {
      overflow: hidden;
      font-size: 13px;
      color: var(--g-text);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__id {
      overflow: hidden;
      font-family: var(--cs-mono);
      font-size: 10.5px;
      color: var(--g-text-mute);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__go {
      flex-shrink: 0;
      color: var(--g-text-mute);
      opacity: 0;
      transform: translateX(-3px);
      transition: opacity 0.16s ease, transform 0.16s ease;
    }

    &--skeleton {
      cursor: default;
      pointer-events: none;
    }
  }

  .cs-sk-avatar {
    width: 32px;
    height: 32px;
    background: var(--g-chip-bg);
    border-radius: 10px;
    animation: cs-pulse 1.3s ease-in-out infinite;
  }

  .cs-sk-lines {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 6px;
  }

  .cs-sk-line {
    height: 9px;
    background: var(--g-chip-bg);
    border-radius: 5px;
    animation: cs-pulse 1.3s ease-in-out infinite;

    &--w70 {
      width: 70%;
    }

    &--w40 {
      width: 40%;
    }
  }

  @keyframes cs-pulse {
    0%,
    100% {
      opacity: 0.55;
    }
    50% {
      opacity: 1;
    }
  }

  /* ---------------- 工作区 ---------------- */
  .cs-workspace {
    min-width: 0;
  }

  .cs-ws__target {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--g-card-border);
  }

  .cs-ws__avatar {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 38px;
    height: 38px;
    font-size: 15px;
    font-weight: 700;
    color: var(--g-text);
    border-radius: 11px;
  }

  .cs-ws__meta {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .cs-ws__name {
    display: flex;
    gap: 8px;
    align-items: center;
    overflow: hidden;
    font-size: 14.5px;
    font-weight: 650;
    color: var(--g-text);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cs-ws__id {
    display: flex;
    gap: 8px;
    align-items: center;
    min-width: 0;
  }

  .cs-ws__id-text {
    overflow: hidden;
    font-family: var(--cs-mono);
    font-size: 11px;
    color: var(--g-text-mute);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cs-copy {
    display: inline-flex;
    gap: 3px;
    align-items: center;
    padding: 1px 6px;
    font-size: 11px;
    color: var(--g-text-mute);
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    transition: all 0.16s ease;

    &:hover {
      color: var(--cs-accent);
      background: var(--cs-accent-soft);
      border-color: var(--cs-accent-line);
    }
  }

  .cs-ws__tabs {
    flex-shrink: 0;
  }

  /* 未选择目标 */
  .cs-ws__blank {
    display: grid;
    flex: 1;
    min-height: 0;
    place-items: center;
    padding: 24px;
  }

  .cs-blank {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    max-width: 360px;
    text-align: center;

    &__art {
      display: grid;
      place-items: center;
      width: 80px;
      height: 80px;
      margin-bottom: 4px;
      color: var(--cs-accent);
      background: var(--cs-accent-soft);
      border: 1px dashed var(--cs-accent-line);
      border-radius: 22px;
    }

    &__title {
      font-size: 14px;
      font-weight: 650;
      color: var(--g-text);
    }

    &__desc {
      font-size: 12px;
      line-height: 1.7;
      color: var(--g-text-mute);
    }
  }

  .cs-empty {
    padding: 26px 12px;
    text-align: center;

    &--list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: center;
    }

    &__icon {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      color: var(--g-text-mute);
      background: var(--g-chip-bg);
      border-radius: 14px;
    }

    &__text {
      font-size: 12px;
      color: var(--g-text-mute);
    }
  }

  .cs-pane {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
    padding: 14px 16px 16px;
  }

  /* 编辑器 */
  .cs-editor {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    background: var(--g-field-bg);
    border: 1px solid var(--g-field-border);
    border-radius: 12px;
    transition: border-color 0.16s ease, box-shadow 0.16s ease;

    &:focus-within {
      border-color: var(--cs-accent);
      box-shadow: 0 0 0 3px var(--cs-accent-soft);
    }

    &__area {
      flex: 1;
      min-height: 160px;
      padding: 12px 14px;
      font-family: inherit;
      font-size: 13px;
      line-height: 1.7;
      color: var(--g-text);
      resize: none;
      background: transparent;
      border: none;
      outline: none;

      &::placeholder {
        color: var(--g-text-mute);
      }
    }

    &__foot {
      display: flex;
      gap: 10px;
      align-items: center;
      padding: 9px 12px;
      background: var(--g-card-bg-soft);
      border-top: 1px solid var(--g-card-border);
    }

    &__hint {
      display: flex;
      flex: 1;
      gap: 4px;
      align-items: center;
      min-width: 0;
      overflow: hidden;
      font-size: 11.5px;
      color: var(--g-text-mute);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__count {
      flex-shrink: 0;
      font-family: var(--cs-mono);
      font-size: 11px;
      color: var(--g-text-mute);
      font-variant-numeric: tabular-nums;
    }

    &__actions {
      display: flex;
      flex-shrink: 0;
      gap: 8px;
    }
  }

  .cs-kbd {
    display: inline-block;
    padding: 0 5px;
    font-family: var(--cs-mono);
    font-size: 10px;
    line-height: 16px;
    color: var(--g-text-sub);
    background: var(--g-card-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 4px;
  }

  /* 指令 */
  .cs-cmd {
    display: flex;
    gap: 8px;
    align-items: center;

    .gc-input {
      flex: 1;
      min-width: 0;
    }
  }

  .cs-opts {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .cs-opt {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 10px 12px;
    cursor: pointer;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 11px;
    transition: border-color 0.16s ease, background 0.16s ease;

    &:hover {
      border-color: var(--g-card-border-strong);
    }

    &.is-on {
      background: var(--cs-accent-soft);
      border-color: var(--cs-accent-line);
    }

    &.is-danger.is-on {
      background: var(--cs-danger-soft);
      border-color: var(--cs-danger);
    }

    &__top {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
    }

    &__title {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--g-text);
      white-space: nowrap;
    }

    &__desc {
      font-size: 11px;
      line-height: 1.5;
      color: var(--g-text-mute);
    }
  }

  .cs-output {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 12px;

    &__head {
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      padding: 9px 12px;
      border-bottom: 1px solid var(--g-card-border);
    }

    &__title {
      font-size: 12px;
      font-weight: 600;
      color: var(--g-text-sub);
    }

    &__meta {
      display: flex;
      gap: 8px;
      align-items: center;
      font-family: var(--cs-mono);
      font-size: 11px;
      color: var(--g-text-mute);
    }

    &__body {
      flex: 1;
      padding: 10px 12px;
      overflow-y: auto;
    }

    &__empty {
      padding: 22px 8px;
      font-size: 12px;
      color: var(--g-text-mute);
      text-align: center;
    }
  }

  .cs-log {
    display: flex;
    gap: 10px;
    padding: 5px 0;
    font-size: 12.5px;
    line-height: 1.65;
    border-bottom: 1px dashed var(--g-card-border);

    &:last-child {
      border-bottom: none;
    }

    &__idx {
      flex-shrink: 0;
      font-family: var(--cs-mono);
      font-size: 10.5px;
      color: var(--cs-accent);
      opacity: 0.8;
    }

    &__text {
      color: var(--g-text);
      word-break: break-word;
      white-space: pre-wrap;
    }
  }

  /* 全部记录 */
  .cs-history__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .cs-history__title {
    font-size: 12px;
    font-weight: 600;
    color: var(--g-text-sub);
  }

  .cs-history {
    flex: 1;
    min-height: 0;
    padding-right: 4px;
    overflow-y: auto;

    &__row {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      padding: 10px 2px;
      border-bottom: 1px solid var(--g-card-border);

      &:last-child {
        border-bottom: none;
      }
    }

    &__main {
      flex: 1;
      min-width: 0;
    }

    &__line {
      display: flex;
      gap: 8px;
      align-items: baseline;
      min-width: 0;
    }

    &__target {
      flex-shrink: 0;
      max-width: 170px;
      overflow: hidden;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--g-text);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__text {
      overflow: hidden;
      font-size: 12.5px;
      color: var(--g-text-sub);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__reply {
      margin-top: 3px;
      overflow: hidden;
      font-size: 11.5px;
      color: var(--g-text-mute);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__time {
      flex-shrink: 0;
      padding-top: 1px;
      font-family: var(--cs-mono);
      font-size: 10.5px;
      color: var(--g-text-mute);
      font-variant-numeric: tabular-nums;
    }
  }

  /* ---------------- 右栏 ---------------- */
  .cs-aside {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
  }

  .cs-activity {
    flex: 1;
    min-height: 0;

    &__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px 10px;
      border-bottom: 1px solid var(--g-card-border);
    }

    &__title {
      font-size: 12px;
      font-weight: 650;
      letter-spacing: 0.02em;
      color: var(--g-text-sub);
    }

    &__body {
      flex: 1;
      min-height: 0;
      padding: 8px 12px;
      overflow-y: auto;
    }
  }

  .cs-link {
    padding: 0;
    font-size: 11.5px;
    color: var(--cs-accent);
    cursor: pointer;
    background: transparent;
    border: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .cs-act {
    display: flex;
    gap: 9px;
    padding: 7px 0;

    &__dot {
      flex-shrink: 0;
      width: 6px;
      height: 6px;
      margin-top: 5px;
      border-radius: 50%;

      &.is-exec {
        background: var(--cs-accent);
      }

      &.is-send {
        background: var(--cs-ok);
      }
    }

    &__main {
      flex: 1;
      min-width: 0;
    }

    &__line {
      display: flex;
      gap: 8px;
      align-items: baseline;
      justify-content: space-between;
    }

    &__target {
      overflow: hidden;
      font-size: 12px;
      font-weight: 600;
      color: var(--g-text);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__time {
      flex-shrink: 0;
      font-family: var(--cs-mono);
      font-size: 10px;
      color: var(--g-text-mute);
    }

    &__text {
      overflow: hidden;
      font-size: 11.5px;
      color: var(--g-text-mute);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__empty {
      padding: 20px 6px;
      font-size: 11.5px;
      color: var(--g-text-mute);
      text-align: center;
    }
  }

  .cs-quick {
    flex-shrink: 0;

    &__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px 8px;
    }

    &__title {
      font-size: 12px;
      font-weight: 650;
      color: var(--g-text-sub);
    }

    &__tip {
      font-size: 10.5px;
      color: var(--g-text-mute);
    }

    &__list {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 0 8px 10px;
    }

    &__item {
      display: flex;
      gap: 8px;
      align-items: baseline;
      padding: 7px 8px;
      text-align: left;
      cursor: pointer;
      background: transparent;
      border: none;
      border-radius: 8px;
      transition: background 0.16s ease;

      &:hover {
        background: var(--cs-accent-soft);

        .cs-quick__cmd {
          color: var(--cs-accent);
        }
      }
    }

    &__cmd {
      flex-shrink: 0;
      font-family: var(--cs-mono);
      font-size: 11.5px;
      color: var(--g-text);
      transition: color 0.16s ease;
    }

    &__desc {
      overflow: hidden;
      font-size: 11px;
      color: var(--g-text-mute);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  /* ---------------- 响应式 ---------------- */
  @media (max-width: 1440px) {
    .cs-body {
      grid-template-columns: 290px minmax(0, 1fr);
    }

    .cs-aside {
      display: none;
    }
  }

  @media (max-width: 1120px) {
    .cs-body {
      display: flex;
      flex-direction: column;
      height: auto;
      min-height: 0;
    }

    .cs-targets {
      max-height: 240px;
    }

    .cs-opts {
      grid-template-columns: minmax(0, 1fr);
    }

    .cs-editor__hint {
      display: none;
    }

    .cs-aside {
      display: flex;
    }
  }

  @media (max-width: 760px) {
    .cs-metrics {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    /* 手机：账户号让位给操作按钮，指标卡压扁一档 */
    .cs-hero__bot {
      display: none;
    }

    .cs-hero__aside {
      width: auto;
      gap: 8px;
    }

    .cs-metric {
      gap: 10px;
      align-items: center;
      padding: 12px 13px;
      border-radius: 14px;
    }

    .cs-metric__icon {
      width: 30px;
      height: 30px;
      border-radius: 10px;
    }

    .cs-metric__value {
      font-size: 19px;
    }

    .cs-metric__sub {
      font-size: 10.5px;
    }

    /* 会话列表改成横向滑动的条带：手机上纵向每省 100px 都是可用的 */
    .cs-targets {
      max-height: none;
    }

    .cs-targets__head,
    .cs-targets__search {
      padding: 10px 10px 0;
    }

    .cs-targets__search {
      padding-bottom: 8px;
    }

    .cs-targets__list {
      display: flex;
      gap: 8px;
      padding: 8px 10px 10px;
      overflow-x: auto;
      overflow-y: hidden;
      scroll-snap-type: x proximity;
    }

    .cs-target {
      flex: 0 0 auto;
      width: 154px;
      margin-bottom: 0;
      scroll-snap-align: start;
    }

    .cs-target__name {
      font-size: 12.5px;
    }

    .cs-target__go {
      display: none;
    }

    /* 动态栏在手机上价值低于工作区，收起来（全量记录仍在「最近记录」） */
    .cs-aside {
      display: none;
    }

    .cs-ws__target {
      flex-wrap: wrap;
      gap: 10px;
      padding: 12px;
    }

    .cs-ws__meta {
      flex: 1;
      min-width: 0;
    }

    .cs-ws__tabs {
      width: 100%;

      :deep(.g-seg__item) {
        flex: 1;
        text-align: center;
      }
    }

    .cs-pane {
      padding: 12px;
    }

    .cs-editor__area {
      min-height: 140px;
    }
  }
</style>
