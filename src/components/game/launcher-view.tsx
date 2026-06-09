// ============================================================
// Trading Tazos Game — Magazine Launcher View
// 90s gaming-magazine aesthetic: halftone dots, heavy black
// borders, comic typography, CMYK accents, retro print feel.
// This IS the launcher that the desktop app (.exe/.dmg) loads.
//
// v2: Integrated content pages — the masthead tabs render
// How to Play, Collections, Tazos, Leaderboard, Download,
// and FAQ inside the same magazine shell, replacing the hero.
// ============================================================
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useVisibilityRefresh } from "@/lib/use-visibility-refresh"
import {
  Download, Globe, Monitor, Apple, Terminal, Smartphone,
  Zap, Star, Disc3, Swords, Medal, PackageOpen,
  ExternalLink,
  Trophy, Coins, Package, ArrowLeft, Loader2,
  Crown, X, ArrowUp, HelpCircle, ArrowRight, ShoppingBag, Sparkles,
  User, Mail, Key, Gift, Shield, Crosshair, Gem, TrendingUp, Layers, Bug
} from "lucide-react"
import TazoDiscImage from "@/components/game/tazo-disc-image"
import TazoDetailModal from '@/components/game/tazo-detail-modal'
import { FRANCHISES, FRANCHISE_BY_SLUG } from "@/lib/franchise-config"

// ── Types ──

type PageId = "home" | "how-to-play" | "collections" | "collections-minimon"
  | "collections-cybermon" | "collections-dracobell" | "tazos" | "leaderboard"
  | "download" | "faq" | "shop" | "privacy" | "terms" | "cookies" | "contact"

const PAGE_LABELS: Record<PageId, string> = {
  home: "Home",
  "how-to-play": "How to Play",
  collections: "Collections",
  "collections-minimon": "Minimon",
  "collections-cybermon": "Cybermon",
  "collections-dracobell": "Dracobell",
  tazos: "Tazos",
  leaderboard: "Rankings",
  download: "Download",
  faq: "FAQ",
  privacy: "Privacy",
  terms: "Terms",
  cookies: "Cookies",
  contact: "Contact",
  shop: "Shop",
}

// ── Magazine Splash Screen ──

function MagazineSplash({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<"cover" | "flip" | "done">("cover")
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("flip"), 1200)
    const t2 = setTimeout(() => {
      const i = setInterval(() => {
        setProgress(p => {
          if (p >= 100) { clearInterval(i); return 100 }
          return Math.min(100, p + Math.random() * 18 + 8)
        })
      }, 80)
    }, 1300)
    const t3 = setTimeout(() => onFinish(), 3400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onFinish])

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: "#FFF9E6" }}>
      <div className="mag-dots absolute inset-0 opacity-30" />
      <div className={`relative transition-all duration-600 ${
        phase === "cover" ? "scale-100 opacity-100" : "scale-90 opacity-70"
      }`}>
        <div className="absolute -inset-8 sm:-inset-10 flex items-center justify-center pointer-events-none">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-[6px] border-[#E3350D]/30" />
          <div className="absolute w-20 h-20 sm:w-28 sm:h-28 rounded-full border-[4px] border-[#FFCC00]/40" />
          <div className="absolute w-16 h-16 sm:w-24 sm:h-24 rounded-full border-[3px] border-[#E3350D]/20" />
        </div>
        <img
          src="/logo/logo-icon-black.webp"
          alt="Trading Tazos"
          className="w-28 h-28 sm:w-36 sm:h-36 relative z-10"
          style={{ filter: "drop-shadow(6px 6px 0 rgba(26,26,26,0.3))" }}
        />
      </div>
      <h1 className="mt-5 text-3xl sm:text-5xl font-black text-[#1a1a1a] uppercase tracking-[0.1em] text-center leading-none"
        style={{ textShadow: "3px 3px 0 rgba(227,53,13,0.3)" }}>
        TRADING<span className="text-[#E3350D]">TAZOS</span><span className="text-[#1a1a1a]">GAME</span>
      </h1>
      <div className={`mt-2 flex items-center gap-2 transition-all duration-500 ${
        phase === "cover" ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
      }`}>
        <span className="w-3 h-[2px] bg-[#1a1a1a]" />
        <span className="text-[10px] sm:text-xs font-black text-[#1a1a1a]/50 uppercase tracking-[0.4em]">
          Official Game (Beta)
        </span>
        <span className="w-3 h-[2px] bg-[#1a1a1a]" />
      </div>
      <div className={`mt-8 transition-all duration-500 ${
        phase === "flip" ? "opacity-100" : "opacity-0"
      }`}>
        <div className="relative w-56 sm:w-72 h-3 border-2 border-[#1a1a1a] overflow-hidden"
          style={{
            background: "repeating-linear-gradient(-45deg, #FFCC00, #FFCC00 6px, #F0A800 6px, #F0A800 12px)",
          }}>
          <div className="absolute inset-0 bg-[#1a1a1a] transition-all duration-75"
            style={{ left: `${Math.min(progress, 100)}%` }} />
        </div>
        <p className="mt-2 text-[9px] font-black text-[#1a1a1a]/40 text-center uppercase tracking-[0.3em]">
          Loading magazine #{phase === "cover" ? "001" : Math.floor(progress / 10) + 1}...
        </p>
      </div>
    </div>
  )
}

// ── Shared sub-components ──

function PlatformBadge({ icon: Icon, label }: { icon: typeof Monitor; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 border-2 border-[#1a1a1a] bg-white"
      style={{ boxShadow: "2px 2px 0 #1a1a1a" }}>
      <Icon className="w-3 h-3 text-[#1a1a1a]" />
      <span className="text-[9px] font-black text-[#1a1a1a] uppercase tracking-wider">{label}</span>
    </div>
  )
}

function StatBadge({ number, label, color }: { number: string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 border-2 border-[#1a1a1a] bg-white"
      style={{ boxShadow: `3px 3px 0 ${color}40` }}>
      <span className="text-base sm:text-lg md:text-xl font-black text-[#1a1a1a] leading-none">{number}</span>
      <span className="text-[8px] sm:text-[9px] font-black text-[#1a1a1a]/55 uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  )
}

function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={onBack}
        className="flex items-center justify-center w-8 h-8 border-2 border-[#1a1a1a] bg-white hover:bg-[#FFF9E6] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        style={{ boxShadow: "2px 2px 0 #1a1a1a" }}
      >
        <ArrowLeft className="w-4 h-4 text-[#1a1a1a]" />
      </button>
      <h2 className="text-xl sm:text-2xl font-black text-[#1a1a1a] uppercase tracking-[0.05em]">{title}</h2>
    </div>
  )
}

function SectionCard({ step, color, title, children, bgColor, preview }: {
  step?: number; color: string; title: string; children: React.ReactNode; bgColor?: string
  preview?: React.ReactNode
}) {
  return (
    <div className="border-2 border-[#1a1a1a] bg-white overflow-hidden"
      style={{ boxShadow: "4px 4px 0 #1a1a1a" }}>
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        {step && (
          <span className="inline-flex items-center justify-center w-10 h-10 border-2 border-[#1a1a1a] text-lg font-black text-white flex-shrink-0"
            style={{ background: bgColor || color }}>{step}</span>
        )}
        <h3 className="text-base font-black uppercase text-[#1a1a1a]">{title}</h3>
      </div>
      {preview && (
        <div className="relative border-t-2 border-b-2 border-[#1a1a1a]/10 bg-[#fafaf5] overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 mag-stripes opacity-15 z-10" />
          <div className="p-3 flex items-center justify-center">
            {preview}
          </div>
        </div>
      )}
      <div className="text-xs font-bold text-[#1a1a1a]/60 space-y-1.5 leading-relaxed px-5 pb-5 pt-3">
        {children}
      </div>
    </div>
  )
}

// ── Preview Images for How to Play ──

function SignUpPreview() {
  return (
    <div className="flex items-center gap-5 py-3">
      {/* Mini registration form illustration */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-[#1a1a1a]/20 flex items-center justify-center"><User className="w-3 h-3 text-[#1a1a1a]/40" /></div>
            <span className="text-[10px] font-black text-[#1a1a1a]/30 uppercase">Name</span>
            <div className="w-28 h-5 border-2 border-[#FFCC00]/30 rounded bg-[#FFF9E6]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-[#1a1a1a]/20 flex items-center justify-center"><Mail className="w-3 h-3 text-[#1a1a1a]/40" /></div>
            <span className="text-[10px] font-black text-[#1a1a1a]/30 uppercase">Email</span>
            <div className="w-28 h-5 border-2 border-[#1a1a1a]/10 rounded bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-[#1a1a1a]/20 flex items-center justify-center"><Key className="w-3 h-3 text-[#1a1a1a]/40" /></div>
            <span className="text-[10px] font-black text-[#1a1a1a]/30 uppercase">Pass</span>
            <div className="w-28 h-5 border-2 border-[#1a1a1a]/10 rounded bg-white flex items-center px-2">
              <span className="text-[7px] text-[#1a1a1a]/15">••••••••••</span>
            </div>
          </div>
        </div>
        <div className="h-12 w-px border-l-2 border-dashed border-[#FFCC00]/30" />
        {/* Result: credits + badge */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full border-3 border-[#22C55E] bg-[#22C55E]/10 flex items-center justify-center">
            <Gift className="w-5 h-5 text-[#22C55E]" />
          </div>
          <span className="text-[8px] font-black text-[#22C55E] uppercase">10 Free Bags!</span>
          <span className="text-[7px] font-bold text-[#1a1a1a]/30">+100 credits</span>
        </div>
      </div>
    </div>
  )
}

function BagPreview({ tazos }: { tazos: any[] }) {
  return (
    <div className="flex items-center gap-4 py-2">
      {/* Bag opening sequence: bag → tazos */}
      <div className="flex items-center gap-3">
        {/* Bag types */}
        <div className="flex flex-col gap-1.5 items-center">
          <div className="w-14 h-16 border-2 border-[#9CA3AF] rounded-lg bg-[#9CA3AF]/5 flex flex-col items-center justify-center relative overflow-hidden"
            style={{ boxShadow: "2px 2px 0 #9CA3AF30" }}>
            <span className="text-[7px] font-black text-[#9CA3AF] uppercase mt-1">Std</span>
            <span className="text-[6px] font-bold text-[#9CA3AF]/50">10 cr</span>
            <div className="absolute -bottom-1 left-0 right-0 h-3 bg-[#9CA3AF]/10 border-t border-[#9CA3AF]/20" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 items-center">
          <div className="w-14 h-16 border-2 border-[#3B82F6] rounded-lg bg-[#3B82F6]/5 flex flex-col items-center justify-center relative overflow-hidden"
            style={{ boxShadow: "2px 2px 0 #3B82F630" }}>
            <span className="text-[7px] font-black text-[#3B82F6] uppercase mt-1">Prem</span>
            <span className="text-[6px] font-bold text-[#3B82F6]/50">10 cr</span>
            <div className="absolute -bottom-1 left-0 right-0 h-3 bg-[#3B82F6]/10 border-t border-[#3B82F6]/20" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 items-center">
          <div className="w-14 h-16 border-2 border-[#A855F7] rounded-lg bg-[#A855F7]/5 flex flex-col items-center justify-center relative overflow-hidden"
            style={{ boxShadow: "2px 2px 0 #A855F730" }}>
            <span className="text-[7px] font-black text-[#A855F7] uppercase mt-1">Mega</span>
            <span className="text-[6px] font-bold text-[#A855F7]/50">10 cr</span>
            <div className="absolute -bottom-1 left-0 right-0 h-3 bg-[#A855F7]/10 border-t border-[#A855F7]/20" />
          </div>
        </div>
      </div>
      <div className="text-[18px] text-[#FF6B00]/40">→</div>
      {/* Resulting tazos */}
      <div className="flex items-center -space-x-3">
        {tazos.length > 0 ? tazos.map((t: any, i: number) => (
          <div key={t.id || i} className="w-12 h-12 rounded-full border-2 border-white/5 bg-transparent overflow-hidden flex-shrink-0 relative"
            style={{ zIndex: 4 - i }}>
            {t.imageUrl ? (
              <TazoDiscImage src={t.imageUrl} alt={t.displayName || t.name} size="100%" borderWidth={0}
                franchiseSlug={t.franchiseSlug || t.franchise?.slug} finish={t.finish} creatureVariant={t.creatureVariant} shinyImageUrl={t.shinyImageUrl}
                className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[7px] font-black text-[#1a1a1a]/15">?</div>
            )}
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
              style={{ background: { common: "#9CA3AF", uncommon: "#22C55E", rare: "#3B82F6", "ultra-rare": "#A855F7", legendary: "#F59E0B" }[t.rarity] || "#9CA3AF" }} />
          </div>
        )) : (
          <>
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#FF6B00]/20 bg-[#FF6B00]/5 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-[#FF6B00]/40" />
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#FF6B00]/15 bg-[#FF6B00]/5 flex items-center justify-center" />
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#FF6B00]/10 bg-[#FF6B00]/5 flex items-center justify-center" />
          </>
        )}
      </div>
    </div>
  )
}

function DeckPreview({ tazos }: { tazos: any[] }) {
  const displayTazos = tazos.length >= 3 ? tazos.slice(0, 3) : [
    { id: "p1", name: "ATK", color: "#E3350D", label: "ATK", value: 78 },
    { id: "p2", name: "DEF", color: "#3B82F6", label: "DEF", value: 65 },
    { id: "p3", name: "SPD", color: "#22C55E", label: "SPD", value: 82 },
  ]
  return (
    <div className="flex items-center gap-6 py-3">
      {/* Tazo cards in a row */}
      <div className="flex items-center -space-x-2">
        {displayTazos.map((t: any, i: number) => (
          <div key={t.id || i} className="w-14 h-14 rounded-full border-2 border-white/5 bg-transparent overflow-hidden flex-shrink-0"
            style={{ zIndex: 3 - i }}>
            {t.imageUrl ? (
              <TazoDiscImage src={t.imageUrl} alt={t.displayName || t.name} size="100%" borderWidth={0}
                franchiseSlug={t.franchiseSlug || t.franchise?.slug} finish={t.finish} creatureVariant={t.creatureVariant} shinyImageUrl={t.shinyImageUrl}
                className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: (t.color || "#3B4CCA") + "10" }}>
                <span className="text-[10px] font-black" style={{ color: t.color || "#3B4CCA" }}>{t.label || "?"}</span>
              </div>
            )}
          </div>
        ))}
        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 5 - displayTazos.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="w-14 h-14 rounded-full border-2 border-dashed border-[#3B4CCA]/15 bg-[#3B4CCA]/5 flex items-center justify-center flex-shrink-0"
            style={{ zIndex: 1 }}>
            <span className="text-[20px] text-[#3B4CCA]/10">+</span>
          </div>
        ))}
      </div>
      {/* Mini stat bars */}
      <div className="flex-1 space-y-1 min-w-[120px]">
        {[
          { label: "ATK", value: 78, color: "#E3350D" },
          { label: "DEF", value: 64, color: "#3B82F6" },
          { label: "CTRL", value: 71, color: "#FFCC00" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="text-[7px] font-black text-[#1a1a1a]/25 w-8">{s.label}</span>
            <div className="flex-1 h-2 bg-[#1a1a1a]/5 rounded-full overflow-hidden border border-[#1a1a1a]/10">
              <div className="h-full rounded-full transition-all" style={{ width: `${s.value}%`, background: s.color }} />
            </div>
            <span className="text-[7px] font-black text-[#1a1a1a]/40 w-5 text-right">{s.value}</span>
          </div>
        ))}
        <div className="text-[6px] font-bold text-[#1a1a1a]/20 text-right pt-0.5">+6 more stats</div>
      </div>
    </div>
  )
}

function ArenaPreview({ tazos }: { tazos: any[] }) {
  return (
    <div className="flex items-center justify-center gap-6 py-3 w-full">
      {/* Mini arena diagram */}
      <div className="relative w-40 h-32 border-2 border-[#E3350D]/20 rounded-full bg-[#E3350D]/3 flex items-center justify-center overflow-hidden"
        style={{ boxShadow: "inset 0 0 20px rgba(229,53,13,0.05)" }}>
        {/* Outer ring (arena boundary) */}
        <div className="absolute inset-2 border border-dashed border-[#E3350D]/10 rounded-full" />
        <div className="absolute inset-6 border border-dashed border-[#E3350D]/8 rounded-full" />
        {/* Center circle */}
        <div className="w-10 h-10 rounded-full border-2 border-[#E3350D]/40 bg-[#E3350D]/5 flex items-center justify-center">
          <span className="text-[7px] font-black text-[#E3350D]/40 uppercase">CIRCLE</span>
        </div>
        {/* Staked tazos */}
        <div className="absolute top-[35%] left-[25%] w-7 h-7 rounded-full border-2 border-[#29ADFF]/50 bg-[#29ADFF]/5 flex items-center justify-center">
          <Swords className="w-3 h-3 text-[#29ADFF]/60" />
        </div>
        <div className="absolute top-[35%] right-[25%] w-7 h-7 rounded-full border-2 border-[#FF004D]/50 bg-[#FF004D]/5 flex items-center justify-center">
          <Shield className="w-3 h-3 text-[#FF004D]/60" />
        </div>
        {/* Crosshair */}
        <div className="absolute bottom-[15%] left-[45%] w-4 h-4 flex items-center justify-center">
          <div className="w-4 h-4 relative">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-[#FFCC00]" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#FFCC00]" />
          </div>
        </div>
        {/* Tazo in flight */}
        {tazos.length > 0 && tazos[0].imageUrl ? (
          <div className="absolute top-[10%] left-[50%] w-6 h-6 rounded-full overflow-hidden border border-[#FFCC00]/40 -translate-x-3 animate-bounce"
            style={{ boxShadow: "0 0 8px rgba(255,204,0,0.3)", background: "transparent" }}>
            <TazoDiscImage src={tazos[0].imageUrl} alt="" size="100%" borderWidth={0}
              franchiseSlug={tazos[0].franchiseSlug || tazos[0].franchise?.slug}
              finish={tazos[0].finish} creatureVariant={tazos[0].creatureVariant} shinyImageUrl={tazos[0].shinyImageUrl}
              className="w-full h-full" />
          </div>
        ) : (
          <div className="absolute top-[10%] left-[50%] w-6 h-6 rounded-full bg-[#FFCC00]/20 border border-[#FFCC00]/30 -translate-x-3 flex items-center justify-center animate-pulse">
            <Zap className="w-3 h-3 text-[#FFCC00]" />
          </div>
        )}
      </div>
      {/* Phase indicators */}
      <div className="flex flex-col gap-1.5">
        {[
          { label: "AIM", Icon: Crosshair, color: "#FFCC00" },
          { label: "CHARGE", Icon: Zap, color: "#FF8800" },
          { label: "SLAM", Icon: Zap, color: "#E3350D" },
        ].map(p => (
          <div key={p.label} className="flex items-center gap-1.5 px-2 py-1 rounded border"
            style={{ borderColor: p.color + "25", background: p.color + "08" }}>
            <p.Icon className="w-3 h-3" style={{ color: p.color }} />
            <span className="text-[8px] font-black text-[#1a1a1a]/40 uppercase">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuestsPreview() {
  return (
    <div className="flex items-center gap-3 py-2 flex-wrap">
      {/* Achievement badges */}
      {[
        { tier: "Bronze", color: "#CD7F32" },
        { tier: "Silver", color: "#C0C0C0" },
        { tier: "Gold", color: "#FFD700" },
        { tier: "Platinum", color: "#A855F7" },
      ].map(a => (
        <div key={a.tier} className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2"
          style={{ borderColor: a.color + "30", background: a.color + "08", boxShadow: `0 2px 8px ${a.color}15` }}>
          {a.tier === "Platinum" ? (
            <Gem className="w-5 h-5" style={{ color: a.color }} />
          ) : (
            <Medal className="w-5 h-5" style={{ color: a.color }} />
          )}
          <span className="text-[8px] font-black uppercase" style={{ color: a.color }}>{a.tier}</span>
        </div>
      ))}
      {/* Arrow */}
      <div className="text-lg text-[#22C55E]/30 font-black">→</div>
      {/* Reward */}
      <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 border-[#22C55E]/30 bg-[#22C55E]/05">
        <Coins className="w-5 h-5 text-[#22C55E]" />
        <span className="text-[7px] font-black text-[#22C55E] uppercase">+Credits</span>
      </div>
      {/* Quest counter */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[28px] font-black text-[#1a1a1a]/10 leading-none">17</span>
        <span className="text-[7px] font-bold text-[#1a1a1a]/25 uppercase">Quests</span>
      </div>
      <div className="flex flex-col items-center gap-1 ml-1">
        <span className="text-[28px] font-black text-[#1a1a1a]/10 leading-none">18</span>
        <span className="text-[7px] font-bold text-[#1a1a1a]/25 uppercase">Achievements</span>
      </div>
    </div>
  )
}

// ── Preview Slider (home page) ──

// ══════════════════════════════════════════════════════════
// PAGE CONTENT COMPONENTS
// ── Home Hero (Launcher Redesign v3) ──

const RARITY_GRADIENTS: Record<string, { bg: string; text: string }> = {
  common: { bg: "#9CA3AF15", text: "#9CA3AF" },
  uncommon: { bg: "#22C55E15", text: "#22C55E" },
  rare: { bg: "#3B82F615", text: "#3B82F6" },
  "ultra-rare": { bg: "#A855F715", text: "#A855F7" },
  ultra: { bg: "#A855F715", text: "#A855F7" },
  legendary: { bg: "#F59E0B15", text: "#F59E0B" },
}

function FeaturedTazoCard({ tazo, featured }: { tazo: any; featured?: boolean }) {
  const [open, setOpen] = useState(false)
  const rarityKey = (tazo.rarity || "common").replace("ultra-rare", "ultra")
  const rarityColor = RARITY_GRADIENTS[rarityKey] || RARITY_GRADIENTS.common

  return (
    <>
      <button onClick={() => setOpen(true)}
        className={`rounded-full overflow-hidden border-2 border-white/5 bg-transparent transition-all duration-200 hover:scale-110 hover:-translate-y-1 hover:shadow-[5px_5px_0px_#1a1a1a30] ${
          featured ? "w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] shadow-[4px_4px_0px_#1a1a1a20]" : "w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] shadow-[3px_3px_0px_#1a1a1a15]"
        }`}>
        {tazo.imageUrl ? (
          <TazoDiscImage
            src={tazo.imageUrl} alt={tazo.displayName || tazo.name || ""} size="100%" borderWidth={0}
            franchiseSlug={typeof tazo.franchise === "string" ? tazo.franchise : tazo.franchiseSlug}
            finish={tazo.finish} creatureVariant={tazo.creatureVariant} shinyImageUrl={tazo.shinyImageUrl} lazy />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]/5 text-[8px] font-black text-[#1a1a1a]/15">?</div>
        )}
      </button>
      {/* Detail modal */}
      {open && (
        <TazoDetailModal
          tazo={tazo as any}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

function HomeHero({ user, onPlay }: { user: any; onPlay: () => void }) {
  const [hoverPlay, setHoverPlay] = useState(false)
  const [pressPlay, setPressPlay] = useState(false)
  const [featuredTazos, setFeaturedTazos] = useState<any[]>([])
  const [realTazoCount, setRealTazoCount] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/tazos?limit=16&_t=${Date.now()}`)
      .then(r => r.json())
      .then(d => setFeaturedTazos((d.tazos || []).sort(() => Math.random() - 0.5)))
      .catch(() => {})
    // Fetch real tazo count for tooltip
    fetch("/api/stats")
      .then(r => r.json())
      .then(d => setRealTazoCount(d.totalTazos || null))
      .catch(() => {})
  }, [])

  const displayTazos = featuredTazos.slice(0, 8)

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 flex flex-col justify-center py-6 sm:py-8"
      style={{ minHeight: "calc(100vh - 76px - 60px)" }}>

      {/* ═══ MAIN HORIZONTAL SPLIT ═══ */}
      <div className="flex flex-col md:flex-row items-center md:items-start md:items-center gap-4 sm:gap-5 md:gap-8 lg:gap-12">

        {/* ── LEFT: Branding + Description + CTAs ── */}
        <div className="flex flex-col items-center md:items-start gap-3 sm:gap-4 shrink-0 md:w-[320px] lg:w-[380px] relative overflow-hidden">
          {/* Glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              background: "radial-gradient(circle at 50% 40%, rgba(255,204,0,0.18) 0%, rgba(255,204,0,0.05) 40%, transparent 70%)",
              width: "200%", height: "200%", top: "-50%", left: "-50%"
            }} />

          {/* Logo + Title */}
          <div className="relative flex flex-col items-center md:items-start gap-2">
            <img src="/logo/logo-icon-black.webp" alt="TTG"
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 drop-shadow-[6px_6px_0_rgba(26,26,26,0.3)]" />
            <h1 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-black text-[#1a1a1a] uppercase tracking-[0.04em] leading-none text-center md:text-left">
              <span className="text-[#E3350D]">Trading</span>{" "}
              <span className="text-[#FFCC00]">Tazos</span>{" "}
              <span className="text-[#00A1E9]">Game</span>
            </h1>
            <p className="text-lg sm:text-xl font-black text-[#1a1a1a]/60 uppercase tracking-[0.05em]">
              {realTazoCount ? `${realTazoCount} Tazos Available` : "Collect. Trade. Battle."}
            </p>
          </div>

          {/* Description */}
          <p className="relative text-xs sm:text-sm font-bold text-[#1a1a1a]/50 leading-relaxed max-w-xs text-center md:text-left">
            Open digital bags, build your 20-tazo deck and enter a physics-based arena where every throw counts.
          </p>

          {/* CTA Buttons — single primary action */}
          <div className="relative flex flex-wrap gap-2 w-full justify-center md:justify-start">
            <button onClick={onPlay}
              onMouseEnter={() => setHoverPlay(true)} onMouseLeave={() => { setHoverPlay(false); setPressPlay(false) }}
              onMouseDown={() => setPressPlay(true)} onMouseUp={() => setPressPlay(false)}
              className="relative select-none"
              style={{ transform: pressPlay ? "translate(2px,2px)" : hoverPlay ? "translate(-1px,-1px)" : "none", transition: "transform 0.1s" }}>
              <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-[#1a1a1a]" />
              <div className="relative px-8 sm:px-12 py-3 sm:py-4 border-3 border-[#1a1a1a] bg-[#FFCC00] flex items-center gap-2"
                style={{ background: hoverPlay ? "linear-gradient(180deg, #FFE566 0%, #FFCC00 100%)" : "#FFCC00" }}>
                <span className="text-base sm:text-lg font-black text-[#1a1a1a] uppercase tracking-[0.08em]">PLAY NOW</span>
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#1a1a1a]" />
              </div>
            </button>
          </div>

          {/* Platform chips */}
          <div className="relative flex flex-wrap gap-1.5 justify-center md:justify-start">
            {[
              { number: "349", label: "Tazos", color: "#FFCC00" },
              { number: "3", label: "Series", color: "#E3350D" },
              { number: "9", label: "Stats", color: "#00A1E9" },
              { number: "Free", label: "Play", color: "#22C55E" },
            ].map(s => {
              const isTazos = s.label === "Tazos"
              const tooltip = isTazos && realTazoCount ? `${realTazoCount} released of ${s.number} planned` : undefined
              return (
              <span key={s.label} title={tooltip}
                className={`inline-flex px-2 py-1 text-[8px] font-black uppercase border-2 border-[#1a1a1a] bg-white ${isTazos ? "cursor-help" : ""}`}
                style={{ boxShadow: `2px 2px 0 ${s.color}30` }}>
                <span style={{ color: s.color }}>{s.number}</span>
                {isTazos && realTazoCount && (
                  <span className="text-[6px] text-[#1a1a1a]/30 ml-0.5 self-end mb-[1px]">{realTazoCount}</span>
                )}
                <span className="ml-1 text-[#1a1a1a]/40">{s.label}</span>
              </span>
            )})}
          </div>
        </div>

        {/* ── DIVIDER ── */}
        <div className="hidden md:block w-px h-48 lg:h-56 bg-[#1a1a1a]/8 shrink-0 self-center" />

        {/* ── RIGHT: Launcher Panel ── */}
        <div className="flex-1 flex flex-col gap-4 sm:gap-5 w-full max-w-[520px] mx-auto md:mx-0">

          {/* PLAYER LAUNCHER card */}
          <div className="border-3 border-[#1a1a1a] bg-white overflow-hidden" style={{ boxShadow: "5px 5px 0 #1a1a1a" }}>
            {/* Header */}
            <div className="px-5 py-3 flex items-center gap-2"
              style={{ background: "repeating-linear-gradient(-45deg, #FFCC0010, #FFCC0010 4px, transparent 4px, transparent 8px)", borderBottom: "3px solid #1a1a1a" }}>
              <Swords className="w-4 h-4 text-[#1a1a1a]" />
              <span className="text-[10px] font-black text-[#1a1a1a] uppercase tracking-[0.2em]">Player Launcher</span>
              <span className="ml-auto text-[8px] font-black text-[#22C55E] uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> {user ? "Online" : "Offline"}
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* Status */}
              <div>
                <p className="text-[10px] font-black text-[#1a1a1a]/30 uppercase tracking-[0.15em]">{user ? "Ready for battle" : "Guest access"}</p>
                <p className="text-xs font-bold text-[#1a1a1a]/40">Active mode: <span className="text-[#E3350D]">Practice Arena</span></p>
              </div>

              {/* Quick Actions — 2×2 grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: PackageOpen, label: "Open Bags", sub: "Get tazos", color: "#FF6B00", href: "/app/shop" },
                  { icon: Swords, label: "Practice", sub: "AI battles", color: "#E3350D", href: "/app/battle" },
                  { icon: Disc3, label: "Collection", sub: "All series", color: "#00A1E9", href: "/app/collection" },
                  { icon: Medal, label: "Ranked", sub: "Leaderboard", color: "#22C55E", href: "/?page=leaderboard" },
                ].map(({ icon: Icon, label, sub, color, href }) => (
                  <Link key={label} href={href}
                    className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 border-2 border-[#1a1a1a]/10 hover:border-[#1a1a1a]/30 bg-white hover:bg-[#FFF9E6] transition-all group/qk">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border-2 border-[#1a1a1a]/15 bg-white group-hover/qk:scale-110 transition-transform">
                      <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" style={{ color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-[11px] font-black text-[#1a1a1a] uppercase leading-none">{label}</p>
                      <p className="text-[8px] font-bold text-[#1a1a1a]/25 uppercase">{sub}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ Featured Tazos Vitrine ═══ */}
          {displayTazos.length > 0 && (
            <div className="border-3 border-[#1a1a1a] bg-white overflow-hidden" style={{ boxShadow: "4px 4px 0 #1a1a1a" }}>
              <div className="px-4 py-2.5 flex items-center gap-2"
                style={{ background: "repeating-linear-gradient(-45deg, #E3350D08, #E3350D08 4px, transparent 4px, transparent 8px)", borderBottom: "3px solid #1a1a1a" }}>
                <Crown className="w-4 h-4 text-[#F59E0B]" />
                <span className="text-[10px] font-black text-[#1a1a1a] uppercase tracking-[0.2em]">Featured Tazos</span>
                <span className="ml-auto text-[8px] font-black text-[#1a1a1a]/20 uppercase">{displayTazos.length} of {realTazoCount ?? 30}</span>
              </div>
              <div className="p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                  {displayTazos.map((t) => (
                    <FeaturedTazoCard key={t.id} tazo={t} />
                  ))}
                </div>
                <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                  {["common","uncommon","rare","ultra","legendary"].map(r => (
                    <span key={r} className="text-[7px] font-black px-1.5 py-0.5 uppercase border"
                      style={{ color: (RARITY_GRADIENTS[r]||RARITY_GRADIENTS.common).text, borderColor: (RARITY_GRADIENTS[r]||RARITY_GRADIENTS.common).text+"30", background: (RARITY_GRADIENTS[r]||RARITY_GRADIENTS.common).bg }}>{r}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Status line */}
          <p className="text-[8px] font-black text-[#1a1a1a]/15 uppercase tracking-[0.15em] text-center">
            {user ? `${realTazoCount ?? 30} Tazos Available · Free to Play · Browser + Desktop` : "No download · No signup needed · Play free"}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Home Extra Sections (Launcher v3) ──

function HowItWorksHome() {
  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-4 pb-8">
      <div className="text-center mb-5">
        <h2 className="text-lg sm:text-xl font-black text-[#1a1a1a] uppercase tracking-[0.06em]">How It Works</h2>
        <p className="text-[10px] font-bold text-[#1a1a1a]/30 uppercase tracking-wider">Three steps to become a collector</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { step: "1", icon: PackageOpen, title: "Open Bags", desc: "Get random tazos from 3 different series. Start with 10 free bags and earn more by winning battles.", color: "#FF6B00" },
          { step: "2", icon: Layers, title: "Build Your Deck", desc: "Choose 5 tazos with 9 combat stats each. Balance attack, defense, and speed for the best results.", color: "#3B4CCA" },
          { step: "3", icon: Swords, title: "Enter the Arena", desc: "Aim, charge, and slam your tazos from above. Flip opponent discs to capture them — first to 5 points wins!", color: "#E3350D" },
        ].map(({ step, icon: Icon, title, desc, color }) => (
          <div key={step} className="border-3 border-[#1a1a1a] bg-white p-4 sm:p-5 text-center hover:-translate-y-1 hover:shadow-[5px_5px_0px_#1a1a1a] transition-all"
            style={{ boxShadow: "3px 3px 0 #1a1a1a" }}>
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 border-3 border-[#1a1a1a] mb-3"
              style={{ background: color, boxShadow: "2px 2px 0 #1a1a1a" }}>
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="text-xs font-black text-[#1a1a1a]/15">STEP {step}</span>
            </div>
            <h3 className="text-sm font-black text-[#1a1a1a] uppercase mb-1.5">{title}</h3>
            <p className="text-[10px] sm:text-[11px] font-bold text-[#1a1a1a]/45 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function BattlePreviewHome() {
  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-2 pb-10">
      <div className="border-3 border-[#1a1a1a] bg-white overflow-hidden" style={{ boxShadow: "5px 5px 0 #1a1a1a" }}>
        <div className="px-5 py-3 border-b-3 border-[#1a1a1a] flex items-center gap-2"
          style={{ background: "repeating-linear-gradient(-45deg, #E3350D10, #E3350D10 4px, transparent 4px, transparent 8px)" }}>
          <Crosshair className="w-4 h-4 text-[#E3350D]" />
          <h2 className="text-sm font-black text-[#1a1a1a] uppercase tracking-[0.06em]">Physics-Based Tazo Battles</h2>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-xs sm:text-sm font-bold text-[#1a1a1a]/50 leading-relaxed mb-4">
            Every launch uses impact, spin, bounce and flip mechanics. Aim carefully, control your power and turn each throw into a winning move.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {[
              { icon: Crosshair, label: "Aim", desc: "Lock your target area", color: "#FFCC00" },
              { icon: Zap, label: "Charge", desc: "Time your power bar", color: "#FF6B00" },
              { icon: TrendingUp, label: "Impact", desc: "Collisions & bounces", color: "#E3350D" },
              { icon: Crown, label: "Flip", desc: "Capture rival tazos", color: "#F59E0B" },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="text-center p-3 sm:p-4 border-2 border-[#1a1a1a]/10 hover:border-[#1a1a1a]/25 hover:bg-[#FFF9E6] transition-all">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2" style={{ color }} />
                <h4 className="text-[10px] sm:text-xs font-black text-[#1a1a1a] uppercase mb-0.5">{label}</h4>
                <p className="text-[8px] sm:text-[9px] font-bold text-[#1a1a1a]/35">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SeriesPreviewHome({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const [seriesTazos, setSeriesTazos] = useState<Record<string, any[]>>({})
  const [stats, setStats] = useState<{totalTazos: number; byFranchise: Record<string,number>} | null>(null)

  useEffect(() => {
    // Fetch stats for accurate counts
    fetch("/api/stats")
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
    // Fetch 4 tazos per franchise for preview
    const franchises = ["minimon", "dracobell", "cybermon"]
    Promise.all(
      franchises.map(f =>
        fetch(`/api/tazos?limit=4&franchise=${f}&publishStatus=published`)
          .then(r => r.json())
          .then(d => ({ franchise: f, tazos: d.tazos || [] }))
          .catch(() => ({ franchise: f, tazos: [] }))
      )
    ).then(results => {
      const byFranchise: Record<string, any[]> = {}
      for (const r of results) {
        byFranchise[r.franchise] = r.tazos
      }
      setSeriesTazos(byFranchise)
    }).catch(() => {})
  }, [])

  const series = [
    { name: "Minimon", slug: "minimon", count: stats?.byFranchise?.Minimon ?? 10, planned: FRANCHISE_BY_SLUG.minimon.total, year: 2000, color: "#FFCC00", desc: "61 creature companions with balanced combat stats — the original collection." },
    { name: "Dracobell", slug: "dracobell", count: stats?.byFranchise?.Dracobell ?? 10, planned: FRANCHISE_BY_SLUG.dracobell.total, year: 1995, color: "#FF6B00", desc: "128 martial arts warriors across 6 categories. Home to the rarest variants." },
    { name: "Cybermon", slug: "cybermon", count: stats?.byFranchise?.Cybermon ?? 10, planned: FRANCHISE_BY_SLUG.cybermon.total, year: 2000, color: "#00B4D8", desc: "160 digital companions in cap format. Highest precision stats." },
  ]

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-2 pb-10">
      <div className="text-center mb-5">
        <h2 className="text-lg sm:text-xl font-black text-[#1a1a1a] uppercase tracking-[0.06em]">3 Series · {stats?.totalTazos ?? 30} Tazos</h2>
        <p className="text-[10px] font-bold text-[#1a1a1a]/30 uppercase tracking-wider">Classic snack toy collections</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
        {series.map(s => {
          const tazos = seriesTazos[s.slug] || []
          return (
          <button key={s.slug} onClick={() => onNavigate(`collections-${s.slug}` as PageId)}
            className="text-left border-3 border-[#1a1a1a] bg-white overflow-hidden hover:-translate-y-1 hover:shadow-[5px_5px_0px_#1a1a1a] transition-all group"
            style={{ boxShadow: "3px 3px 0 #1a1a1a" }}>
            {/* Color strip */}
            <div className="h-1.5" style={{ background: s.color }} />
            <div className="p-3 sm:p-4">
              {/* Tazo grid */}
              <div className="flex items-center justify-center gap-1.5 mb-3">
                {tazos.slice(0, 3).map((t, i) => (
                  <div key={t.id || i} className="w-11 h-11 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-[#1a1a1a]/30 bg-white group-hover:border-[#1a1a1a]/60 transition-colors" style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }}>
                    {t.imageUrl ? (
                      <TazoDiscImage src={t.imageUrl} alt={t.name || ''} size="100%" borderWidth={0}
                        franchiseSlug={t.franchiseSlug || (typeof t.franchise === "string" ? t.franchise : "minimon")}
                        finish={t.finish} creatureVariant={t.creatureVariant} shinyImageUrl={t.shinyImageUrl} lazy />
                    ) : null}
                  </div>
                ))}
              </div>
              <h3 className="text-sm font-black text-[#1a1a1a] uppercase">{s.name}</h3>
              <p className="text-[9px] font-bold text-[#1a1a1a]/35 mt-0.5">{s.count} of {s.planned} tazos · {s.year}</p>
              <p className="text-[10px] font-bold text-[#1a1a1a]/45 mt-1.5 leading-relaxed">{s.desc}</p>
              <p className="mt-2 text-[10px] font-black text-[#E3350D] uppercase group-hover:underline">View Series →</p>
            </div>
          </button>
        )})}
      </div>
    </div>
  )
}

function DownloadStripHome({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  return (
    <div className="border-t-[5px] border-[#1a1a1a] bg-[#1a1a1a]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em]">Available on:</span>
          <PlatformBadge icon={Globe} label="Browser" />
          <PlatformBadge icon={Monitor} label="Windows" />
          <PlatformBadge icon={Apple} label="macOS" />
          <PlatformBadge icon={Terminal} label="Linux" />
          <button onClick={() => onNavigate("download")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black text-[#1a1a1a] bg-[#FFCC00] uppercase tracking-wider border-2 border-white/20 hover:bg-[#FFE566] transition-colors">
            <Download className="w-3 h-3" /> Download Launcher
          </button>
        </div>
      </div>
    </div>
  )
}

function HowToPlayContent() {
  const [previewTazos, setPreviewTazos] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/tazos?limit=12")
      .then(r => r.json())
      .then(d => {
        const shuffled = (d.tazos || []).sort(() => Math.random() - 0.5)
        setPreviewTazos(shuffled.slice(0, 8))
      })
      .catch(() => {})
  }, [])

  const bagPreview = previewTazos.slice(0, 4)
  const deckPreview = previewTazos.slice(4, 7)
  const arenaPreview = previewTazos.slice(0, 3)

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <SectionCard step={1} color="#FFCC00" bgColor="#FFCC00" title="Create Your Account"
        preview={<SignUpPreview />}>
        <p>Sign up for free — you&apos;ll receive <strong>10 free bags</strong> with surprise tazos inside. Open them in the Shop to start your collection. No credit card required — the game is completely free to play.</p>
      </SectionCard>

      <SectionCard step={2} color="#FF6B00" bgColor="#FF6B00" title="Open Bags & Collect Tazos"
        preview={<BagPreview tazos={bagPreview} />}>
        <p>Each bag contains a random tazo from the collection:</p>
        <ul className="list-disc pl-5 space-y-0.5">
          <li><strong>Standard Bags</strong> — Common and uncommon tazos</li>
          <li><strong>Premium Bags</strong> — Better odds for rare tazos</li>
          <li><strong>Mega Bags</strong> — Highest chance for ultra rare and legendary</li>
        </ul>
        <p>Buy more bags with credits earned by winning battles and completing quests.</p>
      </SectionCard>

      <SectionCard step={3} color="#3B4CCA" bgColor="#3B4CCA" title="Build Your Battle Deck"
        preview={<DeckPreview tazos={deckPreview} />}>
        <p>Choose <strong>5 tazos</strong> to form your battle deck. Each tazo has <strong>9 combat stats</strong>:</p>
        <ul className="list-disc pl-5 space-y-0.5">
          <li><strong>Attack</strong> — Impact power on opponent tazos</li>
          <li><strong>Defense</strong> — Resistance to being flipped</li>
          <li><strong>Resistance</strong> — Stays in place under pressure</li>
          <li><strong>Weight</strong> — Mass for pushing power</li>
          <li><strong>Stability</strong> — Prevents ring-outs and knockbacks</li>
          <li><strong>Spin</strong> — Maintains momentum after landing</li>
          <li><strong>Control</strong> — Reduces throw deviation</li>
          <li><strong>Bounce</strong> — Improves wall rebounds</li>
          <li><strong>Precision</strong> — Better aim accuracy</li>
        </ul>
        <p>Balance high-attack tazos with defensive ones for the best results.</p>
      </SectionCard>

      <SectionCard step={4} color="#E3350D" bgColor="#E3350D" title="Enter the Battle Arena"
        preview={<ArenaPreview tazos={arenaPreview} />}>
        <p>Each turn uses the <strong>Vertical Slam</strong> system with 3 phases:</p>
        <ul className="list-disc pl-5 space-y-0.5">
          <li><strong>Aim</strong> — Lock your crosshair on the target area where you want your tazo to land</li>
          <li><strong>Charge</strong> — Time your power bar for maximum slam force</li>
          <li><strong>Tilt</strong> — Angle your throw for precise landing control</li>
        </ul>
        <p>Your tazo drops from above, slamming into the arena. Hit hard enough and you&apos;ll <strong>flip</strong> face-down opponent tazos — capturing them for points. First to <strong>5 points</strong> wins!</p>
      </SectionCard>

      <SectionCard step={5} color="#22C55E" bgColor="#22C55E" title="Complete Quests & Climb Ranks"
        preview={<QuestsPreview />}>
        <p>Earn credits and reputation by completing <strong>17 quests</strong> across 4 categories (Beginner, Daily, Weekly, Special). Unlock <strong>18 achievements</strong> with Bronze → Platinum tiers. Rise through the leaderboard and become the ultimate collector.</p>
      </SectionCard>
    </div>
  )
}

// ── Collections ──

const { minimon: fMinimon, dracobell: fDracobell, cybermon: fCybermon } = FRANCHISE_BY_SLUG

const COLLECTION_DATA = [
  {
    name: "Minimon", slug: "minimon", count: fMinimon.count, total: fMinimon.total, year: 2000, origin: "Matutano", color: "#FFCC00",
    categories: ["Tazos"],
    desc: "The original collection that started it all. 61 creature companions with balanced combat stats — perfect for learning the battle system.",
    highlights: ["Balanced stat distribution", "Classic creature designs", `${fMinimon.count} of ${fMinimon.total} tazos available`, "Original 2000 Spanish series"]
  },
  {
    name: "Dracobell", slug: "dracobell", count: fDracobell.count, total: fDracobell.total, year: 1995, origin: "Matutano", color: "#FF6B00",
    categories: ["Tazos", "Megatazos", "Supertazos Octogonales", "Supertazos Voladores", "Mastertazos", "Holo 3D"],
    desc: "The most diverse collection with 128 martial arts warriors across 6 categories. Home to the rarest Holo 3D and Mastertazo variants.",
    highlights: ["6 unique categories", "Highest average attack stats", `${fDracobell.count} of ${fDracobell.total} tazos available`, "Rare Holo 3D variants"]
  },
  {
    name: "Cybermon", slug: "cybermon", count: fCybermon.count, total: fCybermon.total, year: 2000, origin: "Magic Box", color: "#00B4D8",
    categories: ["Caps"],
    desc: "The largest collection with 160 digital companions in cap format. High precision stats and extensive evolution trees.",
    highlights: ["Complex evolution trees", "Highest precision stats", `${fCybermon.count} of ${fCybermon.total} tazos available`, "Original Magic Box 2000 series"]
  },
]

function CollectionsContent({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const [showcaseTazos, setShowcaseTazos] = useState<Record<string, any[]>>({})

  useEffect(() => {
    // Fetch tazos for all 3 franchises to populate panels
    Promise.all([
      fetch("/api/tazos?franchise=cybermon&publishStatus=published&limit=4").then(r => r.json()),
      fetch("/api/tazos?franchise=dracobell&publishStatus=published&limit=4").then(r => r.json()),
      fetch("/api/tazos?franchise=minimon&publishStatus=published&limit=4").then(r => r.json()),
    ])
      .then(results => {
        const byFranchise: Record<string, any[]> = {}
        for (const d of results) {
          for (const t of (d.tazos || [])) {
            const f = t.franchise || t.franchiseSlug || "minimon"
            if (!byFranchise[f]) byFranchise[f] = []
            if (byFranchise[f].length < 4) byFranchise[f].push(t)
          }
        }
        setShowcaseTazos(byFranchise)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      <p className="text-xs font-bold text-[#1a1a1a]/50 uppercase tracking-wider">
        3 Franchises · 349 Tazos · Classic snack toy collections
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {COLLECTION_DATA.map(c => {
          const backArtUrl = `/tazos-artgen/backs/${c.slug}-back.png`
          const franchiseTazos = showcaseTazos[c.slug] || []
          return (
          <button key={c.slug} onClick={() => onNavigate(`collections-${c.slug}` as PageId)}
            className="text-left border-2 border-[#1a1a1a] bg-white overflow-hidden hover:bg-[#FFF9E6] transition-colors group"
            style={{ boxShadow: "4px 4px 0 #1a1a1a" }}>
            {/* Franchise color strip */}
            <div className="h-2" style={{ background: c.color }} />
            
            {/* Tazo + Back art showcase */}
            <div className="p-3 grid grid-cols-2 gap-2 bg-[#fffef0] border-b-2 border-[#1a1a1a]/10">
              {/* Back art of franchise */}
              <div className="rounded-full overflow-hidden aspect-square flex items-center justify-center bg-white border-2 border-[#1a1a1a]/10 shadow-[1px_1px_0px_#1a1a1a10]">
                <img 
                  src={backArtUrl} 
                  alt={`${c.name} back art`}
                  className="w-full h-full object-cover"
                  style={{ borderRadius: "50%" }}
                  draggable={false}
                />
              </div>
              {/* Sample front tazo — or more backs if no tazos loaded */}
              <div className="rounded-full overflow-hidden aspect-square flex items-center justify-center bg-white shadow-[1px_1px_0px_#1a1a1a10]">
                {franchiseTazos.length > 0 ? (
                  <div className="relative w-full h-full">
                    {franchiseTazos.slice(0, 3).map((t: any, i: number) => (
                      t.imageUrl ? (
                        <div
                          key={t.id}
                          className="absolute"
                          style={{
                            inset: `${i * 3}%`,
                            width: `${100 - i * 6}%`,
                            height: `${100 - i * 6}%`,
                            transform: `rotate(${i * 15 - 15}deg)`,
                            transformOrigin: "center center",
                            zIndex: franchiseTazos.length - i,
                            opacity: i === 0 ? 1 : 0.55,
                          }}
                        >
                          <TazoDiscImage
                            src={t.imageUrl}
                            alt={t.displayName || t.name || ""}
                            size="100%"
                            borderWidth={0}
                            franchiseSlug={typeof t.franchise === "string" ? t.franchise : t.franchiseSlug}
                            finish={t.finish}
                            creatureVariant={t.creatureVariant}
                            shinyImageUrl={t.shinyImageUrl}
                          />
                        </div>
                      ) : null
                    ))}
                  </div>
                ) : (
                  <span className="text-[7px] font-black text-[#1a1a1a]/15 uppercase">FRONT</span>
                )}
              </div>
            </div>

            {/* Info section */}
            <div className="p-5">
              <h3 className="text-lg font-black text-[#1a1a1a] uppercase">{c.name}</h3>
              <p className="text-[10px] font-black text-[#1a1a1a]/50 mt-0.5">{c.count} of {c.total} tazos · {c.year} · {c.origin}</p>
              <p className="text-[11px] font-bold text-[#1a1a1a]/60 mt-2 leading-relaxed">{c.desc}</p>
              <div className="flex flex-wrap gap-1 mt-3">
                {c.categories.map(cat => (
                  <span key={cat} className="text-[8px] font-black text-white px-2 py-0.5 uppercase"
                    style={{ background: c.color }}>{cat}</span>
                ))}
              </div>
              <ul className="mt-3 space-y-0.5">
                {c.highlights.map((h, i) => (
                  <li key={i} className="text-[10px] font-bold text-[#1a1a1a]/50 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: c.color }} /> {h}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[10px] font-black text-[#E3350D] uppercase group-hover:underline">View Collection →</p>
            </div>
          </button>
        )})}
      </div>
    </div>
  )
}

// ── Tazo Catalog ──

function TazosContent() {
  const [tazos, setTazos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [franchiseFilter, setFranchiseFilter] = useState("all")
  const [selectedTazo, setSelectedTazo] = useState<any>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const fetchContent = useCallback(async () => {
    fetch(`/api/tazos?limit=60&_t=${Date.now()}`).then(r => r.json()).then(d => {
      setTazos(d.tazos || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  useVisibilityRefresh(fetchContent)

  const filtered = tazos.filter(t =>
    (franchiseFilter === "all" || t.franchise === franchiseFilter) &&
    (!search || (t.displayName || t.name || "").toLowerCase().includes(search.toLowerCase()))
  )

  const handleTazoClick = (t: any) => {
    setSelectedTazo(t)
    setDetailOpen(true)
  }

  const fColors: Record<string, { bg: string; badge: string }> = {
    minimon: { bg: "#FFCB0510", badge: "#FFCB05" },
    dracobell: { bg: "#FF6B0010", badge: "#FF6B00" },
    cybermon: { bg: "#00A1E910", badge: "#00A1E9" },
  }

  return (
    <>
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search tazos..."
          className="px-3 py-1.5 text-xs font-bold border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 outline-none flex-1 max-w-[200px]" />
        {["all", "minimon", "dracobell", "cybermon"].map(f => (
          <button key={f} onClick={() => setFranchiseFilter(f)}
            className={`px-3 py-1 text-[10px] font-black uppercase border-2 transition-all ${
              franchiseFilter === f
                ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                : "bg-white text-[#1a1a1a] border-[#1a1a1a]/15 hover:border-[#FFCC00]"
            }`}>{f === "all" ? "All" : f}</button>
        ))}
        <span className="ml-auto text-[9px] font-black text-[#1a1a1a]/25 uppercase">
          {filtered.length} tazos
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#1a1a1a]/40" /></div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filtered.map((t: any) => {
            const f = t.franchise || "minimon"
            const fc = fColors[f] || fColors.minimon
            const rarityColor = {
              common: "#9CA3AF", uncommon: "#22C55E", rare: "#3B82F6",
              "ultra-rare": "#A855F7", legendary: "#F59E0B",
              ultra: "#A855F7",
            }[t.rarity] || "#9CA3AF"
            return (
            <button key={t.id} onClick={() => handleTazoClick(t)}
              className="text-left border-2 border-[#1a1a1a]/10 bg-white p-2.5 hover:bg-[#FFF9E6] hover:border-[#FFCC00] hover:shadow-[3px_3px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all group">
              {/* Disc */}
              <div className="aspect-square rounded-full overflow-hidden mb-1.5 mx-auto max-w-[92px] relative">
                {t.imageUrl ? (
                  <TazoDiscImage
                    src={t.imageUrl}
                    alt={t.displayName || t.name}
                    size="100%"
                    borderWidth={0}
                    franchiseSlug={typeof t.franchise === "string" ? t.franchise : t.franchiseSlug}
                    finish={t.finish}
                    creatureVariant={t.creatureVariant}
                    shinyImageUrl={t.shinyImageUrl}
                    lazy
                  />
                ) : (
                  <Disc3 className="w-6 h-6 absolute inset-0 m-auto text-[#1a1a1a]/10" />
                )}
                {/* Rarity dot */}
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-white"
                  style={{ background: rarityColor }} />
              </div>
              <p className="text-[9px] font-black text-[#1a1a1a] uppercase truncate">
                {t.displayName || t.name}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[7px] font-bold text-[#1a1a1a]/30 uppercase">{t.franchiseName || t.franchise}</span>
                <span className="ml-auto text-[7px] font-black px-1 py-px rounded" style={{ background: `${rarityColor}15`, color: rarityColor }}>
                  {(t.rarity || "common").replace("ultra-rare", "ultra").toUpperCase()}
                </span>
              </div>
            </button>
          )})}
        </div>
      )}
    </div>

    {/* Detail Modal */}
    {selectedTazo && (
      <TazoDetailModal
        tazo={selectedTazo as any}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedTazo(null) }}
      />
    )}
    </>
  )
}

// ── Shop ──

const BAGS = [
  { type: "classic", name: "Classic Bag", bonusChance: 15, rareBoost: 2, color: "#FFCC00", bg: "#FFF8E7", border: "#E5B800", franchise: "minimon", franchiseName: "Minimon", icon: ShoppingBag, tagline: "Original collection tazos", desc: "Classic Minimon tazos with balanced rarity distribution.", rarity: [{ l:"Common",p:48},{l:"Uncommon",p:30},{l:"Rare",p:15},{l:"Ultra Rare",p:5},{l:"Legendary",p:2}] },
  { type: "premium", name: "Premium Bag", bonusChance: 15, rareBoost: 2, color: "#3B82F6", bg: "#EFF6FF", border: "#2563EB", franchise: "cybermon", franchiseName: "Cybermon", icon: Star, tagline: "Digital monsters and tech", desc: "Cybermon tazos with digital finishes and balanced rarity.", rarity: [{ l:"Common",p:48},{l:"Uncommon",p:30},{l:"Rare",p:15},{l:"Ultra Rare",p:5},{l:"Legendary",p:2}] },
  { type: "mega", name: "Mega Bag", bonusChance: 15, rareBoost: 2, color: "#F97316", bg: "#FFF7ED", border: "#EA580C", franchise: "dracobell", franchiseName: "Dracobell", icon: Zap, tagline: "Legendary auras, top rarity", desc: "Dracobell tazos with legendary finishes and balanced rarity.", rarity: [{ l:"Common",p:48},{l:"Uncommon",p:30},{l:"Rare",p:15},{l:"Ultra Rare",p:5},{l:"Legendary",p:2}] },
]
const RC: Record<string, string> = { Common:"#9CA3AF", Uncommon:"#22C55E", Rare:"#3B82F6","Ultra Rare":"#A855F7", Legendary:"#F59E0B" }

function ShopContent() {
  const [tazosByF, setTazosByF] = useState<Record<string, any[]>>({})
  useEffect(() => {
    Promise.all([
      fetch("/api/tazos?franchise=cybermon&publishStatus=published&limit=4").then(r => r.json()),
      fetch("/api/tazos?franchise=dracobell&publishStatus=published&limit=4").then(r => r.json()),
      fetch("/api/tazos?franchise=minimon&publishStatus=published&limit=4").then(r => r.json()),
    ]).then(results => {
      const byF: Record<string, any[]> = {}
      for (const d of results) {
        for (const t of (d.tazos || [])) {
          const f = t.franchise || t.franchiseSlug || "minimon"
          if (!byF[f]) byF[f] = []
          if (byF[f].length < 3) byF[f].push(t)
        }
      }
      setTazosByF(byF)
    }).catch(() => {})
  }, [])

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 sm:space-y-10">
      {/* Hero */}
      <section className="text-center space-y-2">
        <p className="text-sm sm:text-base text-[#1a1a1a]/50 font-bold max-w-lg mx-auto">
          Open bags to discover and collect tazos across 3 franchises.{" "}
          <span className="text-[#1a1a1a]/30">10 credits per bag — free to play.</span>
        </p>
        <div className="flex items-center justify-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-black bg-[#FFCC00]/10 border border-[#FFCC00]/30 text-[#1a1a1a] uppercase">
            <Coins className="w-3.5 h-3.5 text-[#D97706]" /> 10 Credits
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-black bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#1a1a1a] uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" /> Free to Play
          </span>
        </div>
      </section>

      {/* Bag cards */}
      <section className="grid md:grid-cols-3 gap-4 sm:gap-6">
        {BAGS.map(bag => {
          const Icon = bag.icon
          const examples = tazosByF[bag.franchise] || []
          return (
            <div key={bag.type} className="mag-card border-3 border-[#1a1a1a] bg-white overflow-hidden" style={{ boxShadow: `4px 4px 0px ${bag.border}40` }}>
              <div className="px-4 sm:px-5 py-4 border-b-2 border-[#1a1a1a]/10" style={{ backgroundColor: bag.bg }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-[#1a1a1a] flex-shrink-0" style={{ backgroundColor: bag.color }}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-[#1a1a1a] uppercase leading-tight">{bag.name}</h3>
                      <p className="text-[9px] sm:text-[10px] font-bold text-[#1a1a1a]/50">{bag.tagline}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 bg-white px-2 py-1 border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]">
                    <Coins className="w-3 h-3 text-[#D97706]" />
                    <span className="text-xs font-black text-[#1a1a1a]">10</span>
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-[#1a1a1a]/60 font-bold leading-relaxed">{bag.desc}</p>

                {/* Rarity bar */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex h-2 rounded-full overflow-hidden border border-[#1a1a1a]/10">
                    {bag.rarity.map(r => (
                      <div key={r.l} className="h-full" style={{ width: `${r.p}%`, backgroundColor: RC[r.l] }} title={`${r.l}: ${r.p}%`} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {bag.rarity.map(r => (
                      <div key={r.l} className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: RC[r.l] }} />
                        <span className="text-[8px] font-bold text-[#1a1a1a]/50 uppercase">{r.l}</span>
                        <span className="text-[8px] font-black text-[#1a1a1a]">{r.p}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-3 mt-3">
                  <span className="text-[8px] font-black text-[#1a1a1a]/40 uppercase">Bonus <span className="text-[10px]" style={{ color: bag.color }}>{bag.bonusChance}%</span></span>
                  <span className="text-[8px] font-black text-[#1a1a1a]/40 uppercase">Rare Boost <span className="text-[10px]" style={{ color: bag.color }}>×{bag.rareBoost}</span></span>
                </div>
              </div>

              {/* Franchise + example tazos */}
              <div className="px-4 sm:px-5 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black text-[#1a1a1a]/30 uppercase tracking-wider">Franchise</span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 border border-[#1a1a1a]/20" style={{ backgroundColor: bag.bg, color: bag.border }}>{bag.franchiseName}</span>
                </div>
                {examples.length > 0 && (
                  <div>
                    <span className="text-[8px] font-black text-[#1a1a1a]/25 uppercase tracking-wider">Example tazos</span>
                    <div className="flex gap-1.5 mt-1">
                      {examples.map((t: any) => (
                        <div key={t.id} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-[#1a1a1a]/15 overflow-hidden flex-shrink-0 hover:border-[#FFCC00] hover:scale-110 transition-all" title={t.displayName || t.name}>
                          <div className="w-full h-full rounded-full overflow-hidden relative">
                            <TazoDiscImage src={t.imageUrl} alt={t.displayName || t.name} size="100%" borderWidth={0}
                              franchiseSlug={t.franchiseSlug || t.franchise?.slug}
                              finish={t.finish} creatureVariant={t.creatureVariant} shinyImageUrl={t.shinyImageUrl} lazy />
                          </div>
                        </div>
                      ))}
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-dashed border-[#1a1a1a]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[7px] font-black text-[#1a1a1a]/25">+more</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </section>

      {/* CTA */}
      <section className="mag-card border-3 border-[#1a1a1a] bg-white p-6 sm:p-8 text-center space-y-4 relative overflow-hidden" style={{ boxShadow: "6px 6px 0px #FFCC0040" }}>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg, #1a1a1a 0px, #1a1a1a 2px, transparent 2px, transparent 12px)" }} />
        <div className="relative z-10 space-y-3">
          <h3 className="text-lg sm:text-2xl font-black text-[#1a1a1a] uppercase tracking-tight">Ready to Start Collecting?</h3>
          <p className="text-sm text-[#1a1a1a]/50 font-bold max-w-md mx-auto">Sign up free and get starter credits to open your first bags. Collect, trade, and battle with 30 tazos across 3 franchises.</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <a href="/register" className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 text-xs sm:text-sm font-black uppercase tracking-wider bg-[#E3350D] text-white border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all">
              Sign Up Free <ArrowRight className="w-4 h-4" />
            </a>
            <a href="/login" className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 text-xs sm:text-sm font-black uppercase tracking-wider bg-white text-[#1a1a1a] border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all">
              Sign In
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Leaderboard ──

const SORTS = [
  { key: "credits", label: "CREDITS", icon: Coins },
  { key: "tazos", label: "TAZOS", icon: Package },
  { key: "battles", label: "BATTLES", icon: Swords },
]

function LeaderboardContent() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState("credits")

  useEffect(() => {
    setLoading(true)
    fetch(`/api/leaderboard?sort=${sort}&limit=20`)
      .then(r => r.json())
      .then(d => { setEntries(d.leaderboard || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [sort])

  const displayName = (e: any) => e.displayName || e.name || "???"

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="flex gap-2">
        {SORTS.map(s => (
          <button key={s.key} onClick={() => setSort(s.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase border-2 transition-all ${
              sort === s.key
                ? "bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#FFCC00]"
                : "bg-white text-[#1a1a1a] border-[#1a1a1a]/15"
            }`}><s.icon className="w-3.5 h-3.5" /> {s.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#1a1a1a]/40" /></div>
      ) : (
        <div className="space-y-1.5">
          {entries.map((e: any, i: number) => {
            const RankIcon = i === 0 ? Crown : i === 1 ? Medal : i === 2 ? Star : undefined
            const rankColor = i === 0 ? "#F59E0B" : i === 1 ? "#9CA3AF" : i === 2 ? "#D97706" : undefined
            return (
              <div key={e.id || i} className="flex items-center gap-3 px-4 py-2.5 border-2 border-[#1a1a1a] bg-white"
                style={{ boxShadow: rankColor ? `3px 3px 0 ${rankColor}30` : undefined }}>
                <span className="w-7 text-center text-sm font-black text-[#1a1a1a]/40">{i < 3 ? (RankIcon ? <RankIcon className="w-4 h-4 inline" style={{ color: rankColor }} /> : `#${i + 1}`) : `#${i + 1}`}</span>
                <div className="w-8 h-8 rounded-full bg-[#1a1a1a]/10 overflow-hidden flex-shrink-0">
                  {e.avatarUrl && <img src={e.avatarUrl} alt="" className="w-full h-full object-cover" />}
                </div>
                <span className="flex-1 text-xs font-black text-[#1a1a1a] truncate">{displayName(e)}</span>
                <span className="text-[11px] font-black text-[#FFCC00]">
                  {sort === "credits" ? `${(e.credits || 0).toLocaleString()} cr` :
                   sort === "tazos" ? `${e.tazoCount || e._count?.userTazos || 0} tazos` :
                   `${e.winCount || 0} wins`}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Download ──

const GITHUB_URL = "https://github.com/smouj/Trading-Tazos-Game"

const DESKTOP_PLATFORMS = [
  { id: "windows", icon: Monitor, color: "#00A4EF", label: "Windows", hint: "Installer for Windows 10/11" },
  { id: "mac", icon: Apple, color: "#1a1a1a", label: "macOS", hint: "DMG for Apple Silicon & Intel" },
  { id: "linux", icon: Terminal, color: "#FCC624", label: "Linux", hint: "AppImage for any distro" },
]

function DownloadContent() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">

      {/* ═══ SECTION 1: Play Now — Browser ═══ */}
      <div className="border-[3px] border-[#1a1a1a] bg-[#FFCC00] overflow-hidden"
        style={{ boxShadow: "6px 6px 0 #1a1a1a" }}>
        <div className="px-6 py-5 sm:px-8 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-[#1a1a1a] flex items-center justify-center">
              <Globe className="w-7 h-7 sm:w-8 sm:h-8 text-[#FFCC00]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-[#1a1a1a] uppercase leading-none">
                  Play in Your Browser
                </h2>
                <span className="text-[8px] font-black text-[#1a1a1a] bg-white/70 border border-[#1a1a1a]/30 px-1.5 py-0.5 uppercase tracking-wider">
                  Available Now
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#1a1a1a]/70 mt-1 leading-relaxed">
                Create a free account, open your starter bags, build a deck, and jump into the 3D arena — all from your browser.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <Link href="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-black text-[#1a1a1a] bg-white uppercase border-2 border-[#1a1a1a] hover:bg-[#FFF9E6] transition-colors"
                  style={{ boxShadow: "3px 3px 0 #1a1a1a" }}>
                  <Zap className="w-3.5 h-3.5" /> Play Free
                </Link>
                <span className="text-[10px] font-black text-[#1a1a1a]/50 uppercase tracking-wider">
                  tradingtazosgame.com
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PWA install hint */}
        <div className="border-t-[3px] border-[#1a1a1a] px-6 py-3 sm:px-8 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Smartphone className="w-3.5 h-3.5 text-[#1a1a1a]/60" />
            <span className="text-[9px] font-black text-[#1a1a1a]/60 uppercase tracking-wider">Install as PWA:</span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#1a1a1a]/70">
            Open in Safari/Chrome → tap <strong className="text-[#1a1a1a]">Share</strong> → <strong className="text-[#1a1a1a]">Add to Home Screen</strong> → play fullscreen like a native app!
          </span>
        </div>
      </div>

      {/* ═══ SECTION 2: Mobile App Stores ═══ */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Smartphone className="w-5 h-5 text-[#E3350D]" />
          <h3 className="text-sm font-black text-[#1a1a1a] uppercase tracking-wider">Mobile Apps</h3>
          <span className="text-[8px] font-black text-white bg-[#F59E0B] px-1.5 py-0.5 uppercase">Coming Soon</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Google Play */}
          <div className="border-2 border-dashed border-[#1a1a1a]/20 bg-white p-5 sm:p-6 opacity-75">
            <div className="flex items-center gap-3">
              <div className="shrink-0 w-10 h-10 rounded-sm bg-[#1a1a1a] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                  <path d="M1.752 1.094a.78.78 0 0 0-.257.155.86.86 0 0 0-.235.402C1.09 2.296 1 3.089 1 4v16c0 .915.09 1.706.26 2.349a.86.86 0 0 0 .234.402.78.78 0 0 0 .258.155L13.43 12 1.752 1.094zM14.984 10.53l3.897-3.65a.84.84 0 0 1 .12 1.063l-2.184 3.348a.175.175 0 0 0 0 .204l2.184 3.348a.84.84 0 0 1-.12 1.063l-3.897-3.65a.35.35 0 0 1 0-.528zM1.752 22.906a.86.86 0 0 0 .542.09L13.43 12 1.752 1.094a.86.86 0 0 0-.542.09.85.85 0 0 0-.327.427c-.16.604-.25 1.346-.26 2.254v16.27c.01.908.1 1.65.26 2.254.065.258.184.398.327.427z"/>
                </svg>
              </div>
              <div>
                <div className="text-[9px] font-bold text-[#1a1a1a]/40 uppercase tracking-wider">coming to</div>
                <div className="text-base font-black text-[#1a1a1a] uppercase leading-tight">Google Play</div>
              </div>
            </div>
            <p className="mt-3 text-[10px] font-bold text-[#1a1a1a]/35 leading-relaxed">
              Android app with offline collection viewer, push battle notifications, and exclusive mobile-only tazo drops.
            </p>
          </div>

          {/* App Store */}
          <div className="border-2 border-dashed border-[#1a1a1a]/20 bg-white p-5 sm:p-6 opacity-75">
            <div className="flex items-center gap-3">
              <div className="shrink-0 w-10 h-10 rounded-sm bg-[#1a1a1a] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <div>
                <div className="text-[9px] font-bold text-[#1a1a1a]/40 uppercase tracking-wider">coming to</div>
                <div className="text-base font-black text-[#1a1a1a] uppercase leading-tight">App Store</div>
              </div>
            </div>
            <p className="mt-3 text-[10px] font-bold text-[#1a1a1a]/35 leading-relaxed">
              Native iOS experience with haptic feedback, iCloud sync for your collection, Game Center leaderboards, and AR tazo viewer.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ SECTION 3: Desktop Apps ═══ */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Monitor className="w-5 h-5 text-[#1a1a1a]" />
          <h3 className="text-sm font-black text-[#1a1a1a] uppercase tracking-wider">Desktop Apps</h3>
          <span className="text-[8px] font-black text-white bg-[#F59E0B] px-1.5 py-0.5 uppercase">Coming Soon</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {DESKTOP_PLATFORMS.map(d => {
            const Icon = d.icon
            return (
              <div key={d.id} className="border-2 border-dashed border-[#1a1a1a]/20 bg-white p-5 opacity-75">
                <div className="flex items-center gap-3 mb-3">
                  <Icon className="w-8 h-8 flex-shrink-0" style={{ color: d.color }} />
                  <div>
                    <h4 className="text-sm font-black text-[#1a1a1a] uppercase leading-tight">{d.label}</h4>
                    <p className="text-[9px] font-bold text-[#1a1a1a]/30">{d.hint}</p>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-[#1a1a1a]/25 uppercase text-center">
                  Play in browser for now
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══ GitHub link ═══ */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <span className="text-[10px] font-bold text-[#1a1a1a]/30">
          Open source —{" "}
          <a href={GITHUB_URL} target="_blank" rel="noopener" className="underline hover:text-[#E3350D] transition-colors">
            GitHub
          </a>
        </span>
        <ExternalLink className="w-2.5 h-2.5 text-[#1a1a1a]/20" />
      </div>
    </div>
  )
}

// ── FAQ ──

const FAQS = [
  { q: "What is Trading Tazos Game?", a: "A browser-based skill game where you collect and battle with digital tazos. Open bags to discover 349 unique tazos across 3 franchises. Build decks of 5, then enter the 3D arena where you aim, charge, and slam your tazos to flip opponent discs and capture them for points." },
  { q: "Is it free to play?", a: "Yes, completely free. Start with 10 free bags and earn credits by battling, completing quests, and daily logins — no credit card required." },
  { q: "How does the battle system work?", a: "Use the Vertical Slam system: aim your crosshair at the target zone, charge the power bar for slam force, then tilt to control your landing angle. Your tazo drops from above — hit opponent tazos hard enough and they flip, scoring points. First to 5 points wins!" },
  { q: "What are the combat stats?", a: "Each tazo has 9 stats: Attack, Defense, Resistance, Weight, Stability, Spin, Control, Bounce, and Precision. Building a balanced deck with complementary stats is key." },
  { q: "Can I play on mobile?", a: "Yes! Visit tradingtazosgame.com on your phone, install as PWA, and play full-screen. Desktop versions also available." },
  { q: "How do credits work?", a: "Credits buy tazo bags in the Shop. Earn them by winning battles, completing quests, and daily login bonuses." },
  { q: "What quests are there?", a: "17 quests across 4 categories (Beginner, Daily, Weekly, Special) and 18 achievements with Bronze → Platinum tiers." },
  { q: "How do I get started?", a: "Create a free account, open your welcome bags, build a deck of 5, and enter the Battle Arena." },
]

function FAQContent() {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      {FAQS.map((faq, i) => (
        <details key={i} className="border-2 border-[#1a1a1a] bg-white group"
          style={{ boxShadow: "3px 3px 0 #1a1a1a" }}>
          <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#FFF9E6] transition-colors">
            <HelpCircle className="w-4 h-4 text-[#FFCC00] flex-shrink-0" />
            <span className="text-xs font-black text-[#1a1a1a] uppercase">{faq.q}</span>
          </summary>
          <p className="px-4 pb-3 text-[11px] font-bold text-[#1a1a1a]/60 leading-relaxed">{faq.a}</p>
        </details>
      ))}
    </div>
  )
}

// ── PRIVACY POLICY ──
const PRIVACY_SECTIONS = [
  { title: "1. Data We Collect", body: <>When you register, we collect your <strong>username, email address, and hashed password</strong> (never stored in plain text). <strong>Gameplay data:</strong> Tazos collected, decks created, battle results, quest progress, credits balance, bag purchase history. <strong>Scanner uploads:</strong> Images you voluntarily upload via the scanner feature to identify physical tazos. <strong>Technical data:</strong> IP address, browser type, device info, and access timestamps for security and debugging.</> },
  { title: "2. How We Use Data", body: <>We use your data exclusively to: (a) provide and maintain the game service; (b) authenticate your account; (c) display your collection and stats; (d) populate leaderboards; (e) diagnose technical issues; (f) prevent abuse and fraud.</> },
  { title: "3. Data Storage", body: <>All data is stored on servers in the European Union. We use SQLite for game data and secure, hashed password storage (bcrypt). Account credentials are never shared with third parties.</> },
  { title: "4. Data Retention", body: <>We retain your account and gameplay data as long as your account is active. Upon account deletion, your personal data is permanently removed within 30 days. Anonymized game statistics may be retained indefinitely.</> },
  { title: "5. Your Rights", body: <>Under GDPR and applicable laws, you have the right to: (a) access your data; (b) correct inaccurate data; (c) delete your account and associated data; (d) object to processing; (e) data portability. To exercise these rights, contact support@tradingtazosgame.com.</> },
  { title: "6. Children's Privacy", body: <>TTG is not directed at children under 13. We do not knowingly collect data from children under 13. If you believe a child has provided us with personal data, contact us immediately.</> },
  { title: "7. Cookies", body: <>We use essential cookies for authentication (session tokens) and security. See our <a href="/?page=cookies" className="text-[#E3350D] underline font-black">Cookie Policy</a>.</> },
  { title: "8. Changes", body: <>We may update this policy. Significant changes will be communicated via email or site notice. Continued use after changes constitutes acceptance.</> },
  { title: "9. Contact", body: <>Data controller: <a href="mailto:support@tradingtazosgame.com" className="text-[#E3350D] underline font-black">support@tradingtazosgame.com</a></> },
]

function PrivacyContent() {
  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <h2 className="text-2xl font-black uppercase text-[#1a1a1a] mb-2">Privacy Policy</h2>
      <p className="text-[10px] font-bold text-[#1a1a1a]/30 uppercase tracking-wider mb-5">Last updated: June 5, 2026</p>
      <div className="space-y-3">
        {PRIVACY_SECTIONS.map((s, i) => (
          <div key={i} className="border-3 border-[#1a1a1a] bg-white p-4" style={{ boxShadow: "3px 3px 0 #1a1a1a" }}>
            <h3 className="text-sm font-black uppercase text-[#1a1a1a] mb-1.5">{s.title}</h3>
            <p className="text-xs font-bold text-[#1a1a1a]/60 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── TERMS OF SERVICE ──
const TERMS_SECTIONS = [
  { title: "1. Acceptance of Terms", body: <>By creating an account, accessing, or using tradingtazosgame.com you agree to be bound by these terms. If you do not agree, do not use the service. We reserve the right to update these terms at any time; continued use after changes constitutes acceptance.</> },
  { title: "2. Eligibility", body: <>You must be at least 13 years old to create an account. If you are under 18, you must have a parent or guardian's permission. By registering you represent that you meet these requirements.</> },
  { title: "3. Account Responsibility", body: <>You are responsible for maintaining the confidentiality of your login credentials. You are responsible for all activity under your account. Notify us immediately at support@tradingtazosgame.com if you suspect unauthorized access. We reserve the right to suspend or terminate accounts that violate these terms.</> },
  { title: "4. User Conduct", body: <>You agree not to: (a) upload malicious content or attempt to exploit the service; (b) use automated scripts, bots, or cheats; (c) impersonate others or provide false information; (d) harass, abuse, or harm other users; (e) violate any applicable laws.</> },
  { title: "5. Content & Scanner", body: <>The scanner feature allows users to upload images of physical tazos. By uploading content, you grant us a non-exclusive license to store and display it within the service. You represent that you own or have rights to any content you upload. We do not claim ownership of user content.</> },
  { title: "6. Intellectual Property", body: <>Trading Tazos Game is a fan-made collector experience. Minimon, Dracobell, and Cybermon are original fictional IPs created for this game. The game code, design, artwork, and original content are protected by copyright. You may not reproduce, distribute, or create derivative works without permission.</> },
  { title: "7. Service Availability", body: <>TTG is provided "as is" and "as available" without warranties of any kind. We do not guarantee uninterrupted access. We may modify, suspend, or discontinue features at any time without liability.</> },
  { title: "8. Limitation of Liability", body: <>To the fullest extent permitted by law, Trading Tazos Game and its operators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability is limited to the amount you have paid us, if any, in the past 12 months.</> },
  { title: "9. Termination", body: <>We may terminate or suspend your account at any time for violation of these terms. You may delete your account at any time by contacting support. Upon termination, your right to use the service ceases immediately.</> },
  { title: "10. Governing Law", body: <>These terms are governed by Spanish law. Any disputes shall be resolved in the courts of Spain.</> },
  { title: "11. Contact", body: <>For questions about these Terms: <a href="mailto:support@tradingtazosgame.com" className="text-[#E3350D] underline font-black">support@tradingtazosgame.com</a></> },
]

function TermsContent() {
  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <h2 className="text-2xl font-black uppercase text-[#1a1a1a] mb-2">Terms of Service</h2>
      <p className="text-[10px] font-bold text-[#1a1a1a]/30 uppercase tracking-wider mb-5">Last updated: June 5, 2026</p>
      <div className="space-y-3">
        {TERMS_SECTIONS.map((s, i) => (
          <div key={i} className="border-3 border-[#1a1a1a] bg-white p-4" style={{ boxShadow: "3px 3px 0 #1a1a1a" }}>
            <h3 className="text-sm font-black uppercase text-[#1a1a1a] mb-1.5">{s.title}</h3>
            <p className="text-xs font-bold text-[#1a1a1a]/60 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── COOKIE POLICY ──
function CookiesContent() {
  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <h2 className="text-2xl font-black uppercase text-[#1a1a1a] mb-2">Cookie Policy</h2>
      <p className="text-[10px] font-bold text-[#1a1a1a]/30 uppercase tracking-wider mb-5">Last updated: June 5, 2026</p>
      <div className="space-y-3">
        <div className="border-3 border-[#1a1a1a] bg-white p-4" style={{ boxShadow: "3px 3px 0 #1a1a1a" }}>
          <h3 className="text-sm font-black uppercase text-[#1a1a1a] mb-1.5">1. What Are Cookies</h3>
          <p className="text-xs font-bold text-[#1a1a1a]/60 leading-relaxed">Cookies are small text files stored on your device by your browser. They help websites remember your preferences, login state, and improve your experience.</p>
        </div>
        <div className="border-3 border-[#1a1a1a] bg-white p-4" style={{ boxShadow: "3px 3px 0 #1a1a1a" }}>
          <h3 className="text-sm font-black uppercase text-[#1a1a1a] mb-1.5">2. Essential Cookies</h3>
          <p className="text-xs font-bold text-[#1a1a1a]/60 leading-relaxed mb-1.5">We use only essential cookies required for the service to function:</p>
          <ul className="list-disc pl-5 space-y-0.5 text-xs font-bold text-[#1a1a1a]/50">
            <li><strong className="text-[#1a1a1a]/70">Session token:</strong> Authenticates your account. Set when you log in. Expires after 7 days or on logout.</li>
            <li><strong className="text-[#1a1a1a]/70">CSRF token:</strong> Protects against cross-site request forgery attacks.</li>
          </ul>
        </div>
        <div className="border-3 border-[#1a1a1a] bg-white p-4" style={{ boxShadow: "3px 3px 0 #1a1a1a" }}>
          <h3 className="text-sm font-black uppercase text-[#1a1a1a] mb-1.5">3. No Tracking Cookies</h3>
          <p className="text-xs font-bold text-[#1a1a1a]/60 leading-relaxed">TTG does not use tracking cookies, advertising cookies, analytics cookies, or third-party cookies. We do not track you across websites. There are no "Accept Cookies" banners because we don't need your consent — we only use essential cookies.</p>
        </div>
        <div className="border-3 border-[#1a1a1a] bg-white p-4" style={{ boxShadow: "3px 3px 0 #1a1a1a" }}>
          <h3 className="text-sm font-black uppercase text-[#1a1a1a] mb-1.5">4. Managing Cookies</h3>
          <p className="text-xs font-bold text-[#1a1a1a]/60 leading-relaxed">Most browsers allow you to block or delete cookies via settings. However, blocking essential cookies will prevent you from logging in or using authenticated features of TTG.</p>
        </div>
        <div className="border-3 border-[#1a1a1a] bg-white p-4" style={{ boxShadow: "3px 3px 0 #1a1a1a" }}>
          <h3 className="text-sm font-black uppercase text-[#1a1a1a] mb-1.5">5. Local Storage</h3>
          <p className="text-xs font-bold text-[#1a1a1a]/60 leading-relaxed">We may use browser localStorage for non-personal preferences (e.g., language selection, UI state). This data stays on your device and is never sent to our servers.</p>
        </div>
        <div className="border-3 border-[#1a1a1a] bg-white p-4" style={{ boxShadow: "3px 3px 0 #1a1a1a" }}>
          <h3 className="text-sm font-black uppercase text-[#1a1a1a] mb-1.5">6. Contact</h3>
          <p className="text-xs font-bold text-[#1a1a1a]/60 leading-relaxed">Questions: <a href="mailto:support@tradingtazosgame.com" className="text-[#E3350D] underline font-black">support@tradingtazosgame.com</a></p>
        </div>
      </div>
    </div>
  )
}

// ── CONTACT ──
function ContactContent() {
  const channels = [
    { icon: <Mail className="w-6 h-6" />, title: "Email Support", desc: "For general questions, account help, and gameplay support.", action: "support@tradingtazosgame.com", href: "mailto:support@tradingtazosgame.com", color: "#E3350D" },
    { icon: <Bug className="w-6 h-6" />, title: "Bug Reports", desc: "Found a bug? Report it on GitHub Issues with steps to reproduce.", action: "GitHub Issues", href: "https://github.com/smouj/Trading-Tazos-Game/issues", color: "#3B4CCA" },
    { icon: <Shield className="w-6 h-6" />, title: "Privacy & Data", desc: "Data deletion requests, privacy questions, and account removal.", action: "support@tradingtazosgame.com", href: "mailto:support@tradingtazosgame.com", color: "#22C55E" },
    { icon: <HelpCircle className="w-6 h-6" />, title: "Content Removal", desc: "If you believe any content violates our policies, let us know.", action: "support@tradingtazosgame.com", href: "mailto:support@tradingtazosgame.com", color: "#F59E0B" },
  ]
  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <h2 className="text-2xl font-black uppercase text-[#1a1a1a] mb-1 text-center">Contact</h2>
      <p className="text-xs font-bold text-[#1a1a1a]/40 text-center mb-5 max-w-md mx-auto">We are here to help. Choose the right channel and we will get back to you within 48 hours.</p>
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        {channels.map((ch, i) => (
          <a key={i} href={ch.href} target={ch.href.startsWith("http") ? "_blank" : undefined} rel={ch.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="border-3 border-[#1a1a1a] bg-white p-4 flex items-start gap-3 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1a1a1a] transition-all group" style={{ boxShadow: "3px 3px 0 #1a1a1a" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]" style={{ background: ch.color, color: "#FFF" }}>{ch.icon}</div>
            <div className="min-w-0">
              <h3 className="text-xs font-black uppercase text-[#1a1a1a] mb-0.5">{ch.title}</h3>
              <p className="text-[10px] font-bold text-[#1a1a1a]/45 mb-1 leading-relaxed">{ch.desc}</p>
              <span className="text-[9px] font-black text-[#E3350D] group-hover:underline">{ch.action} →</span>
            </div>
          </a>
        ))}
      </div>
      <div className="p-4 bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] text-center" style={{ background: "#FFCC00" }}>
        <p className="text-xs font-bold text-[#1a1a1a]/60">We typically respond within <strong className="text-[#1a1a1a]">24-48 hours</strong> on business days.</p>
      </div>
      <p className="text-center mt-3 text-[10px] font-bold text-[#1a1a1a]/30">
        Looking for quick answers? <a href="/?page=faq" className="text-[#E3350D] underline font-black hover:text-[#1a1a1a]">Check our FAQ →</a>
      </p>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// MAIN LAUNCHER COMPONENT
// ══════════════════════════════════════════════════════════

const COLLECTION_DETAILS: Record<string, {
  name: string; count: number; total: number; year: number; origin: string; color: string;
  world: string; worldDesc: string;
  sections: { title: string; items: { name: string; detail: string }[] }[]
  features: string[]; motto: string; cta: string
}> = {
  minimon: {
    name: "Minimon", count: FRANCHISE_BY_SLUG.minimon.count, total: FRANCHISE_BY_SLUG.minimon.total, year: 2000, origin: "Matutano", color: "#FFCC00",
    world: "Luminara",
    worldDesc: "A luminous land of colorful regions, winding paths, small villages, and places where elemental energy takes shape. Centuries ago, Luminara was filled with Life Spark — an invisible energy that flowed through trees, rivers, caves, clouds, and mountains. When Life Spark accumulated in one place long enough, a Minimon was born.",
    sections: [
      { title: "Regions", items: [
        { name: "Sunnyvale Fields", detail: "Rolling fields, farms, and small villages — Normal, solar, plant" },
        { name: "Mossdeep Woods", detail: "Ancient forests with deep roots — Plant, insect, earth, mystic" },
        { name: "Bluefin Coast", detail: "Beaches, reefs, and distant lighthouses — Water, wind, soft ice" },
        { name: "Cinderpop Hills", detail: "Warm hills & volcanic caves — Fire, rock, metal" },
        { name: "Stormtail Ridge", detail: "Storm-swept mountain peaks — Electric, flying, lesser dragon" },
        { name: "Moonberry Hollow", detail: "A strange nocturnal zone — Shadow, dream, illusion" },
        { name: "Aurora Summit", detail: "Legendary endgame region — Rare forms and guardians" },
      ]},
      { title: "Evolution: Blooming", items: [
        { name: "Tiny Form", detail: "Small, tender, and fragile" },
        { name: "Trail Form", detail: "Adventurous — more defined abilities" },
        { name: "Guardian Form", detail: "Strong, protective, and mature" },
        { name: "Mythic Bloom", detail: "Legendary, rare, nearly one-of-a-kind" },
      ]},
    ],
    features: ["Balanced stat distribution", "Classic creature designs", "Original Matutano 2000 series", "Versatile battle strategies"],
    motto: "Find them. Bond with them. Watch them bloom.",
    cta: "Browse All 10 Minimon Tazos",
  },
  dracobell: {
    name: "Dracobell", count: FRANCHISE_BY_SLUG.dracobell.count, total: FRANCHISE_BY_SLUG.dracobell.total, year: 1995, origin: "Matutano", color: "#FF6B00",
    world: "Bellora",
    worldDesc: "A world of combat regions governed by clans. Each clan protects a technique, a philosophy, and a fragment of an ancient sonic relic — the Dracobell. Forged from meteorite metal and dragon scales, the bell was shattered during a war between clans, and its Bell Shards are now scattered across Bellora.",
    sections: [
      { title: "Clans", items: [
        { name: "Ember Valley — Ember Fist", detail: "Fire, direct attack" },
        { name: "Storm Peaks — Storm Fang", detail: "Lightning, speed" },
        { name: "Iron Plateau — Iron Horn", detail: "Defense, endurance" },
        { name: "Frost Temple — Frost Scale", detail: "Control, precision" },
        { name: "Shadow Basin — Shadow Claw", detail: "Counterattack, stealth" },
        { name: "Golden Shrine — Golden Roar", detail: "Aura, mastery" },
        { name: "Dragon Crater — Dragon Bell", detail: "Ancestral power" },
      ]},
      { title: "Transformation: Ascension", items: [
        { name: "Base Fighter", detail: "The warrior's normal form" },
        { name: "Aura Release", detail: "First release of inner energy" },
        { name: "Clan Ascension", detail: "Form bonded to the clan" },
        { name: "Champion Ascension", detail: "High-tournament form" },
        { name: "Dragon Bell", detail: "Legendary form linked to the bell" },
      ]},
    ],
    features: ["6 unique categories", "Highest average attack stats", "Rare Holo 3D variants", "Most diverse category system"],
    motto: "Train hard. Ring loud. Rise beyond.",
    cta: "Browse All 11 Dracobell Tazos",
  },
  cybermon: {
    name: "Cybermon", count: FRANCHISE_BY_SLUG.cybermon.count, total: FRANCHISE_BY_SLUG.cybermon.total, year: 2000, origin: "Magic Box", color: "#00B4D8",
    world: "The Neon Grid",
    worldDesc: "A hidden digital dimension behind all networks — not simply the internet, but a living dimension formed by forgotten data, lost signals, ancient code, and protocols that developed consciousness. During The Awakening Upload, data fragments mixed with human emotions and produced something unexpected: code with instinct.",
    sections: [
      { title: "Sectors", items: [
        { name: "Boot Fields", detail: "Starting zone: stable, simple code — Basic Cybermon" },
        { name: "Pixel Ruins", detail: "Ruins of ancient games — Pixel, glitch, illusion" },
        { name: "Volt Highway", detail: "Highways of pure electricity — Volt, speed, signal" },
        { name: "Firewall Citadel", detail: "Fortified defensive stronghold — Armor, shield, core" },
        { name: "Data Ocean", detail: "Endless sea of flowing information — Aqua-data, memory" },
        { name: "Glitch Abyss", detail: "Broken and corrupted code — Glitch, error, corrupted" },
        { name: "Kernel Tower", detail: "Core of the digital world — Advanced forms" },
      ]},
      { title: "Evolution: Shift", items: [
        { name: "Boot Form", detail: "Initial form, newly activated" },
        { name: "Link Form", detail: "Synchronized with a Linker" },
        { name: "Overdrive", detail: "Temporary combat overclock" },
        { name: "Prime Form", detail: "Full protocol form unlocked" },
        { name: "Corrupt", detail: "Damaged by dark code — Omega Patch restores it" },
      ]},
    ],
    features: ["Largest collection — 160 tazos", "Complex evolution trees", "Highest precision stats", "Original Magic Box 2000 series"],
    motto: "Log in. Link up. Break the Null.",
    cta: "Browse All 11 Cybermon Tazos",
  },
}

function CollectionDetailContent({ collection }: { collection: string }) {
  const c = COLLECTION_DETAILS[collection]
  if (!c) return null
  return (
    <div className="w-full max-w-3xl mx-auto space-y-5">
      {/* Intro */}
      <div className="border-2 border-[#1a1a1a] bg-white p-5" style={{ boxShadow: "4px 4px 0 #1a1a1a" }}>
        <div className="h-2 mb-3" style={{ background: c.color }} />
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-black text-[#1a1a1a]">{c.count}</span>
          <span className="text-[10px] font-bold text-[#1a1a1a]/25 uppercase">of {c.total} planned</span>
          <span className="text-xs font-bold text-[#1a1a1a]/40 uppercase">tazos · {c.origin} {c.year}</span>
        </div>
        <p className="text-xs font-bold text-[#1a1a1a]/60 leading-relaxed">{c.worldDesc}</p>
      </div>

      {/* Sections */}
      {c.sections.map(s => (
        <div key={s.title}>
          <h3 className="text-sm font-black uppercase text-[#1a1a1a] mb-2">{s.title}</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {s.items.map(item => (
              <div key={item.name} className="border-2 border-[#1a1a1a] bg-white p-3" style={{ boxShadow: "2px 2px 0 #1a1a1a" }}>
                <span className="text-[10px] font-black uppercase text-[#1a1a1a] block mb-0.5">{item.name}</span>
                <span className="text-[9px] font-bold text-[#1a1a1a]/50">{item.detail}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Features + Motto */}
      <div className="border-2 border-[#1a1a1a] bg-white p-5" style={{ boxShadow: "3px 3px 0 #1a1a1a" }}>
        <ul className="space-y-1 mb-3">
          {c.features.map((f, i) => (
            <li key={i} className="text-[10px] font-bold text-[#1a1a1a]/60 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: c.color }} /> {f}
            </li>
          ))}
        </ul>
        <p className="text-sm font-black uppercase text-[#1a1a1a] text-center">
          &ldquo;{c.motto}&rdquo;
        </p>
      </div>

      {/* CTA */}
      <div className="text-center">
        <a href={`/tazos?collection=${collection}`}
          className="inline-block px-6 py-2.5 text-[11px] font-black text-white bg-[#E3350D] uppercase tracking-wider border-2 border-[#1a1a1a]
                     shadow-[3px_3px_0_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_#1a1a1a]
                     active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1a1a1a] transition-all">
          {c.cta}
        </a>
      </div>
    </div>
  )
}

export default function LauncherView() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSplash, setShowSplash] = useState(false)
  const [currentPage, setCurrentPage] = useState<PageId>("home")

  // Sync page from URL query param on mount
  useEffect(() => {
    const page = searchParams.get("page")
    if (page && PAGE_LABELS[page as PageId]) {
      setCurrentPage(page as PageId)
    }
  }, [searchParams])

  const navigate = useCallback((page: PageId) => {
    setCurrentPage(page)
    if (page === "home") {
      router.replace("/", { scroll: false })
    } else {
      router.replace(`/?page=${page}`, { scroll: false })
    }
  }, [router])

  const handlePlay = useCallback(() => setShowSplash(true), [])
  const handleSplashDone = useCallback(() => {
    setShowSplash(false)
    window.location.href = user ? "/app/collection" : "/login"
  }, [user])

  const isHome = currentPage === "home"

  return (
    <>
      {showSplash && <MagazineSplash onFinish={handleSplashDone} />}

      <div className="min-h-screen flex flex-col relative" style={{ background: "#FFF9E6" }}>
        <div className="mag-halftone absolute inset-0 opacity-40 pointer-events-none" />

        {/* ═══ MASTHEAD ═══ */}
        <header className="relative z-10 border-b-[5px] border-[#1a1a1a]" style={{ background: "#1a1a1a" }}>
          <div className="flex items-center justify-between px-4 sm:px-6 py-2.5">
            <div className="flex items-center gap-2.5">
              <button onClick={() => navigate("home")} className="cursor-pointer">
                <img src="/favicon-192.png" alt="TTG" className="w-7 h-7 sm:w-8 sm:h-8" />
              </button>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-[0.08em] leading-none">
                  TRADING<span className="text-[#FFCC00]">TAZOS</span><span className="text-white/80">GAME</span>
                </h2>
                <p className="text-[8px] font-bold text-[#FFCC00]/70 uppercase tracking-[0.3em] leading-none mt-0.5">Official Game (Beta)</p>
              </div>
            </div>

            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-1">
              {([
                ["home", "Home"],
                ["how-to-play", "How to Play"],
                ["collections", "Collections"],
                ["tazos", "Tazos"],
                ["leaderboard", "Rankings"],
                ["download", "Download"],
                ["faq", "FAQ"],
                ["shop", "Shop"],
              ] as [PageId, string][]).map(([id, label]) => (
                <button key={id} onClick={() => navigate(id)}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-colors ${
                    currentPage === id ? "text-[#FFCC00]" : "text-white/50 hover:text-[#FFCC00]"
                  }`}>
                  {label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <button onClick={handlePlay}
                    className="px-3 py-1 text-[10px] font-black text-[#1a1a1a] bg-[#FFCC00] uppercase tracking-wider border-2 border-white/20 hover:bg-[#FFE566] transition-colors">
                    Dashboard
                  </button>
                  <button onClick={() => { localStorage.removeItem("ttg-token"); document.cookie = "auth_token=; Max-Age=0; path=/"; document.cookie = "ttg_session=; Max-Age=0; path=/"; window.location.href = "/"; }}
                    className="px-3 py-1 text-[10px] font-black text-white/40 uppercase tracking-wider border-2 border-white/10 hover:border-[#E3350D] hover:text-[#E3350D] transition-colors">Log Out</button>
                </>
              ) : (
                <a href="/login"
                  className="px-3 py-1 text-[10px] font-black text-white uppercase tracking-wider border-2 border-white/30 hover:border-[#FFCC00] hover:text-[#FFCC00] transition-colors">Sign In</a>
              )}
            </div>
          </div>

          {/* Mobile nav */}
          <nav className="sm:hidden flex items-center justify-center gap-0 px-2 pb-2 overflow-x-auto">
            {(["home", "how-to-play", "collections", "tazos", "leaderboard", "faq", "shop"] as PageId[]).map(id => (
              <button key={id} onClick={() => navigate(id)}
                className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-colors ${
                  currentPage === id ? "text-[#FFCC00]" : "text-white/40 hover:text-[#FFCC00]"
                }`}>{PAGE_LABELS[id]}</button>
            ))}
          </nav>
        </header>

        {/* ═══ CONTENT AREA ═══ */}
        <main className="relative z-10 flex-1 flex flex-col px-4 sm:px-6">
          <div className="absolute top-0 left-0 right-0 h-2 mag-stripes opacity-20 pointer-events-none" />

          {!isHome && (
            <div className="max-w-5xl mx-auto w-full pt-6">
              <PageHeader title={PAGE_LABELS[currentPage]} onBack={() => navigate("home")} />
            </div>
          )}

          <div className="pb-8">
            {currentPage === "home" && (
              <>
                <HomeHero user={user} onPlay={handlePlay} />
                <HowItWorksHome />
                <BattlePreviewHome />
                <SeriesPreviewHome onNavigate={navigate} />
              </>
            )}
            
            {currentPage === "how-to-play" && (
              <div className="w-full max-w-5xl mx-auto"><HowToPlayContent /></div>
            )}
            
            {currentPage === "collections" && (
              <div className="w-full max-w-5xl mx-auto"><CollectionsContent onNavigate={navigate} /></div>
            )}
            
            {currentPage === "tazos" && (
              <div className="w-full max-w-5xl mx-auto"><TazosContent /></div>
            )}
            
            {currentPage === "leaderboard" && (
              <div className="w-full max-w-5xl mx-auto"><LeaderboardContent /></div>
            )}
            
            {currentPage === "download" && (
              <div className="w-full max-w-5xl mx-auto"><DownloadContent /></div>
            )}
            
            {currentPage === "faq" && (
              <div className="w-full max-w-5xl mx-auto"><FAQContent /></div>
            )}

            {currentPage === "shop" && (
              <div className="w-full max-w-5xl mx-auto"><ShopContent /></div>
            )}
            {currentPage === "privacy" && (
              <div className="w-full max-w-5xl mx-auto"><PrivacyContent /></div>
            )}
            {currentPage === "terms" && (
              <div className="w-full max-w-5xl mx-auto"><TermsContent /></div>
            )}
            {currentPage === "cookies" && (
              <div className="w-full max-w-5xl mx-auto"><CookiesContent /></div>
            )}
            {currentPage === "contact" && (
              <div className="w-full max-w-5xl mx-auto"><ContactContent /></div>
            )}

            {(currentPage === "collections-minimon" || currentPage === "collections-dracobell" || currentPage === "collections-cybermon") && (
              <div className="w-full max-w-5xl mx-auto"><CollectionDetailContent collection={currentPage.replace("collections-", "")} /></div>
            )}
          </div>
        </main>

        {/* ═══ FOOTER ═══ */}
        <footer className="relative z-10 border-t-[5px] border-[#1a1a1a]" style={{ background: "#1a1a1a" }}>
          <div className="flex items-center justify-center gap-1.5 sm:gap-3 px-3 py-2.5 border-b border-white/10">
            <PlatformBadge icon={Globe} label="Browser" />
            <PlatformBadge icon={Monitor} label="Windows" />
            <PlatformBadge icon={Apple} label="macOS" />
            <PlatformBadge icon={Terminal} label="Linux" />
            <button onClick={() => navigate("download")}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black text-[#1a1a1a] bg-[#FFCC00] uppercase tracking-wider border-2 border-white/20 hover:bg-[#FFE566] transition-colors">
              <Download className="w-3 h-3" /> Download
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-2 gap-2">
            <div className="flex items-center gap-3 sm:gap-4">
              <button onClick={() => navigate("tazos")} className="text-[9px] font-bold text-white/30 hover:text-[#FFCC00] uppercase tracking-wider transition-colors">Tazos</button>
              <button onClick={() => navigate("shop")} className="text-[9px] font-bold text-white/30 hover:text-[#FFCC00] uppercase tracking-wider transition-colors">Shop</button>
              <button onClick={() => navigate("how-to-play")} className="text-[9px] font-bold text-white/30 hover:text-[#FFCC00] uppercase tracking-wider transition-colors">Battle</button>
              <button onClick={() => navigate("faq")} className="text-[9px] font-bold text-white/30 hover:text-[#FFCC00] uppercase tracking-wider transition-colors">FAQ</button>
              <button onClick={() => navigate("privacy")} className="text-[9px] font-bold text-white/30 hover:text-[#FFCC00] uppercase tracking-wider transition-colors">Privacy</button>
              <button onClick={() => navigate("terms")} className="text-[9px] font-bold text-white/30 hover:text-[#FFCC00] uppercase tracking-wider transition-colors">Terms</button>
              <button onClick={() => navigate("contact")} className="text-[9px] font-bold text-white/30 hover:text-[#FFCC00] uppercase tracking-wider transition-colors">Contact</button>
              <span className="text-white/10">|</span>
              <a href="https://x.com/tazosgame" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter"
                className="flex items-center justify-center w-6 h-6 rounded-full border border-white/15 text-zinc-400 hover:text-[#FFCC00] hover:border-[#FFCC00]/50 transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://www.reddit.com/r/tradingtazosgame/" target="_blank" rel="noopener noreferrer" aria-label="Reddit"
                className="flex items-center justify-center w-6 h-6 rounded-full border border-white/15 text-zinc-400 hover:text-[#FFCC00] hover:border-[#FFCC00]/50 transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.6 12.6c0 .663-.537 1.2-1.2 1.2-.315 0-.603-.12-.816-.318A5.952 5.952 0 0 1 12 15.6a5.952 5.952 0 0 1-4.584-2.118A1.19 1.19 0 0 1 6.6 13.8c-.663 0-1.2-.537-1.2-1.2s.537-1.2 1.2-1.2c.315 0 .603.12.816.318a5.956 5.956 0 0 1 3.384-1.788l.72-3.384 2.94.624c.039-.327.312-.582.648-.582.363 0 .66.297.66.66s-.297.66-.66.66c-.234 0-.438-.123-.552-.306l-2.496-.528-.576 2.706a5.96 5.96 0 0 1 3.492 1.794c.213-.198.501-.318.816-.318.663 0 1.2.537 1.2 1.2zM9.6 13.2c-.48 0-.84.36-.84.84 0 .48.36.84.84.84s.84-.36.84-.84c0-.48-.36-.84-.84-.84zm4.8 0c-.48 0-.84.36-.84.84 0 .48.36.84.84.84s.84-.36.84-.84c0-.48-.36-.84-.84-.84zm-2.88 3.54c.48 0 .96.12 1.44.36.48-.24.96-.36 1.44-.36.18 0 .36-.18.36-.36s-.18-.36-.36-.36c-.66 0-1.26.18-1.74.48-.3-.18-.66-.3-1.14-.3s-.84.12-1.14.3c-.48-.3-1.08-.48-1.74-.48-.18 0-.36.18-.36.36s.18.36.36.36z"/></svg>
              </a>
              <a href="https://t.me/tradingtazosgame" target="_blank" rel="noopener noreferrer" aria-label="Telegram"
                className="flex items-center justify-center w-6 h-6 rounded-full border border-white/15 text-zinc-400 hover:text-[#FFCC00] hover:border-[#FFCC00]/50 transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.96 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.696.064-1.225-.46-1.9-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.24-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.1-.002.321.023.465.14.121.099.155.233.171.328.016.095.036.31.02.482z"/></svg>
              </a>
              <a href="https://discord.gg/4mUhnc2REb" target="_blank" rel="noopener noreferrer" aria-label="Discord"
                className="flex items-center justify-center w-6 h-6 rounded-full border border-white/15 text-zinc-400 hover:text-[#5865F2] hover:border-[#5865F2]/50 transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
              </a>
              <a href="https://www.instagram.com/tradingtazosgame/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="flex items-center justify-center w-6 h-6 rounded-full border border-white/15 text-zinc-400 hover:text-[#E4405F] hover:border-[#E4405F]/50 transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            </div>
            <span className="text-[8px] font-black text-white/15 uppercase tracking-[0.3em]">© 2026 Trading Tazos Game · v0.5.0</span>
          </div>
        </footer>

        <div className="absolute bottom-0 left-0 right-0 h-2 mag-stripes opacity-20 pointer-events-none" />
      </div>
    </>
  )
}
