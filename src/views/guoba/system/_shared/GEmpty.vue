<template>
  <div class="g-empty" :style="{ height }">
    <svg
      class="g-empty__art"
      :width="size"
      :height="size"
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- 荷花：中瓣 + 侧瓣 + 底叶，描边风（abyss/crystal 通用，颜色随主题） -->
      <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <!-- 中瓣 -->
        <path d="M48 18c6 8 9 15 9 23s-3.6 14-9 19c-5.4-5-9-11-9-19s3-15 9-23Z" />
        <!-- 左右瓣 -->
        <path d="M30 30c8 3 13 8 16 14 2.4 4.8 3 9.6 2 14-6-1-11.4-4-15.4-9C29 44 28 37 30 30Z" />
        <path d="M66 30c2 7 1 14-2.6 19-4 5-9.4 8-15.4 9-1-4.4-.4-9.2 2-14 3-6 8-11 16-14Z" />
        <!-- 外瓣 -->
        <path d="M18 46c7-1 13.4.6 18.4 4.4 3.6 2.8 6 6.6 7 11-5.8.4-11.6-1-16.4-4.4C22 54 19 50.4 18 46Z" />
        <path d="M78 46c-1 4.4-4 8-9 11-4.8 3.4-10.6 4.8-16.4 4.4 1-4.4 3.4-8.2 7-11 5-3.8 11.4-5.4 18.4-4.4Z" />
        <!-- 花蕊 -->
        <circle cx="48" cy="49" r="2.4" />
        <!-- 底部水叶 -->
        <path d="M22 72c8-5 17-7.4 26-7.4S66 67 74 72c-8 3.6-17 5.4-26 5.4S30 75.6 22 72Z" opacity="0.6" />
        <path d="M48 78v6" opacity="0.4" />
      </g>
    </svg>
    <div class="g-empty__title">{{ title }}</div>
    <div v-if="desc" class="g-empty__desc" v-html="desc" />
    <div v-if="$slots.default" class="g-empty__action" style="margin-top: 12px">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
  withDefaults(
    defineProps<{
      title?: string;
      desc?: string;
      size?: number;
      height?: string;
    }>(),
    {
      title: '暂无数据',
      desc: '',
      size: 84,
      height: '200px',
    },
  );
</script>
