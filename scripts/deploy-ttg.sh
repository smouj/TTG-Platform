#!/bin/bash
# ============================================================
# Trading Tazos Game — Deploy Script v3
# VPS: rpgvps (76.13.37.123)
#
# DATA SAFETY: Live DB lives at data/dev.db (outside .next/)
# npx next build wipes .next/standalone/ but never touches data/
# ============================================================
set -e

APP_DIR="/home/smouj/apps/ttg/Trading-Tazos-Game"
LIVE_DB="$APP_DIR/data/dev.db"
STANDALONE_DIR="$APP_DIR/.next/standalone"
SEED_DB="$APP_DIR/prisma/dev.db"
BACKUP_DIR="$APP_DIR/backups"

echo "═══════════════════════════════════════"
echo " TTG Deploy v3 — DB-safe"
echo "═══════════════════════════════════════"

# 1. Stop PM2 (tolerant — daemon may already be dead)
echo "▶ Stopping PM2…"
pm2 stop ttg 2>/dev/null || true
sleep 2

# 2. WAL checkpoint on live DB
echo "▶ WAL checkpoint…"
sqlite3 "$LIVE_DB" 'PRAGMA wal_checkpoint(TRUNCATE);' 2>/dev/null || true

# 3. Backup live DB (ALWAYS)
echo "▶ Backing up live DB…"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/ttg-$(date +%Y%m%d-%H%M%S).db"
sqlite3 "$LIVE_DB" ".backup '$BACKUP_FILE'"
echo "  Backup: $BACKUP_FILE ($(stat -c%s "$BACKUP_FILE") bytes)"
echo "  Users: $(sqlite3 "$BACKUP_FILE" 'SELECT count(*) FROM User;')"
echo "  UserTazos: $(sqlite3 "$BACKUP_FILE" 'SELECT count(*) FROM UserTazo;')"

# 4. First deploy: seed live DB from prisma/dev.db
if [ ! -f "$LIVE_DB" ]; then
  echo "▶ First deploy — seeding live DB…"
  mkdir -p "$(dirname "$LIVE_DB")"
  cp "$SEED_DB" "$LIVE_DB"
  echo "  Live DB seeded from prisma/dev.db"
fi

# 5. Copy live DB into standalone (Next.js build may have wiped it)
echo "▶ Syncing live DB → standalone…"
mkdir -p "$STANDALONE_DIR/prisma"
cp "$LIVE_DB" "$STANDALONE_DIR/prisma/dev.db"
echo "  Live DB synced to standalone"

# 6. Sync static assets (symlink — Next.js standalone resolves .next relative to server.js)
echo "▶ Syncing static assets…"
rm -rf "$STANDALONE_DIR/.next/static" 2>/dev/null || true
ln -sf "$APP_DIR/.next/static" "$STANDALONE_DIR/.next/static"
cp -r "$APP_DIR/public" "$STANDALONE_DIR/public" 2>/dev/null || true
echo "  Static symlinked, public copied."

# 7. Keep only last 20 backups
cd "$BACKUP_DIR" && ls -t ttg-*.db 2>/dev/null | tail -n +21 | xargs rm -f 2>/dev/null || true

# 8. Sync filesystem
sync

# 9. Restart PM2 (tolerant — daemon may need fresh start)
echo "▶ Restarting PM2…"
pm2 restart ttg 2>/dev/null || pm2 start /home/smouj/apps/ttg/ecosystem.config.js
sleep 5

# 10. Verify
echo ""
echo "▶ Verification:"
pm2 status | grep ttg
curl -s -o /dev/null -w "  /api/health: %{http_code}\n" https://tradingtazosgame.com/api/health
echo "  ownedTazos: $(curl -s https://tradingtazosgame.com/api/stats | python3 -c 'import sys,json; print(json.load(sys.stdin)["ownedTazos"])')"

echo ""
echo "═══════════════════════════════════════"
echo " Deploy complete — live data preserved"
echo "═══════════════════════════════════════"
