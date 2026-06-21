// Trading Tazos Game — Buy / Cancel listing
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { sendTransactionalEmailSoon } from '@/lib/email'

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

    // Load the listed UserTazo to get the tazoId (outside txn — read-only)
    const ut = await db.userTazo.findUnique({
      where: { id: listing.userTazoId },
      include: { tazo: true },
    })
    if (!ut) return NextResponse.json({ error: 'Listed tazo no longer exists' }, { status: 410 })
    const seller = await db.user.findUnique({ where: { id: listing.sellerId } })

    // Atomic transaction: re-check status, verify credits, transfer, mark sold, logs
    await db.$transaction(async (tx) => {
      // Re-check listing status inside transaction (prevents race condition)
      const freshListing = await tx.tradeListing.findUnique({ where: { id } })
      if (!freshListing || freshListing.status !== 'active') {
        throw new Error('Listing no longer available')
      }
      if (freshListing.sellerId === authUser.id) {
        throw new Error('SELF_BUY')
      }

      const claim = await tx.tradeListing.updateMany({
        where: { id, status: 'active' },
        data: { status: 'sold', buyerId: authUser.id, soldAt: new Date() },
      })
      if (claim.count !== 1) {
        throw new Error('Listing no longer available')
      }

      const debit = await tx.user.updateMany({
        where: { id: authUser.id, credits: { gte: freshListing.price } },
        data: { credits: { decrement: freshListing.price } },
      })
      if (debit.count !== 1) {
        throw new Error('NOT_ENOUGH_CREDITS')
      }

      // Transfer credits
      await tx.user.update({ where: { id: freshListing.sellerId }, data: { credits: { increment: freshListing.price } } })

      // Transfer tazo ownership
      const existing = await tx.userTazo.findUnique({
        where: { userId_tazoId: { userId: authUser.id, tazoId: ut.tazoId } },
      })
      let buyerUserTazoId: string
      if (existing) {
        const updated = await tx.userTazo.update({ where: { id: existing.id }, data: { quantity: { increment: 1 } } })
        buyerUserTazoId = updated.id
      } else {
        const created = await tx.userTazo.create({
          data: { userId: authUser.id, tazoId: ut.tazoId, quantity: 1, obtainedFrom: 'marketplace' },
        })
        buyerUserTazoId = created.id
      }

      const listedInstance = await tx.tazoInstance.findFirst({
        where: {
          userTazoId: freshListing.userTazoId,
          userId: freshListing.sellerId,
          tazoId: ut.tazoId,
        },
        orderBy: { acquiredAt: 'asc' },
      })
      if (listedInstance) {
        await tx.tazoInstance.update({
          where: { id: listedInstance.id },
          data: { userTazoId: buyerUserTazoId, userId: authUser.id },
        })
      }

      // Transaction logs
      await tx.creditTransaction.create({ data: { userId: authUser.id, amount: -freshListing.price, source: 'marketplace_buy', reference: id } })
      await tx.creditTransaction.create({ data: { userId: freshListing.sellerId, amount: freshListing.price, source: 'marketplace_sell', reference: id } })
    })

    const tazoName = ut.tazo.displayName || ut.tazo.name || ut.tazo.slug
    const buyer = await db.user.findUnique({ where: { id: authUser.id } })
    if (buyer) {
      sendTransactionalEmailSoon({
        template: 'tradeConfirmation',
        to: buyer.email,
        variables: {
          name: buyer.displayName || buyer.name,
          tradeType: 'Marketplace purchase',
          tazoName,
          credits: listing.price,
        },
      })
    }
    if (seller) {
      sendTransactionalEmailSoon({
        template: 'tradeConfirmation',
        to: seller.email,
        variables: {
          name: seller.displayName || seller.name,
          tradeType: 'Marketplace sale',
          tazoName,
          credits: listing.price,
        },
      })
    }

    return NextResponse.json({ message: 'Purchase successful!', listingId: id })
  } catch (error) {
    const msg = error instanceof Error ? error.message : ''
    if (msg === 'NOT_ENOUGH_CREDITS') {
      return NextResponse.json({ error: 'Not enough credits' }, { status: 402 })
    }
    if (msg === 'Listing no longer available') {
      return NextResponse.json({ error: 'Listing no longer available' }, { status: 410 })
    }
    if (msg === 'SELF_BUY') {
      return NextResponse.json({ error: 'Cannot buy your own listing' }, { status: 400 })
    }
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

    // Atomic transaction: re-check status inside txn to prevent race condition
    // where listing is sold between the findUnique and the cancel (counterfeit bug)
    await db.$transaction(async (tx) => {
      const listing = await tx.tradeListing.findUnique({ where: { id } })
      if (!listing || listing.status !== 'active') {
        throw new Error('LISTING_UNAVAILABLE')
      }
      if (listing.sellerId !== authUser.id) {
        throw new Error('NOT_OWNER')
      }
      await tx.tradeListing.update({ where: { id }, data: { status: 'cancelled' } })
      await tx.userTazo.update({ where: { id: listing.userTazoId }, data: { quantity: { increment: 1 } } })
    })

    return NextResponse.json({ message: 'Listing cancelled, tazo returned' })
  } catch (error) {
    const msg = error instanceof Error ? error.message : ''
    if (msg === 'LISTING_UNAVAILABLE') {
      return NextResponse.json({ error: 'Listing no longer available' }, { status: 410 })
    }
    if (msg === 'NOT_OWNER') {
      return NextResponse.json({ error: 'Not your listing' }, { status: 403 })
    }
    console.error('Trade cancel error:', error)
    return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 })
  }
}
