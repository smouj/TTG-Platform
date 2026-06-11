#!/usr/bin/env python3
"""
Batch AI Creature Generator for TTG
Generates creature images using OpenAI DALL-E with plain fuchsia (#FF00FF) 
background for easy background removal via chroma-key.

Usage:
  python3 scripts/generate-ai-creatures.py [--limit N] [--franchise minimon]
  python3 scripts/generate-ai-creatures.py --slug aquafin
"""

import json, os, sys, time, sqlite3
from pathlib import Path
from openai import OpenAI

ROOT = Path(__file__).parent.parent
DB_PATH = ROOT / "prisma" / "dev.db"
OUT_DIR = ROOT / "scripts" / "tazo-creatures-raw"  # raw AI outputs
FINAL_DIR = ROOT / "scripts" / "tazo-creatures"      # processed transparent PNGs
LOG_FILE = ROOT / "scripts" / "ai-creature-log.json"

# Franchise-specific art styles
STYLE_PROMPTS = {
    "minimon": "cute original elemental creature, simple rounded shapes, bright colors, clean collectible style",
    "dracobell": "fierce original martial fantasy fighter, bold angular shapes, aura energy, clan-inspired TTG style",
    "cybermon": "futuristic cyber-creature, neon accents, mechanical parts, sleek design, digital monster style",
}

def get_client():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        # Try loading from .env
        env_path = ROOT / ".env"
        if env_path.exists():
            for line in open(env_path):
                if line.startswith("OPENAI_API_KEY="):
                    api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not found")
    return OpenAI(api_key=api_key)

def get_tazos(franchise=None, slug=None, limit=None):
    """Get tazos that need creature images."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    query = """
        SELECT t.slug, t.name, t.displayName, t.rarity, t.combatType,
               f.name as franchise
        FROM Tazo t
        JOIN Franchise f ON t.franchiseId = f.id
        WHERE t.publishStatus = 'published'
    """
    params = []
    if franchise:
        query += " AND f.name = ?"
        params.append(franchise)
    if slug:
        query += " AND t.slug = ?"
        params.append(slug)
    if limit:
        query += f" LIMIT {int(limit)}"
    
    rows = conn.execute(query, params).fetchall()
    conn.close()
    
    # Filter out those already generated successfully
    if LOG_FILE.exists():
        done = json.loads(LOG_FILE.read_text())
        done_slugs = {r["slug"] for r in done if r.get("status") == "ok"}
    else:
        done_slugs = set()
    
    return [dict(r) for r in rows if r["slug"] not in done_slugs]

def build_prompt(tazo):
    """Build DALL-E prompt for a specific tazo creature."""
    franchise = tazo["franchise"]
    name = tazo.get("displayName") or tazo["name"]
    style = STYLE_PROMPTS.get(franchise.lower(), STYLE_PROMPTS["minimon"])
    rarity = tazo.get("rarity", "common")
    combat = tazo.get("combatType", "")
    
    rarity_boost = ""
    if rarity in ("legendary", "ultra"):
        rarity_boost = ", epic pose, glowing aura, dramatic lighting"
    elif rarity == "rare":
        rarity_boost = ", dynamic pose, detailed design"
    
    combat_hint = f", {combat}-type elemental effects" if combat else ""
    
    return (
        f"A {style}. Character name: {name}. "
        f"Full body creature, centered, facing forward, game trading card art. "
        f"{rarity_boost}{combat_hint}. "
        f"Plain solid #FF00FF fuchsia/magenta background. "
        f"No text, no borders, no frames. Clean game character illustration."
    )

def generate_image(client, slug, prompt):
    """Generate one image via DALL-E 3."""
    response = client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        size="1024x1024",
        quality="standard",
        n=1,
    )
    url = response.data[0].url
    return url

def download_image(url, path):
    """Download image from URL to path."""
    import urllib.request
    urllib.request.urlretrieve(url, str(path))

def process_creature(slug, franchise, raw_path):
    """Process raw AI image: remove fuchsia background → transparent PNG."""
    from PIL import Image
    
    final_path = FINAL_DIR / franchise / f"{slug}.png"
    final_path.parent.mkdir(parents=True, exist_ok=True)
    
    img = Image.open(raw_path).convert("RGBA")
    pixels = img.load()
    w, h = img.size
    
    # Chroma-key fuchsia (#FF00FF) and near-fuchsia colors
    transparent = 0
    total = w * h
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            # Check if pixel is fuchsia or near-fuchsia
            if r > 200 and b > 200 and g < 100 and abs(r - b) < 50:
                pixels[x, y] = (0, 0, 0, 0)
                transparent += 1
    
    pct = transparent / total * 100
    if pct < 5:
        # Not enough fuchsia — try rembg if available
        try:
            from rembg import remove
            with open(raw_path, "rb") as f:
                result = remove(f.read())
            with open(final_path, "wb") as f:
                f.write(result)
            print(f"  rembg fallback: {slug} ({img.width}x{img.height})")
            return True
        except ImportError:
            print(f"  ⚠️  {slug}: fuchsia not detected ({pct:.1f}%), rembg not available")
            return False
    
    img.save(final_path, "PNG", optimize=True)
    print(f"  ✅ {slug}: {pct:.1f}% transparent ({img.width}x{img.height})")
    return True

def log_result(slug, status, error=None):
    """Log generation result."""
    log = []
    if LOG_FILE.exists():
        log = json.loads(LOG_FILE.read_text())
    log.append({"slug": slug, "status": status, "error": error, "time": time.time()})
    LOG_FILE.write_text(json.dumps(log, indent=2))

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, help="Max creatures to generate")
    parser.add_argument("--franchise", help="Franchise filter")
    parser.add_argument("--slug", help="Single slug to generate")
    args = parser.parse_args()
    
    client = get_client()
    tazos = get_tazos(franchise=args.franchise, slug=args.slug, limit=args.limit)
    
    if not tazos:
        print("No tazos to generate (all done or filtered out)")
        return
    
    print(f"🎨 Generating {len(tazos)} creature images...")
    print(f"   Output: {FINAL_DIR}")
    print(f"   Log: {LOG_FILE}")
    print()
    
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    
    generated = 0
    failed = 0
    for i, tazo in enumerate(tazos):
        slug = tazo["slug"]
        name = tazo.get("displayName") or tazo["name"]
        franchise = tazo["franchise"]
        
        # Check if already processed
        final_check = FINAL_DIR / franchise / f"{slug}.png"
        if final_check.exists():
            log_result(slug, "ok")
            continue
        
        prompt = build_prompt(tazo)
        print(f"[{i+1}/{len(tazos)}] {name} ({franchise})")
        
        try:
            url = generate_image(client, slug, prompt)
            raw_path = OUT_DIR / f"{slug}.png"
            download_image(url, raw_path)
            
            if process_creature(slug, franchise, raw_path):
                log_result(slug, "ok")
                generated += 1
            else:
                log_result(slug, "partial")
                failed += 1
            
            # DALL-E rate limit: ~5 images per minute for standard
            time.sleep(12)
            
        except Exception as e:
            print(f"  ❌ {slug}: {e}")
            log_result(slug, "error", str(e))
            failed += 1
            time.sleep(5)
    
    print(f"\n✅ Generated: {generated} | Failed: {failed} | Total: {len(tazos)}")

if __name__ == "__main__":
    main()
