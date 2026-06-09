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
  await test("Contact page", async () => await get("/contact"));
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
    if (tazos.length !== 30) throw new Error(`Expected 30, got ${tazos.length}`);
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
