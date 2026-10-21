#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
生成登录页 / 关于页用的荧插画资源。

源图是手机截图（顶部状态栏 + 上下黑边），要解决的问题有两个：
  1. 切掉黑边（按整行平均亮度找画面区）
  2. 把白底去掉（从四边 flood fill 近白像素），否则深色主题下就是一块白方块；
     mix-blend-mode: multiply 只在浅色底有效，且一旦祖先形成层叠上下文就失效，
     所以老老实实做成带 alpha 的图最稳。

用法：
  C:/Users/hp/.workbuddy/binaries/python/envs/default/Scripts/python.exe build/brand/gen-login-art.py
可选环境变量：
  ART_SRC      源文件（默认 build/brand/source/ying-art-source.jpg）
  ART_WIDTH    输出宽度（默认 520，对应 260px 的 2 倍图）
  ART_BG       可选的纯色背景替换（不填则保留透明）

输出：
  src/assets/images/ying-art.webp
  build/brand/preview/ying-art-check.png（浅色 / 深色底各一张自查图）
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.environ.get('ART_SRC') or os.path.join(ROOT, 'build', 'brand', 'source', 'ying-art-source.jpg')
WIDTH = int(os.environ.get('ART_WIDTH') or 520)
OUT = os.path.join(ROOT, 'src', 'assets', 'images', 'ying-art.webp')
CHECK = os.path.join(ROOT, 'build', 'brand', 'preview', 'ying-art-check.png')

# 画面判定阈值：整行平均亮度高于该值才算插画内容。
# 状态栏那几行是"亮字黑底"，平均亮度只有 40~60，用 40 会把状态栏算进画面。
CONTENT_AVG = 150.0
# 近白判定：只有三通道都不低于它的像素才可能是"背景"
NEAR_WHITE = 246
# 反锯齿边：flood fill 之后再往外扩一圈，只吃"比背景稍暗一点"的像素
FRINGE = 238


def content_box(im):
    """找出画面最长的非黑边连续行区间，横向保留整宽。"""
    g = im.convert('L')
    w, h = g.size
    rows = [sum(g.crop((0, y, w, y + 1)).get_flattened_data()) / w for y in range(h)]

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


def bg_mask(im):
    """从四边 flood fill 出背景：返回 L 图，255 = 背景。"""
    w, h = im.size
    rgb = im.load()

    # 1. 近白候选（宽条件，只用来做 flood fill 的边界）
    cand = Image.new('L', (w, h), 0)
    cp = cand.load()
    for y in range(h):
        for x in range(w):
            r, g, b = rgb[x, y]
            if r >= NEAR_WHITE and g >= NEAR_WHITE and b >= NEAR_WHITE:
                cp[x, y] = 255

    # 2. 四边起 flood fill（PIL 的 floodfill 遇到非 255 就停，正好卡住人物与云朵轮廓）
    fill = cand.copy()
    border = [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)]
    border += [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]
    for pt in border:
        if fill.getpixel(pt) == 255:
            ImageDraw.floodfill(fill, pt, 128)

    bg = Image.new('L', (w, h), 0)
    fp, bp = fill.load(), bg.load()
    for y in range(h):
        for x in range(w):
            if fp[x, y] == 128:
                bp[x, y] = 255

    # 3. 反锯齿边：向外扩两圈，但只吃明显偏白的像素（不然会把云朵吃掉）
    for _ in range(2):
        grown = bg.filter(ImageFilter.MaxFilter(3))
        gp = grown.load()
        for y in range(h):
            for x in range(w):
                if bp[x, y] == 0 and gp[x, y] > 0:
                    r, g, b = rgb[x, y]
                    if min(r, g, b) >= FRINGE:
                        bp[x, y] = 255  # 就地写回 bg，下一轮继续从它扩张
    return bg


def build():
    if not os.path.exists(SRC):
        sys.exit(f'源图不存在：{SRC}')
    im = Image.open(SRC).convert('RGB')
    top, bottom = content_box(im)
    art = im.crop((0, top, im.width, bottom))
    print(f'源图 {im.width}x{im.height} -> 裁掉黑边 y={top}..{bottom}，得到 {art.width}x{art.height}')

    mask = bg_mask(art)
    alpha = mask.point(lambda v: 0 if v else 255)
    # 收一圈再羽化：白边不会残留，边缘也不会塑料感
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))

    rgba = art.copy()
    rgba.putalpha(alpha)

    height = round(WIDTH * art.height / art.width)
    rgba = rgba.resize((WIDTH, height), Image.LANCZOS)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    rgba.save(OUT, 'WEBP', quality=86, method=6)
    print(f'输出 {os.path.relpath(OUT, ROOT)}  {WIDTH}x{height}  {os.path.getsize(OUT) / 1024:.1f} KB（带 alpha）')

    # 自查：浅色 / 深色底各贴一张
    os.makedirs(os.path.dirname(CHECK), exist_ok=True)
    pad = 16
    sheet = Image.new('RGB', (WIDTH * 2 + pad * 3, height + pad * 2), '#ffffff')
    for i, color in enumerate(['#eef4fc', '#0b1220']):
        tile = Image.new('RGB', (WIDTH, height), color)
        tile.paste(rgba, (0, 0), rgba)
        sheet.paste(tile, (pad + i * (WIDTH + pad), pad))
    sheet.save(CHECK, 'PNG')
    print(f'自查图 {os.path.relpath(CHECK, ROOT)}（左浅底 / 右深底）')


if __name__ == '__main__':
    build()
