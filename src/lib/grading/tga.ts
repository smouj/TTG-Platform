/**
 * TGA — Tazo Grading Association
 * Grading engine that assigns conditions to each tazo instance.
 *
 * Distribution model (inspired by PSA/SGC with Tazo-specific adjustments):
 *   - 100.0   = ~0.05%   (mythic perfect — needs celebrity-grade luck)
 *   - 95-99.9 = ~1.2%    (pristine from pack to sleeve)
 *   - 85-94.9 = ~12%     (excellent — straight from bag to collector)
 *   - 55-84.9 = ~40%     (collector-grade — played a few rounds)
 *   - 20-54.9 = ~35%     (battle-worn — schoolyard classic)
 *   -  0-19.9 = ~12%     (destroyed — chewed, bent, sun-faded)
 *
 * Rarity bonuses: rarer tazos tend toward higher grades
 *   because they're assumed to have been better cared for.
 */

/** Tier assigned by the tazo's intrinsic characteristics */
export type TGATier = 1 | 2 | 3 | 4

export interface TGAGrade {
  tier: TGATier
  grade: number       // 0.1 – 100.0
  surface: number     // 0.1 – 100.0
  borders: number     // 0.1 – 100.0
  certNumber: string
}

export interface TGADisplay {
  tier: TGATier
  tierLabel: string
  grade: number
  surface: number
  borders: number
  certNumber: string
  rangeLabel: string
  rangeColor: string   // hex
  rangeEmoji: string
}

const TIER_LABELS: Record<TGATier, string> = {
  1: "Standard",
  2: "Specialty",
  3: "Premium",
  4: "Heritage & Grails",
}

const TIER_SHORT: Record<TGATier, string> = {
  1: "STD",
  2: "SPC",
  3: "PRM",
  4: "GRL",
}

// Cert counter — global incrementing
let _certCounter = 9900000 + Math.floor(Math.random() * 99999)

function nextCertNumber(): string {
  return String(++_certCounter)
}

/**
 * Gaussian-ish random using Box-Muller
 */
function gaussRandom(mean: number, stddev: number): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return mean + z * stddev
}

/**
 * Weighted distribution curve for TGA grades.
 * Returns a clamped 0.1-100.0 value.
 *
 * The mean shifts right for higher tiers (rarer tazos preserved better).
 */
function rollGrade(tier: TGATier): number {
  // Means shift up per tier
  const tierMeanShift = [0, 5, 10, 15] as const
  const mean = 58 + tierMeanShift[tier - 1]
  const stddev = 22

  let raw = gaussRandom(mean, stddev)

  // 100.0 perfect rolls: independent check (~0.05%)
  // Re-roll if within perfect-range and lucky enough
  if (Math.random() < 0.0005 + tier * 0.0003) {
    raw = 100.0
  }

  // Clamp and round to 1 decimal
  raw = Math.max(0.1, Math.min(100.0, raw))
  return Math.round(raw * 10) / 10
}

/**
 * Sub-grades (surface & borders) are correlated with the overall grade
 * but with independent noise (±3 points stddev).
 */
function rollSubGrade(baseGrade: number): number {
  const noise = gaussRandom(0, 3)
  let sub = baseGrade + noise
  sub = Math.max(0.1, Math.min(100.0, sub))
  return Math.round(sub * 10) / 10
}

/**
 * Determine tier from tazo rarity + attributes.
 *
 * Tier 1 (Standard):    common/uncommon plastic tazos
 * Tier 2 (Specialty):   rare with effects (holo, foil, prismatic)
 * Tier 3 (Premium):     epic/legendary + heavier craft
 * Tier 4 (Grail):       mythic, promotional, limited edition
 */
function determineTier(rarity: string, finish: string): TGATier {
  const r = (rarity || "").toLowerCase()
  const f = (finish || "").toLowerCase()

  // Tier 4: mythic, legendary + prismatic/shiny
  if (r === "mythic" || r === "mythical") return 4
  if (r === "legendary" && (f.includes("prismatic") || f.includes("shiny"))) return 4

  // Tier 3: epic, legendary without special finish
  if (r === "legendary" || r === "epic") return 3

  // Tier 2: rare, or uncommon with special finish
  if (r === "rare") return 2
  if (r === "uncommon" && (f.includes("foil") || f.includes("holo") || f.includes("prismatic") || f.includes("shiny"))) return 2

  // Tier 1: common + base uncommon
  return 1
}

/**
 * Main entry: generate a full TGA grade for a tazo instance.
 */
export function generateTGAGrade(rarity: string, finish: string): TGAGrade {
  const tier = determineTier(rarity, finish)
  const grade = rollGrade(tier)
  const surface = rollSubGrade(grade)
  const borders = rollSubGrade(grade)
  const certNumber = nextCertNumber()

  return { tier, grade, surface, borders, certNumber }
}

/**
 * Get display-ready info for a TGA grade.
 */
export function getTGADisplay(grade: TGAGrade | null | undefined): TGADisplay | null {
  if (!grade || grade.grade == null) return null

  const { tier, grade: g, surface, borders, certNumber } = grade

  let rangeLabel: string
  let rangeColor: string
  let rangeEmoji: string

  if (g >= 100) {
    rangeLabel = "PERFECT"
    rangeColor = "#B8860B"
    rangeEmoji = "💎"
  } else if (g >= 95) {
    rangeLabel = "GEM MINT"
    rangeColor = "#0096FF"
    rangeEmoji = "💠"
  } else if (g >= 85) {
    rangeLabel = "MINT"
    rangeColor = "var(--ttg-success)"
    rangeEmoji = "✨"
  } else if (g >= 70) {
    rangeLabel = "EXCELLENT"
    rangeColor = "#10B981"
    rangeEmoji = "⭐"
  } else if (g >= 55) {
    rangeLabel = "VERY GOOD"
    rangeColor = "#84CC16"
    rangeEmoji = "📦"
  } else if (g >= 40) {
    rangeLabel = "GOOD"
    rangeColor = "#EAB308"
    rangeEmoji = "🟡"
  } else if (g >= 20) {
    rangeLabel = "PLAYED"
    rangeColor = "#F97316"
    rangeEmoji = "⚡"
  } else {
    rangeLabel = "DAMAGED"
    rangeColor = "var(--ttg-red)"
    rangeEmoji = "💀"
  }

  return {
    tier,
    tierLabel: TIER_LABELS[tier] ?? `Tier ${tier}`,
    grade: g,
    surface,
    borders,
    certNumber,
    rangeLabel,
    rangeColor,
    rangeEmoji,
  }
}

/**
 * Compact badge: "TGA 85.2 💎" — for cards / list views.
 */
export function getTGABadgeText(display: TGADisplay | null): string | null {
  if (!display) return null
  return `TGA ${display.grade.toFixed(1)}`
}

/**
 * Tier short code.
 */
export function getTierShort(tier: TGATier): string {
  return TIER_SHORT[tier] ?? "???"
}

export { TIER_LABELS }
