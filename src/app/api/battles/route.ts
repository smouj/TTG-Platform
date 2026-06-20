import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser(request).catch(() => null)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const limit = Math.min(Number(url.searchParams.get('limit')) || 20, 50)

  try {
    const battles = await db.battleRecord.findMany({
      where: { userId: authUser.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Parse JSON fields for each battle
    const parsed = battles.map((b) => ({
      ...b,
      playerTazos: b.playerTazos ? safeParse(b.playerTazos) : null,
      opponentTazos: b.opponentTazos ? safeParse(b.opponentTazos) : null,
      battleLog: b.battleLog ? safeParse(b.battleLog) : [],
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

function safeParse(v: string): unknown {
  try { return JSON.parse(v) } catch { return v }
}
