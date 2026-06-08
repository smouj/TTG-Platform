#!/usr/bin/env python3
"""
Batch generation of TTG creature artwork via xAI grok-imagine-image.
- Reads creatures.json for metadata + prompts
- Calls xAI API directly (no Node.js overhead)
- Saves to artgen/output/{line}/{id-name}/{id}-v01.png
- Resumes: skips already-generated images
- Priority: legendary > ultra > epic > rare > uncommon > common
"""

import json, os, base64, time, urllib.request, urllib.error, re

PROJECT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(PROJECT, "output")
CREATURES_PATH = os.path.join(PROJECT, "creatures.json")
AUTH_PATH = os.path.expanduser("~/.openclaw/agents/main/agent/auth-profiles.json")

RARITY_ORDER = ["legendary", "ultra", "epic", "rare", "uncommon", "common"]

def get_token():
    with open(AUTH_PATH) as f:
        d = json.load(f)
    return d["profiles"]["xai:smouj013hs@gmail.com"]["access"]

def safe_dirname(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")

def get_creatures():
    with open(CREATURES_PATH) as f:
        return json.load(f)["creatures"]

def already_generated(c):
    dn = safe_dirname(c["name"])
    path = os.path.join(OUTPUT_DIR, c["line"], f"{c['id']}-{dn}", f"{c['id']}-v01.png")
    return os.path.exists(path)

def generate_image(creature, token):
    """Call xAI API and return image bytes."""
    prompt = creature.get("prompt", "")
    if not prompt:
        prompt = f"A cute {creature['rarity']} {creature['line']} creature named {creature['name']}, game card collectible art, vibrant colors, clean silhouette"

    # Append negative prompt if available (v2 strict has per-creature negative prompts)
    neg = creature.get("negative_prompt", "")
    if neg:
        # Keep neg concise — extract key anti-background terms
        neg_short = neg.replace("Negative prompt: ", "")[:300]
        prompt = prompt + "\n\nSTRICT REQUIREMENTS - DO NOT include: background, scenery, floor, ground, shadow under feet, multiple characters, text, watermark, frame, border."

    data = json.dumps({
        "model": "grok-imagine-image",
        "prompt": prompt,
        "n": 1,
        "response_format": "b64_json",
    }).encode()

    req = urllib.request.Request(
        "https://api.x.ai/v1/images/generations",
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
        method="POST",
    )

    resp = urllib.request.urlopen(req, timeout=180)
    result = json.loads(resp.read())
    b64 = result.get("data", [{}])[0].get("b64_json", "")
    if not b64:
        raise Exception(f"No b64_json in response: {str(result)[:200]}")
    return base64.b64decode(b64)

def save_image(creature, img_bytes):
    dn = safe_dirname(creature["name"])
    d = os.path.join(OUTPUT_DIR, creature["line"], f"{creature['id']}-{dn}")
    os.makedirs(d, exist_ok=True)
    path = os.path.join(d, f"{creature['id']}-v01.png")
    with open(path, "wb") as f:
        f.write(img_bytes)
    return path, len(img_bytes)

def main():
    token = get_token()
    print(f"🔑 Token loaded ({token[:15]}...)")

    creatures = get_creatures()
    creatures.sort(key=lambda c: RARITY_ORDER.index(c["rarity"]) if c["rarity"] in RARITY_ORDER else 99)

    pending = [c for c in creatures if not already_generated(c)]
    done = len(creatures) - len(pending)

    print(f"\n📊 {done}/{len(creatures)} already generated, {len(pending)} pending\n")

    if not pending:
        print("✨ All creatures already generated!")
        return

    success = 0
    failed = 0
    start_time = time.time()

    for i, c in enumerate(pending):
        eta = ""
        if i > 0 and success > 0:
            elapsed = time.time() - start_time
            rate = elapsed / success
            remaining = rate * (len(pending) - i)
            eta = f" | ETA: {remaining/60:.0f}min"

        print(f"[{i+1}/{len(pending)}] {c['id']} {c['name']} ({c['line']} {c['rarity']}){eta}", flush=True)

        try:
            # Refresh token if needed (every 20 calls)
            if i > 0 and i % 20 == 0:
                try:
                    token = get_token()
                    print("  🔄 Token refreshed", flush=True)
                except:
                    pass

            img = generate_image(c, token)
            path, size = save_image(c, img)
            print(f"  ✅ Saved ({size//1024} KB)", flush=True)
            success += 1
        except urllib.error.HTTPError as e:
            body = e.read().decode()[:300]
            print(f"  ❌ HTTP {e.code}: {body}", flush=True)
            failed += 1
            if e.code in (401, 403):
                print("  ⛔ Auth error — stopping batch", flush=True)
                break
        except Exception as e:
            print(f"  ❌ Error: {e}", flush=True)
            failed += 1

        # Rate limit pause
        if i < len(pending) - 1:
            time.sleep(2.5)

    elapsed = time.time() - start_time
    print(f"\n{'='*50}")
    print(f"✨ Batch complete in {elapsed/60:.1f} min")
    print(f"   ✅ {success} generated | ❌ {failed} failed")
    print(f"   📁 {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
