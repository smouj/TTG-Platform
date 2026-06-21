#!/bin/bash
# ============================================================
# scripts/db-backup.sh — Trading Tazos Game DB backup
# Run before deploys / destructive changes.
# Stores timestamped backups in backups/ directory.
# ============================================================
set -e

APP_DIR="/home/smouj/apps/ttg/Trading-Tazos-Game"
DB_PATH="$APP_DIR/data/dev.db"
BACKUP_DIR="$APP_DIR/backups"
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/dev.db.$TIMESTAMP.bak"

mkdir -p "$BACKUP_DIR"

# Checkpoint WAL before backup
sqlite3 "$DB_PATH" "PRAGMA wal_checkpoint(TRUNCATE);" 2>/dev/null || true
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

echo "✅ Backup: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Keep only last 20 backups
ls -t "$BACKUP_DIR"/dev.db.*.bak 2>/dev/null | tail -n +21 | xargs rm -f 2>/dev/null || true
