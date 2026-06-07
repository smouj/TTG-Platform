// ============================================================
// Trading Tazos Game — Battle View v2
// Full-page 3D arena with overlaid launching controls,
// real disc physics, orbit camera, proper front/back tazos.
// ============================================================
"use client"

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
import GameLobby from "./battle/game-lobby"
import BattleArena3D from "./battle/battle-arena-3d"
import LaunchSystem from "./battle/launch-system"
import BattleResultPanel from "./battle/battle-result-panel"
import { Disc3, RotateCcw } from "lucide-react"

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
      franchise: (t.franchise || t.franchiseSlug || "minimon") as TazoCard["franchise"],
      imageUrl: t.imageUrl || null,
      attack: t.attack || 50, defense: t.defense || 50,
      resistance: t.resistance || 50, weight: t.weight || 50, stability: t.stability || 50,
      spin: t.spin || 50, control: t.control || 50, bounce: t.bounce || 50, precision: t.precision || 50,
    }))
  } catch { return [] }
}

export default function BattleView() {
  const { user, token } = useAuth()
  const [phase, setPhase] = useState<GameState>("lobby")
  const [loading, setLoading] = useState(true)
  const [tazos, setTazos] = useState<TazoCard[]>([])
  const [deck, setDeck] = useState<TazoCard[]>([])
  const [cfg, setCfg] = useState<MatchConfig | null>(null)
  const [pHP, setPHP] = useState(100); const [oHP, setOHP] = useState(100)
  const [pDiscs, setPDiscs] = useState<DiscPhysics[]>([])
  const [oDiscs, setODiscs] = useState<DiscPhysics[]>([])
  const [pCap, setPCap] = useState(0); const [oCap, setOCap] = useState(0)
  const [round, setRound] = useState(1); const [turn, setTurn] = useState(0)
  const [result, setResult] = useState<MatchResult | null>(null)
  const [creditsEarned, setCreditsEarned] = useState(0)
  const [throwing, setThrowing] = useState<TazoCard | null>(null)
  const [launch, setLaunch] = useState<"aim" | "power">("aim")
  const [aim, setAim] = useState({ x: 0, y: 0, accuracy: 0.8 })
  const [hitsLanded, setHitsLanded] = useState(0)
  const busy = useRef(false)
  const resultSaved = useRef(false)

  const saveBattleResult = useCallback(async (matchResult: MatchResult, playerDeck: TazoCard[], opponentDeck: TazoCard[]) => {
    if (resultSaved.current) return
    resultSaved.current = true
    try {
      const headers: Record<string,string> = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Bearer ${token}`
      const r = await fetch("/api/battle", {
        method: "POST", headers,
        body: JSON.stringify({
          playerTazoIds: playerDeck.map(t => t.id),
          opponentTazoIds: opponentDeck.map(t => t.id),
          physicsResult: {
            winner: matchResult.winner,
            playerScore: matchResult.playerScore, opponentScore: matchResult.opponentScore,
            captures: matchResult.playerCaptures + matchResult.opponentCaptures,
            ringOuts: 0, flips: 0, totalTurns: matchResult.totalTurns || 1,
          },
        }),
      })
      if (r.ok) { const data = await r.json(); setCreditsEarned(data.creditsEarned || 0) }
    } catch {}
  }, [token])

  useEffect(() => {
    if (phase === "match_end" && result && cfg) saveBattleResult(result, deck, cfg.opponentDeck)
  }, [phase, result, cfg, deck, saveBattleResult])

  useEffect(() => {
    (async () => {
      let list: TazoCard[] = DEMO_TAZOS
      if (user && token) {
        const fetched = await fetchTazos(token)
        if (fetched.length >= 5) list = fetched
      }
      setTazos(list); setLoading(false)
    })()
  }, [user, token])

  const doOpponentTurn = useCallback((
    cfg: MatchConfig, _pDiscs: DiscPhysics[], _oDiscs: DiscPhysics[],
    pCap: number, oCap: number, pHP: number, oHP: number, turnN: number
  ) => {
    const t = cfg.opponentDeck[Math.floor(Math.random() * cfg.opponentDeck.length)]
    const m = generateAIMove(t, _pDiscs, _oDiscs, cfg.arena, cfg.aiDifficulty)
    const disc: DiscPhysics = {
      id: t.id, tazoName: t.name, franchise: t.franchise,
      imageUrl: t.imageUrl, backImageUrl: BACK_ARTS[t.franchise] || null,
      position: [(Math.random()-0.5)*1.5, 0.06, -cfg.arena.radius*0.4] as [number,number,number],
      velocity: [m.aimX*5, 0, -m.aimY*5] as [number,number,number],
      rotation: [0,0,0] as [number,number,number],
      angularVelocity: [0,0,0] as [number,number,number],
      facing: "front", state: "sliding" as const, owner: "opponent" as const,
    }
    // Simulate physics trajectory
    let px = disc.position[0], pz = disc.position[2]
    let vx = disc.velocity[0], vz = disc.velocity[2]
    for (let s = 0; s < 45; s++) {
      vx *= cfg.arena.surfaceFriction; vz *= cfg.arena.surfaceFriction
      px += vx*0.016; pz += vz*0.016
      if (Math.sqrt(px*px+pz*pz) > cfg.arena.ringOutThreshold) { px *= 0.88; pz *= 0.88 }
    }
    disc.position = [px, 0.06, pz]; disc.velocity = [vx*0.3, 0, vz*0.3]; disc.state = "stopped"

    let hits = 0; let flips = 0
    const newP = _pDiscs.map(d => {
      if (d.state === "captured") return d
      const dx = px - d.position[0], dz = pz - d.position[2]
      const dist = Math.sqrt(dx*dx+dz*dz)
      if (dist < 0.65 && dist > 0.01) {
        hits++
        const nx = dx/dist, nz = dz/dist
        d.position = [d.position[0] + nx*0.14, d.position[1], d.position[2] + nz*0.14]
        d.velocity = [nx*m.power*3, 0, nz*m.power*3]
        d.state = "sliding"
        if (m.power > 0.4 && Math.random() < m.power*0.35) { d.facing = d.facing==="front"?"back":"front"; flips++ }
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
    }, 2000)
  }, [deck])

  const start = useCallback((mode: PlayMode, diff: AIDifficulty, d: TazoCard[]) => {
    setDeck(d)
    const opp = [...DEMO_TAZOS].sort(() => Math.random()-0.5).slice(0,5)
    const c: MatchConfig = { mode, aiDifficulty: diff, arena: DEFAULT_ARENA_3D, rounds: 0, playerDeck: d, opponentDeck: opp }
    setCfg(c); setPHP(100); setOHP(100); setPCap(0); setOCap(0)
    setRound(1); setTurn(0); setResult(null); busy.current = false; setHitsLanded(0)
    setPDiscs(makeDiscs(d, "player", 4)); setODiscs(makeDiscs(opp, "opponent", -4))
    setThrowing(d[0]); setLaunch("aim"); setPhase("intro")
    setTimeout(() => setPhase("round_start"), 2000)
    setTimeout(() => { if (!busy.current) setPhase("player_aim") }, 3000)
  }, [])

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
    // Add launch velocity to the throwing disc
    setPDiscs(prev => prev.map(d => {
      if (d.id !== throwing.id) return d
      // Launch velocity: -aim.y = forward (toward opponent at -z)
      const speed = 4 + power * 8
      return {
        ...d,
        velocity: [aim.x * speed * 0.7, 0, -aim.y * speed],
        position: [d.position[0], 0.06, 4], // launch from player side
        state: "sliding" as const,
        facing: "front" as const,
      }
    }))

    setTimeout(() => {
      if (!cfg) return
      setPhase("physics")
      const r = simulateThrow(throwing, p, oDiscs, cfg.arena)
      setODiscs([...r.discs])
      const dmg = r.result.hpDealt
      setOHP(prev => Math.max(0, prev - dmg))
      setOCap(prev => prev + r.result.discsCaptured.length)
      // Bounce effect on hits
      const totalHits = (r.result as any).flipsTriggered || r.result.discsCaptured.length
      setHitsLanded(totalHits)

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
            doOpponentTurn(cfg, pDiscs, r.discs, pCap, oCap, pHP, oHP - dmg, turn + 1)
            busy.current = false
          }, 1500)
        }, 800)
      }, 400)
    }, 300)
  }, [throwing, cfg, aim, deck, pHP, oHP, pDiscs, oDiscs, pCap, oCap, turn, doOpponentTurn])

  const rematch = () => { resultSaved.current = false; setCreditsEarned(0); if (cfg) start(cfg.mode, cfg.aiDifficulty, deck) }
  const back = () => { resultSaved.current = false; setCreditsEarned(0); setPhase("lobby"); setCfg(null); setResult(null); setThrowing(null) }

  if (loading) return (
    <div className="flex items-center justify-center py-28">
      <Disc3 className="w-12 h-12 animate-spin text-[#FFCC00]" />
    </div>
  )

  if (phase === "lobby") return <GameLobby playerTazos={tazos} onStart={start} isLoading={false} isAuthenticated={!!user} />

  if (phase === "match_end" && result) return (
    <div className="max-w-md mx-auto space-y-4">
      <BattleResultPanel result={{
        winner: result.winner, victoryType: toPanelVictoryType(result.victoryType),
        playerScore: result.playerCaptures, opponentScore: result.opponentCaptures,
        totalTurns: result.totalTurns, playerCaptures: result.playerCaptures,
        opponentCaptures: result.opponentCaptures, summary: result.summary,
      }} playerName="You" opponentName={`AI (${cfg?.aiDifficulty})`} onRematch={rematch} creditsEarned={creditsEarned} />
      <div className="text-center">
        <button onClick={back} className="px-6 py-3 font-black text-sm uppercase text-[#1a1a1a] bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
          <RotateCcw className="w-4 h-4 inline mr-2" /> Back to Lobby
        </button>
      </div>
    </div>
  )

  // ── Full-page 3D Arena with overlaid controls ──
  return (
    <div className="w-full" style={{ height: "calc(100vh - 56px)" }}>
      <BattleArena3D
        config={cfg?.arena || DEFAULT_ARENA_3D}
        playerDiscs={pDiscs}
        opponentDiscs={oDiscs}
        gamePhase={phase}
      >
        {/* HUD overlay top */}
        <div className="absolute top-0 left-0 right-0 p-3">
          <div className="flex items-center justify-between">
            {/* Player side */}
            <div className="flex items-center gap-3 bg-black/60 backdrop-blur-sm rounded px-3 py-2 border border-white/10">
              <span className="text-xs font-black text-white tracking-wide">YOU</span>
              <div className="flex items-center gap-1.5">
                <div className="w-24 h-3 bg-white/15 rounded-full overflow-hidden border border-white/20">
                  <div className="h-full transition-all duration-300"
                    style={{ width: `${pHP}%`, background: "linear-gradient(90deg, #29ADFF, #00A1E9)" }} />
                </div>
                <span className="text-[9px] font-black text-white/70">{pHP}%</span>
              </div>
              <span className="text-[8px] font-black text-white/40">{deck.length - pCap} tazos</span>
            </div>

            {/* Round indicator */}
            <div className="flex flex-col items-center">
              <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.3em]">Round</span>
              <span className="text-sm font-black text-[#FFCC00]">{round}</span>
            </div>

            {/* Opponent side */}
            <div className="flex items-center gap-3 bg-black/60 backdrop-blur-sm rounded px-3 py-2 border border-white/10">
              <span className="text-[8px] font-black text-white/40">{cfg?.opponentDeck.length || 5} tazos</span>
              <div className="flex items-center gap-1.5">
                <div className="w-24 h-3 bg-white/15 rounded-full overflow-hidden border border-white/20">
                  <div className="h-full transition-all duration-300"
                    style={{ width: `${oHP}%`, background: "linear-gradient(90deg, #FF004D, #E3350D)" }} />
                </div>
                <span className="text-[9px] font-black text-white/70">{oHP}%</span>
              </div>
              <span className="text-xs font-black text-white tracking-wide">AI</span>
            </div>
          </div>

          {/* Phase status */}
          <div className="text-center mt-1">
            {(phase === "player_aim" || phase === "player_power") && (
              <span className="text-[9px] font-black text-[#FFCC00] bg-black/50 px-3 py-0.5 rounded-full border border-[#FFCC00]/30">
                YOUR TURN — {(throwing?.name || "?")}
              </span>
            )}
            {phase === "throwing" && (
              <span className="text-[9px] font-black text-white/60 bg-black/50 px-3 py-0.5 rounded-full">Throwing...</span>
            )}
            {phase === "physics" && (
              <span className="text-[9px] font-black text-[#F59E0B] bg-black/50 px-3 py-0.5 rounded-full">
                {hitsLanded > 0 ? `${hitsLanded} hits!` : "Resolving..."}
              </span>
            )}
            {phase === "opponent_turn" && (
              <span className="text-[9px] font-black text-[#FF004D] bg-black/50 px-3 py-0.5 rounded-full">AI throws...</span>
            )}
            {phase === "round_end" && (
              <span className="text-[9px] font-black text-[#22C55E] bg-black/50 px-3 py-0.5 rounded-full">Round {round} complete</span>
            )}
          </div>
        </div>

        {/* Launch controls overlay bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          {(phase === "player_aim" || phase === "player_power") ? (
            <LaunchSystem
              phase={launch}
              onAimLock={aimLock}
              onPowerLock={powerLock}
              throwingTazoName={throwing?.name || "?"}
              throwingTazoFranchise={throwing?.franchise || "minimon"}
            />
          ) : (
            <div className="flex justify-center p-3">
              <button onClick={back}
                className="px-4 py-2 text-[10px] font-black text-white/40 bg-black/40 hover:bg-black/60 hover:text-white/70 border border-white/10 rounded uppercase tracking-wider transition-colors">
                Leave Battle
              </button>
            </div>
          )}
        </div>
      </BattleArena3D>
    </div>
  )
}
