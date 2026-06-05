// ============================================================
// Trading Tazos Game — Battle HUD (Magazine Strip)
// Matches yellow banner strip pattern used across dashboard.
// ============================================================
"use client"

import { Heart } from "lucide-react"

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

const PHASE_LABELS: Record<string, { text: string; color: string }> = {
  intro:     { text: "GET READY!",        color: "#FFCC00" },
  round_start: { text: "ROUND START",     color: "#22C55E" },
  player_aim:  { text: "AIM",             color: "#FFCC00" },
  player_power:{ text: "POWER",           color: "#F59E0B" },
  throwing:  { text: "THROWING...",       color: "#E3350D" },
  physics:   { text: "RESOLVING...",      color: "#F59E0B" },
  resolve:   { text: "IMPACT!",           color: "#E3350D" },
  opponent_turn:{ text: "OPPONENT TURN",  color: "#3B4CCA" },
  round_end: { text: "ROUND OVER",        color: "#22C55E" },
}

const hpGrad = (p: number) =>
  p > 60 ? "linear-gradient(90deg, #22C55E, #4ADE80)" :
  p > 25 ? "linear-gradient(90deg, #F59E0B, #FFCC00)" :
  "linear-gradient(90deg, #E3350D, #FF6B00)"

export default function BattleHUD(props: Props) {
  const {
    playerName, opponentName, playerHP, playerMaxHP,
    opponentHP, opponentMaxHP, playerTazos, opponentTazos,
    playerCaptured, opponentCaptured, round, phase, turnPlayer,
    compact,
  } = props
  const pp = Math.max(0, (playerHP / playerMaxHP) * 100)
  const op = Math.max(0, (opponentHP / opponentMaxHP) * 100)
  const phaseInfo = PHASE_LABELS[phase] || { text: phase, color: "#FFCC00" }
  const pActive = playerTazos - playerCaptured
  const oActive = opponentTazos - opponentCaptured

  return (
    <div className="mag-card-yellow rounded-none px-3 py-2 flex items-center gap-2 sm:gap-3 relative"
      style={{ borderBottom: "3px solid #1a1a1a" }}>

      {/* DISC COUNT — Left */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] font-black text-[#1a1a1a] tabular-nums">{pActive}</span>
        <div className="flex -space-x-1">
          {Array.from({ length: Math.min(pActive, 3) }).map((_, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full border border-[#1a1a1a]/30"
              style={{ background: i === 0 ? "#E3350D" : i === 1 ? "#FFCC00" : "#3B4CCA" }} />
          ))}
        </div>
      </div>

      {/* HP BAR — Player */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <Heart className="w-3 h-3 text-[#E3350D] shrink-0" />
        <div className="flex-1 h-2.5 bg-white/50 border border-[#1a1a1a]/30 overflow-hidden">
          <div className="h-full transition-all duration-400 ease-out"
            style={{ width: `${pp}%`, background: hpGrad(pp) }} />
        </div>
        <span className="text-[9px] font-black text-[#1a1a1a] tabular-nums w-7 text-right">{playerHP}</span>
      </div>

      {/* CENTER — Phase badge + round */}
      <div className="flex flex-col items-center shrink-0">
        <span className="text-[8px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 border-2 border-[#1a1a1a] bg-white leading-none"
          style={{ color: phaseInfo.color }}>
          {phaseInfo.text}
        </span>
        <span className="text-[7px] font-black text-[#1a1a1a]/25 mt-0.5 leading-none">R{round}</span>
        {turnPlayer === "player" && (
          <span className="w-1 h-1 rounded-full bg-[#E3350D] animate-pulse mt-0.5" />
        )}
      </div>

      {/* HP BAR — Opponent */}
      <div className="flex items-center gap-1 flex-1 min-w-0 flex-row-reverse">
        <Heart className="w-3 h-3 text-[#3B4CCA] shrink-0" />
        <div className="flex-1 h-2.5 bg-white/50 border border-[#1a1a1a]/30 overflow-hidden">
          <div className="h-full transition-all duration-400 ease-out ml-auto"
            style={{ width: `${op}%`, background: hpGrad(op) }} />
        </div>
        <span className="text-[9px] font-black text-[#1a1a1a] tabular-nums w-7">{opponentHP}</span>
      </div>

      {/* DISC COUNT — Right */}
      <div className="flex items-center gap-1.5 shrink-0 flex-row-reverse">
        <span className="text-[10px] font-black text-[#1a1a1a] tabular-nums">{oActive}</span>
        <div className="flex -space-x-1">
          {Array.from({ length: Math.min(oActive, 3) }).map((_, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full border border-[#1a1a1a]/30"
              style={{ background: i === 0 ? "#3B4CCA" : i === 1 ? "#FFCC00" : "#00A1E9" }} />
          ))}
        </div>
      </div>
    </div>
  )
}
