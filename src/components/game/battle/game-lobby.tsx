// ============================================================
// Trading Tazos Game — Game Lobby (Magazine Edition)
// Pre-battle screen: mode cards, deck grid, AI difficulty.
// Full magazine/comic aesthetic with halftone, heavy borders.
// ============================================================
"use client"

import { useState, useMemo } from "react"
import type { TazoCard, PlayMode, AIDifficulty } from "@/lib/battle/game-loop"
import { Swords, Bot, Globe, Play, Zap, Shield, Crosshair, Timer, Star } from "lucide-react"

interface Props {
  playerTazos: TazoCard[]
  onStart: (mode: PlayMode, difficulty: AIDifficulty, deck: TazoCard[]) => void
  isLoading: boolean
  isAuthenticated: boolean
}

export default function GameLobby({ playerTazos, onStart, isLoading, isAuthenticated }: Props) {
  const [mode, setMode] = useState<PlayMode>("practice")
  const [difficulty, setDifficulty] = useState<AIDifficulty>("skilled")
  const [selectedDeck, setSelectedDeck] = useState<number[]>([])

  const bestDeck = useMemo(() => {
    return [...playerTazos].sort((a, b) => {
      const ta = a.attack + a.defense + a.bounce + a.spin + a.precision
      const tb = b.attack + b.defense + b.bounce + b.spin + b.precision
      return tb - ta
    }).slice(0, 5)
  }, [playerTazos])

  const deck = selectedDeck.length === 5
    ? playerTazos.filter(t => selectedDeck.includes(playerTazos.indexOf(t)))
    : bestDeck

  const deckTotals = deck.reduce((a, t) => ({
    atk: a.atk + t.attack, def: a.def + t.defense,
    spd: a.spd + t.bounce, spn: a.spn + t.spin, prc: a.prc + t.precision,
  }), { atk: 0, def: 0, spd: 0, spn: 0, prc: 0 })

  const toggleTazo = (idx: number) => {
    setSelectedDeck(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx)
      if (prev.length >= 5) return [...prev.slice(1), idx]
      return [...prev, idx]
    })
  }

  const franchiseColor = (f: string) =>
    f === "minimon" ? "#FFCB05" : f === "cybermon" ? "#00A1E9" : "#FF6B00"

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ════════════════ TITLE BANNER ════════════════ */}
      <div className="mag-card-yellow rounded-none p-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(#1a1a1a 1px, transparent 1px)", backgroundSize: "8px 8px" }} />
        <Swords className="w-10 h-10 mx-auto mb-2 text-[#1a1a1a] relative z-10" />
        <h2 className="text-2xl font-black uppercase tracking-[0.15em] text-[#1a1a1a] relative z-10">
          Battle Arena
        </h2>
        <p className="text-xs font-bold text-[#1a1a1a]/50 mt-1 relative z-10">
          Pick your mode &middot; Build your deck &middot; Fight!
        </p>
      </div>

      {/* ════════════════ MODE SELECTION ════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {([
          { id: "practice" as const, icon: <Bot className="w-5 h-5" />, title: "Practice", desc: "AI opponent. No pressure.", color: "#FFCC00", badge: "FREE", free: true },
          { id: "pvp_ranked" as const, icon: <Globe className="w-5 h-5" />, title: "Ranked PvP", desc: "Ladder matches. Glory.", color: "#E3350D", badge: "RANKED", free: false },
          { id: "pvp_friend" as const, icon: <Swords className="w-5 h-5" />, title: "Friend", desc: "Room code duel.", color: "#3B4CCA", badge: "DIRECT", free: false },
        ]).map(opt => {
          const active = mode === opt.id
          const locked = !opt.free && !isAuthenticated
          return (
            <button
              key={opt.id}
              onClick={() => !locked && setMode(opt.id)}
              disabled={locked}
              className={`p-4 border-3 text-left transition-all relative ${
                active
                  ? "bg-white border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]"
                  : locked
                  ? "bg-zinc-100 border-zinc-200 opacity-50 cursor-not-allowed"
                  : "bg-white/70 border-[#1a1a1a]/15 hover:border-[#1a1a1a]/50 hover:bg-white"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span style={{ color: opt.color }}>{opt.icon}</span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 border-2 ${
                  active ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "border-[#1a1a1a]/20 text-[#1a1a1a]/40"
                }`}>
                  {opt.badge}
                </span>
              </div>
              <h3 className="font-black text-xs uppercase text-[#1a1a1a]">{opt.title}</h3>
              <p className="text-[10px] text-[#1a1a1a]/40 mt-1">{opt.desc}</p>
              {locked && <p className="text-[9px] font-bold text-[#E3350D] mt-1.5">Login required</p>}
              {!locked && active && (
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: opt.color }} />
              )}
            </button>
          )
        })}
      </div>

      {/* ════════════════ AI DIFFICULTY ════════════════ */}
      {mode === "practice" && (
        <div className="mag-card rounded-none p-4">
          <h3 className="font-black text-[10px] uppercase tracking-[0.12em] text-[#1a1a1a]/40 mb-3">
            AI Difficulty
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {(["novice", "skilled", "master"] as AIDifficulty[]).map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`p-3 border-2 text-center transition-all ${
                  difficulty === d
                    ? "border-[#FFCC00] bg-[#FFCB0510] shadow-[2px_2px_0px_#FFCC00]"
                    : "border-[#1a1a1a]/10 hover:border-[#1a1a1a]/40"
                }`}
              >
                <div className="font-black text-sm uppercase text-[#1a1a1a] capitalize">{d}</div>
                <div className="text-[10px] text-[#1a1a1a]/30 mt-0.5">
                  {d === "novice" ? "Easy" : d === "skilled" ? "Normal" : "Hard"}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════ DECK BUILDER ════════════════ */}
      <div className="mag-card rounded-none p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-xs uppercase tracking-[0.12em] text-[#1a1a1a]">
            Your Deck <span className="text-[#1a1a1a]/30">({deck.length}/5)</span>
          </h3>
          <span className="text-[9px] font-bold text-[#1a1a1a]/25">
            {selectedDeck.length > 0 ? "CUSTOM" : "AUTO-BEST"}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <StatBadge icon={<Zap className="w-3 h-3" />} label="ATK" value={deckTotals.atk} color="#E3350D" />
          <StatBadge icon={<Shield className="w-3 h-3" />} label="DEF" value={deckTotals.def} color="#3B4CCA" />
          <StatBadge icon={<Timer className="w-3 h-3" />} label="SPD" value={deckTotals.spd} color="#22C55E" />
          <StatBadge icon={<Star className="w-3 h-3" />} label="SPN" value={deckTotals.spn} color="#F59E0B" />
          <StatBadge icon={<Crosshair className="w-3 h-3" />} label="PRC" value={deckTotals.prc} color="#A855F7" />
        </div>

        {/* Tazo grid */}
        <div className="grid grid-cols-5 gap-2 max-h-[200px] overflow-y-auto">
          {playerTazos.map((t, idx) => {
            const sel = selectedDeck.length > 0 ? selectedDeck.includes(idx) : bestDeck.some(b => b.id === t.id)
            const total = t.attack + t.defense + t.bounce + t.spin + t.precision
            return (
              <button
                key={t.id}
                onClick={() => toggleTazo(idx)}
                className={`p-1.5 border-2 text-center transition-all ${
                  sel ? "border-[#FFCC00] bg-[#FFCB0508] shadow-[2px_2px_0px_#FFCC00]" : "border-[#1a1a1a]/8 opacity-70 hover:opacity-100"
                }`}
              >
                <div className="w-10 h-10 mx-auto rounded-full overflow-hidden border border-[#1a1a1a]/15 mb-1 bg-zinc-100">
                  {t.imageUrl ? (
                    <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-black"
                      style={{ background: `linear-gradient(135deg, ${franchiseColor(t.franchise)}, #1a1a1a)` }}>
                      {t.name[0]}
                    </div>
                  )}
                </div>
                <div className="text-[9px] font-black text-[#1a1a1a] truncate leading-tight">{t.name}</div>
                <div className="text-[8px] font-bold mt-0.5" style={{ color: franchiseColor(t.franchise) }}>{total}</div>
              </button>
            )
          })}
        </div>

        {playerTazos.length < 5 && (
          <p className="text-[10px] font-bold text-[#E3350D] mt-3 text-center">
            You need 5+ tazos to battle. Open some bags!
          </p>
        )}
      </div>

      {/* ════════════════ START BUTTON ════════════════ */}
      <div className="text-center">
        <button
          onClick={() => {
            const finalDeck = selectedDeck.length === 5
              ? playerTazos.filter(t => selectedDeck.includes(playerTazos.indexOf(t)))
              : bestDeck
            onStart(mode, difficulty, finalDeck)
          }}
          disabled={playerTazos.length < 5 || isLoading || (mode !== "practice" && !isAuthenticated)}
          className="px-12 py-4 font-black text-lg uppercase tracking-wider bg-[#E3350D] text-white border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1a1a1a] transition-all disabled:opacity-30 disabled:cursor-not-allowed active:translate-x-[3px] active:translate-y-[3px] active:shadow-none w-full sm:w-auto"
        >
          <Play className="w-5 h-5 inline mr-2" />
          {isLoading ? "Loading..." : mode === "practice" ? "Battle AI!" : mode === "pvp_ranked" ? "Find Match" : "Create Room"}
        </button>
      </div>
    </div>
  )
}

function StatBadge({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: string
}) {
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-100 border border-[#1a1a1a]/12 text-[10px] font-black">
      <span style={{ color }}>{icon}</span>
      <span className="text-[#1a1a1a]/40">{label}</span>
      <span className="text-[#1a1a1a]">{value}</span>
    </div>
  )
}
