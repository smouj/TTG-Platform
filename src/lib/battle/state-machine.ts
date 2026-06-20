// ============================================================
// Trading Tazos Game — Battle FSM v5
//
// 20 phases — full gameplay loop:
//   lobby → validate_webgl → loading → match_intro
//   → draw_initial_hand → stake_player → stake_ai
//   → stake_reveal → round_start → turn_start → draw
//   → select_tazo → aim → charge → throw → physics_resolve
//   → capture_check → score_update → turn_end → match_end
//
// Events drive transitions. Guards check conditions.
// Actions execute side effects.
// ============================================================

import type {
  GameState, PlayMode, AIDifficulty, Arena3DConfig, TazoCard,
  StakedTazo, AirborneTazo, SlamParams, ImpactResult,
  RoundResult, MatchResult, MatchConfig, PlayerGameState,
} from "./game-loop"
import {
  createMatch, simulateSlam, generateAISlam, drawOne,
  placeStakedTazos, createAirborneTazo,
  scoreBettingImpact, checkMatchEnd, DEFAULT_ARENA_3D,
} from "./game-loop"

// ────────────────────────────────────────
// Events
// ────────────────────────────────────────

export type BattleEvent =
  | { type: "START_MATCH"; config: MatchConfig }
  | { type: "VALIDATE_WEBGL" }
  | { type: "WEBGL_READY" }
  | { type: "WEBGL_FAILED" }
  | { type: "RESOURCES_LOADED" }
  | { type: "INTRO_DONE" }
  | { type: "INITIAL_HANDS_DRAWN" }
  | { type: "PLAYER_STAKED"; tazo: TazoCard; x?: number; z?: number }
  | { type: "AI_STAKED"; tazo: TazoCard }
  | { type: "STAKES_REVEALED" }
  | { type: "ROUND_STARTED" }
  | { type: "TURN_STARTED" }
  | { type: "CARD_DRAWN" }
  | { type: "TAZO_SELECTED"; tazo: TazoCard }
  | { type: "AIM_LOCKED"; targetX: number; targetZ: number }
  | { type: "CHARGE_COMPLETE"; charge: number }
  | { type: "SLAM_RELEASED"; params: SlamParams }
  | { type: "PHYSICS_DONE"; result: ImpactResult; staked: StakedTazo[] }
  | { type: "CAPTURE_RESOLVED" }
  | { type: "SCORE_UPDATED" }
  | { type: "TURN_OVER" }
  | { type: "MATCH_COMPLETE"; winner: "player" | "opponent" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "FORFEIT"; who: "player" | "opponent" }

// ────────────────────────────────────────
// Battle Context (complete state)
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
  roundTurns: number
  currentThrower: "player" | "opponent" | null
  lastImpact: ImpactResult | null
  playerHand: TazoCard[]
  opponentHand: TazoCard[]
  playerBetTazo: TazoCard | null
  opponentBetTazo: TazoCard | null
  playerRemaining: number
  opponentRemaining: number
  playerRemainingDeck: TazoCard[]
  opponentRemainingDeck: TazoCard[]
  matchResult: MatchResult | null
  // Phase-local state
  chargeLevel: number
  aimPosition: { x: number; z: number }
}

export interface StateTransition {
  from: GameState | GameState[]
  to: GameState
  event: BattleEvent["type"]
  guard?: (ctx: BattleContext) => boolean
  action?: (ctx: BattleContext, event: BattleEvent) => BattleContext
}

// ────────────────────────────────────────
// Factory
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
    roundTurns: 0,
    currentThrower: null,
    lastImpact: null,
    playerHand: [],
    opponentHand: [],
    playerBetTazo: null,
    opponentBetTazo: null,
    playerRemaining: config.playerDeck.length,
    opponentRemaining: config.opponentDeck.length,
    playerRemainingDeck: [],
    opponentRemainingDeck: [],
    matchResult: null,
    chargeLevel: 0,
    aimPosition: { x: 0, z: 0 },
  }
}

// ────────────────────────────────────────
// Transition Table (20 phases)
// ────────────────────────────────────────

export const BATTLE_TRANSITIONS: StateTransition[] = [

  // ─── LOBBY → MATCH_INTRO ──────────────
  {
    from: "lobby", to: "match_intro",
    event: "START_MATCH",
    action(ctx) { return { ...ctx, state: "match_intro" } },
  },

  // ─── MATCH_INTRO → DRAW_INITIAL_HAND ──
  {
    from: "match_intro", to: "draw_initial_hand",
    event: "INTRO_DONE",
    action(ctx) {
      // Draw 5 starting hand for both players
      const rn = () => Math.random()
      const pShuffled = [...ctx.player.deck].sort(() => rn() - 0.5)
      const oShuffled = [...ctx.opponent.deck].sort(() => rn() - 0.5)
      const pHand = pShuffled.slice(0, 5)
      const pRemDeck = pShuffled.slice(5)
      const oHand = oShuffled.slice(0, 5)
      const oRemDeck = oShuffled.slice(5)
      return {
        ...ctx, state: "draw_initial_hand",
        playerHand: pHand, opponentHand: oHand,
        playerRemainingDeck: pRemDeck, opponentRemainingDeck: oRemDeck,
        playerRemaining: pRemDeck.length, opponentRemaining: oRemDeck.length,
        currentRound: 1,
      }
    },
  },

  // ─── DRAW_INITIAL_HAND → STAKE_PLAYER ─
  {
    from: "draw_initial_hand", to: "stake_player",
    event: "INITIAL_HANDS_DRAWN",
    action(ctx) { return { ...ctx, state: "stake_player" } },
  },

  // ─── STAKE_PLAYER → STAKE_AI ──────────
  {
    from: "stake_player", to: "stake_ai",
    event: "PLAYER_STAKED",
    action(ctx, event) {
      const e = event as Extract<BattleEvent, { type: "PLAYER_STAKED" }>
      return { ...ctx, state: "stake_ai", playerBetTazo: e.tazo }
    },
  },

  // ─── STAKE_AI → STAKE_REVEAL ──────────
  {
    from: "stake_ai", to: "stake_reveal",
    event: "AI_STAKED",
    action(ctx, event) {
      const e = event as Extract<BattleEvent, { type: "AI_STAKED" }>
      const pTazo = ctx.playerBetTazo!
      const staked = placeStakedTazos(pTazo, e.tazo)
      return { ...ctx, state: "stake_reveal", opponentBetTazo: e.tazo, stakedTazos: staked }
    },
  },

  // ─── STAKE_REVEAL → ROUND_START ───────
  {
    from: "stake_reveal", to: "round_start",
    event: "STAKES_REVEALED",
    action(ctx) {
      return { ...ctx, state: "round_start", currentThrower: "player" }
    },
  },

  // ─── ROUND_START → TURN_START ─────────
  {
    from: "round_start", to: "turn_start",
    event: "ROUND_STARTED",
    action(ctx) { return { ...ctx, state: "turn_start" } },
  },

  // ─── TURN_START → DRAW ────────────────
  {
    from: "turn_start", to: "draw",
    event: "TURN_STARTED",
    guard(ctx) {
      // Only draw if deck has cards and hand has space
      const throwerDeck = ctx.currentThrower === "player" ? ctx.playerRemaining : ctx.opponentRemaining
      const throwerHand = ctx.currentThrower === "player" ? ctx.playerHand : ctx.opponentHand
      return throwerDeck > 0 || throwerHand.length > 0
    },
    action(ctx) {
      // Draw 1 card for current thrower from remaining deck
      const thrower = ctx.currentThrower || "player"
      if (thrower === "player") {
        const result = drawOne(ctx.playerRemainingDeck, ctx.playerHand)
        return { ...ctx, state: "draw", playerHand: result.hand, playerRemainingDeck: result.remainingDeck, playerRemaining: result.remainingDeck.length }
      } else {
        const result = drawOne(ctx.opponentRemainingDeck, ctx.opponentHand)
        return { ...ctx, state: "draw", opponentHand: result.hand, opponentRemainingDeck: result.remainingDeck, opponentRemaining: result.remainingDeck.length }
      }
    },
  },
  // No guard: if no cards to draw, skip to select_tazo
  {
    from: "turn_start", to: "select_tazo",
    event: "TURN_STARTED",
    guard(ctx) {
      const throwerDeck = ctx.currentThrower === "player" ? ctx.playerRemaining : ctx.opponentRemaining
      const throwerHand = ctx.currentThrower === "player" ? ctx.playerHand : ctx.opponentHand
      return throwerDeck <= 0 && throwerHand.length <= 0
    },
  },

  // ─── DRAW → SELECT_TAZO ───────────────
  {
    from: "draw", to: "select_tazo",
    event: "CARD_DRAWN",
    action(ctx) { return { ...ctx, state: "select_tazo" } },
  },

  // ─── SELECT_TAZO → AIM (player) / SKIP → TURN_END ──
  {
    from: "select_tazo", to: "aim",
    event: "TAZO_SELECTED",
    guard(ctx) { return ctx.currentThrower === "player" },
    action(ctx, event) {
      const e = event as Extract<BattleEvent, { type: "TAZO_SELECTED" }>
      const airborne = createAirborneTazo(e.tazo, "player", ctx.config.arena)
      return { ...ctx, state: "aim", airborneTazo: airborne }
    },
  },
  // AI selects and immediately transitions to aim
  {
    from: "select_tazo", to: "aim",
    event: "TAZO_SELECTED",
    guard(ctx) { return ctx.currentThrower === "opponent" },
    action(ctx, event) {
      const e = event as Extract<BattleEvent, { type: "TAZO_SELECTED" }>
      const airborne = createAirborneTazo(e.tazo, "opponent", ctx.config.arena)
      return { ...ctx, state: "aim", airborneTazo: airborne }
    },
  },
  {
    from: "select_tazo", to: "turn_end",
    event: "TAZO_SELECTED",
    guard(ctx) {
      const hand = ctx.currentThrower === "player" ? ctx.playerHand : ctx.opponentHand
      return hand.length === 0
    },
  },

  // ─── AIM → CHARGE ─────────────────────
  {
    from: "aim", to: "charge",
    event: "AIM_LOCKED",
    action(ctx, event) {
      const e = event as Extract<BattleEvent, { type: "AIM_LOCKED" }>
      return { ...ctx, state: "charge", aimPosition: { x: e.targetX, z: e.targetZ }, chargeLevel: 0 }
    },
  },

  // ─── CHARGE → THROW ───────────────────
  {
    from: "charge", to: "throw",
    event: "CHARGE_COMPLETE",
    action(ctx, event) {
      const e = event as Extract<BattleEvent, { type: "CHARGE_COMPLETE" }>
      return { ...ctx, state: "throw", chargeLevel: e.charge }
    },
  },

  // ─── THROW → PHYSICS_RESOLVE ──────────
  {
    from: "throw", to: "physics_resolve",
    event: "SLAM_RELEASED",
    action(ctx) {
      if (!ctx.airborneTazo) return ctx
      return { ...ctx, state: "physics_resolve", airborneTazo: { ...ctx.airborneTazo, state: "falling" } }
    },
  },

  // ─── PHYSICS_RESOLVE → CAPTURE_CHECK ──
  {
    from: "physics_resolve", to: "capture_check",
    event: "PHYSICS_DONE",
    action(ctx, event) {
      const e = event as Extract<BattleEvent, { type: "PHYSICS_DONE" }>
      return { ...ctx, state: "capture_check", lastImpact: e.result, stakedTazos: e.staked }
    },
  },

  // ─── CAPTURE_CHECK → SCORE_UPDATE ─────
  {
    from: "capture_check", to: "score_update",
    event: "CAPTURE_RESOLVED",
    action(ctx) {
      const thrower = ctx.currentThrower || "player"
      const scoring = scoreBettingImpact(ctx.lastImpact!, thrower)
      return {
        ...ctx, state: "score_update",
        player: { ...ctx.player, score: ctx.player.score + scoring.playerDelta },
        opponent: { ...ctx.opponent, score: ctx.opponent.score + scoring.opponentDelta },
        playerRemaining: Math.max(0, ctx.playerRemaining - scoring.playerLostTazos),
        opponentRemaining: Math.max(0, ctx.opponentRemaining - scoring.opponentLostTazos),
      }
    },
  },

  // ─── SCORE_UPDATE → MATCH_END / TURN_END ──
  {
    from: "score_update", to: "match_end",
    event: "SCORE_UPDATED",
    guard(ctx) {
      return checkMatchEnd(
        ctx.player.score, ctx.opponent.score,
        ctx.playerRemaining, ctx.opponentRemaining,
        ctx.config.scoreToWin
      ) !== null
    },
    action(ctx) {
      const result = checkMatchEnd(
        ctx.player.score, ctx.opponent.score,
        ctx.playerRemaining, ctx.opponentRemaining,
        ctx.config.scoreToWin
      )
      return {
        ...ctx, state: "match_end", matchResult: result!,
        roundHistory: [
          ...ctx.roundHistory,
          { roundNumber: ctx.currentRound, throwerId: ctx.currentThrower || "player",
            impact: ctx.lastImpact!,
            playerScore: ctx.player.score, opponentScore: ctx.opponent.score,
            playerTazosLeft: ctx.playerRemaining, opponentTazosLeft: ctx.opponentRemaining }
        ]
      }
    },
  },
  {
    from: "score_update", to: "turn_end",
    event: "SCORE_UPDATED",
    guard(ctx) {
      return checkMatchEnd(
        ctx.player.score, ctx.opponent.score,
        ctx.playerRemaining, ctx.opponentRemaining,
        ctx.config.scoreToWin
      ) === null
    },
    action(ctx) { return { ...ctx, state: "turn_end" } },
  },

  // ─── TURN_END → TURN_START (switch thrower) ──
  {
    from: "turn_end", to: "turn_start",
    event: "TURN_OVER",
    guard(ctx) {
      // Check if both have thrown this round
      return ctx.roundTurns < 1
    },
    action(ctx) {
      const nextThrower = ctx.currentThrower === "player" ? "opponent" : "player"
      return { ...ctx, state: "turn_start", currentThrower: nextThrower, roundTurns: ctx.roundTurns + 1 }
    },
  },
  {
    from: "turn_end", to: "round_start",
    event: "TURN_OVER",
    guard(ctx) {
      // Both have thrown → new round
      return ctx.roundTurns >= 1
    },
    action(ctx) {
      // Draw 1 replacement card for each player at end of round
      const pDraw = drawOne(ctx.playerRemainingDeck, ctx.playerHand)
      const oDraw = drawOne(ctx.opponentRemainingDeck, ctx.opponentHand)
      return {
        ...ctx, state: "round_start",
        currentThrower: "player", roundTurns: 0,
        playerHand: pDraw.hand, playerRemainingDeck: pDraw.remainingDeck, playerRemaining: pDraw.remainingDeck.length,
        opponentHand: oDraw.hand, opponentRemainingDeck: oDraw.remainingDeck, opponentRemaining: oDraw.remainingDeck.length,
        // BET TAZOS PERSIST — don't clear them between rounds
        playerBetTazo: ctx.playerBetTazo, opponentBetTazo: ctx.opponentBetTazo,
        stakedTazos: ctx.stakedTazos, airborneTazo: null, currentRound: ctx.currentRound + 1,
        roundHistory: [
          ...ctx.roundHistory,
          { roundNumber: ctx.currentRound, throwerId: ctx.currentThrower || "player",
            impact: ctx.lastImpact!,
            playerScore: ctx.player.score, opponentScore: ctx.opponent.score,
            playerTazosLeft: ctx.playerRemaining, opponentTazosLeft: ctx.opponentRemaining }
        ]
      }
    },
  },

  // ─── PAUSE / RESUME ───────────────────
  {
    from: ["aim", "charge", "select_tazo", "stake_player",
           "physics_resolve", "capture_check", "score_update", "turn_end"],
    to: "paused", event: "PAUSE",
    action(ctx) { return { ...ctx, prevState: ctx.state, state: "paused" } },
  },
  {
    from: "paused", to: "aim", event: "RESUME",
    action(ctx) { return { ...ctx, state: ctx.prevState || "aim", prevState: null } },
  },

  // ─── FORFEIT (any mid-game phase) ─────
  {
    from: ["stake_player", "stake_ai", "stake_reveal", "round_start",
           "turn_start", "draw", "select_tazo", "aim", "charge",
           "throw", "physics_resolve", "capture_check", "score_update", "turn_end"],
    to: "match_end", event: "FORFEIT",
    action(ctx, event) {
      const e = event as Extract<BattleEvent, { type: "FORFEIT" }>
      const winner = e.who === "player" ? "opponent" : "player" as "player" | "opponent"
      return {
        ...ctx, state: "match_end",
        matchResult: {
          winner, victoryType: "forfeit",
          playerScore: ctx.player.score, opponentScore: ctx.opponent.score,
          playerRemaining: ctx.playerRemaining, opponentRemaining: ctx.opponentRemaining,
          rounds: ctx.roundHistory, totalTurns: ctx.turnNumber,
          playerCaptures: ctx.player.score, opponentCaptures: ctx.opponent.score,
          xpEarned: winner === "player" ? 15 : 3,
          summary: `${e.who === "player" ? "You" : "Opponent"} forfeited!`,
        }
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

  let nextCtx = { ...ctx, state: transition.to, turnNumber: ctx.turnNumber + 1 }

  if (transition.action) {
    const result = transition.action(nextCtx, event)
    nextCtx = result
  }

  return nextCtx
}

// ────────────────────────────────────────
// AI Opponent Logic (kept for compat)
// ────────────────────────────────────────

export function autoSelectOpponentBet(ctx: BattleContext): TazoCard | null {
  if (ctx.opponentHand.length === 0) return null
  const sorted = [...ctx.opponentHand]
  if (ctx.config.aiDifficulty === "master") {
    sorted.sort((a, b) => b.attack - a.attack)
    return sorted[0]
  }
  if (ctx.config.aiDifficulty === "skilled") {
    sorted.sort((a, b) => (b.attack + b.defense) - (a.attack + a.defense))
    return sorted[0]
  }
  const r = Math.random()
  return ctx.opponentHand[Math.floor(r * ctx.opponentHand.length)]
}

export function applyScoring(
  ctx: BattleContext,
  impact: ImpactResult,
  thrower: "player" | "opponent"
): BattleContext {
  const scoring = scoreBettingImpact(impact, thrower)
  return {
    ...ctx,
    player: { ...ctx.player, score: ctx.player.score + scoring.playerDelta },
    opponent: { ...ctx.opponent, score: ctx.opponent.score + scoring.opponentDelta },
    playerRemaining: Math.max(0, ctx.playerRemaining - scoring.playerLostTazos),
    opponentRemaining: Math.max(0, ctx.opponentRemaining - scoring.opponentLostTazos),
  }
}

export function buildMatchResult(ctx: BattleContext): MatchResult {
  if (ctx.matchResult) return ctx.matchResult
  const result = checkMatchEnd(
    ctx.player.score, ctx.opponent.score,
    ctx.playerRemaining, ctx.opponentRemaining,
    ctx.config.scoreToWin
  )
  if (result) {
    return {
      ...result, rounds: ctx.roundHistory, totalTurns: ctx.turnNumber,
      playerCaptures: ctx.player.score, opponentCaptures: ctx.opponent.score,
    }
  }
  return {
    winner: "draw", victoryType: "draw",
    playerScore: ctx.player.score, opponentScore: ctx.opponent.score,
    playerRemaining: ctx.playerRemaining, opponentRemaining: ctx.opponentRemaining,
    rounds: ctx.roundHistory, totalTurns: ctx.turnNumber,
    playerCaptures: ctx.player.score, opponentCaptures: ctx.opponent.score,
    xpEarned: 5,
    summary: "Draw — no clear winner!",
  }
}
