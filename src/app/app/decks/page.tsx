"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import { Layers, Plus, Trash2, Star, Swords, Edit3, Disc3, TrendingUp, Shield, Zap } from "lucide-react"
import DeckBuilder from "@/components/game/deck-builder"

// ── Types ──────────────────────────────────────────────
interface DeckTazo {
  id: string; name: string; displayName: string; imageUrl: string; franchise: string
  franchiseSlug: string; attack: number; defense: number; resistance: number
  weight: number; stability: number; spin: number
  control: number; bounce: number; precision: number
  rarity: string; role?: string | null; number: string | number
}
interface Deck {
  id: string; name: string; isActive: boolean; tazoCount: number; tazos: DeckTazo[]
  color?: string; starters?: string[]
}

const FRANCHISE_BORDER: Record<string, string> = {
  minimon: "#FFCB05", cybermon: "#00A1E9", dracobell: "#FF6B00",
}

const RARITY_COLOR: Record<string, string> = {
  common: "#9CA3AF", uncommon: "#22C55E", rare: "#3B82F6", ultra: "#A855F7", legendary: "#F59E0B",
}

function totalPower(t: DeckTazo): number {
  return t.attack + t.defense + t.resistance + t.weight + t.stability +
    t.spin + t.control + t.bounce + t.precision
}

export default function DecksPage() {
  const { t } = useI18n()
  const { user, token, loading } = useAuth()
  const [decks, setDecks] = useState<Deck[]>([])
  const [fetching, setFetching] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null)

  const fetchDecks = useCallback(() => {
    if (!token) return
    fetch("/api/decks", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((d) => setDecks(d.decks || []))
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [token])

  useEffect(() => { fetchDecks() }, [fetchDecks])

  const handleSaveBuilder = async (data: { name: string; color: string; tazoIds: string[]; starterIds: string[] }) => {
    if (data.tazoIds.length < 1) return // Safety: API requires ≥1 tazo

    try {
      const method = editingDeck ? "PATCH" : "POST"
      const url = editingDeck ? `/api/decks/${editingDeck.id}` : "/api/decks"

      const body: any = {
        name: data.name,
        tazoIds: data.tazoIds,
        color: data.color,
        starterIds: data.starterIds,
      }
      if (editingDeck) body.name = data.name

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setShowBuilder(false)
        setEditingDeck(null)
        fetchDecks()
      }
    } catch { /* handled by refetch */ }
  }

  const handleActivate = async (deckId: string) => {
    await fetch(`/api/decks/${deckId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

  // ── Loading / Auth states ─────────────────────────────
  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="mag-spinner w-10 h-10 rounded-full border-4 border-[#FFCC00] border-t-[#E3350D]" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="py-20 text-center space-y-5">
        <Layers className="w-14 h-14 text-[#1a1a1a]/15 mx-auto" />
        <p className="font-black text-sm text-[#1a1a1a]/40 uppercase tracking-wider">
          {t.auth_login_subtitle}
        </p>
        <Link
          href="/login"
          className="inline-block py-3 px-8 mag-btn bg-[#E3350D] text-white text-xs font-black uppercase tracking-widest"
        >
          {t.auth_login}
        </Link>
      </div>
    )
  }

  // ── Builder mode ──────────────────────────────────────
  if (showBuilder) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#3B4CCA]" />
          <h2 className="text-lg font-black uppercase text-[#1a1a1a] tracking-wide">
            {editingDeck ? `Edit: ${editingDeck.name}` : "Deck Builder"}
          </h2>
        </div>
        <DeckBuilder
          initialDeck={editingDeck ? {
            id: editingDeck.id,
            name: editingDeck.name,
            color: editingDeck.color || "#E3350D",
            tazos: editingDeck.tazos,
            starters: editingDeck.starters || [],
          } : null}
          onSave={handleSaveBuilder}
          onCancel={() => { setShowBuilder(false); setEditingDeck(null) }}
        />
      </div>
    )
  }

  // ── Main list ─────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* ═══════════════════════════════════════════ */}
      {/* MAGAZINE BANNER STRIP                      */}
      {/* ═══════════════════════════════════════════ */}
      <div
        className="mag-card-yellow rounded-none px-4 py-3 flex flex-wrap items-center gap-3"
        style={{ borderBottom: "4px solid #1a1a1a" }}
      >
        <div className="flex items-center gap-1.5">
          <Layers className="w-5 h-5 text-[#3B4CCA]" />
          <span className="text-sm font-black text-[#1a1a1a] tracking-tight uppercase">
            {t.decks_title}
          </span>
        </div>
        <div className="w-px h-5 bg-[#1a1a1a]/30" />
        <span className="text-sm font-black text-[#3B4CCA] tracking-tight">
          {decks.length} DECKS
        </span>
        <button
          onClick={() => setShowBuilder(true)}
          className="ml-auto mag-btn bg-[#3B4CCA] text-white flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-wider border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1a1a1a] transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          {t.decks_create}
        </button>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* DECKS LIST                                 */}
      {/* ═══════════════════════════════════════════ */}
      {decks.length > 0 ? (
        <div className="space-y-4">
          {decks.map((deck) => {
            const avgAtk = deck.tazos.length > 0
              ? Math.round(deck.tazos.reduce((s, t) => s + t.attack, 0) / deck.tazos.length)
              : 0
            const avgDef = deck.tazos.length > 0
              ? Math.round(deck.tazos.reduce((s, t) => s + t.defense, 0) / deck.tazos.length)
              : 0
            const totalP = deck.tazos.reduce((s, t) => s + totalPower(t), 0)

            return (
              <div
                key={deck.id}
                className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] overflow-hidden"
                style={{ background: "white" }}
              >
                {/* Colored accent bar at top */}
                <div className="h-1.5" style={{ background: deck.color || "#3B4CCA" }} />

                <div className="p-4 sm:p-5">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    {/* Color indicator */}
                    <div
                      className="w-10 h-10 rounded-full border-3 border-[#1a1a1a] flex-shrink-0 shadow-[2px_2px_0px_#1a1a1a]"
                      style={{ background: deck.color || "#3B4CCA" }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-black text-[#1a1a1a] uppercase tracking-tight truncate">
                          {deck.name}
                        </h2>
                        {deck.isActive && (
                          <span className="inline-flex items-center gap-1 text-[9px] bg-[#FFCC00] text-[#1a1a1a] font-black px-2 py-0.5 border-2 border-[#1a1a1a] uppercase tracking-wider shadow-[2px_2px_0px_#1a1a1a]">
                            <Star className="w-2.5 h-2.5 fill-[#1a1a1a]" />
                            {t.decks_active}
                          </span>
                        )}
                      </div>

                      {/* Stats row */}
                      <div className="flex flex-wrap gap-3 mt-1.5">
                        <span className="text-[10px] font-black text-[#1a1a1a]/50 uppercase tracking-wider">
                          {deck.tazoCount}/20 {t.decks_tazo_count}
                        </span>
                        <span className="text-[10px] font-bold text-[#E3350D] flex items-center gap-0.5">
                          <Swords className="w-3 h-3" /> {avgAtk} ATK
                        </span>
                        <span className="text-[10px] font-bold text-[#3B4CCA] flex items-center gap-0.5">
                          <Shield className="w-3 h-3" /> {avgDef} DEF
                        </span>
                        <span className="text-[10px] font-bold text-[#FFCC00] flex items-center gap-0.5">
                          <Zap className="w-3 h-3" /> {totalP} TP
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingDeck(deck)
                          setShowBuilder(true)
                        }}
                        className="mag-btn bg-[#1a1a1a] text-[#FFCC00] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border-2 border-[#1a1a1a]"
                        title="Edit deck"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      {!deck.isActive && (
                        <button
                          onClick={() => handleActivate(deck.id)}
                          className="mag-btn bg-[#FFCC00] text-[#1a1a1a] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border-2 border-[#1a1a1a]"
                        >
                          <Star className="w-3 h-3" />
                          {t.decks_activate}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(deck.id)}
                        className="mag-btn bg-white text-[#E3350D] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border-2 border-[#E3350D]"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Tazo strip */}
                  {deck.tazos.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                      {deck.tazos.map((tazo) => {
                        const borderColor = FRANCHISE_BORDER[tazo.franchiseSlug || tazo.franchise] || "#1a1a1a"
                        const isStarter = deck.starters?.includes(tazo.id)
                        return (
                          <div
                            key={tazo.id}
                            className="shrink-0 border-3 shadow-[2px_2px_0px_#1a1a1a] overflow-hidden relative"
                            style={{ borderColor, background: "white", width: "80px" }}
                          >
                            {/* Starter badge */}
                            {isStarter && (
                              <div className="absolute -top-1 -right-1 z-10 w-5 h-5 rounded-full bg-[#E3350D] border-2 border-[#1a1a1a] flex items-center justify-center">
                                <Swords className="w-3 h-3 text-white" />
                              </div>
                            )}
                            <div className="h-1" style={{ background: borderColor }} />
                            <div className="p-1.5 flex items-center justify-center bg-[#fffef0]" style={{ aspectRatio: "1" }}>
                              {tazo.imageUrl ? (
                                <img
                                  src={tazo.imageUrl}
                                  alt={tazo.name || ""}
                                  className="w-full h-full object-cover rounded-full"
                                  loading="lazy"
                                />
                              ) : (
                                <span className="text-xl font-black text-[#1a1a1a]/15">?</span>
                              )}
                            </div>
                            <div className="p-1">
                              <p className="text-[8px] font-black text-[#1a1a1a] truncate leading-tight">
                                {tazo.name || "#" + tazo.number}
                              </p>
                              <div className="flex gap-0.5 mt-0.5">
                                <span className="text-[7px] font-bold text-[#E3350D]">{tazo.attack}</span>
                                <span className="text-[7px] font-bold text-[#1a1a1a]/30">/</span>
                                <span className="text-[7px] font-bold text-[#3B4CCA]">{tazo.defense}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      {/* Empty slots */}
                      {Array.from({ length: Math.max(0, 20 - deck.tazos.length) }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="shrink-0 border-2 border-dashed border-[#1a1a1a]/15 flex items-center justify-center"
                          style={{ width: "80px", aspectRatio: "1", background: "#fffef0" }}
                        >
                          <span className="text-[8px] font-black text-[#1a1a1a]/10">SLOT</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-[#1a1a1a]/30 italic uppercase tracking-wider py-4 text-center border-2 border-dashed border-[#1a1a1a]/20">
                      {t.decks_select_tazos}
                    </p>
                  )}

                  {/* Empty slots counter */}
                  {deck.tazos.length < 20 && deck.tazos.length > 0 && (
                    <p className="text-[9px] font-bold text-[#1a1a1a]/20 uppercase tracking-wider mt-2 text-right">
                      {20 - deck.tazos.length} empty slot{20 - deck.tazos.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Empty state */
        <div
          className="text-center py-20 border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]"
          style={{ background: "#fffef0" }}
        >
          <Layers className="w-20 h-20 text-[#1a1a1a]/15 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-[#E3350D] mb-2 uppercase tracking-wider mag-stroke-sm">
            {t.decks_empty}
          </h2>
          <p className="text-xs font-bold text-[#1a1a1a]/40 max-w-xs mx-auto mb-5">
            Build a deck of up to 20 tazos, choose 5 battle starters, and enter the arena.
          </p>
          <button
            onClick={() => setShowBuilder(true)}
            className="inline-block mt-4 py-3 px-8 mag-btn bg-[#3B4CCA] text-white text-sm font-black uppercase tracking-widest border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#1a1a1a] transition-all"
          >
            <Plus className="w-4 h-4 inline mr-1.5" />
            {t.decks_create}
          </button>
        </div>
      )}
    </div>
  )
}
