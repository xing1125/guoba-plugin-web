import type { EChartsOption } from 'echarts';
import type { Ref } from 'vue';
import { useTimeoutFn } from '/@/hooks/core/useTimeout';
import { tryOnUnmounted } from '@vueuse/core';
import { unref, nextTick, watch, computed, ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useEventListener } from '/@/hooks/event/useEventListener';
import { useBreakpoint } from '/@/hooks/event/useBreakpoint';
import echarts from '/@/utils/lib/echarts';
import { useRootSetting } from '/@/hooks/setting/useRootSetting';

export function useECharts(elRef: Ref<HTMLDivElement>, theme: 'light' | 'dark' | 'default' = 'default') {
  const { getDarkMode: getSysDarkMode } = useRootSetting();

  const getDarkMode = computed(() => {
    return theme === 'default' ? getSysDarkMode.value : theme;
  });
  let chartInstance: echarts.ECharts | null = null;
  let resizeFn: Fn = resize;
  const cacheOptions = ref({}) as Ref<EChartsOption>;
  let removeResizeFn: Fn = () => {};

  resizeFn = useDebounceFn(resize, 200);

  const getOptions = computed(() => {
    if (getDarkMode.value !== 'dark') {
      return cacheOptions.value as EChartsOption;
    }
    return {
      backgroundColor: 'transparent',
      ...cacheOptions.value,
    } as EChartsOption;
  });

  function initCharts(t = theme) {
    const el = unref(elRef);
    if (!el || !unref(el)) {
      return;
    }

    chartInstance = echarts.init(el, t);
    const { removeEvent } = useEventListener({
      el: window,
      name: 'resize',
      listener: resizeFn,
    });
    removeResizeFn = removeEvent;
    const { widthRef, screenEnum } = useBreakpoint();
    if (unref(widthRef) <= screenEnum.MD || el.offsetHeight === 0) {
      useTimeoutFn(() => {
        resizeFn();
      }, 30);
    }
  }

  /**
   * @param retry 容器未挂载时的重试次数（弹窗/懒加载场景需要）
   *   容器为 null 或高度为 0 时不直接写选项，否则会落到「已销毁的实例」上，
   *   导致图表永远空白（见下面的主题切换分支）。
   */
  function setOptions(options: EChartsOption, clear = true, retry = 6) {
    cacheOptions.value = options;
    const el = unref(elRef);
    if (!el || el.offsetHeight === 0) {
      if (retry > 0) {
        useTimeoutFn(() => {
          setOptions(unref(getOptions) as EChartsOption, clear, retry - 1);
        }, 40);
      }
      return;
    }
    nextTick(() => {
      useTimeoutFn(() => {
        if (!chartInstance || isDisposed()) {
          chartInstance = null;
          initCharts(getDarkMode.value as 'default');

          if (!chartInstance) return;
        }
        clear && chartInstance?.clear();

        chartInstance?.setOption(unref(getOptions));
      }, 30);
    });
  }

  function isDisposed() {
    return !!chartInstance && typeof chartInstance.isDisposed === 'function' && chartInstance.isDisposed();
  }

  function resize() {
    if (!chartInstance || isDisposed()) return;
    chartInstance.resize({
      animation: {
        duration: 300,
        easing: 'quadraticIn',
      },
    });
  }

  watch(
    () => getDarkMode.value,
    (theme) => {
      // 容器未挂载（弹窗未打开 / v-if 未命中）时不能 dispose 后留着旧引用：
      // 否则后续 setOptions 会误判「实例已存在」而跳过 initCharts，
      // 图表就会永远画在已销毁的实例上，容器一片空白。
      if (!unref(elRef)) {
        chartInstance = null;
        return;
      }
      if (chartInstance) {
        chartInstance.dispose();
        chartInstance = null;
        initCharts(theme as 'default');
        setOptions(cacheOptions.value);
      }
    },
  );

  tryOnUnmounted(() => {
    if (!chartInstance) return;
    removeResizeFn();
    chartInstance.dispose();
    chartInstance = null;
  });

  function getInstance(): echarts.ECharts | null {
    if (!chartInstance || isDisposed()) {
      chartInstance = null;
      initCharts(getDarkMode.value as 'default');
    }
    return chartInstance;
  }

  return {
    setOptions,
    resize,
    echarts,
    getInstance,
  };
}
