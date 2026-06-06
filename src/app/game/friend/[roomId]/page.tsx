"use client"

import { useParams } from "next/navigation"
// Friend Battle — fullscreen PvP with room code
import GameShell from "@/components/game-shell"
import FullscreenBattle from "@/components/game/battle/fullscreen-battle"

export default function FriendPage() {
  const params = useParams()
  const roomId = params?.roomId as string || "unknown"

  return (
    <GameShell title={`FRIEND BATTLE · ${roomId}`} backHref="/app/battle">
      <FullscreenBattle mode="pvp_friend" roomId={roomId} />
    </GameShell>
  )
}
