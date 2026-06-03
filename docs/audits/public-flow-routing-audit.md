# Audit: Public Flow, Routing, Tabs & SEO
> Trading Tazos Game — medaclawarena.com
> Date: 2026-06-03 | Baseline: commit `8972f73`

## 1. Current Routes

### Public Pages
| Route | Type | SEO Metadata | Notes |
|-------|------|:---:|-------|
| `/` | Home (tabs) | ✅ layout default | Home acts as app shell with 8 tabs |
| `/download` | Standalone | ✅ | Linux available, Win/Mac coming soon |
| `/leaderboard` | Standalone | ✅ | Global rankings |
| `/login` | Auth | ✅ | CSR, has skeleton |
| `/register` | Auth | ✅ | Direct form |

### Protected Pages (middleware → login redirect)
| Route | Notes |
|-------|-------|
| `/collection` | Personal tazo collection |
| `/decks` | Deck builder |
| `/shop` | 3D bag shop |
| `/quests` | Quest system |

### Tab Redirects (Caddy 308)
| Path | Target |
|------|--------|
| `/album` | `/?tab=album` |
| `/battle` | `/?tab=battle` |
| `/scanner` | `/?tab=scanner` |
| `/stats` | `/?tab=stats` |
| `/ranks` | `/leaderboard` |
| `/desktop` | `/download` |

### API Routes (14 groups)
auth, tazos, franchises, stats, leaderboard, collection, decks, bags, credits, quests, achievements, battle, scanner, multiplayer

## 2. Public vs Protected

| Resource | Public | Protected | Notes |
|----------|:---:|:---:|-------|
| Tazo catalog | ❌ | N/A | No public `/tazos` page exists |
| Battle system explanation | ❌ | N/A | No `/how-to-play` or `/battle-system` page |
| Collections info | ❌ | N/A | No `/collections` page |
| Leaderboard | ✅ | N/A | |
| Login/Register | ✅ | N/A | |
| Album | ❌ | N/A | Only as tab on `/` |
| Battle | ❌ | N/A | Only as tab on `/` |
| Collection | ❌ | ✅ | `/collection` |
| Decks | ❌ | ✅ | `/decks` |
| Shop | ❌ | ✅ | `/shop` |
| Quests | ❌ | ✅ | `/quests` |
| Scanner | ❌ | N/A | Only as tab on `/` |

## 3. Current Tabs

8 tabs in MagazinePageShell:
1. **Album** — Filterable tazo grid (public data, no auth needed)
2. **Battle** — Practice/PvP arena (practice no auth, PvP needs auth)
3. **Scanner** — Photo upload + tazo detection
4. **Stats** — Collection analytics
5. **Shop** — 3D bag shop (needs auth → redirects)
6. **Quests** — Quest system (needs auth → redirects)
7. **Leaderboard** — Global rankings
8. **Desktop** — Download page

## 4. Tabs → Routes Mapping

| Tab | Current Location | Recommended Route | Rationale |
|-----|-----------------|------------------|-----------|
| Album | `/?tab=album` (client state) | `/tazos` (public catalog) + `/app/album` (personal) | SEO, shareable, filterable |
| Battle | `/?tab=battle` | `/app/battle` | Protected, needs deck |
| Scanner | `/?tab=scanner` | `/app/scanner` | Requires camera, account |
| Stats | `/?tab=stats` | `/app/stats` | Personal stats |
| Shop | `/shop` (standalone) | `/shop` (public info) + `/app/shop` | Hybrid page |
| Quests | `/quests` (standalone) | `/quests` (public info) + `/app/quests` | Hybrid |
| Leaderboard | `/leaderboard` | ✅ Already a route | |
| Desktop | `/download` | ✅ Already a route | |

## 5. Pagination & Filters Status

| Page | Pagination | Filters in URL | Search in URL | Notes |
|------|:---:|:---:|:---:|-------|
| Home (Album tab) | ❌ | ❌ | ❌ | All client state, lost on refresh |
| Leaderboard | ❌ | ❌ | ❌ | Client state only |
| Collection | ❌ | ❌ | ❌ | Client state only |
| Decks | ❌ | ❌ | ❌ | Client state only |
| Shop | ❌ | ❌ | ❌ | Client state only |
| Quests | ❌ | ❌ | ❌ | Client state only |

**Key Problem**: No URL-based state management. All filters/pagination lost on page refresh.

## 6. SEO Status

| Check | Status |
|-------|:---:|
| Page titles unique | ✅ (5 pages after recent fix) |
| Meta descriptions | ✅ (basic) |
| Open Graph | ✅ (layout default only) |
| Twitter Card | ✅ (layout default only) |
| Canonical URLs | ❌ Missing |
| JSON-LD | ✅ (VideoGame on home only) |
| Sitemap | 🟡 7 URLs, missing new pages |
| Robots.txt | ✅ Exists |
| Hreflang | 🟡 In sitemap but not on pages |

## 7. Header / Footer Issues

| Issue | Severity |
|-------|:---:|
| Same header for public + authenticated | 🔴 High |
| No public footer (only in-app footer) | 🟡 Medium |
| Login page has no header/masthead (CSR skeleton) | 🟡 Medium |
| Register page has masthead but no tabs | 🟡 Medium |
| No breadcrumbs anywhere | 🟢 Low |

## 8. Duplicated Components

| Component | Duplicated In | Notes |
|-----------|--------------|-------|
| MagazinePageShell | 7 page.tsx files | Used as wrapper — correct pattern |
| Tab bar (mag-tab) | MagazinePageShell | Single source ✅ |
| Footer | MagazinePageShell | Only rendered when shell used |

## 9. Missing Empty States

| Scenario | Has Empty State? |
|----------|:---:|
| User with 0 tazos | ❓ Unknown |
| User with no deck | ❓ Unknown |
| User with no battles | ❓ Unknown |
| No quests completed | ❓ Unknown |
| Leaderboard empty | ❓ Unknown |
| Search with 0 results | ❓ Unknown |
| Filters with 0 results | ❓ Unknown |
| Shop with 0 credits | ❓ Unknown |
| Scanner no image | ❓ Unknown |
| PvP no opponent | ❓ Unknown |

## 10. Critical Missing Pages (SEO & UX)

| Page | Priority | Value |
|------|:---:|-------|
| `/how-to-play` | 🔴 P0 | Explains the game to new users |
| `/battle-system` | 🔴 P0 | SEO for physics/mechanics |
| `/collections` | 🔴 P0 | Show Minimon/Dracobell/Cybermon |
| `/collections/minimon` | 🟡 P1 | Individual collection page |
| `/collections/dracobell` | 🟡 P1 | |
| `/collections/cybermon` | 🟡 P1 | |
| `/tazos` | 🔴 P0 | Public catalog with URL filters |
| `/tazos/[slug]` | 🟡 P1 | Individual tazo detail |
| `/faq` | 🟡 P1 | Support/SEO |
| `/about` | 🟢 P2 | Brand page |
| `/contact` | 🟢 P2 | Contact form |
| `/legal/terms` | 🟡 P1 | Legal compliance |
| `/legal/privacy` | 🟡 P1 | |
| `/legal/cookies` | 🟡 P1 | |
| `/app/*` routes | 🔴 P0 | Separate app from landing |

## 11. Landing Page Assessment

Current `/` is NOT a landing page — it's an app shell with 8 tabs. A new user sees:
- Magazine masthead with 8 tabs
- Album grid of tazos
- No explanation of what the game IS
- No clear next step
- No hero section
- No value proposition

**Needs complete redesign into a proper landing page.**

## 12. Verification (Production)

```bash
# All pages HTTP 200 ✅
curl -I https://medaclawarena.com → 200
curl -I https://medaclawarena.com/download → 200
curl -I https://medaclawarena.com/leaderboard → 200
curl -I https://medaclawarena.com/login → 200
curl -I https://medaclawarena.com/register → 200

# Sitemap
curl https://medaclawarena.com/sitemap.xml → 7 URLs ✅

# Missing pages
curl https://medaclawarena.com/how-to-play → 404 ❌
curl https://medaclawarena.com/battle-system → 404 ❌
curl https://medaclawarena.com/collections → 404 ❌
curl https://medaclawarena.com/tazos → 404 ❌
```
