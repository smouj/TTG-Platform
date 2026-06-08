import { checkRateLimit } from "@/lib/rate-limit"

// POST /api/bags/open — Open a purchased bag and reveal the tazo
import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { refreshUserProgress } from "@/lib/progression"

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
    await db.userTazo.upsert({
      where: { userId_tazoId: { userId: user.id, tazoId: tazo.id } },
      create: { userId: user.id, tazoId: tazo.id, quantity: 1, obtainedFrom },
      update: { quantity: { increment: 1 } },
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
        await db.userTazo.upsert({
          where: { userId_tazoId: { userId: user.id, tazoId: bonusTazo.id } },
          create: { userId: user.id, tazoId: bonusTazo.id, quantity: 1, obtainedFrom },
          update: { quantity: { increment: 1 } },
        })
      }
    }

    await refreshUserProgress(user.id)

    return NextResponse.json({
      tazo: {
        id: tazo.id,
        name: tazo.name,
        displayName: tazo.displayName || tazo.name,
        slug: tazo.slug,
        franchise: tazo.franchise,
        imageUrl: tazo.imageUrl,
        rarity: tazo.rarity,
        attack: tazo.attack,
        defense: tazo.defense,
        resistance: tazo.resistance,
        weight: tazo.weight,
        stability: tazo.stability,
        spin: tazo.spin,
        control: tazo.control,
        bounce: tazo.bounce,
        precision: tazo.precision,
        role: tazo.role,
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
