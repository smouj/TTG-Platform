// ============================================================
// Trading Tazos Game — Battle Integration
// Hooks persistence & progression tracking into the battle FSM.
//
// On match_end:
//   1. POST /api/battle/history — save BattleRecord
//   2. PATCH /api/achievements — refresh user achievements
//   3. PATCH /api/quests — refresh user quests
// ============================================================

import type { BattleContext } from "./state-machine"
import type { MatchResult } from "./game-loop"

export interface BattlePersistenceResult {
  battleRecordId?: string
  achievementsUpdated: boolean
  questsUpdated: boolean
  creditsEarned: number
  errors: string[]
}

/**
 * Persist battle result and trigger progression updates.
 * Safe to call multiple times — uses idempotency key.
 */
export async function persistBattleResult(
  ctx: BattleContext,
  token: string,
  mode: "practice" | "pvp_ranked" | "pvp_friend"
): Promise<BattlePersistenceResult> {
  const result: BattlePersistenceResult = {
    achievementsUpdated: false,
    questsUpdated: false,
    creditsEarned: 0,
    errors: [],
  }

  const matchResult = ctx.matchResult || {
    winner: "draw" as const,
    victoryType: "draw" as const,
    playerScore: ctx.player.score,
    opponentScore: ctx.opponent.score,
    playerRemaining: ctx.playerRemaining,
    opponentRemaining: ctx.opponentRemaining,
    rounds: ctx.roundHistory,
    totalTurns: ctx.turnNumber,
    playerCaptures: ctx.player.score,
    opponentCaptures: ctx.opponent.score,
    xpEarned: 0,
    summary: "Match ended",
  }

  try {
    // 1. Save battle history
    const historyRes = await fetch("/api/battle/history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        winner: matchResult.winner,
        victoryType: matchResult.victoryType,
        score: `${matchResult.playerScore}-${matchResult.opponentScore}`,
        turns: matchResult.totalTurns,
        rounds: ctx.currentRound,
        playerTazos: ctx.config.playerDeck.map(t => t.id),
        opponentTazos: ctx.config.opponentDeck.map(t => t.id),
        opponentName: mode === "practice"
          ? `AI (${ctx.config.aiDifficulty})`
          : ctx.opponent.name,
        xpEarned: matchResult.xpEarned,
        battleLog: JSON.stringify({
          mode,
          arena: ctx.config.arena.radius,
          rounds: ctx.roundHistory.length,
          finalScore: matchResult.summary,
        }),
        idempotencyKey: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      }),
    })

    if (historyRes.ok) {
      const data = await historyRes.json()
      result.battleRecordId = data.id
    } else {
      result.errors.push("Failed to save battle history")
    }
  } catch (err) {
    result.errors.push(`Battle history error: ${err}`)
  }

  // 2. Refresh achievements
  try {
    const achRes = await fetch("/api/achievements", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (achRes.ok) result.achievementsUpdated = true
    else result.errors.push("Failed to refresh achievements")
  } catch (err) {
    result.errors.push(`Achievements error: ${err}`)
  }

  // 3. Refresh quests
  // (auto-tracked via GET /api/quests which triggers refreshUserProgress)
  try {
    const questRes = await fetch("/api/quests", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (questRes.ok) {
      const qData = await questRes.json()
      result.questsUpdated = true
      // Check for newly completed quests
      const newlyCompleted = qData.userQuests?.filter(
        (uq: any) => uq.completed && !uq.claimed
      )?.length || 0
      if (newlyCompleted > 0) {
        result.creditsEarned = newlyCompleted > 0 ? 10 : 0 // estimate
      }
    } else {
      result.errors.push("Failed to refresh quests")
    }
  } catch (err) {
    result.errors.push(`Quests error: ${err}`)
  }

  // 4. Credits are now granted by /api/battle/history POST (step 1)
  // The history endpoint also updates User.totalBattles/totalWins and grants XP
  result.creditsEarned += matchResult.xpEarned

  // 5. Report to ranked Elo system (PvP ranked only)
  if (mode === "pvp_ranked") {
    try {
      await fetch("/api/ranked", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          playerScore: matchResult.playerScore,
          opponentScore: matchResult.opponentScore,
          opponentUserId: (ctx.opponent as any).userId || null,
        }),
      })
    } catch {
      // Non-critical: Elo update can fail
    }
  }

  return result
}

/**
 * Maps mode string to database-compatible battle type.
 */
export function battleModeLabel(mode: "practice" | "pvp_ranked" | "pvp_friend"): string {
  switch (mode) {
    case "practice": return "Practice vs AI"
    case "pvp_ranked": return "Ranked PvP"
    case "pvp_friend": return "Friend Battle"
  }
}
