<template>
  <Teleport to="body">
    <transition name="cmdk-pop">
      <div v-if="visible" class="cmdk" @mousedown.self="handleClose">
        <div class="cmdk__panel" role="dialog" aria-modal="true" aria-label="命令面板">
          <!-- 输入区 -->
          <div class="cmdk__head">
            <Icon :icon="searchIcon" :size="15" class="cmdk__head-icon" />
            <input
              ref="inputRef"
              class="cmdk__input"
              :value="keyword"
              :placeholder="placeholder"
              spellcheck="false"
              autocomplete="off"
              autocapitalize="off"
              @input="handleSearch"
            />
            <button v-if="keyword" class="cmdk__clear" type="button" @click="onClear">
              <Icon :icon="closeIcon" :size="11" />
            </button>
            <kbd class="cmdk__esc">Esc</kbd>
          </div>

          <!-- 分区标题 -->
          <div v-if="list.length" class="cmdk__sect">
            <span>{{ keyword ? `找到 ${list.length} 个页面` : '常用入口' }}</span>
            <span class="cmdk__sect-tip">{{ keyword ? '↑↓ 切换 · ↵ 进入' : '输入关键字筛选全部页面' }}</span>
          </div>

          <!-- 结果 -->
          <ul v-if="list.length" ref="scrollWrap" class="cmdk__list">
            <li
              v-for="(item, index) in list"
              :key="item.path"
              :ref="setRefs(index)"
              :data-index="index"
              class="cmdk__item"
              :class="{ 'is-active': activeIndex === index }"
              @mouseenter="handleMouseenter"
              @click="handleEnter"
            >
              <span class="cmdk__item-icon">
                <Icon :icon="item.icon || listIcon" :size="14" />
              </span>
              <span class="cmdk__item-name">
                <template v-for="(seg, i) in highlight(item.name)" :key="i">
                  <b v-if="seg.hit" class="cmdk__hit">{{ seg.t }}</b>
                  <template v-else>{{ seg.t }}</template>
                </template>
              </span>
              <span v-if="item.group" class="cmdk__item-group">{{ item.group }}</span>
              <span class="cmdk__item-enter">↵</span>
            </li>
          </ul>

          <!-- 空结果 -->
          <div v-else class="cmdk__none">
            <Icon :icon="emptyIcon" :size="24" class="cmdk__none-icon" />
            <p class="cmdk__none-title">没有匹配「{{ keyword }}」的页面</p>
            <p class="cmdk__none-desc">试试名称里的单个字，例如「群」「日志」「插件」</p>
          </div>

          <!-- 底部按键提示 -->
          <div class="cmdk__foot">
            <span class="cmdk__foot-item"><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
            <span class="cmdk__foot-item"><kbd>↵</kbd> 进入</span>
            <span class="cmdk__foot-item"><kbd>Esc</kbd> 关闭</span>
            <span v-if="totalPages" class="cmdk__foot-count">共 {{ totalPages }} 个页面</span>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
  import { computed, ref, watch, nextTick, unref } from 'vue';
  import Icon from '/@/components/Icon';
  import { useRefs } from '/@/hooks/core/useRefs';
  import { useMenuSearch } from './useMenuSearch';
  import { gm } from '/@/design/gmIcons';

  defineOptions({ name: 'AppSearchModal' });

  const props = defineProps({
    visible: { type: Boolean, default: false },
  });

  const emit = defineEmits(['close']);

  const scrollWrap = ref<HTMLElement | null>(null);
  const inputRef = ref<HTMLInputElement | null>(null);

  const searchIcon = gm('search');
  const closeIcon = gm('close');
  const listIcon = gm('list');
  const emptyIcon = gm('question');

  const placeholder = '搜索页面…';

  const [refs, setRefs] = useRefs();

  const isOpen = computed(() => props.visible);
  const { handleSearch, reset, keyword, list, totalPages, activeIndex, handleMouseenter, handleEnter, handleClose } = useMenuSearch(
    refs,
    scrollWrap,
    emit,
    isOpen,
  );

  /** 打开时自动聚焦并把当前项落在第一行；关闭时把状态清干净 */
  watch(
    () => props.visible,
    async (visible: boolean) => {
      if (visible) {
        // reset 同时把 activeIndex 归到 0，否则回车没反应（列表没变化不会触发 watch(list)）
        reset();
        await nextTick();
        unref(inputRef)?.focus();
      } else {
        reset();
      }
    },
    { immediate: true },
  );

  function onClear() {
    reset();
    nextTick(() => unref(inputRef)?.focus());
  }

  /** 把命中关键字切出来高亮（按字符顺序匹配，与搜索规则一致） */
  function highlight(name: string) {
    const kw = unref(keyword).trim();
    if (!kw) return [{ t: name, hit: false }];
    const lower = name.toLowerCase();
    const segs: { t: string; hit: boolean }[] = [];
    let cursor = 0;
    for (const ch of kw.toLowerCase()) {
      const at = lower.indexOf(ch, cursor);
      if (at === -1) return [{ t: name, hit: false }];
      if (at > cursor) segs.push({ t: name.slice(cursor, at), hit: false });
      segs.push({ t: name.slice(at, at + 1), hit: true });
      cursor = at + 1;
    }
    if (cursor < name.length) segs.push({ t: name.slice(cursor), hit: false });
    return segs;
  }
</script>

<style lang="less" scoped>
  .cmdk {
    position: fixed;
    inset: 0;
    z-index: 3000;
    display: flex;
    padding: 11vh 16px 16px;
    background: rgb(8 20 34 / 44%);
    backdrop-filter: blur(3px);
    align-items: flex-start;
    justify-content: center;
  }

  .cmdk__panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 604px;
    max-height: min(72vh, 620px);
    overflow: hidden;
    background: var(--g-card-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 16px;
    box-shadow: 0 32px 80px -24px rgb(9 30 50 / 42%), 0 0 0 1px var(--g-card-border);
  }

  /* 输入行 */
  .cmdk__head {
    display: flex;
    height: 54px;
    padding: 0 12px 0 15px;
    border-bottom: 1px solid var(--g-card-border);
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .cmdk__head-icon {
    color: var(--g-text-mute);
    flex-shrink: 0;
  }

  .cmdk__input {
    height: 100%;
    padding: 0;
    font-size: 14.5px;
    color: var(--g-text);
    background: transparent;
    border: 0;
    outline: none;
    flex: 1;
    min-width: 0;

    &::placeholder {
      color: var(--g-text-mute);
    }
  }

  .cmdk__clear {
    display: flex;
    width: 18px;
    height: 18px;
    padding: 0;
    color: var(--g-text-mute);
    cursor: pointer;
    background: var(--g-chip-bg);
    border: 0;
    border-radius: 50%;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &:hover {
      color: var(--g-text-sub);
    }
  }

  .cmdk__esc {
    padding: 2px 6px;
    font-family: var(--g-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
    font-size: 10.5px;
    color: var(--g-text-mute);
    background: var(--g-chip-bg);
    border-radius: 5px;
    flex-shrink: 0;
  }

  /* 分区标题 */
  .cmdk__sect {
    display: flex;
    padding: 11px 16px 5px;
    font-size: 11px;
    font-weight: 600;
    color: var(--g-text-mute);
    letter-spacing: 0.04em;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    flex-shrink: 0;
  }

  .cmdk__sect-tip {
    font-weight: 400;
    letter-spacing: 0;
    opacity: 0.8;
  }

  /* 列表 */
  .cmdk__list {
    padding: 2px 8px 8px;
    margin: 0;
    overflow: hidden auto;
    list-style: none;
    flex: 1 1 auto;
    min-height: 0;
  }

  .cmdk__item {
    position: relative;
    display: flex;
    height: 44px;
    padding: 0 10px;
    color: var(--g-text-sub);
    cursor: pointer;
    border-radius: 9px;
    align-items: center;
    gap: 10px;

    & + & {
      margin-top: 1px;
    }

    &.is-active {
      color: var(--g-text);
      background: var(--g-hover);

      &::before {
        position: absolute;
        top: 10px;
        bottom: 10px;
        left: 0;
        width: 2px;
        content: '';
        background: var(--g-blue);
        border-radius: 2px;
      }

      .cmdk__item-icon {
        color: var(--g-blue);
        background: var(--g-chip-bg);
      }

      .cmdk__item-enter {
        opacity: 1;
      }
    }
  }

  .cmdk__item-icon {
    display: flex;
    width: 26px;
    height: 26px;
    color: var(--g-text-mute);
    background: transparent;
    border-radius: 7px;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: color 0.12s, background 0.12s;
  }

  .cmdk__item-name {
    overflow: hidden;
    font-size: 13.5px;
    color: var(--g-text);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cmdk__hit {
    font-weight: 600;
    color: var(--g-blue);
  }

  .cmdk__item-group {
    margin-left: auto;
    overflow: hidden;
    font-size: 11.5px;
    color: var(--g-text-mute);
    text-overflow: ellipsis;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .cmdk__item-enter {
    font-size: 12px;
    color: var(--g-text-mute);
    opacity: 0;
    transition: opacity 0.12s;
  }

  /* 空结果 */
  .cmdk__none {
    display: flex;
    padding: 40px 20px 44px;
    text-align: center;
    flex-direction: column;
    align-items: center;
  }

  .cmdk__none-icon {
    margin-bottom: 10px;
    color: var(--g-text-mute);
    opacity: 0.55;
  }

  .cmdk__none-title {
    margin: 0;
    font-size: 13px;
    color: var(--g-text-sub);
  }

  .cmdk__none-desc {
    margin: 5px 0 0;
    font-size: 11.5px;
    color: var(--g-text-mute);
  }

  /* 底部提示 */
  .cmdk__foot {
    display: flex;
    height: 38px;
    padding: 0 16px;
    font-size: 11.5px;
    color: var(--g-text-mute);
    background: var(--g-card-bg-soft);
    border-top: 1px solid var(--g-card-border);
    align-items: center;
    gap: 14px;
    flex-shrink: 0;
  }

  .cmdk__foot-item {
    display: flex;
    align-items: center;
    gap: 4px;

    kbd {
      padding: 1px 4px;
      font-family: var(--g-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
      font-size: 10px;
      color: var(--g-text-sub);
      background: var(--g-card-bg);
      border: 1px solid var(--g-card-border);
      border-radius: 4px;
    }
  }

  .cmdk__foot-count {
    margin-left: auto;
  }

  /* 移动端：铺满整屏，键盘提示没意义 */
  @media (max-width: 640px) {
    .cmdk {
      padding: 0;
    }

    .cmdk__panel {
      max-width: none;
      max-height: none;
      height: 100%;
      border: 0;
      border-radius: 0;
    }

    .cmdk__foot {
      display: none;
    }
  }
</style>

<style lang="less">
  /* 进出场：轻微下压 + 淡入，比 vben 的 zoom-fade 更克制 */
  .cmdk-pop-enter-active {
    transition: opacity 0.16s ease-out;
  }

  .cmdk-pop-leave-active {
    transition: opacity 0.12s ease-in;
  }

  .cmdk-pop-enter-from,
  .cmdk-pop-leave-to {
    opacity: 0;
  }

  .cmdk-pop-enter-active .cmdk__panel {
    transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .cmdk-pop-enter-from .cmdk__panel {
    transform: translateY(-10px) scale(0.985);
  }
</style>
