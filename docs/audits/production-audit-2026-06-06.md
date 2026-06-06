# Production Audit — 2026-06-06

Scope: routes, pagination, public claims, screenshots, deploy behavior, and WebSocket smoke for `https://medaclawarena.com`.

## Current Production Facts

- Public sitemap contains 18 public URLs. Protected `/app/*` pages are intentionally excluded.
- `/app` redirects to `/app/album`.
- Protected app pages such as `/app/shop` and `/app/battle` redirect to `/login?redirect=...` without auth.
- `/api/tazos` supports real `page` and `limit` pagination and returns `totalPages`.
- `/api/leaderboard?sort=battles` returns HTTP 200. It can be empty when production has no user-linked battle records.
- `/api/credits/daily` exists and returns 401 without authentication.
- WebSocket matchmaking works through `wss://medaclawarena.com/ws` with JWT auth, private rooms, and `match_found` events.
- PvP turn synchronization is staged. Public copy should describe matchmaking/room support, not complete end-to-end PvP gameplay.
- PWA is installable via manifest metadata. Offline play is not claimed because no service worker was verified.

## Verification

Commands run locally against production:

```bash
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

Production smoke:

```text
/                         200
/download                 200
/register                 200
/app                      307 -> /app/album
/app/shop                 307 -> /login?redirect=%2Fapp%2Fshop
/api/tazos?page=2&limit=50                   200
/api/leaderboard?sort=battles&limit=5         200
/api/multiplayer/status                       200
WebSocket room SMOKE3                         match_found for both clients
```

## Changes Applied

- Migrated deprecated `src/middleware.ts` to `src/proxy.ts`.
- Removed `typescript.ignoreBuildErrors` from `next.config.ts`; Next build now runs TypeScript validation.
- Regenerated public screenshots: home, tazos catalog, leaderboard, download, login, and practice battle.
- Updated README and changelog language around battles played, staged PvP sync, installable PWA, and source-available licensing.
- Corrected package metadata from old MedaClaw branding to Trading Tazos Game.

## Remaining Product Work

- Full PvP turn synchronization in the active fullscreen battle UI.
- Authenticated screenshots for shop, quests, collection, decks, and stats using a controlled demo account or seeded local environment.
- Dedicated e2e smoke tests for auth flows and app tabs.
- Optional canonical metadata per public page.
