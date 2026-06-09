"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import { Layers, Plus, Trash2, Star, Swords, Edit3, Shield, Zap, PackageOpen, CheckCircle } from "lucide-react"
import DeckBuilder from "@/components/game/deck-builder"
import TazoDiscImage from "@/components/game/tazo-disc-image"
import BattleTubePreview from "@/components/tubes/BattleTubePreview"
import type { TazoFinish, TazoCreatureVariant } from "@/lib/battle/game-loop"

// ── Types ──────────────────────────────────────────────
interface DeckTazo {
  id: string; name: string; displayName: string; imageUrl: string; franchise: string
  franchiseSlug: string; attack: number; defense: number; resistance: number
  weight: number; stability: number; spin: number
  control: number; bounce: number; precision: number
  rarity: string; role?: string | null; number: string | number
  finish?: string | null
  creatureVariant?: string | null
  shinyImageUrl?: string | null
  wear?: number
}
interface Deck {
  id: string; name: string; isActive: boolean; tazoCount: number; tazos: DeckTazo[]
  color?: string; starters?: string[]; createdAt: string; updatedAt?: string
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
          <PackageOpen className="w-5 h-5 text-[#FFCC00]" />
          <h2 className="text-lg font-black uppercase text-[#1a1a1a] tracking-wide">
            {editingDeck ? `Edit: ${editingDeck.name}` : "Battle Tube Builder"}
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
        className="px-4 py-3 flex flex-wrap items-center gap-3 relative overflow-hidden"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.025) 6px, rgba(255,255,255,0.025) 12px), linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 100%)`,
          border: "3px solid #1a1a1a",
          boxShadow: "4px 4px 0px #FFCC00",
        }}
      >
        <div className="flex items-center gap-1.5">
          <PackageOpen className="w-5 h-5 text-[#FFCC00]" />
          <h1 className="text-sm sm:text-lg font-black text-white uppercase tracking-tight">
            Battle Tubes
          </h1>
        </div>
        <div className="w-px h-5 bg-white/15" />
        <span className="text-sm font-black text-[#FFCC00] tracking-tight">
          {decks.length} TUBES
        </span>
        <button
          onClick={() => setShowBuilder(true)}
          className="ml-auto mag-btn bg-[#3B4CCA] text-white flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-wider border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1a1a1a] transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Battle Tube
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
                className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] bg-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#1a1a1a] transition-all"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Tube preview column */}
                  <div className="flex-shrink-0 flex items-center justify-center py-4 px-3 sm:border-r-3 border-[#1a1a1a]/10" style={{ background: deck.color + "08" }}>
                    <BattleTubePreview
                      name={deck.name}
                      color={deck.color || "#3B4CCA"}
                      count={deck.tazoCount}
                      maxCount={20}
                      tazos={deck.tazos.slice(0, 10).map(t => ({
                        id: t.id, name: t.name, displayName: t.displayName,
                        imageUrl: t.imageUrl, franchiseSlug: t.franchiseSlug || t.franchise,
                        finish: t.finish, creatureVariant: t.creatureVariant, shinyImageUrl: t.shinyImageUrl,
                      }))}
                      starters={deck.starters || []}
                      size="md"
                      showCap
                    />
                  </div>

                  {/* Info column */}
                  <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col justify-between">
                    {/* Top row: name + actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-black text-[#1a1a1a] uppercase tracking-tight truncate">
                          {deck.name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {/* Fill badge */}
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 border-2 border-[#1a1a1a] uppercase tracking-wider shadow-[2px_2px_0px_#1a1a1a] ${
                            deck.tazoCount >= 20
                              ? "bg-[#22C55E] text-white"
                              : "bg-[#fffef0] text-[#1a1a1a]"
                          }`}>
                            {deck.tazoCount >= 20 ? (
                              <><CheckCircle className="w-2.5 h-2.5" /> Sealed</>
                            ) : (
                              <>{deck.tazoCount}/20 tazos</>
                            )}
                          </span>
                          {/* Starter count */}
                          <span className="text-[9px] font-bold text-[#E3350D] flex items-center gap-0.5">
                            <Swords className="w-2.5 h-2.5" /> {deck.starters?.length || 0} starters
                          </span>
                          {deck.isActive && (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-[#FFCC00] text-[#1a1a1a] font-black px-2 py-0.5 border-2 border-[#1a1a1a] uppercase tracking-wider shadow-[2px_2px_0px_#1a1a1a]">
                              <Star className="w-2.5 h-2.5 fill-[#1a1a1a]" />
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingDeck(deck)
                            setShowBuilder(true)
                          }}
                          className="mag-btn bg-[#1a1a1a] text-[#FFCC00] px-2.5 py-2 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border-2 border-[#1a1a1a]"
                          title="Edit tube"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        {!deck.isActive && (
                          <button
                            onClick={() => handleActivate(deck.id)}
                            className="mag-btn bg-[#FFCC00] text-[#1a1a1a] px-2.5 py-2 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border-2 border-[#1a1a1a]"
                          >
                            <Star className="w-3 h-3" />
                            <span className="hidden sm:inline">Set Active</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(deck.id)}
                          className="mag-btn bg-white text-[#E3350D] px-2.5 py-2 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border-2 border-[#E3350D]"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom: compact stats + tazo preview pills */}
                    <div className="mt-4 space-y-3">
                      {/* Stats row */}
                      <div className="flex flex-wrap gap-3 text-[10px] font-bold">
                        <span className="text-[#E3350D] flex items-center gap-0.5">
                          <Swords className="w-3 h-3" /> {avgAtk} ATK
                        </span>
                        <span className="text-[#3B4CCA] flex items-center gap-0.5">
                          <Shield className="w-3 h-3" /> {avgDef} DEF
                        </span>
                        <span className="text-[#FFCC00] flex items-center gap-0.5">
                          <Zap className="w-3 h-3" /> {totalP} TP
                        </span>
                        <span className="text-[#1a1a1a]/30">
                          Created {new Date(deck.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Tazo chip pills — compact, just circles */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {deck.tazos.slice(0, 12).map(t => {
                          const isStarter = deck.starters?.includes(t.id)
                          return (
                            <div
                              key={t.id}
                              className="w-7 h-7 rounded-full overflow-hidden border-2 flex-shrink-0"
                              style={{
                                background: "#1a1a1a",
                                borderColor: isStarter ? deck.color || "#E3350D" : "#1a1a1a/30",
                                boxShadow: isStarter ? `0 0 6px ${deck.color || "#E3350D"}40` : "none",
                              }}
                              title={`${t.displayName || t.name}${isStarter ? " (Starter)" : ""}`}
                            >
                              <TazoDiscImage
                                src={t.imageUrl}
                                alt={t.name || ""}
                                size="100%"
                                borderWidth={0}
                                franchiseSlug={t.franchiseSlug || t.franchise}
                                finish={t.finish as TazoFinish || "normal"}
                                creatureVariant={t.creatureVariant as TazoCreatureVariant || "standard"}
                                shinyImageUrl={t.shinyImageUrl}
                                lazy
                              />
                            </div>
                          )
                        })}
                        {deck.tazos.length > 12 && (
                          <span className="text-[9px] font-black text-[#1a1a1a]/30 ml-1">
                            +{deck.tazos.length - 12}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Empty state — Battle Tube illustration */
        <div className="text-center py-20 border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]" style={{ background: "#fffef0" }}>
          <div className="flex justify-center mb-6">
            <div className="relative">
              <BattleTubePreview name="" color="#E3350D" count={0} maxCount={20} size="lg" showCap showLabel={false} />
              <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-[#1a1a1a] border-3 border-[#FFCC00] flex items-center justify-center rounded-full shadow-[3px_3px_0px_#1a1a1a]">
                <span className="text-[#FFCC00] text-lg font-black">?</span>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-black text-[#E3350D] mb-2 uppercase tracking-wider">
            No Battle Tubes Yet
          </h2>
          <p className="text-xs font-bold text-[#1a1a1a]/40 max-w-xs mx-auto mb-5">
            Build a 20-tazo tube, pick 5 starters, and seal it for battle.
          </p>
          <button
            onClick={() => setShowBuilder(true)}
            className="inline-block mt-4 py-3 px-8 mag-btn bg-[#3B4CCA] text-white text-sm font-black uppercase tracking-widest border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#1a1a1a] transition-all"
          >
            <Plus className="w-4 h-4 inline mr-1.5" />
            Create Battle Tube
          </button>
        </div>
      )}
    </div>
  )
}
