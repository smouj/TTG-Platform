# TTG Heartbeat — v0.10.0 ✅ ONLINE — 2026-06-18 11:30 CEST
# 🔒 Security: CVE-2026-12143 (form-data CRLF injection) fixed → 4.0.6
# 🔒 Security: CVE-2026-53550 (js-yaml quadratic DoS) fixed → 4.2.0 (overrides)
# 🎨 DESIGN SYSTEM: tokens.css v1.0 — 60+ --ttg-* variables, channel variants, Tailwind @theme
# 🎨 FASE 2: ~1000 hex → 312 hex across 62 components (93.8% reduction in core components)
# 🎨 Tokenized: magazine-header, magazine-footer, page-shell, battle-hud, battle-view, tazo-card
# 🎨 Tokenized: launcher-view (91.6%), all admin/wiki components, shop, UI
# 🔧 --radius: 0px global → all shadcn/ui components sharp (magazine aesthetic)
# 🛍️ Shop: BagCardMini3D v12 (7 meshes, 3-pt lighting, breathing idle anim)
# 🛍️ BagOpener3D v12 (split useEffect, cinematic zoom, particle burst, seal glow)
# ⚔️ Battle: smooth launch (1.2s) → fade overlay → arena reveal
# ⚔️ Battle: placement phase v1 (stake positioning + deck tube 3D)
# 🎮 Gameplay: playerRemaining fix, TKO scoring, AI-first opponent tracking
# 👆 Splash screen clickable to skip + hint after 2s
# 🔑 JWT_SECRET in ttg-ws ecosystem.config.js env block
# 🔗 Download links: v0.10.0 binaries
# 🎮 /battle/practice: unique SEO metadata
# 🛡️ WebGL fallback: detector + fallback UI + guard wrapper
# 🔊 Audio: AudioContext lazy init (autoplay warnings fixed)
# 📊 Level/XP System: progressive XP curve, level titles, XP rewards
# 🏆 Leaderboard: top 10 by level in /app/stats
# 🎯 Quests: sharp-corner level-up celebration, magazine halftone panels
# ⚙️ Settings: User ID Card (compact) + avatar onError + bio editing
# 📚 Collection: User ID Card (compact) + userData fetch
# 🔧 Admin: 9 panels — broken links fixed, naming unified
# 📚 Wiki: folded into launcher (/?page=wiki), 351 SSG pages
# 🗄️ SQLite WAL mode enabled — concurrent reads safe
# 🔧 Security updates: apparmor, cloud-init, snapd, zerotier-one (5 pkg)
# 🐧 Kernel 6.8.0-124 ✅ (rebooted)
# 🔧 FK constraint: admin tazo delete pre-checks ownership
# 👁️ Visual verification: all routes render correctly
# 🧹 0 TS errors, npm audit 0 CVEs
# 🗑️ Dead props cleaned, 0 console errors

# 🚀 Deployed: VPS synced, PM2 restarted, DB integrity OK (e88eef0..ef30eed)
# GitHub: main=ef30eed | 🏷️ v0.10.0 (9 ahead) | ✅ Released
# DB: 139 published tazos, 3 users, 94 UserTazos, DB symlink intact
# npm: @trading-tazos-game/cli v1.0.4 published
# 🌐 PM2: ttg v0.10.0 (141MB) + ttg-ws v0.10.0 (64MB) — online
# 📊 Analytics: Google Search Console only
# 🔍 DB corruption history: 26 "malformed" errors (Jun 16), resolved. Integrity OK now.
# 🔒 npm audit: 0 CVEs (0 low, 0 moderate, 0 high, 0 critical)
