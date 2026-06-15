"use client"

// ============================================================
// Trading Tazos Game — Game Bridge /game
// Single entry point → redirects to /app/battle (auth required)
// or shows sign-in prompt for guests.
// GDD §4.1: all battles render within /app/battle shell.
// ============================================================

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { sfxEnsureUnlocked } from "@/lib/audio/sfx-engine"
import { Swords, Loader2, Gamepad2 } from "lucide-react"

export default function GameBridgePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    sfxEnsureUnlocked()
  }, [])

  // Logged-in users: redirect to /app/battle (the real battle lobby)
  useEffect(() => {
    if (!loading && user) {
      router.replace("/app/battle")
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FFF9E6" }}>
        <div className="mag-halftone absolute inset-0 opacity-40 pointer-events-none" />
        <Loader2 className="w-8 h-8 text-[#FFCC00] animate-spin" />
      </div>
    )
  }

  // Logged in — redirecting (show brief spinner while router.replace runs)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FFF9E6" }}>
        <div className="mag-halftone absolute inset-0 opacity-40 pointer-events-none" />
        <Loader2 className="w-8 h-8 text-[#FFCC00] animate-spin" />
      </div>
    )
  }

  // Guest — show sign-in prompt
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#FFF9E6" }}>
      <div className="mag-halftone absolute inset-0 opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 border-[5px] border-[#1a1a1a] bg-[#FFCC00]"
          style={{ boxShadow: "6px 6px 0 #1a1a1a" }}>
          <Swords className="w-10 h-10 text-[#1a1a1a]" />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black text-[#1a1a1a] uppercase tracking-[0.04em]">
            Battle Arena
          </h1>
          <p className="text-sm font-bold text-[#1a1a1a]/40 max-w-xs mx-auto leading-relaxed">
            Practice against AI, compete in ranked PvP, or challenge friends with room codes.
          </p>
        </div>

        {/* Sign in prompt */}
        <div className="border-2 border-[#FFCC00]/30 bg-[#FFCC00]/5 px-6 py-5 space-y-3">
          <Gamepad2 className="w-8 h-8 text-[#FFCC00] mx-auto" />
          <p className="text-xs font-bold text-[#1a1a1a]/50">
            Sign in to access all game modes, build your collection, and save your progress.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href="/login?redirect=%2Fapp%2Fbattle"
              className="px-6 py-2.5 text-xs font-black text-[#1a1a1a] bg-[#FFCC00] uppercase tracking-wider border-2 border-[#1a1a1a] hover:bg-[#FFE566] transition-colors no-underline"
              style={{ boxShadow: "3px 3px 0 #1a1a1a" }}
            >
              Sign In to Play
            </Link>
            <Link
              href="/register"
              className="px-6 py-2.5 text-xs font-black text-[#1a1a1a] bg-white uppercase tracking-wider border-2 border-[#1a1a1a] hover:bg-[#FFF9E6] transition-colors no-underline"
              style={{ boxShadow: "3px 3px 0 #1a1a1a" }}
            >
              Create Free Account
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-black text-[#1a1a1a]/25 uppercase">
          <span>150 Tazos</span>
          <span className="text-[#1a1a1a]/10">·</span>
          <span>3 Series</span>
          <span className="text-[#1a1a1a]/10">·</span>
          <span>9 Stats</span>
          <span className="text-[#1a1a1a]/10">·</span>
          <span>Free Forever</span>
        </div>

        {/* Back to home */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#1a1a1a]/20 uppercase hover:text-[#FFCC00] transition-colors tracking-[0.15em]"
        >
          ← Back to Trading Tazos Game
        </Link>
      </div>
    </div>
  )
}
