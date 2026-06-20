// ============================================================
// game-core/types.ts — Pure game types
//
// No React, Next.js, DOM, or UI dependencies.
// Shareable between: client, server, tests, CLI, simulator.
// ============================================================

// ── Tazo ──
export interface TazoStats {
  attack: number
  defense: number
  resistance: number
  weight: number
  stability: number
  spin: number
  control: number
  bounce: number
  precision: number
}

export interface TazoRef {
  id: string
  name: string
  franchiseSlug: string
  imageUrl?: string
  stats: TazoStats
}

// ── Staked Tazo (on arena floor) ──
export interface StakedTazo {
  id: string           // unique instance key ("player-xxx" or "opponent-xxx")
  tazoRef: TazoRef
  owner: "player" | "opponent"
  position: { x: number; z: number }
  rotation: number
  flipped: boolean
  wobbling: boolean
  wobbleIntensity: number
}

// ── Deck & Hand ──
export const DECK_SIZE = 20
export const STARTING_HAND_SIZE = 5
export const DRAW_PER_TURN = 1

// ── Arena ──
export interface Arena3DConfig {
  width: number
  depth: number
  wallHeight: number
  gravity: number
  floorFriction: number
  name: string
  description: string
  theme: ArenaTheme
}

export type ArenaTheme = "default" | "lava" | "crystal" | "zero-g"

export const ARENA_THEMES: ArenaTheme[] = ["default", "lava", "crystal", "zero-g"]

// ── Battle Phases ──
export type BattlePhase =
  | "loading"
  | "lobby"
  | "deck_select"
  | "match_intro"
  | "round_intro"
  | "stake_player"
  | "stake_reveal"
  | "aim"
  | "charge"
  | "throw"
  | "physics"
  | "stake_result"
  | "draw"
  | "turn_end"
  | "round_end"
  | "match_end"

// ── Impact Result ──
export interface ImpactResult {
  winner: "player" | "opponent" | "draw"
  victoryType: VictoryType
  playerScore: number
  opponentScore: number
  totalTurns: number
  playerCaptures: number
  opponentCaptures: number
  summary: string
}

export type VictoryType =
  | "elimination"     // all opponent tazos captured
  | "points"          // higher score at round limit
  | "forfeit"
  | "timeout"

// ── Slam Result ──
export interface SlamResult {
  staked: StakedTazo[]
  result: ImpactResult
}

// ── AI Difficulty ──
export type AIDifficulty = "novice" | "skilled" | "master"

// ── Battle Mode ──
export type BattleMode = "practice" | "ai" | "pvp_casual" | "pvp_ranked"

// ── Battle Configuration ──
export interface BattleConfig {
  mode: BattleMode
  aiDifficulty?: AIDifficulty
  playerDeck: TazoRef[]
  opponentDeck: TazoRef[]
  arena: Arena3DConfig
  maxRounds: number
}
