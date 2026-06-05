// ============================================================
// Trading Tazos Game — Battle HUD (Magazine Edition)
// Scoreboard-style overlay with health bars, turn info, stats.
// ============================================================
"use client"

import { Heart, Disc3, Swords, Timer } from "lucide-react"

interface Props {
  playerName: string; opponentName: string
  playerHP: number; playerMaxHP: number
  opponentHP: number; opponentMaxHP: number
  playerTazos: number; opponentTazos: number
  playerCaptured: number; opponentCaptured: number
  round: number; phase: string
  turnPlayer: "player" | "opponent"
  compact?: boolean
}

const PHASE_MSG: Record<string, { label: string; color: string }> = {
  lobby:    { label: "Pre-Game",           color: "#1a1a1a" },
  intro:    { label: "Get Ready!",         color: "#FFCC00" },
  round_start: { label: "Round Start",     color: "#22C55E" },
  player_aim:  { label: "Your Turn — Aim",   color: "#FFCC00" },
  player_power:{ label: "Your Turn — Power", color: "#F59E0B" },
  player_spin: { label: "Your Turn — Spin",  color: "#A855F7" },
  throwing:  { label: "Throwing...",       color: "#E3350D" },
  physics:   { label: "Resolving...",      color: "#F59E0B" },
  resolve:   { label: "Impact!",           color: "#E3350D" },
  opponent_turn: { label: "Opponent Turn", color: "#3B4CCA" },
  round_end: { label: "Round Over",        color: "#22C55E" },
  match_end: { label: "Match Ended",       color: "#1a1a1a" },
}

export default function BattleHUD(props: Props) {
  const {
    playerName, opponentName, playerHP, playerMaxHP,
    opponentHP, opponentMaxHP, playerTazos, opponentTazos,
    playerCaptured, opponentCaptured, round, phase, turnPlayer,
    compact,
  } = props

  const pp = Math.max(0, (playerHP / playerMaxHP) * 100)
  const op = Math.max(0, (opponentHP / opponentMaxHP) * 100)
  const ph = PHASE_MSG[phase] || { label: phase, color: "#1a1a1a" }

  const active = playerTazos - playerCaptured
  const oppActive = opponentTazos - opponentCaptured

  const hpGrad = (pct: number) =>
    pct > 60 ? "linear-gradient(90deg, #22C55E, #4ADE80)" :
    pct > 25 ? "linear-gradient(90deg, #F59E0B, #FFCC00)" :
    "linear-gradient(90deg, #E3350D, #FF6B00)"

  return (
    <div className="p-3 bg-white border-b-3 border-[#1a1a1a] relative overflow-hidden">
      {/* Halftone strip */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(#1a1a1a 0.5px, transparent 0.5px)", backgroundSize: "6px 6px" }} />

      <div className="relative z-10">

        {/* Names row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-white font-black text-[9px] shrink-0"
              style={{ backgroundColor: "#E3350D", borderColor: "#1a1a1a" }}>
              {playerName[0]}
            </div>
            <span className="font-black text-[11px] uppercase text-[#1a1a1a] truncate max-w-[70px]">
              {playerName}
            </span>
          </div>

          {/* Center phase badge */}
          <div className="flex flex-col items-center">
            <span className="font-black text-[8px] uppercase tracking-[0.12em] px-1.5 py-0.5 border-2 border-[#1a1a1a]"
              style={{ color: ph.color }}>
              {ph.label}
            </span>
            <span className="text-[8px] font-bold text-[#1a1a1a]/25 mt-0.5">
              R{round}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-black text-[11px] uppercase text-[#1a1a1a] truncate max-w-[70px]">
              {opponentName}
            </span>
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-white font-black text-[9px] shrink-0"
              style={{ backgroundColor: "#3B4CCA", borderColor: "#1a1a1a" }}>
              {opponentName[0]}
            </div>
          </div>
        </div>

        {/* HP bars */}
        <div className="space-y-1.5 mb-1.5">
          {/* Player */}
          <div className="flex items-center gap-1.5">
            <Heart className="w-3 h-3 text-[#E3350D] shrink-0" />
            <div className="flex-1 h-2.5 bg-zinc-100 border border-[#1a1a1a]/20 overflow-hidden">
              <div className="h-full transition-all duration-400 ease-out" style={{ width: `${pp}%`, background: hpGrad(pp) }} />
            </div>
            <span className="font-black text-[10px] text-[#1a1a1a] tabular-nums min-w-[28px] text-right">{playerHP}</span>
          </div>
          {/* Opponent */}
          <div className="flex items-center gap-1.5">
            <Heart className="w-3 h-3 text-[#3B4CCA] shrink-0" />
            <div className="flex-1 h-2.5 bg-zinc-100 border border-[#1a1a1a]/20 overflow-hidden">
              <div className="h-full transition-all duration-400 ease-out" style={{ width: `${op}%`, background: hpGrad(op) }} />
            </div>
            <span className="font-black text-[10px] text-[#1a1a1a] tabular-nums min-w-[28px] text-right">{opponentHP}</span>
          </div>
        </div>

        {/* Disc counts */}
        <div className="flex items-center justify-between text-[9px]">
          <div className="flex items-center gap-1.5">
            <Disc3 className="w-3 h-3 text-[#FFCC00]" />
            <span className="font-bold text-[#1a1a1a]">{active}</span>
            {playerCaptured > 0 && <span className="text-[#E3350D] font-bold">-{playerCaptured}</span>}
          </div>

          <div className="flex items-center gap-1">
            {turnPlayer === "player" && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFCC00] animate-pulse" />
            )}
            <Timer className="w-2.5 h-2.5 text-[#1a1a1a]/20" />
          </div>

          <div className="flex items-center gap-1.5">
            {opponentCaptured > 0 && <span className="text-[#E3350D] font-bold">-{opponentCaptured}</span>}
            <span className="font-bold text-[#1a1a1a]">{oppActive}</span>
            <Disc3 className="w-3 h-3 text-[#3B4CCA]" />
          </div>
        </div>
      </div>
    </div>
  )
}
