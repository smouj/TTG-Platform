'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tazo, Franchise, Rarity, TazoCondition } from '@/lib/game/types'
import TazoCard from './tazo-card'
import TazoDetailModal from './tazo-detail-modal'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter, Grid3X3, LayoutGrid, BookOpen, PackageX } from 'lucide-react'

interface AlbumViewProps {
  onStatsUpdate?: () => void
}

const FRANCHISE_CHIP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pokemon: { bg: 'rgba(255, 203, 5, 0.15)', text: '#FFCB05', border: 'rgba(255, 203, 5, 0.3)' },
  digimon: { bg: 'rgba(0, 161, 233, 0.15)', text: '#00A1E9', border: 'rgba(0, 161, 233, 0.3)' },
  dbz: { bg: 'rgba(255, 107, 0, 0.15)', text: '#FF6B00', border: 'rgba(255, 107, 0, 0.3)' },
}

const RARITY_CHIP_COLORS: Record<string, { bg: string; text: string }> = {
  common: { bg: 'rgba(156, 163, 175, 0.15)', text: '#9CA3AF' },
  uncommon: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22C55E' },
  rare: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6' },
  ultra: { bg: 'rgba(168, 85, 247, 0.15)', text: '#A855F7' },
  legendary: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B' },
}

type GridSize = 'compact' | 'normal'

export default function AlbumView({ onStatsUpdate }: AlbumViewProps) {
  const [tazos, setTazos] = useState<Tazo[]>([])
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedFranchise, setSelectedFranchise] = useState<string>('all')
  const [selectedRarity, setSelectedRarity] = useState<string>('all')
  const [selectedCondition, setSelectedCondition] = useState<string>('all')
  const [selectedOwned, setSelectedOwned] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  const [sortOrder, setSortOrder] = useState<string>('asc')
  const [gridSize, setGridSize] = useState<GridSize>('normal')
  const [selectedTazo, setSelectedTazo] = useState<Tazo | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Fetch franchises on mount
  useEffect(() => {
    fetch('/api/franchises')
      .then(res => res.json())
      .then(data => {
        setFranchises(data.franchises || [])
      })
      .catch(console.error)
  }, [])

  // Fetch tazos with filters
  const fetchTazos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (selectedFranchise !== 'all') params.set('franchise', selectedFranchise)
      if (selectedRarity !== 'all') params.set('rarity', selectedRarity)
      if (selectedCondition !== 'all') params.set('condition', selectedCondition)
      if (selectedOwned !== 'all') params.set('owned', selectedOwned === 'owned' ? 'true' : 'false')
      if (sortBy) params.set('sortBy', sortBy)
      if (sortOrder) params.set('sortOrder', sortOrder)

      const res = await fetch(`/api/tazos?${params.toString()}`)
      const data = await res.json()
      setTazos(data.tazos || [])
    } catch (err) {
      console.error('Failed to fetch tazos:', err)
      setTazos([])
    } finally {
      setLoading(false)
    }
  }, [search, selectedFranchise, selectedRarity, selectedCondition, selectedOwned, sortBy, sortOrder])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTazos()
    }, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [fetchTazos, search])

  // Toggle owned
  const handleToggleOwned = async (tazo: Tazo) => {
    try {
      const res = await fetch(`/api/tazos/${tazo.id}/toggle-owned`, { method: 'PUT' })
      const data = await res.json()
      if (data.tazo) {
        // Update in local list
        setTazos(prev => prev.map(t => t.id === tazo.id ? { ...t, isOwned: !t.isOwned } : t))
        // Update the selected tazo in the modal
        setSelectedTazo(prev => prev?.id === tazo.id ? { ...prev, isOwned: !prev.isOwned } : prev)
        onStatsUpdate?.()
      }
    } catch (err) {
      console.error('Failed to toggle owned:', err)
    }
  }

  const ownedCount = tazos.filter(t => t.isOwned).length
  const totalCount = tazos.length
  const completionPct = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Stats Summary Bar */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-white/50" />
          <span className="text-sm text-white/70">
            <span className="font-bold text-white">{totalCount}</span> tazos
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-white/70">
            <span className="font-bold text-green-400">{ownedCount}</span> owned
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-white/70">
            <span className="font-bold text-yellow-400">{completionPct}%</span> complete
          </span>
        </div>
        {/* Completion mini bar */}
        <div className="flex-1 min-w-[60px] max-w-[120px] h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 stat-bar-fill"
            style={{ width: `${completionPct}%` }}
          />
        </div>

        {/* Grid size toggle */}
        <div className="ml-auto flex gap-0.5 bg-white/5 rounded-lg p-0.5">
          <button
            className={`p-1.5 rounded ${gridSize === 'normal' ? 'bg-white/10 text-white' : 'text-white/40'}`}
            onClick={() => setGridSize('normal')}
            aria-label="Normal grid"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            className={`p-1.5 rounded ${gridSize === 'compact' ? 'bg-white/10 text-white' : 'text-white/40'}`}
            onClick={() => setGridSize('compact')}
            aria-label="Compact grid"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="space-y-2.5">
        {/* Search Row */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            placeholder="Search tazos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/20 h-9"
          />
        </div>

        {/* Filter Chips Row */}
        <div className="flex flex-wrap gap-1.5">
          {/* Franchise Chips */}
          <button
            onClick={() => setSelectedFranchise('all')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
              selectedFranchise === 'all'
                ? 'bg-white/15 text-white border border-white/20'
                : 'bg-white/5 text-white/40 border border-transparent hover:bg-white/10'
            }`}
          >
            All
          </button>
          {franchises.map((f) => {
            const colors = FRANCHISE_CHIP_COLORS[f.slug] || FRANCHISE_CHIP_COLORS.pokemon
            const isActive = selectedFranchise === f.slug
            return (
              <button
                key={f.id}
                onClick={() => setSelectedFranchise(isActive ? 'all' : f.slug)}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                style={{
                  backgroundColor: isActive ? colors.bg : 'rgba(255,255,255,0.03)',
                  color: isActive ? colors.text : 'rgba(255,255,255,0.4)',
                  border: isActive ? `1px solid ${colors.border}` : '1px solid transparent',
                }}
              >
                {f.name}
              </button>
            )
          })}
        </div>

        {/* More Filters Row */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-3.5 h-3.5 text-white/30" />

          <Select value={selectedRarity} onValueChange={setSelectedRarity}>
            <SelectTrigger className="w-[120px] h-8 text-[11px] bg-white/5 border-white/10 text-white/70">
              <SelectValue placeholder="Rarity" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e1e36] border-white/10">
              <SelectItem value="all" className="text-white/70 text-[11px]">All Rarities</SelectItem>
              <SelectItem value="common" className="text-[11px]">
                <span className="text-gray-400">★ Common</span>
              </SelectItem>
              <SelectItem value="uncommon" className="text-[11px]">
                <span className="text-green-400">★★ Uncommon</span>
              </SelectItem>
              <SelectItem value="rare" className="text-[11px]">
                <span className="text-blue-400">★★★ Rare</span>
              </SelectItem>
              <SelectItem value="ultra" className="text-[11px]">
                <span className="text-purple-400">★★★★ Ultra</span>
              </SelectItem>
              <SelectItem value="legendary" className="text-[11px]">
                <span className="text-amber-400">★★★★★ Legendary</span>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCondition} onValueChange={setSelectedCondition}>
            <SelectTrigger className="w-[120px] h-8 text-[11px] bg-white/5 border-white/10 text-white/70">
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e1e36] border-white/10">
              <SelectItem value="all" className="text-white/70 text-[11px]">All Conditions</SelectItem>
              <SelectItem value="mint" className="text-[11px]"><span className="text-emerald-400">✨ Mint</span></SelectItem>
              <SelectItem value="good" className="text-[11px]"><span className="text-green-400">👍 Good</span></SelectItem>
              <SelectItem value="used" className="text-[11px]"><span className="text-yellow-400">🔄 Used</span></SelectItem>
              <SelectItem value="worn" className="text-[11px]"><span className="text-orange-400">⚔️ Worn</span></SelectItem>
              <SelectItem value="holo" className="text-[11px]"><span className="text-cyan-400">🌈 Holo</span></SelectItem>
              <SelectItem value="metallic" className="text-[11px]"><span className="text-slate-400">🛡️ Metallic</span></SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedOwned} onValueChange={setSelectedOwned}>
            <SelectTrigger className="w-[110px] h-8 text-[11px] bg-white/5 border-white/10 text-white/70">
              <SelectValue placeholder="Owned" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e1e36] border-white/10">
              <SelectItem value="all" className="text-white/70 text-[11px]">All Status</SelectItem>
              <SelectItem value="owned" className="text-[11px]"><span className="text-green-400">✓ Owned</span></SelectItem>
              <SelectItem value="missing" className="text-[11px]"><span className="text-red-400">✗ Missing</span></SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex gap-1 items-center">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[100px] h-8 text-[11px] bg-white/5 border-white/10 text-white/70">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1e36] border-white/10">
                <SelectItem value="name" className="text-white/70 text-[11px]">Name</SelectItem>
                <SelectItem value="rarity" className="text-[11px]">Rarity</SelectItem>
                <SelectItem value="attack" className="text-[11px]">Attack</SelectItem>
                <SelectItem value="defense" className="text-[11px]">Defense</SelectItem>
                <SelectItem value="spin" className="text-[11px]">Spin</SelectItem>
                <SelectItem value="printedNumber" className="text-[11px]">Number</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white/40 hover:text-white hover:bg-white/5"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tazos Grid */}
      {loading ? (
        <div className={`grid gap-3 ${
          gridSize === 'compact'
            ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7'
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
        }`}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-[#1e1e36] border border-white/5 p-3 flex flex-col items-center gap-2">
              <Skeleton className="w-[100px] h-[100px] rounded-full bg-white/5" />
              <Skeleton className="h-3 w-20 bg-white/5" />
              <Skeleton className="h-2 w-14 bg-white/5" />
              <Skeleton className="h-2 w-16 bg-white/5" />
            </div>
          ))}
        </div>
      ) : tazos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PackageX className="w-16 h-16 text-white/15 mb-4" />
          <h3 className="text-lg font-bold text-white/40 mb-1">No tazos found</h3>
          <p className="text-sm text-white/25 max-w-[280px]">
            Try adjusting your filters or search terms to find what you&apos;re looking for.
          </p>
        </div>
      ) : (
        <div className={`grid gap-3 ${
          gridSize === 'compact'
            ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7'
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
        }`}>
          {tazos.map((tazo) => (
            <TazoCard
              key={tazo.id}
              tazo={tazo}
              onClick={(t) => {
                setSelectedTazo(t)
                setDetailOpen(true)
              }}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <TazoDetailModal
        tazo={selectedTazo}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false)
          setSelectedTazo(null)
        }}
        onToggleOwned={handleToggleOwned}
      />
    </div>
  )
}
