"use client"

// ============================================================
// Trading Tazos Game — Admin Tube Model Manager
// Create, edit, delete battle tube models.
// ============================================================
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Package, Plus, Trash2, Edit3, Check, X, ChevronLeft, Shield, Loader2, Save, GripVertical } from "lucide-react"
import Link from "next/link"

interface TubeModel {
  id: string
  name: string
  textureUrl: string
  franchise: string
  sortOrder: number
  isActive: boolean
}

const FRANCHISES = ["minimon", "cybermon", "dracobell"]
const FRANCHISE_COLORS: Record<string, string> = {
  minimon: "#FFCC00", cybermon: "#00A1E9", dracobell: "#FF6B00",
}

export default function AdminTubeModelsPage() {
  const { user, loading: authLoading } = useAuth()
  const [models, setModels] = useState<TubeModel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // New model form
  const [newName, setNewName] = useState("")
  const [newTextureUrl, setNewTextureUrl] = useState("")
  const [newFranchise, setNewFranchise] = useState("minimon")
  const [newSortOrder, setNewSortOrder] = useState(0)
  const [showAdd, setShowAdd] = useState(false)

  // Edit fields
  const [editName, setEditName] = useState("")
  const [editTextureUrl, setEditTextureUrl] = useState("")
  const [editFranchise, setEditFranchise] = useState("")
  const [editSortOrder, setEditSortOrder] = useState(0)

  const isAdmin = user?.email === "dev@tradingtazosgame.com"

  const fetchModels = async () => {
    try {
      const res = await fetch("/api/admin/tube-models")
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
    if (!newName || !newTextureUrl) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/tube-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, textureUrl: newTextureUrl, franchise: newFranchise, sortOrder: newSortOrder }),
      })
      if (res.ok) {
        setNewName(""); setNewTextureUrl(""); setShowAdd(false)
        await fetchModels()
      }
    } finally { setSaving(false) }
  }

  const handleUpdate = async (id: string) => {
    setSaving(true)
    try {
      await fetch("/api/admin/tube-models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editName, textureUrl: editTextureUrl, franchise: editFranchise, sortOrder: editSortOrder }),
      })
      setEditingId(null)
      await fetchModels()
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tube model?")) return
    await fetch(`/api/admin/tube-models?id=${id}`, { method: "DELETE" })
    await fetchModels()
  }

  const handleToggle = async (model: TubeModel) => {
    await fetch("/api/admin/tube-models", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: model.id, isActive: !model.isActive }),
    })
    await fetchModels()
  }

  const startEdit = (m: TubeModel) => {
    setEditingId(m.id)
    setEditName(m.name)
    setEditTextureUrl(m.textureUrl)
    setEditFranchise(m.franchise)
    setEditSortOrder(m.sortOrder)
  }

  const cancelEdit = () => setEditingId(null)

  return (
    <div className="min-h-screen mag-bg">
      <header className="bg-[#1a1a1a] border-b-4 border-[#FF6B00] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></Link>
            <Package className="w-5 h-5 text-[#FF6B00]" />
            <h1 className="text-lg font-black text-white uppercase tracking-wider">Tube Models</h1>
          </div>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6B00] text-white text-[10px] font-black uppercase border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] hover:shadow-[1px_1px_0px]">
            <Plus className="w-3.5 h-3.5" /> New Tube
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Add form */}
        {showAdd && (
          <div className="mag-card p-4 border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] bg-white">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]/50 mb-3">New Tube Model</h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[9px] font-black uppercase text-[#1a1a1a]/40">Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Classic Tube" className="w-full p-2 border-2 border-[#1a1a1a] text-xs font-bold" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-[#1a1a1a]/40">Texture URL</label>
                <input value={newTextureUrl} onChange={e => setNewTextureUrl(e.target.value)} placeholder="/tazos-tubes/tube-minimon.png" className="w-full p-2 border-2 border-[#1a1a1a] text-xs font-bold" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-[#1a1a1a]/40">Franchise</label>
                <select value={newFranchise} onChange={e => setNewFranchise(e.target.value)} className="w-full p-2 border-2 border-[#1a1a1a] text-xs font-bold">
                  {FRANCHISES.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-[#1a1a1a]/40">Sort Order</label>
                <input type="number" value={newSortOrder} onChange={e => setNewSortOrder(Number(e.target.value))} className="w-full p-2 border-2 border-[#1a1a1a] text-xs font-bold" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={saving} className="mag-btn px-4 py-2 text-[10px] font-black uppercase bg-[#FF6B00] text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px] flex items-center gap-1">
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
            <Package className="w-10 h-10 text-[#1a1a1a]/15 mx-auto mb-3" />
            <p className="font-black text-sm text-[#1a1a1a]/30 uppercase">No tube models yet</p>
            <p className="text-[10px] font-bold text-[#1a1a1a]/20 mt-1">Click "New Tube" to create one</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {models.map(m => (
              <div key={m.id} className={`mag-card border-3 shadow-[3px_3px_0px_#1a1a1a] bg-white ${!m.isActive ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-4 p-4">
                  {/* Preview */}
                  <div className="w-14 h-24 rounded overflow-hidden border-2 border-[#1a1a1a] flex-shrink-0 bg-[#1a1a1a]/5 flex items-center justify-center">
                    <img src={m.textureUrl} alt={m.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    {!m.textureUrl && <Package className="w-6 h-6 text-[#1a1a1a]/20" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {editingId === m.id ? (
                      <div className="grid sm:grid-cols-2 gap-2">
                        <div><input value={editName} onChange={e => setEditName(e.target.value)} className="w-full p-1.5 border-2 border-[#1a1a1a] text-xs font-bold" /></div>
                        <div><input value={editTextureUrl} onChange={e => setEditTextureUrl(e.target.value)} className="w-full p-1.5 border-2 border-[#1a1a1a] text-xs font-bold" /></div>
                        <div>
                          <select value={editFranchise} onChange={e => setEditFranchise(e.target.value)} className="w-full p-1.5 border-2 border-[#1a1a1a] text-xs font-bold">
                            {FRANCHISES.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                          </select>
                        </div>
                        <div><input type="number" value={editSortOrder} onChange={e => setEditSortOrder(Number(e.target.value))} className="w-full p-1.5 border-2 border-[#1a1a1a] text-xs font-bold" /></div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-[#1a1a1a] uppercase">{m.name}</h3>
                          <span className="text-[8px] font-black px-1.5 py-0.5 uppercase border border-[#1a1a1a]/20" style={{ color: FRANCHISE_COLORS[m.franchise] || "#999" }}>
                            {m.franchise}
                          </span>
                          <span className="text-[9px] font-bold text-[#1a1a1a]/25">#{m.sortOrder}</span>
                        </div>
                        <p className="text-[10px] font-bold text-[#1a1a1a]/30 truncate">{m.textureUrl}</p>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {editingId === m.id ? (
                      <>
                        <button onClick={() => handleUpdate(m.id)} disabled={saving} className="p-2 hover:bg-[#22C55E]/10 transition-colors" title="Save"><Check className="w-4 h-4 text-[#22C55E]" /></button>
                        <button onClick={cancelEdit} className="p-2 hover:bg-[#E3350D]/10 transition-colors" title="Cancel"><X className="w-4 h-4 text-[#E3350D]" /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(m)} className="p-2 hover:bg-[#FFCC00]/10 transition-colors" title="Edit"><Edit3 className="w-4 h-4 text-[#1a1a1a]/50" /></button>
                        <button onClick={() => handleToggle(m)} className="p-2 hover:bg-[#FFCC00]/10 transition-colors" title={m.isActive ? "Active — click to deactivate" : "Inactive — click to activate"}>
                          <span className={`text-[9px] font-black px-1 py-0.5 border ${m.isActive ? "text-[#22C55E] border-[#22C55E]/30 bg-[#22C55E]10" : "text-[#E3350D] border-[#E3350D]/30 bg-[#E3350D]10"}`}>
                            {m.isActive ? "ON" : "OFF"}
                          </span>
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="p-2 hover:bg-[#E3350D]/10 transition-colors" title="Delete"><Trash2 className="w-4 h-4 text-[#E3350D]/50" /></button>
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
