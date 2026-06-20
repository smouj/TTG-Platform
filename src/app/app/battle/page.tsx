"use client"

// ============================================================
// Trading Tazos Game — Battle Lobby v3
// Magazine-themed lobby at /app/battle
// Shows tube visual + mode selection + stats + start button.
// Renders BattleView inline on the same page (no navigation).
// ============================================================

import { useState, useEffect, useMemo, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { canUseWebGL } from "@/lib/browser/webgl-detector"
import { useI18n } from "@/lib/i18n"
import { playSFX, sfxEnsureUnlocked } from "@/lib/audio/sfx-engine"
import { resetTutorial } from "@/components/game/battle/battle-tutorial"
import BattleTubePreview from "@/components/tubes/BattleTubePreview"
import TazoDiscImage from "@/components/game/tazo-disc-image"
import Link from "next/link"
import dynamic from "next/dynamic"
import {
  Swords, Bot, Globe, Play, Zap, Shield, Crosshair, Star,
  ChevronRight, Layers, Loader2, AlertTriangle, CheckCircle, HelpCircle,
} from "lucide-react"

// BattleView loading overlay — dark arena entrance with i18n
function BattleLoadingOverlay() {
  const { t } = useI18n()
  // Lock body bg to solid dark to prevent shell flash-through
  useEffect(() => {
    const prev = document.body.style.background
    document.body.style.background = "#0a0a0a"
    return () => { document.body.style.background = prev }
  }, [])
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2rem",
        background: "#0a0a0a",
      }}
    >
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)" }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.08,
        backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,204,0,0.3) 8px, rgba(255,204,0,0.3) 10px)" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", border: "3px solid rgba(255,204,0,0.12)", borderTopColor: 'var(--ttg-yellow)', animation: "spin 0.8s linear infinite", boxShadow: "0 0 32px rgba(255,204,0,0.15)" }} />
        <div style={{ position: "absolute", inset: -6, borderRadius: "50%", border: "2px solid rgba(255,204,0,0.06)", animation: "ping 1.5s ease-out infinite" }} />
      </div>
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <p style={{ fontSize: 12, fontWeight: 900, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.25em", margin: 0 }}>{t.battle_entering_arena}</p>
        <p style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,204,0,0.25)", textTransform: "uppercase", letterSpacing: "0.4em", marginTop: 8 }}>{t.battle_battle_loading}</p>
      </div>
    </div>
  )
}

const BattleView = dynamic(() => import("@/components/game/battle-view"), {
  ssr: false,
  loading: BattleLoadingOverlay,
})

// ── Mode definitions ──
const MODES = [
  {
    id: "practice",
    icon: Bot,
    title: "Practice",
    desc: "Train against AI — no pressure. Perfect your strategy with adjustable difficulty.",
    color: 'var(--ttg-success)',
    gradient: "linear-gradient(135deg, var(--ttg-success), var(--ttg-success))",
    badge: "AVAILABLE",
    available: true,
  },
  {
    id: "pvp_ranked",
    icon: Globe,
    title: "Ranked PvP",
    desc: "Competitive matchmaking with global leaderboard and seasonal rewards.",
    color: 'var(--ttg-red)',
    gradient: "linear-gradient(135deg, var(--ttg-red), #C62828)",
    badge: "COMING SOON",
    available: false,
  },
  {
    id: "pvp_friend",
    icon: Swords,
    title: "Friend Battle",
    desc: "Invite a friend with a room code. Direct 1v1, no leaderboard pressure.",
    color: 'var(--ttg-blue)',
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
        className="inline-block py-3 px-8 bg-ttg-success text-white text-sm font-black uppercase tracking-widest border-[3px] border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_var(--ttg-black)] transition-all disabled:opacity-50 disabled:cursor-wait"
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
      {error && <span className="text-[9px] font-bold text-ttg-red">{error}</span>}
    </div>
  )
}


// ── Launch Overlay Component ──
function LaunchOverlay({ fading }: { fading: boolean }) {
  const [opacity, setOpacity] = useState(fading ? 1 : 1)
  
  // Lock body background to solid dark to prevent shell flash-through
  useEffect(() => {
    const prev = document.body.style.background
    document.body.style.background = "#0a0a0a"
    return () => { document.body.style.background = prev }
  }, [])

  useEffect(() => {
    if (fading) {
      // Fade out over 600ms after a brief hold
      const fadeTimer = setTimeout(() => setOpacity(0), 300)
      return () => clearTimeout(fadeTimer)
    }
  }, [fading])

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      background: "#0a0a0a",
      opacity, transition: "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
      pointerEvents: opacity < 0.1 ? "none" : "auto",
    }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)" }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.04, backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,204,0,0.3) 8px, rgba(255,204,0,0.3) 10px)" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2rem" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", border: "3px solid rgba(255,204,0,0.12)", borderTopColor: 'var(--ttg-yellow)', animation: "spin 0.8s linear infinite", boxShadow: "0 0 32px rgba(255,204,0,0.15)" }} />
        <p style={{ fontSize: 14, fontWeight: 900, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.25em" }}>
          {fading ? "Arena Ready" : "Entering Arena…"}
        </p>
      </div>
    </div>
  )
}

export default function BattlePage() {
  const { user } = useAuth()

  const [mode, setMode] = useState<string>("practice")
  const [difficulty, setDifficulty] = useState<string>("skilled")
  const [decks, setDecks] = useState<any[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [webglOk, setWebglOk] = useState<boolean | null>(null)
  const [battleActive, setBattleActive] = useState(false)
  const [launching, setLaunching] = useState(false)

  // Cleanup battle body state when leaving page
  useEffect(() => {
    return () => {
      document.body.classList.remove("ttg-battle-active")
      const cleanup = (window as any).__ttg_battle_cleanup
      if (cleanup) { cleanup(); delete (window as any).__ttg_battle_cleanup }
    }
  }, [])

  // Check WebGL before allowing battle start
  useEffect(() => { setWebglOk(canUseWebGL()) }, [])

  // Listen for BattleView "Back to Lobby" event
  useEffect(() => {
    const handler = () => {
      setBattleActive(false)
      setLaunching(false)
      document.body.classList.remove("ttg-battle-active")
      const cleanup = (window as any).__ttg_battle_cleanup
      if (cleanup) { cleanup(); delete (window as any).__ttg_battle_cleanup }
    }
    window.addEventListener("ttg:battle:exit", handler)
    return () => window.removeEventListener("ttg:battle:exit", handler)
  }, [])

  // Fetch user decks
  useEffect(() => {
    if (!user) { setLoading(false); return }
    setLoading(true)
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
        if (list.length === 0) console.warn("[battle] No decks found for user")
      })
      .catch((err: any) => {
        console.error("[battle] Failed to load decks:", err)
      })
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
    if (!selectedDeckId || launching) return
    sfxEnsureUnlocked()
    playSFX("equip")
    setLaunching(true)

    // Store original body state for cleanup
    const prevBg = document.body.style.background
    const prevOverflow = document.body.style.overflow

    // Set sessionStorage for BattleView to auto-start
    sessionStorage.setItem("battle_mode", mode)
    sessionStorage.setItem("battle_difficulty", difficulty)
    sessionStorage.setItem("battle_deckId", selectedDeckId)

    // Lock body + fade to dark for seamless transition
    document.body.style.transition = "background 0.3s"
    document.body.style.background = "#0a0a0a"
    document.body.style.overflow = "hidden"
    document.body.classList.add("ttg-battle-active")

    // Store cleanup ref on window for BattleView unmount
    ;(window as any).__ttg_battle_cleanup = () => {
      document.body.style.background = prevBg
      document.body.style.overflow = prevOverflow
      document.body.style.transition = ""
      document.body.classList.remove("ttg-battle-active")
    }

    // Smooth launch sequence: keep launch overlay for dramatic effect,
    // then reveal BattleView with a short fade window
    setTimeout(() => {
      setBattleActive(true)
    }, 1200)
  }

  const canStart = selectedDeckId && deckStats.count >= 1 && mode === "practice" && !launching && webglOk !== false
  const noDecks = !loading && decks.length === 0

  // ═══ BATTLE ACTIVE — render BattleView in fullscreen overlay ═══
  if (battleActive) {
    return (
      <>
        {/* BattleView — fullscreen, slots in under the fading launch overlay */}
        <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "#0a0a0a" }}>
          <BattleView />
        </div>

        {/* Launch overlay fades out over BattleView — smooth transition */}
        <LaunchOverlay fading={true} />
      </>
    )
  }

  return (
    <div className="w-full py-4 sm:py-6 space-y-6">
      {/* Launch overlay — dark fullscreen while BattleView loads */}
      {launching && <LaunchOverlay fading={false} />}



      {/* ═══════════════════════════════════════════ */}
      {/* MAGAZINE BANNER                           */}
      {/* ═══════════════════════════════════════════ */}
      <div
        className="px-4 py-3 flex flex-wrap items-center gap-3 relative overflow-hidden"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.025) 6px, rgba(255,255,255,0.025) 12px), linear-gradient(90deg, var(--ttg-black) 0%, #2a2a2a 100%)`,
          border: "3px solid var(--ttg-black)",
          boxShadow: "4px 4px 0px var(--ttg-yellow)",
        }}
      >
        <Swords className="w-5 h-5 text-ttg-yellow" />
        <h1 className="text-sm sm:text-lg font-black text-white uppercase tracking-tight">
          Battle Arena
        </h1>
        <div className="w-px h-5 bg-white/15" />
        <span className="text-xs sm:text-sm font-black text-ttg-yellow">
          {selectedDeck
            ? `${selectedDeck.name} · ${deckStats.count} tazos`
            : `${decks.length} DECKS AVAILABLE`}
        </span>
        {/* Replay tutorial button */}
        <button
          onClick={() => resetTutorial()}
          className="ml-auto text-[9px] font-black text-white/20 hover:text-ttg-yellow uppercase tracking-wider transition-colors flex items-center gap-1"
          title="Replay battle tutorial"
        >
          <HelpCircle className="w-3 h-3" /> Tutorial
        </button>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* NO DECKS — EMPTY STATE                      */}
      {/* ═══════════════════════════════════════════ */}
      {noDecks && (
        <div
          className="text-center py-16 border-[3px] border-ttg-black"
          style={{
            background: 'var(--ttg-cream)',
            boxShadow: "4px 4px 0px var(--ttg-black)",
          }}
        >
          <div className="flex justify-center mb-4">
            <div className="relative">
              <BattleTubePreview name="" color='var(--ttg-red)' count={0} maxCount={20} size="lg" showLabel={false} />
              <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-ttg-black border-[3px] border-ttg-yellow flex items-center justify-center rounded-full shadow-[3px_3px_0px_var(--ttg-black)]">
                <span className="text-ttg-yellow text-lg font-black">?</span>
              </div>
            </div>
          </div>
          <h2 className="text-xl font-black text-ttg-red mb-2 uppercase tracking-wider">
            No Decks Yet
          </h2>
          <p className="text-xs font-bold text-ttg-black/40 max-w-xs mx-auto mb-5 leading-relaxed">
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
              className="inline-block py-3 px-8 bg-white text-ttg-black text-sm font-black uppercase tracking-widest border-[3px] border-ttg-black hover:bg-zinc-50 transition-all no-underline"
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
              className="bg-white border-[3px] border-ttg-black overflow-hidden"
              style={{ boxShadow: "3px 3px 0 var(--ttg-black)" }}
            >
              <div className="bg-ttg-black px-4 py-2 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-ttg-yellow" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-ttg-yellow">
                  Select Deck
                </h3>
              </div>

              {/* Tube visual */}
              {selectedDeck && (
                <div className="flex justify-center py-4" style={{ background: 'var(--ttg-cream)' }}>
                  <BattleTubePreview
                    name={selectedDeck.name}
                    color={selectedDeck.color || 'var(--ttg-blue)'}
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

                    size="md"
                  />
                </div>
              )}

              {/* Deck list */}
              <div className="p-3 space-y-1.5 border-t-[3px] border-ttg-black/10">
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-ttg-black/20" />
                  </div>
                ) : (
                  decks.map((d: any) => {
                    const active = d.id === selectedDeckId
                    const tazoCount = d.tazoCount || d.tazos?.length || 0
                    const isSealed = tazoCount >= 20
                    const color = d.color || 'var(--ttg-blue)'
                    return (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDeckId(active ? null : d.id)}
                        className={`w-full p-3 border-2 text-left transition-all ${
                          active
                            ? "border-ttg-yellow bg-ttg-minimon/2"
                            : "border-ttg-black/8 hover:border-ttg-black/25"
                        }`}
                        style={active ? { boxShadow: "2px 2px 0 var(--ttg-yellow)" } : undefined}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0 border-2 border-ttg-black/40"
                              style={{ background: color }}
                            />
                            <span className="font-black text-xs text-ttg-black truncate">
                              {d.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isSealed && (
                              <CheckCircle className="w-3 h-3 text-ttg-success" />
                            )}
                            <span className={`text-[9px] font-black ${isSealed ? "text-ttg-success" : "text-ttg-black/30"}`}>
                              {tazoCount}/20
                            </span>
                          </div>
                        </div>
                        {d.isActive && (
                          <span className="inline-block text-[7px] font-black text-ttg-yellow border border-ttg-yellow/30 bg-ttg-minimon/3 px-1 py-0.5 mt-1.5 uppercase">
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
                className="bg-white border-[3px] border-ttg-black"
                style={{ boxShadow: "3px 3px 0 var(--ttg-black)" }}
              >
                <div className="bg-ttg-yellow px-4 py-2 flex items-center gap-2 border-b-[3px] border-ttg-black">
                  <Zap className="w-4 h-4 text-ttg-black" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-ttg-black">
                    Deck Stats
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { icon: Zap, label: "ATK", value: deckStats.atk, color: 'var(--ttg-red)' },
                      { icon: Shield, label: "DEF", value: deckStats.def, color: 'var(--ttg-blue)' },
                      { icon: Crosshair, label: "PRC", value: deckStats.prc, color: 'var(--ttg-purple)' },
                      { icon: Star, label: "SPD", value: deckStats.spd, color: "var(--ttg-warning)" },
                    ]).map(s => (
                      <div
                        key={s.label}
                        className="p-3 border-2 border-ttg-black/8 bg-ttg-cream"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                          <span className="text-[9px] font-black text-ttg-black/30 uppercase tracking-wider">
                            {s.label}
                          </span>
                        </div>
                        <div className="text-lg font-black text-ttg-black">{s.value}</div>
                      </div>
                    ))}
                  </div>
                  {/* Tazo chips */}
                  {selectedDeck.tazos && selectedDeck.tazos.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-ttg-black/6">
                      <p className="text-[8px] font-black text-ttg-black/25 uppercase tracking-widest mb-2">
                        {deckStats.count} Tazos in deck
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedDeck.tazos.slice(0, 15).map((t: any) => (
                          <div
                            key={t.id}
                            className="w-8 h-8 rounded-full overflow-hidden border-2 border-ttg-black/10 flex-shrink-0 bg-ttg-black/5"
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
                          <span className="text-[9px] font-black text-ttg-black/30 self-center px-1">
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
              <h3 className="text-[10px] font-black text-ttg-black/30 uppercase tracking-widest mb-3 px-1">
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
                          ? "bg-white border-ttg-black"
                          : opt.available
                          ? "bg-white/70 border-ttg-black/12 hover:border-ttg-black/40 hover:bg-white"
                          : "bg-zinc-50 border-zinc-200 opacity-50 cursor-not-allowed"
                      }`}
                      style={active ? { boxShadow: "4px 4px 0 var(--ttg-black)" } : undefined}
                    >
                      {/* Badge */}
                      <span className={`absolute -top-2 -right-2 text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 border-2 ${
                        active
                          ? "bg-ttg-black text-white border-ttg-black"
                          : opt.available
                          ? "border-ttg-black/15 text-ttg-black/25"
                          : "border-zinc-300 text-zinc-400"
                      }`}>
                        {opt.badge}
                      </span>

                      <Icon className="w-5 h-5 mb-2.5" style={{ color: active ? opt.color : "#1a1a1a18" }} />
                      <h3 className="font-black text-xs uppercase text-ttg-black mb-1">{opt.title}</h3>
                      <p className="text-[9px] font-bold text-ttg-black/35 leading-relaxed">{opt.desc}</p>
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
                <h3 className="text-[10px] font-black text-ttg-black/30 uppercase tracking-widest mb-3 px-1">
                  AI Difficulty
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id)}
                      className={`p-3 border-2 text-center transition-all capitalize ${
                        difficulty === d.id
                          ? "border-ttg-yellow bg-ttg-minimon/2"
                          : "border-ttg-black/8 hover:border-ttg-black/25"
                      }`}
                      style={difficulty === d.id ? { boxShadow: "2px 2px 0 var(--ttg-yellow)" } : undefined}
                    >
                      <div className="font-black text-xs text-ttg-black">{d.label}</div>
                      <div className="text-[9px] font-bold text-ttg-black/25 mt-0.5">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Unavailable mode info */}
            {mode !== "practice" && (
              <div
                className="flex items-start gap-2 p-3 border-2 border-ttg-warning/30 bg-ttg-warning/5"
                style={{ boxShadow: "2px 2px 0 #f59e0b20" }}
              >
                <AlertTriangle className="w-4 h-4 text-ttg-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-ttg-warning uppercase tracking-wider">
                    Coming Soon
                  </p>
                  <p className="text-[9px] font-bold text-ttg-black/35">
                    Ranked and Friend Battle are under development. Practice mode is fully playable right now.
                  </p>
                </div>
              </div>
            )}

            {/* Start button */}
            <div className="text-center pt-2">
              <button
                onClick={handleStart}
                disabled={!canStart || launching || webglOk !== true}
                className={`w-full sm:w-auto px-12 sm:px-14 py-5 font-black text-lg sm:text-xl uppercase tracking-wider border-[3px] border-ttg-black transition-all ${
                  canStart
                    ? "bg-ttg-red text-white hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] hover:shadow-[2px_2px_0_var(--ttg-black)]"
                    : "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                }`}
                style={canStart ? { boxShadow: "4px 4px 0 var(--ttg-black)" } : {}}
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
                <p className="text-[10px] font-bold text-ttg-red/70 mt-2">
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
