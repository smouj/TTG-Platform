# Trading Tazos Game

> **Physical tazo battle game. Aim. Throw. Flip. Capture. Win.**

A web-based tazo (pog) battle game where players physically throw tazos into a circular arena, aiming to flip and capture opponent tazos through skill-based mechanics — not just stat comparisons.

**Status**: Active Development • **Domain**: medaclawarena.com • **Contact**: support@medaclawarena.com

---

## Game Identity

Trading Tazos Game is not a card game with stats. It's not auto-battle.

**It's a game of physical tazo throwing with aim, power, physics, rebounds, risk, and field control.**

### Core Loop
1. **Select** a tazo from your hand
2. **Aim** horizontally and vertically with timing-based accuracy
3. **Charge** power (more power = more impact but less accuracy)
4. **Throw** into the arena
5. **Impact** enemy tazos — flip them to capture, push them, or chain rebounds
6. **Risk/reward**: miss and your tazo stays vulnerable on the field. Throw too hard and it flies out — the rival decides where to place it.

---

## Features

### Battle Arena
- Canvas 2D arena with real-time physics simulation
- Horizontal aim + vertical aim + power charge minigame
- Collision detection, edge/side/center impacts
- Multiple tazo hits per throw (chain rebounds)
- Deterministic physics via seeded RNG
- AI opponent with auto-resolve turns

### Digital Album
- Browse **319 real tazos** across 3 franchises from verified Spanish collections
- 3 collections: **Pokémon Tazos 1** (Matutano 2000, 51 tazos), **DBZ Matutano 1995** (118 tazos in 7 categories), **Digimon Magic Box 2000** (150 caps)
- Filter by franchise, collection, category, variant, source status
- Tazo detail modal with stats, skills, evolutions, battle record

### Stats Dashboard
- Collection progress tracking
- Franchise/rarity/condition breakdowns
- Top combatants leaderboard

### Scanner
- Upload and crop tazo photos
- Automatic circular shape detection

---

## Game Mechanics

### Tazo Roles

| Role | Description |
|------|-------------|
| **Attacker** | High attack, good impact, high risk if left on field |
| **Tank** | High defense/resistance, hard to flip |
| **Technical** | High precision/control, ideal for edge shots |
| **Rebounder** | High bounce, can hit multiple tazos |
| **Heavy** | High weight, pushes hard, less control |
| **Light** | Easy to throw, vulnerable on field |
| **Legendary** | High stats across the board but higher risk to lose |

### Throw Mechanics

| Power | Circle | Impact | Risk |
|-------|--------|--------|------|
| Low | Large | Weak hit | High accuracy |
| Medium | Medium | Balanced | Normal |
| High | Small | Strong hit | Less accuracy |
| Maximum | Tiny | Devastating | May fly out of arena |

### Field Rules
- **Miss, stay in**: Tazo stays on field where it landed
- **Miss, out of bounds**: Rival places it anywhere in the arena
- **Capture 1+**: Thrower returns to hand
- **No manual stacking**: Tazos can only stack via physics (rebound, collision)
- **Physics stacking**: A tazo on top makes the bottom one harder to hit directly

### Battle Modes
- **Classic**: Capture all enemy tazos
- **Rounds**: Most captures in X turns
- **Competitive**: Points for captures, flips, accuracy, field control
- **Arena**: Leave rival with no usable tazos

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + Custom Magazine Theme |
| UI | shadcn/ui (New York) + Lucide React |
| Database | Prisma ORM + SQLite |
| Battle Engine | Custom deterministic engine in `src/lib/battle/` |
| Rendering | HTML5 Canvas 2D |
| Runtime | Bun |

---

## Project Structure

```
Trading-Tazos-Game/
├── prisma/
│   ├── schema.prisma           # DB schema (Franchise, Collection, Tazo, BattleRecord)
│   └── seed.ts                 # 319 real tazos from verified Spanish collections
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── tazos/          # CRUD + toggle-owned
│   │   │   ├── battle/         # Battle simulation endpoint
│   │   │   ├── franchises/     # Franchise data
│   │   │   ├── stats/          # Dashboard stats
│   │   │   └── scanner/        # Upload, detect, crop
│   │   ├── globals.css         # Magazine theme
│   │   ├── layout.tsx
│   │   └── page.tsx            # Main SPA
│   ├── components/
│   │   ├── game/
│   │   │   ├── album-view.tsx
│   │   │   ├── battle-view.tsx          # Main battle UI
│   │   │   ├── battle/
│   │   │   │   ├── battle-arena-canvas.tsx   # 2D arena renderer
│   │   │   │   ├── launch-control.tsx        # Aim + power controls
│   │   │   │   ├── battle-event-log.tsx      # Turn-by-turn log
│   │   │   │   └── battle-result-panel.tsx   # Victory/defeat screen
│   │   │   ├── scanner-view.tsx
│   │   │   ├── stats-panel.tsx
│   │   │   ├── tazo-card.tsx
│   │   │   ├── tazo-detail-modal.tsx
│   │   │   ├── tazo-editor.tsx
│   │   │   └── add-tazo-dialog.tsx
│   │   └── ui/                 # shadcn/ui primitives
│   ├── lib/
│   │   ├── battle/
│   │   │   ├── battle-types.ts     # All type definitions
│   │   │   ├── battle-rules.ts     # Physics, formulas, RNG
│   │   │   ├── battle-engine.ts    # State machine + AI
│   │   │   └── index.ts            # Barrel export
│   │   ├── game/types.ts
│   │   ├── db.ts
│   │   └── utils.ts
│   └── hooks/
├── public/tazos/               # 319 generated SVG tazo images
│   ├── pokemon/ (51 — Pokémon Tazos 1)
│   ├── digimon/ (150 — Digimon Magic Box 2000)
│   └── dbz/ (118 — DBZ Matutano 1995, 7 categories)
├── .zscripts/
│   └── generate-tazos-svg.ts   # Tazo image generator
├── deploy.sh                   # Build + rsync + restart deploy script
├── ecosystem.config.cjs        # PM2 process config
└── Caddyfile                   # Caddy reverse proxy config
```

---

## Getting Started

```bash
# Clone
git clone https://github.com/smouj/Trading-Tazos-Game.git
cd Trading-Tazos-Game

# Install
bun install

# Set up database
bun run db:push
bun run seed

# Generate tazo images
bun run .zscripts/generate-tazos-svg.ts

# Develop
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Domain & Deployment

- **Production**: https://medaclawarena.com (VPS `rpgvps`, Caddy → PM2 `ttg` on port 3000)
- **Contact**: support@medaclawarena.com
- **MedaClaw Arena**: Archived/stopped — domain now serves TTG

### Deploy (local → VPS)
```bash
./deploy.sh          # Build + rsync + restart + verify
```

### Manual VPS commands
```bash
ssh rpgvps "pm2 status"                          # Check process
ssh rpgvps "pm2 logs ttg --lines 20 --nostream"  # Recent logs
ssh rpgvps "pm2 restart ttg"                     # Restart
```

---

## Disclaimer

This is a fan-made tribute project. Pokemon, Digimon, and Dragon Ball Z are trademarks of their respective owners. No copyrighted assets are included — all tazo images are original generated SVGs.

---

## License

Private repository. All rights reserved.
