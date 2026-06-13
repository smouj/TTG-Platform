// ============================================================
// Trading Tazos Game — Battle Hand v1
//
// Shows player's 5-tazo hand at the bottom of the arena.
// During betting: click to stake a tazo.
// During aiming: shows which tazo is airborne.
// ============================================================
"use client"

import { useState } from "react"
import type { TazoCard } from "@/lib/battle/game-loop"
import TazoDiscImage from "@/components/game/tazo-disc-image"
import { Swords, Check } from "lucide-react"

interface Props {
  hand: TazoCard[]
  phase: "idle" | "betting" | "bet_locked" | "revealed"
  selectedId?: string | null
  airborneId?: string | null
  onSelect?: (tazo: TazoCard) => void
}

function fColor(f: string) {
  return f === "minimon" ? "#FFCB05" : f === "cybermon" ? "#00A1E9" : "#FF6B00"
}

export default function BattleHand({ hand, phase, selectedId, airborneId, onSelect }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (!hand.length) return null

  const tazos = hand.slice(0, 5)
  const isBetting = phase === "betting"
  const isLocked = phase === "bet_locked" || phase === "revealed"

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 pb-2 pointer-events-none">
      {/* Label */}
      <div className="flex justify-center mb-1">
        <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] bg-black/40 px-3 py-0.5 rounded-full border border-white/5">
          {isBetting ? "SELECT YOUR TAZO" : isLocked ? "STAKED" : "YOUR HAND"}
        </span>
      </div>

      {/* Cards */}
      <div className="flex justify-center items-end gap-1.5 px-4">
        {tazos.map((tazo, i) => {
          const isSelected = tazo.id === selectedId
          const isAirborne = tazo.id === airborneId
          const isHovered = tazo.id === hoveredId
          const clickable = isBetting && onSelect && !isLocked

          // Card offset for fan effect
          const offsetY = isHovered ? -24 : isSelected ? -12 : 0
          const scale = isHovered ? 1.08 : isSelected ? 1.04 : 1
          const zIndex = isHovered || isSelected ? 20 : 10 - Math.abs(i - 2) // center cards higher

          return (
            <button
              key={tazo.id}
              onClick={() => clickable && onSelect(tazo)}
              onMouseEnter={() => setHoveredId(tazo.id)}
              onMouseLeave={() => setHoveredId(null)}
              disabled={!clickable}
              className={`relative pointer-events-auto transition-all duration-200 ease-out ${
                clickable ? "cursor-pointer" : isLocked ? "cursor-default" : "cursor-default"
              }`}
              style={{
                transform: `translateY(${offsetY}px) scale(${scale})`,
                zIndex,
                opacity: isAirborne ? 0.3 : 1,
              }}
            >
              {/* Selection ring */}
              {isSelected && (
                <div className="absolute -inset-1 rounded-xl border-2 border-[#FFCC00] shadow-[0_0_16px_rgba(255,204,0,0.4)] animate-pulse" />
              )}

              {/* Hover glow */}
              {isHovered && !isSelected && (
                <div className="absolute -inset-1 rounded-xl border-2 border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.08)]" />
              )}

              {/* Card body */}
              <div
                className="relative w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] rounded-xl overflow-hidden border-2 transition-all"
                style={{
                  borderColor: isSelected
                    ? "#FFCC00"
                    : isHovered
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(255,255,255,0.06)",
                  background: isSelected
                    ? "linear-gradient(135deg, rgba(255,204,0,0.15), rgba(255,204,0,0.05))"
                    : "rgba(0,0,0,0.4)",
                  boxShadow: isSelected
                    ? "0 8px 24px rgba(255,204,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)"
                    : "0 4px 12px rgba(0,0,0,0.3)",
                }}
              >
                {/* Tazo image */}
                <TazoDiscImage
                  src={tazo.imageUrl}
                  alt={tazo.name}
                  size="100%"
                  franchiseSlug={tazo.franchise}
                  borderWidth={0}
                  className="w-full h-full"
                />

                {/* Franchise color indicator */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[3px]"
                  style={{ background: fColor(tazo.franchise) }}
                />

                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#FFCC00] flex items-center justify-center shadow-[0_0_6px_rgba(255,204,0,0.6)]">
                    <Check className="w-2.5 h-2.5 text-[#1a1a1a]" strokeWidth={4} />
                  </div>
                )}
              </div>

              {/* Card info label */}
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span
                  className={`text-[7px] font-black uppercase tracking-wider transition-colors ${
                    isSelected ? "text-[#FFCC00]" : isHovered ? "text-white/60" : "text-white/20"
                  }`}
                >
                  {tazo.name}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Stats bar */}
      {isBetting && !selectedId && (
        <div className="flex justify-center mt-2">
          <span className="text-[8px] font-black text-[#FFCC00]/50 bg-black/30 px-3 py-1 rounded-full border border-[#FFCC00]/10 animate-pulse">
            Choose wisely — higher stats = better slam
          </span>
        </div>
      )}
    </div>
  )
}
