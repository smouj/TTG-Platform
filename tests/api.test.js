// ============================================================
// Trading Tazos Game — API Smoke Tests
// Verifica que todas las APIs públicas respondan correctamente.
// Ejecutar: node tests/api.test.js
// ============================================================

const BASE = process.env.BASE_URL || "http://localhost:3000";
const VERBOSE = process.env.VERBOSE === "1";

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed++;
    if (VERBOSE) console.log(`  ✅ ${name}`);
    else process.stdout.write(".");
  } catch (e) {
    failed++;
    console.error(`\n  ❌ ${name}: ${e.message}`);
  }
}

async function get(path, expectStatus = 200) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { redirect: "manual" });
  if (res.status !== expectStatus) {
    throw new Error(`${path} → ${res.status} (expected ${expectStatus})`);
  }
  return res;
}

async function getJson(path, expectStatus = 200) {
  const res = await get(path, expectStatus);
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("json")) throw new Error(`${path}: not JSON (${ct})`);
  return res.json();
}

// ── Public pages (HTML) ──
async function run() {
  console.log("\n🧪 TTG API Smoke Tests\n");

  // Landing + static pages
  await test("Landing /", async () => await get("/"));
  await test("Login page", async () => await get("/login"));
  await test("Register page", async () => await get("/register"));
  await test("Contact redirect → 307", async () => {
    const res = await fetch(`${BASE}/contact`, { redirect: "manual" });
    if (res.status !== 307 && res.status !== 308) throw new Error(`Expected redirect, got ${res.status}`);
  });
  await test("Collections /cybermon", async () => await get("/collections/cybermon"));
  await test("Collections /dracobell", async () => await get("/collections/dracobell"));
  await test("Collections /minimon", async () => await get("/collections/minimon"));
  await test("Tazos catalog", async () => await get("/tazos", 308));
  await test("Download redirect", async () => await get("/download", 308));

  // SEO pages
  await test("SEO /tazos/cipherion (SSG)", async () => {
    const res = await get("/tazos/cipherion");
    const html = await res.text();
    if (!html.includes("Cipherion")) throw new Error("Missing tazo name");
    if (!html.includes('"@type":"Product"')) throw new Error("Missing structured data");
    if (!html.includes("og:image")) throw new Error("Missing OG metadata");
  });

  await test("SEO /tazos/nonexistent → 404", async () => {
    await get("/tazos/zzzz-does-not-exist", 404);
  });

  // Protected routes (307 redirect to login)
  await test("Protected app/battle → 307", async () => await get("/app/battle", 307));
  await test("Protected app/collection → 307", async () => await get("/app/collection", 307));

  // ── Public APIs ──
  await test("API health", async () => {
    const data = await getJson("/api/health");
    if (data.status !== "ok") throw new Error("Status not ok");
    if (!data.db || !data.db.connected) throw new Error("DB not connected");
    if (data.counts.tazos < 1) throw new Error("No tazos");
  });

  await test("API stats", async () => {
    const data = await getJson("/api/stats");
    if (data.error) throw new Error(data.error);
  });

  await test("API tazos (published)", async () => {
    const data = await getJson("/api/tazos?publishStatus=published&limit=50");
    // Handle paginated wrapper
    const tazos = Array.isArray(data) ? data : (data.tazos || data.data || []);
    if (tazos.length < 1) throw new Error("Expected at least one published tazo");
    const invalid = tazos.find((t) => t.publishStatus !== "published" || t.sourceStatus !== "verified");
    if (invalid) throw new Error(`Unverified published tazo: ${invalid.slug || invalid.name}`);
    // Verify structure
    const t = tazos[0];
    if (!t.name || !t.slug || !t.rarity) throw new Error("Missing required fields");
  });

  await test("API leaderboard", async () => {
    const data = await getJson("/api/leaderboard");
    if (data.error) throw new Error(data.error);
  });

  await test("API trades (empty, no user → 40x)", async () => {
    const res = await fetch(`${BASE}/api/trade/offer/any`);
    if (![400,401,403,405].includes(res.status)) throw new Error(`Unexpected status ${res.status}`);
  });

  // ── Static files ──
  await test("robots.txt", async () => {
    const res = await fetch(`${BASE}/robots.txt`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const text = await res.text();
    if (!text.includes("Allow")) throw new Error("Invalid robots.txt");
  });

  await test("sitemap.xml", async () => {
    const res = await fetch(`${BASE}/sitemap.xml`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const text = await res.text();
    if (!text.includes("tradingtazosgame.com")) throw new Error("Invalid sitemap");
  });

  await test("ads.txt", async () => {
    const res = await fetch(`${BASE}/ads.txt`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // ── Admin pages (public access check) ──
  await test("Admin /admin (200, client-redirects auth)", async () => {
    await get("/admin");
  });

  await test("Admin /admin/tazos", async () => {
    await get("/admin/tazos");
  });

  // ── Structured Data + SEO verification ──
  await test("JSON-LD VideoGame on landing", async () => {
    const res = await fetch(`${BASE}/`);
    const html = await res.text();
    if (!html.includes('"@type":"VideoGame"')) throw new Error("Missing VideoGame schema");
    if (!html.includes('"@type":"WebSite"')) throw new Error("Missing WebSite schema");
    if (!html.includes('"@type":"SearchAction"')) throw new Error("Missing SearchAction");
  });

  await test("OG metadata on landing", async () => {
    const res = await fetch(`${BASE}/`);
    const html = await res.text();
    if (!html.includes("og:title")) throw new Error("Missing og:title");
    if (!html.includes("og:description")) throw new Error("Missing og:description");
    if (!html.includes("og:image")) throw new Error("Missing og:image");
    if (!html.includes("twitter:card")) throw new Error("Missing twitter:card");
  });

  await test("Plausible analytics script", async () => {
    const res = await fetch(`${BASE}/`);
    const html = await res.text();
    if (!html.includes("plausible.rpgclaw.com")) throw new Error("Missing Plausible script");
  });

  await test("Legal page /privacy", async () => {
    await get("/privacy");
  });

  await test("Legal page /terms", async () => {
    await get("/terms");
  });

  await test("Battle history API (auth required)", async () => {
    const res = await fetch(`${BASE}/api/battle/history`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test("AdSense script present", async () => {
    if (process.env.EXPECT_ADSENSE !== "1") return;
    const res = await fetch(`${BASE}/`);
    const html = await res.text();
    if (!html.includes("pagead2.googlesyndication.com")) throw new Error("Missing AdSense script");
    if (!html.includes("ca-pub-4932643710484609")) throw new Error("Missing publisher ID");
  });

  await test("hreflang alternates", async () => {
    const res = await fetch(`${BASE}/`);
    const html = await res.text();
    if (!/rel=["']alternate["']|hreflang=|hrefLang/.test(html)) {
      throw new Error("Missing hreflang tags");
    }
  });

  await test("manifest.json (PWA)", async () => {
    const res = await fetch(`${BASE}/manifest.json`);
    if (res.status !== 200) throw new Error("Missing manifest");
    const json = await res.json();
    if (json.name !== "Trading Tazos Game") throw new Error("Wrong name");
  });

  // ── Results ──
  const total = passed + failed;
  console.log(`\n\n${passed}/${total} passed`);
  if (failed > 0) {
    console.log(`${failed} FAILED ❌`);
    process.exit(1);
  } else {
    console.log("All tests passed ✅");
  }
}

run().catch(console.error);
