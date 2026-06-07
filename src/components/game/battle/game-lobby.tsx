// ============================================================
// Trading Tazos Game — Game Lobby v2
// Better deck builder, clearer mode cards, improved UX
// ============================================================
"use client"

import { useState, useMemo } from "react"
import type { TazoCard, PlayMode, AIDifficulty } from "@/lib/battle/game-loop"
import {
  Swords, Bot, Globe, Play, Zap, Shield, Crosshair, Star,
  Sparkles, ChevronRight, Disc3,
} from "lucide-react"
import TazoDiscImage from "@/components/game/tazo-disc-image"
import { playSFX, sfxEnsureUnlocked } from "@/lib/audio/sfx-engine"

interface Props {
  playerTazos: TazoCard[]
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

export default function GameLobby({ playerTazos, onStart, isLoading, isAuthenticated }: Props) {
  const [mode, setMode] = useState<PlayMode>("practice")
  const [difficulty, setDifficulty] = useState<AIDifficulty>("skilled")
  const [sel, setSel] = useState<number[]>([])

  // Auto-select 5 best tazos by power
  const best = useMemo(() =>
    [...playerTazos]
      .sort((a, b) =>
        (b.attack + b.defense + b.bounce + b.spin + b.precision) -
        (a.attack + a.defense + a.bounce + a.spin + a.precision)
      )
      .slice(0, 5),
  [playerTazos])

  const deck = sel.length === 5
    ? playerTazos.filter(t => sel.includes(playerTazos.indexOf(t)))
    : best

  const totals = deck.reduce((a, t) => ({
    atk: a.atk + t.attack,
    def: a.def + t.defense,
    spd: a.spd + t.bounce,
    spn: a.spn + t.spin,
    prc: a.prc + t.precision,
  }), { atk: 0, def: 0, spd: 0, spn: 0, prc: 0 })

  const toggle = (i: number) => setSel(p =>
    p.includes(i) ? p.filter(x => x !== i) : p.length >= 5 ? [...p.slice(1), i] : [...p, i]
  )

  const canStart = mode === "practice" || isAuthenticated
  const tazoCount = playerTazos.length

  return (
    <div className="max-w-5xl mx-auto space-y-4">

      {/* ════════════════ BANNER ════════════════ */}
      <div className="mag-card-yellow rounded-none px-4 py-3 flex flex-wrap items-center gap-3"
        style={{ borderBottom: "4px solid #1a1a1a" }}>
        <Swords className="w-5 h-5 text-[#E3350D]" />
        <h1 className="text-sm font-black text-[#1a1a1a] uppercase tracking-tight">BATTLE ARENA</h1>
        <div className="w-px h-5 bg-[#1a1a1a]/30" />
        <span className="text-xs font-black text-[#E3350D]">
          {tazoCount} TAZOS
        </span>
        {tazoCount < 5 && (
          <span className="text-[9px] font-black text-[#1a1a1a]/40 ml-auto">Need 5+ tazos</span>
        )}
        <span className="ml-auto text-[9px] font-black text-[#1a1a1a]/30 uppercase">
          {isAuthenticated ? "Ready" : "Guest"}
        </span>
      </div>

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

      {/* ════════════════ DECK BUILDER ════════════════ */}
      <div className="bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] overflow-hidden">
        <div className="mag-card-yellow px-4 py-2.5 flex items-center justify-between border-b-3 border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#1a1a1a]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]">
              Your Deck <span className="text-[#1a1a1a]/25 text-[9px]">({deck.length}/5)</span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {sel.length > 0 && (
              <button onClick={() => setSel([])} className="text-[8px] font-black text-[#1a1a1a]/30 uppercase border border-[#1a1a1a]/15 px-1.5 py-0.5 hover:bg-[#1a1a1a]/5">
                Auto
              </button>
            )}
            <span className="text-[7px] font-black text-[#1a1a1a]/20 uppercase tracking-widest">
              {sel.length > 0 ? "CUSTOM" : "Auto-Best"}
            </span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Totals bar */}
          <div className="flex flex-wrap items-center gap-1.5">
            {([
              { icon: Zap, label: "ATK", value: totals.atk, color: "#E3350D" },
              { icon: Shield, label: "DEF", value: totals.def, color: "#3B4CCA" },
              { icon: Crosshair, label: "PRC", value: totals.prc, color: "#A855F7" },
              { icon: Star, label: "SPD+SPN", value: totals.spd + totals.spn, color: "#F59E0B" },
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
              Pick 5 for best synergy
            </span>
          </div>

          {/* Tazo selection grid */}
          {playerTazos.length > 0 ? (
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-[210px] overflow-y-auto">
              {playerTazos.map((t, i) => {
                const selected = sel.length > 0 ? sel.includes(i) : best.some(b => b.id === t.id)
                const total = t.attack + t.defense + t.bounce + t.spin + t.precision
                return (
                  <button
                    key={t.id}
                    onClick={() => toggle(i)}
                    className={`p-1.5 border-2 text-center transition-all rounded ${
                      selected
                        ? "border-[#FFCC00] bg-[#FFCB050a] shadow-[2px_2px_0px_#FFCC00]"
                        : "border-[#1a1a1a]/6 opacity-55 hover:opacity-85 hover:border-[#1a1a1a]/20"
                    }`}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-full overflow-hidden border border-[#1a1a1a]/12 mb-1 bg-[#fffef0]">
                      <TazoDiscImage
                        src={t.imageUrl} alt={t.name} size="100%"
                        scale={1.12} borderWidth={0} franchiseSlug={t.franchise}
                        lazy className="w-full h-full"
                      />
                    </div>
                    <div className="text-[8px] font-black text-[#1a1a1a] truncate leading-tight">
                      {t.name}
                    </div>
                    <div className="text-[7px] font-black mt-0.5 flex items-center justify-center gap-0.5"
                      style={{ color: fColor(t.franchise) }}>
                      <Disc3 className="w-1.5 h-1.5" />{total}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-[11px] font-bold text-[#1a1a1a]/25 py-8">
              No tazos yet — open bags in the Shop!
            </p>
          )}

          {playerTazos.length < 5 && playerTazos.length > 0 && (
            <p className="text-center text-[10px] font-black text-[#E3350D]">
              ⚠️ Need {5 - playerTazos.length} more tazos for a full deck
            </p>
          )}
        </div>
      </div>

      {/* ════════════════ START BUTTON ════════════════ */}
      <div className="text-center pt-1">
        <button
          onClick={() => {
            if (!canStart || playerTazos.length < 5 || isLoading) return
            sfxEnsureUnlocked()
            playSFX('equip')
            onStart(mode, difficulty, deck)
          }}
          disabled={playerTazos.length < 5 || isLoading || !canStart}
          className={`px-14 py-5 font-black text-lg sm:text-xl uppercase tracking-wider border-3 border-[#1a1a1a] transition-all ${
            playerTazos.length >= 5 && canStart
              ? "bg-[#E3350D] text-white shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
              : "bg-zinc-300 text-zinc-500 cursor-not-allowed shadow-none"
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2"><Loader2Like className="w-5 h-5" /> Loading...</span>
          ) : playerTazos.length < 5 ? (
            <span className="flex items-center gap-2">Need 5+ Tazos <ChevronRight className="w-5 h-5" /></span>
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
