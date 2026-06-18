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
  color?: string; textureUrl?: string; tubeSlug?: string; createdAt: string; updatedAt?: string
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

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  const handleSaveBuilder = async (data: { name: string; color: string; tazoIds: string[]; textureUrl?: string; tubeSlug?: string }) => {
    if (data.tazoIds.length < 1) return
    setSaving(true)
    setSaveError("")

    try {
      const method = editingDeck ? "PATCH" : "POST"
      const url = editingDeck ? `/api/decks/${editingDeck.id}` : "/api/decks"

      const body: any = {
        name: data.name,
        tazoIds: data.tazoIds,
        color: data.color,
        textureUrl: data.textureUrl,
        tubeSlug: data.tubeSlug,
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

      const result = await res.json()
      if (res.ok) {
        setShowBuilder(false)
        setEditingDeck(null)
        fetchDecks()
      } else {
        setSaveError(result.error || "Failed to save deck")
      }
    } catch (err: any) {
      setSaveError(err.message || "Network error")
    } finally {
      setSaving(false)
    }
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
        <div className="mag-spinner w-10 h-10 rounded-full border-4 border-ttg-yellow border-t-ttg-red" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="py-20 text-center space-y-5">
        <Layers className="w-14 h-14 text-ttg-black/15 mx-auto" />
        <p className="font-black text-sm text-ttg-black/40 uppercase tracking-wider">
          {t.auth_login_subtitle}
        </p>
        <Link
          href="/login"
          className="inline-block py-3 px-8 mag-btn bg-ttg-red text-white text-xs font-black uppercase tracking-widest"
        >
          {t.auth_login}
        </Link>
      </div>
    )
  }

  // ── Builder mode ──────────────────────────────────────
  if (showBuilder) {
    return (
      <div className="max-w-7xl mx-auto w-full py-4 sm:py-6 space-y-4">
        <div className="flex items-center gap-2">
          <PackageOpen className="w-5 h-5 text-ttg-yellow" />
          <h2 className="text-lg font-black uppercase text-ttg-black tracking-wide">
            {editingDeck ? `Edit: ${editingDeck.name}` : "Deck Builder"}
          </h2>
        </div>
        <DeckBuilder
          initialDeck={editingDeck ? {
            id: editingDeck.id,
            name: editingDeck.name,
            color: editingDeck.color || 'var(--ttg-red)',
            textureUrl: editingDeck.textureUrl || undefined,
            tubeSlug: editingDeck.tubeSlug || undefined,
            tazos: editingDeck.tazos,
          } : undefined}
          onSave={handleSaveBuilder}
          onCancel={() => { setShowBuilder(false); setEditingDeck(null); setSaveError("") }}
          saving={saving}
          saveError={saveError}
        />
      </div>
    )
  }

  // ── Main list ─────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto w-full py-4 sm:py-6 space-y-4">
      {/* ═══════════════════════════════════════════ */}
      {/* MAGAZINE BANNER STRIP                      */}
      {/* ═══════════════════════════════════════════ */}
      <div
        className="px-4 py-3 flex flex-wrap items-center gap-3 relative overflow-hidden"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.025) 6px, rgba(255,255,255,0.025) 12px), linear-gradient(90deg, var(--ttg-black) 0%, #2a2a2a 100%)`,
          border: "3px solid var(--ttg-black)",
          boxShadow: "4px 4px 0px var(--ttg-yellow)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <PackageOpen className="w-5 h-5 text-ttg-yellow" />
          <h1 className="text-sm sm:text-lg font-black text-white uppercase tracking-tight">
            Decks
          </h1>
        </div>
        <div className="w-px h-5 bg-white/15" />
        <span className="text-sm font-black text-ttg-yellow tracking-tight">
          {decks.length} DECKS
        </span>
        <button
          onClick={() => setShowBuilder(true)}
          className="ml-auto mag-btn bg-ttg-blue text-white flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-wider border-3 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_var(--ttg-black)] transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Deck
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
                className="border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] bg-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_var(--ttg-black)] transition-all"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Tube preview column */}
                  <div className="flex-shrink-0 flex items-center justify-center py-4 px-3 sm:border-r-3 border-ttg-black/10" style={{ background: deck.color + "08" }}>
                    <BattleTubePreview
                      name={deck.name}
                      color={deck.color || 'var(--ttg-blue)'}
                      count={deck.tazoCount}
                      maxCount={20}
                      tazos={deck.tazos.slice(0, 10).map(t => ({
                        id: t.id, name: t.name, displayName: t.displayName,
                        imageUrl: t.imageUrl, franchiseSlug: t.franchiseSlug || t.franchise,
                        finish: t.finish, creatureVariant: t.creatureVariant, shinyImageUrl: t.shinyImageUrl,
                      }))}
                      size="md"
                    />
                  </div>

                  {/* Info column */}
                  <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col justify-between">
                    {/* Top row: name + actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-black text-ttg-black uppercase tracking-tight truncate">
                          {deck.name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {/* Fill badge */}
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 border-2 border-ttg-black uppercase tracking-wider shadow-[2px_2px_0px_var(--ttg-black)] ${
                            deck.tazoCount >= 20
                              ? "bg-ttg-success text-white"
                              : "bg-ttg-cream text-ttg-black"
                          }`}>
                            {deck.tazoCount >= 20 ? (
                              <><CheckCircle className="w-2.5 h-2.5" /> Sealed</>
                            ) : (
                              <>{deck.tazoCount}/20 tazos</>
                            )}
                          </span>

                          {deck.isActive && (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-ttg-yellow text-ttg-black font-black px-2 py-0.5 border-2 border-ttg-black uppercase tracking-wider shadow-[2px_2px_0px_var(--ttg-black)]">
                              <Star className="w-2.5 h-2.5 fill-ttg-black" />
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
                          className="mag-btn bg-ttg-black text-ttg-yellow px-2.5 py-2 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border-2 border-ttg-black"
                          title="Edit deck"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        {!deck.isActive && (
                          <button
                            onClick={() => handleActivate(deck.id)}
                            className="mag-btn bg-ttg-yellow text-ttg-black px-2.5 py-2 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border-2 border-ttg-black"
                          >
                            <Star className="w-3 h-3" />
                            <span className="hidden sm:inline">Set Active</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(deck.id)}
                          className="mag-btn bg-white text-ttg-red px-2.5 py-2 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border-2 border-ttg-red"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom: compact stats + tazo preview pills */}
                    <div className="mt-4 space-y-3">
                      {/* Stats row */}
                      <div className="flex flex-wrap gap-3 text-[10px] font-bold">
                        <span className="text-ttg-red flex items-center gap-0.5">
                          <Swords className="w-3 h-3" /> {avgAtk} ATK
                        </span>
                        <span className="text-ttg-blue flex items-center gap-0.5">
                          <Shield className="w-3 h-3" /> {avgDef} DEF
                        </span>
                        <span className="text-ttg-yellow flex items-center gap-0.5">
                          <Zap className="w-3 h-3" /> {totalP} TP
                        </span>
                        <span className="text-ttg-black/30">
                          Created {new Date(deck.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Tazo chip pills — compact, just circles */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {deck.tazos.slice(0, 12).map(t => {
                          return (
                            <div
                              key={t.id}
                              className="w-7 h-7 rounded-full overflow-hidden border-2 flex-shrink-0 border-ttg-black/15"
                              title={t.displayName || t.name}
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
                          <span className="text-[9px] font-black text-ttg-black/30 ml-1">
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
        /* Empty state — Deck illustration */
        <div className="text-center py-20 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)]" style={{ background: 'var(--ttg-cream)' }}>
          <div className="flex justify-center mb-6">
            <div className="relative">
              <BattleTubePreview name="" color='var(--ttg-red)' count={0} maxCount={20} size="lg" showLabel={false} />
              <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-ttg-black border-3 border-ttg-yellow flex items-center justify-center rounded-full shadow-[3px_3px_0px_var(--ttg-black)]">
                <span className="text-ttg-yellow text-lg font-black">?</span>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-black text-ttg-red mb-2 uppercase tracking-wider">
            No Decks Yet
          </h2>
          <p className="text-xs font-bold text-ttg-black/40 max-w-xs mx-auto mb-5">
            Build a 20-tazo deck and seal it for battle.
          </p>
          <button
            onClick={() => setShowBuilder(true)}
            className="inline-block mt-4 py-3 px-8 mag-btn bg-ttg-blue text-white text-sm font-black uppercase tracking-widest border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_var(--ttg-black)] transition-all"
          >
            <Plus className="w-4 h-4 inline mr-1.5" />
            Create Deck
          </button>
        </div>
      )}
    </div>
  )
}
