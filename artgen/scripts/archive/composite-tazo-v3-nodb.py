#!/usr/bin/env python3
"""
Composite Tazo Generator v3 — NO DB VERSION (just images).
Same as v3 but skips database updates to avoid locks.
"""

import json, os, math
from pathlib import Path
from PIL import Image, ImageDraw

PROJECT = Path("/home/smouj/apps/ttg/Trading-Tazos-Game")
NOBG_DIR = PROJECT / "artgen" / "nobg"
BG_DIR = PROJECT / "public" / "tazo-assets" / "frontal"
DEST_DIR = PROJECT / "public" / "tazos-generated"

CANVAS = 1254
CENTER = CANVAS // 2
DISC_RADIUS = 500

FRANCHISE_BG = {
    "minimon": ["minimon-01.png", "minimon-02.png", "minimon-03.png",
                "minimon-04.png", "minimon-05.png", "minimon-06.png"],
    "cybermon": ["cybermon-01.png", "cybermon-02.png", "cybermon-03.png"],
    "draco-bell": ["dracobell-01.png", "dracobell-02.png", "dracobell-03.png", "dracobell-04.png"],
}

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
    variants = FRANCHISE_BG.get(franchise_slug, ["cybermon-01.png"])
    rarity_idx = list(RARITY_STARS.keys()).index(rarity) if rarity in RARITY_STARS else 0
    idx = rarity_idx % len(variants)
    return variants[idx]

def draw_star(draw, cx, cy, r, color):
    pts = []
    for i in range(5):
        outer_a = -math.pi/2 + (i * 2 * math.pi) / 5
        inner_a = outer_a + math.pi / 5
        pts.append((cx + r * math.cos(outer_a), cy + r * math.sin(outer_a)))
        pts.append((cx + r * 0.4 * math.cos(inner_a), cy + r * 0.4 * math.sin(inner_a)))
    draw.polygon(pts, fill=color, outline=(20, 20, 20))

def add_rarity_overlay(img, rarity):
    stars = RARITY_STARS.get(rarity, 1)
    color = RARITY_COLORS.get(rarity, (156, 163, 175))
    overlay = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    star_r = DISC_RADIUS * 0.75
    start_angle = -math.pi / 2 - (stars - 1) * math.pi / 10
    for i in range(stars):
        angle = start_angle + i * math.pi / 5
        sx = CENTER + star_r * math.cos(angle)
        sy = CENTER + star_r * math.sin(angle) + 205
        draw_star(draw, sx, sy, 26, color)
        draw_star(draw, sx, sy, 28, color)
    return Image.alpha_composite(img.convert("RGBA"), overlay)

def composite_tazo(creature_img, bg_path, rarity):
    bg = Image.open(bg_path).convert("RGBA")
    creature_max = int(DISC_RADIUS * 1.8)
    creature = creature_img.resize((creature_max, creature_max), Image.LANCZOS)
    offset = (CANVAS - creature_max) // 2
    offset_y = offset - 20
    mask_size = creature_max
    mask = Image.new("L", (mask_size, mask_size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse([4, 4, mask_size-5, mask_size-5], fill=255)
    creature_layer = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    creature_layer.paste(creature, (offset, offset_y), mask)
    result = Image.alpha_composite(bg, creature_layer)
    result = add_rarity_overlay(result, rarity)
    return result

def find_no_bg(creature_id):
    slug_dir = NOBG_DIR.glob(f"*/{creature_id}-*")
    for d in slug_dir:
        pngs = list(d.glob(f"{creature_id}-v02.png")) or list(d.glob(f"{creature_id}-v01.png"))
        if pngs:
            return pngs[0]
    for line_dir in NOBG_DIR.iterdir():
        if line_dir.is_dir():
            for sub in line_dir.iterdir():
                if sub.is_dir() and creature_id in str(sub):
                    for pat in [f"{creature_id}-v02.png", f"{creature_id}-v01.png", "*.png"]:
                        pngs = list(sub.glob(pat))
                        if pngs:
                            return pngs[0]
                    return None
    return None

def main():
    creatures_path = PROJECT / "artgen" / "creatures.json"
    with open(creatures_path) as f:
        data = json.load(f)
    creatures = data["creatures"]
    processed = 0
    skipped = 0
    
    for c in creatures:
        creature_id = c["id"]
        name = c["name"]
        line = c["line"]
        rarity = c.get("rarity", "common")
        # Map line → franchise folder: draco-bell line uses dracobell folder
        fslug = "dracobell" if line == "draco-bell" else line
        
        nobg = find_no_bg(creature_id)
        if not nobg:
            skipped += 1
            continue
        
        try:
            creature_img = Image.open(nobg).convert("RGBA")
        except:
            skipped += 1
            continue
        
        bg_file = pick_background(fslug, rarity)
        bg_path = BG_DIR / fslug / bg_file
        
        if not bg_path.exists():
            skipped += 1
            continue
        
        try:
            result = composite_tazo(creature_img, bg_path, rarity)
        except:
            skipped += 1
            continue
        
        dest_dir = DEST_DIR / fslug
        dest_dir.mkdir(parents=True, exist_ok=True)
        # Output filename: dracobell uses original ID (dracobell-001, etc.)
        slug_out = creature_id if line == "draco-bell" else creature_id
        dest_path = dest_dir / f"{slug_out}.png"
        result.save(dest_path, "PNG", optimize=True)
        
        if (processed + 1) % 10 == 0 or (processed + 1) == 1:
            print(f"  [{processed+1}] {name} → {slug_out}.png")
        processed += 1
    
    print(f"\nDone: {processed} composited, {skipped} skipped")
    print(f"Output: {DEST_DIR}/")

if __name__ == "__main__":
    main()
