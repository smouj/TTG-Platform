// ============================================================
// useBattleEngine — Reactive hook wrapping the Battle FSM.
//
// Manages:
//   - Single BattleContext (replaces 15+ useState calls)
//   - applyTransition() for all state changes
//   - Async helpers for AI slam + new round setup
//   - Phase-aware helpers (canAim, canCharge, canRelease, etc.)
// ============================================================
"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { TazoCard, MatchConfig, SlamParams, StakedTazo, AirborneTazo, ImpactResult } from "./game-loop"
import {
  DEFAULT_ARENA_3D, createAirborneTazo, placeStakedTazos,
  simulateSlam, generateAISlam, scoreBettingImpact, checkMatchEnd,
  drawHand, coinFlip,
} from "./game-loop"
import {
  createBattleContext, applyTransition,
  applyScoring, buildMatchResult,
  autoSelectOpponentBet,
  type BattleContext, type BattleEvent,
} from "./state-machine"
import { persistBattleResult, type BattlePersistenceResult } from "./battle-integration"

export type SlamPhase = "aim" | "charge" | "tilt"

export interface BattleUIState {
  ctx: BattleContext | null
  slamPhase: SlamPhase
  impactMsg: string
  showImpact: boolean
  busy: boolean
  throwing: TazoCard | null
  reticleX: number
  reticleZ: number
  charge: number
  tiltDeg: number
  tiltIntensity: number
  spinIntensity: number
}

export interface BattleEngine {
  // State
  ctx: BattleContext | null
  ui: BattleUIState

  // Actions
  startMatch: (config: MatchConfig) => void
  introDone: () => void
  startBetting: () => void
  placeBets: (playerTazo: TazoCard, opponentTazo: TazoCard) => void
  revealStakes: () => void
  doCoinFlip: () => "player" | "opponent"
  lockAim: (x: number, z: number) => void
  lockCharge: (level: number) => void
  releaseSlam: () => void
  resolveImpact: (result: ImpactResult, thrower: "player" | "opponent") => void
  showResult: () => void
  nextRound: () => void
  forfeit: (who: "player" | "opponent") => void
  send: (event: any) => boolean

  // Input setters
  setReticleX: (x: number) => void
  setReticleZ: (z: number) => void
  setCharge: (v: number) => void
  setTiltDeg: (v: number) => void
  setTiltIntensity: (v: number) => void
  setSpinIntensity: (v: number) => void
  setSlamPhase: (p: SlamPhase) => void
  setImpactMsg: (msg: string) => void
  setShowImpact: (v: boolean) => void
  setBusy: (v: boolean) => void

  // Persistence
  saveBattle: (token: string) => Promise<BattlePersistenceResult | null>

  // Reset
  resetToLobby: () => void

  // AI helpers
  aiBetTazo: () => TazoCard | null
  aiSlamParams: () => SlamParams | null
  startAIAim: () => void
  doAISlamSequence: (onDone: () => void) => void
}

const initialUI: Omit<BattleUIState, "ctx"> = {
  slamPhase: "aim",
  impactMsg: "",
  showImpact: false,
  busy: false,
  throwing: null,
  reticleX: 0,
  reticleZ: 0,
  charge: 0,
  tiltDeg: 0,
  tiltIntensity: 0,
  spinIntensity: 0,
}

export function useBattleEngine(): BattleEngine {
  const [ctx, setCtx] = useState<BattleContext | null>(null)
  const [uiState, setUIState] = useState<Omit<BattleUIState, "ctx">>({ ...initialUI })

  const ctxRef = useRef(ctx)
  const uiRef = useRef(uiState)
  useEffect(() => { ctxRef.current = ctx }, [ctx])
  useEffect(() => { uiRef.current = uiState }, [uiState])

  // ── Send event through FSM ──
  const send = useCallback((event: BattleEvent) => {
    if (!ctxRef.current) return false
    const next = applyTransition(ctxRef.current, event)
    if (!next) return false
    setCtx(next)
    return true
  }, [])

  // ── UI setters ──
  const setReticleX = useCallback((x: number) => setUIState(s => ({ ...s, reticleX: x })), [])
  const setReticleZ = useCallback((z: number) => setUIState(s => ({ ...s, reticleZ: z })), [])
  const setCharge = useCallback((v: number) => setUIState(s => ({ ...s, charge: v })), [])
  const setTiltDeg = useCallback((v: number) => setUIState(s => ({ ...s, tiltDeg: v })), [])
  const setTiltIntensity = useCallback((v: number) => setUIState(s => ({ ...s, tiltIntensity: v })), [])
  const setSpinIntensity = useCallback((v: number) => setUIState(s => ({ ...s, spinIntensity: v })), [])
  const setSlamPhase = useCallback((p: SlamPhase) => setUIState(s => ({ ...s, slamPhase: p })), [])
  const setImpactMsg = useCallback((msg: string) => setUIState(s => ({ ...s, impactMsg: msg })), [])
  const setShowImpact = useCallback((v: boolean) => setUIState(s => ({ ...s, showImpact: v })), [])
  const setBusy = useCallback((v: boolean) => setUIState(s => ({ ...s, busy: v })), [])

  // ── Match lifecycle ──
  const startMatch = useCallback((config: MatchConfig) => {
    const newCtx = createBattleContext(config)
    setCtx(newCtx)
    setUIState({ ...initialUI })
    // Automatically transition to intro
    setTimeout(() => {
      const c = newCtx
      const next = applyTransition({ ...c, state: "lobby" }, { type: "START_MATCH", config } as BattleEvent)
      if (next) setCtx(next)
    }, 0)
  }, [])

  const introDone = useCallback(() => {
    send({ type: "INTRO_DONE" })
  }, [send])

  const startBetting = useCallback(() => {
    send({ type: "HANDS_DRAWN" })
  }, [send])

  const placeBets = useCallback((playerTazo: TazoCard, opponentTazo: TazoCard) => {
    send({ type: "BETS_PLACED", playerTazo, opponentTazo })
  }, [send])

  const revealStakes = useCallback(() => {
    send({ type: "STAKES_REVEALED" })
  }, [send])

  const doCoinFlip = useCallback((): "player" | "opponent" => {
    const winner = coinFlip()
    send({ type: "COIN_DECIDED", winner })
    return winner
  }, [send])

  const lockAim = useCallback((targetX: number, targetZ: number) => {
    send({ type: "AIM_LOCKED", targetX, targetZ })
  }, [send])

  const lockCharge = useCallback((chg: number) => {
    send({ type: "CHARGE_LOCKED", charge: chg })
  }, [send])

  const releaseSlam = useCallback(() => {
    send({ type: "SLAM_RELEASED", params: {
      tazoId: uiRef.current.throwing?.id || "",
      impactX: uiRef.current.reticleX,
      impactZ: uiRef.current.reticleZ,
      verticalForce: uiRef.current.charge,
      timingAccuracy: 0.7,
      tilt: "flat",
      tiltIntensity: uiRef.current.tiltIntensity,
      spinIntensity: uiRef.current.spinIntensity,
      aimPrecision: 0.7,
    }})
  }, [send])

  const resolveImpact = useCallback((impact: ImpactResult, thrower: "player" | "opponent") => {
    send({ type: "IMPACT_RESOLVED", result: impact })
  }, [send])

  const showResult = useCallback(() => {
    send({ type: "RESULT_SHOWN" })
  }, [send])

  const nextRound = useCallback(() => {
    send({ type: "HAND_DRAWN" })
  }, [send])

  const forfeit = useCallback((who: "player" | "opponent") => {
    send({ type: "FORFEIT", who })
  }, [send])

  // ── Persistence ──
  const saveBattle = useCallback(async (token: string) => {
    const c = ctxRef.current
    if (!c) return null
    return await persistBattleResult(c, token, "practice")
  }, [])

  // ── Reset ──
  const resetToLobby = useCallback(() => {
    setCtx(null)
    setUIState({ ...initialUI })
  }, [])

  // ── AI helpers ──
  const aiBetTazo = useCallback((): TazoCard | null => {
    const c = ctxRef.current
    if (!c) return null
    return autoSelectOpponentBet(c)
  }, [])

  const aiSlamParams = useCallback((): SlamParams | null => {
    const c = ctxRef.current
    if (!c || !c.opponentBetTazo) return null
    return generateAISlam(
      c.opponentBetTazo,
      c.stakedTazos,
      c.config.arena,
      c.config.aiDifficulty
    )
  }, [])

  const startAIAim = useCallback(() => {
    const c = ctxRef.current
    if (!c) return
    send({ type: "COIN_DECIDED", winner: "opponent" })
  }, [send])

  const doAISlamSequence = useCallback((onDone: () => void) => {
    const c = ctxRef.current
    if (!c?.opponentBetTazo) { onDone(); return }

    const aiTazo = c.opponentBetTazo
    setUIState(s => ({ ...s, throwing: aiTazo }))

    // Create airborne tazo for AI
    const aiAirborne = createAirborneTazo(aiTazo, "opponent", c.config.arena)
    aiAirborne.state = "aiming"

    const slam = generateAISlam(
      aiTazo, c.stakedTazos, c.config.arena, c.config.aiDifficulty
    )

    // Simulate AI delay
    setTimeout(() => {
      const c2 = ctxRef.current
      if (!c2) { onDone(); return }

      const updatedAirborne: AirborneTazo = {
        ...aiAirborne,
        state: "charging",
        position: [
          slam.impactX * 0.3,
          c2.config.arena.maxLaunchHeight * (0.2 + slam.verticalForce * 0.8),
          slam.impactZ * 0.3,
        ],
        charge: slam.verticalForce,
        targetX: slam.impactX,
        targetZ: slam.impactZ,
      }

      // Brief charge, then launch
      setTimeout(() => {
        const c3 = ctxRef.current
        if (!c3) { onDone(); return }

        // Impact after gravity
        const fallHeight = c3.config.arena.maxLaunchHeight * (0.2 + slam.verticalForce * 0.8)
        const fallTime = Math.sqrt(2 * fallHeight / c3.config.arena.gravity) * 1000

        setTimeout(() => {
          const c4 = ctxRef.current
          if (!c4) { onDone(); return }

          const { result: impact } = simulateSlam(aiTazo, slam, c4.stakedTazos, c4.config.arena, "opponent")
          const scoring = scoreBettingImpact(impact, "opponent")
          const scored = applyScoring(c4, impact, "opponent")

          setCtx({
            ...scored,
            lastImpact: impact,
          })

          onDone()
        }, fallTime * 0.8)
      }, 800)
    }, 600)
  }, [])

  return {
    ctx: ctx ? { ...ctx } : null,
    ui: { ctx: ctx ? { ...ctx } : null, ...uiState },
    startMatch, introDone, startBetting, placeBets, revealStakes, doCoinFlip,
    lockAim, lockCharge, releaseSlam, resolveImpact, showResult, nextRound, forfeit,
    send,
    setReticleX, setReticleZ, setCharge, setTiltDeg, setTiltIntensity, setSpinIntensity,
    setSlamPhase, setImpactMsg, setShowImpact, setBusy,
    saveBattle, resetToLobby,
    aiBetTazo, aiSlamParams, startAIAim, doAISlamSequence,
  }
}
