#!/usr/bin/env python3
"""
Procedural Creature Art Generator
Creates stylized creature characters for all 349 tazos using geometric shapes and colors.
Output: scripts/tazo-creatures/{franchise}/{slug}.png (880x880 RGBA with transparency)
"""

import json, os, random, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).parent.parent
DATA_PATH = ROOT / "scripts" / "all-tazos.json"
OUT_DIR = ROOT / "scripts" / "tazo-creatures"

# Franchise color palettes
PALETTES = {
    "minimon": [
        ("#FF6B6B", "#FFB347", "#FFE66D"),  # warm
        ("#4ECDC4", "#45B7D1", "#96CEB4"),  # ocean
        ("#A8E6CF", "#DCEDC1", "#FFD3B6"),  # pastel
        ("#FF8C94", "#B8B8FF", "#F5B7B1"),  # soft
        ("#00B4D8", "#90E0EF", "#CAF0F8"),  # sky
        ("#F4A261", "#E76F51", "#E9C46A"),  # sunset
    ],
    "dracobell": [
        ("#E63946", "#F1FAEE", "#A8DADC"),  # fire
        ("#1D3557", "#457B9D", "#F1FAEE"),  # navy
        ("#2A9D8F", "#E9C46A", "#F4A261"),  # earth
        ("#264653", "#2A9D8F", "#E76F51"),  # forest
        ("#9B5DE5", "#F15BB5", "#FEE440"),  # neon
        ("#8338EC", "#FF006E", "#FB5607"),  # cyber
    ],
    "cybermon": [
        ("#00F5D4", "#00BBF9", "#9B5DE5"),  # synthwave
        ("#F15BB5", "#9B5DE5", "#00BBF9"),  # digital
        ("#2B9348", "#55A630", "#80B918"),  # circuit
        ("#0077B6", "#00B4D8", "#90E0EF"),  # tech blue
        ("#7209B7", "#3A0CA3", "#4361EE"),  # deep purple
        ("#FF006E", "#8338EC", "#3A86FF"),  # hot neon
    ],
}

def hsl_to_rgb(h, s, l):
    h = h % 360
    s, l = s/100, l/100
    c = (1 - abs(2*l - 1)) * s
    x = c * (1 - abs((h / 60) % 2 - 1))
    m = l - c/2
    r, g, b = [(c,x,0),(x,c,0),(0,c,x),(0,x,c),(x,0,c),(c,0,x)][int(h)//60 % 6]
    return int((r+m)*255), int((g+m)*255), int((b+m)*255)

def draw_creature(draw, size, color1, color2, color3, seed):
    """Draw a stylized creature character"""
    random.seed(seed)
    cx, cy = size/2, size/2
    r = size * 0.38

    # Body shape
    body_type = random.randint(0, 3)
    if body_type == 0:
        # Round body
        for i in range(3, 0, -1):
            cr = r - i*6
            shade = tuple(int(c*(1 - i*0.12)) for c in color1)
            draw.ellipse([cx-cr, cy-cr+size*0.08, cx+cr, cy+cr+size*0.08], fill=shade)
    elif body_type == 1:
        # Oval body
        draw.ellipse([cx-r*0.9, cy-r*0.7+size*0.08, cx+r*0.9, cy+r*0.8+size*0.08], fill=color1)
        # Lighter inner
        draw.ellipse([cx-r*0.65, cy-r*0.45+size*0.08, cx+r*0.65, cy+r*0.55+size*0.08], fill=color2)
    elif body_type == 2:
        # Angular/diamond body
        pts = [
            (cx, cy-r+size*0.08), (cx+r, cy+size*0.08),
            (cx, cy+r+size*0.08), (cx-r, cy+size*0.08)
        ]
        draw.polygon(pts, fill=color1)
        inner = [(cx, cy-r*0.55+size*0.08), (cx+r*0.6, cy+size*0.08),
                 (cx, cy+r*0.6+size*0.08), (cx-r*0.6, cy+size*0.08)]
        draw.polygon(inner, fill=color2)
    else:
        # Blob/irregular body
        blob_pts = []
        for a in range(0, 360, 30):
            rad = math.radians(a)
            rr = r * (0.7 + 0.3 * random.random())
            blob_pts.append((cx + math.cos(rad)*rr, cy + math.sin(rad)*rr + size*0.08))
        draw.polygon(blob_pts, fill=color1)

    # Eyes
    eye_y = cy - r*0.1 + size*0.05
    eye_r = r * 0.2
    eye_spacing = r * 0.35
    # White of eyes
    for sx in [-1, 1]:
        ex = cx + sx * eye_spacing
        draw.ellipse([ex-eye_r, eye_y-eye_r, ex+eye_r, eye_y+eye_r], fill=(255,255,255))
        # Pupil
        pupil_r = eye_r * 0.55
        pupil_x = ex + sx * eye_r * 0.2
        draw.ellipse([pupil_x-pupil_r, eye_y-pupil_r, pupil_x+pupil_r, eye_y+pupil_r], fill=(30,30,40))
        # Eye shine
        shine_r = pupil_r * 0.35
        draw.ellipse([pupil_x-pupil_r*0.3-shine_r, eye_y-pupil_r*0.6-shine_r,
                      pupil_x-pupil_r*0.3+shine_r, eye_y-pupil_r*0.6+shine_r], fill=(255,255,255))

    # Mouth
    mouth_y = cy + r*0.35 + size*0.04
    mouth_type = random.randint(0, 2)
    if mouth_type == 0:
        # Smile arc
        draw.arc([cx-r*0.3, mouth_y-r*0.25, cx+r*0.3, mouth_y+r*0.15], 0, 180, fill=(40,40,50), width=3)
    elif mouth_type == 1:
        # Open mouth
        draw.ellipse([cx-r*0.15, mouth_y-r*0.2, cx+r*0.15, mouth_y+r*0.1], fill=(40,40,50))
        draw.ellipse([cx-r*0.08, mouth_y-r*0.05, cx+r*0.08, mouth_y+r*0.05], fill=(200,80,80))
    else:
        # :3 mouth
        draw.ellipse([cx-r*0.08, mouth_y-r*0.05, cx+r*0.08, mouth_y+r*0.05], fill=(40,40,50))
        draw.rectangle([cx-r*0.08, mouth_y-r*0.05, cx+r*0.08, mouth_y], fill=(40,40,50))

    # Cheeks
    cheek_r = r * 0.12
    for sx in [-1, 1]:
        chx = cx + sx * r * 0.5
        chy = cy + r*0.5 + size*0.05
        draw.ellipse([chx-cheek_r, chy-cheek_r, chx+cheek_r, chy+cheek_r],
                     fill=color3 if random.random() < 0.5 else (255,200,200))

    # Decorative element (horns, ears, wings, etc.)
    deco_type = random.randint(0, 5)
    if deco_type == 0:
        # Horns
        for sx in [-1, 1]:
            hx = cx + sx * r * 0.5
            pts = [(hx-r*0.1, cy-r*0.15), (hx+r*0.1, cy-r*0.15),
                   (hx+sx*r*0.3, cy-r*1.1+size*0.08)]
            draw.polygon(pts, fill=color3)
    elif deco_type == 1:
        # Ears
        for sx in [-1, 1]:
            ex = cx + sx * r * 0.75
            pts = [(ex-sx*r*0.05, cy-r*0.2), (ex+sx*r*0.15, cy-r*0.3),
                   (ex+sx*r*0.35, cy-r*0.7+size*0.05)]
            draw.polygon(pts, fill=color2)
            inner = [(ex+sx*r*0.05, cy-r*0.28), (ex+sx*r*0.12, cy-r*0.34),
                     (ex+sx*r*0.22, cy-r*0.5+size*0.05)]
            draw.polygon(inner, fill=color1)
    elif deco_type == 2:
        # Wings
        for sx in [-1, 1]:
            wx = cx + sx * r * 0.9
            wy = cy - r*0.2
            wing_pts = [(wx, wy-r*0.4), (wx+sx*r*0.6, wy+r*0.1),
                        (wx+sx*r*0.3, wy+r*0.4), (wx, wy+size*0.05)]
            draw.polygon(wing_pts, fill=color2)
    elif deco_type == 3:
        # Antenna
        for sx in [-1, 0, 1]:
            if sx == 0: continue
            ax = cx + sx * r * 0.3
            draw.line([(ax, cy-r*0.5+size*0.02), (ax+sx*r*0.1, cy-r*0.9+size*0.02)], fill=color3, width=4)
            draw.ellipse([ax-sx*r*0.05-r*0.1, cy-r*0.9-r*0.1+size*0.02,
                         ax-sx*r*0.05+r*0.1, cy-r*0.9+r*0.1+size*0.02], fill=color1)
    elif deco_type == 4:
        # Spikes along top
        for i in range(3):
            sx = -0.5 + i * 0.5
            spx = cx + sx * r * 0.7
            spike = [(spx-r*0.08, cy-r*0.4), (spx+r*0.08, cy-r*0.4),
                     (spx, cy-r*0.85+size*0.05)]
            draw.polygon(spike, fill=color3)
    else:
        # Crown/crest
        for i in range(5):
            crx = cx + (-0.5 + i*0.25) * r * 0.9
            cr_pts = [(crx-r*0.08, cy-r*0.35), (crx+r*0.08, cy-r*0.35),
                      (crx, cy-r*0.55 - i*0.08*r + size*0.02)]
            draw.polygon(cr_pts, fill=color3)

    # Shadow/ground
    shadow_y = cy + r*0.85 + size*0.02
    shadow_w = r * 0.8
    shadow_h = r * 0.15
    for j in range(3):
        alpha = 60 - j*15
        draw.ellipse([cx-shadow_w+j*8, shadow_y+j*3, cx+shadow_w-j*8, shadow_y+shadow_h],
                     fill=(0,0,0,alpha))

    # Sparkles/particles for special rarity
    if random.random() < 0.3:
        for _ in range(8):
            sx = cx + (random.random() - 0.5) * r * 2.2
            sy = cy + (random.random() - 0.5) * r * 2
            sr = 2 + random.random() * 4
            draw.ellipse([sx-sr, sy-sr, sx+sr, sy+sr], fill=(255,255,255,150))


def generate_all():
    with open(DATA_PATH) as f:
        tazos = json.load(f)

    generated = 0
    for t in tazos:
        slug = t["slug"]
        franchise = t["franchise"]
        rarity = t.get("rarity", "common")

        out_path = OUT_DIR / franchise / f"{slug}.png"
        if out_path.exists():
            continue

        # Get palette
        palette = random.choice(PALETTES.get(franchise, PALETTES["minimon"]))
        c1 = tuple(int(palette[0][i:i+2], 16) for i in (1,3,5))
        c2 = tuple(int(palette[1][i:i+2], 16) for i in (1,3,5))
        c3 = tuple(int(palette[2][i:i+2], 16) for i in (1,3,5))

        # For legendary/ultra, use special colors
        if rarity == "legendary":
            c1, c2, c3 = (255,215,0), (255,180,0), (255,255,200)
        elif rarity == "ultra":
            c1, c2, c3 = (180,130,255), (220,180,255), (255,220,255)

        # Create image with transparency
        img = Image.new('RGBA', (880, 880), (0,0,0,0))
        draw = ImageDraw.Draw(img)

        # Draw creature using slug as seed for consistency
        draw_creature(draw, 880, c1, c2, c3, hash(slug))

        # Apply slight blur for anti-aliasing
        img = img.filter(ImageFilter.GaussianBlur(radius=0.8))

        # Save
        out_path.parent.mkdir(parents=True, exist_ok=True)
        img.save(out_path, 'PNG', optimize=True)
        generated += 1

        if generated % 50 == 0:
            print(f"  ... {generated} generated")

    print(f"\n✅ Generated {generated} creature images")
    return generated

if __name__ == "__main__":
    generate_all()
