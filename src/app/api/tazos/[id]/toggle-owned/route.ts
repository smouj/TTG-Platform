import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.tazo.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Tazo not found' }, { status: 404 })
    }

    const tazo = await db.tazo.update({
      where: { id },
      data: { isOwned: !existing.isOwned },
      include: {
        franchise: true,
        collection: true,
      },
    })

    return NextResponse.json({ tazo })
  } catch (error) {
    console.error('Error toggling owned status:', error)
    return NextResponse.json(
      { error: 'Failed to toggle owned status' },
      { status: 500 }
    )
  }
}
