#!/usr/bin/env python3
"""
Batch AI Creature Generator for TTG — OpenRouter Edition
Generates ALL 347 published tazos' creature images using OpenRouter's Gemini image model.
Each creature is generated with fuchsia (#FF00FF) background, then chroma-keyed to transparent.

Features:
- Resumable: skips already-generated creatures
- Rate-limit aware: respects API limits
- Logs progress to scripts/ai-creature-log.json
- Saves transparent PNGs to scripts/tazo-creatures/{franchise}/{slug}.png

Usage:
  python3 scripts/generate-ai-creatures-batch.py [--limit N] [--slug name]
"""

import json, os, sys, time, sqlite3, base64, requests
from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).parent.parent
DB_PATH = ROOT / "prisma" / "dev.db"
OUT_DIR = ROOT / "scripts" / "tazo-creatures"
LOG_FILE = ROOT / "scripts" / "ai-creature-log.json"

API_KEY = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("OPENROUTER_API_KEY_2")
if not API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY not found in environment")

OR_BASE = "https://openrouter.ai/api/v1"
MODEL = "google/gemini-3.1-flash-image-preview"

STYLE_PROMPTS = {
    "minimon": (
        "Cute chibi creature. Large round eyes, tiny body, soft rounded shapes, "
        "bright pastel colors, kawaii adorable style like a pocket monster companion. "
        "Friendly expression. Clean cel-shaded art. Full body centered forward."
    ),
    "dracobell": (
        "Epic elemental warrior spirit. Dynamic anime style, dramatic pose, "
        "flowing energy effects matching element type (fire/water/wind/earth/shadow). "
        "Japanese-inspired design, sleek armored look. Powerful intense expression. "
        "Clean cel-shaded art. Full body centered forward."
    ),
    "cybermon": (
        "Futuristic digital hologram creature. Neon circuit patterns on body, "
        "translucent holographic glow, sleek mechanical cybernetic parts. "
        "Tron-like light trails. Sci-fi virtual world style. "
        "Clean sharp art. Full body centered forward."
    ),
}

def get_tazos(franchise=None, slug=None, limit=None, force=False):
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    query = """
        SELECT t.slug, t.name, t.displayName, t.rarity, t.combatType,
               LOWER(f.slug) as franchise_slug, f.name as franchise
        FROM Tazo t
        JOIN Franchise f ON t.franchiseId = f.id
        WHERE t.publishStatus = 'published'
        AND LOWER(f.slug) IN ('minimon','cybermon','dracobell')
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
    
    # Filter already done (unless --force)
    if not force:
        done = get_done_slugs()
        return [dict(r) for r in rows if r["slug"] not in done]
    return [dict(r) for r in rows]

def get_done_slugs():
    """Return set of slugs that already have AI creature images (>80KB)."""
    slugs = set()
    if LOG_FILE.exists():
        for entry in json.loads(LOG_FILE.read_text()):
            if entry.get("status") == "ok":
                slugs.add(entry["slug"])
    # Also check filesystem for AI-generated images (large files)
    for franchise_dir in OUT_DIR.iterdir():
        if franchise_dir.is_dir():
            for png_file in franchise_dir.glob("*.png"):
                if png_file.stat().st_size > 80000:
                    slugs.add(png_file.stem)
    return slugs

def log_result(slug, status, error=None):
    log = []
    if LOG_FILE.exists():
        log = json.loads(LOG_FILE.read_text())
    log.append({"slug": slug, "status": status, "error": str(error)[:200] if error else None, "time": int(time.time())})
    LOG_FILE.write_text(json.dumps(log, indent=2))

def build_prompt(tazo):
    franchise_slug = tazo.get("franchise_slug", tazo["franchise"].lower())
    name = tazo.get("displayName") or tazo["name"]
    style = STYLE_PROMPTS.get(franchise_slug, STYLE_PROMPTS["minimon"])
    rarity = tazo.get("rarity", "common")
    combat = tazo.get("combatType", "")
    
    rarity_boost = ""
    if rarity in ("legendary", "ultra"):
        rarity_boost = ", epic pose, glowing energy aura, dramatic"
    elif rarity == "rare":
        rarity_boost = ", dynamic pose, detailed"
    
    combat_hint = f", {combat}-type elemental effects" if combat else ""
    
    return (
        f"{style} Character name: {name}. "
        f"{rarity_boost}{combat_hint}. "
        f"Solid #FF00FF fuchsia magenta background covering everything behind the creature. "
        f"No text, no borders, no frames, no UI elements. Game character only."
    )

def generate_via_openrouter(prompt):
    """Generate image using OpenRouter's Gemini endpoint."""
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://tradingtazosgame.com",
        "X-Title": "Trading Tazos Game",
    }
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": "You are an image generator. ALWAYS output an image. NEVER write text, descriptions, or explanations. Only output the image."},
            {"role": "user", "content": prompt}
        ],
        "modalities": ["image"],
        "max_tokens": 4096,
    }
    resp = requests.post(f"{OR_BASE}/chat/completions", json=payload, headers=headers, timeout=120)
    resp.raise_for_status()
    data = resp.json()
    
    # Extract generated image from response
    choices = data.get("choices", [])
    if not choices:
        raise RuntimeError(f"No choices in response")
    
    msg = choices[0].get("message", {})
    
    # Gemini returns images array at message level
    images = msg.get("images", [])
    if images:
        for img_obj in images:
            img_url = img_obj.get("image_url", {})
            url = img_url.get("url", "")
            if url:
                return url
    
    raise RuntimeError(f"Could not extract image from response. images={len(images)}")

def download_b64(data_uri, path):
    """Save base64 data URI to file."""
    if data_uri.startswith("data:"):
        b64 = data_uri.split(",", 1)[1]
    else:
        b64 = data_uri
    with open(path, "wb") as f:
        f.write(base64.b64decode(b64))

def chroma_key_creature(src_path, slug, franchise):
    """Remove fuchsia background, crop to creature, save as transparent PNG."""
    img = Image.open(src_path).convert("RGBA")
    pixels = img.load()
    w, h = img.size
    
    # Chroma-key fuchsia
    transparent_px = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            # Fuchsia: high R, high B, low G
            if r > 120 and b > 120 and g < 140 and abs(r - b) < 110:
                pixels[x, y] = (0, 0, 0, 0)
                transparent_px += 1
    
    pct = transparent_px / (w * h) * 100
    
    if pct < 5:
        print(f"  ⚠️  Low fuchsia ({pct:.1f}%) — trying wider range")
        # Try wider range
        for y in range(h):
            for x in range(w):
                r, g, b, a = pixels[x, y]
                if r > 100 and b > 100 and g < 180 and abs(r - b) < 130:
                    pixels[x, y] = (0, 0, 0, 0)
    
    # Find creature bounding box from alpha
    bbox = img.getchannel("A").getbbox()
    if not bbox:
        print(f"  ❌ No opaque region — keeping full image")
        bbox = (0, 0, w, h)
    
    # Add 5% padding
    pad_x = int((bbox[2] - bbox[0]) * 0.05)
    pad_y = int((bbox[3] - bbox[1]) * 0.05)
    bbox = (
        max(0, bbox[0] - pad_x),
        max(0, bbox[1] - pad_y),
        min(w, bbox[2] + pad_x),
        min(h, bbox[3] + pad_y),
    )
    
    cropped = img.crop(bbox)
    
    # Pad to square
    max_dim = max(cropped.size) + 20
    square = Image.new("RGBA", (max_dim, max_dim), (0, 0, 0, 0))
    px = (max_dim - cropped.width) // 2
    py = (max_dim - cropped.height) // 2
    square.paste(cropped, (px, py), cropped)
    
    # Scale to 880x880
    final = square.resize((880, 880), Image.LANCZOS)
    
    # Save
    out_path = OUT_DIR / franchise.lower() / f"{slug}.png"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    final.save(out_path, "PNG", optimize=True)
    
    return out_path

def generate_one(tazo, idx, total):
    """Generate and process one creature."""
    slug = tazo["slug"]
    name = tazo.get("displayName") or tazo["name"]
    franchise = tazo["franchise"]
    
    franchise_slug = tazo.get("franchise_slug", tazo.get("franchise", "").lower())
    print(f"[{idx}/{total}] {name} ({franchise_slug}) ...", end=" ", flush=True)
    
    try:
        prompt = build_prompt(tazo)
        data_uri = generate_via_openrouter(prompt)
        
        # Save raw to temp
        tmp_path = ROOT / "scripts" / "tazo-creatures-raw" / f"{slug}_raw.png"
        tmp_path.parent.mkdir(parents=True, exist_ok=True)
        
        if data_uri.startswith("http"):
            import urllib.request
            urllib.request.urlretrieve(data_uri, str(tmp_path))
        else:
            download_b64(data_uri, tmp_path)
        
        out = chroma_key_creature(tmp_path, slug, franchise)
        log_result(slug, "ok")
        print(f"✅ ({out.stat().st_size // 1024}KB)")
        return True
        
    except Exception as e:
        error_msg = str(e)[:150]
        log_result(slug, "error", error_msg)
        print(f"❌ {error_msg}")
        return False

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, help="Max to generate")
    parser.add_argument("--slug", help="Single slug")
    parser.add_argument("--franchise", help="Franchise filter")
    parser.add_argument("--force", action="store_true", help="Regenerate even if exists")
    parser.add_argument("--delay", type=float, default=5.0, help="Delay between generations (seconds)")
    args = parser.parse_args()
    
    tazos = get_tazos(franchise=args.franchise, slug=args.slug, limit=args.limit, force=args.force)
    
    if not tazos:
        print("✅ All creatures already generated!")
        return
    
    print(f"🎨 Generating {len(tazos)} AI creature images...")
    print(f"   Model: {MODEL}")
    print(f"   Output: {OUT_DIR}")
    print(f"   Delay: {args.delay}s between calls")
    print(f"   Already done: {len(get_done_slugs())}")
    print()
    
    ok = 0
    fail = 0
    for i, tazo in enumerate(tazos):
        if generate_one(tazo, i + 1, len(tazos)):
            ok += 1
        else:
            fail += 1
        time.sleep(args.delay)
    
    print(f"\n{'='*50}")
    print(f"✅ Done: {ok} | ❌ Failed: {fail} | Remaining: {len(tazos) - ok - fail}")
    
    # Sync summary
    done = get_done_slugs()
    print(f"📁 Total creatures on disk: {len(done)}")

if __name__ == "__main__":
    main()
