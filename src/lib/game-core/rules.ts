// ============================================================
// game-core/rules.ts — Pure game rules & validators
//
// No side effects, no I/O, no UI. Just game logic.
// Testable in isolation. Same rules everywhere.
// ============================================================

import type { TazoRef, StakedTazo, BattleConfig } from "./types"
import { DECK_SIZE, STARTING_HAND_SIZE, DRAW_PER_TURN } from "./types"

// ── Deck Rules ──

/** A valid deck has exactly DECK_SIZE tazos. */
export function isValidDeckSize(count: number): boolean {
  return count === DECK_SIZE
}

/** A valid starting hand draws STARTING_HAND_SIZE from the deck. */
export function drawStartingHand(deck: TazoRef[]): TazoRef[] {
  if (deck.length < STARTING_HAND_SIZE) return [...deck]
  return deck.slice(0, STARTING_HAND_SIZE)
}

/** Draw per turn: 1 tazo (or less if deck is exhausted). */
export function drawTurnCard(deck: TazoRef[]): { drawn: TazoRef | null; remaining: TazoRef[] } {
  if (deck.length === 0) return { drawn: null, remaining: [] }
  return { drawn: deck[0], remaining: deck.slice(1) }
}

// ── Win Conditions ──

/** Elimination: opponent has no tazos left (all captured or never had any). */
export function isElimination(opponentStaked: StakedTazo[], opponentHand: TazoRef[]): boolean {
  return opponentStaked.length === 0 && opponentHand.length === 0
}

/** Points victory: player has more points at round limit. */
export function isPointsVictory(
  playerScore: number,
  opponentScore: number,
  currentRound: number,
  maxRounds: number
): boolean {
  return currentRound >= maxRounds && playerScore !== opponentScore
}

/** Get winner by score comparison. */
export function determineWinner(
  playerScore: number,
  opponentScore: number
): "player" | "opponent" | "draw" {
  if (playerScore > opponentScore) return "player"
  if (opponentScore > playerScore) return "opponent"
  return "draw"
}

// ── Bet Validation ──

/** Can the player bet this tazo? (It must be in their hand). */
export function canBetTazo(hand: TazoRef[], tazoId: string): boolean {
  return hand.some(t => t.id === tazoId)
}

// ── Battle Config Validation ──

export function validateBattleConfig(config: BattleConfig): string | null {
  if (config.playerDeck.length !== DECK_SIZE) {
    return `Player deck must have exactly ${DECK_SIZE} tazos, got ${config.playerDeck.length}`
  }
  if (config.opponentDeck.length !== DECK_SIZE) {
    return `Opponent deck must have exactly ${DECK_SIZE} tazos, got ${config.opponentDeck.length}`
  }
  if (config.maxRounds < 1) {
    return "maxRounds must be at least 1"
  }
  return null // valid
}

// ── Constants ──

export const GAME_RULES = {
  deckSize: DECK_SIZE,
  startingHandSize: STARTING_HAND_SIZE,
  drawPerTurn: DRAW_PER_TURN,
  maxHandSize: 10,
  stakeAreaRadius: 0.15,  // meters from arena center
  slamChargeTimeMs: 2000, // max charge duration
  captureRadius: 0.08,    // tazo disc radius for collision
} as const
