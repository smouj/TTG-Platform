#!/bin/bash
# ============================================================
# TTG SQLite Backup + Restore
# ============================================================
# Usage:
#   backup         scripts/backup-db.sh
#   restore <file> scripts/backup-db.sh restore dev.db.20260612-1200
#   list           scripts/backup-db.sh list
# ============================================================
set -euo pipefail

APP_ROOT="/home/smouj/apps/ttg/Trading-Tazos-Game"
DB="${APP_ROOT}/prisma/dev.db"
BACKUP_DIR="/home/smouj/backups/ttg"
KEEP_DAYS=14

mkdir -p "$BACKUP_DIR"

# ── WAL checkpoint (ensures all data in main DB file) ──
checkpoint_db() {
  if command -v sqlite3 &>/dev/null && [ -f "$DB" ]; then
    sqlite3 "$DB" "PRAGMA wal_checkpoint(TRUNCATE);" >/dev/null 2>&1 || true
  fi
}

# ── Backup ──
do_backup() {
  checkpoint_db

  local ts
  ts=$(date +%Y%m%d-%H%M)
  local dest="$BACKUP_DIR/dev.db.$ts"
  cp "$DB" "$dest"

  # Cleanup WAL/SHM copies
  rm -f "$BACKUP_DIR/dev.db.$ts-wal" "$BACKUP_DIR/dev.db.$ts-shm"

  local size
  size=$(stat -c%s "$dest" 2>/dev/null || echo 0)
  echo "[$(date -Iseconds)] BACKUP OK: dev.db.$ts (${size} bytes)"

  # Rotate
  find "$BACKUP_DIR" -name "dev.db.*" -mtime "+${KEEP_DAYS}" -delete 2>/dev/null || true
}

# ── Restore ──
do_restore() {
  local file="$1"
  local src="$BACKUP_DIR/$file"
  if [ ! -f "$src" ]; then
    echo "ERROR: $src not found"
    echo "Available backups:"
    ls -1 "$BACKUP_DIR" | grep -v restore
    exit 1
  fi

  echo "⚠️  About to restore $file → $DB"
  echo "   Current DB: $(stat -c%s "$DB" 2>/dev/null || echo 'MISSING') bytes"
  echo "   Restore DB: $(stat -c%s "$src") bytes"
  echo ""
  read -rp "Type 'yes' to confirm: " confirm
  if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
  fi

  # Backup current before overwriting
  local pre_ts
  pre_ts=$(date +%Y%m%d-%H%M)
  cp "$DB" "$BACKUP_DIR/dev.db.pre-restore.$pre_ts" 2>/dev/null || true
  rm -f "$DB" "$DB-wal" "$DB-shm"

  cp "$src" "$DB"
  echo "[$(date -Iseconds)] RESTORE OK: $file → $DB"
  echo "Pre-restore backup: dev.db.pre-restore.$pre_ts"
}

# ── List ──
do_list() {
  echo "Backups in $BACKUP_DIR:"
  ls -lh "$BACKUP_DIR" | grep -v restore | grep -v total
}

# ── Main ──
case "${1:-backup}" in
  restore) do_restore "${2:?Missing file name}" ;;
  list)    do_list ;;
  backup)  do_backup ;;
  *)       echo "Usage: $0 [backup|restore <file>|list]" && exit 1 ;;
esac
