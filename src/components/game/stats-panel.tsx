'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tazo, Rarity, TazoCondition, RARITY_CONFIG, CONDITION_CONFIG } from '@/lib/game/types'
import { Trophy, Swords, Shield, Wind, Weight, Sparkles, Target, TrendingUp, Package, CheckCircle, XCircle } from 'lucide-react'

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
  Pokémon: '#FFCB05',
  Digimon: '#00A1E9',
  'Dragon Ball Z': '#FF6B00',
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
  { key: 'attack', label: 'Strongest Attack', icon: Swords, color: '#EF4444' },
  { key: 'defense', label: 'Best Defense', icon: Shield, color: '#3B82F6' },
  { key: 'spin', label: 'Top Spin', icon: Wind, color: '#10B981' },
  { key: 'weight', label: 'Heaviest', icon: Weight, color: '#F59E0B' },
  { key: 'aura', label: 'Highest Aura', icon: Sparkles, color: '#8B5CF6' },
  { key: 'control', label: 'Best Control', icon: Target, color: '#EC4899' },
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
          const key = statConfig.key as keyof Pick<Tazo, 'attack' | 'defense' | 'spin' | 'weight' | 'aura' | 'control'>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 bg-white/5 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!stats) return null

  const missingTazos = stats.totalTazos - stats.ownedTazos
  const completionPct = stats.totalTazos > 0 ? Math.round((stats.ownedTazos / stats.totalTazos) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Main Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-[#1e1e36] border-white/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
              <Package className="w-5 h-5 text-white/50" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{stats.totalTazos}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Total Tazos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e1e36] border-white/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-green-400">{stats.ownedTazos}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Owned</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e1e36] border-white/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-red-400">{missingTazos}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Missing</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e1e36] border-white/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-yellow-400">{completionPct}%</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Complete</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Progress */}
      <Card className="bg-[#1e1e36] border-white/10">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-bold text-white/70 uppercase tracking-wider">
            Collection Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex items-center gap-3">
            <Progress value={completionPct} className="flex-1 h-3 bg-white/10" />
            <span className="text-sm font-mono font-bold text-white/60">{stats.ownedTazos}/{stats.totalTazos}</span>
          </div>
        </CardContent>
      </Card>

      {/* Breakdowns Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* By Franchise */}
        <Card className="bg-[#1e1e36] border-white/10">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold text-white/70 uppercase tracking-wider">
              By Franchise
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {Object.entries(stats.byFranchise).map(([name, count]) => {
              const color = FRANCHISE_COLORS[name] || '#9CA3AF'
              const pct = stats.totalTazos > 0 ? Math.round((count / stats.totalTazos) * 100) : 0
              return (
                <div key={name}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium" style={{ color }}>{name}</span>
                    <span className="text-xs text-white/40">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full stat-bar-fill"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* By Rarity */}
        <Card className="bg-[#1e1e36] border-white/10">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold text-white/70 uppercase tracking-wider">
              By Rarity
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {Object.entries(stats.byRarity)
              .sort(([a], [b]) => {
                const order = ['common', 'uncommon', 'rare', 'ultra', 'legendary']
                return order.indexOf(a) - order.indexOf(b)
              })
              .map(([rarity, count]) => {
                const color = RARITY_COLORS[rarity] || '#9CA3AF'
                const pct = stats.totalTazos > 0 ? Math.round((count / stats.totalTazos) * 100) : 0
                const config = RARITY_CONFIG[rarity as Rarity]
                return (
                  <div key={rarity}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium" style={{ color }}>
                        {config?.label || rarity}
                      </span>
                      <span className="text-xs text-white/40">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full stat-bar-fill"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                )
              })}
          </CardContent>
        </Card>

        {/* By Condition */}
        <Card className="bg-[#1e1e36] border-white/10">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold text-white/70 uppercase tracking-wider">
              By Condition
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {Object.entries(stats.byCondition).map(([condition, count]) => {
              const color = CONDITION_COLORS[condition] || '#9CA3AF'
              const pct = stats.totalTazos > 0 ? Math.round((count / stats.totalTazos) * 100) : 0
              const config = CONDITION_CONFIG[condition as TazoCondition]
              return (
                <div key={condition}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium" style={{ color }}>
                      {config?.icon} {config?.label || condition}
                    </span>
                    <span className="text-xs text-white/40">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full stat-bar-fill"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Top Tazos by Stat */}
      <Card className="bg-[#1e1e36] border-white/10">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-bold text-white/70 uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            Top Tazos by Stat
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {STAT_ICONS.map(({ key, label, icon: Icon, color }) => {
              const topTazo = topTazos[key]
              const statValue = topTazo ? topTazo[key as keyof Tazo] : 0
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 bg-white/5 rounded-lg p-3"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">{label}</p>
                    <p className="text-sm font-bold text-white truncate">
                      {topTazo?.name || '—'}
                    </p>
                  </div>
                  <span
                    className="text-lg font-black shrink-0"
                    style={{ color }}
                  >
                    {statValue as number || 0}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
