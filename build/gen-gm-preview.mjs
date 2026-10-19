// 生成 gm 自绘图标集的独立预览页（无需 Bot 重启，直接浏览器打开）
// 用法：cd /d/yunzai-yingbot/Yunzai/guoba-web-fork && node build/gen-gm-preview.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(resolve(root, 'src/design/gmIcons.ts'), 'utf8');

// 剥掉 TS 语法，得到纯 JS 对象字面量再求值
let js = src
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/type\s+GmIcon\s*=[^;]+;/, '')
  .replace(/export const GM_COLLECTION[^=]*=/, 'const GM_COLLECTION =')
  .replace(/as Record<string,\s*GmIcon>/, '')
  .replace(/as const\s*;?\s*$/, '')
  .replace(/export\s+\{[^}]*\}\s*;?\s*$/m, '');

const GM_COLLECTION = new Function(`"use strict";${js}; return GM_COLLECTION;`)();
const icons = GM_COLLECTION.icons;
const names = Object.keys(icons);
console.log(`解析到 ${names.length} 枚图标:`, names.join(', '));

const svgOf = (def) =>
  `<svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">${def.body}</svg>`;

const card = (name, def, dark) => `
  <div class="card ${dark ? 'dark' : ''}">
    <div class="ic">${svgOf(def)}</div>
    <div class="nm">${name}</div>
  </div>`;

const grid = (dark) => `
  <section class="grid ${dark ? 'dark' : ''}">
    ${names.map((n) => card(n, icons[n], dark)).join('\n')}
  </section>`;

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>gm 自绘 duotone 图标集预览（${names.length} 枚）</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; margin: 0; }
  body { font-family: "Segoe UI", "Microsoft YaHei", system-ui, sans-serif; padding: 32px 28px 48px; background: #f5f8fc; color: #1f2a3a; transition: background .25s; }
  h1 { font-size: 20px; margin-bottom: 6px; }
  .sub { font-size: 12.5px; opacity: .65; margin-bottom: 22px; line-height: 1.7; }
  h2 { font-size: 15px; margin: 26px 0 12px; opacity: .85; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 12px; }
  .card { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 20px 8px 14px; border-radius: 14px; background: #fff; border: 1px solid #e3eaf3; box-shadow: 0 1px 3px rgba(31,42,58,.05); transition: transform .15s, box-shadow .15s; }
  .card:hover { transform: translateY(-3px); box-shadow: 0 6px 18px rgba(31,42,58,.12); }
  .card .ic { color: #2f6fd6; display: grid; place-items: center; min-height: 40px; }
  .card .nm { font-size: 11.5px; font-variant-ligatures: none; opacity: .75; letter-spacing: .02em; }
  /* 深色区 */
  section.dark { background: #12293d; border-radius: 16px; padding: 16px; }
  .card.dark { background: #163349; border-color: #1f4361; box-shadow: none; }
  .card.dark .ic { color: #7cb8ff; }
  .card.dark .nm { color: #cfe3f7; opacity: .8; }
</style>
</head>
<body>
  <h1>gm · 自绘 duotone 菜单图标集</h1>
  <p class="sub">${names.length} 枚 · 24×24 · 主线 stroke 1.7 currentColor + 双色填充（fill-opacity .14~.6）· 经 Iconify addCollection 运行时注册，离线可用。<br>每枚图标上：浅色主题效果 / 下：深色主题效果（对应后台侧栏）。</p>
  <h2>浅色主题</h2>
  ${grid(false)}
  <h2>深色主题（后台侧栏）</h2>
  ${grid(true)}
</body>
</html>`;

const out = resolve(root, 'build/preview/gm-icons-preview.html');
writeFileSync(out, html, 'utf8');
console.log('written', out);
