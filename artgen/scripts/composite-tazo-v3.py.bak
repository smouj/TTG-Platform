#!/usr/bin/env python3
"""
Composite Tazo Generator v3 — Uses OFFICIAL tazo-art-studio backgrounds.
Pipelines: no-bg creature art → official franchise disc background → tazo PNG → DB update.

Key changes from v2:
- Uses backgrounds from smouj/tazo-art-studio (NOT generated disc backgrounds)
- 1254×1254 canvas with professional franchise designs
- Creature placed at center, clipped to circle
- Rarity stars overlaid as badge
"""

import json, os, sqlite3, math, random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

PROJECT = Path("/home/smouj/.openclaw/workspace/Trading-Tazos-Game")
NOBG_DIR = PROJECT / "artgen" / "nobg"
BG_DIR = PROJECT / "artgen" / "tazo-bg" / "frontal"
DEST_DIR = PROJECT / "public" / "tazos-generated"
DB_PATH = PROJECT / "prisma" / "dev.db"

CANVAS = 1254
CENTER = CANVAS // 2  # 627
DISC_RADIUS = 500  # inner disc radius (before dark ring at ~540)

# Map franchise slug to background variant files
FRANCHISE_BG = {
    "minimon": ["minimon-01.png", "minimon-02.png", "minimon-03.png", 
                "minimon-04.png", "minimon-05.png", "minimon-06.png"],
    "cybermon": ["cybermon-01.png", "cybermon-02.png", "cybermon-03.png"],
    "draco-bell": ["dracobell-01.png", "dracobell-02.png", "dracobell-03.png", "dracobell-04.png"],
}

# Map rarity to star count
RARITY_STARS = {
    "common": 1, "uncommon": 2, "rare": 3, "epic": 4, "ultra": 5, "legendary": 5,
}
RARITY_COLORS = {
    "common": (156, 163, 175),
    "uncommon": (34, 197, 94),
    "rare": (59, 130, 246),
    "epic": (168, 85, 247),
    "ultra": (255, 107, 0),
    "legendary": (251, 191, 36),
}

def pick_background(franchise_slug, rarity):
    """Pick a background variant deterministically based on creature name + rarity."""
    variants = FRANCHISE_BG.get(franchise_slug, ["cybermon-01.png"])
    # Use rarity to seed hashed variant selection
    rarity_idx = list(RARITY_STARS.keys()).index(rarity) if rarity in RARITY_STARS else 0
    idx = rarity_idx % len(variants)
    return variants[idx]

def draw_star(draw, cx, cy, r, color):
    """5-pointed star."""
    pts = []
    for i in range(5):
        outer_a = -math.pi/2 + (i * 2 * math.pi) / 5
        inner_a = outer_a + math.pi / 5
        pts.append((cx + r * math.cos(outer_a), cy + r * math.sin(outer_a)))
        pts.append((cx + r * 0.4 * math.cos(inner_a), cy + r * 0.4 * math.sin(inner_a)))
    draw.polygon(pts, fill=color, outline=(20, 20, 20))

def add_rarity_overlay(img, rarity):
    """Add rarity stars to the tazo."""
    stars = RARITY_STARS.get(rarity, 1)
    color = RARITY_COLORS.get(rarity, (156, 163, 175))
    
    overlay = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    # Stars in an arc near bottom or top of creature area
    star_r = DISC_RADIUS * 0.75
    start_angle = -math.pi / 2 - (stars - 1) * math.pi / 10
    for i in range(stars):
        angle = start_angle + i * math.pi / 5
        sx = CENTER + star_r * math.cos(angle)
        sy = CENTER + star_r * math.sin(angle) + 205  # offset toward bottom
        draw_star(draw, sx, sy, 26, color)
        draw_star(draw, sx, sy, 28, color)  # double-draw for thickness
    
    return Image.alpha_composite(img.convert("RGBA"), overlay)

def composite_tazo(creature_img, bg_path, rarity):
    """Composite creature onto official tazo background."""
    # Load background
    bg = Image.open(bg_path).convert("RGBA")
    
    # Resize creature to fit disc center (leave room for border elements)
    creature_max = int(DISC_RADIUS * 1.8)  # ~900px, fits within 1000px inner area
    creature = creature_img.resize((creature_max, creature_max), Image.LANCZOS)
    
    # Center creature on the 1254×1254 canvas
    offset = (CANVAS - creature_max) // 2
    offset_y = offset - 20  # slight upward shift
    
    # Circular mask
    mask_size = creature_max
    mask = Image.new("L", (mask_size, mask_size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse([4, 4, mask_size-5, mask_size-5], fill=255)  # slight padding
    
    # Create creature layer on transparent canvas
    creature_layer = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    
    # Paste creature with circular mask
    creature_layer.paste(creature, (offset, offset_y), mask)
    
    # Composite: background first, then creature on top
    result = Image.alpha_composite(bg, creature_layer)
    
    # Add rarity stars
    result = add_rarity_overlay(result, rarity)
    
    return result

def find_no_bg(creature_id):
    """Find no-bg art for a creature."""
    slug_dir = NOBG_DIR.glob(f"*/{creature_id}-*")
    for d in slug_dir:
        pngs = list(d.glob(f"{creature_id}-v01.png"))
        if pngs:
            return pngs[0]
    # Fallback: search flatter
    for line_dir in NOBG_DIR.iterdir():
        if line_dir.is_dir():
            for sub in line_dir.iterdir():
                if sub.is_dir() and creature_id in str(sub):
                    pngs = list(sub.glob("*.png"))
                    if pngs:
                        return pngs[0]
    return None

def main():
    creatures_path = PROJECT / "artgen" / "creatures.json"
    with open(creatures_path) as f:
        data = json.load(f)
    
    creatures = data["creatures"]
    db = sqlite3.connect(str(DB_PATH))
    
    processed = 0
    skipped = 0
    
    for i, c in enumerate(creatures):
        creature_id = c["id"]
        name = c["name"]
        line = c["line"]
        rarity = c.get("rarity", "common")
        
        # Franchise slug
        fslug = "draco-bell" if line == "draco-bell" else line
        
        # Find no-bg art
        nobg = find_no_bg(creature_id)
        if not nobg:
            print(f"  [{i+1}/{len(creatures)}] {name}: NO NO-BG → skipped")
            skipped += 1
            continue
        
        try:
            creature_img = Image.open(nobg).convert("RGBA")
        except Exception as e:
            print(f"  [{i+1}/{len(creatures)}] {name}: OPEN ERROR → skipped")
            skipped += 1
            continue
        
        # Pick background
        bg_file = pick_background(fslug, rarity)
        bg_path = BG_DIR / bg_file
        if not bg_path.exists():
            print(f"  [{i+1}/{len(creatures)}] {name}: BG NOT FOUND ({bg_file}) → skipped")
            skipped += 1
            continue
        
        # Composite
        try:
            result = composite_tazo(creature_img, bg_path, rarity)
        except Exception as e:
            print(f"  [{i+1}/{len(creatures)}] {name}: COMPOSITE ERROR ({e}) → skipped")
            skipped += 1
            continue
        
        # Save
        dest_dir = DEST_DIR / fslug
        dest_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate output filename: franchise-prefix-number
        prefix_map = {"minimon": "m", "cybermon": "c", "draco-bell": "d"}
        prefix = prefix_map.get(fslug, "x")
        
        # Extract number from creature_id or hash name
        parts = creature_id.split("-")
        num = parts[-1] if parts else "001"
        
        slug_out = f"{fslug}-{prefix}-{num}"
        dest_path = dest_dir / f"{slug_out}.png"
        
        # Convert to RGB for PNG if needed
        if result.mode == "RGBA":
            result = result.convert("RGB")
        
        result.save(dest_path, "PNG", optimize=True)
        
        # Update DB
        image_url = f"/tazos-generated/{fslug}/{slug_out}.png"
        
        cur = db.execute("SELECT id FROM Tazo WHERE name = ?", (name,))
        row = cur.fetchone()
        
        if row:
            db.execute(
                "UPDATE Tazo SET imageUrl = ?, rarity = ? WHERE id = ?",
                (image_url, rarity, row[0])
            )
            print(f"  [{i+1}/{len(creatures)}] {name} → {image_url}")
        else:
            print(f"  [{i+1}/{len(creatures)}] {name} → {image_url} (DB: not found)")
        
        processed += 1
    
    db.commit()
    db.close()
    
    print(f"\n✅ Done: {processed} composited, {skipped} skipped")
    print(f"📁 Output: {DEST_DIR}/")

if __name__ == "__main__":
    main()
