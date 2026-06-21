// ============================================================
// Trading Tazos Game — Quests API
// GET  /api/quests       — list active quests + user progress
// POST /api/quests/claim — claim quest reward
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { db as prisma, isoNow } from "@/lib/db"
import { getLevelInfo } from "@/lib/leveling"
import { refreshUserProgress } from "@/lib/progression"

// ─── GET: List quests ───────────────────────────────────────
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  const quests = await prisma.quest.findMany({ where: { isActive: true }, orderBy: { orderIndex: "asc" } })

  if (!user) {
    // Return quests without progress for guests
    return NextResponse.json({ quests, userQuests: [] })
  }

  // Get user progress (best-effort — DB may have timestamp format issues)
  let userQuests: any[] = []
  try {
    userQuests = await prisma.userQuest.findMany({ where: { userId: user.id } })
  } catch {
    // Timestamp format corruption in DB — return quests without progress
    return NextResponse.json({ quests, userQuests: [] })
  }

  // Auto-create userQuest records for any quests user hasn't seen
  // Uses raw SQL to avoid Prisma @default(now()) SQLite ms-timestamp bug
  const existing = new Set(userQuests.map(uq => uq.questId))
  const newQuests = quests.filter(q => !existing.has(q.id))
  if (newQuests.length > 0) {
    const now = isoNow()
    for (const q of newQuests) {
      try {
        await prisma.$executeRawUnsafe(
          `INSERT OR IGNORE INTO UserQuest (id, userId, questId, progress, completed, claimed, createdAt, updatedAt) VALUES (?, ?, ?, 0, 0, 0, ?, ?)`,
          `${user.id}_${q.id}`, user.id, q.id, now, now
        )
      } catch { /* skip if already exists */ }
    }
    try {
      userQuests = await prisma.userQuest.findMany({ where: { userId: user.id } })
    } catch {
      userQuests = []
    }
  }

  return NextResponse.json({ quests, userQuests })
}

// ─── POST: Claim reward ─────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 })

    const { questId } = await req.json().catch(() => ({}))
    if (!questId) return NextResponse.json({ error: "questId required" }, { status: 400 })

    const uq = await prisma.userQuest.findUnique({ where: { userId_questId: { userId: user.id, questId } }, include: { quest: true } })
    if (!uq) return NextResponse.json({ error: "Quest not found" }, { status: 404 })
    if (!uq.completed) return NextResponse.json({ error: "Quest not completed yet" }, { status: 400 })
    // Claim reward — re-check inside transaction to prevent race conditions
    const rewardXp = uq.quest.rewardXp || 50
    let didLevelUp = false
    let newLevel = 1
    let newXp = 0

    await prisma.$transaction(async (tx) => {
      // Re-read inside transaction to prevent duplicate-claim race
      const fresh = await tx.userQuest.findUnique({ where: { id: uq.id } })
      if (!fresh) throw new Error("QUEST_NOT_FOUND")
      if (!fresh.completed) throw new Error("QUEST_NOT_COMPLETED")
      if (fresh.claimed) throw new Error("ALREADY_CLAIMED")
      await tx.userQuest.update({ where: { id: uq.id }, data: { claimed: true } })
      await tx.user.update({ where: { id: user.id }, data: { credits: { increment: uq.quest.rewardCredits } } })
      await tx.creditTransaction.create({
        data: { userId: user.id, amount: uq.quest.rewardCredits, source: "quest", reference: questId },
      })
      // Award XP
      const currentUser = await tx.user.findUnique({ where: { id: user.id }, select: { level: true } })
      if (currentUser) {
        const updatedXp = await tx.user.update({
          where: { id: user.id },
          data: { xp: { increment: rewardXp } },
          select: { xp: true },
        })
        const totalXp = updatedXp.xp
        const info = getLevelInfo(totalXp)
        didLevelUp = info.level > currentUser.level
        newLevel = info.level
        newXp = totalXp
        await tx.user.update({
          where: { id: user.id },
          data: {
            level: info.level,
            xpToNext: info.xpToNext,
            totalQuestsDone: { increment: 1 },
          },
        })
      }
      // Give tazo reward if applicable
      if (uq.quest.rewardTazoId) {
        await tx.userTazo.upsert({
          where: { userId_tazoId: { userId: user.id, tazoId: uq.quest.rewardTazoId } },
          update: { quantity: { increment: 1 } },
          create: { userId: user.id, tazoId: uq.quest.rewardTazoId, quantity: 1 },
        })
      }
    })

    // Refresh progress to trigger any newly completed quests/achievements
    await refreshUserProgress(user.id)

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { credits: true, level: true, xp: true, xpToNext: true },
    })
    return NextResponse.json({
      claimed: true,
      rewardCredits: uq.quest.rewardCredits,
      rewardXp,
      didLevelUp,
      level: newLevel,
      xp: newXp,
      credits: updatedUser?.credits ?? 0,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : ""
    if (msg === "ALREADY_CLAIMED") {
      return NextResponse.json({ error: "Reward already claimed" }, { status: 400 })
    }
    if (msg === "QUEST_NOT_COMPLETED") {
      return NextResponse.json({ error: "Quest not completed yet" }, { status: 400 })
    }
    if (msg === "QUEST_NOT_FOUND") {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 })
    }
    console.error("Quest claim error:", error)
    return NextResponse.json({ error: "Failed to claim reward" }, { status: 500 })
  }
}
