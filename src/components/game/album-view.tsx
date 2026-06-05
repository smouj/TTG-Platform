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
import { Search, Filter, CheckCircle, RefreshCw, Palette, Grid3X3, LayoutGrid, BookOpen, Star, ArrowUpDown, Package, Cuboid, FlipHorizontal } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import OnboardingBanner from './onboarding-banner'

interface AlbumViewProps {
  onStatsUpdate?: () => void
}

// Magazine-style franchise chip colors - vibrant, bold, 90s magazine feel
const FRANCHISE_MAG_COLORS: Record<string, { activeBg: string; activeText: string; inactiveBg: string; inactiveText: string }> = {
  minimon: { activeBg: '#FFCC00', activeText: '#1a1a1a', inactiveBg: '#ffffff', inactiveText: '#1a1a1a' },
  cybermon: { activeBg: '#00A1E9', activeText: '#ffffff', inactiveBg: '#ffffff', inactiveText: '#1a1a1a' },
  dracobell: { activeBg: '#FF6B00', activeText: '#1a1a1a', inactiveBg: '#ffffff', inactiveText: '#1a1a1a' },
}

type GridSize = 'compact' | 'normal'

export default function AlbumView({ onStatsUpdate }: AlbumViewProps) {
  const { user, token } = useAuth()
  const [tazos, setTazos] = useState<Tazo[]>([])
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedFranchise, setSelectedFranchise] = useState<string>('all')
  const [selectedRarity, setSelectedRarity] = useState<string>('all')
  const [selectedCondition, setSelectedCondition] = useState<string>('all')
  const [selectedOwned, setSelectedOwned] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('franchise')
  const [sortOrder, setSortOrder] = useState<string>('asc')
  const [gridSize, setGridSize] = useState<GridSize>('normal')
  const [flippedAll, setFlippedAll] = useState(false)
  const [selectedTazo, setSelectedTazo] = useState<Tazo | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [obtainedMap, setObtainedMap] = useState<Record<string, string>>({})

  // Fetch franchises on mount
  useEffect(() => {
    fetch('/api/franchises')
      .then(res => res.json())
      .then(data => {
        setFranchises(data.franchises || [])
      })
      .catch(console.error)
  }, [])

  // Fetch user collection to get obtainedFrom data
  useEffect(() => {
    if (!token) return
    fetch('/api/collection?limit=200', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          const map: Record<string, string> = {}
          for (const item of data.items) {
            if (item.obtainedFrom && item.tazo?.id) {
              map[item.tazo.id] = item.obtainedFrom
            }
          }
          setObtainedMap(map)
        }
      })
      .catch(() => {})
  }, [token])

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

  // Collection is auto-managed — tazos are obtained by opening bags.
  // No manual toggle. isOwned is set automatically when a bag is opened.

  const ownedCount = tazos.filter(t => t.isOwned).length
  const totalCount = tazos.length
  const completionPct = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Onboarding — shown for new users with pending steps */}
      {user && <OnboardingBanner key={user.id} />}
      {/* ═══════════════════════════════════════════ */}
      {/* GAME BANNER — Stats Summary Bar               */}
      {/* ═══════════════════════════════════════════ */}
      <div className="game-banner px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Stats in game HUD style */}
          <div className="flex items-center gap-1">
            <BookOpen className="w-5 h-5 text-[#FFCC00]" />
            <span className="text-sm font-black text-white/80 tracking-tight">
              {totalCount} TAZOS
            </span>
          </div>

          <div className="w-px h-5 bg-white/[0.08]" />

          <div className="flex items-center gap-1">
            <span className="text-sm font-black text-[#FFCC00] tracking-tight">
              {ownedCount} OWNED
            </span>
          </div>

          <div className="w-px h-5 bg-white/[0.08]" />

          <div className="flex items-center gap-1">
            <span className="text-sm font-black text-[#00A1E9] tracking-tight">
              {completionPct}% COMPLETE
            </span>
          </div>

          {/* Game-style progress bar */}
          <div className="flex-1 min-w-[80px] max-w-[160px]">
            <div className="h-4 game-stat-bar-bg overflow-hidden relative">
              <div
                className="h-full game-stat-bar-fill stat-bar-fill"
                style={{ width: `${completionPct}%` }}
              />
              {/* Mini text inside bar */}
              <span
                className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-[#1a1a1a] mix-blend-multiply"
                style={{ textShadow: '0 0 2px rgba(255,255,255,0.8)' }}
              >
                {completionPct}%
              </span>
            </div>
          </div>

          {/* Flip-all toggle */}
          <button
            className={`mag-btn px-2 py-1.5 rounded-sm text-[10px] flex items-center gap-1 ${
              flippedAll
                ? 'bg-[#FFCC00] text-[#1a1a1a]'
                : 'bg-white text-[#1a1a1a]'
            }`}
            onClick={() => setFlippedAll(v => !v)}
            title={flippedAll ? 'Show fronts' : 'Flip all to back'}
          >
            <FlipHorizontal className="w-4 h-4" />
            <span className="text-[9px] font-black uppercase tracking-wide">
              {flippedAll ? 'BACKS' : 'FLIP'}
            </span>
          </button>

          {/* Grid size toggle - mag-btn style */}
          <div className="flex gap-1">
            <button
              className={`mag-btn px-2 py-1.5 rounded-sm text-[10px] ${
                gridSize === 'normal'
                  ? 'bg-[#E3350D] text-white'
                  : 'bg-white text-[#1a1a1a]'
              }`}
              onClick={() => setGridSize('normal')}
              aria-label="Normal grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              className={`mag-btn px-2 py-1.5 rounded-sm text-[10px] ${
                gridSize === 'compact'
                  ? 'bg-[#E3350D] text-white'
                  : 'bg-white text-[#1a1a1a]'
              }`}
              onClick={() => setGridSize('compact')}
              aria-label="Compact grid"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* FILTER BAR - Game UI                        */}
      {/* ═══════════════════════════════════════════ */}
      <div className="space-y-3">
        {/* Search Row - Game style */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            placeholder="Search your collection..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="game-input w-full pl-10 h-10 text-sm font-bold rounded"
          />
        </div>

        {/* Franchise Chips Row - Game style */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedFranchise('all')}
            className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-wide transition-all ${
              selectedFranchise === 'all'
                ? 'bg-white/15 text-white'
                : 'bg-white/[0.03] text-white/40 hover:bg-white/10 hover:text-white/70'
            }`}
          >
            ALL
          </button>
          {franchises.map((f) => {
            const colors = FRANCHISE_MAG_COLORS[f.slug] || FRANCHISE_MAG_COLORS.minimon
            const isActive = selectedFranchise === f.slug
            return (
              <button
                key={f.id}
                onClick={() => setSelectedFranchise(isActive ? 'all' : f.slug)}
                className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wide transition-all"
                style={{
                  backgroundColor: isActive ? colors.activeBg + '20' : 'transparent',
                  color: isActive ? colors.activeBg : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${isActive ? colors.activeBg + '40' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {f.name}
              </button>
            )
          })}
        </div>

        {/* Filter Dropdowns Row - Game UI */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-white/20" />

          <Select value={selectedRarity} onValueChange={setSelectedRarity}>
            <SelectTrigger
              className="w-[130px] h-9 text-[11px] font-black uppercase tracking-wide rounded-none"
              style={{
                background: 'white',
                border: '3px solid #1a1a1a',
                color: '#1a1a1a',
                boxShadow: '2px 2px 0px #1a1a1a',
              }}
            >
              <SelectValue placeholder="Rarity" />
            </SelectTrigger>
            <SelectContent
              className="rounded-none font-black"
              style={{
                background: 'white',
                border: '3px solid #1a1a1a',
                boxShadow: '4px 4px 0px #1a1a1a',
              }}
            >
              <SelectItem value="all" className="text-[11px] font-black uppercase">All Rarities</SelectItem>
              <SelectItem value="common" className="text-[11px] font-bold">
                <span className="text-zinc-500">★ Common</span>
              </SelectItem>
              <SelectItem value="uncommon" className="text-[11px] font-bold">
                <span className="text-green-600">★★ Uncommon</span>
              </SelectItem>
              <SelectItem value="rare" className="text-[11px] font-bold">
                <span className="text-blue-600">★★★ Rare</span>
              </SelectItem>
              <SelectItem value="ultra" className="text-[11px] font-bold">
                <span className="text-purple-600">★★★★ Ultra</span>
              </SelectItem>
              <SelectItem value="legendary" className="text-[11px] font-bold">
                <span className="text-amber-600">★★★★★ Legendary</span>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCondition} onValueChange={setSelectedCondition}>
            <SelectTrigger
              className="w-[130px] h-9 text-[11px] font-black uppercase tracking-wide rounded-none"
              style={{
                background: 'white',
                border: '3px solid #1a1a1a',
                color: '#1a1a1a',
                boxShadow: '2px 2px 0px #1a1a1a',
              }}
            >
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent
              className="rounded-none font-black"
              style={{
                background: 'white',
                border: '3px solid #1a1a1a',
                boxShadow: '4px 4px 0px #1a1a1a',
              }}
            >
              <SelectItem value="all" className="text-[11px] font-black uppercase">All Conditions</SelectItem>
              <SelectItem value="mint" className="text-[11px] font-bold"><span className="text-emerald-600">✨ Mint</span></SelectItem>
              <SelectItem value="good" className="text-[11px] font-bold"><CheckCircle className="w-3.5 h-3.5 inline mr-1 text-[#22C55E]" /> Good</SelectItem>
              <SelectItem value="used" className="text-[11px] font-bold"><RefreshCw className="w-3.5 h-3.5 inline mr-1 text-[#F59E0B]" /> Used</SelectItem>
              <SelectItem value="worn" className="text-[11px] font-bold"><span className="text-orange-600">Worn</span></SelectItem>
              <SelectItem value="holo" className="text-[11px] font-bold"><Palette className="w-3.5 h-3.5 inline mr-1 text-[#00A1E9]" /> Holo</SelectItem>
              <SelectItem value="metallic" className="text-[11px] font-bold"><span className="text-zinc-500">Metallic</span></SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedOwned} onValueChange={setSelectedOwned}>
            <SelectTrigger
              className="w-[120px] h-9 text-[11px] font-black uppercase tracking-wide rounded-none"
              style={{
                background: 'white',
                border: '3px solid #1a1a1a',
                color: '#1a1a1a',
                boxShadow: '2px 2px 0px #1a1a1a',
              }}
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent
              className="rounded-none font-black"
              style={{
                background: 'white',
                border: '3px solid #1a1a1a',
                boxShadow: '4px 4px 0px #1a1a1a',
              }}
            >
              <SelectItem value="all" className="text-[11px] font-black uppercase">All Status</SelectItem>
              <SelectItem value="owned" className="text-[11px] font-bold"><span className="text-green-600">✓ Owned</span></SelectItem>
              <SelectItem value="missing" className="text-[11px] font-bold"><span className="text-red-600">✗ Missing</span></SelectItem>
            </SelectContent>
          </Select>

          {/* Sort - right aligned */}
          <div className="ml-auto flex gap-1.5 items-center">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger
                className="w-[110px] h-9 text-[11px] font-black uppercase tracking-wide rounded-none"
                style={{
                  background: 'white',
                  border: '3px solid #1a1a1a',
                  color: '#1a1a1a',
                  boxShadow: '2px 2px 0px #1a1a1a',
                }}
              >
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent
                className="rounded-none font-black"
                style={{
                  background: 'white',
                  border: '3px solid #1a1a1a',
                  boxShadow: '4px 4px 0px #1a1a1a',
                }}
              >
                <SelectItem value="franchise" className="text-[11px] font-black uppercase">Series</SelectItem>
                <SelectItem value="name" className="text-[11px] font-black uppercase">Name</SelectItem>
                <SelectItem value="rarity" className="text-[11px] font-bold">Rarity</SelectItem>
                <SelectItem value="attack" className="text-[11px] font-bold">Attack</SelectItem>
                <SelectItem value="defense" className="text-[11px] font-bold">Defense</SelectItem>
                <SelectItem value="resistance" className="text-[11px] font-bold">Resistance</SelectItem>
                <SelectItem value="weight" className="text-[11px] font-bold">Weight</SelectItem>
                <SelectItem value="stability" className="text-[11px] font-bold">Stability</SelectItem>
                <SelectItem value="spin" className="text-[11px] font-bold">Spin</SelectItem>
                <SelectItem value="control" className="text-[11px] font-bold">Control</SelectItem>
                <SelectItem value="bounce" className="text-[11px] font-bold">Bounce</SelectItem>
                <SelectItem value="precision" className="text-[11px] font-bold">Precision</SelectItem>
                <SelectItem value="number" className="text-[11px] font-bold">Number</SelectItem>
                <SelectItem value="createdAt" className="text-[11px] font-bold">Recently Added</SelectItem>
                <SelectItem value="sourceStatus" className="text-[11px] font-bold">Source</SelectItem>
              </SelectContent>
            </Select>
            <button
              className="mag-btn px-2 py-1.5 rounded-sm bg-white text-[#1a1a1a] flex items-center gap-1"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              aria-label={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black">{sortOrder === 'asc' ? 'A→Z' : 'Z→A'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* 2D TAZO ALBUM GRID                         */}
      {/* ═══════════════════════════════════════════ */}
      {loading ? (
        <div className="flex items-center justify-center py-20 game-grid-bg" style={{ minHeight: 360 }}>
          <div className="w-12 h-12 rounded-full border-2 border-[#FFCC00]/30 border-t-[#FFCC00] animate-spin" />
        </div>
      ) : tazos.length === 0 ? (
        /* ═══ Empty State - Game style ═══ */
        <div className="game-empty rounded-none py-16 flex flex-col items-center justify-center text-center" style={{ minHeight: 400 }}>
          <div className="relative mb-4">
            <Star className="w-20 h-20 text-[#FFCC00]/20" />
          </div>
          <h3 className="text-2xl font-black text-white/60 mb-2 uppercase tracking-wider">
            NO TAZOS FOUND
          </h3>
          <p className="text-sm font-bold text-white/30 max-w-[300px]">
            Try adjusting your filters or search terms to find what you&apos;re looking for.
          </p>
        </div>
      ) : (
        <div
          className={`grid gap-3 sm:gap-4 p-3 sm:p-4 ${
            gridSize === 'compact'
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7'
              : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
          } game-grid-bg`}
        >
          {tazos.map((tazo) => (
            <TazoCard
              key={tazo.id}
              tazo={{ ...tazo, obtainedFrom: (obtainedMap[tazo.id] as any) || null }}
              forceFlipped={flippedAll}
              onClick={(item) => {
                setSelectedTazo(item)
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
        /* No manual toggle — collection is auto-managed via bag opening */
      />
    </div>
  )
}
