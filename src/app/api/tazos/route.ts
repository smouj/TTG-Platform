import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const franchise = searchParams.get('franchise')
    const collection = searchParams.get('collection')
    const rarity = searchParams.get('rarity')
    const condition = searchParams.get('condition')
    const combatType = searchParams.get('combatType')
    const owned = searchParams.get('owned')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    const where: Record<string, unknown> = {}

    if (franchise) {
      where.franchise = { slug: franchise }
    }
    if (collection) {
      where.collection = { slug: collection }
    }
    if (rarity) {
      where.rarity = rarity
    }
    if (condition) {
      where.condition = condition
    }
    if (combatType) {
      where.combatType = combatType
    }
    if (owned !== null && owned !== '') {
      where.isOwned = owned === 'true'
    }
    if (search) {
      where.name = { contains: search }
    }

    const orderBy: Record<string, string> = {}
    if (['name', 'rarity', 'condition', 'attack', 'defense', 'spin', 'weight', 'aura', 'control', 'createdAt'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder === 'desc' ? 'desc' : 'asc'
    } else {
      orderBy.name = 'asc'
    }

    const total = await db.tazo.count({ where })

    const tazos = await db.tazo.findMany({
      where,
      include: {
        franchise: true,
        collection: true,
      },
      orderBy,
    })

    return NextResponse.json({ tazos, total })
  } catch (error) {
    console.error('Error fetching tazos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tazos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const tazo = await db.tazo.create({
      data: {
        name: body.name,
        slug: body.slug,
        franchiseId: body.franchiseId,
        collectionId: body.collectionId,
        printedNumber: body.printedNumber,
        condition: body.condition || 'good',
        physicalType: body.physicalType || 'cardboard',
        combatType: body.combatType,
        rarity: body.rarity || 'common',
        imageUrl: body.imageUrl,
        skill: body.skill,
        skillDesc: body.skillDesc,
        evolutionFrom: body.evolutionFrom,
        evolutionTo: body.evolutionTo,
        transformStage: body.transformStage,
        transformOf: body.transformOf,
        attack: body.attack ?? 50,
        defense: body.defense ?? 50,
        spin: body.spin ?? 50,
        weight: body.weight ?? 50,
        aura: body.aura ?? 50,
        control: body.control ?? 50,
        isOwned: body.isOwned ?? false,
      },
      include: {
        franchise: true,
        collection: true,
      },
    })

    return NextResponse.json({ tazo }, { status: 201 })
  } catch (error) {
    console.error('Error creating tazo:', error)
    return NextResponse.json(
      { error: 'Failed to create tazo' },
      { status: 500 }
    )
  }
}
