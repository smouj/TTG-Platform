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
### 📄 SEO — Unique Content Per Page
- **ServerPageContent**: Each `/?page=` URL now has unique server-rendered HTML (sr-only)
  — 13 pages verified: how-to-play, collections, tazos, leaderboard, download, faq, shop, privacy, terms, cookies, contact, refund-policy, disclaimer
- **Home page clean**: 0 extra SEO content on landing — unique only on tab pages
- **refund-policy + disclaimer added**: Were missing from PageId/LABEL/META; now complete with content components + SEO

### 🏷️ Full Terminology Audit (0 "Franchise" in UI)
- **Admin routes renamed**: /admin/tubes→/admin/decks, /admin/tube-models→/admin/deck-models, /admin/bags→/admin/shop-bags, /admin/bag-models→/admin/shop-bag-models
- **Admin labels unified**: Nav + all pages: Tubes→Decks, Bags→Shop Bags, Tube Models→Deck Models
- **Collection pages**: "Franchise"→"Series", "Franchise Insignia"→"Official Seal"
- **Launcher footer**: "Battle"→"How to Play"
- **Stats panel**: "By Franchise"→"By Series"
- **0 references** to real franchises/brands — all original fictional IP

### 🎨 Series Logos + Visual Assets
- **3 series logo PNGs added**: Cybermon (white+yellow digital), Dracobell (yellow angular), Minimon (rainbow playful)
- **Collection lore pages**: Now use real series logos in banners (replaced back-art placeholders)
- **Favicon assets**: Generated favicon.png, favicon-192.png, apple-touch-icon.png from logo-icon-black.webp — fixed 404s
- **Mobile nav**: Contact link added to tab strip
- **Footer**: Copyright year dynamic, version from SITE_CONFIG

### 🚀 Deploy Improvements
- **VPS git auto-sync**: Deploy script now pulls VPS repo after each deploy (git fetch + reset --hard)
- **Public asset sync**: Deploy script rsyncs favicons + series logos + logo files to standalone

### 📚 Documentation (10 files updated)
- AGENTS.md, TOOLS.md, MEMORY.md, IDENTITY.md, HEARTBEAT.md all current
- README.md: desktop versions v0.7.0→v0.7.2
- CHANGELOG.md: comprehensive
- GitHub release v0.7.2: notes updated