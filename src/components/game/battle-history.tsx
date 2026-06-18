'use client'

import { useState, useEffect } from 'react'
import { Swords, Trophy, Coins, CircleAlert, Clock, ChevronRight } from 'lucide-react'

interface BattleRecord {
  id: string
  winner: 'player' | 'opponent' | 'draw'
  victoryType: string | null
  score: string | null
  turns: number
  rounds: number
  playerTazos: string[] | null
  opponentTazos: string[] | null
  opponentName: string | null
  createdAt: string
}

interface BattleStats {
  wins: number
  losses: number
  draws: number
  total: number
}

export default function BattleHistory() {
  const [battles, setBattles] = useState<BattleRecord[]>([])
  const [stats, setStats] = useState<BattleStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBattles() {
      setLoading(true)
      try {
        const res = await fetch('/api/battle/history')
        if (!res.ok) {
          if (res.status === 401) { setError(null); return }
          throw new Error(`HTTP ${res.status}`)
        }
        const data = await res.json()
        setBattles(data.battles || [])
        setStats(data.stats || null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    fetchBattles()
  }, [])

  if (loading) {
    return (
      <div className="mag-card animate-pulse mag-dots">
        <div className="px-4 py-3 flex items-center gap-2 border-b-3 border-ttg-black" style={{ background: 'linear-gradient(135deg, #E3350D 0%, #FF6B00 100%)' }}>
          <Swords className="w-5 h-5 text-white" />
          <h3 className="text-lg font-black uppercase tracking-wider text-white mag-stroke-sm">Battle History</h3>
        </div>
        <div className="p-6">
          <div className="h-12 bg-white/30 border-2 border-ttg-black/20" />
          <div className="h-12 bg-white/30 border-2 border-ttg-black/20 mt-2" />
          <div className="h-12 bg-white/30 border-2 border-ttg-black/20 mt-2" />
        </div>
      </div>
    )
  }

  // Not logged in — don't show
  if (!stats && !error) return null

  if (error) {
    return (
      <div className="mag-card p-6 text-center">
        <CircleAlert className="w-6 h-6 text-ttg-red mx-auto mb-2" />
        <p className="text-sm font-black text-ttg-red">Failed to load battle history</p>
      </div>
    )
  }

  const winRate = stats && stats.total > 0
    ? Math.round((stats.wins / stats.total) * 100)
    : 0

  return (
    <div className="mag-card overflow-hidden relative">
      {/* Exclusive badge */}
      <div className="exclusive-badge">My Stats</div>

      {/* Header banner */}
      <div
        className="px-4 py-3 flex items-center gap-2 border-b-3 border-ttg-black"
        style={{ background: 'linear-gradient(135deg, #E3350D 0%, #FF6B00 100%)' }}
      >
        <Swords className="w-5 h-5 text-white" />
        <h3 className="text-lg font-black uppercase tracking-wider text-white mag-stroke-sm">
          Battle History
        </h3>
        {stats && (
          <span className="ml-auto text-[0.6rem] font-black uppercase tracking-widest bg-ttg-black text-ttg-yellow px-2 py-0.5">
            {stats.total} Battles
          </span>
        )}
      </div>

      {/* Stats summary */}
      {stats && stats.total > 0 && (
        <div className="p-4 border-b-3 border-ttg-black" style={{ background: 'linear-gradient(135deg, #fffef0 0%, #f5f3e0 100%)' }}>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 border-2 border-ttg-black bg-white" style={{ boxShadow: '2px 2px 0px var(--ttg-black)' }}>
              <Trophy className="w-4 h-4 text-ttg-yellow fill-[#FFCC00] mx-auto mb-0.5" />
              <p className="text-xl font-black text-ttg-black leading-none">{stats.wins}</p>
              <p className="text-[0.55rem] font-black uppercase tracking-wider text-ttg-black/50">Wins</p>
            </div>
            <div className="text-center p-2 border-2 border-ttg-black bg-white" style={{ boxShadow: '2px 2px 0px var(--ttg-black)' }}>
              <Swords className="w-4 h-4 text-ttg-red mx-auto mb-0.5" />
              <p className="text-xl font-black text-ttg-black leading-none">{stats.losses}</p>
              <p className="text-[0.55rem] font-black uppercase tracking-wider text-ttg-black/50">Losses</p>
            </div>
            <div className="text-center p-2 border-2 border-ttg-black bg-white" style={{ boxShadow: '2px 2px 0px var(--ttg-black)' }}>
              <CircleAlert className="w-4 h-4 text-ttg-rarity-common mx-auto mb-0.5" />
              <p className="text-xl font-black text-ttg-black leading-none">{stats.draws}</p>
              <p className="text-[0.55rem] font-black uppercase tracking-wider text-ttg-black/50">Draws</p>
            </div>
            <div className="text-center p-2 border-2 border-ttg-black bg-white" style={{ boxShadow: '2px 2px 0px var(--ttg-black)' }}>
              <p className="text-xl font-black leading-none" style={{ color: winRate > 50 ? 'var(--ttg-success)' : winRate > 30 ? 'var(--ttg-yellow)' : 'var(--ttg-red)' }}>
                {winRate}%
              </p>
              <p className="text-[0.55rem] font-black uppercase tracking-wider text-ttg-black/50">Win Rate</p>
            </div>
          </div>
        </div>
      )}

      {/* Battle list */}
      <div className="divide-y-2 divide-[#1a1a1a]/10">
        {stats && stats.total === 0 && (
          <div className="p-8 text-center mag-dots">
            <Swords className="w-10 h-10 text-ttg-black/20 mx-auto mb-3" />
            <p className="text-sm font-black text-ttg-black/40 uppercase tracking-wider">
              No battles yet
            </p>
            <p className="text-xs text-ttg-black/30 mt-1">
              Enter the arena and your results will appear here
            </p>
          </div>
        )}

        {battles.map((battle) => {
          const isWin = battle.winner === 'player'
          const isDraw = battle.winner === 'draw'
          const date = new Date(battle.createdAt)
          const timeAgo = formatTimeAgo(date)

          return (
            <div
              key={battle.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-ttg-yellow/5 transition-colors"
            >
              {/* Result indicator */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 border-ttg-black"
                style={{
                  backgroundColor: isWin ? 'var(--ttg-success)' : isDraw ? 'var(--ttg-rarity-common)' : 'var(--ttg-red)',
                  boxShadow: '2px 2px 0px var(--ttg-black)',
                }}
              >
                {isWin ? (
                  <Trophy className="w-4 h-4 text-white fill-white" />
                ) : isDraw ? (
                  <CircleAlert className="w-4 h-4 text-white" />
                ) : (
                  <Swords className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Battle info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-ttg-black uppercase tracking-wide">
                    {isWin ? 'Victory' : isDraw ? 'Draw' : 'Defeat'}
                  </p>
                  {battle.victoryType && (
                    <span
                      className="text-[0.55rem] font-black uppercase tracking-widest px-1.5 py-0.5 border border-ttg-black/20"
                      style={{ backgroundColor: 'var(--ttg-yellow)', color: 'var(--ttg-black)' }}
                    >
                      {battle.victoryType.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {battle.opponentName && (
                    <span className="text-xs font-black text-ttg-black/40 uppercase tracking-wide">
                      vs {battle.opponentName}
                    </span>
                  )}
                  {battle.score && (
                    <span className="text-xs font-black text-ttg-black/50">
                      Score: {battle.score} · {battle.turns} turns
                    </span>
                  )}
                </div>
              </div>

              {/* Tazo count */}
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-ttg-black/50">
                  <Coins className="w-3 h-3" />
                  <span className="text-xs font-black">
                    {battle.playerTazos ? (battle.playerTazos as string[]).length : '?'}v
                    {battle.opponentTazos ? (battle.opponentTazos as string[]).length : '?'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-ttg-black/30">
                  <Clock className="w-3 h-3" />
                  <span className="text-[0.55rem] font-black">{timeAgo}</span>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-ttg-black/20" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
