"use client"

// Fullscreen Battle — wraps BattleView but auto-starts in selected mode,
// skipping the lobby. Served inside GameShell on /game/* routes.

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  simulateThrow, generateAIMove, checkMatchEnd, DEFAULT_ARENA_3D,
} from "@/lib/battle/game-loop"
import type {
  GameState, PlayMode, AIDifficulty,
  TazoCard, DiscPhysics, MatchConfig, MatchResult, ThrowParams,
} from "@/lib/battle/game-loop"
import type { BattleFinalResult } from "@/lib/battle"
import BattleArena3D from "./battle-arena-3d"
import BattleHUD from "./battle-hud"
import LaunchSystem from "./launch-system"
import BattleResultPanel from "./battle-result-panel"
import { Disc3, RotateCcw, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

const BACK_ARTS: Record<string, string> = {
  minimon: "/tazos-artgen/backs/minimon-back.png",
  cybermon: "/tazos-artgen/backs/cybermon-back.png",
  dracobell: "/tazos-artgen/backs/dracobell-back.png",
}

const DEMO_TAZOS: TazoCard[] = [
  { id: "d1", name: "Lumipuff", slug: "lumipuff", franchise: "minimon", imageUrl: "/tazos-artgen/minimon/minimon-001.png", attack: 45, defense: 40, resistance: 35, weight: 35, stability: 40, spin: 55, control: 50, bounce: 45, precision: 55 },
  { id: "d2", name: "Leafroll", slug: "leafroll", franchise: "minimon", imageUrl: "/tazos-artgen/minimon/minimon-004.png", attack: 55, defense: 60, resistance: 50, weight: 35, stability: 55, spin: 40, control: 50, bounce: 50, precision: 48 },
  { id: "d3", name: "Voltcrab-X", slug: "voltcrab-x", franchise: "cybermon", imageUrl: "/tazos-artgen/cybermon/cybermon-001.png", attack: 70, defense: 45, resistance: 50, weight: 55, stability: 50, spin: 60, control: 40, bounce: 35, precision: 45 },
  { id: "d4", name: "Datadrake", slug: "datadrake", franchise: "cybermon", imageUrl: "/tazos-artgen/cybermon/cybermon-002.png", attack: 60, defense: 55, resistance: 50, weight: 45, stability: 55, spin: 50, control: 60, bounce: 45, precision: 55 },
  { id: "d5", name: "Bytefang", slug: "bytefang", franchise: "cybermon", imageUrl: "/tazos-artgen/cybermon/cybermon-003.png", attack: 65, defense: 48, resistance: 42, weight: 48, stability: 45, spin: 62, control: 44, bounce: 40, precision: 50 },
  { id: "d6", name: "Rai Kendo", slug: "rai-kendo", franchise: "dracobell", imageUrl: "/tazos-artgen/dracobell/dracobell-001.png", attack: 75, defense: 45, resistance: 42, weight: 52, stability: 48, spin: 55, control: 47, bounce: 42, precision: 48 },
  { id: "d7", name: "Tenzan Blaze", slug: "tenzan-blaze", franchise: "dracobell", imageUrl: "/tazos-artgen/dracobell/dracobell-002.png", attack: 80, defense: 55, resistance: 52, weight: 58, stability: 55, spin: 65, control: 60, bounce: 48, precision: 55 },
]

function toPanelVictoryType(victoryType: MatchResult["victoryType"]): BattleFinalResult["victoryType"] {
  if (victoryType === "all_captured") return "all_captured"
  if (victoryType === "forfeit") return "surrender"
  return "points"
}

function makeDiscs(deck: TazoCard[], owner: "player" | "opponent", z: number): DiscPhysics[] {
  return deck.map((t, i) => ({
    id: t.id, tazoName: t.name, franchise: t.franchise,
    imageUrl: t.imageUrl, backImageUrl: BACK_ARTS[t.franchise] || null,
    position: [(i - 2) * 0.9, 0.06, z] as [number, number, number],
    velocity: [0,0,0] as [number,number,number],
    rotation: [0,0,0] as [number,number,number],
    angularVelocity: [0,0,0] as [number,number,number],
    facing: "front" as const, state: "stopped" as const, owner,
  }))
}

async function fetchTazos(token: string): Promise<TazoCard[]> {
  try {
    const r = await fetch("/api/tazos?limit=100", { headers: { Authorization: `Bearer ${token}` } })
    if (!r.ok) return []
    const d = await r.json()
    return (d.tazos || []).map((t: any) => ({
      id: t.id, name: t.name || "?", slug: t.slug || (t.name || "?").toLowerCase().replace(/\s/g, "-"),
      franchise: (t.franchiseSlug || t.franchise?.slug || "minimon") as TazoCard["franchise"],
      imageUrl: t.imageUrl || null,
      attack: t.attack || 50, defense: t.defense || 50,
      resistance: t.resistance || 50, weight: t.weight || 50, stability: t.stability || 50,
      spin: t.spin || 50, control: t.control || 50, bounce: t.bounce || 50, precision: t.precision || 50,
    }))
  } catch { return [] }
}

interface FullscreenBattleProps {
  mode: PlayMode
  roomId?: string
}

function getWsUrl(token: string) {
  const configured = process.env.NEXT_PUBLIC_WS_URL
  if (configured) return `${configured.replace(/\/$/, "")}?token=${encodeURIComponent(token)}`
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`
}

export default function FullscreenBattle({ mode, roomId }: FullscreenBattleProps) {
  const { user, token } = useAuth()
  const router = useRouter()
  const [phase, setPhase] = useState<GameState>("lobby")
  const [loading, setLoading] = useState(true)
  const [deck, setDeck] = useState<TazoCard[]>([])
  const [cfg, setCfg] = useState<MatchConfig | null>(null)
  const [pHP, setPHP] = useState(100); const [oHP, setOHP] = useState(100)
  const [pDiscs, setPDiscs] = useState<DiscPhysics[]>([])
  const [oDiscs, setODiscs] = useState<DiscPhysics[]>([])
  const [pCap, setPCap] = useState(0); const [oCap, setOCap] = useState(0)
  const [round, setRound] = useState(1); const [turn, setTurn] = useState(0)
  const [result, setResult] = useState<MatchResult | null>(null)
  const [throwing, setThrowing] = useState<TazoCard | null>(null)
  const [launch, setLaunch] = useState<"aim" | "power">("aim")
  const [aim, setAim] = useState({ x: 0, y: 0, accuracy: 0.8 })
  const [multiplayerStatus, setMultiplayerStatus] = useState("Preparing local match")
  const [matchedOpponent, setMatchedOpponent] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const busy = useRef(false)
  const resultSaved = useRef(false)
  const compact = typeof window !== "undefined" && window.innerWidth < 640

  useEffect(() => {
    if (mode === "practice") return
    if (!token || typeof window === "undefined") {
      setMultiplayerStatus("Login required for PvP")
      return
    }

    const ws = new WebSocket(getWsUrl(token))
    wsRef.current = ws
    setMultiplayerStatus("Connecting to PvP server...")

    ws.onopen = () => {
      if (mode === "pvp_friend") {
        ws.send(JSON.stringify({ type: "join_room", payload: { roomId } }))
        setMultiplayerStatus(`Waiting in room ${roomId || "UNKNOWN"}...`)
      } else {
        ws.send(JSON.stringify({ type: "join_queue" }))
        setMultiplayerStatus("Searching for ranked opponent...")
      }
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === "queue_status") {
        setMultiplayerStatus(`In queue · position ${msg.payload?.position ?? 1}`)
      }
      if (msg.type === "room_waiting") {
        setMultiplayerStatus(`Room ${msg.payload?.roomId || roomId} ready · waiting for friend`)
      }
      if (msg.type === "match_found") {
        setMatchedOpponent(msg.payload?.opponent?.name || "Opponent")
        setMultiplayerStatus(`Matched vs ${msg.payload?.opponent?.name || "Opponent"}`)
      }
      if (msg.type === "opponent_disconnected") {
        setMultiplayerStatus("Opponent disconnected")
      }
      if (msg.type === "room_error") {
        setMultiplayerStatus(msg.payload?.message || "Room error")
      }
    }

    ws.onerror = () => setMultiplayerStatus("PvP server unreachable")
    ws.onclose = () => {
      if (wsRef.current === ws) setMultiplayerStatus("PvP connection closed")
    }

    return () => {
      wsRef.current = null
      ws.close()
    }
  }, [mode, roomId, token])

  // Auto-start: fetch tazos, build deck, begin
  useEffect(() => {
    (async () => {
      let list: TazoCard[] = []
      if (user && token) list = await fetchTazos(token)
      const tazos = list.length >= 5 ? list : DEMO_TAZOS
      const d = tazos.slice(0, 5)
      setDeck(d)
      setLoading(false)

      const opp = [...DEMO_TAZOS].sort(() => Math.random() - 0.5).slice(0, 5)
      const c: MatchConfig = {
        mode, aiDifficulty: mode === "practice" ? "easy" as AIDifficulty : "skilled" as AIDifficulty,
        arena: DEFAULT_ARENA_3D, rounds: 0, playerDeck: d, opponentDeck: opp,
      }
      setCfg(c); setPHP(100); setOHP(100); setPCap(0); setOCap(0)
      setRound(1); setTurn(0); setResult(null); busy.current = false
      setPDiscs(makeDiscs(d, "player", 3.5)); setODiscs(makeDiscs(opp, "opponent", -3.5))
      setThrowing(d[0]); setLaunch("aim")
      setPhase("intro")
      setTimeout(() => setPhase("round_start"), 2200)
      setTimeout(() => { if (!busy.current) setPhase("player_aim") }, 3200)
    })()
  }, [user, token, mode])

  // Opponent turn logic (same as BattleView)
  const doOpponentTurn = useCallback((
    cfg: MatchConfig, _pDiscs: DiscPhysics[], _oDiscs: DiscPhysics[],
    pCap: number, oCap: number, pHP: number, oHP: number, roundN: number, turnN: number
  ) => {
    const t = cfg.opponentDeck[Math.floor(Math.random() * cfg.opponentDeck.length)]
    const m = generateAIMove(t, _pDiscs, _oDiscs, cfg.arena, cfg.aiDifficulty)
    const disc: DiscPhysics = {
      id: t.id, tazoName: t.name, franchise: t.franchise,
      imageUrl: t.imageUrl, backImageUrl: BACK_ARTS[t.franchise] || null,
      position: [(Math.random()-0.5)*1.5, 0.06, cfg.arena.radius*0.4] as [number,number,number],
      velocity: [m.aimX*4, 0, m.aimY*4] as [number,number,number],
      rotation: [0,0,0], angularVelocity: [0,0,0],
      facing: "front", state: "sliding", owner: "opponent" as const,
    }
    let px = disc.position[0], pz = disc.position[2]
    let vx = disc.velocity[0], vz = disc.velocity[2]
    for (let s = 0; s < 35; s++) {
      vx *= cfg.arena.surfaceFriction; vz *= cfg.arena.surfaceFriction
      px += vx * 0.016; pz += vz * 0.016
      if (Math.sqrt(px*px+pz*pz) > cfg.arena.radius) { px *= 0.9; pz *= 0.9 }
    }
    disc.position = [px, 0.06, pz]; disc.state = "stopped"
    let hits = 0; let flips = 0
    const newP = _pDiscs.map(d => {
      if (d.state === "captured") return d
      const dx = px - d.position[0], dz = pz - d.position[2]
      const dist = Math.sqrt(dx*dx+dz*dz)
      if (dist < 0.6 && dist > 0.01) {
        hits++; d.position[0] -= (dx/dist)*0.12; d.position[2] -= (dz/dist)*0.12; d.state = "sliding"
        if (m.power > 0.45 && Math.random() < m.power*0.35) { d.facing = d.facing==="front"?"back":"front"; d.state = "flipped"; flips++ }
        if (Math.sqrt(d.position[0]**2+d.position[2]**2) > cfg.arena.ringOutThreshold) d.state = "captured"
      }
      return d
    })
    const nCap = pCap + newP.filter(d => d.state === "captured").length
    const dmg = Math.round(m.power * 18) + flips * 8 + hits * 4
    const newHP = Math.max(0, pHP - dmg)
    setPDiscs([...newP]); setODiscs([..._oDiscs, disc])
    setPHP(newHP); setPCap(nCap); setTurn(prev => prev + 1)
    const end = checkMatchEnd(
      { id: "player", name: "You", deck, hp: newHP, maxHp: 100, tazosRemaining: deck.length - nCap, captured: nCap, currentTazo: null, isAI: false },
      { id: "opponent", name: "AI", deck: cfg.opponentDeck, hp: oHP, maxHp: 100, tazosRemaining: cfg.opponentDeck.length - oCap, captured: oCap, currentTazo: null, isAI: true },
      newP, [..._oDiscs, disc]
    )
    if (end) { setResult({ ...end, totalTurns: turnN + 1 }); setPhase("match_end"); return }
    setPhase("round_end")
    setTimeout(() => {
      setRound(prev => prev + 1)
      setThrowing(deck[(turnN + 1) % deck.length]); setLaunch("aim"); setPhase("player_aim")
    }, 1800)
  }, [deck])

  const aimLock = useCallback((x: number, y: number, accuracy: number) => {
    setAim({ x, y, accuracy }); setLaunch("power"); setPhase("player_power")
  }, [])

  const powerLock = useCallback((power: number, accuracy: number) => {
    if (!throwing || !cfg || busy.current) return
    busy.current = true
    const p: ThrowParams = {
      tazoId: throwing.id, aimX: aim.x, aimY: aim.y,
      power, powerAccuracy: accuracy, spinType: "none",
      accuracyPenalty: (1-aim.accuracy)*0.35 + (1-accuracy)*0.25, timestamp: Date.now(),
    }
    setPhase("throwing")
    setTimeout(() => {
      if (!cfg) return
      setPhase("physics")
      const r = simulateThrow(throwing, p, oDiscs, cfg.arena)
      setODiscs([...r.discs])
      const dmg = r.result.hpDealt
      setOHP(prev => Math.max(0, prev - dmg))
      setOCap(prev => prev + r.result.discsCaptured.length)
      setTimeout(() => {
        setPhase("resolve")
        const end = checkMatchEnd(
          { id: "player", name: "You", deck, hp: pHP, maxHp: 100, tazosRemaining: deck.length - pCap, captured: pCap, currentTazo: null, isAI: false },
          { id: "opponent", name: "AI", deck: cfg.opponentDeck, hp: Math.max(0, oHP - dmg), maxHp: 100, tazosRemaining: cfg.opponentDeck.length - oCap, captured: oCap, currentTazo: null, isAI: true },
          pDiscs, r.discs
        )
        if (end) { setResult({ ...end, totalTurns: turn + 1 }); setPhase("match_end"); return }
        setTimeout(() => {
          setPhase("opponent_turn")
          setTimeout(() => {
            doOpponentTurn(cfg, pDiscs, r.discs, pCap, oCap, pHP, oHP - dmg, round, turn + 1)
            busy.current = false
          }, 1200)
        }, 1000)
      }, 600)
    }, 500)
  }, [throwing, cfg, aim, deck, pHP, oHP, pDiscs, oDiscs, pCap, oCap, turn, doOpponentTurn])

  const rematch = () => {
    resultSaved.current = false
    window.location.reload() // Easiest way to rematch
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Disc3 className="w-12 h-12 animate-spin text-[#FFCC00]" />
    </div>
  )

  if (phase === "match_end" && result) return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <BattleResultPanel result={{
          winner: result.winner, victoryType: toPanelVictoryType(result.victoryType),
          playerScore: result.playerCaptures, opponentScore: result.opponentCaptures,
          totalTurns: result.totalTurns, playerCaptures: result.playerCaptures,
          opponentCaptures: result.opponentCaptures, summary: result.summary,
        }} playerName="You" opponentName={`AI (${cfg?.aiDifficulty || "skilled"})`} onRematch={rematch} creditsEarned={0} />
        <div className="text-center">
          <button onClick={() => router.push("/app/battle")} className="px-6 py-3 font-black text-sm uppercase text-[#1a1a1a] bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all">
            <ArrowLeft className="w-4 h-4 inline mr-2" /> Back to Lobby
          </button>
        </div>
      </div>
    </div>
  )

  const isPlayer = phase.startsWith("player_")

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* HUD */}
      <BattleHUD
        playerName="You"
        opponentName={matchedOpponent || `AI (${cfg?.aiDifficulty || "skilled"})`}
        playerHP={pHP} playerMaxHP={100}
        opponentHP={oHP} opponentMaxHP={100}
        playerTazos={deck.length} opponentTazos={cfg?.opponentDeck.length || 5}
        playerCaptured={pCap} opponentCaptured={oCap}
        round={round} phase={phase}
        turnPlayer={isPlayer ? "player" : "opponent"}
        compact={compact}
      />
      {mode !== "practice" && (
        <div className="border-y border-[#FFCC00]/20 bg-[#111] px-3 py-1.5 text-center text-[10px] font-black uppercase tracking-[0.12em] text-[#FFCC00]">
          {multiplayerStatus}
        </div>
      )}

      {/* Arena */}
      <div className="flex-1 min-h-0">
        <BattleArena3D
          config={cfg?.arena || DEFAULT_ARENA_3D}
          playerDiscs={pDiscs}
          opponentDiscs={oDiscs}
          gamePhase={phase}
          compact={compact}
        />
      </div>

      {/* Controls */}
      <div className="flex-shrink-0">
        {(phase === "player_aim" || phase === "player_power") ? (
          <LaunchSystem
            phase={launch}
            onAimLock={aimLock}
            onPowerLock={powerLock}
            throwingTazoName={throwing?.name || "?"}
            throwingTazoFranchise={throwing?.franchise || "minimon"}
          />
        ) : phase === "throwing" ? (
          <div className="bg-[#1a1a1a] p-4 text-center border-t border-[#FFCC00]/20">
            <Disc3 className="w-8 h-8 mx-auto animate-spin text-[#FFCC00]" />
            <p className="font-black text-xs text-white/40 mt-2 uppercase tracking-[0.15em]">Throwing...</p>
          </div>
        ) : phase === "physics" ? (
          <div className="bg-[#1a1a1a] p-4 text-center border-t border-[#FFCC00]/20">
            <Disc3 className="w-8 h-8 mx-auto animate-spin text-[#F59E0B]" />
            <p className="font-black text-xs text-white/40 mt-2 uppercase tracking-[0.15em]">Resolving...</p>
          </div>
        ) : phase === "opponent_turn" ? (
          <div className="bg-[#2a0000] p-4 text-center border-t border-[#E3350D]/30">
            <Disc3 className="w-8 h-8 mx-auto animate-spin text-[#E3350D]" />
            <p className="font-black text-xs text-[#E3350D]/80 mt-2 uppercase tracking-[0.15em]">Opponent throws...</p>
          </div>
        ) : phase === "round_end" ? (
          <div className="bg-[#0a2a0a] p-3 border-t border-[#22C55E]/30 text-center">
            <p className="font-black text-xs text-[#22C55E] uppercase tracking-[0.12em]">Round {round} done</p>
          </div>
        ) : phase === "intro" ? (
          <div className="bg-[#1a1a1a] p-4 text-center border-t border-[#FFCC00]/20">
            <p className="font-black text-sm text-[#FFCC00] uppercase tracking-[0.15em] animate-pulse">GET READY!</p>
          </div>
        ) : phase === "round_start" ? (
          <div className="bg-[#1a1a1a] p-4 text-center border-t border-[#FFCC00]/20">
            <p className="font-black text-xs text-white/60 uppercase tracking-[0.15em]">Round {round} — FIGHT!</p>
          </div>
        ) : (
          <button onClick={() => router.push("/app/battle")} className="w-full py-2.5 text-[10px] font-bold text-white/20 hover:text-[#E3350D] uppercase transition-colors bg-[#1a1a1a] border-t border-white/5">
            Leave Battle
          </button>
        )}
      </div>
    </div>
  )
}
