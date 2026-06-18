// ============================================================
// Trading Tazos Game — Wear/Damage System
//
// Tazos degrade with use. Each battle = +wear. Higher wear =
// visible damage pattern + stat penalties + value reduction.
// ============================================================

/** Wear level 0-100 */
export type WearLevel = number

/** Visible damage tier based on wear */
export type WearTier = "mint" | "light_play" | "played" | "heavy_play" | "damaged"

/** Map wear level to visual damage tier */
export function getWearTier(wear: WearLevel): WearTier {
  if (wear <= 0) return "mint"
  if (wear <= 15) return "light_play"
  if (wear <= 40) return "played"
  if (wear <= 70) return "heavy_play"
  return "damaged"
}

/** Wear tier display labels */
export const WEAR_TIER_LABELS: Record<WearTier, string> = {
  mint: "Mint",
  light_play: "Lightly Played",
  played: "Played",
  heavy_play: "Heavily Played",
  damaged: "Damaged",
}

/** Wear tier colors (for badges) */
export const WEAR_TIER_COLORS: Record<WearTier, { bg: string; text: string; border: string }> = {
  mint:        { bg: "#22C55E15", text: "var(--ttg-success)", border: "#22C55E40" },
  light_play:  { bg: "#FFCC0015", text: "#CCAA00", border: "#FFCC0040" },
  played:      { bg: "#FF880015", text: "#FF8800", border: "#FF880040" },
  heavy_play:  { bg: "#FF440015", text: "#FF4400", border: "#FF440040" },
  damaged:     { bg: "#CC000015", text: "#CC0000", border: "#CC000040" },
}

/**
 * Stat penalty per wear tier (cumulative).
 * Mint: 0% penalty. Damaged: up to 25% penalty on key stats.
 */
export function getWearStatPenalty(wear: WearLevel): {
  attack: number; defense: number; resistance: number; stability: number; precision: number; control: number;
} {
  const tier = getWearTier(wear)
  const T = {
    mint: { attack: 0, defense: 0, resistance: 0, stability: 0, precision: 0, control: 0 },
    light_play: { attack: 0.02, defense: 0.02, resistance: 0.02, stability: 0.01, precision: 0, control: 0.01 },
    played: { attack: 0.05, defense: 0.05, resistance: 0.04, stability: 0.03, precision: 0.02, control: 0.02 },
    heavy_play: { attack: 0.12, defense: 0.10, resistance: 0.08, stability: 0.06, precision: 0.05, control: 0.05 },
    damaged: { attack: 0.20, defense: 0.18, resistance: 0.15, stability: 0.12, precision: 0.10, control: 0.08 },
  }
  return T[tier]
}

/**
 * How much wear a tazo gains from one battle.
 * Victor's tazos take less wear (they won gracefully).
 * Loser's tazos take more (they got slammed).
 */
export function calculateWearGain(existingWear: WearLevel, won: boolean): number {
  const base = won ? 1 + Math.random() * 2 : 2 + Math.random() * 3
  // Already damaged tazos degrade faster (cumulative damage)
  const multiplier = 1 + (existingWear / 100) * 0.5
  return Math.round(base * multiplier)
}
