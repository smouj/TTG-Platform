#!/usr/bin/env python3
"""
Batch background removal using rembg AI.
Processes all raw creature art → saves clean no-background versions.
"""

import os, sys, time, json
from pathlib import Path
from PIL import Image
from rembg import remove, new_session

PROJECT = Path("/home/smouj/.openclaw/workspace/Trading-Tazos-Game")
OUTPUT_DIR = PROJECT / "artgen" / "output"
NOBG_DIR = PROJECT / "artgen" / "nobg"

def main():
    NOBG_DIR.mkdir(parents=True, exist_ok=True)
    
    # Use smaller/faster model
    print("Loading rembg model (u2netp)...")
    session = new_session('u2netp')
    
    # Find all raw PNGs
    raw_images = []
    for root, dirs, files in os.walk(OUTPUT_DIR):
        for f in files:
            if f.endswith('.png'):
                raw_images.append(Path(root) / f)
    
    print(f"Found {len(raw_images)} raw images to process")
    
    success = 0
    failed = []
    start_time = time.time()
    
    for i, img_path in enumerate(raw_images):
        try:
            # Determine output path preserving structure
            rel = img_path.relative_to(OUTPUT_DIR)
            out_path = NOBG_DIR / rel
            out_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Skip if already processed
            if out_path.exists():
                success += 1
                continue
            
            # Load, resize for speed, remove bg
            img = Image.open(img_path).convert('RGB')
            orig_size = img.size
            
            # Resize to max 768px for speed while keeping quality
            max_dim = max(orig_size)
            if max_dim > 768:
                scale = 768 / max_dim
                new_size = (int(orig_size[0] * scale), int(orig_size[1] * scale))
                img = img.resize(new_size, Image.LANCZOS)
            
            # Remove background
            result = remove(img, session=session)
            
            # Resize back to original if needed
            if result.size != orig_size:
                result = result.resize(orig_size, Image.LANCZOS)
            
            result.save(out_path, 'PNG', optimize=True)
            success += 1
            
            # Progress
            elapsed = time.time() - start_time
            rate = (i + 1) / elapsed if elapsed > 0 else 0
            remaining = (len(raw_images) - i - 1) / rate if rate > 0 else 0
            print(f"  [{i+1}/{len(raw_images)}] {rel} ({orig_size[0]}x{orig_size[1]}) "
                  f"- {elapsed:.0f}s elapsed, ~{remaining:.0f}s remaining")
            
        except Exception as e:
            failed.append((str(img_path), str(e)))
            print(f"  FAILED: {img_path}: {e}")
    
    total_time = time.time() - start_time
    print(f"\n{'='*60}")
    print(f"Done! {success}/{len(raw_images)} succeeded, {len(failed)} failed")
    print(f"Time: {total_time:.0f}s ({total_time/len(raw_images):.1f}s avg)")
    if failed:
        print(f"Failed:")
        for path, err in failed:
            print(f"  {path}: {err}")
    print(f"Output: {NOBG_DIR}")

if __name__ == '__main__':
    main()
