import os, sqlite3
from pathlib import Path

composites = Path('/home/smouj/apps/ttg/Trading-Tazos-Game/.next/standalone/public/tazos-generated')
db = sqlite3.connect('/home/smouj/apps/ttg/Trading-Tazos-Game/prisma/dev.db')

pub_slugs = set()
for row in db.execute("SELECT t.slug FROM Tazo t WHERE t.publishStatus = 'published'"):
    pub_slugs.add(row[0])
print(f"Published tazos in VPS DB: {len(pub_slugs)}")

total_extra = 0
for fslug in ['minimon', 'cybermon', 'dracobell']:
    cdir = composites / fslug
    if cdir.exists():
        comp_slugs = set(f.stem for f in cdir.glob('*.png'))
        extra = comp_slugs - pub_slugs
        total_extra += len(extra)
        print(f"\n{fslug}: {len(comp_slugs)} on disk, {len(extra)} EXTRA (not published)")
        if extra:
            for s in sorted(extra)[:10]:
                print(f"  EXTRA: {fslug}/{s}.png (not published)")
            if len(extra) > 10:
                print(f"  ... and {len(extra)-10} more")

print(f"\n⚠️ Total extra composites on VPS: {total_extra}")

# Also check: do any published tazos have procedural composites?
print("\n--- Checking composite sizes of published tazos ---")
procedural_pub = []
for row in db.execute("SELECT t.slug, LOWER(f.slug) FROM Tazo t JOIN Franchise f ON t.franchiseId = f.id WHERE t.publishStatus = 'published'"):
    slug, fslug = row
    comp_path = composites / fslug / f"{slug}.png"
    if comp_path.exists():
        sz = comp_path.stat().st_size
        if sz < 100000:
            procedural_pub.append(f"{fslug}/{slug}.png ({sz:,} bytes)")
    else:
        print(f"  MISSING composite: {fslug}/{slug}.png")

if procedural_pub:
    print(f"\n⚠️ {len(procedural_pub)} published tazos have small (procedural) composites:")
    for p in procedural_pub[:10]:
        print(f"  {p}")
else:
    print("\n✅ All published tazos have AI composites (>100KB)")

db.close()
