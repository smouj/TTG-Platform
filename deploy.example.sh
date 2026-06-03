#!/usr/bin/env bash
# deploy.example.sh — Trading Tazos Game
# Copy to deploy.sh and customize VPS_HOST and VPS_DIR
# Usage: ./deploy.sh

set -euo pipefail

# ⚠️  CHANGE THESE to match your server
VPS_HOST="your-vps-host"
VPS_DIR="/path/to/your/app"

LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Trading Tazos Game — Deploy"
echo "================================"

# 1. Build
echo ""
echo "📦 Building..."
cd "$LOCAL_DIR"
bun run build 2>&1 | tail -5

# 2. Sync standalone build
echo ""
echo "📤 Syncing to $VPS_HOST..."
rsync -avz --delete .next/standalone/ "$VPS_HOST:$VPS_DIR/.next/standalone/"

# 3. Fix distDir mismatch
ssh "$VPS_HOST" "cp -r $VPS_DIR/.next/standalone/Trading-Tazos-Game/.next/* $VPS_DIR/.next/"

# 4. Fix static files for standalone
ssh "$VPS_HOST" "mkdir -p $VPS_DIR/.next/standalone/Trading-Tazos-Game/.next/static && cp -r $VPS_DIR/.next/static/* $VPS_DIR/.next/standalone/Trading-Tazos-Game/.next/static/"

# 5. Sync static + prisma + public
rsync -avz --delete .next/static/ "$VPS_HOST:$VPS_DIR/.next/static/"
rsync -avz --exclude='*.db' prisma/ "$VPS_HOST:$VPS_DIR/prisma/"
rsync -avz --delete public/ "$VPS_HOST:$VPS_DIR/public/"

# 6. Sync package.json (PM2 reads version from it)
rsync -avz package.json "$VPS_HOST:$VPS_DIR/package.json"

# 7. Fix DATABASE_URL to absolute path
ssh "$VPS_HOST" "sed -i 's|DATABASE_URL=.*|DATABASE_URL=\"file:$VPS_DIR/prisma/dev.db\"|' $VPS_DIR/.env"

# 8. Regenerate Prisma client
ssh "$VPS_HOST" "cd $VPS_DIR && npx prisma generate 2>&1 | tail -1 || true"

# 9. Sync WS server
ssh "$VPS_HOST" "mkdir -p $VPS_DIR/src/server"
rsync -avz src/server/ws-server.js "$VPS_HOST:$VPS_DIR/src/server/ws-server.js"
rsync -avz node_modules/ws/ "$VPS_HOST:$VPS_DIR/node_modules/ws/"
rsync -avz node_modules/jsonwebtoken/ "$VPS_HOST:$VPS_DIR/node_modules/jsonwebtoken/"

# 10. Restart
echo ""
echo "🔄 Restarting..."
ssh "$VPS_HOST" "pm2 restart ttg ttg-ws && pm2 save" | tail -3

# 11. Verify
sleep 2
HTTP=$(curl -s -o /dev/null -w '%{http_code}' https://your-domain.com)
echo "   Status: $HTTP"
echo "✅ Deploy completo"
