"use client"

// Ranked Battle — fullscreen PvP mode
import GameShell from "@/components/game-shell"
import FullscreenBattle from "@/components/game/battle/fullscreen-battle"

export default function RankedPage() {
  return (
    <GameShell title="RANKED BATTLE" backHref="/app/battle">
      <FullscreenBattle mode="pvp_ranked" />
    </GameShell>
  )
}
