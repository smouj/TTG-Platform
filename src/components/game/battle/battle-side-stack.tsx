// ============================================================
// Trading Tazos Game — Battle Side Stack v1
//
// Shows each player's remaining tazos as a vertical stack
// on their side of the arena. Animates as tazos are lost.
// ============================================================
"use client"

import { Disc3, Swords } from "lucide-react"

interface Props {
  playerName: string
  totalTazos: number
  remainingTazos: number
  capturedTazos: number
  side: "left" | "right"
  isActive: boolean        // Whose turn is it?
  playerType: "player" | "opponent"
  franchise?: string       // For color theming
}

function fColor(f?: string) {
  return f === "minimon" ? "#FFCB05" : f === "cybermon" ? "#00A1E9" : "#FF6B00"
}

export default function BattleSideStack({
  playerName, totalTazos, remainingTazos, capturedTazos,
  side, isActive, playerType, franchise,
}: Props) {
  const isPlayer = playerType === "player"
  const accentColor = isPlayer ? "#29ADFF" : "#FF004D"
  const lossCount = totalTazos - remainingTazos - capturedTazos

  return (
    <div
      className={`absolute top-1/4 ${side === "left" ? "left-3 sm:left-6" : "right-3 sm:right-6"} z-20 pointer-events-none`}
      style={{ transform: "translateY(-50%)" }}
    >
      <div
        className="flex flex-col items-center gap-1.5"
        style={{
          filter: isActive
            ? `drop-shadow(0 0 12px ${accentColor}33)`
            : "none",
        }}
      >
        {/* Active indicator pulse */}
        {isActive && (
          <div className="w-1.5 h-8 rounded-full animate-pulse"
            style={{ background: `linear-gradient(to bottom, ${accentColor}, transparent)` }}
          />
        )}

        {/* Player name */}
        <div
          className="px-2 py-0.5 rounded-full border text-center max-w-[80px] sm:max-w-[100px] truncate"
          style={{
            background: isActive ? `${accentColor}18` : "rgba(0,0,0,0.4)",
            borderColor: isActive ? `${accentColor}40` : "rgba(255,255,255,0.08)",
          }}
        >
          <span
            className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider truncate block"
            style={{ color: isActive ? accentColor : "rgba(255,255,255,0.25)" }}
          >
            {playerName}
          </span>
        </div>

        {/* Tazo stack visualization */}
        <div className="relative">
          {/* Stack of discs */}
          <div className="relative" style={{ width: 36, height: Math.max(12, remainingTazos * 5 + 8) }}>
            {Array.from({ length: Math.min(remainingTazos, 8) }).map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 rounded-full border"
                style={{
                  width: 32 - i * 1.5,
                  height: 32 - i * 1.5,
                  marginLeft: -(16 - i * 0.75),
                  bottom: i * 3.5,
                  background: `linear-gradient(135deg, ${accentColor}${Math.round(30 - i * 3)} , ${accentColor}${Math.round(15 - i * 1.5)})`,
                  borderColor: `${accentColor}40`,
                  boxShadow: i === 0 ? `0 0 8px ${accentColor}20` : "none",
                }}
              />
            ))}
            {/* If more than 8, show a count badge */}
            {remainingTazos > 8 && (
              <div
                className="absolute left-1/2 rounded-full flex items-center justify-center"
                style={{
                  width: 20,
                  height: 20,
                  marginLeft: -10,
                  bottom: 28,
                  background: accentColor,
                  border: "2px solid rgba(0,0,0,0.3)",
                  zIndex: 10,
                }}
              >
                <span className="text-[7px] font-black text-white">{remainingTazos}</span>
              </div>
            )}
          </div>

          {/* Count label */}
          <div className="text-center mt-1">
            <span className="text-[9px] font-black tabular-nums" style={{ color: accentColor }}>
              {remainingTazos}
            </span>
            <span className="text-[7px] font-black text-white/15 ml-0.5">/ {totalTazos}</span>
          </div>
        </div>

        {/* Lost/Captured indicators */}
        <div className="flex gap-2 text-[7px] font-black">
          {capturedTazos > 0 && (
            <span className="text-[#22C55E]/60">◈ {capturedTazos}</span>
          )}
          {lossCount > 0 && (
            <span className="text-[#FF004D]/40">✕ {lossCount}</span>
          )}
        </div>
      </div>
    </div>
  )
}
