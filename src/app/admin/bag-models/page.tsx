"use client"

// ============================================================
// Trading Tazos Game — Admin Bag Model Manager
// Create, edit, delete potato chip bag designs for the shop.
// ============================================================
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { ShoppingBag, Plus, Trash2, Edit3, Check, X, ChevronLeft, Shield, Loader2, Save, Image } from "lucide-react"
import Link from "next/link"

interface BagModel {
  id: string
  name: string
  frontUrl: string
  backUrl: string
  franchise: string
  cost: number
  bonusChance: number
  rareBoost: number
  color: string
  bgColor: string
  tagline: string
  sortOrder: number
  isActive: boolean
}

const FRANCHISES = ["minimon", "cybermon", "dracobell"]
const FRANCHISE_COLORS: Record<string, string> = {
  minimon: "#FFCC00", cybermon: "#00A1E9", dracobell: "#FF6B00",
}

export default function AdminBagModelsPage() {
  const { user, loading: authLoading } = useAuth()
  const [models, setModels] = useState<BagModel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [message, setMessage] = useState("")

  // New model form
  const [newName, setNewName] = useState("")
  const [newFrontUrl, setNewFrontUrl] = useState("")
  const [newBackUrl, setNewBackUrl] = useState("")
  const [newFranchise, setNewFranchise] = useState("minimon")
  const [newCost, setNewCost] = useState(10)
  const [newBonusChance, setNewBonusChance] = useState(15)
  const [newRareBoost, setNewRareBoost] = useState(2)
  const [newColor, setNewColor] = useState("#FFCC00")
  const [newBgColor, setNewBgColor] = useState("#FFF8E7")
  const [newTagline, setNewTagline] = useState("")
  const [newSortOrder, setNewSortOrder] = useState(0)

  // Edit fields
  const [editFields, setEditFields] = useState<Partial<BagModel>>({})

  const isAdmin = user?.email === "dev@tradingtazosgame.com"

  const fetchModels = async () => {
    try {
      const res = await fetch("/api/admin/bag-models")
      const data = await res.json()
      setModels(data.models || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (isAdmin) fetchModels()
    else if (!authLoading) setLoading(false)
  }, [isAdmin, authLoading])

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-[#FFCC00]" /></div>
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center mag-bg">
        <div className="mag-card p-8 text-center max-w-md mx-4 space-y-4">
          <Shield className="w-16 h-16 mx-auto text-[#E3350D]" />
          <h1 className="text-xl font-black uppercase">Access Denied</h1>
          <Link href="/" className="mag-btn inline-block bg-[#E3350D] text-white px-6 py-3 text-xs font-black uppercase border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">Back to Home</Link>
        </div>
      </div>
    )
  }

  const handleCreate = async () => {
    if (!newName || !newFrontUrl || !newBackUrl) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/bag-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName, frontUrl: newFrontUrl, backUrl: newBackUrl,
          franchise: newFranchise, cost: newCost, bonusChance: newBonusChance,
          rareBoost: newRareBoost, color: newColor, bgColor: newBgColor,
          tagline: newTagline, sortOrder: newSortOrder,
        }),
      })
      if (res.ok) {
        setNewName(""); setNewFrontUrl(""); setNewBackUrl(""); setNewTagline(""); setShowAdd(false)
        setMessage("Bag model created!")
        setTimeout(() => setMessage(""), 3000)
        await fetchModels()
      }
    } finally { setSaving(false) }
  }

  const handleUpdate = async (id: string) => {
    setSaving(true)
    try {
      await fetch("/api/admin/bag-models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editFields }),
      })
      setEditingId(null)
      setMessage("Updated!")
      setTimeout(() => setMessage(""), 2000)
      await fetchModels()
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bag model?")) return
    await fetch(`/api/admin/bag-models?id=${id}`, { method: "DELETE" })
    await fetchModels()
  }

  const handleToggle = async (model: BagModel) => {
    await fetch("/api/admin/bag-models", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: model.id, isActive: !model.isActive }),
    })
    await fetchModels()
  }

  const startEdit = (m: BagModel) => {
    setEditingId(m.id)
    setEditFields({
      name: m.name, frontUrl: m.frontUrl, backUrl: m.backUrl,
      franchise: m.franchise, cost: m.cost, bonusChance: m.bonusChance,
      rareBoost: m.rareBoost, color: m.color, bgColor: m.bgColor,
      tagline: m.tagline, sortOrder: m.sortOrder,
    })
  }

  return (
    <div className="min-h-screen mag-bg">
      <header className="bg-[#1a1a1a] border-b-4 border-[#F97316] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></Link>
            <ShoppingBag className="w-5 h-5 text-[#F97316]" />
            <h1 className="text-lg font-black text-white uppercase tracking-wider">Bag Models</h1>
          </div>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F97316] text-white text-[10px] font-black uppercase border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] hover:shadow-[1px_1px_0px]">
            <Plus className="w-3.5 h-3.5" /> New Bag
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {message && (
          <div className="p-3 border-3 border-[#22C55E] bg-[#22C55E]/10 text-center text-[11px] font-black text-[#22C55E] uppercase">{message}</div>
        )}

        {/* Add form */}
        {showAdd && (
          <div className="mag-card p-4 border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] bg-white">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]/50 mb-3">New Bag Model</h3>
            <div className="grid sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-[9px] font-black uppercase text-[#1a1a1a]/40">Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Mega Bag" className="w-full p-2 border-2 border-[#1a1a1a] text-xs font-bold" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-[#1a1a1a]/40">Front Image URL</label>
                <input value={newFrontUrl} onChange={e => setNewFrontUrl(e.target.value)} placeholder="/bags/bag-front.png" className="w-full p-2 border-2 border-[#1a1a1a] text-xs font-bold" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-[#1a1a1a]/40">Back Image URL</label>
                <input value={newBackUrl} onChange={e => setNewBackUrl(e.target.value)} placeholder="/bags/bag-back.png" className="w-full p-2 border-2 border-[#1a1a1a] text-xs font-bold" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-[#1a1a1a]/40">Franchise</label>
                <select value={newFranchise} onChange={e => setNewFranchise(e.target.value)} className="w-full p-2 border-2 border-[#1a1a1a] text-xs font-bold">
                  {FRANCHISES.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-[#1a1a1a]/40">Cost (credits)</label>
                <input type="number" value={newCost} onChange={e => setNewCost(Number(e.target.value))} className="w-full p-2 border-2 border-[#1a1a1a] text-xs font-bold" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-[#1a1a1a]/40">Tagline</label>
                <input value={newTagline} onChange={e => setNewTagline(e.target.value)} placeholder="Legendary auras" className="w-full p-2 border-2 border-[#1a1a1a] text-xs font-bold" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-[#1a1a1a]/40">Color</label>
                <div className="flex gap-1"><input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-10 h-8 border-2 border-[#1a1a1a]" /><span className="text-[10px] font-bold self-center">{newColor}</span></div>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-[#1a1a1a]/40">Background Color</label>
                <div className="flex gap-1"><input type="color" value={newBgColor} onChange={e => setNewBgColor(e.target.value)} className="w-10 h-8 border-2 border-[#1a1a1a]" /><span className="text-[10px] font-bold self-center">{newBgColor}</span></div>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-[#1a1a1a]/40">Sort Order</label>
                <input type="number" value={newSortOrder} onChange={e => setNewSortOrder(Number(e.target.value))} className="w-full p-2 border-2 border-[#1a1a1a] text-xs font-bold" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={saving} className="mag-btn px-4 py-2 text-[10px] font-black uppercase bg-[#F97316] text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px] flex items-center gap-1">
                <Save className="w-3 h-3" /> Create
              </button>
              <button onClick={() => setShowAdd(false)} className="mag-btn px-4 py-2 text-[10px] font-black uppercase bg-white border-2 border-[#1a1a1a] flex items-center gap-1">
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#FFCC00]" /></div>
        ) : models.length === 0 ? (
          <div className="text-center py-16 border-3 border-[#1a1a1a] bg-white shadow-[3px_3px_0px]">
            <ShoppingBag className="w-10 h-10 text-[#1a1a1a]/15 mx-auto mb-3" />
            <p className="font-black text-sm text-[#1a1a1a]/30 uppercase">No bag models yet</p>
            <p className="text-[10px] font-bold text-[#1a1a1a]/20 mt-1">Click "New Bag" to create one</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {models.map(m => (
              <div key={m.id} className={`mag-card border-3 shadow-[3px_3px_0px_#1a1a1a] bg-white ${!m.isActive ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-4 p-4">
                  {/* Preview */}
                  <div className="flex gap-1 flex-shrink-0">
                    <div className="w-12 h-16 rounded overflow-hidden border-2 border-[#1a1a1a] bg-[#1a1a1a]/5 flex items-center justify-center">
                      <img src={m.frontUrl} alt={`${m.name} front`} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      {!m.frontUrl && <Image className="w-5 h-5 text-[#1a1a1a]/20" />}
                    </div>
                    <div className="w-12 h-16 rounded overflow-hidden border-2 border-dashed border-[#1a1a1a]/20 bg-[#1a1a1a]/5 flex items-center justify-center">
                      <img src={m.backUrl} alt={`${m.name} back`} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      {!m.backUrl && <Image className="w-5 h-5 text-[#1a1a1a]/20" />}
                    </div>
                  </div>

                  {editingId === m.id ? (
                    <div className="flex-1 grid sm:grid-cols-3 gap-2">
                      <div><input value={editFields.name || ""} onChange={e => setEditFields(p => ({ ...p, name: e.target.value }))} className="w-full p-1.5 border-2 border-[#1a1a1a] text-xs font-bold" placeholder="Name" /></div>
                      <div><input value={editFields.frontUrl || ""} onChange={e => setEditFields(p => ({ ...p, frontUrl: e.target.value }))} className="w-full p-1.5 border-2 border-[#1a1a1a] text-xs font-bold" placeholder="Front URL" /></div>
                      <div><input value={editFields.backUrl || ""} onChange={e => setEditFields(p => ({ ...p, backUrl: e.target.value }))} className="w-full p-1.5 border-2 border-[#1a1a1a] text-xs font-bold" placeholder="Back URL" /></div>
                      <div>
                        <select value={editFields.franchise || ""} onChange={e => setEditFields(p => ({ ...p, franchise: e.target.value }))} className="w-full p-1.5 border-2 border-[#1a1a1a] text-xs font-bold">
                          {FRANCHISES.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                        </select>
                      </div>
                      <div><input type="number" value={editFields.cost ?? 10} onChange={e => setEditFields(p => ({ ...p, cost: Number(e.target.value) }))} className="w-full p-1.5 border-2 border-[#1a1a1a] text-xs font-bold" /></div>
                      <div><input value={editFields.tagline || ""} onChange={e => setEditFields(p => ({ ...p, tagline: e.target.value }))} className="w-full p-1.5 border-2 border-[#1a1a1a] text-xs font-bold" placeholder="Tagline" /></div>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-[#1a1a1a] uppercase">{m.name}</h3>
                        <span className="text-[8px] font-black px-1.5 py-0.5 uppercase border border-[#1a1a1a]/20" style={{ color: FRANCHISE_COLORS[m.franchise] || "#999" }}>
                          {m.franchise}
                        </span>
                        <span className="text-[10px] font-black tabular-nums text-[#FFCC00]">{m.cost}cr</span>
                      </div>
                      <p className="text-[10px] font-bold text-[#1a1a1a]/30">{m.tagline}</p>
                      <div className="flex gap-2 mt-1 text-[8px] font-bold text-[#1a1a1a]/20">
                        <span>Bonus {m.bonusChance}%</span>
                        <span>Boost ×{m.rareBoost}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {editingId === m.id ? (
                      <>
                        <button onClick={() => handleUpdate(m.id)} disabled={saving} className="p-2 hover:bg-[#22C55E]/10"><Check className="w-4 h-4 text-[#22C55E]" /></button>
                        <button onClick={() => setEditingId(null)} className="p-2 hover:bg-[#E3350D]/10"><X className="w-4 h-4 text-[#E3350D]" /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(m)} className="p-2 hover:bg-[#FFCC00]/10"><Edit3 className="w-4 h-4 text-[#1a1a1a]/50" /></button>
                        <button onClick={() => handleToggle(m)} className="p-2">
                          <span className={`text-[9px] font-black px-1 py-0.5 border ${m.isActive ? "text-[#22C55E] border-[#22C55E]/30" : "text-[#E3350D] border-[#E3350D]/30"}`}>
                            {m.isActive ? "ON" : "OFF"}
                          </span>
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="p-2"><Trash2 className="w-4 h-4 text-[#E3350D]/50" /></button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
