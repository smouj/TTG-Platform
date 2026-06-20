// ============================================================
// Trading Tazos Game — Public Practice Arena
// No auth required. No progress saved. Instant gameplay.
// ============================================================
"use client"
import Image from "next/image"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { AuthProvider } from "@/lib/auth-context"

// Lazy-load BattleView — it's heavy (~1315 lines, Three.js)
const BattleView = dynamic(() => import("@/components/game/battle-view"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-ttg-arena-bg">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full bg-ttg-yellow/15 animate-ping" />
          <Image src="/logo/logo-tg-yellow.png" alt="" width={64} height={64} className="relative animate-pulse" priority  unoptimized/>
        </div>
        <div className="w-8 h-8 rounded-full border-[3px] border-white/10 border-t-ttg-yellow animate-spin" />
        <p className="text-xs font-bold text-white/20 uppercase tracking-[0.3em] animate-pulse">
          Loading Arena
        </p>
      </div>
    </div>
  ),
})

export default function PracticePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Set sessionStorage so BattleView auto-starts practice mode
    sessionStorage.setItem("battle_mode", "practice")
    sessionStorage.setItem("battle_deckId", "demo")
    sessionStorage.setItem("battle_difficulty", "skilled")
    // Mark as public practice (prevents DB writes)
    sessionStorage.setItem("battle_public_practice", "1")
    setMounted(true)

    return () => {
      // Clean up after leaving
      sessionStorage.removeItem("battle_mode")
      sessionStorage.removeItem("battle_deckId")
      sessionStorage.removeItem("battle_difficulty")
      sessionStorage.removeItem("battle_public_practice")
    }
  }, [])

  if (!mounted) return null

  return (
    <AuthProvider>
      {/* Full viewport — no magazine shell, no header, no footer */}
      <div className="fixed inset-0 bg-ttg-arena-bg overflow-hidden">
        <BattleView />
      </div>
    </AuthProvider>
  )
}
