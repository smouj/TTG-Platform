"use client"

// ============================================================
// Trading Tazos Game — Admin Deck Model Manager
// Create, edit, delete battle deck models with 3D preview.
// ============================================================
import { useState, useEffect, Suspense } from "react"
import { useAuth } from "@/lib/auth-context"
import { Package, Plus, Trash2, Edit3, Check, X, Loader2, Save, Eye } from "lucide-react"
import AdminShell from "@/components/admin/admin-shell"
import dynamic from "next/dynamic"

const AdminTubePreview = dynamic(() => import("@/components/admin/admin-tube-preview"), { ssr: false, loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-[#FF6B00]" /></div> })

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
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const [message, setMessage] = useState("")

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
      setMessage("Updated!")
      setTimeout(() => setMessage(""), 2000)
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
    <AdminShell accentColor="#EF4444" actions={
      <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EF4444] text-white text-[10px] font-black uppercase border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] hover:shadow-[1px_1px_0px]">
        <Plus className="w-3.5 h-3.5" /> New Tube
      </button>
    }>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {message && (
          <div className="p-3 border-3 border-[#22C55E] bg-[#22C55E]/10 text-center text-[11px] font-black text-[#22C55E] uppercase">{message}</div>
        )}

        {/* Add form */}
        {showAdd && (
          <div className="mag-card p-4 border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] bg-white">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]/50 mb-3">New Deck Model</h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div><label className="text-[9px] font-black uppercase text-[#1a1a1a]/40">Name</label><input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Classic Tube" className="w-full p-2 border-2 border-[#1a1a1a] text-xs font-bold" /></div>
              <div><label className="text-[9px] font-black uppercase text-[#1a1a1a]/40">Texture URL</label><input value={newTextureUrl} onChange={e => setNewTextureUrl(e.target.value)} placeholder="/tazos-tubes/tube-minimon.png" className="w-full p-2 border-2 border-[#1a1a1a] text-xs font-bold" /></div>
              <div><label className="text-[9px] font-black uppercase text-[#1a1a1a]/40">Franchise</label><select value={newFranchise} onChange={e => setNewFranchise(e.target.value)} className="w-full p-2 border-2 border-[#1a1a1a] text-xs font-bold">{FRANCHISES.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}</select></div>
              <div><label className="text-[9px] font-black uppercase text-[#1a1a1a]/40">Sort Order</label><input type="number" value={newSortOrder} onChange={e => setNewSortOrder(Number(e.target.value))} className="w-full p-2 border-2 border-[#1a1a1a] text-xs font-bold" /></div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={saving} className="mag-btn px-4 py-2 text-[10px] font-black uppercase bg-[#FF6B00] text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px] flex items-center gap-1"><Save className="w-3 h-3" /> Create</button>
              <button onClick={() => setShowAdd(false)} className="mag-btn px-4 py-2 text-[10px] font-black uppercase bg-white border-2 border-[#1a1a1a] flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#FFCC00]" /></div>
        ) : models.length === 0 ? (
          <div className="text-center py-16 border-3 border-[#1a1a1a] bg-white shadow-[3px_3px_0px]">
            <Package className="w-10 h-10 text-[#1a1a1a]/15 mx-auto mb-3" />
            <p className="font-black text-sm text-[#1a1a1a]/30 uppercase">No deck models yet</p>
            <p className="text-[10px] font-bold text-[#1a1a1a]/20 mt-1">Click &quot;New Tube&quot; to create one</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {models.map(m => {
              return (
                <div key={m.id} className={`mag-card border-3 shadow-[3px_3px_0px_#1a1a1a] bg-white transition-all ${!m.isActive ? "opacity-50" : ""}`}>
                  <div className="flex items-start gap-4 p-4">
                    {/* Flat preview thumb */}
                    <div className="w-14 h-24 overflow-hidden border-2 border-[#1a1a1a] flex-shrink-0 bg-[#1a1a1a]/5 flex items-center justify-center">
                      <img src={m.textureUrl} alt={m.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      {!m.textureUrl && <Package className="w-6 h-6 text-[#1a1a1a]/20" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {editingId === m.id ? (
                        <div className="grid sm:grid-cols-2 gap-2">
                          <div><label className="text-[8px] font-black text-[#1a1a1a]/40 uppercase">Name</label><input value={editName} onChange={e => setEditName(e.target.value)} className="w-full p-1.5 border-2 border-[#1a1a1a] text-xs font-bold" /></div>
                          <div><label className="text-[8px] font-black text-[#1a1a1a]/40 uppercase">Texture URL</label><input value={editTextureUrl} onChange={e => setEditTextureUrl(e.target.value)} className="w-full p-1.5 border-2 border-[#1a1a1a] text-xs font-bold" /></div>
                          <div><label className="text-[8px] font-black text-[#1a1a1a]/40 uppercase">Franchise</label><select value={editFranchise} onChange={e => setEditFranchise(e.target.value)} className="w-full p-1.5 border-2 border-[#1a1a1a] text-xs font-bold">{FRANCHISES.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}</select></div>
                          <div><label className="text-[8px] font-black text-[#1a1a1a]/40 uppercase">Sort Order</label><input type="number" value={editSortOrder} onChange={e => setEditSortOrder(Number(e.target.value))} className="w-full p-1.5 border-2 border-[#1a1a1a] text-xs font-bold" /></div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-black text-[#1a1a1a] uppercase">{m.name}</h3>
                            <span className="text-[8px] font-black px-1.5 py-0.5 uppercase border border-[#1a1a1a]/20" style={{ color: FRANCHISE_COLORS[m.franchise] || "#999" }}>{m.franchise}</span>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 border ${m.isActive ? "text-[#22C55E] border-[#22C55E]/20" : "text-[#E3350D] border-[#E3350D]/20"}`}>{m.isActive ? "ACTIVE" : "OFF"}</span>
                            <span className="text-[9px] font-bold text-[#1a1a1a]/25">#{m.sortOrder}</span>
                          </div>
                          <p className="text-[10px] font-bold text-[#1a1a1a]/30 truncate mt-0.5">{m.textureUrl}</p>
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
                          <button onClick={() => setPreviewingId(previewingId === m.id ? null : m.id)} className="p-2 hover:bg-[#3B4CCA]/10" title="3D Preview">
                            <Eye className={`w-4 h-4 ${previewingId === m.id ? "text-[#3B4CCA]" : "text-[#1a1a1a]/30"}`} />
                          </button>
                          <button onClick={() => startEdit(m)} className="p-2 hover:bg-[#FFCC00]/10 transition-colors" title="Edit"><Edit3 className="w-4 h-4 text-[#1a1a1a]/50" /></button>
                          <button onClick={() => handleToggle(m)} className="p-2 hover:bg-[#FFCC00]/10 transition-colors" title={m.isActive ? "Active — click to deactivate" : "Inactive — click to activate"}>
                            <span className={`text-[9px] font-black px-1 py-0.5 border ${m.isActive ? "text-[#22C55E] border-[#22C55E]/30" : "text-[#E3350D] border-[#E3350D]/30"}`}>{m.isActive ? "ON" : "OFF"}</span>
                          </button>
                          <button onClick={() => handleDelete(m.id)} className="p-2 hover:bg-[#E3350D]/10 transition-colors" title="Delete"><Trash2 className="w-4 h-4 text-[#E3350D]/50" /></button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 3D Preview (expandable) */}
                  {previewingId === m.id && (
                    <div className="border-t-2 border-dashed border-[#1a1a1a]/10 p-4 bg-[#1a1a1a]/[0.01]">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-[10px] font-black uppercase text-[#1a1a1a]/40 mb-2">3D Preview</h4>
                          <div className="h-64 border-2 border-[#1a1a1a]/10 bg-gradient-to-b from-[#1a1a1a]/[0.02] to-[#1a1a1a]/[0.05] overflow-hidden">
                            <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-[#FF6B00]" /></div>}>
                              <AdminTubePreview textureUrl={m.textureUrl} />
                            </Suspense>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black uppercase text-[#1a1a1a]/40 mb-2">Web Configuration</h4>
                          <div className="space-y-2 text-[10px] font-bold">
                            <div className="border border-[#1a1a1a]/10 p-2">
                              <span className="text-[#1a1a1a]/40 block text-[8px] font-black uppercase">Texture URL (for web)</span>
                              <code className="text-[#1a1a1a]/60 break-all text-[9px]">{m.textureUrl}</code>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="border border-[#1a1a1a]/10 p-2 text-center">
                                <span className="text-[#1a1a1a]/40 block text-[8px] font-black uppercase">Franchise</span>
                                <span className="font-black uppercase" style={{ color: FRANCHISE_COLORS[m.franchise] || "#999" }}>{m.franchise}</span>
                              </div>
                              <div className="border border-[#1a1a1a]/10 p-2 text-center">
                                <span className="text-[#1a1a1a]/40 block text-[8px] font-black uppercase">Sort Order</span>
                                <span className="font-black">#{m.sortOrder}</span>
                              </div>
                              <div className="border border-[#1a1a1a]/10 p-2 text-center">
                                <span className="text-[#1a1a1a]/40 block text-[8px] font-black uppercase">Status</span>
                                <span className={`font-black uppercase ${m.isActive ? "text-[#22C55E]" : "text-[#E3350D]"}`}>{m.isActive ? "Live" : "Offline"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
