// ============================================================
// Trading Tazos Game — Game Fullscreen Shell
//
// Full-viewport wrapper for battle gameplay.
// No dashboard chrome: no header, no tabbar, no footer, no HUD.
// Locks body scroll while mounted.
// Children (BattleView) render in absolute inset-0 relative to
// this fixed container.
// ============================================================
"use client"

import { useEffect } from "react"

export default function GameFullscreenShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        background: "var(--ttg-arena-bg)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  )
}
