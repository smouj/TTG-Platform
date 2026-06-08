#!/usr/bin/env python3
"""
Fix 33 legacy tazos with broken image URLs (?v= query strings).
- Strip ?v= from DB
- Generate simple name-placeholder tazo discs for any that are missing files
- Copy to public/tazos-generated/ and update DB
"""
import sqlite3, os, re, sys
from PIL import Image, ImageDraw, ImageFont

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "prisma", "dev.db")
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "public")

FRANCHISE_COLORS = {
    "minimon": ("#FFCB05", "#F5A623"),
    "cybermon": ("#00A1E9", "#0066CC"),
    "dracobell": ("#FF6B00", "#CC4400"),
}

RARITY_STARS = {"common": 1, "uncommon": 2, "rare": 3, "epic": 4, "ultra": 4, "legendary": 5}

def detect_franchise(image_url):
    """Detect franchise from imageUrl path."""
    for f in ["minimon", "cybermon", "dracobell"]:
        if f"/tazos-generated/{f}/" in image_url or f"/tazos-generated/{f}/" in image_url.replace("dracobell", f):
            return f
    if "/cybermon/" in image_url:
        return "cybermon"
    if "/minimon/" in image_url:
        return "minimon"
    if "/dracobell/" in image_url or "/draco-bell/" in image_url:
        return "dracobell"
    return "cybermon"

def shorten_name(name, max_len=14):
    """Shorten creature name to fit disc."""
    words = name.split()
    if len(name) <= max_len:
        return name
    if len(words) >= 2:
        return words[0]
    return name[:max_len-1] + "…"

def create_placeholder_disc(name, rarity, franchise, output_path):
    """Generate a simple tazo disc with creature name printed on it."""
    size = 512
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    f_color = FRANCHISE_COLORS.get(franchise, FRANCHISE_COLORS["cybermon"])
    f_primary = f_color[0]
    f_secondary = f_color[1]

    r_stars = RARITY_STARS.get(rarity, 1)

    # Background disc
    cx, cy = size // 2, size // 2
    r_outer = 240
    r_inner = 230
    r_creature = 140

    # Outer disc
    draw.ellipse([cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer],
                 fill="#FEFEFA", outline="#1a1a1a", width=4)

    # Franchise ring
    draw.ellipse([cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner],
                 outline=f_primary, width=3)

    # Creature area
    draw.ellipse([cx - r_creature, cy - r_creature, cx + r_creature, cy + r_creature],
                 fill="#f0f0f5", outline="#ddd", width=2)

    # Creature silhouette placeholder (circle)
    draw.ellipse([cx - 60, cy - 90, cx + 60, cy + 30], fill="#e0e0e8", outline="#ccc", width=1)

    # Name text
    short = shorten_name(name, 14)
    # Try to use a nice font, fallback to default
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size=26 if len(short) <= 8 else 20)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", size=14)
    except:
        font = ImageFont.load_default()
        font_small = font

    # Name bbox for centering
    bbox = draw.textbbox((0, 0), short, font=font)
    name_w = bbox[2] - bbox[0]
    draw.text((cx - name_w // 2, cy + 140), short, fill="#1a1a1a", font=font)

    # Rarity stars
    star_size = 12
    star_spacing = 18
    total_stars_w = r_stars * star_spacing
    star_x_start = cx - total_stars_w // 2 + star_spacing // 2
    for i in range(r_stars):
        sx = star_x_start + i * star_spacing
        sy = cy + 175
        # Draw simple star (triangle + inverted triangle)
        color_map = {"common": "#9CA3AF", "uncommon": "#22C55E", "rare": "#3B82F6",
                     "epic": "#EF4444", "ultra": "#A855F7", "legendary": "#FBBF24"}
        star_color = color_map.get(rarity, "#9CA3AF")
        # 5-point star approximation
        pts = []
        for j in range(5):
            angle = -90 + j * 72
            pts.append((sx + star_size * 0.95 * (0.5 + 0.5 * (j % 2 == 0)),
                        sy + star_size * 0.95 * (0.5 + 0.5 * (j % 2 == 0))))
        # Just draw a filled circle as star
        draw.ellipse([sx - star_size//2, sy - star_size//2, sx + star_size//2, sy + star_size//2],
                     fill=star_color, outline="#1a1a1a", width=1)

    # Franchise label
    f_label = franchise.capitalize()
    try:
        bbox2 = draw.textbbox((0, 0), f_label, font=font_small)
        fw = bbox2[2] - bbox2[0]
    except:
        fw = len(f_label) * 8
    draw.text((cx - fw // 2, cy + 200), f_label, fill=f_primary, font=font_small)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, "PNG")
    return True

def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # Find all tazos with ?v= query strings
    rows = conn.execute("""
        SELECT id, name, rarity, imageUrl, franchiseId
        FROM Tazo
        WHERE imageUrl LIKE '%?v=%'
    """).fetchall()

    print(f"🔧 Found {len(rows)} broken image URLs")

    fixed = 0
    created_placeholder = 0

    for row in rows:
        old_url = row["imageUrl"]
        # Strip query string
        clean_url = re.sub(r'\?v=.*$', '', old_url)

        # Check if file exists locally
        filepath = os.path.join(PUBLIC_DIR, clean_url.lstrip("/"))
        if os.path.exists(filepath):
            # File exists, just update DB
            conn.execute("UPDATE Tazo SET imageUrl = ? WHERE id = ?", (clean_url, row["id"]))
            print(f"  ✅ {row['name']} — stripped ?v= → {clean_url} (file exists)")
            fixed += 1
        else:
            # File doesn't exist, create placeholder
            franchise = detect_franchise(old_url)
            # Also check the franchise slug version
            franchise_dir = "draco-bell" if franchise == "dracobell" else franchise

            # Create new clean filename in correct franchise dir
            old_basename = os.path.splitext(os.path.basename(clean_url))[0]
            if franchise_dir == "dracobell":
                # Keep in dracobell/ folder
                target_dir = os.path.join(PUBLIC_DIR, "tazos-generated", "dracobell")
                new_filename = f"{old_basename}.png"
            else:
                target_dir = os.path.join(PUBLIC_DIR, "tazos-generated", franchise_dir)
                new_filename = f"{old_basename}.png"

            target_path = os.path.join(target_dir, new_filename)

            # The clean_url might point to draco-bell or minimon or cybermon
            # Make sure we use the correct path format
            if "draco-bell" in clean_url:
                target_path = os.path.join(PUBLIC_DIR, clean_url.lstrip("/"))

            os.makedirs(os.path.dirname(target_path), exist_ok=True)

            if not os.path.exists(target_path):
                create_placeholder_disc(row["name"], row["rarity"], franchise, target_path)
                print(f"  🎨 {row['name']} — created placeholder disc → {target_path}")
                created_placeholder += 1

            # Update DB
            new_url = "/" + os.path.relpath(target_path, PUBLIC_DIR)
            conn.execute("UPDATE Tazo SET imageUrl = ? WHERE id = ?", (new_url, row["id"]))
            print(f"  ✅ {row['name']} — updated URL: {new_url}")
            fixed += 1

    conn.commit()
    conn.close()
    print(f"\n✨ Done: {fixed} URLs fixed, {created_placeholder} placeholder discs created")

if __name__ == "__main__":
    main()
