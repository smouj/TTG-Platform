# Changelog

## v0.7.2 — Data Safety & Stability (2026-06-15)

### 🔴 Critical Fixes
- **DB preservation**: Live database moved to `data/dev.db` (outside `.next/standalone/`)
  — `next build` no longer wipes user data on deploy
- **Bag open crash**: API `/api/bags/open` now validates bag IDs defensively
  — fixes 110 PM2 restarts caused by `id: undefined` reaching Prisma
- **Deploy script v3.3**: Never overwrites live DB — removed seed DB copy. Only runs `prisma db push`.
  — Data restored from backup after discovery of deploy bug (58 UserTazos, 28 Instances)

### 🗺️ Clean Route Schema
- **Removed ALL /game routes** (7 files, 462 lines deleted): /game, /game/practice, /game/ranked, /game/friend/[roomId]
  — All 404. Single battle entry: `/app/battle`
- **Auth hardened**: ALL /app routes redirect to /login — removed /app/battle/play guest bypass
  — Proxy 307 + API getAuthUser DB verification + AuthProvider localStorage clear
- **Battle embedded**: `/app/battle/play` renders inside MagazinePageShell (GDD §4.1)
  — Dark shell theme, no halftone, no stripes, dark tabs, fullBleed

### 🎨 Visual Improvements
- **Battle shell dark theme**: Background #1a1a1a matching arena gradient — seamless visual
- **Landing page redesign**: Hero with magazine palette (red/gold/black), sections, download strip, mobile nav touch targets

### 🏷️ Naming Unified
- Tubes → Decks (app tab, battle page, deck builder)
- Bags → Shop (landing quick actions)
- Album → Collection (landing quick action)
- Battle → How to Play (footer)
- Ranks → Rankings (landing + nav)
- Franchise → Series (0 user-facing appearances)
- Title template fix (no more "Login — TTG | TTG" duplication)
- Footer copyright: dynamic year (getFullYear())

### 🛡️ Improvements
## v0.7.1 — Data Persistence & UX Polish (2026-06-15)

### 🛒 Shop & Bag System
- **Bulk bag purchase**: Buy x1, x5, or x20 bags with one click
- **Sequential bulk opening**: Auto-open bags with progress bar + carousel reveal
- **Bulk reveal grid**: All opened tazos shown in responsive grid with rarity badges
- **Bulk open API**: `POST /api/bags/open` accepts `bagIds[]` array for batch operations
- **Bulk buy API**: `POST /api/bags/buy` accepts `quantity` parameter (1-20)
- All bag prices: 100 credits (admin-configurable)

### 💾 Data Persistence
- **DB survives deploys**: Standalone DB preserved across rebuilds (no more data wipes)
- **Deploy script v2**: `scripts/deploy-ttg.sh` — auto-backup, WAL checkpoint, preserves live DB
- **Backup script**: `scripts/db-backup.sh` — timestamped .backup, keeps last 20
- **Seed script**: `scripts/seed-database.mjs` — idempotent seeder for BagModel, CreditPackage, etc.

### 🎨 UI Polish
- **MagazinePageShell unified**: All `/app` pages share cream paper + halftone + HUD strip
- **Footer visible on all pages**: Sticky gold border, platform badges, social icons with brand colors
- **Battle lobby redesign**: Two-column magazine layout with 3D tube preview + deck selector
- **Auto-start from lobby**: sessionStorage side-channel eliminates double-lobby when entering game

### 🐛 Bug Fixes
- Fix React #310: useEffect moved from conditional block to top level in shop
- Fix collection API `totalOwned` counter (missing in legacy response path)
- Fix promo code CreditTransaction audit trail (now creates transaction for ALL reward types)
- Fix bulk open crash with single-element `bagIds` array (used undefined `bagId`)
- Fix demo password hash type (BLOB → TEXT) preventing login
- Clean orphaned DB records (TazoInstances, DeckTazos, BagPurchases)

## v0.7.0 — Battle Arena 2.0: AA-Grade Combat (2026-06-14)

### ⚔️ Battle Arena 2.0
- **PvP WebSocket server** (`ttg-ws`): Real-time player-vs-player battles on port 3001
- **Ranked matchmaking**: Queue system with MMR-based pairing
- **Complete FSM battle engine**: 20 states, 25+ transitions (lobby → aim → power → spin → launch → physics → resolve)
- **AI engine**: 3 difficulty levels (Novice/Skilled/Master) with adaptive tactics
- **Battle records**: Persistent match history with userId, score, turns tracking

### 🖥️ Desktop Apps (v0.7.0)
- **Electron app**: Thin wrapper launching tradingtazosgame.com
- **Multi-platform CI**: GitHub Actions builds Windows (.exe), macOS (.dmg ARM+Intel), Linux (.AppImage+.deb)
- **Bug fix**: CI migrated from bun→npm for electron-builder compatibility

### 🎴 SPA Architecture
- **MagazinePageShell**: Unified magazine aesthetic across ALL pages (cream paper, halftone, yellow masthead, HUD bar)
- **Launcher-compatible header/footer**: Sticky 78px headers, gold footer borders, consistent nav tabs
- **Magazine-only palette**: #FFCC00 (yellow), #1a1a1a (black), #FFF9E6 (cream), #E3350D (red), #3B4CCA (blue)

### 🔒 Security & Infrastructure
- **Caddy security headers**: X-Frame-Options DENY, X-Content-Type-Options, Strict-Transport-Security
- **Admin-only POST /api/tazos**: JWT + admin email authentication required
- **JWT_SECRET**: Hardcoded fallbacks removed — app fails fast if env var is missing
- **/admin blocked**: robots.txt + noindex meta tags

### 🔍 SEO & PWA
- **Sitemap**: 19 URLs with lastmod + changefreq + priority
- **Clean legal routes**: /privacy, /terms, /cookies, /disclaimer, /refund-policy with standalone SEO
- **JSON-LD**: WebApplication structured data on homepage
- **PWA manifest**: `related_applications` pointing to desktop installers
- **hreflang**: en/es alternates on all pages

### 📦 Marketplace & Economy
- **Achievements & Quests**: Tracked per user with progress indicators
- **Marketplace**: Buy, sell, and trade offers between players
- **XP + Credits**: Tracked per battle and collection milestone
- **Stripe integration**: Payment processing configured

### 🧰 Developer Experience
- **CLI v1.0.4**: `@trading-tazos-game/cli` on npm — search, battle, manage collection from terminal
- **Art Studio v1.0.0**: Visual drag & drop tazo designer
- **TypeScript strict**: 0 errors required before deploy
- **PM2 deploy**: Zero-downtime rsync + restart workflow


### ⚔️ Battle Arena 2.0
- **PvP WebSocket server** (`ttg-ws`): Real-time player-vs-player battles on port 3001
- **Ranked matchmaking**: Queue system with MMR-based pairing
- **Complete FSM battle engine**: 20 states, 25+ transitions (lobby → aim → power → spin → launch → physics → resolve)
- **AI engine**: 3 difficulty levels (Novice/Skilled/Master) with adaptive tactics
- **Battle records**: Persistent match history with userId, score, turns tracking

### 🖥️ Desktop Apps (v0.7.0)
- **Electron app**: Thin wrapper launching tradingtazosgame.com
- **Multi-platform CI**: GitHub Actions builds Windows (.exe), macOS (.dmg ARM+Intel), Linux (.AppImage+.deb)
- **Auto-update**: Electron updater with release feed

### 🎴 SPA Architecture
- **MagazinePageShell**: Unified magazine aesthetic across ALL pages (cream paper, halftone, yellow masthead, HUD bar)
- **Launcher-compatible header/footer**: Sticky 78px headers, gold footer borders, consistent nav tabs
- **Magazine-only palette**: #FFCC00 (yellow), #1a1a1a (black), #FFF9E6 (cream), #E3350D (red), #3B4CCA (blue)

### 🔒 Security & Infrastructure
- **Caddy security headers**: X-Frame-Options DENY, X-Content-Type-Options, Strict-Transport-Security
- **Admin-only POST /api/tazos**: JWT + admin email authentication required
- **JWT_SECRET**: Hardcoded fallbacks removed — app fails fast if env var is missing
- **/admin blocked**: robots.txt + noindex meta tags

### 🔍 SEO & PWA
- **Sitemap**: 19 URLs with lastmod + changefreq + priority
- **Clean legal routes**: /privacy, /terms, /cookies, /disclaimer, /refund-policy with standalone SEO
- **JSON-LD**: WebApplication structured data on homepage
- **PWA manifest**: `related_applications` pointing to desktop installers
- **hreflang**: en/es alternates on all pages

### 🛒 Economy & Progression
- **Achievements & Quests**: Tracked per user with progress indicators
- **Marketplace**: Buy, sell, and trade offers between players
- **XP + Credits**: Tracked per battle and collection milestone
- **Stripe integration**: Payment processing configured

### 🧰 Developer Experience
- **CLI v1.0.4**: `@trading-tazos-game/cli` on npm — search, battle, manage collection from terminal
- **Art Studio v1.0.0**: Visual drag & drop tazo designer
- **TypeScript strict**: 0 errors required before deploy
- **PM2 deploy**: Zero-downtime rsync + restart workflow

---

# Changelog

## v0.3.2 — Security + Magazine + Battle Unification (2026-06-05) [Unreleased — deployed, not tagged]

## v0.3.2 — Security + Magazine + Battle Unification (2026-06-05) [Unreleased — deployed, not tagged]

### 🔒 Security Hardening
- **POST /api/tazos**: Now admin-only — requires valid JWT + admin email authentication
- **JWT_SECRET**: All 3 hardcoded fallbacks removed (`lib/auth.ts`, `api/admin/route.ts`, `server/ws-server.*`) — app fails fast if env var is missing
- **/admin**: Blocked via `robots.txt` (`Disallow: /admin`), removed from `sitemap.xml`, added `<meta name="robots" content="noindex,nofollow">`
- **Admin API**: Consolidated to use shared `getAuthUser()` from `@/lib/auth` instead of standalone JWT verification

### 📊 Leaderboard + Tazos Improvements
- **Real battle counts**: Added `userId`, `score`, `turns` to `BattleRecord` schema — leaderboard can now count user-linked battles instead of proxy estimates
- **Battle sort display**: Battle sort uses recorded battles and shows available win counts where recorded
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
