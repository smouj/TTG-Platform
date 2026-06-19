// ============================================================
// Trading Tazos Game — Battle Side Stack v3 (Clean Visual)
//
// Shows each player's remaining tazos as a vertical disc stack
// on their side of the arena. Pure visual — no text labels
// (HUD handles all game-state text). Magazine aesthetic.
// ============================================================
"use client"

import { useEffect, useState } from "react"

interface Props {
  playerName: string
  totalTazos: number
  remainingTazos: number
  capturedTazos: number
  side: "left" | "right"
  isActive: boolean
  playerType: "player" | "opponent"
  franchise?: string
}

export default function BattleSideStack({
  playerName, totalTazos, remainingTazos, capturedTazos,
  side, isActive, playerType,
}: Props) {
  const isPlayer = playerType === "player"
  const accentColor = isPlayer ? "var(--ttg-player)" : "var(--ttg-opponent)"
  const [animKey, setAnimKey] = useState(0)

  // Animate when remaining changes (tazo lost or captured)
  useEffect(() => {
    setAnimKey(k => k + 1)
  }, [remainingTazos])

  return (
    <div
      className={`absolute top-[20%] ${side === "left" ? "left-3 sm:left-5" : "right-3 sm:right-5"} z-20 pointer-events-none`}
      style={{ transform: "translateY(-50%)" }}
    >
      <div className="flex flex-col items-center gap-1.5">
        {/* Active indicator — editorial rule */}
        {isActive && (
          <div className="w-1 h-8 rounded-full animate-pulse"
            style={{ background: `linear-gradient(to bottom, ${accentColor}, ${accentColor}10)` }} />
        )}

        {/* Tazo disc stack — pure visual, no labels */}
        <div className="relative" key={animKey}>
          <div className="relative" style={{ width: 38, height: Math.max(14, remainingTazos * 5 + 8) }}>
            {Array.from({ length: Math.min(remainingTazos, 8) }).map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 rounded-full transition-all duration-300"
                style={{
                  width: 32 - i * 1.5,
                  height: 32 - i * 1.5,
                  marginLeft: -(16 - i * 0.75),
                  bottom: i * 3.5,
                  background: `linear-gradient(135deg, ${accentColor}${Math.round(35 - i * 3)}, ${accentColor}${Math.round(18 - i * 1.5)})`,
                  border: `1px solid ${accentColor}30`,
                  boxShadow: i === 0 ? `0 0 12px ${accentColor}18, inset 0 1px 0 rgba(255,255,255,0.08)` : "none",
                }}
              />
            ))}
            {remainingTazos > 8 && (
              <div className="absolute left-1/2 rounded-full flex items-center justify-center"
                style={{
                  width: 22, height: 22, marginLeft: -11, bottom: 28,
                  background: accentColor, border: "2px solid rgba(0,0,0,0.4)", zIndex: 10,
                  boxShadow: `0 0 10px ${accentColor}40`,
                }}>
                <span className="text-[8px] font-black text-white">{remainingTazos}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
