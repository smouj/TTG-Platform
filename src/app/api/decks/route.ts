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
          where: { tazo: { publishStatus: "published" } },
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
      decks: decks.map((d) => {
        let settingsParsed: Record<string, any> = {}
        try {
          if (d.settings) settingsParsed = JSON.parse(d.settings)
        } catch { /* ignore */ }
        return {
          id: d.id,
          name: d.name,
          isActive: d.isActive,
          color: settingsParsed.color || null,
          starters: settingsParsed.starterIds || [],
          tazoCount: d.deckTazos.length,
          tazos: d.deckTazos
          .filter((dt) => dt.tazo !== null)
          .map((dt) => ({
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
          franchise: dt.tazo.franchise.name,
          franchiseSlug: dt.tazo.franchise.slug,
          attack: dt.tazo.attack,
          defense: dt.tazo.defense,
          resistance: dt.tazo.resistance,
          weight: dt.tazo.weight,
          stability: dt.tazo.stability,
          spin: dt.tazo.spin,
          control: dt.tazo.control,
          bounce: dt.tazo.bounce,
          precision: dt.tazo.precision,
          role: dt.tazo.role,
          stackable: dt.tazo.stackable,
          maxStackOn: dt.tazo.maxStackOn,
        })),
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }
    })
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

    const { name, tazoIds, color, starterIds } = await request.json()
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Tube name is required" }, { status: 400 })
    }
    if (!tazoIds || !Array.isArray(tazoIds) || tazoIds.length === 0) {
      return NextResponse.json({ error: "At least one tazo is required" }, { status: 400 })
    }
    if (tazoIds.length > 20) {
      return NextResponse.json({ error: "Maximum 20 tazos per battle tube" }, { status: 400 })
    }

    // Build settings JSON
    const settings: Record<string, any> = {}
    if (color) settings.color = color
    if (starterIds && Array.isArray(starterIds)) {
      settings.starterIds = starterIds.slice(0, 5)
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
        settings: Object.keys(settings).length > 0 ? JSON.stringify(settings) : null,
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
      color: settings.color || null,
      starters: settings.starterIds || [],
    })
  } catch (error) {
    if (error instanceof Response) throw error
    console.error("Decks POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
