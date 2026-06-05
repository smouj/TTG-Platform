'use client'

import { useState, useEffect } from 'react'
import { Tazo, Rarity, TazoCondition, RARITY_CONFIG, CONDITION_CONFIG } from '@/lib/game/types'
import { Trophy, Swords, Shield, Wind, Weight, Target, Star, TrendingUp, Package, CheckCircle, XCircle, Zap, Activity, Crosshair, Waves } from 'lucide-react'

interface StatsData {
  totalTazos: number
  ownedTazos: number
  totalFranchises: number
  totalCollections: number
  byRarity: Record<string, number>
  byCondition: Record<string, number>
  byFranchise: Record<string, number>
}

interface StatsPanelProps {
  refreshKey?: number
}

const FRANCHISE_COLORS: Record<string, string> = {
  Minimon: '#FFCB05',
  Cybermon: '#00A1E9',
  'Dracobell': '#FF6B00',
}

const FRANCHISE_DOT_COLORS: Record<string, string> = {
  Minimon: '#FFCB05',
  Cybermon: '#00A1E9',
  'Dracobell': '#FF6B00',
}

const RARITY_COLORS: Record<string, string> = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  ultra: '#A855F7',
  legendary: '#F59E0B',
}

const CONDITION_COLORS: Record<string, string> = {
  mint: '#10B981',
  good: '#22C55E',
  used: '#EAB308',
  worn: '#F97316',
  holo: '#06B6D4',
  metallic: '#94A3B8',
}

const STAT_ICONS = [
  { key: 'attack', label: 'Strongest Attack', icon: Swords, color: '#E3350D' },
  { key: 'defense', label: 'Best Defense', icon: Shield, color: '#3B4CCA' },
  { key: 'resistance', label: 'Best Resistance', icon: Activity, color: '#6366F1' },
  { key: 'weight', label: 'Heaviest', icon: Weight, color: '#FF6B00' },
  { key: 'stability', label: 'Best Stability', icon: Waves, color: '#14B8A6' },
  { key: 'spin', label: 'Top Spin', icon: Wind, color: '#78C850' },
  { key: 'control', label: 'Best Control', icon: Target, color: '#00A1E9' },
  { key: 'bounce', label: 'Best Bounce', icon: Zap, color: '#F97316' },
  { key: 'precision', label: 'Best Precision', icon: Crosshair, color: '#06B6D4' },
]

export default function StatsPanel({ refreshKey }: StatsPanelProps) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [topTazos, setTopTazos] = useState<Record<string, Tazo>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [statsRes, tazosRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/tazos?sortBy=attack&sortOrder=desc'),
        ])
        const statsData = await statsRes.json()
        const tazosData = await tazosRes.json()

        setStats(statsData)

        // Find top tazos for each stat
        const allTazos: Tazo[] = tazosData.tazos || []
        const tops: Record<string, Tazo> = {}
        for (const statConfig of STAT_ICONS) {
          const key = statConfig.key as keyof Pick<Tazo, 'attack' | 'defense' | 'resistance' | 'weight' | 'stability' | 'spin' | 'control' | 'bounce' | 'precision'>
          const sorted = [...allTazos].sort((a, b) => b[key] - a[key])
          if (sorted.length > 0) {
            tops[key] = sorted[0]
          }
        }
        setTopTazos(tops)
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [refreshKey])

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="mag-card h-28 mag-dots animate-pulse" />
        ))}
        <div className="col-span-2 sm:col-span-4 mag-card h-20 mag-stripes animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i + 4} className="mag-card h-48 mag-dots animate-pulse" />
        ))}
      </div>
    )
  }

  if (!stats) return null

  const missingTazos = stats.totalTazos - stats.ownedTazos
  const completionPct = stats.totalTazos > 0 ? Math.round((stats.ownedTazos / stats.totalTazos) * 100) : 0

  // Compute max values for bar scaling
  const maxFranchise = Math.max(...Object.values(stats.byFranchise), 1)
  const maxRarity = Math.max(...Object.values(stats.byRarity), 1)
  const maxCondition = Math.max(...Object.values(stats.byCondition), 1)

  return (
    <div className="space-y-4">
      {/* ====== TOP INFOGRAPHIC BOXES ====== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* TOTAL TAZOS - White bg, big black number */}
        <div className="mag-card mag-halftone relative p-4 flex flex-col items-center justify-center text-center">
          <div className="absolute -top-2 -left-2 bg-[var(--mag-black)] text-[var(--mag-yellow)] text-[0.55rem] font-black uppercase tracking-widest px-2 py-0.5 border-2 border-[var(--mag-black)]" style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.2)' }}>
            Total
          </div>
          <Package className="w-5 h-5 text-[var(--mag-black)] mb-1" />
          <p className="text-4xl font-black text-[var(--mag-black)] leading-none">{stats.totalTazos}</p>
          <p className="text-[0.65rem] font-black uppercase tracking-wider text-[var(--mag-black)]/50 mt-1">Tazos</p>
        </div>

        {/* OWNED - Green bg, white number */}
        <div className="relative border-3 border-[var(--mag-black)] flex flex-col items-center justify-center text-center p-4" style={{ boxShadow: '4px 4px 0px var(--mag-black)', background: '#22C55E' }}>
          <div className="absolute -top-2 -left-2 bg-[var(--mag-black)] text-white text-[0.55rem] font-black uppercase tracking-widest px-2 py-0.5 border-2 border-[var(--mag-black)]" style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.3)' }}>
            Owned
          </div>
          <CheckCircle className="w-5 h-5 text-white mb-1" />
          <p className="text-4xl font-black text-white leading-none">{stats.ownedTazos}</p>
          <p className="text-[0.65rem] font-black uppercase tracking-wider text-white/60 mt-1">Collected</p>
        </div>

        {/* MISSING - Red bg, white number */}
        <div className="relative border-3 border-[var(--mag-black)] flex flex-col items-center justify-center text-center p-4" style={{ boxShadow: '4px 4px 0px var(--mag-black)', background: 'var(--mag-red)' }}>
          <div className="absolute -top-2 -left-2 bg-[var(--mag-black)] text-white text-[0.55rem] font-black uppercase tracking-widest px-2 py-0.5 border-2 border-[var(--mag-black)]" style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.3)' }}>
            Missing
          </div>
          <XCircle className="w-5 h-5 text-white mb-1" />
          <p className="text-4xl font-black text-white leading-none">{missingTazos}</p>
          <p className="text-[0.65rem] font-black uppercase tracking-wider text-white/60 mt-1">Gotta Find</p>
        </div>

        {/* COMPLETE % - Yellow bg, black number with star */}
        <div className="mag-card-yellow relative p-4 flex flex-col items-center justify-center text-center">
          <div className="absolute -top-2 -left-2 bg-[var(--mag-black)] text-[var(--mag-yellow)] text-[0.55rem] font-black uppercase tracking-widest px-2 py-0.5 border-2 border-[var(--mag-black)]" style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.3)' }}>
            Complete
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 text-[var(--mag-black)] fill-[var(--mag-black)]" />
            <TrendingUp className="w-4 h-4 text-[var(--mag-black)]" />
          </div>
          <p className="text-4xl font-black text-[var(--mag-black)] leading-none">{completionPct}%</p>
          <p className="text-[0.65rem] font-black uppercase tracking-wider text-[var(--mag-black)]/50 mt-1">Progress</p>
        </div>
      </div>

      {/* ====== COLLECTION PROGRESS - Magazine Subscription Card ====== */}
      <div className="mag-card mag-stripes relative p-4 overflow-hidden">
        <div className="absolute top-0 right-0 bg-[var(--mag-red)] text-white text-[0.55rem] font-black uppercase tracking-widest px-3 py-1 border-b-3 border-l-3 border-[var(--mag-black)]">
          Collection Status
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-wider text-[var(--mag-black)]/60 mb-2">
              Collection Progress
            </p>
            {/* Thick progress bar with diagonal stripe fill */}
            <div className="h-6 border-3 border-[var(--mag-black)] bg-white relative overflow-hidden" style={{ boxShadow: '2px 2px 0px var(--mag-black)' }}>
              <div
                className="h-full stat-bar-fill relative"
                style={{
                  width: `${completionPct}%`,
                  background: `repeating-linear-gradient(
                    -45deg,
                    var(--mag-yellow),
                    var(--mag-yellow) 6px,
                    #FFB800 6px,
                    #FFB800 12px
                  )`,
                }}
              >
                {/* Inner highlight */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-black text-[var(--mag-black)] mag-stroke-sm" style={{ WebkitTextStroke: '1px var(--mag-black)', color: 'var(--mag-yellow)' }}>
              {completionPct}%
            </p>
            <p className="text-xs font-black text-[var(--mag-black)]/60">
              {stats.ownedTazos}/{stats.totalTazos}
            </p>
          </div>
        </div>
      </div>

      {/* ====== BREAKDOWN SECTIONS ====== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* BY FRANCHISE - Yellow banner */}
        <div className="mag-card overflow-hidden">
          {/* Colored banner header */}
          <div className="mag-card-yellow px-4 py-2 flex items-center gap-2 border-b-3 border-[var(--mag-black)]">
            <Zap className="w-4 h-4 text-[var(--mag-black)]" />
            <h3 className="text-sm font-black uppercase tracking-wider text-[var(--mag-black)] mag-stroke-sm">
              By Franchise
            </h3>
          </div>
          <div className="p-4 space-y-3 mag-dots">
            {Object.entries(stats.byFranchise).map(([name, count]) => {
              const color = FRANCHISE_COLORS[name] || '#9CA3AF'
              const pct = stats.totalTazos > 0 ? Math.round((count / stats.totalTazos) * 100) : 0
              const barWidth = maxFranchise > 0 ? Math.round((count / maxFranchise) * 100) : 0
              return (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full border-2 border-[var(--mag-black)] shrink-0"
                        style={{ backgroundColor: FRANCHISE_DOT_COLORS[name] || '#9CA3AF' }}
                      />
                      <span className="text-xs font-black uppercase tracking-wide text-[var(--mag-black)]">{name}</span>
                    </div>
                    <span className="text-xs font-black text-[var(--mag-black)]/60">{count} ({pct}%)</span>
                  </div>
                  {/* Thick horizontal bar */}
                  <div className="h-4 border-2 border-[var(--mag-black)] bg-white/50 overflow-hidden">
                    <div
                      className="h-full stat-bar-fill"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: color,
                        backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.08) 4px, rgba(0,0,0,0.08) 8px)`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* BY RARITY - Blue banner */}
        <div className="mag-card overflow-hidden">
          <div className="mag-card-blue px-4 py-2 flex items-center gap-2 border-b-3 border-[var(--mag-black)]">
            <Star className="w-4 h-4 text-white" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white mag-stroke-sm" style={{ WebkitTextStroke: '0.5px rgba(0,0,0,0.3)' }}>
              By Rarity
            </h3>
          </div>
          <div className="p-4 space-y-3 mag-dots">
            {Object.entries(stats.byRarity)
              .sort(([a], [b]) => {
                const order = ['common', 'uncommon', 'rare', 'ultra', 'legendary']
                return order.indexOf(a) - order.indexOf(b)
              })
              .map(([rarity, count]) => {
                const color = RARITY_COLORS[rarity] || '#9CA3AF'
                const config = RARITY_CONFIG[rarity as Rarity]
                const pct = stats.totalTazos > 0 ? Math.round((count / stats.totalTazos) * 100) : 0
                const barWidth = maxRarity > 0 ? Math.round((count / maxRarity) * 100) : 0
                return (
                  <div key={rarity}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase tracking-wide text-[var(--mag-black)]">
                        {config?.label || rarity}
                      </span>
                      <span className="text-xs font-black text-[var(--mag-black)]/60">{count} ({pct}%)</span>
                    </div>
                    <div className="h-4 border-2 border-[var(--mag-black)] bg-white/50 overflow-hidden">
                      <div
                        className="h-full stat-bar-fill"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: color,
                          backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.08) 4px, rgba(0,0,0,0.08) 8px)`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* BY CONDITION - Red banner */}
        <div className="mag-card overflow-hidden">
          <div className="mag-card-red px-4 py-2 flex items-center gap-2 border-b-3 border-[var(--mag-black)]">
            <Shield className="w-4 h-4 text-white" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white mag-stroke-sm" style={{ WebkitTextStroke: '0.5px rgba(0,0,0,0.3)' }}>
              By Condition
            </h3>
          </div>
          <div className="p-4 space-y-3 mag-dots">
            {Object.entries(stats.byCondition).map(([condition, count]) => {
              const color = CONDITION_COLORS[condition] || '#9CA3AF'
              const config = CONDITION_CONFIG[condition as TazoCondition]
              const pct = stats.totalTazos > 0 ? Math.round((count / stats.totalTazos) * 100) : 0
              const barWidth = maxCondition > 0 ? Math.round((count / maxCondition) * 100) : 0
              return (
                <div key={condition}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black uppercase tracking-wide text-[var(--mag-black)]">
                      {config?.icon} {config?.label || condition}
                    </span>
                    <span className="text-xs font-black text-[var(--mag-black)]/60">{count} ({pct}%)</span>
                  </div>
                  <div className="h-4 border-2 border-[var(--mag-black)] bg-white/50 overflow-hidden">
                    <div
                      className="h-full stat-bar-fill"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: color,
                        backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.08) 4px, rgba(0,0,0,0.08) 8px)`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ====== POWER RANKINGS - Magazine Leaderboard ====== */}
      <div className="mag-card overflow-hidden relative">
        {/* Exclusive badge */}
        <div className="exclusive-badge">Exclusive!</div>

        {/* Header banner */}
        <div className="px-4 py-3 flex items-center gap-2 border-b-3 border-[var(--mag-black)]" style={{ background: 'linear-gradient(135deg, var(--mag-yellow) 0%, var(--mag-orange) 100%)' }}>
          <Trophy className="w-5 h-5 text-[var(--mag-black)] fill-[var(--mag-black)]" />
          <h3 className="text-lg font-black uppercase tracking-wider text-[var(--mag-black)] mag-stroke-sm">
            Power Rankings
          </h3>
          <span className="ml-auto text-[0.6rem] font-black uppercase tracking-widest bg-[var(--mag-black)] text-[var(--mag-yellow)] px-2 py-0.5">
            Top Combatants
          </span>
        </div>

        <div className="p-4 mag-halftone">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {STAT_ICONS.map(({ key, label, icon: Icon, color }, index) => {
              const topTazo = topTazos[key]
              const statValue = topTazo ? topTazo[key as keyof Tazo] : 0
              const rank = index + 1
              const franchiseColor = topTazo?.franchise?.color || '#9CA3AF'
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 border-2 border-[var(--mag-black)] bg-white p-2 relative"
                  style={{ boxShadow: '3px 3px 0px var(--mag-black)' }}
                >
                  {/* Rank number */}
                  <div
                    className="w-9 h-9 flex items-center justify-center shrink-0 font-black text-lg border-2 border-[var(--mag-black)]"
                    style={{
                      backgroundColor: rank <= 3 ? 'var(--mag-yellow)' : '#f0f0f0',
                      color: 'var(--mag-black)',
                      boxShadow: rank <= 3 ? 'inset 0 -2px 0 rgba(0,0,0,0.15)' : 'none',
                    }}
                  >
                    {rank}
                  </div>

                  {/* Icon */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border-2 border-[var(--mag-black)]"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.6rem] font-black uppercase tracking-widest text-[var(--mag-black)]/50">{label}</p>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-[var(--mag-black)] shrink-0"
                        style={{ backgroundColor: franchiseColor }}
                      />
                      <p className="text-sm font-black text-[var(--mag-black)] truncate">
                        {topTazo?.name || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Stat value */}
                  <div
                    className="text-xl font-black shrink-0 px-2 py-0.5 border-2 border-[var(--mag-black)]"
                    style={{
                      backgroundColor: color,
                      color: 'white',
                      textShadow: '1px 1px 0 rgba(0,0,0,0.3)',
                    }}
                  >
                    {statValue as number || 0}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
