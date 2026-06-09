"use client"

// Battle — full vertical slam experience at /app/battle
// MagazinePageShell provided by /app/layout.tsx
// BattleView handles its own: lobby → game → result flow.

import BattleView from "@/components/game/battle-view"

export default function BattlePage() {
  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
      <BattleView />
    </div>
  )
}
