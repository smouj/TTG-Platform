"use client"

// ============================================================
// Battle Play — renders BattleView inline within the magazine
// app shell (header + tabs + HUD). No separate fullscreen page.
//
// BattleView reads mode/difficulty/deckId from sessionStorage
// (set by the /app/battle lobby).
//
// v2 (2026-06-16): Lazy-loaded BattleView to avoid bundling
// Three.js into the initial app chunk. The loading spinner
// matches the magazine aesthetic.
// ============================================================

import dynamic from "next/dynamic"

const BattleView = dynamic(() => import("@/components/game/battle-view"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2rem",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
      }}
    >
      {/* Scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
        }}
      />
      {/* Diagonal stripes */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.08,
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,204,0,0.3) 8px, rgba(255,204,0,0.3) 10px)",
        }}
      />

      {/* Tazo disc spinner */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            border: "3px solid rgba(255,204,0,0.12)",
            borderTopColor: "#FFCC00",
            animation: "spin 0.8s linear infinite",
            boxShadow: "0 0 32px rgba(255,204,0,0.15)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: -6,
            borderRadius: "50%",
            border: "2px solid rgba(255,204,0,0.06)",
            animation: "ping 1.5s ease-out infinite",
          }}
        />
      </div>

      {/* Message */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 900,
            color: "rgba(255,255,255,0.7)",
            textTransform: "uppercase",
            letterSpacing: "0.25em",
            margin: 0,
          }}
        >
          Entering Arena…
        </p>
        <p
          style={{
            fontSize: 8,
            fontWeight: 700,
            color: "rgba(255,204,0,0.25)",
            textTransform: "uppercase",
            letterSpacing: "0.4em",
            marginTop: 8,
          }}
        >
          Battle loading
        </p>
      </div>
    </div>
  ),
})

export default function BattlePlayPage() {
  return <BattleView />
}
