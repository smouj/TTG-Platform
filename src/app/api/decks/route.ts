import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { db } from "@/lib/db"

/** GET /api/decks — List user's decks */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const decks = await db.deck.findMany({
      where: { userId: user.id },
      include: {
        deckTazos: {
          include: {
            tazo: {
              include: { franchise: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      decks: decks.map((d) => ({
        id: d.id,
        name: d.name,
        isActive: d.isActive,
        tazoCount: d.deckTazos.length,
        tazos: d.deckTazos.map((dt) => ({
          id: dt.tazo.id,
          name: dt.tazo.name,
          displayName: dt.tazo.displayName,
          slug: dt.tazo.slug,
          number: dt.tazo.number,
          imageUrl: dt.tazo.imageUrl,
          franchise: dt.tazo.franchise.name,
          franchiseSlug: dt.tazo.franchise.slug,
          attack: dt.tazo.attack,
          defense: dt.tazo.defense,
          spin: dt.tazo.spin,
          weight: dt.tazo.weight,
          aura: dt.tazo.aura,
          control: dt.tazo.control,
        })),
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
    })
  } catch (error) {
    if (error instanceof Response) throw error
    console.error("Decks GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/** POST /api/decks — Create a new deck */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, tazoIds } = await request.json()
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Deck name is required" }, { status: 400 })
    }
    if (!tazoIds || !Array.isArray(tazoIds) || tazoIds.length === 0) {
      return NextResponse.json({ error: "At least one tazo is required" }, { status: 400 })
    }
    if (tazoIds.length > 20) {
      return NextResponse.json({ error: "Maximum 20 tazos per deck" }, { status: 400 })
    }

    // Verify user owns all tazos
    const userTazos = await db.userTazo.findMany({
      where: { userId: user.id, tazoId: { in: tazoIds } },
    })
    const ownedIds = new Set(userTazos.map((ut) => ut.tazoId))
    const notOwned = tazoIds.filter((id: string) => !ownedIds.has(id))
    if (notOwned.length > 0) {
      return NextResponse.json(
        { error: `${notOwned.length} tazo(s) not found in your collection` },
        { status: 400 }
      )
    }

    // Create deck with tazos
    const deck = await db.deck.create({
      data: {
        userId: user.id,
        name: name.trim(),
        isActive: false,
        deckTazos: {
          create: tazoIds.map((tazoId: string) => ({ tazoId })),
        },
      },
      include: {
        deckTazos: {
          include: { tazo: true },
        },
      },
    })

    return NextResponse.json({
      id: deck.id,
      name: deck.name,
      tazoCount: deck.deckTazos.length,
      isActive: deck.isActive,
    })
  } catch (error) {
    if (error instanceof Response) throw error
    console.error("Decks POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
