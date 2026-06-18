// ============================================================
// Trading Tazos Game — BagOpener2D (WebGL Fallback)
//
// Simple 2D bag opening interface for browsers without WebGL.
// Shows a stylized bag card with an "Open" button.
// Works on any device: mobile, tablet, desktop, older browsers.
// ============================================================
"use client"

import { useState, useMemo } from "react"
import { ShoppingBag, Sparkles, PackageOpen } from "lucide-react"
import { playSFX } from "@/lib/audio/sfx-engine"
import { pickBagVariant } from "@/lib/bag-variants"

const FRANCHISE_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  minimon: { bg: "linear-gradient(135deg, var(--ttg-black) 0%, #332200 50%, var(--ttg-black) 100%)", border: "var(--ttg-yellow)", text: "var(--ttg-yellow)", glow: "#FFCC0040" },
  cybermon: { bg: "linear-gradient(135deg, var(--ttg-black) 0%, #001133 50%, var(--ttg-black) 100%)", border: "var(--ttg-rarity-rare)", text: "var(--ttg-rarity-rare)", glow: "#3B82F640" },
  dracobell: { bg: "linear-gradient(135deg, var(--ttg-black) 0%, #331100 50%, var(--ttg-black) 100%)", border: "#F97316", text: "#F97316", glow: "#F9731640" },
}

export function BagOpener2D({ bagName, franchise, onOpen }: {
  bagName: string
  franchise: string
  onOpen: () => void
}) {
  const [opening, setOpening] = useState(false)
  const colors = FRANCHISE_COLORS[franchise] || FRANCHISE_COLORS.minimon

  const handleOpen = () => {
    if (opening) return
    setOpening(true)
    playSFX('bag_open', { volume: 0.55 })
    setTimeout(() => {
      playSFX('reveal', { volume: 0.5 })
      onOpen()
    }, 900)
  }

  return (
    <div className="relative w-full" style={{ minHeight: 340 }}>
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-48 h-48 rounded-full opacity-15 blur-2xl animate-pulse"
          style={{ background: `radial-gradient(circle, ${colors.border}, transparent)` }} />
      </div>

      {/* Bag card */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 py-10 px-4">
        {/* Bag icon */}
        <div className="relative">
          <div
            className="w-32 h-40 flex flex-col items-center justify-center gap-2 border-[3px] transition-all duration-700"
            style={{
              background: colors.bg,
              borderColor: opening ? colors.border : `${colors.border}60`,
              boxShadow: opening
                ? `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}, inset 0 0 30px ${colors.glow}`
                : `4px 4px 0px var(--ttg-black)`,
              transform: opening ? "scale(1.05)" : "scale(1)",
            }}
          >
            {opening ? (
              <div className="flex flex-col items-center gap-1 animate-pulse">
                <Sparkles className="w-10 h-10" style={{ color: colors.text }} />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: colors.text }}>
                  Opening…
                </span>
              </div>
            ) : (
              <>
                <ShoppingBag className="w-12 h-12" style={{ color: colors.text }} />
                <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.15em] px-2 text-center leading-tight">
                  {bagName || "Tazo Bag"}
                </span>
                <span className="text-[7px] font-bold uppercase tracking-[0.3em]"
                  style={{ color: `${colors.text}80` }}>
                  {franchise.toUpperCase()}
                </span>
              </>
            )}
          </div>

          {/* Opening rings */}
          {opening && (
            <>
              <div className="absolute inset-0 border-2 rounded-full animate-ping opacity-30"
                style={{ borderColor: colors.border, animationDuration: "1.5s" }} />
              <div className="absolute inset-0 border-2 rounded-full animate-ping opacity-20"
                style={{ borderColor: colors.border, animationDuration: "1s", animationDelay: "0.3s" }} />
            </>
          )}
        </div>

        {/* Open button */}
        <button
          onClick={handleOpen}
          disabled={opening}
          className="px-8 py-3 font-black text-xs sm:text-sm uppercase tracking-[0.15em] border-[3px] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-wait"
          style={{
            backgroundColor: opening ? colors.border : "var(--ttg-black)",
            color: opening ? "var(--ttg-black)" : colors.text,
            borderColor: colors.border,
            boxShadow: opening
              ? `0 0 20px ${colors.glow}`
              : `4px 4px 0px ${colors.border}`,
          }}
        >
          {opening ? (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" /> Opening…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <PackageOpen className="w-4 h-4" /> OPEN BAG
            </span>
          )}
        </button>

        <p className="text-[8px] font-bold text-ttg-black/20 uppercase tracking-[0.2em]">
          Click to reveal your tazo
        </p>
      </div>
    </div>
  )
}

export default BagOpener2D
