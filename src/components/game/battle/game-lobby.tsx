// ============================================================
// Trading Tazos Game — Game Lobby v2
// Better deck builder, clearer mode cards, improved UX
// ============================================================
"use client"

import { useState, useMemo } from "react"
import type { TazoCard, PlayMode, AIDifficulty } from "@/lib/battle/game-loop"
import {
  Swords, Bot, Globe, Play, Zap, Shield, Crosshair, Star,
  Sparkles, ChevronRight, Layers,
} from "lucide-react"
import TazoDiscImage from "@/components/game/tazo-disc-image"
import { playSFX, sfxEnsureUnlocked } from "@/lib/audio/sfx-engine"

interface Props {
  playerTazos: TazoCard[]
  playerDecks?: { id: string; name: string; isActive: boolean; tazos: any[] }[]
  selectedDeckId?: string | null
  onSelectDeck?: (deckId: string | null) => void
  onStart: (mode: PlayMode, difficulty: AIDifficulty, deck: TazoCard[]) => void
  isLoading: boolean
  isAuthenticated: boolean
}

const MODES = [
  {
    id: "practice" as const,
    icon: Bot,
    title: "Practice",
    desc: "Train against AI — no pressure, build your skills",
    color: "var(--ttg-success)",
    gradient: "linear-gradient(135deg, #22C55E, #16A34A)",
    badge: "FREE",
    available: true,
  },
  {
    id: "pvp_ranked" as const,
    icon: Globe,
    title: "Ranked PvP",
    desc: "Competitive matchmaking with leaderboard",
    color: "var(--ttg-red)",
    gradient: "linear-gradient(135deg, #E3350D, #C62828)",
    badge: "COMING SOON",
    available: false,
  },
  {
    id: "pvp_friend" as const,
    icon: Swords,
    title: "Friend Battle",
    desc: "Room code duel with a friend",
    color: "var(--ttg-blue)",
    gradient: "linear-gradient(135deg, #3B4CCA, #283593)",
    badge: "COMING SOON",
    available: false,
  },
]

function fColor(f: string) {
  return f === "minimon" ? "var(--ttg-minimon)" : f === "cybermon" ? "var(--ttg-cybermon)" : "var(--ttg-dracobell)"
}

export default function GameLobby({ playerTazos, playerDecks, selectedDeckId, onSelectDeck, onStart, isLoading, isAuthenticated }: Props) {
  const [mode, setMode] = useState<PlayMode>("practice")
  const [difficulty, setDifficulty] = useState<AIDifficulty>("skilled")
  // Deck is selected via deck selector — all tazos included
  const [,setDeckTazos] = useState<TazoCard[]>([])

  // When a deck is selected, load its tazos for preview stats
  const selectedDeck = useMemo(() => {
    if (!selectedDeckId || !playerDecks) return null
    return playerDecks.find(d => d.id === selectedDeckId) || null
  }, [selectedDeckId, playerDecks])

  const deckTotals = useMemo(() => {
    const tazos = selectedDeck?.tazos || []
    if (tazos.length === 0) return { atk: 0, def: 0, spd: 0, spn: 0, prc: 0, count: 0 }
    return {
      atk: tazos.reduce((s:number, t:any) => s + (t.attack || 50), 0),
      def: tazos.reduce((s:number, t:any) => s + (t.defense || 50), 0),
      spd: tazos.reduce((s:number, t:any) => s + (t.bounce || 50), 0),
      spn: tazos.reduce((s:number, t:any) => s + (t.spin || 50), 0),
      prc: tazos.reduce((s:number, t:any) => s + (t.precision || 50), 0),
      count: tazos.length,
    }
  }, [selectedDeck])

  const canStart = (mode === "practice" || isAuthenticated) && selectedDeckId && deckTotals.count >= 1

  return (
    <div className="space-y-6">

      {/* ════════════════ BANNER ════════════════ */}
      <div
        className="px-4 py-3 flex flex-wrap items-center gap-3 relative overflow-hidden"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.025) 6px, rgba(255,255,255,0.025) 12px), linear-gradient(90deg, var(--ttg-black) 0%, #2a2a2a 100%)`,
          border: "3px solid var(--ttg-black)",
          boxShadow: "4px 4px 0px #FFCC00",
        }}
      >
        <Swords className="w-5 h-5 text-ttg-yellow" />
        <h1 className="text-sm font-black text-white uppercase tracking-tight">BATTLE ARENA</h1>
        <div className="w-px h-5 bg-white/15" />
        <span className="text-xs font-black text-ttg-yellow">
          {selectedDeck ? `${selectedDeck.name} · ${deckTotals.count} tazos` : `${playerTazos.length} TAZOS AVAILABLE`}
        </span>
        <span className="ml-auto text-[9px] font-black text-white/30 uppercase">
          {isAuthenticated ? "Ready" : "Guest"}
        </span>
      </div>

      {/* ════════════════ DECK SELECTOR ════════════════ */}
      {playerDecks && playerDecks.length > 0 && (
        <div className="bg-white border-3 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)] overflow-hidden">
          <div className="bg-ttg-black px-4 py-2 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-ttg-yellow" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-ttg-yellow">Select Deck</h3>
          </div>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {playerDecks.map((d) => {
              const active = d.id === selectedDeckId
              const count = d.tazos?.length || 0
              return (
                <button
                  key={d.id}
                  onClick={() => onSelectDeck?.(active ? null : d.id)}
                  className={`p-3 border-2 text-left transition-all ${
                    active
                      ? "border-ttg-yellow bg-[#FFCB050a] shadow-[2px_2px_0px_var(--ttg-yellow)]"
                      : "border-ttg-black/8 hover:border-ttg-black/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-ttg-black">{d.name}</span>
                    {d.isActive && (
                      <span className="text-[7px] font-black text-ttg-yellow border border-ttg-yellow/30 bg-[#FFCB0508] px-1 py-0.5 uppercase">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] font-bold text-ttg-black/30 mt-0.5">
                    {count} tazos {count < 5 ? `(need ${5 - count} more)` : "· Battle ready"}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ════════════════ MODE CARDS ════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {MODES.map(opt => {
          const active = mode === opt.id
          const Icon = opt.icon
          return (
            <button
              key={opt.id}
              onClick={() => opt.available && setMode(opt.id)}
              disabled={!opt.available}
              className={`relative p-4 text-left border-3 transition-all group ${
                active
                  ? "bg-white border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] -translate-x-0.5 -translate-y-0.5"
                  : opt.available
                  ? "bg-white/70 border-ttg-black/12 hover:border-ttg-black/40 hover:bg-white hover:shadow-[2px_2px_0px_var(--ttg-black)]"
                  : "bg-zinc-50 border-zinc-200 opacity-50 cursor-not-allowed"
              }`}
            >
              {/* Badge */}
              <span className={`absolute -top-2 -right-2 text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 border-2 ${
                active ? "bg-ttg-black text-white border-ttg-black" :
                opt.available ? "border-ttg-black/15 text-ttg-black/25" :
                "border-zinc-300 text-zinc-400"
              }`}>
                {opt.badge}
              </span>

              <Icon className="w-5 h-5 mb-2.5" style={{ color: active ? opt.color : "#1a1a1a20" }} />
              <h3 className="font-black text-xs uppercase text-ttg-black mb-1">{opt.title}</h3>
              <p className="text-[9px] font-bold text-ttg-black/35">{opt.desc}</p>

              {active && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ background: opt.gradient }} />
              )}
            </button>
          )
        })}
      </div>

      {/* ════════════════ AI DIFFICULTY ════════════════ */}
      {mode === "practice" && (
        <div className="bg-white border-3 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)] overflow-hidden">
          <div className="bg-ttg-black px-4 py-2 flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-ttg-yellow" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-ttg-yellow">AI Difficulty</h3>
          </div>
          <div className="p-3 grid grid-cols-3 gap-2">
            {(["novice", "skilled", "master"] as AIDifficulty[]).map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`p-3 border-2 text-center transition-all capitalize ${
                  difficulty === d
                    ? "border-ttg-yellow bg-[#FFCB0508] shadow-[2px_2px_0px_var(--ttg-yellow)]"
                    : "border-ttg-black/8 hover:border-ttg-black/30"
                }`}
              >
                <div className="font-black text-sm text-ttg-black">{d}</div>
                <div className="text-[9px] font-bold text-ttg-black/25 mt-0.5">
                  {d === "novice" ? "Chill" : d === "skilled" ? "Fair fight" : "Expert"}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════ SELECTED DECK ════════════════ */}
      <div className="bg-white border-3 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)] overflow-hidden">
        <div className="mag-card-yellow px-4 py-2.5 flex items-center justify-between border-b-3 border-ttg-black">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-ttg-black" />
            <h3 className="text-xs font-black uppercase tracking-wider text-ttg-black">
              {selectedDeck ? `Selected: ${selectedDeck.name}` : "Select a Deck"}
            </h3>
          </div>
          {selectedDeck && (
            <span className="text-[8px] font-black text-ttg-success uppercase">✓ {deckTotals.count} tazos loaded</span>
          )}
        </div>

        <div className="p-4 space-y-3">
          {selectedDeck ? (
            <>
              {/* Tube stats */}
              <div className="flex flex-wrap items-center gap-1.5">
                {([
                  { icon: Zap, label: "ATK", value: deckTotals.atk, color: "var(--ttg-red)" },
                  { icon: Shield, label: "DEF", value: deckTotals.def, color: "var(--ttg-blue)" },
                  { icon: Crosshair, label: "PRC", value: deckTotals.prc, color: "var(--ttg-purple)" },
                  { icon: Star, label: "SPD+SPN", value: deckTotals.spd + deckTotals.spn, color: "var(--ttg-warning)" },
                ]).map(s => (
                  <div key={s.label}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white border-2 border-ttg-black/10 text-[10px] font-black shadow-[1px_1px_0px_#1a1a1a08]">
                    <span style={{ color: s.color }}>
                      <s.icon className="w-3 h-3" />
                    </span>
                    <span className="text-ttg-black/30">{s.label}</span>
                    <span className="text-ttg-black text-xs">{s.value}</span>
                  </div>
                ))}
                <span className="ml-auto text-[8px] font-black text-ttg-black/20 uppercase">
                  {deckTotals.count} tazos
                </span>
              </div>

              {/* Tazo mini chips */}
              <div className="flex gap-1 flex-wrap max-h-[80px] overflow-y-auto">
                {selectedDeck.tazos?.slice(0, 20).map((t: any) => (
                  <div key={t.id} className="flex items-center gap-1 p-1 border-2 border-ttg-black/8 bg-[#fffef0]">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0" style={{ background: "var(--ttg-black)" }}>
                      <TazoDiscImage src={t.imageUrl} alt={t.name} size="100%" borderWidth={0}
                        franchiseSlug={t.franchiseSlug} lazy className="w-full h-full" />
                    </div>
                    <span className="text-[7px] font-black text-ttg-black truncate max-w-[60px]">{t.displayName || t.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-[11px] font-bold text-ttg-black/25 py-6">
              {playerDecks && playerDecks.length > 0
                ? "Pick a Deck above to see its stats"
                : "Create a Deck in Decks first!"}
            </p>
          )}
        </div>
      </div>

      {/* ════════════════ START BUTTON ════════════════ */}
      <div className="text-center pt-1">
        <button
          onClick={() => {
            if (!canStart || isLoading) return
            sfxEnsureUnlocked()
            playSFX('equip')
            const deckTazos = selectedDeck?.tazos?.map((t: any) => ({
              id: t.id, name: t.name || "?", slug: t.slug || (t.name || "?").toLowerCase().replace(/\s/g, "-"),
              franchise: (t.franchiseSlug || "minimon") as TazoCard["franchise"],
              imageUrl: t.imageUrl, shinyImageUrl: t.shinyImageUrl,
              rarity: t.rarity || "common", finish: t.finish || "normal", creatureVariant: t.creatureVariant || "standard",
              attack: t.attack || 50, defense: t.defense || 50, resistance: t.resistance || 50,
              weight: t.weight || 50, stability: t.stability || 50, spin: t.spin || 50,
              control: t.control || 50, bounce: t.bounce || 50, precision: t.precision || 50,
            })) || []
            onStart(mode, difficulty, deckTazos)
          }}
          disabled={!canStart || isLoading}
          className={`px-14 py-5 font-black text-lg sm:text-xl uppercase tracking-wider border-3 border-ttg-black transition-all ${
            canStart
              ? "bg-ttg-red text-white shadow-[4px_4px_0px_var(--ttg-black)] hover:shadow-[2px_2px_0px_var(--ttg-black)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
              : "bg-zinc-300 text-zinc-500 cursor-not-allowed shadow-none"
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2"><Loader2Like className="w-5 h-5" /> Loading...</span>
          ) : !selectedDeckId ? (
            <span className="flex items-center gap-2">Select a Deck <ChevronRight className="w-5 h-5" /></span>
          ) : mode === "practice" ? (
            <span className="flex items-center gap-2">
              <Swords className="w-5 h-5" />
              Battle AI · {difficulty}
            </span>
          ) : mode === "pvp_ranked" ? (
            <span className="flex items-center gap-2">
              <Globe className="w-5 h-5" />Coming Soon
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Swords className="w-5 h-5" />Coming Soon
            </span>
          )}
        </button>

        {mode !== "practice" && !canStart && (
          <p className="text-[10px] font-bold text-ttg-red mt-2">PvP modes coming in a future update</p>
        )}
      </div>
    </div>
  )
}

// Simple inline loader spinner (avoids import)
function Loader2Like({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className || ""}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
    </svg>
  )
}
