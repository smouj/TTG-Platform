// ============================================================
// Trading Tazos Game — Battle Module Barrel
//
// Single entry point for all battle imports.
// Consumer code should import from "@/lib/battle".
// ============================================================

// ── Rules (single source of truth) ──
export {
  DECK_SIZE, STARTING_HAND, DRAW_PER_TURN,
  SCORE_TO_WIN, MIN_HAND_SIZE,
  FLIP_POINTS, RING_OUT_PENALTY, SECURE_BONUS,
  isValidDeckSize, isValidStartingHand, hasWonByScore,
} from "./rules"

// ── RNG (deterministic random for replays) ──
export { createRNG, getGlobalRNG, resetGlobalRNG, type RNG } from "./rng"

// ── Replay ──
export { ReplayRecorder, deserializeReplay, replayFrames } from "./replay"
export type { ReplayData, ReplayFrame } from "./replay"

// ── FSM (finite state machine — 20 phases) ──
export {
  createBattleContext, applyTransition,
  BATTLE_TRANSITIONS, autoSelectOpponentBet,
  applyScoring, buildMatchResult,
  type BattleContext, type BattleEvent,
} from "./state-machine"

// ── Game loop (types, match, physics, scoring) ──
export {
  createMatch, simulateSlam, createAirborneTazo,
  scoreBettingImpact, checkMatchEnd, generateAISlam,
  placeStakedTazos, coinFlip, drawOne, drawHand,
  DEFAULT_ARENA_3D, LAVA_PIT_ARENA, CRYSTAL_CAVE_ARENA, ZERO_G_ARENA, ARENA_PRESETS,
} from "./game-loop"
export type {
  TazoCard, MatchConfig, MatchResult, StakedTazo,
  AirborneTazo, SlamParams, ImpactResult, RoundResult,
  GameState, PlayMode, AIDifficulty, Arena3DConfig,
} from "./game-loop"

// ── AI Player ──
export { getAITiming, selectAIBet, selectAILauncher, generateAISlamParams, simulateAISlam } from "./ai-player"
export type { AITiming } from "./ai-player"

// ── React Engine Hook ──
export { useBattleEngine } from "./use-battle-engine"

// ── Rapier Physics (experimental) ──
export {
  initRapierPhysics, isRapierAvailable, simulateSlamRapier,
  DEFAULT_RAPIER_CONFIG, type RapierPhysicsConfig,
} from "./physics-rapier"

// ── Legacy types (used by battle-scoring) ──
export type {
  BattleFinalResult, BattleScore, BattleTurn,
  BattleReplay,
} from "./battle-types"

// ── Legacy modules (deprecated, kept for reference) ──
// battle-rules.ts → archived as .bak (dead code)
// battle-engine.ts → archived as .bak (dead code)
