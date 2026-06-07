// ============================================================
// Trading Tazos Game — Battle View v3 (Vertical Slam)
//
// CORRECT TAZO MECHANIC:
//   1. Both players stake 1 tazo face-down in the center circle
//   2. Pick launcher tazo from deck → appears in air above circle
//   3. Aim reticle → charge vertical force → adjust tilt/spin
//   4. Release → tazo falls vertically, slams face-down tazos
//   5. Impact physics: flip (capture/secure), wobble, ring-out, miss
//   6. First to 5 points wins
// ============================================================
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  createMatch, simulateSlam, generateAISlam, checkMatchEnd,
  scoreImpact, createAirborneTazo, placeStakedTazos,
  DEFAULT_ARENA_3D,
} from "@/lib/battle/game-loop"
import type {
  GameState, PlayMode, AIDifficulty,
  TazoCard, MatchConfig, MatchResult, SlamParams,
  PlayerGameState, StakedTazo, AirborneTazo, ImpactResult,
} from "@/lib/battle/game-loop"
import type { BattleFinalResult } from "@/lib/battle"
import GameLobby from "./battle/game-lobby"
import BattleArena3D from "./battle/battle-arena-3d"
import SlamControls from "./battle/slam-controls"
import BattleResultPanel from "./battle/battle-result-panel"
import { Disc3, RotateCcw, Crosshair, ArrowDown, Maximize, Minimize } from "lucide-react"

const BACK_ARTS: Record<string, string> = {
  minimon: "/tazos-artgen/backs/minimon-back.png",
  cybermon: "/tazos-artgen/backs/cybermon-back.png",
  dracobell: "/tazos-artgen/backs/dracobell-back.png",
}

const DEMO_TAZOS: TazoCard[] = [
  { id: "d1", name: "Lumipuff", slug: "lumipuff", franchise: "minimon", imageUrl: "/tazos-artgen/minimon/minimon-001.png", finish: "reverse_holo", creatureVariant: "standard", attack: 45, defense: 40, resistance: 35, weight: 35, stability: 40, spin: 55, control: 50, bounce: 45, precision: 55 },
  { id: "d2", name: "Leafroll", slug: "leafroll", franchise: "minimon", imageUrl: "/tazos-artgen/minimon/minimon-004.png", finish: "glossy", creatureVariant: "standard", attack: 55, defense: 60, resistance: 50, weight: 35, stability: 55, spin: 40, control: 50, bounce: 50, precision: 48 },
  { id: "d3", name: "Voltcrab-X", slug: "voltcrab-x", franchise: "cybermon", imageUrl: "/tazos-artgen/cybermon/cybermon-001.png", finish: "metallic", creatureVariant: "standard", attack: 70, defense: 45, resistance: 50, weight: 55, stability: 50, spin: 60, control: 40, bounce: 35, precision: 45 },
  { id: "d4", name: "Datadrake", slug: "datadrake", franchise: "cybermon", imageUrl: "/tazos-artgen/cybermon/cybermon-002.png", finish: "holo", creatureVariant: "standard", attack: 60, defense: 55, resistance: 50, weight: 45, stability: 55, spin: 50, control: 60, bounce: 45, precision: 55 },
  { id: "d5", name: "Bytefang", slug: "bytefang", franchise: "cybermon", imageUrl: "/tazos-artgen/cybermon/cybermon-003.png", finish: "chrome", creatureVariant: "shiny", shinyImageUrl: "/tazos-artgen/cybermon/cybermon-003.png", attack: 65, defense: 48, resistance: 42, weight: 48, stability: 45, spin: 62, control: 44, bounce: 40, precision: 50 },
  { id: "d7", name: "Tenzan Blaze", slug: "tenzan-blaze", franchise: "dracobell", imageUrl: "/tazos-artgen/dracobell/dracobell-002.png", finish: "prismatic", creatureVariant: "standard", attack: 80, defense: 55, resistance: 52, weight: 58, stability: 55, spin: 65, control: 60, bounce: 48, precision: 55 },
]

function toPanelVictoryType(victoryType: MatchResult["victoryType"]): BattleFinalResult["victoryType"] {
  if (victoryType === "points") return "points"
  if (victoryType === "all_captured") return "all_captured"
  if (victoryType === "forfeit") return "surrender"
  return "points"
}

async function fetchTazos(token: string): Promise<{ tazos: TazoCard[]; decks: any[] }> {
  // Load user's decks first — if they have an active deck, use it
  let allDecks: any[] = []
  try {
    const dr = await fetch("/api/decks", { headers: { Authorization: `Bearer ${token}` } })
    if (dr.ok) {
      const dd = await dr.json()
      allDecks = dd.decks || []
      const activeDeck = allDecks.find((d:any) => d.isActive) || allDecks[0]
      if (activeDeck && activeDeck.tazos?.length >= 5) {
        const deckTazos: TazoCard[] = activeDeck.tazos.map((t:any) => ({
          id: t.id, name: t.name || "?", slug: t.slug || (t.name || "?").toLowerCase().replace(/\s/g, "-"),
          franchise: (t.franchiseSlug || "minimon") as TazoCard["franchise"],
          imageUrl: t.imageUrl || null,
          shinyImageUrl: t.shinyImageUrl || null,
          rarity: t.rarity || "common",
          finish: t.finish || "normal",
          creatureVariant: t.creatureVariant || "standard",
          attack: t.attack || 50, defense: t.defense || 50,
          resistance: t.resistance || 50, weight: t.weight || 50, stability: t.stability || 50,
          spin: t.spin || 50, control: t.control || 50, bounce: t.bounce || 50, precision: t.precision || 50,
        }))
        return { tazos: deckTazos, decks: allDecks }
      }
    }
  } catch { /* deck API failed, fall back to tazos API */ }

  // Fallback: load from public tazo API
  const r = await fetch("/api/tazos?limit=100", { headers: { Authorization: `Bearer ${token}` } })
  if (!r.ok) return { tazos: [], decks: [] }
  const d = await r.json()
  const tazos: TazoCard[] = (d.tazos || []).map((t:any) => ({
    id: t.id, name: t.name || "?", slug: t.slug || (t.name || "?").toLowerCase().replace(/\s/g, "-"),
    franchise: (t.franchise || t.franchiseSlug || "minimon") as TazoCard["franchise"],
    imageUrl: t.imageUrl || null,
    shinyImageUrl: t.shinyImageUrl || null,
    rarity: t.rarity || "common",
    finish: t.finish || "normal",
    creatureVariant: t.creatureVariant || "standard",
    attack: t.attack || 50, defense: t.defense || 50,
    resistance: t.resistance || 50, weight: t.weight || 50, stability: t.stability || 50,
    spin: t.spin || 50, control: t.control || 50, bounce: t.bounce || 50, precision: t.precision || 50,
  }))
  return { tazos, decks: [] }
}

export default function BattleView() {
  const { user, token } = useAuth()
  const [phase, setPhase] = useState<GameState>("lobby")
  const [loading, setLoading] = useState(true)
  const [tazos, setTazos] = useState<TazoCard[]>([])
  const [deck, setDeck] = useState<TazoCard[]>([])
  const [allDecks, setAllDecks] = useState<any[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [selectedDeckName, setSelectedDeckName] = useState<string>("")
  const [allTazos, setAllTazos] = useState<TazoCard[]>([])  // full fallback list
  const [cfg, setCfg] = useState<MatchConfig | null>(null)
  const [pScore, setPScore] = useState(0)
  const [oScore, setOScore] = useState(0)
  const [round, setRound] = useState(1)
  const [turn, setTurn] = useState(0)
  const [staked, setStaked] = useState<StakedTazo[]>([])
  const [airborne, setAirborne] = useState<AirborneTazo | null>(null)
  const [result, setResult] = useState<MatchResult | null>(null)
  const [creditsEarned, setCreditsEarned] = useState(0)
  const [throwing, setThrowing] = useState<TazoCard | null>(null)

  // Slam input state
  const [reticleX, setReticleX] = useState(0)
  const [reticleZ, setReticleZ] = useState(0)
  const [charge, setCharge] = useState(0)
  const [tiltDeg, setTiltDeg] = useState(0)
  const [tiltIntensity, setTiltIntensity] = useState(0)
  const [spinIntensity, setSpinIntensity] = useState(0)
  const [slamPhase, setSlamPhase] = useState<"aim" | "charge" | "tilt">("aim")
  const [impactMsg, setImpactMsg] = useState("")
  const [showImpact, setShowImpact] = useState(false)
  
  // Score popups: float up and fade
  const [scorePopups, setScorePopups] = useState<Array<{id:number, text:string, color:string, side:'left'|'right'}>>([])
  let popupId = useRef(0)
  const spawnPopup = (text: string, color: string, side: 'left' | 'right') => {
    const id = ++popupId.current
    setScorePopups(prev => [...prev, {id, text, color, side}])
    setTimeout(() => setScorePopups(prev => prev.filter(p => p.id !== id)), 1800)
  }

  const busy = useRef(false)
  const resultSaved = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // State ref for async callbacks
  const stateRef = useRef({
    pScore: 0, oScore: 0, staked: [] as StakedTazo[], round: 1, turn: 0,
    deck: [] as TazoCard[], cfg: null as MatchConfig | null,
    reticleX: 0, reticleZ: 0, charge: 0, tiltDeg: 0, tiltIntensity: 0, spinIntensity: 0,
  })
  useEffect(() => {
    stateRef.current = { pScore, oScore, staked, round, turn, deck, cfg, reticleX, reticleZ, charge, tiltDeg, tiltIntensity, spinIntensity }
  }, [pScore, oScore, staked, round, turn, deck, cfg, reticleX, reticleZ, charge, tiltDeg, tiltIntensity, spinIntensity])

  const saveBattleResult = useCallback(async (matchResult: MatchResult) => {
    if (resultSaved.current || !cfg) return
    resultSaved.current = true
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Bearer ${token}`
      const r = await fetch("/api/battle", {
        method: "POST", headers,
        body: JSON.stringify({
          playerTazoIds: deck.map(t => t.id),
          opponentTazoIds: cfg.opponentDeck.map(t => t.id),
          physicsResult: {
            winner: matchResult.winner,
            playerScore: matchResult.playerScore,
            opponentScore: matchResult.opponentScore,
            captures: matchResult.playerCaptures + matchResult.opponentCaptures,
            ringOuts: 0, flips: 0, totalTurns: matchResult.totalTurns,
          },
        }),
      })
      if (r.ok) { const data = await r.json(); setCreditsEarned(data.creditsEarned || 0) }
    } catch {}
  }, [token, deck, cfg])

  useEffect(() => {
    if (phase === "match_end" && result) saveBattleResult(result)
  }, [phase, result, saveBattleResult])

  // Load tazos + decks
  useEffect(() => {
    (async () => {
      let list: TazoCard[] = DEMO_TAZOS
      let dlist: any[] = []
      if (user && token) {
        const fetched = await fetchTazos(token)
        if (fetched.tazos.length >= 3) { list = fetched.tazos; dlist = fetched.decks }
      }
      setTazos(list); setAllTazos(list); setAllDecks(dlist); setLoading(false)
      // Auto-select active deck
      if (dlist.length > 0) {
        const active = dlist.find((d:any) => d.isActive) || dlist[0]
        setSelectedDeckId(active.id)
        setSelectedDeckName(active.name || "")
      }
    })()
  }, [user, token])

  // ── AI slam turn ──
  const doOpponentSlam = useCallback(() => {
    const s = stateRef.current
    if (!s.cfg || busy.current) return
    busy.current = true

    // Pick AI launcher tazo (avoid staked tazo)
    const oppStake = s.staked.find(st => st.owner === "opponent" && !st.scored)
    const availOpp = s.cfg.opponentDeck.filter(t => t.id !== oppStake?.id)
    const aiTazo = availOpp.length > 0
      ? availOpp[Math.floor(Math.random() * availOpp.length)]
      : s.cfg.opponentDeck[0]
    setThrowing(aiTazo)

    // Create airborne tazo for AI
    const aiAirborne = createAirborneTazo(aiTazo, "opponent", s.cfg.arena)
    aiAirborne.state = "aiming"
    setAirborne(aiAirborne)

    // Brief aiming delay
    setTimeout(() => {
      const s2 = stateRef.current
      if (!s2.cfg) { busy.current = false; return }

      const slam = generateAISlam(aiTazo, s2.staked, s2.cfg.arena, s2.cfg.aiDifficulty)

      // Position the airborne tazo above target
      const updatedAirborne: AirborneTazo = {
        ...aiAirborne,
        state: "charging",
        position: [
          slam.impactX * 0.3,
          s2.cfg.arena.maxLaunchHeight * (0.2 + slam.verticalForce * 0.8),
          slam.impactZ * 0.3,
        ],
        charge: slam.verticalForce,
        targetX: slam.impactX,
        targetZ: slam.impactZ,
      }
      setAirborne(updatedAirborne)
      setPhase("opponent_slam")

      // Brief charge, then launch
      setTimeout(() => {
        const s3 = stateRef.current
        if (!s3.cfg) { busy.current = false; return }

        const falling: AirborneTazo = {
          ...updatedAirborne,
          state: "falling",
          position: [
            updatedAirborne.position[0],
            updatedAirborne.position[1],
            updatedAirborne.position[2],
          ],
        }
        setAirborne(falling)

        // Impact after gravity fall
        const fallTime = Math.sqrt(2 * updatedAirborne.position[1] / s3.cfg.arena.gravity) * 1000
        setTimeout(() => {
          const s4 = stateRef.current
          if (!s4.cfg) { busy.current = false; return }

          setPhase("impact")

          const { staked: newStaked, result: impact } = simulateSlam(
            aiTazo, slam, s4.staked, s4.cfg.arena, "opponent"
          )
          setStaked(newStaked)
          setAirborne(null)

          const { playerDelta, opponentDelta } = scoreImpact(impact, newStaked, "opponent")
          const newPScore = s4.pScore + playerDelta
          const newOScore = s4.oScore + opponentDelta
          setPScore(newPScore)
          setOScore(newOScore)

          setImpactMsg(impact.description)
          setShowImpact(true)

          if (playerDelta > 0) spawnPopup(`+${playerDelta}`, "#29ADFF", "left")
          if (opponentDelta > 0) spawnPopup(`+${opponentDelta}`, "#FF004D", "right")

          setTimeout(() => {
            setShowImpact(false)
            setPhase("resolve_impact")

            const end = checkMatchEnd(
              newPScore, newOScore, s4.cfg!.scoreToWin,
              s4.deck.length, s4.cfg!.opponentDeck.length
            )
            if (end) {
              setResult({ ...end, totalTurns: s4.turn + 1, playerScore: newPScore, opponentScore: newOScore })
              setPhase("match_end")
              busy.current = false
              return
            }
            setPhase("round_end")
            setTimeout(() => {
              setRound(prev => prev + 1)
              setTurn(prev => prev + 1)
              startNewRound(s4.deck, s4.cfg!.opponentDeck, s4.cfg!.arena)
              busy.current = false
            }, 2000)
          }, 1200)
        }, fallTime * 0.8)
      }, 800)
    }, 600)
  }, [])

  // ── Start new round (place stakes) ──
  const startNewRound = useCallback((playerDeck: TazoCard[], opponentDeck: TazoCard[], arena: typeof DEFAULT_ARENA_3D) => {
    // Pick stake tazos — one for each player (not the same as launcher)
    const pStake = playerDeck[Math.floor(Math.random() * playerDeck.length)]
    const oStake = opponentDeck[Math.floor(Math.random() * opponentDeck.length)]
    const newStaked = placeStakedTazos(pStake, oStake)
    setStaked(newStaked)

    // Pick launcher from remaining deck (NOT the staked tazo)
    const availPlayer = playerDeck.filter(t => t.id !== pStake.id)
    const launcher = availPlayer.length > 0
      ? availPlayer[Math.floor(Math.random() * availPlayer.length)]
      : playerDeck[0]
    setThrowing(launcher)

    // Create airborne tazo
    const ab = createAirborneTazo(launcher, "player", arena)
    setAirborne(ab)

    // Reset inputs
    setReticleX(0); setReticleZ(0)
    setCharge(0); setTiltDeg(0); setTiltIntensity(0); setSpinIntensity(0)
    setSlamPhase("aim")

    setTimeout(() => setPhase("player_aim"), 500)
  }, [])

  // ── Deck selection ──
  const handleSelectDeck = useCallback((deckId: string | null) => {
    setSelectedDeckId(deckId)
    if (!deckId) {
      setTazos(allTazos)
      setSelectedDeckName("")
      return
    }
    const deck = allDecks.find((d: any) => d.id === deckId)
    setSelectedDeckName(deck?.name || "")
    if (deck?.tazos) {
      const dt: TazoCard[] = deck.tazos.map((t: any) => ({
        id: t.id, name: t.name || "?", slug: t.slug || (t.name || "?").toLowerCase().replace(/\s/g, "-"),
        franchise: (t.franchiseSlug || "minimon") as TazoCard["franchise"],
        imageUrl: t.imageUrl || null,
        shinyImageUrl: t.shinyImageUrl || null,
        rarity: t.rarity || "common",
        finish: t.finish || "normal",
        creatureVariant: t.creatureVariant || "standard",
        attack: t.attack || 50, defense: t.defense || 50,
        resistance: t.resistance || 50, weight: t.weight || 50, stability: t.stability || 50,
        spin: t.spin || 50, control: t.control || 50, bounce: t.bounce || 50, precision: t.precision || 50,
      }))
      setTazos(dt)
    }
  }, [allDecks, allTazos])

  // Update airborne tazo position to follow reticle during aim/charge
  useEffect(() => {
    if (!airborne || !(phase === "player_aim" || phase === "player_charge" || phase === "player_tilt")) return
    const arena = cfg?.arena || DEFAULT_ARENA_3D
    const h = phase === "player_aim" ? arena.maxLaunchHeight * 0.5
           : phase === "player_charge" ? arena.maxLaunchHeight * (0.4 + charge * 0.6)
           : arena.maxLaunchHeight * (0.6 + charge * 0.4)
    setAirborne(prev => prev ? { ...prev, position: [reticleX * 0.3, h, reticleZ * 0.3] } : prev)
  }, [reticleX, reticleZ, charge, phase])
  const start = useCallback((mode: PlayMode, diff: AIDifficulty, d: TazoCard[]) => {
    setDeck(d)
    const opp = [...DEMO_TAZOS].sort(() => Math.random() - 0.5).slice(0, 5)
    const c: MatchConfig = {
      mode, aiDifficulty: diff, arena: DEFAULT_ARENA_3D,
      scoreToWin: 5, playerDeck: d, opponentDeck: opp,
    }
    setCfg(c)
    setPScore(0); setOScore(0)
    setRound(1); setTurn(0); setResult(null)
    busy.current = false
    setShowImpact(false)

    setPhase("intro")
    setTimeout(() => {
      setPhase("round_start")
      startNewRound(d, opp, c.arena)
    }, 2000)
  }, [startNewRound])

  // ── Player slam ──
  const handleSlamRelease = useCallback(() => {
    const s = stateRef.current
    if (!s.cfg || busy.current) return
    busy.current = true

    const t = throwing
    if (!t) { busy.current = false; return }

    // Calculate tilt direction from degrees
    const absDeg = ((s.tiltDeg % 360) + 360) % 360
    let tiltDir: SlamParams["tilt"] = "flat"
    if (s.tiltIntensity > 0.12) {
      if (absDeg < 45 || absDeg > 315) tiltDir = "right"
      else if (absDeg >= 45 && absDeg < 135) tiltDir = "forward"
      else if (absDeg >= 135 && absDeg < 225) tiltDir = "left"
      else tiltDir = "backward"
    }

    const slam: SlamParams = {
      tazoId: t.id,
      impactX: s.reticleX,
      impactZ: s.reticleZ,
      verticalForce: s.charge,
      timingAccuracy: s.charge > 0.6 && s.charge < 0.82 ? 0.95 : 0.6,
      tilt: tiltDir,
      tiltIntensity: s.tiltIntensity,
      spinIntensity: s.spinIntensity,
      aimPrecision: Math.max(0.2, (t.precision || 50) / 100),
    }

    // Animate airborne tazo rising then falling
    const ab = airborne
    if (ab) {
      const chargeHeight = s.cfg.arena.maxLaunchHeight * (0.2 + s.charge * 0.8)
      const falling: AirborneTazo = {
        ...ab,
        state: "falling",
        position: [
          s.reticleX * 0.3,
          chargeHeight,
          s.reticleZ * 0.3,
        ],
        tilt: [s.tiltIntensity * (Math.cos(s.tiltDeg * Math.PI / 180)) * 0.5, 0,
              s.tiltIntensity * (Math.sin(s.tiltDeg * Math.PI / 180)) * 0.5],
        angularVelocity: [0, s.spinIntensity * 8, 0],
        charge: s.charge,
        targetX: s.reticleX,
        targetZ: s.reticleZ,
      }
      setAirborne(falling)
    }

    setPhase("slamming")

    // Calculate fall time based on height
    const fallHeight = s.cfg.arena.maxLaunchHeight * (0.2 + s.charge * 0.8)
    const fallTimeMs = Math.sqrt(2 * fallHeight / s.cfg.arena.gravity) * 1000

    // Impact
    setTimeout(() => {
      const s2 = stateRef.current
      if (!s2.cfg) { busy.current = false; return }

      setPhase("impact")

      const { staked: newStaked, result: impact } = simulateSlam(
        t, slam, s2.staked, s2.cfg.arena, "player"
      )
      setStaked(newStaked)
      setAirborne(null)

      const { playerDelta, opponentDelta } = scoreImpact(impact, newStaked, "player")
      const newPScore = s2.pScore + playerDelta
      const newOScore = s2.oScore + opponentDelta
      setPScore(newPScore)
      setOScore(newOScore)

      setImpactMsg(impact.description)
      setShowImpact(true)

      // Score popups
      if (playerDelta > 0) spawnPopup(`+${playerDelta}`, "#29ADFF", "left")
      if (opponentDelta > 0) spawnPopup(`+${opponentDelta}`, "#FF004D", "right")

      setTimeout(() => {
        setShowImpact(false)
        setPhase("resolve_impact")

        const end = checkMatchEnd(
          newPScore, newOScore, s2.cfg!.scoreToWin,
          s2.deck.length, s2.cfg!.opponentDeck.length
        )
        if (end) {
          setResult({
            ...end,
            totalTurns: s2.turn + 1,
            playerScore: newPScore,
            opponentScore: newOScore,
            playerCaptures: playerDelta,
            opponentCaptures: opponentDelta,
          })
          setPhase("match_end")
          busy.current = false
          return
        }

        // Opponent turn
        setTimeout(() => {
          setPhase("opponent_aim")
          doOpponentSlam()
        }, 1500)
      }, 1500)
    }, fallTimeMs * 0.75)
  }, [throwing, airborne, doOpponentSlam])

  const rematch = () => { resultSaved.current = false; setCreditsEarned(0); if (cfg) start(cfg.mode, cfg.aiDifficulty, deck) }
  const back = () => { resultSaved.current = false; setCreditsEarned(0); setPhase("lobby"); setCfg(null); setResult(null); setThrowing(null); setStaked([]); setAirborne(null); setPScore(0); setOScore(0); setRound(1); setTurn(0) }

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-28">
      <Disc3 className="w-12 h-12 animate-spin text-[#FFCC00]" />
    </div>
  )

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

  if (phase === "match_end" && result) return (
    <div className="max-w-md mx-auto space-y-4">
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

  // ── Full-page 3D Arena ──
  const isAiming = phase === "player_aim" || phase === "player_charge" || phase === "player_tilt"
  const showReticle = isAiming || phase === "placing_stakes"

  return (
    <div ref={containerRef} className="w-full relative" style={{ height: isFullscreen ? "100vh" : "calc(100vh - 56px)" }}>
      {/* Fullscreen toggle — top-right corner */}
      <button onClick={toggleFullscreen}
        className="absolute top-2 right-2 z-30 p-2 bg-black/40 hover:bg-black/60 rounded-full border border-white/10 text-white/50 hover:text-white/80 transition-all"
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
      </button>
      <BattleArena3D
        config={cfg?.arena || DEFAULT_ARENA_3D}
        stakedTazos={staked}
        airborneTazo={airborne}
        gamePhase={phase}
        showReticle={showReticle}
        reticleX={reticleX}
        reticleZ={reticleZ}
      >
        {/* Keyframe animation for score popups */}
        <style>{`
          @keyframes popUp {
            0% { opacity: 1; transform: translateY(0) scale(1); }
            20% { opacity: 1; transform: translateY(-8px) scale(1.3); }
            60% { opacity: 0.8; transform: translateY(-30px) scale(1.1); }
            100% { opacity: 0; transform: translateY(-60px) scale(0.8); }
          }
          @keyframes sparkBurst {
            0% { opacity: 1; transform: scale(0) rotate(0deg); }
            30% { opacity: 1; transform: scale(1.2) rotate(15deg); }
            100% { opacity: 0; transform: scale(1.8) rotate(45deg); }
          }
        `}</style>
        {/* ── HUD overlay top (compact) ── */}
        <div className="absolute top-2 left-2 right-2 z-20">
          <div className="flex items-center gap-2">
            {/* Player score pill */}
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
              <span className="text-[9px] font-black text-white/60">YOU</span>
              <span className="text-sm font-black text-[#29ADFF]">{pScore}</span>
              {selectedDeckName && (
                <span className="text-[7px] font-black text-[#FFCC00]/60 ml-1">{selectedDeckName}</span>
              )}
            </div>

            <div className="flex-1" />

            {/* Round */}
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/5">
              <span className="text-[8px] font-black text-white/20 uppercase">R{round}</span>
              <span className="text-[7px] font-black text-white/10">to {cfg?.scoreToWin || 5}</span>
            </div>

            <div className="flex-1" />

            {/* Opponent score pill */}
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
              <span className="text-sm font-black text-[#FF004D]">{oScore}</span>
              <span className="text-[9px] font-black text-white/60">AI</span>
            </div>
          </div>

          {/* Score popups — float up beside scores */}
          {scorePopups.map(p => (
            <div key={p.id}
              className={`absolute top-12 ${p.side === "left" ? "left-6" : "right-6"} animate-[popUp_1.8s_ease-out_forwards] pointer-events-none`}
              style={{
                color: p.color,
                fontSize: p.text.length > 2 ? "18px" : "28px",
                fontWeight: 900,
                textShadow: `0 0 16px ${p.color}, 0 2px 8px rgba(0,0,0,0.8)`,
                animation: "popUp 1.8s ease-out forwards",
              }}
            >
              {p.text}
            </div>
          ))}

          {/* Phase status — centered pill */}
          <div className="flex justify-center mt-2">
            {phase === "intro" && (
              <div className="inline-block px-8 py-2 bg-[#FFCC00]/15 rounded-full border-2 border-[#FFCC00]/50 animate-pulse">
                <span className="text-[16px] font-black text-[#FFCC00] tracking-[0.3em]">GET READY!</span>
              </div>
            )}
            {phase === "round_start" && (
              <span className="text-[9px] font-black text-white/30 bg-black/50 px-3 py-0.5 rounded-full">
                Placing stakes...
              </span>
            )}
            {phase === "player_aim" && (
              <div className="inline-block px-4 py-1 bg-black/60 rounded-full border border-[#FFCC00]/40">
                <span className="text-[11px] font-black text-[#FFCC00] tracking-wider">🎯 AIM YOUR SHOT</span>
                <span className="text-[8px] font-black text-white/40 ml-2">{throwing?.name || "?"}</span>
              </div>
            )}
            {phase === "player_charge" && (
              <div className="inline-block px-4 py-1 bg-black/60 rounded-full border border-[#FF8800]/40 animate-pulse">
                <span className="text-[11px] font-black text-[#FF8800] tracking-wider">⚡ CHARGING — {Math.round(charge * 100)}%</span>
                <span className="text-[8px] font-black text-white/30 ml-2">{throwing?.name}</span>
              </div>
            )}
            {phase === "player_tilt" && (
              <div className="inline-block px-4 py-1 bg-black/60 rounded-full border border-[#FF004D]/40">
                <span className="text-[11px] font-black text-[#FF004D] tracking-wider">↗ TILT &amp; RELEASE</span>
              </div>
            )}
            {phase === "slamming" && (
              <div className="inline-block px-6 py-1.5 bg-[#FFCC00]/20 rounded-full border-2 border-[#FFCC00]/60 animate-pulse">
                <span className="text-[14px] font-black text-[#FFCC00] tracking-widest">💥 SLAM!</span>
              </div>
            )}
            {(phase === "impact" || showImpact) && (
              <div className="inline-block px-5 py-1.5 bg-[#FFCC00]/10 rounded-full border-2 border-[#FFCC00]/50">
                <span className="text-[12px] font-black text-[#FFCC00] tracking-wider">{impactMsg || "IMPACT!"}</span>
              </div>
            )}
            {phase === "opponent_aim" && (
              <span className="text-[9px] font-black text-[#FF004D] bg-black/50 px-3 py-0.5 rounded-full">AI aims...</span>
            )}
            {phase === "opponent_slam" && (
              <span className="text-[9px] font-black text-[#FF004D] bg-black/50 px-3 py-0.5 rounded-full animate-pulse">AI slams!</span>
            )}
            {phase === "resolve_impact" && (
              <span className="text-[9px] font-black text-[#22C55E] bg-black/50 px-3 py-0.5 rounded-full">
                {impactMsg || "Resolving..."}
              </span>
            )}
            {phase === "round_end" && (
              <span className="text-[9px] font-black text-white/50 bg-black/50 px-3 py-0.5 rounded-full">Round {round} complete</span>
            )}
          </div>

          {/* Score to win */}
          <div className="text-center mt-0.5">
            <span className="text-[7px] font-black text-white/20">First to {cfg?.scoreToWin || 5}</span>
          </div>
        </div>

        {/* ── Floating slam controls (self-positioned) ── */}
        {isAiming && throwing ? (
            <SlamControls
              phase={slamPhase}
              tazoName={throwing.name}
              tazoFranchise={throwing.franchise}
              tazoControl={throwing.control || 50}
              tazoPrecision={throwing.precision || 50}
              reticleX={reticleX}
              reticleZ={reticleZ}
              charge={charge}
              tiltDeg={tiltDeg}
              spinIntensity={spinIntensity}
              onReticleMove={(x, z) => { setReticleX(x); setReticleZ(z) }}
              onCharge={(level) => setCharge(level)}
              onChargeComplete={(level) => {
                if (busy.current || slamPhase !== "charge") return
                setSlamPhase("tilt")
                setCharge(level)
                setPhase("player_tilt")
              }}
              onTilt={(deg, intensity) => {
                setTiltDeg(deg)
                setTiltIntensity(intensity)
              }}
              onSpin={(intensity) => setSpinIntensity(intensity)}
              onRelease={() => {
                if (slamPhase === "aim") {
                  setSlamPhase("charge")
                  setPhase("player_charge")
                  return
                }
                if (slamPhase === "charge") {
                  // User released early — skip tilt, go directly to slam
                  // Clean interval via effect cleanup
                  handleSlamRelease()
                  return
                }
                // Tilt phase — release the slam
                handleSlamRelease()
              }}
              onBack={back}
            />
          ) : (
            <div className="flex justify-center p-3">
              <button onClick={back}
                className="px-4 py-2 text-[10px] font-black text-white/40 bg-black/40 hover:bg-black/60 hover:text-white/70 border border-white/10 rounded uppercase tracking-wider transition-colors">
                Leave Battle
              </button>
            </div>
          )}
      </BattleArena3D>
    </div>
  )
}
