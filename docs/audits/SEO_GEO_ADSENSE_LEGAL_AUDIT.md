# SEO / GEO / AdSense / Legal Audit — Trading Tazos Game

> Generated: 2026-06-10 | Auditor: Core AI | Target: https://tradingtazosgame.com

## Summary

The site is in good technical SEO shape. Metadata, sitemap, robots.txt, JSON-LD, and ads.txt are already present and well-structured. Key issues are copy inconsistencies and a few compliance gaps.

---

## 1. Routes Audit

| Route | Status | Indexable | Title | H1 | Issues |
|-------|--------|-----------|-------|----|--------|
| `/` | 200 | ✅ | "Collect, Trade & Battle 349 Classic Tazos" | "Trading Tazos Game" | CRIT: "Official Game (Beta)" |
| `/?page=how-to-play` | 200 | ✅ | (shared) | (shared) | — |
| `/?page=collections` | 200 | ✅ | (shared) | (shared) | — |
| `/?page=tazos` | 200 | ✅ | (shared) | (shared) | — |
| `/?page=leaderboard` | 200 | ✅ | (shared) | (shared) | — |
| `/?page=download` | 200 | ✅ | (shared) | "Download" | No actual binaries |
| `/?page=faq` | 200 | ✅ | (shared) | "FAQ" | Missing questions |
| `/?page=shop` | 200 | ✅ | (shared) | "Shop" | — |
| `/?page=privacy` | 200 | ✅ | (shared) | — | JS-rendered only ⚠️ |
| `/?page=terms` | 200 | ✅ | (shared) | — | JS-rendered only ⚠️ |
| `/?page=cookies` | 200 | ✅ | (shared) | — | Contradicts Plausible ⚠️ |
| `/?page=contact` | 200 | ✅ | (shared) | "Contact" | — |
| `/disclaimer` | 200 | ✅ | "Disclaimer" | "Disclaimer" | Good |
| `/robots.txt` | 200 | ✅ | — | — | Missing `/app/`, `/login` disallow |
| `/sitemap.xml` | 200 | ✅ | — | — | Good |
| `/ads.txt` | 200 | ✅ | — | — | Real publisher ID present |
| `/llms.txt` | 200 | ✅ | — | — | Good |
| `/manifest.json` | 200 | ✅ | — | — | Good |

---

## 2. CRITICAL Issues

### CRIT-1: "Official Game (Beta)" — Potential Trademark Issue
**Location**: Header tagline, `launcher-view.tsx:1961`
**Risk**: Could be interpreted as "official" affiliation with real-world tazo brands.
**Fix**: Change to "Official TTG Beta" or "Trading Tazos Game Beta"

### CRIT-2: Cookie Policy vs Plausible Analytics Contradiction
**Location**: `CookiesContent()` in launcher-view
**Statement**: "TTG does not use tracking cookies, advertising cookies, analytics cookies, or third-party cookies."
**Reality**: Plausible script is loaded: `<script defer data-domain="tradingtazosgame.com" src="https://plausible.rpgclaw.com/js/script.js">`
**Fix**: Update to "We use Plausible Analytics (self-hosted, privacy-friendly, no personal data)."

### CRIT-3: "3 Series · 30 Tazos" — 349 vs 30 Inconsistency
**Location**: Section header in launcher-view
**Problem**: Header says "3 Series · 30 Tazos" but hero says "349 Tazos" and each franchise card shows "10 of X"
**Fix**: Change to "3 Series · Featured Tazos" or "3 Series · 30 Published of 349"

### CRIT-4: Missing X-Frame-Options
**Location**: VPS Caddyfile TTG block
**Risk**: Clickjacking vulnerability
**Fix**: Add `X-Frame-Options DENY` to Caddy header block

### CRIT-5: Legal Pages Are JS-Only
**Location**: Privacy, Terms, Cookies rendered inside LauncherView (client component)
**Risk**: Search engines may not crawl legal content
**Fix**: Create standalone server-rendered pages at `/privacy`, `/terms`, `/cookies`

---

## 3. HIGH Issues

### HIGH-1: "Classic snack toy collections"
**Location**: launcher-view.tsx subtitle
**Risk**: Suggests connection to real snack brands
**Fix**: "Classic collectible tazo series"

### HIGH-2: Missing FAQ completeness
**Missing Qs**: "Is this affiliated with any real brand?", "Does the site show ads?", "What data does the site collect?"
**Fix**: Add these to FAQ

### HIGH-3: robots.txt missing disallows
**Missing**: `/app/`, `/login`, `/register`, `/account`, `/settings`
**Fix**: Add to robots.txt

---

## 4. MEDIUM Issues

### MED-1: No standalone /privacy, /terms, /cookies routes
**Fix**: Create server-rendered pages that redirect or mirror the ?page= content

### MED-2: No JSON-LD on FAQ page
**Fix**: Add FAQPage schema

### MED-3: CookieConsentBanner referenced but no CMP for AdSense
**Fix**: Document CMP strategy; implement consent mode before enabling AdSense

### MED-4: hreflang not fully configured
**Fix**: Add proper hreflang tags for EN/ES pages

---

## 5. Security Checklist

| Check | Status | Notes |
|-------|--------|-------|
| HTTPS | ✅ | Caddy handles |
| HSTS | ✅ | max-age=31536000; includeSubDomains; preload |
| CSP | ✅ | Comprehensive, includes AdSense domains |
| X-Frame-Options | ❌ | MISSING in TTG block |
| X-Content-Type-Options | ✅ | nosniff |
| Referrer-Policy | ✅ | strict-origin-when-cross-origin |
| Permissions-Policy | ✅ | camera=(), microphone=(), geolocation=() |
| Server header hidden | ✅ | -Server |

---

## 6. AdSense Readiness

| Check | Status |
|-------|--------|
| Publisher ID | ✅ pub-4932643710484609 |
| ads.txt | ✅ Present with correct ID |
| Meta tag | ✅ ca-pub in HTML |
| CSP allows pagead2 | ✅ |
| CSP allows fundingchoices | ✅ |
| CMP (Consent Management) | ⚠️ CookieConsentBanner exists but needs TCF compliance for EEA/UK/CH |
| Privacy Policy | ⚠️ Needs update for AdSense |
| Cookie Policy | ⚠️ Contradicts analytics |
| No accidental click zones | ✅ Battle area, Play Now, bag opening are ad-free |
| NEXT_PUBLIC_ADSENSE_ENABLED | ⚠️ Check if gate exists |

---

## 7. Copy Consistency Fixes Needed

1. "Official Game (Beta)" → "Official TTG Beta"
2. "3 Series · 30 Tazos" → "3 Series · Featured Tazos"  
3. "Classic snack toy collections" → "Classic collectible tazo series"
4. Cookie policy: update for Plausible analytics
5. "no ads / no tracking" → document actual state
6. Add disclaimer text to footer
