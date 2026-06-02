# Task 2 - Seed Developer

## Summary
Created the database seed script for Trading-Tazos-Game.

## What was done
1. Created `prisma/seed.ts` with comprehensive seed data
2. Added `"seed"` script to `package.json`
3. Ran `bun run db:push` to ensure schema is synced
4. Executed `bun run prisma/seed.ts` successfully
5. Verified data in database

## Seed Data
- 3 Franchises: Pokémon, Digimon, Dragon Ball Z
- 6 Collections: 2 per franchise
- 62 Tazos: 12+10+10+10+10+10 across collections
- 28 owned (45%), 34 not owned
- Rarity: 19 common, 18 uncommon, 13 rare, 8 ultra, 4 legendary
- All slugs are unique in format `{franchise}-{name}`
- Evolution lines for Pokémon (Charmander→Charmeleon→Charizard, Eevee→Umbreon/Espeon) and Digimon (Agumon→Greymon→MetalGreymon→WarGreymon, etc.)
- Transform stages for DBZ (Goku→Goku SSJ, Vegeta→Vegeta SSJ, Gohan→Gohan SSJ2, Trunks→Trunks SSJ, Broly→Broly LSSJ)

## Files
- `prisma/seed.ts` (created)
- `package.json` (modified - added seed script)
