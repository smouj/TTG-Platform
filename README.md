# 🎴 Trading Tazos Game

<div align="center">

<img src="./docs/screenshots/logo-social.png" alt="Trading Tazos Game" width="280" />

### A Skill-Based Physical Tazo Battle Game

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?logo=prisma)](https://www.prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Bun](https://img.shields.io/badge/Bun-1.x-FBF0DF?logo=bun)](https://bun.sh)
[![License](https://img.shields.io/badge/license-Source_Available-blue)](./LICENSE)
[![Status](https://img.shields.io/badge/status-Live-brightgreen)](https://medaclawarena.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa)](https://medaclawarena.com/manifest.json)
[![i18n](https://img.shields.io/badge/i18n-10_languages-8B5CF6)](./src/lib/i18n/locales/)
[![Version](https://img.shields.io/badge/version-v0.3.0-FFCC00)](#changelog)

<br/>

**Aim. Throw. Flip. Capture. Collect.**

Trading Tazos Game is a browser-based physical tazo (pog) battle game. You don't just compare stats — you physically aim, charge power, and throw tazos into a physics-simulated arena. Built with a 90s Nintendo Power magazine aesthetic, 319 tazos across 3 collections (Minimon, Dracobell, Cybermon), 9 combat stats, 8 roles, a deterministic battle engine, WebSocket PvP multiplayer, and a full progression system.

🌐 **[medaclawarena.com](https://medaclawarena.com)** &nbsp;|&nbsp; 📧 **support@medaclawarena.com**

</div>

---

## Screenshots

<div align="center">

| Landing Page | Shop (Auth) | Quests (Auth) |
|:---:|:---:|:---:|
| <img src="docs/screenshots/home.png" width="320" alt="Magazine-style landing with hero and collections"> | <img src="docs/screenshots/shop.png" width="320" alt="3D chip bag shop with tear animation"> | <img src="docs/screenshots/quests.png" width="320" alt="Daily and weekly quests with progress bars"> |

| Leaderboard | Download | Sign In |
|:---:|:---:|:---:|
| <img src="docs/screenshots/leaderboard.png" width="320" alt="Global rankings by credits, tazos, and battles"> | <img src="docs/screenshots/download.png" width="320" alt="Desktop app downloads for Windows, macOS, Linux"> | <img src="docs/screenshots/login.png" width="320" alt="Magazine-themed login and registration"> |

| App Tabs — Album | App Tabs — Battle | App Tabs — Scanner |
|:---:|:---:|:---:|
| <img src="docs/screenshots/collection.png" width="320" alt="Album tab — filterable tazo grid"> | <img src="docs/screenshots/battle.png" width="320" alt="Canvas 2D physics battle with aim controls"> | <img src="docs/screenshots/scanner.png" width="320" alt="Upload → crop → detect physical tazo"> |

| Collection (Auth) | Decks (Auth) | Stats (App Tab) |
|:---:|:---:|:---:|
| <img src="docs/screenshots/collection.png" width="320" alt="Personal tazo collection with stats"> | <img src="docs/screenshots/decks.png" width="320" alt="Deck builder with active deck management"> | <img src="docs/screenshots/stats.png" width="320" alt="Collection analytics and stats"> |

</div>

---

## What Makes It Different

Trading Tazos Game is **not** an auto-battle card game.
It's a game of **physical tazo throwing** — aim, power, physics, chain rebounds, risk, and field control.

### Core Game Loop

1. **Select** a tazo from your active deck
2. **Aim** horizontally and vertically with timing-based precision
3. **Charge** power — more impact, less accuracy
4. **Throw** into the 2D physics arena
5. **Impact** enemy tazos — flip to capture, push them out, or chain rebounds
6. **Risk it**: miss and your tazo stays vulnerable. Throw too hard and it flies out — the rival places it anywhere.

---

## Features

### Battle System
| Feature | Detail |
|---------|--------|
| Battle Engine | 14-phase deterministic state machine with SeededRNG |
| Combat Stats | Attack, Defense, Resistance, Weight, Stability, Spin, Control, Bounce, Precision |
| Tazo Roles | Attacker, Tank, Technical, Bouncer, Heavy, Light, Balanced, Special (8 roles) |
| Aim Mechanics | 3-phase minigame: horizontal swing → vertical drop → power charge |
| Physics | Canvas 2D collision detection, multi-hit chains, self-flip mechanic |
| Game Modes | Classic (capture all) + Rounds (points scoring per round) |
| Risk System | Overpower = may fly out of bounds. Miss = vulnerable on field |
| Event Log | Turn-by-turn Spanish battle descriptions with styled impact messages |

### Collection & Progression
| Feature | Detail |
|---------|--------|
| Tazo Database | 319 tazos: 51 Minimon, 118 Dracobell, 150 Cybermon |
| Personal Collection | Track owned tazos, mark favorites, view acquisition dates |
| Decks | Build, name, and activate battle decks (5 tazos each) |
| Welcome Pack | 10 starter tazos + pre-built deck on registration |
| Stats Panel | Collection completion %, franchise breakdown, rarity distribution |

### Economy & Shop
| Feature | Detail |
|---------|--------|
| 3D Bag Shop | Buy tazo bags with credits, tear them open with 3D animation, reveal what you got |
| Bag Types | Standard (50cr), Premium (150cr), Mega (400cr) with rare boost multipliers |
| Credit System | Earn via battles (+30), daily login (+25), quests (+50–200) |
| Rarity System | 5 tiers: Common, Uncommon, Rare, Ultra-Rare, Legendary |
| Weighted Drops | Rare boost multiplier per bag type (1× / 2× / 3×) |

### Quests & Achievements
| Feature | Detail |
|---------|--------|
| Quests | 17 quests: Beginner, Daily, Weekly, and Special categories |
| Achievements | 18 achievements: Bronze → Silver → Gold → Platinum |
| Leaderboards | Global rankings by credits, tazos collected, or battle wins |
| Progress Tracking | Per-quest progress bars + per-achievement unlock tracking |

### Multiplayer
| Feature | Detail |
|---------|--------|
| PvP Battles | Real-time WebSocket matchmaking with JWT auth |
| Room System | Private battle rooms between two players |
| Match Events | Live turn-by-turn event log synced to both clients |

### Platform
| Feature | Detail |
|---------|--------|
| Web | Full Next.js 16 app at [medaclawarena.com](https://medaclawarena.com) |
| PWA | Installable on mobile and desktop with manifest.json |
| Desktop | Electron app for Windows, macOS, Linux ([v0.3.0](https://github.com/smouj/Trading-Tazos-Game/releases/tag/v0.3.0)) |
| i18n | 10 languages: EN, ES, PT, DE, FR, IT, JA, KO, ZH, RU |
| SEO | JSON-LD VideoGame schema, sitemap.xml, robots.txt, hreflang alternates |
| Security | CSP + HSTS + X-Frame-Options + httpOnly auth cookies |

---

## Collections

| # | Collection | Origin | Tazos |
|:--:|-----------|--------|:-----:|
| 1 | **Minimon** — inspired by Pokémon Tazos 1 (Matutano, 2000) | Spain | 51 |
| 2 | **Dracobell** — inspired by Dragon Ball Z (Matutano, 1995) | Spain | 118 |
| 3 | **Cybermon** — inspired by Digimon Magic Box (2000) | Spain | 150 |
| | | **Total** | **319** |

All 319 tazos verified against original Spanish physical collections. Each tazo has 9 balanced combat stats, a tactical role, and evolutive relationships (pre-evolution, evolution, transformation stage). Names have been minimally tweaked to avoid IP conflicts while staying instantly recognizable.

---

## Combat Stats

| Stat | Icon | Description |
|------|:----:|-------------|
| Attack | ATK | Impact power — how hard it hits opponents |
| Defense | DEF | Flipping resistance — stay upright on impact |
| Resistance | RES | Difficulty to be flipped or pushed |
| Weight | WGT | Physical mass — affects damage, push force, and stability |
| Stability | STB | Prevents self-flips, knockbacks, and out-of-bounds |
| Spin | SPN | Maintains rotation and energy after landing |
| Control | CTR | Reduces throw deviation for better accuracy |
| Bounce | BNC | Improves rebounds and chained multi-hits |
| Precision | PRC | Improves aim and reduces horizontal/vertical error |

### Throw Risk / Reward

| Power Level | Circle Size | Impact | Accuracy | Risk |
|:-----------:|:-----------:|:------:|:--------:|------|
| Low | Large | Weak | High | Safe — stays in bounds |
| Medium | Medium | Balanced | Normal | Standard risk |
| High | Small | Strong | Low | May scatter unpredictably |
| Maximum | Tiny | Devastating | Very Low | High chance of self-flip or flying out |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1 (App Router, Server Components, Turbopack) |
| Language | TypeScript 5.x (strict mode) |
| Styling | Tailwind CSS 4 + custom magazine theme system ([THEME.md](./THEME.md)) |
| UI Components | shadcn/ui (Radix primitives) + Lucide React icons |
| 3D Rendering | Three.js + @react-three/fiber + @react-three/drei |
| Battle Graphics | HTML5 Canvas 2D with deterministic physics |
| ORM | Prisma 6.x (12 models, automated migrations) |
| Database | SQLite (zero-config, portable, 360 KB with 319 tazos) |
| Auth | JWT (jsonwebtoken) + bcryptjs (12 rounds) + httpOnly cookies |
| Multiplayer | WebSocket (ws) with JWT auth and room system |
| Desktop | Electron with animated splash, system tray, single-instance lock |
| Runtime | Bun (build) + Node.js 22 (production) |
| Monitoring | Plausible Analytics (self-hosted) |

---

## Project Structure

```
Trading-Tazos-Game/
├── prisma/
│   ├── schema.prisma        # 12 models + automated migrations
│   ├── seed.ts              # 319 tazos (seed data)
│   └── seed-quests.ts       # 17 quests + 18 achievements
├── src/
│   ├── middleware.ts         # Auth route protection
│   ├── app/
│   │   ├── page.tsx          # Landing page (hero, collections, CTAs)
│   │   ├── layout.tsx        # Root layout (SEO, PWA, JSON-LD, i18n)
│   │   ├── app/              # 🎮 Game tabs (album, battle, scanner, stats)
│   │   ├── collection/       # Personal tazo collection
│   │   ├── decks/            # Deck builder + active deck switcher
│   │   ├── shop/             # 3D bag shop (buy → open → reveal)
│   │   ├── quests/           # Quest system (daily, weekly, special)
│   │   ├── leaderboard/      # Global rankings
│   │   ├── download/         # Desktop app downloads
│   │   ├── how-to-play/      # Public SEO page — game guide
│   │   ├── battle-system/    # Public SEO page — combat mechanics
│   │   ├── collections/      # Public SEO pages — franchise showcases
│   │   ├── tazos/            # Public catalog + rarity tiers
│   │   ├── faq/              # Public FAQ page
│   │   ├── terms/            # Legal pages
│   │   ├── privacy/          #
│   │   ├── cookies/          #
│   │   ├── disclaimer/       #
│   │   ├── login/            # Auth pages
│   │   ├── register/         #
│   │   └── api/              # 14 REST API route groups
│   ├── components/game/
│   │   ├── battle/           # Arena canvas, launch controls, event log, results
│   │   ├── 3d/               # 3D tazo discs, chip bags, scenes
│   │   ├── album-view.tsx    # Filterable tazo grid (4 tabs)
│   │   ├── tazo-card.tsx     # Individual tazo display
│   │   ├── tazo-detail-modal.tsx  # 9-stat detail + evolutive info
│   │   ├── stats-panel.tsx   # Collection analytics
│   │   └── scanner-view.tsx  # Upload → crop → detect physical tazo
│   └── lib/
│       ├── battle/           # 14-phase deterministic engine
│       ├── i18n/             # 10-language system with auto-detection
│       ├── auth.ts           # JWT + bcrypt helpers
│       ├── auth-context.tsx  # AuthProvider + useAuth hook
│       ├── multiplayer.ts    # WebSocket client (auto-reconnect)
│       └── db.ts             # Prisma client singleton
├── electron/
│   └── main.js               # Electron main process
├── src/server/
│   └── ws-server.js          # Standalone WebSocket server
├── public/
│   ├── logo/                 # 6 logo variants + social banners
│   ├── manifest.json         # PWA manifest
│   ├── robots.txt            # SEO + AI crawler rules
│   └── sitemap.xml           # 21 URLs with hreflang alternates
├── THEME.md                  # Design system spec (colors, typography, components)
├── electron-builder.yml      # Desktop app build config
├── build-electron.sh         # Electron build script
└── package.json
```

> **Note:** Device-specific config files (`deploy.sh`, `ecosystem.config.cjs`, `Caddyfile`, `.zscripts/`) are excluded from the public repo. Template versions are available for self-hosting: [`deploy.example.sh`](./deploy.example.sh), [`Caddyfile.example`](./Caddyfile.example), [`ecosystem.config.ci.example.cjs`](./ecosystem.config.ci.example.cjs).

---

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) 1.x (or Node.js 22+)
- SQLite (bundled — no external DB needed)

### Install & Run

```bash
git clone https://github.com/smouj/Trading-Tazos-Game.git
cd Trading-Tazos-Game

bun install                              # Dependencies
cp .env.example .env                     # Set your JWT_SECRET
bunx prisma db push                      # Create database
bun run seed                             # 319 tazos + 17 quests + 18 achievements

bun run dev                              # http://localhost:3000
```

### Environment Variables

```bash
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="generate-a-random-secret-here"
NEXT_PUBLIC_SITE_NAME="Trading Tazos Game"
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Deployment

The live app runs at **[medaclawarena.com](https://medaclawarena.com)** using PM2 + Caddy on a VPS. See [`deploy.example.sh`](./deploy.example.sh) for the annotated deploy pipeline and [`Caddyfile.example`](./Caddyfile.example) for the reverse-proxy configuration.

### Production Architecture

```
medaclawarena.com
  └── Caddy (TLS 1.3, gzip, CSP, HSTS, WebSocket upgrade)
      ├── PM2 `ttg`     (fork, :3000) — Next.js standalone server
      └── PM2 `ttg-ws`  (fork, :3001) — WebSocket battle server
```

---

## i18n — 10 Languages

Detects language from `navigator.languages` / `Accept-Language` header, persists in `localStorage`.

| Code | Language    | Coverage |
|:----:|-------------|:--------:|
|  EN  | English     | 100%     |
|  ES  | Spanish     | 100%     |
|  PT  | Portuguese  | 100%     |
|  DE  | German      | 100%     |
|  FR  | French      | 100%     |
|  IT  | Italian     | 100%     |
|  JA  | Japanese    | 100%     |
|  KO  | Korean      | 100%     |
|  ZH  | Chinese     | 100%     |
|  RU  | Russian     | 100%     |

---

## Design System

The game uses a **90s Nintendo Power / Pokémon Magazine** aesthetic specified in [`THEME.md`](./THEME.md). Every visual element follows a documented design system:

- 12-token color palette (`#FFCC00` yellow, `#E3350D` red, `#3B4CCA` blue, ...)
- 7-level typography hierarchy (all `font-black` + `uppercase`)
- 4-level border + shadow system on `#1a1a1a`
- 30+ documented CSS utility classes (`mag-card`, `mag-btn`, `mag-stroke`, `mag-bg`, ...)
- Component anatomy diagrams for cards, buttons, page shells
- 15 anti-pattern rules (no emojis, no grays, no `rounded-xl`, no default Tailwind shadows)

---

## Desktop App

Linux installers are available on the [Releases page](https://github.com/smouj/Trading-Tazos-Game/releases). Windows and macOS builds run via GitHub Actions on tag push.

| Platform | Format | Status |
|----------|--------|--------|
| Linux | AppImage, .deb | ✅ Available |
| Windows | .exe (NSIS) | 🚧 Coming via CI |
| macOS | .dmg, .zip | 🚧 Coming via CI |

---

## CLI

```bash
npm install -g @trading-tazos-game/cli
```

Search, inspect, and battle tazos from your terminal:

```bash
tazos search bulbasaur     # Search the tazo database
tazos info charizardé       # Full stats breakdown
tazos stats                 # Collection statistics
tazos top --stat attack     # Leaderboard by any stat
tazos battle --seed 42      # Simulate a physics battle
```

🔗 [npm package](https://www.npmjs.com/package/@trading-tazos-game/cli) &nbsp;|&nbsp; 📦 [CLI repo](https://github.com/smouj/trading-tazos-game-cli)

---

## Disclaimer

**This is an original game built on verified physical collection data.** Tazo names have been minimally tweaked to avoid intellectual property conflicts with the franchises that inspired the original physical tazos (Pokémon, Dragon Ball, Digimon). No copyrighted images, audio, or brand assets are included — all tazo visuals are original generated SVGs. The game's engine, design, styling, and codebase are original work.

---

## License

**Source Available License v1.0** — see [LICENSE](./LICENSE) for full terms.

- ✅ Personal use, modification, and self-hosting
- ✅ Contributions welcome (grant license back)
- ❌ Commercial redistribution without permission
- ❌ Selling the software or offering it as a service

---

## Changelog

### v0.3.0 — 3D Shop + Quests + Desktop App + Public SEO (Jun 2026)
- 13 public SEO pages: landing, how-to-play, battle-system, collections, tazos, FAQ
- 4 legal pages: terms, privacy, cookies, disclaimer
- 2-shell architecture: PublicHeader (SEO/legal) + MagazinePageShell (game/auth)
- 4 game tabs in `/app?tab=...` (album, battle, scanner, stats) with legacy redirects
- Auth middleware with httpOnly cookies and login redirect
- 3D chip bag shop with tear animation and rarity-based drops
- Credit economy: battles +30cr, daily login +25cr, quests +50–200cr
- 17 quests across 4 categories with progress tracking
- 18 achievements with 4-tier progression (Bronze → Platinum)
- Global leaderboards: credits, tazos collected, battle wins
- Auth middleware with httpOnly cookies and login redirect
- PWA manifest, installable, offline-ready
- Electron desktop launcher: animated splash, system tray, single-instance
- Linux installers: .AppImage + .deb
- SEO: JSON-LD VideoGame schema, sitemap.xml, robots.txt, hreflang
- Design system spec ([THEME.md](./THEME.md)) with documented tokens
- WebSocket multiplayer: JWT auth, room system, live event sync
- Security: CSP, HSTS, X-Frame-Options, httpOnly auth cookies
- Page-specific metadata with unique titles per route

### v0.2.3 — Auth & Deck System
- JWT authentication with bcrypt password hashing (12 rounds)
- Personal tazo collection per user with favorites
- Deck builder with active deck switching (5 tazos per deck)
- Welcome pack: 10 starter tazos + pre-built deck on registration
- WebSocket multiplayer server with native crypto JWT

### v0.2.0 — Battle Engine v2
- 9-stat combat system: Attack, Defense, Resistance, Weight, Stability, Spin, Control, Bounce, Precision
- 8 tazo roles with unique stat distributions
- Self-flip mechanic: overpower = you flip yourself
- Combo bonus: 2+ captures in one throw = extra points
- Rounds game mode with points scoring
- i18n: 10 languages with auto-detection
- Canonical franchise naming (Minimon, Dracobell, Cybermon)

### v0.1.0 — Initial Launch
- 319 verified Spanish tazos across 3 collections
- Canvas 2D battle arena with physics simulation
- 14-phase deterministic battle engine with SeededRNG
- 90s Nintendo Power magazine aesthetic
- Filterable album with franchise, collection, category, and rarity filters
- Photo scanner for physical tazo detection
- 3D tazo disc rendering (Three.js / R3F)

---

<div align="center">

**Made by [@smouj](https://github.com/smouj)** &nbsp;|&nbsp; **[medaclawarena.com](https://medaclawarena.com)**

*Physical tazos. Real physics. Pure nostalgia.*

</div>
