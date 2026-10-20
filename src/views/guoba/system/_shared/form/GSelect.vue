<template>
  <div
    ref="triggerRef"
    class="gc-select"
    :class="[`gc-${size}`, { 'is-disabled': disabled, 'is-error': status === 'error', 'is-open': open, 'is-multiple': isMulti }]"
    :style="{ width }"
    tabindex="0"
    role="combobox"
    :aria-expanded="open"
    :aria-disabled="disabled"
    @mousedown="onTriggerMousedown"
    @keydown="onKeydown"
  >
    <!-- 已选 / 占位 -->
    <span v-if="isMulti && selectedItems.length" class="gc-select__tags">
      <span v-for="t in visibleTags" :key="String(t.value)" class="gc-tag">
        {{ t.label }}
        <i class="gc-tag__x" @mousedown.prevent.stop @click.stop="removeTag(t.value)">
          <svg viewBox="0 0 10 10" width="7" height="7">
            <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none" />
          </svg>
        </i>
      </span>
      <span v-if="hiddenTagCount > 0" class="gc-tag gc-tag--more">+{{ hiddenTagCount }}</span>
    </span>
    <span v-else-if="selectedLabel !== null" class="gc-select__text">{{ selectedLabel }}</span>
    <span v-else class="gc-select__ph">{{ placeholder }}</span>

    <!-- 清除 -->
    <span v-if="clearable && hasValue && !disabled" class="gc-select__clear" role="button" tabindex="-1" @mousedown.prevent.stop @click.stop="clearAll">
      <svg viewBox="0 0 12 12" width="9" height="9">
        <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none" />
      </svg>
    </span>
    <!-- 箭头 -->
    <span v-else class="gc-select__arrow" :class="{ 'is-open': open }">
      <svg viewBox="0 0 10 6" width="10" height="6">
        <path d="M1 1.2L5 5l4-3.8" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
  </div>

  <!-- 下拉（teleport 到 body，避免被弹窗 overflow 裁掉） -->
  <Teleport to="body">
    <div v-if="open" ref="popRef" class="gc-pop" :style="popStyle" role="listbox" :aria-multiselectable="isMulti" @mousedown.prevent>
      <div v-if="searchable" class="gc-pop__search">
        <input ref="searchRef" v-model="search" class="gc-pop__search-inner" :placeholder="`输入筛选${props.optionFilterProp === 'label' ? '关键词' : ''}`" @keydown.stop="onKeydown" />
      </div>

      <div class="gc-pop__list" :style="{ maxHeight: `${maxListHeight}px` }">
        <div
          v-for="(o, i) in viewOptions"
          :key="String(o.value)"
          class="gc-opt"
          :class="{
            'is-active': i === activeIndex,
            'is-selected': isSelected(o.value),
            'is-disabled': o.disabled,
          }"
          role="option"
          :aria-selected="isSelected(o.value)"
          @mouseenter="activeIndex = i"
          @click="pick(o)"
        >
          <slot name="option" :option="o">{{ o.label }}</slot>
          <svg v-if="isSelected(o.value)" class="gc-opt__check" viewBox="0 0 12 12" width="11" height="11">
            <path d="M2 6.4L4.8 9 10 3.4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>

        <div v-if="loading" class="gc-pop__tip">
          <LoadingOutlined spin />
          <span>加载中…</span>
        </div>
        <div v-else-if="!viewOptions.length" class="gc-pop__tip">
          <slot name="empty">
            <Icon :icon="$gm('inbox')" :size="15" />
            <span>{{ search ? '没有匹配项' : emptyText }}</span>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
  import { LoadingOutlined } from '@ant-design/icons-vue';
  import { Icon } from '/@/components/Icon';

  /**
   * GSelect —— 自研选择器（替代 antd Select，交互对齐 B 端规范）
   *
   *   <GSelect v-model="sort" :options="[{label:'最新', value:'time'}]" width="150px" />
   *   <GSelect v-model="tags" mode="multiple" :options="authors" searchable />
   *
   * 设计点：
   *  - 下拉 teleport 到 body（弹窗里也不会被 overflow 裁掉），fixed 定位跟随触发器
   *  - 空间不足自动上翻；窗口滚动 / 缩放实时跟随
   *  - 键盘：↑↓ 移动、Enter 选中、Esc 关闭、Home/End 跳端点
   *  - 多选出 tag（超 1 个折叠 +N）、单选清除钮、搜索过滤、中文空态
   */
  defineOptions({ name: 'GSelect' });

  interface Opt {
    label: string;
    value: any;
    disabled?: boolean;
    [k: string]: any;
  }

  const props = withDefaults(
    defineProps<{
      modelValue?: any;
      options?: any[];
      size?: 'sm' | 'md' | 'lg';
      placeholder?: string;
      width?: string;
      clearable?: boolean;
      searchable?: boolean;
      /** 按哪个字段做本地过滤（配合 searchable） */
      optionFilterProp?: string;
      /** 完全自定义匹配；返回 true 表示命中 */
      filterOption?: (input: string, option: any) => boolean;
      loading?: boolean;
      disabled?: boolean;
      mode?: '' | 'multiple' | 'tags';
      status?: '' | 'error' | 'warning';
      emptyText?: string;
      maxTagCount?: number;
    }>(),
    {
      modelValue: undefined,
      options: () => [],
      size: 'md',
      placeholder: '请选择',
      width: '100%',
      clearable: true,
      searchable: false,
      optionFilterProp: 'label',
      filterOption: undefined,
      loading: false,
      disabled: false,
      mode: '',
      status: '',
      emptyText: '暂无可选项',
      maxTagCount: 1,
    },
  );

  const emit = defineEmits<{
    (e: 'update:modelValue', v: any): void;
    (e: 'change', v: any): void;
    (e: 'search', v: string): void;
    (e: 'open', v: boolean): void;
  }>();

  const triggerRef = ref<HTMLDivElement | null>(null);
  const popRef = ref<HTMLDivElement | null>(null);
  const searchRef = ref<HTMLInputElement | null>(null);

  const open = ref(false);
  const search = ref('');
  const activeIndex = ref(-1);
  const rect = ref({ top: 0, left: 0, width: 0, placement: 'bottom' as 'bottom' | 'top' });
  const maxListHeight = 264;

  const isMulti = computed(() => props.mode === 'multiple' || props.mode === 'tags');
  const normalized = computed<Opt[]>(() => (props.options || []).map((o) => (typeof o === 'string' ? { label: o, value: o } : o)));

  /** 本地过滤（searchable 开启时） */
  const filtered = computed(() => {
    if (!props.searchable) return normalized.value;
    const q = search.value.trim().toLowerCase();
    if (!q) return normalized.value;
    if (typeof props.filterOption === 'function') {
      return normalized.value.filter((o) => props.filterOption!(search.value, o));
    }
    const key = props.optionFilterProp || 'label';
    return normalized.value.filter((o) =>
      String(o[key] ?? o.label ?? '')
        .toLowerCase()
        .includes(q),
    );
  });

  const viewOptions = computed(() => filtered.value);

  /* ------------------------- 选中态 ------------------------- */

  const selectedItems = computed<Opt[]>(() => {
    if (isMulti.value) {
      const arr = Array.isArray(props.modelValue) ? props.modelValue : [];
      return arr.map((v) => normalized.value.find((o) => o.value === v) || { label: String(v), value: v }).filter(Boolean);
    }
    const hit = normalized.value.find((o) => o.value === props.modelValue);
    return hit ? [hit] : props.modelValue === undefined || props.modelValue === null || props.modelValue === '' ? [] : [{ label: String(props.modelValue), value: props.modelValue }];
  });

  const selectedLabel = computed(() => (isMulti.value ? null : selectedItems.value[0]?.label ?? null));
  const hasValue = computed(() => (isMulti.value ? selectedItems.value.length > 0 : selectedItems.value.length > 0));

  const visibleTags = computed(() => selectedItems.value.slice(0, props.maxTagCount));
  const hiddenTagCount = computed(() => Math.max(0, selectedItems.value.length - props.maxTagCount));

  function isSelected(v: any) {
    if (isMulti.value) {
      return Array.isArray(props.modelValue) && props.modelValue.includes(v);
    }
    return props.modelValue === v;
  }

  /* ------------------------- 开合与定位 ------------------------- */

  function syncRect() {
    const el = triggerRef.value;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const placement = spaceBelow < maxListHeight + 24 && r.top > spaceBelow ? 'top' : 'bottom';
    rect.value = {
      top: placement === 'bottom' ? r.bottom + 6 : r.top - 6,
      left: r.left,
      width: r.width,
      placement,
    };
  }

  const popStyle = computed(() => {
    const { top, left, width, placement } = rect.value;
    return {
      position: 'fixed' as const,
      left: `${left}px`,
      width: `${Math.max(width, 180)}px`,
      ...(placement === 'bottom' ? { top: `${top}px` } : { bottom: `${window.innerHeight - top}px` }),
      zIndex: 1080,
    };
  });

  function onWinChange() {
    if (open.value) syncRect();
  }

  function onDocMousedown(ev: MouseEvent) {
    if (!open.value) return;
    const t = ev.target as Node;
    if (triggerRef.value?.contains(t) || popRef.value?.contains(t)) return;
    close();
  }

  /** 触发器按下即开合（preventDefault 防止失焦抖动） */
  function onTriggerMousedown(ev: MouseEvent) {
    if (props.disabled) return;
    ev.preventDefault();
    open.value ? close() : openPop();
  }

  async function openPop() {
    if (props.disabled || open.value) return;
    open.value = true;
    syncRect();
    emit('open', true);
    window.addEventListener('scroll', onWinChange, true);
    window.addEventListener('resize', onWinChange);
    document.addEventListener('mousedown', onDocMousedown);
    activeIndex.value = Math.max(
      0,
      viewOptions.value.findIndex((o) => isSelected(o.value)),
    );
    if (props.searchable) {
      await nextTick();
      searchRef.value?.focus();
    }
  }

  function close() {
    if (!open.value) return;
    open.value = false;
    search.value = '';
    emit('open', false);
    window.removeEventListener('scroll', onWinChange, true);
    window.removeEventListener('resize', onWinChange);
    document.removeEventListener('mousedown', onDocMousedown);
  }

  watch(
    () => props.disabled,
    (d) => d && close(),
  );

  onBeforeUnmount(close);

  /* ------------------------- 选择 ------------------------- */

  function emitValue(v: any) {
    emit('update:modelValue', v);
    emit('change', v);
  }

  function pick(o: Opt) {
    if (o.disabled) return;
    if (isMulti.value) {
      const arr = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
      const i = arr.indexOf(o.value);
      i >= 0 ? arr.splice(i, 1) : arr.push(o.value);
      emitValue(arr);
      // 多选选中后保持面板打开，滚动到下一个未选项
      const next = viewOptions.value.findIndex((x) => !isSelected(x.value) && !x.disabled);
      activeIndex.value = next >= 0 ? next : activeIndex.value;
    } else {
      emitValue(o.value);
      close();
    }
    triggerRef.value?.focus();
  }

  function removeTag(v: any) {
    if (props.disabled) return;
    const arr = (Array.isArray(props.modelValue) ? [...props.modelValue] : []).filter((x) => x !== v);
    emitValue(arr);
  }

  function clearAll() {
    emitValue(isMulti.value ? [] : undefined);
  }

  /* ------------------------- 键盘 ------------------------- */

  function onKeydown(ev: KeyboardEvent) {
    if (props.disabled) return;
    const list = viewOptions.value;
    switch (ev.key) {
      case 'Enter': {
        ev.preventDefault();
        if (!open.value) {
          openPop();
        } else if (list[activeIndex.value]) {
          pick(list[activeIndex.value]);
        }
        break;
      }
      case 'Escape':
        ev.preventDefault();
        close();
        break;
      case 'ArrowDown':
        ev.preventDefault();
        if (!open.value) {
          openPop();
        } else if (list.length) {
          activeIndex.value = (activeIndex.value + 1) % list.length;
          scrollActive();
        }
        break;
      case 'ArrowUp':
        ev.preventDefault();
        if (open.value && list.length) {
          activeIndex.value = (activeIndex.value - 1 + list.length) % list.length;
          scrollActive();
        }
        break;
      case 'Home':
        if (open.value && list.length) {
          ev.preventDefault();
          activeIndex.value = 0;
          scrollActive();
        }
        break;
      case 'End':
        if (open.value && list.length) {
          ev.preventDefault();
          activeIndex.value = list.length - 1;
          scrollActive();
        }
        break;
      case 'Tab':
        close();
        break;
      default:
        break;
    }
  }

  function scrollActive() {
    nextTick(() => {
      const pop = popRef.value;
      if (!pop) return;
      const el = pop.querySelectorAll('.gc-opt')[activeIndex.value] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    });
  }

  watch(search, (v) => {
    emit('search', v);
    activeIndex.value = viewOptions.value.length ? 0 : -1;
  });
</script>
