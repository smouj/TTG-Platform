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

# Note: prisma/dev.db (seed DB) is NOT synced to VPS anymore — the live DB
# at data/dev.db is the single source of truth. Schema changes via prisma db push.

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

# Fix DATABASE_URL to point to canonical data/dev.db (not standalone copy)
# CRITICAL: symlink prevents 0-byte DB corruption
TARGET_DB="file:/home/smouj/apps/ttg/Trading-Tazos-Game/data/dev.db"
sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$TARGET_DB\"|" .next/standalone/.env

# VERIFY the DATABASE_URL was actually fixed (abort deploy if not)
if ! grep -qF "DATABASE_URL=\"$TARGET_DB\"" .next/standalone/.env; then
  echo "❌ FATAL: DATABASE_URL in standalone .env is NOT the VPS path!"
  grep DATABASE_URL .next/standalone/.env
  exit 1
fi
echo "  ✅ DATABASE_URL verified: data/dev.db (symlink)"

# Sync Stripe env from ecosystem.config.js (keep standalone .env in sync with PM2 env)
# All sensitive keys live in ecosystem.config.js — this just mirrors for standalone process
node -e "
const fs=require('fs');
const eco=fs.readFileSync('../ecosystem.config.js','utf8');
const env=eco.match(/env:\s*\{([^}]+)\}/s);
if(env){
  const vars=env[1].match(/[A-Z_]+:\s*'[^']*'/g)||[];
  let d=fs.readFileSync('.next/standalone/.env','utf8');
  vars.forEach(v=>{
    const [k,val]=v.split(/\s*:\s*/);
    const clean=val.replace(/^'|'$/g,'');
    if(k.startsWith('NEXT_PUBLIC_')||['STRIPE_SECRET_KEY','STRIPE_MODE'].includes(k)){
      if(!d.includes(k+'=')) d+='\n'+k+'='+clean;
    }
  });
  fs.writeFileSync('.next/standalone/.env',d);
}
" 2>/dev/null || echo "  ⚠️ Stripe env sync skipped"

# Ensure email (SMTP) env vars are present
if ! grep -q '^SMTP_HOST=' .next/standalone/.env; then
  cat >> .next/standalone/.env << 'SMTPEOF'
# ── Email (SMTP via Hostinger) ──
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=support@tradingtazosgame.com
SMTP_PASS=mVS+oR0kSj
MAIL_FROM_NAME=Trading Tazos Game Support
MAIL_FROM_EMAIL=support@tradingtazosgame.com
SMTPEOF
fi

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
# Ensure all composites are RGBA (not palette mode)
python3 -c "
from PIL import Image
import os
B='.next/standalone/public/tazos-generated'
for d in ['minimon','dracobell','cybermon']:
    pd=os.path.join(B,d)
    if not os.path.isdir(pd): continue
    for f in os.listdir(pd):
        if not f.endswith('.png') or 'back' in f.lower(): continue
        fp=os.path.join(pd,f)
        img=Image.open(fp)
        if img.mode!='RGBA':
            img.convert('RGBA').save(fp,'PNG')
        img.close()
" 2>/dev/null || echo "  ⚠️ RGBA conversion failed (Pillow missing?)"
cp -r public/tazos-backs/* .next/standalone/public/tazos-backs/  2>/dev/null || true
cp -r public/tazos-artgen/* .next/standalone/public/tazos-artgen/  2>/dev/null || true

# IMPORTANT: The repo DB on VPS may be stale (only synced on deploy).
# The WSL DB has the canonical data including seeded users.
# We must copy from the WSL-synced file, not the VPS-local repo copy.
# The rsync above syncs prisma/dev.db from WSL → VPS repo.
#
# CRITICAL FIX: Use symlink instead of copy to prevent 0-byte DB corruption.
# The symlink points from standalone/prisma/dev.db → data/dev.db
# This way Prisma always reads the canonical DB directly.

# Checkpoint WAL to ensure all data is in main DB file
sqlite3 data/dev.db "PRAGMA wal_checkpoint(TRUNCATE);" 2>/dev/null || true

# Clean any stale WAL/SHM files
rm -f data/dev.db-wal data/dev.db-shm

# Ensure data directory exists with the synced DB
# ⚠️  NEVER copy prisma/dev.db to data/dev.db — that overwrites live user data!
# data/dev.db is the LIVE canonical DB. prisma db push (below) handles schema.
mkdir -p data
# Create or verify symlink (standalone reads data/dev.db directly)
rm -f .next/standalone/prisma/dev.db
ln -sf /home/smouj/apps/ttg/Trading-Tazos-Game/data/dev.db .next/standalone/prisma/dev.db
rm -f .next/standalone/prisma/dev.db-wal .next/standalone/prisma/dev.db-shm

# Push schema changes to ensure DB tables match
# Must NOT suppress errors — missing tables = production downtime
DATABASE_URL="file:/home/smouj/apps/ttg/Trading-Tazos-Game/data/dev.db" npx prisma@6.19.3 db push --schema=./prisma/schema.prisma --skip-generate

echo "  → DB schema pushed OK"

# Re-seed demo passwords using VPS Node.js (avoids bash $scrypt$ escaping issues)
# Write hashes to temp files via Node.js, then update DB via Python
python3 << "PYREHASH"
import sqlite3, subprocess, os

DB = "/home/smouj/apps/ttg/Trading-Tazos-Game/data/dev.db"

# Generate hashes on VPS using Node.js (same crypto as the bundled server)
for email, pw in [("demo@tradingtazosgame.com", "Tt9_4b93e142_XH"), ("dev@tradingtazosgame.com", "Tt9_4b93e142_XH")]:
    r = subprocess.run(["node", "-e", f"""
const {{ scryptSync, randomBytes }} = require("crypto");
const salt = randomBytes(32);
const digest = scryptSync("{pw}", salt, 64, {{ N: 16384, r: 8, p: 1 }});
process.stdout.write("$scrypt$" + salt.toString("base64url") + "$" + digest.toString("base64url"));
"""], capture_output=True, text=True)
    h = r.stdout.strip()
    db = sqlite3.connect(DB)
    db.execute("UPDATE User SET passwordHash = ? WHERE email = ?", (h, email))
    db.commit()
    row = db.execute("SELECT length(passwordHash) FROM User WHERE email = ?", (email,)).fetchone()
    print(f"  Rehashed {email}: len={row[0]}" if row else f"  WARNING: {email} not found in DB!")
    db.close()

print("  → Demo passwords re-seeded OK")
PYREHASH

# Final WAL cleanup on canonical data/dev.db
sqlite3 /home/smouj/apps/ttg/Trading-Tazos-Game/data/dev.db "PRAGMA wal_checkpoint(TRUNCATE);" 2>/dev/null || true
rm -f /home/smouj/apps/ttg/Trading-Tazos-Game/data/dev.db-wal /home/smouj/apps/ttg/Trading-Tazos-Game/data/dev.db-shm

# Restart PM2 (both web + WS server)
pm2 restart ttg
pm2 restart ttg-ws

echo "  → PM2 restarted (ttg + ttg-ws)"
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
