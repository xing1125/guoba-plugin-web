<template>
  <img v-if="plugin.iconPath" :class="[`${prefixCls}-img`]" :src="plugin.iconPath" alt="" :style="imgStyle" />
  <Icon v-else-if="plugin.icon" :icon="plugin.icon" :color="plugin.iconColor" :size="size" />
  <!-- 兜底：知名插件用内置徽标，其余按插件名哈希出一枚彩色字符徽标 -->
  <span
    v-else
    class="gpi-badge"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      fontSize: `${Math.max(10, Math.round(size * 0.52))}px`,
      background: badge.bg,
      color: badge.fg,
      borderRadius: `${Math.round(size * 0.28)}px`,
    }"
    :title="plugin.name"
  >
    {{ badge.char }}
  </span>
</template>

<script setup lang="ts">
  import type { Plugin } from '/#/guoba';
  import { computed } from 'vue';
  import { useDesign } from '/@/hooks/web/useDesign';
  import { Icon } from '/@/components/Icon';

  const { prefixCls } = useDesign('g-plugin-icon');

  const props = defineProps({
    plugin: {
      type: Object as PropType<Plugin>,
      required: true,
    },
    size: {
      type: Number,
      default: 16,
    },
  });

  const imgStyle = computed(() => {
    return {
      width: `${props.size}px`,
      height: `${props.size}px`,
    };
  });

  /* 已知插件的定制徽标：单字 + 品牌向渐变 */
  const BADGES: Array<{ match: RegExp; char: string; bg: string; fg: string }> = [
    { match: /miao/i, char: '喵', bg: 'linear-gradient(135deg, #F7A8C4, #D9629C)', fg: '#3A0A20' },
    { match: /yenai/i, char: '樱', bg: 'linear-gradient(135deg, #F093BA, #B85C9E)', fg: '#FFFFFF' },
    { match: /lotus|lian/i, char: '荷', bg: 'linear-gradient(135deg, #6CCB8E, #2E8B6B)', fg: '#04210F' },
    { match: /guoba/i, char: '锅', bg: 'linear-gradient(135deg, #F3C46B, #C9862B)', fg: '#3A2500' },
    { match: /group|manage/i, char: '群', bg: 'linear-gradient(135deg, #6FB6F0, #3A72C4)', fg: '#FFFFFF' },
    { match: /waves|cloudtide/i, char: '潮', bg: 'linear-gradient(135deg, #4FC3D9, #2E86C6)', fg: '#04222B' },
    { match: /xiaoyao/i, char: '逍', bg: 'linear-gradient(135deg, #9D8DF0, #6A5BD6)', fg: '#FFFFFF' },
    { match: /earth/i, char: '地', bg: 'linear-gradient(135deg, #C9A876, #8F6B3D)', fg: '#FFFFFF' },
    { match: /zzz/i, char: '绝', bg: 'linear-gradient(135deg, #F3D451, #D8A62B)', fg: '#231C00' },
    { match: /star|sr/i, char: '星', bg: 'linear-gradient(135deg, #717DFF, #4A55D8)', fg: '#FFFFFF' },
    { match: /trss/i, char: 'T', bg: 'linear-gradient(135deg, #F0908D, #C4504E)', fg: '#FFFFFF' },
    { match: /whochat|wechat|weixin/i, char: '微', bg: 'linear-gradient(135deg, #7ED88B, #3D9961)', fg: '#04210F' },
    { match: /chatgpt|gpt|deepseek|ai/i, char: 'AI', bg: 'linear-gradient(135deg, #9D8DF0, #5B4BC4)', fg: '#FFFFFF' },
    { match: /sign|check/i, char: '签', bg: 'linear-gradient(135deg, #F0B37E, #C4702E)', fg: '#FFFFFF' },
    { match: /help/i, char: '帮', bg: 'linear-gradient(135deg, #7FD8D0, #3D948B)', fg: '#04211F' },
    { match: /poke|pet/i, char: '宠', bg: 'linear-gradient(135deg, #F7C59F, #D98A5B)', fg: '#331A05' },
    { match: /restart|quit|system|admin|fetch|gpu|status/i, char: '系', bg: 'linear-gradient(135deg, #9AA5B1, #5F6A76)', fg: '#FFFFFF' },
  ];

  /* 兜底色板：按名字哈希轮换，保证任意插件都有一枚稳定的彩色徽标 */
  const PALETTE = [
    ['#6FB6F0', '#3A72C4'],
    ['#9D8DF0', '#6A5BD6'],
    ['#6CCB8E', '#3D9961'],
    ['#F3C46B', '#C9862B'],
    ['#F093BA', '#C4649B'],
    ['#4FC3D9', '#2E86C6'],
    ['#F0908D', '#C4504E'],
  ];

  function hashName(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) {
      h = (h * 31 + name.charCodeAt(i)) >>> 0;
    }
    return h;
  }

  const badge = computed(() => {
    const name = String(props.plugin?.name || props.plugin?.title || '');
    const hit = BADGES.find((b) => b.match.test(name));
    if (hit) {
      return { char: hit.char, bg: hit.bg, fg: hit.fg };
    }
    const h = hashName(name || 'plugin');
    const [c1, c2] = PALETTE[h % PALETTE.length];
    return {
      char: (name.replace(/[-_\s].*$/, '')[0] || 'P').toUpperCase(),
      bg: `linear-gradient(135deg, ${c1}, ${c2})`,
      fg: '#FFFFFF',
    };
  });
</script>

<style lang="less">
  //noinspection LessUnresolvedVariable
  @prefix-cls: ~'@{namespace}-g-plugin-icon';

  .@{prefix-cls} {
    &-img {
      display: inline-block;
      width: 16px;
      height: 16px;
    }
  }

  .gpi-badge {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.5px;
    user-select: none;
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 22%);
  }
</style>
