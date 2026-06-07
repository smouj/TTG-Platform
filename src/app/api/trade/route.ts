// Trading Tazos Game — Marketplace API
// Uses raw queries for flexibility with evolving TradeListing schema
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/trade — browse active listings with tazo + seller info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get('sellerId')

    // Fetch listings
    const listings = await db.tradeListing.findMany({
      where: { status: 'active', ...(sellerId ? { sellerId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Enrich with tazo + seller data
    const enriched = await Promise.all(listings.map(async (l) => {
      const [seller, ut] = await Promise.all([
        db.user.findUnique({ where: { id: l.sellerId }, select: { id: true, name: true, displayName: true } }),
        db.userTazo.findUnique({
          where: { id: l.userTazoId },
          include: { tazo: {
            select: {
              id: true, name: true, displayName: true, slug: true,
              imageUrl: true, rarity: true, finish: true, creatureVariant: true, shinyImageUrl: true,
              franchise: { select: { name: true, slug: true, color: true } },
              attack: true, defense: true, resistance: true, weight: true,
              stability: true, spin: true, control: true, bounce: true, precision: true,
            },
          }},
        }),
      ])
      return {
        id: l.id,
        price: l.price,
        status: l.status,
        createdAt: l.createdAt,
        seller: seller || { id: l.sellerId, name: 'Unknown', displayName: 'Unknown' },
        userTazo: ut ? { ...ut, tazo: ut.tazo } : null,
      }
    }))

    return NextResponse.json({ listings: enriched })
  } catch (error) {
    console.error('Trade list error:', error)
    return NextResponse.json({ error: 'Failed to load marketplace' }, { status: 500 })
  }
}

// POST /api/trade — create listing
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) return NextResponse.json({ error: 'Login required' }, { status: 401 })

    const { userTazoId, price } = await request.json()
    if (!userTazoId || typeof price !== 'number' || price < 1) {
      return NextResponse.json({ error: 'userTazoId and price (>=1) required' }, { status: 400 })
    }

    const ut = await db.userTazo.findUnique({ where: { id: userTazoId } })
    if (!ut || ut.userId !== authUser.id) {
      return NextResponse.json({ error: 'Tazo not found in your collection' }, { status: 404 })
    }
    if (ut.quantity < 1) {
      return NextResponse.json({ error: 'No copies to sell' }, { status: 400 })
    }

    const existing = await db.tradeListing.findFirst({
      where: { userTazoId, status: 'active', sellerId: authUser.id },
    })
    if (existing) return NextResponse.json({ error: 'Already listed' }, { status: 409 })

    const listing = await db.tradeListing.create({
      data: { sellerId: authUser.id, userTazoId, price, status: 'active' },
    })

    await db.userTazo.update({ where: { id: userTazoId }, data: { quantity: { decrement: 1 } } })

    return NextResponse.json({ listing, message: 'Tazo listed for sale!' }, { status: 201 })
  } catch (error) {
    console.error('Trade create error:', error)
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
  }
}
