"use client"

// ============================================================
// Trading Tazos Game — Admin Tazo Manager
// Professional grid view for developer-only tazo management
// ============================================================
import { useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  Shield, Loader2, Search, Filter, X, Edit3, Save, RotateCcw,
  ChevronLeft, ChevronRight, Image as ImageIcon, Star, Check,
  AlertTriangle, Sparkles,
} from "lucide-react"
import Link from "next/link"

// ── Types ──
interface TazoFranchise { name: string; slug: string }
interface TazoData {
  id: string; name: string; displayName: string | null; slug: string
  franchiseId: string; number: string; rarity: string
  imageUrl: string | null; finish: string; creatureVariant: string
  skill: string | null; skillDesc: string | null; role: string | null; combatType: string | null
  attack: number; defense: number; resistance: number; weight: number
  stability: number; spin: number; control: number; bounce: number; precision: number
  isOwned: boolean; stackable: boolean; maxStackOn: number
  franchise: TazoFranchise
}
interface Franchise { id: string; name: string; slug: string }

const RARITIES = ["common", "uncommon", "rare", "ultra", "legendary", "epic"]
const FINISHES = ["normal", "holo", "reverse_holo", "gold", "rainbow", "matte"]
const ROLES = ["attacker", "tank", "technical", "bouncer", "heavy", "light", "balanced", "special"]
const COMBAT_TYPES = ["melee", "ranged", "hybrid", "support"]

const FRANCHISE_COLORS: Record<string, string> = {
  minimon: "#FFCB05",
  cybermon: "#00A1E9",
  dracobell: "#FF6B00",
  "draco-bell": "#FF6B00",
}
const RARITY_COLORS: Record<string, string> = {
  common: "#9CA3AF", uncommon: "#22C55E", rare: "#3B82F6",
  ultra: "#A855F7", legendary: "#FBBF24", epic: "#EF4444",
}
const RARITY_STARS: Record<string, number> = {
  common: 1, uncommon: 2, rare: 3, epic: 4, ultra: 4, legendary: 5,
}

// ── Main ──
export default function AdminTazoManagerPage() {
  const { user, loading: authLoading } = useAuth()
  const isAdmin = user?.email === "dev@tradingtazosgame.com"

  // Data
  const [tazos, setTazos] = useState<TazoData[]>([])
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [franchiseFilter, setFranchiseFilter] = useState("")
  const [rarityFilter, setRarityFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<TazoData> | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle")

  // ── Fetch tazos ──
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
      // Update local state
      setTazos(prev => prev.map(t => t.id === editingId ? data.tazo : t))
      setSaveStatus("saved")
      setTimeout(() => { setEditingId(null); setEditData(null); setSaveStatus("idle") }, 800)
    } catch (e) {
      console.error("Save failed", e)
      setSaveStatus("error")
    }
    setSaving(false)
  }

  // ── Rarity color dot ──
  const RarityDot = ({ rarity }: { rarity: string }) => (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full border border-white/20"
      style={{ background: RARITY_COLORS[rarity] || "#9CA3AF" }}
      title={rarity}
    />
  )

  // ── Stat bar mini ──
  const MiniStatBar = ({ value, color }: { value: number; color: string }) => (
    <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
    </div>
  )

  // ── Loading / Access check ──
  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-[#FFCC00]" /></div>
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center mag-bg">
        <div className="mag-card p-8 text-center max-w-md mx-4 space-y-4">
          <Shield className="w-16 h-16 mx-auto text-[#E3350D]" />
          <h1 className="text-xl font-black uppercase text-[#1a1a1a]">Access Denied</h1>
          <p className="text-sm font-bold text-[#1a1a1a]/50">This panel is restricted to the developer account.</p>
          <Link href="/" className="mag-btn inline-block bg-[#E3350D] text-white px-6 py-3 text-xs font-black uppercase tracking-wider border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">Back to Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen mag-bg">
      {/* ── Header ── */}
      <header className="bg-[#1a1a1a] border-b-4 border-[#E3350D] sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#E3350D]" />
            <Link href="/admin" className="text-sm font-black text-zinc-400 hover:text-white uppercase tracking-wider">Admin</Link>
            <span className="text-zinc-600">/</span>
            <h1 className="text-lg font-black text-white uppercase tracking-wider">Tazo Manager</h1>
            <span className="text-[10px] font-bold text-zinc-500 ml-2">({total} tazos)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-zinc-400">{user?.email}</span>
            <Link href="/app/collection" className="text-[10px] font-black text-[#FFCC00] hover:text-white uppercase tracking-wider">Dashboard →</Link>
          </div>
        </div>
      </header>

      {/* ── Filter Bar ── */}
      <div className="max-w-[1600px] mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center gap-3 bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] rounded-2xl p-3">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="flex-1 bg-transparent text-sm font-bold text-[#1a1a1a] placeholder:text-zinc-300 outline-none py-1"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-zinc-400 hover:text-[#E3350D]">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Franchise filter */}
          <select
            value={franchiseFilter}
            onChange={e => { setFranchiseFilter(e.target.value); setPage(1) }}
            className="bg-zinc-50 border-2 border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-bold text-[#1a1a1a] outline-none focus:border-[#FFCC00]"
          >
            <option value="">All Franchises</option>
            {franchises.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          {/* Rarity filter */}
          <select
            value={rarityFilter}
            onChange={e => { setRarityFilter(e.target.value); setPage(1) }}
            className="bg-zinc-50 border-2 border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-bold text-[#1a1a1a] outline-none focus:border-[#FFCC00]"
          >
            <option value="">All Rarities</option>
            {RARITIES.map(r => (
              <option key={r} value={r} className="font-bold">{r.charAt(0).toUpperCase() + r.slice(1)}</option>
            ))}
          </select>

          {/* Clear filters */}
          {(franchiseFilter || rarityFilter || search) && (
            <button
              onClick={() => { setFranchiseFilter(""); setRarityFilter(""); setSearch(""); setPage(1) }}
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#E3350D] hover:underline"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}

          {/* Stats summary */}
          <div className="ml-auto flex items-center gap-4 text-[10px] font-bold text-zinc-400">
            <span>Showing {tazos.length} of {total}</span>
            {rarityFilter && <span className="text-[#FFCC00]">| {rarityFilter}</span>}
            {franchiseFilter && (
              <span style={{ color: FRANCHISE_COLORS[franchises.find(f => f.id === franchiseFilter)?.slug || ""] || "#FFCC00" }}>
                | {franchises.find(f => f.id === franchiseFilter)?.name || franchiseFilter}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Tazo Grid ── */}
      <div className="max-w-[1600px] mx-auto px-4 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#FFCC00]" />
          </div>
        ) : tazos.length === 0 ? (
          <div className="text-center py-20 text-sm font-bold text-zinc-400">
            No tazos found. Try adjusting your filters.
          </div>
        ) : (
          <>
            {/* ── Pagination top ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-zinc-400">Page {page} of {totalPages}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border-2 border-zinc-300 bg-white disabled:opacity-30 hover:border-[#FFCC00] transition-colors"
                  ><ChevronLeft className="w-4 h-4" /></button>
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                    const p = start + i
                    if (p > totalPages) return null
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-lg border-2 text-xs font-black transition-colors ${
                          p === page
                            ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                            : "bg-white border-zinc-300 text-zinc-600 hover:border-[#FFCC00]"
                        }`}
                      >{p}</button>
                    )
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border-2 border-zinc-300 bg-white disabled:opacity-30 hover:border-[#FFCC00] transition-colors"
                  ><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}

            {/* ── Grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {tazos.map(tazo => {
                const isEditing = editingId === tazo.id
                const fColor = FRANCHISE_COLORS[tazo.franchise.slug] || "#999"
                const rColor = RARITY_COLORS[tazo.rarity] || "#999"

                return (
                  <div
                    key={tazo.id}
                    className={`mag-card rounded-xl border-3 transition-all duration-200 ${
                      isEditing
                        ? "border-[#FFCC00] shadow-[0_0_20px_rgba(255,204,0,0.2)] ring-2 ring-[#FFCC00]/30 scale-[1.02] z-10"
                        : "border-[#1a1a1a]/10 shadow-[2px_2px_0px_#1a1a1a10] hover:shadow-[3px_3px_0px_#1a1a1a20] hover:border-[#1a1a1a]/20"
                    } bg-white overflow-hidden`}
                  >
                    {/* Tazo image */}
                    {!isEditing ? (
                      /* ── VIEW MODE ── */
                      <button
                        onClick={() => startEdit(tazo)}
                        className="w-full text-left group cursor-pointer"
                      >
                        {/* Image area */}
                        <div className="relative aspect-square bg-zinc-50 flex items-center justify-center overflow-hidden">
                          {tazo.imageUrl ? (
                            <img
                              src={tazo.imageUrl}
                              alt={tazo.name}
                              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <ImageIcon className="w-10 h-10 text-zinc-300" />
                          )}
                          {/* Franchise color bar */}
                          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: fColor }} />
                          {/* Rarity badge */}
                          <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-[#1a1a1a]/80 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                            {Array.from({ length: RARITY_STARS[tazo.rarity] || 1 }, (_, i) => (
                              <Star key={i} className="w-2 h-2" fill={rColor} stroke={rColor} />
                            ))}
                          </div>
                          {/* Edit overlay */}
                          <div className="absolute inset-0 bg-[#1a1a1a]/0 group-hover:bg-[#1a1a1a]/30 transition-colors flex items-center justify-center">
                            <Edit3 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                          </div>
                        </div>
                        {/* Info */}
                        <div className="p-2.5 space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <RarityDot rarity={tazo.rarity} />
                            <span className="text-[11px] font-black text-[#1a1a1a] truncate leading-tight">
                              {tazo.name || tazo.slug}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                            <span>{tazo.franchise.name}</span>
                            <span>·</span>
                            <span>{tazo.rarity}</span>
                            {tazo.finish !== "normal" && (
                              <><span>·</span><span className="text-[#FFCC00]">{tazo.finish}</span></>
                            )}
                          </div>
                          {/* Mini stat bars */}
                          <div className="flex gap-1 pt-0.5">
                            {[
                              { v: tazo.attack, c: "#E3350D", l: "ATK" },
                              { v: tazo.defense, c: "#3B4CCA", l: "DEF" },
                              { v: tazo.resistance, c: "#22C55E", l: "RES" },
                              { v: tazo.weight, c: "#F59E0B", l: "WT" },
                              { v: tazo.stability, c: "#A855F7", l: "STB" },
                            ].map(s => (
                              <div key={s.l} className="flex-1 flex flex-col items-center gap-0.5">
                                <MiniStatBar value={s.v} color={s.c} />
                                <span className="text-[7px] font-black text-zinc-400">{s.l}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </button>
                    ) : (
                      /* ── EDIT MODE ── */
                      <div className="p-3 space-y-3">
                        {/* Image preview */}
                        <div className="relative aspect-square bg-zinc-50 rounded-lg flex items-center justify-center overflow-hidden border-2 border-zinc-200">
                          {editData?.imageUrl ? (
                            <img src={editData.imageUrl} alt={editData.name || ""} className="w-full h-full object-contain p-2" />
                          ) : (
                            <ImageIcon className="w-10 h-10 text-zinc-300" />
                          )}
                          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: fColor }} />
                        </div>

                        {/* Name + franchise */}
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={editData?.name || ""}
                            onChange={e => updateField("name", e.target.value)}
                            className="w-full text-xs font-black text-[#1a1a1a] bg-zinc-50 border-2 border-zinc-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#FFCC00]"
                            placeholder="Name"
                          />
                          <div className="flex gap-1.5 text-[10px] font-bold text-zinc-500">
                            <span>{tazo.franchise.name}</span>
                            <span>·</span>
                            <span>{tazo.number}</span>
                          </div>
                        </div>

                        {/* Rarity + Finish */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-0.5 block">Rarity</label>
                            <select
                              value={editData?.rarity || "common"}
                              onChange={e => updateField("rarity", e.target.value)}
                              className="w-full text-[10px] font-bold bg-zinc-50 border-2 border-zinc-200 rounded-lg px-2 py-1 outline-none focus:border-[#FFCC00]"
                            >
                              {RARITIES.map(r => (
                                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-0.5 block">Finish</label>
                            <select
                              value={editData?.finish || "normal"}
                              onChange={e => updateField("finish", e.target.value)}
                              className="w-full text-[10px] font-bold bg-zinc-50 border-2 border-zinc-200 rounded-lg px-2 py-1 outline-none focus:border-[#FFCC00]"
                            >
                              {FINISHES.map(f => (
                                <option key={f} value={f}>{f.replace("_", " ")}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Role + Combat Type */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-0.5 block">Role</label>
                            <select
                              value={editData?.role || "balanced"}
                              onChange={e => updateField("role", e.target.value)}
                              className="w-full text-[10px] font-bold bg-zinc-50 border-2 border-zinc-200 rounded-lg px-2 py-1 outline-none focus:border-[#FFCC00]"
                            >
                              {ROLES.map(r => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-0.5 block">Combat</label>
                            <select
                              value={editData?.combatType || ""}
                              onChange={e => updateField("combatType", e.target.value)}
                              className="w-full text-[10px] font-bold bg-zinc-50 border-2 border-zinc-200 rounded-lg px-2 py-1 outline-none focus:border-[#FFCC00]"
                            >
                              <option value="">—</option>
                              {COMBAT_TYPES.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Stats grid — 9 stats */}
                        <div>
                          <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-1 block">Stats</label>
                          <div className="grid grid-cols-3 gap-1">
                            {([
                              ["ATK", "attack", "#E3350D"],
                              ["DEF", "defense", "#3B4CCA"],
                              ["RES", "resistance", "#22C55E"],
                              ["WT", "weight", "#F59E0B"],
                              ["STB", "stability", "#A855F7"],
                              ["SPIN", "spin", "#EC4899"],
                              ["CTRL", "control", "#06B6D4"],
                              ["BNC", "bounce", "#F97316"],
                              ["PREC", "precision", "#8B5CF6"],
                            ] as const).map(([label, field, color]) => (
                              <div key={field} className="flex items-center gap-1 bg-zinc-50 rounded-lg px-1.5 py-1 border border-zinc-200">
                                <span className="text-[7px] font-black text-zinc-400 w-8">{label}</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={editData?.[field as keyof TazoData] as number || 0}
                                  onChange={e => updateField(field, Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                  className="w-full text-[10px] font-bold text-right bg-transparent outline-none"
                                  style={{ color }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Skill */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-0.5 block">Skill</label>
                            <input
                              type="text"
                              value={editData?.skill || ""}
                              onChange={e => updateField("skill", e.target.value)}
                              className="w-full text-[10px] font-bold bg-zinc-50 border-2 border-zinc-200 rounded-lg px-2 py-1 outline-none focus:border-[#FFCC00]"
                              placeholder="Skill name"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-0.5 block">Variant</label>
                            <input
                              type="text"
                              value={editData?.creatureVariant || "standard"}
                              onChange={e => updateField("creatureVariant", e.target.value)}
                              className="w-full text-[10px] font-bold bg-zinc-50 border-2 border-zinc-200 rounded-lg px-2 py-1 outline-none focus:border-[#FFCC00]"
                            />
                          </div>
                        </div>

                        {/* Skill Desc */}
                        <div>
                          <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-0.5 block">Description</label>
                          <textarea
                            value={editData?.skillDesc || ""}
                            onChange={e => updateField("skillDesc", e.target.value)}
                            className="w-full text-[10px] font-bold bg-zinc-50 border-2 border-zinc-200 rounded-lg px-2 py-1 outline-none focus:border-[#FFCC00] resize-none h-12"
                            placeholder="Skill description..."
                          />
                        </div>

                        {/* Toggles */}
                        <div className="flex gap-3">
                          <label className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editData?.isOwned || false}
                              onChange={e => updateField("isOwned", e.target.checked)}
                              className="w-3.5 h-3.5 accent-[#FFCC00]"
                            />
                            Owned
                          </label>
                          <label className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editData?.stackable !== false}
                              onChange={e => updateField("stackable", e.target.checked)}
                              className="w-3.5 h-3.5 accent-[#FFCC00]"
                            />
                            Stackable
                          </label>
                        </div>

                        {/* Image URL */}
                        <div>
                          <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider mb-0.5 block">Image URL</label>
                          <input
                            type="text"
                            value={editData?.imageUrl || ""}
                            onChange={e => updateField("imageUrl", e.target.value)}
                            className="w-full text-[10px] font-mono bg-zinc-50 border-2 border-zinc-200 rounded-lg px-2 py-1 outline-none focus:border-[#FFCC00]"
                          />
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={saveTazo}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-[#22C55E] text-white text-[10px] font-black uppercase tracking-wider py-2 rounded-lg border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] active:shadow-none transition-all disabled:opacity-50"
                          >
                            {saving ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : saveStatus === "saved" ? (
                              <><Check className="w-3.5 h-3.5" /> Saved!</>
                            ) : saveStatus === "error" ? (
                              <><AlertTriangle className="w-3.5 h-3.5" /> Error</>
                            ) : (
                              <><Save className="w-3.5 h-3.5" /> Save</>
                            )}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1 bg-zinc-200 text-[#1a1a1a] text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-lg border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] active:shadow-none transition-all"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* ── Pagination bottom ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-6">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 3, totalPages - 6))
                  const p = start + i
                  if (p > totalPages) return null
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg border-2 text-xs font-black transition-colors ${
                        p === page
                          ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                          : "bg-white border-zinc-300 text-zinc-600 hover:border-[#FFCC00]"
                      }`}
                    >{p}</button>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
