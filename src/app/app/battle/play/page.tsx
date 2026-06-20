"use client"

// ============================================================
// Battle Play — Fullscreen 3D arena (no web shell)
//
// GameShell provides the fixed fullscreen container.
// BattleView handles arena, physics, HUD, and state.
//
// BattleView reads mode/difficulty/deckId from sessionStorage
// (set by the /app/battle lobby).
// ============================================================

import dynamic from "next/dynamic"
import { useI18n } from "@/lib/i18n"
import GameShell from "@/components/game/game-shell"

// Loading overlay — matches GameShell aesthetic with scanlines
function BattlePlayLoadingOverlay() {
  const { t } = useI18n()
  return (
    <GameShell>
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
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2rem"
      }}>
        <div style={{ position: "relative" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            border: "3px solid rgba(255,204,0,0.12)",
            borderTopColor: "var(--ttg-yellow)",
            animation: "spin 0.8s linear infinite",
            boxShadow: "0 0 32px rgba(255,204,0,0.15)",
          }} />
          <div style={{
            position: "absolute", inset: -6, borderRadius: "50%",
            border: "2px solid rgba(255,204,0,0.06)",
            animation: "ping 1.5s ease-out infinite",
          }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.25em", margin: 0 }}>
            {t.battle_entering_arena}
          </p>
          <p style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,204,0,0.25)", textTransform: "uppercase", letterSpacing: "0.4em", marginTop: 8 }}>
            {t.battle_battle_loading}
          </p>
        </div>
      </div>
    </GameShell>
  )
}

const BattleView = dynamic(() => import("@/components/game/battle-view"), {
  ssr: false,
  loading: BattlePlayLoadingOverlay,
})

export default function BattlePlayPage() {
  return (
    <GameShell>
      <BattleView />
    </GameShell>
  )
}
