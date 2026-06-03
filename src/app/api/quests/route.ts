// ============================================================
// Trading Tazos Game — Quests API
// GET  /api/quests       — list active quests + user progress
// POST /api/quests/claim — claim quest reward
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { db as prisma } from "@/lib/db"

// ─── GET: List quests ───────────────────────────────────────
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  const quests = await prisma.quest.findMany({ where: { isActive: true }, orderBy: { orderIndex: "asc" } })

  if (!user) {
    // Return quests without progress for guests
    return NextResponse.json({ quests, userQuests: [] })
  }

  // Get user progress
  const userQuests = await prisma.userQuest.findMany({ where: { userId: user.id } })

  // Auto-create userQuest records for any quests user hasn't seen
  const existing = new Set(userQuests.map(uq => uq.questId))
  const newQuests = quests.filter(q => !existing.has(q.id))
  if (newQuests.length > 0) {
    await prisma.userQuest.createMany({
      data: newQuests.map(q => ({ userId: user.id, questId: q.id }))
    })
    const updated = await prisma.userQuest.findMany({ where: { userId: user.id } })
    return NextResponse.json({ quests, userQuests: updated })
  }

  return NextResponse.json({ quests, userQuests })
}

// ─── POST: Claim reward ─────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 })

  const { questId } = await req.json().catch(() => ({}))
  if (!questId) return NextResponse.json({ error: "questId required" }, { status: 400 })

  const uq = await prisma.userQuest.findUnique({ where: { userId_questId: { userId: user.id, questId } }, include: { quest: true } })
  if (!uq) return NextResponse.json({ error: "Quest not found" }, { status: 404 })
  if (!uq.completed) return NextResponse.json({ error: "Quest not completed yet" }, { status: 400 })
  if (uq.claimed) return NextResponse.json({ error: "Reward already claimed" }, { status: 400 })

  // Claim reward
  await prisma.$transaction(async (tx) => {
    await tx.userQuest.update({ where: { id: uq.id }, data: { claimed: true } })
    await tx.user.update({ where: { id: user.id }, data: { credits: { increment: uq.quest.rewardCredits } } })
    await tx.creditTransaction.create({
      data: { userId: user.id, amount: uq.quest.rewardCredits, source: "quest", reference: questId },
    })
    // Give tazo reward if applicable
    if (uq.quest.rewardTazoId) {
      await tx.userTazo.upsert({
        where: { userId_tazoId: { userId: user.id, tazoId: uq.quest.rewardTazoId } },
        update: { quantity: { increment: 1 } },
        create: { userId: user.id, tazoId: uq.quest.rewardTazoId, quantity: 1 },
      })
    }
  })

  const updatedUser = await prisma.user.findUnique({ where: { id: user.id }, select: { credits: true } })
  return NextResponse.json({ claimed: true, rewardCredits: uq.quest.rewardCredits, credits: updatedUser!.credits })
}
