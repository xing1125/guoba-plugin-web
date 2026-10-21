import type { Menu } from '/@/router/types';
import { ref, computed, onBeforeMount, unref, nextTick, watch, Ref } from 'vue';
import { getMenus } from '/@/router/menus';
import { cloneDeep } from 'lodash-es';
import { forEach } from '/@/utils/helper/treeHelper';
import { useGo } from '/@/hooks/web/usePage';
import { useScrollTo } from '/@/hooks/event/useScrollTo';
import { onKeyStroke, useDebounceFn } from '@vueuse/core';
import { useI18n } from '/@/hooks/web/useI18n';

export interface SearchResult {
  name: string;
  path: string;
  icon?: string;
  /** 一级菜单名，结果里显示归属 */
  group?: string;
}

/**
 * 空输入时的常用入口（按日常使用频率排序）。
 * 命中不了的路径会被自动跳过，因此菜单增删不会把它弄坏。
 */
const QUICK_PATHS = ['/home', '/console', '/dashboard', '/groups', '/users-data', '/sign', '/plugins-data', '/account'];

const QUICK_MAX = 8;

/** 正则特殊字符转义 */
function transform(c: string) {
  const code: string[] = ['$', '(', ')', '*', '+', '.', '[', ']', '?', '\\', '^', '{', '}', '|'];
  return code.includes(c) ? `\\${c}` : c;
}

/** 逐字模糊匹配：输入 "yh" 也能命中 "用户"（按字符顺序跨过任意内容） */
function createSearchReg(key: string) {
  const keys = [...key].map((item) => transform(item));
  return new RegExp(['', ...keys, ''].join('.*'), 'i');
}

export function useMenuSearch(refs: Ref<HTMLElement[]>, scrollWrap: Ref<ElRef>, emit: EmitType, isOpen: Ref<boolean>) {
  const searchResult = ref<SearchResult[]>([]);
  const quickList = ref<SearchResult[]>([]);
  const keyword = ref('');
  const activeIndex = ref(-1);

  /** 全部叶子页面，用于「N 个页面」计数与常用入口兜底 */
  let leaves: SearchResult[] = [];

  const { t } = useI18n();
  const go = useGo();

  /** 关键字立刻更新（输入框受控于它），只有过滤本身走防抖 */
  const runFilter = useDebounceFn(applyFilter, 120);

  /** 面板实际展示的列表：有输入看结果，没输入看常用 */
  const list = computed<SearchResult[]>(() => (unref(keyword).trim() ? unref(searchResult) : unref(quickList)));
  const totalPages = computed(() => leaves.length);

  onBeforeMount(async () => {
    const menus = await getMenus();
    const menuList: Menu[] = cloneDeep(menus);
    forEach(menuList, (item) => {
      item.name = t(item.name);
    });
    leaves = collectLeaves(menuList);
    quickList.value = buildQuick();
    if (unref(isOpen)) activeIndex.value = quickList.value.length ? 0 : -1;
  });

  /** 拍平成叶子列表，保持菜单顺序 */
  function collectLeaves(menus: Menu[], group?: string): SearchResult[] {
    const ret: SearchResult[] = [];
    menus.forEach((item) => {
      const { name, path, icon, children, hideMenu, meta } = item;
      const g = group || name;
      const isLeaf = !Array.isArray(children) || children.length === 0;
      if (!hideMenu && isLeaf && path) {
        ret.push({ name, path, icon, group: group });
      }
      if (!meta?.hideChildrenInMenu && Array.isArray(children) && children.length) {
        ret.push(...collectLeaves(children, g));
      }
    });
    return ret;
  }

  function buildQuick(): SearchResult[] {
    const picked: SearchResult[] = [];
    const seen = new Set<string>();
    QUICK_PATHS.forEach((p) => {
      const hit = leaves.find((it) => it.path === p) || leaves.find((it) => it.path.endsWith(p));
      if (hit && !seen.has(hit.path)) {
        picked.push({ ...hit, group: undefined });
        seen.add(hit.path);
      }
    });
    // 常用路径不够时用菜单顺序补齐，保证面板永远不会空着
    for (const it of leaves) {
      if (picked.length >= QUICK_MAX) break;
      if (!seen.has(it.path)) {
        picked.push({ ...it, group: undefined });
        seen.add(it.path);
      }
    }
    return picked.slice(0, QUICK_MAX);
  }

  function handleSearch(e: any) {
    const key = e?.target ? e.target.value : e || '';
    keyword.value = String(key);
    runFilter();
  }

  function applyFilter() {
    const kw = unref(keyword).trim();
    if (!kw) {
      searchResult.value = [];
      activeIndex.value = unref(quickList).length ? 0 : -1;
      return;
    }
    const reg = createSearchReg(kw);
    searchResult.value = leaves.filter((it) => reg.test(it.name)).slice(0, 40);
    activeIndex.value = searchResult.value.length ? 0 : -1;
  }

  /** 清空输入回到「常用」 */
  function reset() {
    keyword.value = '';
    searchResult.value = [];
    activeIndex.value = unref(quickList).length ? 0 : -1;
  }

  // 鼠标移到某一行就把它设为当前项
  function handleMouseenter(e: any) {
    const index = e?.currentTarget?.dataset?.index ?? e?.target?.dataset?.index;
    activeIndex.value = Number(index);
  }

  function move(step: number) {
    const items = unref(list);
    if (!items.length) return;
    const next = unref(activeIndex) + step;
    activeIndex.value = next < 0 ? items.length - 1 : next > items.length - 1 ? 0 : next;
    handleScroll();
  }

  function handleUp() {
    move(-1);
  }

  function handleDown() {
    move(1);
  }

  /** 当前项滚出可视区时自动滚动到可见 */
  function handleScroll() {
    const refList = unref(refs);
    const wrapEl = unref(scrollWrap);
    if (!refList || !Array.isArray(refList) || !refList.length || !wrapEl) return;
    const currentRef = refList[unref(activeIndex)];
    if (!currentRef) return;
    const scrollHeight = currentRef.offsetTop + currentRef.offsetHeight;
    const wrapHeight = wrapEl.offsetHeight;
    // 已经可见就不动，避免来回抖动
    if (scrollHeight - wrapEl.scrollTop <= wrapHeight && currentRef.offsetTop >= wrapEl.scrollTop) return;
    const { start } = useScrollTo({ el: wrapEl, duration: 100, to: Math.max(0, scrollHeight - wrapHeight) });
    start();
  }

  function handleEnter() {
    const items = unref(list);
    const index = unref(activeIndex);
    if (!items.length || index < 0) return;
    const to = items[index];
    if (!to) return;
    handleClose();
    nextTick(() => go(to.path));
  }

  function handleClose() {
    searchResult.value = [];
    keyword.value = '';
    activeIndex.value = -1;
    emit('close');
  }

  // 列表换了一批就把当前项归零，否则会指到不存在的行
  watch(list, (items) => {
    if (!unref(isOpen)) return;
    activeIndex.value = items.length ? 0 : -1;
  });

  // 只在面板打开时接管键盘，避免页面里按回车 / 方向键被吞掉
  const whenOpen = (fn: () => void) => (e: KeyboardEvent) => {
    if (!unref(isOpen)) return;
    e.preventDefault();
    fn();
  };

  onKeyStroke('Enter', whenOpen(handleEnter));
  onKeyStroke('ArrowUp', whenOpen(handleUp));
  onKeyStroke('ArrowDown', whenOpen(handleDown));
  onKeyStroke('Escape', whenOpen(handleClose));

  return {
    handleSearch,
    reset,
    keyword,
    list,
    searchResult,
    totalPages,
    activeIndex,
    handleMouseenter,
    handleEnter,
    handleClose,
  };
}
