"use client"

// Battle — full vertical slam experience at /app/battle
// MagazinePageShell wraps this; we fill the space between header and HUD.

import BattleView from "@/components/game/battle-view"

export default function BattlePage() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <BattleView />
    </div>
  )
}
