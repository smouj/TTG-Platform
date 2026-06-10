// ============================================================
// Trading Tazos Game — Battle Tube Builder
// Step 1: Name & Color, Step 2: Fill Tube, Step 3: Pick Starters,
// Step 4: Review & Seal
// ============================================================
"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  Search, X, ChevronLeft, ChevronRight,
  Star, Sword, Shield, Zap, Save, Palette, Filter, CheckCircle, PackageOpen,
} from "lucide-react"
import TazoDiscImage from "@/components/game/tazo-disc-image"
import BattleTubePreview, { TUBE_TEXTURE_OPTIONS } from "@/components/tubes/BattleTubePreview"

// ── Types ──────────────────────────────────────────────
interface TazoOption {
  id: string; name: string; displayName: string; number: string | number
  imageUrl: string | null; rarity: string; franchise: string; franchiseSlug: string
  attack: number; defense: number; resistance: number
  weight: number; stability: number; spin: number
  control: number; bounce: number; precision: number
  role?: string | null
  finish?: string | null; creatureVariant?: string | null; shinyImageUrl?: string | null
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
  initialDeck?: { id: string; name: string; color?: string; textureUrl?: string; tubeSlug?: string; tazos: TazoOption[]; starters?: string[] } | null
  onSave: (data: { name: string; color: string; tazoIds: string[]; starterIds: string[]; textureUrl?: string; tubeSlug?: string }) => void
  onCancel: () => void
}

const STEP_LABELS = ["Name", "Tazos", "Starters", "Seal"]

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="bg-[#1a1a1a] px-4 py-2 flex items-center gap-3 overflow-x-auto">
      {STEP_LABELS.map((label, idx) => {
        const s = idx + 1
        return (
          <div key={s} className="flex items-center gap-1.5 flex-shrink-0">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${
                s === step ? "bg-[#FFCC00] text-[#1a1a1a] border-[#FFCC00]" :
                s < step ? "bg-[#22C55E] text-white border-[#22C55E]" :
                "bg-white/10 text-white/40 border-white/20"
              }`}
            >
              {s < step ? <CheckCircle className="w-3 h-3" /> : s}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-wider ${
              s === step ? "text-[#FFCC00]" : s < step ? "text-[#22C55E]" : "text-white/30"
            }`}>
              {label}
            </span>
            {s < 4 && <span className="text-white/10 font-black text-[9px]">›</span>}
          </div>
        )
      })}
    </div>
  )
}

export default function DeckBuilder({ initialDeck, onSave, onCancel }: DeckBuilderProps) {
  const { token } = useAuth()
  const [step, setStep] = useState(1)
  const [name, setName] = useState(initialDeck?.name || "")
  const [color, setColor] = useState(initialDeck?.color || "#E3350D")
  // Tube texture selection (replaces old color cap picker)
  const initTexture = initialDeck?.textureUrl || TUBE_TEXTURE_OPTIONS[0].textureUrl
  const initSlug = initialDeck?.tubeSlug || TUBE_TEXTURE_OPTIONS[0].slug
  const [tubeTexture, setTubeTexture] = useState(initTexture)
  const [tubeSlug, setTubeSlug] = useState(initSlug)
  const [allTazos, setAllTazos] = useState<TazoOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialDeck?.tazos.map(t => t.id) || []))
  const [starterIds, setStarterIds] = useState<Set<string>>(new Set(initialDeck?.starters || []))
  const [search, setSearch] = useState("")
  const [franchiseFilter, setFranchiseFilter] = useState<string>("all")
  const [rarityFilter, setRarityFilter] = useState<string>("all")

  useEffect(() => {
    if (!token) return
    fetch("/api/tazos?limit=400", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const mapped: TazoOption[] = (d.tazos || []).map((t: any) => ({
          id: t.id, name: t.name, displayName: t.displayName || t.name,
          number: t.number, imageUrl: t.imageUrl, rarity: t.rarity,
          franchise: t.franchiseName || t.franchiseSlug || "minimon",
          franchiseSlug: t.franchiseSlug || t.franchise || "minimon",
          attack: t.attack || 50, defense: t.defense || 50, resistance: t.resistance || 50,
          weight: t.weight || 50, stability: t.stability || 50, spin: t.spin || 50,
          control: t.control || 50, bounce: t.bounce || 50, precision: t.precision || 50,
          role: t.role || null,
          finish: t.finish || null, creatureVariant: t.creatureVariant || null, shinyImageUrl: t.shinyImageUrl || null,
        }))
        setAllTazos(mapped)
        if (initialDeck?.tazos?.length) {
          setSelectedIds(new Set(initialDeck.tazos.map(t => t.id)))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, initialDeck])

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
        setStarterIds(s => { const ns = new Set(s); ns.delete(id); return ns })
      } else {
        if (prev.size >= 20) return prev
        next.add(id)
      }
      return next
    })
  }

  const toggleStarter = (id: string) => {
    setStarterIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else { if (prev.size >= 5) return prev; next.add(id) }
      return next
    })
  }

  const totalPower = (t: TazoOption) =>
    t.attack + t.defense + t.resistance + t.weight + t.stability +
    t.spin + t.control + t.bounce + t.precision

  const canSave = name.trim().length > 0 && selectedIds.size >= 1

  // ════════════════════════════════════════════════════════
  // STEP 1: Name Your Battle Tube
  // ════════════════════════════════════════════════════════
  if (step === 1) {
    return (
      <div className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] bg-white">
        <StepIndicator step={1} />
        <div className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Form */}
            <div className="flex-1 space-y-5">
              <div>
                <h3 className="text-lg font-black uppercase text-[#1a1a1a] tracking-wide flex items-center gap-2">
                  <PackageOpen className="w-5 h-5 text-[#FFCC00]" />
                  Step 1: Name Your Battle Tube
                </h3>
                <p className="text-[10px] font-bold text-[#1a1a1a]/35 mt-0.5">
                  Give your tube a name and pick a cap color
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-[#1a1a1a]/50 mb-1 tracking-wider">
                  Tube Name
                </label>
                <input
                  type="text" value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Fire Squad"
                  className="w-full border-3 border-[#1a1a1a] px-4 py-3 text-sm font-bold text-[#1a1a1a] placeholder:text-[#1a1a1a]/25 bg-[#fffef0] shadow-[2px_2px_0px_#1a1a1a] focus:outline-none focus:border-[#FFCC00]"
                  autoFocus
                  onKeyDown={e => { if (e.key === "Enter" && name.trim()) setStep(2) }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-[#1a1a1a]/50 mb-2 tracking-wider">
                  <Palette className="w-3 h-3 inline mr-1" />
                  Tube Texture
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {TUBE_TEXTURE_OPTIONS.map(opt => (
                    <button
                      key={opt.slug}
                      onClick={() => { setTubeTexture(opt.textureUrl); setTubeSlug(opt.slug); setColor(opt.color) }}
                      className={`p-2 border-3 transition-all ${
                        tubeSlug === opt.slug
                          ? "border-[#1a1a1a] bg-[#FFCC00]/10 scale-105 shadow-[3px_3px_0px_#1a1a1a]"
                          : "border-[#1a1a1a]/20 bg-white hover:border-[#1a1a1a]/50"
                      }`}>
                      <div className="w-full aspect-[3/4] rounded overflow-hidden mb-1.5" style={{ background: opt.color + "08" }}>
                        <img src={opt.textureUrl} alt={opt.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[9px] font-black uppercase text-[#1a1a1a] block text-center">{opt.name}</span>
                      {tubeSlug === opt.slug && (
                        <span className="text-[7px] font-black text-[#22C55E] block text-center mt-0.5">SELECTED</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-2 border-t-2 border-[#1a1a1a]/10">
                <button onClick={onCancel}
                  className="mag-btn px-4 py-2 text-[10px] font-black uppercase bg-white text-[#1a1a1a] border-3 border-[#1a1a1a]">
                  <X className="w-3.5 h-3.5 inline mr-1" /> Cancel
                </button>
                <button
                  onClick={() => name.trim() && setStep(2)}
                  disabled={!name.trim()}
                  className="mag-btn px-5 py-2 text-[10px] font-black uppercase bg-[#3B4CCA] text-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed">
                  Next: Fill Tube <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
                </button>
              </div>
            </div>

            {/* Right: Tube Preview */}
            <div className="flex-shrink-0 flex items-center justify-center lg:w-40">
              <BattleTubePreview
                name={name || "New Tube"}
                color={color}
                textureUrl={tubeTexture}
                count={0}
                maxCount={20}
                size="md"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════
  // STEP 2: Fill Your Tube
  // ════════════════════════════════════════════════════════
  if (step === 2) {
    const tubeTazos = selectedTazos.slice(0, 15).map(t => ({
      id: t.id, name: t.name, displayName: t.displayName,
      imageUrl: t.imageUrl, franchiseSlug: t.franchiseSlug,
      finish: t.finish, creatureVariant: t.creatureVariant, shinyImageUrl: t.shinyImageUrl,
    }))

    return (
      <div className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] bg-white">
        <StepIndicator step={2} />
        <div className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Left: Tazo Grid */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black uppercase text-[#1a1a1a] tracking-wide flex items-center gap-2">
                    <PackageOpen className="w-5 h-5 text-[#FFCC00]" />
                    Step 2: Fill Your Tube
                  </h3>
                  <p className="text-[10px] font-bold text-[#1a1a1a]/35 mt-0.5">
                    Select up to 20 tazos to fill your battle tube
                  </p>
                </div>
                <span className={`text-sm font-black uppercase ${selectedIds.size >= 20 ? "text-[#22C55E]" : "text-[#E3350D]"}`}>
                  {selectedIds.size}/20
                </span>
              </div>

              {/* Search + filters */}
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a1a]/30" />
                  <input
                    type="text" value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search tazos..."
                    className="w-full pl-8 pr-3 py-2 text-xs font-bold text-[#1a1a1a] placeholder:text-[#1a1a1a]/25 bg-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] focus:outline-none focus:border-[#FFCC00]"
                  />
                </div>
                <select value={franchiseFilter} onChange={e => setFranchiseFilter(e.target.value)}
                  className="px-3 py-2 text-[10px] font-black uppercase border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]">
                  <option value="all">All Series</option>
                  <option value="minimon">Minimon</option>
                  <option value="cybermon">Cybermon</option>
                  <option value="dracobell">Dracobell</option>
                </select>
                <select value={rarityFilter} onChange={e => setRarityFilter(e.target.value)}
                  className="px-3 py-2 text-[10px] font-black uppercase border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[50vh] overflow-y-auto p-1">
                  {filteredTazos.map(tazo => {
                    const isSelected = selectedIds.has(tazo.id)
                    const fb = FRANCHISE_COLORS[tazo.franchiseSlug] || "#1a1a1a"
                    return (
                      <button key={tazo.id} onClick={() => toggleTazo(tazo.id)}
                        className={`text-left border-2 transition-all ${
                          isSelected
                            ? "border-[#FFCC00] bg-[#FFCC00]/10 shadow-[2px_2px_0px_#FFCC00] -translate-y-0.5"
                            : "border-[#1a1a1a]/15 bg-white hover:border-[#1a1a1a]/40"
                        }`}>
                        <div className="h-1" style={{ background: fb }} />
                        <div className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ background: "#1a1a1a" }}>
                              <TazoDiscImage src={tazo.imageUrl} alt={tazo.name} size="100%" borderWidth={0}
                                franchiseSlug={tazo.franchiseSlug} finish={(tazo as any).finish}
                                creatureVariant={(tazo as any).creatureVariant} shinyImageUrl={(tazo as any).shinyImageUrl} lazy className="w-full h-full" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-black text-[#1a1a1a] truncate leading-tight">{tazo.displayName || tazo.name}</p>
                              <p className="text-[8px] font-bold text-[#1a1a1a]/30 uppercase">{tazo.franchise} #{tazo.number}</p>
                              <div className="flex gap-1 mt-0.5">
                                <span className="text-[7px] font-bold" style={{ color: RARITY_COLOR[tazo.rarity] || "#9CA3AF" }}>{RARITY_STARS[tazo.rarity]}</span>
                                <span className="text-[7px] font-bold text-[#E3350D]">{tazo.attack}</span>
                                <span className="text-[7px] font-bold text-[#3B4CCA]">{tazo.defense}</span>
                              </div>
                            </div>
                            {isSelected && <CheckCircle className="w-4 h-4 text-[#22C55E] flex-shrink-0" />}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Selected chips */}
              {selectedTazos.length > 0 && (
                <div className="border-t-2 border-[#1a1a1a]/10 pt-3">
                  <p className="text-[9px] font-black uppercase text-[#1a1a1a]/40 mb-2 tracking-wider">
                    In Tube ({selectedTazos.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTazos.map(t => (
                      <span key={t.id}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[8px] font-black bg-[#FFCC00]/20 border border-[#FFCC00] text-[#1a1a1a]">
                        {t.displayName || t.name}
                        <X className="w-2.5 h-2.5 cursor-pointer text-[#E3350D]" onClick={(e) => { e.stopPropagation(); toggleTazo(t.id) }} />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between pt-2 border-t-2 border-[#1a1a1a]/10">
                <button onClick={() => setStep(1)}
                  className="mag-btn px-4 py-2 text-[10px] font-black uppercase bg-white text-[#1a1a1a] border-3 border-[#1a1a1a]">
                  <ChevronLeft className="w-3.5 h-3.5 inline mr-1" /> Back
                </button>
                <button onClick={() => selectedIds.size >= 1 && setStep(3)} disabled={selectedIds.size < 1}
                  className="mag-btn px-5 py-2 text-[10px] font-black uppercase bg-[#3B4CCA] text-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed">
                  Next: Starters <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
                </button>
              </div>
            </div>

            {/* Right: Battle Tube Panel (sticky) */}
            <div className="lg:w-44 flex-shrink-0">
              <div className="lg:sticky lg:top-4 border-2 border-[#1a1a1a] bg-[#fffef0] p-3 flex flex-col items-center gap-2">
                <p className="text-[9px] font-black uppercase text-[#1a1a1a]/30 tracking-wider">Battle Tube</p>
                <BattleTubePreview
                  name={name || "Tube"}
                  color={color}
                  textureUrl={tubeTexture}
                  count={selectedIds.size}
                  maxCount={20}
                  tazos={tubeTazos}
                  starters={[]}
                  size="md"
                  showLabel
                />
                {selectedIds.size >= 20 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-[#22C55E] border border-[#16A34A] text-white">
                    <CheckCircle className="w-3 h-3" />
                    <span className="text-[8px] font-black uppercase">Tube Full</span>
                  </div>
                )}
                <div className="text-[8px] font-bold text-[#1a1a1a]/30 text-center space-y-0.5 w-full">
                  <p>Avg ATK: {selectedTazos.length > 0 ? Math.round(selectedTazos.reduce((s, t) => s + t.attack, 0) / selectedTazos.length) : 0}</p>
                  <p>Series: {
                    (() => { const c: Record<string, number> = {}; for (const t of selectedTazos) c[t.franchiseSlug] = (c[t.franchiseSlug] || 0) + 1; return Object.values(c).join("/") || "0/0/0" })()
                  }</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════
  // STEP 3: Pick 5 Starters
  // ════════════════════════════════════════════════════════
  if (step === 3) {
    const starterTazos = selectedTazos.filter(t => starterIds.has(t.id))
    const reserveTazos = selectedTazos.filter(t => !starterIds.has(t.id))

    return (
      <div className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] bg-white">
        <StepIndicator step={3} />
        <div className="p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black uppercase text-[#1a1a1a] tracking-wide flex items-center gap-2">
                <Sword className="w-5 h-5 text-[#E3350D]" />
                Step 3: Pick 5 Starters
              </h3>
              <p className="text-[10px] font-bold text-[#1a1a1a]/35 mt-0.5">
                These 5 tazos will be your active hand — ready to launch from the top of your tube
              </p>
            </div>
            <span className={`text-sm font-black uppercase ${starterIds.size === 5 ? "text-[#22C55E]" : "text-[#E3350D]"}`}>
              {starterIds.size}/5
            </span>
          </div>

          {/* ══ STARTER CHAMBER ══ */}
          <div className="border-3 border-[#E3350D] bg-[#E3350D]/3 p-4">
            <p className="text-[9px] font-black uppercase text-[#E3350D] mb-3 tracking-[0.15em] flex items-center gap-1.5">
              <Sword className="w-3.5 h-3.5" /> Active Starter Chamber
            </p>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 5 }).map((_, i) => {
                const tazo = starterTazos[i]
                if (tazo) {
                  return (
                    <button key={tazo.id} onClick={() => toggleStarter(tazo.id)}
                      className="w-[72px] border-3 border-[#E3350D] bg-white shadow-[2px_2px_0px_#E3350D] hover:-translate-y-0.5 transition-all">
                      <div className="h-1" style={{ background: "#E3350D" }} />
                      <div className="p-1.5 flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1a1a1a]">
                          <TazoDiscImage src={tazo.imageUrl} alt={tazo.name} size="100%" borderWidth={0}
                            franchiseSlug={tazo.franchiseSlug} finish={(tazo as any).finish}
                            creatureVariant={(tazo as any).creatureVariant} shinyImageUrl={(tazo as any).shinyImageUrl} lazy />
                        </div>
                        <p className="text-[8px] font-black text-[#1a1a1a] truncate max-w-full">{tazo.displayName || tazo.name}</p>
                        <p className="text-[7px] font-bold text-[#E3350D]">{tazo.attack} ATK</p>
                      </div>
                    </button>
                  )
                }
                return (
                  <div key={`empty-${i}`}
                    className="w-[72px] border-3 border-dashed border-[#E3350D]/20 bg-[#E3350D]/3 flex flex-col items-center justify-center p-3"
                    style={{ minHeight: 96 }}>
                    <span className="text-2xl font-black text-[#E3350D]/15">{i + 1}</span>
                    <span className="text-[7px] font-black text-[#E3350D]/15 uppercase">Empty</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ══ RESERVE STACK ══ */}
          {reserveTazos.length > 0 && (
            <div className="border-2 border-[#1a1a1a]/10 p-4 bg-[#fffef0]">
              <p className="text-[9px] font-black uppercase text-[#1a1a1a]/30 mb-3 tracking-[0.15em]">
                Reserve Stack ({reserveTazos.length} remaining)
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {reserveTazos.map(tazo => {
                  const fb = FRANCHISE_COLORS[tazo.franchiseSlug] || "#1a1a1a"
                  return (
                    <button key={tazo.id} onClick={() => toggleStarter(tazo.id)}
                      className="border-2 border-[#1a1a1a]/15 bg-white hover:border-[#E3350D]/50 transition-all text-left">
                      <div className="h-0.5" style={{ background: fb }} />
                      <div className="p-1.5 flex items-center gap-1.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-[#1a1a1a]">
                          <TazoDiscImage src={tazo.imageUrl} alt={tazo.name} size="100%" borderWidth={0}
                            franchiseSlug={tazo.franchiseSlug} finish={(tazo as any).finish}
                            creatureVariant={(tazo as any).creatureVariant} shinyImageUrl={(tazo as any).shinyImageUrl} lazy />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] font-black text-[#1a1a1a] truncate">{tazo.displayName || tazo.name}</p>
                          <p className="text-[7px] font-bold text-[#E3350D]">{totalPower(tazo)} TP</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          {starterIds.size > 0 && (
            <div className="bg-[#E3350D]/5 border-2 border-[#E3350D] p-3">
              <p className="text-[9px] font-black uppercase text-[#E3350D] mb-1 tracking-wider">
                Active Starters:
              </p>
              <div className="flex flex-wrap gap-1">
                {starterTazos.map(t => (
                  <span key={t.id} className="text-[9px] font-black text-[#1a1a1a]">{t.displayName || t.name}{t !== starterTazos[starterTazos.length-1] ? " · " : ""}</span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-2 border-t-2 border-[#1a1a1a]/10">
            <button onClick={() => setStep(2)}
              className="mag-btn px-4 py-2 text-[10px] font-black uppercase bg-white text-[#1a1a1a] border-3 border-[#1a1a1a]">
              <ChevronLeft className="w-3.5 h-3.5 inline mr-1" /> Back
            </button>
            <button onClick={() => setStep(4)}
              className="mag-btn px-5 py-2 text-[10px] font-black uppercase bg-[#22C55E] text-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
              Review & Seal <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════
  // STEP 4: Review & Seal
  // ════════════════════════════════════════════════════════
  if (step === 4) {
    const starterTazos = selectedTazos.filter(t => starterIds.has(t.id))
    const totalP = selectedTazos.reduce((s, t) => s + totalPower(t), 0)
    const tubeTazos = selectedTazos.slice(0, 16).map(t => ({
      id: t.id, name: t.name, displayName: t.displayName,
      imageUrl: t.imageUrl, franchiseSlug: t.franchiseSlug,
      finish: t.finish, creatureVariant: t.creatureVariant, shinyImageUrl: t.shinyImageUrl,
    }))

    return (
      <div className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] bg-white">
        <StepIndicator step={4} />
        <div className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Tube visual */}
            <div className="flex-shrink-0 flex flex-col items-center lg:w-52">
              <h3 className="text-lg font-black uppercase text-[#1a1a1a] tracking-wide mb-4 flex items-center gap-2">
                <PackageOpen className="w-5 h-5 text-[#FFCC00]" />
                Review & Seal
              </h3>
              <BattleTubePreview
                name={name}
                color={color}
                textureUrl={tubeTexture}
                count={selectedIds.size}
                maxCount={20}
                tazos={tubeTazos}
                starters={Array.from(starterIds)}
                size="lg"
              />
            </div>

            {/* Right: Stats summary */}
            <div className="flex-1 space-y-4">
              <p className="text-[10px] font-bold text-[#1a1a1a]/35">Your battle tube is ready to be sealed</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 border-2 border-[#1a1a1a] bg-[#fffef0] text-center">
                  <div className="text-[8px] font-black uppercase text-[#1a1a1a]/40 tracking-wider mb-1">Name</div>
                  <div className="text-sm font-black text-[#1a1a1a]">{name}</div>
                </div>
                <div className="p-3 border-2 border-[#1a1a1a] bg-[#fffef0] text-center">
                  <div className="text-[8px] font-black uppercase text-[#1a1a1a]/40 tracking-wider mb-1">Tazos</div>
                  <div className={`text-sm font-black ${selectedIds.size >= 20 ? "text-[#22C55E]" : "text-[#3B4CCA]"}`}>{selectedIds.size}/20</div>
                </div>
                <div className="p-3 border-2 border-[#1a1a1a] bg-[#fffef0] text-center">
                  <div className="text-[8px] font-black uppercase text-[#1a1a1a]/40 tracking-wider mb-1">Starters</div>
                  <div className={`text-sm font-black ${starterIds.size >= 5 ? "text-[#22C55E]" : "text-[#E3350D]"}`}>{starterIds.size}/5</div>
                </div>
                <div className="p-3 border-2 border-[#1a1a1a] bg-[#fffef0] text-center">
                  <div className="text-[8px] font-black uppercase text-[#1a1a1a]/40 tracking-wider mb-1">Total Power</div>
                  <div className="text-sm font-black text-[#FFCC00]">{totalP}</div>
                </div>
              </div>

              {/* Texture + Franchise preview */}
              <div className="flex items-center gap-3 p-3 bg-[#fffef0] border-2 border-[#1a1a1a]">
                <div className="w-10 h-14 rounded overflow-hidden border border-[#1a1a1a]/20 flex-shrink-0">
                  <img src={tubeTexture} alt="Tube texture" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-[#1a1a1a] block">Tube: {TUBE_TEXTURE_OPTIONS.find(o => o.slug === tubeSlug)?.name || "Custom"}</span>
                  <span className="text-[8px] font-bold text-[#1a1a1a]/35">Textured body wrap</span>
                </div>
              </div>

              {/* Starter preview */}
              {starterTazos.length > 0 && (
                <div>
                  <p className="text-[9px] font-black uppercase text-[#1a1a1a]/40 mb-2 tracking-wider">
                    Active Starters ({starterTazos.length}):
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {starterTazos.map(t => {
                      const fc = FRANCHISE_COLORS[t.franchiseSlug] || "#1a1a1a"
                      return (
                        <div key={t.id} className="flex items-center gap-1.5 p-1.5 border-2 border-[#1a1a1a] bg-white">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ background: "#1a1a1a" }}>
                            <TazoDiscImage src={t.imageUrl} alt={t.name} size="100%" borderWidth={0}
                              franchiseSlug={t.franchiseSlug} finish={(t as any).finish}
                              creatureVariant={(t as any).creatureVariant} shinyImageUrl={(t as any).shinyImageUrl} lazy />
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
                <button onClick={() => setStep(3)}
                  className="mag-btn px-4 py-2 text-[10px] font-black uppercase bg-white text-[#1a1a1a] border-3 border-[#1a1a1a]">
                  <ChevronLeft className="w-3.5 h-3.5 inline mr-1" /> Back
                </button>
                <button
                  onClick={() => onSave({
                    name, color,
                    tazoIds: Array.from(selectedIds),
                    starterIds: Array.from(starterIds),
                    textureUrl: tubeTexture,
                    tubeSlug,
                  })}
                  disabled={!canSave}
                  className="mag-btn px-6 py-2.5 text-[11px] font-black uppercase bg-[#22C55E] text-white border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#1a1a1a] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none">
                  <PackageOpen className="w-4 h-4 inline mr-1.5" />
                  Seal Battle Tube
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
