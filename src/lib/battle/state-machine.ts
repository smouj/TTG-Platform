// ============================================================
// Trading Tazos Game — Battle Finite State Machine (FSM)
// Formal state machine for vertical slam battle gameplay.
//
// States: lobby → intro → round_start → betting → stakes_reveal
//         → coin_flip → player_aim → player_charge → player_tilt
//         → slamming → impact → resolve_impact → opponent_aim
//         → opponent_slam → turn_transition → (loop or match_end)
//
// Events drive transitions. Guards check conditions.
// Actions execute side effects (save history, track quests).
// ============================================================

import type {
  GameState, PlayMode, AIDifficulty, Arena3DConfig, TazoCard,
  StakedTazo, AirborneTazo, SlamParams, ImpactResult,
  RoundResult, MatchResult, MatchConfig, PlayerGameState,
} from "./game-loop"
import {
  createMatch, simulateSlam, generateAISlam, drawHand,
  placeStakedTazos, createAirborneTazo, coinFlip,
  scoreBettingImpact, checkMatchEnd, DEFAULT_ARENA_3D,
} from "./game-loop"

// ────────────────────────────────────────
// Events that drive state transitions
// ────────────────────────────────────────

export type BattleEvent =
  | { type: "START_MATCH"; config: MatchConfig }
  | { type: "INTRO_DONE" }
  | { type: "HANDS_DRAWN" }
  | { type: "BETS_PLACED"; playerTazo: TazoCard; opponentTazo: TazoCard; playerStakeX?: number; playerStakeZ?: number }
  | { type: "STAKES_REVEALED" }
  | { type: "COIN_DECIDED"; winner: "player" | "opponent" }
  | { type: "AIM_LOCKED"; targetX: number; targetZ: number }
  | { type: "CHARGE_LOCKED"; charge: number }
  | { type: "SLAM_RELEASED"; params: SlamParams }
  | { type: "IMPACT_RESOLVED"; result: ImpactResult }
  | { type: "RESULT_SHOWN" }
  | { type: "OPPONENT_SLAM_DONE" }
  | { type: "HAND_DRAWN" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "FORFEIT"; who: "player" | "opponent" }

// ────────────────────────────────────────
// Complete battle context
// ────────────────────────────────────────

export interface BattleContext {
  state: GameState
  prevState: GameState | null
  config: MatchConfig
  player: PlayerGameState
  opponent: PlayerGameState
  currentRound: number
  stakedTazos: StakedTazo[]
  airborneTazo: AirborneTazo | null
  roundHistory: RoundResult[]
  turnNumber: number
  coinWinner: "player" | "opponent" | null
  currentThrower: "player" | "opponent" | null
  lastImpact: ImpactResult | null
  playerHand: TazoCard[]
  opponentHand: TazoCard[]
  playerBetTazo: TazoCard | null
  opponentBetTazo: TazoCard | null
  playerRemaining: number
  opponentRemaining: number
  matchResult: MatchResult | null
  // Phase-local state
  chargeLevel: number
  aimPosition: { x: number; z: number }
  roundTurns: number  // turns this round (0-1; each player slams once)
}

export interface StateTransition {
  from: GameState | GameState[]
  to: GameState
  event: BattleEvent["type"]
  guard?: (ctx: BattleContext) => boolean
  action?: (ctx: BattleContext, event: BattleEvent) => BattleContext
}

// ────────────────────────────────────────
// Factory — create initial context
// ────────────────────────────────────────

export function createBattleContext(config: MatchConfig): BattleContext {
  const match = createMatch(config)
  return {
    state: "lobby",
    prevState: null,
    config,
    player: match.player,
    opponent: match.opponent,
    currentRound: 0,
    stakedTazos: [],
    airborneTazo: null,
    roundHistory: [],
    turnNumber: 0,
    coinWinner: null,
    currentThrower: null,
    lastImpact: null,
    playerHand: [],
    opponentHand: [],
    playerBetTazo: null,
    opponentBetTazo: null,
    playerRemaining: config.playerDeck.length,
    opponentRemaining: config.opponentDeck.length,
    matchResult: null,
    chargeLevel: 0,
    aimPosition: { x: 0, z: 0 },
    roundTurns: 0,
  }
}

// ────────────────────────────────────────
// Transition Table
// ────────────────────────────────────────

export const BATTLE_TRANSITIONS: StateTransition[] = [
  // ─── LOBBY → INTRO ──────────────────────────
  {
    from: "lobby",
    to: "intro",
    event: "START_MATCH",
    action(ctx) {
      return { ...ctx, state: "intro" }
    },
  },

  // ─── INTRO → ROUND_START ─────────────────────
  {
    from: "intro",
    to: "round_start",
    event: "INTRO_DONE",
    action(ctx) {
      return { ...ctx, state: "round_start", currentRound: 1 }
    },
  },

  // ─── ROUND_START → BETTING ───────────────────
  {
    from: ["round_start", "turn_transition"],
    to: "betting",
    event: "HANDS_DRAWN",
    action(ctx) {
      const { hand: pHand, remaining: pRem } = drawHand(ctx.player.deck, 5)
      const { hand: oHand, remaining: oRem } = drawHand(ctx.opponent.deck, 5)
      return {
        ...ctx,
        state: "betting",
        playerHand: pHand,
        opponentHand: oHand,
        playerRemaining: pRem.length,
        opponentRemaining: oRem.length,
        playerBetTazo: null,
        opponentBetTazo: null,
        stakedTazos: [],
        airborneTazo: null,
        roundTurns: 0,
        coinWinner: null,
        currentThrower: null,
      }
    },
  },

  // ─── BETTING → STAKES_REVEAL ─────────────────
  {
    from: "betting",
    to: "stakes_reveal",
    event: "BETS_PLACED",
    action(ctx, event) {
      const e = event as Extract<BattleEvent, { type: "BETS_PLACED" }>
      const staked = placeStakedTazos(e.playerTazo, e.opponentTazo)
      // Apply custom stake positions if provided
      if (e.playerStakeX !== undefined && e.playerStakeZ !== undefined) {
        staked[0].position = [e.playerStakeX, 0.045, e.playerStakeZ]
      }
      return {
        ...ctx,
        state: "stakes_reveal",
        playerBetTazo: e.playerTazo,
        opponentBetTazo: e.opponentTazo,
        stakedTazos: staked,
      }
    },
  },

  // ─── STAKES_REVEAL → COIN_FLIP ───────────────
  {
    from: "stakes_reveal",
    to: "coin_flip",
    event: "STAKES_REVEALED",
    action(ctx) {
      const winner = coinFlip()
      return {
        ...ctx,
        state: "coin_flip",
        coinWinner: winner,
        currentThrower: winner,
      }
    },
  },

  // ─── COIN_FLIP → PLAYER_AIM / OPPONENT_AIM ───
  {
    from: "coin_flip",
    to: "player_aim",
    event: "COIN_DECIDED",
    guard(ctx) {
      return ctx.coinWinner === "player"
    },
    action(ctx) {
      if (!ctx.playerBetTazo) return ctx
      const airborne = createAirborneTazo(ctx.playerBetTazo, "player", ctx.config.arena)
      return { ...ctx, state: "player_aim", airborneTazo: airborne, currentThrower: "player" }
    },
  },
  {
    from: "coin_flip",
    to: "opponent_aim",
    event: "COIN_DECIDED",
    guard(ctx) {
      return ctx.coinWinner === "opponent"
    },
    action(ctx) {
      if (!ctx.opponentBetTazo) return ctx
      const airborne = createAirborneTazo(ctx.opponentBetTazo, "opponent", ctx.config.arena)
      return { ...ctx, state: "opponent_aim", airborneTazo: airborne, currentThrower: "opponent" }
    },
  },

  // ─── PLAYER_AIM → PLAYER_CHARGE ──────────────
  {
    from: "player_aim",
    to: "player_charge",
    event: "AIM_LOCKED",
    action(ctx, event) {
      const e = event as Extract<BattleEvent, { type: "AIM_LOCKED" }>
      return {
        ...ctx,
        state: "player_charge",
        aimPosition: { x: e.targetX, z: e.targetZ },
        chargeLevel: 0,
      }
    },
  },

  // ─── PLAYER_CHARGE → PLAYER_TILT ─────────────
  {
    from: "player_charge",
    to: "player_tilt",
    event: "CHARGE_LOCKED",
    action(ctx, event) {
      const e = event as Extract<BattleEvent, { type: "CHARGE_LOCKED" }>
      return { ...ctx, state: "player_tilt", chargeLevel: e.charge }
    },
  },

  // ─── PLAYER_TILT → SLAMMING ─────────────────
  {
    from: "player_tilt",
    to: "slamming",
    event: "SLAM_RELEASED",
    action(ctx) {
      if (!ctx.airborneTazo) return ctx
      return {
        ...ctx,
        state: "slamming",
        airborneTazo: { ...ctx.airborneTazo, state: "falling" },
      }
    },
  },

  // ─── SLAMMING → IMPACT (after physics resolve) ──
  {
    from: "slamming",
    to: "impact",
    event: "IMPACT_RESOLVED",
    action(ctx) {
      return { ...ctx, state: "impact" }
    },
  },

  // ─── IMPACT → RESOLVE_IMPACT (after showing result) ──
  {
    from: "impact",
    to: "resolve_impact",
    event: "RESULT_SHOWN",
    action(ctx, event) {
      const e = event as Extract<BattleEvent, { type: "IMPACT_RESOLVED" }>
      const thrower = ctx.currentThrower || "player"
      // Apply scoring deltas
      const scoring = scoreBettingImpact(e.result, thrower)
      return {
        ...ctx,
        state: "resolve_impact",
        lastImpact: e.result,
        player: {
          ...ctx.player,
          score: ctx.player.score + scoring.playerDelta,
          tazosRemaining: Math.max(0, (ctx.player.tazosRemaining || ctx.playerRemaining) - scoring.playerLostTazos),
        },
        opponent: {
          ...ctx.opponent,
          score: ctx.opponent.score + scoring.opponentDelta,
          tazosRemaining: Math.max(0, (ctx.opponent.tazosRemaining || ctx.opponentRemaining) - scoring.opponentLostTazos),
        },
        playerRemaining: Math.max(0, ctx.playerRemaining - scoring.playerLostTazos),
        opponentRemaining: Math.max(0, ctx.opponentRemaining - scoring.opponentLostTazos),
      }
    },
  },

  // ─── RESOLVE_IMPACT → MATCH_END / OPPONENT / NEXT ──
  {
    from: "resolve_impact",
    to: "match_end",
    event: "RESULT_SHOWN",
    guard(ctx) {
      const result = checkMatchEnd(
        ctx.player.score, ctx.opponent.score,
        ctx.playerRemaining, ctx.opponentRemaining,
        ctx.config.scoreToWin
      )
      return result !== null
    },
    action(ctx) {
      const result = checkMatchEnd(
        ctx.player.score, ctx.opponent.score,
        ctx.playerRemaining, ctx.opponentRemaining,
        ctx.config.scoreToWin
      )
      return { ...ctx, state: "match_end", matchResult: result!,
        roundHistory: result?.rounds ? result.rounds : ctx.roundHistory }
    },
  },
  {
    from: "resolve_impact",
    to: "opponent_aim",
    event: "RESULT_SHOWN",
    guard(ctx) {
      return ctx.currentThrower === "player" && ctx.roundTurns === 0
    },
    action(ctx) {
      if (!ctx.opponentBetTazo) return ctx
      const airborne = createAirborneTazo(ctx.opponentBetTazo, "opponent", ctx.config.arena)
      return { ...ctx, state: "opponent_aim", airborneTazo: airborne,
        currentThrower: "opponent", roundTurns: 1 }
    },
  },
  // When opponent threw first (coin winner), player gets their turn
  {
    from: "resolve_impact",
    to: "player_aim",
    event: "RESULT_SHOWN",
    guard(ctx) {
      return ctx.currentThrower === "opponent" && ctx.roundTurns === 0
    },
    action(ctx) {
      if (!ctx.playerBetTazo) return ctx
      const airborne = createAirborneTazo(ctx.playerBetTazo, "player", ctx.config.arena)
      return { ...ctx, state: "player_aim", airborneTazo: airborne,
        currentThrower: "player", roundTurns: 1 }
    },
  },
  // When both have thrown (roundTurns >= 1), advance to next round
  {
    from: "resolve_impact",
    to: "turn_transition",
    event: "RESULT_SHOWN",
    guard(ctx) {
      return ctx.roundTurns >= 1
    },
  },

  // ─── OPPONENT_AIM → OPPONENT_SLAM ───────────
  {
    from: "opponent_aim",
    to: "opponent_slam",
    event: "OPPONENT_SLAM_DONE",
  },

  // ─── OPPONENT_SLAM → SLAMMING (AI throws) ───
  {
    from: "opponent_slam",
    to: "slamming",
    event: "SLAM_RELEASED",
  },

  // ─── RESOLVE_IMPACT → BETTING (direct next round) ──
  {
    from: "resolve_impact",
    to: "betting",
    event: "HAND_DRAWN",
    guard(ctx) {
      return ctx.playerRemaining > 0 || ctx.opponentRemaining > 0
    },
    action(ctx) {
      const { hand: pHand, remaining: pRem } = drawHand(ctx.player.deck, 5)
      const { hand: oHand, remaining: oRem } = drawHand(ctx.opponent.deck, 5)
      return {
        ...ctx, state: "betting",
        playerHand: pHand, opponentHand: oHand,
        playerRemaining: pRem.length, opponentRemaining: oRem.length,
        playerBetTazo: null, opponentBetTazo: null,
        stakedTazos: [], airborneTazo: null,
        roundTurns: 0, coinWinner: null, currentThrower: null,
        currentRound: ctx.currentRound + 1,
        roundHistory: [...ctx.roundHistory, {
          roundNumber: ctx.currentRound,
          throwerId: ctx.currentThrower || "player",
          throwerWonCoinFlip: ctx.coinWinner === ctx.currentThrower,
          impact: ctx.lastImpact!,
          playerScore: ctx.player.score,
          opponentScore: ctx.opponent.score,
          playerTazosLeft: ctx.playerRemaining,
          opponentTazosLeft: ctx.opponentRemaining,
        }],
      }
    },
  },

  // ─── TURN_TRANSITION → MATCH_END / BETTING ───
  // Safety net: both players eliminated simultaneously
  {
    from: "turn_transition",
    to: "match_end",
    event: "HAND_DRAWN",
    guard(ctx) {
      return ctx.playerRemaining <= 0 && ctx.opponentRemaining <= 0
    },
    action(ctx) {
      return {
        ...ctx, state: "match_end",
        matchResult: {
          winner: ctx.player.score >= ctx.opponent.score ? "player" : "opponent",
          victoryType: "elimination",
          playerScore: ctx.player.score,
          opponentScore: ctx.opponent.score,
          playerRemaining: 0,
          opponentRemaining: 0,
          rounds: ctx.roundHistory,
          totalTurns: ctx.turnNumber,
          playerCaptures: ctx.player.score,
          opponentCaptures: ctx.opponent.score,
          xpEarned: 10,
          summary: `Both eliminated! ${ctx.player.score >= ctx.opponent.score ? "You won" : "Opponent won"} on score tiebreaker.`,
        },
      }
    },
  },
  {
    from: "turn_transition",
    to: "betting",
    event: "HAND_DRAWN",
    guard(ctx) {
      return ctx.playerRemaining > 0 || ctx.opponentRemaining > 0
    },
    action(ctx) {
      const { hand: pHand, remaining: pRem } = drawHand(ctx.player.deck, 5)
      const { hand: oHand, remaining: oRem } = drawHand(ctx.opponent.deck, 5)
      return {
        ...ctx,
        state: "betting",
        playerHand: pHand,
        opponentHand: oHand,
        playerRemaining: pRem.length,
        opponentRemaining: oRem.length,
        playerBetTazo: null,
        opponentBetTazo: null,
        stakedTazos: [],
        airborneTazo: null,
        roundTurns: 0,
        coinWinner: null,
        currentThrower: null,
        roundHistory: [
          ...ctx.roundHistory,
          {
            roundNumber: ctx.currentRound,
            throwerId: ctx.currentThrower || "player",
            throwerWonCoinFlip: ctx.coinWinner === ctx.currentThrower,
            impact: ctx.lastImpact!,
            playerScore: ctx.player.score,
            opponentScore: ctx.opponent.score,
            playerTazosLeft: ctx.playerRemaining,
            opponentTazosLeft: ctx.opponentRemaining,
          },
        ],
      }
    },
  },

  // ─── ANY → PAUSED / RESUME ───────────────────
  {
    from: [
      "betting", "player_aim", "player_charge", "player_tilt",
      "slamming", "impact", "resolve_impact", "opponent_aim",
      "opponent_slam", "turn_transition",
    ],
    to: "paused",
    event: "PAUSE",
    action(ctx) {
      return { ...ctx, prevState: ctx.state, state: "paused" }
    },
  },
  {
    from: "paused",
    to: "betting", // default, overridden by action
    event: "RESUME",
    action(ctx) {
      return { ...ctx, state: ctx.prevState || "betting", prevState: null }
    },
  },

  // ─── ANY → MATCH_END (forfeit) ──────────────
  {
    from: [
      "betting", "player_aim", "player_charge", "player_tilt",
      "slamming", "impact", "resolve_impact", "opponent_aim",
      "opponent_slam", "turn_transition", "round_start",
      "stakes_reveal", "coin_flip",
    ],
    to: "match_end",
    event: "FORFEIT",
    action(ctx, event) {
      const e = event as Extract<BattleEvent, { type: "FORFEIT" }>
      const winner = e.who === "player" ? "opponent" : "player" as "player" | "opponent"
      return {
        ...ctx,
        state: "match_end",
        matchResult: {
          winner,
          victoryType: "forfeit",
          playerScore: ctx.player.score,
          opponentScore: ctx.opponent.score,
          playerRemaining: ctx.playerRemaining,
          opponentRemaining: ctx.opponentRemaining,
          rounds: ctx.roundHistory,
          totalTurns: ctx.turnNumber,
          playerCaptures: ctx.player.score,
          opponentCaptures: ctx.opponent.score,
          xpEarned: winner === "player" ? 15 : 3,
          summary: `${e.who === "player" ? "You" : "Opponent"} forfeited!`,
        },
      }
    },
  },
]

// ────────────────────────────────────────
// Transition Engine
// ────────────────────────────────────────

export function findTransition(
  from: GameState,
  event: BattleEvent["type"]
): StateTransition | undefined {
  return BATTLE_TRANSITIONS.find(t => {
    const fromMatch = Array.isArray(t.from) ? t.from.includes(from) : t.from === from
    return fromMatch && t.event === event
  })
}

export function applyTransition(
  ctx: BattleContext,
  event: BattleEvent
): BattleContext | null {
  const transition = findTransition(ctx.state, event.type)
  if (!transition) return null
  if (transition.guard && !transition.guard(ctx)) return null

  // Apply the transition
  let nextCtx = { ...ctx, state: transition.to, turnNumber: ctx.turnNumber + 1 }

  if (transition.action) {
    // Pass both context and event to action
    const result = transition.action(nextCtx, event)
    nextCtx = result
  }

  return nextCtx
}

// ────────────────────────────────────────
// AI Opponent Logic (integrated)
// ────────────────────────────────────────

export function generateOpponentSlam(ctx: BattleContext): SlamParams | null {
  if (!ctx.opponentBetTazo) {
    // Need to pick a tazo from hand
    if (ctx.opponentHand.length === 0) return null
    return null // Let caller handle
  }

  const aiTazo = ctx.opponentBetTazo || ctx.opponentHand[0]
  return generateAISlam(
    aiTazo,
    ctx.stakedTazos,
    ctx.config.arena,
    ctx.config.aiDifficulty
  )
}

export function autoSelectOpponentBet(ctx: BattleContext): TazoCard | null {
  if (ctx.opponentHand.length === 0) return null
  // AI picks based on difficulty — sorted copy to avoid mutation
  const sorted = [...ctx.opponentHand]
  if (ctx.config.aiDifficulty === "master") {
    sorted.sort((a, b) => b.attack - a.attack)
  } else if (ctx.config.aiDifficulty === "skilled") {
    sorted.sort((a, b) => (b.attack + b.defense) - (a.attack + a.defense))
    return sorted[0]
  }
  // Novice: random (or first from sorted for skilled/master)
  return ctx.config.aiDifficulty === "novice"
    ? ctx.opponentHand[Math.floor(Math.random() * ctx.opponentHand.length)]
    : sorted[0]
}

// ────────────────────────────────────────
// Scoring helper — applies impact to scores + remaining counts
// ────────────────────────────────────────

export function applyScoring(
  ctx: BattleContext,
  impact: ImpactResult,
  thrower: "player" | "opponent"
): BattleContext {
  const scoring = scoreBettingImpact(impact, thrower)
  return {
    ...ctx,
    player: {
      ...ctx.player,
      score: ctx.player.score + scoring.playerDelta,
      tazosRemaining: Math.max(0, ctx.playerRemaining - scoring.playerLostTazos),
    },
    opponent: {
      ...ctx.opponent,
      score: ctx.opponent.score + scoring.opponentDelta,
      tazosRemaining: Math.max(0, ctx.opponentRemaining - scoring.opponentLostTazos),
    },
    playerRemaining: Math.max(0, ctx.playerRemaining - scoring.playerLostTazos),
    opponentRemaining: Math.max(0, ctx.opponentRemaining - scoring.opponentLostTazos),
  }
}

// ────────────────────────────────────────
// Match end — build final MatchResult
// ────────────────────────────────────────

export function buildMatchResult(ctx: BattleContext): MatchResult {
  if (ctx.matchResult) return ctx.matchResult

  // Single unified check — handles elimination, TKO, score limit
  const result = checkMatchEnd(
    ctx.player.score,
    ctx.opponent.score,
    ctx.playerRemaining,
    ctx.opponentRemaining,
    ctx.config.scoreToWin
  )

  if (result) {
    // Enrich with round history + turn count
    return {
      ...result,
      rounds: ctx.roundHistory,
      totalTurns: ctx.turnNumber,
      playerCaptures: ctx.player.score,
      opponentCaptures: ctx.opponent.score,
    }
  }

  return {
    winner: "draw",
    victoryType: "draw",
    playerScore: ctx.player.score,
    opponentScore: ctx.opponent.score,
    playerRemaining: ctx.playerRemaining,
    opponentRemaining: ctx.opponentRemaining,
    rounds: ctx.roundHistory,
    totalTurns: ctx.turnNumber,
    playerCaptures: ctx.player.score,
    opponentCaptures: ctx.opponent.score,
    xpEarned: 5,
    summary: "Draw — no clear winner!",
  }
}
