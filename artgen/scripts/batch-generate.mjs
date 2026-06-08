#!/usr/bin/env node
// Batch generate all TTG creature artwork via xAI
// Reads OAuth token from auth-profiles.json

import { spawn } from "node:child_process"
import { readFileSync, existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ARTGEN_DIR = path.resolve(__dirname, "..")

const RARITY_ORDER = ["legendary", "ultra", "epic", "rare", "uncommon", "common"]

function getToken() {
  const profilesPath = path.resolve(
    process.env.HOME,
    ".openclaw/agents/main/agent/auth-profiles.json"
  )
  const d = JSON.parse(readFileSync(profilesPath, "utf8"))
  return d.profiles["xai:smouj013hs@gmail.com"].access
}

function getCreatures() {
  return JSON.parse(readFileSync(path.join(ARTGEN_DIR, "creatures.json"), "utf8")).creatures
}

function getCreatureOutputBase(c) {
  return path.join(
    ARTGEN_DIR, "output", c.line,
    `${c.id}-${c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`
  )
}

function hasOutput(c) {
  return existsSync(path.join(getCreatureOutputBase(c), `${c.id}-v01.png`))
}

async function generateCreature(creature, token) {
  return new Promise((resolve, reject) => {
    // Clean env: only pass what's needed, strip competing API keys
    const childEnv = {
      HOME: process.env.HOME,
      PATH: process.env.PATH,
      XAI_API_KEY: token,
      PROVIDER: "xai",
      // Pass through non-API-key vars only
      LANG: process.env.LANG,
      USER: process.env.USER,
    }
    
    const child = spawn("node", [
      path.join(__dirname, "generate-ttg-art.mjs"),
      creature.id,
      "1",
    ], {
      cwd: path.resolve(ARTGEN_DIR, ".."),
      env: childEnv,
      stdio: "pipe",
    })

    let stdout = ""
    child.stdout.on("data", (d) => { stdout += d.toString(); process.stdout.write(d) })
    child.stderr.on("data", (d) => { process.stderr.write(d) })

    child.on("close", (code) => {
      if (code === 0) resolve(stdout)
      else reject(new Error(`Exit ${code}: ${stdout.slice(-200)}`))
    })
    child.on("error", reject)
  })
}

async function main() {
  const token = getToken()
  console.log("🔑 Token loaded, forcing xAI backend")

  const creatures = getCreatures()
  creatures.sort((a, b) => {
    const ra = RARITY_ORDER.indexOf(a.rarity)
    const rb = RARITY_ORDER.indexOf(b.rarity)
    return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb)
  })

  const pending = creatures.filter((c) => !hasOutput(c))
  const done = creatures.filter((c) => hasOutput(c))

  console.log(`\n📊 Done: ${done.length} | Pending: ${pending.length}`)
  console.log(`   Done: ${done.map(c => c.id).join(", ") || "none"}\n`)

  if (pending.length === 0) {
    console.log("✨ All creatures already generated!")
    return
  }

  let success = 0
  let failed = 0

  for (let i = 0; i < pending.length; i++) {
    const c = pending[i]
    console.log(`\n🎯 [${i + 1}/${pending.length}] ${c.id} (${c.rarity} — ${c.line}) ${c.name}`)
    
    try {
      await generateCreature(c, token)
      success++
    } catch (err) {
      console.error(`❌ Failed: ${err.message}`)
      failed++
    }

    if (i < pending.length - 1) {
      console.log("   ⏳ Waiting 3s...")
      await new Promise((r) => setTimeout(r, 3000))
    }
  }

  console.log(`\n✨ Batch complete! ${success} generated, ${failed} failed.`)
}

main().catch((err) => {
  console.error("Fatal:", err.message)
  process.exit(1)
})
