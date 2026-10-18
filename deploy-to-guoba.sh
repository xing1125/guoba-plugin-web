#!/usr/bin/env bash
# 部署前端产物到 Guoba-Plugin/server/static
# 用法：bash deploy-to-guoba.sh
set -euo pipefail

FORK_DIR="$(cd "$(dirname "$0")" && pwd)"
YUNZAI_ROOT="$(cd "$FORK_DIR/.." && pwd)"
STATIC="$YUNZAI_ROOT/app/plugins/Guoba-Plugin/server/static"

if [ ! -d "$FORK_DIR/dist" ]; then
  echo "✗ dist 不存在，请先执行: npm run build"
  exit 1
fi

if [ ! -d "$STATIC" ]; then
  echo "✗ 找不到锅巴静态目录: $STATIC"
  exit 1
fi

# 用改名代替批量删除（避免一次性删除大量文件），同时天然完成备份
BACKUP="${STATIC}.bak.$(date +%Y%m%d-%H%M%S)"
mv "$STATIC" "$BACKUP"
mkdir -p "$STATIC"
cp -r "$FORK_DIR/dist/." "$STATIC/"

echo "✓ 已备份旧版本: $BACKUP"
echo "✓ 部署完成 -> $STATIC"
echo "  → 重启锅巴后生效（发送 #锅巴登录 或重启 Bot）"
echo "  → 回滚: mv '$STATIC' '$STATIC.failed' && mv '$BACKUP' '$STATIC'"
