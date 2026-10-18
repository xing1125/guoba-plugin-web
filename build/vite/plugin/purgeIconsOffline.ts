import { createRequire } from 'node:module';

/**
 * 离线版 purge-icons
 *
 * 官方 vite-plugin-purge-icons 的 ESM 构建里使用 esbuild 的 __require 垫片，
 * 在 ESM 上下文中会直接抛错，导致本地 @iconify/json 永远读不到，
 * 只能回退到 raw.githubusercontent.com 远程拉取 —— 国内网络下构建会失败。
 *
 * 这里直接走 @purge-icons/core 的 CJS 入口（真正的 require），
 * 全部从本地 node_modules/@iconify/json 读取图标数据，零网络依赖。
 */
const IMPORT_PATHS = [
  '@purge-icons/generated',
  'vite-plugin-purge-icons/generated',
  'rollup-plugin-purge-icons/generated',
];

export function purgeIconsOffline(options: Record<string, any> = {}) {
  const requireFromRoot = createRequire(process.cwd() + '/');
  const { PurgeIcons } = requireFromRoot('@purge-icons/core');

  return {
    name: 'purge-icons-offline',
    // 必须抢先于 vite:resolve —— node_modules 里存在 @purge-icons/generated 占位包，
    // 否则真实包会被优先解析到，虚拟模块永远不会生效（图标退回运行时联网拉取）。
    enforce: 'pre' as const,
    resolveId(id: string) {
      return IMPORT_PATHS.includes(id) ? id : null;
    },
    async load(id: string) {
      if (!IMPORT_PATHS.includes(id)) return null;
      try {
        return await PurgeIcons({
          content: ['index.html', 'src/**/*.{vue,ts,tsx}'],
          iconifyImportName: '@iconify/iconify',
          ...options,
        });
      } catch (e: any) {
        // 只要有一个图标在本地 @iconify/json 里找不到，整批收集都会失败，
        // 此时会退化成运行时联网拉取（离线环境图标会缺失），必须显式告警。
        console.warn(
          `\n[purge-icons] 图标离线收集失败，将退化为运行时拉取：${e?.message || e}\n` +
            `  请检查 src 中是否存在本地图标库未收录的图标（如 solar:* 等较新的集合）。\n`,
        );
        return '';
      }
    },
  };
}
