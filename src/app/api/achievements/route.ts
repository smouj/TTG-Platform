// ============================================================
// Trading Tazos Game — Achievements API
// GET /api/achievements — list all + user progress
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { db as prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  const achievements = await prisma.achievement.findMany({ orderBy: [{ category: "asc" }, { tier: "asc" }, { orderIndex: "asc" }] })

  if (!user) {
    return NextResponse.json({ achievements, userAchievements: [] })
  }

  const userAchievements = await prisma.userAchievement.findMany({ where: { userId: user.id } })

  // Auto-create records for new achievements
  const existing = new Set(userAchievements.map(ua => ua.achievementId))
  const newAchs = achievements.filter(a => !existing.has(a.id))
  if (newAchs.length > 0) {
    await prisma.userAchievement.createMany({
      data: newAchs.map(a => ({ userId: user.id, achievementId: a.id }))
    })
    const updated = await prisma.userAchievement.findMany({ where: { userId: user.id } })
    return NextResponse.json({ achievements, userAchievements: updated })
  }

  return NextResponse.json({ achievements, userAchievements })
}
