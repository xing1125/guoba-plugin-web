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
          <div class="cs-kpis">
            <div class="cs-kpi">
              <span class="cs-kpi__label">状态</span>
              <span class="cs-kpi__val cs-kpi__val--dot" :class="status.online ? 'is-on' : 'is-off'">
                {{ status.online ? '在线' : '离线' }}
              </span>
            </div>
            <div class="cs-kpi">
              <span class="cs-kpi__label">群聊</span>
              <span class="cs-kpi__val">{{ status.groupCount }}</span>
            </div>
            <div class="cs-kpi">
              <span class="cs-kpi__label">好友</span>
              <span class="cs-kpi__val">{{ status.friendCount }}</span>
            </div>
          </div>
          <Button class="cs-refresh" :loading="loading" @click="reloadAll">刷新</Button>
        </div>
      </section>

      <div class="cs-body">
        <!-- 左：会话列表 -->
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
                  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="10" cy="10" r="5.5" />
                    <path d="M14.4 14.4 19 19" stroke-linecap="round" />
                  </svg>
                </div>
                <p class="cs-empty__text">{{ keyword ? '没有匹配的会话' : `暂无${kind === 'group' ? '群聊' : '好友'}` }}</p>
              </div>
            </template>
          </div>
        </section>

        <!-- 右：工作区 -->
        <section class="cs-panel cs-workspace">
          <!-- 目标信息条 -->
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

          <!-- 未选择目标：引导空态 -->
          <div v-else class="cs-ws__blank">
            <div class="cs-blank">
              <div class="cs-blank__art">
                <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.6">
                  <rect x="6" y="9" width="36" height="26" rx="4" />
                  <path d="M6 16h36" stroke-opacity=".5" />
                  <circle cx="10.5" cy="12.5" r="1.2" fill="currentColor" stroke="none" />
                  <circle cx="14.5" cy="12.5" r="1.2" fill="currentColor" stroke="none" stroke-opacity=".5" />
                  <path d="M13 23l4.5 4L13 31" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M21 31h7" stroke-linecap="round" />
                  <path d="M14 40h20" stroke-linecap="round" stroke-opacity=".45" />
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
                placeholder="输入要发送的内容，Ctrl + Enter 直接发送"
                @keydown="onEditorKeydown"
              />
              <div class="cs-editor__foot">
                <span class="cs-editor__hint">
                  <span class="cs-kbd">Ctrl</span> + <span class="cs-kbd">Enter</span> 发送 · 直接调用协议端，插件不会收到这条消息
                </span>
                <span class="cs-editor__count">{{ sendText.length }} / 4000</span>
                <div class="cs-editor__actions">
                  <Button size="small" :disabled="!sendText" @click="sendText = ''">清空</Button>
                  <Button type="primary" :loading="sending" :disabled="!canSend" @click="doSend">
                    发送
                  </Button>
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

            <div class="cs-quick">
              <span class="cs-quick__label">常用指令</span>
              <button v-for="q in quickCmds" :key="q" type="button" class="cs-quick__chip" @click="fillCmd(q)">
                {{ q }}
              </button>
            </div>

            <div class="cs-opts">
              <label class="cs-opt" :class="{ 'is-on': opts.deliver }">
                <div class="cs-opt__top">
                  <span class="cs-opt__title">真实发送</span>
                  <GSwitch v-model="opts.deliver" size="sm" />
                </div>
                <p class="cs-opt__desc">开启后回复会真的发到目标会话，关闭仅本地预览</p>
              </label>
              <label class="cs-opt" :class="{ 'is-on': opts.asOwner }">
                <div class="cs-opt__top">
                  <span class="cs-opt__title">群主身份</span>
                  <GSwitch v-model="opts.asOwner" size="sm" />
                </div>
                <p class="cs-opt__desc">以群主权限执行，适合测试管理类指令</p>
              </label>
              <label class="cs-opt" :class="{ 'is-on': opts.confirm, 'is-danger': opts.confirm }">
                <div class="cs-opt__top">
                  <span class="cs-opt__title">允许危险指令</span>
                  <GSwitch v-model="opts.confirm" size="sm" />
                </div>
                <p class="cs-opt__desc">放开二次确认，可执行删除 / 清空类指令，请谨慎</p>
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
              <span class="cs-history__title">最近 {{ history.length }} 条操作</span>
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

  let searchTimer: any = null;

  /* ---------------- 头像与工具 ---------------- */
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

  /** 按 id 散列出色相，深浅主题共用同色系，色相只体现在底色上 */
  function avatarStyle(id: string) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
    return { background: `hsl(${h} 55% 50% / 0.18)` };
  }

  function fmtTime(at: string) {
    if (!at) return '';
    const d = new Date(at);
    if (Number.isNaN(d.getTime())) return at.slice(5, 16).replace('T', ' ');
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
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

  function fillCmd(q: string) {
    cmdText.value = q;
    nextTick(() => cmdRef.value?.focus?.());
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
    if (tab.value === 'history') loadHistory();
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
    } catch (e: any) {
      execResult.value = null;
      message.error(e?.message || '执行失败');
    } finally {
      execing.value = false;
    }
  }

  onMounted(async () => {
    await reloadAll();
  });
</script>

<style lang="less" scoped>
  /* ---------------- 局部色板 ---------------- */
  .cs-page {
    --cs-accent: #2f86c4;
    --cs-accent-soft: rgb(47 134 196 / 10%);
    --cs-accent-line: rgb(47 134 196 / 34%);
    --cs-danger: #d9534f;
    --cs-danger-soft: rgb(217 83 79 / 10%);
    --cs-mono: 'JetBrains Mono', 'Cascadia Code', Consolas, monospace;

    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
  }

  html[data-theme='dark'] .cs-page {
    --cs-accent: #62a8ea;
    --cs-accent-soft: rgb(98 168 234 / 14%);
    --cs-accent-line: rgb(98 168 234 / 40%);
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
      gap: 12px;
    }
  }

  .cs-kpis {
    display: flex;
    gap: 8px;
  }

  .cs-kpi {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 62px;
    padding: 7px 12px;
    border: 1px solid var(--g-card-border);
    border-radius: 10px;
    background: var(--g-card-bg);

    &__label {
      font-size: 10.5px;
      letter-spacing: 0.06em;
      color: var(--g-text-mute);
    }

    &__val {
      font-size: 15px;
      font-weight: 700;
      color: var(--g-text);
      font-variant-numeric: tabular-nums;

      &--dot::before {
        display: inline-block;
        width: 6px;
        height: 6px;
        margin-right: 5px;
        vertical-align: 1px;
        content: '';
        border-radius: 50%;
        background: currentColor;
      }

      &.is-on {
        color: #1f9d55;
      }

      &.is-off {
        color: var(--cs-danger);
      }
    }
  }

  /* ---------------- 主体两栏 ---------------- */
  .cs-body {
    display: flex;
    gap: 12px;
    flex: 1;
    height: calc(100vh - 262px);
    min-height: 540px;
  }

  .cs-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    border: 1px solid var(--g-card-border);
    border-radius: 14px;
    background: var(--g-card-bg);
    box-shadow: var(--g-card-shadow);
  }

  /* ---------------- 左栏 ---------------- */
  .cs-targets {
    width: 300px;
    flex-shrink: 0;

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
    border: 1px solid transparent;
    border-radius: 10px;
    background: transparent;
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
        opacity: 1;
        color: var(--cs-accent);
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
    border-radius: 10px;
    background: var(--g-chip-bg);
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
    border-radius: 5px;
    background: var(--g-chip-bg);
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

  /* ---------------- 右栏：目标条 ---------------- */
  .cs-workspace {
    flex: 1;
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
    width: 40px;
    height: 40px;
    font-size: 16px;
    font-weight: 700;
    color: var(--g-text);
    border-radius: 12px;
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
    font-size: 15px;
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

  /* ---------------- 空态 ---------------- */
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
    max-width: 380px;
    text-align: center;

    &__art {
      display: grid;
      place-items: center;
      width: 84px;
      height: 84px;
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
      width: 46px;
      height: 46px;
      color: var(--g-text-mute);
      background: var(--g-chip-bg);
      border-radius: 14px;
    }

    &__text {
      font-size: 12px;
      color: var(--g-text-mute);
    }
  }

  /* ---------------- 面板通用 ---------------- */
  .cs-pane {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
    padding: 14px 16px 16px;
  }

  /* ---------------- 发消息编辑器 ---------------- */
  .cs-editor {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    border: 1px solid var(--g-field-border);
    border-radius: 12px;
    background: var(--g-field-bg);
    transition: border-color 0.16s ease, box-shadow 0.16s ease;

    &:focus-within {
      border-color: var(--cs-accent);
      box-shadow: 0 0 0 3px var(--cs-accent-soft);
    }

    &__area {
      flex: 1;
      min-height: 180px;
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
      gap: 12px;
      align-items: center;
      padding: 9px 12px;
      border-top: 1px solid var(--g-card-border);
      background: var(--g-card-bg-soft);
    }

    &__hint {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      font-size: 11.5px;
      color: var(--g-text-mute);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__count {
      font-family: var(--cs-mono);
      font-size: 11px;
      color: var(--g-text-mute);
      font-variant-numeric: tabular-nums;
    }

    &__actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
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

  /* ---------------- 执行指令 ---------------- */
  .cs-cmd {
    display: flex;
    gap: 8px;
    align-items: center;

    .gc-input {
      flex: 1;
      min-width: 0;
    }
  }

  .cs-quick {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;

    &__label {
      margin-right: 2px;
      font-size: 11.5px;
      color: var(--g-text-mute);
    }

    &__chip {
      padding: 3px 10px;
      font-family: var(--cs-mono);
      font-size: 11.5px;
      color: var(--g-text-sub);
      cursor: pointer;
      background: var(--g-chip-bg);
      border: 1px solid transparent;
      border-radius: 999px;
      transition: all 0.16s ease;

      &:hover {
        color: var(--cs-accent);
        background: var(--cs-accent-soft);
        border-color: var(--cs-accent-line);
      }
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
    gap: 4px;
    padding: 10px 12px;
    cursor: pointer;
    border: 1px solid var(--g-card-border);
    border-radius: 10px;
    background: var(--g-card-bg-soft);
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
      line-height: 1.55;
      color: var(--g-text-mute);
    }
  }

  .cs-output {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    border: 1px solid var(--g-card-border);
    border-radius: 12px;
    background: var(--g-card-bg-soft);

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

  /* ---------------- 最近记录 ---------------- */
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
      max-width: 180px;
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

  /* ---------------- 响应式 ---------------- */
  @media (max-width: 1120px) {
    .cs-body {
      flex-direction: column;
      height: auto;
      min-height: 0;
    }

    .cs-targets {
      width: 100%;
      max-height: 260px;
    }

    .cs-opts {
      grid-template-columns: 1fr;
    }

    .cs-editor__hint {
      display: none;
    }
  }

  @media (max-width: 760px) {
    .cs-hero__aside {
      width: 100%;
      justify-content: space-between;
    }

    /* 目标条换两行：上头像+名称+复制，下 tab 独占一行 */
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

    .cs-ws__name {
      font-size: 14px;
    }

    .cs-pane {
      padding: 12px;
    }

    .cs-editor__area {
      min-height: 140px;
    }
  }
</style>
