#!/usr/bin/env node
// ============================================================
// ttg-artgen — Internal Art Generator for Trading Tazos Game
// ============================================================
// Generates original creature/fighter images for TTG's
// fictional collectible lines: Minimon, Cybermon, Draco Bell.
//
// Usage:
//   node artgen/scripts/generate-ttg-art.mjs <creature-id> [variants]
//   node artgen/scripts/generate-ttg-art.mjs --list
//   node artgen/scripts/generate-ttg-art.mjs --line minimon
//
// Multi-backend: auto-detects OpenRouter > XAI > OpenAI.
// Set PROVIDER in .env to force: openrouter | xai | openai
//
// Prerequisites:
//   npm install openai dotenv
//   Set at least one: OPENROUTER_API_KEY, XAI_API_KEY, or OPENAI_API_KEY
// ============================================================

import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ARTGEN_DIR = path.resolve(__dirname, "..")
const OUTPUT_DIR = path.join(ARTGEN_DIR, "output")
const CREATURES_PATH = path.join(ARTGEN_DIR, "creatures.json")
const STYLES_DIR = path.join(ARTGEN_DIR, "styles")

// ─── Backend Configuration ────────────────────────────────
// Priority: explicit PROVIDER env → OpenRouter → XAI → OpenAI
const BACKENDS = {
  openrouter: {
    name: "OpenRouter",
    baseURL: "https://openrouter.ai/api/v1",
    apiKeyEnv: "OPENROUTER_API_KEY",
    defaultModel: process.env.IMAGE_MODEL || "google/gemini-3.1-flash-image-preview",
    defaultSize: "1024x1024",
    // OpenRouter uses OpenAI-compatible API
    extraHeaders: (key) => ({
      "HTTP-Referer": "https://github.com/smouj/Trading-Tazos-Game",
      "X-Title": "TTG ArtGen",
    }),
  },
  xai: {
    name: "xAI Grok",
    baseURL: "https://api.x.ai/v1",
    apiKeyEnv: "XAI_API_KEY",
    defaultModel: "grok-imagine-image",
    defaultSize: "1024x1024",
  },
  openai: {
    name: "OpenAI",
    baseURL: "https://api.openai.com/v1",
    apiKeyEnv: "OPENAI_API_KEY",
    defaultModel: "gpt-image-2",
    defaultSize: "1024x1024",
    extraBody: () => ({ quality: process.env.IMAGE_QUALITY || "high" }),
  },
}

// ─── Banned terms (avoid IP contamination) ────────────────
const BANNED_TERMS = [
  "pokemon", "pikachu", "charizard", "bulbasaur", "squirtle", "mewtwo", "eevee",
  "digimon", "agumon", "gabumon", "patamon", "gatomon", "tentomon",
  "dragon ball", "dragonball", "goku", "vegeta", "gohan", "piccolo", "frieza",
  "toriyama", "akira toriyama",
  "ken sugimori", "kenji watanabe",
  "nintendo", "game freak", "bandai", "toei animation",
  "pokeball", "poke ball",
]

// ─── Helpers ──────────────────────────────────────────────

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function assertSafePrompt(prompt) {
  const normalized = prompt.toLowerCase()
  for (const term of BANNED_TERMS) {
    if (normalized.includes(term)) {
      throw new Error(`BLOCKED: Prompt contains banned term "${term}". Refusing to generate.`)
    }
  }
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8")
  return JSON.parse(raw)
}

function buildPrompt(creature, style) {
  const features = creature.features?.join(", ") || "distinctive original features"
  const accents = creature.accentColors?.join(", ") || "contrasting accent colors"

  const prompt = [
    style.basePrompt.trim(),
    "",
    "Character sheet:",
    `- Name: ${creature.name}`,
    `- Line: ${creature.line}`,
    `- Category: ${creature.category}`,
    `- Rarity: ${creature.rarity}`,
    `- Element: ${creature.element}`,
    `- Body: ${creature.body}`,
    `- Main color: ${creature.mainColor}`,
    `- Accent colors: ${accents}`,
    `- Features: ${features}`,
    `- Personality: ${creature.personality}`,
    `- Pose: ${creature.pose}`,
    `- Background: ${creature.background}`,
    "",
    "Composition rules:",
    "- Full body visible.",
    "- Centered character.",
    "- Clear readable silhouette.",
    "- Suitable for collectible token / tazo artwork.",
    "- No text in the image.",
    "- No logos.",
    "- No watermark.",
    "- Fully original design.",
    "",
    "Avoid:",
    style.avoid,
  ].join("\n")

  assertSafePrompt(prompt)
  return prompt
}

// ─── Backend detection ────────────────────────────────────

function detectBackend() {
  const forced = process.env.PROVIDER
  if (forced && BACKENDS[forced]) {
    const cfg = BACKENDS[forced]
    if (!process.env[cfg.apiKeyEnv]) {
      throw new Error(
        `Provider "${forced}" requires ${cfg.apiKeyEnv}. Set it in .env or your environment.`
      )
    }
    return forced
  }

  // Auto-detect: first available
  for (const [key, cfg] of Object.entries(BACKENDS)) {
    if (process.env[cfg.apiKeyEnv]) {
      return key
    }
  }

  throw new Error(
    "No image generation API key found.\n" +
    "Set one of: OPENROUTER_API_KEY, XAI_API_KEY, or OPENAI_API_KEY\n" +
    "Or add to .env:\n" +
    "  OPENROUTER_API_KEY=sk-or-v1-...\n" +
    "  PROVIDER=openrouter"
  )
}

// ─── Image generation per backend ─────────────────────────

async function generateViaOpenAI({ prompt, client, model, size }) {
  const extraBody = BACKENDS.openai.extraBody?.() || {}
  const result = await client.images.generate({
    model,
    prompt,
    size,
    n: 1,
    response_format: "b64_json",
    ...extraBody,
  })
  const b64 = result.data?.[0]?.b64_json
  if (!b64) throw new Error("No b64_json in response. Model may not support this format.")
  return Buffer.from(b64, "base64")
}

async function generateViaOpenRouter({ prompt, client, model, size }) {
  // OpenRouter is OpenAI-compatible
  return await generateViaOpenAI({ prompt, client, model, size })
}

async function generateViaXAI({ prompt, client, model }) {
  // xAI's grok-imagine-image does NOT accept "size" parameter
  const result = await client.images.generate({
    model,
    prompt,
    n: 1,
    response_format: "b64_json",
  })
  const b64 = result.data?.[0]?.b64_json
  if (!b64) throw new Error("No b64_json in response.")
  return Buffer.from(b64, "base64")
}

const GENERATORS = {
  openai: generateViaOpenAI,
  openrouter: generateViaOpenRouter,
  xai: generateViaXAI,
}

// ─── Generate one variant ─────────────────────────────────

async function generateImage({ creature, style, variant = 1, client, backend, model, size }) {
  const prompt = buildPrompt(creature, style)

  const outputFolder = path.join(
    OUTPUT_DIR,
    creature.line,
    `${creature.id}-${slugify(creature.name)}`
  )
  await fs.mkdir(outputFolder, { recursive: true })

  const generationId = crypto.randomUUID()
  const variantStr = String(variant).padStart(2, "0")
  const imageFilename = `${creature.id}-v${variantStr}.png`
  const imagePath = path.join(outputFolder, imageFilename)
  const metadataPath = path.join(outputFolder, `${creature.id}-v${variantStr}.json`)

  console.log(`\n🎨 Generating ${creature.id} (${creature.name}) — variant ${variant}/${process.env._VARIANTS || variant}`)
  console.log(`   Line:    ${creature.line}`)
  console.log(`   Style:   ${style.styleName}`)
  console.log(`   Backend: ${BACKENDS[backend].name}`)
  console.log(`   Model:   ${model} @ ${size}`)

  const generate = GENERATORS[backend]
  const imageBuffer = await generate({ prompt, client, model, size })

  await fs.writeFile(imagePath, imageBuffer)

  const metadata = {
    generationId,
    createdAt: new Date().toISOString(),
    backend,
    provider: BACKENDS[backend].name,
    model,
    size,
    status: "draft",
    variant,
    creature: {
      id: creature.id,
      name: creature.name,
      line: creature.line,
      category: creature.category,
      rarity: creature.rarity,
    },
    style: {
      line: style.line,
      styleName: style.styleName,
    },
    prompt,
  }

  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), "utf8")

  const stats = await fs.stat(imagePath)
  const sizeKB = (stats.size / 1024).toFixed(0)

  console.log(`   ✅ Saved: ${imageFilename} (${sizeKB} KB)`)
  console.log(`   📋 Meta:  ${path.basename(metadataPath)}`)
  console.log(`   ID:      ${generationId}`)

  return { imagePath, metadataPath, generationId }
}

// ─── CLI ──────────────────────────────────────────────────

async function main() {
  const creaturesData = await readJson(CREATURES_PATH)
  const creatures = creaturesData.creatures

  // Special flags
  const flag = process.argv[2]

  if (flag === "--list" || flag === "-l") {
    console.log(`\n📋 Available creatures (${creatures.length} total):\n`)
    const lines = {}
    for (const c of creatures) {
      lines[c.line] = lines[c.line] || []
      lines[c.line].push(c)
    }
    for (const [line, items] of Object.entries(lines)) {
      console.log(`  ── ${line.toUpperCase()} ──`)
      for (const c of items) {
        console.log(`    ${c.id.padEnd(18)} ${c.rarity.padEnd(10)} ${c.name}`)
      }
      console.log()
    }
    return
  }

  if (flag === "--line" || flag === "-L") {
    const line = process.argv[3]
    if (!line) {
      console.error("Usage: node generate-ttg-art.mjs --line <minimon|cybermon|draco-bell>")
      process.exit(1)
    }
    const filtered = creatures.filter((c) => c.line === line)
    console.log(`\n📋 ${line} creatures (${filtered.length}):\n`)
    for (const c of filtered) {
      console.log(`    ${c.id.padEnd(18)} ${c.rarity.padEnd(10)} ${c.name}`)
    }
    return
  }

  if (flag === "--backends" || flag === "-B") {
    console.log("\n📡 Available backends:\n")
    for (const [key, cfg] of Object.entries(BACKENDS)) {
      const available = !!process.env[cfg.apiKeyEnv]
      console.log(`  ${available ? "✅" : "❌"} ${cfg.name.padEnd(12)} ${key.padEnd(12)} ${cfg.apiKeyEnv}=${available ? "***" : "(not set)"}`)
    }
    console.log(`\n  Default model for active backend: ${BACKENDS[detectBackend()].defaultModel}`)
    return
  }

  // ─── Load .env ──────────────────────────────────────
  try {
    const dotenv = await import("dotenv")
    dotenv.config()
  } catch {
    // dotenv is optional if env vars are set elsewhere
  }

  // ─── Detect backend ─────────────────────────────────
  let backend, backendCfg
  try {
    backend = detectBackend()
    backendCfg = BACKENDS[backend]
  } catch (err) {
    console.error("❌", err.message)
    process.exit(1)
  }

  const apiKey = process.env[backendCfg.apiKeyEnv]
  const model = process.env.IMAGE_MODEL || backendCfg.defaultModel
  const size = process.env.IMAGE_SIZE || backendCfg.defaultSize

  // ─── Load OpenAI client (works for all OpenAI-compatible backends) ──
  let OpenAI
  try {
    const mod = await import("openai")
    OpenAI = mod.default
  } catch {
    console.error("❌ Missing dependency: npm install openai dotenv")
    process.exit(1)
  }

  const clientConfig = {
    apiKey,
    baseURL: backendCfg.baseURL,
  }

  // Inject extra headers (e.g. OpenRouter needs HTTP-Referer)
  if (backendCfg.extraHeaders) {
    clientConfig.defaultHeaders = backendCfg.extraHeaders(apiKey)
  }

  const client = new OpenAI(clientConfig)

  // ─── Parse arguments ────────────────────────────────
  const selectedId = process.argv[2]
  if (!selectedId) {
    console.error("Usage: node generate-ttg-art.mjs <creature-id> [variants]")
    console.error("       node generate-ttg-art.mjs --list")
    console.error("       node generate-ttg-art.mjs --line <name>")
    console.error("       node generate-ttg-art.mjs --backends")
    process.exit(1)
  }

  const creature = creatures.find((c) => c.id === selectedId)
  if (!creature) {
    console.error(`❌ Creature not found: "${selectedId}"`)
    console.error("   Use --list to see all available creatures.")
    process.exit(1)
  }

  const variants = Math.min(parseInt(process.argv[3] || "1", 10), 8)
  process.env._VARIANTS = String(variants)

  const stylePath = path.join(STYLES_DIR, `${creature.line}.json`)
  let style
  try {
    style = await readJson(stylePath)
  } catch {
    console.error(`❌ Style preset not found: ${stylePath}`)
    process.exit(1)
  }

  console.log(`\n🖌️  ttg-artgen — Trading Tazos Game Art Generator`)
  console.log(`   Creature: ${creature.id} — ${creature.name}`)
  console.log(`   Variants: ${variants}`)
  console.log(`   Backend:  ${backendCfg.name}`)
  console.log(`   Model:    ${model}`)
  console.log(`   Size:     ${size}`)

  const results = []
  for (let v = 1; v <= variants; v++) {
    try {
      const result = await generateImage({
        creature, style, variant: v, client, backend, model, size
      })
      results.push(result)
      if (v < variants) {
        console.log(`   ⏳ Waiting 2s before next variant...`)
        await new Promise((r) => setTimeout(r, 2000))
      }
    } catch (err) {
      console.error(`\n❌ Variant ${v} failed:`, err.message)
    }
  }

  console.log(`\n✨ Done! Generated ${results.length}/${variants} variants.`)
  if (results.length > 0) {
    console.log(`   Output: ${path.relative(process.cwd(), path.dirname(results[0].imagePath))}/`)
  }
  console.log(`\n   Next: review images → update status in .json → approve → export to public/assets/tazos/`)
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err.message)
  process.exit(1)
})
