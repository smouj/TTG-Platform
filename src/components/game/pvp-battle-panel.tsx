// ============================================================
// Trading Tazos Game — PvP Battle Panel
// Online matchmaking + real-time turn-based battle via WebSocket.
// ============================================================
"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import { useMultiplayer } from "@/lib/multiplayer"
import {
  createBattleState, selectThrower,
  setHorizontalAim, setVerticalAim, setPower, executeThrow,
  endTurn, exportReplay,
} from "@/lib/battle/battle-engine"
import type { BattleState, BattlePhase } from "@/lib/battle"
import BattleArenaCanvas from "./battle/battle-arena-canvas"
import LaunchControl from "./battle/launch-control"
import BattleEventLog from "./battle/battle-event-log"
import BattleResultPanel from "./battle/battle-result-panel"
import {
  Swords, Users, Clock, Loader2, Wifi, WifiOff,
  Trophy, X, Zap, Shield, Star, Disc3, ChevronRight
} from "lucide-react"
import Link from "next/link"

const DEMO_TAZOS = [
  { id: "opp-1", name: "Goku SSJ", slug: "opp-goku", franchise: "dbz", imageUrl: "/tazos/dbz/dbz-goku-ssj.svg", attack: 80, defense: 55, resistance: 50, weight: 55, stability: 55, spin: 65, control: 60, bounce: 50, precision: 55, role: "attacker", stackable: false, maxStackOn: 0 },
  { id: "opp-2", name: "Angemon", slug: "opp-angemon", franchise: "digimon", imageUrl: "/tazos/digimon/digimon-angemon.svg", attack: 70, defense: 55, resistance: 50, weight: 45, stability: 55, spin: 50, control: 60, bounce: 45, precision: 55, role: "technical", stackable: false, maxStackOn: 0 },
  { id: "opp-3", name: "Pikachu", slug: "opp-pikachu", franchise: "pokemon", imageUrl: "/tazos/pokemon/pokemon-pikachu.svg", attack: 45, defense: 40, resistance: 35, weight: 35, stability: 40, spin: 55, control: 50, bounce: 45, precision: 55, role: "light", stackable: false, maxStackOn: 0 },
  { id: "opp-4", name: "Greymon", slug: "opp-greymon", franchise: "digimon", imageUrl: "/tazos/digimon/digimon-greymon.svg", attack: 55, defense: 50, resistance: 45, weight: 55, stability: 50, spin: 45, control: 40, bounce: 35, precision: 40, role: "tank", stackable: false, maxStackOn: 0 },
  { id: "opp-5", name: "Cell", slug: "opp-cell", franchise: "dbz", imageUrl: "/tazos/dbz/dbz-cell.svg", attack: 75, defense: 65, resistance: 60, weight: 60, stability: 58, spin: 55, control: 50, bounce: 45, precision: 50, role: "balanced", stackable: false, maxStackOn: 0 },
]

type TazoCard = { id: string; name: string; slug: string; franchise: string; imageUrl: string | null; attack: number; defense: number; resistance: number; weight: number; stability: number; spin: number; control: number; bounce: number; precision: number; role?: string | null; stackable?: boolean; maxStackOn?: number }

export default function PvPBattlePanel() {
  const { t } = useI18n()
  const { user, token } = useAuth()
  const mp = useMultiplayer()

  // ─── Battle state ─────────────
  const [battleState, setBattleState] = useState<BattleState | null>(null)
  const [playerDeck, setPlayerDeck] = useState<TazoCard[]>([])
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(5)
  const [myTurn, setMyTurn] = useState(false)
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)

  // ─── Load active deck when matched ──────
  useEffect(() => {
    if (mp.state !== "playing" || playerDeck.length > 0) return
    async function loadDeck() {
      try {
        const res = await fetch("/api/decks", { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        const active = data.decks?.find((d: any) => d.isActive)
        if (active?.deckTazos?.length >= 5) {
          const cards: TazoCard[] = active.deckTazos.map((dt: any) => ({
            id: dt.tazo.id,
            name: dt.tazo.name,
            slug: dt.tazo.slug,
            franchise: dt.tazo.franchise?.slug || "pokemon",
            imageUrl: dt.tazo.imageUrl,
            attack: dt.tazo.attack,
            defense: dt.tazo.defense,
            resistance: dt.tazo.resistance,
            weight: dt.tazo.weight,
            stability: dt.tazo.stability,
            spin: dt.tazo.spin,
            control: dt.tazo.control,
            bounce: dt.tazo.bounce,
            precision: dt.tazo.precision,
            role: dt.tazo.role,
            stackable: dt.tazo.stackable,
            maxStackOn: dt.tazo.maxStackOn,
          }))
          setPlayerDeck(cards)
        } else {
          // Fallback: use DEMO tazos if no active deck
          setPlayerDeck(DEMO_TAZOS as TazoCard[])
        }
      } catch {
        setPlayerDeck(DEMO_TAZOS as TazoCard[])
      } finally {
        setLoading(false)
      }
    }
    loadDeck()
  }, [mp.state, playerDeck.length, token])

  // ─── Countdown from matched → playing ──────
  useEffect(() => {
    if (mp.state !== "matched") return
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timer); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [mp.state])

  // ─── Start battle when countdown ends ──────
  useEffect(() => {
    if (mp.state !== "matched" || countdown > 0 || playerDeck.length === 0) return
    const seed = mp.roomId ? hashCode(mp.roomId) : Date.now()
    const state = createBattleState(
      playerDeck as any,
      DEMO_TAZOS as any,
      { seed },
    )
    setBattleState(state)
    // Whose turn? Player side goes first
    setMyTurn(mp.yourSide === "player")
  }, [mp.state, countdown, playerDeck, mp.roomId, mp.yourSide])

  // ─── Handle opponent's turn data ──────
  useEffect(() => {
    if (!mp.lastTurnData || !battleState || myTurn) return
    const { aimX, aimY, power } = mp.lastTurnData
    let s = { ...battleState }
    s = selectThrower(s, "") // engine picks thrower
    s = setHorizontalAim(s, aimX ?? 50)
    s = setVerticalAim(s, aimY ?? 50)
    s = setPower(s, power ?? 70)
    s = executeThrow(s)
    s = endTurn(s)
    setBattleState(s)
    setMyTurn(true)
    setWaitingForOpponent(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mp.lastTurnData])

  // ─── Auto-end opponent turn ──────
  const handleEndOpponentTurn = useCallback(() => {
    if (!battleState || myTurn) return
    let s = { ...battleState }
    // Run opponent's turn with AI
    s = selectThrower(s, "") 
    s = setHorizontalAim(s, 35 + Math.random() * 30)
    s = setVerticalAim(s, 50 + Math.random() * 20)
    s = setPower(s, 60 + Math.random() * 25)
    s = executeThrow(s)
    s = endTurn(s)
    setBattleState(s)
    setMyTurn(true)
    setWaitingForOpponent(false)
  }, [battleState, myTurn])

  // ─── Player actions ──────
  const handleSelectThrower = (tazoId: string) => {
    if (!battleState || !myTurn) return
    setBattleState(selectThrower({ ...battleState }, tazoId))
  }

  const handleHorizontalAim = (value: number) => {
    if (!battleState || !myTurn) return
    setBattleState(setHorizontalAim({ ...battleState }, value))
  }

  const handleVerticalAim = (value: number) => {
    if (!battleState || !myTurn) return
    setBattleState(setVerticalAim({ ...battleState }, value))
  }

  const handlePowerSet = (value: number) => {
    if (!battleState || !myTurn) return
    const throwInput = {
      aimX: battleState.aimPhase?.horizontalAimValue ?? 50,
      aimY: battleState.aimPhase?.verticalAimValue ?? 50,
      power: value,
      tazoId: battleState.selectedTazoId ?? "",
    }
    let s = setPower({ ...battleState }, value)
    s = executeThrow(s)
    // Send turn data to opponent
    mp.sendTurn(throwInput)
    s = endTurn(s)
    setBattleState(s)
    setMyTurn(false)
    setWaitingForOpponent(true)
  }

  const handleRematch = () => {
    setBattleState(null)
    setPlayerDeck([])
    setCountdown(5)
    setMyTurn(false)
    setWaitingForOpponent(false)
    mp.joinQueue()
  }

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════

  // ─── Guest user ────────────────────────
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mag-card p-8 max-w-md space-y-4">
          <Users className="w-12 h-12 mx-auto text-zinc-500" />
          <h3 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a]">
            {t.tabBattle} Online
          </h3>
          <p className="text-sm text-zinc-500 font-medium">
            {t.auth_login} or {t.auth_register} to battle
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link href="/login" className="mag-btn bg-[#FFCC00] text-[#1a1a1a] text-xs font-black uppercase px-4 py-2 border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
              {t.auth_login}
            </Link>
            <Link href="/register" className="mag-btn bg-[#E3350D] text-white text-xs font-black uppercase px-4 py-2 border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
              {t.auth_register}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── Matchmaking idle ──────────────────
  if (mp.state === "idle" || mp.state === "connecting") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mag-card p-8 max-w-md w-full space-y-6">
          <Swords className="w-14 h-14 mx-auto text-[#FFCC00] drop-shadow-[2px_2px_0px_#1a1a1a]" />
          <h3 className="text-xl font-black uppercase tracking-wider text-[#1a1a1a]">
            PvP Battle
          </h3>
          <p className="text-sm text-zinc-500 font-medium leading-relaxed">
            Challenge another player in real time.<br />
            You need an <strong>active deck</strong> with at least 5 tazos.
          </p>
          <button
            onClick={mp.joinQueue}
            disabled={mp.state === "connecting"}
            className="mag-btn w-full bg-[#FFCC00] text-[#1a1a1a] text-sm font-black uppercase px-6 py-3 border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mp.state === "connecting" ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> {t.common_loading || "Connecting..."}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Swords className="w-4 h-4" /> Find Match
              </span>
            )}
          </button>
        </div>
      </div>
    )
  }

  // ─── In Queue ──────────────────────────
  if (mp.state === "queued") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mag-card p-8 max-w-md w-full space-y-6">
          <div className="relative mx-auto w-16 h-16">
            <Clock className="w-16 h-16 text-[#FFCC00] animate-spin" />
            <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-[#1a1a1a]">
              {mp.queuePosition}
            </span>
          </div>
          <h3 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a]">
            Searching for opponent...
          </h3>
          <p className="text-sm text-zinc-500 font-medium">
            Position in queue: <strong className="text-[#E3350D]">#{mp.queuePosition}</strong>
          </p>
          <button
            onClick={mp.leaveQueue}
            className="mag-btn text-xs font-black uppercase px-4 py-2 border-2 border-[#1a1a1a] bg-zinc-200 text-zinc-600 shadow-[2px_2px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <X className="w-3 h-3 inline mr-1" /> Cancel
          </button>
        </div>
      </div>
    )
  }

  // ─── Matched — Countdown ───────────────
  if (mp.state === "matched") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mag-card p-8 max-w-md w-full space-y-6">
          <Trophy className="w-14 h-14 mx-auto text-[#FFCC00] drop-shadow-[2px_2px_0px_#1a1a1a]" />
          <h3 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a]">
            Match Found!
          </h3>
          <div className="flex items-center justify-center gap-3">
            <div className="text-right">
              <p className="text-sm font-black text-[#1a1a1a]">{user.name}</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase">You</p>
            </div>
            <Swords className="w-5 h-5 text-[#E3350D]" />
            <div className="text-left">
              <p className="text-sm font-black text-[#1a1a1a]">{mp.opponent?.name || "Opponent"}</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase">Opponent</p>
            </div>
          </div>
          <p className="text-xs text-zinc-500 font-medium">
            Room: <code className="text-[10px] bg-zinc-200 px-1 py-0.5 rounded">{mp.roomId}</code>
          </p>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#FFCC00]" />
            <p className="text-sm font-bold text-[#1a1a1a]">
              {t.common_loading || "Loading decks"}... {countdown}s
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ─── Playing — REAL BATTLE ─────────────
  if (mp.state === "playing" && battleState) {
    const phase = battleState.phase
    const isSelectPhase = phase === "select_thrower" || phase === "turn_start"
    const isAimPhase = phase === "aim_horizontal" || phase === "aim_vertical" || phase === "charge_power"
    const isAnimating = phase === "throwing" || phase === "physics_simulation" || phase === "impact_resolution" || phase === "capture_resolution"
    const playerHand = battleState.player.field.filter(t => t.state === "in_hand")

    // Battle finished
    if (phase === "battle_finished" && battleState.finalResult) {
      return (
        <div className="max-w-md mx-auto space-y-4 pt-8">
          <BattleResultPanel
            result={battleState.finalResult}
            playerName={user.name}
            opponentName={mp.opponent?.name || "Rival"}
            onRematch={handleRematch}
          />
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {/* Score bar */}
        <div className="flex items-center justify-between p-2 bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#3B82F6] uppercase">{user.name}</span>
            <span className="font-black text-sm">{battleState.player.captured.length}</span>
          </div>
          <span className="text-[10px] font-black text-[#1a1a1a]/40 uppercase">
            Turn {battleState.turnNumber}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm">{battleState.opponent.captured.length}</span>
            <span className="text-[10px] font-bold text-[#E3350D] uppercase">{mp.opponent?.name || "Rival"}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Arena */}
          <div className="lg:col-span-2 space-y-2">
            <BattleArenaCanvas state={battleState} />

            {/* Phase indicator */}
            <div className="text-center">
              <span className="inline-block px-3 py-1 font-black text-[10px] uppercase tracking-wider bg-[#1a1a1a] text-[#FFCC00] border-2 border-[#1a1a1a]">
                {myTurn
                  ? (isSelectPhase ? "Select tazo" : isAimPhase ? "Aim & throw!" : isAnimating ? "Resolving..." : "Complete")
                  : "Waiting for opponent..."
                }
              </span>
              {!myTurn && !waitingForOpponent && (
                <button
                  onClick={handleEndOpponentTurn}
                  className="ml-2 text-[10px] font-black underline text-[#3B4CCA] hover:text-[#3B4CCA]/70"
                >
                  Simulate →
                </button>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-2">
            {/* Tazo selection */}
            {isSelectPhase && myTurn && (
              <div className="p-3 bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
                <h3 className="font-black text-[10px] uppercase tracking-wider text-[#1a1a1a] mb-2">
                  Your hand ({playerHand.length})
                </h3>
                <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                  {playerHand.map(tazo => (
                    <button
                      key={tazo.id}
                      onClick={() => handleSelectThrower(tazo.id)}
                      className="w-full flex items-center gap-2 p-2 border-2 border-[#1a1a1a]/10 rounded hover:border-[#FFCC00] hover:bg-[#FFCB0510] text-left"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 border-2 border-[#1a1a1a]"
                        style={{
                          background: tazo.franchise === "pokemon" ? "linear-gradient(135deg, #FFCB05, #FF8C00)"
                            : tazo.franchise === "digimon" ? "linear-gradient(135deg, #00A1E9, #0057B7)"
                            : "linear-gradient(135deg, #FF6B00, #CC4400)",
                        }}
                      >
                        <span className="text-white">{tazo.name.charAt(0)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{tazo.name}</div>
                        <div className="flex gap-1 mt-0.5">
                          <span className="text-[8px] font-bold px-1 bg-[#E3350D15] text-[#E3350D] rounded">A{tazo.stats.attack}</span>
                          <span className="text-[8px] font-bold px-1 bg-[#3B4CCA15] text-[#3B4CCA] rounded">D{tazo.stats.defense}</span>
                          <span className="text-[8px] font-bold px-1 bg-[#F59E0B15] text-[#F59E0B] rounded">B{tazo.stats.bounce}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 text-[#1a1a1a]/30 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Aim controls */}
            {isAimPhase && myTurn && (
              <LaunchControl
                phase={phase}
                aimPhase={battleState.aimPhase}
                onHorizontalAim={handleHorizontalAim}
                onVerticalAim={handleVerticalAim}
                onPowerSet={handlePowerSet}
                onThrow={() => {}}
              />
            )}

            {/* Waiting */}
            {!myTurn && waitingForOpponent && (
              <div className="p-4 bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] text-center">
                <Disc3 className="w-6 h-6 mx-auto mb-2 animate-spin text-[#E3350D]" />
                <p className="font-bold text-xs text-[#1a1a1a]">
                  {mp.opponent?.name || "Rival"} is throwing...
                </p>
              </div>
            )}

            {/* No battle state yet (loading) */}
            {!battleState && loading && (
              <div className="p-4 bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] text-center">
                <Disc3 className="w-6 h-6 mx-auto mb-2 animate-spin text-[#FFCC00]" />
                <p className="font-bold text-xs">{t.common_loading || "Loading deck"}...</p>
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

  // ─── Playing (no battle state — loading) ──
  if (mp.state === "playing" && !battleState) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mag-card p-8 max-w-md w-full space-y-6">
          <Disc3 className="w-12 h-12 mx-auto animate-spin text-[#FFCC00]" />
          <h3 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a]">Preparing battle</h3>
          <p className="text-sm text-zinc-500">{playerDeck.length} tazos loaded</p>
        </div>
      </div>
    )
  }

  // ─── Disconnected ───────────────────────
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mag-card p-8 max-w-md w-full space-y-6">
        <WifiOff className="w-12 h-12 mx-auto text-red-500" />
        <h3 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a]">Disconnected</h3>
        <p className="text-sm text-zinc-500">Opponent left or connection lost.</p>
        <button onClick={handleRematch} className="mag-btn bg-[#FFCC00] text-[#1a1a1a] text-sm font-black uppercase px-6 py-3 border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
          <Swords className="w-4 h-4 inline mr-1" /> Find New Match
        </button>
      </div>
    </div>
  )
}

// Simple string hash for battle RNG seed
function hashCode(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    const chr = s.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0
  }
  return Math.abs(hash)
}
