import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getLevelInfo, xpToNextLevel } from "@/lib/leveling"
import { getAuthUser } from "@/lib/auth"

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

  const { amount, action } = await req.json()
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "Invalid XP amount" }, { status: 400 })
  }

  // ── Wrap in transaction to prevent XP race conditions ──
  // Reads current XP, calculates new values, writes atomically
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.user.findUnique({
      where: { id: session.id },
      select: { id: true, xp: true, level: true, xpToNext: true },
    })

    if (!current) return null

    const newXp = current.xp + amount
    const info = getLevelInfo(newXp)
    const didLevelUp = info.level > current.level

    await tx.user.update({
      where: { id: session.id },
      data: {
        xp: newXp,
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
