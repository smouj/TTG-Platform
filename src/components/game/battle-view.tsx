// ============================================================
// Trading Tazos Game — Battle View (Main)
// Full battle experience: tazo selection, arena, aim controls,
// physics simulation, event log, and results.
// ============================================================
"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useI18n } from "@/lib/i18n"
import type { Dictionary } from "@/lib/i18n/types"
import { useAuth } from "@/lib/auth-context"
import {
  createBattleState, startTurn, selectThrower,
  setHorizontalAim, setVerticalAim, setPower, executeThrow,
  opponentPlaceTazo, endTurn, exportReplay, executeAITurn,
} from "@/lib/battle/battle-engine"
import type { BattleState, BattlePhase } from "@/lib/battle"
import BattleStadium3D from "./3d/battle-stadium-3d"
import LaunchControl from "./battle/launch-control"
import BattleEventLog from "./battle/battle-event-log"
import BattleResultPanel from "./battle/battle-result-panel"
import {
  Swords, Play, RotateCcw, ChevronRight,
  Zap, Shield, Star, Disc3, LogIn,
} from "lucide-react"
import Link from "next/link"
import PvPBattlePanel from "./pvp-battle-panel"

// ---- Demo tazos (for unauthenticated users) — 9 stats ----
const DEMO_TAZOS = [
  { id: "demo-1", name: "Mimichu", slug: "demo-mimichu", franchise: "minimon", imageUrl: "/tazos/minimon/minimon-mimichu.svg", attack: 45, defense: 40, resistance: 35, weight: 35, stability: 40, spin: 55, control: 50, bounce: 45, precision: 55 },
  { id: "demo-2", name: "Shadox", slug: "demo-shadox", franchise: "minimon", imageUrl: "/tazos/minimon/minimon-shadox.svg", attack: 65, defense: 60, resistance: 55, weight: 40, stability: 45, spin: 45, control: 55, bounce: 40, precision: 50 },
  { id: "demo-3", name: "Graymech", slug: "demo-graymech", franchise: "cybermon", imageUrl: "/tazos/cybermon/cybermon-graymech.svg", attack: 55, defense: 50, resistance: 45, weight: 55, stability: 50, spin: 45, control: 40, bounce: 35, precision: 40 },
  { id: "demo-4", name: "Archangelon", slug: "demo-archangelon", franchise: "cybermon", imageUrl: "/tazos/cybermon/cybermon-archangelon.svg", attack: 70, defense: 55, resistance: 50, weight: 45, stability: 55, spin: 50, control: 60, bounce: 45, precision: 55 },
  { id: "demo-5", name: "Vexar", slug: "demo-vexar", franchise: "dracobell", imageUrl: "/tazos/dracobell/dracobell-vexar.svg", attack: 60, defense: 45, resistance: 40, weight: 50, stability: 45, spin: 50, control: 45, bounce: 40, precision: 45 },
  { id: "demo-6", name: "Kairo SSJ", slug: "demo-kairo-ssj", franchise: "dracobell", imageUrl: "/tazos/dracobell/dracobell-kairo-ssj.svg", attack: 80, defense: 55, resistance: 50, weight: 55, stability: 55, spin: 65, control: 60, bounce: 50, precision: 55 },
  { id: "demo-7", name: "Phantom", slug: "demo-phantom", franchise: "dracobell", imageUrl: "/tazos/dracobell/dracobell-phantom.svg", attack: 75, defense: 65, resistance: 60, weight: 60, stability: 58, spin: 55, control: 50, bounce: 45, precision: 50 },
]

type TazoCard = { id: string; name: string; slug: string; franchise: string; imageUrl: string | null; attack: number; defense: number; resistance: number; weight: number; stability: number; spin: number; control: number; bounce: number; precision: number; role?: string | null; stackable?: boolean; maxStackOn?: number }

export default function BattleView() {
  const { t } = useI18n()
  const { user, token } = useAuth()
  const [battleMode, setBattleMode] = useState<"practice" | "online">("practice")
  const [playerTazos, setPlayerTazos] = useState<TazoCard[]>([])
  const [opponentTazos, setOpponentTazos] = useState<TazoCard[]>([])
  const [loading, setLoading] = useState(true)
  const [battleState, setBattleState] = useState<BattleState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [capturedIds, setCapturedIds] = useState<string[]>([])
  const [savingCaptures, setSavingCaptures] = useState(false)

  // ---- Load tazos: active deck (auth) or demo (guest) ----
  useEffect(() => {
    async function load() {
      try {
        let myTazos: TazoCard[] = []

        if (user && token) {
          // Authenticated: load active deck
          const deckRes = await fetch("/api/decks", {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (deckRes.ok) {
            const deckData = await deckRes.json()
            const activeDeck = deckData.decks?.find((d: { isActive: boolean }) => d.isActive)
            if (activeDeck && activeDeck.tazos?.length >= 5) {
              myTazos = activeDeck.tazos.map((t: Record<string, unknown>) => ({
                id: t.id as string,
                name: (t.name || t.displayName || "?") as string,
                slug: (t.slug || "") as string,
                franchise: (t.franchiseSlug || "minimon") as string,
                imageUrl: t.imageUrl as string || null,
                attack: t.attack as number,
                defense: t.defense as number,
                resistance: (t as any).resistance || 50,
                weight: (t as any).weight || 50,
                stability: (t as any).stability || 50,
                spin: t.spin as number,
                control: t.control as number,
                bounce: (t as any).bounce || 50,
                precision: (t as any).precision || 50,
                role: (t.role as string) || null,
                stackable: (t.stackable as boolean) ?? true,
                maxStackOn: (t.maxStackOn as number) || 1,
              }))
            }
          }
        }

        // Fallback to demo if no deck or not authenticated
        if (myTazos.length < 5) {
          myTazos = DEMO_TAZOS
        }

        setPlayerTazos(myTazos)

        // Generate AI opponent from API (random cross-franchise tazos)
        const oppRes = await fetch("/api/tazos?sortBy=attack&sortOrder=desc&limit=20")
        if (oppRes.ok) {
          const oppData = await oppRes.json()
          const pool = (oppData.tazos || [])
            .filter((t: Record<string, unknown>) => !myTazos.some(mt => mt.id === t.id))
          const shuffled = pool.sort(() => Math.random() - 0.5)
          const selected = shuffled.slice(0, 7).map((t: Record<string, unknown>) => ({
            id: t.id as string,
            name: (t.name || t.displayName || "?") as string,
            slug: t.slug as string,
            franchise: ((t.franchise as { slug?: string })?.slug || "minimon") as string,
            imageUrl: t.imageUrl as string || null,
            attack: t.attack as number,
            defense: t.defense as number,
            resistance: (t as any).resistance || 50,
            weight: (t as any).weight || 50,
            stability: (t as any).stability || 50,
            spin: t.spin as number,
            control: t.control as number,
            bounce: (t as any).bounce || 50,
            precision: (t as any).precision || 50,
            role: (t.role as string) || null,
            stackable: (t.stackable as boolean) ?? true,
            maxStackOn: (t.maxStackOn as number) || 1,
          }))
          setOpponentTazos(selected.length >= 5 ? selected : DEMO_TAZOS)
        } else {
          setOpponentTazos(DEMO_TAZOS)
        }
      } catch (err) {
        console.error("Failed to load tazos:", err)
        setPlayerTazos(DEMO_TAZOS)
        setOpponentTazos(DEMO_TAZOS)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, token])

  // ---- Start battle ----
  const startBattle = useCallback(() => {
    if (playerTazos.length < 5) {
      setError(t.battle_need_5_tazos)
      return
    }
    setError(null)
    const state = createBattleState(playerTazos, opponentTazos, {
      arena: { radius: 250, centerX: 300, centerY: 300 },
    })
    // Track captured opponent tazos for collection saving
    const oppLookup = new Map(opponentTazos.map(t => [t.id, t]))
    setCapturedIds([])
    // We'll track captures via battle events
    setBattleState(startTurn(state))
  }, [playerTazos, opponentTazos, t.battle_need_5_tazos])

  // ---- Phase handlers ----
  const handleSelectThrower = useCallback((tazoId: string) => {
    if (!battleState) return
    setBattleState(selectThrower(battleState, tazoId))
  }, [battleState])

  const handleHorizontalAim = useCallback((value: number) => {
    if (!battleState) return
    setBattleState(setHorizontalAim(battleState, value))
  }, [battleState])

  const handleVerticalAim = useCallback((value: number) => {
    if (!battleState) return
    setBattleState(setVerticalAim(battleState, value))
  }, [battleState])

  const handlePowerSet = useCallback((value: number) => {
    if (!battleState) return
    const powered = setPower(battleState, value)
    setTimeout(() => {
      setBattleState(executeThrow(powered))
    }, 300)
  }, [battleState])

  const handleArenaClick = useCallback((x: number, y: number) => {
    if (!battleState || battleState.phase !== "opponent_place_penalty") return
    setBattleState(opponentPlaceTazo(battleState, x, y))
  }, [battleState])

  const handleRematch = useCallback(() => {
    setCapturedIds([])
    startBattle()
  }, [startBattle])

  // ---- Derived ----
  const playerHand = useMemo(() =>
    battleState?.player.hand.filter(t => t.state === "in_hand") ?? [],
  [battleState])
  const playerField = useMemo(() =>
    battleState?.player.field.filter(t => t.state === "on_field") ?? [],
  [battleState])

  // ---- Loading ----
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <Disc3 className="w-12 h-12 mx-auto animate-spin text-[#FFCC00]" />
          <p className="font-black text-sm text-[#1a1a1a] uppercase tracking-wider">
            {t.battle_loading}
          </p>
        </div>
      </div>
    )
  }

  // ---- Pre-battle screen ----
  if (!battleState) {
    return (
      <div className="space-y-6">
        {/* Title */}
        <div className="text-center py-6 px-4 bg-[#FFCC00] border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
          <Swords className="w-10 h-10 mx-auto mb-2 text-[#1a1a1a]" />
          <h2 className="text-3xl font-black uppercase tracking-wider text-[#1a1a1a] mag-stroke-sm">
            {t.battle_title}
          </h2>
          <p className="text-sm font-bold text-[#1a1a1a]/70 mt-1">
            {t.battle_tagline}
          </p>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
            <Zap className="w-5 h-5 mb-1 text-[#F59E0B]" />
            <h3 className="font-black text-sm uppercase text-[#1a1a1a]">{t.info_aim_title}</h3>
            <p className="text-xs text-[#1a1a1a]/60 mt-1">{t.info_aim_desc}</p>
          </div>
          <div className="p-4 bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
            <Shield className="w-5 h-5 mb-1 text-[#3B4CCA]" />
            <h3 className="font-black text-sm uppercase text-[#1a1a1a]">{t.info_charge_title}</h3>
            <p className="text-xs text-[#1a1a1a]/60 mt-1">{t.info_charge_desc}</p>
          </div>
          <div className="p-4 bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
            <Star className="w-5 h-5 mb-1 text-[#A855F7]" />
            <h3 className="font-black text-sm uppercase text-[#1a1a1a]">{t.info_capture_title}</h3>
            <p className="text-xs text-[#1a1a1a]/60 mt-1">{t.info_capture_desc}</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-[#E3350D15] border-3 border-[#E3350D] text-center">
            <p className="font-bold text-sm text-[#E3350D]">{error}</p>
          </div>
        )}

        {/* Owned tazos count */}
        <div className="text-center">
          <p className="text-sm font-bold text-[#1a1a1a]/60">
            {playerTazos.length} {t.battle_owned_tazos}
            {playerTazos.length < 5 && ` ${t.battle_need_5_suffix}`}
          </p>
          {!user && (
            <div className="mt-3 p-3 bg-purple-50 border-2 border-purple-200 rounded-lg inline-block">
              <LogIn className="w-4 h-4 inline mr-1 text-purple-500" />
              <Link href="/login" className="text-sm font-bold text-purple-600 hover:text-purple-800 underline">
                {t.auth_login}
              </Link>
              <span className="text-xs text-purple-400 mx-1">{t.auth_no_account}</span>
              <Link href="/register" className="text-sm font-bold text-purple-600 hover:text-purple-800 underline">
                {t.auth_register}
              </Link>
              <p className="text-[10px] text-purple-400 mt-1">
                {t.auth_register_subtitle}
              </p>
            </div>
          )}
        </div>

        {/* Start button */}
        <div className="text-center">
          <button
            onClick={startBattle}
            disabled={playerTazos.length < 5}
            className="px-8 py-4 font-black text-lg uppercase tracking-wider bg-[#E3350D] text-white border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#1a1a1a] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5 inline mr-2" />
            {t.battle_start}
          </button>
        </div>
      </div>
    )
  }

  // ---- Battle finished ----
  if (battleState.phase === "battle_finished" && battleState.finalResult) {
    // Collect captured opponent tazo IDs from battle result
    const playerCapturedList = battleState.finalResult.playerCaptures ?? battleState.player.captured ?? []
    const playerCaptures: { id: string; side?: string }[] = Array.isArray(playerCapturedList) ? playerCapturedList : []
    const captureTazoIds = playerCaptures
      .filter((c) => c.side === "opponent" || opponentTazos.some(o => o.id === c.id))
      .map((c: { id: string }) => c.id)

    const handleSaveCaptures = async () => {
      if (!token || captureTazoIds.length === 0) return
      setSavingCaptures(true)
      for (const tazoId of captureTazoIds) {
        try {
          await fetch("/api/collection", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ tazoId }),
          })
        } catch { /* continue on error */ }
      }
      setSavingCaptures(false)
      setCapturedIds(captureTazoIds)
    }
    return (
      <div className="max-w-md mx-auto space-y-4">
        <BattleResultPanel
          result={battleState.finalResult}
          playerName={t.battle_you}
          opponentName={t.battle_rival}
          onRematch={handleRematch}
        />
        {/* Save captured tazos to collection */}
        {user && captureTazoIds.length > 0 && capturedIds.length < captureTazoIds.length && (
          <div className="text-center">
            <button
              onClick={handleSaveCaptures}
              disabled={savingCaptures}
              className="px-6 py-3 font-black text-sm uppercase tracking-wider bg-[#22C55E] text-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
            >
              {savingCaptures ? t.common_loading : `+${captureTazoIds.length} ${t.battle_captured} ${t.collection_total}`}
            </button>
          </div>
        )}
        {capturedIds.length > 0 && (
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-green-100 border-2 border-green-300 rounded text-xs font-bold text-green-700">
              {capturedIds.length} {t.battle_captured_suffix}
            </span>
          </div>
        )}
        {!user && captureTazoIds.length > 0 && (
          <div className="text-center p-3 bg-purple-50 border-2 border-purple-200 rounded-lg">
            <p className="text-sm font-bold text-purple-700">
              {captureTazoIds.length} {t.battle_captured_suffix}
            </p>
            <Link href="/login" className="text-xs text-purple-500 hover:text-purple-700 underline">
              {t.auth_login} {t.auth_register_subtitle}
            </Link>
          </div>
        )}
        <BattleEventLog turns={battleState.turns} />
      </div>
    )
  }

  // ---- Active battle ----
  const phase = battleState.phase
  const isSelectPhase = phase === "select_thrower" || phase === "turn_start"
  const isAimPhase = phase === "aim_horizontal" || phase === "aim_vertical" || phase === "charge_power"
  const isAnimating = phase === "throwing" || phase === "physics_simulation" ||
    phase === "impact_resolution" || phase === "capture_resolution"
  const isPenalty = phase === "opponent_place_penalty"
  const isTurnEnd = phase === "turn_end"
  const isOpponentTurn = battleState.currentPlayerId === "opponent" &&
    (isSelectPhase || isAimPhase || isAnimating)

  // ─── PvP Online mode ────────────────────────────────
  if (battleMode === "online") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
          <button
            onClick={() => setBattleMode("practice")}
            className="mag-btn text-[10px] font-black uppercase px-3 py-1.5 border-2 border-[#1a1a1a] bg-zinc-100 text-zinc-500 shadow-[2px_2px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            ← {t.common_back || "Back"}
          </button>
          <span className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]">Online PvP</span>
          <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> LIVE
          </span>
        </div>
        <PvPBattlePanel />
      </div>
    )
  }

  // ─── Local Practice mode ─────────────────────────────
  return (
    <div className="h-full flex flex-col">
      {/* Header bar */}
      <div className="flex-shrink-0 flex items-center justify-between p-3 bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBattleMode("online")}
            className="mag-btn flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 border-2 border-[#1a1a1a] bg-[#FFCC00] text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all mr-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Online
          </button>
          <Swords className="w-5 h-5 text-[#E3350D]" />
          <span className="font-black text-sm uppercase tracking-wider text-[#1a1a1a]">
            {t.battle_turn} {battleState.turnNumber}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#3B82F6] uppercase">{t.battle_you}</span>
            <span className="font-black text-sm">{battleState.player.captured.length}</span>
          </div>
          <span className="text-[#1a1a1a]/30 font-bold">-</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#E3350D] uppercase">{t.battle_rival}</span>
            <span className="font-black text-sm">{battleState.opponent.captured.length}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT: Arena */}
        <div className="lg:col-span-2 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0">
          <BattleStadium3D
            playerTazos={battleState.player.field.map((p) => ({
              id: p.id,
              name: p.name,
              franchise: p.franchise || "minimon",
              attack: p.stats.attack,
              defense: p.stats.defense,
            }))}
            opponentTazos={battleState.opponent.field.map((p) => ({
              id: p.id,
              name: p.name,
              franchise: p.franchise || "cybermon",
              attack: p.stats.attack,
              defense: p.stats.defense,
            }))}
            className="flex-1 min-h-0"
          />
          </div>

          {/* Phase indicator */}
          <div className="flex-shrink-0 text-center py-1">
            <span className="inline-block px-3 py-1 font-black text-xs uppercase tracking-wider bg-[#1a1a1a] text-[#FFCC00] border-2 border-[#1a1a1a]">
              {isSelectPhase && t.battle_phase_select}
              {phase === "aim_horizontal" && t.battle_phase_horizontal}
              {phase === "aim_vertical" && t.battle_phase_vertical}
              {phase === "charge_power" && t.battle_phase_charge}
              {isAnimating && t.battle_phase_resolving}
              {isPenalty && t.battle_phase_penalty}
              {isTurnEnd && t.battle_phase_turn_end}
              {isOpponentTurn && t.battle_phase_rival}
            </span>
          </div>
        </div>

        {/* RIGHT: Controls */}
        <div className="min-h-0 overflow-y-auto custom-scrollbar space-y-3">
          {/* Tazo selection */}
          {isSelectPhase && battleState.currentPlayerId === "player" && (
            <div className="p-4 bg-white border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
              <h3 className="font-black text-xs uppercase tracking-wider text-[#1a1a1a] mb-3">
                {t.battle_your_hand} ({playerHand.length} {t.tabStats.toLowerCase()})
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {playerHand.map((tazo) => (
                  <button
                    key={tazo.id}
                    onClick={() => handleSelectThrower(tazo.id)}
                    className="w-full flex items-center gap-3 p-2 border-2 border-[#1a1a1a]/10 rounded hover:border-[#FFCC00] hover:bg-[#FFCB0510] transition-all text-left"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 border-2 border-[#1a1a1a]"
                      style={{
                        background: tazo.franchise === "minimon"
                          ? "linear-gradient(135deg, #FFCB05, #FF8C00)"
                          : tazo.franchise === "cybermon"
                          ? "linear-gradient(135deg, #00A1E9, #0057B7)"
                          : "linear-gradient(135deg, #FF6B00, #CC4400)",
                      }}
                    >
                      <span className="text-white">{tazo.name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-[#1a1a1a] truncate">{tazo.name}</div>
                      <div className="flex gap-1 mt-0.5">
                        <span className="text-[9px] font-bold px-1 bg-[#E3350D15] text-[#E3350D] rounded">
                          {t.tazo_attack} {tazo.stats.attack}
                        </span>
                        <span className="text-[9px] font-bold px-1 bg-[#3B4CCA15] text-[#3B4CCA] rounded">
                          {t.tazo_defense} {tazo.stats.defense}
                        </span>
                        <span className="text-[9px] font-bold px-1 bg-[#F59E0B15] text-[#F59E0B] rounded">
                          {t.tazo_bounce} {tazo.stats.bounce}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#1a1a1a]/30 shrink-0" />
                  </button>
                ))}
              </div>
              {playerHand.length === 0 && (
                <p className="text-xs text-[#1a1a1a]/50 italic text-center py-3">
                  {t.battle_no_tazos_hand}
                </p>
              )}
            </div>
          )}

          {/* Aim controls */}
          {isAimPhase && battleState.currentPlayerId === "player" && (
            <LaunchControl
              phase={phase}
              aimPhase={battleState.aimPhase}
              onHorizontalAim={handleHorizontalAim}
              onVerticalAim={handleVerticalAim}
              onPowerSet={handlePowerSet}
              onThrow={() => {}}
            />
          )}

          {/* Opponent AI turn — auto-resolve after delay */}
          {isOpponentTurn && <AITurnResolver state={battleState} onResolved={setBattleState} t={t} />}

          {/* Turn end — advance to next turn */}
          {isTurnEnd && battleState.currentPlayerId === "player" && (
            <div className="p-4 bg-white border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] text-center space-y-3">
              <p className="font-bold text-sm text-[#1a1a1a]">
                {t.battle_turn} {battleState.turnNumber} {t.battle_turn_complete}
              </p>
              <button
                onClick={() => setBattleState(endTurn({ ...battleState }))}
                className="w-full py-3 font-black text-sm uppercase tracking-wider bg-[#22C55E] text-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                <ChevronRight className="w-4 h-4 inline mr-2" />
                {t.battle_next_turn}
              </button>
            </div>
          )}

          {/* Event log */}
          {battleState.turns.length > 0 && (
            <BattleEventLog turns={battleState.turns} />
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// AITurnResolver — Auto-executes AI opponent turns with delay
// ============================================================
 
function AITurnResolver({
  state,
  onResolved,
  t,
}: {
  state: import("@/lib/battle/battle-engine").BattleState
  onResolved: (s: import("@/lib/battle/battle-engine").BattleState) => void
  t: Dictionary
}) {
  const keyRef = useRef(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const currentKey = ++keyRef.current
    setProgress(0)
    let frame = 0
    const duration = 1500
    const fps = 30
    const step = duration / fps
    
    const interval = setInterval(() => {
      frame++
      const pct = Math.min((frame * step / duration) * 100, 100)
      if (currentKey === keyRef.current) setProgress(pct)
      if (pct >= 100) {
        clearInterval(interval)
        if (currentKey === keyRef.current) {
          try { onResolved(executeAITurn({ ...state })) }
          catch { onResolved(endTurn({ ...state })) }
        }
      }
    }, step)

    return () => clearInterval(interval)
  }, [state.turnNumber, state.currentPlayerId])

  if (progress >= 100) {
    return (
      <div className="p-4 bg-white border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] text-center">
        <Zap className="w-6 h-6 mx-auto mb-1 text-[#22C55E]" />
        <p className="text-xs font-bold text-[#1a1a1a]">{t.battle_next_turn}</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white border-3 border-[#E3350D] shadow-[4px_4px_0px_#1a1a1a] text-center space-y-3">
      <Disc3 className="w-8 h-8 mx-auto animate-spin text-[#E3350D]" />
      <p className="font-black text-xs uppercase tracking-wider text-[#E3350D]">
        {t.battle_rival_throwing}
      </p>
      <div className="w-full h-2 bg-zinc-200 border border-[#1a1a1a]">
        <div
          className="h-full bg-[#E3350D]"
          style={{ width: `${progress}%`, transition: "width 50ms linear" }}
        />
      </div>
    </div>
  )
}
