// ============================================================
// Trading Tazos Game — Game Lobby (Magazine Edition)
// Matches /stats, /settings, /quests banner pattern exactly.
// ============================================================
"use client"

import { useState, useMemo } from "react"
import type { TazoCard, PlayMode, AIDifficulty } from "@/lib/battle/game-loop"
import { Swords, Bot, Globe, Play, Zap, Shield, Crosshair, Star } from "lucide-react"

interface Props {
  playerTazos: TazoCard[]
  onStart: (mode: PlayMode, difficulty: AIDifficulty, deck: TazoCard[]) => void
  isLoading: boolean
  isAuthenticated: boolean
}

const MODES = [
  { id: "practice" as const, icon: Bot, title: "Practice", desc: "AI opponent, no pressure", color: "#22C55E", badge: "FREE" },
  { id: "pvp_ranked" as const, icon: Globe, title: "Ranked PvP", desc: "Climb the ladder", color: "#E3350D", badge: "RANKED" },
  { id: "pvp_friend" as const, icon: Swords, title: "Friend Battle", desc: "Room code duel", color: "#3B4CCA", badge: "DIRECT" },
]

export default function GameLobby({ playerTazos, onStart, isLoading, isAuthenticated }: Props) {
  const [mode, setMode] = useState<PlayMode>("practice")
  const [difficulty, setDifficulty] = useState<AIDifficulty>("skilled")
  const [sel, setSel] = useState<number[]>([])

  const best = useMemo(() => [...playerTazos].sort((a, b) =>
    (b.attack + b.defense + b.bounce + b.spin + b.precision) -
    (a.attack + a.defense + a.bounce + a.spin + a.precision)
  ).slice(0, 5), [playerTazos])

  const deck = sel.length === 5
    ? playerTazos.filter(t => sel.includes(playerTazos.indexOf(t)))
    : best

  const totals = deck.reduce((a, t) => ({
    atk: a.atk + t.attack, def: a.def + t.defense,
    spd: a.spd + t.bounce, spn: a.spn + t.spin, prc: a.prc + t.precision,
  }), { atk: 0, def: 0, spd: 0, spn: 0, prc: 0 })

  const toggle = (i: number) => setSel(p => p.includes(i) ? p.filter(x => x !== i) : p.length >= 5 ? [...p.slice(1), i] : [...p, i])

  const fColor = (f: string) => f === "minimon" ? "#FFCB05" : f === "cybermon" ? "#00A1E9" : "#FF6B00"

  return (
    <div className="max-w-3xl mx-auto space-y-4">

      {/* ════════════ BANNER STRIP — matches stats/settings/quests ════════════ */}
      <div className="mag-card-yellow rounded-none px-4 py-3 flex flex-wrap items-center gap-3"
        style={{ borderBottom: "4px solid #1a1a1a" }}>
        <div className="flex items-center gap-1.5">
          <Swords className="w-5 h-5 text-[#E3350D]" />
          <span className="text-sm font-black text-[#1a1a1a] tracking-tight uppercase">
            BATTLE ARENA
          </span>
        </div>
        <div className="w-px h-5 bg-[#1a1a1a]/30" />
        <span className="text-xs font-black text-[#E3350D] tracking-tight uppercase">
          {playerTazos.length} TAZOS
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[9px] font-black text-[#1a1a1a]/40 uppercase tracking-wider">
            {isAuthenticated ? "Ready" : "Guest"}
          </span>
        </div>
      </div>

      {/* ════════════ MODE CARDS ════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {MODES.map(opt => {
          const active = mode === opt.id
          const locked = !opt.free && !isAuthenticated
          const Icon = opt.icon
          return (
            <button
              key={opt.id}
              onClick={() => !locked && setMode(opt.id)}
              disabled={locked}
              className={`relative p-4 text-left border-3 transition-all ${
                active
                  ? "bg-white border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]"
                  : locked
                  ? "bg-zinc-100 border-zinc-200 opacity-45 cursor-not-allowed"
                  : "bg-white border-[#1a1a1a]/15 hover:border-[#1a1a1a]/60 hover:bg-white hover:shadow-[2px_2px_0px_#1a1a1a]"
              }`}
            >
              <div className="absolute -top-2 -right-2">
                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 border-2 ${
                  active ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "border-[#1a1a1a]/20 text-[#1a1a1a]/30"
                }`}>
                  {opt.badge}
                </span>
              </div>
              <Icon className="w-5 h-5 mb-2" style={{ color: active ? opt.color : "#1a1a1a30" }} />
              <h3 className="font-black text-xs uppercase text-[#1a1a1a] mb-0.5">{opt.title}</h3>
              <p className="text-[10px] font-bold text-[#1a1a1a]/35">{opt.desc}</p>
              {locked && <p className="text-[9px] font-bold text-[#E3350D] mt-1">Login required</p>}
              {active && <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: opt.color }} />}
            </button>
          )
        })}
      </div>

      {/* ════════════ AI DIFFICULTY ════════════ */}
      {mode === "practice" && (
        <div className="mag-card rounded-none overflow-hidden">
          <div className="bg-[#1a1a1a] px-4 py-2 flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-[#FFCC00]" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#FFCC00]">AI Difficulty</h3>
          </div>
          <div className="p-4 mag-dots">
            <div className="grid grid-cols-3 gap-2">
              {(["novice", "skilled", "master"] as AIDifficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`p-3 border-2 text-center transition-all ${
                    difficulty === d
                      ? "border-[#FFCC00] bg-[#FFCB0512] shadow-[2px_2px_0px_#FFCC00]"
                      : "border-[#1a1a1a]/10 hover:border-[#1a1a1a]/40"
                  }`}
                >
                  <div className="font-black text-sm uppercase text-[#1a1a1a] capitalize">{d}</div>
                  <div className="text-[9px] font-bold text-[#1a1a1a]/25 mt-0.5">
                    {d === "novice" ? "Easy" : d === "skilled" ? "Normal" : "Hard"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════ DECK BUILDER ════════════ */}
      <div className="mag-card rounded-none overflow-hidden">
        <div className="mag-card-yellow px-4 py-2 flex items-center justify-between border-b-3 border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#1a1a1a]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]">
              Your Deck <span className="text-[#1a1a1a]/30">({deck.length}/5)</span>
            </h3>
          </div>
          <span className="text-[8px] font-black text-[#1a1a1a]/25 uppercase tracking-widest">
            {sel.length > 0 ? "CUSTOM" : "AUTO-BEST"}
          </span>
        </div>

        <div className="p-4 mag-dots space-y-3">
          {/* Stats */}
          <div className="flex flex-wrap gap-1.5">
            {([
              { icon: Zap, label: "ATK", value: totals.atk, color: "#E3350D" },
              { icon: Shield, label: "DEF", value: totals.def, color: "#3B4CCA" },
              { icon: Star, label: "SPD", value: totals.spd, color: "#22C55E" },
              { icon: Star, label: "SPN", value: totals.spn, color: "#F59E0B" },
              { icon: Crosshair, label: "PRC", value: totals.prc, color: "#A855F7" },
            ]).map(s => (
              <div key={s.label} className="flex items-center gap-1 px-2 py-0.5 bg-white border-2 border-[#1a1a1a]/12 text-[10px] font-black shadow-[1px_1px_0px_#1a1a1a10]">
                <span style={{ color: s.color }}><s.icon className="w-3 h-3" /></span>
                <span className="text-[#1a1a1a]/30">{s.label}</span>
                <span className="text-[#1a1a1a]">{s.value}</span>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-5 gap-2 max-h-[180px] overflow-y-auto">
            {playerTazos.map((t, i) => {
              const selected = sel.length > 0 ? sel.includes(i) : best.some(b => b.id === t.id)
              const total = t.attack + t.defense + t.bounce + t.spin + t.precision
              return (
                <button
                  key={t.id}
                  onClick={() => toggle(i)}
                  className={`p-1.5 border-2 text-center transition-all ${
                    selected
                      ? "border-[#FFCC00] bg-[#FFCB0508] shadow-[2px_2px_0px_#FFCC00]"
                      : "border-[#1a1a1a]/8 opacity-65 hover:opacity-90"
                  }`}
                >
                  <div className="w-10 h-10 mx-auto rounded-full overflow-hidden border border-[#1a1a1a]/12 mb-1 bg-zinc-100">
                    {t.imageUrl ? (
                      <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-black"
                        style={{ background: `linear-gradient(135deg, ${fColor(t.franchise)}, #1a1a1a)` }}>
                        {t.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="text-[9px] font-black text-[#1a1a1a] truncate leading-tight">{t.name}</div>
                  <div className="text-[8px] font-bold mt-0.5" style={{ color: fColor(t.franchise) }}>{total}</div>
                </button>
              )
            })}
          </div>

          {playerTazos.length < 5 && (
            <p className="text-[10px] font-black text-[#E3350D] text-center">
              Need 5+ tazos — open bags in the Shop!
            </p>
          )}
        </div>
      </div>

      {/* ════════════ START ════════════ */}
      <div className="text-center">
        <button
          onClick={() => onStart(mode, difficulty, sel.length === 5 ? playerTazos.filter(t => sel.includes(playerTazos.indexOf(t))) : best)}
          disabled={playerTazos.length < 5 || isLoading || (mode !== "practice" && !isAuthenticated)}
          className="px-12 py-4 font-black text-lg uppercase tracking-wider bg-[#E3350D] text-white border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1a1a1a] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all disabled:opacity-25 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          <Play className="w-5 h-5 inline mr-2" />
          {isLoading ? "Loading..." : mode === "practice" ? "Battle AI!" : mode === "pvp_ranked" ? "Find Match" : "Create Room"}
        </button>
      </div>
    </div>
  )
}
