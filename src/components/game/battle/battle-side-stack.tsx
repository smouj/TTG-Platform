// ============================================================
// Trading Tazos Game — Battle Side Stack v2 (Magazine Editorial)
//
// Shows each player's remaining tazos as a vertical stack
// on their side of the arena. Magazine editorial aesthetic.
// ============================================================
"use client"

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
  const lossCount = totalTazos - remainingTazos - capturedTazos

  return (
    <div
      className={`absolute top-1/4 ${side === "left" ? "left-3 sm:left-5" : "right-3 sm:right-5"} z-20 pointer-events-none`}
      style={{ transform: "translateY(-50%)" }}
    >
      <div className="flex flex-col items-center gap-2">
        {/* Active indicator — editorial rule */}
        {isActive && (
          <div className="w-1 h-10 rounded-full animate-pulse"
            style={{ background: `linear-gradient(to bottom, ${accentColor}, ${accentColor}15)` }} />
        )}

        {/* Label — editorial byline pill */}
        <div
          className="px-2.5 py-1 rounded-full text-center max-w-[90px] sm:max-w-[110px] truncate"
          style={{
            background: `linear-gradient(135deg, ${accentColor}12, ${accentColor}04)`,
            border: `1px solid ${accentColor}18`,
            backdropFilter: "blur(8px)",
          }}
        >
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] truncate block"
            style={{ color: accentColor }}>
            {playerName}
          </span>
        </div>

        {/* Tazo disc stack */}
        <div className="relative">
          <div className="relative" style={{ width: 38, height: Math.max(14, remainingTazos * 5 + 10) }}>
            {Array.from({ length: Math.min(remainingTazos, 8) }).map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 rounded-full"
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

          {/* Count — editorial stat display */}
          <div className="text-center mt-1.5">
            <span className="text-[12px] font-black tabular-nums"
              style={{ color: accentColor, textShadow: `0 0 12px ${accentColor}30` }}>
              {remainingTazos}
            </span>
            <span className="text-[7px] font-black text-white/10 ml-0.5 tracking-wider">/ {totalTazos}</span>
          </div>
        </div>

        {/* Captured / Lost — editorial footnote */}
        <div className="flex items-center gap-3 text-[7px] font-black">
          {capturedTazos > 0 && (
            <span className="text-ttg-success/40">◈ {capturedTazos}</span>
          )}
          {lossCount > 0 && (
            <span className="text-ttg-opponent/30">✕ {lossCount}</span>
          )}
        </div>
      </div>
    </div>
  )
}
