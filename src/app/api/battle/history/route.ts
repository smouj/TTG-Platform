import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// ── POST: Save battle result (from PvP WebSocket or solo battle) ──
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request).catch(() => null)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { winner, victoryType, score, turns, rounds, playerTazos, opponentTazos, opponentName, battleLog } = body

    // Validate required fields
    if (!winner || !victoryType) {
      return NextResponse.json({ error: 'winner and victoryType required' }, { status: 400 })
    }

    const record = await db.battleRecord.create({
      data: {
        userId: authUser.id,
        winner,
        victoryType,
        opponentName: opponentName || null,
        score: score || '0-0',
        turns: turns || 0,
        rounds: rounds || 0,
        playerTazos: playerTazos ? JSON.stringify(playerTazos) : '[]',
        opponentTazos: opponentTazos ? JSON.stringify(opponentTazos) : '[]',
        battleLog: battleLog ? JSON.stringify(battleLog) : null,
      },
    })

    return NextResponse.json({ success: true, id: record.id }, { status: 201 })
  } catch (error) {
    console.error('Error saving battle result:', error)
    return NextResponse.json({ error: 'Failed to save battle result' }, { status: 500 })
  }
}

// ── GET: Fetch battle history ──
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request).catch(() => null)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const limit = Math.min(Number(url.searchParams.get('limit')) || 20, 50)

    const records = await db.battleRecord.findMany({
      where: { userId: authUser.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Parse JSON fields
    const parsed = records.map(r => ({
      id: r.id,
      winner: r.winner,
      victoryType: r.victoryType,
      score: r.score,
      turns: r.turns,
      rounds: r.rounds,
      playerTazos: safeParse(r.playerTazos),
      opponentTazos: safeParse(r.opponentTazos),
      battleLog: safeParse(r.battleLog),
      createdAt: r.createdAt,
    }))

    // Get stats
    const [wins, losses, draws, total] = await Promise.all([
      db.battleRecord.count({ where: { userId: authUser.id, winner: 'player' } }),
      db.battleRecord.count({ where: { userId: authUser.id, winner: 'opponent' } }),
      db.battleRecord.count({ where: { userId: authUser.id, winner: 'draw' } }),
      db.battleRecord.count({ where: { userId: authUser.id } }),
    ])

    return NextResponse.json({
      battles: parsed,
      stats: { wins, losses, draws, total },
    })
  } catch (error) {
    console.error('Error fetching battle history:', error)
    return NextResponse.json({ error: 'Failed to fetch battle history' }, { status: 500 })
  }
}

function safeParse(v: string | null): unknown {
  if (!v) return null
  try { return JSON.parse(v) } catch { return v }
}
