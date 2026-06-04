# 🎨 ttg-artgen — Internal Art Generator for Trading Tazos Game

Generates original creature/fighter artwork for TTG's three fictional collectible lines:
**Minimon**, **Cybermon**, and **Draco Bell**.

This is an **internal development tool** — not a public-facing feature. It helps build the TTG visual catalog with consistent, reviewable, and exportable artwork.

## Quick Start

```bash
# 1. Install dependencies
npm install openai dotenv

# 2. Configure API key
cp artgen/.env.example .env
# Edit .env and add your OPENAI_API_KEY

# 3. List available creatures
node artgen/scripts/generate-ttg-art.mjs --list

# 4. Generate 4 variants for a creature
node artgen/scripts/generate-ttg-art.mjs minimon-001 4
```

## Commands

| Command | Description |
|---------|-------------|
| `node artgen/scripts/generate-ttg-art.mjs <id> [n]` | Generate `n` variants (default 1, max 8) |
| `node artgen/scripts/generate-ttg-art.mjs --list` | List all available creatures |
| `node artgen/scripts/generate-ttg-art.mjs --line <name>` | Filter creatures by line |

## Structure

```
artgen/
├── creatures.json          # Character/creature definitions
├── styles/
│   ├── minimon.json        # Cute 90s collectible anime style
│   ├── cybermon.json       # Digital monster battle anime style
│   └── draco-bell.json     # Martial arts energy anime style
├── scripts/
│   └── generate-ttg-art.mjs # Main generator script
├── output/                 # Generated images + metadata
│   ├── minimon/
│   ├── cybermon/
│   └── draco-bell/
├── .env.example            # Configuration template
└── README.md               # This file
```

## Workflow

### 1. Create a creature entry

Add to `artgen/creatures.json`:

```json
{
  "id": "minimon-006",
  "line": "minimon",
  "name": "Frostwhirl",
  "category": "creature",
  "rarity": "rare",
  "element": "ice",
  "body": "small penguin-like creature with crystalline wings",
  "features": ["diamond wing tips", "frosty breath", "icy crown"],
  "mainColor": "ice blue",
  "accentColors": ["white", "silver"],
  "personality": "graceful and mysterious",
  "pose": "gliding across an ice surface with wings spread",
  "background": "soft snowflake pattern"
}
```

### 2. Generate variants

```bash
node artgen/scripts/generate-ttg-art.mjs minimon-006 8
```

### 3. Review

Each variant generates:
- `minimon-006-v01.png` — the image
- `minimon-006-v01.json` — metadata (prompt, model, status: draft)

### 4. Approve

When an image looks good, edit the metadata JSON:

```json
"status": "approved"
```

### 5. Export to game

Copy approved images to the public assets directory:

```bash
cp artgen/output/minimon/minimon-006-frostwhirl/minimon-006-v03.png \
   public/tazos/minimon/minimon-006.png
```

## Safety

The generator automatically blocks prompts containing franchise names:
pokémon, pikachu, digimon, agumon, dragon ball, goku, etc.

This prevents accidental IP contamination in generated artwork.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | — | **Required.** Your OpenAI API key |
| `IMAGE_MODEL` | `gpt-image-2` | Model to use for generation |
| `IMAGE_SIZE` | `1024x1024` | Output resolution |
| `IMAGE_QUALITY` | `high` | Generation quality |

## Lines

| Line | Style | Vibe |
|------|-------|------|
| **Minimon** | Cute 90s collectible anime | Friendly, colorful, plush-like creatures |
| **Cybermon** | Digital monster battle anime | Aggressive, armored, glowing circuits |
| **Draco Bell** | Martial arts energy anime | Athletic, dynamic, aura bursts |

## Rarity System

```
common → uncommon → rare → epic → legendary → mythic
```

## Dependencies

- `openai` — OpenAI API client
- `dotenv` — Environment variable loader
- Node.js 22+
