#!/usr/bin/env python3
"""Fix legacy tazos — replace 1024x1024 or missing images with 1254x1254 official BG placeholders."""
import sqlite3, math, random, hashlib, time
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

CANVAS = 1254; CENTER = 627
BASE = Path("/home/smouj/apps/ttg/Trading-Tazos-Game")
DB_PATH = BASE / "prisma" / "dev.db"

FRANCHISE_CONFIG = {
    "minimon":  {"name":"Minimon", "primary":(255,203,5), "prefix":"m"},
    "cybermon": {"name":"Cybermon","primary":(0,161,233),  "prefix":"c"},
    "dracobell":{"name":"Dracobell","primary":(255,107,0), "prefix":"d"},
}
FRONTAL_BG = {
    "minimon":  ["minimon-01.png","minimon-02.png","minimon-03.png","minimon-04.png","minimon-05.png","minimon-06.png"],
    "cybermon": ["cybermon-01.png","cybermon-02.png","cybermon-03.png"],
    "dracobell":["dracobell-01.png","dracobell-02.png","dracobell-03.png","dracobell-04.png"],
}
RARITY_STARS = {"common":1,"uncommon":2,"rare":3,"epic":4,"ultra":5,"ultra-rare":5,"legendary":5}
RARITY_COLORS = {
    "common":(156,163,175),"uncommon":(34,197,94),"rare":(59,130,246),
    "epic":(168,85,247),"ultra":(255,107,0),"ultra-rare":(168,85,247),"legendary":(251,191,36),
}

def draw_star(draw, cx, cy, r, color):
    pts = []
    for i in range(5):
        oa = -math.pi/2+(i*2*math.pi)/5; ia = oa+math.pi/5
        pts.extend([(cx+r*math.cos(oa),cy+r*math.sin(oa)),(cx+r*0.4*math.cos(ia),cy+r*0.4*math.sin(ia))])
    draw.polygon(pts, fill=color, outline=(20,20,20))

# Load fonts
try:
    font_lg = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 84)
    font_md = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 52)
except:
    font_lg = font_md = ImageFont.load_default()

db = sqlite3.connect(str(DB_PATH), timeout=30)
db.execute("PRAGMA journal_mode=WAL")
rows = db.execute("SELECT id, name, imageUrl, rarity FROM Tazo ORDER BY id").fetchall()

# Identify bad tazos
bad = []
for r in rows:
    db_id, name, url, rarity = r
    url = url or ""
    if not url.startswith("/"):
        bad.append(r); continue
    path = BASE / ("public" + url)
    if not path.exists():
        bad.append(r); continue
    try:
        with Image.open(path) as img:
            if img.size != (1254, 1254):
                bad.append(r)
    except:
        bad.append(r)

print(f"Bad/missing: {len(bad)} of {len(rows)}")

# Delete bad files
deleted = 0
for r in bad:
    url = r[2] or ""
    if url.startswith("/"):
        p = BASE / ("public" + url)
        if p.exists():
            p.unlink()
            deleted += 1
print(f"Deleted {deleted} bad files")

# Generate placeholders
fixed = 0
for r in bad:
    db_id, name, url, rarity = r
    # Determine franchise
    fslug = "cybermon"
    if url:
        for part in url.split("/"):
            if part in FRANCHISE_CONFIG:
                fslug = part; break
    fslug = fslug.replace("-", "")
    if fslug not in FRANCHISE_CONFIG:
        fslug = "cybermon"
    
    fconf = FRANCHISE_CONFIG[fslug]
    prefix = fconf["prefix"]
    # Use hash of UUID for unique filename
    hid = hashlib.md5(db_id.encode()).hexdigest()[:8]
    slug = f"{fslug}-{prefix}-{hid}"
    
    dest_dir = BASE / "public" / "tazos-generated" / fslug
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / f"{slug}.png"
    
    bg_file = random.choice(FRONTAL_BG[fslug])
    bg_path = BASE / "public" / "tazo-assets" / "frontal" / fslug / bg_file
    if not bg_path.exists():
        continue
    
    # Open BG
    bg = Image.open(bg_path).convert("RGBA")
    overlay = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    # Name
    nt = (name or "TAZO").upper()
    bb = draw.textbbox((0, 0), nt, font=font_lg)
    tw = bb[2] - bb[0]; th = bb[3] - bb[1]
    draw.text((CENTER - tw // 2, CENTER - th // 2 - 40), nt, fill=(255, 255, 255, 220), font=font_lg)
    
    # Franchise subtitle
    sub = fconf["name"].upper()
    bb2 = draw.textbbox((0, 0), sub, font=font_md)
    tw2 = bb2[2] - bb2[0]
    draw.text((CENTER - tw2 // 2, CENTER + 40), sub, fill=fconf["primary"] + (200,), font=font_md)
    
    # Rarity stars
    stars = RARITY_STARS.get(rarity or "common", 1)
    color = RARITY_COLORS.get(rarity or "common", (156, 163, 175))
    sr = CANVAS * 0.37; sa = -math.pi / 2 - (stars - 1) * math.pi / 10
    for i in range(stars):
        a = sa + i * math.pi / 5
        sx = CENTER + sr * math.cos(a)
        sy = CENTER + sr * math.sin(a) + 180
        for sz in [26, 28]:
            draw_star(draw, sx, sy, sz, color)
    
    result = Image.alpha_composite(bg, overlay)
    result.save(dest_path, "PNG", optimize=True)
    
    new_url = f"/tazos-generated/{fslug}/{slug}.png"
    db.execute("UPDATE Tazo SET imageUrl = ? WHERE id = ?", (new_url, db_id))
    
    fixed += 1
    if fixed % 50 == 0:
        db.commit()
        print(f"  [{fixed}/{len(bad)}]")

db.commit()

# Verify
good = 0; bad2 = 0; miss2 = 0
for r2 in db.execute("SELECT imageUrl FROM Tazo"):
    u = r2[0] or ""
    if not u.startswith("/"):
        miss2 += 1; continue
    p = BASE / ("public" + u)
    if not p.exists():
        miss2 += 1; continue
    try:
        with Image.open(p) as img:
            if img.size == (1254, 1254):
                good += 1
            else:
                bad2 += 1
    except:
        bad2 += 1

db.close()
print(f"\n✅ DONE: {fixed} regenerated with official BG")
print(f"FINAL: {good} GOOD | {bad2} BAD | {miss2} MISSING = {good+bad2+miss2}")
print(f"QUALITY: {good}/{good+bad2+miss2} = {100*good//max(1,good+bad2+miss2)}%")
