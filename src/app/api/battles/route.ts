import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const battles = await db.battleRecord.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Parse JSON fields for each battle
    const parsed = battles.map((b) => ({
      ...b,
      playerTazos: JSON.parse(b.playerTazos),
      opponentTazos: JSON.parse(b.opponentTazos),
      battleLog: b.battleLog ? JSON.parse(b.battleLog) : [],
    }))

    return NextResponse.json({ battles: parsed })
  } catch (error) {
    console.error('Error fetching battles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch battles' },
      { status: 500 }
    )
  }
}
