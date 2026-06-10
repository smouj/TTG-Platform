import { checkRateLimit } from "@/lib/rate-limit"

// POST /api/bags/open — Open a purchased bag and reveal the tazo
import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { refreshUserProgress } from "@/lib/progression"

// Randomize stats within ±20% of base values
function randomizeStat(base: number): number {
  const variance = Math.floor(base * 0.2)
  const min = Math.max(10, base - variance)
  const max = Math.min(99, base + variance)
  return min + Math.floor(Math.random() * (max - min + 1))
}

// Pick a random finish weighted by rarity
function randomFinish(rarity: string): string {
  const commonFinishes = ["normal", "matte", "glossy"]
  const uncommonFinishes = [...commonFinishes, "holo", "reverse_holo", "glitter"]
  const rareFinishes = [...uncommonFinishes, "foil", "prismatic", "stardust", "cracked_ice"]
  const ultraFinishes = [...rareFinishes, "metallic", "chrome", "aurora", "oil_slick"]
  const legendFinishes = [...ultraFinishes, "gold", "rainbow", "lenticular", "pearlescent"]

  const pool = rarity === "legendary" ? legendFinishes
    : rarity === "ultra-rare" ? ultraFinishes
    : rarity === "rare" ? rareFinishes
    : rarity === "uncommon" ? uncommonFinishes
    : commonFinishes

  return pool[Math.floor(Math.random() * pool.length)]
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request.headers, "write")
  if (!rl.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } })
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { bagId } = await request.json()

    if (!bagId) {
      return NextResponse.json({ error: "bagId required" }, { status: 400 })
    }

    const purchase = await db.bagPurchase.findUnique({
      where: { id: bagId },
    })

    if (!purchase || purchase.userId !== user.id) {
      return NextResponse.json({ error: "Bag not found" }, { status: 404 })
    }

    if (purchase.opened) {
      return NextResponse.json({ error: "Bag already opened" }, { status: 400 })
    }

    if (!purchase.tazoId) {
      return NextResponse.json({ error: "Bag is empty" }, { status: 500 })
    }

    // Get the revealed tazo
    const tazo = await db.tazo.findUnique({
      where: { id: purchase.tazoId },
      include: { franchise: { select: { name: true, slug: true, color: true } } },
    })

    if (!tazo) {
      return NextResponse.json({ error: "Tazo not found" }, { status: 500 })
    }

    // Auto-mark tazo as owned + add to user collection
    const obtainedFrom = purchase.bagType === "welcome" ? "starter" : "bag"
    const userTazo = await db.userTazo.upsert({
      where: { userId_tazoId: { userId: user.id, tazoId: tazo.id } },
      create: { userId: user.id, tazoId: tazo.id, quantity: 1, obtainedFrom },
      update: { quantity: { increment: 1 } },
    })

    // Create a unique instance with randomized stats
    const finish = randomFinish(tazo.rarity || "common")
    const instance = await db.tazoInstance.create({
      data: {
        userTazoId: userTazo.id,
        userId: user.id,
        tazoId: tazo.id,
        attack: randomizeStat(tazo.attack),
        defense: randomizeStat(tazo.defense),
        resistance: randomizeStat(tazo.resistance),
        weight: randomizeStat(tazo.weight),
        stability: randomizeStat(tazo.stability),
        spin: randomizeStat(tazo.spin),
        control: randomizeStat(tazo.control),
        bounce: randomizeStat(tazo.bounce),
        precision: randomizeStat(tazo.precision),
        finish,
        creatureVariant: tazo.creatureVariant || "standard",
        isNew: true,
      },
    })

    // Set isOwned flag on the tazo itself (auto — no manual toggle)
    await db.tazo.update({
      where: { id: tazo.id },
      data: { isOwned: true },
    })

    // Mark bag as opened
    await db.bagPurchase.update({
      where: { id: bagId },
      data: { opened: true },
    })

    // Handle bonus tazo
    let bonusTazo: typeof tazo | null = null
    if (purchase.bonusTazo) {
      bonusTazo = await db.tazo.findUnique({
        where: { id: purchase.bonusTazo },
        include: { franchise: { select: { name: true, slug: true, color: true } } },
      })
      if (bonusTazo) {
        const bUserTazo = await db.userTazo.upsert({
          where: { userId_tazoId: { userId: user.id, tazoId: bonusTazo.id } },
          create: { userId: user.id, tazoId: bonusTazo.id, quantity: 1, obtainedFrom },
          update: { quantity: { increment: 1 } },
        })
        await db.tazoInstance.create({
          data: {
            userTazoId: bUserTazo.id,
            userId: user.id,
            tazoId: bonusTazo.id,
            attack: randomizeStat(bonusTazo.attack),
            defense: randomizeStat(bonusTazo.defense),
            resistance: randomizeStat(bonusTazo.resistance),
            weight: randomizeStat(bonusTazo.weight),
            stability: randomizeStat(bonusTazo.stability),
            spin: randomizeStat(bonusTazo.spin),
            control: randomizeStat(bonusTazo.control),
            bounce: randomizeStat(bonusTazo.bounce),
            precision: randomizeStat(bonusTazo.precision),
            finish: randomFinish(bonusTazo.rarity || "common"),
            creatureVariant: bonusTazo.creatureVariant || "standard",
            isNew: true,
          },
        })
      }
    }

    await refreshUserProgress(user.id)

    return NextResponse.json({
      tazo: {
        id: tazo.id,
        instanceId: instance.id,
        name: tazo.name,
        displayName: tazo.displayName || tazo.name,
        slug: tazo.slug,
        number: tazo.number,
        franchise: tazo.franchise?.slug || tazo.franchise,
        franchiseName: tazo.franchise?.name || null,
        franchiseSlug: tazo.franchise?.slug || null,
        imageUrl: tazo.imageUrl,
        shinyImageUrl: tazo.shinyImageUrl,
        finish: instance.finish,
        creatureVariant: instance.creatureVariant,
        rarity: tazo.rarity,
        attack: instance.attack,
        defense: instance.defense,
        resistance: instance.resistance,
        weight: instance.weight,
        stability: instance.stability,
        spin: instance.spin,
        control: instance.control,
        bounce: instance.bounce,
        precision: instance.precision,
        role: tazo.role,
        isNew: true,
      },
      bonusTazo: bonusTazo ? {
        id: bonusTazo.id,
        name: bonusTazo.name,
        displayName: bonusTazo.displayName || bonusTazo.name,
        franchise: bonusTazo.franchise,
        rarity: bonusTazo.rarity,
      } : null,
      isBonus: !!bonusTazo,
    })
  } catch (error) {
    console.error("Bag open error:", error)
    return NextResponse.json({ error: "Failed to open bag" }, { status: 500 })
  }
}
