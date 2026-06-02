import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const franchises = await db.franchise.findMany({
      include: {
        collections: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ franchises })
  } catch (error) {
    console.error('Error fetching franchises:', error)
    return NextResponse.json(
      { error: 'Failed to fetch franchises' },
      { status: 500 }
    )
  }
}
