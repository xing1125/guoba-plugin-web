<template>
  <section class="db-hero mh-hero">
    <div class="db-hero__main">
      <div class="db-hero__eyebrow">{{ eyebrow }}</div>
      <div class="db-hero__title">{{ title }}</div>
      <div class="db-hero__desc">{{ desc }}</div>
      <div v-if="chips && chips.length" class="mh-hero__chips">
        <span v-for="(chip, idx) of chips" :key="idx" class="mh-chip" :class="`is-${chip.tone || 'muted'}`">
          {{ chip.text }}
        </span>
      </div>
    </div>
    <div class="db-hero__side">
      <div class="mh-hero__ops">
        <a-button danger :pre-icon="$gm('undo')" @click="emit('rollback')">回滚</a-button>
        <a-button v-if="showTheme" preIcon="icon-park-outline:theme" @click="emit('theme')">皮肤</a-button>
        <a-button preIcon="dashicons:backup" @click="emit('backup')">备份</a-button>
        <a-button type="primary" :pre-icon="$gm('save')" @click="emit('save')">保存</a-button>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
  type HeroChip = { text: string; tone?: 'ok' | 'info' | 'blue' | 'amber' | 'muted' | 'mono' };

  defineProps({
    eyebrow: { type: String, default: 'PLUGIN CONFIG' },
    title: { type: String, required: true },
    desc: { type: String, default: '' },
    chips: { type: Array as PropType<HeroChip[]>, default: () => [] },
    showTheme: { type: Boolean, default: true },
  });

  const emit = defineEmits(['save', 'rollback', 'backup', 'theme']);
</script>

<style lang="less" scoped>
  .mh-hero__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }

  .mh-chip {
    padding: 2px 9px;
    font-size: 11px;
    font-weight: 550;
    line-height: 17px;
    border-radius: 20px;
  }

  .mh-chip.is-ok {
    color: var(--g-green);
    background: rgb(69 185 124 / 14%);
  }

  .mh-chip.is-info {
    color: var(--g-violet);
    background: rgb(157 141 240 / 15%);
  }

  .mh-chip.is-blue {
    color: var(--g-blue);
    background: rgb(98 168 234 / 15%);
  }

  .mh-chip.is-amber {
    color: var(--g-amber);
    background: rgb(211 188 141 / 18%);
  }

  .mh-chip.is-muted {
    color: var(--g-text-sub);
    background: var(--g-chip-bg);
  }

  .mh-chip.is-mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10.5px;
    color: var(--g-text-mute);
    background: var(--g-chip-bg);
  }

  .mh-hero__ops {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    justify-content: flex-end;
  }

  :deep(.ant-btn) {
    font-size: 12.5px;
  }
</style>
