#!/usr/bin/env python3
"""
Creature Art Pipeline — tracks and organizes creature art generation.
Phase 1: Write prompts for all pending creatures
Phase 2: Generate art (external)
Phase 3: Composite final tazos
Phase 4: Deploy

Usage:
  python3 scripts/tazo-pipeline.py status     Show pending counts
  python3 scripts/tazo-pipeline.py prompts    Write prompts.txt
  python3 scripts/tazo-pipeline.py check      Verify all generated art exists
  python3 scripts/tazo-pipeline.py composite  Run composite for all tazos
  python3 scripts/tazo-pipeline.py publish    Publish tazos that have art
"""

import json, os, subprocess, sys
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).parent.parent
DB_PATH = ROOT / "prisma" / "dev.db"
CREATURE_DIR = ROOT / "scripts" / "tazo-creatures"
GEN_DIR = ROOT / "public" / "tazos-generated"
DATA_PATH = ROOT / "scripts" / "all-tazos.json"

FRANCHISE_PROMPTS = {
    "minimon": "An original elemental fantasy creature from TTG, cute expressive collectible design, vibrant colors, round shapes, isolated on transparent background, digital art, clean lines, clear tazo silhouette",
    "dracobell": "An original fantasy martial-arts fighter from TTG, invented outfit, unique aura, strong readable posture, vibrant colors, isolated on transparent background, digital art, clear tazo silhouette",
    "cybermon": "A futuristic digital creature, cyberpunk mecha style, neon circuits, robotic features, holographic glow, sleek design, digital art, isolated on transparent background, trading card game style, clean lines",
}

STYLE_SUFFIX = " --style trading-card-game-character --ar 1:1"


def load_tazos():
    with open(DATA_PATH) as f:
        return json.load(f)


def status():
    tazos = load_tazos()
    pending = []
    has_art = []
    has_composite = []

    for t in tazos:
        fs = t["franchise"]
        slug = t["slug"]
        creature = CREATURE_DIR / fs / f"{slug}.png"
        composite = GEN_DIR / fs / f"{slug}.png"

        if creature.exists():
            has_art.append(t)
        else:
            pending.append(t)

        if composite.exists():
            has_composite.append(t)

    print(f"📊 Pipeline Status")
    print(f"   Total in pipeline: {len(tazos)}")
    print(f"   Creature art ready: {len(has_art)}")
    print(f"   Creatures pending: {len(pending)}")
    print(f"   Composites ready: {len(has_composite)}")
    print(f"   Composites pending: {len(tazos) - len(has_composite)}")

    if pending:
        print(f"\n   Pending by franchise:")
        pc = Counter(t["franchise"] for t in pending)
        for fr, count in pc.most_common():
            print(f"     {fr}: {count}")

    # Sample first 5 pending
    if pending:
        print(f"\n   Next 5 to generate:")
        for t in pending[:5]:
            print(f"     {t['franchise']}/{t['slug']} — {t['name']} [{t['rarity']}]")


def prompts():
    tazos = load_tazos()
    pending = [t for t in tazos if not (CREATURE_DIR / t["franchise"] / f"{t['slug']}.png").exists()]

    with open(ROOT / "scripts" / "creature-prompts.txt", "w") as f:
        for t in pending:
            base = FRANCHISE_PROMPTS.get(t["franchise"], FRANCHISE_PROMPTS["minimon"])
            prompt = f"{t['name']}: {base}. Character name is {t['name']}, {t['rarity']} rarity {t['role']} type.{STYLE_SUFFIX}"
            f.write(f"{t['franchise']}|{t['slug']}|{prompt}\n")

    print(f"✅ Wrote {len(pending)} prompts to scripts/creature-prompts.txt")


def check_art():
    """Verify all pixel data is valid PNGs"""
    tazos = load_tazos()
    from PIL import Image
    broken = []
    missing = []
    ok = 0

    for t in tazos:
        path = CREATURE_DIR / t["franchise"] / f"{t['slug']}.png"
        if not path.exists():
            missing.append(t["slug"])
            continue
        try:
            img = Image.open(path)
            img.verify()
            ok += 1
        except:
            broken.append(t["slug"])

    print(f"   OK: {ok}")
    if missing:
        print(f"   Missing: {len(missing)} — {missing[:5]}...")
    if broken:
        print(f"   Broken: {len(broken)} — {broken}")
    return len(missing) == 0 and len(broken) == 0


def composite():
    """Run generate-tazo-art.py for all tazos that have creatures"""
    tazos = load_tazos()
    ready = [t for t in tazos if (CREATURE_DIR / t["franchise"] / f"{t['slug']}.png").exists()]

    if not ready:
        print("❌ No tazos have creature art yet")
        return

    print(f"🎨 Compositing {len(ready)} tazos with creature art...")
    cmd = [
        sys.executable, str(ROOT / "scripts" / "generate-tazo-art.py"),
        str(DB_PATH),
    ]
    subprocess.run(cmd, check=True)
    print("✅ Composite done")


def publish():
    """Mark tazos with generated composites as published"""
    import sqlite3

    conn = sqlite3.connect(str(DB_PATH))
    tazos = load_tazos()
    updated = 0

    for t in tazos:
        composite = GEN_DIR / t["franchise"] / f"{t['slug']}.png"
        if composite.exists() and composite.stat().st_size > 1000:
            conn.execute(
                "UPDATE Tazo SET publishStatus = 'published' WHERE slug = ? AND publishStatus = 'pending_review'",
                (t["slug"],)
            )
            if conn.total_changes > 0:
                updated += 1

    conn.commit()
    conn.close()
    print(f"✅ Published {updated} tazos")

    # Verify counts
    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.execute("SELECT publishStatus, COUNT(*) FROM Tazo GROUP BY publishStatus")
    for row in cur:
        print(f"   {row[0]}: {row[1]}")
    conn.close()


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    globals().get(cmd, status)()
