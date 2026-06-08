import hashlib
#!/usr/bin/env python3
"""
BULK composite regenerator — ALL 651 tazos get official background.
- Tazos WITH creature art → composite creature + BG + stars
- Tazos WITHOUT creature art → official BG + name/rarity overlay (placeholder)
- Updates ALL DB imageUrls to correct path
"""

import json, os, sqlite3, math, random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

PROJECT = Path("/home/smouj/apps/ttg/Trading-Tazos-Game") if os.path.exists("/home/smouj/apps") else \
          Path("/home/smouj/.openclaw/workspace/Trading-Tazos-Game")

NOBG_DIR = PROJECT / "artgen" / "nobg"
BG_DIR = PROJECT / "public" / "tazo-assets" / "frontal"
DEST_DIR = PROJECT / "public" / "tazos-generated"
DB_PATH = PROJECT / "prisma" / "dev.db"

CANVAS = 1254
CENTER = CANVAS // 2
CHARACTER_SIZE = math.floor(CANVAS * 0.65)

FRANCHISE_CONFIG = {
    "minimon":   {"name": "Minimon",  "primary": (255, 203, 5),   "prefix": "m"},
    "cybermon":  {"name": "Cybermon", "primary": (0, 161, 233),   "prefix": "c"},
    "dracobell": {"name": "Dracobell","primary": (255, 107, 0),   "prefix": "d"},
}

FRONTAL_BG_FILES = {
    "minimon":   ["minimon-01.png","minimon-02.png","minimon-03.png","minimon-04.png","minimon-05.png","minimon-06.png"],
    "cybermon":  ["cybermon-01.png","cybermon-02.png","cybermon-03.png"],
    "dracobell": ["dracobell-01.png","dracobell-02.png","dracobell-03.png","dracobell-04.png"],
}

RARITY_COLORS = {
    "common":(156,163,175),"uncommon":(34,197,94),"rare":(59,130,246),
    "epic":(168,85,247),"ultra":(255,107,0),"ultra-rare":(168,85,247),"legendary":(251,191,36),
}
RARITY_STARS = {"common":1,"uncommon":2,"rare":3,"epic":4,"ultra":5,"ultra-rare":5,"legendary":5}

def draw_star(draw, cx, cy, r, color):
    pts = []
    for i in range(5):
        oa = -math.pi/2+(i*2*math.pi)/5; ia = oa+math.pi/5
        pts.extend([(cx+r*math.cos(oa),cy+r*math.sin(oa)),(cx+r*0.4*math.cos(ia),cy+r*0.4*math.sin(ia))])
    draw.polygon(pts, fill=color, outline=(20,20,20))

def composite_with_creature(creature_img_path, bg_path, rarity):
    """Composite creature onto official background."""
    bg = Image.open(bg_path).convert("RGBA")
    creature = Image.open(creature_img_path).convert("RGBA")
    creature = creature.resize((CHARACTER_SIZE, CHARACTER_SIZE), Image.LANCZOS)
    offset = (CANVAS - CHARACTER_SIZE) // 2
    mask = Image.new("L",(CHARACTER_SIZE,CHARACTER_SIZE),0)
    md = ImageDraw.Draw(mask)
    md.ellipse([4,4,CHARACTER_SIZE-5,CHARACTER_SIZE-5],fill=255)
    cl = Image.new("RGBA",(CANVAS,CANVAS),(0,0,0,0))
    cl.paste(creature,(offset,offset),mask)
    result = Image.alpha_composite(bg, cl)
    # Add rarity stars
    stars = RARITY_STARS.get(rarity,1)
    color = RARITY_COLORS.get(rarity,(156,163,175))
    overlay = Image.new("RGBA",(CANVAS,CANVAS),(0,0,0,0))
    sd = ImageDraw.Draw(overlay)
    sr = CANVAS*0.37; sa = -math.pi/2-(stars-1)*math.pi/10
    for i in range(stars):
        a = sa+i*math.pi/5; sx=CENTER+sr*math.cos(a); sy=CENTER+sr*math.sin(a)+180
        for sz in [26,28]: draw_star(sd,sx,sy,sz,color)
    return Image.alpha_composite(result, overlay)

def composite_placeholder(bg_path, name, rarity, franchise_slug):
    """Official BG with name/rarity overlay — no creature art yet."""
    bg = Image.open(bg_path).convert("RGBA")
    f = FRANCHISE_CONFIG.get(franchise_slug, FRANCHISE_CONFIG["minimon"])
    
    overlay = Image.new("RGBA",(CANVAS,CANVAS),(0,0,0,0))
    draw = ImageDraw.Draw(overlay)
    
    try:
        font_lg = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 90)
        font_md = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 56)
    except:
        font_lg = ImageFont.load_default()
        font_md = ImageFont.load_default()
    
    # Name centered
    name_text = name.upper()
    bbox = draw.textbbox((0,0), name_text, font=font_lg)
    tw = bbox[2]-bbox[0]; th = bbox[3]-bbox[1]
    draw.text((CENTER-tw//2, CENTER-th//2-30), name_text,
              fill=(255,255,255,220), font=font_lg)
    
    # Franchise subtitle
    sub = f["name"].upper()
    bbox2 = draw.textbbox((0,0), sub, font=font_md)
    tw2 = bbox2[2]-bbox2[0]
    draw.text((CENTER-tw2//2, CENTER+50), sub,
              fill=f["primary"]+(200,), font=font_md)
    
    # Rarity stars
    stars = RARITY_STARS.get(rarity,1)
    color = RARITY_COLORS.get(rarity,(156,163,175))
    sr = CANVAS*0.37; sa = -math.pi/2-(stars-1)*math.pi/10
    for i in range(stars):
        a = sa+i*math.pi/5; sx=CENTER+sr*math.cos(a); sy=CENTER+sr*math.sin(a)+180
        for sz in [26,28]: draw_star(draw,sx,sy,sz,color)
    
    return Image.alpha_composite(bg, overlay)

def find_no_bg(creature_id):
    """Find no-bg art for a creature."""
    slug_dirs = list(NOBG_DIR.glob(f"*/{creature_id}-*"))
    for d in slug_dirs:
        for ver in ["v02","v01"]:
            pngs = list(d.glob(f"{creature_id}-{ver}.png"))
            if pngs: return pngs[0]
    for png in NOBG_DIR.glob(f"**/{creature_id}-*.png"):
        return png
    return None

def main():
    db = sqlite3.connect(str(DB_PATH), timeout=10)
    db.execute("PRAGMA journal_mode=WAL")
    
    # Get all tazos from DB
    rows = db.execute("SELECT id, name, rarity, imageUrl, backImageUrl FROM Tazo ORDER BY id").fetchall()
    total = len(rows)
    
    placeholder = 0
    composited = 0
    skipped = 0
    
    for i, row in enumerate(rows):
        db_id, name, rarity, old_url, old_back = row
        rarity = rarity or "common"
        
        # Determine franchise from name/URL pattern or fallback
        # Use old URL to guess franchise, or try to extract from name patterns
        if old_url:
            parts = old_url.split("/")
            if "tazos-generated" in parts:
                idx = parts.index("tazos-generated")
                fslug = parts[idx+1] if idx+1 < len(parts) else "cybermon"
            else:
                fslug = "cybermon"
        else:
            fslug = "cybermon"
        
        # Normalize: "draco-bell" → "dracobell"
        fslug = fslug.replace("-", "")
        if fslug not in FRANCHISE_CONFIG:
            fslug = "cybermon"
        
        fconfig = FRANCHISE_CONFIG[fslug]
        prefix = fconfig["prefix"]
        
        # Extract number from ID or old URL
        import hashlib; num = hashlib.md5(db_id.encode()).hexdigest()[:6]
        # Try to get meaningful number from old filename
        if old_url:
            import re
            m = re.search(r'(\d{3,4})', old_url.split("/")[-1])
            if m: num = m.group(1).zfill(3)
        
        slug_out = f"{fslug}-{prefix}-{num}"
        dest_path = DEST_DIR / fslug / f"{slug_out}.png"
        
        # Skip if already exists with correct size
        if dest_path.exists():
            try:
                with Image.open(dest_path) as img:
                    if img.size == (1254, 1254):
                        # Update DB to correct path if different
                        new_url = f"/tazos-generated/{fslug}/{slug_out}.png"
                        if old_url != new_url:
                            db.execute("UPDATE Tazo SET imageUrl = ? WHERE id = ?", (new_url, db_id))
                        skipped += 1
                        continue
            except:
                pass
        
        # Pick background
        bg_file = random.choice(FRONTAL_BG_FILES.get(fslug, ["cybermon-01.png"]))
        bg_path = BG_DIR / fslug / bg_file
        if not bg_path.exists():
            skipped += 1
            continue
        
        # Try to find creature art
        # Build creature_id patterns: try from DB name or from old URL
        creature_id = None
        if old_url:
            url_file = old_url.split("/")[-1].replace(".png","")
            # Try common patterns
            patterns = [
                url_file,
                f"{fslug}-{prefix}-{num}",
                f"{fslug}-{prefix}-{int(num)}",
                f"{fslug}-{int(num)}",
            ]
            for pat in patterns:
                nobg = find_no_bg(pat)
                if nobg:
                    creature_id = pat
                    break
            if not creature_id:
                # Search by name substring
                name_slug = name.lower().replace(" ","-").replace("'","")[:30]
                for png in NOBG_DIR.glob(f"**/*{name_slug}*"):
                    creature_id = png.stem
                    nobg = png
                    break
        
        nobg = find_no_bg(creature_id) if creature_id else None
        
        # Generate composite
        dest_dir = DEST_DIR / fslug
        dest_dir.mkdir(parents=True, exist_ok=True)
        
        if nobg:
            try:
                result = composite_with_creature(nobg, bg_path, rarity)
            except:
                result = composite_placeholder(bg_path, name, rarity, fslug)
                placeholder += 1
        else:
            result = composite_placeholder(bg_path, name, rarity, fslug)
            placeholder += 1
        
        result.save(dest_path, "PNG", optimize=True)
        
        new_url = f"/tazos-generated/{fslug}/{slug_out}.png"
        db.execute("UPDATE Tazo SET imageUrl = ? WHERE id = ?", (new_url, db_id))
        
        if nobg:
            composited += 1
            if composited % 20 == 0:
                print(f"  [{composited}] {name} → {slug_out}.png (creature)")
        else:
            if placeholder % 50 == 0:
                print(f"  [{placeholder} placeholders] {name} → {slug_out}.png")
    
    db.commit()
    db.close()
    
    print(f"\n✅ Done: {composited} with creature, {placeholder} placeholders, {skipped} skipped")
    print(f"📁 Output: {DEST_DIR}/")

if __name__ == "__main__":
    main()
