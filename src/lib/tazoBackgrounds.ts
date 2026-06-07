// ============================================================
// Trading Tazos Game — Modular Background System
// ============================================================
// Layers: Collection → Element → Evolution → Rarity → Power Grade → Category
// CSS-first generative backgrounds. PNG/WebP reserved for premium cards.
// ============================================================

import { Tazo, Rarity } from "@/lib/game/types"

// --------------- Types ---------------
export type Collection = "minimon" | "cybermon" | "dracobell"

export type TazoElement =
  | "fire" | "water" | "plant" | "electric"
  | "digital" | "fighter" | "dragon"
  | "shadow" | "light" | "metal" | "normal"

export type EvolutionStage = 0 | 1 | 2 | 3

export type PowerGrade = "D" | "C" | "B" | "A" | "S" | "SS"

export type TazoCategory =
  | "tazo" | "megatazo" | "supertazo" | "mastertazo"
  | "holo3d" | "gold"

export interface TazoBackgroundConfig {
  collection: Collection
  element: TazoElement
  evolutionStage: EvolutionStage
  rarity: Rarity
  powerGrade: PowerGrade
  category: TazoCategory
  powerScore: number  // raw 0-100
}

// --------------- Element Inference ---------------
// Infer element from tazo displayName or number patterns
const ELEMENT_KEYWORDS: Record<TazoElement, string[]> = {
  fire:      ["flame", "fire", "blaze", "ember", "inferno", "scorch", "burn", "magma", "lava", "heat", "pyro", "volcano", "sun"],
  water:     ["water", "aqua", "wave", "tide", "ocean", "sea", "bubble", "splash", "rain", "river", "marine", "coral", "droplet", "stream"],
  plant:     ["plant", "leaf", "vine", "thorn", "bloom", "seed", "petal", "wood", "forest", "moss", "root", "sprout", "flower", "orchard"],
  electric:  ["volt", "spark", "thunder", "bolt", "zap", "storm", "shock", "charge", "lightning", "surge", "buzz", "static"],
  digital:   ["digital", "cyber", "data", "byte", "code", "circuit", "glitch", "pixel", "matrix", "neural", "virus", "server", "hack", "proxy", "binary"],
  fighter:   ["fight", "warrior", "kendo", "blade", "strike", "kick", "punch", "guard", "armor", "sword", "shield", "battle", "combat", "champion"],
  dragon:    ["dragon", "drake", "wyrm", "serpent", "scale", "fang", "wing", "roar", "draco", "tail", "claw", "breath"],
  shadow:    ["shadow", "dark", "void", "night", "shade", "phantom", "specter", "ghost", "abyss", "eclipse", "twilight", "gloom"],
  light:     ["light", "shine", "radiant", "glow", "ray", "beam", "star", "nova", "prism", "solar", "flash", "luminous", "aurora"],
  metal:     ["metal", "steel", "iron", "chrome", "titanium", "alloy", "gear", "mech", "robot", "tank", "cannon", "blade", "sword", "armor", "shield"],
  normal:    [],
}

export function inferElement(tazo: Tazo): TazoElement {
  const name = (tazo.displayName || tazo.name || "").toLowerCase()
  const franchise = tazo.franchise || tazo.franchiseSlug || ""

  // Check keywords (longest match first to avoid partial matches)
  const matches: { element: TazoElement; len: number }[] = []
  for (const [element, keywords] of Object.entries(ELEMENT_KEYWORDS)) {
    for (const kw of keywords) {
      if (name.includes(kw)) {
        matches.push({ element: element as TazoElement, len: kw.length })
        break // one match per element is enough
      }
    }
  }

  if (matches.length > 0) {
    matches.sort((a, b) => b.len - a.len)
    return matches[0].element
  }

  // Franchise-based default
  if (franchise === "cybermon") return "digital"
  if (franchise === "dracobell") return "fighter"
  return "normal"
}

// --------------- Evolution Stage Inference ---------------
// Inferred from sequential numbering within franchise
export function inferEvolutionStage(tazo: Tazo, maxInFranchise?: number): EvolutionStage {
  const number = parseInt(String(tazo.number || "1"), 10) || 1
  const max = maxInFranchise || 150
  const ratio = number / max

  if (ratio <= 0.25) return 0        // early numbers = base
  if (ratio <= 0.50) return 1        // mid-early = stage 1
  if (ratio <= 0.80) return 2        // late = stage 2
  return 3                             // end of franchise = final
}

// --------------- Power Grade Calculus ---------------
export function calcPowerScore(tazo: Tazo): number {
  const { attack = 50, defense = 50, resistance = 50, weight = 50, spin = 50, control = 50, bounce = 50, precision = 50 } = tazo
  const raw =
    attack    * 1.2 +
    defense   * 1.0 +
    resistance * 0.9 +
    weight    * 0.7 +
    spin      * 0.8 +
    control   * 0.9 +
    bounce    * 0.6 +
    precision * 0.9
  // Normalize: theoretical max ~600, min ~0
  return Math.min(100, Math.max(0, Math.round(raw / 6)))
}

export function calcPowerGrade(score: number): PowerGrade {
  if (score >= 96) return "SS"
  if (score >= 81) return "S"
  if (score >= 61) return "A"
  if (score >= 41) return "B"
  if (score >= 21) return "C"
  return "D"
}

// --------------- Category Inference ---------------
export function inferCategory(tazo: Tazo): TazoCategory {
  const condition = tazo.condition as string
  if (condition === "holo") return "holo3d"
  if (condition === "metallic") return "gold"

  const rarity = tazo.rarity as Rarity
  if (rarity === "legendary") return "mastertazo"
  if (rarity === "ultra") return "supertazo"

  // Check franchise-specific category markers
  const name = (tazo.displayName || tazo.name || "").toLowerCase()
  if (name.includes("mega") || name.includes("super")) return "megatazo"

  return "tazo"
}

// --------------- Main Config Builder ---------------
export function getTazoBackgroundConfig(tazo: Tazo, maxInFranchise?: number): TazoBackgroundConfig {
  const powerScore = calcPowerScore(tazo)
  const collection = (tazo.franchise || tazo.franchiseSlug || "minimon") as Collection

  return {
    collection,
    element: inferElement(tazo),
    evolutionStage: inferEvolutionStage(tazo, maxInFranchise),
    rarity: (tazo.rarity || "common") as Rarity,
    powerGrade: calcPowerGrade(powerScore),
    category: inferCategory(tazo),
    powerScore,
  }
}

// --------------- CSS Class Builder ---------------
export function getTazoBackgroundClasses(config: TazoBackgroundConfig): string {
  const parts: string[] = []

  // Collection base
  parts.push(`ttg-bg-${config.collection}`)

  // Element motif
  parts.push(`ttg-bg-element-${config.element}`)

  // Rarity modifier
  parts.push(`ttg-bg-rarity-${config.rarity}`)

  // Evolution intensity
  parts.push(`ttg-bg-evo-${config.evolutionStage}`)

  // Power grade accent
  parts.push(`ttg-bg-power-${config.powerGrade}`)

  // Category frame
  parts.push(`ttg-bg-cat-${config.category}`)

  return parts.join(" ")
}

// --------------- Franchise Max Counts ---------------
export const FRANCHISE_MAX: Record<string, number> = {
  minimon: 51,
  cybermon: 150,
  dracobell: 118,
}
