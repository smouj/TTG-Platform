#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

const root = process.cwd()
const banned = [
  "saiyan",
  "namekian",
  "frieza",
  "majin",
  "dragon ball",
  "dragonball",
  "pokemon",
  "pikachu",
  "charizard",
  "digimon",
  "agumon",
  "naruto",
  "one piece",
  "yugioh",
]

const scanRoots = ["src", "public", "scripts", "prisma"]
const skipDirs = new Set(["node_modules", ".next", ".git", "dist", "dist-electron", "archive"])
const skipFiles = new Set([path.join("scripts", "check-canon-guard.js")])
const textExtensions = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".json", ".md", ".txt", ".mjs", ".cjs",
  ".py", ".prisma", ".html", ".css",
])

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    const rel = path.relative(root, full)
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) walk(full, files)
      continue
    }
    if (skipFiles.has(rel)) continue
    if (textExtensions.has(path.extname(entry.name))) files.push(full)
  }
  return files
}

const findings = []
for (const rootName of scanRoots) {
  for (const file of walk(path.join(root, rootName))) {
    const rel = path.relative(root, file)
    const text = fs.readFileSync(file, "utf8").toLowerCase()
    for (const term of banned) {
      if (text.includes(term)) findings.push(`${rel}: contains "${term}"`)
    }
  }
}

if (findings.length) {
  console.error("Canon guard failed. Remove risky third-party franchise terms from active code/data:")
  for (const finding of findings.slice(0, 80)) console.error(`- ${finding}`)
  if (findings.length > 80) console.error(`...and ${findings.length - 80} more`)
  process.exit(1)
}

console.log("Canon guard passed")
