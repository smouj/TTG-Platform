// ============================================================
// Trading Tazos Game — Achievements API
// GET /api/achievements — list all + user progress
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { db as prisma } from "@/lib/db"
import { refreshUserProgress } from "@/lib/progression"

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  const achievements = await prisma.achievement.findMany({ orderBy: [{ category: "asc" }, { tier: "asc" }, { orderIndex: "asc" }] })

  if (!user) {
    return NextResponse.json({ achievements, userAchievements: [] })
  }

  await refreshUserProgress(user.id)
  const userAchievements = await prisma.userAchievement.findMany({ where: { userId: user.id } })

  return NextResponse.json({ achievements, userAchievements })
}
