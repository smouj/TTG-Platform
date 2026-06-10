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
    color: "#22C55E",
    gradient: "linear-gradient(135deg, #22C55E, #16A34A)",
    badge: "FREE",
    available: true,
  },
  {
    id: "pvp_ranked" as const,
    icon: Globe,
    title: "Ranked PvP",
    desc: "Competitive matchmaking with leaderboard",
    color: "#E3350D",
    gradient: "linear-gradient(135deg, #E3350D, #C62828)",
    badge: "RANKED",
    available: false,
    comingSoon: "Matchmaking in development",
  },
  {
    id: "pvp_friend" as const,
    icon: Swords,
    title: "Friend Battle",
    desc: "Room code duel with a friend",
    color: "#3B4CCA",
    gradient: "linear-gradient(135deg, #3B4CCA, #283593)",
    badge: "DIRECT",
    available: false,
    comingSoon: "Room codes coming soon",
  },
]

function fColor(f: string) {
  return f === "minimon" ? "#FFCB05" : f === "cybermon" ? "#00A1E9" : "#FF6B00"
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
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.025) 6px, rgba(255,255,255,0.025) 12px), linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 100%)`,
          border: "3px solid #1a1a1a",
          boxShadow: "4px 4px 0px #FFCC00",
        }}
      >
        <Swords className="w-5 h-5 text-[#FFCC00]" />
        <h1 className="text-sm font-black text-white uppercase tracking-tight">BATTLE ARENA</h1>
        <div className="w-px h-5 bg-white/15" />
        <span className="text-xs font-black text-[#FFCC00]">
          {selectedDeck ? `${selectedDeck.name} · ${deckTotals.count} tazos` : `${playerTazos.length} TAZOS AVAILABLE`}
        </span>
        <span className="ml-auto text-[9px] font-black text-white/30 uppercase">
          {isAuthenticated ? "Ready" : "Guest"}
        </span>
      </div>

      {/* ════════════════ DECK SELECTOR ════════════════ */}
      {playerDecks && playerDecks.length > 0 && (
        <div className="bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] overflow-hidden">
          <div className="bg-[#1a1a1a] px-4 py-2 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[#FFCC00]" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#FFCC00]">Select Deck</h3>
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
                      ? "border-[#FFCC00] bg-[#FFCB050a] shadow-[2px_2px_0px_#FFCC00]"
                      : "border-[#1a1a1a]/8 hover:border-[#1a1a1a]/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-[#1a1a1a]">{d.name}</span>
                    {d.isActive && (
                      <span className="text-[7px] font-black text-[#FFCC00] border border-[#FFCC00]/30 bg-[#FFCB0508] px-1 py-0.5 uppercase">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] font-bold text-[#1a1a1a]/30 mt-0.5">
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
                  ? "bg-white border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] -translate-x-0.5 -translate-y-0.5"
                  : opt.available
                  ? "bg-white/70 border-[#1a1a1a]/12 hover:border-[#1a1a1a]/40 hover:bg-white hover:shadow-[2px_2px_0px_#1a1a1a]"
                  : "bg-zinc-50 border-zinc-200 opacity-50 cursor-not-allowed"
              }`}
            >
              {/* Badge */}
              <span className={`absolute -top-2 -right-2 text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 border-2 ${
                active ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" :
                opt.available ? "border-[#1a1a1a]/15 text-[#1a1a1a]/25" :
                "border-zinc-300 text-zinc-400"
              }`}>
                {opt.badge}
              </span>

              <Icon className="w-5 h-5 mb-2.5" style={{ color: active ? opt.color : "#1a1a1a20" }} />
              <h3 className="font-black text-xs uppercase text-[#1a1a1a] mb-1">{opt.title}</h3>
              <p className="text-[9px] font-bold text-[#1a1a1a]/35">{opt.desc}</p>

              {/* Coming soon indicator */}
              {!opt.available && opt.comingSoon && (
                <div className="mt-2 flex items-center gap-1 text-[8px] font-black uppercase text-[#E3350D]">
                  <Sparkles className="w-2.5 h-2.5" />
                  {opt.comingSoon}
                </div>
              )}

              {active && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ background: opt.gradient }} />
              )}
            </button>
          )
        })}
      </div>

      {/* ════════════════ AI DIFFICULTY ════════════════ */}
      {mode === "practice" && (
        <div className="bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] overflow-hidden">
          <div className="bg-[#1a1a1a] px-4 py-2 flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-[#FFCC00]" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#FFCC00]">AI Difficulty</h3>
          </div>
          <div className="p-3 grid grid-cols-3 gap-2">
            {(["novice", "skilled", "master"] as AIDifficulty[]).map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`p-3 border-2 text-center transition-all capitalize ${
                  difficulty === d
                    ? "border-[#FFCC00] bg-[#FFCB0508] shadow-[2px_2px_0px_#FFCC00]"
                    : "border-[#1a1a1a]/8 hover:border-[#1a1a1a]/30"
                }`}
              >
                <div className="font-black text-sm text-[#1a1a1a]">{d}</div>
                <div className="text-[9px] font-bold text-[#1a1a1a]/25 mt-0.5">
                  {d === "novice" ? "Chill" : d === "skilled" ? "Fair fight" : "Expert"}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════ SELECTED DECK ════════════════ */}
      <div className="bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] overflow-hidden">
        <div className="mag-card-yellow px-4 py-2.5 flex items-center justify-between border-b-3 border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#1a1a1a]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]">
              {selectedDeck ? `Selected: ${selectedDeck.name}` : "Select a Battle Tube"}
            </h3>
          </div>
          {selectedDeck && (
            <span className="text-[8px] font-black text-[#22C55E] uppercase">✓ {deckTotals.count} tazos loaded</span>
          )}
        </div>

        <div className="p-4 space-y-3">
          {selectedDeck ? (
            <>
              {/* Tube stats */}
              <div className="flex flex-wrap items-center gap-1.5">
                {([
                  { icon: Zap, label: "ATK", value: deckTotals.atk, color: "#E3350D" },
                  { icon: Shield, label: "DEF", value: deckTotals.def, color: "#3B4CCA" },
                  { icon: Crosshair, label: "PRC", value: deckTotals.prc, color: "#A855F7" },
                  { icon: Star, label: "SPD+SPN", value: deckTotals.spd + deckTotals.spn, color: "#F59E0B" },
                ]).map(s => (
                  <div key={s.label}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white border-2 border-[#1a1a1a]/10 text-[10px] font-black shadow-[1px_1px_0px_#1a1a1a08]">
                    <span style={{ color: s.color }}>
                      <s.icon className="w-3 h-3" />
                    </span>
                    <span className="text-[#1a1a1a]/30">{s.label}</span>
                    <span className="text-[#1a1a1a] text-xs">{s.value}</span>
                  </div>
                ))}
                <span className="ml-auto text-[8px] font-black text-[#1a1a1a]/20 uppercase">
                  {deckTotals.count} tazos
                </span>
              </div>

              {/* Tazo mini chips */}
              <div className="flex gap-1 flex-wrap max-h-[80px] overflow-y-auto">
                {selectedDeck.tazos?.slice(0, 20).map((t: any) => (
                  <div key={t.id} className="flex items-center gap-1 p-1 border-2 border-[#1a1a1a]/8 bg-[#fffef0]">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0" style={{ background: "#1a1a1a" }}>
                      <TazoDiscImage src={t.imageUrl} alt={t.name} size="100%" borderWidth={0}
                        franchiseSlug={t.franchiseSlug} lazy className="w-full h-full" />
                    </div>
                    <span className="text-[7px] font-black text-[#1a1a1a] truncate max-w-[60px]">{t.displayName || t.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-[11px] font-bold text-[#1a1a1a]/25 py-6">
              {playerDecks && playerDecks.length > 0
                ? "Pick a Battle Tube above to see its stats"
                : "Create a Battle Tube in Decks first!"}
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
          className={`px-14 py-5 font-black text-lg sm:text-xl uppercase tracking-wider border-3 border-[#1a1a1a] transition-all ${
            canStart
              ? "bg-[#E3350D] text-white shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
              : "bg-zinc-300 text-zinc-500 cursor-not-allowed shadow-none"
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2"><Loader2Like className="w-5 h-5" /> Loading...</span>
          ) : !selectedDeckId ? (
            <span className="flex items-center gap-2">Select a Battle Tube <ChevronRight className="w-5 h-5" /></span>
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
          <p className="text-[10px] font-bold text-[#E3350D] mt-2">PvP modes coming in a future update</p>
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
