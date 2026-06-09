#!/bin/bash
# TTG Deploy Script — WSL → VPS deployment
# Run from: ~/.openclaw/workspace/Trading-Tazos-Game
set -euo pipefail

VPS="rpgvps"
VPS_APP="/home/smouj/apps/ttg/Trading-Tazos-Game"
STANDALONE=".next/standalone"

echo "📦 Deploying TTG to VPS..."

# 1. Build (must already be done)
if [ ! -d ".next" ]; then
  echo "❌ .next/ not found — run 'npm run build' first"
  exit 1
fi

# 2. Sync .next/ to VPS
echo "→ Syncing .next/ to VPS..."
rsync -avz --delete .next/ "$VPS:$VPS_APP/.next/"

# 3. Post-deploy steps on VPS
echo "→ Running post-deploy on VPS..."
ssh "$VPS" << 'ENDSSH'
set -euo pipefail
cd /home/smouj/apps/ttg/Trading-Tazos-Game

# Copy static assets to standalone (Next.js standalone bug workaround)
cp -r .next/static/* .next/standalone/.next/static/

# Ensure directories exist
mkdir -p .next/standalone/prisma
mkdir -p .next/standalone/public/tazos-base
mkdir -p .next/standalone/public/tazos-generated
mkdir -p .next/standalone/public/tazos-backs
mkdir -p .next/standalone/public/tazos-artgen/backs
mkdir -p .next/standalone/public/tazos-tubes

# Copy layout JSON (only if not already present — preserves user saves)
if [ ! -f .next/standalone/prisma/tazo-layouts.json ]; then
  cp prisma/tazo-layouts.json .next/standalone/prisma/
  echo "  → Fresh tazo-layouts.json copied"
else
  echo "  → tazo-layouts.json preserved (user data)"
fi

# Copy image assets
cp -r public/tazos-base/* .next/standalone/public/tazos-base/   2>/dev/null || true
cp -r public/tazos-generated/* .next/standalone/public/tazos-generated/ 2>/dev/null || true
cp -r public/tazos-backs/* .next/standalone/public/tazos-backs/  2>/dev/null || true
cp -r public/tazos-artgen/* .next/standalone/public/tazos-artgen/  2>/dev/null || true

# Restart PM2
pm2 restart ttg
ENDSSH

echo "✅ Deploy complete!"
echo ""
echo "Verifying..."
sleep 2
for url in \
  "https://tradingtazosgame.com/" \
  "https://tradingtazosgame.com/?page=tazos" \
  "https://tradingtazosgame.com/?page=collections" \
  "https://tradingtazosgame.com/admin/tazo-designer"
do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$url")
  echo "  $code → $url"
done
# Deploy note: Fix VPS DATABASE_URL in standalone .env
sed -i 's|file:/home/smouj/.openclaw/workspace/Trading-Tazos-Game/prisma/dev.db|file:/home/smouj/apps/ttg/Trading-Tazos-Game/prisma/dev.db|' .next/standalone/.env 2>/dev/null || true

# Symlink DB to avoid stale standalone copy
if [ -f .next/standalone/prisma/dev.db ] && [ ! -L .next/standalone/prisma/dev.db ]; then
  rm .next/standalone/prisma/dev.db
  ln -s ../../../prisma/dev.db .next/standalone/prisma/dev.db
  echo "  → DB symlinked"
fi
