// POST /api/bags/buy — Buy a potato chip bag with credits
import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"

const BAG_TYPES: Record<string, { cost: number; bonusChance: number; rareBoost: number; franchise?: string }> = {
  classic: { cost: 100, bonusChance: 15, rareBoost: 2, franchise: "minimon" },
  premium: { cost: 100, bonusChance: 15, rareBoost: 2, franchise: "cybermon" },
  mega: { cost: 100, bonusChance: 15, rareBoost: 2, franchise: "dracobell" },
  // Legacy aliases
  standard: { cost: 100, bonusChance: 15, rareBoost: 2, franchise: "minimon" },
  legendary: { cost: 100, bonusChance: 15, rareBoost: 2, franchise: "dracobell" },
}

function modelType(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-")
}

function normalizeBonusChance(value: number): number {
  return value > 1 ? value / 100 : value
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request.headers, "write")
  if (!rl.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } })
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { bagType = "standard", quantity = 1 } = await request.json().catch(() => ({}))

    const qty = Math.max(1, Math.min(20, Math.floor(Number(quantity) || 1)))

  const activeModels = await db.bagModel.findMany({
      where: { isActive: true },
    })
    const activeModel = activeModels.find((model) => modelType(model.name) === bagType)
    const bagConfig = activeModel
      ? {
          cost: activeModel.cost,
          bonusChance: activeModel.bonusChance,
          rareBoost: activeModel.rareBoost,
          franchise: activeModel.franchise,
        }
      : BAG_TYPES[bagType]

    if (!bagConfig) {
      return NextResponse.json({ error: "Invalid bag type" }, { status: 400 })
    }

    const totalCost = bagConfig.cost * qty

    // Determine tazo inside (weighted random by rarity)
    const tazoWhere = {
      sourceStatus: "verified",
      ...(bagConfig.franchise ? { franchise: { slug: bagConfig.franchise } } : {}),
    }
    let allTazos = await db.tazo.findMany({
      select: { id: true, rarity: true, franchiseId: true },
      where: tazoWhere,
    })

    if (allTazos.length === 0 && bagConfig.franchise) {
      allTazos = await db.tazo.findMany({
        select: { id: true, rarity: true, franchiseId: true },
        where: { sourceStatus: "verified" },
      })
    }

    if (allTazos.length === 0) {
      return NextResponse.json({ error: "No tazos available" }, { status: 500 })
    }

    const rarityWeights: Record<string, number> = {
      common: 50,
      uncommon: 25,
      rare: 15,
      ultra: 7,
      "ultra-rare": 7,
      legendary: 3,
    }

    // Boost rare chances based on bag type
    const boostedWeights = { ...rarityWeights }
    if (bagConfig.rareBoost > 1) {
      for (const key of ["rare", "ultra", "ultra-rare", "legendary"]) {
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

    // ── Pick a random tazo from the weighted pool ──
    function pickTazo(p: { id: string; weight: number }[], tw: number): string {
      let r = Math.random() * tw
      for (const t of p) { r -= t.weight; if (r <= 0) return t.id }
      return p[0].id
    }

    // Atomic transaction: check credits + deduct + create purchases
    const purchaseIds: string[] = []
    const updated = await db.$transaction(async (tx) => {
      const debit = await tx.user.updateMany({
        where: { id: user.id, credits: { gte: totalCost } },
        data: { credits: { decrement: totalCost } },
      })
      if (debit.count !== 1) return null

      // Create credit transaction
      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          amount: -totalCost,
          source: "bag_purchase",
          reference: `${bagType}${qty > 1 ? ` x${qty}` : ""}`,
        },
      })

      // Create bag purchases (bulk)
      for (let i = 0; i < qty; i++) {
        const selectedId = pickTazo(pool, totalWeight)
        let bonusTazoId: string | null = null
        if (Math.random() < normalizeBonusChance(bagConfig.bonusChance)) {
          bonusTazoId = pickTazo(pool, totalWeight)
        }
        const purchase = await tx.bagPurchase.create({
          data: {
            userId: user.id,
            bagType,
            cost: bagConfig.cost,
            tazoId: selectedId,
            bonusTazo: bonusTazoId,
            opened: false,
          },
        })
        purchaseIds.push(purchase.id)
      }

      // Get updated credits
      return tx.user.findUnique({
        where: { id: user.id },
        select: { credits: true },
      })
    })

    if (!updated) {
      return NextResponse.json({
        error: "Not enough credits",
        required: totalCost,
      }, { status: 402 })
    }

    return NextResponse.json({
      bagIds: purchaseIds,
      bagId: purchaseIds[0], // backward compat
      bagType,
      quantity: qty,
      cost: bagConfig.cost,
      totalCost,
      creditsRemaining: updated?.credits ?? 0,
    })
  } catch (error) {
    console.error("Bag purchase error:", error)
    return NextResponse.json({ error: "Purchase failed" }, { status: 500 })
  }
}
