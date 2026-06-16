import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [totalTazos, ownedTazos, totalUsers, totalSeries, totalCollections, tazos, userStats] =
      await Promise.all([
        db.tazo.count({ where: { publishStatus: "published" } }),
        db.userTazo.groupBy({ by: ["tazoId"] }).then(r => r.length),
        db.user.count(),
        db.franchise.count(),
        db.collection.count(),
        db.tazo.findMany({
          where: { publishStatus: "published" },
          select: {
            rarity: true,
            condition: true,
            franchiseId: true,
            franchise: { select: { name: true } },
          },
        }),
        // Top 10 users by level
        db.user.findMany({
          take: 10,
          orderBy: { level: "desc" },
          select: {
            id: true, name: true, displayName: true, avatarUrl: true,
            level: true, xp: true, totalBattles: true, totalWins: true,
            totalTazosOwned: true,
          },
        }),
      ])

    // Group by rarity
    const byRarity: Record<string, number> = {}
    for (const t of tazos) {
      byRarity[t.rarity] = (byRarity[t.rarity] || 0) + 1
    }

    // Group by condition
    const byCondition: Record<string, number> = {}
    for (const t of tazos) {
      byCondition[t.condition] = (byCondition[t.condition] || 0) + 1
    }

    // Group by franchise
    const bySeries: Record<string, number> = {}
    for (const t of tazos) {
      const name = t.franchise.name
      bySeries[name] = (bySeries[name] || 0) + 1
    }

    return NextResponse.json({
      totalTazos,
      ownedTazos,
      totalUsers,
      totalSeries,
      totalCollections,
      byRarity,
      byCondition,
      bySeries,
      leaderboard: userStats,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
