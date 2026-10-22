<template>
  <div
    v-if="visible"
    class="bsp"
    :class="[`is-${state}`]"
    role="status"
    :title="title"
    @click="goScreen"
  >
    <span class="bsp__dot" />
    <span class="bsp__label">{{ label }}</span>
    <span v-if="state === 'online' && uptimeText" class="bsp__meta">{{ uptimeText }}</span>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { statsApi } from '/@/views/guoba/system/_shared/stats';

  /**
   * BOT 在线状态胶囊（顶栏常驻）
   *
   * 数据源是现成的大屏接口 /admin/stats/runtime（bots[] 以 Bot.uin 为权威在线列表），
   * 10s 轮询一次代价可控；面板与 Bot 同进程，请求失败 ≈ Bot 正在重启 → 显「失联」。
   * 点击跳状态大屏。
   */
  const router = useRouter();

  type State = 'unknown' | 'online' | 'offline';

  const state = ref<State>('unknown');
  const visible = ref(false);
  const accounts = ref<{ uin: string; nickname: string; platform: string | null }[]>([]);
  const uptimeSec = ref(0);
  let timer: ReturnType<typeof setInterval> | null = null;

  const online = computed(() => state.value === 'online');

  const label = computed(() => {
    if (state.value === 'unknown') return '检测中…';
    if (state.value === 'online') return accounts.value.length > 1 ? `在线 · ${accounts.value.length} 账号` : 'BOT 在线';
    return 'BOT 离线';
  });

  const uptimeText = computed(() => {
    const s = Math.max(0, uptimeSec.value);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d > 0) return `${d}天${h}时`;
    if (h > 0) return `${h}时${m}分`;
    return `${m}分`;
  });

  const title = computed(() => {
    if (state.value === 'unknown') return '正在获取 BOT 状态…';
    if (state.value !== 'online') return '没有在线账号；点击查看状态大屏';
    const who = accounts.value.map((b) => `${b.nickname || b.uin}${b.platform ? `（${b.platform}）` : ''}`).join('、');
    return `在线账号：${who || '—'}\n已运行 ${uptimeText.value}\n点击查看状态大屏`;
  });

  async function refresh() {
    try {
      const res = await statsApi.getRuntime();
      const bots = (res?.bots || []).filter((b) => b && b.uin);
      accounts.value = bots;
      uptimeSec.value = Number(res?.botUptime) || 0;
      state.value = bots.some((b) => (b as any).online !== false) && bots.length ? 'online' : 'offline';
      visible.value = true;
    } catch {
      // 同进程接口都打不通：Bot 大概率在重启中
      state.value = 'offline';
      visible.value = true;
    }
  }

  function goScreen() {
    const hit = router.getRoutes().find((r) => /screen/.test(r.path));
    if (hit) router.push(hit.path);
  }

  onMounted(() => {
    refresh();
    timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, 10_000);
  });

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
    timer = null;
  });
</script>

<style lang="less" scoped>
  .bsp {
    display: inline-flex;
    gap: 7px;
    align-items: center;
    height: 28px;
    padding: 0 11px;
    cursor: pointer;
    user-select: none;
    background: var(--g-chip-bg, rgb(148 163 184 / 12%));
    border: 1px solid var(--g-card-border, rgb(148 163 184 / 22%));
    border-radius: 999px;
    transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;

    &:hover {
      border-color: color-mix(in srgb, var(--g-blue, #60a5fa) 45%, transparent);
      box-shadow: 0 4px 14px -8px color-mix(in srgb, var(--g-blue, #60a5fa) 70%, transparent);
    }
  }

  .bsp__dot {
    position: relative;
    flex-shrink: 0;
    width: 7px;
    height: 7px;
    border-radius: 50%;

    /* 呼吸光环：只在在线态出现 */
    &::after {
      position: absolute;
      inset: -3px;
      content: '';
      border-radius: 50%;
      opacity: 0;
    }
  }

  .bsp__label {
    font-size: 12px;
    font-weight: 600;
    color: var(--g-text-sub, inherit);
    line-height: 1;
    white-space: nowrap;
  }

  .bsp__meta {
    font-family: 'JetBrains Mono', 'Cascadia Mono', Consolas, monospace;
    font-size: 10.5px;
    color: var(--g-text-mute, inherit);
    line-height: 1;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .bsp.is-online {
    .bsp__dot {
      background: var(--g-green, #34d399);
      box-shadow: 0 0 6px rgb(52 211 153 / 70%);

      &::after {
        background: rgb(52 211 153 / 40%);
        animation: bsp-ring 2s ease-out infinite;
      }
    }
  }

  .bsp.is-offline {
    .bsp__dot {
      background: var(--g-red, #f87171);
      box-shadow: 0 0 6px rgb(248 113 113 / 60%);
    }

    .bsp__label {
      color: var(--g-red, #f87171);
    }
  }

  .bsp.is-unknown {
    .bsp__dot {
      background: var(--g-text-mute, #94a3b8);
    }
  }

  @keyframes bsp-ring {
    0% {
      transform: scale(0.6);
      opacity: 0.8;
    }

    100% {
      transform: scale(2.1);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .bsp__dot::after {
      animation: none !important;
    }
  }
</style>
