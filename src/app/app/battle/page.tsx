"use client"

// Battle Lobby — served at /app/battle
// MagazinePageShell provided by /app/layout.tsx
// Navigate to /game/* for fullscreen battle experience.

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import GameLobby from "@/components/game/battle/game-lobby"
import { Disc3 } from "lucide-react"
import type { TazoCard, PlayMode, AIDifficulty } from "@/lib/battle/game-loop"

async function fetchTazos(token: string): Promise<TazoCard[]> {
  try {
    const r = await fetch("/api/tazos?limit=100", { headers: { Authorization: `Bearer ${token}` } })
    if (!r.ok) return []
    const d = await r.json()
    return (d.tazos || []).map((t: any) => ({
      id: t.id, name: t.name || "?", slug: t.slug || (t.name || "?").toLowerCase().replace(/\s/g, "-"),
      franchise: (t.franchise || t.franchiseSlug || "minimon") as TazoCard["franchise"],
      imageUrl: t.imageUrl || null,
      attack: t.attack || 50, defense: t.defense || 50,
      resistance: t.resistance || 50, weight: t.weight || 50, stability: t.stability || 50,
      spin: t.spin || 50, control: t.control || 50, bounce: t.bounce || 50, precision: t.precision || 50,
    }))
  } catch { return [] }
}

export default function BattleLobbyPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [tazos, setTazos] = useState<TazoCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      let list: TazoCard[] = []
      if (user && token) list = await fetchTazos(token)
      setTazos(list.length >= 5 ? list : [])
      setLoading(false)
    })()
  }, [user, token])

  const handleStart = (mode: PlayMode, diff: AIDifficulty, _deck: TazoCard[]) => {
    // Route to the appropriate fullscreen game page
    switch (mode) {
      case "practice":
        router.push("/game/practice")
        break
      case "pvp_ranked":
        router.push("/game/ranked")
        break
      case "pvp_friend":
        // Generate a room code and navigate
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()
        router.push(`/game/friend/${roomId}`)
        break
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-28">
      <Disc3 className="w-12 h-12 animate-spin text-[#FFCC00]" />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 py-3 sm:py-4">
      <GameLobby
        playerTazos={tazos}
        onStart={handleStart}
        isLoading={false}
        isAuthenticated={!!user}
      />
    </div>
  )
}
