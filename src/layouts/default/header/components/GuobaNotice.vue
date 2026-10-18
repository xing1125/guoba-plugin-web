<template>
  <Popover
    v-model:visible="open"
    trigger="click"
    placement="bottomRight"
    overlay-class-name="gn-pop"
    @openChange="onOpenChange"
  >
    <template #content>
      <div class="gn">
        <div class="gn__head">
          <span class="gn__title">通知中心</span>
          <a class="gn__more" @click="gotoAudit">审计日志 →</a>
        </div>
        <div v-if="!list.length" class="gn__empty">暂无新通知</div>
        <div v-else class="gn__list">
          <div v-for="n in list" :key="n.id" class="gn__item" :class="`gn__item--${n.kind}`">
            <span class="gn__dot" />
            <div class="gn__body">
              <div class="gn__item-title">
                {{ n.title }}
                <span class="gn__time">{{ shortTime(n.time) }}</span>
              </div>
              <div class="gn__desc">{{ n.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <Badge :count="unread" :offset="[-2, 2]" size="small">
      <span class="gn__bell">
        <Icon icon="ant-design:bell-outlined" :size="16" />
      </span>
    </Badge>
  </Popover>
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref } from 'vue';
  import { Badge, Popover } from 'ant-design-vue';
  import { useRouter } from 'vue-router';
  import { Icon } from '/@/components/Icon';
  import { auditApi } from '/@/views/guoba/system/sys-users/api';

  /**
   * 顶部通知中心：聚合最近审计留痕与失败登录。
   * 只读接口，登录即可访问；60s 轮询一次，打开面板时立即刷新。
   */

  defineOptions({ name: 'GuobaNotice' });

  const router = useRouter();
  const open = ref(false);
  const list = ref<any[]>([]);
  const unread = ref(0);
  let timer: any = null;

  async function load() {
    try {
      const res = await auditApi.getFeed(8);
      list.value = res?.list || [];
      unread.value = res?.unread || 0;
    } catch {
      /* 静默失败：无权限或后端未就绪时不打扰 */
    }
  }

  function onOpenChange(v: boolean) {
    if (v) load();
  }

  function gotoAudit() {
    open.value = false;
    router.push('/audit');
  }

  function shortTime(t?: string) {
    if (!t) return '';
    const s = String(t).replace('T', ' ');
    // 同一天只显示时分
    const today = new Date().toISOString().slice(0, 10);
    return s.slice(0, 10) === today ? s.slice(11, 16) : s.slice(5, 16);
  }

  onMounted(() => {
    load();
    timer = setInterval(load, 60 * 1000);
  });

  onBeforeUnmount(() => timer && clearInterval(timer));
</script>

<style lang="less" scoped>
  .gn__bell {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    color: var(--g-text-sub);
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.18s ease;
  }

  .gn__bell:hover {
    color: var(--g-blue);
    background: var(--g-hover);
  }

  .gn {
    width: 320px;
  }

  .gn__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--g-card-border);
  }

  .gn__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--g-text);
  }

  .gn__more {
    font-size: 12px;
    color: var(--g-blue);
    cursor: pointer;
  }

  .gn__empty {
    padding: 18px 0;
    font-size: 12.5px;
    color: var(--g-text-mute);
    text-align: center;
  }

  .gn__list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-top: 6px;
  }

  .gn__item {
    display: flex;
    gap: 8px;
    padding: 7px 6px;
    border-radius: 8px;
  }

  .gn__item:hover {
    background: var(--g-hover);
  }

  .gn__dot {
    flex: none;
    width: 6px;
    height: 6px;
    margin-top: 6px;
    background: var(--g-blue);
    border-radius: 50%;
  }

  .gn__item--risk .gn__dot {
    background: #ef4444;
  }

  .gn__item--login .gn__dot {
    background: var(--g-amber);
  }

  .gn__body {
    min-width: 0;
  }

  .gn__item-title {
    display: flex;
    gap: 8px;
    align-items: baseline;
    font-size: 12.5px;
    color: var(--g-text);
  }

  .gn__time {
    font-size: 11px;
    color: var(--g-text-mute);
  }

  .gn__desc {
    overflow: hidden;
    font-size: 11.5px;
    color: var(--g-text-sub);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
