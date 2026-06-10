import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { db } from "@/lib/db"

/** PATCH /api/decks/[id] — Update deck name, tazos, settings, or activate */
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

    // Update settings (color, textureUrl, tubeSlug, starterIds)
    if (body.color !== undefined || body.textureUrl !== undefined || body.tubeSlug !== undefined || body.starterIds !== undefined) {
      let settingsParsed: Record<string, any> = {}
      try {
        if (deck.settings) settingsParsed = JSON.parse(deck.settings)
      } catch { /* ignore */ }
      if (body.color !== undefined) settingsParsed.color = body.color
      if (body.textureUrl !== undefined) settingsParsed.textureUrl = body.textureUrl
      if (body.tubeSlug !== undefined) settingsParsed.tubeSlug = body.tubeSlug
      if (body.starterIds !== undefined) {
        settingsParsed.starterIds = (body.starterIds || []).slice(0, 5)
      }
      await db.deck.update({
        where: { id },
        data: { settings: JSON.stringify(settingsParsed) },
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
          where: { tazo: { publishStatus: "published" } },
          include: { tazo: { include: { franchise: true } } },
        },
      },
    })

    return NextResponse.json({
      id: updated!.id,
      name: updated!.name,
      isActive: updated!.isActive,
      color: (() => { try { return updated!.settings ? JSON.parse(updated!.settings).color || null : null } catch { return null } })(),
      textureUrl: (() => { try { return updated!.settings ? JSON.parse(updated!.settings).textureUrl || null : null } catch { return null } })(),
      tubeSlug: (() => { try { return updated!.settings ? JSON.parse(updated!.settings).tubeSlug || null : null } catch { return null } })(),
      starters: (() => { try { return updated!.settings ? JSON.parse(updated!.settings).starterIds || [] : [] } catch { return [] } })(),
      tazoCount: updated!.deckTazos.length,
      tazos: updated!.deckTazos
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
