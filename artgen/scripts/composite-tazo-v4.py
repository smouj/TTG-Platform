#!/usr/bin/env python3
"""
Composite Tazo Generator v4 — Unified with tazo-art-studio & admin creator.
ALIGNED with:
  - smouj/tazo-art-studio (reference implementation)
  - TTG admin /api/admin/tazo-art (Next.js production)
  
Key specs (shared across all 3 systems):
  - Official tazo-art-studio backgrounds (1254×1254, franchise-specific)
  - Creature at 65% of canvas → 815px (matches Sharp composite in JS)
  - Random BG selection (matches tazo-art-studio)
  - RGBA output (preserves alpha)
  - Optional back side generation
  - Deterministic filename: {franchise}-{prefix}-{number}.png
"""

import json, os, sqlite3, math, random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

PROJECT = Path("/home/smouj/apps/ttg/Trading-Tazos-Game") if os.path.exists("/home/smouj/apps") else \
          Path("/home/smouj/.openclaw/workspace/Trading-Tazos-Game")

NOBG_DIR = PROJECT / "artgen" / "nobg"
BG_DIR = PROJECT / "public" / "tazo-assets" / "frontal"
BACK_DIR = PROJECT / "public" / "tazo-assets" / "back"
DEST_DIR = PROJECT / "public" / "tazos-generated"
DB_PATH = PROJECT / "prisma" / "dev.db"

CANVAS = 1254
CENTER = CANVAS // 2  # 627
CHARACTER_SIZE = math.floor(CANVAS * 0.65)  # 815px — matches tazo-art-studio

# ── Franchise config (matches admin route.ts exactly) ──
FRANCHISE_CONFIG = {
    "minimon":  {"name": "Minimon",  "primary": (255, 203, 5),   "prefix": "m", "slug": "minimon"},
    "cybermon": {"name": "Cybermon", "primary": (0, 161, 233),   "prefix": "c", "slug": "cybermon"},
    "dracobell": {"name": "Dracobell", "primary": (255, 107, 0), "prefix": "d", "slug": "dracobell"},
}

# ── Background files (matches tazo-art-studio FRONTAL_BG_FILES) ──
FRONTAL_BG_FILES = {
    "minimon":   ["minimon-01.png", "minimon-02.png", "minimon-03.png",
                  "minimon-04.png", "minimon-05.png", "minimon-06.png"],
    "cybermon":  ["cybermon-01.png", "cybermon-02.png", "cybermon-03.png"],
    "dracobell": ["dracobell-01.png", "dracobell-02.png", "dracobell-03.png", "dracobell-04.png"],
}

BACK_BG_FILES = {
    "minimon":   "back-minimon.png",
    "cybermon":  "back-cybermon.png",
    "dracobell": "back-dracobell.png",
}

# ── Rarity config (matches RARITIES in admin tazo-creator) ──
RARITY_STARS = {
    "common": 1, "uncommon": 2, "rare": 3, "epic": 4, "ultra": 5, "ultra-rare": 5, "legendary": 5,
}
RARITY_COLORS = {
    "common":     (156, 163, 175),  # #9CA3AF
    "uncommon":   (34, 197, 94),    # #22C55E
    "rare":       (59, 130, 246),   # #3B82F6
    "epic":       (168, 85, 247),   # #A855F7
    "ultra":      (255, 107, 0),    # #FF6B00
    "ultra-rare": (168, 85, 247),   # #A855F7
    "legendary":  (251, 191, 36),   # #FBBF24
}

def pick_background(franchise_slug, rarity):
    """Random background selection (matches tazo-art-studio behavior)."""
    variants = FRONTAL_BG_FILES.get(franchise_slug, ["cybermon-01.png"])
    return random.choice(variants)

def draw_star(draw, cx, cy, r, color):
    """5-pointed star."""
    pts = []
    for i in range(5):
        outer_a = -math.pi / 2 + (i * 2 * math.pi) / 5
        inner_a = outer_a + math.pi / 5
        pts.append((cx + r * math.cos(outer_a), cy + r * math.sin(outer_a)))
        pts.append((cx + r * 0.4 * math.cos(inner_a), cy + r * 0.4 * math.sin(inner_a)))
    draw.polygon(pts, fill=color, outline=(20, 20, 20))

def add_rarity_overlay(img, rarity):
    """Add rarity stars arc to bottom of tazo."""
    stars = RARITY_STARS.get(rarity, 1)
    color = RARITY_COLORS.get(rarity, (156, 163, 175))
    overlay = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    star_r = CANVAS * 0.37  # ~464px from center
    start_angle = -math.pi / 2 - (stars - 1) * math.pi / 10
    for i in range(stars):
        angle = start_angle + i * math.pi / 5
        sx = CENTER + star_r * math.cos(angle)
        sy = CENTER + star_r * math.sin(angle) + 180
        # Double-draw for thickness
        for size in [26, 28]:
            draw_star(draw, sx, sy, size, color)
    return Image.alpha_composite(img.convert("RGBA"), overlay)

def composite_tazo(creature_img, bg_path, rarity):
    """Composite creature onto official background — matches Sharp composite in JS."""
    bg = Image.open(bg_path).convert("RGBA")
    bg_size = bg.width  # 1254

    # Resize creature to 65% of background (matches tazo-art-studio)
    creature = creature_img.resize((CHARACTER_SIZE, CHARACTER_SIZE), Image.LANCZOS)

    # Center creature
    offset = (bg_size - CHARACTER_SIZE) // 2

    # Circular mask for clean edge
    mask = Image.new("L", (CHARACTER_SIZE, CHARACTER_SIZE), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse([4, 4, CHARACTER_SIZE - 5, CHARACTER_SIZE - 5], fill=255)

    # Creature layer on transparent canvas
    creature_layer = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    creature_layer.paste(creature, (offset, offset), mask)

    # Composite: bg first, creature on top
    result = Image.alpha_composite(bg, creature_layer)

    # Add rarity stars
    result = add_rarity_overlay(result, rarity)

    return result

def generate_back_side(franchise_slug, name, rarity):
    """Generate back side with official back design + name overlay."""
    back_file = BACK_BG_FILES.get(franchise_slug)
    if not back_file:
        return None

    back_path = BACK_DIR / back_file
    if not back_path.exists():
        return None

    f = FRANCHISE_CONFIG.get(franchise_slug, FRANCHISE_CONFIG["minimon"])
    back = Image.open(back_path).convert("RGBA")
    
    # Back images are 1024×1024 — use actual size
    back_w, back_h = back.size
    back_cx = back_w // 2

    # Create text overlay matching back image size
    overlay = Image.new("RGBA", (back_w, back_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Font sizes proportional to back image
    font_size_lg = max(28, back_w // 14)
    font_size_sm = max(20, back_w // 21)

    try:
        font_lg = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size_lg)
        font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size_sm)
    except:
        font_lg = ImageFont.load_default()
        font_sm = ImageFont.load_default()

    # Name at bottom-center
    name_text = name.upper()
    bbox = draw.textbbox((0, 0), name_text, font=font_lg)
    tw = bbox[2] - bbox[0]
    draw.text((back_cx - tw // 2, int(back_h * 0.72)), name_text,
              fill=(255, 255, 255, 230), font=font_lg)

    # Rarity below name
    rarity_text = f"✦ {rarity.upper()} ✦"
    bbox2 = draw.textbbox((0, 0), rarity_text, font=font_sm)
    tw2 = bbox2[2] - bbox2[0]
    r, g, b_val = f["primary"]
    draw.text((back_cx - tw2 // 2, int(back_h * 0.80)), rarity_text,
              fill=(r, g, b_val, 200), font=font_sm)

    return Image.alpha_composite(back, overlay)

def find_no_bg(creature_id):
    """Find no-bg art for a creature (matches artgen pipeline)."""
    # Direct glob: */{creature_id}-*/{creature_id}-v02.png
    slug_dirs = list(NOBG_DIR.glob(f"*/{creature_id}-*"))
    for d in slug_dirs:
        for ver in ["v02", "v01"]:
            pngs = list(d.glob(f"{creature_id}-{ver}.png"))
            if pngs:
                return pngs[0]

    # Fallback: deep search
    for png in NOBG_DIR.glob(f"**/{creature_id}-*.png"):
        return png

    return None

def main():
    try:
        return _main_impl()
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        return 1

def _main_impl():
    creatures_path = PROJECT / "artgen" / "creatures.json"
    if not creatures_path.exists():
        print(f"ERROR: {creatures_path} not found")
        return 1

    with open(creatures_path) as f:
        data = json.load(f)

    creatures = data.get("creatures", data) if isinstance(data, dict) else data

    db = None
    try:
        db = sqlite3.connect(str(DB_PATH), timeout=10)
        db.execute("PRAGMA journal_mode=WAL")
    except:
        pass

    processed = 0
    skipped = 0
    back_generated = 0

    for i, c in enumerate(creatures):
        creature_id = c["id"]
        name = c["name"]
        line = c.get("line", c.get("franchise", "cybermon"))
        rarity = c.get("rarity", "common")

        # Normalize franchise → folder slug (matches admin route)
        fslug = line.lower()
        if fslug == "draco-bell":
            fslug = "dracobell"

        fconfig = FRANCHISE_CONFIG.get(fslug)
        if not fconfig:
            print(f"  [{i+1}/{len(creatures)}] {name}: UNKNOWN FRANCHISE ({fslug}) → skipped")
            skipped += 1
            continue

        # Find no-bg art
        nobg = find_no_bg(creature_id)
        if not nobg:
            skipped += 1
            continue

        try:
            creature_img = Image.open(nobg).convert("RGBA")
        except:
            skipped += 1
            continue

        # Pick background (random — matches tazo-art-studio)
        bg_file = pick_background(fslug, rarity)
        bg_path = BG_DIR / fslug / bg_file

        if not bg_path.exists():
            skipped += 1
            continue

        # Composite
        try:
            result = composite_tazo(creature_img, bg_path, rarity)
        except Exception as e:
            skipped += 1
            continue

        # ── Save front ──
        dest_dir = DEST_DIR / fslug
        dest_dir.mkdir(parents=True, exist_ok=True)

        # Extract number from creature_id (e.g., "cybermon-c-156" → "c-156")
        prefix = fconfig["prefix"]
        parts = creature_id.split("-")
        num = parts[-1] if parts else "001"

        if len(parts) > 1 and parts[-2] == prefix:
            slug_out = f"{fslug}-{prefix}-{num}"
        else:
            slug_out = f"{fslug}-{prefix}-{num}"

        dest_path = dest_dir / f"{slug_out}.png"

        # Skip if already generated (idempotent re-runs)
        if dest_path.exists():
            # Back side may still be missing
            back_path_check = dest_dir / "back" / f"{slug_out}-back.png"
            if not back_path_check.exists():
                # Only need to generate back side
                try:
                    back = generate_back_side(fslug, name, rarity)
                    if back:
                        back_dir = dest_dir / "back"
                        back_dir.mkdir(parents=True, exist_ok=True)
                        back.save(back_path_check, "PNG", optimize=True)
                        back_url = f"/tazos-generated/{fslug}/back/{slug_out}-back.png"
                        back_generated += 1
                except:
                    pass
            processed += 1
            continue

        result.save(dest_path, "PNG", optimize=True)

        image_url = f"/tazos-generated/{fslug}/{slug_out}.png"

        # ── Generate back side ──
        back_url = None
        try:
            back = generate_back_side(fslug, name, rarity)
            if back:
                back_dir = dest_dir / "back"
                back_dir.mkdir(parents=True, exist_ok=True)
                back_path = back_dir / f"{slug_out}-back.png"
                back.save(back_path, "PNG", optimize=True)
                back_url = f"/tazos-generated/{fslug}/back/{slug_out}-back.png"
                back_generated += 1
        except Exception as e:
            pass  # back side is non-critical

        # ── Update DB ──
        if db:
            try:
                cur = db.execute("SELECT id FROM Tazo WHERE name = ?", (name,))
                row = cur.fetchone()
                if row:
                    if back_url:
                        db.execute(
                            "UPDATE Tazo SET imageUrl = ?, rarity = ?, backImageUrl = ? WHERE id = ?",
                            (image_url, rarity, back_url, row[0])
                        )
                    else:
                        db.execute(
                            "UPDATE Tazo SET imageUrl = ?, rarity = ? WHERE id = ?",
                            (image_url, rarity, row[0])
                        )
                db.commit()
            except Exception as e:
                pass  # DB is non-critical for image generation

        if (processed + 1) % 10 == 0 or (processed + 1) == 1:
            status = f"[{processed+1}/{len(creatures)}] {name} → {slug_out}.png"
            if back_url:
                status += " (+back)"
            print(f"  {status}")
        processed += 1

    if db:
        try:
            db.commit()
        except:
            pass
        try:
            db.close()
        except:
            pass

    print(f"\n✅ Done: {processed} composited, {skipped} skipped, {back_generated} backs")
    print(f"📁 Output: {DEST_DIR}/")

    return 0

if __name__ == "__main__":
    exit(main())
