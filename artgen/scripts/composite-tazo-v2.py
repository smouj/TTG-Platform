#!/usr/bin/env python3
"""
Composite generated creature art onto TTG tazo disc backgrounds.
Uses NO-BG art from rembg (artgen/nobg/) → creates tazo discs → saves to public/tazos-generated/
→ registers in SQLite database.

Key fix: reads from artgen/nobg/ (AI background-removed) instead of raw artgen/output/.
"""

import json, os, sqlite3, math, io, shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

PROJECT = Path("/home/smouj/.openclaw/workspace/Trading-Tazos-Game")
NOBG_DIR = PROJECT / "artgen" / "nobg"  # <-- CLEAN art here
DEST_DIR = PROJECT / "public" / "tazos-generated"
DB_PATH = PROJECT / "prisma" / "dev.db"

SIZE = 1024
CENTER = SIZE // 2
RADIUS = 440

# ── Franchise config ──
FRANCHISE = {
    "minimon": {
        "primary": (255, 203, 5), "secondary": (34, 197, 94),
        "dark": (124, 45, 18), "accent": (34, 197, 94),
        "bgLight": (252, 252, 240), "bgMid": (240, 250, 230),
        "collectionName": "MINIMON TAZOS SERIES 1", "prefix": "m",
    },
    "cybermon": {
        "primary": (0, 161, 233), "secondary": (0, 87, 183),
        "dark": (30, 58, 95), "accent": (6, 182, 212),
        "bgLight": (220, 245, 255), "bgMid": (190, 230, 250),
        "collectionName": "CYBERMON DIGI-TAZOS 2000", "prefix": "c",
    },
    "draco-bell": {
        "primary": (255, 107, 0), "secondary": (204, 68, 0),
        "dark": (124, 45, 18), "accent": (227, 53, 13),
        "bgLight": (255, 245, 225), "bgMid": (255, 230, 200),
        "collectionName": "DRACOBELL MASTER SERIES", "prefix": "d",
    },
}

RARITY = {
    "common":     {"border": (156, 163, 175), "stars": 1},
    "uncommon":   {"border": (34, 197, 94),  "stars": 2},
    "rare":       {"border": (59, 130, 246), "stars": 3},
    "epic":       {"border": (168, 85, 247), "stars": 4},
    "ultra":      {"border": (168, 85, 247), "stars": 4},
    "legendary":  {"border": (251, 191, 36), "stars": 5},
}

ROLE_STATS = {
    "attacker":  [80, 35, 40, 50, 35, 55, 45, 40, 60],
    "tank":      [35, 85, 80, 75, 70, 30, 40, 25, 35],
    "technical": [50, 45, 40, 40, 50, 65, 80, 55, 80],
    "bouncer":   [45, 40, 35, 30, 30, 75, 55, 90, 50],
    "heavy":     [65, 70, 75, 95, 80, 20, 30, 15, 25],
    "light":     [45, 30, 25, 15, 25, 60, 70, 65, 75],
    "balanced":  [55, 55, 55, 55, 55, 55, 55, 55, 55],
    "special":   [70, 55, 60, 50, 60, 70, 65, 60, 65],
}

def make_disc_bg(franchise_slug, rarity_key):
    """Draw tazo disc background."""
    f = FRANCHISE[franchise_slug]
    r = RARITY.get(rarity_key, RARITY["common"])
    
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Radial gradient fill
    for i in range(RADIUS, 0, -1):
        t = i / RADIUS
        fr = f["bgLight"][0] + (f["bgMid"][0] - f["bgLight"][0]) * (1 - t) + (f["accent"][0] - f["bgMid"][0]) * max(0, 1 - t * 2)
        fg = f["bgLight"][1] + (f["bgMid"][1] - f["bgLight"][1]) * (1 - t) + (f["accent"][1] - f["bgMid"][1]) * max(0, 1 - t * 2)
        fb = f["bgLight"][2] + (f["bgMid"][2] - f["bgLight"][2]) * (1 - t) + (f["accent"][2] - f["bgMid"][2]) * max(0, 1 - t * 2)
        color = (int(fr), int(fg), int(fb), 255)
        draw.ellipse([CENTER - i, CENTER - i, CENTER + i, CENTER + i], fill=color)
    
    # Outer border
    draw.ellipse([CENTER - RADIUS, CENTER - RADIUS, CENTER + RADIUS, CENTER + RADIUS], 
                 outline=f["dark"], width=8)
    
    # Inner rings
    draw.ellipse([CENTER - RADIUS + 30, CENTER - RADIUS + 30, CENTER + RADIUS - 30, CENTER + RADIUS - 30],
                 outline=f["primary"], width=3)
    draw.ellipse([CENTER - RADIUS + 50, CENTER - RADIUS + 50, CENTER + RADIUS - 50, CENTER + RADIUS - 50],
                 outline=f["secondary"], width=2)
    
    # Rarity border ring
    rarity_width = 6 if rarity_key == "legendary" else 4
    draw.ellipse([CENTER - RADIUS + 16, CENTER - RADIUS + 16, CENTER + RADIUS - 16, CENTER + RADIUS - 16],
                 outline=r["border"], width=rarity_width)
    
    # Stars
    for i in range(r["stars"]):
        angle = (i / r["stars"]) * 2 * math.pi - math.pi / 2
        sr = RADIUS * 0.85
        sx = CENTER + sr * math.cos(angle)
        sy = CENTER + sr * math.sin(angle)
        draw_star(draw, sx, sy, 28, r["border"])
    
    return img

def draw_star(draw, cx, cy, r, color):
    """Draw a 5-pointed star."""
    pts = []
    for i in range(5):
        outer_a = -math.pi/2 + (i * 2 * math.pi) / 5
        inner_a = outer_a + math.pi / 5
        pts.append((cx + r * math.cos(outer_a), cy + r * math.sin(outer_a)))
        pts.append((cx + r * 0.4 * math.cos(inner_a), cy + r * 0.4 * math.sin(inner_a)))
    draw.polygon(pts, fill=color, outline=(26, 26, 26))

def composite_tazo(creature_img, franchise_slug, rarity_key):
    """Composite creature art onto tazo disc background."""
    disc = make_disc_bg(franchise_slug, rarity_key)
    
    # Resize creature to fit within disc (v3: 1.15x prevents decorative border bleed)
    creature_size = int(RADIUS * 1.15)
    creature = creature_img.resize((creature_size, creature_size), Image.LANCZOS)
    
    # Position: centered with slight upward offset
    offset_x = (SIZE - creature_size) // 2
    offset_y = (SIZE - creature_size) // 2 - 30
    
    # Circular mask to clip creature inside inner ring
    mask = Image.new("L", (creature_size, creature_size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse([0, 0, creature_size-1, creature_size-1], fill=255)
    
    # Paste creature onto disc with circular mask
    disc.paste(creature, (offset_x, offset_y), mask)
    
    return disc

def get_tazo_name(creature_id):
    """Get display name from creatures.json."""
    creatures_path = PROJECT / "artgen" / "creatures.json"
    with open(creatures_path) as f:
        data = json.load(f)
    for c in data["creatures"]:
        if c["id"] == creature_id:
            return c["name"], c
    return creature_id, None

def get_db():
    return sqlite3.connect(str(DB_PATH))

def get_or_create_franchise(db, slug, name):
    cur = db.execute("SELECT id FROM Franchise WHERE slug = ?", (slug,))
    row = cur.fetchone()
    if row:
        return row[0]
    import uuid, datetime
    cid = str(uuid.uuid4())[:24]
    now = datetime.datetime.utcnow().isoformat() + "Z"
    db.execute(
        "INSERT INTO Franchise (id, name, slug, color, updatedAt) VALUES (?, ?, ?, ?, ?)",
        (cid, name, slug, f"rgb({','.join(map(str, FRANCHISE[slug]['primary']))})", now)
    )
    db.commit()
    return cid

def get_or_create_collection(db, franchise_id, name, slug):
    cur = db.execute("SELECT id FROM Collection WHERE slug = ?", (slug,))
    row = cur.fetchone()
    if row:
        return row[0]
    import uuid, datetime
    cid = str(uuid.uuid4())[:24]
    now = datetime.datetime.now(datetime.UTC).isoformat()
    db.execute(
        "INSERT INTO Collection (id, name, slug, franchiseId, totalTazos, updatedAt) VALUES (?, ?, ?, ?, 0, ?)",
        (cid, name, slug, franchise_id, now)
    )
    db.commit()
    return cid

def creature_exists_in_db(db, name):
    """Check if a tazo with this name already exists."""
    cur = db.execute("SELECT id FROM Tazo WHERE name = ?", (name,))
    return cur.fetchone() is not None

def process_creature(db, creature_id, counters, variant="v01"):
    """Process one creature: composite + save + DB."""
    name, creature_data = get_tazo_name(creature_id)
    if not creature_data:
        print(f"  ⚠️  {creature_id} not found in creatures.json")
        return False
    
    line = creature_data["line"]
    rarity = creature_data["rarity"]
    
    # Map line to franchise slug
    line_to_franchise = {
        "minimon": "minimon",
        "cybermon": "cybermon",
        "draco-bell": "draco-bell",
    }
    franchise_slug = line_to_franchise.get(line, line)
    f_config = FRANCHISE[franchise_slug]
    
    # Find NO-BG art (from rembg)
    creature_dir_name = f"{creature_id}-{name.lower().replace(' ', '-')}"
    art_path = NOBG_DIR / line / creature_dir_name / f"{creature_id}-{variant}.png"
    
    if not art_path.exists():
        print(f"  ⚠️  No-bg art not found: {art_path}")
        return False
    
    print(f"  🎨 {creature_id} ({name}) — {line} {rarity}")
    
    # Load clean no-bg creature image (already transparent from rembg)
    creature_img = Image.open(art_path).convert("RGBA")
    
    # Resize to standard size
    if creature_img.size != (SIZE, SIZE):
        creature_img = creature_img.resize((SIZE, SIZE), Image.LANCZOS)
    
    # Composite onto tazo disc
    tazo_img = composite_tazo(creature_img, franchise_slug, rarity)
    
    # Save
    dest_dir = DEST_DIR / franchise_slug
    dest_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate slug using in-memory counter
    if franchise_slug not in counters:
        cur = db.execute(
            "SELECT COUNT(*) FROM Tazo WHERE franchiseId = (SELECT id FROM Franchise WHERE slug = ?)", 
            (franchise_slug,)
        )
        counters[franchise_slug] = cur.fetchone()[0]
    counters[franchise_slug] += 1
    count = counters[franchise_slug]
    prefix = f_config["prefix"]
    slug = f"{prefix}-{count:03d}"
    slug_suffixed = f"{franchise_slug}-{slug}"
    
    dest_path = dest_dir / f"{slug_suffixed}.png"
    tazo_img.save(dest_path, "PNG", optimize=True)
    print(f"    💾 Saved: {dest_path}")
    
    # DB operations
    franchise_name = f_config["collectionName"].split(" ")[0]
    franchise_id = get_or_create_franchise(db, franchise_slug, franchise_name)
    collection_slug = f"{franchise_slug}-series-1"
    collection_name = f_config["collectionName"]
    collection_id = get_or_create_collection(db, franchise_id, collection_name, collection_slug)
    
    image_url = f"/tazos-generated/{franchise_slug}/{slug_suffixed}.png"
    
    if creature_exists_in_db(db, name):
        # Update existing record with new image
        db.execute("UPDATE Tazo SET imageUrl = ? WHERE name = ?", (image_url, name))
        print(f"    📝 Updated DB: {name} → {image_url}")
    else:
        import random, uuid, datetime
        tazo_id = str(uuid.uuid4())[:24]
        
        role = creature_data.get("role", "balanced")
        stats = list(ROLE_STATS.get(role, ROLE_STATS["balanced"]))
        
        rarity_mult = {"common": 0.8, "uncommon": 0.9, "rare": 1.0, "epic": 1.05, "ultra": 1.1, "legendary": 1.25}
        mult = rarity_mult.get(rarity, 1.0)
        
        for i in range(len(stats)):
            stats[i] = max(10, min(99, int(stats[i] * mult + random.randint(-5, 5))))
        
        now = datetime.datetime.now(datetime.UTC).isoformat()
        db.execute("""
            INSERT INTO Tazo (id, name, displayName, slug, franchiseId, collectionId, 
                number, rarity, role, imageUrl, combatType,
                attack, defense, resistance, weight, stability, spin, control, bounce, precision,
                sourceStatus, finish, creatureVariant, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            tazo_id, name, name, slug_suffixed, franchise_id, collection_id,
            slug, rarity, role, image_url, role,
            stats[0], stats[1], stats[2], stats[3], stats[4], stats[5], stats[6], stats[7], stats[8],
            "verified", "normal", "standard", now,
        ))
        print(f"    ✅ New DB record: {tazo_id}")
    
    db.commit()
    return True

def main():
    creatures_path = PROJECT / "artgen" / "creatures.json"
    with open(creatures_path) as f:
        data = json.load(f)
    
    creatures = data["creatures"]
    
    # Find which have no-bg art
    pending = []
    for c in creatures:
        name = c["name"].lower().replace(" ", "-")
        art_path = NOBG_DIR / c["line"] / f"{c['id']}-{name}" / f"{c['id']}-v01.png"
        if art_path.exists():
            pending.append(c["id"])
    
    print(f"🔧 Composite Tazo Generator v2 (no-bg art)")
    print(f"   Found {len(pending)}/{len(creatures)} creatures with clean art\n")
    
    if not pending:
        print("No creatures to process. Run remove-bg-batch.py first.")
        return
    
    db = get_db()
    counters = {}
    success = 0
    for i, cid in enumerate(pending):
        try:
            if process_creature(db, cid, counters):
                success += 1
        except Exception as e:
            print(f"  ❌ {cid} failed: {e}")
    
    db.close()
    print(f"\n✨ Done! {success}/{len(pending)} composited. Now run deploy.sh to sync to VPS.")

if __name__ == "__main__":
    main()
