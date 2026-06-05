// ============================================================
// Trading Tazos Game — Deck Builder Component
// Step 1: Name & Color, Step 2: Select Tazos (0–20),
// Step 3: Choose 5 Battle Starters, Step 4: Save & Activate
// ============================================================
"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  Layers, Plus, Search, X, ChevronLeft, ChevronRight,
  Star, Sword, Shield, Zap, Save, Palette, Filter, CheckCircle,
} from "lucide-react"
import TazoDiscImage from "@/components/game/tazo-disc-image"

// ── Types ──────────────────────────────────────────────
interface TazoOption {
  id: string; name: string; displayName: string; number: string | number
  imageUrl: string | null; rarity: string; franchise: string; franchiseSlug: string
  attack: number; defense: number; resistance: number
  weight: number; stability: number; spin: number
  control: number; bounce: number; precision: number
  role?: string | null
}

const DECK_COLORS = [
  { name: "Red", value: "#E3350D" },
  { name: "Blue", value: "#3B4CCA" },
  { name: "Yellow", value: "#FFCC00" },
  { name: "Green", value: "#22C55E" },
  { name: "Orange", value: "#FF6B00" },
  { name: "Purple", value: "#A855F7" },
  { name: "Cyan", value: "#00A1E9" },
  { name: "Pink", value: "#EC4899" },
]

const FRANCHISE_COLORS: Record<string, string> = {
  minimon: "#FFCB05", cybermon: "#00A1E9", dracobell: "#FF6B00",
}

const RARITY_STARS: Record<string, string> = {
  common: "★", uncommon: "★★", rare: "★★★", ultra: "★★★★", legendary: "★★★★★",
}

const RARITY_COLOR: Record<string, string> = {
  common: "#9CA3AF", uncommon: "#22C55E", rare: "#3B82F6", ultra: "#A855F7", legendary: "#F59E0B",
}

interface DeckBuilderProps {
  initialDeck?: { id: string; name: string; color?: string; tazos: TazoOption[]; starters?: string[] } | null
  onSave: (data: { name: string; color: string; tazoIds: string[]; starterIds: string[] }) => void
  onCancel: () => void
}

export default function DeckBuilder({ initialDeck, onSave, onCancel }: DeckBuilderProps) {
  const { token } = useAuth()
  const [step, setStep] = useState(1)
  const [name, setName] = useState(initialDeck?.name || "")
  const [color, setColor] = useState(initialDeck?.color || "#E3350D")
  const [allTazos, setAllTazos] = useState<TazoOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialDeck?.tazos.map(t => t.id) || []))
  const [starterIds, setStarterIds] = useState<Set<string>>(new Set(initialDeck?.starters || []))
  const [search, setSearch] = useState("")
  const [franchiseFilter, setFranchiseFilter] = useState<string>("all")
  const [rarityFilter, setRarityFilter] = useState<string>("all")

  // Fetch tazos from API
  useEffect(() => {
    if (!token) return
    fetch("/api/tazos?limit=400", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        const mapped: TazoOption[] = (d.tazos || []).map((t: any) => ({
          id: t.id, name: t.name, displayName: t.displayName || t.name,
          number: t.number, imageUrl: t.imageUrl, rarity: t.rarity,
          franchise: t.franchise?.name || t.franchiseSlug || "minimon",
          franchiseSlug: t.franchiseSlug || t.franchise?.slug || "minimon",
          attack: t.attack || 50, defense: t.defense || 50, resistance: t.resistance || 50,
          weight: t.weight || 50, stability: t.stability || 50, spin: t.spin || 50,
          control: t.control || 50, bounce: t.bounce || 50, precision: t.precision || 50,
          role: t.role || null,
        }))
        setAllTazos(mapped)
        // Pre-select existing tazos
        if (initialDeck?.tazos?.length) {
          setSelectedIds(new Set(initialDeck.tazos.map(t => t.id)))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, initialDeck])

  // Filtered tazos
  const filteredTazos = useMemo(() => {
    return allTazos.filter(t => {
      if (franchiseFilter !== "all" && t.franchiseSlug !== franchiseFilter) return false
      if (rarityFilter !== "all" && t.rarity !== rarityFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!t.name.toLowerCase().includes(q) &&
            !(t.displayName || "").toLowerCase().includes(q) &&
            String(t.number) !== q) return false
      }
      return true
    })
  }, [allTazos, franchiseFilter, rarityFilter, search])

  const selectedTazos = useMemo(() =>
    allTazos.filter(t => selectedIds.has(t.id)),
    [allTazos, selectedIds]
  )

  const toggleTazo = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        // Also remove from starters
        setStarterIds(s => { const ns = new Set(s); ns.delete(id); return ns })
      } else {
        if (prev.size >= 20) return prev // max 20
        next.add(id)
      }
      return next
    })
  }

  const toggleStarter = (id: string) => {
    setStarterIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (prev.size >= 5) return prev
        next.add(id)
      }
      return next
    })
  }

  const totalPower = (t: TazoOption) =>
    t.attack + t.defense + t.resistance + t.weight + t.stability +
    t.spin + t.control + t.bounce + t.precision

  const canSave = name.trim().length > 0 && selectedIds.size >= 1

  // ── Step 1: Name & Color ──────────────────────────
  if (step === 1) {
    return (
      <div className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] bg-white">
        {/* Step indicator */}
        <div className="bg-[#1a1a1a] px-4 py-2 flex items-center gap-4">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${
                  s === step ? "bg-[#FFCC00] text-[#1a1a1a] border-[#FFCC00]" :
                  s < step ? "bg-[#22C55E] text-white border-[#22C55E]" :
                  "bg-white/10 text-white/40 border-white/20"
                }`}
              >
                {s < step ? "✓" : s}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider ${
                s === step ? "text-[#FFCC00]" : s < step ? "text-[#22C55E]" : "text-white/30"
              }`}>
                {["Name", "Tazos", "Starters", "Save"][s - 1]}
              </span>
            </div>
          ))}
        </div>

        <div className="p-6 space-y-5">
          <h3 className="text-lg font-black uppercase text-[#1a1a1a] tracking-wide">
            Step 1: Name Your Deck
          </h3>

          {/* Name input */}
          <div>
            <label className="block text-[10px] font-black uppercase text-[#1a1a1a]/50 mb-1 tracking-wider">
              Deck Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Fire Squad"
              className="w-full border-3 border-[#1a1a1a] px-4 py-3 text-sm font-bold text-[#1a1a1a] placeholder:text-[#1a1a1a]/25 bg-[#fffef0] shadow-[2px_2px_0px_#1a1a1a] focus:outline-none focus:border-[#FFCC00]"
              autoFocus
              onKeyDown={e => { if (e.key === "Enter" && name.trim()) setStep(2) }}
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-[10px] font-black uppercase text-[#1a1a1a]/50 mb-2 tracking-wider">
              <Palette className="w-3 h-3 inline mr-1" />
              Deck Color
            </label>
            <div className="flex flex-wrap gap-2">
              {DECK_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`w-9 h-9 rounded-full border-3 transition-all ${
                    color === c.value
                      ? "border-[#1a1a1a] scale-110 shadow-[2px_2px_0px_#1a1a1a]"
                      : "border-transparent hover:border-[#1a1a1a]/30"
                  }`}
                  style={{ background: c.value }}
                  title={c.name}
                  aria-label={`Deck color: ${c.name}`}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-[#fffef0] border-2 border-[#1a1a1a]">
            <div className="w-4 h-4 rounded-full border-2 border-[#1a1a1a]" style={{ background: color }} />
            <span className="text-sm font-black text-[#1a1a1a]">{name || "Unnamed Deck"}</span>
            <span className="text-[9px] font-bold text-[#1a1a1a]/30 ml-auto">{selectedIds.size}/20 tazos</span>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button onClick={onCancel} className="mag-btn px-4 py-2 text-[10px] font-black uppercase bg-white text-[#1a1a1a] border-3 border-[#1a1a1a]">
              <X className="w-3.5 h-3.5 inline mr-1" /> Cancel
            </button>
            <button
              onClick={() => name.trim() && setStep(2)}
              disabled={!name.trim()}
              className="mag-btn px-5 py-2 text-[10px] font-black uppercase bg-[#3B4CCA] text-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next: Select Tazos <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 2: Select Tazos ───────────────────────────
  if (step === 2) {
    return (
      <div className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] bg-white">
        {/* Step indicator */}
        <div className="bg-[#1a1a1a] px-4 py-2 flex items-center gap-4">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${
                  s === step ? "bg-[#FFCC00] text-[#1a1a1a] border-[#FFCC00]" :
                  s < step ? "bg-[#22C55E] text-white border-[#22C55E]" :
                  "bg-white/10 text-white/40 border-white/20"
                }`}
              >
                {s < step ? "✓" : s}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider hidden sm:inline ${
                s === step ? "text-[#FFCC00]" : s < step ? "text-[#22C55E]" : "text-white/30"
              }`}>
                {["Name", "Tazos", "Starters", "Save"][s - 1]}
              </span>
            </div>
          ))}
          <span className="ml-auto text-[10px] font-black text-[#FFCC00]">
            {selectedIds.size}/20
          </span>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black uppercase text-[#1a1a1a] tracking-wide">
              Step 2: Select Tazos
            </h3>
            <span className="text-[10px] font-bold text-[#1a1a1a]/40 uppercase">
              {selectedIds.size} of 20 selected
            </span>
          </div>

          {/* Search + filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a1a]/30" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tazos..."
                className="w-full pl-8 pr-3 py-2 text-xs font-bold text-[#1a1a1a] placeholder:text-[#1a1a1a]/25 bg-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] focus:outline-none focus:border-[#FFCC00]"
              />
            </div>
            <select
              value={franchiseFilter}
              onChange={e => setFranchiseFilter(e.target.value)}
              className="px-3 py-2 text-[10px] font-black uppercase border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]"
            >
              <option value="all">All Series</option>
              <option value="minimon">Minimon</option>
              <option value="cybermon">Cybermon</option>
              <option value="dracobell">Dracobell</option>
            </select>
            <select
              value={rarityFilter}
              onChange={e => setRarityFilter(e.target.value)}
              className="px-3 py-2 text-[10px] font-black uppercase border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]"
            >
              <option value="all">All Rarities</option>
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="ultra">Ultra</option>
              <option value="legendary">Legendary</option>
            </select>
          </div>

          {/* Tazo grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="mag-spinner w-8 h-8 rounded-full border-3 border-[#FFCC00] border-t-[#E3350D]" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[50vh] overflow-y-auto p-1">
              {filteredTazos.map(tazo => {
                const isSelected = selectedIds.has(tazo.id)
                const franchiseBorder = FRANCHISE_COLORS[tazo.franchiseSlug] || "#1a1a1a"
                return (
                  <button
                    key={tazo.id}
                    onClick={() => toggleTazo(tazo.id)}
                    className={`text-left border-2 transition-all ${
                      isSelected
                        ? "border-[#FFCC00] bg-[#FFCC00]/10 shadow-[2px_2px_0px_#FFCC00] -translate-y-0.5"
                        : "border-[#1a1a1a]/15 bg-white hover:border-[#1a1a1a]/40"
                    }`}
                  >
                    {/* Franchise color strip */}
                    <div className="h-1" style={{ background: franchiseBorder }} />
                    <div className="p-2">
                      <div className="flex items-center gap-2">
                        {/* Mini disc */}
                        <div
                          className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-[#1a1a1a]/20 flex items-center justify-center overflow-hidden"
                          style={{ background: franchiseBorder + "20" }}
                        >
                          <TazoDiscImage src={tazo.imageUrl} alt={tazo.name} size="100%" scale={1.1} borderWidth={0} franchiseSlug={tazo.franchiseSlug} lazy className="w-full h-full" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black text-[#1a1a1a] truncate leading-tight">
                            {tazo.displayName || tazo.name}
                          </p>
                          <p className="text-[8px] font-bold text-[#1a1a1a]/30 uppercase">
                            {tazo.franchise} #{tazo.number}
                          </p>
                          <div className="flex gap-1 mt-0.5">
                            <span className="text-[7px] font-bold" style={{ color: RARITY_COLOR[tazo.rarity] || "#9CA3AF" }}>
                              {RARITY_STARS[tazo.rarity]}
                            </span>
                            <span className="text-[7px] font-bold text-[#E3350D]">{tazo.attack}</span>
                            <span className="text-[7px] font-bold text-[#3B4CCA]">{tazo.defense}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Selected preview strip */}
          {selectedTazos.length > 0 && (
            <div className="border-t-2 border-[#1a1a1a]/10 pt-3">
              <p className="text-[9px] font-black uppercase text-[#1a1a1a]/40 mb-2 tracking-wider">
                Selected ({selectedTazos.length}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedTazos.map(t => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[8px] font-black bg-[#FFCC00]/20 border border-[#FFCC00] text-[#1a1a1a] rounded-sm"
                  >
                    {t.displayName || t.name}
                    <X
                      className="w-2.5 h-2.5 cursor-pointer text-[#E3350D]"
                      onClick={(e) => { e.stopPropagation(); toggleTazo(t.id) }}
                    />
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-2 border-t-2 border-[#1a1a1a]/10">
            <button onClick={() => setStep(1)} className="mag-btn px-4 py-2 text-[10px] font-black uppercase bg-white text-[#1a1a1a] border-3 border-[#1a1a1a]">
              <ChevronLeft className="w-3.5 h-3.5 inline mr-1" /> Back
            </button>
            <button
              onClick={() => selectedIds.size >= 1 && setStep(3)}
              disabled={selectedIds.size < 1}
              className="mag-btn px-5 py-2 text-[10px] font-black uppercase bg-[#3B4CCA] text-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next: Starters <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 3: Choose 5 Battle Starters ─────────────────
  if (step === 3) {
    return (
      <div className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] bg-white">
        {/* Step indicator */}
        <div className="bg-[#1a1a1a] px-4 py-2 flex items-center gap-4">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${
                  s === step ? "bg-[#FFCC00] text-[#1a1a1a] border-[#FFCC00]" :
                  s < step ? "bg-[#22C55E] text-white border-[#22C55E]" :
                  "bg-white/10 text-white/40 border-white/20"
                }`}
              >
                {s < step ? "✓" : s}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider hidden sm:inline ${
                s === step ? "text-[#FFCC00]" : s < step ? "text-[#22C55E]" : "text-white/30"
              }`}>
                {["Name", "Tazos", "Starters", "Save"][s - 1]}
              </span>
            </div>
          ))}
          <span className="ml-auto text-[10px] font-black text-[#FFCC00]">
            {starterIds.size}/5 starters
          </span>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black uppercase text-[#1a1a1a] tracking-wide">
                Step 3: Choose Battle Starters
              </h3>
              <p className="text-[10px] font-bold text-[#1a1a1a]/40 mt-0.5">
                Pick up to 5 tazos that will start each battle in your active hand
              </p>
            </div>
            <span className="text-[10px] font-bold text-[#E3350D] uppercase">
              {starterIds.size}/5
            </span>
          </div>

          {/* Selected tazos grid — click to toggle starter */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {selectedTazos.map(tazo => {
              const isStarter = starterIds.has(tazo.id)
              const franchiseBorder = FRANCHISE_COLORS[tazo.franchiseSlug] || "#1a1a1a"
              return (
                <button
                  key={tazo.id}
                  onClick={() => toggleStarter(tazo.id)}
                  className={`text-left border-2 transition-all relative ${
                    isStarter
                      ? "border-[#E3350D] bg-[#E3350D]/5 shadow-[2px_2px_0px_#E3350D] -translate-y-0.5"
                      : "border-[#1a1a1a]/15 bg-white hover:border-[#1a1a1a]/40"
                  }`}
                >
                  {isStarter && (
                    <div className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 rounded-full bg-[#E3350D] border-2 border-[#1a1a1a] flex items-center justify-center">
                      <Sword className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="h-1" style={{ background: franchiseBorder }} />
                  <div className="p-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-[#1a1a1a]/20 flex items-center justify-center overflow-hidden"
                        style={{ background: franchiseBorder + "20" }}
                      >
                        <TazoDiscImage src={tazo.imageUrl} alt={tazo.name} size="100%" scale={1.1} borderWidth={0} franchiseSlug={tazo.franchiseSlug} lazy className="w-full h-full" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-[#1a1a1a] truncate">
                          {tazo.displayName || tazo.name}
                        </p>
                        <p className="text-[8px] font-bold text-[#1a1a1a]/30">
                          {totalPower(tazo)} TP
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Starter summary */}
          {starterIds.size > 0 && (
            <div className="bg-[#E3350D]/5 border-2 border-[#E3350D] p-3">
              <p className="text-[9px] font-black uppercase text-[#E3350D] mb-1 tracking-wider">
                Battle Starters:
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedTazos.filter(t => starterIds.has(t.id)).map(t => (
                  <span key={t.id} className="text-[9px] font-black text-[#1a1a1a]">
                    {t.displayName || t.name}{" · "}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-2 border-t-2 border-[#1a1a1a]/10">
            <button onClick={() => setStep(2)} className="mag-btn px-4 py-2 text-[10px] font-black uppercase bg-white text-[#1a1a1a] border-3 border-[#1a1a1a]">
              <ChevronLeft className="w-3.5 h-3.5 inline mr-1" /> Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="mag-btn px-5 py-2 text-[10px] font-black uppercase bg-[#22C55E] text-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]"
            >
              Review & Save <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 4: Review & Save ────────────────────────────
  if (step === 4) {
    const starterTazos = selectedTazos.filter(t => starterIds.has(t.id))
    const avgAttack = selectedTazos.length > 0
      ? Math.round(selectedTazos.reduce((s, t) => s + t.attack, 0) / selectedTazos.length)
      : 0
    const avgDefense = selectedTazos.length > 0
      ? Math.round(selectedTazos.reduce((s, t) => s + t.defense, 0) / selectedTazos.length)
      : 0
    const totalP = selectedTazos.reduce((s, t) => s + totalPower(t), 0)

    return (
      <div className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] bg-white">
        {/* Step indicator */}
        <div className="bg-[#1a1a1a] px-4 py-2 flex items-center gap-4">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${
                  s === step ? "bg-[#FFCC00] text-[#1a1a1a] border-[#FFCC00]" :
                  s < step ? "bg-[#22C55E] text-white border-[#22C55E]" :
                  "bg-white/10 text-white/40 border-white/20"
                }`}
              >
                {s < step ? "✓" : s}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider hidden sm:inline ${
                s === step ? "text-[#FFCC00]" : s < step ? "text-[#22C55E]" : "text-white/30"
              }`}>
                {["Name", "Tazos", "Starters", "Save"][s - 1]}
              </span>
            </div>
          ))}
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <h3 className="text-lg font-black uppercase text-[#1a1a1a] tracking-wide flex items-center gap-2">
            <Save className="w-5 h-5 text-[#22C55E]" />
            Review & Save
          </h3>

          {/* Deck summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 border-2 border-[#1a1a1a] bg-[#fffef0] text-center">
              <div className="text-[8px] font-black uppercase text-[#1a1a1a]/40 tracking-wider mb-1">Name</div>
              <div className="text-sm font-black text-[#1a1a1a]">{name}</div>
            </div>
            <div className="p-3 border-2 border-[#1a1a1a] bg-[#fffef0] text-center">
              <div className="text-[8px] font-black uppercase text-[#1a1a1a]/40 tracking-wider mb-1">Tazos</div>
              <div className="text-sm font-black text-[#3B4CCA]">{selectedIds.size}/20</div>
            </div>
            <div className="p-3 border-2 border-[#1a1a1a] bg-[#fffef0] text-center">
              <div className="text-[8px] font-black uppercase text-[#1a1a1a]/40 tracking-wider mb-1">Starters</div>
              <div className="text-sm font-black text-[#E3350D]">{starterIds.size}/5</div>
            </div>
            <div className="p-3 border-2 border-[#1a1a1a] bg-[#fffef0] text-center">
              <div className="text-[8px] font-black uppercase text-[#1a1a1a]/40 tracking-wider mb-1">Total Power</div>
              <div className="text-sm font-black text-[#FFCC00]">{totalP}</div>
            </div>
          </div>

          {/* Color preview */}
          <div className="flex items-center gap-2 p-2 bg-[#fffef0] border-2 border-[#1a1a1a]">
            <div className="w-5 h-5 rounded-full border-2 border-[#1a1a1a]" style={{ background: color }} />
            <span className="text-[10px] font-black text-[#1a1a1a]">Deck Color: {DECK_COLORS.find(c => c.value === color)?.name || "Custom"}</span>
          </div>

          {/* Starters preview */}
          {starterTazos.length > 0 && (
            <div>
              <p className="text-[9px] font-black uppercase text-[#1a1a1a]/40 mb-2 tracking-wider">
                Battle Starters ({starterTazos.length}):
              </p>
              <div className="flex gap-2 flex-wrap">
                {starterTazos.map(t => {
                  const fColor = FRANCHISE_COLORS[t.franchiseSlug] || "#1a1a1a"
                  return (
                    <div key={t.id} className="flex items-center gap-1.5 p-1.5 border-2 border-[#1a1a1a] bg-white">
                      <div className="w-8 h-8 rounded-full border border-[#1a1a1a]/20 overflow-hidden flex-shrink-0" style={{ background: fColor + "20" }}>
                        <TazoDiscImage src={t.imageUrl} alt={t.name} size="100%" scale={1.05} borderWidth={0} franchiseSlug={t.franchiseSlug} lazy className="w-full h-full" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-[#1a1a1a]">{t.displayName || t.name}</p>
                        <p className="text-[7px] font-bold text-[#E3350D]">ATK {t.attack} · DEF {t.defense}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-2 border-t-2 border-[#1a1a1a]/10">
            <button onClick={() => setStep(3)} className="mag-btn px-4 py-2 text-[10px] font-black uppercase bg-white text-[#1a1a1a] border-3 border-[#1a1a1a]">
              <ChevronLeft className="w-3.5 h-3.5 inline mr-1" /> Back
            </button>
            <button
              onClick={() => onSave({
                name, color,
                tazoIds: Array.from(selectedIds),
                starterIds: Array.from(starterIds),
              })}
              disabled={!canSave}
              className="mag-btn px-6 py-2.5 text-[11px] font-black uppercase bg-[#22C55E] text-white border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#1a1a1a] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Save className="w-4 h-4 inline mr-1.5" />
              Save Deck
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
