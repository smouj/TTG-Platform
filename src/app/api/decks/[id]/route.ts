import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { db } from "@/lib/db"

/** PATCH /api/decks/[id] — Update deck name, tazos, or activate */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const deck = await db.deck.findFirst({ where: { id, userId: user.id } })
    if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 })

    const body = await request.json()

    // Activate deck — deactivate all others
    if (body.isActive === true) {
      await db.deck.updateMany({
        where: { userId: user.id, isActive: true },
        data: { isActive: false },
      })
    }

    // Update name
    if (body.name !== undefined) {
      if (!body.name?.trim()) {
        return NextResponse.json({ error: "Deck name cannot be empty" }, { status: 400 })
      }
      await db.deck.update({ where: { id }, data: { name: body.name.trim() } })
    }

    // Update tazos — replace all
    if (body.tazoIds !== undefined) {
      if (!Array.isArray(body.tazoIds) || body.tazoIds.length === 0) {
        return NextResponse.json({ error: "At least one tazo is required" }, { status: 400 })
      }
      if (body.tazoIds.length > 20) {
        return NextResponse.json({ error: "Maximum 20 tazos per deck" }, { status: 400 })
      }

      // Verify ownership
      const userTazos = await db.userTazo.findMany({
        where: { userId: user.id, tazoId: { in: body.tazoIds } },
      })
      const ownedIds = new Set(userTazos.map((ut) => ut.tazoId))
      const notOwned = body.tazoIds.filter((tid: string) => !ownedIds.has(tid))
      if (notOwned.length > 0) {
        return NextResponse.json(
          { error: `${notOwned.length} tazo(s) not found in your collection` },
          { status: 400 }
        )
      }

      // Replace all deck tazos
      await db.deckTazo.deleteMany({ where: { deckId: id } })
      await db.deckTazo.createMany({
        data: body.tazoIds.map((tazoId: string) => ({ deckId: id, tazoId })),
      })
    }

    // Activate/deactivate
    if (body.isActive !== undefined) {
      await db.deck.update({ where: { id }, data: { isActive: body.isActive } })
    }

    // Return updated deck
    const updated = await db.deck.findUnique({
      where: { id },
      include: {
        deckTazos: {
          include: { tazo: { include: { franchise: true } } },
        },
      },
    })

    return NextResponse.json({
      id: updated!.id,
      name: updated!.name,
      isActive: updated!.isActive,
      tazoCount: updated!.deckTazos.length,
      tazos: updated!.deckTazos.map((dt) => ({
        id: dt.tazo.id,
        name: dt.tazo.name,
        displayName: dt.tazo.displayName,
        imageUrl: dt.tazo.imageUrl,
        franchise: dt.tazo.franchise.name,
        attack: dt.tazo.attack,
        defense: dt.tazo.defense,
      })),
    })
  } catch (error) {
    if (error instanceof Response) throw error
    console.error("Deck PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/** DELETE /api/decks/[id] — Delete a deck */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const deck = await db.deck.findFirst({ where: { id, userId: user.id } })
    if (!deck) return NextResponse.json({ error: "Deck not found" }, { status: 404 })

    await db.deck.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Response) throw error
    console.error("Deck DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
