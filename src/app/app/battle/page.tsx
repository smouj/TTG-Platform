"use client"

// ============================================================
// Trading Tazos Game — Battle Lobby v3
// Magazine-themed lobby at /app/battle
// Shows tube visual + mode selection + stats + start button.
// Navigates to /app/battle/play for actual gameplay.
// ============================================================

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { playSFX, sfxEnsureUnlocked } from "@/lib/audio/sfx-engine"
import BattleTubePreview from "@/components/tubes/BattleTubePreview"
import TazoDiscImage from "@/components/game/tazo-disc-image"
import {
  Swords, Bot, Globe, Play, Zap, Shield, Crosshair, Star,
  ChevronRight, Layers, Loader2, AlertTriangle, CheckCircle,
} from "lucide-react"

// ── Mode definitions ──
const MODES = [
  {
    id: "practice",
    icon: Bot,
    title: "Practice",
    desc: "Train against AI — no pressure. Perfect your strategy with adjustable difficulty.",
    color: "#22C55E",
    gradient: "linear-gradient(135deg, #22C55E, #16A34A)",
    badge: "AVAILABLE",
    available: true,
  },
  {
    id: "pvp_ranked",
    icon: Globe,
    title: "Ranked PvP",
    desc: "Competitive matchmaking with global leaderboard and seasonal rewards.",
    color: "#E3350D",
    gradient: "linear-gradient(135deg, #E3350D, #C62828)",
    badge: "COMING SOON",
    available: false,
  },
  {
    id: "pvp_friend",
    icon: Swords,
    title: "Friend Battle",
    desc: "Invite a friend with a room code. Direct 1v1, no leaderboard pressure.",
    color: "#3B4CCA",
    gradient: "linear-gradient(135deg, #3B4CCA, #283593)",
    badge: "COMING SOON",
    available: false,
  },
] as const

const DIFFICULTIES = [
  { id: "novice", label: "Novice", desc: "Chill — great for learning" },
  { id: "skilled", label: "Skilled", desc: "Fair fight — balanced AI" },
  { id: "master", label: "Master", desc: "Expert — no mercy" },
] as const

function CreateQuickDeckButton({ onCreated }: { onCreated: (deckId: string) => void }) {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  const handleCreate = useCallback(async () => {
    setCreating(true)
    setError("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: "Battle Deck", isActive: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create deck")
      onCreated(data.deck?.id || data.id)
    } catch (e: any) {
      setError(e.message || "Could not create deck")
    } finally {
      setCreating(false)
    }
  }, [onCreated])

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <button
        onClick={handleCreate}
        disabled={creating}
        className="inline-block py-3 px-8 bg-[#22C55E] text-white text-sm font-black uppercase tracking-widest border-[3px] border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#1a1a1a] transition-all disabled:opacity-50 disabled:cursor-wait"
      >
        {creating ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Quick Deck
          </span>
        )}
      </button>
      {error && <span className="text-[9px] font-bold text-[#E3350D]">{error}</span>}
    </div>
  )
}

export default function BattlePage() {
  const { user } = useAuth()
  const router = useRouter()

  const [mode, setMode] = useState<string>("practice")
  const [difficulty, setDifficulty] = useState<string>("skilled")
  const [decks, setDecks] = useState<any[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user decks
  useEffect(() => {
    if (!user) { setLoading(false); return }
    const token = localStorage.getItem("token")
    fetch("/api/decks", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(d => {
        const list = d.decks || []
        setDecks(list)
        const active = list.find((dk: any) => dk.isActive) || list[0] || null
        if (active) setSelectedDeckId(active.id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const selectedDeck = useMemo(() => {
    if (!selectedDeckId) return null
    return decks.find(d => d.id === selectedDeckId) || null
  }, [selectedDeckId, decks])

  const deckStats = useMemo(() => {
    const tazos = selectedDeck?.tazos || []
    if (tazos.length === 0) return { atk: 0, def: 0, prc: 0, spd: 0, count: 0 }
    const avg = (fn: (t: any) => number) => Math.round(tazos.reduce((s, t) => s + fn(t), 0) / tazos.length)
    return {
      atk: avg(t => t.attack || 50),
      def: avg(t => t.defense || 50),
      prc: avg(t => t.precision || 50),
      spd: avg(t => (t.bounce || 0) + (t.spin || 0)),
      count: tazos.length,
    }
  }, [selectedDeck])

  const handleStart = () => {
    if (!selectedDeckId) return
    sfxEnsureUnlocked()
    playSFX("equip")

    // Set sessionStorage for BattleView to auto-start
    sessionStorage.setItem("battle_mode", "practice")
    sessionStorage.setItem("battle_difficulty", difficulty)
    sessionStorage.setItem("battle_deckId", selectedDeckId)

    // Instant navigation — loading handled by /play page
    router.push("/app/battle/play")
  }

  const canStart = selectedDeckId && deckStats.count >= 1 && mode === "practice"
  const noDecks = !loading && decks.length === 0

  return (
    <div className="w-full py-4 sm:py-6 space-y-6">


      {/* ═══════════════════════════════════════════ */}
      {/* MAGAZINE BANNER                           */}
      {/* ═══════════════════════════════════════════ */}
      <div
        className="px-4 py-3 flex flex-wrap items-center gap-3 relative overflow-hidden"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.025) 6px, rgba(255,255,255,0.025) 12px), linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 100%)`,
          border: "3px solid #1a1a1a",
          boxShadow: "4px 4px 0px #FFCC00",
        }}
      >
        <Swords className="w-5 h-5 text-[#FFCC00]" />
        <h1 className="text-sm sm:text-lg font-black text-white uppercase tracking-tight">
          Battle Arena
        </h1>
        <div className="w-px h-5 bg-white/15" />
        <span className="text-xs sm:text-sm font-black text-[#FFCC00]">
          {selectedDeck
            ? `${selectedDeck.name} · ${deckStats.count} tazos`
            : `${decks.length} DECKS AVAILABLE`}
        </span>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* NO DECKS — EMPTY STATE                      */}
      {/* ═══════════════════════════════════════════ */}
      {noDecks && (
        <div
          className="text-center py-16 border-[3px] border-[#1a1a1a]"
          style={{
            background: "#fffef0",
            boxShadow: "4px 4px 0px #1a1a1a",
          }}
        >
          <div className="flex justify-center mb-4">
            <div className="relative">
              <BattleTubePreview name="" color="#E3350D" count={0} maxCount={20} size="lg" showLabel={false} />
              <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-[#1a1a1a] border-[3px] border-[#FFCC00] flex items-center justify-center rounded-full shadow-[3px_3px_0px_#1a1a1a]">
                <span className="text-[#FFCC00] text-lg font-black">?</span>
              </div>
            </div>
          </div>
          <h2 className="text-xl font-black text-[#E3350D] mb-2 uppercase tracking-wider">
            No Decks Yet
          </h2>
          <p className="text-xs font-bold text-[#1a1a1a]/40 max-w-xs mx-auto mb-5 leading-relaxed">
            You need a Deck to enter the arena. Create one instantly with your best 5 tazos, or build custom in Decks.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <CreateQuickDeckButton onCreated={(deckId: string) => {
              setSelectedDeckId(deckId)
              // Refresh deck list
              const token = localStorage.getItem("token")
              fetch("/api/decks", {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              })
                .then(r => r.json())
                .then(d => {
                  setDecks(d.decks || [])
                  setLoading(false)
                })
            }} />
            <a
              href="/app/decks"
              className="inline-block py-3 px-8 bg-white text-[#1a1a1a] text-sm font-black uppercase tracking-widest border-[3px] border-[#1a1a1a] hover:bg-zinc-50 transition-all no-underline"
            >
              <Layers className="w-4 h-4 inline mr-1.5" />
              Custom Deck
            </a>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* MAIN LAYOUT — Two columns on large screens */}
      {/* ═══════════════════════════════════════════ */}
      {!noDecks && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── LEFT COLUMN: Tube visual + deck select + stats ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Deck selector */}
            <div
              className="bg-white border-[3px] border-[#1a1a1a] overflow-hidden"
              style={{ boxShadow: "3px 3px 0 #1a1a1a" }}
            >
              <div className="bg-[#1a1a1a] px-4 py-2 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#FFCC00]" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#FFCC00]">
                  Select Deck
                </h3>
              </div>

              {/* Tube visual */}
              {selectedDeck && (
                <div className="flex justify-center py-4" style={{ background: "#fffef0" }}>
                  <BattleTubePreview
                    name={selectedDeck.name}
                    color={selectedDeck.color || "#3B4CCA"}
                    count={selectedDeck.tazoCount || selectedDeck.tazos?.length || 0}
                    maxCount={20}
                    tazos={(selectedDeck.tazos || []).slice(0, 10).map((t: any) => ({
                      id: t.id,
                      name: t.name || "",
                      displayName: t.displayName,
                      imageUrl: t.imageUrl || "",
                      finish: t.finish,
                      creatureVariant: t.creatureVariant,
                      shinyImageUrl: t.shinyImageUrl,
                      franchiseSlug: t.franchiseSlug || t.franchise,
                    }))}
                    starters={selectedDeck.starters || []}
                    size="md"
                  />
                </div>
              )}

              {/* Deck list */}
              <div className="p-3 space-y-1.5 border-t-[3px] border-[#1a1a1a]/10">
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-[#1a1a1a]/20" />
                  </div>
                ) : (
                  decks.map((d: any) => {
                    const active = d.id === selectedDeckId
                    const tazoCount = d.tazoCount || d.tazos?.length || 0
                    const isSealed = tazoCount >= 20
                    const color = d.color || "#3B4CCA"
                    return (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDeckId(active ? null : d.id)}
                        className={`w-full p-3 border-2 text-left transition-all ${
                          active
                            ? "border-[#FFCC00] bg-[#FFCB0506]"
                            : "border-[#1a1a1a]/8 hover:border-[#1a1a1a]/25"
                        }`}
                        style={active ? { boxShadow: "2px 2px 0 #FFCC00" } : undefined}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0 border-2 border-[#1a1a1a]/40"
                              style={{ background: color }}
                            />
                            <span className="font-black text-xs text-[#1a1a1a] truncate">
                              {d.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isSealed && (
                              <CheckCircle className="w-3 h-3 text-[#22C55E]" />
                            )}
                            <span className={`text-[9px] font-black ${isSealed ? "text-[#22C55E]" : "text-[#1a1a1a]/30"}`}>
                              {tazoCount}/20
                            </span>
                          </div>
                        </div>
                        {d.isActive && (
                          <span className="inline-block text-[7px] font-black text-[#FFCC00] border border-[#FFCC00]/30 bg-[#FFCB0508] px-1 py-0.5 mt-1.5 uppercase">
                            {active ? "Selected" : "Active"}
                          </span>
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Stats card — only when a deck is selected */}
            {selectedDeck && (
              <div
                className="bg-white border-[3px] border-[#1a1a1a]"
                style={{ boxShadow: "3px 3px 0 #1a1a1a" }}
              >
                <div className="bg-[#FFCC00] px-4 py-2 flex items-center gap-2 border-b-[3px] border-[#1a1a1a]">
                  <Zap className="w-4 h-4 text-[#1a1a1a]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]">
                    Deck Stats
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { icon: Zap, label: "ATK", value: deckStats.atk, color: "#E3350D" },
                      { icon: Shield, label: "DEF", value: deckStats.def, color: "#3B4CCA" },
                      { icon: Crosshair, label: "PRC", value: deckStats.prc, color: "#A855F7" },
                      { icon: Star, label: "SPD", value: deckStats.spd, color: "#F59E0B" },
                    ]).map(s => (
                      <div
                        key={s.label}
                        className="p-3 border-2 border-[#1a1a1a]/8 bg-[#fffef0]"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                          <span className="text-[9px] font-black text-[#1a1a1a]/30 uppercase tracking-wider">
                            {s.label}
                          </span>
                        </div>
                        <div className="text-lg font-black text-[#1a1a1a]">{s.value}</div>
                      </div>
                    ))}
                  </div>
                  {/* Tazo chips */}
                  {selectedDeck.tazos && selectedDeck.tazos.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#1a1a1a]/6">
                      <p className="text-[8px] font-black text-[#1a1a1a]/25 uppercase tracking-widest mb-2">
                        {deckStats.count} Tazos in tube
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedDeck.tazos.slice(0, 15).map((t: any) => (
                          <div
                            key={t.id}
                            className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#1a1a1a]/10 flex-shrink-0 bg-[#1a1a1a]/5"
                            title={t.displayName || t.name}
                          >
                            <TazoDiscImage
                              src={t.imageUrl}
                              alt={t.name || ""}
                              size="100%"
                              borderWidth={0}
                              franchiseSlug={t.franchiseSlug || t.franchise}
                              finish={t.finish || "normal"}
                              creatureVariant={t.creatureVariant || "standard"}
                              shinyImageUrl={t.shinyImageUrl}
                              lazy
                            />
                          </div>
                        ))}
                        {deckStats.count > 15 && (
                          <span className="text-[9px] font-black text-[#1a1a1a]/30 self-center px-1">
                            +{deckStats.count - 15}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: Mode + difficulty + start ── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Mode cards */}
            <div>
              <h3 className="text-[10px] font-black text-[#1a1a1a]/30 uppercase tracking-widest mb-3 px-1">
                Select Game Mode
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {MODES.map(opt => {
                  const active = mode === opt.id
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.id}
                      onClick={() => opt.available && setMode(opt.id)}
                      disabled={!opt.available}
                      className={`relative p-4 text-left border-[3px] transition-all ${
                        active
                          ? "bg-white border-[#1a1a1a]"
                          : opt.available
                          ? "bg-white/70 border-[#1a1a1a]/12 hover:border-[#1a1a1a]/40 hover:bg-white"
                          : "bg-zinc-50 border-zinc-200 opacity-50 cursor-not-allowed"
                      }`}
                      style={active ? { boxShadow: "4px 4px 0 #1a1a1a" } : undefined}
                    >
                      {/* Badge */}
                      <span className={`absolute -top-2 -right-2 text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 border-2 ${
                        active
                          ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                          : opt.available
                          ? "border-[#1a1a1a]/15 text-[#1a1a1a]/25"
                          : "border-zinc-300 text-zinc-400"
                      }`}>
                        {opt.badge}
                      </span>

                      <Icon className="w-5 h-5 mb-2.5" style={{ color: active ? opt.color : "#1a1a1a18" }} />
                      <h3 className="font-black text-xs uppercase text-[#1a1a1a] mb-1">{opt.title}</h3>
                      <p className="text-[9px] font-bold text-[#1a1a1a]/35 leading-relaxed">{opt.desc}</p>
                      {active && (
                        <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ background: opt.gradient }} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* AI Difficulty */}
            {mode === "practice" && (
              <div>
                <h3 className="text-[10px] font-black text-[#1a1a1a]/30 uppercase tracking-widest mb-3 px-1">
                  AI Difficulty
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id)}
                      className={`p-3 border-2 text-center transition-all capitalize ${
                        difficulty === d.id
                          ? "border-[#FFCC00] bg-[#FFCB0506]"
                          : "border-[#1a1a1a]/8 hover:border-[#1a1a1a]/25"
                      }`}
                      style={difficulty === d.id ? { boxShadow: "2px 2px 0 #FFCC00" } : undefined}
                    >
                      <div className="font-black text-xs text-[#1a1a1a]">{d.label}</div>
                      <div className="text-[9px] font-bold text-[#1a1a1a]/25 mt-0.5">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Unavailable mode info */}
            {mode !== "practice" && (
              <div
                className="flex items-start gap-2 p-3 border-2 border-[#F59E0B]/30 bg-[#F59E0B]/5"
                style={{ boxShadow: "2px 2px 0 #F59E0B20" }}
              >
                <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-[#F59E0B] uppercase tracking-wider">
                    Coming Soon
                  </p>
                  <p className="text-[9px] font-bold text-[#1a1a1a]/35">
                    Ranked and Friend Battle are under development. Practice mode is fully playable right now.
                  </p>
                </div>
              </div>
            )}

            {/* Start button */}
            <div className="text-center pt-2">
              <button
                onClick={handleStart}
                disabled={!canStart}
                className={`w-full sm:w-auto px-12 sm:px-14 py-5 font-black text-lg sm:text-xl uppercase tracking-wider border-[3px] border-[#1a1a1a] transition-all ${
                  canStart
                    ? "bg-[#E3350D] text-white hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] hover:shadow-[2px_2px_0_#1a1a1a]"
                    : "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                }`}
                style={canStart ? { boxShadow: "4px 4px 0 #1a1a1a" } : {}}
              >
                {!selectedDeckId ? (
                  <span className="flex items-center justify-center gap-2">
                    Select a Deck <ChevronRight className="w-5 h-5" />
                  </span>
                ) : mode === "practice" ? (
                  <span className="flex items-center justify-center gap-2">
                    <Swords className="w-5 h-5" />
                    Battle AI · {DIFFICULTIES.find(d => d.id === difficulty)?.label}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">Coming Soon</span>
                )}
              </button>
              {mode !== "practice" && (
                <p className="text-[10px] font-bold text-[#E3350D]/70 mt-2">
                  Practice mode is available now — switch to it above!
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
