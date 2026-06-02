#!/usr/bin/env bash
# deploy.sh — Trading Tazos Game
# Build locally and deploy to VPS (rpgvps)
# Usage: ./deploy.sh

set -euo pipefail

VPS_HOST="rpgvps"
VPS_DIR="/home/smouj/apps/ttg/Trading-Tazos-Game"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Trading Tazos Game — Deploy"
echo "================================"

# 1. Build
echo ""
echo "📦 [1/6] Building..."
cd "$LOCAL_DIR"
bun run build 2>&1 | tail -5

# 2. Verify
if [ ! -f ".next/standalone/Trading-Tazos-Game/server.js" ]; then
  echo "❌ Build failed: server.js not found"
  exit 1
fi
echo "✅ Build OK"

# 3. Sync standalone build
echo ""
echo "📤 [2/6] Syncing standalone..."
rsync -avz --delete \
  .next/standalone/ "$VPS_HOST:$VPS_DIR/.next/standalone/"

# 3b. Fix distDir mismatch: copy standalone .next → project .next
echo ""
echo "📤 [2b/6] Syncing standalone .next → project .next..."
ssh "$VPS_HOST" "cp -r $VPS_DIR/.next/standalone/Trading-Tazos-Game/.next/* $VPS_DIR/.next/"
echo "✅ distDir synced"

# 4. Sync static files
echo ""
echo "📤 [3/6] Syncing static..."
rsync -avz --delete \
  .next/static/ "$VPS_HOST:$VPS_DIR/.next/static/"

# 5. Sync prisma
echo ""
echo "📤 [4/6] Syncing prisma..."
rsync -avz --delete \
  --exclude='*.db' --exclude='*.db-journal' \
  prisma/ "$VPS_HOST:$VPS_DIR/prisma/"

# 5b. Fix DATABASE_URL to absolute path (Prisma engine resolves relative paths from engine binary, not CWD)
echo ""
echo "📤 [4b/6] Fixing DATABASE_URL..."
ssh "$VPS_HOST" "sed -i 's|DATABASE_URL=.*|DATABASE_URL=\"file:$VPS_DIR/prisma/dev.db\"|' $VPS_DIR/.env"
echo "✅ DATABASE_URL = file:$VPS_DIR/prisma/dev.db"

# 6. Sync public assets (logos, tazos, etc.)
echo ""
echo "📤 [5/6] Syncing public assets..."
rsync -avz --delete \
  public/ "$VPS_HOST:$VPS_DIR/public/"

# 7. Sync WS server + its deps
echo ""
echo "📤 [6/6] Syncing WS server..."
ssh "$VPS_HOST" "mkdir -p $VPS_DIR/src/server"
rsync -avz src/server/ws-server.js "$VPS_HOST:$VPS_DIR/src/server/ws-server.js"
rsync -avz node_modules/ws/ "$VPS_HOST:$VPS_DIR/node_modules/ws/"
rsync -avz node_modules/jsonwebtoken/ "$VPS_HOST:$VPS_DIR/node_modules/jsonwebtoken/"

# 8. Restart services
echo ""
echo "🔄 Restarting PM2..."
ssh "$VPS_HOST" "pm2 restart ttg ttg-ws 2>&1 && pm2 save" | tail -5

# 9. Verify
echo ""
echo "🔍 Verifying..."
sleep 3
HTTP=$(curl -s -o /dev/null -w '%{http_code}' https://medaclawarena.com/)
WS_STATUS=$(curl -s https://medaclawarena.com/api/multiplayer/status | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'clients={d.get(\"connectedClients\",\"?\")} rooms={d.get(\"activeRooms\",\"?\")}')" 2>/dev/null || echo "?")

echo "   Homepage:  $HTTP"
echo "   WS:        $WS_STATUS"

if [ "$HTTP" = "200" ]; then
  echo ""
  echo "✅ Deploy completo — https://medaclawarena.com/"
else
  echo ""
  echo "⚠️  Verificar — homepage no responde 200"
fi
