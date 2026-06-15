"use client"

// ============================================================
// Battle Play — renders BattleView inline within the magazine
// app shell (header + tabs + HUD). No separate fullscreen page.
//
// BattleView reads mode/difficulty/deckId from sessionStorage
// (set by the /app/battle lobby).
// ============================================================

import BattleView from "@/components/game/battle-view"

export default function BattlePlayPage() {
  return <BattleView />
}
