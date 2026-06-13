// ============================================================
// Trading Tazos Game — Battle View v4 (FSM-powered)
//
// Powered by useBattleEngine — formal finite state machine
// drives all gameplay. UI reads from BattleContext, actions
// dispatch through applyTransition(). Persistence auto-saves
// on match_end via battle-integration.ts.
// ============================================================
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  DEFAULT_ARENA_3D, createAirborneTazo, simulateSlam,
  scoreBettingImpact, checkMatchEnd, generateAISlam, placeStakedTazos,
} from "@/lib/battle/game-loop"
import { playSfx, warmSfx } from "@/lib/battle/sfx"
import type {
  TazoCard, MatchConfig, MatchResult, SlamParams,
  StakedTazo, AirborneTazo, ImpactResult,
} from "@/lib/battle/game-loop"
import type { BattleFinalResult } from "@/lib/battle"
import { useBattleEngine } from "@/lib/battle/use-battle-engine"
import type { BattleContext } from "@/lib/battle/state-machine"
import type { PvPWebSocket, TurnAction } from "@/lib/battle/use-pvp-websocket"
import BattleErrorBoundary from "./battle/battle-error-boundary"
import GameLobby from "./battle/game-lobby"
import BattleArena3D from "./battle/battle-arena-3d"
import SlamControls from "./battle/slam-controls"
import BattleResultPanel from "./battle/battle-result-panel"
import BattleHand from "./battle/battle-hand"
import BattleTutorial, { isTutorialDone } from "./battle/battle-tutorial"
import BattleSideStack from "./battle/battle-side-stack"
import { Disc3, RotateCcw, Crosshair, ArrowDown, Maximize, Minimize, Lock, Zap, Swords } from "lucide-react"

// ── PhaseBadge: Inline HUD component for phase indication ──
function PhaseBadge({ phase, bettingPhase, chargePct, tazoName }: { phase: string; bettingPhase?: string; chargePct?: number; tazoName?: string }) {
  const config: Record<string, { icon?: React.ReactNode; text: string; color: string; pulse?: boolean }> = {
    round_start: { text: "Stake a tazo", color: "#FFCC00" },
    player_aim: { icon: <Crosshair className="w-3 h-3 inline" />, text: "AIM", color: "#FFCC00" },
    player_charge: { icon: <Zap className="w-3 h-3 inline" />, text: chargePct != null ? `CHARGE ${chargePct}%` : "CHARGE", color: "#FF8800", pulse: true },
    player_tilt: { text: "TILT & RELEASE", color: "#FF004D" },
    slamming: { icon: <Zap className="w-3 h-3 inline" />, text: "SLAM!", color: "#FFCC00", pulse: true },
    impact: { text: "IMPACT!", color: "#FFCC00", pulse: true },
    resolve_impact: { text: "Resolving...", color: "#22C55E" },
    opponent_aim: { text: tazoName ? `AI aims ${tazoName}...` : "AI aims...", color: "#FF004D" },
    opponent_slam: { text: tazoName ? `${tazoName} SLAMS!` : "AI slams!", color: "#FF004D", pulse: true },
    round_end: { text: "Round complete", color: "#888" },
    coin_flip: { text: "🪙 COIN FLIP", color: "#FFCC00", pulse: true },
  }

  const c = config[phase]
  if (!c) {
    // Show betting phase info when in round_start
    if (bettingPhase === "bet_locked" || bettingPhase === "revealed") {
      const revealed = bettingPhase === "revealed"
      return (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${revealed ? "border-[#FFCC00]/50 bg-[#FFCC00]/10" : "border-[#22C55E]/30 bg-[#22C55E]/08"}`}>
          <span className={`text-[9px] font-black tracking-wider ${revealed ? "text-[#FFCC00]" : "text-[#22C55E]"}`}>
            {revealed ? "STAKES REVEALED" : "STAKES LOCKED"}
          </span>
        </div>
      )
    }
    return null
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${c.pulse ? "animate-pulse" : ""}`}
      style={{ background: `${c.color}10`, borderColor: `${c.color}40` }}
    >
      <span className="text-[9px] sm:text-[10px] font-black tracking-wider" style={{ color: c.color }}>
        {c.icon}{c.icon ? " " : ""}{c.text}
      </span>
    </div>
  )
}

// ── BettingReveal: Animated overlay when both stakes are shown ──
function BettingReveal({ playerTazo, opponentTazo }: { playerTazo: TazoCard; opponentTazo: TazoCard }) {
  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
      <div className="flex items-center gap-4 sm:gap-6 bg-black/80 backdrop-blur-xl rounded-3xl border border-[#FFCC00]/20 px-6 py-5 shadow-[0_12px_48px_rgba(255,204,0,0.2)]">
        {/* Player tazo */}
        <div className="flex flex-col items-center gap-2 animate-[fadeInLeft_0.5s_ease-out]">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 border-[#29ADFF]/40 overflow-hidden bg-[#29ADFF]/5 flex items-center justify-center">
            {playerTazo.imageUrl ? (
              <img src={playerTazo.imageUrl} alt={playerTazo.name} className="w-full h-full object-contain" />
            ) : (
              <span className="text-[#29ADFF] text-2xl font-black">{playerTazo.name[0]}</span>
            )}
          </div>
          <span className="text-[8px] font-black text-[#29ADFF] uppercase tracking-widest">Your stake</span>
          <span className="text-[10px] font-black text-white max-w-[80px] text-center leading-tight">{playerTazo.name}</span>
        </div>
        
        {/* VS divider */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-[#FFCC00] text-2xl font-black animate-pulse" style={{ textShadow: "0 0 20px #FFCC00" }}>⚡</div>
          <span className="text-[7px] font-black text-[#FFCC00]/50 uppercase tracking-[0.3em]">VS</span>
        </div>

        {/* Opponent tazo */}
        <div className="flex flex-col items-center gap-2 animate-[fadeInRight_0.5s_ease-out]">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 border-[#FF004D]/40 overflow-hidden bg-[#FF004D]/5 flex items-center justify-center">
            {opponentTazo.imageUrl ? (
              <img src={opponentTazo.imageUrl} alt={opponentTazo.name} className="w-full h-full object-contain" />
            ) : (
              <span className="text-[#FF004D] text-2xl font-black">{opponentTazo.name[0]}</span>
            )}
          </div>
          <span className="text-[8px] font-black text-[#FF004D] uppercase tracking-widest">AI stake</span>
          <span className="text-[10px] font-black text-white max-w-[80px] text-center leading-tight">{opponentTazo.name}</span>
        </div>
      </div>
    </div>
  )
}

// ── CoinFlip: Animated coin flip overlay ──
function CoinFlipOverlay({ show, winner }: { show: boolean; winner: "player" | "opponent" }) {
  const [animPhase, setAnimPhase] = useState<"flipping" | "reveal">("flipping")

  useEffect(() => {
    if (show) {
      setAnimPhase("flipping")
      const t = setTimeout(() => setAnimPhase("reveal"), 1200)
      return () => clearTimeout(t)
    }
  }, [show])

  if (!show) return null

  const isPlayerFirst = winner === "player"

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
      <div className="bg-black/80 backdrop-blur-xl rounded-3xl border border-[#FFCC00]/20 px-8 py-6 shadow-[0_0_80px_rgba(255,204,0,0.2)] flex flex-col items-center gap-4">
        {/* Coin */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center border-[3px] transition-all duration-500 ${
          animPhase === "flipping" 
            ? "animate-[spin3d_1.2s_linear]" 
            : isPlayerFirst ? "border-[#29ADFF] shadow-[0_0_30px_#29ADFF60]" : "border-[#FF004D] shadow-[0_0_30px_#FF004D60]"
        }`}
          style={{
            background: animPhase === "reveal"
              ? isPlayerFirst ? "linear-gradient(135deg, #29ADFF, #003388)" : "linear-gradient(135deg, #FF004D, #880000)"
              : "linear-gradient(135deg, #FFD700, #B8860B)",
            transform: animPhase === "reveal" ? "rotateY(0deg)" : undefined,
          }}
        >
          {animPhase === "flipping" ? (
            <span className="text-3xl drop-shadow-lg">🪙</span>
          ) : isPlayerFirst ? (
            <span className="text-xl font-black text-white drop-shadow-lg">YOU</span>
          ) : (
            <span className="text-xl font-black text-white drop-shadow-lg">AI</span>
          )}
        </div>

        {/* Result text */}
        <div className={`text-center transition-all duration-300 ${animPhase === "reveal" ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
          <div className="text-[14px] font-black tracking-widest" style={{
            color: animPhase === "flipping" ? "#FFCC00" : isPlayerFirst ? "#29ADFF" : "#FF004D",
            textShadow: `0 0 20px ${isPlayerFirst ? "#29ADFF" : "#FF004D"}`,
          }}>
            {animPhase === "flipping" ? "Flipping..." : `${isPlayerFirst ? "⭐ YOU" : "⚔️ AI"} SLAMS FIRST!`}
          </div>
        </div>
      </div>
    </div>
  )
}

const DEMO_TAZOS: TazoCard[] = [
  { id: "d1", name: "Aquafin", slug: "aquafin", franchise: "minimon", imageUrl: "/tazos-generated/minimon/aquafin.png", finish: "holo", creatureVariant: "standard", attack: 65, defense: 55, resistance: 60, weight: 45, stability: 50, spin: 55, control: 60, bounce: 40, precision: 55 },
  { id: "d2", name: "Aurorix", slug: "aurorix", franchise: "minimon", imageUrl: "/tazos-generated/minimon/aurorix.png", finish: "rainbow", creatureVariant: "standard", attack: 58, defense: 62, resistance: 50, weight: 35, stability: 55, spin: 45, control: 50, bounce: 50, precision: 48 },
  { id: "d3", name: "Cipherion", slug: "cipherion", franchise: "cybermon", imageUrl: "/tazos-generated/cybermon/cipherion.png", finish: "holo", creatureVariant: "standard", attack: 75, defense: 48, resistance: 52, weight: 55, stability: 50, spin: 60, control: 40, bounce: 35, precision: 45 },
  { id: "d4", name: "Datadrake", slug: "datadrake", franchise: "cybermon", imageUrl: "/tazos-generated/cybermon/datadrake.png", finish: "holo", creatureVariant: "standard", attack: 60, defense: 55, resistance: 50, weight: 45, stability: 55, spin: 50, control: 60, bounce: 45, precision: 55 },
  { id: "d5", name: "Debugger", slug: "debugger", franchise: "cybermon", imageUrl: "/tazos-generated/cybermon/debugger.png", finish: "chrome", creatureVariant: "standard", attack: 68, defense: 45, resistance: 42, weight: 48, stability: 45, spin: 62, control: 44, bounce: 40, precision: 50 },
  { id: "d6", name: "Firewall", slug: "firewall", franchise: "cybermon", imageUrl: "/tazos-generated/cybermon/firewall.png", finish: "prismatic", creatureVariant: "standard", attack: 70, defense: 58, resistance: 55, weight: 60, stability: 55, spin: 42, control: 52, bounce: 38, precision: 50 },
  { id: "d7", name: "Koori Frost", slug: "koori-frost", franchise: "dracobell", imageUrl: "/tazos-generated/dracobell/koori-frost.png", finish: "prismatic", creatureVariant: "standard", attack: 80, defense: 55, resistance: 52, weight: 58, stability: 55, spin: 65, control: 60, bounce: 48, precision: 55 },
  { id: "d8", name: "Ikari Rage", slug: "ikari-rage", franchise: "dracobell", imageUrl: "/tazos-generated/dracobell/ikari-rage.png", finish: "gold", creatureVariant: "golden", shinyImageUrl: "/tazos-generated/dracobell/ikari-rage.png", attack: 85, defense: 50, resistance: 48, weight: 62, stability: 50, spin: 55, control: 58, bounce: 42, precision: 52 },
  { id: "d9", name: "Hikaru Light", slug: "hikaru-light", franchise: "dracobell", imageUrl: "/tazos-generated/dracobell/hikaru-light.png", finish: "holo", creatureVariant: "standard", attack: 72, defense: 60, resistance: 54, weight: 50, stability: 58, spin: 48, control: 62, bounce: 40, precision: 56 },
  { id: "d10", name: "Kaji Flame", slug: "kaji-flame", franchise: "dracobell", imageUrl: "/tazos-generated/dracobell/kaji-flame.png", finish: "holo", creatureVariant: "standard", attack: 78, defense: 52, resistance: 50, weight: 55, stability: 52, spin: 58, control: 50, bounce: 45, precision: 48 },
]

function toPanelVictoryType(victoryType: MatchResult["victoryType"]): BattleFinalResult["victoryType"] {
  if (victoryType === "elimination") return "all_captured"
  if (victoryType === "tko") return "points"
  if (victoryType === "forfeit") return "surrender"
  return "points"
}

async function fetchTazos(token: string): Promise<{ tazos: TazoCard[]; decks: any[] }> {
  let allDecks: any[] = []
  try {
    const dr = await fetch("/api/decks", { headers: { Authorization: `Bearer ${token}` } })
    if (dr.ok) {
      const dd = await dr.json()
      allDecks = dd.decks || []
      const activeDeck = allDecks.find((d: any) => d.isActive) || allDecks[0]
      if (activeDeck && activeDeck.tazos?.length >= 5) {
        const deckTazos: TazoCard[] = activeDeck.tazos.map((t: any) => ({
          id: t.id, name: t.name || "?", slug: t.slug || (t.name || "?").toLowerCase().replace(/\s/g, "-"),
          franchise: (t.franchiseSlug || "minimon") as TazoCard["franchise"],
          imageUrl: t.imageUrl || null, shinyImageUrl: t.shinyImageUrl || null,
          rarity: t.rarity || "common", finish: t.finish || "normal", creatureVariant: t.creatureVariant || "standard",
          attack: t.attack || 50, defense: t.defense || 50, resistance: t.resistance || 50,
          weight: t.weight || 50, stability: t.stability || 50, spin: t.spin || 50,
          control: t.control || 50, bounce: t.bounce || 50, precision: t.precision || 50,
        }))
        return { tazos: deckTazos, decks: allDecks }
      }
    }
  } catch { /* fallback */ }
  const r = await fetch("/api/tazos?limit=100", { headers: { Authorization: `Bearer ${token}` } })
  if (!r.ok) return { tazos: [], decks: [] }
  const d = await r.json()
  const tazos: TazoCard[] = (d.tazos || []).map((t: any) => ({
    id: t.id, name: t.name || "?", slug: t.slug || (t.name || "?").toLowerCase().replace(/\s/g, "-"),
    franchise: (t.franchise || t.franchiseSlug || "minimon") as TazoCard["franchise"],
    imageUrl: t.imageUrl || null, shinyImageUrl: t.shinyImageUrl || null,
    rarity: t.rarity || "common", finish: t.finish || "normal", creatureVariant: t.creatureVariant || "standard",
    attack: t.attack || 50, defense: t.defense || 50, resistance: t.resistance || 50,
    weight: t.weight || 50, stability: t.stability || 50, spin: t.spin || 50,
    control: t.control || 50, bounce: t.bounce || 50, precision: t.precision || 50,
  }))
  return { tazos, decks: [] }
}

export default function BattleView({ pvp }: { pvp?: PvPWebSocket }) {
  const { user, token } = useAuth()
  const router = useRouter()
  const engine = useBattleEngine()
  const { ctx } = engine

  const [loading, setLoading] = useState(true)
  const [tazos, setTazos] = useState<TazoCard[]>([])
  const [deck, setDeck] = useState<TazoCard[]>([])
  const [allDecks, setAllDecks] = useState<any[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [selectedDeckName, setSelectedDeckName] = useState<string>("")
  const [allTazos, setAllTazos] = useState<TazoCard[]>([])
  const [creditsEarned, setCreditsEarned] = useState(0)
  const [airborne, setAirborne] = useState<AirborneTazo | null>(null)
  const [bettingPhase, setBettingPhase] = useState<"idle" | "betting" | "bet_locked" | "revealed">("idle")
  const [selectedBetId, setSelectedBetId] = useState<string | null>(null)
  const [playerHand, setPlayerHand] = useState<TazoCard[]>([])
  const [opponentHand, setOpponentHand] = useState<TazoCard[]>([])
  const [opponentBetId, setOpponentBetId] = useState<string | null>(null)
  const [coinFlipShow, setCoinFlipShow] = useState(false)
  const [coinFlipWinner, setCoinFlipWinner] = useState<"player" | "opponent">("player")
  const [showTutorial, setShowTutorial] = useState(false)
  const [introCountdown, setIntroCountdown] = useState<number | null>(null)
  const [roundBanner, setRoundBanner] = useState<number | null>(null)
  const [scoreFlash, setScoreFlash] = useState<"player" | "opponent" | null>(null)

  // ── Cleanup on unmount ──
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const resultSaved = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Phase from FSM ctx
  const phase = ctx?.state || "lobby"
  const pScore = ctx?.player.score ?? 0
  const oScore = ctx?.opponent.score ?? 0
  const round = ctx?.currentRound ?? 1
  const turn = ctx?.turnNumber ?? 0
  const staked = ctx?.stakedTazos ?? []
  const result = ctx?.matchResult ?? null
  const playerRemaining = ctx?.playerRemaining ?? 0
  const opponentRemaining = ctx?.opponentRemaining ?? 0
  const cfg = ctx?.config ?? null

  // ── Sync hands from engine when entering betting phase ──
  useEffect(() => {
    if (phase === "betting" && ctx?.playerHand?.length && ctx?.opponentHand?.length) {
      setPlayerHand(ctx.playerHand)
      setOpponentHand(ctx.opponentHand)
    }
  }, [phase, ctx?.playerHand, ctx?.opponentHand])

  // ── Score popups ──
  const [scorePopups, setScorePopups] = useState<Array<{ id: number; text: string; color: string; side: "left" | "right" }>>([])
  const popupId = useRef(0)
  const spawnPopup = (text: string, color: string, side: "left" | "right") => {
    const id = ++popupId.current
    setScorePopups(prev => [...prev, { id, text, color, side }])
    setTimeout(() => setScorePopups(prev => prev.filter(p => p.id !== id)), 1800)
  }

  // ── SFX ──
  useEffect(() => {
    const handler = () => { warmSfx(); document.removeEventListener("click", handler) }
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [])

  // ── Tutorial — show on first visit ──
  useEffect(() => {
    if (!isTutorialDone()) {
      const t = setTimeout(() => setShowTutorial(true), 800) // Delay so arena renders first
      return () => clearTimeout(t)
    }
  }, [cfg])

  useEffect(() => {
    if (phase === "match_end" && result) {
      if (result.winner === "player") playSfx("victory_fanfare", 0.5)
      else playSfx("defeat_sting", 0.4)
    }
    if (phase === "intro") {
      // Visible countdown: 3 → 2 → 1 → FIGHT!
      setIntroCountdown(3)
      const t1 = setTimeout(() => setIntroCountdown(2), 600)
      const t2 = setTimeout(() => setIntroCountdown(1), 1200)
      const t3 = setTimeout(() => setIntroCountdown(null), 1800)
      ;[600, 1200, 1800].forEach(d => setTimeout(() => playSfx("countdown_beep", 0.3), d))
      setTimeout(() => playSfx("battle_start", 0.4), 2400)
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    }
  }, [phase, result])

  // ── Round banner when entering betting ──
  useEffect(() => {
    if (phase === "betting" && round > 0) {
      setRoundBanner(round)
      const t = setTimeout(() => setRoundBanner(null), 1500)
      return () => clearTimeout(t)
    }
  }, [phase, round])

  // ── Score flash on player/opponent score change ──
  const prevPScore = useRef(pScore)
  const prevOScore = useRef(oScore)
  useEffect(() => {
    if (pScore > prevPScore.current) { setScoreFlash("player"); setTimeout(() => setScoreFlash(null), 400) }
    if (oScore > prevOScore.current) { setScoreFlash("opponent"); setTimeout(() => setScoreFlash(null), 400) }
    prevPScore.current = pScore
    prevOScore.current = oScore
  }, [pScore, oScore])

  // ── Auto-save on match_end ──
  useEffect(() => {
    if (phase === "match_end" && result && !resultSaved.current && user && token) {
      resultSaved.current = true
      const saveMatch = async () => {
        const pr = await engine.saveBattle(token)
        setCreditsEarned(pr?.creditsEarned || result?.xpEarned || 0)
      }
      saveMatch()
    }
  }, [phase, result, user, token, engine])

  // ── Load tazos + decks ──
  useEffect(() => {
    (async () => {
      let list: TazoCard[] = DEMO_TAZOS
      let dlist: any[] = []
      if (user && token) {
        const fetched = await fetchTazos(token)
        if (fetched.tazos.length >= 3) { list = fetched.tazos; dlist = fetched.decks }
      }
      setTazos(list); setAllTazos(list); setAllDecks(dlist); setLoading(false)
      if (dlist.length > 0) {
        const active = dlist.find((d: any) => d.isActive) || dlist[0]
        setSelectedDeckId(active.id)
        setSelectedDeckName(active.name || "")
      }
    })()
  }, [user, token])

  // ── Airborne tazo position follows reticle ──
  useEffect(() => {
    if (!airborne || !(phase === "player_aim" || phase === "player_charge" || phase === "player_tilt")) return
    const arena = cfg?.arena || DEFAULT_ARENA_3D
    const h = phase === "player_aim" ? arena.maxLaunchHeight * 0.5
      : phase === "player_charge" ? arena.maxLaunchHeight * (0.4 + engine.ui.charge * 0.6)
      : arena.maxLaunchHeight * (0.6 + engine.ui.charge * 0.4)
    setAirborne(prev => prev ? { ...prev, position: [engine.ui.reticleX * 0.3, h, engine.ui.reticleZ * 0.3] } : prev)
  }, [engine.ui.reticleX, engine.ui.reticleZ, engine.ui.charge, phase])

  // ── Fullscreen ──
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current; if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }, [])
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", h)
    return () => document.removeEventListener("fullscreenchange", h)
  }, [])

  // ── Deck selection ──
  const handleSelectDeck = useCallback((deckId: string | null) => {
    setSelectedDeckId(deckId)
    if (!deckId) { setTazos(allTazos); setSelectedDeckName(""); return }
    const d = allDecks.find((d: any) => d.id === deckId)
    setSelectedDeckName(d?.name || "")
    if (d?.tazos) {
      setTazos(d.tazos.map((t: any) => ({
        id: t.id, name: t.name || "?", slug: t.slug || (t.name || "?").toLowerCase().replace(/\s/g, "-"),
        franchise: (t.franchiseSlug || "minimon") as TazoCard["franchise"],
        imageUrl: t.imageUrl || null, shinyImageUrl: t.shinyImageUrl || null,
        rarity: t.rarity || "common", finish: t.finish || "normal", creatureVariant: t.creatureVariant || "standard",
        attack: t.attack || 50, defense: t.defense || 50, resistance: t.resistance || 50,
        weight: t.weight || 50, stability: t.stability || 50, spin: t.spin || 50,
        control: t.control || 50, bounce: t.bounce || 50, precision: t.precision || 50,
      })))
    }
  }, [allDecks, allTazos])

  // ═══════════════════════════════════════════════
  //  START MATCH — wiring to FSM
  // ═══════════════════════════════════════════════
  const start = useCallback((mode: "practice" | "pvp_ranked" | "pvp_friend", diff: any, d: TazoCard[]) => {
    // Route PvP modes to their respective pages
    if (mode === "pvp_friend") {
      router.push("/game/friend/new")
      return
    }
    if (mode === "pvp_ranked") {
      // TODO: join matchmaking queue via WebSocket
      router.push("/game/friend/ranked")
      return
    }

    const shuffled = [...d].sort(() => Math.random() - 0.5)
    const hand = shuffled.slice(0, Math.min(5, shuffled.length))
    setDeck(d)
    setPlayerHand(hand)
    setSelectedBetId(null)
    setBettingPhase("idle")
    const oppFull = [...DEMO_TAZOS, ...DEMO_TAZOS, ...DEMO_TAZOS].slice(0, 20)
    const oppHand = [...oppFull].sort(() => Math.random() - 0.5).slice(0, 5)
    setOpponentHand(oppHand)
    const config: MatchConfig = {
      mode, aiDifficulty: diff, arena: DEFAULT_ARENA_3D,
      scoreToWin: 5, playerDeck: hand, opponentDeck: oppHand,
    }

    engine.startMatch(config)

    // ── Sequence: intro → betting ──
    setTimeout(() => engine.introDone(), 2000)
    setTimeout(() => {
      engine.startBetting()
      setBettingPhase("betting")
      // Wait for player to select their tazo via handleBet()
    }, 3500)
  }, [engine])

  // ═══════════════════════════════════════════════
  //  PLAYER BET — interactive tazo selection
  // ═══════════════════════════════════════════════
  const handleBet = useCallback((tazo: TazoCard) => {
    if (bettingPhase !== "betting" || !cfg || engine.ui.busy) return
    engine.setBusy(true)
    setSelectedBetId(tazo.id)
    setBettingPhase("bet_locked")
    playSfx("ui_click", 0.15)

    // Auto-pick opponent bet
    const oppPick = opponentHand[Math.floor(Math.random() * opponentHand.length)]
    setOpponentBetId(oppPick.id)

    // Brief delay for anticipation
    setTimeout(() => {
      if (!engine.ctx) { engine.setBusy(false); return }
      engine.placeBets(tazo, oppPick)
      setBettingPhase("revealed")
      
      setTimeout(() => {
        engine.revealStakes()
        playSfx("tazo_flip", 0.3)
        
        setTimeout(() => {
          engine.doCoinFlip()
          const isPlayer = (engine.ctx?.state === "player_aim" || engine.ctx?.state === "player_charge" || engine.ctx?.state === "player_tilt") || Math.random() > 0.5
          const winner = isPlayer ? "player" : "opponent"
          setCoinFlipWinner(winner as "player" | "opponent")
          setCoinFlipShow(true)
          playSfx("tazo_flip", 0.3)
          
          setTimeout(() => {
            setCoinFlipShow(false)
            // Pick launcher (different tazo from bet, or first remaining)
            const launcher = playerHand.filter(t => t.id !== tazo.id)[0] || playerHand[0]
            if (!launcher) { engine.setBusy(false); return }
            const ab = createAirborneTazo(launcher, "player", cfg.arena)
            setAirborne(ab)
            setBettingPhase("idle")
            engine.lockAim(0, 0)
            engine.setBusy(false)
          }, 2000)
        }, 1000)
      }, 1000)
    }, 800)
  }, [bettingPhase, cfg, engine, opponentHand, playerHand])

  const rematch = () => {
    resultSaved.current = false; setCreditsEarned(0)
    setSelectedBetId(null); setBettingPhase("idle")
    if (cfg) start(cfg.mode, cfg.aiDifficulty, deck)
  }
  const back = () => {
    resultSaved.current = false; setCreditsEarned(0); setAirborne(null)
    setSelectedBetId(null); setBettingPhase("idle")
    engine.resetToLobby()
  }

  // ═══════════════════════════════════════════════
  //  PLAYER SLAM
  // ═══════════════════════════════════════════════
  const handleSlamRelease = useCallback(() => {
    if (engine.ui.busy || !cfg) return
    engine.setBusy(true)
    playSfx("aim_lock", 0.2)

    const t = ctx?.playerBetTazo || (deck.length > 0 ? deck[0] : null)
    if (!t) { engine.setBusy(false); return }

    // Calc tilt direction
    const { tiltDeg, tiltIntensity, reticleX, reticleZ, charge, spinIntensity } = engine.ui
    const absDeg = ((tiltDeg % 360) + 360) % 360
    let tiltDir: SlamParams["tilt"] = "flat"
    if (tiltIntensity > 0.12) {
      if (absDeg < 45 || absDeg > 315) tiltDir = "right"
      else if (absDeg >= 45 && absDeg < 135) tiltDir = "forward"
      else if (absDeg >= 135 && absDeg < 225) tiltDir = "left"
      else tiltDir = "backward"
    }

    const slam: SlamParams = {
      tazoId: t.id,
      impactX: reticleX,
      impactZ: reticleZ,
      verticalForce: charge,
      timingAccuracy: charge > 0.6 && charge < 0.82 ? 0.95 : 0.6,
      tilt: tiltDir,
      tiltIntensity,
      spinIntensity,
      aimPrecision: Math.max(0.2, (t.precision || 50) / 100),
    }

    // Animate airborne falling
    if (airborne) {
      const chargeHeight = cfg.arena.maxLaunchHeight * (0.2 + charge * 0.8)
      setAirborne({
        ...airborne,
        state: "falling",
        position: [reticleX * 0.3, chargeHeight, reticleZ * 0.3],
        tilt: [tiltIntensity * Math.cos(tiltDeg * Math.PI / 180) * 0.5, 0,
              tiltIntensity * Math.sin(tiltDeg * Math.PI / 180) * 0.5],
        angularVelocity: [0, spinIntensity * 8, 0],
        charge, targetX: reticleX, targetZ: reticleZ,
      })
    }

    // Impact after gravity
    const fallHeight = cfg.arena.maxLaunchHeight * (0.2 + charge * 0.8)
    const g = cfg.arena.gravity || 9.8
    const fallTimeMs = Number.isFinite(fallHeight) && fallHeight > 0 ? Math.sqrt(2 * fallHeight / g) * 1000 : 600

    playSfx("slam_launch", 0.3)

    setTimeout(() => {
      if (!mountedRef.current) return
      const currentCtx = engine.ctx
      if (!currentCtx || !cfg) { engine.setBusy(false); return }

      playSfx("slam_impact", 0.6)

      const { staked: newStaked, result: impact } = simulateSlam(t, slam, currentCtx.stakedTazos, cfg.arena, "player")
      const { playerDelta, opponentDelta, playerLostTazos, opponentLostTazos } = scoreBettingImpact(impact, "player")

      // Resolve through FSM
      engine.resolveImpact(impact, "player")
      setAirborne(null)

      engine.setImpactMsg(impact.description)
      engine.setShowImpact(true)

      if (playerDelta > 0) { spawnPopup(`+${playerDelta}`, "#29ADFF", "left"); playSfx("score_pop", 0.3) }
      if (opponentDelta > 0) { spawnPopup(`+${opponentDelta}`, "#FF004D", "right"); playSfx("score_pop", 0.3) }
      if (playerLostTazos > 0) { spawnPopup(`-${playerLostTazos} tazo`, "#FF004D", "left"); playSfx("damage_taken", 0.35) }
      if (opponentLostTazos > 0) { spawnPopup(`-${opponentLostTazos} tazo`, "#29ADFF", "right"); playSfx("damage_taken", 0.35) }

      // Check if match ended
      const newPR = Math.max(0, currentCtx.playerRemaining - playerLostTazos)
      const newOR = Math.max(0, currentCtx.opponentRemaining - opponentLostTazos)
      const newPScore = currentCtx.player.score + playerDelta
      const newOScore = currentCtx.opponent.score + opponentDelta
      const end = checkMatchEnd(newPScore, newOScore, newPR, newOR)

      setTimeout(() => {
        if (!mountedRef.current) return
        engine.setShowImpact(false)

        if (end) {
          engine.showResult()
          engine.setBusy(false)
          return
        }

        // Round won — triumphant sound
        playSfx("tazo_secure", 0.25)

        // Opponent's turn — show AI tazo airborne, aim, then slam
        setTimeout(() => {
          if (!mountedRef.current) return
          const aiTazo = currentCtx.opponentBetTazo
          if (!aiTazo || !cfg) { engine.setBusy(false); return }

          const aiSlam = generateAISlam(aiTazo, currentCtx.stakedTazos, cfg.arena, cfg.aiDifficulty)
          const aiAirborne = createAirborneTazo(aiTazo, "opponent", cfg.arena)
          aiAirborne.state = "aiming"
          aiAirborne.position = [aiSlam.impactX * 0.3, cfg.arena.maxLaunchHeight * 0.4, aiSlam.impactZ * 0.3]

          // Show AI tazo in arena
          setAirborne(aiAirborne)
          playSfx("aim_tick", 0.2)

          // Phase: opponent aims
          const aimDuration = 800 + Math.random() * 500
          setTimeout(() => {
            if (!mountedRef.current) return
            // Update airborne to charging position
            setAirborne(prev => prev ? { ...prev, state: "charging", position: [aiSlam.impactX * 0.3, cfg.arena.maxLaunchHeight * 0.7, aiSlam.impactZ * 0.3] } : prev)
            playSfx("charge_start", 0.2)

            // Simulate brief charge, then slam down
            setTimeout(() => {
              if (!mountedRef.current) return
              if (!engine.ctx) { engine.setBusy(false); return }
              playSfx("slam_impact", 0.6)

              // Animate airborne falling to impact
              setAirborne(prev => prev ? { ...prev, state: "falling", position: [aiSlam.impactX * 0.3, 0.05, aiSlam.impactZ * 0.3] } : prev)

              const { staked: newStakedAI, result: aiImpact } = simulateSlam(aiTazo, aiSlam, engine.ctx.stakedTazos, cfg.arena, "opponent")
              const aiScoring = scoreBettingImpact(aiImpact, "opponent")

              engine.resolveImpact(aiImpact, "opponent")
              engine.setImpactMsg(aiImpact.description)
              engine.setShowImpact(true)

            if (aiScoring.opponentDelta > 0) { spawnPopup(`+${aiScoring.opponentDelta}`, "#FF004D", "right"); playSfx("score_pop", 0.3) }
            if (aiScoring.playerDelta > 0) { spawnPopup(`+${aiScoring.playerDelta}`, "#29ADFF", "left"); playSfx("score_pop", 0.3) }
            if (aiScoring.playerLostTazos > 0) { spawnPopup(`-${aiScoring.playerLostTazos} tazo`, "#FF004D", "left"); playSfx("damage_taken", 0.35) }

            const ctx2 = engine.ctx
            const finalPR = Math.max(0, (ctx2?.playerRemaining ?? newPR) - aiScoring.playerLostTazos)
            const finalOR = Math.max(0, (ctx2?.opponentRemaining ?? newOR) - aiScoring.opponentLostTazos)
            const finalPS = (ctx2?.player.score ?? newPScore) + aiScoring.playerDelta
            const finalOS = (ctx2?.opponent.score ?? newOScore) + aiScoring.opponentDelta
            const aiEnd = checkMatchEnd(finalPS, finalOS, finalPR, finalOR)

            setTimeout(() => {
              if (!mountedRef.current) return
              engine.setShowImpact(false)
              setAirborne(null) // Clear AI's airborne after impact
              if (aiEnd) {
                engine.showResult()
              } else {
                engine.nextRound()
                // Reset UI for new round — let player bet interactively
                setTimeout(() => {
                  if (!mountedRef.current) return
                  setSelectedBetId(null)
                  setOpponentBetId(null)
                  setBettingPhase("betting")
                  engine.setBusy(false)
                }, 800)
              }
              engine.setBusy(false)
            }, 1500)
          }, 400)
        }, aimDuration)
      }, 1500)
    }, 1500)
  }, fallTimeMs * 0.75)
  }, [engine, cfg, ctx, deck, airborne])

  // ═══════════════════════════════════════════════
  //  PVP INTEGRATION — WebSocket relay for multiplayer
  // ═══════════════════════════════════════════════

  // –– Process incoming opponent turn actions ––
  const pvpActionRef = useRef<string | null>(null)
  useEffect(() => {
    if (!pvp || !cfg) return
    const action = pvp.state.lastOpponentAction
    if (!action || engine.ui.busy) return
    const key = JSON.stringify(action)
    if (pvpActionRef.current === key) return
    pvpActionRef.current = key

    engine.setBusy(true)

    // Opponent's slam — simulate it locally to see the result
    if (action.slamParams) {
      const oppTazo = cfg.opponentDeck.find(t => t.id === action.slamParams!.tazoId) || cfg.opponentDeck[0]
      const slam: SlamParams = {
        tazoId: action.slamParams.tazoId,
        impactX: action.slamParams.impactX,
        impactZ: action.slamParams.impactZ,
        verticalForce: action.slamParams.verticalForce,
        timingAccuracy: action.slamParams.timingAccuracy,
        tilt: action.slamParams.tilt as SlamParams["tilt"],
        tiltIntensity: action.slamParams.tiltIntensity,
        spinIntensity: action.slamParams.spinIntensity,
        aimPrecision: action.slamParams.aimPrecision,
      }

      // Brief delay for "AI" feel
      setTimeout(() => {
        if (!engine.ctx || !cfg) { engine.setBusy(false); return }
        playSfx("slam_impact", 0.5)
        const { result: impact } = simulateSlam(oppTazo, slam, engine.ctx.stakedTazos, cfg.arena, "opponent")
        const scoring = scoreBettingImpact(impact, "opponent")
        engine.resolveImpact(impact, "opponent")
        engine.setImpactMsg(impact.description)
        engine.setShowImpact(true)

        if (scoring.opponentDelta > 0) { spawnPopup(`+${scoring.opponentDelta}`, "#FF004D", "right"); playSfx("score_pop", 0.3) }
        if (scoring.playerDelta > 0) { spawnPopup(`+${scoring.playerDelta}`, "#29ADFF", "left"); playSfx("score_pop", 0.3) }
        if (scoring.playerLostTazos > 0) { spawnPopup(`-${scoring.playerLostTazos} tazo`, "#FF004D", "left"); playSfx("damage_taken", 0.35) }

        setTimeout(() => {
          engine.setShowImpact(false)
          const c2 = engine.ctx
          const newPS = (c2?.player.score ?? 0) + scoring.playerDelta
          const newOS = (c2?.opponent.score ?? 0) + scoring.opponentDelta
          const end = checkMatchEnd(newPS, newOS,
            Math.max(0, (c2?.playerRemaining ?? 0) - scoring.playerLostTazos),
            Math.max(0, (c2?.opponentRemaining ?? 0) - scoring.opponentLostTazos))
          if (end) {
            engine.showResult()
          } else {
            engine.nextRound()
          }
          engine.setBusy(false)
        }, 1500)
      }, 800)
    }
  }, [pvp?.state.lastOpponentAction, cfg, engine])

  // –– Process incoming opponent result confirmation ––
  const pvpResultRef = useRef<string | null>(null)
  useEffect(() => {
    if (!pvp) return
    const result = pvp.state.lastOpponentResult
    if (!result) return
    const key = JSON.stringify(result)
    if (pvpResultRef.current === key) return
    pvpResultRef.current = key
    if (result.gameOver) {
      // Opponent claims game is over
      const winner = result.winner === pvp.state.yourSide ? "player" : "opponent"
      engine.forfeit(winner as "player" | "opponent")
    }
  }, [pvp?.state.lastOpponentResult, pvp, engine])

  // –– Override handleSlamRelease for PvP ––
  const slamRef = useRef(handleSlamRelease)
  useEffect(() => { slamRef.current = handleSlamRelease }, [handleSlamRelease])

  const handleSlamForPvP = useCallback(() => {
    if (!pvp) return slamRef.current()

    if (engine.ui.busy || !cfg) return
    playSfx("aim_lock", 0.2)
    engine.setBusy(true)

    const t = ctx?.playerBetTazo || (deck.length > 0 ? deck[0] : null)
    if (!t) { engine.setBusy(false); return }

    const { tiltDeg, tiltIntensity, reticleX, reticleZ, charge, spinIntensity } = engine.ui
    const absDeg = ((tiltDeg % 360) + 360) % 360
    let tiltDir: SlamParams["tilt"] = "flat"
    if (tiltIntensity > 0.12) {
      if (absDeg < 45 || absDeg > 315) tiltDir = "right"
      else if (absDeg >= 45 && absDeg < 135) tiltDir = "forward"
      else if (absDeg >= 135 && absDeg < 225) tiltDir = "left"
      else tiltDir = "backward"
    }

    // Animate airborne falling
    if (airborne) {
      const chargeHeight = cfg.arena.maxLaunchHeight * (0.2 + charge * 0.8)
      setAirborne({
        ...airborne, state: "falling",
        position: [reticleX * 0.3, chargeHeight, reticleZ * 0.3],
        tilt: [tiltIntensity * Math.cos(tiltDeg * Math.PI / 180) * 0.5, 0,
              tiltIntensity * Math.sin(tiltDeg * Math.PI / 180) * 0.5],
        angularVelocity: [0, spinIntensity * 8, 0],
        charge, targetX: reticleX, targetZ: reticleZ,
      })
    }

    // Send to opponent via WebSocket
    pvp.sendTurnAction({
      phase: "slam",
      betTazoId: t.id,
      slamParams: { tazoId: t.id, impactX: reticleX, impactZ: reticleZ, verticalForce: charge,
        timingAccuracy: charge > 0.6 && charge < 0.82 ? 0.95 : 0.6,
        tilt: tiltDir, tiltIntensity, spinIntensity,
        aimPrecision: Math.max(0.2, (t.precision || 50) / 100) },
    })

    // Simulate locally
    const fallHeight = cfg.arena.maxLaunchHeight * (0.2 + charge * 0.8)
    const g2 = cfg.arena.gravity || 9.8
    const fallTimeMs = Number.isFinite(fallHeight) && fallHeight > 0 ? Math.sqrt(2 * fallHeight / g2) * 1000 : 600

    setTimeout(() => {
      if (!engine.ctx || !cfg) { engine.setBusy(false); return }
      playSfx("slam_impact", 0.6)
      const slam: SlamParams = { tazoId: t.id, impactX: reticleX, impactZ: reticleZ, verticalForce: charge,
        timingAccuracy: charge > 0.6 && charge < 0.82 ? 0.95 : 0.6,
        tilt: tiltDir, tiltIntensity, spinIntensity,
        aimPrecision: Math.max(0.2, (t.precision || 50) / 100) }
      const { result: impact } = simulateSlam(t, slam, engine.ctx.stakedTazos, cfg.arena, "player")
      const scoring = scoreBettingImpact(impact, "player")
      engine.resolveImpact(impact, "player")
      setAirborne(null)
      engine.setImpactMsg(impact.description)
      engine.setShowImpact(true)

      if (scoring.playerDelta > 0) { spawnPopup(`+${scoring.playerDelta}`, "#29ADFF", "left"); playSfx("score_pop", 0.3) }
      if (scoring.opponentDelta > 0) { spawnPopup(`+${scoring.opponentDelta}`, "#FF004D", "right"); playSfx("score_pop", 0.3) }

      const newPS = engine.ctx!.player.score + scoring.playerDelta
      const newOS = engine.ctx!.opponent.score + scoring.opponentDelta
      const end = checkMatchEnd(newPS, newOS,
        Math.max(0, (engine.ctx?.playerRemaining ?? 0) - scoring.playerLostTazos),
        Math.max(0, (engine.ctx?.opponentRemaining ?? 0) - scoring.opponentLostTazos))

      setTimeout(() => {
        engine.setShowImpact(false)
        if (end) {
          engine.showResult()
          pvp.sendGameOver({ winner: end.winner, score: `${newPS}-${newOS}` })
        } else {
          engine.nextRound()
        }
        engine.setBusy(false)
      }, 1500)
    }, fallTimeMs * 0.75)
  }, [engine, cfg, ctx, deck, airborne, pvp])

  // Use PvP slam handler when in PvP mode
  const effectiveSlamRelease = pvp ? handleSlamForPvP : handleSlamRelease

  // ── Loading ──
  if (loading) return (
    <div className="flex items-center justify-center py-28 px-4 sm:px-6">
      <Disc3 className="w-12 h-12 animate-spin text-[#FFCC00]" />
    </div>
  )

  // ── Lobby ──
  if (phase === "lobby") return (
    <GameLobby
      playerTazos={tazos}
      playerDecks={allDecks.length > 0 ? allDecks : undefined}
      selectedDeckId={allDecks.length > 0 ? selectedDeckId : undefined}
      onSelectDeck={allDecks.length > 0 ? handleSelectDeck : undefined}
      onStart={start}
      isLoading={false}
      isAuthenticated={!!user}
    />
  )

  // ── Match End ──
  if (phase === "match_end" && result) return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <BattleResultPanel result={{
        winner: result.winner,
        victoryType: toPanelVictoryType(result.victoryType),
        playerScore: result.playerScore,
        opponentScore: result.opponentScore,
        totalTurns: result.totalTurns,
        playerCaptures: result.playerCaptures,
        opponentCaptures: result.opponentCaptures,
        summary: result.summary,
      }} playerName="You" opponentName={`AI (${cfg?.aiDifficulty})`} onRematch={rematch} creditsEarned={creditsEarned} />
      <div className="text-center">
        <button onClick={back} className="px-6 py-3 font-black text-sm uppercase text-[#1a1a1a] bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
          <RotateCcw className="w-4 h-4 inline mr-2" /> Back to Lobby
        </button>
      </div>
    </div>
  )

  // ── Battle Arena ──
  const isAiming = phase === "player_aim" || phase === "player_charge" || phase === "player_tilt"
  const showReticle = isAiming || phase === "betting" || phase === "stakes_reveal"
  const throwing = ctx?.playerBetTazo || (deck.length > 0 ? deck[0] : null)

  return (
    <BattleErrorBoundary>
    <div ref={containerRef} className="w-full relative" style={{ height: isFullscreen ? "100vh" : "calc(100vh - 110px)" }}>
      {/* Tutorial */}
      {showTutorial && <BattleTutorial onClose={() => setShowTutorial(false)} />}
      
      <div className="absolute top-2 right-2 z-30 flex gap-2">
        <button onClick={() => setShowTutorial(true)}
          className="p-2 bg-black/40 hover:bg-black/60 rounded-full border border-white/10 text-white/40 hover:text-white/70 transition-all"
          title="How to play">
          <Swords className="w-3.5 h-3.5" />
        </button>
        <button onClick={toggleFullscreen}
          className="p-2 bg-black/40 hover:bg-black/60 rounded-full border border-white/10 text-white/50 hover:text-white/80 transition-all"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>

      <BattleArena3D
        config={cfg?.arena || DEFAULT_ARENA_3D}
        stakedTazos={staked}
        airborneTazo={airborne}
        gamePhase={phase}
        showReticle={showReticle}
        reticleX={engine.ui.reticleX}
        reticleZ={engine.ui.reticleZ}
      >
        {/* ── Side Stacks (Player left, Opponent right) ── */}
        <BattleSideStack
          playerName="You"
          totalTazos={deck.length}
          remainingTazos={playerRemaining}
          capturedTazos={pScore}
          side="left"
          isActive={phase === "player_aim" || phase === "player_charge" || phase === "player_tilt"}
          playerType="player"
          franchise={playerHand[0]?.franchise}
        />
        <BattleSideStack
          playerName={cfg?.mode === "practice" ? `AI (${cfg.aiDifficulty})` : "Opponent"}
          totalTazos={cfg?.opponentDeck?.length || 0}
          remainingTazos={opponentRemaining}
          capturedTazos={oScore}
          side="right"
          isActive={phase === "opponent_aim" || phase === "opponent_slam"}
          playerType="opponent"
          franchise={opponentHand[0]?.franchise}
        />

        {/* ── Battle Hand (betting phase) ── */}
        <BattleHand
          hand={playerHand}
          phase={bettingPhase}
          selectedId={selectedBetId}
          airborneId={airborne?.id}
          onSelect={handleBet}
        />

        {/* ── HUD overlay ── */}
        <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
          {/* Top bar — player scores */}
          <div className="px-3 sm:px-5 pt-2.5">
            <div className="flex items-center justify-between gap-3">
              {/* Player (left) */}
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border-2 relative overflow-hidden transition-transform duration-200 ${scoreFlash === "player" ? "scale-125" : ""}`}
                  style={{ background: "linear-gradient(135deg, #29ADFF20, #29ADFF08)", borderColor: scoreFlash === "player" ? "#29ADFF" : "#29ADFF40" }}>
                  <span className="text-base sm:text-lg font-black text-[#29ADFF] tabular-nums" style={{ textShadow: "0 0 12px #29ADFF88" }}>
                    {pScore}
                  </span>
                  {phase === "player_aim" && <div className="absolute inset-0 bg-[#29ADFF]/10 animate-pulse" />}
                </div>
                <div className="hidden sm:block">
                  <div className="text-[9px] font-black text-[#29ADFF] uppercase tracking-wider leading-tight">You</div>
                  <div className="text-[6px] font-black text-[#29ADFF]/40 uppercase tracking-widest">{selectedDeckName || "Player"}</div>
                </div>
              </div>

              {/* Center — phase + round */}
              <div className="flex flex-col items-center">
                {phase === "intro" && (
                  <div className="flex flex-col items-center gap-1">
                    {introCountdown !== null ? (
                      <span className="text-5xl sm:text-7xl font-black text-[#FFCC00] animate-[popUp_0.4s_ease-out]"
                        style={{ textShadow: "0 0 40px #FFCC00, 0 0 80px #FFCC0060" }}
                        key={introCountdown}>
                        {introCountdown}
                      </span>
                    ) : (
                      <span className="text-2xl sm:text-3xl font-black text-[#FFCC00] animate-[popUp_0.3s_ease-out]"
                        style={{ textShadow: "0 0 30px #FFCC00" }}>
                        ⚡ FIGHT!
                      </span>
                    )}
                  </div>
                )}
                {phase !== "intro" && (
                  <>
                    <div className="text-[8px] font-black text-white/15 uppercase tracking-[0.25em] mb-0.5">Round {round}</div>
                    <PhaseBadge phase={phase} bettingPhase={bettingPhase} chargePct={Math.round(engine.ui.charge * 100)} tazoName={airborne?.tazoName} />
                  </>
                )}
              </div>

              {/* Opponent (right) */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-right">
                  <div className="text-[9px] font-black text-[#FF004D] uppercase tracking-wider leading-tight">
                    {cfg?.mode === "practice" ? `AI ${cfg.aiDifficulty}` : "Opponent"}
                  </div>
                  <div className="text-[6px] font-black text-[#FF004D]/40 uppercase tracking-widest">Rival</div>
                </div>
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border-2 relative overflow-hidden transition-transform duration-200 ${scoreFlash === "opponent" ? "scale-125" : ""}`}
                  style={{ background: "linear-gradient(135deg, #FF004D20, #FF004D08)", borderColor: scoreFlash === "opponent" ? "#FF004D" : "#FF004D40" }}>
                  <span className="text-base sm:text-lg font-black text-[#FF004D] tabular-nums" style={{ textShadow: "0 0 12px #FF004D88" }}>
                    {oScore}
                  </span>
                  {(phase === "opponent_aim" || phase === "opponent_slam") && <div className="absolute inset-0 bg-[#FF004D]/10 animate-pulse" />}
                </div>
              </div>
            </div>
          </div>

          {/* Score popups */}
          {scorePopups.map(p => (
            <div key={p.id}
              className={`absolute top-14 ${p.side === "left" ? "left-6" : "right-6"} pointer-events-none`}
              style={{
                color: p.color,
                fontSize: p.text.length > 2 ? "18px" : "30px",
                fontWeight: 900,
                textShadow: `0 0 20px ${p.color}, 0 3px 10px rgba(0,0,0,0.8)`,
                animation: "popUp 1.5s ease-out forwards",
              }}
            >{p.text}</div>
          ))}

          {/* Impact particles */}
          {(phase === "impact" || engine.ui.showImpact) && (
            <div className="absolute top-1/2 left-1/2 pointer-events-none" style={{ marginLeft: -120, marginTop: -120 }}>
              {[...Array(20)].map((_, i) => {
                const angle = (i / 20) * Math.PI * 2
                const dist = 50 + Math.random() * 100
                const px = Math.cos(angle) * dist
                const py = Math.sin(angle) * dist
                const size = 3 + Math.random() * 6
                const color = ["#FFCC00", "#FF8800", "#FFAA00", "#FFDD44", "#FFF", "#FFD700"][Math.floor(Math.random() * 6)]
                return (
                  <div key={i} className="absolute rounded-full"
                    style={{
                      left: 120, top: 120, width: size, height: size,
                      background: color,
                      boxShadow: `0 0 ${size * 2.5}px ${color}`,
                      animation: "particleFly 1.1s ease-out forwards",
                      animationDelay: `${i * 0.015}s`,
                      "--px": `${px}px`, "--py": `${py}px`,
                    } as React.CSSProperties}
                  />
                )
              })}
            </div>
          )}

          {/* Betting reveal overlay */}
          {bettingPhase === "revealed" && selectedBetId && opponentBetId && (
            <BettingReveal
              playerTazo={playerHand.find(t => t.id === selectedBetId)!}
              opponentTazo={opponentHand.find(t => t.id === opponentBetId)!}
            />
          )}

          {/* Coin flip overlay */}
          <CoinFlipOverlay show={coinFlipShow} winner={coinFlipWinner} />

          {/* Round banner */}
          {roundBanner !== null && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none z-30">
              <div className="animate-[popUp_0.3s_ease-out]" key={roundBanner}>
                <div className="text-[10px] font-black text-[#FFCC00]/40 uppercase tracking-[0.3em] text-center mb-1">Round</div>
                <div className="text-5xl font-black text-[#FFCC00] text-center" style={{ textShadow: "0 0 30px #FFCC0060" }}>
                  {roundBanner}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Slam Controls ── */}
        {isAiming && throwing ? (
          <SlamControls
            phase={engine.ui.slamPhase}
            tazoName={throwing.name}
            tazoFranchise={throwing.franchise}
            tazoControl={throwing.control || 50}
            tazoPrecision={throwing.precision || 50}
            reticleX={engine.ui.reticleX}
            reticleZ={engine.ui.reticleZ}
            charge={engine.ui.charge}
            tiltDeg={engine.ui.tiltDeg}
            spinIntensity={engine.ui.spinIntensity}
            onReticleMove={(x, z) => { engine.setReticleX(x); engine.setReticleZ(z) }}
            onCharge={(level) => engine.setCharge(level)}
            onChargeComplete={(level) => {
              if (engine.ui.busy || engine.ui.slamPhase !== "charge") return
              engine.setSlamPhase("tilt")
              engine.setCharge(level)
            }}
            onTilt={(deg, intensity) => { engine.setTiltDeg(deg); engine.setTiltIntensity(intensity) }}
            onSpin={(intensity) => engine.setSpinIntensity(intensity)}
            onRelease={() => {
              if (engine.ui.slamPhase === "aim") {
                engine.setSlamPhase("charge")
                return
              }
              if (engine.ui.slamPhase === "charge") {
                effectiveSlamRelease()
                return
              }
              effectiveSlamRelease()
            }}
            onBack={back}
          />
        ) : (
          <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-center p-4">
            <button onClick={back}
              className="px-5 py-2.5 text-[10px] font-black text-white/40 bg-black/60 hover:bg-black/80 hover:text-white/70 border border-white/15 uppercase tracking-wider transition-colors">
              Leave Battle
            </button>
          </div>
        )}
      </BattleArena3D>
    </div>
    </BattleErrorBoundary>
  )
}
