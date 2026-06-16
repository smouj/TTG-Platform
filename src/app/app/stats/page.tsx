"use client"

// ============================================================
// Trading Tazos Game — Stats Page v2
// Compact magazine layout: User Card → Stats Grid → Leaderboard
// Halftone dots on panels, stripe bars, sharp corners, no gaps
// ============================================================

import { Suspense, useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import StatsPanel from "@/components/game/stats-panel"
import BattleHistory from "@/components/game/battle-history"
import UserIdCard from "@/components/game/user-id-card"
import { BarChart3, Trophy, Swords, Medal } from "lucide-react"
import { StatsPanelSkeleton, BattleHistorySkeleton } from "@/components/ui/loading-skeletons"
import { TOTAL_PLANNED } from "@/lib/franchise-config"

interface LeaderboardUser {
  id: string
  name: string
  displayName: string | null
  avatarUrl: string | null
  level: number
  xp: number
  totalBattles: number
  totalWins: number
  totalTazosOwned: number
}

// ── Magazine pattern CSS inject ──
const HALFTONE_BG = {
  backgroundImage: "radial-gradient(circle, #1a1a1a 0.5px, transparent 0.5px)",
  backgroundSize: "6px 6px",
  backgroundColor: "#FFFEF5",
}
const STRIPES_BG = {
  backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(26,26,26,0.03) 4px, rgba(26,26,26,0.03) 8px)`,
}
const BANNER_BG = {
  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.025) 6px, rgba(255,255,255,0.025) 12px), linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 100%)`,
  border: "3px solid #1a1a1a",
  boxShadow: "4px 4px 0px #FFCC00",
}
const PANEL_SHADOW = { boxShadow: "4px 4px 0px #1a1a1a" }
const SECTION_TITLE_BG = {
  backgroundImage: "repeating-linear-gradient(-45deg, #FFCC00, #FFCC00 3px, #FFD700 3px, #FFD700 6px)",
  borderBottom: "3px solid #1a1a1a",
}

function StatsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto w-full py-4 sm:py-6 space-y-3 px-4">
      <div className="h-14 bg-[#1a1a1a]/[0.04] animate-pulse" />
      <StatsPanelSkeleton />
      <BattleHistorySkeleton rows={4} />
    </div>
  )
}

function StatsContent() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [userData, setUserData] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [settingsRes, statsRes] = await Promise.all([
        fetch("/api/user/settings").then(r => r.ok ? r.json() : null),
        fetch("/api/stats").then(r => r.ok ? r.json() : null),
      ])
      if (settingsRes?.user) setUserData(settingsRes.user)
      if (statsRes?.leaderboard) setLeaderboard(statsRes.leaderboard)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="max-w-7xl mx-auto w-full py-3 sm:py-5 space-y-3 px-4">
      {/* ═══ MAGAZINE BANNER ═══ */}
      <div className="px-4 py-2.5 flex flex-wrap items-center gap-3 relative overflow-hidden" style={BANNER_BG}>
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-5 h-5 text-[#FFCC00]" />
          <h1 className="text-sm sm:text-lg font-black text-white uppercase tracking-tight">STATS &amp; RANKINGS</h1>
        </div>
        <div className="w-px h-5 bg-white/15" />
        <span className="text-[10px] font-black text-[#3B4CCA] tracking-tight uppercase">{TOTAL_PLANNED} SEASON 1 TAZOS</span>
      </div>

      {/* ═══ USER ID CARD ═══ — only when authenticated */}
      {userData && (
        <UserIdCard user={userData} variant="full" />
      )}

      {/* ═══ GLOBAL STATS (full width, zero gaps) ═══ */}
      <StatsPanel />

      {/* ═══ LEADERBOARD + BATTLE HISTORY — side by side ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* ── Leaderboard Panel ── */}
        <div className="border-3 border-[#1a1a1a] bg-white overflow-hidden" style={{ ...PANEL_SHADOW, ...HALFTONE_BG }}>
          {/* Title bar — diagonal stripes */}
          <div className="px-4 py-2.5" style={SECTION_TITLE_BG}>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#1a1a1a]" />
              <h2 className="text-sm font-black text-[#1a1a1a] uppercase tracking-tight">Top Players</h2>
              <span className="ml-auto text-[9px] font-black text-[#1a1a1a]/50 uppercase">By Level</span>
            </div>
          </div>
          <div className="divide-y divide-[#1a1a1a]/10">
            {leaderboard.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-xs font-bold text-[#1a1a1a]/25">No players ranked yet</p>
                <p className="text-[10px] font-semibold text-[#1a1a1a]/15 mt-1">Complete battles to earn XP</p>
              </div>
            )}
            {leaderboard.map((entry, i) => (
              <div key={entry.id}
                className={`flex items-center gap-3 px-4 py-2.5 ${user?.id === entry.id ? "bg-[#FFCC00]/8" : ""}`}>
                {/* Rank badge — sharp square */}
                <div className="w-7 h-7 flex items-center justify-center shrink-0 border-2 border-[#1a1a1a]"
                  style={{
                    background: i === 0 ? "#FFCC00" : i === 1 ? "#E8E8E8" : i === 2 ? "#E8C896" : "#FFFEF5",
                  }}>
                  {i < 3 ? (
                    <Medal className="w-3.5 h-3.5 text-[#1a1a1a]" />
                  ) : (
                    <span className="text-[10px] font-black text-[#1a1a1a]/40">{i + 1}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-[#1a1a1a] truncate leading-tight">
                    {entry.displayName || entry.name}
                    {user?.id === entry.id && (
                      <span className="text-[9px] text-[#E3350D] ml-1 font-bold">YOU</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold text-[#1a1a1a] bg-[#FFCC00]/15 px-1.5 py-0.5 border border-[#FFCC00]/30 uppercase">
                      Lv.{entry.level}
                    </span>
                    <span className="text-[9px] font-semibold text-[#1a1a1a]/25">{entry.totalTazosOwned} tazos</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-[#1a1a1a] leading-tight">{entry.totalWins}W</div>
                  <div className="text-[8px] font-bold text-[#1a1a1a]/25 uppercase">{entry.totalBattles} btl</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Battle History ── */}
        <BattleHistory />
      </div>
    </div>
  )
}

export default function StatsPage() {
  return (
    <Suspense fallback={<StatsSkeleton />}>
      <StatsContent />
    </Suspense>
  )
}
