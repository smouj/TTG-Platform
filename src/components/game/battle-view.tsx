"use client"
import Image from "next/image"
// ============================================================
// Trading Tazos Game — Battle View v4 (FSM-powered)
//
// Powered by useBattleEngine — formal finite state machine
// drives all gameplay. UI reads from BattleContext, actions
// dispatch through applyTransition(). Persistence auto-saves
// on match_end via battle-integration.ts.
// ============================================================

import React, { useState, useCallback, useMemo } from "react"

import { useEffect, useRef } from "react"
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
import WebGLGuard from "@/components/game/webgl-guard"
import BattleHUD from "@/components/game/battle/battle-hud"
import SlamControls from "./battle/slam-controls"
import PlacementPhase from "./battle/placement-phase"
import BattleResultPanel from "./battle/battle-result-panel"
import BattleTutorial, { isTutorialDone } from "./battle/battle-tutorial"
import BattleSideStack from "./battle/battle-side-stack"
import CaptureOverlay from "./battle/capture-overlay"
import SelectPhase from "./battle/select-phase"
import RoundWonOverlay from "./battle/round-won-overlay"
import { Disc3, RotateCcw, Crosshair, ArrowDown, Maximize, Minimize, Lock, Zap, Swords } from "lucide-react"


// ── IntroCinematic: Pre-match presentation with player intro + deck preview ──
function IntroCinematic({ playerName, deckName, deckSize, playerHand, opponentHand, countdown, introCinematicPhase }: {
  playerName: string
  deckName: string
  deckSize: number
  playerHand: TazoCard[]
  opponentHand: TazoCard[]
  countdown: number | null
  introCinematicPhase: "players" | "decks" | "countdown" | null
}) {
  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col items-center justify-center">
      {/* Top: VS banner */}
      <div className="absolute top-[14%] left-1/2 -translate-x-1/2">
        <div style={{
          background: "rgba(0,0,0,0.75)",
          border: "2px solid rgba(255,204,0,0.4)",
          padding: "8px 32px",
          textAlign: "center",
        }}>
          <p style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,204,0,0.6)", textTransform: "uppercase", letterSpacing: "0.3em", margin: 0 }}>
            Practice Battle
          </p>
        </div>
      </div>

      {/* Player vs AI presentation */}
      <div style={{
        position: "absolute", top: "24%", left: 0, right: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: "2rem"
      }}>
        {/* Player side */}
        <div style={{
          background: "rgba(0,0,0,0.7)",
          border: "2px solid var(--ttg-player)",
          padding: "12px 20px",
          textAlign: "center",
          minWidth: 160,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--ttg-player), var(--ttg-blue-dark))",
            margin: "0 auto 8px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>
              {playerName?.slice(0, 2).toUpperCase() || "YOU"}
            </span>
          </div>
          <p style={{ fontSize: 11, fontWeight: 900, color: "var(--ttg-player)", textTransform: "uppercase", margin: 0, letterSpacing: "0.05em" }}>
            {playerName || "Player"}
          </p>
          <p style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.4)", margin: "3px 0 0", textTransform: "uppercase" }}>
            {deckName || "Battle Deck"} &middot; {deckSize} tazos
          </p>
          <div style={{ display: "flex", gap: 3, justifyContent: "center", marginTop: 6 }}>
            {playerHand.slice(0, 5).map((t, i) => (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.2)",
                overflow: "hidden", background: "var(--ttg-black)"
              }}>
                {t.imageUrl ? (
                  <img src={t.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.14)" }} />
                ) : (
                  <span style={{ fontSize: 8, color: "var(--ttg-player)", display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    {t.name?.[0] || "?"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* VS */}
        <div style={{ textAlign: "center" }}>
          <span style={{
            fontSize: 36, fontWeight: 900, color: "var(--ttg-yellow)",
            textShadow: "0 0 20px rgba(255,204,0,0.5)",
            lineHeight: 1,
          }}>VS</span>
        </div>

        {/* AI side */}
        <div style={{
          background: "rgba(0,0,0,0.7)",
          border: "2px solid var(--ttg-opponent)",
          padding: "12px 20px",
          textAlign: "center",
          minWidth: 160,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--ttg-opponent), var(--ttg-red-dark))",
            margin: "0 auto 8px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Swords style={{ width: 24, height: 24, color: "#fff" }} />
          </div>
          <p style={{ fontSize: 11, fontWeight: 900, color: "var(--ttg-opponent)", textTransform: "uppercase", margin: 0, letterSpacing: "0.05em" }}>
            Arena AI
          </p>
          <p style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.4)", margin: "3px 0 0", textTransform: "uppercase" }}>
            Full Deck &middot; 20 tazos
          </p>
          <div style={{ display: "flex", gap: 3, justifyContent: "center", marginTop: 6 }}>
            {opponentHand.slice(0, 5).map((t, i) => (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.2)",
                overflow: "hidden", background: "var(--ttg-black)"
              }}>
                {t.imageUrl ? (
                  <img src={t.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.14)" }} />
                ) : (
                  <span style={{ fontSize: 8, color: "var(--ttg-opponent)", display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    {t.name?.[0] || "?"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: phase hint */}
      <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 text-center">
        <p style={{
          fontSize: introCinematicPhase === "countdown" ? 48 : 10,
          fontWeight: 900,
          color: introCinematicPhase === "countdown" ? "var(--ttg-yellow)" : "rgba(255,255,255,0.35)",
          textTransform: "uppercase", letterSpacing: "0.2em", margin: 0,
          textShadow: introCinematicPhase === "countdown" ? "0 0 40px rgba(255,204,0,0.6)" : "none",
          animation: introCinematicPhase === "countdown" ? "none" : "pulse 2s ease-in-out infinite",
          transition: "all 0.3s ease-out",
        }}>
          {introCinematicPhase === "players" ? "Presenting contestants..." :
           introCinematicPhase === "decks" ? "Deck preview..." :
           introCinematicPhase === "countdown" ? (countdown != null && countdown > 0 ? `${countdown}...` : countdown === 0 ? "GO!" : "Get ready...") :
           "Camera orbits arena · Free orbit with mouse"}
        </p>
        {introCinematicPhase === "players" && (
          <p style={{ fontSize: 8, color: "rgba(255,255,255,0.12)", fontWeight: 700, textAlign: "center", letterSpacing: "0.2em", marginTop: 8 }}>
            PRESS SPACE TO SKIP
          </p>
        )}
      </div>
    </div>
  )
}

// ── PhaseBadge: Magazine editorial phase indicator ──
function PhaseBadge({ phase, bettingPhase, chargePct, tazoName }: { phase: string; bettingPhase?: string; chargePct?: number; tazoName?: string }) {
  const config: Record<string, { icon?: React.ReactNode; text: string; color: string; pulse?: boolean }> = {
    round_start: { text: "Select a tazo", color: "var(--ttg-yellow)" },
    betting: { text: "Betting", color: "var(--ttg-yellow)" },
    player_aim: { icon: <Crosshair className="w-3 h-3 inline" />, text: "Aim", color: "var(--ttg-player)" },
    player_charge: { icon: <Zap className="w-3 h-3 inline" />, text: chargePct != null ? `Charge ${chargePct}%` : "Charge", color: "var(--ttg-dracobell)", pulse: true },
    player_tilt: { text: "Tilt & release", color: "var(--ttg-opponent)" },
    slamming: { icon: <Zap className="w-3 h-3 inline" />, text: "Slam!", color: "var(--ttg-yellow)", pulse: true },
    impact: { text: "Impact!", color: "var(--ttg-yellow)", pulse: true },
    resolve_impact: { text: "Resolving…", color: "var(--ttg-success)" },
    opponent_aim: { text: tazoName ? `AI aims ${tazoName}…` : "AI aims…", color: "var(--ttg-opponent)" },
    opponent_slam: { text: tazoName ? `${tazoName} slams!` : "AI slams!", color: "var(--ttg-opponent)", pulse: true },
    turn_transition: { text: "Next round", color: "#888" },
    coin_flip: { text: "🪙 Coin Flip", color: "var(--ttg-yellow)", pulse: true },
  }

  const c = config[phase]
  if (!c) {
    if (bettingPhase === "bet_locked" || bettingPhase === "revealed") {
      const revealed = bettingPhase === "revealed"
      return (
        <span className={`text-[8px] font-black tracking-[0.2em] uppercase ${
          revealed ? "text-ttg-yellow" : "text-ttg-success"}`}>
          {revealed ? "• Stakes revealed" : "• Stakes locked"}
        </span>
      )
    }
    return null
  }

  return (
    <span
      className={`text-[9px] font-black uppercase tracking-[0.15em] ${c.pulse ? "animate-pulse" : ""}`}
      style={{ color: c.color, textShadow: c.pulse ? `0 0 12px ${c.color}50` : "none" }}
    >
      {c.icon}{c.icon ? " " : ""}{c.text}
    </span>
  )
}

// ── BettingReveal: Animated overlay when both stakes are shown ──
function BettingReveal({ playerTazo, opponentTazo }: { playerTazo: TazoCard; opponentTazo: TazoCard }) {
  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
      <div className="flex items-center gap-3 sm:gap-4 bg-black/70 backdrop-blur-lg border border-ttg-yellow/20 px-4 py-3 shadow-[0_8px_32px_rgba(255,204,0,0.15)] max-w-md">
        {/* Player tazo */}
        <div className="flex flex-col items-center gap-2 animate-[fadeInLeft_0.5s_ease-out]">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 border-2 border-ttg-player/40 overflow-hidden bg-ttg-player/5 flex items-center justify-center">
            {playerTazo.imageUrl ? (
              <Image src={playerTazo.imageUrl} alt={playerTazo.name} fill className="object-contain" sizes="200px" />
            ) : (
              <span className="text-ttg-player text-2xl font-black">{playerTazo.name[0]}</span>
            )}
          </div>
          <span className="text-[8px] font-black text-ttg-player uppercase tracking-widest">Your stake</span>
          <span className="text-[10px] font-black text-white max-w-[80px] text-center leading-tight">{playerTazo.name}</span>
        </div>
        
        {/* VS divider */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-ttg-yellow text-2xl font-black animate-pulse" style={{ textShadow: "0 0 20px var(--ttg-yellow)" }}>⚡</div>
          <span className="text-[7px] font-black text-ttg-yellow/50 uppercase tracking-[0.3em]">VS</span>
        </div>

        {/* Opponent tazo */}
        <div className="flex flex-col items-center gap-2 animate-[fadeInRight_0.5s_ease-out]">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 border-2 border-ttg-opponent/40 overflow-hidden bg-ttg-opponent/5 flex items-center justify-center">
            {opponentTazo.imageUrl ? (
              <Image src={opponentTazo.imageUrl} alt={opponentTazo.name} fill className="object-contain" sizes="200px" />
            ) : (
              <span className="text-ttg-opponent text-2xl font-black">{opponentTazo.name[0]}</span>
            )}
          </div>
          <span className="text-[8px] font-black text-ttg-opponent uppercase tracking-widest">AI stake</span>
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
      <div className="bg-black/80 backdrop-blur-xl  border border-ttg-yellow/20 px-8 py-6 shadow-[0_0_80px_rgba(255,204,0,0.2)] flex flex-col items-center gap-4">
        {/* Coin */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center border-[3px] transition-all duration-500 ${
          animPhase === "flipping" 
            ? "animate-[spin3d_1.2s_linear]" 
            : isPlayerFirst ? "border-ttg-player shadow-[0_0_30px_#29adff60]" : "border-ttg-opponent shadow-[0_0_30px_#ff004d60]"
        }`}
          style={{
            background: animPhase === "reveal"
              ? isPlayerFirst ? "linear-gradient(135deg, var(--ttg-player), var(--ttg-blue-dark))" : "linear-gradient(135deg, var(--ttg-opponent), var(--ttg-red-dark))"
              : "linear-gradient(135deg, var(--ttg-yellow), var(--ttg-yellow-darker))",
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
            color: animPhase === "flipping" ? "var(--ttg-yellow)" : isPlayerFirst ? "var(--ttg-player)" : "var(--ttg-opponent)",
            textShadow: `0 0 20px ${isPlayerFirst ? "var(--ttg-player)" : "var(--ttg-opponent)"}`,
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
      if (activeDeck && activeDeck.tazos?.length >= 1) {
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
  const autoStartedRef = useRef(false)
  const engine = useBattleEngine()
  const ctxDefenders = React.useMemo(() => {
    const m = new Map<string, any>()
    const cfg = engine.ctx?.config
    if (cfg) {
      for (const t of [...(cfg.playerDeck || []), ...(cfg.opponentDeck || [])]) {
        if (t) m.set(t.id, t)
      }
    }
    return m
  }, [engine.ctx?.config?.playerDeck, engine.ctx?.config?.opponentDeck])
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
  const [selectedLauncherId, setSelectedLauncherId] = useState<string | null>(null)
  const [playerHand, setPlayerHand] = useState<TazoCard[]>([])
  const [opponentHand, setOpponentHand] = useState<TazoCard[]>([])
  const [opponentBetId, setOpponentBetId] = useState<string | null>(null)
  // [removed: coin flip]
  // [removed: coin flip winner]
  const [placingStake, setPlacingStake] = useState(false)
  const [playerStakeX, setPlayerStakeX] = useState(-0.55)
  const [playerStakeZ, setPlayerStakeZ] = useState(0)
  const [deckRemainingCount, setDeckRemainingCount] = useState(0)
  const [deckTotalCount, setDeckTotalCount] = useState(0)
  const [deckFranchise, setDeckFranchise] = useState("minimon")
  const [deckImages, setDeckImages] = useState<string[]>([])
  const [drawTrigger, setDrawTrigger] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [introCountdown, setIntroCountdown] = useState<number | null>(null)
  const [showCaptureOverlay, setShowCaptureOverlay] = useState(false)
  const [showRoundOverlay, setShowRoundOverlay] = useState(false)
  const [introCinematicPhase, setIntroCinematicPhase] = useState<"players" | "decks" | "countdown" | null>(null)
  const introSkippedRef = useRef(false)
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
    if (phase === "stake_player" && ctx?.playerHand?.length && ctx?.opponentHand?.length) {
      setPlayerHand(ctx.playerHand)
      setOpponentHand(ctx.opponentHand)
    }
  }, [phase, ctx?.playerHand, ctx?.opponentHand])

  // ── Score popups ──
  const [scorePopups, setScorePopups] = useState<Array<{ id: number; text: string; color: string; side: "left" | "right" }>>([])
  const popupId = useRef(0)
  const spawnPopup = useCallback((text: string, color: string, side: "left" | "right") => {
    const id = ++popupId.current
    setScorePopups(prev => [...prev, { id, text, color, side }])
    setTimeout(() => setScorePopups(prev => prev.filter(p => p.id !== id)), 1800)
  }, [])

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

  // ── Capture overlay on capture_check phase ──
  useEffect(() => {
    if (phase === "capture_check" && ctx?.lastImpact) {
      setShowCaptureOverlay(true)
      playSfx(ctx.lastImpact.opponentCaptured ? "tazo_secure" : "damage_taken", 0.3)
      const t = setTimeout(() => setShowCaptureOverlay(false), 1800)
      return () => clearTimeout(t)
    }
  }, [phase, ctx?.lastImpact])

  useEffect(() => {
    if (phase === "match_end" && result) {
      if (result.winner === "player") playSfx("victory_fanfare", 0.5)
      else playSfx("defeat_sting", 0.4)
    }
    if (phase === "match_intro" || phase === "draw_initial_hand") {
      // Skip handler: Space / Enter / Click to fast-forward intro
      const skipIntro = () => {
        if (introSkippedRef.current) return
        introSkippedRef.current = true
        setIntroCountdown(null)
        setIntroCinematicPhase(null)
        engine.introDone()
      }
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); skipIntro() }
      }
      window.addEventListener("keydown", handleKey)

      // Cinematic intro sequence:
      // 0-2.5s: Camera orbit + player vs AI intro
      // 2.5-4.5s: Deck preview + stats
      // 4.5-6.8s: Countdown 3→2→1→BATTLE!
      setIntroCinematicPhase("players")
      const tPlayers = setTimeout(() => { if (!introSkippedRef.current) setIntroCinematicPhase("decks") }, 2500)
      const tDecks = setTimeout(() => { if (!introSkippedRef.current) { setIntroCinematicPhase("countdown"); setIntroCountdown(3) } }, 4500)
      ;[0, 600, 1200].forEach((d, i) => setTimeout(() => {
        if (introSkippedRef.current) return
        setIntroCountdown(3 - i)
        if (i < 2) playSfx("countdown_beep", 0.3)
      }, 4500 + d))
      const tFight = setTimeout(() => {
        if (introSkippedRef.current) return
        setIntroCountdown(0)
        playSfx("battle_start", 0.5)
      }, 6300)
      const tDone = setTimeout(() => {
        if (introSkippedRef.current) return
        setIntroCountdown(null)
        setIntroCinematicPhase(null)
      }, 6800)
      return () => {
        clearTimeout(tPlayers); clearTimeout(tDecks); clearTimeout(tFight); clearTimeout(tDone)
        window.removeEventListener("keydown", handleKey)
        introSkippedRef.current = false
      }
    }
  }, [phase, result])

  // ── Round overlay when entering new round ──
  useEffect(() => {
    if (phase === "round_start" && round > 1) {
      setShowRoundOverlay(true)
      playSfx("ui_click", 0.2)
      const t = setTimeout(() => setShowRoundOverlay(false), 2200)
      return () => clearTimeout(t)
    }
  }, [phase, round])

  // ── Round banner when entering betting ──
  useEffect(() => {
    if (phase === "stake_player" && round > 0) {
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

  // ── Sync deck remaining count with engine ──
  useEffect(() => {
    if (playerRemaining !== deckRemainingCount && playerRemaining > 0) {
      setDeckRemainingCount(playerRemaining)
    }
  }, [playerRemaining, deckRemainingCount])

  // ── Auto-save on match_end ──
  useEffect(() => {
    // Public practice: never save
    if (phase === "match_end" && result && !resultSaved.current && user && token && sessionStorage.getItem("battle_public_practice") !== "1") {
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
    if (!airborne || !(phase === "aim" || phase === "charge" || phase === "throw")) return
    const arena = cfg?.arena || DEFAULT_ARENA_3D
    const h = phase === "aim" ? arena.maxLaunchHeight * 0.5
      : phase === "charge" ? arena.maxLaunchHeight * (0.4 + engine.ui.charge * 0.6)
      : arena.maxLaunchHeight * (0.6 + engine.ui.charge * 0.4)
    setAirborne(prev => prev ? { ...prev, position: [engine.ui.reticleX * 0.3, h, engine.ui.reticleZ * 0.3] } : prev)
  }, [engine.ui.reticleX, engine.ui.reticleZ, engine.ui.charge, phase])

  // ── AI Turn Automation ──
  const aiTurnRunning = useRef(false)
  const runAITurn = useCallback(() => {
    try {
    const c = engine.ctx
    if (!c || !cfg || c.currentThrower !== "opponent") return
    aiTurnRunning.current = true
    
    const aiLauncher = c.opponentHand.length > 0 
      ? c.opponentHand[Math.floor(Math.random() * c.opponentHand.length)]
      : null
    if (!aiLauncher) {
      engine.turnOver()
      aiTurnRunning.current = false
      return
    }
    
    const ab = createAirborneTazo(aiLauncher, "opponent", cfg.arena)
    setAirborne(ab)
    engine.selectTazo(aiLauncher)
    
    // AI aim (random target in arena)
    const timing = engine.aiTiming()
    const aimX = (Math.random() - 0.5) * cfg.arena.radius * 0.5
    const aimZ = (Math.random() - 0.5) * cfg.arena.radius * 0.5
    
    const aiTimeout1 = setTimeout(() => {
      if (!mountedRef.current) { aiTurnRunning.current = false; return }
      const cc = engine.ctx
      if (!cc || !cfg) { aiTurnRunning.current = false; return }
      engine.lockAim(aimX, aimZ)
      
      const chargeLevel = 0.5 + Math.random() * 0.5
      const aiTimeout2 = setTimeout(() => {
        if (!mountedRef.current) { aiTurnRunning.current = false; return }
        engine.lockCharge(chargeLevel)
        engine.releaseSlam()
        
        const ccc = engine.ctx
        if (!ccc || !cfg) { aiTurnRunning.current = false; return }
        
        const aiSlamParams = generateAISlam(aiLauncher, ccc.stakedTazos, cfg.arena, cfg.aiDifficulty, ccc.opponent.score - ccc.player.score)
        playSfx("slam_impact", 0.6)
        const { staked: aiNewStaked, result: aiImpact } = simulateSlam(aiLauncher, aiSlamParams, ccc.stakedTazos, cfg.arena, "opponent", ctxDefenders)
        const aiScoring = scoreBettingImpact(aiImpact, "opponent")
        
        engine.physicsDone(aiImpact, aiNewStaked)
        engine.setShowImpact(true)
        
        if (aiScoring.opponentDelta > 0) { spawnPopup("+" + aiScoring.opponentDelta, "var(--ttg-opponent)", "right"); playSfx("score_pop", 0.3) }
        if (aiScoring.playerDelta > 0) { spawnPopup("+" + aiScoring.playerDelta, "var(--ttg-player)", "left"); playSfx("score_pop", 0.3) }
        
        setAirborne(null)
        
        setTimeout(() => {
          if (!mountedRef.current) { aiTurnRunning.current = false; return }
          engine.setShowImpact(false)
          engine.captureResolved()
          setTimeout(() => {
            if (!mountedRef.current) { aiTurnRunning.current = false; return }
            engine.scoreUpdated()
            setTimeout(() => {
              if (!mountedRef.current) { aiTurnRunning.current = false; return }
              engine.turnOver()
              aiTurnRunning.current = false
            }, 400) // Reduced from 800ms
          }, 300) // Reduced from 600ms
        }, 600) // Reduced from 1000ms
      }, timing.aim)
    }, timing.think)
    } catch (err) {
      console.error("[runAITurn] AI turn crashed:", err)
      aiTurnRunning.current = false
      try { engine.turnOver() } catch {} // Unstuck the game if possible
    }
  }, [engine, cfg, ctxDefenders, spawnPopup])

  // ── AI Turn Trigger ──
  useEffect(() => {
    if (phase === "select_tazo" && ctx?.currentThrower === "opponent" && !aiTurnRunning.current) {
      const t = setTimeout(() => runAITurn(), 250) // Reduced from 500ms — faster AI response
      return () => clearTimeout(t)
    }
  }, [phase, ctx?.currentThrower, runAITurn])

  // ── Round Loop: auto-dispatch ROUND_STARTED → turn_start ──
  // This handles rounds 2+ (round 1 is dispatched by handlePlaceStake's setTimeout)
  useEffect(() => {
    if (phase === "round_start") {
      const t = setTimeout(() => engine.roundStarted(), 200)
      return () => clearTimeout(t)
    }
  }, [phase, engine])

  // ── Round Loop: auto-dispatch TURN_STARTED ──
  useEffect(() => {
    if (phase === "turn_start") {
      const delay = ctx?.currentThrower === "opponent" ? 300 : 100
      const t = setTimeout(() => engine.turnStarted(), delay)
      return () => clearTimeout(t)
    }
  }, [phase, ctx?.currentThrower, engine])


  // ── Auto-dispatch INITIAL_HANDS_DRAWN when entering draw_initial_hand ──
  useEffect(() => {
    if (phase === "draw_initial_hand" && introCinematicPhase === null) {
      const t = setTimeout(() => engine.initialHandsDrawn(), 300)
      return () => clearTimeout(t)
    }
  }, [phase, introCinematicPhase, engine])

  // ── Auto-dispatch CARD_DRAWN when entering draw phase ──
  useEffect(() => {
    if (phase === "draw") {
      const t = setTimeout(() => engine.cardDrawn(), isDrawing ? 800 : 200)
      return () => clearTimeout(t)
    }
  }, [phase, engine, isDrawing])

  // ── On entering stake_player: draw animation + show PlacementPhase ──
  useEffect(() => {
    if (phase === "stake_player") {
      setIsDrawing(true)
      setDrawTrigger(c => c + 1)
      const t = setTimeout(() => setIsDrawing(false), 800)
      setPlacingStake(true)
      return () => clearTimeout(t)
    }
  }, [phase])

  // ── Fullscreen ── (requests on document.documentElement for true browser fullscreen)
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
        // Fallback: try container-level fullscreen
        const el = containerRef.current
        if (el) el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
      })
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
  const start = useCallback((mode: "practice" | "pvp_ranked" | "pvp_friend", diff: any, d: TazoCard[], arenaOverride?: import("@/lib/battle/game-loop").Arena3DConfig) => {
    // PvP modes: show Coming Soon in lobby UI — practice is the active mode.
    // WebSocket matchmaking (join_queue/leave_queue) is implemented in:
    //   src/lib/multiplayer.ts (useMultiplayer hook)
    //   src/lib/battle/use-pvp-websocket.ts (PvPWebSocket hook)
    //   src/server/ws-server.ts (queue + matchmaking + turn relay)
    // Wire these up when PvP is launched.
    if (mode === "pvp_friend" || mode === "pvp_ranked") {
      return // PvP not yet enabled — button shows "Coming Soon"
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
      mode, aiDifficulty: diff, arena: arenaOverride || DEFAULT_ARENA_3D,
      scoreToWin: 5, playerDeck: d, opponentDeck: oppFull,
    }

    engine.startMatch(config)

    // ── Set deck tube state ──
    const franchise = d[0]?.franchise || "minimon"
    setDeckFranchise(franchise)
    setDeckRemainingCount(Math.max(0, shuffled.length - Math.min(5, shuffled.length)))
    setDeckTotalCount(shuffled.length)
    setDeckImages(d.filter(t => t.imageUrl).map(t => t.imageUrl!).slice(0, 10))
    setPlayerStakeX(-0.55)
    setPlayerStakeZ(0)

    // ── Sequence: intro cinematic → auto-dispatch handles rest ──
    // introDone() advances FSM to draw_initial_hand; the auto-dispatch useEffect
    // waits for cinematic completion (introCinematicPhase===null) before firing
    // INITIAL_HANDS_DRAWN → stake_player. This ensures the full cinematic plays.
    // Draw animation + PlacementPhase are triggered by the useEffect for stake_player.
    // Note: intro can be skipped via Space/Enter — check introSkippedRef to avoid double-fire
    setTimeout(() => {
      if (!introSkippedRef.current) engine.introDone()
    }, 6800)
  }, [engine])

  // ── Auto-start from sessionStorage (set by /app/battle lobby or /battle/practice) ──
  useEffect(() => {
    if (autoStartedRef.current) return
    const battleMode = sessionStorage.getItem("battle_mode")
    const battleDeckId = sessionStorage.getItem("battle_deckId")
    if (!battleMode || !battleDeckId || loading) return

    const isPublicPractice = sessionStorage.getItem("battle_public_practice") === "1"
    // Public practice: use demo tazos regardless of allDecks
    // Authenticated: wait for allDecks to load
    if (!isPublicPractice && allDecks.length === 0) return

    const battleDifficulty = sessionStorage.getItem("battle_difficulty") || "skilled"
    autoStartedRef.current = true
    sessionStorage.removeItem("battle_mode")
    sessionStorage.removeItem("battle_difficulty")
    sessionStorage.removeItem("battle_deckId")

    let deckTazos: TazoCard[]
    if (isPublicPractice) {
      // Demo deck: 5 random tazos from DEMO_TAZOS (no API calls needed)
      const shuffled = [...DEMO_TAZOS].sort(() => Math.random() - 0.5)
      deckTazos = shuffled.slice(0, 5)
    } else {
      const autoDeck = allDecks.find((d: any) => d.id === battleDeckId)
      if (!autoDeck?.tazos || autoDeck.tazos.length < 1) return
      const dt: any[] = autoDeck.tazos
      deckTazos = dt.map((t: any) => ({
        id: t.id, name: t.name || "?", slug: t.slug || (t.name || "?").toLowerCase().replace(/\s/g, "-"),
        franchise: (t.franchiseSlug || "minimon") as any,
        imageUrl: t.imageUrl || null, shinyImageUrl: t.shinyImageUrl || null,
        rarity: t.rarity || "common", finish: t.finish || "normal", creatureVariant: t.creatureVariant || "standard",
        attack: t.attack || 50, defense: t.defense || 50, resistance: t.resistance || 50,
        weight: t.weight || 50, stability: t.stability || 50, spin: t.spin || 50,
        control: t.control || 50, bounce: t.bounce || 50, precision: t.precision || 50,
      }))
    }

    const timer = setTimeout(() => start(battleMode as any, battleDifficulty, deckTazos), 500)
    return () => clearTimeout(timer)
  }, [loading, allDecks, start])

  // ═══════════════════════════════════════════════
  //  PLAYER BET — interactive tazo selection
  // ═══════════════════════════════════════════════
  // ═══════════════════════════════════════════════
  //  MANUAL STAKE PLACEMENT — player positions stake
  // ═══════════════════════════════════════════════
  const handlePlaceStake = useCallback((stakeX: number, stakeZ: number) => {
    setPlayerStakeX(stakeX)
    setPlayerStakeZ(stakeZ)
    if (!ctx || playerHand.length === 0 || opponentHand.length === 0) return
    engine.setBusy(true)
    
    const playerTazo = playerHand.find(t => t.id === selectedBetId) || playerHand[0]
    const oppPick = opponentHand[Math.floor(Math.random() * opponentHand.length)]
    setOpponentBetId(oppPick.id)
    setSelectedBetId(playerTazo.id)
    setBettingPhase("revealed")
    
    // Dispatch FSM events: stake player → stake AI → reveal stakes
    engine.stakePlayer(playerTazo, stakeX, stakeZ)
    engine.aiBet(oppPick)
    
    // Show stake reveal briefly, then start the round
    setTimeout(() => {
      setPlacingStake(false)
      engine.revealStakes()
      playSfx("tazo_flip", 0.3)
      // Player always goes first — shorter delay for snappier feel
      setTimeout(() => {
        engine.roundStarted()
        setTimeout(() => engine.turnStarted(), 400)
        engine.setBusy(false)
      }, 800)
    }, 600)
  }, [ctx, playerHand, opponentHand, engine])

  const rematch = () => {
    setPlacingStake(false); setPlayerStakeX(-0.55); setPlayerStakeZ(0)
    resultSaved.current = false; setCreditsEarned(0)
    setSelectedBetId(null); setBettingPhase("idle")
    if (cfg) start(cfg.mode, cfg.aiDifficulty, deck)
  }
  const back = () => {
    setPlacingStake(false); setPlayerStakeX(-0.55); setPlayerStakeZ(0)
    resultSaved.current = false; setCreditsEarned(0); setAirborne(null)
    setSelectedBetId(null); setBettingPhase("idle")
    engine.resetToLobby()
    // Notify parent page (inline lobby) that user wants to exit battle
    window.dispatchEvent(new Event("ttg:battle:exit"))
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

    // Drive FSM: player_tilt → slamming
    engine.releaseSlam()

    // Determine timing quality for feedback
    const timingQuality: string =
      charge >= 0.68 && charge <= 0.76 ? "PERFECT"
      : charge >= 0.60 && charge <= 0.82 ? "GOOD"
      : charge > 0.82 ? "OVERCHARGE"
      : charge < 0.30 ? "WEAK"
      : "OK"
    // Store in UI for display
    engine.setImpactMsg(timingQuality)

    const slam: SlamParams = {
      tazoId: t.id,
      impactX: reticleX,
      impactZ: reticleZ,
      verticalForce: charge,
      // Critical timing: PERFECT 68-76%, GOOD 60-82%, OVERCHARGE >82%, WEAK <30%
      timingAccuracy: charge >= 0.68 && charge <= 0.76 ? 0.95
        : charge >= 0.60 && charge <= 0.82 ? 0.80
        : charge > 0.82 ? 0.55
        : charge < 0.30 ? 0.40
        : 0.70,
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

      const { staked: newStaked, result: impact } = simulateSlam(t, slam, currentCtx.stakedTazos, cfg.arena, "player", ctxDefenders)
      const { playerDelta, opponentDelta, playerLostTazos, opponentLostTazos } = scoreBettingImpact(impact, "player")

      // Resolve through FSM
      engine.physicsDone(impact, newStaked)
      setAirborne(null)

      engine.setImpactMsg(
                impact.hitZone && impact.hitZone !== "MISS"
                  ? `${impact.description} · ${impact.hitZone}`
                  : impact.description
              )
      engine.setShowImpact(true)

      if (playerDelta > 0) { spawnPopup(`+${playerDelta}`, "var(--ttg-player)", "left"); playSfx("score_pop", 0.3) }
      if (opponentDelta > 0) { spawnPopup(`+${opponentDelta}`, "var(--ttg-opponent)", "right"); playSfx("score_pop", 0.3) }
      if (playerLostTazos > 0) { spawnPopup(`-${playerLostTazos} tazo`, "var(--ttg-opponent)", "left"); playSfx("damage_taken", 0.35) }
      if (opponentLostTazos > 0) { spawnPopup(`-${opponentLostTazos} tazo`, "var(--ttg-player)", "right"); playSfx("damage_taken", 0.35) }

      // ── After player slam: advance FSM through capture → score → turn end ──
      setTimeout(() => {
        if (!mountedRef.current) return
        engine.setShowImpact(false)
        engine.captureResolved()
        
        setTimeout(() => {
          if (!mountedRef.current) return
          engine.scoreUpdated()
          
          setTimeout(() => {
            if (!mountedRef.current) return
            engine.turnOver()
            engine.setBusy(false)
          }, 400) // Reduced from 500ms
        }, 500) // Reduced from 800ms
      }, 600) // Reduced from 700ms
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
        const { staked: pvpOppStaked, result: impact } = simulateSlam(oppTazo, slam, engine.ctx.stakedTazos, cfg.arena, "opponent", ctxDefenders)
        const scoring = scoreBettingImpact(impact, "opponent")
        engine.physicsDone(impact, pvpOppStaked)
        engine.setImpactMsg(impact.description || "")
        engine.setShowImpact(true)

        if (scoring.opponentDelta > 0) { spawnPopup(`+${scoring.opponentDelta}`, "var(--ttg-opponent)", "right"); playSfx("score_pop", 0.3) }
        if (scoring.playerDelta > 0) { spawnPopup(`+${scoring.playerDelta}`, "var(--ttg-player)", "left"); playSfx("score_pop", 0.3) }
        if (scoring.playerLostTazos > 0) { spawnPopup(`-${scoring.playerLostTazos} tazo`, "var(--ttg-opponent)", "left"); playSfx("damage_taken", 0.35) }

        setTimeout(() => {
          engine.setShowImpact(false)
          const c2 = engine.ctx
          const newPS = (c2?.player.score ?? 0) + scoring.playerDelta
          const newOS = (c2?.opponent.score ?? 0) + scoring.opponentDelta
          const end = checkMatchEnd(newPS, newOS,
            Math.max(0, (c2?.playerRemaining ?? 0) - scoring.playerLostTazos),
            Math.max(0, (c2?.opponentRemaining ?? 0) - scoring.opponentLostTazos),
            cfg?.scoreToWin)
          if (end) {
            engine.turnOver()
          } else {
            engine.turnOver()
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

    // Drive FSM: player_tilt → slamming
    engine.releaseSlam()

    // Send to opponent via WebSocket
    pvp.sendTurnAction({
      phase: "slam",
      betTazoId: t.id,
      slamParams: { tazoId: t.id, impactX: reticleX, impactZ: reticleZ, verticalForce: charge,
        // Critical timing: PERFECT 68-76%, GOOD 60-82%, OVERCHARGE >82%, WEAK <30%
      timingAccuracy: charge >= 0.68 && charge <= 0.76 ? 0.95
        : charge >= 0.60 && charge <= 0.82 ? 0.80
        : charge > 0.82 ? 0.55
        : charge < 0.30 ? 0.40
        : 0.70,
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
      // Determine timing quality for feedback
    const timingQuality: string =
      charge >= 0.68 && charge <= 0.76 ? "PERFECT"
      : charge >= 0.60 && charge <= 0.82 ? "GOOD"
      : charge > 0.82 ? "OVERCHARGE"
      : charge < 0.30 ? "WEAK"
      : "OK"
    // Store in UI for display
    engine.setImpactMsg(timingQuality)

    const slam: SlamParams = { tazoId: t.id, impactX: reticleX, impactZ: reticleZ, verticalForce: charge,
        // Critical timing: PERFECT 68-76%, GOOD 60-82%, OVERCHARGE >82%, WEAK <30%
      timingAccuracy: charge >= 0.68 && charge <= 0.76 ? 0.95
        : charge >= 0.60 && charge <= 0.82 ? 0.80
        : charge > 0.82 ? 0.55
        : charge < 0.30 ? 0.40
        : 0.70,
        tilt: tiltDir, tiltIntensity, spinIntensity,
        aimPrecision: Math.max(0.2, (t.precision || 50) / 100) }
      const { staked: pvpPlStaked, result: impact } = simulateSlam(t, slam, engine.ctx.stakedTazos, cfg.arena, "player", ctxDefenders)
      const scoring = scoreBettingImpact(impact, "player")
      engine.physicsDone(impact, pvpPlStaked)
      setAirborne(null)
      engine.setImpactMsg(
                impact.hitZone && impact.hitZone !== "MISS"
                  ? `${impact.description} · ${impact.hitZone}`
                  : impact.description
              )
      engine.setShowImpact(true)

      if (scoring.playerDelta > 0) { spawnPopup(`+${scoring.playerDelta}`, "var(--ttg-player)", "left"); playSfx("score_pop", 0.3) }
      if (scoring.opponentDelta > 0) { spawnPopup(`+${scoring.opponentDelta}`, "var(--ttg-opponent)", "right"); playSfx("score_pop", 0.3) }

      const newPS = (engine.ctx?.player?.score ?? 0) + scoring.playerDelta
      const newOS = (engine.ctx?.opponent?.score ?? 0) + scoring.opponentDelta
      const end = checkMatchEnd(newPS, newOS,
        Math.max(0, (engine.ctx?.playerRemaining ?? 0) - scoring.playerLostTazos),
        Math.max(0, (engine.ctx?.opponentRemaining ?? 0) - scoring.opponentLostTazos),
        cfg?.scoreToWin)

      setTimeout(() => {
        engine.setShowImpact(false)
        if (end) {
          engine.turnOver()
          pvp.sendGameOver({ winner: end.winner, score: `${newPS}-${newOS}` })
        } else {
          engine.turnOver()
        }
        engine.setBusy(false)
      }, 1500)
    }, fallTimeMs * 0.75)
  }, [engine, cfg, ctx, deck, airborne, pvp])

  // Use PvP slam handler when in PvP mode
  const effectiveSlamRelease = pvp ? handleSlamForPvP : handleSlamRelease

  // ── Unified Entrance Overlay (loading + auto-start) ──
  // Single polished full-viewport loading experience with scanlines.
  // Handles both the initial "loading" state and the auto-start
  // brief "entering" transition (before GameLobby would appear).
  {
    const isEntering = !loading && phase === "lobby" &&
      typeof window !== "undefined" &&
      sessionStorage.getItem("battle_mode") &&
      sessionStorage.getItem("battle_deckId")
    if (loading || isEntering) return (
      <div style={{ position: "fixed", inset: 0, zIndex: 9990, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0a0a0a 0%, var(--ttg-black) 100%)" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.06, backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,204,0,0.4) 8px, rgba(255,204,0,0.4) 10px)" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ position: "relative", width: 88, height: 88 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(255,204,0,0.05)", animation: "ping 1.8s ease-out infinite" }} />
            <div style={{ position: "absolute", inset: 8, borderRadius: "50%", border: "3px solid rgba(255,204,0,0.12)", borderTopColor: "var(--ttg-yellow)", animation: "spin 0.8s linear infinite", boxShadow: "0 0 40px rgba(255,204,0,0.12)" }} />
          </div>
          <p style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.55)", margin: 0 }}>
            {loading ? "Loading Arena" : "Entering Arena"}
          </p>
          <p style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5em", color: "rgba(255,204,0,0.18)", margin: 0 }}>
            PREPARING YOUR TAZOS...
          </p>
        </div>
      </div>
    )
  }

  // ── Lobby ──
  if (phase === "lobby") return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-7xl">
        <GameLobby
          playerTazos={tazos}
          playerDecks={allDecks.length > 0 ? allDecks : undefined}
          selectedDeckId={allDecks.length > 0 ? selectedDeckId : undefined}
          onSelectDeck={allDecks.length > 0 ? handleSelectDeck : undefined}
          onStart={start}
          isLoading={false}
          isAuthenticated={!!user}
        />
      </div>
    </div>
  )

  // ── Match End ──
  if (phase === "match_end" && result) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9995, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 16px", background: "linear-gradient(135deg, #0a0a0a 0%, var(--ttg-black) 100%)" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.04, backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,204,0,0.4) 8px, rgba(255,204,0,0.4) 10px)" }} />
      <div className="w-full max-w-lg" style={{ position: "relative", zIndex: 1 }}>
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
      <div className="text-center mt-4">
        <button onClick={back}
          className="px-5 py-2 text-[10px] font-black uppercase tracking-[0.15em] transition-all"
          style={{
            background: "white", color: "var(--ttg-black)",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          }}>
          <RotateCcw className="w-3.5 h-3.5 inline mr-1.5" /> Back to Lobby
        </button>
      </div>
      </div>
    </div>
  )

  // ── Battle Arena ──
  const isAiming = phase === "aim" || phase === "charge" || phase === "throw"
  const showReticle = (isAiming || phase === "stake_player" || phase === "stake_reveal") && !placingStake
  const throwing = ctx?.playerBetTazo || (deck.length > 0 ? deck[0] : null)

  return (
    <BattleErrorBoundary>
    <WebGLGuard>
    <div ref={containerRef} className={`w-full h-full ${isFullscreen ? "fixed inset-0 z-[9999]" : "absolute inset-0"}`} style={{ ...(isFullscreen ? { background: "var(--ttg-arena-bg)" } : {}), animation: "battleFadeIn 0.45s ease-out" }}>
      {/* Battle fade-in keyframe */}
      <style>{`@keyframes battleFadeIn{from{opacity:0;transform:scale(.995)}to{opacity:1;transform:scale(1)}}`}</style>
      {/* Tutorial */}
      {showTutorial && <BattleTutorial onClose={() => setShowTutorial(false)} />}
      
      {/* Magazine editorial toolbar */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-end gap-1.5 pt-2 pointer-events-auto">
        <button onClick={() => setShowTutorial(true)}
          className="p-2 border border-white/5 text-white/25 hover:text-white/60 hover:border-white/10 transition-all"
          style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2))", backdropFilter: "blur(8px)" }}
          title="How to play">
          <Swords className="w-3.5 h-3.5" />
        </button>
        <button onClick={toggleFullscreen}
          className="p-2 border border-white/5 text-white/25 hover:text-white/60 hover:border-white/10 transition-all"
          style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2))", backdropFilter: "blur(8px)" }}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
        </div>
        </div>
      </div>

      <BattleArena3D
        config={cfg?.arena || DEFAULT_ARENA_3D}
        stakedTazos={staked}
        airborneTazo={airborne}
        gamePhase={phase}
        showReticle={showReticle}
        reticleX={engine.ui.reticleX}
        reticleZ={engine.ui.reticleZ}
        playerDeckCount={deckRemainingCount}
        playerDeckTotal={deckTotalCount}
        playerDeckFranchise={deckFranchise}
        playerDeckImages={deckImages}
        opponentDeckCount={opponentRemaining}
        opponentDeckTotal={ctx?.opponent?.deck?.length || cfg?.opponentDeck?.length || 0}
        opponentDeckFranchise={opponentHand[0]?.franchise || "minimon"}
        opponentDeckImages={opponentHand.slice(0, 5).map(t => t.imageUrl || "").filter(Boolean)}
        isDrawing={isDrawing}
        drawTrigger={drawTrigger}
      >
        {/* ── Side Stacks (Player left, Opponent right) ── */}
        <BattleSideStack
          playerName="You"
          totalTazos={deck.length}
          remainingTazos={playerRemaining}
          capturedTazos={pScore}
          side="left"
          isActive={phase === "aim" || phase === "charge" || phase === "throw"}
          playerType="player"
          franchise={playerHand[0]?.franchise}
        />
        <BattleSideStack
          playerName={cfg?.mode === "practice" ? `AI (${cfg.aiDifficulty})` : "Opponent"}
          totalTazos={cfg?.opponentDeck?.length || 0}
          remainingTazos={opponentRemaining}
          capturedTazos={oScore}
          side="right"
          isActive={(phase === "aim" || phase === "throw") && ctx?.currentThrower === "opponent"}
          playerType="opponent"
          franchise={opponentHand[0]?.franchise}
        />

        {(phase === "match_intro" || phase === "draw_initial_hand") && <IntroCinematic
          playerName={user?.name || user?.email?.split("@")[0] || "Player"}
          deckName={selectedDeckName}
          deckSize={deck.length}
          playerHand={playerHand}
          opponentHand={opponentHand}
          countdown={introCountdown}
          introCinematicPhase={introCinematicPhase}
        />}

        {/* ── HUD overlay — Compact header, full-width ── */}
        <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
          <div className="pointer-events-auto">
            <BattleHUD
              playerName={user?.name || user?.email?.split("@")[0] || "You"}
              opponentName={cfg?.mode === "practice" ? `AI ${cfg?.aiDifficulty || "Skilled"}` : "Rival"}
              playerScore={pScore}
              opponentScore={oScore}
              playerTazos={ctx?.playerRemaining ?? 0}
              opponentTazos={ctx?.opponentRemaining ?? 0}
              playerCaptured={ctx?.player?.captured ?? 0}
              opponentCaptured={ctx?.opponent?.captured ?? 0}
              round={round}
              phase={phase}
              turnPlayer={ctx?.currentThrower ?? null}
            />
          </div>

          {/* Score popups */}
          {scorePopups.map((p, i) => (
            <div key={p.id}
              className="absolute pointer-events-none z-30"
              style={{
                top: `calc(45% - ${i * 38}px)`,
                left: "50%",
                transform: "translateX(-50%)",
                color: p.color,
                fontSize: p.text.length > 2 ? "20px" : "36px",
                fontWeight: 900,
                textShadow: `0 0 24px ${p.color}, 0 0 48px ${p.color}40, 0 4px 12px rgba(0,0,0,0.9)`,
                animation: "floatingScore 1.8s ease-out forwards",
                letterSpacing: "0.05em",
              }}
            >{p.text}</div>
          ))}

          {/* ── Hit Feedback Overlay ── */}
          {(phase === "physics_resolve" || engine.ui.showImpact) && engine.ui.impactMsg && (
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 pointer-events-none z-40">
              <div className="animate-[popUp_0.35s_ease-out] text-center">
                <div className={[
                  "text-4xl sm:text-5xl font-black tracking-tight",
                  engine.ui.impactMsg === "PERFECT" ? "text-ttg-success" :
                  engine.ui.impactMsg === "GOOD" ? "text-ttg-yellow" :
                  engine.ui.impactMsg === "OVERCHARGE" ? "text-ttg-opponent" :
                  engine.ui.impactMsg === "WEAK" ? "text-gray-400" :
                  engine.ui.impactMsg === "CENTER HIT" ? "text-ttg-player" :
                  engine.ui.impactMsg === "EDGE HIT" ? "text-ttg-dracobell" :
                  engine.ui.impactMsg === "RIM HIT" ? "text-ttg-yellow/70" :
                  engine.ui.impactMsg === "DOUBLE FLIP!" ? "text-ttg-yellow" :
                  engine.ui.impactMsg === "CAPTURED!" ? "text-ttg-success" :
                  engine.ui.impactMsg === "SECURED!" ? "text-ttg-player" :
                  "text-white"
                ].join(" ")}
                style={{ textShadow: engine.ui.impactMsg === "PERFECT" ? "0 0 40px rgba(34,197,94,0.8)" : engine.ui.impactMsg === "DOUBLE FLIP!" ? "0 0 40px rgba(255,204,0,0.8)" : engine.ui.impactMsg === "CAPTURED!" ? "0 0 30px rgba(34,197,94,0.6)" : "0 0 20px rgba(0,0,0,0.5)" }}>
                  {engine.ui.impactMsg === "PERFECT" ? "⚡ PERFECT SLAM!" :
                   engine.ui.impactMsg === "GOOD" ? "GOOD SLAM" :
                   engine.ui.impactMsg === "OVERCHARGE" ? "OVERCHARGE!" :
                   engine.ui.impactMsg === "WEAK" ? "TOO WEAK" :
                   engine.ui.impactMsg}
                </div>
              </div>
            </div>
          )}

          {/* ── Capture Overlay (capture_check phase) ── */}
          {showCaptureOverlay && ctx?.lastImpact && (
            <CaptureOverlay
              impact={ctx.lastImpact}
              thrower={ctx.currentThrower || "player"}
              playerTazo={ctx.playerBetTazo}
              opponentTazo={ctx.opponentBetTazo}
            />
          )}

          {/* ── Round Won Overlay ── */}
          {showRoundOverlay && (
            <RoundWonOverlay
              roundNumber={round}
              playerScore={pScore}
              opponentScore={oScore}
              playerRemaining={playerRemaining}
              opponentRemaining={opponentRemaining}
            />
          )}

          {/* Impact particles */}
          {(phase === "physics_resolve" || engine.ui.showImpact) && (
            <div className="absolute top-1/2 left-1/2 pointer-events-none" style={{ transform: "translate(-50%, -50%)" }}>
              {[...Array(24)].map((_, i) => {
                const angle = (i / 24) * Math.PI * 2
                const dist = 50 + Math.random() * 100
                const px = Math.cos(angle) * dist
                const py = Math.sin(angle) * dist
                const size = 3 + Math.random() * 6
                const color = ["var(--ttg-yellow)", "var(--ttg-dracobell)", "var(--ttg-warning)", "var(--ttg-yellow-hover)", "#FFF", "var(--ttg-yellow)"][Math.floor(Math.random() * 6)]
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
          {bettingPhase === "revealed" && selectedBetId && opponentBetId && (() => {
            const pt = playerHand.find(t => t.id === selectedBetId)
            const ot = opponentHand.find(t => t.id === opponentBetId)
            if (!pt || !ot) return null
            return (
              <BettingReveal
                playerTazo={pt}
                opponentTazo={ot}
              />
            )
          })()}

          {/* Coin flip overlay */}
          {/* Coin flip removed */}

          {/* Round banner */}
          {roundBanner !== null && (
            <div className="absolute top-[32%] left-1/2 -translate-x-1/2 pointer-events-none z-30">
              <div className="animate-[popUp_0.3s_ease-out]" key={roundBanner}>
                <div className="text-[10px] font-black text-ttg-yellow/40 uppercase tracking-[0.3em] text-center mb-1">Round</div>
                <div className="text-5xl font-black text-ttg-yellow text-center" style={{ textShadow: "0 0 30px #ffcc0060" }}>
                  {roundBanner}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Slam Controls ── */}
        {/* ── Placement Phase (manual stake positioning) ── */}
        {placingStake && phase === "stake_player" && playerHand.length > 0 && (() => {
          const pt = playerHand.find(t => t.id === selectedBetId) || playerHand[0]
          return (
            <PlacementPhase
              key={pt.id}
              tazoName={pt.name}
              tazoFranchise={pt.franchise}
              tazoImageUrl={pt.imageUrl}
              tazoStats={{ atk: pt.attack, def: pt.defense, spd: pt.spin, acc: pt.precision, ctrl: pt.control, pwr: pt.attack }}
              stakeX={playerStakeX}
              stakeZ={playerStakeZ}
              onPlace={(x, z) => handlePlaceStake(x, z)}
              onBack={back}
            />
          )
        })()}

        {/* ── Select Phase (select_tazo) ── */}
        {(phase === "select_tazo" || phase === "stake_player") && playerHand.length > 0 && (
          <SelectPhase
            hand={playerHand}
            phase={phase === "stake_player" ? "stake" : "select"}
            selectedId={phase === "stake_player" ? selectedBetId : selectedLauncherId}
            betId={phase === "select_tazo" ? ctx?.playerBetTazo?.id : undefined}
            onSelect={(tazo) => {
              if (phase === "stake_player") {
                setSelectedBetId(tazo.id)
                // Handled by PlacementPhase + handlePlaceStake
              } else {
                setSelectedLauncherId(tazo.id)
                engine.selectTazo(tazo)
              }
            }}
          />
        )}

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
        ) : (!placingStake ? (
          <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-center pb-24 pointer-events-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex justify-center pointer-events-auto">
            <button onClick={back}
              className="px-4 py-1.5 text-[8px] font-black text-white/20 hover:text-white/50 uppercase tracking-[0.2em] rounded-full transition-all"
              style={{
                background: "linear-gradient(135deg, rgba(0,0,0,0.5), rgba(0,0,0,0.2))",
                border: "1px solid rgba(255,255,255,0.04)",
                backdropFilter: "blur(8px)",
              }}>
              Leave Battle
            </button>
            </div>
          </div>
        ) : null)}
      </BattleArena3D>
    </div>
    </WebGLGuard>
    </BattleErrorBoundary>
  )
}
