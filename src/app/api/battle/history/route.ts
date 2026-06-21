import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { getLevelInfo } from '@/lib/leveling'
import { NextRequest, NextResponse } from 'next/server'

// ── POST: Save battle result (from PvP WebSocket or solo battle) ──
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request).catch(() => null)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { winner, victoryType, score, turns, rounds, playerTazos, opponentTazos, opponentName, battleLog, idempotencyKey, xpEarned } = body

    // Idempotency: if key provided, store it in battleLog for dedup
    const finalBattleLog = battleLog 
      ? JSON.stringify({ ...(typeof battleLog === 'string' ? JSON.parse(battleLog) : battleLog), idempotencyKey: idempotencyKey || undefined })
      : (idempotencyKey ? JSON.stringify({ idempotencyKey }) : null)

    if (idempotencyKey) {
      const existing = await db.battleRecord.findFirst({
        where: { userId: authUser.id, battleLog: { contains: `"idempotencyKey":"${idempotencyKey}"` } },
      })
      if (existing) {
        return NextResponse.json({ success: true, id: existing.id, deduplicated: true }, { status: 200 })
      }
    }

    // Validate required fields
    if (!winner || !victoryType) {
      return NextResponse.json({ error: 'winner and victoryType required' }, { status: 400 })
    }

    // ── All DB mutations wrapped in $transaction to prevent race conditions ──
    const txResult = await db.$transaction(async (tx) => {
      const record = await tx.battleRecord.create({
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
          battleLog: finalBattleLog,
        },
      })

      // Update cached user stats and atomically apply any battle XP.
      const clampedXpEarned = typeof xpEarned === 'number' && xpEarned > 0 ? Math.min(xpEarned, 500) : 0
      const updatedUser = await tx.user.update({
        where: { id: authUser.id },
        data: {
          totalBattles: { increment: 1 },
          ...(winner === 'player' ? { totalWins: { increment: 1 } } : winner === 'opponent' ? { totalLosses: { increment: 1 } } : {}),
          ...(clampedXpEarned > 0 ? { xp: { increment: clampedXpEarned } } : {}),
        },
        select: { xp: true },
      })

      if (clampedXpEarned > 0) {
        const info = getLevelInfo(updatedUser.xp)
        await tx.user.update({
          where: { id: authUser.id },
          data: {
            level: info.level,
            xpToNext: info.xpToNext,
          },
        })
      }

      // Award credits for win (capped daily) — re-checked inside transaction
      let creditsEarned = 0
      if (winner === 'player') {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const winCount = await tx.creditTransaction.count({
          where: { userId: authUser.id, source: 'battle_win', createdAt: { gte: today } },
        })
        const BATTLE_WIN_CREDITS = 10
        const BATTLE_WIN_DAILY_CAP = 10
        if (winCount < BATTLE_WIN_DAILY_CAP) {
          await tx.user.update({ where: { id: authUser.id }, data: { credits: { increment: BATTLE_WIN_CREDITS } } })
          await tx.creditTransaction.create({
            data: { userId: authUser.id, amount: BATTLE_WIN_CREDITS, source: 'battle_win', reference: `battle_${Date.now()}` },
          })
          creditsEarned = BATTLE_WIN_CREDITS
        }
      } else {
        // Loss consolation
        await tx.user.update({ where: { id: authUser.id }, data: { credits: { increment: 2 } } })
        await tx.creditTransaction.create({
          data: { userId: authUser.id, amount: 2, source: 'battle_loss', reference: `battle_${Date.now()}` },
        })
        creditsEarned = 2
      }

      return { id: record.id, creditsEarned }
    })

    return NextResponse.json({ success: true, id: txResult.id, creditsEarned: txResult.creditsEarned }, { status: 201 })
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
      opponentName: r.opponentName,
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
