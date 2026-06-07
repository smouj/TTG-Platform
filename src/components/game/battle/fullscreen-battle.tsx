"use client"

// Fullscreen Battle — thin wrapper for /game/* routes.
// Delegates all game logic to BattleView (vertical slam mechanic).
// Accepts mode and optional roomId props, then passes to BattleView
// which handles lobby → match → result flow internally.

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import type { PlayMode } from "@/lib/battle/game-loop"
import BattleView from "../battle-view"

interface Props {
  mode: PlayMode
  roomId?: string
}

export default function FullscreenBattle({ mode, roomId }: Props) {
  const router = useRouter()

  return (
    <div className="w-full" style={{ height: "calc(100vh - 56px)" }}>
      {/* Small back-to-menu bar at top if needed — BattleView handles its own HUD */}
      <div className="absolute top-2 left-2 z-30">
        <button
          onClick={() => router.push("/app?tab=battle")}
          className="flex items-center gap-1 px-2 py-1 text-[9px] font-black text-white/30 hover:text-white/60 bg-black/40 hover:bg-black/60 rounded uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Exit
        </button>
      </div>
      <BattleView />
    </div>
  )
}
