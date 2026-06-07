// Trading Tazos Game — Buy / Cancel listing
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/trade/[id] — buy
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) return NextResponse.json({ error: 'Login required' }, { status: 401 })

    const { id } = await params
    const listing = await db.tradeListing.findUnique({ where: { id } })
    if (!listing || listing.status !== 'active') {
      return NextResponse.json({ error: 'Listing not found or sold' }, { status: 404 })
    }
    if (listing.sellerId === authUser.id) {
      return NextResponse.json({ error: 'Cannot buy your own listing' }, { status: 400 })
    }

    const buyer = await db.user.findUnique({ where: { id: authUser.id } })
    if (!buyer || buyer.credits < listing.price) {
      return NextResponse.json({ error: 'Not enough credits' }, { status: 402 })
    }

    // Load the listed UserTazo to get the tazoId
    const ut = await db.userTazo.findUnique({ where: { id: listing.userTazoId } })
    if (!ut) return NextResponse.json({ error: 'Listed tazo no longer exists' }, { status: 410 })

    // Transfer credits
    await db.user.update({ where: { id: authUser.id }, data: { credits: { decrement: listing.price } } })
    await db.user.update({ where: { id: listing.sellerId }, data: { credits: { increment: listing.price } } })

    // Transfer tazo ownership
    const existing = await db.userTazo.findUnique({
      where: { userId_tazoId: { userId: authUser.id, tazoId: ut.tazoId } },
    })
    if (existing) {
      await db.userTazo.update({ where: { id: existing.id }, data: { quantity: { increment: 1 } } })
    } else {
      await db.userTazo.create({
        data: { userId: authUser.id, tazoId: ut.tazoId, quantity: 1, obtainedFrom: 'marketplace' },
      })
    }

    // Mark sold
    await db.tradeListing.update({
      where: { id }, data: { status: 'sold', buyerId: authUser.id, soldAt: new Date() },
    })

    // Transaction logs
    await db.creditTransaction.create({ data: { userId: authUser.id, amount: -listing.price, source: 'marketplace_buy', reference: id } })
    await db.creditTransaction.create({ data: { userId: listing.sellerId, amount: listing.price, source: 'marketplace_sell', reference: id } })

    return NextResponse.json({ message: 'Purchase successful!', listingId: id })
  } catch (error) {
    console.error('Trade buy error:', error)
    return NextResponse.json({ error: 'Failed to complete purchase' }, { status: 500 })
  }
}

// DELETE /api/trade/[id] — cancel
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) return NextResponse.json({ error: 'Login required' }, { status: 401 })

    const { id } = await params
    const listing = await db.tradeListing.findUnique({ where: { id } })
    if (!listing || listing.status !== 'active') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (listing.sellerId !== authUser.id) return NextResponse.json({ error: 'Not your listing' }, { status: 403 })

    await db.tradeListing.update({ where: { id }, data: { status: 'cancelled' } })
    await db.userTazo.update({ where: { id: listing.userTazoId }, data: { quantity: { increment: 1 } } })

    return NextResponse.json({ message: 'Listing cancelled, tazo returned' })
  } catch (error) {
    console.error('Trade cancel error:', error)
    return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 })
  }
}
