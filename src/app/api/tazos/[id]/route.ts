import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const tazo = await db.tazo.findUnique({
      where: { id },
      include: {
        franchise: true,
        collection: true,
      },
    })

    if (!tazo) {
      return NextResponse.json({ error: 'Tazo not found' }, { status: 404 })
    }

    return NextResponse.json({ tazo })
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

    const existing = await db.tazo.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Tazo not found' }, { status: 404 })
    }

    const tazo = await db.tazo.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.franchiseId !== undefined && { franchiseId: body.franchiseId }),
        ...(body.collectionId !== undefined && { collectionId: body.collectionId }),
        ...(body.printedNumber !== undefined && { printedNumber: body.printedNumber }),
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
        ...(body.aura !== undefined && { aura: body.aura }),
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

    return NextResponse.json({ tazo })
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

    const existing = await db.tazo.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Tazo not found' }, { status: 404 })
    }

    await db.tazo.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tazo:', error)
    return NextResponse.json(
      { error: 'Failed to delete tazo' },
      { status: 500 }
    )
  }
}
