import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { db } from "@/lib/db"

/** GET /api/collection — List user's owned tazos */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const franchise = searchParams.get("franchise")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50), 500)
    const offset = (page - 1) * limit

    const where: any = { userId: user.id }
    if (franchise) {
      where.tazo = { franchise: { slug: franchise } }
    }

    const [items, total] = await Promise.all([
      db.userTazo.findMany({
        where,
        include: {
          tazo: { include: { franchise: true, collection: true } },
        },
        orderBy: { acquiredAt: "desc" },
        skip: offset,
        take: limit,
      }),
      db.userTazo.count({ where }),
    ])

    const summaryItems = await db.userTazo.findMany({
      where,
      select: {
        quantity: true,
        tazo: { select: { franchise: { select: { slug: true } } } },
      },
    })

    // Build franchise summary
    const franchiseSummary = new Map<string, number>()
    for (const ut of summaryItems) {
      const slug = ut.tazo.franchise.slug
      franchiseSummary.set(slug, (franchiseSummary.get(slug) || 0) + ut.quantity)
    }

    return NextResponse.json({
      items: items.map((ut) => ({
        id: ut.id,
        quantity: ut.quantity,
        isFavorite: ut.isFavorite,
        obtainedFrom: ut.obtainedFrom,
        acquiredAt: ut.acquiredAt,
        wear: ut.wear,
        battleCount: ut.battleCount,
        tazo: {
          id: ut.tazo.id,
          name: ut.tazo.name,
          displayName: ut.tazo.displayName,
          slug: ut.tazo.slug,
          number: ut.tazo.number,
          imageUrl: ut.tazo.imageUrl,
          shinyImageUrl: ut.tazo.shinyImageUrl,
          rarity: ut.tazo.rarity,
          finish: ut.tazo.finish,
          creatureVariant: ut.tazo.creatureVariant,
          category: ut.tazo.category,
          franchise: ut.tazo.franchise.name,
          franchiseSlug: ut.tazo.franchise.slug,
          collection: ut.tazo.collection.name,
          attack: ut.tazo.attack,
          defense: ut.tazo.defense,
          resistance: ut.tazo.resistance,
          weight: ut.tazo.weight,
          stability: ut.tazo.stability,
          spin: ut.tazo.spin,
          control: ut.tazo.control,
          bounce: ut.tazo.bounce,
          precision: ut.tazo.precision,
          role: ut.tazo.role,
          battleWins: ut.tazo.battleWins,
          battleLosses: ut.tazo.battleLosses,
        },
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      franchiseSummary: Object.fromEntries(franchiseSummary),
    })
  } catch (error) {
    if (error instanceof Response) throw error
    console.error("Collection GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/** POST /api/collection — Add tazo(s) to user's collection */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { tazoId, quantity = 1 } = await request.json()
    if (!tazoId) {
      return NextResponse.json({ error: "tazoId is required" }, { status: 400 })
    }

    // Verify tazo exists
    const tazo = await db.tazo.findUnique({ where: { id: tazoId } })
    if (!tazo) {
      return NextResponse.json({ error: "Tazo not found" }, { status: 404 })
    }

    // Upsert: add to existing or create new
    const userTazo = await db.userTazo.upsert({
      where: { userId_tazoId: { userId: user.id, tazoId } },
      update: { quantity: { increment: quantity } },
      create: { userId: user.id, tazoId, quantity },
      include: { tazo: true },
    })

    return NextResponse.json({
      id: userTazo.id,
      quantity: userTazo.quantity,
      tazoName: userTazo.tazo.name || userTazo.tazo.displayName || "Unknown",
    })
  } catch (error) {
    if (error instanceof Response) throw error
    console.error("Collection POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/** DELETE /api/collection — Remove tazo from collection */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { userTazoId } = await request.json()
    if (!userTazoId) {
      return NextResponse.json({ error: "userTazoId is required" }, { status: 400 })
    }

    const existing = await db.userTazo.findFirst({
      where: { id: userTazoId, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Tazo not found in your collection" }, { status: 404 })
    }

    await db.userTazo.delete({ where: { id: userTazoId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Response) throw error
    console.error("Collection DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
