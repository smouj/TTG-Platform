// ============================================================
// Trading Tazos Game — Battle Result Panel v2 (Magazine Editorial)
//
// Victory/defeat screen with magazine editorial layout.
// ============================================================
"use client"

import { useEffect } from "react"
import { Swords, Award, Timer, Shield, Zap, RotateCcw } from "lucide-react"
import { playSFX, sfxEnsureUnlocked } from "@/lib/audio/sfx-engine"
import type { BattleFinalResult } from "@/lib/battle"

interface Props {
  result: BattleFinalResult
  playerName: string
  opponentName: string
  onRematch: () => void
  creditsEarned?: number
}

export default function BattleResultPanel({ result, playerName, opponentName, onRematch, creditsEarned }: Props) {
  const isWin = result.winner === "player"
  const isDraw = result.winner === "draw"

  useEffect(() => {
    sfxEnsureUnlocked()
    if (isWin) playSFX('battle_victory', { volume: 0.4 })
    else if (isDraw) playSFX('nav', { volume: 0.3 })
    else playSFX('battle_defeat', { volume: 0.35 })
  }, [isWin, isDraw])

  const gradient = isWin
    ? "linear-gradient(135deg, var(--ttg-minimon), #FF8C00)"
    : isDraw
    ? "linear-gradient(135deg, #9CA3AF, #6B7280)"
    : "linear-gradient(135deg, var(--ttg-red), #991B1B)"

  const accent = isWin ? "var(--ttg-black)" : "white"

  return (
    <div className="p-6 sm:p-8 text-center max-w-sm mx-auto  relative overflow-hidden"
      style={{
        background: gradient,
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: isWin
          ? "0 24px 64px rgba(255,203,5,0.2), 0 0 0 1px rgba(255,255,255,0.05)"
          : isDraw
          ? "0 24px 64px rgba(156,163,175,0.15)"
          : "0 24px 64px rgba(227,53,13,0.2)",
      }}>
      {/* Decorative page-edge rules */}
      <div className="absolute top-0 left-4 right-4 h-px opacity-15" style={{ background: accent }} />
      <div className="absolute bottom-0 left-4 right-4 h-px opacity-15" style={{ background: accent }} />

      {/* Trophy */}
      <div className="mb-4">
        <div className="w-18 h-18 sm:w-20 sm:h-20 mx-auto rounded-full flex items-center justify-center border-2 relative"
          style={{
            background: isWin ? "var(--ttg-minimon)" : isDraw ? "#D1D5DB" : "#991B1B",
            borderColor: `${accent}44`,
            boxShadow: `0 0 32px ${isWin ? "rgba(255,203,5,0.3)" : isDraw ? "rgba(209,213,219,0.2)" : "rgba(153,27,27,0.3)"}`,
          }}>
          {isWin ? <Award className="w-10 h-10" style={{ color: "var(--ttg-black)" }} />
            : isDraw ? <Shield className="w-10 h-10" style={{ color: "var(--ttg-black)" }} />
            : <Swords className="w-10 h-10" style={{ color: "#ffffffcc" }} />}
        </div>
      </div>

      {/* Headline */}
      <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-[0.15em] mb-1"
        style={{ color: accent, textShadow: `0 2px 8px rgba(0,0,0,0.2)` }}>
        {isWin ? "Victory!" : isDraw ? "Draw!" : "Defeat!"}
      </h2>
      <p className="text-xs sm:text-sm font-bold mb-5 opacity-70" style={{ color: accent }}>
        {result.summary}
      </p>

      {/* Stats grid — magazine editorial stat blocks */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        {[
          { icon: Timer, value: result.totalTurns, label: "Turns", color: accent },
          { icon: Award, value: result.playerCaptures, label: "Captures", color: "var(--ttg-success)" },
          { icon: Shield, value: result.opponentCaptures, label: "Lost", color: "var(--ttg-red)" },
        ].map((s, i) => (
          <div key={i} className="py-2.5 px-1"
            style={{
              background: "rgba(255,255,255,0.12)",
              border: `1px solid rgba(255,255,255,0.1)`,
              backdropFilter: "blur(4px)",
            }}>
            <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: s.color, opacity: 0.7 }} />
            <div className="text-xl sm:text-2xl font-black tabular-nums" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[8px] font-black uppercase tracking-[0.15em] opacity-50" style={{ color: s.color }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Score bar — editorial split */}
      <div className="flex items-center justify-center gap-4 mb-5">
        <div className="text-right">
          <div className="text-[9px] font-black uppercase tracking-[0.15em] opacity-40" style={{ color: accent }}>{playerName}</div>
          <div className="text-3xl font-black tabular-nums" style={{ color: accent }}>{result.playerScore}</div>
        </div>
        <div className="px-3 py-1">
          <span className="text-sm font-black opacity-30" style={{ color: accent }}>VS</span>
        </div>
        <div className="text-left">
          <div className="text-[9px] font-black uppercase tracking-[0.15em] opacity-40" style={{ color: accent }}>{opponentName}</div>
          <div className="text-3xl font-black tabular-nums" style={{ color: accent }}>{result.opponentScore}</div>
        </div>
      </div>

      {/* Credits — editorial kicker */}
      {creditsEarned != null && creditsEarned > 0 && (
        <div className="mb-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full"
          style={{
            background: `${isWin ? "var(--ttg-success)" : "rgba(255,255,255,0.12)"}`,
            border: "1px solid rgba(255,255,255,0.15)",
          }}>
          <Zap className="w-4 h-4" style={{ color: isWin ? "white" : accent, fill: isWin ? "white" : "none" }} />
          <span className="text-xs font-black uppercase tracking-wider" style={{ color: isWin ? "white" : accent }}>
            +{creditsEarned} Credits
          </span>
        </div>
      )}

      {/* Rematch CTA — editorial button */}
      <button
        onClick={onRematch}
        className="w-full py-3 px-6 font-black text-sm uppercase tracking-[0.15em] transition-all active:scale-95 inline-flex items-center justify-center gap-2"
        style={{
          background: isWin ? "var(--ttg-black)" : "white",
          color: isWin ? "white" : "var(--ttg-black)",
          border: `1px solid ${isWin ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}`,
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        }}>
        <RotateCcw className="w-4 h-4" />
        Rematch
      </button>
    </div>
  )
}
