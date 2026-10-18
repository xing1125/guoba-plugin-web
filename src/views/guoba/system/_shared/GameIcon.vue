<template>
  <span
    class="game-icon"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: `${Math.round(size * 0.3)}px`,
      fontSize: `${Math.round(size * 0.52)}px`,
      background: meta.bg,
      color: meta.fg,
    }"
    :title="meta.label"
  >
    {{ meta.char }}
  </span>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  defineOptions({ name: 'GameIcon' });

  /** 游戏徽标：主题色渐变 + 单字，深浅色下都清晰，无需外部图标资源 */
  const GAMES: Record<string, { char: string; label: string; bg: string; fg: string }> = {
    gs: { char: '原', label: '原神', bg: 'linear-gradient(135deg, #D9B443, #B5881C)', fg: '#2A1E00' },
    sr: { char: '星', label: '崩坏：星穹铁道', bg: 'linear-gradient(135deg, #717DFF, #4A55D8)', fg: '#FFFFFF' },
    zzz: { char: '绝', label: '绝区零', bg: 'linear-gradient(135deg, #F3D451, #D8A62B)', fg: '#231C00' },
    waves: { char: '潮', label: '鸣潮', bg: 'linear-gradient(135deg, #4FC3D9, #2E86C6)', fg: '#04222B' },
    bh3: { char: '崩', label: '崩坏3', bg: 'linear-gradient(135deg, #52C5F7, #2E86C6)', fg: '#04202E' },
    bh2: { char: '学', label: '崩坏学园2', bg: 'linear-gradient(135deg, #6CCB8E, #3D9961)', fg: '#04210F' },
    wd: { char: '未', label: '未定事件簿', bg: 'linear-gradient(135deg, #F093BA, #D06290)', fg: '#2B0716' },
    ark: { char: '舟', label: '明日方舟', bg: 'linear-gradient(135deg, #8A94A6, #525C6B)', fg: '#FFFFFF' },
    mys: { char: '米', label: '米游社', bg: 'linear-gradient(135deg, #93ABFF, #5B6ED6)', fg: '#FFFFFF' },
    ai: { char: 'AI', label: 'AI 助手', bg: 'linear-gradient(135deg, #9D8DF0, #6A5BD6)', fg: '#FFFFFF' },
    common: { char: '通', label: '通用 / 系统', bg: 'linear-gradient(135deg, #7FA6C9, #4E7A9E)', fg: '#FFFFFF' },
  };

  const props = withDefaults(defineProps<{ game?: string; size?: number }>(), {
    game: 'gs',
    size: 20,
  });

  const meta = computed(
    () =>
      GAMES[props.game] || {
        char: '?',
        label: props.game || '未知游戏',
        bg: 'linear-gradient(135deg, #9AA5B1, #6B7683)',
        fg: '#FFFFFF',
      },
  );
</script>

<style scoped lang="less">
  .game-icon {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    line-height: 1;
    user-select: none;
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 20%);
  }
</style>
