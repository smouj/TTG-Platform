"use client"
// ============================================================
// User ID Card — Pokémon-style trainer card
// Shows avatar, name, level, XP bar, stats, join date, title
// ============================================================

import { useState } from "react"
import Image from "next/image"
import { User, Swords, Package, Star, Calendar, Award, Disc3, Zap, TrendingUp } from "lucide-react"
import { getTitleForLevel } from "@/lib/leveling"

interface UserIdCardProps {
  user: {
    id: string
    name: string
    displayName?: string | null
    avatarUrl?: string | null
    bio?: string | null
    level: number
    xp: number
    xpToNext: number
    credits: number
    totalBattles: number
    totalWins: number
    totalLosses: number
    totalTazosOwned: number
    totalBagsOpened: number
    totalQuestsDone: number
    joinDate: string | Date
  }
  variant?: "full" | "compact" | "mini"
}

export default function UserIdCard({ user, variant = "full" }: UserIdCardProps) {
  const [imgError, setImgError] = useState(false)
  const [imgErrorCompact, setImgErrorCompact] = useState(false)
  const [imgErrorMini, setImgErrorMini] = useState(false)
  const title = getTitleForLevel(user.level)
  const progress = user.xpToNext > 0 ? Math.min(100, Math.round((user.xp / user.xpToNext) * 100) - ((user.level - 1) * 100 / user.xpToNext)) : 100
  
  // Calculate XP within current level
  const xpInLevel = user.xpToNext > 0 ? Math.min(user.xpToNext, Math.max(0, user.xp - (user.level > 1 ? (user.level - 1) * 100 : 0))) : 0
  const levelProgress = user.xpToNext > 0 ? Math.round((xpInLevel / user.xpToNext) * 100) : 100

  const joinDate = user.joinDate ? new Date(user.joinDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"

  if (variant === "mini") {
    return (
      <div className="flex items-center gap-2.5 px-3 py-2 border-2 border-ttg-black/10 bg-ttg-black/5">
        <div className="relative w-9 h-9 rounded-full border-2 border-ttg-yellow bg-ttg-black/10 overflow-hidden shrink-0">
          {user.avatarUrl && !imgErrorMini ? (
            <Image src={user.avatarUrl} alt="" fill className="object-cover" sizes="36px" unoptimized
              onError={() => setImgErrorMini(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-4 h-4 text-ttg-black/40" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-ttg-black truncate">{user.displayName || user.name}</p>
          <p className="text-[10px] font-bold text-ttg-black/40 uppercase tracking-wider">Lv.{user.level} · {title}</p>
        </div>
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <div className="p-4 border-3 border-ttg-black bg-white"
        style={{ boxShadow: "4px 4px 0px var(--ttg-black)" }}>
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative w-16 h-16 rounded-full border-3 border-ttg-yellow bg-gradient-to-br from-[#FFE566] to-ttg-yellow overflow-hidden shrink-0"
            style={{ boxShadow: "2px 2px 0px var(--ttg-black)" }}>
            {user.avatarUrl && !imgErrorCompact ? (
              <Image src={user.avatarUrl} alt="" fill className="object-cover" sizes="64px" unoptimized
                onError={() => setImgErrorCompact(true)} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-7 h-7 text-ttg-black/30" />
              </div>
            )}
          </div>
          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-base font-black text-ttg-black uppercase truncate">
                {user.displayName || user.name}
              </h3>
              <span className="text-[10px] font-black text-ttg-red bg-ttg-red/5 px-2 py-0.5 rounded-full uppercase">
                Lv.{user.level}
              </span>
            </div>
            <p className="text-[11px] font-bold text-ttg-black/40 uppercase tracking-wider mb-1.5">{title}</p>
            {/* XP Bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-ttg-black/5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-ttg-yellow to-[#E3350D] transition-all duration-500"
                  style={{ width: `${levelProgress}%` }} />
              </div>
              <span className="text-[10px] font-black text-ttg-black/30 tabular-nums whitespace-nowrap">
                {xpInLevel}/{user.xpToNext} XP
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Full card (Pokémon trainer card style) ──
  return (
    <div className="relative overflow-hidden border-3 border-ttg-black bg-gradient-to-br from-[#FFF9E6] via-white to-[#FFF9E6]"
      style={{ boxShadow: "5px 5px 0px var(--ttg-black)" }}>
      
      {/* Magazine halftone overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, var(--ttg-black) 1px, transparent 1px)", backgroundSize: "5px 5px" }} />

      {/* Top accent bar */}
      <div className="h-2 bg-gradient-to-r from-ttg-yellow via-[#E3350D] to-ttg-yellow" />

      {/* Header row — Avatar + Name + Level */}
      <div className="p-5 pb-0">
        <div className="flex items-start gap-4">
          {/* Avatar with gold border */}
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 border-ttg-yellow bg-gradient-to-br from-[#FFE566] to-ttg-yellow overflow-hidden"
              style={{ boxShadow: "3px 3px 0px var(--ttg-black)" }}>
              {user.avatarUrl && !imgError ? (
                <Image src={user.avatarUrl} alt="" fill className="object-cover" sizes="96px" unoptimized
                  onError={() => setImgError(true)} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-10 h-10 text-ttg-black/25" />
                </div>
              )}
            </div>
            {/* Level badge */}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-ttg-red border-2 border-ttg-black flex items-center justify-center"
              style={{ boxShadow: "2px 2px 0px var(--ttg-black)" }}>
              <span className="text-[10px] font-black text-white">{user.level}</span>
            </div>
          </div>

          {/* Name + Title */}
          <div className="min-w-0 flex-1 pt-1">
            <h2 className="text-xl sm:text-2xl font-black text-ttg-black uppercase tracking-tight leading-none mb-0.5 truncate">
              {user.displayName || user.name}
            </h2>
            <p className="text-xs font-bold text-ttg-black/35 uppercase tracking-[0.15em]">{title}</p>
            {user.bio && (
              <p className="text-[11px] font-medium text-ttg-black/45 mt-1.5 line-clamp-2 italic">{user.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-black text-ttg-black/30 uppercase tracking-[0.2em]">Experience</span>
          <span className="text-[10px] font-black text-ttg-black/40 tabular-nums">
            {xpInLevel} / {user.xpToNext} XP
          </span>
        </div>
        <div className="relative h-3 bg-ttg-black/5 overflow-hidden border border-ttg-black/10">
          <div className="absolute inset-0 bg-gradient-to-r from-ttg-yellow via-[#FFD700] to-[#E3350D] transition-all duration-700"
            style={{ width: `${levelProgress}%` }} />
          {/* Animated shine */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"
            style={{ animationDuration: "2s" }} />
        </div>
        <p className="text-[9px] font-semibold text-ttg-black/25 mt-1 text-right">
          Level {user.level + 1} at {user.xpToNext} XP
        </p>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t-2 border-ttg-black/5" />

      {/* Stats Grid */}
      <div className="p-5 pt-3">
        <p className="text-[10px] font-black text-ttg-black/20 uppercase tracking-[0.3em] mb-3">Player Stats</p>
        <div className="grid grid-cols-3 gap-3">
          <StatCell icon={Swords} label="Battles" value={user.totalBattles} />
          <StatCell icon={Award} label="Wins" value={user.totalWins} accent />
          <StatCell icon={Zap} label="Losses" value={user.totalLosses} />
          <StatCell icon={Disc3} label="Tazos" value={user.totalTazosOwned} />
          <StatCell icon={Package} label="Bags" value={user.totalBagsOpened} />
          <StatCell icon={Star} label="Quests" value={user.totalQuestsDone} accent />
        </div>

        {/* Bottom row: Credits + Join Date */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t-2 border-ttg-black/5">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-ttg-yellow flex items-center justify-center">
              <span className="text-[9px] font-black text-ttg-black">¢</span>
            </div>
            <span className="text-sm font-black text-ttg-black">{user.credits.toLocaleString()}</span>
            <span className="text-[10px] font-bold text-ttg-black/30 uppercase ml-0.5">CREDITS</span>
          </div>
          <div className="flex items-center gap-1.5 text-ttg-black/30">
            <Calendar className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{joinDate}</span>
          </div>
        </div>
      </div>

      {/* Bottom accent */}
      <div className="h-1.5 bg-gradient-to-r from-ttg-black/5 via-[#FFCC00]/30 to-ttg-black/5" />
    </div>
  )
}

/** Single stat cell */
function StatCell({ icon: Icon, label, value, accent }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <div className={`flex flex-col items-center gap-1 p-2.5 border-2 ${
      accent ? "border-ttg-yellow/30 bg-ttg-yellow/3" : "border-ttg-black/5 bg-ttg-black/[0.02]"
    }`}>
      <Icon className={`w-3.5 h-3.5 ${accent ? "text-ttg-red/60" : "text-ttg-black/25"}`} />
      <span className="text-lg font-black text-ttg-black leading-none tabular-nums">{value}</span>
      <span className="text-[9px] font-bold text-ttg-black/25 uppercase tracking-wider leading-none">{label}</span>
    </div>
  )
}
