# Trading Tazos Game — TODO

Last reviewed: 2026-06-12

Current validated baseline:

- Local `npm run verify` passes: canon guard, TypeScript, ESLint, Next build.
- Local standalone smoke passes: `node tests/api.test.js` → 32/32.
- Production dependency audit baseline is clean locally: `npm audit --omit=dev --audit-level=moderate` → 0 vulnerabilities.
- Public truth remains: 26 verified published tazos live, 150 canonical Season 1 tazos planned.

## P0 — Release Health

- [ ] Deploy the current clean local state to production.
  - Done when `tradingtazosgame.com` serves the new build, `/api/version` matches the intended version/commit, and public smoke passes against production.
  - Verify:
    ```bash
    npm run verify
    node tests/api.test.js
    curl -s https://tradingtazosgame.com/api/version
    curl -s https://tradingtazosgame.com/api/health
    ```

- [ ] Add a production smoke script that can run from CI or VPS after every deploy.
  - Cover `/`, public tabs, legal routes, `/api/health`, `/api/stats`, `/api/tazos`, auth redirects, `robots.txt`, `sitemap.xml`, `ads.txt`, and `manifest.json`.
  - Done when deploy fails automatically if static chunks, redirects, SEO schema, or API health break.

- [ ] Add authenticated e2e smoke tests for the app tabs.
  - Cover register/login, `/app/collection`, `/app/decks`, `/app/shop`, `/app/quests`, `/app/stats`, logout.
  - Use a seeded demo account or isolated local DB.
  - Done when these tests can run without touching production user data.

- [ ] Make production DB backup/restore explicit before any deployment that touches Prisma or seed data.
  - Done when `scripts/backup-db.sh` is documented in deploy flow and restore has been tested once on a copy.

## P1 — Product Completeness

- [ ] Finish Season 1 art pipeline for the remaining planned tazos.
  - Generate transparent creature art, circular tazo composites, backs, metadata, stats, and rarity.
  - Keep unfinished assets as `pending_review`.
  - Done when all 150 Season 1 tazos have final reviewed art and only verified assets are public.

- [ ] Publish the next verified tazo batch.
  - Run visual QA before flipping `publishStatus`.
  - Check that `/api/tazos?publishStatus=published` exposes only verified originals.
  - Update public counters only through canonical config/stats, not hardcoded copy.

- [ ] Complete full PvP turn synchronization in the fullscreen battle UI.
  - Current state: matchmaking, private rooms, and `match_found` events work; full turn sync is staged.
  - Done when two authenticated players can complete a full battle from lobby to result with synced turns, reconnect handling, and persisted match history.

- [ ] Build a stable demo account or demo seed.
  - Needed for screenshots, e2e tests, app-store style assets, and public demos.
  - Done when local and staging can reproduce the same collection/decks/shop/quests state.

- [ ] Replace or verify actual desktop download binaries.
  - Check Windows `.exe`, macOS `.dmg`, Linux `.AppImage` and `.deb` links.
  - Done when `/?page=download` points to current signed or clearly labeled builds and each link returns 200.

## P1 — SEO, Legal, Ads

- [ ] Add AdSense feature gating.
  - Implement an `AdSlot` component controlled by `NEXT_PUBLIC_ADSENSE_ENABLED`.
  - Ensure ads never appear inside gameplay, scanner, battle controls, or misleading reward areas.
  - Done when ads can be disabled fully by env var without code changes.

- [ ] Add CMP flow before personalized ads in EEA/UK/CH.
  - Required before enabling personalized AdSense.
  - Done when consent state controls ad personalization and policy pages describe it accurately.

- [ ] Add BreadcrumbList JSON-LD to collection and tazo detail pages.
  - Done when rich result testing detects breadcrumbs for `/collections/*` and `/tazos/[slug]`.

- [ ] Add FAQPage JSON-LD for the public FAQ.
  - Keep FAQ copy and JSON-LD generated from one source to avoid drift.
  - Done when the schema matches visible FAQ content.

- [ ] Expand hreflang only when multilingual public pages are actually live.
  - Current i18n exists, but public language routing should be verified before broad hreflang claims.
  - Done when alternate URLs are crawlable and canonical per language.

## P1 — UX / Quality

- [ ] Run a Lighthouse pass and fix the biggest performance bottlenecks.
  - Target: 90+ on mobile for Performance, Accessibility, Best Practices, and SEO where practical.
  - Prioritize image weight, JS chunks, font loading, and layout stability.

- [ ] Run an accessibility audit.
  - Check keyboard navigation, focus states, dialogs, color contrast, reduced motion, alt text, labels, and error states.
  - Done when key public flows and app tabs are usable without a mouse.

- [ ] Improve authenticated screenshots and documentation.
  - Capture shop, quests, collection, decks, stats, and battle states from a controlled demo account.
  - Update README screenshots if current assets drift from the live UI.

- [ ] Review professional 404/500/error states after runtime fixes.
  - The custom 404 exists; verify 500 and route segment errors are branded, useful, and do not leak internals.

## P2 — Engineering Cleanup

- [ ] Add a dependency hygiene check to CI.
  - Run `npm audit --omit=dev --audit-level=moderate`.
  - Keep explicit overrides documented in `package.json`.
  - Done when dependency regressions are caught before deploy.

- [ ] Remove or archive obsolete historical docs that still mention old 319/349 claims.
  - Keep audit files as snapshots, but add superseded notices where needed.
  - Done when README and active docs never contradict the current 150/26 truth.

- [ ] Audit hardcoded product numbers and URLs quarterly.
  - Source of truth should remain `src/lib/site-config.ts` and `src/lib/franchise-config.ts`.
  - Done when `rg "349|319|148|149|v0\\.6\\.0|support@tradingtazosgame.com"` has no active stale product copy.

- [ ] Review old admin/debug endpoints before public growth.
  - Inspect `/api/auth/debug-bcrypt`, admin routes, remove-bg, tazo-art, and layout generation routes.
  - Done when every admin/debug endpoint is auth-gated, rate-limited where needed, and absent from public docs.

- [ ] Add route ownership notes for public, auth, admin, and game routes.
  - Useful because the app now has many public tabs, protected `/app/*` pages, API routes, Electron, and WebSocket code.
  - Done when new contributors can tell where a feature belongs before editing.

## P2 — Nice To Have

- [ ] Add offline/PWA behavior only if a service worker strategy is defined.
  - Do not claim offline play until verified.

- [ ] Add replay/spectator mode for battles.
  - Requires deterministic battle event logs and replay UI.

- [ ] Add collection sharing pages.
  - Public read-only user collection pages could help SEO and social sharing, but must respect privacy defaults.

- [ ] Add creator tooling polish.
  - Better batch QA for generated tazo art, duplicate detection, rarity distribution checks, and one-click publish preview.

## Standard Definition Of Done

For code changes:

```bash
npm run verify
npm audit --omit=dev --audit-level=moderate
PORT=3000 npm start
node tests/api.test.js
```

For production changes:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://tradingtazosgame.com/
curl -s https://tradingtazosgame.com/api/health
curl -s https://tradingtazosgame.com/api/stats
curl -s https://tradingtazosgame.com/api/tazos?publishStatus=published\&limit=5
```

Never publish generated tazos directly from draft/pending state without visual QA.
