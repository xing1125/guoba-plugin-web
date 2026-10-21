/**
 * 徽标速览：渲染指定 SVG 的 512 / 128 / 32 三档
 * 用法：node build/brand/preview-logo.mjs [emblem.svg]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire('D:/yunzai-yingbot/Yunzai/app/package.json');
const puppeteer = require('puppeteer-core');

const name = process.argv[2] || 'emblem.svg';
const SVG = fs.readFileSync(path.join(__dirname, name), 'utf8');
const OUT = path.join(__dirname, 'preview');
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--proxy-server=direct://', '--proxy-bypass-list=*'],
});

const base = name.replace(/\.svg$/, '');
for (const size of [512, 128, 32]) {
  const p = path.join(OUT, `${base}-${size}.png`);
  const page = await browser.newPage();
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  const html = 'data:text/html,' + encodeURIComponent(`<body style="margin:0;background:transparent">${SVG.replace(/width="512"\s+height="512"/, `width="${size}" height="${size}"`)}</body>`);
  await page.goto(html, { waitUntil: 'load' });
  await page.screenshot({ path: p, omitBackground: true });
  await page.close();
  console.log('  ✓', path.relative(process.cwd(), p));
}
await browser.close();
