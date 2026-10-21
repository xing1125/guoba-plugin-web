<template>
  <section class="yls g-card">
    <!-- 头 -->
    <div class="yls__head">
      <div class="yls__title">
        <span class="yls__dot" :class="{ 'is-live': live }" />
        荧 · 实时对话
        <span class="yls__meta">{{ live ? '实时滚动中' : '等待数据…' }}</span>
      </div>
      <div class="yls__tools">
        <GSelect
          v-if="groups.length"
          :model-value="gid"
          :options="groupOptions"
          size="sm"
          width="210px"
          searchable
          placeholder="按群名称筛选"
          @change="onGroupChange"
        />
        <span class="yls__count">{{ rows.length }} 条</span>
        <Button size="small" :disabled="!rows.length" @click="clear">清空</Button>
        <GSwitch v-model="autoScroll" size="sm" />
        <span class="yls__autoscroll">自动滚底</span>
      </div>
    </div>

    <!-- 流 -->
    <div ref="bodyRef" class="yls__body">
      <div v-if="!rows.length" class="yls__empty">
        <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.6">
          <path d="M8 12h32v22H18l-6 6v-6H8z" stroke-linejoin="round" />
          <circle cx="17" cy="21" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="24" cy="21" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="31" cy="21" r="1.4" fill="currentColor" stroke="none" />
        </svg>
        <p>还没有实时消息</p>
        <p class="yls__empty-sub">群里的发言和荧的回复都会实时出现在这里</p>
      </div>

      <template v-else>
        <div
          v-for="(r, i) in rows"
          :key="r.ts + '-' + i"
          class="yls-row"
          :class="{ 'is-mine': r.fromConsole, 'is-chat': r.source === 'chat' }"
        >
          <div class="yls-row__head">
            <span class="yls-row__gid" :title="r.gid">{{ groupName(r.gid) || shortGid(r.gid) }}</span>
            <span class="yls-row__time">{{ fmtTime(r.ts) }}</span>
          </div>
          <div v-if="r.msg" class="yls-row__user">
            <span class="yls-row__nick">{{ r.nick || '匿名' }}：</span>
            <span class="yls-row__msg">{{ r.msg }}</span>
          </div>
          <div v-if="r.reply || r.fromConsole" class="yls-row__reply">
            <span class="yls-row__me">{{ r.fromConsole ? 'Bot' : '荧' }}</span>
            <span class="yls-row__text">{{ r.reply }}</span>
          </div>
          <div v-if="!isPlainChat(r)" class="yls-row__meta">
            <span v-if="r.model" class="yls-chip">{{ r.model }}</span>
            <span v-if="r.fellBack" class="yls-chip is-warn">降级</span>
            <span v-if="r.strategy" class="yls-chip is-mute">{{ r.strategy }}</span>
            <span v-if="r.fromConsole" class="yls-chip is-mine">后台代发</span>
          </div>
        </div>
      </template>
    </div>

    <!-- 代发 -->
    <div class="yls__send">
      <GInput
        ref="sendRef"
        v-model="text"
        size="md"
        :placeholder="gid ? '以 Bot 身份回复这个群…（回车发送）' : '选择群后以 Bot 身份代发'"
        :disabled="!gid"
        @press-enter="doReply"
      />
      <Button type="primary" :loading="sending" :disabled="!canSend" @click="doReply">发送</Button>
    </div>

    <!-- 已发送列表（撤销说明） -->
    <div v-if="sentList.length" class="yls__sent">
      <div class="yls__sent-head">
        <span>本会话已发送</span>
        <span class="yls__sent-meta">{{ sentList.length }} 条</span>
      </div>
      <div v-for="s in sentList" :key="s.at" class="yls__sent-row">
        <span class="yls__sent-time">{{ fmtTime(s.at) }}</span>
        <span class="yls__sent-text">{{ s.text }}</span>
        <span class="yls__revoke" :title="REVOKE_TIP">
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.4">
            <path d="M3 4h9l-1 8a1.6 1.6 0 0 1-1.6 1.4H5.6A1.6 1.6 0 0 1 4 12z" stroke-linejoin="round" />
            <path d="M6.5 4V3.2A1.2 1.2 0 0 1 7.7 2h.6a1.2 1.2 0 0 1 1.2 1.2V4M2.5 4h11" stroke-linecap="round" />
          </svg>
          撤回
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
  import { Button, message } from 'ant-design-vue';
  import GInput from '../_shared/form/GInput.vue';
  import GSelect from '../_shared/form/GSelect.vue';
  import GSwitch from '../_shared/form/GSwitch.vue';
  import { fmtTimeShort } from '/@/utils/localTime';
  import { yingAiLiveApi, type LiveGroup, type LiveRow } from './live-api';

  defineOptions({ name: 'YingAiLive' });

  const REVOKE_TIP = '协议端未开放主动撤回接口，暂无法撤回已发消息';

  const rows = ref<LiveRow[]>([]);
  const groups = ref<LiveGroup[]>([]);
  const gid = ref('');
  const text = ref('');
  const sending = ref(false);
  const autoScroll = ref(true);
  const live = ref(false);
  const cursor = ref(0);
  const bodyRef = ref<HTMLDivElement>();
  const sendRef = ref<any>();

  const MAX_ROWS = 500;
  const sentList = ref<{ at: number; text: string }[]>([]);

  let timer: any = null;

  const groupOptions = computed(() =>
    groups.value.map((g) => ({
      value: g.gid,
      label: g.name || g.nick || shortGid(g.gid),
    })),
  );

  /** 群名缓存（groups 列表下发），行头优先显示群名 */
  const nameMap = computed(() => {
    const m = new Map<string, string>();
    for (const g of groups.value) {
      if (g.name) m.set(String(g.gid), g.name);
    }
    return m;
  });

  function groupName(id: string) {
    return nameMap.value.get(String(id)) || '';
  }

  /** 纯群消息（群友说话、荧没回）：不渲染回复行与 meta */
  function isPlainChat(r: LiveRow) {
    return r.source === 'chat' && !r.fromConsole;
  }

  const canSend = computed(() => !!gid.value && !!text.value.trim() && !sending.value);

  function shortGid(id: string) {
    return String(id || '').replace('@chatroom', '');
  }

  function fmtTime(ts: number | string) {
    const n = Number(ts);
    if (!Number.isFinite(n) || n <= 0) return '';
    return fmtTimeShort(new Date(n).toISOString()) || '';
  }

  function onGroupChange(v: any) {
    gid.value = String(v ?? '');
    // 切群后重置游标，重新拉该群最近一段
    cursor.value = 0;
    rows.value = [];
    poll(true);
  }

  async function poll(immediate = false) {
    try {
      const res = await yingAiLiveApi.stream({
        after: cursor.value,
        gid: gid.value,
        limit: 200,
      });
      if (res?.rows?.length) {
        // 增量追加 + 去重（按 ts）
        const seen = new Set(rows.value.map((r) => r.ts));
        for (const r of res.rows) {
          if (!seen.has(r.ts)) {
            rows.value.push(r);
            seen.add(r.ts);
          }
        }
        // 只保留最近 MAX_ROWS 条
        if (rows.value.length > MAX_ROWS) rows.value = rows.value.slice(-MAX_ROWS);
        live.value = true;
        scrollBottom();
      }
      if (res?.cursor) cursor.value = res.cursor;
    } catch {
      live.value = false;
    }
  }

  async function loadGroups() {
    try {
      groups.value = await yingAiLiveApi.groups();
    } catch {}
  }

  function scrollBottom() {
    if (!autoScroll.value) return;
    requestAnimationFrame(() => {
      const el = bodyRef.value;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  async function doReply() {
    if (!canSend.value) return;
    sending.value = true;
    const t = text.value.trim();
    try {
      await yingAiLiveApi.reply(gid.value, t);
      message.success('已发送');
      sentList.value = [{ at: Date.now(), text: t }, ...sentList.value].slice(0, 30);
      text.value = '';
      sendRef.value?.focus?.();
      poll(true);
    } catch (e: any) {
      message.error(e?.message || '发送失败');
    } finally {
      sending.value = false;
    }
  }

  function clear() {
    rows.value = [];
  }

  onMounted(() => {
    loadGroups();
    poll(true);
    timer = setInterval(() => poll(), 3000);
  });

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
  });
</script>

<style lang="less" scoped>
  .yls {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 480px;

    &__head {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
    }

    &__title {
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 14px;
      font-weight: 600;
      color: var(--g-text);
    }

    &__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--g-text-mute);

      &.is-live {
        background: var(--g-green);
        box-shadow: 0 0 0 3px rgb(69 185 124 / 20%);
        animation: yls-pulse 1.6s ease-in-out infinite;
      }
    }

    &__meta {
      font-size: 11px;
      font-weight: 400;
      color: var(--g-text-mute);
    }

    &__tools {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    &__count {
      font-family: var(--cs-mono, monospace);
      font-size: 11px;
      color: var(--g-text-mute);
      font-variant-numeric: tabular-nums;
    }

    &__autoscroll {
      font-size: 11px;
      color: var(--g-text-mute);
    }

    &__body {
      flex: 1;
      min-height: 300px;
      max-height: calc(100vh - 420px);
      padding: 4px 6px;
      overflow-y: auto;
      background: var(--g-card-bg-soft);
      border: 1px solid var(--g-card-border);
      border-radius: 12px;
    }

    &__empty {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 260px;
      color: var(--g-text-mute);
      font-size: 13px;

      svg {
        opacity: 0.5;
        margin-bottom: 6px;
      }
    }

    &__empty-sub {
      font-size: 11.5px;
      opacity: 0.7;
    }

    &__send {
      display: flex;
      gap: 8px;
      align-items: center;

      .gc-input {
        flex: 1;
        min-width: 0;
      }
    }

    &__sent {
      border-top: 1px solid var(--g-card-border);
      padding-top: 8px;

      &-head {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        font-size: 11.5px;
        color: var(--g-text-mute);
      }
    }
  }

  .yls-row {
    padding: 8px 10px;
    border-bottom: 1px solid var(--g-card-border);
    font-size: 12.5px;
    line-height: 1.6;

    &:last-child {
      border-bottom: none;
    }

    /* 纯群消息（荧没回）：弱化 + 左侧细条标识 */
    &.is-chat {
      padding: 5px 10px 5px 12px;
      border-left: 2px solid var(--g-card-border-strong);

      .yls-row__user {
        color: var(--g-text-sub);
      }
    }

    &.is-mine {
      background: var(--g-chip-bg);
      border-radius: 8px;
      margin: 4px 0;
    }

    &__head {
      display: flex;
      justify-content: space-between;
      gap: 10px;
    }

    &__gid {
      font-family: var(--cs-mono, monospace);
      font-size: 10.5px;
      color: var(--g-text-mute);
    }

    &__time {
      flex-shrink: 0;
      font-family: var(--cs-mono, monospace);
      font-size: 10.5px;
      color: var(--g-text-mute);
      font-variant-numeric: tabular-nums;
    }

    &__user {
      margin-top: 2px;
      color: var(--g-text-sub);
    }

    &__nick {
      color: var(--g-text-mute);
    }

    &__reply {
      display: flex;
      gap: 6px;
      margin-top: 3px;
    }

    &__me {
      flex-shrink: 0;
      padding: 0 6px;
      border-radius: 4px;
      font-size: 10.5px;
      line-height: 16px;
      color: #fff;
      background: linear-gradient(135deg, var(--g-violet), #6d63d0);
    }

    &__text {
      color: var(--g-text);
      word-break: break-word;
    }

    &__meta {
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
      margin-top: 3px;
    }
  }

  .yls-chip {
    padding: 0 5px;
    border-radius: 4px;
    font-size: 10px;
    line-height: 15px;
    color: var(--g-text-mute);
    background: var(--g-chip-bg);

    &.is-warn {
      color: var(--g-amber);
    }
    &.is-mine {
      color: var(--g-violet);
    }
  }

  .yls__sent-row {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 4px 0;
    font-size: 12px;

    .yls__sent-time {
      flex-shrink: 0;
      font-family: var(--cs-mono, monospace);
      font-size: 10.5px;
      color: var(--g-text-mute);
    }
    .yls__sent-text {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      color: var(--g-text-sub);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .yls__revoke {
    display: inline-flex;
    gap: 3px;
    align-items: center;
    flex-shrink: 0;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 11px;
    color: var(--g-text-mute);
    opacity: 0.5;
    cursor: not-allowed;
  }

  @keyframes yls-pulse {
    0%,
    100% {
      box-shadow: 0 0 0 3px rgb(69 185 124 / 20%);
    }
    50% {
      box-shadow: 0 0 0 5px rgb(69 185 124 / 8%);
    }
  }
</style>
