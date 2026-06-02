// ============================================================
// Trading Tazos Game — Battle Event Log
// Scrollable log of turn-by-turn battle results.
// ============================================================
"use client"

import { useRef, useEffect } from "react"
import type { BattleTurn } from "@/lib/battle"
import { Swords, Target, Zap, Shield, Award } from "lucide-react"

interface Props {
  turns: BattleTurn[]
}

export default function BattleEventLog({ turns }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [turns.length])

  if (turns.length === 0) {
    return (
      <div className="p-4 bg-white border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
        <div className="flex items-center gap-2 mb-2">
          <Swords className="w-4 h-4 text-[#1a1a1a]" />
          <span className="font-black text-xs uppercase tracking-wider text-[#1a1a1a]">
            Battle Log
          </span>
        </div>
        <p className="text-xs text-[#1a1a1a]/50 italic">
          The battle hasn&apos;t started yet. Select a tazo and throw it into the arena.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
      <div className="flex items-center gap-2 mb-3">
        <Swords className="w-4 h-4 text-[#1a1a1a]" />
        <span className="font-black text-xs uppercase tracking-wider text-[#1a1a1a]">
          Battle Log
        </span>
        <span className="text-[10px] font-bold text-[#1a1a1a]/40 ml-auto">
          {turns.length} turns
        </span>
      </div>
      <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
        {turns.map((turn, i) => (
          <div
            key={i}
            className="p-2 border-2 border-[#1a1a1a]/10 rounded text-xs"
            style={{ background: turn.playerId === "player" ? "#FFCB0510" : "#E3350D10" }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="font-black text-[10px] uppercase tracking-wider"
                style={{ color: turn.playerId === "player" ? "#FFCB05" : "#E3350D" }}
              >
                Turn {turn.turnNumber}
              </span>
              <span className="text-[#1a1a1a]/40">-</span>
              <span className="font-bold text-[#1a1a1a]">
                {turn.playerId === "player" ? "You" : "Rival"}
              </span>
            </div>

            {/* Aim summary */}
            {turn.aimPhase && (
              <div className="flex flex-wrap gap-1 mb-1">
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#1a1a2e] text-white rounded text-[9px] font-bold">
                  <Target className="w-2.5 h-2.5" />
                  H:{Math.round(turn.aimPhase.horizontalAccuracy * 100)}%
                </span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#1a1a2e] text-white rounded text-[9px] font-bold">
                  <Target className="w-2.5 h-2.5" />
                  V:{Math.round(turn.aimPhase.verticalAccuracy * 100)}%
                </span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#1a1a2e] text-white rounded text-[9px] font-bold">
                  <Zap className="w-2.5 h-2.5" />
                  {Math.round(turn.aimPhase.powerValue * 100)}%
                </span>
              </div>
            )}

            {/* Description */}
            <p className="text-[11px] text-[#1a1a1a]/80 italic leading-relaxed">
              {turn.description}
            </p>

            {/* Collision details */}
            {turn.collisionEvents.length > 0 && (
              <div className="mt-1.5 space-y-0.5">
                {turn.collisionEvents.map((ev, j) => (
                  <div key={j} className="flex items-center gap-1.5 text-[10px]">
                    <Shield className="w-2.5 h-2.5 text-[#1a1a1a]/50" />
                    <span className="text-[#1a1a1a]/60">
                      {ev.impactPoint.toUpperCase()} hit: {ev.impactPower} vs {ev.defensePower} def
                    </span>
                    <span
                      className="font-black uppercase px-1 rounded text-[8px]"
                      style={{
                        background: ev.outcome === "flip" ? "#22C55E30" :
                          ev.outcome === "ring_out" ? "#E3350D30" :
                          ev.outcome === "no_effect" ? "#9CA3AF30" : "#F59E0B30",
                        color: ev.outcome === "flip" ? "#22C55E" :
                          ev.outcome === "ring_out" ? "#E3350D" : "#F59E0B",
                      }}
                    >
                      {ev.outcome.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Captures */}
            {turn.capturedTazos.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
                <Award className="w-3 h-3 text-[#22C55E]" />
                <span className="font-black text-[#22C55E] uppercase">
                  CAPTURED {turn.capturedTazos.length} TAZO{turn.capturedTazos.length > 1 ? "S" : ""}!
                </span>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
