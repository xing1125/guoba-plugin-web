/**
 * 预览「锅巴芯片」图标集：读 guobaIcons.ts 抽 JSON → 生成 HTML → 无头截图
 * 用法：node build/preview-icons.mjs
 */
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire('D:/yunzai-yingbot/Yunzai/app/package.json');
const puppeteer = require('puppeteer-core');

const src = fs.readFileSync('D:/yunzai-yingbot/Yunzai/guoba-web-fork/src/design/guobaIcons.ts', 'utf8');
const anchor = src.indexOf('const GUIBA_ICONS');
const start = src.indexOf('{', anchor);
const end = src.indexOf('\n};', start);
const jsonStr = src.slice(start, end + 2).replace('};', '}');
const icons = JSON.parse(jsonStr);

const cell = (name) =>
  `<div class="cell"><span class="iconify" data-icon="gb:${name}"></span><span class="nm">${name}</span></div>`;
const cells = Object.keys(icons).map(cell).join('');

const iconifyJs = fs.readFileSync(
  'D:/yunzai-yingbot/Yunzai/guoba-web-fork/node_modules/@iconify/iconify/dist/iconify.min.js',
  'utf8',
);
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;font-family:system-ui}
  .wrap{display:grid;grid-template-columns:repeat(7,1fr);gap:10px;padding:16px}
  .cell{display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 4px;border-radius:12px}
  .nm{font-size:10px;color:#64748b}
  .light{background:#f8fafc}.dark{background:#0f172a}
  .dark .nm{color:#94a3b8}
  .big .iconify{font-size:32px}
  .iconify{font-size:18px;display:inline-block;width:1em;height:1em}
</style></head><body>
<div id="light" class="light"><div class="wrap big">${cells}</div></div>
<div id="dark" class="dark"><div class="wrap big">${cells}</div></div>
<script>${iconifyJs}</script>
<script>
  GUIBA = ${jsonStr};
  // 直接内联 SVG 渲染（预览用，绕过 iconify 运行时）
  document.querySelectorAll('span.iconify').forEach((el) => {
    const name = (el.dataset.icon || '').replace(/^gb:/, '');
    const icon = GUIBA[name];
    if (icon) {
      el.outerHTML = '<svg width="1em" height="1em" viewBox="0 0 24 24" style="display:inline-block;vertical-align:-0.125em">' + icon.body + '</svg>';
    }
  });
</script></body></html>`;

const out = 'D:/yunzai-yingbot/Yunzai/guoba-web-fork/build/preview/icon-preview.html';
fs.writeFileSync(out, html);

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--proxy-server=direct://', '--proxy-bypass-list=*'],
  defaultViewport: { width: 980, height: 620, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
await page.goto('file:///' + out.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: 'D:/yunzai-yingbot/Yunzai/guoba-web-fork/build/preview/icon-preview.png', fullPage: true });
console.log('done');
await browser.close();
