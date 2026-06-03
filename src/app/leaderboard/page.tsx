// ============================================================
// Trading Tazos Game — Leaderboard Page
// ============================================================
"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import { Trophy, Coins, Package, Swords, ArrowLeft, ArrowUp, Loader2, Medal, Crown, Star } from "lucide-react"
import MagazinePageShell from "@/components/magazine-page-shell"

interface LeaderboardEntry {
  rank: number
  id: string
  name: string
  displayName: string | null
  avatarUrl: string | null
  credits: number
  score: number
  rankField: string
  tazoCount?: number
  _count?: { userTazos: number }
}

const SORTS = [
  { key: "credits", label: "CREDITS", icon: Coins },
  { key: "tazos", label: "TAZOS", icon: Package },
  { key: "battles", label: "BATTLES", icon: Swords },
]

const RANK_ICONS: Record<number, React.FC<{ className?: string }>> = { 1: Crown, 2: Medal, 3: Star }
const RANK_COLORS: Record<number, string> = { 1: "#F59E0B", 2: "#9CA3AF", 3: "#D97706" }
function rankClass(rank: number) { return { 1: "text-[#F59E0B]", 2: "text-[#9CA3AF]", 3: "text-[#D97706]" }[rank] || "text-zinc-400" }

export default function LeaderboardPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState("credits")

  const load = useCallback(async (sortKey: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leaderboard?sort=${sortKey}&limit=50`)
      const data = await res.json()
      setEntries(data.leaderboard || [])
    } catch { /* ignore */ }
    setLoading(false)
     
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(sort) }, [sort, load])

  const displayName = (e: LeaderboardEntry) => e.displayName || e.name || "???"

  return (
    <MagazinePageShell currentTab="leaderboard">
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-black uppercase tracking-wider text-[#1a1a1a] flex items-center justify-center gap-2">
          <Trophy className="w-6 h-6 text-[#F59E0B]" /> LEADERBOARD
        </h1>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2">
        {SORTS.map(s => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-wider border-2 transition-all ${
              sort === s.key
                ? "bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#FFCC00]"
                : "bg-white text-[#1a1a1a] border-zinc-300 shadow-[2px_2px_0px_#1a1a1a] hover:border-[#FFCC00]"
            }`}
          >
            <s.icon className="w-3.5 h-3.5" /> {s.label}
          </button>
        ))}
      </div>

      {/* Top 3 podium */}
      {!loading && entries.length >= 3 && (
        <div className="flex items-end justify-center gap-3 pt-6 pb-2">
          {/* 2nd place */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-zinc-200 border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] rounded-full flex items-center justify-center mb-2">
              <span className="font-black text-xl text-zinc-500">2</span>
            </div>
            <p className="font-black text-[9px] uppercase text-[#1a1a1a] mb-0.5">{displayName(entries[1]).slice(0, 10)}</p>
            <p className="text-[9px] font-bold text-zinc-500">{entries[1].score} {sort}</p>
          </div>
          {/* 1st place */}
          <div className="text-center -mt-6">
            <div className="w-20 h-20 mx-auto bg-[#FFCC00] border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] rounded-full flex items-center justify-center mb-2 relative">
              <Crown className="absolute -top-5 w-6 h-6 text-[#F59E0B]" />
              <span className="font-black text-2xl text-[#1a1a1a]">1</span>
            </div>
            <p className="font-black text-xs uppercase text-[#1a1a1a] mb-0.5">{displayName(entries[0]).slice(0, 12)}</p>
            <p className="text-xs font-black text-[#F59E0B]">{entries[0].score} {sort}</p>
          </div>
          {/* 3rd place */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-orange-100 border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] rounded-full flex items-center justify-center mb-2">
              <span className="font-black text-xl text-orange-700">3</span>
            </div>
            <p className="font-black text-[9px] uppercase text-[#1a1a1a] mb-0.5">{displayName(entries[2]).slice(0, 10)}</p>
            <p className="text-[9px] font-bold text-zinc-500">{entries[2].score} {sort}</p>
          </div>
        </div>
      )}

      {/* Leaderboard table */}
      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FFCC00]" />
        </div>
      ) : (
        <div className="mag-card bg-white overflow-hidden">
          {entries.map((entry, i) => {
            const RankIcon = RANK_ICONS[entry.rank]
            const rankColor = RANK_COLORS[entry.rank]
            const isCurrentUser = user && entry.id === user.id

            return (
              <div
                key={entry.id}
                className={`flex items-center gap-3 px-4 py-3 border-b border-zinc-200 last:border-0 transition-colors ${
                  isCurrentUser ? "bg-[#FFCC00]/10" : i % 2 === 0 ? "bg-white" : "bg-zinc-50/50"
                }`}
              >
                {/* Rank */}
                <div className="w-8 text-center shrink-0">
                  {RankIcon ? (
                    <RankIcon className={`w-5 h-5 mx-auto ${rankClass(entry.rank)}`} />
                  ) : (
                    <span className="text-xs font-black text-zinc-400">#{entry.rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 shrink-0 rounded-full bg-zinc-200 border-2 border-[#1a1a1a] overflow-hidden flex items-center justify-center">
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-black text-zinc-400">
                      {displayName(entry).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-black uppercase tracking-wider truncate ${isCurrentUser ? "text-[#E3350D]" : "text-[#1a1a1a]"}`}>
                    {displayName(entry)}
                    {isCurrentUser && <span className="ml-1 text-[8px] text-[#E3350D]">(YOU)</span>}
                  </p>
                  {entry.tazoCount !== undefined && (
                    <p className="text-[9px] font-bold text-zinc-400">{entry.tazoCount || entry._count?.userTazos || 0} tazos</p>
                  )}
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-[#1a1a1a] tabular-nums">
                    {entry.score.toLocaleString()}
                  </p>
                  <p className="text-[8px] font-bold uppercase text-zinc-400">{sort}</p>
                </div>

                {/* Rank change (static for now) */}
                {entry.rank <= 10 && (
                  <div className="w-4 text-center shrink-0">
                    <ArrowUp className="w-3 h-3 text-[#22C55E]" />
                  </div>
                )}
              </div>
            )
          })}

          {entries.length === 0 && (
            <div className="text-center py-16">
              <Trophy className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
              <p className="text-sm font-bold text-zinc-400">No players yet</p>
              <p className="text-xs text-zinc-400 mt-1">Be the first to climb the ranks!</p>
            </div>
          )}
        </div>
      )}
    </div>
    </MagazinePageShell>
  )
}
