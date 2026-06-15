"use client"

// ============================================================
// Redirect from legacy /game/practice to /app/battle/play
// All battles now render within the magazine app shell.
// ============================================================

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PracticeRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/app/battle/play")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#FFF9E6" }}>
      <div className="text-sm font-black text-[#FFCC00] animate-pulse uppercase tracking-wider">
        Loading Arena...
      </div>
    </div>
  )
}
