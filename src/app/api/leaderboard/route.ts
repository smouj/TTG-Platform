// ============================================================
// Trading Tazos Game — Leaderboard API
// GET /api/leaderboard?sort=credits|tazos|battles|level
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { db as prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const sort = req.nextUrl.searchParams.get("sort") || "credits"
  const parsedLimit = parseInt(req.nextUrl.searchParams.get("limit") || "50", 10)
  const limit = Math.min(Math.max(1, Number.isFinite(parsedLimit) ? parsedLimit : 50), 100)

  let users: any[] = []

  switch (sort) {
    case "tazos":
      users = await prisma.user.findMany({
        select: { id: true, name: true, displayName: true, avatarUrl: true, credits: true, _count: { select: { userTazos: true } } },
        orderBy: { userTazos: { _count: "desc" } },
        take: limit,
      })
      users = users.map(u => ({ ...u, score: u._count.userTazos, rankField: "tazos" }))
      break
    case "battles":
      {
      const battleGroups = await prisma.battleRecord.groupBy({
        by: ["userId"],
        where: { userId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { userId: "desc" } },
        take: limit,
      })
      const ids = battleGroups.map(g => g.userId).filter(Boolean) as string[]
      const battleUsers = await prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, displayName: true, avatarUrl: true, credits: true, _count: { select: { userTazos: true } } },
      })
      const userById = new Map(battleUsers.map(u => [u.id, u]))
      users = await Promise.all(battleGroups.map(async (g) => {
        const id = g.userId!
        const u = userById.get(id)
        if (!u) return null
        const wins = await prisma.battleRecord.count({ where: { userId: id, winner: "player" } })
        return { ...u, score: g._count._all, battleCount: g._count._all, winCount: wins, rankField: "battles", tazoCount: u._count.userTazos }
      })).then(rows => rows.filter(Boolean) as any[])
      break
      }
    case "credits":
    default:
      users = await prisma.user.findMany({
        select: { id: true, name: true, displayName: true, avatarUrl: true, credits: true, _count: { select: { userTazos: true } } },
        orderBy: { credits: "desc" },
        take: limit,
      })
      users = users.map(u => ({ ...u, score: u.credits, rankField: "credits", tazoCount: u._count.userTazos }))
      break
  }

  // Rank users
  const ranked = users.map((u: any, i: number) => ({ rank: i + 1, ...u }))

  return NextResponse.json({ leaderboard: ranked, sort, total: ranked.length })
}
