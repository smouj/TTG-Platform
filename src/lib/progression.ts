import { db } from "@/lib/db"
import { withAsyncLock } from "@/lib/async-lock"

type ProgressMetric = Record<string, number>

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

async function getUserMetrics(userId: string, since?: Date): Promise<ProgressMetric> {
  const dateFilter = since ? { gte: since } : undefined
  const [collectCount, battleWins, credits, deckCount, bagCount, creditsSpent] = await Promise.all([
    db.userTazo.count({ where: { userId, quantity: { gt: 0 }, ...(dateFilter ? { acquiredAt: dateFilter } : {}) } }),
    db.battleRecord.count({ where: { userId, winner: "player", ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
    db.creditTransaction.aggregate({
      where: { userId, amount: { gt: 0 }, ...(dateFilter ? { createdAt: dateFilter } : {}) },
      _sum: { amount: true },
    }),
    db.deck.count({ where: { userId, ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
    db.bagPurchase.count({ where: { userId, opened: true, ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
    // Credits spent (negative amounts = purchases)
    db.creditTransaction.aggregate({
      where: { userId, amount: { lt: 0 }, source: { in: ["shop", "bag", "bag_purchase", "marketplace", "marketplace_buy"] }, ...(dateFilter ? { createdAt: dateFilter } : {}) },
      _sum: { amount: true },
    }),
  ])

  // Count unique tazos the user owns (for own_tazos / own_all quests)
  const uniqueOwned = await db.userTazo.count({ where: { userId, quantity: { gt: 0 } } })

  // Count login days: distinct dates with any activity in this period
  let loginDays = 0
  try {
    if (since) {
      const loginRows = await db.$queryRaw<Array<{ cnt: number }>>`
        SELECT COUNT(DISTINCT strftime('%Y-%m-%d', createdAt)) as cnt
         FROM CreditTransaction WHERE userId = ${userId} AND createdAt >= ${since.toISOString()}
      `
      loginDays = loginRows[0]?.cnt ?? 0
    } else {
      const loginRows = await db.$queryRaw<Array<{ cnt: number }>>`
        SELECT COUNT(DISTINCT strftime('%Y-%m-%d', createdAt)) as cnt
         FROM CreditTransaction WHERE userId = ${userId}
      `
      loginDays = loginRows[0]?.cnt ?? 0
    }
  } catch { /* fallback */ }

  return {
    collect_count: collectCount,
    collect_tazos: collectCount,
    own_tazos: uniqueOwned,
    own_all: uniqueOwned,
    battle_wins: battleWins,
    win_battles: battleWins,
    credits_earned: credits._sum.amount ?? 0,
    credits_spent: Math.abs(creditsSpent._sum.amount ?? 0),
    spend_credits: Math.abs(creditsSpent._sum.amount ?? 0),
    deck_count: deckCount,
    create_deck: deckCount,
    create_decks: deckCount,
    build_decks: deckCount,
    bag_count: bagCount,
    open_bags: bagCount,
    login_days: loginDays,
    perfect_throws: 0,
    perfect_throw: 0,
  }
}

export async function refreshUserProgress(userId: string) {
  return withAsyncLock(`progress:${userId}`, async () => {
    const origRefreshUserProgress(userId: string) {
  const [achievements, quests, totalMetrics, dailyMetrics] = await Promise.all([
    db.achievement.findMany(),
    db.quest.findMany({ where: { isActive: true } }),
    getUserMetrics(userId),
    getUserMetrics(userId, startOfToday()),
  ])

  for (const achievement of achievements) {
    const progress = Math.min(totalMetrics[achievement.requirement] ?? 0, achievement.target)
    const unlocked = progress >= achievement.target
    await db.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId: achievement.id } },
      create: {
        userId,
        achievementId: achievement.id,
        progress,
        unlocked,
      },
      update: {
        progress,
        unlocked,
      },
    })
  }

  for (const quest of quests) {
    const metrics = quest.category === "daily" ? dailyMetrics : totalMetrics
    const progress = Math.min(metrics[quest.requirement] ?? 0, quest.target)
    const completed = progress >= quest.target
    await db.userQuest.upsert({
      where: { userId_questId: { userId, questId: quest.id } },
      create: {
        userId,
        questId: quest.id,
        progress,
        completed,
        completedAt: completed ? new Date() : null,
      },
      update: {
        progress,
        completed,
        completedAt: completed ? new Date() : undefined,
      },
    })
  }
}

export async function claimDailyBonus(userId: string, amount = 25) {
  return withAsyncLock(`credits:daily:${userId}`, async () => {
    const today = startOfToday()

    const result = await db.$transaction(async (tx) => {
      // Check inside transaction to prevent race conditions
      const existing = await tx.creditTransaction.findFirst({
        where: { userId, source: "daily", createdAt: { gte: today } },
      })
      if (existing) return null

      await tx.user.update({ where: { id: userId }, data: { credits: { increment: amount } } })
      await tx.creditTransaction.create({
        data: { userId, amount, source: "daily", reference: today.toISOString().slice(0, 10) },
      })
      const updated = await tx.user.findUnique({ where: { id: userId }, select: { credits: true } })
      return { claimed: true, amount, credits: updated?.credits ?? 0 }
    })

    if (!result) {
      return { claimed: false, amount: 0, alreadyClaimed: true, credits: 0 }
    }

    await refreshUserProgress(userId)
    return { claimed: true, amount, alreadyClaimed: false, credits: result.credits }
  })
}
