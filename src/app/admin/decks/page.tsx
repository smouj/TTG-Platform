"use client"

// ============================================================
// Trading Tazos Game — Admin Deck & Texture Manager
// Upload, browse, and manage deck textures.
// ============================================================
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Package, Upload, Trash2, Image as ImageIcon, Plus } from "lucide-react"
import AdminShell from "@/components/admin/admin-shell"

interface TextureEntry {
  name: string
  url: string
  franchise: string
  size?: number
}

export default function AdminTubesPage() {
  const { user, loading: authLoading } = useAuth()
  const [textures, setTextures] = useState<TextureEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [franchise, setFranchise] = useState("")
  const [message, setMessage] = useState("")

  const isAdmin = user?.email === "dev@tradingtazosgame.com"

  const fetchTextures = async () => {
    try {
      const res = await fetch("/api/admin/tubes")
      const data = await res.json()
      setTextures(data.textures || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (isAdmin) fetchTextures()
    else if (!authLoading) setLoading(false)
  }, [isAdmin, authLoading])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!franchise) {
      setMessage("Select a franchise first")
      return
    }

    setUploading(true)
    setMessage("")

    const formData = new FormData()
    formData.append("file", file)
    formData.append("franchise", franchise)

    try {
      const res = await fetch("/api/admin/tubes", { method: "POST", body: formData })
      if (res.ok) {
        setMessage("✅ Texture uploaded!")
        fetchTextures()
      } else {
        const err = await res.json()
        setMessage(`❌ ${err.error || "Upload failed"}`)
      }
    } catch {
      setMessage("❌ Network error")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete texture "${name}"?`)) return
    try {
      const res = await fetch(`/api/admin/tubes?file=${encodeURIComponent(name)}`, { method: "DELETE" })
      if (res.ok) {
        setMessage("🗑️ Texture deleted")
        fetchTextures()
      } else {
        const err = await res.json()
        setMessage(`❌ ${err.error}`)
      }
    } catch {
      setMessage("❌ Network error")
    }
  }

  if (loading) {
    return (
      <AdminShell accentColor="#FF6B00">
        <div className="flex items-center justify-center py-20">
          <div className="mag-spinner w-10 h-10 rounded-full border-4 border-[#FFCC00] border-t-[#E3350D]" />
        </div>
      </AdminShell>
    )
  }

  const grouped: Record<string, TextureEntry[]> = {}
  for (const t of textures) {
    const key = t.franchise || "other"
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(t)
  }

  return (
    <AdminShell accentColor="#FF6B00">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Title */}
      <div className="flex items-center gap-3">
        <Package className="w-6 h-6 text-[#FF6B00]" />
        <h1 className="text-lg sm:text-xl font-black uppercase text-[#1a1a1a] tracking-wide">
          Tube Textures
        </h1>
        <span className="text-sm font-black text-[#1a1a1a]/25">{textures.length} files</span>
      </div>

      {/* Message toast */}
      {message && (
        <div className={`p-3 border-2 text-sm font-black ${message.startsWith("✅") || message.startsWith("🗑️") ? "border-[#22C55E] bg-[#22C55E]/10 text-[#16A34A]" : "border-[#E3350D] bg-[#E3350D]/10 text-[#E3350D]"}`}>
          {message}
        </div>
      )}

      {/* ── Upload card ── */}
      <div className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] bg-white p-5">
        <h2 className="text-sm font-black uppercase text-[#1a1a1a] mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#E3350D]" /> Upload Tube Texture
        </h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-[10px] font-black text-[#1a1a1a]/40 uppercase mb-1">Franchise</label>
            <select
              value={franchise}
              onChange={e => setFranchise(e.target.value)}
              className="px-4 py-2.5 text-xs font-black border-3 border-[#1a1a1a] bg-white text-[#1a1a1a] uppercase shadow-[2px_2px_0px_#1a1a1a]"
            >
              <option value="">— Pick franchise —</option>
              <option value="minimon">Minimon</option>
              <option value="cybermon">Cybermon</option>
              <option value="dracobell">Dracobell</option>
            </select>
          </div>
          <label className={`mag-btn px-5 py-2.5 text-[10px] font-black uppercase text-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] cursor-pointer transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1a1a1a] ${uploading ? "bg-[#1a1a1a]/40" : "bg-[#E3350D]"}`}>
            <Plus className="w-3.5 h-3.5 inline mr-1" />
            {uploading ? "Uploading..." : "Choose PNG File"}
            <input type="file" accept="image/png" className="hidden" onChange={handleUpload} disabled={uploading || !franchise} />
          </label>
        </div>
        <p className="text-[9px] font-bold text-[#1a1a1a]/25 mt-3">
          Upload .png textures (recommended: 512×1024 or wider). Files are placed in /public/textures/tubes/.
        </p>
      </div>

      {/* ── Texture browser ── */}
      {Object.entries(grouped).map(([franchiseKey, items]) => (
        <div key={franchiseKey} className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] bg-white">
          <div className="px-5 py-3 border-b-2 border-[#1a1a1a] bg-[#1a1a1a]/[0.02] flex items-center gap-2">
            <ImageIcon aria-hidden="true" className="w-4 h-4 text-[#FFCC00]" />
            <h2 className="text-xs font-black uppercase text-[#1a1a1a] tracking-wider">{franchiseKey}</h2>
            <span className="text-[9px] font-bold text-[#1a1a1a]/25 ml-auto">{items.length} textures</span>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map(t => (
              <div
                key={t.name}
                className="group border-2 border-[#1a1a1a]/15 hover:border-[#1a1a1a]/50 transition-all bg-[#fffef0]"
              >
                <div className="aspect-[3/4] bg-[#1a1a1a]/[0.03] flex items-center justify-center overflow-hidden">
                  <img src={t.url} alt={t.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-2 flex items-center justify-between border-t border-[#1a1a1a]/10">
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black text-[#1a1a1a] truncate">{t.name}</p>
                    {t.size && <p className="text-[8px] font-bold text-[#1a1a1a]/25">{Math.round(t.size / 1024)} KB</p>}
                  </div>
                  <button
                    onClick={() => handleDelete(t.name)}
                    className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-[#E3350D] hover:bg-[#E3350D]/10"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {textures.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <ImageIcon aria-hidden="true" className="w-12 h-12 text-[#1a1a1a]/10 mx-auto" />
          <p className="text-sm font-black text-[#1a1a1a]/20 uppercase">No textures uploaded yet</p>
        </div>
      )}
      </div>
    </AdminShell>
  )
}
