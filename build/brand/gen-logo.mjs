/**
 * 生成 YingPanel 品牌图标（从 build/brand/logo.svg 出图）
 *
 * 为什么走 Chrome：本机没有 sharp / resvg / ImageMagick，
 * 而 puppeteer-core 已在探针里用着。浏览器缩放 SVG 的质量比手写光栅化稳。
 *
 * 产物：
 *   src/assets/images/logo.png        侧栏/应用内 logo（512，透明圆角外）
 *   public/resource/img/logo.png      首屏加载页 logo（512）
 *   public/resource/img/pwa-192x192.png
 *   public/resource/img/pwa-512x512.png
 *   public/favicon.ico                16/32/48/64 多尺寸
 *
 * 用法：node build/brand/gen-logo.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
// 品牌图形源：avatar.svg（荧 头像版，v2.3.24 起）。旧的 logo.svg 星芒版留档，可 BRAND_SVG=logo.svg 回退
const SRC_NAME = process.env.BRAND_SVG || 'avatar.svg';
const SVG = fs.readFileSync(path.join(__dirname, SRC_NAME), 'utf8');
const require = createRequire('D:/yunzai-yingbot/Yunzai/app/package.json');
const puppeteer = require('puppeteer-core');

const svgData = 'data:image/svg+xml;base64,' + Buffer.from(SVG).toString('base64');
const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;background:transparent}
  img{display:block;width:100%;height:100%}
</style></head><body><img src="${svgData}"></body></html>`;

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--proxy-server=direct://', '--proxy-bypass-list=*'],
});

// 临时目录：按目标尺寸改写 SVG 的 width/height 后落地，再用 file:// 打开。
// （踩过的坑：page.setContent 里塞 SVG data URI，Chrome 不解码，截图得到的就是个破图图标）
const WORK = path.join(__dirname, '.tmp-render');
fs.rmSync(WORK, { recursive: true, force: true });
fs.mkdirSync(WORK, { recursive: true });

const fileUrl = (p) => 'file:///' + p.replace(/\\/g, '/');

async function render(size, outFile) {
  const sized = SVG.replace(/width="512"\s+height="512"/, `width="${size}" height="${size}"`);
  const src = path.join(WORK, `logo-${size}.svg`);
  fs.writeFileSync(src, sized, 'utf8');

  const page = await browser.newPage();
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await page.goto(fileUrl(src), { waitUntil: 'load' });
  await page.screenshot({ path: outFile, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  await page.close();
  const kb = (fs.statSync(outFile).size / 1024).toFixed(1);
  console.log(`  ✓ ${path.relative(ROOT, outFile).padEnd(42)} ${size}×${size}  ${kb} KB`);
}

// 尺寸按实际显示大小给：侧栏 32~40px、加载页 90px，2x/3x 屏下 128/192 足够，
// 给到 512 只会把体积顶到 120KB（加载页要等它，白屏时间肉眼可见）。
const jobs = [
  [128, 'src/assets/images/logo.png'],
  [192, 'public/resource/img/logo.png'],
  [512, 'public/resource/img/pwa-512x512.png'],
  [192, 'public/resource/img/pwa-192x192.png'],
];
console.log('渲染 PNG：');
for (const [size, rel] of jobs) await render(size, path.join(ROOT, rel));

// favicon.ico：ICO 容器内嵌 PNG（Vista+ 与所有现代浏览器均支持），多尺寸打包
const tmpDir = path.join(__dirname, '.tmp-ico');
fs.rmSync(tmpDir, { recursive: true, force: true });
fs.mkdirSync(tmpDir, { recursive: true });
const icoSizes = [16, 32, 48, 64];
for (const s of icoSizes) await render(s, path.join(tmpDir, `${s}.png`));

// 小尺寸检查图（16/32 在真实像素下是否还认得出），不进产物、不进仓库
for (const s of [16, 32]) await render(s, path.join(__dirname, `check-${s}.png`));

await browser.close();
fs.rmSync(WORK, { recursive: true, force: true });

const icoPath = path.join(ROOT, 'public/favicon.ico');
buildIco(
  icoSizes.map((s) => ({ size: s, buf: fs.readFileSync(path.join(tmpDir, `${s}.png`)) })),
  icoPath,
);
fs.rmSync(tmpDir, { recursive: true, force: true });
console.log(`  ✓ public/favicon.ico ${icoSizes.join('/')}  ${(fs.statSync(icoPath).size / 1024).toFixed(1)} KB`);

/** 拼 ICO：6 字节头 + n×16 字节目录项 + 各 PNG 数据 */
function buildIco(entries, out) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + dir.length;
  entries.forEach((e, i) => {
    const o = i * 16;
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 0); // width
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 1); // height
    dir.writeUInt8(0, o + 2); // palette
    dir.writeUInt8(0, o + 3); // reserved
    dir.writeUInt16LE(1, o + 4); // planes
    dir.writeUInt16LE(32, o + 6); // bpp
    dir.writeUInt32LE(e.buf.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += e.buf.length;
  });

  fs.writeFileSync(out, Buffer.concat([header, dir, ...entries.map((e) => e.buf)]));
}

// 顺带把 SVG 也拷进 public，方便以后做 og:image / 二次导出
fs.copyFileSync(path.join(__dirname, SRC_NAME), path.join(ROOT, 'public/resource/img/logo.svg'));
console.log(`  ✓ public/resource/img/logo.svg（矢量源 ${SRC_NAME}，可二次导出）`);
