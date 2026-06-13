#!/usr/bin/env node
// ============================================================
// TTG E2E Auth & API Tests
// ============================================================
// Tests auth flows, protected pages, and API endpoints.
// Uses demo user (demo@tradingtazosgame.com / demo1234).
//
// Usage:
//   BASE_URL=https://tradingtazosgame.com node scripts/test-e2e.mjs
//   CI=1 node scripts/test-e2e.mjs
// ============================================================

const BASE = process.env.BASE_URL || "https://tradingtazosgame.com"
const CI = process.env.CI === "1"
const DEMO = { email: "demo@tradingtazosgame.com", password: "demo1234" }

let passed = 0
let failed = 0
const failures = []
let demoToken = null

function ok(label) { passed++; if (!CI) console.log(`  ✅ ${label}`); else process.stdout.write(".") }
function fail(label, detail) { failed++; failures.push({ label, detail }); if (!CI) console.log(`  ❌ ${label}: ${detail}`); else process.stdout.write("X") }

async function api(path, opts = {}) {
  const url = `${BASE}${path}`
  const headers = { ...opts.headers }
  if (demoToken && opts.auth !== false) {
    headers["Authorization"] = `Bearer ${demoToken}`
  }
  const res = await fetch(url, {
    method: opts.method || "GET",
    headers: { "Content-Type": "application/json", ...headers },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    redirect: "manual",
  })
  return res
}

async function assertStatus(path, expected, opts = {}) {
  const res = await api(path, opts)
  if (res.status !== expected) {
    throw new Error(`HTTP ${res.status} (expected ${expected})`)
  }
  return res
}

async function assertJson(path, opts = {}, expectedStatus = 200) {
  const res = await assertStatus(path, expectedStatus, opts)
  const ct = res.headers.get("content-type") || ""
  if (!ct.includes("json")) throw new Error(`Content-Type: ${ct}`)
  return res.json()
}

async function run() {
  if (!CI) console.log("🧪 TTG E2E Auth & API Tests\n")

  // ── 1. Auth: Login ──
  if (!CI) console.log("── Auth ──")
  await test("POST /api/auth/login → 200 + token", async () => {
    const json = await assertJson("/api/auth/login", { method: "POST", body: DEMO, auth: false })
    if (!json.token) throw new Error("No token in response")
    if (!json.user) throw new Error("No user in response")
    demoToken = json.token
    if (json.user.email !== DEMO.email) throw new Error("Wrong user email")
  })

  await test("POST /api/auth/login (bad password) → 401", async () => {
    const res = await api("/api/auth/login", { method: "POST", body: { email: DEMO.email, password: "wrong" }, auth: false })
    if (res.status !== 401) throw new Error(`HTTP ${res.status}`)
  })

  await test("POST /api/auth/login (no user) → 401", async () => {
    const res = await api("/api/auth/login", { method: "POST", body: { email: "noone@nowhere.com", password: "x" }, auth: false })
    if (res.status !== 401) throw new Error(`HTTP ${res.status}`)
  })

  // ── 2. Protected Routes (redirect) ──
  if (!CI) console.log("\n── Auth Redirects ──")
  const protectedRoutes = [
    ["/app/collection", "Collection"],
    ["/app/decks", "Decks"],
    ["/app/shop", "Shop"],
    ["/app/battle", "Battle"],
    ["/app/quests", "Quests"],
    ["/app/stats", "Stats"],
    ["/app/settings", "Settings"],
  ]
  for (const [path, label] of protectedRoutes) {
    await test(`${label} → 307 (unauthenticated)`, () => assertStatus(path, 307, { auth: false }))
  }

  // ── 3. Authenticated APIs ──
  if (!CI) console.log("\n── Authenticated APIs ──")

  await test("GET /api/collection → 200 + items", async () => {
    const json = await assertJson("/api/collection")
    if (!Array.isArray(json.items)) throw new Error("Missing items array")
    if (json.items.length < 5) throw new Error(`Only ${json.items.length} tazos (expected >=5)`)
  })

  await test("GET /api/decks → 200 + decks", async () => {
    const json = await assertJson("/api/decks")
    if (!Array.isArray(json.decks)) throw new Error("Missing decks array")
  })

  await test("GET /api/credits → 200 + credits", async () => {
    const json = await assertJson("/api/credits")
    if (typeof json.credits !== "number") throw new Error("Missing credits")
  })

  await test("POST /api/credits/daily → 200 (daily bonus)", async () => {
    const res = await api("/api/credits/daily", { method: "POST" })
    // 200 if not claimed today, 429 if already claimed
    if (![200, 429].includes(res.status)) throw new Error(`HTTP ${res.status}`)
  })

  await test("GET /api/leaderboard → 200", async () => {
    const json = await assertJson("/api/leaderboard?sort=battles&limit=3")
    if (!Array.isArray(json.leaderboard) && !Array.isArray(json.users) && !Array.isArray(json.entries))
      throw new Error("Missing leaderboard data")
  })

  await test("GET /api/battle/history → 200", async () => {
    const json = await assertJson("/api/battle/history")
    if (!Array.isArray(json.battles)) throw new Error("Missing battles array")
  })

  await test("GET /api/quests → 200", async () => {
    const json = await assertJson("/api/quests")
    if (!Array.isArray(json.quests) && !Array.isArray(json.data))
      throw new Error("Missing quests")
  })

  await test("GET /api/achievements → 200", async () => {
    const res = await api("/api/achievements")
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`)
  })

  // ── 4. Unauthenticated API protection ──
  if (!CI) console.log("\n── Auth Protection ──")

  await test("GET /api/collection (no auth) → 401", () => assertStatus("/api/collection", 401, { auth: false }))
  await test("GET /api/decks (no auth) → 401", () => assertStatus("/api/decks", 401, { auth: false }))
  await test("POST /api/credits/daily (no auth) → 401", () => assertStatus("/api/credits/daily", 401, { method: "POST", auth: false }))
  await test("GET /api/battle/history (no auth) → 401", () => assertStatus("/api/battle/history", 401, { auth: false }))

  // ── 5. Promo Code API ──
  if (!CI) console.log("\n── Promo Codes ──")
  await test("POST /api/promo/redeem (invalid) → 400", async () => {
    const res = await api("/api/promo/redeem", { method: "POST", body: { code: "INVALID_CODE_XYZ" } })
    if (res.status !== 400 && res.status !== 404) throw new Error(`HTTP ${res.status}`)
  })

  // ── 6. Public APIs ──
  if (!CI) console.log("\n── Public APIs ──")

  await test("GET /api/stats → 200 + totalTazos", async () => {
    const json = await assertJson("/api/stats", {}, 200)
    if (typeof json.totalTazos !== "number") throw new Error("Missing totalTazos")
    if (json.totalTazos < 100) throw new Error(`Only ${json.totalTazos} tazos`)
  })

  await test("GET /api/version → 200", async () => {
    const json = await assertJson("/api/version", {}, 200)
    if (!json.version) throw new Error("Missing version")
  })

  await test("GET /api/health → 200", async () => {
    const json = await assertJson("/api/health", {}, 200)
    if (!json.db || !json.db.connected) throw new Error("DB not connected")
  })

  await test("GET /api/tazos?publishStatus=published → 200", async () => {
    const json = await assertJson("/api/tazos?publishStatus=published&limit=3", {}, 200)
    const tazos = json.tazos || json
    if (!Array.isArray(tazos)) throw new Error("Missing tazos")
    if (tazos.length === 0) throw new Error("No published tazos")
  })

  // ── 7. Single Tazo Pages (SSG) ──
  if (!CI) console.log("\n── Tazo Detail Pages ──")
  await test("GET /tazos/lambdachip → 200", () => assertStatus("/tazos/lambdachip", 200, { auth: false }))
  await test("GET /tazos/aquafin → 200", () => assertStatus("/tazos/aquafin", 200, { auth: false }))
  await test("GET /tazos/blazejaw → 200", () => assertStatus("/tazos/blazejaw", 200, { auth: false }))

  // ── Summary ──
  const total = passed + failed
  if (CI) {
    console.log(`\n${passed}/${total} passed`)
  } else {
    console.log(`\n${"─".repeat(40)}`)
    console.log(`Total: ${total}  Passed: ${passed}  Failed: ${failed}`)
  }

  if (failures.length > 0) {
    console.log("\nFailures:")
    for (const f of failures) {
      console.log(`  ✗ ${f.label}: ${f.error}`)
    }
  }

  process.exit(failed > 0 ? 1 : 0)
}

async function test(label, fn) {
  try {
    await fn()
    ok(label)
  } catch (e) {
    fail(label, e.message)
  }
}

run().catch((e) => {
  console.error(`\nFATAL: ${e.message}`)
  process.exit(1)
})
