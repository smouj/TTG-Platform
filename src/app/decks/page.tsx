"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import MagazinePageShell from "@/components/magazine-page-shell"
import { Layers, Plus, Trash2, Star, ArrowLeft, Swords, Shield, Zap } from "lucide-react"

interface DeckTazo {
  id: string; name: string; displayName: string; imageUrl: string; franchise: string
  attack: number; defense: number; resistance: number
  weight: number; stability: number; spin: number
  control: number; bounce: number; precision: number
  role?: string | null
}
interface Deck { id: string; name: string; isActive: boolean; tazoCount: number; tazos: DeckTazo[] }

const FRANCHISE_BORDER: Record<string, string> = {
  minimon: "#FFCB05", cybermon: "#00A1E9", "dragon-ball-z": "#FF6B00",
}

export default function DecksPage() {
  const { t } = useI18n()
  const { user, token, loading } = useAuth()
  const [decks, setDecks] = useState<Deck[]>([])
  const [fetching, setFetching] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [deckName, setDeckName] = useState("")
  const [error, setError] = useState("")

  const fetchDecks = () => {
    if (!token) return
    fetch("/api/decks", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((d) => setDecks(d.decks || []))
      .catch(() => {})
      .finally(() => setFetching(false))
  }
  useEffect(() => { fetchDecks() }, [token])

  const handleCreate = async () => {
    if (!deckName.trim()) return
    setError("")
    try {
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: deckName, tazoIds: [] }),
      })
      if (res.ok) { setDeckName(""); setShowCreate(false); fetchDecks() }
      else { const d = await res.json(); setError(d.error || "Failed") }
    } catch { setError("Network error") }
  }

  const handleActivate = async (deckId: string) => {
    await fetch(`/api/decks/${deckId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: true }),
    })
    fetchDecks()
  }

  const handleDelete = async (deckId: string) => {
    if (!confirm(t.common_confirm_delete)) return
    await fetch(`/api/decks/${deckId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    })
    fetchDecks()
  }

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center mag-bg">
        <div className="mag-spinner w-12 h-12 rounded-full border-4 border-[#FFCC00] border-t-[#E3350D]" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 mag-bg">
        <div className="text-center space-y-5">
          <Layers className="w-16 h-16 text-[#1a1a1a]/20 mx-auto" />
          <p className="font-bold text-sm text-[#1a1a1a]/50 uppercase tracking-wider">{t.auth_login_subtitle}</p>
          <Link href="/login" className="inline-block py-3 px-8 mag-btn bg-[#E3350D] text-white text-sm font-black uppercase tracking-widest">
            {t.auth_login}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <MagazinePageShell currentTab="layers">
    <div className="min-h-screen flex flex-col mag-bg">
      {/* Magazine masthead */}
      <header className="bg-[#3B4CCA] border-b-4 border-[#1a1a1a] mag-stripes">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="text-white hover:opacity-70">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mag-stroke-sm">
            {t.decks_title}
          </h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="ml-auto mag-btn bg-[#FFCC00] text-[#1a1a1a] flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            {t.decks_create}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {/* Create form */}
        {showCreate && (
          <div className="mb-6 border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-4" style={{ background: "white" }}>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder={t.decks_name_placeholder}
                className="flex-1 border-3 border-[#1a1a1a] px-4 py-2.5 text-sm font-bold text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 shadow-[2px_2px_0px_#1a1a1a] focus:outline-none focus:border-[#3B4CCA]"
                style={{ background: "#fffef0" }}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={handleCreate} className="mag-btn bg-[#3B4CCA] text-white px-5 py-2.5 text-xs font-black uppercase tracking-wider">
                  {t.decks_create}
                </button>
                <button onClick={() => setShowCreate(false)} className="mag-btn bg-[#1a1a1a] text-[#FFCC00] px-3 py-2.5 text-xs font-black uppercase tracking-wider">
                  {t.common_cancel}
                </button>
              </div>
            </div>
            {error && <p className="text-sm font-bold text-[#E3350D] mt-2">{error}</p>}
            <p className="text-[10px] font-bold text-[#1a1a1a]/50 mt-2 uppercase tracking-wider">
              ${t.decks_select_tazos} -- {t.decks_select_tazos} — {t.decks_min_tazos}
            </p>
          </div>
        )}

        {/* Decks list */}
        {decks.length > 0 ? (
          <div className="space-y-4">
            {decks.map((deck) => (
              <div
                key={deck.id}
                className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 hover:shadow-[6px_6px_0px_#1a1a1a] hover:-translate-y-[1px] transition-all"
                style={{ background: "white" }}
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-[#1a1a1a] uppercase tracking-tight">{deck.name}</h2>
                      {deck.isActive && (
                        <span className="inline-flex items-center gap-1 text-[9px] bg-[#FFCC00] text-[#1a1a1a] font-black px-2 py-0.5 border-2 border-[#1a1a1a] uppercase tracking-wider shadow-[2px_2px_0px_#1a1a1a]">
                          <Star className="w-2.5 h-2.5 fill-[#1a1a1a]" />
                          {t.decks_active}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-[#1a1a1a]/50 uppercase tracking-wider mt-0.5">
                      {deck.tazoCount} {t.decks_tazo_count}
                    </p>
                  </div>

                  <div className="flex gap-1.5">
                    {!deck.isActive && (
                      <button
                        onClick={() => handleActivate(deck.id)}
                        className="mag-btn bg-[#FFCC00] text-[#1a1a1a] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                      >
                        <Star className="w-3 h-3" />
                        {t.decks_activate}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(deck.id)}
                      className="mag-btn bg-white text-[#E3350D] border-[#E3350D] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                      style={{ borderWidth: "3px", borderStyle: "solid" }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Tazo strip */}
                {deck.tazos.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {deck.tazos.map((tazo) => {
                      const borderColor = FRANCHISE_BORDER[tazo.franchise] || "#1a1a1a"
                      return (
                        <div
                          key={tazo.id}
                          className="shrink-0 border-3 shadow-[2px_2px_0px_#1a1a1a] overflow-hidden"
                          style={{ borderColor, background: "white", width: "80px" }}
                        >
                          <div className="h-1" style={{ background: borderColor }} />
                          <div className="p-1.5 flex items-center justify-center bg-[#fffef0]" style={{ aspectRatio: "1" }}>
                            {tazo.imageUrl ? (
                              <img src={tazo.imageUrl} alt={tazo.name || ""} className="w-full h-full object-contain" loading="lazy" />
                            ) : (
                              <span className="text-xl font-black text-[#1a1a1a]/15">?</span>
                            )}
                          </div>
                          <div className="p-1">
                            <p className="text-[8px] font-black text-[#1a1a1a] truncate leading-tight">
                              {tazo.name || "?"}
                            </p>
                            <div className="flex gap-0.5 mt-0.5">
                              <span className="text-[7px] font-bold text-[#E3350D]">{tazo.attack}</span>
                              <span className="text-[7px] font-bold text-[#1a1a1a]/30">/</span>
                              <span className="text-[7px] font-bold text-[#3B4CCA]">{tazo.defense}</span>
                              <span className="text-[7px] font-bold text-[#1a1a1a]/30">/</span>
                              <span className="text-[7px] font-bold text-[#F59E0B]">{tazo.bounce}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs font-bold text-[#1a1a1a]/30 italic uppercase tracking-wider py-4 text-center border-2 border-dashed border-[#1a1a1a]/20">
                    {t.decks_select_tazos}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : !showCreate ? (
          /* Empty state */
          <div
            className="text-center py-20 border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]"
            style={{ background: "#fffef0" }}
          >
            <Layers className="w-20 h-20 text-[#1a1a1a]/15 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-[#E3350D] mb-2 uppercase tracking-wider mag-stroke-sm">
              {t.decks_empty}
            </h2>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-block mt-4 py-3 px-8 mag-btn bg-[#3B4CCA] text-white text-sm font-black uppercase tracking-widest"
            >
              {t.decks_create}
            </button>
          </div>
        ) : null}
      </main>
    </div>
    </MagazinePageShell>
  )
}
