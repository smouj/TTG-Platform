"use client"

// Battle view — served at /app/battle
// MagazinePageShell provided by /app/layout.tsx

import BattleView from "@/components/game/battle-view"

export default function BattlePage() {
  return (
    <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 min-h-0 overflow-hidden flex">
      <BattleView />
    </div>
  )
}
