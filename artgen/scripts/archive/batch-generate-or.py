#!/usr/bin/env python3
"""
Batch generation of TTG creature artwork via OpenRouter (Chat Completions API).
Uses Google Gemini 3.1 Flash Image (fastest + cheapest).
- Reads creatures.json (v2 strict unique prompts)
- Saves to artgen/output/{line}/{id-name}/{id}-v01.png
- Resumes: skips already-generated images
"""

import json, os, base64, time, urllib.request, urllib.error, re

PROJECT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(PROJECT, "output")
CREATURES_PATH = os.path.join(PROJECT, "creatures.json")

API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemini-3.1-flash-image-preview"

def safe_dirname(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")

def get_creatures():
    with open(CREATURES_PATH) as f:
        return json.load(f)["creatures"]

def already_generated(c):
    dn = safe_dirname(c["name"])
    path = os.path.join(OUTPUT_DIR, c["line"], f"{c['id']}-{dn}", f"{c['id']}-v01.png")
    return os.path.exists(path)

def generate_image(creature):
    """Call OpenRouter Chat Completions API with image modality."""
    prompt = creature.get("prompt", "")
    if not prompt:
        prompt = f"A cute {creature['rarity']} {creature['line']} creature named {creature['name']}, game card collectible art, vibrant colors, clean silhouette"

    # Request isolated character on white — easier rembg
    full_prompt = prompt + "\n\nCRITICAL: Plain solid white background ONLY. No scenery, no ground, no shadows, no text, no watermarks. Character isolated on pure white. Clean edges."

    data = json.dumps({
        "model": MODEL,
        "messages": [
            {
                "role": "user",
                "content": full_prompt,
            }
        ],
        "modalities": ["image", "text"],
    }).encode()

    req = urllib.request.Request(
        API_URL,
        data=data,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://tradingtazosgame.com",
            "X-Title": "TTG Art Generator",
        },
        method="POST",
    )

    try:
        resp = urllib.request.urlopen(req, timeout=60)
        result = json.loads(resp.read())

        # Extract image from response
        if "choices" in result and len(result["choices"]) > 0:
            msg = result["choices"][0].get("message", {})
            if msg.get("images") and len(msg["images"]) > 0:
                img_url = msg["images"][0].get("image_url", {}).get("url", "")
                if img_url.startswith("data:image"):
                    # Base64 data URL
                    b64 = img_url.split(",", 1)[1]
                    return base64.b64decode(b64)
        
        print(f"    ⚠️ No image in response: {json.dumps(result)[:200]}")
        return None

    except urllib.error.HTTPError as e:
        body = e.read().decode()[:400]
        print(f"    ❌ HTTP {e.code}: {body}")
        return None

def main():
    if not API_KEY:
        print("❌ OPENROUTER_API_KEY not set!")
        return

    creatures = get_creatures()

    # Sort by rarity priority
    RARITY_ORDER = ["legendary", "ultra", "epic", "rare", "uncommon", "common"]
    creatures.sort(key=lambda c: RARITY_ORDER.index(c.get("rarity", "common")) if c.get("rarity", "common") in RARITY_ORDER else 99)

    # Count already done
    done = sum(1 for c in creatures if already_generated(c))
    pending = len(creatures) - done
    print(f"📊 {done}/{len(creatures)} already generated, {pending} pending\n")

    if pending == 0:
        print("✅ All done!")
        return

    generated = 0
    failed = 0
    start_time = time.time()

    for i, c in enumerate(creatures):
        if already_generated(c):
            continue

        name = c["name"]
        cid = c["id"]
        line = c["line"]
        rarity = c.get("rarity", "common")

        print(f"[{generated+1}/{pending}] {cid} {name} ({line} {rarity})", end=" ", flush=True)

        img_bytes = generate_image(c)

        if not img_bytes:
            failed += 1
            print(f"❌")
            if failed >= 5:
                print(f"\n⛔ {failed} consecutive failures — stopping batch")
                break
            time.sleep(3)
            continue

        # Save
        dn = safe_dirname(name)
        out_dir = os.path.join(OUTPUT_DIR, line, f"{cid}-{dn}")
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, f"{cid}-v01.png")

        with open(out_path, "wb") as f:
            f.write(img_bytes)

        generated += 1

        elapsed = time.time() - start_time
        rate = elapsed / generated if generated > 0 else 0
        eta = rate * (pending - generated) if pending > generated else 0
        print(f"✅ ({elapsed/60:.0f}m, ETA {eta/60:.0f}m)")

        # Rate limit
        time.sleep(1.5)

    elapsed = time.time() - start_time
    print(f"\n{'='*50}")
    print(f"✨ Batch complete in {elapsed/60:.1f} min")
    print(f"   ✅ {generated} generated | ❌ {failed} failed")
    print(f"   📁 {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
