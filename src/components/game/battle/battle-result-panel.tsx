// ============================================================
// Trading Tazos Game — Battle Result Panel
// Victory/defeat screen with stats summary.
// ============================================================
"use client"

import { useI18n } from "@/lib/i18n"
import type { BattleFinalResult } from "@/lib/battle"
import { Swords, Award, Timer, Shield, Zap, RotateCcw } from "lucide-react"

interface Props {
  result: BattleFinalResult
  playerName: string
  opponentName: string
  onRematch: () => void
  creditsEarned?: number
}

export default function BattleResultPanel({ result, playerName, opponentName, onRematch, creditsEarned }: Props) {
  const { t } = useI18n()
  const isWin = result.winner === "player"
  const isDraw = result.winner === "draw"

  return (
    <div
      className="p-6 text-center border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a]"
      style={{
        background: isWin
          ? "linear-gradient(135deg, #FFCB05, #FF8C00)"
          : isDraw
          ? "linear-gradient(135deg, #9CA3AF, #6B7280)"
          : "linear-gradient(135deg, #E3350D, #991B1B)",
      }}
    >
      {/* Trophy */}
      <div className="mb-3">
        <div
          className="w-20 h-20 mx-auto rounded-full flex items-center justify-center border-4 border-[#1a1a1a]"
          style={{
            background: isWin ? "#FFCB05" : isDraw ? "#D1D5DB" : "#991B1B",
            boxShadow: "4px 4px 0px #1a1a1a",
          }}
        >
          {isWin ? (
            <Award className="w-10 h-10 text-[#1a1a1a]" />
          ) : isDraw ? (
            <Shield className="w-10 h-10 text-[#1a1a1a]" />
          ) : (
            <Swords className="w-10 h-10 text-white" />
          )}
        </div>
      </div>

      {/* Title */}
      <h2
        className="text-3xl font-black uppercase tracking-wider mb-1"
        style={{
          color: isWin ? "#1a1a1a" : "white",
          textShadow: isDraw ? "2px 2px 0px #1a1a1a40" : "2px 2px 0px #1a1a1a",
        }}
      >
        {isWin ? "VICTORY!" : isDraw ? "DRAW!" : "DEFEAT!"}
      </h2>
      <p className="text-sm font-bold mb-4" style={{ color: isWin ? "#1a1a1a" : "#ffffffcc" }}>
        {result.summary}
      </p>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-white/20 border-2 border-[#1a1a1a]/20 rounded p-2">
          <Timer className="w-4 h-4 mx-auto mb-1 text-[#1a1a1a]" />
          <div className="text-2xl font-black text-[#1a1a1a]">{result.totalTurns}</div>
          <div className="text-[9px] font-bold uppercase text-[#1a1a1a]/60">{t.result_turns}</div>
        </div>
        <div className="bg-white/20 border-2 border-[#1a1a1a]/20 rounded p-2">
          <Award className="w-4 h-4 mx-auto mb-1 text-[#22C55E]" />
          <div className="text-2xl font-black text-[#1a1a1a]">{result.playerCaptures}</div>
          <div className="text-[9px] font-bold uppercase text-[#1a1a1a]/60">{t.result_captures}</div>
        </div>
        <div className="bg-white/20 border-2 border-[#1a1a1a]/20 rounded p-2">
          <Shield className="w-4 h-4 mx-auto mb-1 text-[#E3350D]" />
          <div className="text-2xl font-black text-[#1a1a1a]">{result.opponentCaptures}</div>
          <div className="text-[9px] font-bold uppercase text-[#1a1a1a]/60">{t.result_lost}</div>
        </div>
      </div>

      {/* Score bar */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <div className="text-right">
          <div className="text-xs font-bold text-[#1a1a1a]/60">{playerName}</div>
          <div className="text-2xl font-black text-[#1a1a1a]">{result.playerScore}</div>
        </div>
        <div className="text-lg font-black text-[#1a1a1a]/40">{t.result_vs}</div>
        <div className="text-left">
          <div className="text-xs font-bold text-[#1a1a1a]/60">{opponentName}</div>
          <div className="text-2xl font-black text-[#1a1a1a]">{result.opponentScore}</div>
        </div>
      </div>

      {/* Credits earned */}
      {creditsEarned != null && creditsEarned > 0 && (
        <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#22C55E] border-2 border-[#1a1a1a] text-white">
          <Zap className="w-4 h-4 fill-white" />
          <span className="text-xs font-black uppercase">+{creditsEarned} Credits</span>
        </div>
      )}

      {/* Rematch */}
      <button
        onClick={onRematch}
        className="px-6 py-3 font-black text-sm uppercase tracking-wider bg-white text-[#1a1a1a] border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
      >
        <RotateCcw className="w-4 h-4 inline mr-2" />
        {t.battle_rematch}
      </button>
    </div>
  )
}
