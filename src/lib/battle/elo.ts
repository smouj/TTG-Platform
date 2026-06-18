// ============================================================
// Elo / MMR Rating System for TTG PvP
// ============================================================

export interface EloMatch {
  playerRating: number
  opponentRating: number
  playerScore: number
  opponentScore: number
}

const DEFAULT_ELO = 1000
const K_FACTOR = 32

/**
 * Calculate Elo change for a match.
 * Returns positive if player gained, negative if player lost.
 */
export function calcEloChange(match: EloMatch): number {
  const expected =
    1 / (1 + Math.pow(10, (match.opponentRating - match.playerRating) / 400))
  const actual = match.playerScore > match.opponentScore
    ? 1
    : match.playerScore < match.opponentScore
    ? 0
    : 0.5
  const delta = Math.round(K_FACTOR * (actual - expected))

  // Bonus for score margin (max ±5 extra)
  const margin = Math.abs(match.playerScore - match.opponentScore) - 1
  const marginBonus = Math.min(5, Math.max(0, margin)) * (actual > 0.5 ? 1 : -1)

  return delta + marginBonus
}

export function getInitialElo(): number {
  return DEFAULT_ELO
}

/**
 * Tier system for visual rank display.
 */
export type RankTier =
  | "bronze" | "silver" | "gold" | "platinum"
  | "diamond" | "master" | "grandmaster"

export interface RankInfo {
  tier: RankTier
  label: string
  emoji: string
  color: string
  minElo: number
}

const RANK_TIERS: RankInfo[] = [
  { tier: "bronze",      label: "Bronze",       emoji: "🥉", color: "#CD7F32", minElo: 0 },
  { tier: "silver",      label: "Silver",       emoji: "🥈", color: "#C0C0C0", minElo: 1100 },
  { tier: "gold",        label: "Gold",         emoji: "🥇", color: "var(--ttg-yellow)", minElo: 1300 },
  { tier: "platinum",    label: "Platinum",     emoji: "💎", color: "#E5E4E2", minElo: 1500 },
  { tier: "diamond",     label: "Diamond",      emoji: "💠", color: "#29ADFF", minElo: 1700 },
  { tier: "master",      label: "Master",       emoji: "👑", color: "#A855F7", minElo: 1900 },
  { tier: "grandmaster", label: "Grandmaster",  emoji: "🌟", color: "#FF004D", minElo: 2100 },
]

export function getRank(elo: number): RankInfo {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (elo >= RANK_TIERS[i].minElo) return RANK_TIERS[i]
  }
  return RANK_TIERS[0]
}

export function formatEloChange(delta: number): string {
  if (delta > 0) return `+${delta}`
  return `${delta}`
}
