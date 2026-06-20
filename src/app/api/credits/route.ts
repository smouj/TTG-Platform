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

    // Atomic transaction: check daily cooldown + add credits + log transaction
    const updated = await db.$transaction(async (tx) => {
      // Daily bonus: check cooldown inside transaction (prevents race condition)
      if (source === "daily") {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayTx = await tx.creditTransaction.findFirst({
          where: {
            userId: user.id,
            source: "daily",
            createdAt: { gte: today },
          },
        })
        if (todayTx) {
          throw new Error("Daily bonus already claimed")
        }
      }

      // Add credits
      await tx.user.update({
        where: { id: user.id },
        data: { credits: { increment: amount } },
      })

      // Create transaction
      await tx.creditTransaction.create({
        data: { userId: user.id, amount, source, reference },
      })

      return tx.user.findUnique({
        where: { id: user.id },
        select: { credits: true },
      })
    })

    return NextResponse.json({
      credits: updated?.credits ?? 0,
      earned: amount,
      source,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Daily bonus already claimed") {
      return NextResponse.json({ error: "Daily bonus already claimed" }, { status: 400 })
    }
    console.error("Credit earn error:", error)
    return NextResponse.json({ error: "Failed to earn credits" }, { status: 500 })
  }
}
