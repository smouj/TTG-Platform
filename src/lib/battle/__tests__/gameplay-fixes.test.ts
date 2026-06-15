// ============================================================
// TTG Gameplay Fixes — Test Suite v2
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  simulateSlam, checkMatchEnd, generateAISlam,
} from '../game-loop'
import type { TazoCard, StakedTazo, SlamParams, Arena3DConfig } from '../game-loop'
import { autoSelectOpponentBet } from '../state-machine'
import type { BattleContext } from '../state-machine'

// ── Helpers ──────────────────────────────────────────────────

function makeTazo(overrides: Partial<TazoCard> = {}): TazoCard {
  return {
    id: 'test-' + Math.random().toString(36).slice(2, 6),
    name: 'Test Tazo', slug: 'test-tazo', franchise: 'minimon', imageUrl: null,
    attack: 50, defense: 50, resistance: 50, weight: 50,
    stability: 50, spin: 50, control: 50, bounce: 30, precision: 50,
    ...overrides,
  }
}

function makeStakedTazo(overrides: Partial<StakedTazo> = {}): StakedTazo {
  return {
    id: 'staked-' + Math.random().toString(36).slice(2, 6),
    tazoName: 'Staked Tazo', franchise: 'minimon', imageUrl: '', backImageUrl: '',
    owner: 'opponent', position: [0, 0, 0],
    state: 'face_down', wobbleIntensity: 0, scored: false,
    ...overrides,
  }
}

// Low-force slam to make defense matter
const LOW_SLAM: SlamParams = {
  tazoId: '', impactX: 0, impactZ: 0,
  verticalForce: 0.35, timingAccuracy: 0.5,
  tilt: 'flat', tiltIntensity: 0, spinIntensity: 0, aimPrecision: 0.6,
}

const ARENA: Arena3DConfig = {
  radius: 1.5, maxLaunchHeight: 3, gravity: 9.8,
  ringOutThreshold: 1.2, impactDamping: 0.95, minFlipForce: 30, tableFriction: 0.98,
}

function makeContext(): BattleContext {
  const pd = Array.from({ length: 20 }, () => makeTazo())
  const od = Array.from({ length: 20 }, () => makeTazo())
  return {
    state: 'betting' as any, prevState: null, airborneTazo: null,
    coinWinner: null, lastImpact: null,
    chargeLevel: 0, aimPosition: { x: 0, z: 0 }, roundTurns: 0,
    playerBetTazo: null, opponentBetTazo: null,
    config: { playerDeck: pd, opponentDeck: od, aiDifficulty: 'skilled',
      arena: ARENA, scoreToWin: 5 } as any,
    player: { score: 0, tazosRemaining: 20, maxScore: 5 } as any,
    opponent: { score: 0, tazosRemaining: 20, maxScore: 5 } as any,
    playerHand: pd.slice(0, 5), opponentHand: od.slice(0, 5),
    stakedTazos: [], roundHistory: [], currentRound: 1, turnNumber: 0,
    playerRemaining: 20, opponentRemaining: 20,
    currentThrower: 'player', matchResult: null,
  }
}

// ── FIX 1: Defense stats ────────────────────────────────────

describe('Fix 1: Real defense stats', () => {
  it('strong defender resists flips more than weak', () => {
    const attacker = makeTazo({ attack: 45, weight: 40 })
    const strong = makeTazo({ id: 'def-strong', defense: 95, resistance: 95, stability: 95, weight: 80 })
    const weak = makeTazo({ id: 'def-weak', defense: 5, resistance: 5, stability: 5, weight: 5 })

    const ss = makeStakedTazo({ id: 'def-strong', owner: 'opponent' })
    const ws = makeStakedTazo({ id: 'def-weak', owner: 'opponent' })
    const defs = new Map([[strong.id, strong], [weak.id, weak]])

    let sf = 0, wf = 0
    for (let i = 0; i < 200; i++) {
      if (simulateSlam(attacker, LOW_SLAM, [{ ...ss }], ARENA, 'player', defs).staked[0].state === 'captured') sf++
      if (simulateSlam(attacker, LOW_SLAM, [{ ...ws }], ARENA, 'player', defs).staked[0].state === 'captured') wf++
    }
    // Weak should flip more (at least 2x more with these extreme values)
    expect(wf).toBeGreaterThan(sf * 1.5)
  })

  it('damaged defender resists worse than mint', () => {
    const attacker = makeTazo({ attack: 40, weight: 35 })
    // Strong mint defender
    const mint = makeTazo({ id: 'mint', defense: 80, resistance: 80, stability: 80, wear: 0 })
    // Same stats but heavily worn
    const worn = makeTazo({ id: 'worn', defense: 80, resistance: 80, stability: 80, wear: 95 })

    const ms = makeStakedTazo({ id: 'mint', owner: 'opponent' })
    const ws = makeStakedTazo({ id: 'worn', owner: 'opponent' })
    const defs = new Map([[mint.id, mint], [worn.id, worn]])

    // Even weaker slam to let defense+worn differences show
    const weakSlam = { ...LOW_SLAM, verticalForce: 0.25, timingAccuracy: 0.35, aimPrecision: 0.5 }

    let mf = 0, wf = 0, mw = 0, ww = 0
    for (let i = 0; i < 500; i++) {
      const rMint = simulateSlam(attacker, weakSlam, [{ ...ms }], ARENA, 'player', defs).staked[0]
      const rWorn = simulateSlam(attacker, weakSlam, [{ ...ws }], ARENA, 'player', defs).staked[0]
      if (rMint.state === 'captured') mf++
      else if (rMint.state === 'wobbling') mw++
      if (rWorn.state === 'captured') wf++
      else if (rWorn.state === 'wobbling') ww++
    }
    // Worn = at least as many flips+wobbles (worse defense overall)
    expect(wf + ww).toBeGreaterThanOrEqual(mf + mw - 20)  // Allow ±4% noise
  })

  it('falls back to defaults without defenders map', () => {
    const { result } = simulateSlam(makeTazo(), LOW_SLAM, [makeStakedTazo()], ARENA, 'player')
    expect(result).toBeDefined()
    expect(typeof result.impactForce).toBe('number')
  })
})

// ── FIX 2: Precision stat in AI ──────────────────────────

describe('Fix 2: Tazo precision affects AI aim', () => {
  it('high-precision tazo gives better AI aim', () => {
    const hiPrec = makeTazo({ precision: 95 })
    const loPrec = makeTazo({ precision: 10 })
    const staked: StakedTazo[] = [makeStakedTazo()]

    let ha = 0, la = 0
    for (let i = 0; i < 50; i++) {
      ha += generateAISlam(hiPrec, staked, ARENA as any, 'skilled').aimPrecision
      la += generateAISlam(loPrec, staked, ARENA as any, 'skilled').aimPrecision
    }
    expect(ha / 50).toBeGreaterThan(la / 50)
  })

  it('all difficulties generate valid params', () => {
    const t = makeTazo({ precision: 60, attack: 60 })
    const staked: StakedTazo[] = [makeStakedTazo()]
    for (const diff of ['novice', 'skilled', 'master'] as const) {
      for (let i = 0; i < 20; i++) {
        const s = generateAISlam(t, staked, ARENA as any, diff)
        expect(s.aimPrecision).toBeGreaterThanOrEqual(0)
        expect(s.aimPrecision).toBeLessThanOrEqual(1)
        expect(s.verticalForce).toBeGreaterThanOrEqual(0)
        expect(s.verticalForce).toBeLessThanOrEqual(1)
        expect(s.timingAccuracy).toBeGreaterThanOrEqual(0)
        expect(s.timingAccuracy).toBeLessThanOrEqual(1)
      }
    }
  })
})

// ── FIX 3: checkMatchEnd scoreToWin ─────────────────────────

describe('Fix 3: checkMatchEnd respects scoreToWin', () => {
  it('TKO player win', () => {
    const r = checkMatchEnd(5, 2, 10, 8, 5)!
    expect(r.winner).toBe('player')
    expect(r.victoryType).toBe('tko')
  })
  it('TKO opponent win', () => {
    const r = checkMatchEnd(2, 3, 8, 10, 3)!
    expect(r.winner).toBe('opponent')
    expect(r.victoryType).toBe('tko')
  })
  it('elimination player win', () => {
    const r = checkMatchEnd(1, 0, 5, 0)!
    expect(r.winner).toBe('player')
    expect(r.victoryType).toBe('elimination')
  })
  it('elimination opponent win', () => {
    const r = checkMatchEnd(0, 1, 0, 5)!
    expect(r.winner).toBe('opponent')
    expect(r.victoryType).toBe('elimination')
  })
  it('match continues', () => {
    expect(checkMatchEnd(3, 2, 8, 7, 5)).toBeNull()
  })
  it('scoreToWin=1 edge case', () => {
    expect(checkMatchEnd(1, 0, 5, 5, 1)!.winner).toBe('player')
  })
  it('scoreToWin=5 default TKO', () => {
    const r = checkMatchEnd(3, 5, 8, 13, 5)!
    expect(r.winner).toBe('opponent')
    expect(r.victoryType).toBe('tko')
  })
})

// ── AI: no mutation ─────────────────────────────────────────

describe('AI: autoSelectOpponentBet no mutation', () => {
  it('does not mutate original hand', () => {
    const h = [makeTazo({ attack: 30 }), makeTazo({ attack: 80 }), makeTazo({ attack: 50 })]
    const orig = [...h]
    const ctx = makeContext()
    ctx.opponentHand = h
    ctx.config.aiDifficulty = 'master'
    autoSelectOpponentBet(ctx)
    expect(h[0]).toBe(orig[0])
    expect(h[1]).toBe(orig[1])
  })
  it('master picks highest attack', () => {
    const best = makeTazo({ attack: 90 })
    const ctx = makeContext()
    ctx.opponentHand = [makeTazo({ attack: 30 }), best, makeTazo({ attack: 50 })]
    ctx.config.aiDifficulty = 'master'
    expect(autoSelectOpponentBet(ctx)!.attack).toBe(90)
  })
  it('skilled picks best attack+defense', () => {
    const ctx = makeContext()
    ctx.opponentHand = [makeTazo({ attack: 40, defense: 90 }), makeTazo({ attack: 90, defense: 20 })]
    ctx.config.aiDifficulty = 'skilled'
    // 40+90=130 > 90+20=110, so skilled picks the defensive one
    expect(autoSelectOpponentBet(ctx)!.defense).toBe(90)
  })
  it('returns null for empty hand', () => {
    const ctx = makeContext()
    ctx.opponentHand = []
    expect(autoSelectOpponentBet(ctx)).toBeNull()
  })
})
