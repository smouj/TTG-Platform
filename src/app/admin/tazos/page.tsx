"use client"

// ============================================================
// Trading Tazos Game — Admin Tazo Manager
// Professional grid view with full edit, sort, delete, batch ops
// ============================================================
import { useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { useVisibilityRefresh } from "@/lib/use-visibility-refresh"
import {
  Loader2, Search, X, Edit3, Save, RotateCcw,
  ChevronLeft, ChevronRight, Image as ImageIcon, Star, Check,
  AlertTriangle, Trash2, Square, CheckSquare, ArrowUpDown, Grid3X3,
} from "lucide-react"
import AdminShell from "@/components/admin/admin-shell"
import TazoDiscImage from "@/components/game/tazo-disc-image"

// ── Types ──
interface TazoFranchise { name: string; slug: string }
interface TazoData {
  id: string; name: string; displayName: string | null; description: string | null; slug: string
  franchiseId: string; number: string; rarity: string
  imageUrl: string | null; backImageUrl: string | null; finish: string; creatureVariant: string
  shinyImageUrl?: string | null; wear?: number; publishStatus: string
  skill: string | null; skillDesc: string | null; role: string | null; combatType: string | null
  category: string | null
  attack: number; defense: number; resistance: number; weight: number
  stability: number; spin: number; control: number; bounce: number; precision: number
  isOwned: boolean; stackable: boolean; maxStackOn: number
  franchise: TazoFranchise
}
interface Franchise { id: string; name: string; slug: string }

const RARITIES = ["common", "uncommon", "rare", "ultra", "legendary", "epic"]
const FINISHES = ["normal", "holo", "reverse_holo", "prismatic", "foil", "glossy", "metallic", "chrome", "gold", "rainbow", "glitter", "stardust", "aurora", "cracked_ice", "oil_slick", "lenticular", "pearlescent", "matte"]
const ROLES = ["attacker", "tank", "technical", "bouncer", "heavy", "light", "balanced", "special"]
const ROLE_SHORT = { attacker: "ATK", tank: "TNK", technical: "TEC", bouncer: "BNC", heavy: "HVY", light: "LGT", balanced: "BAL", special: "SPC" } as const
const COMBAT_TYPES = [
  // Minimon
  "fire", "water", "grass", "electric", "psychic", "ghost", "dragon", "normal",
  // Cybermon  
  "data", "virus", "vaccine", "free",
  // Dracobell
  "striker", "guardian", "auralord", "beastborn", "monkblade", "stormfist",
  "voidwalker", "sunborn", "ironbody", "skyfighter", "dragonkin", "bell_sage",
]
const CATEGORIES = ["creature", "trainer", "equipment", "arena", "special"]

const FRANCHISE_COLORS: Record<string, string> = {
  minimon: "#FFCB05", cybermon: "#00A1E9", dracobell: "#FF6B00", "draco-bell": "#FF6B00",
}
const RARITY_COLORS: Record<string, string> = {
  common: "var(--ttg-rarity-common)", uncommon: 'var(--ttg-success)', rare: "#3B82F6",
  ultra: 'var(--ttg-purple)', legendary: "#FBBF24", epic: "#EF4444",
}
const RARITY_STARS: Record<string, number> = {
  common: 1, uncommon: 2, rare: 3, epic: 4, ultra: 4, legendary: 5,
}

type SortField = "default" | "name" | "attack" | "defense" | "rarity" | "number"

// ── Main ──
export default function AdminTazoManagerPage() {
  const { user, loading: authLoading } = useAuth()
  const isAdmin = user?.email === "dev@tradingtazosgame.com"

  const [tazos, setTazos] = useState<TazoData[]>([])
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filters + Sort
  const [search, setSearch] = useState("")
  const [franchiseFilter, setFranchiseFilter] = useState("")
  const [rarityFilter, setRarityFilter] = useState("")
  const [sortField, setSortField] = useState<SortField>("default")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<TazoData> | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle")

  // Batch operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchEditMode, setBatchEditMode] = useState(false)
  const [batchEditData, setBatchEditData] = useState<Record<string, string>>({})
  const [batchSaving, setBatchSaving] = useState(false)

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Creature art upload
  const [artUploading, setArtUploading] = useState(false)
  const [artStatus, setArtStatus] = useState<"idle" | "uploading" | "compositing" | "done" | "error">("idle")
  const [artMessage, setArtMessage] = useState("")

  // ── Publish/unpublish ──
  const fetchTazos = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ section: "tazos", limit: "200", page: String(page) })
      if (franchiseFilter) params.set("franchise", franchiseFilter)
      if (rarityFilter) params.set("rarity", rarityFilter)
      if (search) params.set("search", search)

      const res = await fetch(`/api/admin?${params}`, { credentials: "include" })
      const data = await res.json()
      setTazos(data.tazos || [])
      setTotal(data.total || 0)
      setTotalPages(data.pages || 1)
    } catch (e) {
      console.error("Failed to fetch tazos", e)
    }
    setLoading(false)
  }, [isAdmin, page, franchiseFilter, rarityFilter, search])

  useEffect(() => {
    if (isAdmin) {
      fetchTazos()
      fetch("/api/admin?section=franchises", { credentials: "include" })
        .then(r => r.json())
        .then(d => setFranchises(d.franchises || []))
    }
  }, [isAdmin, fetchTazos])

  // Auto-refresh when tab becomes visible
  useVisibilityRefresh(fetchTazos, { enabled: isAdmin })

  // ── Sort ──
  const sortedTazos = useMemo(() => {
    if (sortField === "default") return tazos
    const sorted = [...tazos]
    const dir = sortDir === "asc" ? 1 : -1
    sorted.sort((a, b) => {
      if (sortField === "name") return dir * (a.name || "").localeCompare(b.name || "")
      if (sortField === "attack") return dir * ((a.attack || 0) - (b.attack || 0))
      if (sortField === "defense") return dir * ((a.defense || 0) - (b.defense || 0))
      if (sortField === "rarity") return dir * (RARITIES.indexOf(a.rarity) - RARITIES.indexOf(b.rarity))
      if (sortField === "number") return dir * ((a.number || "").localeCompare(b.number || ""))
      return 0
    })
    return sorted
  }, [tazos, sortField, sortDir])

  // ── Edit handlers ──
  const startEdit = (tazo: TazoData) => {
    setEditingId(tazo.id)
    setEditData({ ...tazo })
    setSaveStatus("idle")
  }
  const cancelEdit = () => { setEditingId(null); setEditData(null) }

  const updateField = (field: string, value: any) => {
    if (!editData) return
    setEditData(prev => ({ ...prev!, [field]: value }))
    setSaveStatus("idle")
  }

  const saveTazo = async () => {
    if (!editData || !editingId) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: editingId, ...editData }),
      })
      if (!res.ok) throw new Error("Save failed")
      const data = await res.json()
      setTazos(prev => prev.map(t => t.id === editingId ? data.tazo : t))
      setSaveStatus("saved")
      setTimeout(() => { setEditingId(null); setEditData(null); setSaveStatus("idle") }, 800)
    } catch (e) {
      console.error("Save failed", e)
      setSaveStatus("error")
    }
    setSaving(false)
  }

  // ── Publish/unpublish quick toggle ──
  const togglePublish = async (tazo: TazoData) => {
    const newStatus = tazo.publishStatus === "published" ? "pending_review" : "published"
    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: tazo.id, publishStatus: newStatus }),
      })
      if (!res.ok) throw new Error("Toggle failed")
      setTazos(prev => prev.map(t => t.id === tazo.id ? { ...t, publishStatus: newStatus } : t))
    } catch (e) {
      console.error("Publish toggle failed", e)
    }
  }

  // ── Replace creature art ──
  const replaceArt = async (tazoId: string, file: File) => {
    setArtUploading(true)
    setArtStatus("uploading")
    setArtMessage("Reading image...")
    try {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error("Failed to read file"))
        reader.readAsDataURL(file)
      })
      setArtStatus("compositing")
      setArtMessage("Compositing with background...")
      const res = await fetch("/api/admin/tazo-art", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tazoId, creatureDataUrl: dataUrl }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "Upload failed")
      setTazos(prev => prev.map(t => t.id === tazoId ? { ...t, imageUrl: data.tazo.imageUrl } : t))
      if (editData && editingId === tazoId) {
        setEditData(prev => prev ? { ...prev, imageUrl: data.tazo.imageUrl } : null)
      }
      setArtStatus("done")
      setArtMessage(data.message || "Art replaced!")
      setTimeout(() => { setArtStatus("idle"); setArtMessage("") }, 2500)
    } catch (e: any) {
      console.error("Art replacement failed", e)
      setArtStatus("error")
      setArtMessage(e.message || "Upload failed")
      setTimeout(() => { setArtStatus("idle"); setArtMessage("") }, 4000)
    }
    setArtUploading(false)
  }

  // ── Delete handler ──
  const deleteTazo = async (id: string) => {
    setDeleteError(null)
    try {
      const res = await fetch(`/api/admin?id=${id}`, { method: "DELETE", credentials: "include" })
      const data = await res.json()
      if (!res.ok) {
        setDeleteError(data.error || "Delete failed")
        setDeletingId(null)
        return
      }
      setTazos(prev => prev.filter(t => t.id !== id))
      setTotal(prev => prev - 1)
      setDeletingId(null)
    } catch (e: any) {
      setDeleteError(e.message || "Connection error")
      setDeletingId(null)
    }
  }

  // ── Batch select ──
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }
  const selectAll = () => {
    if (selectedIds.size === sortedTazos.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(sortedTazos.map(t => t.id)))
    }
  }

  // ── Batch edit ──
  const applyBatchEdit = async () => {
    if (selectedIds.size === 0 || Object.keys(batchEditData).length === 0) return
    setBatchSaving(true)
    const ids = [...selectedIds]
    let updated = 0
    for (const id of ids) {
      try {
        const res = await fetch("/api/admin", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id, ...batchEditData }),
        })
        if (res.ok) updated++
      } catch (e) {
        console.error("Batch edit failed for", id, e)
      }
    }
    setBatchSaving(false)
    setBatchEditMode(false)
    setBatchEditData({})
    setSelectedIds(new Set())
    if (updated > 0) fetchTazos()
  }

  // ── Render ──
  return (
    <AdminShell accentColor="var(--ttg-warning)">
      <div className="max-w-[1600px] mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Grid3X3 className="w-5 h-5 text-ttg-warning" />
          <h1 className="text-lg font-black uppercase text-ttg-black tracking-wider">Tazo Manager</h1>
          <span className="text-sm font-black text-ttg-black/25">({total} tazos)</span>
        </div>

      {/* ── Filter Bar ── */}
        <div className="flex flex-wrap items-center gap-3 bg-white border-3 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)] p-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              type="text" placeholder="Search by name..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="flex-1 bg-transparent text-sm font-bold text-ttg-black placeholder:text-zinc-300 outline-none py-1"
            />
            {search && <button onClick={() => setSearch("")} className="text-zinc-400 hover:text-ttg-red"><X className="w-4 h-4" /></button>}
          </div>

          <select value={franchiseFilter} onChange={e => { setFranchiseFilter(e.target.value); setPage(1) }}
            className="bg-zinc-50 border-2 border-zinc-200 px-3 py-1.5 text-xs font-bold text-ttg-black outline-none focus:border-ttg-yellow">
            <option value="">All Series</option>
            {franchises.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>

          <select value={rarityFilter} onChange={e => { setRarityFilter(e.target.value); setPage(1) }}
            className="bg-zinc-50 border-2 border-zinc-200 px-3 py-1.5 text-xs font-bold text-ttg-black outline-none focus:border-ttg-yellow">
            <option value="">All Rarities</option>
            {RARITIES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>

          {/* Sort */}
          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <select value={sortField} onChange={e => setSortField(e.target.value as SortField)}
              className="bg-zinc-50 border-2 border-zinc-200 px-2 py-1.5 text-[10px] font-bold text-ttg-black outline-none focus:border-ttg-yellow">
              <option value="default">Default</option>
              <option value="name">Name</option>
              <option value="number">Number</option>
              <option value="rarity">Rarity</option>
              <option value="attack">ATK</option>
              <option value="defense">DEF</option>
            </select>
            {sortField !== "default" && (
              <button onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
                className="p-1 border border-zinc-200 text-[10px] font-black text-zinc-500 hover:bg-zinc-50">
                {sortDir === "asc" ? "↑" : "↓"}
              </button>
            )}
          </div>

          {(franchiseFilter || rarityFilter || search) && (
            <button onClick={() => { setFranchiseFilter(""); setRarityFilter(""); setSearch(""); setPage(1) }}
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-ttg-red hover:underline">
              <X className="w-3 h-3" /> Clear
            </button>
          )}

          <div className="ml-auto flex items-center gap-4 text-[10px] font-bold text-zinc-400">
            <span>Showing {sortedTazos.length} of {total}</span>
            {selectedIds.size > 0 && <span className="text-ttg-yellow">| {selectedIds.size} selected</span>}
          </div>
        </div>

        {/* Batch edit bar */}
        {selectedIds.size > 0 && (
          <div className="mt-3 flex items-center gap-2 bg-ttg-yellow/10 border-2 border-ttg-yellow p-3">
            {!batchEditMode ? (
              <>
                <span className="text-sm font-black text-ttg-black">{selectedIds.size} tazos selected</span>
                <button onClick={() => setBatchEditMode(true)}
                  className="px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-ttg-blue text-white border-2 border-ttg-black shadow-[2px_2px_0px_var(--ttg-black)]">
                  Batch Edit
                </button>
                <button onClick={() => setSelectedIds(new Set())}
                  className="px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-white text-ttg-black border-2 border-ttg-black">
                  Deselect All
                </button>
              </>
            ) : (
              <>
                <span className="text-xs font-black text-ttg-black">Apply to {selectedIds.size} tazos:</span>
                <select onChange={e => setBatchEditData(prev => ({ ...prev, rarity: e.target.value }))} value={batchEditData.rarity || ""}
                  className="text-[10px] font-bold bg-white border-2 border-zinc-200 px-2 py-1 outline-none focus:border-ttg-yellow">
                  <option value="">Rarity —</option>
                  {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select onChange={e => setBatchEditData(prev => ({ ...prev, finish: e.target.value }))} value={batchEditData.finish || ""}
                  className="text-[10px] font-bold bg-white border-2 border-zinc-200 px-2 py-1 outline-none focus:border-ttg-yellow">
                  <option value="">Finish —</option>
                  {FINISHES.map(f => <option key={f} value={f}>{f.replace("_"," ")}</option>)}
                </select>
                <select onChange={e => setBatchEditData(prev => ({ ...prev, combatType: e.target.value }))} value={batchEditData.combatType || ""}
                  className="text-[10px] font-bold bg-white border-2 border-zinc-200 px-2 py-1 outline-none focus:border-ttg-yellow">
                  <option value="">Combat —</option>
                  {COMBAT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select onChange={e => setBatchEditData(prev => ({ ...prev, role: e.target.value }))} value={batchEditData.role || ""}
                  className="text-[10px] font-bold bg-white border-2 border-zinc-200 px-2 py-1 outline-none focus:border-ttg-yellow">
                  <option value="">Role —</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select onChange={e => setBatchEditData(prev => ({ ...prev, publishStatus: e.target.value }))} value={batchEditData.publishStatus || ""}
                  className="text-[10px] font-bold bg-white border-2 border-zinc-200 px-2 py-1 outline-none focus:border-ttg-yellow">
                  <option value="">Publish —</option>
                  <option value="published">✅ Published</option>
                  <option value="pending_review">⏳ Pending</option>
                  <option value="draft">📝 Draft</option>
                </select>
                <button onClick={applyBatchEdit} disabled={batchSaving}
                  className="px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-ttg-success text-white border-2 border-ttg-black shadow-[2px_2px_0px_var(--ttg-black)] disabled:opacity-50">
                  {batchSaving ? "Saving..." : "Apply"}
                </button>
                <button onClick={() => { setBatchEditMode(false); setBatchEditData({}) }}
                  className="px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-white text-ttg-black border-2 border-ttg-black">
                  Cancel
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Tazo Grid ── */}
      <div className="max-w-[1600px] mx-auto px-4 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-ttg-yellow" /></div>
        ) : sortedTazos.length === 0 ? (
          <div className="text-center py-20 text-sm font-bold text-zinc-400">No tazos found.</div>
        ) : (
          <>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button onClick={selectAll}
                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-ttg-black/40 hover:text-ttg-black transition-colors">
                    {selectedIds.size === sortedTazos.length ? <CheckSquare className="w-4 h-4 text-ttg-blue" /> : <Square className="w-4 h-4" />}
                    {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
                  </button>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1.5 border-2 border-zinc-300 bg-white disabled:opacity-30 hover:border-ttg-yellow"><ChevronLeft className="w-4 h-4" /></button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                    const p = start + i
                    if (p > totalPages) return null
                    return <button key={p} onClick={() => setPage(p)}
                      className={`w-9 h-9 border-2 text-xs font-black ${p === page ? "bg-ttg-black text-white border-ttg-black" : "bg-white border-zinc-300 text-zinc-600 hover:border-ttg-yellow"}`}>{p}</button>
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-1.5 border-2 border-zinc-300 bg-white disabled:opacity-30 hover:border-ttg-yellow"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {sortedTazos.map(tazo => {
                const isEditing = editingId === tazo.id
                const fColor = FRANCHISE_COLORS[tazo.franchise.slug] || "#999"
                const rColor = RARITY_COLORS[tazo.rarity] || "#999"
                const isSelected = selectedIds.has(tazo.id)

                return (
                  <div
                    key={tazo.id}
                    className={`mag-card border-3 transition-all duration-200 ${
                      isEditing
                        ? "border-ttg-yellow shadow-[0_0_20px_rgba(255,204,0,0.2)] ring-2 ring-ttg-yellow/30 scale-[1.02] z-10"
                        : isSelected
                        ? "border-ttg-blue shadow-[0_0_10px_rgba(59,76,202,0.15)]"
                        : "border-ttg-black/10 shadow-[2px_2px_0px_var(--ttg-black)]/5 hover:shadow-[3px_3px_0px_#1a1a1a20] hover:border-ttg-black/20"
                    } bg-white overflow-hidden`}
                  >
                    {!isEditing ? (
                      /* ── VIEW MODE ── */
                      <div className="w-full">
                        <div className="relative aspect-square bg-ttg-black flex items-center justify-center overflow-hidden cursor-pointer group"
                          onClick={() => startEdit(tazo)}>
                          {/* Select checkbox */}
                          <button
                            onClick={e => { e.stopPropagation(); toggleSelect(tazo.id) }}
                            className="absolute top-2 left-2 z-10 p-0.5 bg-white/80 backdrop-blur-sm border border-zinc-300 hover:border-ttg-blue transition-colors"
                          >
                            {isSelected ? <CheckSquare className="w-4 h-4 text-ttg-blue" /> : <Square className="w-4 h-4 text-zinc-400" />}
                          </button>
                          {tazo.imageUrl ? (
                            <TazoDiscImage
                              src={tazo.imageUrl}
                              alt={tazo.name}
                              size="100%"
                              borderWidth={0}
                              franchiseSlug={tazo.franchise?.slug || tazo.franchiseId}
                              number={tazo.number}
                              finish={tazo.finish as any}
                              creatureVariant={tazo.creatureVariant as any}
                              shinyImageUrl={tazo.shinyImageUrl}
                              wear={tazo.wear || 0}
                              className="group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <ImageIcon className="w-10 h-10 text-zinc-300" />
                          )}
                          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: fColor }} />
                          <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-ttg-black/80 backdrop-blur-sm px-1.5 py-0.5">
                            {Array.from({ length: RARITY_STARS[tazo.rarity] || 1 }, (_, i) => (
                              <Star key={i} className="w-2 h-2" fill={rColor} stroke={rColor} />
                            ))}
                          </div>
                          <div className="absolute inset-0 bg-ttg-black/0 group-hover:bg-ttg-black/30 transition-colors flex items-center justify-center">
                            <Edit3 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                          </div>
                          {/* Delete button */}
                          <button
                            onClick={e => { e.stopPropagation(); setDeletingId(deletingId === tazo.id ? null : tazo.id) }}
                            className="absolute bottom-2 right-2 p-1 bg-ttg-red/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-ttg-red"
                            title="Delete tazo"
                          ><Trash2 className="w-3.5 h-3.5" /></button>
                          {/* Publish/unpublish quick toggle */}
                          <button
                            onClick={e => { e.stopPropagation(); togglePublish(tazo) }}
                            className={`absolute bottom-2 left-2 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-black uppercase tracking-wider ${
                              tazo.publishStatus === "published" ? "bg-ttg-success/80 hover:bg-ttg-success" : "bg-ttg-blue/80 hover:bg-ttg-blue"
                            }`}
                            title="Toggle publish status"
                          >{tazo.publishStatus === "published" ? "Unpublish" : "Publish"}</button>
                        </div>
                        {/* Card info bar — shows publish status */}
                        <div className="px-2 py-1 flex items-center justify-between">
                          <p className="text-[9px] font-black text-ttg-black truncate">{tazo.displayName || tazo.name || tazo.slug}</p>
                          <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 border ${
                            tazo.publishStatus === "published"
                              ? "bg-ttg-success/10 border-ttg-success/30 text-ttg-success"
                              : tazo.publishStatus === "pending_review"
                              ? "bg-ttg-warning/10 border-ttg-warning/30 text-ttg-warning"
                              : "bg-zinc-50 border-zinc-200 text-zinc-400"
                          }`}>{tazo.publishStatus || "draft"}</span>
                        </div>
                        {/* Delete confirmation */}
                        {deletingId === tazo.id && (
                          <div className="px-2.5 py-2 bg-ttg-red/5 border-t-2 border-ttg-red/20 space-y-1.5">
                            <p className="text-[9px] font-bold text-ttg-red">Delete &quot;{tazo.name || tazo.slug}&quot;?</p>
                            <div className="flex gap-1.5">
                              <button onClick={() => deleteTazo(tazo.id)}
                                className="flex-1 py-1 text-[8px] font-black uppercase text-white bg-ttg-red">Yes, delete</button>
                              {deleteError && (
                      <div className="mb-3 p-2 bg-red-50 border-2 border-red-300 text-center">
                        <p className="text-[9px] font-black text-red-600">{deleteError}</p>
                        <button onClick={() => setDeleteError(null)} className="text-[7px] underline mt-1">Dismiss</button>
                      </div>
                    )}
                    <button onClick={() => { setDeleteError(null); setDeletingId(null) }}
                                className="flex-1 py-1 text-[8px] font-black uppercase border border-zinc-300">Cancel</button>
                            </div>
                          </div>
                        )}
                        <div className="p-2.5 space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 rounded-full border border-white/20" style={{ background: rColor }} />
                            <span className="text-[11px] font-black text-ttg-black truncate leading-tight">{tazo.name || tazo.slug}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                            <span>{tazo.franchise.name}</span><span>·</span><span>{tazo.rarity}</span>
                            {tazo.finish !== "normal" && <><span>·</span><span className="text-ttg-yellow">{tazo.finish}</span></>}
                            {tazo.role && <><span>·</span><span>{ROLE_SHORT[tazo.role as keyof typeof ROLE_SHORT] ?? tazo.role}</span></>}
                          </div>
                          <div className="flex gap-1 pt-0.5">
                            {[{ v: tazo.attack, c: 'var(--ttg-red)' },{ v: tazo.defense, c: 'var(--ttg-blue)' },{ v: tazo.resistance, c: 'var(--ttg-success)' },{ v: tazo.weight, c: "var(--ttg-warning)" },{ v: tazo.stability, c: 'var(--ttg-purple)' }].map(s => (
                              <div key={s.c} className="flex-1 h-1 bg-white/10 overflow-hidden">
                                <div className="h-full" style={{ width: `${s.v}%`, background: s.c }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ── EDIT MODE ── */
                      <div className="p-3 space-y-3 max-h-[80vh] overflow-y-auto">
                        <div className="relative aspect-square bg-zinc-50 flex items-center justify-center overflow-hidden border-2 border-zinc-200">
                          {editData?.imageUrl ? (
                            <TazoDiscImage
                              src={editData.imageUrl}
                              alt={editData.name || ""}
                              size="100%"
                              borderWidth={0}
                              franchiseSlug={tazo.franchise?.slug || tazo.franchiseId}
                              number={tazo.number}
                              finish={editData.finish as any || tazo.finish as any}
                              creatureVariant={editData.creatureVariant as any || tazo.creatureVariant as any}
                              shinyImageUrl={editData.shinyImageUrl || tazo.shinyImageUrl}
                              wear={editData.wear || tazo.wear || 0}
                            />
                          ) : <ImageIcon className="w-10 h-10 text-zinc-300" />}
                          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: fColor }} />
                        </div>

                        {/* Name + DisplayName */}
                        <div className="space-y-1.5">
                          <input type="text" value={editData?.name || ""} onChange={e => updateField("name", e.target.value)}
                            className="w-full text-xs font-black text-ttg-black bg-zinc-50 border-2 border-zinc-200 px-2.5 py-1.5 outline-none focus:border-ttg-yellow" placeholder="Name" />
                          <input type="text" value={editData?.displayName || ""} onChange={e => updateField("displayName", e.target.value)}
                            className="w-full text-[10px] font-bold text-ttg-black/60 bg-zinc-50 border-2 border-zinc-200 px-2.5 py-1 outline-none focus:border-ttg-yellow" placeholder="Display Name" />
                          <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                            <span>{tazo.franchise.name}</span><span>#{tazo.number}</span>
                          </div>
                        </div>

                        {/* ♻️ Replace Creature Art */}
                        <div className="bg-amber-50 border-2 border-amber-200 p-2.5 space-y-2">
                          <label className="text-[8px] font-black uppercase text-amber-600 tracking-wider block">
                            ♻️ Replace Creature Art
                          </label>
                          <p className="text-[8px] font-bold text-amber-500">
                            Upload a new creature PNG. Only the creature art changes — stats, layout, and name stay the same.
                          </p>
                          <input
                            type="file"
                            accept="image/png,image/webp,image/jpeg"
                            disabled={artUploading}
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (file) replaceArt(tazo.id, file)
                              e.target.value = ""
                            }}
                            className="block w-full text-[10px] font-bold text-zinc-600 file:mr-2 file:px-3 file:py-1 file:text-[10px] file:font-black file:uppercase file:tracking-wider file:bg-amber-500 file:text-white file:border-0 file:cursor-pointer hover:file:bg-amber-600"
                          />
                          {artStatus !== "idle" && (
                            <div className={`text-[9px] font-bold flex items-center gap-1.5 ${
                              artStatus === "error" ? "text-ttg-red" :
                              artStatus === "done" ? "text-ttg-success" : "text-amber-600"
                            }`}>
                              {artStatus === "uploading" || artStatus === "compositing" ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : artStatus === "done" ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <AlertTriangle className="w-3 h-3" />
                              )}
                              {artMessage}
                            </div>
                          )}
                        </div>

                        {/* Publish Status */}
                        <div>
                          <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-0.5 block">Publish Status</label>
                          <select
                            value={editData?.publishStatus || "pending_review"}
                            onChange={e => updateField("publishStatus", e.target.value)}
                            className="w-full text-[10px] font-bold bg-zinc-50 border-2 border-zinc-200 px-2 py-1 outline-none focus:border-ttg-yellow"
                          >
                            <option value="published">✅ Published (visible everywhere)</option>
                            <option value="pending_review">⏳ Pending Review (hidden)</option>
                            <option value="draft">📝 Draft (hidden)</option>
                          </select>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-0.5 block">Description</label>
                          <textarea value={editData?.description || ""} onChange={e => updateField("description", e.target.value)}
                            className="w-full text-[10px] font-bold bg-zinc-50 border-2 border-zinc-200 px-2 py-1 outline-none focus:border-ttg-yellow resize-none h-12"
                            placeholder="Creature description..." />
                        </div>

                        {/* Rarity + Finish + Category */}
                        <div className="grid grid-cols-3 gap-1.5">
                          <div>
                            <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-0.5 block">Rarity</label>
                            <select value={editData?.rarity || "common"} onChange={e => updateField("rarity", e.target.value)}
                              className="w-full text-[10px] font-bold bg-zinc-50 border-2 border-zinc-200 px-2 py-1 outline-none focus:border-ttg-yellow">
                              {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-0.5 block">Finish</label>
                            <select value={editData?.finish || "normal"} onChange={e => updateField("finish", e.target.value)}
                              className="w-full text-[10px] font-bold bg-zinc-50 border-2 border-zinc-200 px-2 py-1 outline-none focus:border-ttg-yellow">
                              {FINISHES.map(f => <option key={f} value={f}>{f.replace("_"," ")}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-0.5 block">Category</label>
                            <select value={editData?.category || "creature"} onChange={e => updateField("category", e.target.value)}
                              className="w-full text-[10px] font-bold bg-zinc-50 border-2 border-zinc-200 px-2 py-1 outline-none focus:border-ttg-yellow">
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>

                        {/* Role + Combat */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-0.5 block">Role</label>
                            <select value={editData?.role || "balanced"} onChange={e => updateField("role", e.target.value)}
                              className="w-full text-[10px] font-bold bg-zinc-50 border-2 border-zinc-200 px-2 py-1 outline-none focus:border-ttg-yellow">
                              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-0.5 block">Combat</label>
                            <select value={editData?.combatType || ""} onChange={e => updateField("combatType", e.target.value)}
                              className="w-full text-[10px] font-bold bg-zinc-50 border-2 border-zinc-200 px-2 py-1 outline-none focus:border-ttg-yellow">
                              <option value="">—</option>
                              {COMBAT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>

                        {/* Stats grid — 9 stats */}
                        <div>
                          <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-1 block">Stats</label>
                          <div className="grid grid-cols-3 gap-1">
                            {([
                              ["ATK","attack",'var(--ttg-red)'],["DEF","defense",'var(--ttg-blue)'],["RES","resistance",'var(--ttg-success)'],
                              ["WT","weight","var(--ttg-warning)"],["STB","stability",'var(--ttg-purple)'],["SPIN","spin","#EC4899"],
                              ["CTRL","control","#06B6D4"],["BNC","bounce","#F97316"],["PREC","precision","#8B5CF6"],
                            ] as const).map(([label, field, color]) => (
                              <div key={field} className="flex items-center gap-1 bg-zinc-50 px-1.5 py-1 border border-zinc-200">
                                <span className="text-[7px] font-black text-zinc-400 w-8">{label}</span>
                                <input type="number" min={0} max={100}
                                  value={editData?.[field as keyof TazoData] as number || 0}
                                  onChange={e => updateField(field, Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                  className="w-full text-[10px] font-bold text-right bg-transparent outline-none" style={{ color }} />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Skill + Variant */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-0.5 block">Skill</label>
                            <input type="text" value={editData?.skill || ""} onChange={e => updateField("skill", e.target.value)}
                              className="w-full text-[10px] font-bold bg-zinc-50 border-2 border-zinc-200 px-2 py-1 outline-none focus:border-ttg-yellow" placeholder="Skill name" />
                          </div>
                          <div>
                            <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-0.5 block">Variant</label>
                            <input type="text" value={editData?.creatureVariant || "standard"} onChange={e => updateField("creatureVariant", e.target.value)}
                              className="w-full text-[10px] font-bold bg-zinc-50 border-2 border-zinc-200 px-2 py-1 outline-none focus:border-ttg-yellow" />
                          </div>
                        </div>

                        {/* Skill Desc */}
                        <div>
                          <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-0.5 block">Description</label>
                          <textarea value={editData?.skillDesc || ""} onChange={e => updateField("skillDesc", e.target.value)}
                            className="w-full text-[10px] font-bold bg-zinc-50 border-2 border-zinc-200 px-2 py-1 outline-none focus:border-ttg-yellow resize-none h-12"
                            placeholder="Skill description..." />
                        </div>

                        {/* Image URL + Back Image URL */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-0.5 block">Image URL</label>
                            <input type="text" value={editData?.imageUrl || ""} onChange={e => updateField("imageUrl", e.target.value)}
                              className="w-full text-[9px] font-mono bg-zinc-50 border-2 border-zinc-200 px-2 py-1 outline-none focus:border-ttg-yellow" />
                          </div>
                          <div>
                            <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-0.5 block">Back Image</label>
                            <input type="text" value={editData?.backImageUrl || ""} onChange={e => updateField("backImageUrl", e.target.value)}
                              className="w-full text-[9px] font-mono bg-zinc-50 border-2 border-zinc-200 px-2 py-1 outline-none focus:border-ttg-yellow" />
                          </div>
                        </div>

                        {/* Toggles */}
                        <div className="flex gap-3">
                          <label className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-600 cursor-pointer">
                            <input type="checkbox" checked={editData?.isOwned || false} onChange={e => updateField("isOwned", e.target.checked)}
                              className="w-3.5 h-3.5 accent-ttg-yellow" /> Owned
                          </label>
                          <label className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-600 cursor-pointer">
                            <input type="checkbox" checked={editData?.stackable !== false} onChange={e => updateField("stackable", e.target.checked)}
                              className="w-3.5 h-3.5 accent-ttg-yellow" /> Stackable
                          </label>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-1">
                          <button onClick={saveTazo} disabled={saving}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-ttg-success text-white text-[10px] font-black uppercase tracking-wider py-2 border-2 border-ttg-black shadow-[2px_2px_0px_var(--ttg-black)] hover:shadow-[1px_1px_0px_var(--ttg-black)] active:shadow-none transition-all disabled:opacity-50">
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                              saveStatus === "saved" ? <><Check className="w-3.5 h-3.5" /> Saved!</> :
                              saveStatus === "error" ? <><AlertTriangle className="w-3.5 h-3.5" /> Error</> :
                              <><Save className="w-3.5 h-3.5" /> Save</>}
                          </button>
                          <button onClick={cancelEdit}
                            className="flex items-center gap-1 bg-zinc-200 text-ttg-black text-[10px] font-black uppercase tracking-wider px-3 py-2 border-2 border-ttg-black shadow-[2px_2px_0px_var(--ttg-black)] hover:shadow-[1px_1px_0px_var(--ttg-black)] active:shadow-none transition-all">
                            <RotateCcw className="w-3.5 h-3.5" /> Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-6">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 3, totalPages - 6))
                  const p = start + i
                  if (p > totalPages) return null
                  return <button key={p} onClick={() => setPage(p)}
                    className={`w-9 h-9 border-2 text-xs font-black ${p === page ? "bg-ttg-black text-white border-ttg-black" : "bg-white border-zinc-300 text-zinc-600 hover:border-ttg-yellow"}`}>{p}</button>
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  )
}
