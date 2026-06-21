import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getLevelInfo, XP_REWARDS } from "@/lib/leveling"
import { getAuthUser } from "@/lib/auth"

const XP_ACTION_REWARDS = {
  battle_win: XP_REWARDS.BATTLE_WIN,
  battle_loss: XP_REWARDS.BATTLE_LOSS,
  bag_opened: XP_REWARDS.BAG_OPENED,
  quest_completed: XP_REWARDS.QUEST_COMPLETED,
  daily_login: XP_REWARDS.DAILY_LOGIN,
  perfect_throw: XP_REWARDS.PERFECT_THROW,
  collect_new_tazo: XP_REWARDS.COLLECT_NEW_TAZO,
  deck_created: XP_REWARDS.DECK_CREATED,
  achievement_unlocked: XP_REWARDS.ACHIEVEMENT_UNLOCKED,
  trade_completed: XP_REWARDS.TRADE_COMPLETED,
} as const

// GET — fetch user level/xp
export async function GET(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { level: true, xp: true, xpToNext: true },
  })

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const info = getLevelInfo(user.xp)
  return NextResponse.json(info)
}

// POST — award XP for an action
export async function POST(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { action } = await req.json().catch(() => ({}))
  if (typeof action !== "string" || !(action in XP_ACTION_REWARDS)) {
    return NextResponse.json({ error: "Invalid XP action" }, { status: 400 })
  }

  const amount = XP_ACTION_REWARDS[action as keyof typeof XP_ACTION_REWARDS]

  // ── Wrap in transaction to prevent XP race conditions ──
  // Increment XP atomically, then calculate level data from the post-increment value.
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.user.findUnique({
      where: { id: session.id },
      select: { id: true, level: true },
    })

    if (!current) return null

    const updatedXp = await tx.user.update({
      where: { id: session.id },
      data: { xp: { increment: amount } },
      select: { xp: true },
    })

    const info = getLevelInfo(updatedXp.xp)
    const didLevelUp = info.level > current.level

    await tx.user.update({
      where: { id: session.id },
      data: {
        level: info.level,
        xpToNext: info.xpToNext,
      },
    })

    return { ...info, xpGained: amount, didLevelUp }
  })

  if (!result) return NextResponse.json({ error: "User not found" }, { status: 404 })

  return NextResponse.json({
    ...result,
    action,
  })
}
