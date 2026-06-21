# ⚔️ Trading Tazos Game

<div align="center">

<img src="logo/social-preview.webp" alt="Trading Tazos Game" width="280" />

### Collect · Trade · Battle — 139 Original Tazos

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?logo=prisma)](https://www.prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Three.js](https://img.shields.io/badge/Three.js-0.181-000000?logo=threedotjs)](https://threejs.org)
[![License](https://img.shields.io/badge/license-Source_Available-blue)](./LICENSE)
[![Status](https://img.shields.io/badge/status-Live-brightgreen)](https://tradingtazosgame.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa)](https://tradingtazosgame.com/manifest.json)
[![i18n](https://img.shields.io/badge/i18n-10_languages-8B5CF6)](./src/lib/i18n/locales/)
[![Version](https://img.shields.io/badge/version-v0.11.2-FFCC00)](#changelog)
[![Design](https://img.shields.io/badge/design-Magazine_Game-FFCC00)]()

</br>

**Aim. Throw. Flip. Capture. Collect.**

Trading Tazos Game is a free browser-based digital tazo (pog) battle game built with a 90s gaming magazine aesthetic — cream paper, yellow mastheads, halftone dots, bold comic typography, and 3px black borders. Stake tazos face-down in a 3D arena, charge a vertical slam from above, and watch physics resolve flips, wobbles, and captures in real time.

The live catalog features **139 published tazos** across 3 original series: Minimon, Cybermon, and Dracobell.

🌐 **[tradingtazosgame.com](https://tradingtazosgame.com)** &nbsp;|&nbsp; 📧 **support@tradingtazosgame.com**

</div>

---


## 🎮 How the Game Works

Trading Tazos Game is **not** an auto-battler or card game. It's a game of **physical tazo throwing** — precision aiming, power charging, and real 3D physics.

### Core Game Loop

```
  SELECT deck & tazo → AIM (horizontal + vertical) → CHARGE power
       ↓
  THROW into 3D arena → IMPACT enemy tazos
       ↓
  FLIPS = captures / PUSHES = displacement / MISS = vulnerable
       ↓
  NEXT ROUND
```

1. **Stake face-down**: Pick a tazo from your active deck and place it on the arena
2. **Aim your slam**: 3-phase minigame — horizontal swing, vertical drop, power charge
3. **Throw**: Release into the 3D physics arena — the tazo falls from above
4. **Watch physics resolve**: Collision detection, momentum transfer, chain rebounds, flips
5. **Capture flips**: Flip an enemy tazo = you capture it. Push them out = you control the field
6. **Risk vs Reward**: Overpower may self-flip or fly out of bounds. Miss = vulnerable on the field

### Battle Modes
| Mode | Description |
|------|-------------|
| **Classic** | Capture all opponent tazos to win |
| **Rounds** | Points scoring per round — most captures wins |
| **Practice** | Free play vs AI — no login required |

### Throw Mechanics
| Power Level | Aim Circle | Impact | Accuracy | Risk |
|:-----------:|:----------:|:------:|:--------:|------|
| Low | Large 🟢 | Weak | High | Safe — stays in bounds |
| Medium | Medium 🟡 | Balanced | Normal | Standard risk |
| High | Small 🟠 | Strong | Low | May scatter unpredictably |
| Maximum | Tiny 🔴 | Devastating | Very Low | Self-flip or fly out |

---

## 📊 Tazo Stats System

Every tazo has 9 combat stats that determine its battle behavior:

| Stat | Code | Description |
|------|:----:|-------------|
| **Attack** | ATK | Impact power — how hard it hits opponents |
| **Defense** | DEF | Flipping resistance — stay upright on impact |
| **Resistance** | RES | Difficulty to be pushed or displaced |
| **Weight** | WGT | Physical mass — affects push force and stability |
| **Stability** | STB | Prevents self-flips, knockbacks, out-of-bounds |
| **Spin** | SPN | Maintains rotation and energy after landing |
| **Control** | CTL | Reduces throw deviation for better accuracy |
| **Bounce** | BNC | Improves rebounds and chained multi-hits |
| **Precision** | PRC | Improves aim, reduces horizontal/vertical error |

### Tazo Roles (8)
Attacker · Tank · Technical · Bouncer · Heavy · Light · Balanced · Special

### Rarity Tiers (5)
| Tier | Stars | Drop Rate |
|------|:-----:|-----------|
| Common | ★ | Standard |
| Uncommon | ★★ | Boosted |
| Rare | ★★★ | Rare boost |
| Ultra Rare | ★★★★ | High boost |
| Legendary | ★★★★★ | Mega |

---

## 🛍️ Bag Shop & Opening Flow

### Purchase → Tear → Reveal

```
  SHOP PAGE                    OPENING PHASE                  REVEAL PHASE
  ┌──────────┐                ┌──────────────┐               ┌──────────────┐
  │ 3D bag   │   Buy with     │ Drag-to-tear │  API call     │ Tazo disc    │
  │ previews │──▶ credits ──▶ │ top seal     │──▶ /bags/open │ animation    │
  │ (swaying)│                │ (3D Canvas)  │               │ + stats card │
  └──────────┘                └──────────────┘               └──────────────┘
```

1. **Browse bags**: 3D bag previews sway on hover — Standard (50cr), Premium (150cr), Mega (400cr)
2. **Buy**: Spend credits earned from battles, daily rewards, and quests
3. **Open — drag the seal**: Interactive 3D Canvas tear animation on the top seal
4. **Tazo revealed**: Fast 0.35s scale+fade animation → rarity badge → full stats card → collection link
5. **Bonus tazo**: Rare chance of a second bonus tazo in the same bag

### Bag Types
| Bag | Cost | Rare Boost | Contents |
|-----|:----:|:----------:|----------|
| Standard | 50cr | 1× | 1 tazo, random rarity |
| Premium | 150cr | 2× | 1 tazo, boosted rare chance |
| Mega | 400cr | 3× | 1 tazo, high legendary chance + bonus |

---

## 🎴 The Tazo Cards

Each tazo is a digital disc with:

- **Front art**: Original creature illustration on a circular disc
- **Physical finish**: Holo, foil, glossy, prismatic, metallic, chrome, rainbow, gold, matte, and more
- **Creature variants**: Shiny, shadow, golden — each rendered with CSS layers
- **TGA grading**: Each instance gets a professional-grade TGA certificate (tier, grade, surface, borders)
- **Back art**: Franchise-specific back design (Minimon, Cybermon, Dracobell)
- **Wear system**: Mint → Light Play → Played → Heavy Play → Damaged (affects appearance)

---

## 📚 Collections & Wiki

| # | Series | Theme | Tazos | Wiki Entities |
|:--:|--------|-------|:-----:|:-------------:|
| 1 | **Minimon** 🟡 | Luminara — Vital Spark lineage | 50 | 151 creatures |
| 2 | **Cybermon** 🔵 | Neon Grid — Soul Protocol awakening | 44 | 128 entities |
| 3 | **Dracobell** 🟠 | Bellora — Roar Aura resonance | 45 | 72 entities |
| | | **Total** | **139** | **351** |

All series are original TTG creations with full lore backstories, hero banners, and wiki catalogs accessible at `/?page=wiki`.

---

## 🗺️ Route Architecture

```
PUBLIC (22 routes — no auth):
  /                              Landing page (SPA, magazine theme)
  /login /register /forgot-password /reset-password /verify-email
  /?page=how-to-play             Slam mechanics tutorial
  /?page=collections             Public tazo gallery (3 series)
  /?page=tazos                   All 139 tazos browse
  /?page=leaderboard             Rankings
  /?page=download                Desktop app downloads
  /?page=faq                     FAQ
  /?page=shop                    Shop preview
  /?page=contact                 Support form
  /?page=wiki                    Wiki catalog (3 series, 351 entities)
  /?page=privacy /?page=terms /?page=cookies /?page=refund-policy /?page=disclaimer
  /battle/practice               Public practice arena (no auth, instant play)
  /tazos/[slug]                  Individual tazo detail
  /collection/[userId]           Public user collection
  /wiki/[series] /wiki/[series]/[slug]  Wiki series + detail pages (SSG, 351)

APP (9 routes — auth required):
  /app/collection                My tazo collection
  /app/battle                    Battle lobby (deck + mode + difficulty)
  /app/battle/play               Battle arena (3D, fullscreen)
  /app/shop                      Buy/open tazo bags
  /app/decks                     Deck builder
  /app/stats                     Player statistics + leaderboard
  /app/quests                    Quest system
  /app/settings                  Account settings
  /app/scanner                   Tazo scanner

ADMIN (9 routes):
  /admin                         Dashboard overview + DB stats
  /admin/tazos                   Tazo grid manager
  /admin/tazo-creator            New tazo art generator
  /admin/tazo-designer           Visual drag-and-drop tazo layout editor
  /admin/decks /admin/deck-models  Deck texture + 3D model editor
  /admin/shop-bags /admin/shop-bag-models  Bag texture + 3D model editor
  /admin/site-config             Site configuration editor
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Components, Turbopack) |
| Language | TypeScript 5.x (strict mode) |
| Styling | Tailwind CSS 4 + 60 custom `--ttg-*` design tokens |
| UI | shadcn/ui (Radix) + Lucide icons + Framer Motion |
| 3D Engine | Three.js + @react-three/fiber + @react-three/drei |
| Database | Prisma 6.x + SQLite (WAL mode) — 139 tazos, 12 models |
| Auth | JWT + bcryptjs (12 rounds) + httpOnly cookies |
| Multiplayer | WebSocket (ws) with JWT auth + room system |
| Desktop | Electron — Windows/macOS/Linux installers |
| Email | SMTP (Hostinger) — welcome, password reset, trade confirmations |
| Payments | Stripe integration for credits |
| Runtime | Node.js 22 (production) · Bun (development) |
| Deploy | PM2 + Caddy (TLS 1.3, CSP, HSTS) |
| CI/CD | GitHub Actions — typecheck before deploy |
| CLI | `@trading-tazos-game/cli` v1.0.4 — search, inspect, simulate battles |

---

## 📁 Project Structure

```
Trading-Tazos-Game/
├── prisma/
│   ├── schema.prisma          # 12 models: Tazo, User, UserTazo, Deck, BagPurchase...
│   ├── seed.ts                # Season 1 seed data + quests + achievements
│   └── seed-quests.ts         # 17 quests + 18 achievements
├── src/
│   ├── middleware.ts           # Auth route guard (/app/* → /login)
│   ├── app/
│   │   ├── layout.tsx          # Root layout (metadata, PWA, JSON-LD)
│   │   ├── page.tsx            # Landing (magazine SPA launcher)
│   │   ├── login/              # Auth pages (5: login, register, forgot, reset, verify)
│   │   ├── app/                # Dashboard (MagazinePageShell, 9 tabs)
│   │   │   ├── battle/         # Battle lobby + play (3D fullscreen arena)
│   │   │   ├── collection/     # Personal tazo manager
│   │   │   ├── shop/           # 3D bag shop (buy → tear → reveal)
│   │   │   ├── decks/          # Deck builder + active deck switcher
│   │   │   ├── stats/          # Player stats, leaderboard, progression
│   │   │   ├── quests/         # Daily/weekly/special quest system
│   │   │   ├── settings/       # User profile, avatar, password
│   │   │   └── scanner/        # Upload → detect → crop physical tazos
│   │   ├── admin/              # Admin panel (9 routes)
│   │   ├── wiki/               # Wiki catalog (SSG, 351 entity pages)
│   │   ├── tazos/[slug]/       # Individual tazo detail (public)
│   │   ├── collection/[userId]/ # Public user collection
│   │   └── api/                # 68 REST API endpoints
│   │       ├── auth/           # Login, register, OAuth, password reset
│   │       ├── bags/           # Buy, open, list
│   │       ├── battle/         # Battle engine, history
│   │       ├── collection/     # Personal + public collections
│   │       ├── credits/        # Balance, daily, purchase, rewarded ads
│   │       ├── decks/          # CRUD + active deck
│   │       ├── quests/         # Progress tracking
│   │       ├── tazos/          # Public catalog + search
│   │       ├── admin/          # Tazo CRUD, layouts, site config
│   │       └── webhooks/       # Stripe payment processing
│   ├── components/
│   │   ├── game/               # 46 game components
│   │   │   ├── 3d/             # Three.js: tazo-disc, bag, battle-stadium
│   │   │   ├── battle/         # Arena, HUD, slam controls, tutorial
│   │   │   └── launcher-view.tsx  # Magazine SPA launcher (1500+ lines)
│   │   ├── admin/              # Admin panel components (8)
│   │   ├── ui/                 # shadcn/ui primitives (~40)
│   │   ├── magazine-page-shell.tsx  # Dashboard shell (header + tabs + footer)
│   │   └── magazine-header.tsx      # Sticky header with auth state
│   ├── lib/
│   │   ├── battle/             # 14-phase deterministic battle engine
│   │   ├── i18n/               # 10-language system (250+ keys each)
│   │   ├── db.ts               # Prisma client singleton
│   │   ├── auth.ts             # JWT + bcrypt helpers
│   │   └── bag-geometry.ts     # 3D bag mesh generation (285 lines)
│   ├── server/
│   │   └── ws-server.js        # WebSocket server (PvP battles)
│   └── styles/
│       ├── tokens.css           # 60+ --ttg-* CSS variables (design system)
│       ├── globals.css          # Tailwind v4 @theme + magazine utilities
│       └── tazo-finishes.css    # Holographic/foil/prismatic CSS effects
├── electron/
│   └── main.js                 # Electron main process
├── public/
│   ├── logo/                   # 6 logo variants + social previews
│   ├── tazos-generated/        # 139 published tazo images
│   ├── textures/bags/           # 12 bag texture variants (3 series × 4)
│   └── manifest.json           # PWA manifest
├── scripts/
│   └── deploy.sh               # Build → rsync → PM2 restart (VPS)
├── src/styles/tokens.css        # Design system (60+ --ttg-* variables)
├── electron-builder.yml        # Desktop app build config
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Bun 1.x (or Node.js 22+)
- SQLite (bundled — no external DB)

```bash
git clone https://github.com/smouj/Trading-Tazos-Game.git
cd Trading-Tazos-Game

bun install
cp .env.example .env          # Set your JWT_SECRET
bunx prisma db push           # Create SQLite database
bun run seed                  # Season 1 dev seed + quests + achievements

bun run dev                   # http://localhost:3000
```

### Environment Variables

```bash
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret-here"
NEXT_PUBLIC_SITE_NAME="Trading Tazos Game"
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 🖥️ Desktop App

Native desktop installers available on the [Releases page](https://github.com/smouj/Trading-Tazos-Game/releases/latest).

| Platform | Format | Version |
|----------|--------|---------|
| Linux | AppImage · .deb | v0.11.2 |
| Windows | .exe (NSIS) | v0.11.2 |
| macOS | .dmg · .zip | v0.11.2 |

---

## 🔌 CLI

Search, inspect, and simulate battles from the terminal:

```bash
npm install -g @trading-tazos-game/cli
tazos search minimon     # Search tazo database
tazos info 25            # Full stats breakdown
tazos stats              # Collection statistics
tazos top --stat attack  # Leaderboard by any stat
tazos battle --seed 42   # Simulate a physics battle
```

[![npm](https://img.shields.io/npm/v/@trading-tazos-game/cli)](https://www.npmjs.com/package/@trading-tazos-game/cli) **v1.0.4** — [github.com/smouj/trading-tazos-game-cli](https://github.com/smouj/trading-tazos-game-cli)

---

## 🌍 Internationalization — 10 Languages

Auto-detected from browser/OS settings, persisted in localStorage.

| Code | Language | Coverage |
|:----:|----------|:--------:|
| EN | English | 100% |
| ES | Spanish | 100% |
| PT | Portuguese | 100% |
| DE | German | 100% |
| FR | French | 100% |
| IT | Italian | 100% |
| JA | Japanese | 100% |
| KO | Korean | 100% |
| ZH | Chinese | 100% |
| RU | Russian | 100% |

---

## 🎨 Design System

The game uses a **90s gaming magazine** aesthetic (full design system in `src/styles/tokens.css`):

- **60+ CSS tokens** in `tokens.css` (`--ttg-yellow`, `--ttg-black`, `--ttg-red`, ...)
- **Typography**: All `font-black` + `uppercase` — 7-level hierarchy
- **Borders**: 4-level system on `#1a1a1a` with drop shadows
- **Components**: `mag-card`, `mag-btn`, `mag-stroke` utility classes
- **Sharp corners**: No rounded-lg/xl/2xl/md — only `rounded-full` for discs/swatches
- **Halftone**: Dot pattern overlay on cream backgrounds
- **Color stripes**: Decorative gold/black/red strip borders

---

## 🌐 Production Architecture

```
tradingtazosgame.com
  └── Caddy (TLS 1.3, gzip, CSP, HSTS, WS upgrade)
      ├── PM2 ttg      (fork, :3000) — Next.js standalone
      └── PM2 ttg-ws   (fork, :3001) — WebSocket PvP server
```

---

## 🏷️ Changelog

### v0.11.2 — Desktop Metadata + Ops Polish (Jun 2026)

- Aligns Electron runtime metadata, Electron package metadata, and installer workflow defaults to v0.11.2.
- Fixes the DB backup helper to use the canonical production database path (`data/dev.db`).
- Polishes deployment docs/comments, seed wording, manifest collection copy, and the npm CLI badge URL.

### v0.11.1 — CI + PWA Manifest Alignment (Jun 2026)

- Aligns package, site metadata, PWA manifest, and desktop download links to v0.11.1.
- Fixes the CI smoke database seed so `/tazos/cipherion` SSG SEO checks pass reliably.
- Includes post-v0.11.0 battle, security, game-core, and monorepo structure fixes.

### v0.11.0 — Multi-Arena + AI Strategy + Staked Pipeline Fix + Monorepo (Jun 2026)
- **3 new arenas**: Lava Pit, Crystal Cave, Zero-G Chamber with distinct physics
- **4 AI strategy profiles**: aggressive, balanced, defensive, chaotic
- **Critical staked pipeline fix**: staked tazos now update after every slam
- **packages/game-core**: Pure game rules engine — zero React/Next deps
- **packages/game-physics**: Extracted physics engine with collision/flip simulation
- **State machine v6**: mode_select + rewards states
- **69 tests** (3 test files, 0 TS errors)
- **Copy fix**: "Choose 5 tazos" → "Choose 20 tazos"
- **CLI synced**: trading-tazos-game-cli now shares canonical constants

- **Bag opening fixes**: Overflow hidden → scrollable reveal stats, 0.35s tazo animation (was 0.7s), NaN safety on all stats
- **Canvas fixes**: 13 CSS var → hex for Canvas 2D API (addColorStop/strokeStyle runtime errors)
- **Data accuracy**: 150→139 honest counts across 4 files (SEO, metadata, launcher, site-config)
- **i18n polish**: 39 accent fixes in es/pt/fr (puntería, coleção, déjà, etc.)
- **Auth unification**: All 5 auth pages share identical halftone + stripe backgrounds
- **Collections lore**: Hero banners with original TTG backstories, no borrowed franchise content
- **Admin polish**: Tube→Deck rename, Bag→Shop Bag canonical naming, color token migration
- **Battle**: Fullscreen loading state, battle i18n strings in all 10 locales

### v0.9.0 — Wiki + XP System + Leaderboard (Jun 2026)
- **Wiki system**: `/wiki/[series]` and `/wiki/[series]/[slug]` — 351 SSG entity pages
- **XP & Leveling**: Progressive XP curve, 10 level titles, Pokémon-style user ID card
- **Leaderboard**: Top 10 by level, XP rewards for quests and battles
- **Smooth battle launch**: 1.2s cinematic transition, body state restore on exit
- **Tutorial spotlight**: box-shadow cutouts — game visible during tutorial
- **Wiki routes**: `/wiki` → 308 → `/?page=wiki` (folded into launcher)

### v0.8.0 — Design System + Token Migration (Jun 2026)
- **Design tokens**: 60+ `--ttg-*` CSS variables in `tokens.css` v1.0
- **Tailwind v4 `@theme`**: hex-based values (not space-separated RGB channels)
- **Token migration**: 270+ hardcoded hex → `var(--ttg-*)` across 32+ files
- **CSS var opacity fix**: ~20 invalid `var(--ttg-*)NN` patterns reverted to hex+alpha

### v0.7.0 — Battle Rebuild + Dashboard Polish (Jun 2026)
- **Vertical slam mechanic**: Tazos fall from above — 3-phase control UI
- **3D arena**: Three.js/R3F with deterministic physics, seed-based RNG
- **9 combat stats** with 8 tazo roles, physical finish system (12 finishes)
- **Dashboard**: 7 tabs under `/app/*` with magazine aesthetic
- **3D bag shop**: Tear-to-open animation, rarity-based reveal

### v0.5.0 — Admin Panel + Tazo Designer (Jun 2026)
- **Admin panel**: Full CRUD at `/admin/tazos` — publish/unpublish, edit all fields
- **Tazo Designer v2.0**: Visual drag-and-drop layout editor, 50-step undo/redo
- **TGA grading**: Professional card grading system (tier, grade, surface, borders)
- **PWA**: Full manifest, installable on mobile and desktop

### v0.3.0 — 3D Shop + Quests + Desktop + SEO (Jun 2026)
- 3D chip bag shop with tear animation and rarity-based drops
- 17 quests across 4 categories, 18 achievements (Bronze → Platinum)
- Global leaderboards: credits, tazos collected, battles played
- Electron desktop launcher, 10-language i18n, hreflang SEO
- WebSocket multiplayer: JWT auth, matchmaking queue, room system

### v0.2.0 — Battle Engine v2 (Jun 2026)
- 9-stat combat system, 8 tazo roles, self-flip mechanic
- Rounds game mode with points scoring
- Deterministic battle engine for future PvP sync

### v0.1.0 — Initial Launch (Jun 2026)
- 3 original TTG series (Minimon, Cybermon, Dracobell)
- 3D battle arena with Three.js physics simulation
- Personal collection with franchise, rarity, and stats filters

---

## ⚠️ Disclaimer

**This is an original independent game.** Minimon, Cybermon, and Dracobell are fictional TTG collections with original lore, stats, and visuals. No third-party images, audio, brand assets, or copyrighted characters are included; the game's engine, design, styling, and codebase are original work.

---

## 📄 License

**Source Available License v1.0** — see [LICENSE](./LICENSE).

- ✅ Personal use, modification, and self-hosting
- ✅ Contributions welcome (grant license back)
- ❌ Commercial redistribution without permission
- ❌ Selling the software or offering it as a service

---

<div align="center">

**Made by [@smouj](https://github.com/smouj)** &nbsp;|&nbsp; **[tradingtazosgame.com](https://tradingtazosgame.com)**

*Digital tazos. Real 3D physics. Pure nostalgia.*

</div>
