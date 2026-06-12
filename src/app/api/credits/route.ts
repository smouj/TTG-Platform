// GET /api/credits — Get user credits
// POST /api/credits — Earn credits (from battles, quests, daily bonus)
import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const currentUser = await db.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    })

    return NextResponse.json({
      credits: currentUser?.credits ?? 0,
    })
  } catch {
    return NextResponse.json({ error: "Failed to get credits" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { amount, source, reference } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    if (!source) {
      return NextResponse.json({ error: "source required" }, { status: 400 })
    }

    // Validate source
    const validSources = ["battle_win", "battle_loss", "quest", "daily", "admin", "bag_purchase"]
    if (!validSources.includes(source)) {
      return NextResponse.json({ error: `Invalid source. Must be: ${validSources.join(", ")}` }, { status: 400 })
    }

    // Daily bonus: check cooldown
    if (source === "daily") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayTx = await db.creditTransaction.findFirst({
        where: {
          userId: user.id,
          source: "daily",
          createdAt: { gte: today },
        },
      })
      if (todayTx) {
        return NextResponse.json({ error: "Daily bonus already claimed" }, { status: 400 })
      }
    }

    // Add credits
    await db.user.update({
      where: { id: user.id },
      data: { credits: { increment: amount } },
    })

    // Create transaction
    await db.creditTransaction.create({
      data: { userId: user.id, amount, source, reference },
    })

    const updated = await db.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    })

    return NextResponse.json({
      credits: updated?.credits ?? 0,
      earned: amount,
      source,
    })
  } catch (error) {
    console.error("Credit earn error:", error)
    return NextResponse.json({ error: "Failed to earn credits" }, { status: 500 })
  }
}
