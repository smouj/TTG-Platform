# TTG Art Pipeline — Unified v4

## Overview

3 scripts, 1 consistent output. All aligned with `tazo-art-studio` reference implementation.

```
creatures.json → batch-generate-or-v2.py (OpenRouter) → artgen/output/{id}.png
                  ↓
            remove-bg-batch.py (rembg) → artgen/nobg/{line}/{id}.png
                  ↓
            composite-tazo-v4.py → public/tazos-generated/{franchise}/{slug}.png (+back)
                  ↓
            DB update (non-critical, with try/except)
```

## Consistency Contract

The following specs are IDENTICAL across:
- `tazo-art-studio` (reference: `src/app/api/tazo-art/route.ts`)
- TTG Admin Creator (production: `src/app/api/admin/tazo-art/route.ts`)
- `composite-tazo-v4.py` (batch pipeline)

| Spec | Value |
|------|-------|
| Canvas size | 1254×1254 |
| Creature size | 65% of canvas (815px) |
| Background source | `public/tazo-assets/frontal/{franchise}/` |
| Background selection | Random (matches tazo-art-studio) |
| Franchise slugs | `minimon`, `cybermon`, `dracobell` (no hyphen) |
| Transparency guard | Real alpha, no magenta hack |
| Rarity colors | common=#9CA3AF, uncommon=#22C55E, rare=#3B82F6, epic=#A855F7, ultra=#FF6B00, legendary=#FBBF24 |
| Rarity stars | common=1, uncommon=2, rare=3, epic=4, ultra/legendary=5 |
| Output format | RGBA PNG (preserves alpha) |
| Output path | `public/tazos-generated/{franchise}/{franchise}-{prefix}-{number}.png` |
| Back side | Official back designs + name/rarity overlay (1024×1024) |

## Scripts

### 1. `batch-generate-or-v2.py`
Generates creature art via OpenRouter (Gemini 2.5 Flash Image).
- Resume support: skips existing `{id}-v02.png` files
- Sorted by rarity (legendary → common)
- $0.039/image, ~$12.35 for full 319 batch
- Requires: `OPENROUTER_API_KEY` in `.env`

### 2. `remove-bg-batch.py`
Removes backgrounds using `rembg` (u2netp model).
- Input: `artgen/output/{line}/{id}/{id}-v02.png`
- Output: `artgen/nobg/{line}/{id}/{id}-v02.png`
- ~0.7s per image on CPU

### 3. `composite-tazo-v4.py`
UNIFIED composite script. Matches tazo-art-studio specs exactly.
- Official backgrounds from `public/tazo-assets/frontal/`
- Creature at 65% canvas with circular mask
- Generates front + back sides
- DB update (non-critical, safe to kill/restart)
- Idempotent: safe to re-run multiple times

## Archive

Old scripts in `archive/`:
- `composite-tazo.py` (v1 — SVG discs)
- `composite-tazo-v2.py` (v2 — programmed discs with black borders)
- `composite-tazo-v3.py` (v3 — official BGs, had hyphen bug)
- `batch-generate.mjs` (v1 — xAI direct)
- `batch-generate-v2.py` (v2 — xAI device code)
- `batch-generate-or.py` (v1 — OpenRouter)
- `fix-broken-images.py` (collision fix one-shot)

## Deploy

```bash
# On VPS:
cd /home/smouj/apps/ttg/Trading-Tazos-Game
python3 artgen/scripts/composite-tazo-v4.py

# Sync to local:
rsync -avz rpgvps:/home/smouj/apps/ttg/Trading-Tazos-Game/public/tazos-generated/ \
  public/tazos-generated/
```
