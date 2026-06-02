"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import { Layers, Plus, Trash2, Star, ArrowLeft } from "lucide-react"

interface DeckTazo {
  id: string
  name: string
  displayName: string
  imageUrl: string
  franchise: string
  attack: number
  defense: number
  spin: number
}

interface Deck {
  id: string
  name: string
  isActive: boolean
  tazoCount: number
  tazos: DeckTazo[]
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
    fetch("/api/decks", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((d) => setDecks(d.decks || []))
      .catch(() => {})
      .finally(() => setFetching(false))
  }

  useEffect(() => {
    fetchDecks()
  }, [token])

  const handleCreate = async () => {
    if (!deckName.trim()) return
    setError("")
    try {
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: deckName, tazoIds: [] }),
      })
      if (res.ok) {
        setDeckName("")
        setShowCreate(false)
        fetchDecks()
      } else {
        const d = await res.json()
        setError(d.error || "Failed to create deck")
      }
    } catch {
      setError("Network error")
    }
  }

  const handleActivate = async (deckId: string) => {
    await fetch(`/api/decks/${deckId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive: true }),
    })
    fetchDecks()
  }

  const handleDelete = async (deckId: string) => {
    if (!confirm(t.common_confirm_delete)) return
    await fetch(`/api/decks/${deckId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    fetchDecks()
  }

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Layers className="w-12 h-12 text-zinc-600 mx-auto" />
          <p className="text-zinc-400">{t.auth_login_subtitle}</p>
          <Link href="/login" className="inline-block bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors">
            {t.auth_login}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-white">{t.decks_title}</h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="ml-auto flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t.decks_create}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4">
        {/* Create deck form */}
        {showCreate && (
          <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder={t.decks_name_placeholder}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
              <button
                onClick={handleCreate}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                {t.decks_create}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="text-zinc-400 hover:text-white text-sm px-2"
              >
                {t.common_cancel}
              </button>
            </div>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            <p className="text-zinc-500 text-xs mt-2">
              ✨ {t.decks_select_tazos} — {t.decks_min_tazos}
            </p>
          </div>
        )}

        {/* Decks list */}
        {decks.length > 0 ? (
          <div className="space-y-4">
            {decks.map((deck) => (
              <div
                key={deck.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">{deck.name}</h3>
                      {deck.isActive && (
                        <span className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full font-semibold">
                          {t.decks_active}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {deck.tazoCount} {t.decks_tazo_count}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {!deck.isActive && (
                      <button
                        onClick={() => handleActivate(deck.id)}
                        className="flex items-center gap-1 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded transition-colors"
                        title={t.decks_activate}
                      >
                        <Star className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(deck.id)}
                      className="flex items-center gap-1 text-[10px] bg-zinc-800 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 px-2 py-1 rounded transition-colors"
                      title={t.decks_delete}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Tazo preview strip */}
                {deck.tazos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {deck.tazos.map((tazo) => (
                      <div
                        key={tazo.id}
                        className="shrink-0 w-14 h-14 bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden"
                      >
                        {tazo.imageUrl ? (
                          <img
                            src={tazo.imageUrl}
                            alt={tazo.name || ""}
                            className="w-12 h-12 object-contain"
                          />
                        ) : (
                          <span className="text-zinc-600 text-xs">{tazo.name?.[0] || "?"}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {deck.tazos.length === 0 && (
                  <p className="text-xs text-zinc-600 italic">{t.decks_select_tazos}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Layers className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">{t.decks_empty}</p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              {t.decks_create}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
