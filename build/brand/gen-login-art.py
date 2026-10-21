#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
生成登录页的荧插画资源。

源图是手机截图（顶部状态栏 + 上下黑边），所以先自动切掉黑边，
再等比缩到 2 倍图宽度，导出 WebP 给前端用。

用法：
  C:/Users/hp/.workbuddy/binaries/python/envs/default/Scripts/python.exe build/brand/gen-login-art.py
可选环境变量：
  ART_SRC      源文件（默认 build/brand/source/ying-art-source.jpg）
  ART_WIDTH    输出宽度（默认 520，对应 260px 的 2 倍图）
  ART_FORMAT   webp | png（默认 webp）

输出：
  src/assets/images/ying-art.webp
  build/brand/preview/ying-art-check.png（裁剪结果自查）
"""
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.environ.get('ART_SRC') or os.path.join(ROOT, 'build', 'brand', 'source', 'ying-art-source.jpg')
WIDTH = int(os.environ.get('ART_WIDTH') or 520)
FMT = (os.environ.get('ART_FORMAT') or 'webp').lower()
OUT = os.path.join(ROOT, 'src', 'assets', 'images', f'ying-art.{FMT}')
CHECK = os.path.join(ROOT, 'build', 'brand', 'preview', 'ying-art-check.png')

# 画面判定阈值：整行平均亮度高于该值才算插画内容。
# 状态栏那几行虽然是"亮字黑底"，平均亮度只有 40~60，用 40 会把状态栏算进画面。
CONTENT_AVG = 150.0


def content_box(im):
    """找出画面最长的非黑边连续行区间，横向保留整宽。"""
    g = im.convert('L')
    w, h = g.size
    rows = []
    for y in range(h):
        rows.append(sum(g.crop((0, y, w, y + 1)).get_flattened_data()) / w)

    best = (0, 0)
    start = None
    for y, v in enumerate(rows):
        if v >= CONTENT_AVG:
            if start is None:
                start = y
        elif start is not None:
            if y - start > best[1] - best[0]:
                best = (start, y)
            start = None
    if start is not None and h - start > best[1] - best[0]:
        best = (start, h)
    return best


def main():
    if not os.path.exists(SRC):
        sys.exit(f'源图不存在：{SRC}')
    im = Image.open(SRC).convert('RGB')
    top, bottom = content_box(im)
    art = im.crop((0, top, im.width, bottom))
    print(f'源图 {im.width}x{im.height} -> 裁掉黑边 y={top}..{bottom}，得到 {art.width}x{art.height}')

    height = round(WIDTH * art.height / art.width)
    art = art.resize((WIDTH, height), Image.LANCZOS)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    if FMT == 'png':
        art.save(OUT, 'PNG', optimize=True)
    else:
        art.save(OUT, 'WEBP', quality=82, method=6)
    size_kb = os.path.getsize(OUT) / 1024
    print(f'输出 {os.path.relpath(OUT, ROOT)}  {height}x{WIDTH}  {size_kb:.1f} KB  比例 {WIDTH / height:.3f}')

    os.makedirs(os.path.dirname(CHECK), exist_ok=True)
    art.save(CHECK, 'PNG')
    print(f'自查图 {os.path.relpath(CHECK, ROOT)}')


if __name__ == '__main__':
    main()
