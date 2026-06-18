// ============================================================
// Trading Tazos Game — Battle Hand v2 (Magazine Editorial)
//
// Player's 5-tazo hand at bottom of arena.
// Magazine editorial card treatment with consistent typography.
// Only renders during betting phase.
// ============================================================
"use client"

import { useState } from "react"
import type { TazoCard } from "@/lib/battle/game-loop"
import TazoDiscImage from "@/components/game/tazo-disc-image"
import { Check } from "lucide-react"

interface Props {
  hand: TazoCard[]
  phase: "idle" | "betting" | "bet_locked" | "revealed"
  selectedId?: string | null
  airborneId?: string | null
  onSelect?: (tazo: TazoCard) => void
}

function fColor(f: string) {
  return f === "minimon" ? "var(--ttg-minimon)" : f === "cybermon" ? "var(--ttg-cybermon)" : "var(--ttg-dracobell)"
}

export default function BattleHand({ hand, phase, selectedId, airborneId, onSelect }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Don't render at all when not in betting/locked/revealed phase
  if (!hand.length) return null
  if (phase === "idle") return null

  const tazos = hand.slice(0, 5)
  const isBetting = phase === "betting"
  const isLocked = phase === "bet_locked" || phase === "revealed"

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 pb-3 pointer-events-none">
      {/* Editorial label */}
      <div className="flex justify-center mb-1.5">
        <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.3em] bg-black/50 backdrop-blur-sm px-4 py-1 rounded-full border border-white/4">
          {isBetting ? "Select your tazo" : isLocked ? "Staked" : "Your hand"}
        </span>
      </div>

      {/* Cards — magazine editorial spread */}
      <div className="flex justify-center items-end gap-1.5 px-4">
        {tazos.map((tazo, i) => {
          const isSelected = tazo.id === selectedId
          const isAirborne = tazo.id === airborneId
          const isHovered = tazo.id === hoveredId
          const clickable = isBetting && onSelect && !isLocked

          const offsetY = isHovered ? -28 : isSelected ? -14 : 0
          const scale = isHovered ? 1.1 : isSelected ? 1.05 : 1
          const zIndex = isHovered || isSelected ? 20 : 10 - Math.abs(i - 2)

          return (
            <button
              key={tazo.id}
              onClick={() => clickable && onSelect(tazo)}
              onMouseEnter={() => setHoveredId(tazo.id)}
              onMouseLeave={() => setHoveredId(null)}
              disabled={!clickable}
              className="relative pointer-events-auto transition-all duration-200 ease-out"
              style={{
                transform: `translateY(${offsetY}px) scale(${scale})`,
                zIndex,
                opacity: isAirborne ? 0.2 : 1,
              }}
            >
              {/* Selection ring — editorial highlight */}
              {isSelected && (
                <div className="absolute -inset-1 border-[1.5px] border-ttg-yellow shadow-[0_0_20px_rgba(255,204,0,0.35)] animate-pulse" />
              )}

              {/* Hover ring */}
              {isHovered && !isSelected && (
                <div className="absolute -inset-1 border-[1.5px] border-white/15 shadow-[0_0_16px_rgba(255,255,255,0.06)]" />
              )}

              {/* Card — magazine-issue block */}
              <div
                className="relative w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] overflow-hidden transition-all"
                style={{
                  border: `1.5px solid ${isSelected ? "var(--ttg-yellow)" : isHovered ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)"}`,
                  background: isSelected
                    ? "linear-gradient(135deg, rgba(255,204,0,0.12), rgba(255,204,0,0.03))"
                    : "linear-gradient(135deg, rgba(0,0,0,0.5), rgba(0,0,0,0.2))",
                  boxShadow: isSelected
                    ? "0 8px 28px rgba(255,204,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)"
                    : "0 4px 14px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)",
                }}
              >
                <TazoDiscImage
                  src={tazo.imageUrl}
                  alt={tazo.name}
                  size="100%"
                  franchiseSlug={tazo.franchise}
                  borderWidth={0}
                  className="w-full h-full"
                />

                {/* Franchise color accent bar */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] opacity-80"
                  style={{ background: fColor(tazo.franchise) }} />

                {/* Selected checkmark — editorial CTA badge */}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-ttg-yellow flex items-center justify-center shadow-[0_0_8px_rgba(255,204,0,0.5)]">
                    <Check className="w-3 h-3 text-[#0a0a0a]" strokeWidth={4} />
                  </div>
                )}
              </div>

              {/* Card name — editorial caption */}
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className={`text-[7px] font-black uppercase tracking-wider transition-colors ${
                  isSelected ? "text-ttg-yellow" : isHovered ? "text-white/50" : "text-white/12"
                }`}>
                  {tazo.name}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* CTA prompt — editorial kicker */}
      {isBetting && !selectedId && (
        <div className="flex justify-center mt-2">
          <span className="text-[8px] font-black text-ttg-yellow/30 bg-black/40 backdrop-blur-sm px-4 py-1 rounded-full border border-ttg-yellow/10 animate-pulse tracking-wider uppercase">
            Choose wisely — higher stats = better slam
          </span>
        </div>
      )}
    </div>
  )
}
