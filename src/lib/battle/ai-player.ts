// ============================================================
// Trading Tazos Game — AI Player v2
//
// Human-like timing per phase (spec ranges):
//   think:  600-1200ms
//   aim:    800-1400ms
//   charge: 700-1200ms
//   total:  2100-3800ms
//
// Timing varies by difficulty:
//   novice:  slower, less accurate
//   skilled: moderate
//   master:  fast, precise
// ============================================================

import type {
  TazoCard, AIDifficulty, SlamParams,
  StakedTazo, Arena3DConfig, ImpactResult,
} from "./game-loop"
import {
  generateAISlam, simulateSlam, scoreBettingImpact, DEFAULT_ARENA_3D,
} from "./game-loop"
import { autoSelectOpponentBet } from "./state-machine"
import type { BattleContext } from "./state-machine"

// ────────────────────────────────────────
// AI Timing by Difficulty
// ────────────────────────────────────────

export interface AITiming {
  think: number      // Stake/bet selection delay
  select: number     // Tazo selection delay
  aim: number        // Aiming delay
  charge: number     // Charging delay
}

const TIMING_BY_DIFFICULTY: Record<AIDifficulty, AITiming> = {
  novice:     { think: 1000, select: 800,  aim: 1200, charge: 1000 },
  skilled:    { think: 700,  select: 500,  aim: 900,  charge: 800 },
  master:     { think: 400,  select: 300,  aim: 600,  charge: 500 },
}

export function getAITiming(difficulty: AIDifficulty): AITiming {
  const base = TIMING_BY_DIFFICULTY[difficulty]
  // Add ±30% variance for human feel
  const vary = () => 0.7 + Math.random() * 0.6 // 0.7-1.3
  return {
    think:  Math.round(base.think  * vary()),
    select: Math.round(base.select * vary()),
    aim:    Math.round(base.aim    * vary()),
    charge: Math.round(base.charge * vary()),
  }
}

// ────────────────────────────────────────
// AI Bet Selection
// ────────────────────────────────────────

export function selectAIBet(ctx: BattleContext): TazoCard | null {
  const hand = ctx.opponentHand
  if (hand.length === 0) return null
  const scoreGap = ctx.opponent.score - ctx.player.score
  const strategy = getStrategy(ctx.config.aiDifficulty, scoreGap)

  // Strategy-based stake selection
  if (strategy === "aggressive") {
    // Stake a high-defense tazo — it'll survive being slammed
    return [...hand].sort((a, b) => (b.defense + b.stability) - (a.defense + a.stability))[0]
  }
  if (strategy === "defensive") {
    // Stake highest defense — turtle up
    return [...hand].sort((a, b) => (b.defense + b.resistance) - (a.defense + a.resistance))[0]
  }
  // Balanced/chaotic: traditional selection
  return autoSelectOpponentBet(ctx)
}

// ────────────────────────────────────────
// AI Launcher Selection (for slam)
// ────────────────────────────────────────

// ────────────────────────────────────────
// AI Strategy Profiles — personality-based decision making
// ────────────────────────────────────────

type AIStrategy = "aggressive" | "balanced" | "defensive" | "chaotic"

function getStrategy(diff: AIDifficulty, scoreGap: number): AIStrategy {
  // Master: adapts strategy based on game state
  if (diff === "master") {
    if (scoreGap <= -2) return "defensive"   // Losing → protect staked tazo
    if (scoreGap >= 2) return "aggressive"    // Winning → press advantage
    return "balanced"                          // Even → calculated plays
  }
  // Skilled: mostly balanced, sometimes aggressive
  if (diff === "skilled") {
    return Math.random() < 0.25 ? "aggressive" : "balanced"
  }
  // Novice: random / chaotic
  return Math.random() < 0.4 ? "chaotic" : "defensive"
}

export function selectAILauncher(ctx: BattleContext): TazoCard | null {
  const hand = ctx.opponentHand
  if (hand.length === 0) return null

  const betId = ctx.opponentBetTazo?.id
  const available = hand.filter(t => t.id !== betId)
  if (available.length === 0) return hand[0] || null

  const scoreGap = ctx.opponent.score - ctx.player.score
  const strategy = getStrategy(ctx.config.aiDifficulty, scoreGap)

  switch (strategy) {
    case "aggressive":
      // Go for max flip power — highest attack + weight
      return [...available].sort((a, b) =>
        (b.attack * 0.7 + b.weight * 0.3) - (a.attack * 0.7 + a.weight * 0.3)
      )[0]
    case "defensive":
      // Pick high precision to avoid ring-outs, protect own tazo
      return [...available].sort((a, b) =>
        (b.precision * 0.5 + b.control * 0.3 + b.stability * 0.2) -
        (a.precision * 0.5 + a.control * 0.3 + a.stability * 0.2)
      )[0]
    case "balanced":
      // Good all-rounder — attack + precision balance
      return [...available].sort((a, b) =>
        (b.attack * 0.4 + b.precision * 0.3 + b.spin * 0.2 + b.control * 0.1) -
        (a.attack * 0.4 + a.precision * 0.3 + a.spin * 0.2 + a.control * 0.1)
      )[0]
    case "chaotic":
      // Random pick = unpredictable
      return available[Math.floor(Math.random() * available.length)]
  }
}

// ────────────────────────────────────────
// AI Slam Parameters
// ────────────────────────────────────────

export function generateAISlamParams(ctx: BattleContext): SlamParams | null {
  const aiTazo = selectAILauncher(ctx)
  if (!aiTazo) return null

  const scoreGap = ctx.opponent.score - ctx.player.score
  return generateAISlam(
    aiTazo,
    ctx.stakedTazos,
    ctx.config.arena,
    ctx.config.aiDifficulty,
    scoreGap
  )
}

// ────────────────────────────────────────
// AI Slam Simulation (returns impact)
// ────────────────────────────────────────

export function simulateAISlam(ctx: BattleContext): {
  impact: ImpactResult
  staked: StakedTazo[]
  launcher: TazoCard
  params: SlamParams
} | null {
  const aiTazo = selectAILauncher(ctx)
  if (!aiTazo) return null

  const scoreGap = ctx.opponent.score - ctx.player.score
  const params = generateAISlam(
    aiTazo, ctx.stakedTazos, ctx.config.arena,
    ctx.config.aiDifficulty, scoreGap
  )

  const defendersMap = new Map<string, TazoCard>()
  for (const dt of [...ctx.config.playerDeck, ...ctx.config.opponentDeck]) {
    defendersMap.set(dt.id, dt)
  }

  const { result: impact, staked } = simulateSlam(
    aiTazo, params, ctx.stakedTazos, ctx.config.arena, "opponent", defendersMap
  )

  return { impact, staked, launcher: aiTazo, params }
}
