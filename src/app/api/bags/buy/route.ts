// POST /api/bags/buy — Buy a potato chip bag with credits
import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"

const BAG_TYPES: Record<string, { cost: number; bonusChance: number; rareBoost: number; franchise?: string }> = {
  classic: { cost: 10, bonusChance: 15, rareBoost: 2, franchise: "minimon" },
  premium: { cost: 10, bonusChance: 15, rareBoost: 2, franchise: "cybermon" },
  mega: { cost: 10, bonusChance: 15, rareBoost: 2, franchise: "dracobell" },
  // Legacy aliases (from renamed types)
  standard: { cost: 10, bonusChance: 15, rareBoost: 2, franchise: "minimon" },
  legendary: { cost: 10, bonusChance: 15, rareBoost: 2, franchise: "dracobell" },
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

    const { bagType = "standard" } = await request.json().catch(() => ({}))

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

    // Check credits
    const currentUser = await db.user.findUnique({ where: { id: user.id } })
    if (!currentUser || currentUser.credits < bagConfig.cost) {
      return NextResponse.json({
        error: "Not enough credits",
        required: bagConfig.cost,
        available: currentUser?.credits ?? 0,
      }, { status: 402 })
    }

    // Check daily bag opening limit (prevents whale insta-completion)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const bagsOpenedToday = await db.bagPurchase.count({
      where: { userId: user.id, createdAt: { gte: today } },
    })
    const DAILY_BAG_LIMIT = 10
    if (bagsOpenedToday >= DAILY_BAG_LIMIT) {
      return NextResponse.json({
        error: "Daily bag limit reached",
        opened: bagsOpenedToday,
        limit: DAILY_BAG_LIMIT,
      }, { status: 429 })
    }

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
    let roll = Math.random() * totalWeight
    let selectedId = pool[0].id
    for (const t of pool) {
      roll -= t.weight
      if (roll <= 0) { selectedId = t.id; break }
    }

    // Check bonus tazo
    let bonusTazoId: string | null = null
    if (Math.random() < normalizeBonusChance(bagConfig.bonusChance)) {
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
