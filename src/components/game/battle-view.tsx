// ============================================================
// Trading Tazos Game — Battle View (Main)
// Full battle experience: tazo selection, arena, aim controls,
// physics simulation, event log, and results.
// ============================================================
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useI18n } from "@/lib/i18n"
import {
  createBattleState, startTurn, selectThrower,
  setHorizontalAim, setVerticalAim, setPower, executeThrow,
  opponentPlaceTazo, endTurn, exportReplay,
} from "@/lib/battle/battle-engine"
import type { BattleState, BattlePhase } from "@/lib/battle"
import BattleArenaCanvas from "./battle/battle-arena-canvas"
import LaunchControl from "./battle/launch-control"
import BattleEventLog from "./battle/battle-event-log"
import BattleResultPanel from "./battle/battle-result-panel"
import {
  Swords, Play, RotateCcw, ChevronRight,
  Zap, Shield, Star, Disc3,
} from "lucide-react"

// ---- Sample opponent tazos (hardcoded for now) ----
const OPPONENT_TAZOS = [
  { id: "opp-1", name: "Pikachu", slug: "opp-pikachu", franchise: "pokemon", imageUrl: "/tazos/pokemon/pokemon-pikachu.svg", attack: 45, defense: 40, spin: 55, weight: 35, aura: 55, control: 50 },
  { id: "opp-2", name: "Gengar", slug: "opp-gengar", franchise: "pokemon", imageUrl: "/tazos/pokemon/pokemon-gengar.svg", attack: 65, defense: 60, spin: 45, weight: 40, aura: 70, control: 55 },
  { id: "opp-3", name: "Greymon", slug: "opp-greymon", franchise: "digimon", imageUrl: "/tazos/digimon/digimon-greymon.svg", attack: 55, defense: 50, spin: 45, weight: 55, aura: 45, control: 40 },
  { id: "opp-4", name: "Angemon", slug: "opp-angemon", franchise: "digimon", imageUrl: "/tazos/digimon/digimon-angemon.svg", attack: 70, defense: 55, spin: 50, weight: 45, aura: 75, control: 60 },
  { id: "opp-5", name: "Vegeta", slug: "opp-vegeta", franchise: "dbz", imageUrl: "/tazos/dbz/dbz-vegeta.svg", attack: 60, defense: 45, spin: 50, weight: 50, aura: 60, control: 45 },
  { id: "opp-6", name: "Goku SSJ", slug: "opp-goku-ssj", franchise: "dbz", imageUrl: "/tazos/dbz/dbz-goku-ssj.svg", attack: 80, defense: 55, spin: 65, weight: 55, aura: 85, control: 60 },
  { id: "opp-7", name: "Cell", slug: "opp-cell", franchise: "dbz", imageUrl: "/tazos/dbz/dbz-cell.svg", attack: 75, defense: 65, spin: 55, weight: 60, aura: 70, control: 50 },
]

export default function BattleView() {
  const { t } = useI18n()
  const [playerTazos, setPlayerTazos] = useState<Array<typeof OPPONENT_TAZOS[0]>>([])
  const [loading, setLoading] = useState(true)
  const [battleState, setBattleState] = useState<BattleState | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ---- Load player tazos ----
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tazos?owned=true&sortBy=attack&sortOrder=desc")
        if (!res.ok) throw new Error("Failed to load tazos")
        const data = await res.json()
        if (data.tazos && data.tazos.length >= 5) {
          setPlayerTazos(data.tazos.slice(0, 10).map((t: Record<string, unknown>) => ({
            id: t.id as string,
            name: t.name as string,
            slug: t.slug as string,
            franchise: (t.franchise as { slug?: string })?.slug || "pokemon",
            imageUrl: t.imageUrl as string || null,
            attack: t.attack as number,
            defense: t.defense as number,
            spin: t.spin as number,
            weight: t.weight as number,
            aura: t.aura as number,
            control: t.control as number,
          })))
        }
      } catch (err) {
        console.error("Failed to load tazos:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ---- Start battle ----
  const startBattle = useCallback(() => {
    if (playerTazos.length < 5) {
      setError(t.battle_need_5_tazos)
      return
    }
    setError(null)
    const state = createBattleState(playerTazos, OPPONENT_TAZOS, {
      arena: { radius: 250, centerX: 300, centerY: 300 },
    })
    setBattleState(startTurn(state))
  }, [playerTazos, t.battle_need_5_tazos])

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

  const handleEndTurn = useCallback(() => {
    if (!battleState) return
    setBattleState(endTurn(battleState))
  }, [battleState])

  const handleRematch = useCallback(() => {
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
    return (
      <div className="max-w-md mx-auto space-y-4">
        <BattleResultPanel
          result={battleState.finalResult}
          playerName={t.battle_you}
          opponentName={t.battle_rival}
          onRematch={handleRematch}
        />
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

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between p-3 bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
        <div className="flex items-center gap-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT: Arena */}
        <div className="lg:col-span-2 space-y-3">
          <BattleArenaCanvas
            state={battleState}
            highlightId={battleState.selectedTazoId}
            onArenaClick={handleArenaClick}
            interactive={isPenalty}
          />

          {/* Phase indicator */}
          <div className="text-center">
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
        <div className="space-y-3">
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
                        background: tazo.franchise === "pokemon"
                          ? "linear-gradient(135deg, #FFCB05, #FF8C00)"
                          : tazo.franchise === "digimon"
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
                          {t.stats_spin} {tazo.stats.bounce}
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

          {/* Opponent turn indicator */}
          {isOpponentTurn && (
            <div className="p-4 bg-white border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] text-center">
              <Disc3 className="w-8 h-8 mx-auto mb-2 animate-spin text-[#E3350D]" />
              <p className="font-bold text-sm text-[#1a1a1a]">{t.battle_rival_throwing}</p>
              <button
                onClick={handleEndTurn}
                className="mt-3 px-4 py-2 font-black text-xs uppercase tracking-wider bg-[#3B4CCA] text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]"
              >
                {t.battle_resolve_turn}
              </button>
            </div>
          )}

          {/* Turn end */}
          {isTurnEnd && battleState.currentPlayerId === "player" && (
            <div className="p-4 bg-white border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] text-center space-y-3">
              <p className="font-bold text-sm text-[#1a1a1a]">
                {t.battle_turn} {battleState.turnNumber} {t.battle_turn_complete}
              </p>
              <button
                onClick={handleEndTurn}
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
