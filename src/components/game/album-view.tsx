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
import { Search, Filter, CheckCircle, RefreshCw, Palette, Grid3X3, LayoutGrid, BookOpen, Star, ArrowUpDown, Package, Cuboid } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

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

  // Toggle owned — use collection API when authenticated, old toggle fallback
  const handleToggleOwned = async (tazo: Tazo) => {
    try {
      if (user && token) {
        if (tazo.isOwned) {
          const colRes = await fetch(`/api/collection?franchise=${encodeURIComponent(tazo.franchise?.slug || '')}&limit=200`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (colRes.ok) {
            const colData = await colRes.json()
            const match = colData.items?.find((i: { tazo: { id: string } }) => i.tazo.id === tazo.id)
            if (match) {
              await fetch("/api/collection", {
                method: "DELETE",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ userTazoId: match.id }),
              })
            }
          }
        } else {
          await fetch("/api/collection", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ tazoId: tazo.id }),
          })
        }
      } else {
        const res = await fetch(`/api/tazos/${tazo.id}/toggle-owned`, { method: 'PUT' })
        await res.json()
      }
      setTazos(prev => prev.map(t => t.id === tazo.id ? { ...t, isOwned: !t.isOwned } : t))
      setSelectedTazo(prev => prev?.id === tazo.id ? { ...prev, isOwned: !prev.isOwned } : prev)
      onStatsUpdate?.()
    } catch (err) {
      console.error('Failed to toggle owned:', err)
    }
  }

  const ownedCount = tazos.filter(t => t.isOwned).length
  const totalCount = tazos.length
  const completionPct = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0

  return (
    <div className="space-y-4">
      {/* ═══════════════════════════════════════════ */}
      {/* MAGAZINE BANNER STRIP - Stats Summary Bar  */}
      {/* ═══════════════════════════════════════════ */}
      <div
        className="mag-card-yellow rounded-none px-4 py-3"
        style={{ borderBottom: '4px solid #1a1a1a' }}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Stats in magazine headline style */}
          <div className="flex items-center gap-1">
            <BookOpen className="w-5 h-5 text-[#1a1a1a]" />
            <span className="text-sm font-black text-[#1a1a1a] tracking-tight">
              {totalCount} TAZOS
            </span>
          </div>

          <div
            className="w-px h-5"
            style={{ backgroundColor: '#1a1a1a', opacity: 0.3 }}
          />

          <div className="flex items-center gap-1">
            <span className="text-sm font-black text-[#E3350D] tracking-tight">
              {ownedCount} OWNED
            </span>
          </div>

          <div
            className="w-px h-5"
            style={{ backgroundColor: '#1a1a1a', opacity: 0.3 }}
          />

          <div className="flex items-center gap-1">
            <span className="text-sm font-black text-[#3B4CCA] tracking-tight">
              {completionPct}% COMPLETE
            </span>
          </div>

          {/* Magazine subscription card style progress bar */}
          <div className="flex-1 min-w-[80px] max-w-[160px]">
            <div
              className="h-4 rounded-sm overflow-hidden relative"
              style={{
                border: '2px solid #1a1a1a',
                background: '#fffef0',
              }}
            >
              <div
                className="h-full stat-bar-fill"
                style={{
                  width: `${completionPct}%`,
                  background: 'repeating-linear-gradient(-45deg, #FFCC00, #FFCC00 4px, #FFB800 4px, #FFB800 8px)',
                  borderRight: completionPct > 0 && completionPct < 100 ? '2px solid #1a1a1a' : 'none',
                }}
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

          {/* Grid size toggle - mag-btn style */}
          <div className="ml-auto flex gap-1">
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
      {/* FILTER BAR - Magazine Sidebar Style         */}
      {/* ═══════════════════════════════════════════ */}
      <div className="space-y-3">
        {/* Search Row - Magazine style */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1a1a1a]" />
          <Input
            placeholder="Search SEARCH YOUR COLLECTION..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 mag-card rounded-none h-10 text-sm font-black text-[#1a1a1a] placeholder:text-[#1a1a1a]/40 placeholder:font-black placeholder:text-sm"
            style={{
              background: 'white',
              border: '3px solid #1a1a1a',
              boxShadow: '4px 4px 0px #1a1a1a',
            }}
          />
        </div>

        {/* Franchise Chips Row - Vibrant magazine style */}
        <div className="flex flex-wrap gap-2">
          {/* All chip */}
          <button
            onClick={() => setSelectedFranchise('all')}
            className={`px-3 py-1.5 rounded-sm text-[11px] font-black uppercase tracking-wide transition-all ${
              selectedFranchise === 'all'
                ? 'mag-btn bg-[#1a1a1a] text-white'
                : 'bg-white text-[#1a1a1a] border-2 border-[#1a1a1a] hover:bg-[#FFCC00]/20'
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
                className="px-3 py-1.5 rounded-sm text-[11px] font-black uppercase tracking-wide transition-all"
                style={{
                  backgroundColor: isActive ? colors.activeBg : colors.inactiveBg,
                  color: isActive ? colors.activeText : colors.inactiveText,
                  border: isActive ? '3px solid #1a1a1a' : '2px solid #1a1a1a',
                  boxShadow: isActive ? '3px 3px 0px #1a1a1a' : 'none',
                  transform: isActive ? 'none' : 'none',
                }}
              >
                {f.name}
              </button>
            )
          })}
        </div>

        {/* Filter Dropdowns Row - Magazine sidebar selectors */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-[#1a1a1a]" style={{ strokeWidth: 2.5 }} />

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
              <SelectItem value="worn" className="text-[11px] font-bold"><span className="text-orange-600">⚔️ Worn</span></SelectItem>
              <SelectItem value="holo" className="text-[11px] font-bold"><Palette className="w-3.5 h-3.5 inline mr-1 text-[#00A1E9]" /> Holo</SelectItem>
              <SelectItem value="metallic" className="text-[11px] font-bold"><span className="text-slate-600">🛡️ Metallic</span></SelectItem>
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
        <div
          className="flex items-center justify-center py-20 border-3 border-[#1a1a1a]"
          style={{ background: '#fffef0', minHeight: 360 }}
        >
          <div className="mag-spinner w-12 h-12 rounded-full border-4 border-[#FFCC00] border-t-[#E3350D]" />
        </div>
      ) : tazos.length === 0 ? (
        /* ═══ Empty State - Magazine style ═══ */
        <div
          className="mag-card rounded-none py-16 flex flex-col items-center justify-center text-center mag-dots"
          style={{ background: '#fffef0', minHeight: 400 }}
        >
          <div className="relative mb-4">
            <Star
              className="w-20 h-20 text-[#FFCC00]"
              style={{
                strokeWidth: 1.5,
                filter: 'drop-shadow(3px 3px 0px #1a1a1a)',
              }}
            />
            <span
              className="absolute inset-0 flex items-center justify-center text-2xl font-black text-[#1a1a1a]"
              style={{ transform: 'rotate(-5deg)' }}
            >
              !
            </span>
          </div>
          <h3
            className="text-2xl font-black text-[#1a1a1a] mb-2 mag-stroke-sm"
            style={{
              paintOrder: 'stroke fill',
              WebkitTextStroke: '1px #1a1a1a',
              color: '#E3350D',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            NO TAZOS FOUND!
          </h3>
          <p className="text-sm font-bold text-[#1a1a1a]/60 max-w-[300px]">
            Try adjusting your filters or search terms to find what you&apos;re looking for.
          </p>
        </div>
      ) : (
        <div
          className={`grid gap-3 p-3 ${
            gridSize === 'compact'
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7'
              : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
          }`}
          style={{
            background: '#fffef0',
            border: '3px solid #1a1a1a',
            boxShadow: '4px 4px 0px #1a1a1a',
          }}
        >
          {tazos.map((tazo) => (
            <TazoCard
              key={tazo.id}
              tazo={tazo}
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
        onToggleOwned={handleToggleOwned}
      />
    </div>
  )
}
