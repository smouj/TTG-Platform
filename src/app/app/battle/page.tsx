"use client"

// Battle — full vertical slam experience at /app/battle
// MagazinePageShell provided by /app/layout.tsx
// BattleView handles its own: lobby → game → result flow.

import BattleView from "@/components/game/battle-view"

export default function BattlePage() {
  return <BattleView />
}
