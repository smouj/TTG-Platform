#!/usr/bin/env python3
"""Publish all Season 1 tazos that have composite art."""
import sqlite3, os

DB = "/home/smouj/apps/ttg/Trading-Tazos-Game/prisma/dev.db"
COMPOS = "/home/smouj/apps/ttg/Trading-Tazos-Game/public/tazos-generated"

conn = sqlite3.connect(DB)
conn.row_factory = sqlite3.Row

# Collect composite slugs by franchise
compo_map = {}
for franchise in ["minimon", "dracobell", "cybermon"]:
    path = os.path.join(COMPOS, franchise)
    compo_map[franchise] = set()
    if os.path.isdir(path):
        for f in os.listdir(path):
            if f.endswith(".png") and "back" not in f.lower() and f != "minimon-t1-1.png":
                compo_map[franchise].add(f.replace(".png", ""))

# Map franchise slugs to DB franchiseIds
franchises = {r["slug"]: r["id"] for r in conn.execute("SELECT id, slug FROM Franchise").fetchall()}

# Find draft tazos
draft_tazos = conn.execute("SELECT * FROM Tazo WHERE publishStatus = ?", ("draft",)).fetchall()

to_publish = []
for t in draft_tazos:
    fid = t["franchiseId"]
    slug = t["slug"] or ""
    name = (t["name"] or "").lower()
    
    franchise_slug = None
    for fs, fi in franchises.items():
        if fi == fid:
            franchise_slug = fs
            break
    
    if not franchise_slug or franchise_slug not in compo_map:
        continue
    
    compos = compo_map[franchise_slug]
    
    if slug in compos or name in compos or name.replace(" ", "-") in compos:
        to_publish.append(t)
        compos.discard(slug)
        compos.discard(name)
        compos.discard(name.replace(" ", "-"))

print(f"Publishing {len(to_publish)} tazos...")

for t in to_publish:
    conn.execute(
        "UPDATE Tazo SET publishStatus = ?, sourceStatus = ? WHERE id = ?",
        ("published", "verified", t["id"])
    )

conn.commit()

total = conn.execute("SELECT COUNT(*) FROM Tazo WHERE publishStatus = ?", ("published",)).fetchone()[0]
print(f"Total published: {total}")

# Also update imageUrl for published tazos if needed
# Check how many have valid imageUrls
urls = conn.execute(
    "SELECT COUNT(*) FROM Tazo WHERE publishStatus = ? AND imageUrl IS NOT NULL AND imageUrl != ''",
    ("published",)
).fetchone()[0]
print(f"With image URLs: {urls}")

# Show published count by franchise
by_f = conn.execute(
    "SELECT franchiseId, COUNT(*) as cnt FROM Tazo WHERE publishStatus = ? GROUP BY franchiseId",
    ("published",)
).fetchall()
for r in by_f:
    fid = r["franchiseId"]
    slug = [k for k, v in franchises.items() if v == fid]
    print(f"  {slug[0] if slug else fid[:8]}: {r['cnt']} published")

conn.close()
print("Done!")
