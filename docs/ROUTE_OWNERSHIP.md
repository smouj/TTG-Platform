# Route Ownership Map

Last updated: 2026-06-12

Every route in the app, grouped by audience and gate level.

## 🌐 Public (no auth)
| Route | Source | Notes |
|-------|--------|-------|
| `/` | `src/app/page.tsx` → `launcher-view.tsx` | Landing magazine, all tabs render client-side |
| `/?page=how-to-play` | `launcher-view.tsx` | Inline content |
| `/?page=collections` | `launcher-view.tsx` | Inline content |
| `/?page=tazos` | `launcher-view.tsx` | Tazo catalog |
| `/?page=leaderboard` | `launcher-view.tsx` | Rankings |
| `/?page=download` | `launcher-view.tsx` | Desktop downloads |
| `/?page=faq` | `launcher-view.tsx` → `src/lib/faq-content.ts` | FAQ synced with JSON-LD |
| `/?page=shop` | `launcher-view.tsx` | Public shop preview |
| `/?page=privacy` | `launcher-view.tsx` → `src/lib/legal-content.tsx` | Privacy policy |
| `/?page=terms` | `launcher-view.tsx` → `src/lib/legal-content.tsx` | Terms of service |
| `/?page=cookies` | `launcher-view.tsx` → `src/lib/legal-content.tsx` | Cookie policy |
| `/?page=contact` | `launcher-view.tsx` | Contact page |
| `/login` | `src/app/login/page.tsx` | Auth |
| `/register` | `src/app/register/page.tsx` | Auth |
| `/privacy` | `src/app/privacy/page.tsx` | Standalone crawlable legal |
| `/terms` | `src/app/terms/page.tsx` | Standalone crawlable legal |
| `/cookies` | `src/app/cookies/page.tsx` | Standalone crawlable legal |
| `/disclaimer` | `src/app/disclaimer/page.tsx` | Brand disclaimer |

## 📡 Public API (no auth, read-only)
| Route | Source | Notes |
|-------|--------|-------|
| `/api/health` | `src/app/api/health/route.ts` | Health check |
| `/api/version` | `src/app/api/version/route.ts` | App version + counts |
| `/api/stats` | `src/app/api/stats/route.ts` | Public stats |
| `/api/tazos` | `src/app/api/tazos/route.ts` | Tazo listing (published only for public) |
| `/api/franchises` | `src/app/api/franchises/route.ts` | Franchise listing |
| `/api/leaderboard` | `src/app/api/leaderboard/route.ts` | Rankings |

## 📡 Auth API (JWT via Authorization header)
| Route | Source | Notes |
|-------|--------|-------|
| `/api/auth/login` | `src/app/api/auth/login/route.ts` | Login |
| `/api/auth/register` | `src/app/api/auth/register/route.ts` | Register |
| `/api/auth/me` | `src/app/api/auth/me/route.ts` | Current user |
| `/api/auth/forgot-password` | `src/app/api/auth/forgot-password/route.ts` | Password reset request |
| `/api/auth/reset-password` | `src/app/api/auth/reset-password/route.ts` | Password reset confirm |
| `/api/auth/debug-bcrypt` | `src/app/api/auth/debug-bcrypt/route.ts` | ⚠️ Dev only (NODE_ENV gated) |
| `/api/user/*` | `src/app/api/user/` | User profile, settings |

## 🔐 App (auth required, 307 redirect if not)
| Route | Source | Notes |
|-------|--------|-------|
| `/app/collection` | `src/app/app/collection/page.tsx` | User's tazo collection |
| `/app/decks` | `src/app/app/decks/page.tsx` | Deck builder (3D tube) |
| `/app/shop` | `src/app/app/shop/page.tsx` | Shop (bags + marketplace) |
| `/app/battle` | `src/app/app/battle/page.tsx` | Battle arena lobby |
| `/app/quests` | `src/app/app/quests/page.tsx` | Quests + achievements |
| `/app/stats` | `src/app/app/stats/page.tsx` | User stats dashboard |
| `/app/settings` | `src/app/app/settings/page.tsx` | User settings |
| `/game/friend/[roomId]` | `src/app/game/friend/[roomId]/page.tsx` | PvP friend battle |

## 🔧 Game API (auth required)
| Route | Source | Notes |
|-------|--------|-------|
| `/api/bags/*` | `src/app/api/bags/` | Open bags, manage |
| `/api/battle/*` | `src/app/api/battle/` | Battle history, records |
| `/api/quests/*` | `src/app/api/quests/` | Quest progress |
| `/api/achievements/*` | `src/app/api/achievements/` | Achievement tracking |
| `/api/credits/*` | `src/app/api/credits/` | Credit management |
| `/api/decks/*` | `src/app/api/decks/` | Deck CRUD |
| `/api/marketplace/*` | `src/app/api/marketplace/` | Buy/sell/offers |
| `/api/collection/*` | `src/app/api/collection/` | Collection management |
| `/api/scanner/*` | `src/app/api/scanner/` | Tazo QR/detection |

## 👑 Admin (auth + admin-email gated)
| Route | Source | Notes |
|-------|--------|-------|
| `/api/admin` | `src/app/api/admin/route.ts` | Main admin dashboard data |
| `/api/admin/bags` | `src/app/api/admin/bags/route.ts` | Bag texture management |
| `/api/admin/tubes` | `src/app/api/admin/tubes/route.ts` | Tube texture management |
| `/api/admin/bag-models` | `src/app/api/admin/bag-models/route.ts` | BagModel CRUD |
| `/api/admin/tube-models` | `src/app/api/admin/tube-models/route.ts` | TubeModel CRUD |
| `/api/admin/tazo-art` | `src/app/api/admin/tazo-art/route.ts` | Tazo art generation |
| `/api/admin/remove-bg` | `src/app/api/admin/remove-bg/route.ts` | Background removal |
| `/api/admin/tazo-layouts` | `src/app/api/admin/tazo-layouts/route.ts` | Layout config |
| `/app/admin` | `src/app/app/admin/page.tsx` | Admin panel UI |

## 🔌 WebSocket
| Route | Source | Notes |
|-------|--------|-------|
| `ws://:3001` | `src/server/ws-server.ts` | PvP battle relay (JWT auth) |

## 🖥️ Electron
| File | Notes |
|------|-------|
| `electron/main.js` | Desktop app entry, BrowserWindow |
| `electron/preload.js` | Preload script |

## 🧩 Shared Libraries
| File | Purpose |
|------|---------|
| `src/lib/site-config.ts` | Canonical site config, version, URLs |
| `src/lib/franchise-config.ts` | Franchise data, TOTAL_PLANNED |
| `src/lib/faq-content.ts` | FAQ source of truth (UI + JSON-LD) |
| `src/lib/legal-content.tsx` | Legal page content (privacy/terms/cookies) |
| `src/lib/auth.ts` | Auth helpers, JWT, password hashing |
| `src/lib/email.ts` | SMTP email bridge |
| `src/lib/downloads.ts` | Desktop download URLs |
| `src/lib/battle/` | Battle engine, FSM, PvP hook, AI |

## 🔒 Auth Gate Strategy
- **Public API**: Read-only, no auth
- **Auth API**: Validates JWT from Authorization header
- **App pages**: Middleware 307 redirects to `/login` if no session
- **Admin API**: Validates JWT + checks email === ADMIN_EMAIL
- **WebSocket**: JWT in connection params
