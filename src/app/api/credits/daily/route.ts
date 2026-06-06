import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { claimDailyBonus } from "@/lib/progression"

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const existing = await db.creditTransaction.findFirst({
    where: { userId: user.id, source: "daily", createdAt: { gte: today } },
  })

  return NextResponse.json({ claimable: !existing, amount: 25 })
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const result = await claimDailyBonus(user.id, 25)
  const updated = await db.user.findUnique({ where: { id: user.id }, select: { credits: true } })

  if (result.alreadyClaimed) {
    return NextResponse.json({
      error: "Daily bonus already claimed",
      claimed: false,
      claimable: false,
      credits: updated?.credits ?? 0,
    }, { status: 400 })
  }

  return NextResponse.json({
    claimed: true,
    claimable: false,
    amount: result.amount,
    credits: updated?.credits ?? 0,
  })
}
