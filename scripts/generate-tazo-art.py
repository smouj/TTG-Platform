#!/usr/bin/env python3
"""
Trading Tazos Game — Premium Tazo Art Generator v2.1
Composites franchise-specific background textures with character art.
Generates 1024x1024 PNG tazo disc images.

NOW READS tazo-layouts.json for user-configured element positions.

Backgrounds (from frontal-bg-tazos):
  - minimon: 6 backgrounds (01-06) — assigned by number % 6
  - cybermon: 3 backgrounds (evo-1, evo-2, evo-3) — mapped by transformStage / evolution
  - dracobell: 4 backgrounds (01-04) — assigned by number % 4
  - special: 1 background — for legendary + ultra rarity across all franchises
"""

import sqlite3, os, math, random, sys, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT_DIR = Path("public/tazos-generated")
OUT_BASE_DIR = Path("public/tazos-base")
BG_DIR = Path("scripts/tazo-backgrounds")
CREATURE_DIR = Path("scripts/tazo-creatures")
LAYOUTS_PATH = Path("prisma/tazo-layouts.json")
SIZE = 1024
CENTER = SIZE // 2
RADIUS = 440  # Leave breathing room

FRANCHISE = {
    "minimon": {
        "primary": (255, 203, 5),
        "secondary": (34, 197, 94),
        "dark": (124, 45, 18),
        "accent": (34, 197, 94),
        "bg_light": (252, 252, 240),
        "bg_mid": (240, 250, 230),
        "text_dark": (26, 26, 26),
        "text_light": (255, 255, 255),
        "collection": "MINIMON TAZOS SERIES 1",
        "ring_colors": [(255,203,5), (34,197,94), (124,45,18)],
        "type_colors": {
            "fire":(239,68,68),"water":(59,130,246),"grass":(34,197,94),
            "electric":(250,204,21),"psychic":(236,72,153),"ghost":(124,58,237),
            "dragon":(249,115,22),"normal":(156,163,175),
        }
    },
    "cybermon": {
        "primary": (0, 161, 233),
        "secondary": (0, 87, 183),
        "dark": (30, 58, 95),
        "accent": (6, 182, 212),
        "bg_light": (220, 245, 255),
        "bg_mid": (190, 230, 250),
        "text_dark": (26, 26, 26),
        "text_light": (255, 255, 255),
        "collection": "CYBERMON DIGI-TAZOS 2000",
        "ring_colors": [(0,161,233), (0,87,183), (30,58,95)],
        "type_colors": {
            "data":(0,161,233),"virus":(139,92,246),
            "vaccine":(34,197,94),"free":(156,163,175),
        }
    },
    "dracobell": {
        "primary": (255, 107, 0),
        "secondary": (204, 68, 0),
        "dark": (124, 45, 18),
        "accent": (227, 53, 13),
        "bg_light": (255, 245, 225),
        "bg_mid": (255, 230, 200),
        "text_dark": (26, 26, 26),
        "text_light": (255, 255, 255),
        "collection": "DRACOBELL MASTER SERIES",
        "ring_colors": [(255,107,0), (204,68,0), (124,45,18)],
        "type_colors": {
            "saiyan":(227,53,13),"namekian":(34,197,94),
            "human":(245,158,11),"android":(139,92,246),"fusion":(236,72,153),
        }
    },
}

RARITY = {
    "common":    {"border":(156,163,175),"stars":1,"glow":None},
    "uncommon":  {"border":(34,197,94),"stars":2,"glow":(34,197,94)},
    "rare":      {"border":(59,130,246),"stars":3,"glow":(59,130,246)},
    "ultra":     {"border":(168,85,247),"stars":4,"glow":(168,85,247)},
    "legendary": {"border":(251,191,36),"stars":5,"glow":(251,191,36)},
}

# ── Background loading ──

def load_backgrounds():
    """Load all backgrounds into a dict: { 'minimon-0': Image, ... }
    Backgrounds are resized to match the disc diameter (RADIUS*2), then centered
    on a square canvas, so they fill the circular disc perfectly without cropping."""
    bgs = {}
    disc_diameter = RADIUS * 2  # 880px — exact visible area
    for fname in sorted(os.listdir(BG_DIR)):
        if not fname.endswith('.png'):
            continue
        path = BG_DIR / fname
        img = Image.open(path).convert("RGBA")
        # Resize to disc diameter so background fills the full visible circle
        img = img.resize((disc_diameter, disc_diameter), Image.LANCZOS)
        # Center on the full canvas so the disc mask aligns perfectly
        canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        top_left = (CENTER - disc_diameter // 2, CENTER - disc_diameter // 2)
        canvas.paste(img, top_left)
        key = fname.replace('.png', '').replace('bg-frontal-tazo-', '')
        bgs[key] = canvas
    return bgs


def pick_background(tazo, bgs, number):
    """Pick the right background for a tazo based on franchise + number/evolution."""
    fs = tazo["franchise_slug"]
    rarity = tazo.get("rarity", "common")

    # Special/legendary across all franchises → special background
    if rarity in ("legendary", "ultra") and "all-special-01" in bgs:
        return bgs["all-special-01"]

    if fs == "minimon":
        # 6 backgrounds, distribute by number
        idx = (number - 1) % 6 + 1
        key = f"minimon-{idx:02d}"
        if key in bgs:
            return bgs[key]

    elif fs == "cybermon":
        # 3 evo backgrounds — map by transform stage or evolution chain depth
        stage = tazo.get("transformStage")
        evo = tazo.get("evolutionFrom")
        evo_to = tazo.get("evolutionTo")

        if stage and stage in ("1", "2", "3"):
            idx = int(stage)
        elif evo and evo_to:
            idx = 2  # Has both evolutionFrom and evolutionTo → middle
        elif evo_to and not evo:
            idx = 1  # Only evolutionTo → first stage
        elif evo and not evo_to:
            idx = 3  # Only evolutionFrom → final stage
        else:
            # No evolution data — distribute by number
            idx = ((number - 1) % 3) + 1

        idx = max(1, min(3, idx))
        key = f"cybermon-evo-{idx}"
        if key in bgs:
            return bgs[key]

    elif fs == "dracobell":
        # 4 backgrounds, distribute by number
        idx = (number - 1) % 4 + 1
        key = f"dracobell-{idx:02d}"
        if key in bgs:
            return bgs[key]

    return None


def circular_mask(img, blur=True):
    """Apply circular mask to make the background a perfect disc."""
    mask = Image.new("L", (SIZE, SIZE), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse(
        [CENTER - RADIUS, CENTER - RADIUS, CENTER + RADIUS, CENTER + RADIUS],
        fill=255
    )
    if blur:
        mask = mask.filter(ImageFilter.GaussianBlur(1))
    img.putalpha(mask)
    return img


def draw_star(draw, cx, cy, r, color, points=5):
    pts = []
    for i in range(points * 2):
        angle = -math.pi/2 + i * math.pi / points
        rad = r if i % 2 == 0 else r * 0.4
        pts.append((cx + math.cos(angle) * rad, cy + math.sin(angle) * rad))
    draw.polygon(pts, fill=color)


def get_fonts():
    try:
        base = "/usr/share/fonts/truetype/dejavu/"
        return {
            "small": ImageFont.truetype(base + "DejaVuSans-Bold.ttf", 22),
            "large": ImageFont.truetype(base + "DejaVuSans-Bold.ttf", 90),
            "medium": ImageFont.truetype(base + "DejaVuSans-Bold.ttf", 36),
            "number": ImageFont.truetype(base + "DejaVuSansMono-Bold.ttf", 28),
            "tiny": ImageFont.truetype(base + "DejaVuSans-Bold.ttf", 16),
        }
    except:
        d = ImageFont.load_default()
        return {k: d for k in ["small","large","medium","number","tiny"]}


def load_layouts():
    """Load user-configured element positions from tazo-layouts.json.
    Returns { "defaults": { franchise: { element: {x,y,scale} } }, "overrides": { slug: { element: {x,y,scale} } } }
    """
    if not LAYOUTS_PATH.exists():
        return {"defaults": {}, "overrides": {}}
    try:
        with open(LAYOUTS_PATH) as f:
            data = json.load(f)
        return {
            "defaults": data.get("defaults", {}),
            "overrides": data.get("overrides", {}),
        }
    except Exception as e:
        print(f"  ⚠️ Could not load layouts: {e}")
        return {"defaults": {}, "overrides": {}}


def get_layout_for_tazo(layouts, slug, franchise):
    """Get the layout config for a specific tazo.
    Checks overrides first (per-slug), then franchise defaults.
    Returns dict of { element_name: {x, y, scale} } or empty dict.
    """
    # Per-slug override wins
    overrides = layouts.get("overrides", {})
    if slug in overrides:
        return overrides[slug]
    # Then franchise default
    defaults = layouts.get("defaults", {})
    return defaults.get(franchise, {})


def generate_tazo(tazo, bgs, fonts, base_only=False, layouts=None):
    fs = tazo["franchise_slug"]
    fx = FRANCHISE.get(fs, FRANCHISE["minimon"])
    rz = RARITY.get(tazo.get("rarity", "common"), RARITY["common"])
    number = tazo.get("number", 1)
    name = tazo.get("displayName", tazo.get("name", "???"))
    collection = fx["collection"]
    combat_type = tazo.get("combatType")
    dark = fx["dark"]
    border_color = rz["border"]

    slug = tazo["slug"]

    # ── Load user-configured layout (or use fallback defaults) ──
    layout = get_layout_for_tazo(layouts or {}, slug, fs)
    # Helper: convert design coords (relative to center) → Python pixel coords
    def lx(elem, default_px=CENTER):
        """Get X pixel position for element from layout, or return default_px"""
        e = layout.get(elem, {})
        return CENTER + e.get("x", default_px - CENTER)
    def ly(elem, default_px=CENTER):
        """Get Y pixel position for element from layout, or return default_px"""
        e = layout.get(elem, {})
        return CENTER + e.get("y", default_px - CENTER)
    # Use layout scale if available (1.0 means 100%)
    def ls(elem, default_scale=1.0):
        e = layout.get(elem, {})
        return e.get("scale", default_scale)
    rng = random.Random(hash(slug) & 0xFFFFFFFF)

    # ── Pick background texture ──
    raw_number = str(tazo.get("number", "1"))
    try:
        number = int(raw_number)
    except (ValueError, TypeError):
        number = abs(hash(raw_number)) % 200 + 1  # stable hash-based number

    bg = pick_background(tazo, bgs, number)

    if bg:
        img = bg.copy()
    else:
        # Fallback: solid gradient if no background available
        img = Image.new("RGBA", (SIZE, SIZE), fx["bg_light"])

    draw = ImageDraw.Draw(img)

    # ── Circular mask ──
    img = circular_mask(img)

    # If using a background, add a subtle dark overlay at edges for depth
    if bg:
        edge_overlay = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        edge_draw = ImageDraw.Draw(edge_overlay)
        # Radial gradient from transparent center to dark edge
        for r_frac in range(75, 100, 2):
            r = int(RADIUS * r_frac / 100.0)
            alpha = int(180 * ((r_frac - 75) / 25.0))  # 0→180 alpha
            edge_draw.ellipse(
                [CENTER - r, CENTER - r, CENTER + r, CENTER + r],
                outline=(0, 0, 0, alpha), width=2
            )
        img = Image.alpha_composite(img, edge_overlay)
        draw = ImageDraw.Draw(img)

    # ── Creature/Character availability ──
    creature_path = CREATURE_DIR / fs / f"{slug}.png"
    has_creature = creature_path.exists()

    # ── Rings (from outside in) ──
    R = RADIUS
    # Black outer border (tazo disc edge)
    draw.ellipse([CENTER-R-12, CENTER-R-12, CENTER+R+12, CENTER+R+12],
                 outline=(18,18,18), width=8)
    # Rarity-colored ring
    draw.ellipse([CENTER-R-5, CENTER-R-5, CENTER+R+5, CENTER+R+5],
                 outline=border_color, width=8)
    # Dark inner separator
    draw.ellipse([CENTER-R+6, CENTER-R+6, CENTER+R-6, CENTER+R-6],
                 outline=(26,26,26), width=3)

    # Decorative rings
    for offset, w, color, alpha in [
        (16, 2, (255,255,255), 180),
        (26, 3, fx["ring_colors"][1], 200),
        (36, 1, (255,255,255), 120),
    ]:
        draw.ellipse([
            CENTER - R + offset, CENTER - R + offset,
            CENTER + R - offset, CENTER + R - offset,
        ], outline=color + (alpha,), width=w)

    # Dots ring
    for i in range(24):
        angle = i * 2*math.pi / 24
        dx = CENTER + math.cos(angle) * (R - 48)
        dy = CENTER + math.sin(angle) * (R - 48)
        dot_c = fx["ring_colors"][rng.randint(0, 2)]
        draw.ellipse([dx-3, dy-3, dx+3, dy+3], fill=dot_c + (140,))

    # ── Inner disc area (subtle overlay for text readability) ──
    inner_r = R - 70
    inner_badge = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    inner_draw = ImageDraw.Draw(inner_badge)
    if bg:
        # Very subtle — let creature art and background texture dominate
        inner_draw.ellipse([
            CENTER - inner_r, CENTER - inner_r,
            CENTER + inner_r, CENTER + inner_r,
        ], fill=fx["bg_light"] + (40,))
    else:
        inner_draw.ellipse([
            CENTER - inner_r, CENTER - inner_r,
            CENTER + inner_r, CENTER + inner_r,
        ], fill=fx["bg_light"] + (160,))
    img = Image.alpha_composite(img, inner_badge)
    draw = ImageDraw.Draw(img)

    # Inner border
    draw.ellipse([
        CENTER - inner_r, CENTER - inner_r,
        CENTER + inner_r, CENTER + inner_r,
    ], outline=dark + (200,), width=4)

    # ── Core area — subtle stripes ──
    core_r = inner_r - 20
    if not bg:
        stripe_overlay = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        stripe_draw = ImageDraw.Draw(stripe_overlay)
        for i in range(6):
            angle = i * math.pi / 3 + rng.random() * 0.3
            x1 = CENTER + math.cos(angle) * core_r * 0.6
            y1 = CENTER + math.sin(angle) * core_r * 0.6
            x2 = CENTER + math.cos(angle) * core_r
            y2 = CENTER + math.sin(angle) * core_r
            c = fx["ring_colors"][i % 3]
            stripe_draw.line([(x1, y1), (x2, y2)], fill=c + (40,), width=30)
        img = Image.alpha_composite(img, stripe_overlay)
        draw = ImageDraw.Draw(img)

    # ── Center shine (subtle highlight on upper half) ──
    shine_overlay = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    shine_draw = ImageDraw.Draw(shine_overlay)
    shine_draw.ellipse([
        CENTER - core_r*0.5, CENTER - core_r*0.5 - 30,
        CENTER + core_r*0.5, CENTER + core_r*0.5 - 30,
    ], fill=(255, 255, 255, 30))
    img = Image.alpha_composite(img, shine_overlay)
    draw = ImageDraw.Draw(img)

    # ── Creature/Character compositing ──
    # Draw after the translucent inner badge/shine so creature art stays vivid.
    if has_creature:
        creature = Image.open(creature_path).convert("RGBA")
        alpha_bbox = creature.getchannel("A").getbbox()
        if alpha_bbox:
            creature = creature.crop(alpha_bbox)

        creature_area = int(RADIUS * 0.88)
        cw, ch = creature.size
        scale_factor = min(creature_area / cw, creature_area / ch)
        new_w = int(cw * scale_factor)
        new_h = int(ch * scale_factor)
        creature = creature.resize((new_w, new_h), Image.LANCZOS)

        cx = CENTER - new_w // 2
        cy = CENTER - new_h // 2 - 25
        temp = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        temp.paste(creature, (cx, cy), creature)
        img = Image.alpha_composite(img, temp)

        # Clip creature to disc boundary so all tazos have the same size
        # Use RADIUS+20 so outer border rings survive the clip
        clip_r = RADIUS + 20
        disc_mask = Image.new("L", (SIZE, SIZE), 0)
        mask_draw = ImageDraw.Draw(disc_mask)
        mask_draw.ellipse(
            [CENTER - clip_r, CENTER - clip_r, CENTER + clip_r, CENTER + clip_r],
            fill=255
        )
        clipped = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        clipped.paste(img, (0, 0), disc_mask)
        img = clipped
        draw = ImageDraw.Draw(img)

    # ── Text: Collection name (top) ──
    if not base_only:
        coll_bbox = draw.textbbox((0, 0), collection, font=fonts["small"])
        cw = coll_bbox[2] - coll_bbox[0]
        cy = ly("collection", 65)  # default: y=65 from top
        draw.text((CENTER - cw//2, cy), collection, fill=fx["text_light"],
                  font=fonts["small"], stroke_width=2, stroke_fill=dark)

    # ── Character Letter(s) — with dark background pill for readability ──
    # Only show letter placeholder when no creature art exists
    if not base_only and not has_creature:
        letters = ''.join([w[0] for w in name.split() if w])[:2]
        if not letters:
            letters = name[:2] if len(name) >= 2 else name[0]

        lbbox = draw.textbbox((0, 0), letters, font=fonts["large"])
        lw, lh = lbbox[2] - lbbox[0], lbbox[3] - lbbox[1]

        # Semi-transparent pill behind the letter for contrast over textures
        if bg:
            pad_x, pad_y = 30, 20
            draw.rounded_rectangle([
                CENTER - lw//2 - pad_x, CENTER - lh//2 - 20 - pad_y,
                CENTER + lw//2 + pad_x, CENTER + lh//2 - 20 + pad_y,
            ], radius=20, fill=(0, 0, 0, 90))

        # Glow
        if rz["glow"]:
            for o in range(6, 0, -2):
                draw.text((CENTER - lw//2 - o, CENTER - lh//2 - 20 - o), letters,
                          fill=rz["glow"] + (40,), font=fonts["large"])
                draw.text((CENTER - lw//2 + o, CENTER - lh//2 - 20 + o), letters,
                          fill=rz["glow"] + (40,), font=fonts["large"])

        draw.text((CENTER - lw//2, CENTER - lh//2 - 20), letters,
                  fill=fx["text_light"], font=fonts["large"],
                  stroke_width=5, stroke_fill=dark)

    # ── Type badge (ALL franchises) — user-positioned via layout ──
    if not base_only and combat_type and combat_type in fx.get("type_colors", {}):
        tc = fx["type_colors"][combat_type]
        type_text = combat_type.upper()
        tbbox = draw.textbbox((0, 0), type_text, font=fonts["small"])
        tw = tbbox[2] - tbbox[0]
        th = tbbox[3] - tbbox[1]
        bad_x = lx("badge", CENTER)
        bad_y = ly("badge", CENTER - RADIUS + 100)
        badge_scale = ls("badge", 1.0)
        pad_x = int(10 * badge_scale)
        pad_y = int(10 * badge_scale)
        # Scale the badge rectangle
        bw = int((tw + pad_x * 2) * badge_scale)
        bh = int((th + pad_y * 2) * badge_scale)
        draw.rounded_rectangle(
            [bad_x - bw//2, bad_y - bh//2,
             bad_x + bw//2, bad_y + bh//2],
            radius=int(14 * badge_scale), fill=tc + (230,), outline=dark, width=2
        )
        # Subtle inner glow on badge
        draw.rounded_rectangle(
            [bad_x - bw//2 + 2, bad_y - bh//2 + 2,
             bad_x + bw//2 - 2, bad_y + bh//2 - 2],
            radius=int(12 * badge_scale), outline=(255,255,255,60), width=1
        )
        draw.text((bad_x - tw//2, bad_y - th//2), type_text,
                  fill=(255,255,255), font=fonts["small"],
                  stroke_width=1, stroke_fill=dark)

    # ── Name at bottom — with solid background, user-positioned ──
    if not base_only:
        if len(name) > 14:
            sp = name.rfind(' ', 0, len(name)//2 + 4)
            if sp > 3:
                name_lines = [name[:sp], name[sp+1:]]
            else:
                name_lines = [name[:14], name[14:]]
        else:
            name_lines = [name]

        name_y = ly("name", CENTER + RADIUS - 65)
        name_scale = ls("name", 1.0)
        name_font_size = int(36 * name_scale) if name_scale <= 1.5 else int(36 * 1.5)
        # Use the scaled font if possible, else fall back
        nfont = fonts["medium"]  # default 36pt
        for line in reversed(name_lines):
            nbbox = draw.textbbox((0, 0), line, font=nfont)
            nw = nbbox[2] - nbbox[0]
            pad = int(8 * name_scale)
            draw.rounded_rectangle(
                [CENTER - nw//2 - pad, name_y - 26 - pad,
                 CENTER + nw//2 + pad, name_y + pad],
                radius=int(14 * name_scale), fill=(255,255,255,240), outline=dark, width=3
            )
            draw.text((CENTER - nw//2, name_y - 26), line, fill=dark, font=nfont)
            name_y -= int(34 * name_scale)

    # ── Number badge (user-positioned) ──
    if not base_only:
        num_str = f"Nº {number}"
        nbbox2 = draw.textbbox((0, 0), num_str, font=fonts["tiny"])
        nw2 = nbbox2[2] - nbbox2[0]
        num_x = lx("number", CENTER + RADIUS - 130)
        num_y = ly("number", CENTER + RADIUS - 130)
        num_scale = ls("number", 1.0)
        nw2 = int(nw2 * num_scale)
        draw.rounded_rectangle(
            [num_x - nw2//2 - 6, num_y - 10 - 4, num_x + nw2//2 + 6, num_y + 10 + 4],
            radius=8, fill=(255,255,255,230), outline=dark, width=2
        )
        draw.text((num_x - nw2//2, num_y - 10), num_str, fill=dark, font=fonts["tiny"])

    # ── Rarity stars (user-positioned) ──
    if not base_only:
        star_r = int(8 * ls("rarity", 1.0))
        total_w = rz["stars"] * (star_r * 3 + 2)
        rar_x = lx("rarity", CENTER - total_w // 2)
        rar_y = ly("rarity", CENTER - inner_r + 35)
        for s in range(rz["stars"]):
            draw_star(draw, rar_x + s*(star_r*3+2) + star_r, rar_y, star_r, rz["border"])

    # ── Legendary burst ──
    if tazo.get("rarity") == "legendary":
        for _ in range(16):
            a = rng.random() * 2 * math.pi
            length = (inner_r - 40) * (0.4 + rng.random() * 0.6)
            x1 = CENTER + math.cos(a) * (inner_r * 0.25)
            y1 = CENTER + math.sin(a) * (inner_r * 0.25)
            x2 = CENTER + math.cos(a) * length
            y2 = CENTER + math.sin(a) * length
            draw.line([(x1, y1), (x2, y2)],
                      fill=(251,191,36,rng.randint(30,110)),
                      width=rng.randint(1,3))

    return img


def main():
    args = [a for a in sys.argv[1:] if a.startswith("-")]
    db_path = next((a for a in sys.argv[1:] if not a.startswith("-")), "prisma/dev.db")
    base_only = "--base-only" in args
    force = "--force" in args

    out_dir = Path("public/tazos-base") if base_only else OUT_DIR

    print(f"DB: {db_path}  base_only={base_only}  force={force}")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    tazos = [dict(r) for r in conn.execute(
        "SELECT t.number, t.slug, t.name, t.displayName, t.rarity, "
        "t.combatType, t.evolutionFrom, t.evolutionTo, t.transformStage, "
        "f.slug as franchise_slug "
        "FROM Tazo t JOIN Franchise f ON t.franchiseId = f.id "
        "WHERE t.publishStatus = 'published' "
        "ORDER BY f.slug, t.number"
    )]
    conn.close()
    print(f"Total tazos: {len(tazos)}")

    bgs = load_backgrounds()
    print(f"Backgrounds loaded: {len(bgs)}")
    for k in sorted(bgs.keys()):
        print(f"  {k}")

    fonts = get_fonts()

    # ── Load user-configured layouts ──
    layouts = load_layouts()
    if layouts["defaults"]:
        print(f"Layouts loaded: {len(layouts['defaults'])} franchise defaults, {len(layouts.get('overrides', {}))} overrides")
    else:
        print("⚠️ No layouts found — using hardcoded positions")

    generated, skipped = 0, 0

    for t in tazos:
        slug = t["slug"]
        fs = t["franchise_slug"]
        out = out_dir / fs / f"{slug}.png"
        if out.exists() and not force:
            skipped += 1
            continue
        out.parent.mkdir(parents=True, exist_ok=True)
        try:
            img = generate_tazo(t, bgs, fonts, base_only=base_only, layouts=layouts)
            img.save(str(out), "PNG", optimize=True)
            # Post-process with pngquant for 3-10x smaller files (falls back to PIL quantize)
            try:
                import subprocess, tempfile
                with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                    tmp_path = tmp.name
                subprocess.run(
                    ["pngquant", "--quality=45-75", "--speed=1", "--force",
                     "--output", tmp_path, str(out)],
                    check=True, capture_output=True, timeout=15
                )
                os.replace(tmp_path, str(out))
            except Exception:
                # Fallback: PIL quantize
                final = Image.open(str(out))
                if final.mode == "RGBA":
                    final = final.quantize(colors=256, method=2,
                        kmeans=1, dither=Image.Dither.FLOYDSTEINBERG)
                final.save(str(out), "PNG", optimize=True)
            generated += 1
        except Exception as e:
            print(f"  ERROR {slug}: {e}")
            continue
        if generated % 50 == 0:
            print(f"  ... {generated}/{len(tazos)}")

    print(f"\n=== Done: {generated} generated, {skipped} skipped, {len(tazos)} total ===")
    print(f"Output: {out_dir.absolute()}")


if __name__ == "__main__":
    main()
