// ============================================================
// Trading Tazos Game — GameShell
// Minimal fullscreen game shell: no masthead, no tabs,
// no footer. Just a back button + game canvas.
// Used by: /game/practice, /game/ranked, /game/friend/[roomId]
// ============================================================
"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Disc3 } from "lucide-react"

interface GameShellProps {
  children: React.ReactNode
  title?: string
  showBack?: boolean
  backHref?: string
}

export default function GameShell({
  children, title, showBack = true, backHref = "/app/battle",
}: GameShellProps) {
  const router = useRouter()

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden relative" style={{ background: "#1a1a1a" }}>
      {/* Magazine accent stripe — ties game canvas to TTG branding */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#FFCC00] z-[60]" />
      {/* Minimal top bar */}
      <div className="flex-shrink-0 bg-[#111] border-b border-[#FFCC00]/20 px-3 py-2 flex items-center gap-3 z-50">
        {showBack && (
          <button
            onClick={() => router.push(backHref)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#FFCC00] hover:text-white bg-white/5 hover:bg-white/10 border border-[#FFCC00]/30 hover:border-[#FFCC00]/60 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit to Dashboard</span>
            <span className="sm:hidden">Exit</span>
          </button>
        )}
        <Disc3 className="w-5 h-5 text-[#FFCC00]" />
        {title && (
          <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider truncate">
            {title}
          </span>
        )}
        <span className="ml-auto text-[8px] font-bold text-white/20 uppercase tracking-[0.15em]">
          v0.6.0
        </span>
      </div>

      {/* Game canvas area — fills remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {children}
      </div>
    </div>
  )
}
