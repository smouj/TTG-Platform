# TTG Environment Audit — 2026-06-11

Scope: WSL local repo, VPS production checkout, GitHub repositories, npm package, and public website.

## Summary

- Public site: `https://tradingtazosgame.com/` is online.
- Production PM2: `ttg` and `ttg-ws` are online on VPS.
- Local TTG repo: `main`, synced with `origin/main` before this audit.
- VPS TTG repo: was one commit behind `origin/main` before deploy.
- `tazo-art-studio`: local and GitHub clean at `e7df178`.
- `trading-tazos-game-cli`: local, GitHub, and npm latest clean at `1.0.2`.
- Published tazo visibility was corrected: public catalog now exposes only verified art.

## Findings

### Fixed

- `src/app/api/health/route.ts` returned `version: "0.5.0"` while the app package/admin/PM2 were `0.6.0`.
- `src/components/layout/public-footer.tsx` still printed `Version 0.5.0`.
- GitHub CI failed at `npm ci` because `openai@6.42.0` requires peer `ws@^8.18.0`, while the app pinned `ws@7.5.10`.
- GitHub CI also depended on an implicit local SQLite state. It now creates `prisma/ci.db`, applies `prisma db push`, and seeds minimal smoke data before build/API checks.
- Production DB had 122 tazos with `publishStatus='published'` but `sourceStatus='pending_visual_check'`.
- WSL had a runaway old `node --eval ... tazo-definitions` process consuming about 95% CPU for more than a day; it was terminated.

### Current Production Visibility

After DB backup and update:

- `published + verified`: 26
- `published + non-verified`: 0
- Public API `/api/stats`: 26 tazos visible
- Public distribution: Minimon 10, Dracobell 9, Cybermon 7

The hidden 122 tazos remain in DB as drafts for later review and correction.

### GitHub Actions

Latest TTG main runs were failing before this audit because `npm ci` could not resolve `ws`.
This repo now installs with `npm ci` locally after moving `ws` to `^8.21.0`.

### Dependency Audit

`npm audit` reports 8 moderate issues. The suggested automatic fixes are major/downgrade-level changes affecting `next`, `next-auth`, and `react-syntax-highlighter`, so `npm audit fix --force` was intentionally not applied.

## Verification

Local:

```bash
npm ci
npx tsc --noEmit
npm run build
BASE_URL=http://localhost:3010 node tests/api.test.js
```

Production API after DB correction:

```bash
curl https://tradingtazosgame.com/api/stats
curl "https://tradingtazosgame.com/api/tazos?limit=30&publishStatus=published"
```

Expected:

- `totalTazos: 26`
- every returned tazo has `sourceStatus: "verified"` and `publishStatus: "published"`

## Season 1 Pipeline

Season 1 canonical files were added under:

- `scripts/season1/`
- `artgen/creatures.season1.json`

The pipeline builds 150 canonical tazos/prompts from the lore bible:

- 50 Minimon
- 50 Dracobell
- 50 Cybermon

The tazos are registered as `pending_review` until verified creature art exists.

## Remaining Work

- Generate and QA the 148 missing Season 1 transparent creature artworks.
- Publish only Season 1 tazos with verified composite output.
- Address the 8 moderate dependency advisories through planned upgrades, not `--force`.
