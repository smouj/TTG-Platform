import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try UUID first, then fall back to number-based lookup
    let tazo = await db.tazo.findUnique({
      where: { id },
      include: {
        franchise: true,
        collection: true,
      },
    })

    if (!tazo) {
      // Try by number (allows /api/tazos/1 instead of /api/tazos/<uuid>)
      tazo = await db.tazo.findFirst({
        where: { number: id },
        include: {
          franchise: true,
          collection: true,
        },
      })
    }

    if (!tazo) {
      return NextResponse.json({ error: 'Tazo not found' }, { status: 404 })
    }

    // Flatten franchise & collection to strings
    const flatTazo = {
      ...tazo,
      franchise: tazo.franchise?.slug || null,
      franchiseName: tazo.franchise?.name || null,
      franchiseColor: tazo.franchise?.color || null,
      franchiseSlug: tazo.franchise?.slug || null,
      collection: tazo.collection?.slug || null,
      collectionName: tazo.collection?.name || null,
      collectionSlug: tazo.collection?.slug || null,
      collectionYear: tazo.collection?.year || null,
    }

    return NextResponse.json({ tazo: flatTazo })
  } catch (error) {
    console.error('Error fetching tazo:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tazo' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    let existing = await db.tazo.findUnique({ where: { id } })
    if (!existing) {
      existing = await db.tazo.findFirst({ where: { number: id } })
    }
    if (!existing) {
      return NextResponse.json({ error: 'Tazo not found' }, { status: 404 })
    }

    const tazo = await db.tazo.update({
      where: { id: existing.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.franchiseId !== undefined && { franchiseId: body.franchiseId }),
        ...(body.collectionId !== undefined && { collectionId: body.collectionId }),
        ...(body.number !== undefined && { number: body.number }),
        ...(body.condition !== undefined && { condition: body.condition }),
        ...(body.physicalType !== undefined && { physicalType: body.physicalType }),
        ...(body.combatType !== undefined && { combatType: body.combatType }),
        ...(body.rarity !== undefined && { rarity: body.rarity }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
        ...(body.skill !== undefined && { skill: body.skill }),
        ...(body.skillDesc !== undefined && { skillDesc: body.skillDesc }),
        ...(body.evolutionFrom !== undefined && { evolutionFrom: body.evolutionFrom }),
        ...(body.evolutionTo !== undefined && { evolutionTo: body.evolutionTo }),
        ...(body.transformStage !== undefined && { transformStage: body.transformStage }),
        ...(body.transformOf !== undefined && { transformOf: body.transformOf }),
        ...(body.attack !== undefined && { attack: body.attack }),
        ...(body.defense !== undefined && { defense: body.defense }),
        ...(body.spin !== undefined && { spin: body.spin }),
        ...(body.weight !== undefined && { weight: body.weight }),
        ...(body.resistance !== undefined && { resistance: body.resistance }),
        ...(body.stability !== undefined && { stability: body.stability }),
        ...(body.bounce !== undefined && { bounce: body.bounce }),
        ...(body.precision !== undefined && { precision: body.precision }),
        ...(body.role !== undefined && { role: body.role }),
        ...(body.control !== undefined && { control: body.control }),
        ...(body.isOwned !== undefined && { isOwned: body.isOwned }),
        ...(body.battleWins !== undefined && { battleWins: body.battleWins }),
        ...(body.battleLosses !== undefined && { battleLosses: body.battleLosses }),
      },
      include: {
        franchise: true,
        collection: true,
      },
    })

    // Flatten franchise & collection to strings
    const flatTazo = {
      ...tazo,
      franchise: tazo.franchise?.slug || null,
      franchiseName: tazo.franchise?.name || null,
      franchiseColor: tazo.franchise?.color || null,
      franchiseSlug: tazo.franchise?.slug || null,
      collection: tazo.collection?.slug || null,
      collectionName: tazo.collection?.name || null,
      collectionSlug: tazo.collection?.slug || null,
      collectionYear: tazo.collection?.year || null,
    }

    return NextResponse.json({ tazo: flatTazo })
  } catch (error) {
    console.error('Error updating tazo:', error)
    return NextResponse.json(
      { error: 'Failed to update tazo' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    let existing = await db.tazo.findUnique({ where: { id } })
    if (!existing) {
      existing = await db.tazo.findFirst({ where: { number: id } })
    }
    if (!existing) {
      return NextResponse.json({ error: 'Tazo not found' }, { status: 404 })
    }

    await db.tazo.delete({ where: { id: existing.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tazo:', error)
    return NextResponse.json(
      { error: 'Failed to delete tazo' },
      { status: 500 }
    )
  }
}
