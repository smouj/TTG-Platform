"use client"

// ============================================================
// GameShell — Fullscreen arena wrapper
//
// Renders children in a fixed fullscreen container that
// completely replaces the web shell. No header, footer, nav,
// SEO elements, or scroll.
//
// This is the "game-first" layout: when you're in the arena,
// you're in a game, not a web page with a game embedded.
// ============================================================

import { type ReactNode } from "react"

export default function GameShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "var(--ttg-arena-bg, #0a0a0a)",
        overflow: "hidden",
        overscrollBehavior: "none",
      }}
    >
      {children}
    </div>
  )
}
