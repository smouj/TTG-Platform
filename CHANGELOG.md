# Changelog

## v0.3.2 — Security + Magazine + Battle Unification (2026-06-05)

### 🔒 Security Hardening
- **POST /api/tazos**: Now admin-only — requires valid JWT + admin email authentication
- **JWT_SECRET**: All 3 hardcoded fallbacks removed (`lib/auth.ts`, `api/admin/route.ts`, `server/ws-server.*`) — app fails fast if env var is missing
- **/admin**: Blocked via `robots.txt` (`Disallow: /admin`), removed from `sitemap.xml`, added `<meta name="robots" content="noindex,nofollow">`
- **Admin API**: Consolidated to use shared `getAuthUser()` from `@/lib/auth` instead of standalone JWT verification

### 📊 Leaderboard + Tazos Improvements
- **Real battle counts**: Added `userId`, `score`, `turns` to `BattleRecord` schema — leaderboard now counts real battles instead of proxy estimates
- **Win count display**: Battle sort shows "W" wins count next to tazo count
- **Improved empty state**: "Leaderboard Awaits" with red CTA button — more compelling for new visitors
- **Featured Tazos preview**: `/tazos` now shows 5 highlighted legendary/ultra/rare tazos in a `mag-card-yellow` banner before the collection cards

### 🎴 Complete 90s Magazine Visual Coherence
- **Pure magazine background**: Cream paper (`mag-bg`/`#FFF9E6`) with halftone overlay — zero dark backgrounds anywhere
- **Game HUD bar**: Bottom status bar with credits + tazo count — yellow `#FFCC00` bg, black border, matching masthead
- **MagazinePageShell unified**: Light halftone background, yellow masthead with tabs, HUD bar, red footer — same magazine aesthetic across ALL pages
- **Dark backing eliminated**: Removed `#1a1a2e` gradient, `#0a0a0a` blacks, dark particles, glow orbs, `GameShell` component
- **Battle components fixed**: All `#1a1a2e` / `#0a0a0a` backgrounds → `#1a1a1a` (magazine black) in launch-control, launch-system, battle-event-log
- **All 35 routes**: Public pages (PublicPageShell) + Game pages (MagazinePageShell) — one visual language
- **Magazine-only palette**: `#FFCC00` (yellow), `#1a1a1a` (black), `#FFF9E6` (cream), `#E3350D` (red), `#3B4CCA` (blue), `#FF6B00` (orange)

### ⚔️ Battle System Unified
- **3D physics results now connect to server API**: Client sends `physicsResult` with actual game data
- **Server fast-path**: When `physicsResult` is provided, skips RPG simulation and saves actual match data
- **Quest progression triggers**: Battles now increment quests with `battle_played`, `battle_won`, `battles_played`, `battles_won` requirements

### ⚔️ Battle System Unified
- **Complete battle engine** (`game-loop.ts`): State machine (lobby→aim→power→spin→launch→physics→resolve), 60-step physics simulation with friction, wall bounce, disc-to-disc collisions, ring-out
- **AI engine**: 3 difficulty levels (Novice/Skilled/Master)
- **Game Lobby**: Mode selector (Practice/Ranked/Friend Battle), deck builder, auto-best deck
- **Battle Arena 3D**: Coliseum with pillars, neon hover ring, procedurally textured floor
- **Launch System**: Bouncing crosshair aim, pulsing power circle with risk indicator, spin selector
- **Battle HUD**: HP bars with gradients, phase badges, tazo counters
- **Tazo discs**: Real PNG textures loaded via `THREE.TextureLoader` for both front and back

### 🛒 3D Bag Opener
- **Real potato chip bag textures** from `bag-patatas.rar`, processed with Python Pillow (RGBA alpha transparency)
- **Three.js curved plane geometry**: Pillow bag with vertex bulge + sinusoidal wave
- **Tear animation**: Canvas-based jagged line + golden particle burst
- **Bug fixes**: Stale `bagId` closure (useRef pattern), double animation prevention

### 🎮 Game Launcher Landing
- **Magazine 90s redesign**: Cream paper background, halftone dots, comic-style PLAY button with CMYK accents
- **Magazine Splash Screen**: Concentric circles, loading bar with registration marks, "Loading issue #X..."

### 📝 Content Audit — 12 Factual Errors Fixed
- Removed "8 roles" (0 of 319 tazos have a role assigned in DB)
- Fixed battle flow descriptions (aim→power→spin→launch)
- Removed non-existent features (self-flip, chain rebounds, PvP multiplayer, CLI tool)
- Fixed franchise category counts (Dracobell: 7→6, Minimon: only "Tazos")

### 🔗 Battle-Server Connection
- **battle-view.tsx** now calls `POST /api/battle` on `match_end` to save battle results
- **battle-result-panel.tsx** shows `creditsEarned` badge for wins
- Credits awarded for authenticated user victories

### 🏗️ Layout Normalization
- Removed double padding (magazine-page-shell + individual pages)
- Consistent `px-4 sm:px-6` across all dashboard pages
- Battle page keeps `px-3` for 3D viewport needs

### 🧹 Legacy Cleanup
- All "MedaClaw Arena" references removed from public metadata
- Branding unified as "Trading Tazos Game" across all 18 public routes
- Twitter handles and email preserved as real accounts

### 📄 Legal Pages Expanded
- Terms: 11 sections (Acceptance to Contact)
- Privacy: 9 sections (GDPR/Children/Retention)
- Cookies: 6 sections (Essential Only / No Tracking)
- Disclaimer: 7 sections (Fan-Made / IP)

### 📋 Onboarding
- **3-step guided onboarding**: Open Bags → Build Deck → First Battle
- Auto-detects progress via API, dismissible, magazine-style yellow banner

### 🔧 Infrastructure
- **ttg-ws zombie fix**: Competing FlickClaw systemd service stopped + disabled
- **ws-server.js hardened**: EADDRINUSE handling, uncaughtException handler
- **PM2**: max_restarts 5, restart_delay 5000, pre-start port cleanup
- **Cron audit**: `TTG-autonomous-dev-0604` disabled (auto-deploy risk)
- **Password validation**: Server-side changed from min 6 → 10 chars

### 📖 Lore — All 3 Franchises
- **Minimon**: World of Luminara — Life Spark origin, 7 regions, Bond Marks, Blooming evolution (4 phases), The Stillness threat
- **Cybermon**: The Neon Grid — Awakening Upload, 7 sectors, Soul Protocols, Shift evolution (6 phases), The Null Signal
- **Dracobell**: World of Bellora — 7 clans, 7 Bell Shards, Roar Aura (6 types), Ascension (5 phases), Bell Arts (7 techniques)

---

## v0.3.0 — Desktop Release + Public Routes (2026-06-03)
- **Electron desktop app**: Windows (.exe), macOS (.dmg), Linux (.AppImage, .deb) installers
- **Full audit**: 35 routes (21 public + 8 app + 6 legacy), 7 APIs, DB, git, services — all verified
- **WebSocket server**: Matchmaking, rooms, turn relay
- **22-page sitemap**: SEO pages, legal pages, tazo catalog, collections lore
