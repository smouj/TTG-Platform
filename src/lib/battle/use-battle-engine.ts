// ============================================================
// useBattleEngine v5 — Reactive hook for 20-phase Battle FSM
//
// Manages:
//   - Single BattleContext (FSM state)
//   - applyTransition() for all phase changes
//   - Async AI helpers with human-like timing
//   - Input setters (aim, charge, throw)
// ============================================================
"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { ReplayRecorder } from "./replay"
import { createRNG } from "./rng"
import type { TazoCard, MatchConfig, SlamParams, ImpactResult, StakedTazo } from "./game-loop"
import {
  DEFAULT_ARENA_3D, createAirborneTazo, simulateSlam,
  generateAISlam, scoreBettingImpact, checkMatchEnd,
} from "./game-loop"
import {
  createBattleContext, applyTransition, applyScoring,
  buildMatchResult, autoSelectOpponentBet,
  type BattleContext, type BattleEvent,
} from "./state-machine"
import {
  getAITiming, selectAIBet, selectAILauncher,
  simulateAISlam, type AITiming,
} from "./ai-player"
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

  // FSM events
  send: (event: BattleEvent) => boolean
  // Match lifecycle
  startMatch: (config: MatchConfig) => void
  introDone: () => void
  initialHandsDrawn: () => void
  // Betting
  stakePlayer: (tazo: TazoCard, x?: number, z?: number) => void
  aiBet: (tazo: TazoCard) => void
  revealStakes: () => void
  roundStarted: () => void
  turnStarted: () => void
  cardDrawn: () => void
  // Slam
  selectTazo: (tazo: TazoCard) => void
  lockAim: (x: number, z: number) => void
  lockCharge: (level: number) => void
  releaseSlam: () => void
  physicsDone: (result: ImpactResult, staked: StakedTazo[]) => void
  captureResolved: () => void
  scoreUpdated: () => void
  turnOver: () => void
  // End
  forfeit: (who: "player" | "opponent") => void
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
  // AI
  aiChooseBet: () => TazoCard | null
  aiChooseLauncher: () => TazoCard | null
  aiTiming: () => AITiming
  aiSimulateSlam: () => { impact: ImpactResult; launcher: TazoCard; params: SlamParams } | null
  // Persistence + Reset
  saveBattle: (token: string) => Promise<BattlePersistenceResult | null>
  resetToLobby: () => void
  // Replay
  startReplayRecording: (seed?: number) => void
  stopReplayRecording: () => string | null
  recorderRef: React.MutableRefObject<import("./replay").ReplayRecorder | null>
}

const initialUI: Omit<BattleUIState, "ctx"> = {
  slamPhase: "aim", impactMsg: "", showImpact: false, busy: false,
  throwing: null, reticleX: 0, reticleZ: 0, charge: 0,
  tiltDeg: 0, tiltIntensity: 0, spinIntensity: 0,
}

export function useBattleEngine(): BattleEngine {
  const [ctx, setCtx] = useState<BattleContext | null>(null)
  const [uiState, setUIState] = useState<Omit<BattleUIState, "ctx">>({ ...initialUI })

  const ctxRef = useRef(ctx)
  const uiRef = useRef(uiState)
  const modeRef = useRef<"practice" | "pvp_ranked" | "pvp_friend">("practice")
  useEffect(() => { ctxRef.current = ctx }, [ctx])
  useEffect(() => { uiRef.current = uiState }, [uiState])

  // ── Send event through FSM ──
  // CRITICAL: ctxRef MUST be updated synchronously here, not via useEffect.
  // Multiple send() calls in the same synchronous block (e.g., stakePlayer+aiBet)
  // would see stale ctx if the ref only updated in effects.
  const send = useCallback((event: BattleEvent): boolean => {
    if (!ctxRef.current) return false
    const next = applyTransition(ctxRef.current, event)
    if (!next) return false
    ctxRef.current = next  // ← sync update for chain calls
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
    modeRef.current = config.mode
    const newCtx = createBattleContext(config)
    // Immediately transition to match_intro
    const next = applyTransition(newCtx, { type: "START_MATCH" } as BattleEvent)
    setCtx(next || newCtx)
    setUIState({ ...initialUI })
  }, [])

  const introDone = useCallback(() => send({ type: "INTRO_DONE" }), [send])
  const initialHandsDrawn = useCallback(() => send({ type: "INITIAL_HANDS_DRAWN" }), [send])

  // ── Betting flow ──
  const stakePlayer = useCallback((tazo: TazoCard, x?: number, z?: number) => {
    send({ type: "PLAYER_STAKED", tazo, x, z })
  }, [send])

  const aiBet = useCallback((tazo: TazoCard) => {
    send({ type: "AI_STAKED", tazo })
  }, [send])

  const revealStakes = useCallback(() => send({ type: "STAKES_REVEALED" }), [send])
  const roundStarted = useCallback(() => send({ type: "ROUND_STARTED" }), [send])
  const turnStarted = useCallback(() => send({ type: "TURN_STARTED" }), [send])
  const cardDrawn = useCallback(() => send({ type: "CARD_DRAWN" }), [send])

  // ── Slam flow ──
  const selectTazo = useCallback((tazo: TazoCard) => {
    setUIState(s => ({ ...s, throwing: tazo }))
    send({ type: "TAZO_SELECTED", tazo })
  }, [send])

  const lockAim = useCallback((targetX: number, targetZ: number) => {
    send({ type: "AIM_LOCKED", targetX, targetZ })
  }, [send])

  const lockCharge = useCallback((chg: number) => {
    send({ type: "CHARGE_COMPLETE", charge: chg })
  }, [send])

  const releaseSlam = useCallback(() => {
    const u = uiRef.current
    send({
      type: "SLAM_RELEASED",
      params: {
        tazoId: u.throwing?.id || "",
        impactX: u.reticleX,
        impactZ: u.reticleZ,
        verticalForce: u.charge,
        timingAccuracy: 0.7,
        tilt: "flat",
        tiltIntensity: u.tiltIntensity,
        spinIntensity: u.spinIntensity,
        aimPrecision: 0.7,
      },
    })
  }, [send])

  const physicsDone = useCallback((result: ImpactResult, staked: StakedTazo[]) => {
    send({ type: "PHYSICS_DONE", result, staked })
  }, [send])

  const captureResolved = useCallback(() => send({ type: "CAPTURE_RESOLVED" }), [send])
  const scoreUpdated = useCallback(() => send({ type: "SCORE_UPDATED" }), [send])
  const turnOver = useCallback(() => send({ type: "TURN_OVER" }), [send])

  const forfeit = useCallback((who: "player" | "opponent") => {
    send({ type: "FORFEIT", who })
  }, [send])

  // ── AI helpers ──
  const aiChooseBet = useCallback((): TazoCard | null => {
    const c = ctxRef.current
    if (!c) return null
    return selectAIBet(c)
  }, [])

  const aiChooseLauncher = useCallback((): TazoCard | null => {
    const c = ctxRef.current
    if (!c) return null
    return selectAILauncher(c)
  }, [])

  const aiTiming = useCallback((): AITiming => {
    const c = ctxRef.current
    return getAITiming(c?.config.aiDifficulty || "skilled")
  }, [])

  const aiSimulateSlam = useCallback(() => {
    const c = ctxRef.current
    if (!c) return null
    const result = simulateAISlam(c)
    if (!result) return null
    return { impact: result.impact, launcher: result.launcher, params: result.params }
  }, [])

  // ── Persistence ──
  const saveBattle = useCallback(async (token: string) => {
    const c = ctxRef.current
    if (!c) return null
    return await persistBattleResult(c, token, modeRef.current)
  }, [])

  const resetToLobby = useCallback(() => {
    setCtx(null)
    setUIState({ ...initialUI })
  }, [])

  // ── Replay recording ──
  const recorderRef = useRef<ReplayRecorder | null>(null)
  const startReplayRecording = useCallback((seed?: number) => {
    const s = seed ?? Math.floor(Math.random() * 0x7fffffff)
    recorderRef.current = new ReplayRecorder(s)
    recorderRef.current.start()
  }, [])
  const stopReplayRecording = useCallback((): string | null => {
    if (!recorderRef.current) return null
    const data = recorderRef.current.export()
    recorderRef.current = null
    return JSON.stringify(data)
  }, [])

  const sendWithRecord = useCallback((event: BattleEvent, payload?: Record<string, unknown>) => {
    const ok = send(event)
    if (ok) recorderRef.current?.record(event, payload)
    return ok
  }, [send])

  return {
    ctx: ctx ? { ...ctx } : null,
    ui: { ctx: ctx ? { ...ctx } : null, ...uiState },
    send: sendWithRecord,
    startMatch, introDone,
    initialHandsDrawn,
    stakePlayer, aiBet, revealStakes, roundStarted, turnStarted, cardDrawn,
    selectTazo, lockAim, lockCharge, releaseSlam, physicsDone,
    captureResolved, scoreUpdated, turnOver,
    forfeit,
    setReticleX, setReticleZ, setCharge, setTiltDeg, setTiltIntensity, setSpinIntensity,
    setSlamPhase, setImpactMsg, setShowImpact, setBusy,
    aiChooseBet, aiChooseLauncher, aiTiming, aiSimulateSlam,
    saveBattle, resetToLobby,
    startReplayRecording, stopReplayRecording,
    recorderRef,
  }
}
