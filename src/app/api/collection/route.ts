import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { db } from "@/lib/db"

/** GET /api/collection — List user's owned tazos, or full catalog with ownership */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const franchise = searchParams.get("franchise")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50), 500)
    const offset = (page - 1) * limit
    const includeDecks = searchParams.get("includeDecks") === "true"
    const fullCatalog = searchParams.get("fullCatalog") === "true"

    // Get user's owned tazos (with instances)
    const userTazos = await db.userTazo.findMany({
      where: { userId: user.id },
      include: {
        tazo: { include: { franchise: true, collection: true } },
        instances: { orderBy: { acquiredAt: "desc" } },
      },
      orderBy: { acquiredAt: "desc" },
    })

    // Build ownership map
    const ownedMap = new Map<string, typeof userTazos[0]>()
    for (const ut of userTazos) {
      ownedMap.set(ut.tazoId, ut)
    }

    const mapOwnedTazo = (ut: any) => {
      const newestInstance = ut.instances?.[0]
      return {
        id: ut.id,
        tazoId: ut.tazoId,
        quantity: ut.quantity,
        instances: (ut.instances || []).map((inst: any) => ({
          id: inst.id,
          attack: inst.attack, defense: inst.defense, resistance: inst.resistance,
          weight: inst.weight, stability: inst.stability,
          spin: inst.spin, control: inst.control,
          bounce: inst.bounce, precision: inst.precision,
          finish: inst.finish, creatureVariant: inst.creatureVariant,
          isNew: inst.isNew, acquiredAt: inst.acquiredAt,
          tgaTier: inst.tgaTier, tgaGrade: inst.tgaGrade,
          tgaSurface: inst.tgaSurface, tgaBorders: inst.tgaBorders,
          tgaCertNumber: inst.tgaCertNumber,
        })),
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
          backImageUrl: ut.tazo.backImageUrl,
          shinyImageUrl: ut.tazo.shinyImageUrl,
          rarity: ut.tazo.rarity,
          finish: newestInstance?.finish || ut.tazo.finish,
          creatureVariant: newestInstance?.creatureVariant || ut.tazo.creatureVariant,
          category: ut.tazo.category,
          franchise: ut.tazo.franchise.name,
          franchiseSlug: ut.tazo.franchise.slug,
          collection: ut.tazo.collection.name,
          attack: newestInstance?.attack ?? ut.tazo.attack,
          defense: newestInstance?.defense ?? ut.tazo.defense,
          resistance: newestInstance?.resistance ?? ut.tazo.resistance,
          weight: newestInstance?.weight ?? ut.tazo.weight,
          stability: newestInstance?.stability ?? ut.tazo.stability,
          spin: newestInstance?.spin ?? ut.tazo.spin,
          control: newestInstance?.control ?? ut.tazo.control,
          bounce: newestInstance?.bounce ?? ut.tazo.bounce,
          precision: newestInstance?.precision ?? ut.tazo.precision,
          role: ut.tazo.role,
          battleWins: ut.tazo.battleWins,
          battleLosses: ut.tazo.battleLosses,
        },
      }
    }

    if (fullCatalog) {
      // Return ALL published tazos (with ownership overlay)
      const whereCatalog: any = { publishStatus: "published" }
      if (franchise) whereCatalog.franchise = { slug: franchise }

      const [allTazos, totalAll] = await Promise.all([
        db.tazo.findMany({
          where: whereCatalog,
          include: { franchise: true, collection: true },
          orderBy: { number: "asc" },
          skip: offset,
          take: limit,
        }),
        db.tazo.count({ where: whereCatalog }),
      ])

      const items = allTazos.map(t => {
        const owned = ownedMap.get(t.id)
        return {
          tazoId: t.id,
          isOwned: !!owned,
          quantity: owned?.quantity || 0,
          instances: owned ? (owned.instances || []).map((inst: any) => ({
            id: inst.id,
            attack: inst.attack, defense: inst.defense, resistance: inst.resistance,
            weight: inst.weight, stability: inst.stability,
            spin: inst.spin, control: inst.control,
            bounce: inst.bounce, precision: inst.precision,
            finish: inst.finish, creatureVariant: inst.creatureVariant,
            isNew: inst.isNew, acquiredAt: inst.acquiredAt,
            tgaTier: inst.tgaTier, tgaGrade: inst.tgaGrade,
            tgaSurface: inst.tgaSurface, tgaBorders: inst.tgaBorders,
            tgaCertNumber: inst.tgaCertNumber,
          })) : [],
          isFavorite: owned?.isFavorite || false,
          tazo: {
            id: t.id,
            name: t.name,
            displayName: t.displayName,
            slug: t.slug,
            number: t.number,
            imageUrl: t.imageUrl,
            backImageUrl: t.backImageUrl,
            shinyImageUrl: t.shinyImageUrl,
            rarity: t.rarity,
            finish: t.finish,
            creatureVariant: t.creatureVariant,
            category: t.category,
            franchise: t.franchise.name,
            franchiseSlug: t.franchise.slug,
            collection: t.collection.name,
            attack: t.attack,
            defense: t.defense,
            resistance: t.resistance,
            weight: t.weight,
            stability: t.stability,
            spin: t.spin,
            control: t.control,
            bounce: t.bounce,
            precision: t.precision,
            role: t.role,
            battleWins: t.battleWins,
            battleLosses: t.battleLosses,
          },
        }
      })

      const franchiseSummary = new Map<string, number>()
      for (const ut of userTazos) {
        const slug = ut.tazo.franchise.slug
        franchiseSummary.set(slug, (franchiseSummary.get(slug) || 0) + ut.quantity)
      }

      const response: any = {
        items,
        total: totalAll,
        totalOwned: userTazos.length,
        totalUnique: ownedMap.size,
        page, limit,
        totalPages: Math.ceil(totalAll / limit),
        franchiseSummary: Object.fromEntries(franchiseSummary),
      }

      if (includeDecks) {
        response.decks = await fetchUserDecks(user.id)
      }

      return NextResponse.json(response)
    }

    // Legacy mode: only owned tazos
    const where: any = { userId: user.id }
    if (franchise) {
      where.tazo = { franchise: { slug: franchise } }
    }

    const [items, total, uniqueCount] = await Promise.all([
      db.userTazo.findMany({
        where,
        include: {
          tazo: { include: { franchise: true, collection: true } },
          instances: { orderBy: { acquiredAt: "desc" } },
        },
        orderBy: { acquiredAt: "desc" },
        skip: offset,
        take: limit,
      }),
      db.userTazo.count({ where }),
      db.userTazo.groupBy({ by: ["tazoId"], where }).then(r => r.length),
    ])

    const summaryItems = await db.userTazo.findMany({
      where,
      select: {
        quantity: true,
        tazo: { select: { franchise: { select: { slug: true } } } },
      },
    })

    const franchiseSummary = new Map<string, number>()
    for (const ut of summaryItems) {
      const slug = ut.tazo.franchise.slug
      franchiseSummary.set(slug, (franchiseSummary.get(slug) || 0) + ut.quantity)
    }

    const response: any = {
      items: items.map(mapOwnedTazo),
      total,
      totalUnique: uniqueCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      franchiseSummary: Object.fromEntries(franchiseSummary),
    }

    if (includeDecks) {
      response.decks = await fetchUserDecks(user.id)
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof Response) throw error
    console.error("Collection GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function fetchUserDecks(userId: string) {
  const userDecks = await db.deck.findMany({
    where: { userId },
    include: {
      deckTazos: {
        include: { tazo: { include: { franchise: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  })
  return userDecks.map((d: any) => ({
    id: d.id,
    name: d.name,
    isActive: d.isActive,
    color: d.settings ? (JSON.parse(d.settings).color || null) : null,
    starterIds: d.settings ? (JSON.parse(d.settings).starterIds || []) : [],
    tazos: d.deckTazos.map((dt: any) => ({
      id: dt.tazo.id,
      name: dt.tazo.name,
      displayName: dt.tazo.displayName,
      slug: dt.tazo.slug,
      number: dt.tazo.number,
      imageUrl: dt.tazo.imageUrl,
      shinyImageUrl: dt.tazo.shinyImageUrl,
      rarity: dt.tazo.rarity,
      finish: dt.tazo.finish,
      creatureVariant: dt.tazo.creatureVariant,
      franchiseSlug: dt.tazo.franchise?.slug,
      attack: dt.tazo.attack,
      defense: dt.tazo.defense,
      resistance: dt.tazo.resistance,
      weight: dt.tazo.weight,
      stability: dt.tazo.stability,
      spin: dt.tazo.spin,
      control: dt.tazo.control,
      bounce: dt.tazo.bounce,
      precision: dt.tazo.precision,
    })),
  }))
}

// Replace the old mapTazo helper and deck section below (keep POST + DELETE as-is)
// Delete old mapTazo/deck code from here down
const _PRESERVE_POST_DELETE_BELOW = true

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
