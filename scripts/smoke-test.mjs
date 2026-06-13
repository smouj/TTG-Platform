#!/usr/bin/env node
// ============================================================
// TTG Production Smoke Test
// ============================================================
// Covers all public routes, APIs, static files, auth redirects.
// Usage:
//   node scripts/smoke-test.mjs                        (localhost:3000)
//   BASE_URL=https://tradingtazosgame.com node scripts/smoke-test.mjs
//   CI=1 node scripts/smoke-test.mjs                   (compact output)
// ============================================================

import { execSync } from "node:child_process";

const BASE = process.env.BASE_URL || (process.env.CI === "1" ? "https://tradingtazosgame.com" : "http://localhost:3000");
const CI = process.env.CI === "1";
let passed = 0;
let failed = 0;
const failures = [];

const HEADER = "\x1b[1;36m"; // cyan bold
const OK = "\x1b[32m";       // green
const FAIL = "\x1b[31m";     // red
const RESET = "\x1b[0m";

async function test(label, fn) {
  try {
    await fn();
    passed++;
    if (CI) process.stdout.write(".");
    else console.log(`  ${OK}✓${RESET} ${label}`);
  } catch (e) {
    failed++;
    failures.push({ label, error: e.message });
    if (CI) process.stdout.write("X");
    else console.log(`  ${FAIL}✗${RESET} ${label} — ${e.message}`);
  }
}

async function fetchStatus(path, expected = 200) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { redirect: "manual" });
  if (res.status !== expected) {
    throw new Error(`HTTP ${res.status} (expected ${expected})`);
  }
  return res;
}

async function fetchJson(path, expected = 200) {
  const res = await fetchStatus(path, expected);
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("json")) throw new Error(`Content-Type: ${ct} (not JSON)`);
  return res.json();
}

async function fetchContains(path, text, expected = 200) {
  const res = await fetchStatus(path, expected);
  const body = await res.text();
  if (!body.includes(text)) throw new Error(`Missing "${text}" in body`);
  return body;
}

async function run() {
  if (!CI) console.log(`${HEADER}🧪 TTG Smoke Test — ${BASE}${RESET}\n`);

  // ── Public pages (200) ──
  const pages = [
    ["/", "Landing"],
    ["/?page=how-to-play", "How to Play"],
    ["/?page=collections", "Collections"],
    ["/?page=tazos", "Tazo Catalog"],
    ["/?page=leaderboard", "Leaderboard"],
    ["/?page=download", "Download"],
    ["/?page=faq", "FAQ"],
    ["/?page=shop", "Public Shop"],
    ["/login", "Login"],
    ["/register", "Register"],
  ];
  for (const [path, label] of pages) {
    await test(label, () => fetchStatus(path, 200));
  }

  // ── Standalone legal pages (200) ──
  const legal = [
    ["/privacy", "Privacy"],
    ["/terms", "Terms"],
    ["/cookies", "Cookies"],
  ];
  for (const [path, label] of legal) {
    await test(label, () => fetchContains(path, "<html", 200));
  }

  // ── Static files (200) ──
  const statics = [
    ["/robots.txt", "Robots"],
    ["/sitemap.xml", "Sitemap"],
    ["/ads.txt", "Ads"],
    ["/manifest.json", "Manifest"],
    ["/llms.txt", "LLMs"],
  ];
  for (const [path, label] of statics) {
    await test(label, () => fetchStatus(path, 200));
  }

  // ── Auth redirects (307) ──
  const authGuarded = [
    ["/app/collection", "Collection"],
    ["/app/decks", "Decks"],
    ["/app/shop", "App Shop"],
    ["/app/battle", "Battle"],
    ["/app/quests", "Quests"],
    ["/app/stats", "Stats"],
    ["/app/settings", "Settings"],
  ];
  for (const [path, label] of authGuarded) {
    await test(label, () => fetchStatus(path, 307));
  }

  // ── APIs (200) ──
  await test("/api/version", async () => {
    const json = await fetchJson("/api/version");
    if (!json.version) throw new Error("Missing version field");
  });

  await test("/api/health", async () => {
    await fetchStatus("/api/health");
  });

  await test("/api/stats", async () => {
    const json = await fetchJson("/api/stats");
    if (typeof json.totalTazos !== "number") throw new Error("Missing totalTazos");
  });

  await test("/api/tazos?publishStatus=published", async () => {
    const json = await fetchJson("/api/tazos?publishStatus=published&limit=5");
    if (!Array.isArray(json.tazos)) throw new Error("Missing tazos array");
  });

  // ── Contact redirect ──
  await test("/contact → 307", () => fetchStatus("/contact", 307));

  // ── Summary ──
  const total = passed + failed;
  if (!CI) {
    console.log(`\n${HEADER}────────────────────────────${RESET}`);
    console.log(`  Total: ${total}  ${OK}Passed: ${passed}${RESET}  ${FAIL}Failed: ${failed}${RESET}`);
  } else {
    console.log(`\n${passed}/${total} passed`);
  }

  if (failures.length > 0) {
    console.log(`\n${FAIL}Failures:${RESET}`);
    for (const f of failures) {
      console.log(`  ✗ ${f.label}: ${f.error}`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => {
  console.error(`\n${FAIL}FATAL: ${e.message}${RESET}`);
  process.exit(1);
});
