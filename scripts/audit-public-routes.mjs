#!/usr/bin/env node
/**
 * scripts/audit-public-routes.mjs
 * Auditoría de rutas públicas para Trading Tazos Game.
 * Verifica: HTTP status, title, meta description, canonical, robots, H1.
 */

const BASE = process.env.BASE_URL || "https://tradingtazosgame.com"

const ROUTES = [
  // Main pages
  { path: "/", label: "Home", expectedStatus: 200 },
  { path: "/?page=how-to-play", label: "How to Play", expectedStatus: 200 },
  { path: "/?page=collections", label: "Collections", expectedStatus: 200 },
  { path: "/?page=tazos", label: "Tazos Catalog", expectedStatus: 200 },
  { path: "/?page=leaderboard", label: "Leaderboard", expectedStatus: 200 },
  { path: "/?page=download", label: "Download", expectedStatus: 200 },
  { path: "/?page=faq", label: "FAQ", expectedStatus: 200 },
  { path: "/?page=shop", label: "Shop", expectedStatus: 200 },
  { path: "/?page=privacy", label: "Privacy (launcher)", expectedStatus: 200 },
  { path: "/?page=terms", label: "Terms (launcher)", expectedStatus: 200 },
  { path: "/?page=cookies", label: "Cookies (launcher)", expectedStatus: 200 },
  { path: "/?page=contact", label: "Contact", expectedStatus: 200 },
  // Standalone legal
  { path: "/privacy", label: "Privacy (standalone)", expectedStatus: 200 },
  { path: "/terms", label: "Terms (standalone)", expectedStatus: 200 },
  { path: "/cookies", label: "Cookies (standalone)", expectedStatus: 200 },
  { path: "/disclaimer", label: "Disclaimer", expectedStatus: 200 },
  // SEO files
  { path: "/robots.txt", label: "Robots.txt", expectedStatus: 200 },
  { path: "/sitemap.xml", label: "Sitemap", expectedStatus: 200 },
  { path: "/ads.txt", label: "Ads.txt", expectedStatus: 200 },
  { path: "/llms.txt", label: "LLMs.txt", expectedStatus: 200 },
  { path: "/manifest.json", label: "Manifest", expectedStatus: 200 },
  // APIs (public)
  { path: "/api/stats", label: "API Stats", expectedStatus: 200 },
  { path: "/api/tazos?publishStatus=published", label: "API Tazos", expectedStatus: 200 },
  { path: "/api/health", label: "API Health", expectedStatus: 200 },
]

const PRIVATE_ROUTES = [
  { path: "/app/collection", label: "App Collection" },
  { path: "/app/shop", label: "App Shop" },
  { path: "/app/battle", label: "App Battle" },
  { path: "/app/decks", label: "App Decks" },
  { path: "/app/settings", label: "App Settings" },
  { path: "/app/stats", label: "App Stats" },
  { path: "/admin", label: "Admin" },
  { path: "/admin/tazo-designer", label: "Admin Tazo Designer" },
  { path: "/login", label: "Login" },
  { path: "/register", label: "Register" },
  { path: "/api/collection", label: "API Collection" },
  { path: "/api/auth/me", label: "API Auth Me" },
]

function checkHtml(html, label) {
  const issues = []
  if (!html.includes("<title>")) issues.push("Missing <title>")
  if (!html.toLowerCase().includes('<meta name="description"')) issues.push("Missing meta description")
  if (!html.toLowerCase().includes("canonical")) issues.push("Missing canonical hint")
  if (!/<h1[ >]/.test(html)) issues.push("Missing <h1>")
  return issues
}

async function main() {
  const results = []
  let passed = 0, failed = 0, warnings = 0

  console.log(`\n🔍 Auditing ${BASE}\n${"=".repeat(60)}\n`)

  for (const route of ROUTES) {
    const url = `${BASE}${route.path}`
    try {
      const res = await fetch(url, { redirect: "manual" })
      const status = res.status
      const statusOk = status === route.expectedStatus || (route.expectedStatus === 200 && status >= 200 && status < 400)

      let issues = []
      if (statusOk) {
        const html = await res.text()
        issues = checkHtml(html, route.label)
      }

      const result = {
        label: route.label,
        url,
        status,
        expected: route.expectedStatus,
        statusOk,
        seoIssues: issues,
      }
      results.push(result)

      if (!statusOk) {
        failed++
        console.log(`❌ ${route.label.padEnd(24)} HTTP ${status} (expected ${route.expectedStatus})`)
      } else if (issues.length) {
        warnings++
        console.log(`⚠️  ${route.label.padEnd(24)} HTTP ${status} · ${issues.join(", ")}`)
      } else {
        passed++
        console.log(`✅ ${route.label.padEnd(24)} HTTP ${status}`)
      }
    } catch (err) {
      failed++
      console.log(`❌ ${route.label.padEnd(24)} Error: ${err.message}`)
      results.push({ label: route.label, url, error: err.message })
    }
  }

  // Check private routes are not publicly accessible
  console.log(`\n🔒 Private routes (should redirect/block):\n`)
  for (const route of PRIVATE_ROUTES) {
    const url = `${BASE}${route.path}`
    try {
      const res = await fetch(url, { redirect: "manual" })
      const blocked = res.status >= 300 && res.status < 400
      if (blocked) {
        passed++
        console.log(`✅ ${route.label.padEnd(24)} HTTP ${res.status} (redirected/blocked)`)
      } else if (res.status === 401 || res.status === 403) {
        passed++
        console.log(`✅ ${route.label.padEnd(24)} HTTP ${res.status} (auth required)`)
      } else {
        warnings++
        console.log(`⚠️  ${route.label.padEnd(24)} HTTP ${res.status} (not blocked!)`)
      }
    } catch (err) {
      console.log(`⚠️  ${route.label.padEnd(24)} Error: ${err.message}`)
    }
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`)
  console.log(`📊 Results: ${passed} passed · ${failed} failed · ${warnings} warnings`)
  console.log(`Total routes checked: ${results.length + PRIVATE_ROUTES.length}`)
  console.log()

  // Exit code
  process.exit(failed > 0 ? 1 : 0)
}

main()
