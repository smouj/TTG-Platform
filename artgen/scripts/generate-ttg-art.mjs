#!/usr/bin/env node
// ============================================================
// ttg-artgen — Internal Art Generator for Trading Tazos Game
// ============================================================
// Generates original creature/fighter images for TTG's
// fictional collectible lines: Minimon, Cybermon, Draco Bell.
//
// Usage:
//   node artgen/scripts/generate-ttg-art.mjs <creature-id> [variants]
//
// Examples:
//   node artgen/scripts/generate-ttg-art.mjs minimon-001 4
//   node artgen/scripts/generate-ttg-art.mjs dracobell-001 2
//   node artgen/scripts/generate-ttg-art.mjs --list
//   node artgen/scripts/generate-ttg-art.mjs --line minimon
//
// Prerequisites:
//   npm install openai dotenv
//   cp .env.example .env  (add OPENAI_API_KEY)
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

// ─── Configuration ────────────────────────────────────────
const IMAGE_MODEL = process.env.IMAGE_MODEL || "gpt-image-2"
const IMAGE_SIZE = process.env.IMAGE_SIZE || "1024x1024"
const IMAGE_QUALITY = process.env.IMAGE_QUALITY || "high"

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

// ─── Main generator ───────────────────────────────────────

async function generateImage({ creature, style, variant = 1, openai }) {
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
  console.log(`   Line:  ${creature.line}`)
  console.log(`   Style: ${style.styleName}`)
  console.log(`   Model: ${IMAGE_MODEL} @ ${IMAGE_SIZE}`)

  const result = await openai.images.generate({
    model: IMAGE_MODEL,
    prompt,
    size: IMAGE_SIZE,
    quality: IMAGE_QUALITY,
    n: 1,
    response_format: "b64_json",
  })

  const imageBase64 = result.data?.[0]?.b64_json
  if (!imageBase64) {
    throw new Error("No image returned from API. Check API key, model availability, or prompt safety filters.")
  }

  await fs.writeFile(imagePath, Buffer.from(imageBase64, "base64"))

  const metadata = {
    generationId,
    createdAt: new Date().toISOString(),
    model: IMAGE_MODEL,
    size: IMAGE_SIZE,
    quality: IMAGE_QUALITY,
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

  // Load OpenAI (lazy — only needed for actual generation)
  let OpenAI
  try {
    const mod = await import("openai")
    OpenAI = mod.default
  } catch {
    console.error("❌ Missing dependency: npm install openai dotenv")
    process.exit(1)
  }

  // Load .env
  try {
    const dotenv = await import("dotenv")
    dotenv.config()
  } catch {
    // dotenv is optional if env vars are set elsewhere
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY is not set. Add it to .env or your environment.")
    process.exit(1)
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const selectedId = process.argv[2]
  if (!selectedId) {
    console.error("Usage: node generate-ttg-art.mjs <creature-id> [variants]")
    console.error("       node generate-ttg-art.mjs --list")
    console.error("       node generate-ttg-art.mjs --line <name>")
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
  console.log(`   Model:    ${IMAGE_MODEL}`)
  console.log(`   Size:     ${IMAGE_SIZE}`)
  console.log(`   Quality:  ${IMAGE_QUALITY}`)

  const results = []
  for (let v = 1; v <= variants; v++) {
    try {
      const result = await generateImage({ creature, style, variant: v, openai })
      results.push(result)
      // Small delay between variants to avoid rate limits
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
