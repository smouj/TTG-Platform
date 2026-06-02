#!/usr/bin/env bash
# deploy.sh — Trading Tazos Game
# Build locally and deploy to VPS (rpgvps)
# Usage: ./deploy.sh

set -euo pipefail

VPS_HOST="rpgvps"
VPS_DIR="/home/smouj/apps/ttg"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Trading Tazos Game — Deploy"
echo "================================"

# 1. Build
echo ""
echo "📦 [1/5] Building..."
cd "$LOCAL_DIR"
bun run build 2>&1 | tail -5

# 2. Verify build output
if [ ! -f ".next/standalone/Trading-Tazos-Game/server.js" ]; then
  echo "❌ Build failed: server.js not found"
  exit 1
fi
echo "✅ Build OK"

# 3. Sync standalone + prisma + public to VPS
echo ""
echo "📤 [2/5] Syncing to VPS..."
rsync -avz --delete \
  --exclude='prisma/dev.db' \
  --exclude='prisma/prisma/dev.db' \
  .next/standalone/ "$VPS_HOST:$VPS_DIR/"

rsync -avz --delete \
  --exclude='*.db' \
  --exclude='*.db-journal' \
  prisma/ "$VPS_HOST:$VPS_DIR/Trading-Tazos-Game/prisma/"
echo "✅ Sync done"

# 4. Fix Turbopack static files (Next.js 16)
echo ""
echo "🔧 [3/5] Fixing static chunks..."
ssh "$VPS_HOST" "
  cd $VPS_DIR/Trading-Tazos-Game/.next && \
  rm -rf static && \
  mkdir -p static/chunks && \
  cp $VPS_DIR/.next/chunks/* static/chunks/ && \
  cp -r $VPS_DIR/.next/JA1MEp4xUdsPoCoYdoJRv static/ 2>/dev/null || true && \
  cp -r $VPS_DIR/.next/media static/ 2>/dev/null || true && \
  echo '✅ Static files fixed'
"

# 5. Restart PM2
echo ""
echo "🔄 [4/5] Restarting PM2..."
ssh "$VPS_HOST" "pm2 restart ttg && pm2 save" 2>&1 | tail -3

# 6. Verify
echo ""
echo "🔍 [5/5] Verifying..."
sleep 3
HTTP=$(curl -s -o /dev/null -w '%{http_code}' https://medaclawarena.com/)
CSS=$(curl -s -o /dev/null -w '%{http_code}' https://medaclawarena.com/_next/static/chunks/a7d5d0791c8c6223.css)
API=$(curl -s https://medaclawarena.com/api/tazos | python3 -c "import sys,json; print(json.load(sys.stdin).get('total','?'))" 2>/dev/null || echo "?")

echo "   Homepage: $HTTP"
echo "   CSS:      $CSS"
echo "   API:      $API tazos"

if [ "$HTTP" = "200" ] && [ "$CSS" = "200" ] && [ "$API" != "?" ]; then
  echo ""
  echo "✅ Deploy completo — https://medaclawarena.com/"
else
  echo ""
  echo "⚠️  Verificar — algo no responde bien"
fi
