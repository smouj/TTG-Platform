import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { refreshUserProgress } from '@/lib/progression'
import { NextRequest, NextResponse } from 'next/server'

// ── Quest progression: increment any quest with battle requirements ──
async function progressBattleQuests(userId: string) {
  try {
    const quests = await db.quest.findMany({ where: { requirement: { in: ['battle_played', 'battle_won', 'battles_played', 'battles_won'] } } })
    for (const q of quests) {
      const uq = await db.userQuest.findUnique({ where: { userId_questId: { userId, questId: q.id } } })
      if (uq && !uq.completed) {
        const newProgress = uq.progress + 1
        const completed = newProgress >= q.target
        await db.userQuest.update({
          where: { id: uq.id },
          data: { progress: newProgress, completed, completedAt: completed ? new Date() : null },
        })
      }
    }
  } catch { /* non-critical */ }
}

// --- Type advantage table for Minimon-style combat ---
const TYPE_ADVANTAGES: Record<string, string[]> = {
  fire: ['grass'],
  water: ['fire'],
  grass: ['water'],
  electric: ['water'],
  psychic: ['ghost'],
  ghost: [], // ghost doesn't beat normal; normal negated against ghost
  dragon: ['dragon'],
  normal: [],
}

interface BattleTazo {
  id: string
  name: string | null
  displayName: string | null
  franchise: { name: string; slug: string; mechanic?: string | null }
  collectionId: string
  combatType: string | null
  evolutionFrom: string | null
  evolutionTo: string | null
  transformStage: string | null
  transformOf: string | null
  attack: number
  defense: number
  resistance: number
  weight: number
  stability: number
  spin: number
  control: number
  bounce: number
  precision: number
  role: string | null
  hp: number
  currentSpin: number
  ki: number
  typeMultiplier: number
  evoBonus: number
  transformActive: boolean
}

interface BattleEvent {
  round: number
  type: 'attack' | 'defense' | 'spin_decay' | 'ring_out_check' | 'type_advantage' | 'evolution_boost' | 'transform' | 'ki_charge' | 'knockout' | 'ring_out' | 'spin_out' | 'skill'
  description: string
  actor: 'player' | 'opponent'
}

function createBattleTazo(raw: {
  id: string
  name: string | null
  displayName: string | null
  franchise: { name: string; slug: string; mechanic?: string | null; color?: string; icon?: string | null; description?: string | null; id?: string; createdAt?: Date; updatedAt?: Date }
  collectionId: string
  combatType: string | null
  evolutionFrom: string | null
  evolutionTo: string | null
  transformStage: string | null
  transformOf: string | null
  attack: number
  defense: number
  resistance: number
  weight: number
  stability: number
  spin: number
  control: number
  bounce: number
  precision: number
  role: string | null
}): BattleTazo {
  return {
    ...raw,
    hp: 100 + raw.defense + Math.floor(raw.resistance * 0.4),
    currentSpin: raw.spin,
    ki: 0,
    typeMultiplier: 1.0,
    evoBonus: 0,
    transformActive: false,
  }
}

function checkTypeAdvantage(
  attackerType: string | null,
  defenderType: string | null
): number {
  if (!attackerType || !defenderType) return 1.0
  const advantages = TYPE_ADVANTAGES[attackerType]
  if (advantages && advantages.includes(defenderType)) return 1.5
  // Ghost vs normal: negated (half damage)
  if (attackerType === 'ghost' && defenderType === 'normal') return 0.5
  if (defenderType === 'ghost' && attackerType === 'normal') return 0.5
  return 1.0
}

function checkEvolutionChain(
  tazos: BattleTazo[]
): { bonus: number; hasChain: boolean } {
  // Check if multiple tazos form an evolution line
  const evoTazos = tazos.filter(
    (t) => t.evolutionFrom !== null || t.evolutionTo !== null
  )
  if (evoTazos.length < 2) return { bonus: 0, hasChain: false }

  // Check for linked evolution lines
  const ids = new Set(tazos.map((t) => t.id))
  const linkedPairs = evoTazos.filter(
    (t) =>
      (t.evolutionFrom && ids.has(t.evolutionFrom)) ||
      (t.evolutionTo && ids.has(t.evolutionTo))
  )

  if (linkedPairs.length >= 2) {
    return { bonus: 15, hasChain: true }
  }
  return { bonus: 0, hasChain: false }
}

function checkTransform(
  tazo: BattleTazo,
  round: number
): { transformed: boolean; stage: string | null } {
  if (!tazo.transformStage || tazo.franchise.slug !== 'dracobell') {
    return { transformed: false, stage: null }
  }
  // Dracobell: Can transform after charging enough ki (round 3+)
  if (round >= 3 && tazo.ki >= 30 && !tazo.transformActive) {
    return { transformed: true, stage: tazo.transformStage }
  }
  return { transformed: false, stage: null }
}

function simulateRound(
  playerTazos: BattleTazo[],
  opponentTazos: BattleTazo[],
  round: number,
  events: BattleEvent[]
): { playerAlive: boolean; opponentAlive: boolean } {
  // --- Franchise-specific mechanics ---

  // 1. Minimon type advantages
  for (const tazo of playerTazos) {
    if (tazo.franchise.slug === 'minimon' && tazo.combatType) {
      for (const opp of opponentTazos) {
        if (opp.hp <= 0) continue
        const mult = checkTypeAdvantage(tazo.combatType, opp.combatType)
        if (mult !== tazo.typeMultiplier) {
          tazo.typeMultiplier = mult
          if (mult > 1) {
            events.push({
              round,
              type: 'type_advantage',
              description: `${tazo.name}'s ${tazo.combatType} type is super effective against ${opp.name}'s ${opp.combatType}!`,
              actor: 'player',
            })
          } else if (mult < 1) {
            events.push({
              round,
              type: 'type_advantage',
              description: `${tazo.name}'s ${tazo.combatType} type is not very effective against ${opp.name}'s ${opp.combatType}...`,
              actor: 'player',
            })
          }
        }
      }
    }
  }

  for (const tazo of opponentTazos) {
    if (tazo.franchise.slug === 'minimon' && tazo.combatType) {
      for (const pl of playerTazos) {
        if (pl.hp <= 0) continue
        const mult = checkTypeAdvantage(tazo.combatType, pl.combatType)
        if (mult !== tazo.typeMultiplier) {
          tazo.typeMultiplier = mult
          if (mult > 1) {
            events.push({
              round,
              type: 'type_advantage',
              description: `${tazo.name}'s ${tazo.combatType} type is super effective against ${pl.name}'s ${pl.combatType}!`,
              actor: 'opponent',
            })
          }
        }
      }
    }
  }

  // 2. Cybermon evolution chain bonus
  const playerEvo = checkEvolutionChain(playerTazos)
  if (playerEvo.hasChain) {
    for (const t of playerTazos) {
      t.evoBonus = playerEvo.bonus
    }
    events.push({
      round,
      type: 'evolution_boost',
      description: `Cybermon evolution chain detected! Player tazos gain +${playerEvo.bonus} to all stats!`,
      actor: 'player',
    })
  }

  const opponentEvo = checkEvolutionChain(opponentTazos)
  if (opponentEvo.hasChain) {
    for (const t of opponentTazos) {
      t.evoBonus = opponentEvo.bonus
    }
    events.push({
      round,
      type: 'evolution_boost',
      description: `Cybermon evolution chain detected! Opponent tazos gain +${opponentEvo.bonus} to all stats!`,
      actor: 'opponent',
    })
  }

  // 3. Dracobell transformations & ki charge
  for (const tazo of [...playerTazos, ...opponentTazos]) {
    if (tazo.franchise.slug === 'dracobell') {
      // Charge ki
      const kiGain = Math.floor((tazo.precision + tazo.control) * 0.15) + Math.floor(Math.random() * 10)
      tazo.ki += kiGain
      const actor = playerTazos.includes(tazo) ? 'player' : 'opponent'
      events.push({
        round,
        type: 'ki_charge',
        description: `${tazo.name} charges ${kiGain} ki! (Total: ${tazo.ki})`,
        actor,
      })

      // Check for transformation
      const transformResult = checkTransform(tazo, round)
      if (transformResult.transformed) {
        tazo.transformActive = true
        tazo.attack += 20
        tazo.defense += 10
        tazo.precision += 15
        events.push({
          round,
          type: 'transform',
          description: `${tazo.name} transforms into ${transformResult.stage}! Stats boosted!`,
          actor,
        })
      }
    }
  }

  // --- Spin decay ---
  for (const tazo of [...playerTazos, ...opponentTazos]) {
    if (tazo.hp <= 0) continue
    const decay = Math.floor(Math.random() * 8) + 2
    tazo.currentSpin = Math.max(0, tazo.currentSpin - decay)
    const actor = playerTazos.includes(tazo) ? 'player' : 'opponent'
    events.push({
      round,
      type: 'spin_decay',
      description: `${tazo.name}'s spin decays by ${decay}. Spin: ${tazo.currentSpin}`,
      actor,
    })
  }

  // --- Collision phase ---
  // Player attacks opponent
  for (const pTazo of playerTazos) {
    if (pTazo.hp <= 0) continue
    // Pick a random alive opponent
    const aliveOpps = opponentTazos.filter((t) => t.hp > 0)
    if (aliveOpps.length === 0) break
    const target = aliveOpps[Math.floor(Math.random() * aliveOpps.length)]

    const effectiveAttack =
      (pTazo.attack + pTazo.evoBonus) * pTazo.typeMultiplier
    const effectiveDefense = target.defense + target.evoBonus
    const damage = Math.max(
      1,
      Math.floor(
        (effectiveAttack - effectiveDefense * 0.5) *
          (0.8 + Math.random() * 0.4)
      )
    )
    target.hp -= damage

    events.push({
      round,
      type: 'attack',
      description: `${pTazo.name} slams into ${target.name} for ${damage} damage! (HP: ${Math.max(0, target.hp)})`,
      actor: 'player',
    })

    if (target.hp <= 0) {
      events.push({
        round,
        type: 'knockout',
        description: `${target.name} is knocked out!`,
        actor: 'player',
      })
    }
  }

  // Opponent attacks player
  for (const oTazo of opponentTazos) {
    if (oTazo.hp <= 0) continue
    const alivePlrs = playerTazos.filter((t) => t.hp > 0)
    if (alivePlrs.length === 0) break
    const target = alivePlrs[Math.floor(Math.random() * alivePlrs.length)]

    const effectiveAttack =
      (oTazo.attack + oTazo.evoBonus) * oTazo.typeMultiplier
    const effectiveDefense = target.defense + target.evoBonus
    const damage = Math.max(
      1,
      Math.floor(
        (effectiveAttack - effectiveDefense * 0.5) *
          (0.8 + Math.random() * 0.4)
      )
    )
    target.hp -= damage

    events.push({
      round,
      type: 'attack',
      description: `${oTazo.name} slams into ${target.name} for ${damage} damage! (HP: ${Math.max(0, target.hp)})`,
      actor: 'opponent',
    })

    if (target.hp <= 0) {
      events.push({
        round,
        type: 'knockout',
        description: `${target.name} is knocked out!`,
        actor: 'opponent',
      })
    }
  }

  // --- Ring-out checks ---
  for (const tazo of [...playerTazos, ...opponentTazos]) {
    if (tazo.hp <= 0) continue
    const ringOutChance =
      tazo.currentSpin < 15
        ? 0.3
        : tazo.currentSpin < 30
          ? 0.15
          : tazo.weight < 30
            ? 0.1
            : 0.03
    const actor = playerTazos.includes(tazo) ? 'player' : 'opponent'

    events.push({
      round,
      type: 'ring_out_check',
      description: `${tazo.name} ring-out chance: ${Math.floor(ringOutChance * 100)}%`,
      actor,
    })

    if (Math.random() < ringOutChance) {
      tazo.hp = 0
      events.push({
        round,
        type: 'ring_out',
        description: `${tazo.name} flies out of the ring! Ring-out!`,
        actor,
      })
    }
  }

  const playerAlive = playerTazos.some((t) => t.hp > 0)
  const opponentAlive = opponentTazos.some((t) => t.hp > 0)

  return { playerAlive, opponentAlive }
}

export async function POST(request: NextRequest) {
  try {
    // Try to get auth user for credit rewards (optional — battles work without auth too)
    const authUser = await getAuthUser(request).catch(() => null)

    const body = await request.json()
    const { playerTazoIds, opponentTazoIds, physicsResult } = body as {
      playerTazoIds: string[]
      opponentTazoIds: string[]
      physicsResult?: { winner: string; playerScore: number; opponentScore: number; captures: number; ringOuts: number; flips: number; totalTurns: number }
    }

    if (
      !playerTazoIds ||
      !opponentTazoIds ||
      !Array.isArray(playerTazoIds) ||
      !Array.isArray(opponentTazoIds) ||
      playerTazoIds.length === 0 ||
      opponentTazoIds.length === 0
    ) {
      return NextResponse.json(
        { error: 'playerTazoIds and opponentTazoIds must be non-empty arrays' },
        { status: 400 }
      )
    }

    // Load tazos with franchise info
    const allIds = [...playerTazoIds, ...opponentTazoIds]
    const rawTazos = await db.tazo.findMany({
      where: { id: { in: allIds } },
      include: { franchise: true },
    })

    if (rawTazos.length !== allIds.length) {
      const foundIds = new Set(rawTazos.map((t) => t.id))
      const missing = allIds.filter((id) => !foundIds.has(id))
      return NextResponse.json(
        { error: `Tazos not found: ${missing.join(', ')}` },
        { status: 404 }
      )
    }

    const rawById = new Map(rawTazos.map((t) => [t.id, t]))

    const playerTazos = playerTazoIds
      .map((id) => rawById.get(id)!)
      .map(createBattleTazo)
    const opponentTazos = opponentTazoIds
      .map((id) => rawById.get(id)!)
      .map(createBattleTazo)
    let winner: 'player' | 'opponent' | 'draw' = 'draw'

    // --- If client sent 3D physics results, skip RPG simulation ---
    if (physicsResult) {
      winner = physicsResult.winner as 'player' | 'opponent' | 'draw'
      // Save battle record with physics data
      if (authUser) {
        await db.battleRecord.create({
          data: {
            userId: authUser.id,
            playerTazos: JSON.stringify(playerTazoIds),
            opponentTazos: JSON.stringify(opponentTazoIds),
            winner: winner === 'player' ? 'player' : winner === 'opponent' ? 'opponent' : 'draw',
            score: `${physicsResult.playerScore}-${physicsResult.opponentScore}`,
            turns: physicsResult.totalTurns,
            victoryType: winner === 'player' ? 'physics_arena' : winner === 'opponent' ? 'defeat' : 'draw',
            battleLog: JSON.stringify({ physics: physicsResult }),
          },
        })
        // Award credits for win
        if (winner === 'player') {
          await db.user.update({ where: { id: authUser.id }, data: { credits: { increment: 30 } } })
          await db.creditTransaction.create({
            data: {
              userId: authUser.id,
              amount: 30,
              source: 'battle_win',
              reference: `battle_${Date.now()}`,
            },
          })
        }

        // ── Increment wear on player's tazos used in battle ──
        const won = winner === 'player'
        for (const tazoId of playerTazoIds) {
          try {
            const ut = await db.userTazo.findUnique({ where: { userId_tazoId: { userId: authUser.id, tazoId } } })
            if (ut) {
              const wearGain = won ? 1 + Math.floor(Math.random() * 3) : 2 + Math.floor(Math.random() * 4)
              const newWear = Math.min(100, ut.wear + wearGain)
              await db.userTazo.update({
                where: { id: ut.id },
                data: { wear: newWear, battleCount: { increment: 1 } },
              })
            }
          } catch { /* wear tracking non-critical */ }
        }

        // ── Trigger quest progression ──
        await refreshUserProgress(authUser.id)
        const u = await db.user.findUnique({ where: { id: authUser.id }, select: { credits: true } })
        return NextResponse.json({
          winner, victoryType: 'physics_arena', rounds: physicsResult.totalTurns,
          battleLog: [{ physics: physicsResult }],
          creditsEarned: winner === 'player' ? 30 : 0,
          credits: u?.credits ?? null,
        })
      }
      // Guest: just record the match, no credits
      return NextResponse.json({
        winner, victoryType: 'physics_arena', rounds: physicsResult.totalTurns,
        battleLog: [{ physics: physicsResult }],
        creditsEarned: 0, credits: null,
      })
    }

    // --- Battle simulation (RPG fallback) ---
    const battleLog: BattleEvent[] = []
    const maxRounds = 10
    let rounds = 0
    let victoryType: string | null = null

    for (let round = 1; round <= maxRounds; round++) {
      rounds = round
      const result = simulateRound(playerTazos, opponentTazos, round, battleLog)

      if (!result.playerAlive && !result.opponentAlive) {
        winner = 'draw'
        victoryType = 'double knockout'
        break
      }
      if (!result.opponentAlive) {
        winner = 'player'
        // Determine victory type
        const lastKo = [...battleLog]
          .reverse()
          .find((e) => e.type === 'knockout' && e.actor === 'player')
        const lastRingOut = [...battleLog]
          .reverse()
          .find((e) => e.type === 'ring_out' && e.actor === 'opponent')
        const lastSpinOut = [...battleLog]
          .reverse()
          .find(
            (e) =>
              e.type === 'spin_decay' &&
              e.description.includes('Spin: 0')
          )

        if (lastRingOut) {
          victoryType = 'ring-out'
        } else if (lastSpinOut) {
          victoryType = 'spin-out'
        } else {
          victoryType = 'knockout'
        }
        break
      }
      if (!result.playerAlive) {
        winner = 'opponent'
        const lastRingOut = [...battleLog]
          .reverse()
          .find((e) => e.type === 'ring_out' && e.actor === 'player')
        const lastSpinOut = [...battleLog]
          .reverse()
          .find(
            (e) =>
              e.type === 'spin_decay' &&
              e.description.includes('Spin: 0')
          )

        if (lastRingOut) {
          victoryType = 'ring-out'
        } else if (lastSpinOut) {
          victoryType = 'spin-out'
        } else {
          victoryType = 'knockout'
        }
        break
      }

      // Check for spin-out: all tazos on one side have 0 spin
      const playerAllSpunOut = playerTazos.every((t) => t.currentSpin <= 0 && t.hp > 0)
      const opponentAllSpunOut = opponentTazos.every((t) => t.currentSpin <= 0 && t.hp > 0)

      if (playerAllSpunOut && opponentAllSpunOut) {
        winner = 'draw'
        victoryType = 'spin-out'
        break
      }
      if (opponentAllSpunOut) {
        winner = 'player'
        victoryType = 'spin-out'
        break
      }
      if (playerAllSpunOut) {
        winner = 'opponent'
        victoryType = 'spin-out'
        break
      }
    }

    // If max rounds reached, determine winner by remaining HP
    if (rounds === maxRounds && winner === 'draw') {
      const playerHp = playerTazos.reduce((sum, t) => sum + Math.max(0, t.hp), 0)
      const opponentHp = opponentTazos.reduce((sum, t) => sum + Math.max(0, t.hp), 0)

      if (playerHp > opponentHp) {
        winner = 'player'
        victoryType = 'combo'
      } else if (opponentHp > playerHp) {
        winner = 'opponent'
        victoryType = 'combo'
      } else {
        victoryType = 'draw'
      }

      battleLog.push({
        round: maxRounds,
        type: 'skill',
        description: `Max rounds reached! Player HP: ${playerHp}, Opponent HP: ${opponentHp}. ${winner === 'draw' ? "It's a draw!" : `${winner} wins by combo!`}`,
        actor: winner === 'player' ? 'player' : winner === 'opponent' ? 'opponent' : 'player',
      })
    }

    // Update battle records on tazos
    for (const t of playerTazos) {
      if (winner === 'player') {
        await db.tazo.update({ where: { id: t.id }, data: { battleWins: { increment: 1 } } })
      } else if (winner === 'opponent') {
        await db.tazo.update({ where: { id: t.id }, data: { battleLosses: { increment: 1 } } })
      }
    }
    for (const t of opponentTazos) {
      if (winner === 'opponent') {
        await db.tazo.update({ where: { id: t.id }, data: { battleWins: { increment: 1 } } })
      } else if (winner === 'player') {
        await db.tazo.update({ where: { id: t.id }, data: { battleLosses: { increment: 1 } } })
      }
    }

    // Save battle record
    await db.battleRecord.create({
      data: {
        userId: authUser?.id,
        playerTazos: JSON.stringify(playerTazoIds),
        opponentTazos: JSON.stringify(opponentTazoIds),
        winner,
        victoryType,
        rounds,
        battleLog: JSON.stringify(battleLog),
      },
    })

    // Award credits for authenticated winner
    if (authUser && winner === 'player') {
      try {
        await db.user.update({
          where: { id: authUser.id },
          data: { credits: { increment: 30 } },
        })
        await db.creditTransaction.create({
          data: {
            userId: authUser.id,
            amount: 30,
            source: 'battle_win',
            reference: `battle_${Date.now()}`,
          },
        })
      } catch (_) { /* credits are non-critical */ }
    }

    if (authUser) {
      await refreshUserProgress(authUser.id)
    }

    // Get updated credits if authed
    let credits: number | null = null
    if (authUser) {
      try {
        const u = await db.user.findUnique({ where: { id: authUser.id }, select: { credits: true } })
        credits = u?.credits ?? null
      } catch (_) { }
    }

    // Format tazos for response (strip runtime battle fields)
    const formatTazo = (t: BattleTazo) => ({
      id: t.id,
      name: t.name,
      franchise: t.franchise,
      combatType: t.combatType,
      attack: t.attack,
      defense: t.defense,
      spin: t.spin,
      weight: t.weight,
      resistance: t.resistance,
      stability: t.stability,
      control: t.control,
      bounce: t.bounce,
      precision: t.precision,
      role: t.role,
      hp: Math.max(0, t.hp),
      currentSpin: t.currentSpin,
      ki: t.ki,
    })

    return NextResponse.json({
      winner,
      victoryType,
      rounds,
      battleLog,
      playerTazos: playerTazos.map(formatTazo),
      opponentTazos: opponentTazos.map(formatTazo),
      creditsEarned: (authUser && winner === 'player') ? 30 : 0,
      credits,
    })
  } catch (error) {
    console.error('Error simulating battle:', error)
    return NextResponse.json(
      { error: 'Failed to simulate battle' },
      { status: 500 }
    )
  }
}
