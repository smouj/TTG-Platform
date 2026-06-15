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