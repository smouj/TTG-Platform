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

# 3. Post-deploy steps on VPS
echo "→ Running post-deploy on VPS..."
ssh "$VPS" << 'ENDSSH'
set -euo pipefail
cd /home/smouj/apps/ttg/Trading-Tazos-Game

# Backup live user-edited layout JSON before rsync overwrites it
LAYOUTS_BACKUP="/tmp/tazo-layouts-backup-$$.json"
if [ -f .next/standalone/prisma/tazo-layouts.json ]; then
  cp .next/standalone/prisma/tazo-layouts.json "$LAYOUTS_BACKUP"
  echo "  → Backed up live tazo-layouts.json"
fi
ENDSSH

# 2b. rsync needs to happen on VPS side? No — it already ran above.
# We need to re-order: back up BEFORE rsync!
# Let's do the backup in a separate SSH call before rsync
echo "→ Backing up VPS live layouts before sync..."
ssh "$VPS" 'if [ -f /home/smouj/apps/ttg/Trading-Tazos-Game/.next/standalone/prisma/tazo-layouts.json ]; then cp /home/smouj/apps/ttg/Trading-Tazos-Game/.next/standalone/prisma/tazo-layouts.json /tmp/tazo-layouts-live.json 2>/dev/null && echo "  → Live layouts backed up"; else echo "  → No live layouts to back up"; fi' || true

# 2. Sync .next/ to VPS (must happen AFTER backup)
echo "→ Syncing .next/ to VPS..."
rsync -avz --delete .next/ "$VPS:$VPS_APP/.next/"

# 3. Post-deploy steps on VPS
echo "→ Running post-deploy on VPS..."
ssh "$VPS" << 'ENDSSH'
set -euo pipefail
cd /home/smouj/apps/ttg/Trading-Tazos-Game

# Ensure directories exist (MUST be first — cp/mkdir order matters with set -e)
mkdir -p .next/standalone/.next/static
mkdir -p .next/standalone/prisma
mkdir -p .next/standalone/public/tazos-base
mkdir -p .next/standalone/public/tazos-generated
mkdir -p .next/standalone/public/tazos-backs
mkdir -p .next/standalone/public/tazos-artgen/backs
mkdir -p .next/standalone/public/tazos-tubes

# Fix DATABASE_URL to VPS path (prevent stale WSL paths in standalone .env)
# Match ANY path that isn't the correct VPS standalone path
sed -i 's|DATABASE_URL=.*|DATABASE_URL="file:/home/smouj/apps/ttg/Trading-Tazos-Game/.next/standalone/prisma/dev.db"|' .next/standalone/.env

# Copy static assets to standalone (Next.js standalone bug workaround)
cp -r .next/static/* .next/standalone/.next/static/

# Copy layout JSON — RESTORE LIVE BACKUP so user edits survive deploys
if [ -f /tmp/tazo-layouts-live.json ]; then
  cp /tmp/tazo-layouts-live.json .next/standalone/prisma/tazo-layouts.json
  # Also sync back to repo so WSL source stays in sync
  cp /tmp/tazo-layouts-live.json prisma/tazo-layouts.json
  rm -f /tmp/tazo-layouts-live.json
  echo "  → Live tazo-layouts.json restored (user edits preserved)"
elif [ ! -f .next/standalone/prisma/tazo-layouts.json ]; then
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

# Checkpoint WAL to ensure all data is in main DB file before copy
sqlite3 prisma/dev.db "PRAGMA wal_checkpoint(TRUNCATE);" 2>/dev/null || true

# Copy DB to standalone (rsync --delete removes it)
cp prisma/dev.db .next/standalone/prisma/dev.db

# Push schema changes to ensure DB tables match (safe: SQLite adds missing columns/tables only)
DATABASE_URL="file:/home/smouj/apps/ttg/Trading-Tazos-Game/.next/standalone/prisma/dev.db" npx prisma db push --schema=./prisma/schema.prisma --skip-generate 2>/dev/null || true

# Restart PM2
pm2 restart ttg

echo "  → DB synced to standalone"
ENDSSH

echo "✅ Deploy complete!"
echo ""
echo "Verifying..."
sleep 2
for url in \
  "https://tradingtazosgame.com/" \
  "https://tradingtazosgame.com/?page=tazos" \
  "https://tradingtazosgame.com/?page=collections" \
  "https://tradingtazosgame.com/api/tazos?publishStatus=published" \
  "https://tradingtazosgame.com/admin/tazo-designer"
do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$url")
  echo "  $code → $url"
done
