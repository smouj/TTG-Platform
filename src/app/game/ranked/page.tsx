"use client"

// ============================================================
// Redirect from /game/ranked to /game/friend/ranked
// The friend room page handles both friend and ranked PvP flows.
// ============================================================

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RankedRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace("/game/friend/ranked") }, [router])
  return (
    <div className="min-h-[80vh] flex items-center justify-center" style={{ background: "#FFF9E6" }}>
      <div className="text-sm font-black text-[#FFCC00] animate-pulse uppercase tracking-wider">
        Loading Ranked Matchmaking...
      </div>
    </div>
  )
}
