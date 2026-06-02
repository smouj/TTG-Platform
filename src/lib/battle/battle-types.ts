// ============================================================
// Trading Tazos Game — Battle Engine Types
// Core type definitions for the physical tazo battle system.
// ============================================================

// ---- Tazo States ----
export type TazoBattleState =
  | "in_hand"
  | "on_field"
  | "selected"
  | "thrown"
  | "flipped"
  | "captured"
  | "out_of_bounds"
  | "stacked"

// ---- Physics State ----
export interface TazoPhysicsState {
  x: number
  y: number
  z: number
  radius: number
  thickness: number
  rotation: number
  tilt: number
  velocityX: number
  velocityY: number
  velocityZ: number
  angularVelocity: number
  spinVelocity: number
  face: "front" | "back"
  isStacked: boolean
  stackLevel: number
}

// ---- Battle Stats ----
export interface TazoBattleStats {
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

// ---- Battle Phases ----
export type BattlePhase =
  | "setup"
  | "field_placement"
  | "turn_start"
  | "select_thrower"
  | "aim_horizontal"
  | "aim_vertical"
  | "charge_power"
  | "throwing"
  | "physics_simulation"
  | "impact_resolution"
  | "capture_resolution"
  | "opponent_place_penalty"
  | "turn_end"
  | "battle_finished"

// ---- Arena Config ----
export interface ArenaConfig {
  radius: number
  centerX: number
  centerY: number
  friction: number
  bounceFactor: number
  maxStackHeight: number
  outOfBoundsRule: "opponent_places" | "lost" | "return_to_hand"
}

// ---- Throw Input ----
export interface ThrowInput {
  tazoId: string
  aimX: number
  aimY: number
  horizontalAccuracy: number
  verticalAccuracy: number
  power: number
  releaseTiming: number
}

// ---- Throw Result ----
export interface ThrowResult {
  throwerId: string
  finalX: number
  finalY: number
  finalZ: number
  launchAngle: number
  launchSpeed: number
  spin: number
  accuracyError: number
  impactedTazos: string[]
  flippedTazos: string[]
  capturedTazos: string[]
  outOfBounds: boolean
  stackedOn?: string
  finalState: "on_field" | "out_of_bounds" | "captured"
}

// ---- Impact Outcome ----
export type ImpactOutcome =
  | "no_effect"
  | "push"
  | "heavy_push"
  | "flip"
  | "ring_out"
  | "chain_rebound"
  | "stack"

// ---- Collision Event ----
export interface CollisionEvent {
  sourceTazoId: string
  targetTazoId: string
  impactPoint: "center" | "edge" | "side"
  impactPower: number
  defensePower: number
  outcome: ImpactOutcome
  remainingEnergy: number
}

// ---- Battle Player ----
export interface BattlePlayer {
  id: "player" | "opponent"
  name: string
  hand: BattleFieldTazo[]
  field: BattleFieldTazo[]
  captured: BattleFieldTazo[]
}

// ---- Battle Field Tazo ----
export interface BattleFieldTazo {
  id: string
  name: string
  slug: string
  franchise: string
  imageUrl: string | null
  stats: TazoBattleStats
  state: TazoBattleState
  physics: TazoPhysicsState
  owner: "player" | "opponent"
}

// ---- Battle Turn ----
export interface BattleTurn {
  turnNumber: number
  playerId: "player" | "opponent"
  phase: BattlePhase
  selectedTazoId: string | null
  aimPhase: {
    horizontalAimValue: number
    horizontalAccuracy: number
    verticalAimValue: number
    verticalAccuracy: number
    powerValue: number
    powerAccuracyPenalty: number
  } | null
  throwInput: ThrowInput | null
  throwResult: ThrowResult | null
  collisionEvents: CollisionEvent[]
  capturedTazos: string[]
  fieldStateBefore: TazoPhysicsState[]
  fieldStateAfter: TazoPhysicsState[]
  description: string
}

// ---- Battle Replay ----
export interface BattleReplay {
  battleId: string
  seed: string
  players: BattlePlayer[]
  turns: BattleTurn[]
  finalResult: BattleFinalResult
}

// ---- Battle Final Result ----
export interface BattleFinalResult {
  winner: "player" | "opponent" | "draw"
  victoryType: "all_captured" | "points" | "rounds" | "surrender"
  playerScore: number
  opponentScore: number
  totalTurns: number
  playerCaptures: number
  opponentCaptures: number
  summary: string
}

// ---- Game Mode ----
export type GameMode = "classic" | "rounds" | "competitive" | "arena"

export interface GameModeConfig {
  mode: GameMode
  maxRounds?: number
  pointsPerCapture?: number
  pointsPerFlip?: number
  maxTazosPerPlayer: number
}

// ---- Defaults ----
export const DEFAULT_ARENA: ArenaConfig = {
  radius: 280,
  centerX: 300,
  centerY: 300,
  friction: 0.92,
  bounceFactor: 0.45,
  maxStackHeight: 3,
  outOfBoundsRule: "opponent_places",
}

export const DEFAULT_GAME_MODE: GameModeConfig = {
  mode: "classic",
  maxTazosPerPlayer: 5,
  pointsPerCapture: 1,
  pointsPerFlip: 1,
}

// ---- Stats derived from existing Tazo schema ----
export function deriveBattleStats(tazo: {
  attack: number
  defense: number
  spin: number
  weight: number
  aura: number
  control: number
}): TazoBattleStats {
  return {
    attack: tazo.attack,
    defense: tazo.defense,
    resistance: Math.round((tazo.defense * 0.7 + tazo.weight * 0.3)),
    weight: tazo.weight,
    stability: Math.round((tazo.defense * 0.5 + tazo.weight * 0.3 + tazo.control * 0.2)),
    spin: tazo.spin,
    control: tazo.control,
    bounce: Math.round((tazo.spin * 0.6 + tazo.aura * 0.4)),
    precision: Math.round((tazo.control * 0.7 + tazo.aura * 0.3)),
  }
}

// ---- Combat role derived from stats ----
export type TazoRole = "attacker" | "tank" | "technical" | "rebounder" | "heavy" | "light" | "holographic" | "legendary"

export function deriveTazoRole(stats: TazoBattleStats): TazoRole {
  if (stats.attack >= 80 && stats.defense >= 80) return "legendary"
  if (stats.attack >= 75) return "attacker"
  if (stats.defense >= 75 && stats.resistance >= 70) return "tank"
  if (stats.bounce >= 70 && stats.spin >= 65) return "rebounder"
  if (stats.weight >= 70) return "heavy"
  if (stats.precision >= 70 && stats.control >= 70) return "technical"
  if (stats.weight <= 35) return "light"
  return "technical"
}

export const ROLE_LABELS: Record<TazoRole, string> = {
  attacker: "Attacker",
  tank: "Tank",
  technical: "Technical",
  rebounder: "Rebounder",
  heavy: "Heavy",
  light: "Light",
  holographic: "Holographic",
  legendary: "Legendary",
}
