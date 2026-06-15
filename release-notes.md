## v0.7.2 — Data Safety & Stability (2026-06-15)

### 🔴 Critical Fixes
- **DB preservation**: Live database moved to `data/dev.db` — `next build` no longer wipes user data
- **Bag open crash**: API validates bag IDs defensively — fixes 110 PM2 restarts from `id: undefined`
- **Deploy script v3.3**: Never overwrites live DB. Data restored from backup (58 UserTazos, 28 Instances)

### 🗺️ Clean Route Schema
- **Removed ALL /game routes** (7 files, 462 lines): single battle entry at `/app/battle`
- **Auth hardened**: ALL `/app` routes redirect to `/login` — no guest bypass
- **Battle embedded**: `/app/battle/play` inside MagazinePageShell (dark theme, fullBleed)

### 🎨 Visual
- **Battle shell dark theme**: Seamless dark arena integration (no halftone, no stripes, dark tabs)
- **Landing page**: Magazine hero palette, sections, download strip, mobile nav improvements

### 🏷️ Naming Unified
- Tubes → Decks | Bags → Shop | Album → Collection | Battle → How to Play | Franchise → Series
- Title template fix | Footer dynamic year

### 🧪 Testing
- 16/16 gameplay tests (defense stats, AI precision, checkMatchEnd, AI mutation)
- TypeScript: 0 errors, 0 warnings

### 🤖 AI Improvements
- Contextual targeting (master → edge, skilled → center)
- Adaptive aggression (±20% force based on score gap)
- Strategic tazo selection (master considers score, skilled avoids worn tazos)

### 🛡️ PvP Anti-Cheat
- Server-side `validateSlam()` clamps 8 parameters to valid ranges

### 🛠️ Infrastructure
- CI auto-sync version → electron/package.json
- Public file sync in deploy (manifest, favicons, PWA assets)
- Static assets via symlink (no copy overhead)
- PWA manifest: shortcuts updated to match clean schema
- WS server: JWT_SECRET fix, both PM2 processes healthy
