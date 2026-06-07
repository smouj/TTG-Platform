// ============================================================
// Trading Tazos Game — User Settings Page
// Magazine style: yellow banner strip, stat cards, profile.
// ============================================================
"use client"

import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import {
  User, Settings, LogOut, Disc3, Layers, Coins,
  Mail, Calendar, Shield, Star, Activity, Zap,
} from "lucide-react"

export default function SettingsPage() {
  const { t } = useI18n()
  const { user, logout } = useAuth()

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-5">
        <Shield className="w-14 h-14 mx-auto text-[#1a1a1a]/15" />
        <p className="text-sm font-black uppercase tracking-wider text-[#1a1a1a]/40">
          {t.auth_login || "Sign In"} to view settings
        </p>
        <a
          href={`/login?redirect=${encodeURIComponent("/app/settings")}`}
          className="mag-btn inline-block bg-[#E3350D] text-white px-8 py-3.5 text-xs font-black uppercase tracking-widest border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#1a1a1a] transition-all"
        >
          {t.auth_login || "Sign In"}
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 space-y-4">

      {/* ═══════════════════════════════════════════ */}
      {/* MAGAZINE BANNER STRIP — like Album page    */}
      {/* ═══════════════════════════════════════════ */}
      <div
        className="mag-card-yellow rounded-none px-4 py-3 flex flex-wrap items-center gap-3"
        style={{ borderBottom: "4px solid #1a1a1a" }}
      >
        <div className="flex items-center gap-1.5">
          <Settings className="w-5 h-5 text-[#1a1a1a]" />
          <span className="text-sm font-black text-[#1a1a1a] tracking-tight uppercase">
            {t.settings_title || "SETTINGS"}
          </span>
        </div>
        <div className="w-px h-5 bg-[#1a1a1a]/30" />
        <div className="flex items-center gap-1">
          <Disc3 className="w-4 h-4 text-[#E3350D]" />
          <span className="text-sm font-black text-[#E3350D] tracking-tight">
            {user.tazoCount ?? 0} TAZOS
          </span>
        </div>
        <div className="w-px h-5 bg-[#1a1a1a]/30" />
        <div className="flex items-center gap-1">
          <Layers className="w-4 h-4 text-[#3B4CCA]" />
          <span className="text-sm font-black text-[#3B4CCA] tracking-tight">
            {user.deckCount ?? 0} DECKS
          </span>
        </div>
        <div className="w-px h-5 bg-[#1a1a1a]/30" />
        <span className="text-xs font-black text-[#1a1a1a]/50 uppercase tracking-wider ml-auto truncate max-w-[200px]">
          {user.email}
        </span>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* PROFILE CARD                               */}
      {/* ═══════════════════════════════════════════ */}
      <div
        className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5 sm:p-6 space-y-5"
        style={{ background: "white" }}
      >
        {/* Avatar + Name */}
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-full bg-[#FFCC00] border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] flex items-center justify-center shrink-0 overflow-hidden"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-[#1a1a1a]" />
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <h3 className="text-xl font-black text-[#1a1a1a] uppercase tracking-tight truncate">
              {user.displayName || user.name}
            </h3>
            <p className="text-[11px] font-bold text-[#1a1a1a]/40 flex items-center gap-1 uppercase tracking-wider">
              <Mail className="w-3 h-3" /> {user.email}
            </p>
            <p className="text-[10px] font-black text-[#1a1a1a]/30 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Member since 2026
            </p>
          </div>
        </div>

        {/* Stat bars — magazine progress-bar style */}
        <div className="space-y-2.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase text-[#E3350D] flex items-center gap-1">
                <Disc3 className="w-3.5 h-3.5" /> Tazos Collected
              </span>
              <span className="text-[10px] font-black text-[#1a1a1a]">{user.tazoCount ?? 0} / 349</span>
            </div>
            <div className="h-3.5 border-2 border-[#1a1a1a] bg-[#fffef0] overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, ((user.tazoCount ?? 0) / 349) * 100)}%`,
                  background: "repeating-linear-gradient(-45deg, #E3350D, #E3350D 3px, #CC2200 3px, #CC2200 6px)",
                  borderRight: (user.tazoCount ?? 0) > 0 && (user.tazoCount ?? 0) < 349 ? "2px solid #1a1a1a" : "none",
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase text-[#3B4CCA] flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Decks Built
              </span>
              <span className="text-[10px] font-black text-[#1a1a1a]">{user.deckCount ?? 0}</span>
            </div>
            <div className="h-3.5 border-2 border-[#1a1a1a] bg-[#fffef0] overflow-hidden">
              <div
                className="h-full"
                style={{
                  width: `${Math.min(100, (user.deckCount ?? 0) * 20)}%`,
                  background: "repeating-linear-gradient(-45deg, #3B4CCA, #3B4CCA 3px, #2D3AAD 3px, #2D3AAD 6px)",
                  borderRight: (user.deckCount ?? 0) > 0 ? "2px solid #1a1a1a" : "none",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* QUICK STATS — 3-column grid                */}
      {/* ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Disc3, label: "Tazos", value: user.tazoCount ?? 0, color: "#E3350D", bg: "#E3350D08" },
          { icon: Layers, label: "Decks", value: user.deckCount ?? 0, color: "#3B4CCA", bg: "#3B4CCA08" },
          { icon: Coins, label: "Credits", value: "--", color: "#F59E0B", bg: "#F59E0B08" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div
            key={label}
            className="border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] p-4 text-center"
            style={{ background: "white" }}
          >
            <Icon className="w-6 h-6 mx-auto mb-1.5" style={{ color }} />
            <p className="text-2xl font-black text-[#1a1a1a] leading-none">{value}</p>
            <p className="text-[9px] font-black uppercase tracking-wider text-[#1a1a1a]/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* ACTIONS                                     */}
      {/* ═══════════════════════════════════════════ */}
      <div className="space-y-3">
        <button
          onClick={logout}
          className="w-full mag-btn bg-[#E3350D] text-white px-6 py-4 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#1a1a1a] transition-all"
        >
          <LogOut className="w-4 h-4" />
          {t.auth_logout || "Log Out"}
        </button>
      </div>
    </div>
  )
}
