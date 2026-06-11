#!/usr/bin/env python3
"""
fix-composites.py — Convert palette-mode PNGs to RGBA and fix fuchsia bleeding.
Run on VPS: python3 scripts/season1/fix-composites.py
"""
from PIL import Image
import os, sys

BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
COMPOS_DIR = os.path.join(BASE, "public", "tazos-generated")

def is_fuchsia(r, g, b):
    """Detect magenta/fuchsia pixels (remove-bg artifact)"""
    return r > 200 and b > 200 and g < 80

def fix_image(fp):
    """Convert to RGBA and fix fuchsia background"""
    img = Image.open(fp)
    w, h = img.size
    
    # Convert palette with transparency to RGBA
    if img.mode == "P":
        try:
            img = img.convert("RGBA")
        except Exception:
            img = img.convert("RGB").convert("RGBA")
    
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    
    # Fix fuchsia pixels → transparent
    px = img.load()
    fixed = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_fuchsia(r, g, b):
                px[x, y] = (r, g, b, 0)  # make transparent
                fixed += 1
    
    return img, fixed

def main():
    total = 0
    converted = 0
    fuchsia_fixed = 0
    
    for franchise in ["minimon", "dracobell", "cybermon"]:
        path = os.path.join(COMPOS_DIR, franchise)
        if not os.path.isdir(path):
            continue
        
        for f in sorted(os.listdir(path)):
            if not f.endswith(".png"):
                continue
            if "back" in f.lower():
                continue
            if f.startswith("minimon-t1"):
                continue
            
            fp = os.path.join(path, f)
            orig = Image.open(fp)
            orig_mode = orig.mode
            
            img, fixed = fix_image(fp)
            
            if orig_mode == "P" or fixed > 0:
                img.save(fp, "PNG", optimize=True)
                if orig_mode == "P":
                    converted += 1
                if fixed > 0:
                    fuchsia_fixed += fixed
                    print(f"  FIXED: {franchise}/{f} ({fixed} fuchsia px → transparent)")
            else:
                pass  # already RGBA, no issues
            
            total += 1
            orig.close()
    
    print(f"\n✅ Done: {total} images checked")
    print(f"   Converted P→RGBA: {converted}")
    print(f"   Fuchsia fix total px: {fuchsia_fixed}")

if __name__ == "__main__":
    main()
