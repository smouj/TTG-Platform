// POST /api/bags/buy — Buy a potato chip bag with credits
import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { db } from "@/lib/db"

const BAG_TYPES: Record<string, { cost: number; bonusChance: number; rareBoost: number }> = {
  standard: { cost: 10, bonusChance: 0.08, rareBoost: 1 },
  premium: { cost: 10, bonusChance: 0.15, rareBoost: 2 },
  mega: { cost: 10, bonusChance: 0.25, rareBoost: 3 },
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { bagType = "standard" } = await request.json().catch(() => ({}))

    const bagConfig = BAG_TYPES[bagType]
    if (!bagConfig) {
      return NextResponse.json({ error: "Invalid bag type" }, { status: 400 })
    }

    // Check credits
    const currentUser = await db.user.findUnique({ where: { id: user.id } })
    if (!currentUser || currentUser.credits < bagConfig.cost) {
      return NextResponse.json({
        error: "Not enough credits",
        required: bagConfig.cost,
        available: currentUser?.credits ?? 0,
      }, { status: 402 })
    }

    // Determine tazo inside (weighted random by rarity)
    const allTazos = await db.tazo.findMany({
      select: { id: true, rarity: true, franchiseId: true },
      where: { sourceStatus: "verified" },
    })

    if (allTazos.length === 0) {
      return NextResponse.json({ error: "No tazos available" }, { status: 500 })
    }

    const rarityWeights: Record<string, number> = {
      common: 50,
      uncommon: 25,
      rare: 15,
      "ultra-rare": 7,
      legendary: 3,
    }

    // Boost rare chances based on bag type
    const boostedWeights = { ...rarityWeights }
    if (bagConfig.rareBoost > 1) {
      for (const key of ["rare", "ultra-rare", "legendary"]) {
        boostedWeights[key] = (boostedWeights[key] || 0) * bagConfig.rareBoost
      }
      boostedWeights.common = Math.max(10, boostedWeights.common - bagConfig.rareBoost * 10)
    }

    // Build weighted pool
    const pool: { id: string; weight: number }[] = []
    for (const t of allTazos) {
      pool.push({ id: t.id, weight: boostedWeights[t.rarity] || 10 })
    }

    const totalWeight = pool.reduce((sum, t) => sum + t.weight, 0)
    let roll = Math.random() * totalWeight
    let selectedId = pool[0].id
    for (const t of pool) {
      roll -= t.weight
      if (roll <= 0) { selectedId = t.id; break }
    }

    // Check bonus tazo
    let bonusTazoId: string | null = null
    if (Math.random() < bagConfig.bonusChance) {
      const bonusRoll = Math.random() * totalWeight
      let bRoll = bonusRoll
      for (const t of pool) {
        bRoll -= t.weight
        if (bRoll <= 0) { bonusTazoId = t.id; break }
      }
    }

    // Deduct credits
    await db.user.update({
      where: { id: user.id },
      data: { credits: { decrement: bagConfig.cost } },
    })

    // Create credit transaction
    await db.creditTransaction.create({
      data: {
        userId: user.id,
        amount: -bagConfig.cost,
        source: "bag_purchase",
        reference: bagType,
      },
    })

    // Create bag purchase
    const purchase = await db.bagPurchase.create({
      data: {
        userId: user.id,
        bagType,
        cost: bagConfig.cost,
        tazoId: selectedId,
        bonusTazo: bonusTazoId,
        opened: false,
      },
    })

    // Get updated credits
    const updated = await db.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    })

    return NextResponse.json({
      bagId: purchase.id,
      bagType,
      cost: bagConfig.cost,
      creditsRemaining: updated?.credits ?? 0,
    })
  } catch (error) {
    console.error("Bag purchase error:", error)
    return NextResponse.json({ error: "Purchase failed" }, { status: 500 })
  }
}
