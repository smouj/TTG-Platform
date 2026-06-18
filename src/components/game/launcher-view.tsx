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
import Image from "next/image"
import WikiLauncherContent from "@/components/wiki/WikiLauncherContent"

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
import { FRANCHISES, FRANCHISE_BY_SLUG, TOTAL_PLANNED } from "@/lib/franchise-config"
import { SITE_CONFIG } from "@/lib/site-config"
import { PRIVACY_SECTIONS, TERMS_SECTIONS, COOKIE_SECTIONS } from "@/lib/legal-content"
import BagCardMini3D from "@/components/game/3d/bag-card-mini-3d"
import dynamic from "next/dynamic"
const WebGLGuard = dynamic(() => import("@/components/game/webgl-guard"), { ssr: false })
import { FAQ_ENTRIES } from "@/lib/faq-content"
import { DOWNLOAD_PLATFORMS, DOWNLOAD_RELEASE } from "@/lib/downloads"
import { CreditShop } from "@/components/shop/credit-shop"
import { RewardedAdButton } from "@/components/shop/rewarded-ad"
import { Skeleton } from "@/components/ui/loading-skeletons"

// ── Types ──

type PageId = "home"
  | "how-to-play"
  | "collections" | "collections-minimon" | "collections-cybermon" | "collections-dracobell"
  | "tazos"
  | "leaderboard"
  | "download"
  | "faq"
  | "shop"
  | "wiki"
  | "privacy" | "terms" | "cookies" | "contact" | "refund-policy" | "disclaimer"

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
  "refund-policy": "Refund Policy",
  wiki: "Wiki",
  disclaimer: "Disclaimer",
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

  const [showSkip, setShowSkip] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 2000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer"
      style={{ background: "var(--ttg-cream)" }}
      onClick={() => onFinish()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onFinish() }}
      aria-label="Skip splash screen">
      <div className="mag-dots absolute inset-0 opacity-30" />
      <div className={`relative transition-all duration-600 ${
        phase === "cover" ? "scale-100 opacity-100" : "scale-90 opacity-70"
      }`}>
        <div className="absolute -inset-8 sm:-inset-10 flex items-center justify-center pointer-events-none">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-[6px] border-ttg-red/30" />
          <div className="absolute w-20 h-20 sm:w-28 sm:h-28 rounded-full border-[4px] border-ttg-yellow/40" />
          <div className="absolute w-16 h-16 sm:w-24 sm:h-24 rounded-full border-[3px] border-ttg-red/20" />
        </div>
        <Image
          src="/logo/logo-icon-black.webp"
          alt="Trading Tazos"
          width={144}
          height={144}
          className="w-28 h-28 sm:w-36 sm:h-36 relative z-10"
          loading="lazy"
          style={{ filter: "drop-shadow(6px 6px 0 rgba(26,26,26,0.3))" }}
        />
      </div>
      <h1 className="mt-5 text-3xl sm:text-5xl font-black text-ttg-black uppercase tracking-[0.1em] text-center leading-none"
        style={{ textShadow: "3px 3px 0 rgba(227,53,13,0.3)" }}>
        TRADING<span className="text-ttg-red">TAZOS</span><span className="text-ttg-black">GAME</span>
      </h1>
      <div className={`mt-2 flex items-center gap-2 transition-all duration-500 ${
        phase === "cover" ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
      }`}>
        <span className="w-3 h-[2px] bg-ttg-black" />
        <span className="text-[10px] sm:text-xs font-black text-ttg-black/50 uppercase tracking-[0.4em]">
          Official Game (Beta)
        </span>
        <span className="w-3 h-[2px] bg-ttg-black" />
      </div>
      <div className={`mt-8 transition-all duration-500 ${
        phase === "flip" ? "opacity-100" : "opacity-0"
      }`}>
        <div className="relative w-56 sm:w-72 h-3 border-2 border-ttg-black overflow-hidden"
          style={{
            background: "repeating-linear-gradient(-45deg, var(--ttg-yellow), var(--ttg-yellow) 6px, #F0A800 6px, #F0A800 12px)",
          }}>
          <div className="absolute inset-0 bg-ttg-black transition-all duration-75"
            style={{ left: `${Math.min(progress, 100)}%` }} />
        </div>
        <p className="mt-2 text-[9px] font-black text-ttg-black/40 text-center uppercase tracking-[0.3em]">
          Loading magazine #{phase === "cover" ? "001" : Math.floor(progress / 10) + 1}...
        </p>
      </div>
      {showSkip && (
        <p className="absolute bottom-8 text-[10px] font-black text-ttg-black/20 uppercase tracking-[0.3em] animate-pulse select-none">
          Click to skip
        </p>
      )}
    </div>
  )
}

// ── Shared sub-components ──

function PlatformBadge({ icon: Icon, label }: { icon: typeof Monitor; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 border-2 border-ttg-black bg-white"
      style={{ boxShadow: "2px 2px 0 var(--ttg-black)" }}>
      <Icon className="w-3 h-3 text-ttg-black" />
      <span className="text-[9px] font-black text-ttg-black uppercase tracking-wider">{label}</span>
    </div>
  )
}

function StatBadge({ number, label, color }: { number: string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 border-2 border-ttg-black bg-white"
      style={{ boxShadow: `3px 3px 0 ${color}40` }}>
      <span className="text-base sm:text-lg md:text-xl font-black text-ttg-black leading-none">{number}</span>
      <span className="text-[8px] sm:text-[9px] font-black text-ttg-black/55 uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  )
}

function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={onBack}
        className="flex items-center justify-center w-8 h-8 border-2 border-ttg-black bg-white hover:bg-ttg-cream active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        style={{ boxShadow: "2px 2px 0 var(--ttg-black)" }}
      >
        <ArrowLeft className="w-4 h-4 text-ttg-black" />
      </button>
      <h2 className="text-xl sm:text-2xl font-black text-ttg-black uppercase tracking-[0.05em]">{title}</h2>
    </div>
  )
}

function SectionCard({ step, color, title, children, bgColor, preview }: {
  step?: number; color: string; title: string; children: React.ReactNode; bgColor?: string
  preview?: React.ReactNode
}) {
  return (
    <div className="border-2 border-ttg-black bg-white overflow-hidden"
      style={{ boxShadow: "4px 4px 0 var(--ttg-black)" }}>
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        {step && (
          <span className="inline-flex items-center justify-center w-10 h-10 border-2 border-ttg-black text-lg font-black text-white flex-shrink-0"
            style={{ background: bgColor || color }}>{step}</span>
        )}
        <h3 className="text-base font-black uppercase text-ttg-black">{title}</h3>
      </div>
      {preview && (
        <div className="relative border-t-2 border-b-2 border-ttg-black/10 bg-ttg-paper overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 mag-stripes opacity-20 z-10" />
          <div className="p-3 flex items-center justify-center">
            {preview}
          </div>
        </div>
      )}
      <div className="text-xs font-bold text-ttg-black/60 space-y-1.5 leading-relaxed px-5 pb-5 pt-3">
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
            <div className="w-6 h-6 rounded-full border-2 border-ttg-black/20 flex items-center justify-center"><User className="w-3 h-3 text-ttg-black/40" /></div>
            <span className="text-[10px] font-black text-ttg-black/30 uppercase">Name</span>
            <div className="w-28 h-5 border-2 border-ttg-yellow/30 bg-ttg-cream" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-ttg-black/20 flex items-center justify-center"><Mail className="w-3 h-3 text-ttg-black/40" /></div>
            <span className="text-[10px] font-black text-ttg-black/30 uppercase">Email</span>
            <div className="w-28 h-5 border-2 border-ttg-black/10 bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-ttg-black/20 flex items-center justify-center"><Key className="w-3 h-3 text-ttg-black/40" /></div>
            <span className="text-[10px] font-black text-ttg-black/30 uppercase">Pass</span>
            <div className="w-28 h-5 border-2 border-ttg-black/10 bg-white flex items-center px-2">
              <span className="text-[7px] text-ttg-black/15">••••••••••</span>
            </div>
          </div>
        </div>
        <div className="h-12 w-px border-l-2 border-dashed border-ttg-yellow/30" />
        {/* Result: credits + badge */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full border-3 border-ttg-success bg-ttg-success/10 flex items-center justify-center">
            <Gift className="w-5 h-5 text-ttg-success" />
          </div>
          <span className="text-[8px] font-black text-ttg-success uppercase">30 Free Bags!</span>
          <span className="text-[7px] font-bold text-ttg-black/30">+100 CREDITS</span>
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
          <div className="w-14 h-16 border-2 border-ttg-rarity-common bg-ttg-rarity-common/5 flex flex-col items-center justify-center relative overflow-hidden"
            style={{ boxShadow: "2px 2px 0 #9CA3AF30" }}>
            <span className="text-[7px] font-black text-ttg-rarity-common uppercase mt-1">Std</span>
            <span className="text-[6px] font-bold text-ttg-rarity-common/50">100 CREDITS</span>
            <div className="absolute -bottom-1 left-0 right-0 h-3 bg-ttg-rarity-common/10 border-t border-ttg-rarity-common/20" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 items-center">
          <div className="w-14 h-16 border-2 border-ttg-rarity-rare bg-ttg-rarity-rare/5 flex flex-col items-center justify-center relative overflow-hidden"
            style={{ boxShadow: "2px 2px 0 #3B82F630" }}>
            <span className="text-[7px] font-black text-ttg-rarity-rare uppercase mt-1">Prem</span>
            <span className="text-[6px] font-bold text-ttg-rarity-rare/50">100 CREDITS</span>
            <div className="absolute -bottom-1 left-0 right-0 h-3 bg-ttg-rarity-rare/10 border-t border-ttg-rarity-rare/20" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 items-center">
          <div className="w-14 h-16 border-2 border-ttg-purple bg-ttg-purple/5 flex flex-col items-center justify-center relative overflow-hidden"
            style={{ boxShadow: "2px 2px 0 #A855F730" }}>
            <span className="text-[7px] font-black text-ttg-purple uppercase mt-1">Mega</span>
            <span className="text-[6px] font-bold text-ttg-purple/50">100 CREDITS</span>
            <div className="absolute -bottom-1 left-0 right-0 h-3 bg-ttg-purple/10 border-t border-ttg-purple/20" />
          </div>
        </div>
      </div>
      <div className="text-[18px] text-ttg-dracobell/40">→</div>
      {/* Resulting tazos */}
      <div className="flex items-center -space-x-3">
        {tazos.length > 0 ? tazos.map((t: any, i: number) => (
          <div key={t.id || i} className="w-12 h-12 rounded-full border-2 border-white/5 bg-transparent overflow-hidden flex-shrink-0 relative"
            style={{ zIndex: 4 - i }}>
            {t.imageUrl ? (
              <TazoDiscImage src={t.imageUrl} alt={t.displayName || t.name} size="100%" borderWidth={0} scale={0.88}
                franchiseSlug={t.franchiseSlug || t.franchise?.slug} finish={t.finish} creatureVariant={t.creatureVariant} shinyImageUrl={t.shinyImageUrl}
                className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[7px] font-black text-ttg-black/15">?</div>
            )}
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
              style={{ background: { common: "var(--ttg-rarity-common)", uncommon: "var(--ttg-success)", rare: "var(--ttg-rarity-rare)", "ultra-rare": "var(--ttg-purple)", legendary: "var(--ttg-warning)" }[t.rarity] || "var(--ttg-rarity-common)" }} />
          </div>
        )) : (
          <>
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-ttg-dracobell/20 bg-ttg-dracobell/5 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-ttg-dracobell/40" />
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-ttg-dracobell/15 bg-ttg-dracobell/5 flex items-center justify-center" />
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-ttg-dracobell/10 bg-ttg-dracobell/5 flex items-center justify-center" />
          </>
        )}
      </div>
    </div>
  )
}

function DeckPreview({ tazos }: { tazos: any[] }) {
  const displayTazos = tazos.length >= 3 ? tazos.slice(0, 3) : [
    { id: "p1", name: "ATK", color: "var(--ttg-red)", label: "ATK", value: 78 },
    { id: "p2", name: "DEF", color: "var(--ttg-rarity-rare)", label: "DEF", value: 65 },
    { id: "p3", name: "SPD", color: "var(--ttg-success)", label: "SPD", value: 82 },
  ]
  return (
    <div className="flex items-center gap-6 py-3">
      {/* Tazo cards in a row */}
      <div className="flex items-center -space-x-2">
        {displayTazos.map((t: any, i: number) => (
          <div key={t.id || i} className="w-14 h-14 rounded-full border-2 border-white/5 bg-transparent overflow-hidden flex-shrink-0"
            style={{ zIndex: 3 - i }}>
            {t.imageUrl ? (
              <TazoDiscImage src={t.imageUrl} alt={t.displayName || t.name} size="100%" borderWidth={0} scale={0.88}
                franchiseSlug={t.franchiseSlug || t.franchise?.slug} finish={t.finish} creatureVariant={t.creatureVariant} shinyImageUrl={t.shinyImageUrl}
                className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: (t.color || "var(--ttg-blue)") + "10" }}>
                <span className="text-[10px] font-black" style={{ color: t.color || "var(--ttg-blue)" }}>{t.label || "?"}</span>
              </div>
            )}
          </div>
        ))}
        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 5 - displayTazos.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="w-14 h-14 rounded-full border-2 border-dashed border-ttg-blue/15 bg-ttg-blue/5 flex items-center justify-center flex-shrink-0"
            style={{ zIndex: 1 }}>
            <span className="text-[20px] text-ttg-blue/10">+</span>
          </div>
        ))}
      </div>
      {/* Mini stat bars */}
      <div className="flex-1 space-y-1 min-w-[120px]">
        {[
          { label: "ATK", value: 78, color: "var(--ttg-red)" },
          { label: "DEF", value: 64, color: "var(--ttg-rarity-rare)" },
          { label: "CTRL", value: 71, color: "var(--ttg-yellow)" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="text-[7px] font-black text-ttg-black/25 w-8">{s.label}</span>
            <div className="flex-1 h-2 bg-ttg-black/5 overflow-hidden border border-ttg-black/10">
              <div className="h-full transition-all" style={{ width: `${s.value}%`, background: s.color }} />
            </div>
            <span className="text-[7px] font-black text-ttg-black/40 w-5 text-right">{s.value}</span>
          </div>
        ))}
        <div className="text-[6px] font-bold text-ttg-black/20 text-right pt-0.5">+6 more stats</div>
      </div>
    </div>
  )
}

function ArenaPreview({ tazos }: { tazos: any[] }) {
  return (
    <div className="flex items-center justify-center gap-6 py-3 w-full">
      {/* Mini arena diagram */}
      <div className="relative w-40 h-32 border-2 border-ttg-red/20 rounded-full bg-ttg-red/3 flex items-center justify-center overflow-hidden"
        style={{ boxShadow: "inset 0 0 20px rgba(229,53,13,0.05)" }}>
        {/* Outer ring (arena boundary) */}
        <div className="absolute inset-2 border border-dashed border-ttg-red/10 rounded-full" />
        <div className="absolute inset-6 border border-dashed border-ttg-red/8 rounded-full" />
        {/* Center circle */}
        <div className="w-10 h-10 rounded-full border-2 border-ttg-red/40 bg-ttg-red/5 flex items-center justify-center">
          <span className="text-[7px] font-black text-ttg-red/40 uppercase">CIRCLE</span>
        </div>
        {/* Staked tazos */}
        <div className="absolute top-[35%] left-[25%] w-7 h-7 rounded-full border-2 border-ttg-player/50 bg-ttg-player/5 flex items-center justify-center">
          <Swords className="w-3 h-3 text-ttg-player/60" />
        </div>
        <div className="absolute top-[35%] right-[25%] w-7 h-7 rounded-full border-2 border-ttg-opponent/50 bg-ttg-opponent/5 flex items-center justify-center">
          <Shield className="w-3 h-3 text-ttg-opponent/60" />
        </div>
        {/* Crosshair */}
        <div className="absolute bottom-[15%] left-[45%] w-4 h-4 flex items-center justify-center">
          <div className="w-4 h-4 relative">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-ttg-yellow" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-ttg-yellow" />
          </div>
        </div>
        {/* Tazo in flight */}
        {tazos.length > 0 && tazos[0].imageUrl ? (
          <div className="absolute top-[10%] left-[50%] w-6 h-6 rounded-full overflow-hidden border border-ttg-yellow/40 -translate-x-3 animate-bounce"
            style={{ boxShadow: "0 0 8px rgba(255,204,0,0.3)", background: "transparent" }}>
            <TazoDiscImage src={tazos[0].imageUrl} alt="" size="100%" borderWidth={0} scale={0.88}
              franchiseSlug={tazos[0].franchiseSlug || tazos[0].franchise?.slug}
              finish={tazos[0].finish} creatureVariant={tazos[0].creatureVariant} shinyImageUrl={tazos[0].shinyImageUrl}
              className="w-full h-full" />
          </div>
        ) : (
          <div className="absolute top-[10%] left-[50%] w-6 h-6 rounded-full bg-ttg-yellow/20 border border-ttg-yellow/30 -translate-x-3 flex items-center justify-center animate-pulse">
            <Zap className="w-3 h-3 text-ttg-yellow" />
          </div>
        )}
      </div>
      {/* Phase indicators */}
      <div className="flex flex-col gap-1.5">
        {[
          { label: "AIM", Icon: Crosshair, color: "var(--ttg-yellow)" },
          { label: "CHARGE", Icon: Zap, color: "#FF8800" },
          { label: "SLAM", Icon: Zap, color: "var(--ttg-red)" },
        ].map(p => (
          <div key={p.label} className="flex items-center gap-1.5 px-2 py-1 border"
            style={{ borderColor: p.color + "25", background: p.color + "08" }}>
            <p.Icon className="w-3 h-3" style={{ color: p.color }} />
            <span className="text-[8px] font-black text-ttg-black/40 uppercase">{p.label}</span>
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
        { tier: "Gold", color: "var(--ttg-yellow)" },
        { tier: "Platinum", color: "var(--ttg-purple)" },
      ].map(a => (
        <div key={a.tier} className="flex flex-col items-center gap-1 px-3 py-2 border-2"
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
      <div className="text-lg text-ttg-success/30 font-black">→</div>
      {/* Reward */}
      <div className="flex flex-col items-center gap-1 px-3 py-2 border-2 border-ttg-success/30 bg-ttg-success/05">
        <Coins className="w-5 h-5 text-ttg-success" />
        <span className="text-[7px] font-black text-ttg-success uppercase">+CREDITS</span>
      </div>
      {/* Quest counter */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[28px] font-black text-ttg-black/10 leading-none">17</span>
        <span className="text-[7px] font-bold text-ttg-black/25 uppercase">Quests</span>
      </div>
      <div className="flex flex-col items-center gap-1 ml-1">
        <span className="text-[28px] font-black text-ttg-black/10 leading-none">18</span>
        <span className="text-[7px] font-bold text-ttg-black/25 uppercase">Achievements</span>
      </div>
    </div>
  )
}

// ── Preview Slider (home page) ──

// ══════════════════════════════════════════════════════════
// PAGE CONTENT COMPONENTS
// ── Home Hero (Launcher Redesign v3) ──

const RARITY_GRADIENTS: Record<string, { bg: string; text: string }> = {
  common: { bg: "#9CA3AF15", text: "var(--ttg-rarity-common)" },
  uncommon: { bg: "#22C55E15", text: "var(--ttg-success)" },
  rare: { bg: "#3B82F615", text: "var(--ttg-rarity-rare)" },
  "ultra-rare": { bg: "rgba(var(--ttg-purple-ch), 0.08)", text: "var(--ttg-purple)" },
  ultra: { bg: "rgba(var(--ttg-purple-ch), 0.08)", text: "var(--ttg-purple)" },
  legendary: { bg: "#F59E0B15", text: "var(--ttg-warning)" },
}

function FeaturedTazoCard({ tazo, featured }: { tazo: any; featured?: boolean }) {
  const [open, setOpen] = useState(false)
  const rarityKey = (tazo.rarity || "common").replace("ultra-rare", "ultra")
  const rarityColor = RARITY_GRADIENTS[rarityKey] || RARITY_GRADIENTS.common
  const size = "w-[58px] h-[58px] sm:w-[70px] sm:h-[70px]"

  return (
    <>
      <button onClick={() => setOpen(true)}
        className={`${size} rounded-full border-2 border-ttg-black/10 bg-black/[0.03] transition-all duration-200 hover:scale-110 hover:-translate-y-1 hover:border-ttg-black/30 ${featured ? "ring-1 ring-ttg-yellow/20" : ""}`}
        style={{ boxShadow: featured ? "2px 4px 8px rgba(0,0,0,0.12)" : "2px 3px 6px rgba(0,0,0,0.08)" }}>
        {tazo.imageUrl ? (
          <TazoDiscImage
            src={tazo.imageUrl} alt={tazo.displayName || tazo.name || ""} size="100%" borderWidth={0} scale={0.88}
            franchiseSlug={typeof tazo.franchise === "string" ? tazo.franchise : tazo.franchiseSlug}
            finish={tazo.finish} creatureVariant={tazo.creatureVariant} shinyImageUrl={tazo.shinyImageUrl} lazy />
        ) : (
          <div className="w-full h-full rounded-full flex items-center justify-center bg-ttg-black/5 text-[8px] font-black text-ttg-black/15">?</div>
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
    fetch("/api/stats")
      .then(r => r.json())
      .then(d => setRealTazoCount(d.totalTazos || null))
      .catch(() => {})
  }, [])

  const displayTazos = featuredTazos.slice(0, 8)
  const countLabel = realTazoCount ? `${realTazoCount} Tazos Available` : "Collect. Trade. Battle."
  const totalDesignedLabel = ""

  return (
    <div className="max-w-6xl mx-auto w-full px-3 sm:px-6">
      <div className="flex flex-col justify-center py-6 sm:py-10">

      {/* ═══ MAGAZINE COVER SPREAD ═══ */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-10">

        {/* ── LEFT: MASTHEAD + IDENTITY ── */}
        <div className="flex flex-col items-center md:items-start gap-4 sm:gap-5 shrink-0 md:w-[340px] lg:w-[400px] relative">
          {/* Ambient glow behind logo */}
          <div className="absolute pointer-events-none" style={{
            background: "radial-gradient(ellipse 300px 200px at 50% 30%, rgba(255,204,0,0.15) 0%, rgba(255,204,0,0.04) 50%, transparent 70%)",
            width: "180%", height: "180%", top: "-40%", left: "-40%"
          }} />

          {/* Magazine-style masthead */}
          <div className="relative flex flex-col items-center md:items-start gap-1">
            {/* Top label bar — magazine issue line */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[8px] sm:text-[9px] font-black text-ttg-red uppercase tracking-[0.25em] bg-ttg-red/8 px-2 py-0.5 border border-ttg-red/20">
                FREE-TO-PLAY
              </span>
              <span className="text-[8px] sm:text-[9px] font-black text-ttg-black/25 uppercase tracking-[0.15em]">
                BETA
              </span>
            </div>

            {/* Logo + Title as a unified block */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Image src="/logo/logo-icon-black.webp" alt="TTG" width={112} height={112}
                className="w-14 h-14 sm:w-18 sm:h-18 md:w-24 md:h-24 lg:w-28 lg:h-28 drop-shadow-[5px_5px_0_rgba(26,26,26,0.25)] shrink-0" priority />
              <div className="leading-none">
                <h1 className="text-[2rem] sm:text-[2.25rem] md:text-[2.75rem] lg:text-[3.25rem] font-black text-ttg-black uppercase tracking-[-0.02em] leading-[0.82] text-center md:text-left">
                  <span className="text-ttg-red">TRADING</span><br />
                  <span className="relative inline-block">
                    <span className="text-ttg-yellow" style={{ textShadow: "4px 4px 0 rgba(26,26,26,0.20)" }}>TAZOS</span>
                    <span className="absolute -bottom-0.5 left-0 right-0 h-[3px] bg-ttg-yellow/30" />
                  </span><br />
                  <span className="text-ttg-black tracking-[0.04em]">GAME</span>
                </h1>
              </div>
            </div>

            {/* Tagline */}
            <p className="text-xs sm:text-sm md:text-base font-black text-ttg-black/60 uppercase tracking-[0.08em] text-center md:text-left mt-1.5">
              {countLabel}
            </p>
          </div>

          {/* Description — magazine deck */}
          <p className="relative text-[11px] sm:text-sm font-bold text-ttg-black/55 leading-relaxed max-w-[320px] text-center md:text-left">
            Rip open digital bags, discover 3 original series, build your deck of 5, and slam tazos in a physics-driven 3D battle arena.
          </p>

          {/* CTA Button */}
          <div className="relative mt-1">
            <button onClick={onPlay}
              onMouseEnter={() => setHoverPlay(true)} onMouseLeave={() => { setHoverPlay(false); setPressPlay(false) }}
              onMouseDown={() => setPressPlay(true)} onMouseUp={() => setPressPlay(false)}
              className="relative select-none group/cta"
              style={{ transform: pressPlay ? "translate(3px,3px)" : hoverPlay ? "translate(-2px,-2px)" : "none", transition: "transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
              {/* Shadow brick */}
              <div className="absolute inset-0 translate-x-2 translate-y-2 bg-ttg-black transition-transform group-hover/cta:translate-x-3 group-hover/cta:translate-y-3" />
              {/* Button face */}
              <div className="relative px-12 sm:px-16 py-3.5 sm:py-4 border-[3px] border-ttg-black flex items-center gap-3"
                style={{ background: hoverPlay ? "linear-gradient(180deg, #FFE566 0%, #FFD700 50%, var(--ttg-yellow) 100%)" : "linear-gradient(180deg, var(--ttg-yellow) 0%, #E6B800 100%)" }}>
                <span className="text-lg sm:text-xl font-black text-ttg-black uppercase tracking-[0.12em]">PLAY NOW</span>
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-ttg-black group-hover/cta:animate-pulse" />
              </div>
            </button>
            <p className="text-[8px] font-bold text-ttg-black/20 uppercase tracking-[0.2em] mt-1.5 text-center md:text-left">No download · Free · Instant</p>
          </div>

          {/* Stat chips — magazine factoid bar */}
          <div className="relative flex flex-wrap gap-2 justify-center md:justify-start">
            {[
              { number: `${TOTAL_PLANNED}`, label: "Tazos", color: "var(--ttg-yellow)", tooltip: realTazoCount ? `${realTazoCount} published` : undefined },
              { number: "3", label: "Series", color: "var(--ttg-red)" },
              { number: String(SITE_CONFIG.statsCount), label: "Stats", color: "var(--ttg-yellow)" },
              { number: "Free", label: "Play", color: "var(--ttg-success)" },
            ].map(s => (
              <span key={s.label} title={s.tooltip}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] sm:text-[10px] font-black uppercase border-[2px] border-ttg-black/20 bg-white ${s.tooltip ? "cursor-help" : ""} hover:border-ttg-black/40 transition-colors`}
                style={{ boxShadow: `3px 3px 0 rgba(26,26,26,0.08)` }}>
                <span style={{ color: s.color }} className="text-xs sm:text-sm">{s.number}</span>
                <span className="text-ttg-black/35">{s.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── RIGHT: LAUNCHER + TAZO GALLERY ── */}
        <div className="flex-1 flex flex-col gap-4 sm:gap-5 w-full max-w-[540px] mx-auto md:mx-0">

          {/* PLAYER LAUNCHER card */}
          <div className="border-[3px] border-ttg-black bg-white" style={{ boxShadow: "6px 6px 0 var(--ttg-black)" }}>
            {/* Header bar */}
            <div className="px-4 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2"
              style={{ background: "repeating-linear-gradient(-45deg, var(--ttg-yellow-dim), var(--ttg-yellow-dim) 4px, transparent 4px, transparent 8px)", borderBottom: "3px solid var(--ttg-black)" }}>
              <Swords className="w-4 h-4 text-ttg-black" />
              <span className="text-[10px] font-black text-ttg-black uppercase tracking-[0.2em]">Player Launcher</span>
              <span className="ml-auto text-[8px] font-black text-ttg-success uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-ttg-success animate-pulse" /> {user ? "Online" : "Offline"}
              </span>
            </div>

            <div className="p-3 sm:p-4 space-y-3">
              <div>
                <p className="text-[10px] font-black text-ttg-black/30 uppercase tracking-[0.15em]">{user ? "Ready for battle" : "Practice Arena Ready"}</p>
                <p className="text-[11px] font-bold text-ttg-black/45">{user ? "Signed in — progress saved" : "Play as Guest · Try the arena free!"}</p>
              </div>

              {/* Quick Actions — magazine navigation cards */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: ShoppingBag, label: "Shop", color: "var(--ttg-dracobell)", href: "/?page=shop" },
                  { icon: Swords, label: "Battle", color: "var(--ttg-red)", href: user ? "/app/battle" : "/battle/practice" },
                  { icon: Disc3, label: "Collection", color: "var(--ttg-cybermon)", href: "/?page=collections" },
                  { icon: Medal, label: "Rankings", color: "var(--ttg-success)", href: "/?page=leaderboard" },
                ].map(({ icon: Icon, label, color, href }) => (
                  <Link key={label} href={href}
                    className="flex flex-col items-center gap-1 p-2 sm:p-2.5 border-2 border-ttg-black/8 hover:border-ttg-black/25 bg-white hover:bg-ttg-cream/60 transition-all group/qk">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border-2 border-ttg-black/10 bg-white group-hover/qk:scale-110 transition-transform">
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color }} />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-black text-ttg-black uppercase tracking-wider">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ FEATURED TAZOS GALLERY ═══ */}
          {displayTazos.length > 0 && (
            <div className="border-[3px] border-ttg-black bg-white" style={{ boxShadow: "5px 5px 0 var(--ttg-black)" }}>
              {/* Gallery header */}
              <div className="px-4 py-2.5 flex items-center gap-2"
                style={{ background: "repeating-linear-gradient(-45deg, rgba(var(--ttg-warning-ch), 0.03), rgba(var(--ttg-warning-ch), 0.03) 4px, transparent 4px, transparent 8px)", borderBottom: "3px solid var(--ttg-black)" }}>
                <Crown className="w-3.5 h-3.5 text-ttg-warning" />
                <span className="text-[10px] font-black text-ttg-black uppercase tracking-[0.2em]">Featured Tazos</span>
                <span className="ml-auto text-[8px] font-black text-ttg-black/20 uppercase">{realTazoCount ? `${realTazoCount} total` : "Featured"}</span>
              </div>
              <div className="px-3 sm:px-4 py-3 sm:py-3.5">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                  {displayTazos.map((t, i) => (
                    <FeaturedTazoCard key={t.id} tazo={t} featured={i < 2} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>{/* end magazine spread */}

      {/* ═══ BOTTOM TEASER STRIP ═══ */}
      <div className="mt-8 sm:mt-10 pt-8 border-t-2 border-ttg-black/5">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[9px] sm:text-[10px] font-black text-ttg-black/25 uppercase tracking-[0.25em]">
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-ttg-yellow shadow-[0_0_6px_rgba(255,204,0,0.4)]" /> Minimon</span>
          <span className="text-ttg-black/10">·</span>
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-ttg-cybermon shadow-[0_0_6px_rgba(0,180,216,0.4)]" /> Cybermon</span>
          <span className="text-ttg-black/10">·</span>
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-ttg-dracobell shadow-[0_0_6px_rgba(255,107,0,0.4)]" /> Dracobell</span>
          <span className="text-ttg-black/10">·</span>
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-ttg-black/25" /> Cross-Platform</span>
        </div>
      </div>

      </div>
    </div>
  )
}

// ── Home Extra Sections (Launcher v3) ──

function HowItWorksHome() {
  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16">
      {/* Section divider */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-0.5 bg-ttg-black/8" />
        <span className="text-[7px] font-black text-ttg-black/15 uppercase tracking-[0.3em]">How to Start</span>
        <div className="flex-1 h-0.5 bg-ttg-black/8" />
      </div>
      <div className="text-center mb-6">
        <h2 className="text-lg sm:text-xl font-black text-ttg-black uppercase tracking-[0.06em]">How It Works</h2>
        <p className="text-[10px] font-bold text-ttg-black/30 uppercase tracking-wider">Three steps to become a collector</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { step: "1", icon: PackageOpen, title: "Open Bags", desc: "Get random tazos from 3 different series. Start with 30 welcome bags + 100 CREDITS and earn more by winning battles.", color: "var(--ttg-dracobell)" },
          { step: "2", icon: Layers, title: "Build Your Deck", desc: "Choose 5 tazos with 9 combat stats each. Balance attack, defense, and speed for the best results.", color: "var(--ttg-blue)" },
          { step: "3", icon: Swords, title: "Enter the Arena", desc: "Bet one tazo at center, then slam from above. Flip opponent discs to capture them — eliminate their entire deck to win!", color: "var(--ttg-red)" },
        ].map(({ step, icon: Icon, title, desc, color }) => (
          <div key={step} className="border-3 border-ttg-black bg-white p-4 sm:p-5 text-center hover:-translate-y-1 hover:shadow-[5px_5px_0px_var(--ttg-black)] transition-all"
            style={{ boxShadow: "3px 3px 0 var(--ttg-black)" }}>
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 border-3 border-ttg-black mb-3"
              style={{ background: color, boxShadow: "2px 2px 0 var(--ttg-black)" }}>
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="text-xs font-black text-ttg-black/15">STEP {step}</span>
            </div>
            <h3 className="text-sm font-black text-ttg-black uppercase mb-1.5">{title}</h3>
            <p className="text-[10px] sm:text-[11px] font-bold text-ttg-black/45 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function BattlePreviewHome() {
  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pb-12 sm:pb-16">
      {/* Section divider */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-0.5 bg-ttg-black/8" />
        <span className="text-[7px] font-black text-ttg-red/40 uppercase tracking-[0.3em]">Battle System</span>
        <div className="flex-1 h-0.5 bg-ttg-black/8" />
      </div>
      <div className="border-3 border-ttg-black bg-white overflow-hidden" style={{ boxShadow: "5px 5px 0 var(--ttg-black)" }}>
        <div className="px-5 py-3 border-b-3 border-ttg-black flex items-center gap-2"
          style={{ background: "repeating-linear-gradient(-45deg, rgba(var(--ttg-red-ch), 0.06), rgba(var(--ttg-red-ch), 0.06) 4px, transparent 4px, transparent 8px)" }}>
          <Crosshair className="w-4 h-4 text-ttg-red" />
          <h2 className="text-sm font-black text-ttg-black uppercase tracking-[0.06em]">Physics-Based Tazo Battles</h2>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-xs sm:text-sm font-bold text-ttg-black/50 leading-relaxed mb-4">
            Every launch uses impact, spin, bounce and flip mechanics. Aim carefully, control your power and turn each throw into a winning move.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {[
              { icon: Crosshair, label: "Aim", desc: "Lock your target area", color: "var(--ttg-yellow)" },
              { icon: Zap, label: "Charge", desc: "Time your power bar", color: "var(--ttg-dracobell)" },
              { icon: TrendingUp, label: "Impact", desc: "Collisions & bounces", color: "var(--ttg-red)" },
              { icon: Crown, label: "Flip", desc: "Capture rival tazos", color: "var(--ttg-warning)" },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="text-center p-3 sm:p-4 border-2 border-ttg-black/10 hover:border-ttg-black/25 hover:bg-ttg-cream transition-all">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2" style={{ color }} />
                <h4 className="text-[10px] sm:text-xs font-black text-ttg-black uppercase mb-0.5">{label}</h4>
                <p className="text-[8px] sm:text-[9px] font-bold text-ttg-black/35">{desc}</p>
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
  const [stats, setStats] = useState<{totalTazos: number; bySeries: Record<string,number>} | null>(null)

  useEffect(() => {
    // Fetch stats for accurate counts
    fetch("/api/stats")
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
    // Fetch 4 tazos per series for preview
    const franchises = ["minimon", "dracobell", "cybermon"]
    Promise.all(
      franchises.map(f =>
        fetch(`/api/tazos?limit=4&franchise=${f}&publishStatus=published`)
          .then(r => r.json())
          .then(d => ({ franchise: f, tazos: d.tazos || [] }))
          .catch(() => ({ franchise: f, tazos: [] }))
      )
    ).then(results => {
      const bySeries: Record<string, any[]> = {}
      for (const r of results) {
        bySeries[r.franchise] = r.tazos
      }
      setSeriesTazos(bySeries)
    }).catch(() => {})
  }, [])

  const series = [
    { name: "Minimon", slug: "minimon", count: stats?.bySeries?.Minimon ?? 50, planned: FRANCHISE_BY_SLUG.minimon.total, year: 2026, color: "var(--ttg-yellow)", desc: "Natural creatures born from Life Sparks in Luminara. Pathfinders form Bond Marks with them, and each one grows through Blooming." },
    { name: "Dracobell", slug: "dracobell", count: stats?.bySeries?.Dracobell ?? 50, planned: FRANCHISE_BY_SLUG.dracobell.total, year: 2026, color: "var(--ttg-dracobell)", desc: "Martial fighters from Bellora. Roar Aura, clan discipline, Bell Shards, and Dragon Bell mastery." },
    { name: "Cybermon", slug: "cybermon", count: stats?.bySeries?.Cybermon ?? 50, planned: FRANCHISE_BY_SLUG.cybermon.total, year: 2026, color: "var(--ttg-cybermon-alt)", desc: "Living digital monsters from the Neon Grid. Soul Protocols shift through patches, surges, cores, and prime forms." },
  ]

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pb-12 sm:pb-16">
      {/* Section divider */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-0.5 bg-ttg-black/8" />
        <span className="text-[7px] font-black text-ttg-yellow/50 uppercase tracking-[0.3em]">Series</span>
        <div className="flex-1 h-0.5 bg-ttg-black/8" />
      </div>
      <div className="text-center mb-6">
        <h2 className="text-lg sm:text-xl font-black text-ttg-black uppercase tracking-[0.06em]">3 Series · {stats?.totalTazos ?? 150} Tazos Published</h2>
        <p className="text-[10px] font-bold text-ttg-black/30 uppercase tracking-wider">Original TTG lore series</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
        {series.map(s => {
          const tazos = seriesTazos[s.slug] || []
          return (
          <button key={s.slug} onClick={() => onNavigate(`collections-${s.slug}` as PageId)}
            className="text-left border-3 border-ttg-black bg-white overflow-hidden hover:-translate-y-1 hover:shadow-[5px_5px_0px_var(--ttg-black)] transition-all group"
            style={{ boxShadow: "3px 3px 0 var(--ttg-black)" }}>
            {/* Color strip */}
            <div className="h-1.5" style={{ background: s.color }} />
            <div className="p-3 sm:p-4">
              {/* Tazo grid */}
              <div className="flex items-center justify-center gap-2 mb-3">
                {/* Series logo */}
              <div className="flex justify-center mb-2">
                <Image src={`/logo/series-${s.slug}.png`} alt={`${s.name} logo`} width={200} height={80}
                  className="h-7 sm:h-8 object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
              </div>
              {/* Tazo grid */}
              {tazos.slice(0, 3).map((t, i) => (
                  <div key={t.id || i} className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-[3px] border-ttg-black/40 bg-white group-hover:border-ttg-black/80 group-hover:scale-110 group-hover:shadow-lg transition-all" style={{ boxShadow: "0 3px 8px rgba(0,0,0,0.18)" }}>
                    {t.imageUrl ? (
                      <TazoDiscImage src={t.imageUrl} alt={t.name || ''} size="100%" borderWidth={0} scale={0.88}
                        franchiseSlug={t.franchiseSlug || (typeof t.franchise === "string" ? t.franchise : "minimon")}
                        finish={t.finish} creatureVariant={t.creatureVariant} shinyImageUrl={t.shinyImageUrl} lazy />
                    ) : null}
                  </div>
                ))}
              </div>
              <h3 className="text-sm font-black text-ttg-black uppercase">{s.name}</h3>
              <p className="text-[9px] font-bold text-ttg-black/35 mt-0.5">{s.count} of {s.planned} tazos · {s.year}</p>
              <p className="text-[10px] font-bold text-ttg-black/45 mt-1.5 leading-relaxed">{s.desc}</p>
              <p className="mt-2 text-[10px] font-black text-ttg-red uppercase group-hover:underline">View Series →</p>
            </div>
          </button>
        )})}
      </div>
    </div>
  )
}

function DownloadStripHome({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pb-12 sm:pb-16">
      {/* Section divider */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-0.5 bg-ttg-black/8" />
        <span className="text-[7px] font-black text-ttg-black/15 uppercase tracking-[0.3em]">Platforms</span>
        <div className="flex-1 h-0.5 bg-ttg-black/8" />
      </div>

      <div className="border-[3px] border-ttg-black bg-white" style={{ boxShadow: "5px 5px 0 var(--ttg-black)" }}>
        <div className="px-5 py-3 border-b-[3px] border-ttg-black flex items-center gap-2"
          style={{ background: "repeating-linear-gradient(-45deg, rgba(var(--ttg-black-ch), 0.03), rgba(var(--ttg-black-ch), 0.03) 4px, transparent 4px, transparent 8px)" }}>
          <Monitor className="w-4 h-4 text-ttg-black" />
          <h2 className="text-sm font-black text-ttg-black uppercase tracking-[0.06em]">Play Anywhere</h2>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-4">
            <PlatformBadge icon={Globe} label="Browser" />
            <PlatformBadge icon={Monitor} label="Windows" />
            <PlatformBadge icon={Apple} label="macOS" />
            <PlatformBadge icon={Terminal} label="Linux" />
          </div>
          <div className="text-center">
            <button onClick={() => onNavigate("download")}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-black text-ttg-black bg-ttg-yellow uppercase tracking-[0.1em] border-[3px] border-ttg-black hover:bg-ttg-yellow-hover transition-colors"
              style={{ boxShadow: "3px 3px 0 var(--ttg-black)" }}>
              <Download className="w-4 h-4" /> Download for Desktop
            </button>
            <p className="text-[9px] font-bold text-ttg-black/25 uppercase mt-2">Free · No account needed</p>
          </div>
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
      <SectionCard step={1} color="var(--ttg-yellow)" bgColor="var(--ttg-yellow)" title="Create Your Account"
        preview={<SignUpPreview />}>
        <p>Sign up for free — you&apos;ll receive <strong>30 welcome bags + 100 CREDITS</strong> with surprise tazos inside. Open them in the Shop to start your collection. No credit card required — the game is completely free to play.</p>
      </SectionCard>

      <SectionCard step={2} color="var(--ttg-dracobell)" bgColor="var(--ttg-dracobell)" title="Open Bags & Collect Tazos"
        preview={<BagPreview tazos={bagPreview} />}>
        <p>Each bag contains a random tazo from the collection:</p>
        <ul className="list-disc pl-5 space-y-0.5">
          <li><strong>Standard Bags</strong> — Common and uncommon tazos</li>
          <li><strong>Premium Bags</strong> — Better odds for rare tazos</li>
          <li><strong>Mega Bags</strong> — Highest chance for ultra rare and legendary</li>
        </ul>
        <p>Buy more bags with CREDITS earned by winning battles and completing quests.</p>
      </SectionCard>

      <SectionCard step={3} color="var(--ttg-blue)" bgColor="var(--ttg-blue)" title="Build Your Battle Deck"
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

      <SectionCard step={4} color="var(--ttg-red)" bgColor="var(--ttg-red)" title="Enter the Battle Arena"
        preview={<ArenaPreview tazos={arenaPreview} />}>
        <p>Each turn uses the <strong>Vertical Slam</strong> system with 3 phases:</p>
        <ul className="list-disc pl-5 space-y-0.5">
          <li><strong>Aim</strong> — Lock your crosshair on the target area where you want your tazo to land</li>
          <li><strong>Charge</strong> — Time your power bar for maximum slam force</li>
          <li><strong>Tilt</strong> — Angle your throw for precise landing control</li>
        </ul>
        <p>Your tazo drops from above, slamming into the arena. Hit hard enough and you&apos;ll <strong>flip</strong> face-down opponent tazos — capturing them. Each miss costs you your thrown tazo. <strong>Eliminate their deck</strong> to win!</p>
      </SectionCard>

      <SectionCard step={5} color="var(--ttg-success)" bgColor="var(--ttg-success)" title="Complete Quests & Climb Ranks"
        preview={<QuestsPreview />}>
        <p>Earn CREDITS and reputation by completing <strong>17 quests</strong> across 4 categories (Beginner, Daily, Weekly, Special). Unlock <strong>18 achievements</strong> with Bronze → Platinum tiers. Rise through the leaderboard and become the ultimate collector.</p>
      </SectionCard>
    </div>
  )
}

// ── Collections ──

const { minimon: fMinimon, dracobell: fDracobell, cybermon: fCybermon } = FRANCHISE_BY_SLUG

const COLLECTION_DATA = [
  {
    name: "Minimon", slug: "minimon", count: fMinimon.count, total: fMinimon.total, year: 2026, origin: "TazoForge", color: "var(--ttg-yellow)",
    categories: ["Tiny Form", "Trail Form", "Guardian Form", "Mythic Bloom"],
    desc: "Minimon awaken when Life Sparks settle into natural forms across Luminara. Pathfinders don't capture them — they form Bond Marks, travel together, and help each lineage unlock its next Bloom.",
    highlights: ["Life Spark origin", "Pathfinder Bond Marks", `${fMinimon.total} Season 1 tazos`, "Blooming evolution"]
  },
  {
    name: "Dracobell", slug: "dracobell", count: fDracobell.count, total: fDracobell.total, year: 2026, origin: "TazoForge", color: "var(--ttg-dracobell)",
    categories: ["Base Fighter", "Aura Release", "Clan Ascension", "Champion Ascension", "Dragon Bell"],
    desc: "Dracobell warriors train in Bellora, where combat is rhythm, breath, discipline, and will. Their Roar Aura fuels Ascensions as Bell Shards reshape the fate of the clans.",
    highlights: ["Roar Aura resonance", "Bell Shard conflict", `${fDracobell.total} Season 1 tazos`, "Grand Bell Tournament"]
  },
  {
    name: "Cybermon", slug: "cybermon", count: fCybermon.count, total: fCybermon.total, year: 2026, origin: "TazoForge", color: "var(--ttg-cybermon-alt)",
    categories: ["Boot Form", "Link Form", "Overdrive", "Prime Form", "Omega Patch"],
    desc: "Cybermon are living digital creatures with Soul Protocols, born from memory, signals, lost files, and errors that learned to breathe inside the Neon Grid. Linkers synchronize with them through the Link Pulse.",
    highlights: ["Soul Protocol identity", "Null Signal threat", `${fCybermon.total} Season 1 tazos`, "Kernel Tower mystery"]
  },
]

function CollectionsContent({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const [publishedCounts, setPublishedCounts] = useState<Record<string,number> | null>(null)
  const [showcaseTazos, setShowcaseTazos] = useState<Record<string, any[]>>({})

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(d => { if (d.bySeries) setPublishedCounts(d.bySeries) }).catch(() => {})
    // Fetch tazos for all 3 series to populate panels
    Promise.all([
      fetch("/api/tazos?franchise=cybermon&publishStatus=published&limit=4").then(r => r.json()),
      fetch("/api/tazos?franchise=dracobell&publishStatus=published&limit=4").then(r => r.json()),
      fetch("/api/tazos?franchise=minimon&publishStatus=published&limit=4").then(r => r.json()),
    ])
      .then(results => {
        const bySeries: Record<string, any[]> = {}
        for (const d of results) {
          for (const t of (d.tazos || [])) {
            const f = t.franchise || t.franchiseSlug || "minimon"
            if (!bySeries[f]) bySeries[f] = []
            if (bySeries[f].length < 4) bySeries[f].push(t)
          }
        }
        setShowcaseTazos(bySeries)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      <p className="text-xs font-bold text-ttg-black/50 uppercase tracking-wider">
        3 original series · 150 Season 1 tazos · lore-safe TTG canon
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {COLLECTION_DATA.map(c => {
          const backArtUrl = `/tazos-artgen/backs/${c.slug}-back.png`
          const franchiseTazos = showcaseTazos[c.slug] || []
          return (
          <button key={c.slug} onClick={() => onNavigate(`collections-${c.slug}` as PageId)}
            className="text-left border-2 border-ttg-black bg-white overflow-hidden hover:bg-ttg-cream transition-colors group"
            style={{ boxShadow: "4px 4px 0 var(--ttg-black)" }}>
            {/* Series color strip */}
            <div className="h-2" style={{ background: c.color }} />

            {/* Tazo + Back art showcase */}
            <div className="p-3 grid grid-cols-2 gap-2 bg-ttg-cream-light border-b-2 border-ttg-black/10">
              {/* Back art of franchise */}
              <div className="rounded-full overflow-hidden aspect-square flex items-center justify-center bg-white border-2 border-ttg-black/10 shadow-[1px_1px_0px_#1a1a1a10]">
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
                            scale={0.88}
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
                  <span className="text-[7px] font-black text-ttg-black/15 uppercase">FRONT</span>
                )}
              </div>
            </div>

            {/* Info section */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <Image src={`/logo/series-${c.slug}.png`} alt={`${c.name}`} width={200} height={80}
                  className="h-5 object-contain" />
              </div>
              <h3 className="text-lg font-black text-ttg-black uppercase">{c.name}</h3>
              <p className="text-[10px] font-black text-ttg-black/50 mt-0.5">{publishedCounts?.[c.name] ?? c.count} of {c.total} tazos · {c.year} · {c.origin}</p>
              <p className="text-[11px] font-bold text-ttg-black/60 mt-2 leading-relaxed">{c.desc}</p>
              <div className="flex flex-wrap gap-1 mt-3">
                {c.categories.map(cat => (
                  <span key={cat} className="text-[8px] font-black text-white px-2 py-0.5 uppercase"
                    style={{ background: c.color }}>{cat}</span>
                ))}
              </div>
              <ul className="mt-3 space-y-0.5">
                {c.highlights.map((h, i) => (
                  <li key={i} className="text-[10px] font-bold text-ttg-black/50 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: c.color }} /> {h}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[10px] font-black text-ttg-red uppercase group-hover:underline">View Collection →</p>
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
  const [sortBy, setSortBy] = useState<"name"|"rarity"|"attack"|"number">("number")
  const [sortDir, setSortDir] = useState<"asc"|"desc">("asc")
  const [selectedTazo, setSelectedTazo] = useState<any>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailIndex, setDetailIndex] = useState(0)

  const fetchContent = useCallback(async () => {
    fetch(`/api/tazos?limit=200&_t=${Date.now()}`).then(r => r.json()).then(d => {
      setTazos(d.tazos || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  useVisibilityRefresh(fetchContent)

  const rarityOrder: Record<string, number> = { common: 0, uncommon: 1, rare: 2, "ultra-rare": 3, ultra: 3, legendary: 4 }

  const filtered = tazos
    .filter(t =>
      (franchiseFilter === "all" || t.franchise === franchiseFilter) &&
      (!search || (t.displayName || t.name || "").toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a: any, b: any) => {
      const dir = sortDir === "asc" ? 1 : -1
      switch (sortBy) {
        case "name":
          return dir * (a.displayName || a.name || "").localeCompare(b.displayName || b.name || "")
        case "rarity":
          return dir * ((rarityOrder[a.rarity] ?? 0) - (rarityOrder[b.rarity] ?? 0))
        case "attack":
          return dir * ((a.attack || 0) - (b.attack || 0))
        case "number":
        default:
          return dir * ((a.number ?? 999) - (b.number ?? 999))
      }
    })

  const handleTazoClick = (t: any, idx: number) => {
    setSelectedTazo(t)
    setDetailIndex(idx)
    setDetailOpen(true)
  }

  const handleNavDetail = (dir: 1 | -1) => {
    const nextIdx = detailIndex + dir
    if (nextIdx >= 0 && nextIdx < filtered.length) {
      setSelectedTazo(filtered[nextIdx])
      setDetailIndex(nextIdx)
    }
  }

  const fColors: Record<string, { bg: string; badge: string }> = {
    minimon: { bg: "#FFCB0510", badge: "var(--ttg-minimon)" },
    dracobell: { bg: "#FF6B0010", badge: "var(--ttg-dracobell)" },
    cybermon: { bg: "#00A1E910", badge: "var(--ttg-cybermon)" },
  }

  return (
    <>
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Filters + Sorting */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 bg-white border-2 border-ttg-black/10 mag-stripes">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search tazos..."
          className="px-3 py-1.5 text-xs font-bold border-2 border-ttg-black bg-white text-ttg-black placeholder:text-ttg-black/30 outline-none flex-1 min-w-[140px] max-w-[200px]" />
        {["all", "minimon", "dracobell", "cybermon"].map(f => (
          <button key={f} onClick={() => setFranchiseFilter(f)}
            className={`px-3 py-1 text-[10px] font-black uppercase border-2 transition-all ${
              franchiseFilter === f
                ? "bg-ttg-black text-white border-ttg-black"
                : "bg-white text-ttg-black border-ttg-black/15 hover:border-ttg-yellow"
            }`}>{f === "all" ? "All" : f}</button>
        ))}
        {/* Sort controls */}
        <div className="flex items-center gap-1 ml-auto">
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            className="px-2 py-1 text-[9px] font-black uppercase border-2 border-ttg-black bg-white text-ttg-black outline-none cursor-pointer">
            <option value="number">#</option>
            <option value="name">Name</option>
            <option value="rarity">Rarity</option>
            <option value="attack">ATK</option>
          </select>
          <button onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
            className="px-2 py-1 text-[9px] font-black uppercase border-2 border-ttg-black bg-white text-ttg-black hover:bg-ttg-yellow transition-colors"
            title={`Sort ${sortDir === "asc" ? "descending" : "ascending"}`}>
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
        </div>
        <span className="text-[9px] font-black text-ttg-black/25 uppercase">
          {filtered.length} tazos
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-ttg-black/40" /></div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filtered.map((t: any, idx: number) => {
            const f = t.franchise || "minimon"
            const fc = fColors[f] || fColors.minimon
            const rarityColor = {
              common: "var(--ttg-rarity-common)", uncommon: "var(--ttg-success)", rare: "var(--ttg-rarity-rare)",
              "ultra-rare": "var(--ttg-purple)", legendary: "var(--ttg-warning)",
              ultra: "var(--ttg-purple)",
            }[t.rarity] || "var(--ttg-rarity-common)"
            return (
            <button key={t.id} onClick={() => handleTazoClick(t, idx)}
              className="tazo-tilt-card text-left border-2 border-ttg-black/10 bg-white p-2.5 hover:bg-ttg-cream hover:border-ttg-yellow hover:shadow-[3px_3px_0px_var(--ttg-black)] transition-all duration-200 group"
              style={{ perspective: "500px" }}>
              {/* Disc — mouse-tracking tilt */}
              <div className="aspect-square rounded-full overflow-hidden mb-1.5 mx-auto max-w-[92px] relative"
                style={{
                  transition: "transform 0.15s ease-out",
                }}
                onMouseMove={e => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const cx = rect.left + rect.width / 2
                  const cy = rect.top + rect.height / 2
                  const nx = (e.clientX - cx) / (rect.width / 2)
                  const ny = (e.clientY - cy) / (rect.height / 2)
                  e.currentTarget.style.transform = `perspective(500px) rotateX(${-ny * 14}deg) rotateY(${nx * 14}deg) scale(1.06)`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "perspective(500px) rotateX(0deg) rotateY(0deg) scale(1)"
                }}
              >
                {t.imageUrl ? (
                  <TazoDiscImage
                    src={t.imageUrl}
                    alt=""
                    size="100%"
                    borderWidth={0}
                    scale={0.88}
                    franchiseSlug={typeof t.franchise === "string" ? t.franchise : t.franchiseSlug}
                    finish={t.finish}
                    creatureVariant={t.creatureVariant}
                    shinyImageUrl={t.shinyImageUrl}
                    lazy
                  />
                ) : (
                  <Disc3 className="w-6 h-6 absolute inset-0 m-auto text-ttg-black/10" />
                )}
                {/* Rarity dot */}
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-white"
                  style={{ background: rarityColor }} />
              </div>
              <p className="text-[9px] font-black text-ttg-black uppercase truncate">
                {t.displayName || t.name}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[7px] font-bold text-ttg-black/30 uppercase">{t.franchiseName || t.franchise}</span>
                <span className="ml-auto text-[7px] font-black px-1 py-px" style={{ background: `${rarityColor}15`, color: rarityColor }}>
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
        onPrev={detailIndex > 0 ? () => handleNavDetail(-1) : undefined}
        onNext={detailIndex < filtered.length - 1 ? () => handleNavDetail(1) : undefined}
        hasPrev={detailIndex > 0}
        hasNext={detailIndex < filtered.length - 1}
      />
    )}
    </>
  )
}

// ── Shop ──

const BAGS = [
  { type: "classic", name: "Classic Bag", cost: 100, bonusChance: 15, rareBoost: 2, color: "var(--ttg-yellow)", bg: "#FFF8E7", border: "#E5B800", franchise: "minimon", franchiseName: "Minimon", icon: ShoppingBag, tagline: "Original collection tazos", desc: "Classic Minimon tazos with balanced rarity distribution.", rarity: [{ l:"Common",p:48},{l:"Uncommon",p:30},{l:"Rare",p:15},{l:"Ultra Rare",p:5},{l:"Legendary",p:2}] },
  { type: "premium", name: "Premium Bag", cost: 100, bonusChance: 15, rareBoost: 2, color: "var(--ttg-rarity-rare)", bg: "#EFF6FF", border: "#2563EB", franchise: "cybermon", franchiseName: "Cybermon", icon: Star, tagline: "Digital monsters and tech", desc: "Cybermon tazos with digital finishes and balanced rarity.", rarity: [{ l:"Common",p:48},{l:"Uncommon",p:30},{l:"Rare",p:15},{l:"Ultra Rare",p:5},{l:"Legendary",p:2}] },
  { type: "mega", name: "Mega Bag", cost: 100, bonusChance: 15, rareBoost: 2, color: "var(--ttg-dracobell)", bg: "#FFF7ED", border: "#EA580C", franchise: "dracobell", franchiseName: "Dracobell", icon: Zap, tagline: "Legendary auras, top rarity", desc: "Dracobell tazos with legendary finishes and balanced rarity.", rarity: [{ l:"Common",p:48},{l:"Uncommon",p:30},{l:"Rare",p:15},{l:"Ultra Rare",p:5},{l:"Legendary",p:2}] },
]
const RC: Record<string, string> = { Common:"var(--ttg-rarity-common)", Uncommon:"var(--ttg-success)", Rare:"var(--ttg-rarity-rare)","Ultra Rare":"var(--ttg-purple)", Legendary:"var(--ttg-warning)" }

// Strip cache-buster query params before passing to Next.js <Image>
function stripCB(url: string): string { return url.split("?")[0] }

function ShopContent() {
  const [tazosByF, setTazosByF] = useState<Record<string, any[]>>({})
  const [tazosLoading, setTazosLoading] = useState(true)
  useEffect(() => {
    setTazosLoading(true)
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
    }).catch(() => {}).finally(() => setTazosLoading(false))
  }, [])

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 sm:space-y-10">
      {/* Hero */}
      <section className="text-center space-y-2">
        <p className="text-sm sm:text-base text-ttg-black/50 font-bold max-w-lg mx-auto">
          Open bags to discover and collect tazos across 3 series.{" "}
          <span className="text-ttg-black/30">Bags 100 CREDITS each — earn CREDITS by playing or buy packs.</span>
        </p>
        <div className="flex items-center justify-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-black bg-ttg-yellow/10 border border-ttg-yellow/30 text-ttg-black uppercase">
            <Coins className="w-3.5 h-3.5 text-ttg-dracobell" /> 100 CREDITS
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-black bg-ttg-success/10 border border-ttg-success/30 text-ttg-black uppercase">
            <Sparkles className="w-3.5 h-3.5 text-ttg-success" /> Free to Play
          </span>
        </div>
      </section>

      {/* Bag cards */}
      <section className="grid md:grid-cols-3 gap-4 sm:gap-6">
        {BAGS.map(bag => {
          const examples = tazosByF[bag.franchise] || []
          return (
            <div key={bag.type} className="mag-card border-3 border-ttg-black bg-white overflow-hidden" style={{ boxShadow: `4px 4px 0px ${bag.border}40` }}>
              <div className="px-4 sm:px-5 py-4 border-b-2 border-ttg-black/10" style={{ backgroundColor: bag.bg }}>
                {/* 3D Bag Preview */}
                <div className="-mx-4 sm:-mx-5 -mt-4 mb-0 overflow-hidden" style={{ background: "linear-gradient(135deg, #2a2520 0%, #1a1815 50%, #0f0d0a 100%)" }}>
                  <WebGLGuard fallback={
                    <div className="w-full h-[180px] sm:h-[200px] flex items-center justify-center overflow-hidden">
                      <img src={`/textures/bags/${bag.franchise}/bag-${bag.franchise}-front-01.png`}
                        alt={`${bag.name} preview`}
                        className="w-auto h-full object-contain"
                        style={{ imageRendering: "auto" }} />
                    </div>
                  }>
                    <BagCardMini3D
                      frontUrl={`/textures/bags/${bag.franchise}/bag-${bag.franchise}-front-01.png`}
                      backUrl={`/textures/bags/${bag.franchise}/bag-${bag.franchise}-back-01.png`}
                      bagColor={bag.color}
                      franchiseSlug={bag.franchise}
                    />
                  </WebGLGuard>
                </div>
                <div className="flex items-start justify-between mb-2 mt-3">
                  <div className="flex items-center gap-2">
                    {/* Example tazo from this series */}
                    {tazosLoading ? (
                      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                    ) : examples.length > 0 ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-ttg-black/30 flex-shrink-0 bg-white" style={{ boxShadow: "2px 2px 0 var(--ttg-black)" }}>
                        <Image src={stripCB(examples[0].imageUrl || "/tazos-artgen/backs/minimon-back.png")} alt={examples[0].displayName || examples[0].name} width={300} height={300}
                          className="w-full h-full object-cover" />
                      </div>
                    ) : null}
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-ttg-black uppercase leading-tight">{bag.name}</h3>
                      <p className="text-[9px] sm:text-[10px] font-bold text-ttg-black/50">{bag.tagline}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 bg-white px-2 py-1 border-2 border-ttg-black shadow-[2px_2px_0px_var(--ttg-black)]">
                    <Coins className="w-3 h-3 text-ttg-dracobell" />
                    <span className="text-xs font-black text-ttg-black">{bag.cost}</span>
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-ttg-black/60 font-bold leading-relaxed">{bag.desc}</p>

                {/* Rarity bar */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex h-2 overflow-hidden border border-ttg-black/10">
                    {bag.rarity.map(r => (
                      <div key={r.l} className="h-full" style={{ width: `${r.p}%`, backgroundColor: RC[r.l] }} title={`${r.l}: ${r.p}%`} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {bag.rarity.map(r => (
                      <div key={r.l} className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: RC[r.l] }} />
                        <span className="text-[8px] font-bold text-ttg-black/50 uppercase">{r.l}</span>
                        <span className="text-[8px] font-black text-ttg-black">{r.p}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-3 mt-3">
                  <span className="text-[8px] font-black text-ttg-black/40 uppercase">Bonus <span className="text-[10px]" style={{ color: bag.color }}>{bag.bonusChance}%</span></span>
                  <span className="text-[8px] font-black text-ttg-black/40 uppercase">Rare Boost <span className="text-[10px]" style={{ color: bag.color }}>×{bag.rareBoost}</span></span>
                </div>
              </div>

              {/* Franchise + example tazos */}
              <div className="px-4 sm:px-5 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black text-ttg-black/30 uppercase tracking-wider">Series</span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 border border-ttg-black/20" style={{ backgroundColor: bag.bg, color: bag.border }}>{bag.franchiseName}</span>
                </div>
                {/* Example tazo discs */}
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-ttg-black/8">
                  <span className="text-[8px] font-black text-ttg-black/25 uppercase tracking-wider shrink-0">Tazos:</span>
                  <div className="flex gap-1.5">
                    {tazosLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0" />
                      ))
                    ) : examples.length > 0 ? (
                      <>
                        {examples.slice(0, 4).map((t: any, idx: number) => (
                          <div key={t.id || idx} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-ttg-black/15 overflow-hidden flex-shrink-0 hover:border-ttg-yellow hover:scale-110 transition-all bg-white" title={t.displayName || t.name}>
                            <div className="w-full h-full rounded-full overflow-hidden relative">
                              <TazoDiscImage src={t.imageUrl} alt={t.displayName || t.name} size="100%" borderWidth={0} scale={0.88}
                                franchiseSlug={t.franchiseSlug || t.franchise?.slug}
                                finish={t.finish} creatureVariant={t.creatureVariant} shinyImageUrl={t.shinyImageUrl} lazy />
                            </div>
                          </div>
                        ))}
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-dashed border-ttg-black/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[7px] font-black text-ttg-black/25">+more</span>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* ── Monetization ── */}
      <section className="space-y-6">
        <h3 className="text-lg sm:text-xl font-black text-ttg-black uppercase tracking-tight text-center">💎 Earn & Buy CREDITS</h3>
        <p className="text-xs text-ttg-black/40 font-bold text-center max-w-md mx-auto -mt-4">CREDITS unlock bags. Earn them free by watching ads or buy packs to accelerate your collection.</p>
        <RewardedAdWidget />
        <CreditShopWidget />
      </section>

      {/* CTA */}
      <section className="mag-card border-3 border-ttg-black bg-white p-6 sm:p-8 text-center space-y-4 relative overflow-hidden" style={{ boxShadow: "6px 6px 0px #FFCC0040" }}>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg, var(--ttg-black) 0px, var(--ttg-black) 2px, transparent 2px, transparent 12px)" }} />
        <div className="relative z-10 space-y-3">
          <h3 className="text-lg sm:text-2xl font-black text-ttg-black uppercase tracking-tight">Ready to Start Collecting?</h3>
          <p className="text-sm text-ttg-black/50 font-bold max-w-md mx-auto">Sign up free and get starter CREDITS + 30 welcome bags to open. Collect, trade, and battle with 150 tazos across 3 series.</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <a href="/register" className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 text-xs sm:text-sm font-black uppercase tracking-wider bg-ttg-red text-white border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] hover:shadow-[2px_2px_0px_var(--ttg-black)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all">
              Sign Up Free <ArrowRight className="w-4 h-4" />
            </a>
            <a href="/login" className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 text-xs sm:text-sm font-black uppercase tracking-wider bg-white text-ttg-black border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] hover:shadow-[2px_2px_0px_var(--ttg-black)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all">
              Sign In
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Monetization Widgets ──

function RewardedAdWidget() {
  const { user, loading } = useAuth()
  const isAuth = !loading && !!user

  return (
    <RewardedAdButton
      isAuthenticated={isAuth}
      onRewardClaimed={() => {}}
    />
  )
}

function CreditShopWidget() {
  const { user, loading } = useAuth()
  const isAuth = !loading && !!user
  const userCredits = user?.credits ?? 0

  return (
    <CreditShop
      userCredits={userCredits}
      isAuthenticated={isAuth}
    />
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
                ? "bg-ttg-black text-white border-ttg-black shadow-[2px_2px_0px_var(--ttg-yellow)]"
                : "bg-white text-ttg-black border-ttg-black/15"
            }`}><s.icon className="w-3.5 h-3.5" /> {s.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-ttg-black/40" /></div>
      ) : (
        <div className="space-y-1.5">
          {entries.map((e: any, i: number) => {
            const RankIcon = i === 0 ? Crown : i === 1 ? Medal : i === 2 ? Star : undefined
            const rankColor = i === 0 ? "var(--ttg-warning)" : i === 1 ? "var(--ttg-rarity-common)" : i === 2 ? "var(--ttg-warning)" : undefined
            return (
              <div key={e.id || i} className="flex items-center gap-3 px-4 py-2.5 border-2 border-ttg-black bg-white"
                style={{ boxShadow: rankColor ? `3px 3px 0 ${rankColor}30` : undefined }}>
                <span className="w-7 text-center text-sm font-black text-ttg-black/40">{i < 3 ? (RankIcon ? <RankIcon className="w-4 h-4 inline" style={{ color: rankColor }} /> : `#${i + 1}`) : `#${i + 1}`}</span>
                <div className="w-8 h-8 rounded-full bg-ttg-black/10 overflow-hidden flex-shrink-0">
                  {e.avatarUrl && <img src={e.avatarUrl} alt="" className="w-full h-full object-cover" />}
                </div>
                <span className="flex-1 text-xs font-black text-ttg-black truncate">{displayName(e)}</span>
                <span className="text-[11px] font-black text-ttg-yellow">
                  {sort === "credits" ? `${(e.credits || 0).toLocaleString()} CREDITS` :
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

const DESKTOP_PLATFORM_ICONS = {
  windows: { icon: Monitor, color: "#00A4EF" },
  macos: { icon: Apple, color: "var(--ttg-black)" },
  linux: { icon: Terminal, color: "#FCC624" },
}

function DownloadContent() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">

      {/* ═══ SECTION 1: Play Now — Browser ═══ */}
      <div className="border-[3px] border-ttg-black bg-ttg-yellow overflow-hidden"
        style={{ boxShadow: "6px 6px 0 var(--ttg-black)" }}>
        <div className="px-6 py-5 sm:px-8 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-ttg-black flex items-center justify-center">
              <Globe className="w-7 h-7 sm:w-8 sm:h-8 text-ttg-yellow" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-ttg-black uppercase leading-none">
                  Play in Your Browser
                </h2>
                <span className="text-[8px] font-black text-ttg-black bg-white/70 border border-ttg-black/30 px-1.5 py-0.5 uppercase tracking-wider">
                  Available Now
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-ttg-black/70 mt-1 leading-relaxed">
                Create a free account, open your starter bags, build a deck, and jump into the 3D arena — all from your browser.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <Link href="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-black text-ttg-black bg-white uppercase border-2 border-ttg-black hover:bg-ttg-cream transition-colors"
                  style={{ boxShadow: "3px 3px 0 var(--ttg-black)" }}>
                  <Zap className="w-3.5 h-3.5" /> Play Free
                </Link>
                <span className="text-[10px] font-black text-ttg-black/50 uppercase tracking-wider">
                  tradingtazosgame.com
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PWA install hint */}
        <div className="border-t-[3px] border-ttg-black px-6 py-3 sm:px-8 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Smartphone className="w-3.5 h-3.5 text-ttg-black/60" />
            <span className="text-[9px] font-black text-ttg-black/60 uppercase tracking-wider">Install as PWA:</span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-ttg-black/70">
            Open in Safari/Chrome → tap <strong className="text-ttg-black">Share</strong> → <strong className="text-ttg-black">Add to Home Screen</strong> → play fullscreen like a native app!
          </span>
        </div>
      </div>

      {/* ═══ SECTION 2: Mobile App Stores ═══ */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Smartphone className="w-5 h-5 text-ttg-red" />
          <h3 className="text-sm font-black text-ttg-black uppercase tracking-wider">Mobile Apps</h3>
          <span className="text-[8px] font-black text-white bg-ttg-warning px-1.5 py-0.5 uppercase">Coming Soon</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Google Play */}
          <div className="border-2 border-dashed border-ttg-black/20 bg-white p-5 sm:p-6 opacity-75">
            <div className="flex items-center gap-3">
              <div className="shrink-0 w-10 h-10 rounded-sm bg-ttg-black flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                  <path d="M1.752 1.094a.78.78 0 0 0-.257.155.86.86 0 0 0-.235.402C1.09 2.296 1 3.089 1 4v16c0 .915.09 1.706.26 2.349a.86.86 0 0 0 .234.402.78.78 0 0 0 .258.155L13.43 12 1.752 1.094zM14.984 10.53l3.897-3.65a.84.84 0 0 1 .12 1.063l-2.184 3.348a.175.175 0 0 0 0 .204l2.184 3.348a.84.84 0 0 1-.12 1.063l-3.897-3.65a.35.35 0 0 1 0-.528zM1.752 22.906a.86.86 0 0 0 .542.09L13.43 12 1.752 1.094a.86.86 0 0 0-.542.09.85.85 0 0 0-.327.427c-.16.604-.25 1.346-.26 2.254v16.27c.01.908.1 1.65.26 2.254.065.258.184.398.327.427z"/>
                </svg>
              </div>
              <div>
                <div className="text-[9px] font-bold text-ttg-black/40 uppercase tracking-wider">coming to</div>
                <div className="text-base font-black text-ttg-black uppercase leading-tight">Google Play</div>
              </div>
            </div>
            <p className="mt-3 text-[10px] font-bold text-ttg-black/35 leading-relaxed">
              Android app with offline collection viewer, push battle notifications, and exclusive mobile-only tazo drops.
            </p>
          </div>

          {/* App Store */}
          <div className="border-2 border-dashed border-ttg-black/20 bg-white p-5 sm:p-6 opacity-75">
            <div className="flex items-center gap-3">
              <div className="shrink-0 w-10 h-10 rounded-sm bg-ttg-black flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <div>
                <div className="text-[9px] font-bold text-ttg-black/40 uppercase tracking-wider">coming to</div>
                <div className="text-base font-black text-ttg-black uppercase leading-tight">App Store</div>
              </div>
            </div>
            <p className="mt-3 text-[10px] font-bold text-ttg-black/35 leading-relaxed">
              Native iOS experience with haptic feedback, iCloud sync for your collection, Game Center leaderboards, and AR tazo viewer.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ SECTION 3: Desktop Apps ═══ */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Monitor className="w-5 h-5 text-ttg-black" />
          <h3 className="text-sm font-black text-ttg-black uppercase tracking-wider">Desktop Apps</h3>
          <span className="text-[8px] font-black text-white bg-ttg-success px-1.5 py-0.5 uppercase">Available</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {DOWNLOAD_PLATFORMS.map(d => {
            const { icon: Icon, color } = DESKTOP_PLATFORM_ICONS[d.id]
            return (
              <div key={d.id} className="border-2 border-ttg-black bg-white p-5"
                style={{ boxShadow: "4px 4px 0 var(--ttg-black)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <Icon className="w-8 h-8 flex-shrink-0" style={{ color }} />
                  <div>
                    <h4 className="text-sm font-black text-ttg-black uppercase leading-tight">{d.label}</h4>
                    <p className="text-[9px] font-bold text-ttg-black/40">{d.hint}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[9px] font-black text-ttg-black/45 uppercase tracking-wider">
                    Desktop v{d.version}
                  </span>
                  <span className="text-[9px] font-black text-ttg-success uppercase tracking-wider">
                    {d.primary.size}
                  </span>
                </div>
                <a href={d.primary.url}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-black text-white bg-ttg-red uppercase border-2 border-ttg-black hover:bg-ttg-dracobell transition-colors"
                  style={{ boxShadow: "2px 2px 0 var(--ttg-black)" }}>
                  <Download className="w-3.5 h-3.5" /> {d.primary.label}
                </a>
                {d.secondary && (
                  <div className="mt-2 grid gap-1.5">
                    {d.secondary.map(link => (
                      <a key={link.url} href={link.url}
                        className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[9px] font-black text-ttg-black bg-ttg-cream uppercase border border-ttg-black/25 hover:border-ttg-black transition-colors">
                        {link.label} · {link.size}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-2 border-ttg-black/15 bg-white/70 px-4 py-3">
          <span className="text-[10px] font-bold text-ttg-black/55 uppercase tracking-wider">
            Installers are hosted on the official {DOWNLOAD_RELEASE.tag} release. Web game version: v{SITE_CONFIG.version}.
          </span>
          <a href={DOWNLOAD_RELEASE.releaseUrl}
            className="inline-flex items-center gap-1 text-[10px] font-black text-ttg-blue uppercase hover:text-ttg-red transition-colors">
            Release notes <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>


    </div>
  )
}

// ── FAQ ── (source: src/lib/faq-content.ts)

function FAQContent() {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      {FAQ_ENTRIES.map((faq, i) => (
        <details key={i} className="border-2 border-ttg-black bg-white group"
          style={{ boxShadow: "3px 3px 0 var(--ttg-black)" }}>
          <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-ttg-cream transition-colors">
            <HelpCircle className="w-4 h-4 text-ttg-yellow flex-shrink-0" />
            <span className="text-xs font-black text-ttg-black uppercase">{faq.q}</span>
          </summary>
          <p className="px-4 pb-3 text-[11px] font-bold text-ttg-black/60 leading-relaxed">{faq.a}</p>
        </details>
      ))}
    </div>
  )
}

// ── PRIVACY POLICY ──

function PrivacyContent() {
  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <h2 className="text-2xl font-black uppercase text-ttg-black mb-2">Privacy Policy</h2>
      <p className="text-[10px] font-bold text-ttg-black/30 uppercase tracking-wider mb-5">Last updated: June 10, 2026</p>
      <div className="space-y-3">
        {PRIVACY_SECTIONS.map((s, i) => (
          <div key={i} className="border-3 border-ttg-black bg-white p-4" style={{ boxShadow: "3px 3px 0 var(--ttg-black)" }}>
            <h3 className="text-sm font-black uppercase text-ttg-black mb-1.5">{s.title}</h3>
            <p className="text-xs font-bold text-ttg-black/60 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── TERMS OF SERVICE ──

function TermsContent() {
  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <h2 className="text-2xl font-black uppercase text-ttg-black mb-2">Terms of Service</h2>
      <p className="text-[10px] font-bold text-ttg-black/30 uppercase tracking-wider mb-5">Last updated: June 10, 2026</p>
      <div className="space-y-3">
        {TERMS_SECTIONS.map((s, i) => (
          <div key={i} className="border-3 border-ttg-black bg-white p-4" style={{ boxShadow: "3px 3px 0 var(--ttg-black)" }}>
            <h3 className="text-sm font-black uppercase text-ttg-black mb-1.5">{s.title}</h3>
            <p className="text-xs font-bold text-ttg-black/60 leading-relaxed">{s.body}</p>
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
      <h2 className="text-2xl font-black uppercase text-ttg-black mb-2">Cookie Policy</h2>
      <p className="text-[10px] font-bold text-ttg-black/30 uppercase tracking-wider mb-5">Last updated: June 10, 2026</p>
      <div className="space-y-3">
        {COOKIE_SECTIONS.map((s, i) => (
          <div key={i} className="border-3 border-ttg-black bg-white p-4" style={{ boxShadow: "3px 3px 0 var(--ttg-black)" }}>
            <h3 className="text-sm font-black uppercase text-ttg-black mb-1.5">{s.title}</h3>
            <p className="text-xs font-bold text-ttg-black/60 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── CONTACT ──
function ContactContent() {
  const channels = [
    { icon: <Mail className="w-6 h-6" />, title: "Email Support", desc: "For general questions, account help, and gameplay support.", action: "support@tradingtazosgame.com", href: "mailto:support@tradingtazosgame.com", color: "var(--ttg-red)" },
    { icon: <Bug className="w-6 h-6" />, title: "Bug Reports", desc: "Found a bug? Report it on GitHub Issues with steps to reproduce.", action: "GitHub Issues", href: "https://github.com/smouj/Trading-Tazos-Game/issues", color: "var(--ttg-blue)" },
    { icon: <Shield className="w-6 h-6" />, title: "Privacy & Data", desc: "Data deletion requests, privacy questions, and account removal.", action: "support@tradingtazosgame.com", href: "mailto:support@tradingtazosgame.com", color: "var(--ttg-success)" },
    { icon: <HelpCircle className="w-6 h-6" />, title: "Content Removal", desc: "If you believe any content violates our policies, let us know.", action: "support@tradingtazosgame.com", href: "mailto:support@tradingtazosgame.com", color: "var(--ttg-warning)" },
  ]
  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <h2 className="text-2xl font-black uppercase text-ttg-black mb-1 text-center">Contact</h2>
      <p className="text-xs font-bold text-ttg-black/40 text-center mb-5 max-w-md mx-auto">We are here to help. Choose the right channel and we will get back to you within 48 hours.</p>
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        {channels.map((ch, i) => (
          <a key={i} href={ch.href} target={ch.href.startsWith("http") ? "_blank" : undefined} rel={ch.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="border-3 border-ttg-black bg-white p-4 flex items-start gap-3 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_var(--ttg-black)] transition-all group" style={{ boxShadow: "3px 3px 0 var(--ttg-black)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-ttg-black shadow-[2px_2px_0px_var(--ttg-black)]" style={{ background: ch.color, color: "#FFF" }}>{ch.icon}</div>
            <div className="min-w-0">
              <h3 className="text-xs font-black uppercase text-ttg-black mb-0.5">{ch.title}</h3>
              <p className="text-[10px] font-bold text-ttg-black/45 mb-1 leading-relaxed">{ch.desc}</p>
              <span className="text-[9px] font-black text-ttg-red group-hover:underline">{ch.action} →</span>
            </div>
          </a>
        ))}
      </div>
      <div className="p-4 bg-white border-3 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)] text-center" style={{ background: "var(--ttg-yellow)" }}>
        <p className="text-xs font-bold text-ttg-black/60">We typically respond within <strong className="text-ttg-black">24-48 hours</strong> on business days.</p>
      </div>
      <p className="text-center mt-3 text-[10px] font-bold text-ttg-black/30">
        Looking for quick answers? <a href="/?page=faq" className="text-ttg-red underline font-black hover:text-ttg-black">Check our FAQ →</a>
      </p>
    </div>
  )
}

// ── REFUND POLICY ──
function RefundPolicyContent() {
  const sections = [
    { title: "Free-to-Play Game", body: "Trading Tazos Game is a free-to-play browser game. No purchases are required to access all game features, battle modes, and collection mechanics." },
    { title: "In-Game CREDITS", body: "CREDITS are earned through gameplay, daily rewards, and special events. They cannot be purchased with real money. There are no microtransactions or in-game purchases." },
    { title: "Third-Party Advertising", body: "The game displays advertising to support server costs. Ad interactions are governed by the respective ad platform's terms. TTG is not responsible for third-party ad content." },
    { title: "Refunds", body: "As a free-to-play game without purchasable items, there are no refundable transactions. If you donated or contributed funds, please contact support@tradingtazosgame.com." },
    { title: "Policy Updates", body: "This refund policy may be updated. Major changes will be communicated via the website. Last updated: June 2026." },
  ]
  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <h2 className="text-2xl font-black uppercase text-ttg-black mb-2">Refund Policy</h2>
      <p className="text-[10px] font-bold text-ttg-black/30 uppercase tracking-wider mb-5">Last updated: June 10, 2026</p>
      <div className="space-y-3">
        {sections.map((s, i) => (
          <div key={i} className="border-3 border-ttg-black bg-white p-4" style={{ boxShadow: "3px 3px 0 var(--ttg-black)" }}>
            <h3 className="text-sm font-black uppercase text-ttg-black mb-1.5">{s.title}</h3>
            <p className="text-xs font-bold text-ttg-black/60 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── DISCLAIMER ──
function DisclaimerContent() {
  const sections = [
    { title: "Independent Project", body: "Trading Tazos Game is an independent, fictional digital tazo game created and operated by independent developers. It is a passion project built for the community." },
    { title: "No Affiliation", body: "This game is not affiliated with, endorsed by, approved by, or associated with any third-party brand, trademark, company, franchise, or licensed intellectual property." },
    { title: "Original Content", body: "All series (Minimon, Dracobell, Cybermon), characters, creature designs, lore, world-building, names, logos, and game mechanics are original fictional works created for this project." },
    { title: "Coincidental Resemblance", body: "Any resemblance to existing intellectual property, real or fictional, living or dead, is purely coincidental and unintentional." },
    { title: "Free Access", body: "The game is and will remain free-to-play. CREDITS cannot be purchased with real currency. All game features are accessible through gameplay alone." },
    { title: "Fan-Made", body: "Trading Tazos Game is a fan-made collector experience inspired by the culture of collecting, trading, and battling with physical discs. It is a tribute, not a reproduction." },
  ]
  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <h2 className="text-2xl font-black uppercase text-ttg-black mb-2">Disclaimer</h2>
      <p className="text-[10px] font-bold text-ttg-black/30 uppercase tracking-wider mb-5">Last updated: June 10, 2026</p>
      <div className="space-y-3">
        {sections.map((s, i) => (
          <div key={i} className="border-3 border-ttg-black bg-white p-4" style={{ boxShadow: "3px 3px 0 var(--ttg-black)" }}>
            <h3 className="text-sm font-black uppercase text-ttg-black mb-1.5">{s.title}</h3>
            <p className="text-xs font-bold text-ttg-black/60 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// MAIN LAUNCHER COMPONENT
// ══════════════════════════════════════════════════════════

const COLLECTION_DETAILS: Record<string, {
  name: string; count: number; total: number; year: number; origin: string; color: string;
  world: string; worldDesc: string; originStory: string; backStory: string;
  sections: { title: string; items: { name: string; detail: string }[] }[]
  highlights: { name: string; desc: string }[]
  features: string[]; motto: string; cta: string; wikiPath: string
}> = {
  minimon: {
    name: "Minimon", count: FRANCHISE_BY_SLUG.minimon.count, total: FRANCHISE_BY_SLUG.minimon.total, year: 2026, origin: "TazoForge Studios", color: "var(--ttg-yellow)",
    world: "Luminara",
    worldDesc: "Luminara is a luminous land of colorful regions, winding paths, small villages, and places where elemental energy takes shape. It is not medieval or futuristic — it is a world of wonder, discovery, and adventure. Life Spark energy flows through every tree, river, cave, cloud, and mountain, giving birth to the creatures known as Minimon.",
    originStory: "Created in 2026 by TazoForge Studios in Barcelona, the Minimon series was the first original franchise designed for Trading Tazos Game. Inspired by the wonder of discovering creatures in the wild, Minimon captures the magic of companionship between humans and the natural world — where trust, not capture, is the foundation of every bond.",
    backStory: "Centuries ago, Luminara was filled with an invisible energy called Life Spark. This energy flowed through trees, rivers, caves, clouds, and mountains. When Life Spark accumulated in one place for a long time, a Minimon was born from pure elemental essence. But a creeping darkness known as The Stillness now threatens Luminara — it freezes growth, silences hearts, and creates Faded Minimon that lose their color and spirit. Only Pathfinders, bonded through trust, can restore the light.",
    sections: [
      { title: "Blooming Phases", items: [
        { name: "Tiny Form", detail: "Small, tender, and fragile — the first expression of a Life Spark" },
        { name: "Trail Form", detail: "Adventurous with more defined abilities and purpose" },
        { name: "Guardian Form", detail: "Strong, protective, and mature — bonded deeply to a Pathfinder" },
        { name: "Mythic Bloom", detail: "Legendary, rare, nearly one-of-a-kind — Luminara's highest form" },
      ]},
      { title: "Regions of Luminara", items: [
        { name: "Sunnyvale Fields", detail: "Rolling fields, farms, small villages — Normal, Solar, Plant types" },
        { name: "Mossdeep Woods", detail: "Ancient forests with deep roots — Plant, Insect, Earth, Mystic" },
        { name: "Bluefin Coast", detail: "Beaches, reefs, lighthouses — Water, Wind, Soft Ice" },
        { name: "Cinderpop Hills", detail: "Warm hills and volcanic caves — Fire, Rock, Metal" },
        { name: "Stormtail Ridge", detail: "Storm-swept mountain peaks — Electric, Flying, Lesser Dragon" },
        { name: "Moonberry Hollow", detail: "Strange nocturnal zone — Shadow, Dream, Illusion" },
        { name: "Aurora Summit", detail: "Legendary endgame region — Rare forms and guardians" },
      ]},
    ],
    highlights: [
      { name: "Bloomleaf", desc: "A beloved Grass-type starter from Sunnyvale Fields. Its bright petals glow when happy — a symbol of new Pathfinder journeys." },
      { name: "Embertail", desc: "Fire-type from Cinderpop Hills. Fiercely loyal with a flaming tail that intensifies during Blooming." },
      { name: "Stormwhisker", desc: "Electric-type from Stormtail Ridge. Fast, mischievous, and a favorite among competitive Pathfinders." },
      { name: "Luminara Guardian", desc: "A Mythic Bloom form from Aurora Summit. Ultra-rare with prismatic elemental mastery." },
    ],
    features: ["Pathfinders discover, not capture", "Life Spark bonds and Blooming evolution", "Seven unique regions to explore", "The Stillness threatens all of Luminara"],
    motto: "Find them. Bond with them. Watch them bloom.",
    cta: `Browse All ${FRANCHISE_BY_SLUG.minimon.count} Minimon Tazos`,
    wikiPath: "/wiki/minimon",
  },
  dracobell: {
    name: "Dracobell", count: FRANCHISE_BY_SLUG.dracobell.count, total: FRANCHISE_BY_SLUG.dracobell.total, year: 2026, origin: "TazoForge Studios", color: "var(--ttg-dracobell)",
    world: "Bellora",
    worldDesc: "Bellora is a world of combat regions governed by powerful clans. Each clan protects a sacred technique, a martial philosophy, and a fragment of an ancient sonic relic — the Dracobell. Warriors train from youth, channeling their inner Roar Aura through discipline, honor, and the pursuit of ultimate mastery.",
    originStory: "Created in 2026 by TazoForge Studios in Barcelona, the Dracobell series brings martial arts fantasy to the world of Trading Tazos Game. Drawing from the energy of tournament arcs and clan rivalries, Dracobell warriors fight not just for victory — but for the right to reshape their world through the legendary Dracobell's power.",
    backStory: "The Dracobell is a legendary bell forged from meteorite metal and ancient dragon scales. When complete, its ring can awaken the true potential of any warrior. But during the Great Bell War, the Dracobell was shattered. Its fragments — the Bell Shards — scattered across Bellora's regions. Now six great clans compete in the Grand Bell Tournament to gather shards and determine Bellora's fate. But a seventh force, the Silent Clan, works in shadow to prevent the bell's restoration forever.",
    sections: [
      { title: "Ascension Phases", items: [
        { name: "Base Fighter", detail: "The warrior's normal form — discipline, stance, breath" },
        { name: "Aura Release", detail: "First release of inner Roar Aura energy" },
        { name: "Clan Ascension", detail: "Form bonded to the clan, its technique, and its Bell Shard" },
        { name: "Champion Ascension", detail: "High-tournament form — earned through combat" },
        { name: "Dragon Bell", detail: "Legendary form linked to the complete Dracobell" },
      ]},
      { title: "Clans of Bellora", items: [
        { name: "Ember Fist", detail: "Ember Valley — Fire, direct attack" },
        { name: "Storm Fang", detail: "Storm Peaks — Lightning, speed" },
        { name: "Iron Horn", detail: "Iron Plateau — Defense, endurance" },
        { name: "Frost Scale", detail: "Frost Temple — Control, precision" },
        { name: "Shadow Claw", detail: "Shadow Basin — Counterattack, stealth" },
        { name: "Golden Roar", detail: "Golden Shrine — Aura, mastery" },
      ]},
    ],
    highlights: [
      { name: "Kael Emberfist", desc: "Fiery striker from Ember Fist Clan. Hot-headed but honorable, his blazing fists have won three regional tournaments." },
      { name: "Ryn Stormfang", desc: "Lightning-fast duelist from Storm Fang. Known for her impossible speed and the 'Thunder Step' technique." },
      { name: "Torun Ironhorn", desc: "Unbreakable defender from Iron Horn. His endurance is legendary — he has never been knocked down in 100 matches." },
      { name: "Sylas Dragonbell", desc: "A mysterious Champion who is rumored to carry the original Bell Shard. His Roar Aura is said to be unmatched." },
    ],
    features: ["Roar Aura fuels Ascension", "Bell Shards drive the global conflict", "Grand Bell Tournament decides all fates", "The Silent Clan opposes the bell's restoration"],
    motto: "Train hard. Ring loud. Rise beyond.",
    cta: `Browse All ${FRANCHISE_BY_SLUG.dracobell.count} Dracobell Tazos`,
    wikiPath: "/wiki/draco-bell",
  },
  cybermon: {
    name: "Cybermon", count: FRANCHISE_BY_SLUG.cybermon.count, total: FRANCHISE_BY_SLUG.cybermon.total, year: 2026, origin: "TazoForge Studios", color: "var(--ttg-cybermon-alt)",
    world: "The Neon Grid",
    worldDesc: "The Neon Grid is a hidden digital dimension behind all networks. It is not simply the internet — it is a living realm formed by forgotten data, lost signals, ancient code, abandoned games, machine memories, and protocols that developed their own consciousness. Here, Cybermon fight, evolve, and protect the Grid from corruption.",
    originStory: "Created in 2026 by TazoForge Studios in Barcelona, the Cybermon series brings digital fantasy to Trading Tazos Game. What if code could feel? What if abandoned data gained a soul? Cybermon explores a world where the boundary between human emotion and digital existence dissolves — and where trust between human and digital being creates unstoppable power.",
    backStory: "During the Awakening Upload, millions of data fragments mixed with human emotions across the Grid. That fusion produced something unexpected: code with instinct. The first Cybermon were not created — they awakened on their own. Each one carries a Soul Protocol: a unique digital identity that cannot be copied or replaced. But the Null Signal, a corrupting force born from broken code, spreads through the Grid turning Cybermon into Null Shells — mindless, aggressive, and dangerous. Linkers — humans who bond with Cybermon through Link Pulse — are the only ones who can fight back and restore the Grid.",
    sections: [
      { title: "Shift Phases", items: [
        { name: "Boot Form", detail: "First stable startup — newly activated Soul Protocol" },
        { name: "Link Form", detail: "Form synchronized with a human Linker via Link Pulse" },
        { name: "Overdrive", detail: "Temporary combat overclock — faster, more aggressive" },
        { name: "Prime Form", detail: "Full protocol unlocked — near-autonomous Grid presence" },
        { name: "Corrupt", detail: "Form damaged by Null Signal — dangerous but powerful" },
        { name: "Omega Patch", detail: "Restored after overcoming corruption — maximum restoration" },
      ]},
      { title: "Sectors of the Neon Grid", items: [
        { name: "Boot Fields", detail: "Starting zone: stable, simple code — Basic Cybermon" },
        { name: "Pixel Ruins", detail: "Ruins of ancient games and lost systems — Pixel, Glitch" },
        { name: "Volt Highway", detail: "Highways of pure electricity — Volt, Speed, Signal" },
        { name: "Firewall Citadel", detail: "Fortified defensive stronghold — Armor, Shield, Core" },
        { name: "Data Ocean", detail: "Endless sea of flowing information — Aqua-data, Memory" },
        { name: "Kernel Tower", detail: "The core of the entire digital world — Advanced forms" },
      ]},
    ],
    highlights: [
      { name: "Pixl-01", desc: "A scrappy Boot-form Cybermon from Pixel Ruins. Small but determined, it's a favorite first partner for new Linkers." },
      { name: "Voltraze", desc: "A sleek speed-type from Volt Highway. Its Overdrive form can outpace almost any threat on the Grid." },
      { name: "Citadel-KN9", desc: "A heavily armored defender from Firewall Citadel. Its Prime Form is nearly indestructible against Null Shells." },
      { name: "OMEGA-7", desc: "A legendary Omega Patch Cybermon from Kernel Tower. Restored from corruption, it is said to hold the key to breaking the Null Signal forever." },
    ],
    features: ["Living digital creatures, not robots", "Soul Protocols as digital identity", "Null Signal corrupts into Null Shells", "Linkers synchronize through Link Pulse"],
    motto: "Log in. Link up. Break the Null.",
    cta: `Browse All ${FRANCHISE_BY_SLUG.cybermon.count} Cybermon Tazos`,
    wikiPath: "/wiki/cybermon",
  },
}


function CollectionDetailContent({ collection }: { collection: string }) {
  const [detailCounts, setDetailCounts] = useState<Record<string,number> | null>(null)

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(d => { if (d.bySeries) setDetailCounts(d.bySeries) }).catch(() => {})
  }, [])
  const c = COLLECTION_DETAILS[collection]
  if (!c) return null

  const count = detailCounts?.[c.name] ?? c.count
  
  // Wallpaper colors per series
  const wallpaperColors: Record<string, string> = {
    minimon: "linear-gradient(135deg, rgba(255,204,0,0.08), rgba(255,204,0,0.02), rgba(255,249,230,0.15), rgba(255,204,0,0.05))",
    dracobell: "linear-gradient(135deg, rgba(255,107,0,0.07), rgba(255,107,0,0.02), rgba(227,53,13,0.06), rgba(255,107,0,0.04))",
    cybermon: "linear-gradient(135deg, rgba(0,180,216,0.07), rgba(0,180,216,0.02), rgba(59,76,202,0.05), rgba(0,180,216,0.04))",
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* ───── HERO / BANNER ───── */}
      <div className="relative overflow-hidden border-3 border-ttg-black bg-white" style={{ boxShadow: "5px 5px 0 var(--ttg-black)" }}>
        {/* Wallpaper background */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: wallpaperColors[collection] || "transparent" }} />
        <div className="absolute inset-0 mag-halftone opacity-15 pointer-events-none" />
        
        {/* Color strip top */}
        <div className="relative h-2" style={{ background: c.color }} />
        
        {/* Logo + intro */}
        <div className="relative px-5 sm:px-8 py-6 sm:py-8 flex flex-col sm:flex-row items-center gap-5">
          <div className="shrink-0">
            <Image src={`/logo/series-${collection}.png`} alt={`${c.name} logo`} width={280} height={110}
              className="h-12 sm:h-16 object-contain" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <span className="text-2xl sm:text-3xl font-black text-ttg-black">{count}</span>
              <span className="text-[9px] font-bold text-ttg-black/25 uppercase tracking-wider">of {c.total} planned tazos</span>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <span className="inline-block px-2 py-0.5 text-[8px] font-black text-white uppercase tracking-wider border border-white/20" style={{ background: c.color }}>{c.origin}</span>
              <span className="text-[9px] font-bold text-ttg-black/30 uppercase tracking-wider">{c.year}</span>
              <span className="text-[9px] font-bold text-ttg-black/30 uppercase tracking-wider">· {c.world}</span>
            </div>
            <p className="text-xs font-bold text-ttg-black/55 leading-relaxed max-w-lg">{c.worldDesc}</p>
          </div>
        </div>
      </div>

      {/* ───── TWO-COLUMN LORE ───── */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Origin Story */}
        <div className="border-2 border-ttg-black bg-white p-5" style={{ boxShadow: "3px 3px 0 var(--ttg-black)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4" style={{ color: c.color }} />
            <h3 className="text-sm font-black uppercase text-ttg-black tracking-wide">Origin Story</h3>
          </div>
          <p className="text-[10px] font-bold text-ttg-black/55 leading-relaxed">{c.originStory}</p>
        </div>

        {/* Back Story */}
        <div className="border-2 border-ttg-black bg-white p-5" style={{ boxShadow: "3px 3px 0 var(--ttg-black)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Disc3 className="w-4 h-4" style={{ color: c.color }} />
            <h3 className="text-sm font-black uppercase text-ttg-black tracking-wide">The Story</h3>
          </div>
          <p className="text-[10px] font-bold text-ttg-black/55 leading-relaxed">{c.backStory}</p>
        </div>
      </div>

      {/* ───── SECTIONS ───── */}
      {c.sections.map(s => (
        <div key={s.title}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-0.5 flex-1 bg-ttg-black/8" />
            <h3 className="text-xs font-black uppercase text-ttg-black/50 tracking-[0.15em]">{s.title}</h3>
            <div className="h-0.5 flex-1 bg-ttg-black/8" />
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {s.items.map(item => (
              <div key={item.name} className="border-2 border-ttg-black bg-white p-3 hover:-translate-y-0.5 transition-transform" style={{ boxShadow: "2px 2px 0 var(--ttg-black)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.color }} />
                  <span className="text-[10px] font-black uppercase text-ttg-black">{item.name}</span>
                </div>
                <span className="text-[9px] font-bold text-ttg-black/45 leading-relaxed">{item.detail}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ───── TAZO HIGHLIGHTS ───── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-0.5 flex-1 bg-ttg-black/8" />
          <div className="flex items-center gap-1.5">
            <Star className="w-3 h-3" style={{ color: c.color }} />
            <h3 className="text-xs font-black uppercase text-ttg-black/50 tracking-[0.15em]">Featured Tazos</h3>
          </div>
          <div className="h-0.5 flex-1 bg-ttg-black/8" />
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {c.highlights.map(h => (
            <div key={h.name} className="border-2 border-ttg-black bg-white p-3" style={{ boxShadow: "2px 2px 0 var(--ttg-black)" }}>
              <span className="text-[10px] font-black uppercase text-ttg-black block mb-1">{h.name}</span>
              <span className="text-[9px] font-bold text-ttg-black/45 leading-relaxed">{h.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ───── MOTTO ───── */}
      <div className="border-3 border-ttg-black bg-white p-5 text-center" style={{ boxShadow: "3px 3px 0 var(--ttg-black)" }}>
        <p className="text-base sm:text-lg font-black uppercase text-ttg-black italic tracking-wide">
          &ldquo;{c.motto}&rdquo;
        </p>
        <p className="text-[9px] font-bold text-ttg-black/25 uppercase mt-1 tracking-wider">— Official {c.name} Series Motto</p>
      </div>

      {/* ───── CTA ROW ───── */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <a href={`/tazos?collection=${collection}`}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-[11px] font-black text-white uppercase tracking-wider border-2 border-ttg-black
                     shadow-[3px_3px_0_var(--ttg-black)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_var(--ttg-black)]
                     active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--ttg-black)] transition-all"
          style={{ background: c.color }}>
          <Disc3 className="w-3.5 h-3.5" />
          {c.cta}
        </a>
        <a href={c.wikiPath}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-[11px] font-black text-ttg-black uppercase tracking-wider bg-white border-2 border-ttg-black
                     shadow-[3px_3px_0_var(--ttg-black)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_var(--ttg-black)]
                     active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--ttg-black)] transition-all">
          <ExternalLink className="w-3.5 h-3.5" />
          View Full Wiki
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
    } else if (page === "wiki" || page?.startsWith("wiki-")) {
      // Wiki renders in-launcher — no redirect needed
    } else {
      router.replace(`/?page=${page}`, { scroll: false })
    }
  }, [router])

  const handlePlay = useCallback(() => {
    // Guests → public practice, logged-in → app battle
    window.location.href = user ? "/app/battle" : "/battle/practice"
  }, [user])
  const handleSplashDone = useCallback(() => {
    setShowSplash(false)
    window.location.href = user ? "/app/battle" : "/battle/practice"
  }, [user])

  const isHome = currentPage === "home"

  return (
    <>
      {showSplash && <MagazineSplash onFinish={handleSplashDone} />}

      <div className="min-h-screen flex flex-col relative" style={{ background: "var(--ttg-cream)" }}>
        <div className="mag-halftone absolute inset-0 opacity-40 pointer-events-none" />

        {/* ═══ MASTHEAD ═══ */}
        <header className="sticky top-0 z-40 border-b-[5px] border-ttg-black" style={{ background: "var(--ttg-black)" }}>
          <div className="flex items-center justify-between px-4 sm:px-6 py-2.5">
            <div className="flex items-center gap-2.5">
              <button onClick={() => navigate("home")} className="cursor-pointer">
                <Image src="/logo/logo-tg-yellow.png" alt="TTG" width={32} height={32} className="w-7 h-7 sm:w-8 sm:h-8" />
              </button>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-[0.08em] leading-none">
                  <span className="text-white/90">TRADING</span> <span className="text-ttg-yellow">TAZOS</span> <span className="text-white/70">GAME</span>
                </h2>
                <p className="text-[8px] font-bold text-ttg-yellow/70 uppercase tracking-[0.3em] leading-none mt-0.5">Collect · Trade · Battle</p>
              </div>
            </div>

            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-1" role="navigation" aria-label="Main navigation">
              {([
                ["home", "Home"],
                ["how-to-play", "How to Play"],
                ["collections", "Collections"],
                ["tazos", "Tazos"],
                ["leaderboard", "Rankings"],
                ["download", "Download"],
                ["faq", "FAQ"],
                ["shop", "Shop"],
                ["wiki", "Wiki"],
                ["contact", "Contact"],
              ] as [PageId, string][]).map(([id, label]) => (
                <button key={id} onClick={() => navigate(id)}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-colors ${
                    currentPage === id ? "text-ttg-yellow" : "text-white/50 hover:text-ttg-yellow"
                  }`}>
                  {label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <button onClick={handlePlay}
                    className="px-3 py-1 text-[10px] font-black text-ttg-black bg-ttg-yellow uppercase tracking-wider border-2 border-white/20 hover:bg-ttg-yellow-hover transition-colors">
                    Dashboard
                  </button>
                  <button onClick={() => { localStorage.removeItem("ttg-token"); document.cookie = "auth_token=; Max-Age=0; path=/"; document.cookie = "ttg_session=; Max-Age=0; path=/"; window.location.href = "/"; }}
                    className="px-3 py-1 text-[10px] font-black text-white/40 uppercase tracking-wider border-2 border-white/10 hover:border-ttg-red hover:text-ttg-red transition-colors">Log Out</button>
                </>
              ) : (
                <a href="/login"
                  className="px-3 py-1 text-[10px] font-black text-white uppercase tracking-wider border-2 border-white/30 hover:border-ttg-yellow hover:text-ttg-yellow transition-colors">Sign In</a>
              )}
            </div>
          </div>

          {/* Mobile nav */}
          <nav className="sm:hidden flex items-center justify-start gap-0 px-1.5 pb-1.5 overflow-x-auto scrollbar-none" aria-label="Mobile navigation">
            {(["home", "how-to-play", "collections", "tazos", "leaderboard", "download", "faq", "shop", "contact"] as PageId[]).map(id => (
              <button key={id} onClick={() => navigate(id)}
                className={`px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-colors ${
                  currentPage === id ? "text-ttg-yellow border-b-2 border-ttg-yellow" : "text-white/40 hover:text-white/70"
                }`}>{PAGE_LABELS[id]}</button>
            ))}
          </nav>
        </header>

        {/* ═══ CONTENT AREA ═══ */}
        <main className="relative z-10 flex-1 flex flex-col px-4 sm:px-6">
          <div className="absolute top-0 left-0 right-0 h-1.5 mag-stripes opacity-20 pointer-events-none" />

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
                <DownloadStripHome onNavigate={navigate} />
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

            {currentPage === "wiki" && (
              <div className="w-full max-w-5xl mx-auto"><WikiLauncherContent /></div>
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
            {currentPage === "refund-policy" && (
              <div className="w-full max-w-5xl mx-auto"><RefundPolicyContent /></div>
            )}
            {currentPage === "disclaimer" && (
              <div className="w-full max-w-5xl mx-auto"><DisclaimerContent /></div>
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
        <footer className="relative z-10 border-t-[5px] border-ttg-yellow" style={{ background: "var(--ttg-black)" }}>
          <div className="flex items-center justify-center gap-1.5 sm:gap-3 px-3 py-2.5 border-b border-white/10">
            <PlatformBadge icon={Globe} label="Browser" />
            <PlatformBadge icon={Monitor} label="Windows" />
            <PlatformBadge icon={Apple} label="macOS" />
            <PlatformBadge icon={Terminal} label="Linux" />
            <button onClick={() => navigate("download")}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black text-ttg-black bg-ttg-yellow uppercase tracking-wider border-2 border-white/20 hover:bg-ttg-yellow-hover transition-colors">
              <Download className="w-3 h-3" /> Download
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-2 gap-2">
            <div className="flex items-center gap-3 sm:gap-4">
              <button onClick={() => navigate("tazos")} className="text-[9px] font-bold text-white/30 hover:text-ttg-yellow uppercase tracking-wider transition-colors">Tazos</button>
              <button onClick={() => navigate("shop")} className="text-[9px] font-bold text-white/30 hover:text-ttg-yellow uppercase tracking-wider transition-colors">Shop</button>
              <button onClick={() => navigate("wiki")} className="text-[9px] font-bold text-white/30 hover:text-ttg-yellow uppercase tracking-wider transition-colors">Wiki</button>
              <button onClick={() => navigate("collections")} className="text-[9px] font-bold text-white/30 hover:text-ttg-yellow uppercase tracking-wider transition-colors">Collections</button>
              <button onClick={() => navigate("how-to-play")} className="text-[9px] font-bold text-white/30 hover:text-ttg-yellow uppercase tracking-wider transition-colors">How to Play</button>
              <button onClick={() => navigate("faq")} className="text-[9px] font-bold text-white/30 hover:text-ttg-yellow uppercase tracking-wider transition-colors">FAQ</button>
              <button onClick={() => navigate("privacy")} className="text-[9px] font-bold text-white/30 hover:text-ttg-yellow uppercase tracking-wider transition-colors">Privacy</button>
              <button onClick={() => navigate("terms")} className="text-[9px] font-bold text-white/30 hover:text-ttg-yellow uppercase tracking-wider transition-colors">Terms</button>
              <button onClick={() => { navigate("cookies"); }} className="text-[9px] font-bold text-white/30 hover:text-ttg-yellow uppercase tracking-wider transition-colors">Cookies</button>
              <button onClick={() => navigate("contact")} className="text-[9px] font-bold text-white/30 hover:text-ttg-yellow uppercase tracking-wider transition-colors">Contact</button>
              <span className="text-white/10">|</span>
              <a href="https://x.com/tazosgame" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter"
                className="flex items-center justify-center w-6 h-6 rounded-full border border-white/15 text-zinc-400 hover:text-white hover:border-white/50 transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://www.reddit.com/r/tradingtazosgame/" target="_blank" rel="noopener noreferrer" aria-label="Reddit"
                className="flex items-center justify-center w-6 h-6 rounded-full border border-white/15 text-zinc-400 hover:text-ttg-reddit hover:border-ttg-reddit/50 transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.6 12.6c0 .663-.537 1.2-1.2 1.2-.315 0-.603-.12-.816-.318A5.952 5.952 0 0 1 12 15.6a5.952 5.952 0 0 1-4.584-2.118A1.19 1.19 0 0 1 6.6 13.8c-.663 0-1.2-.537-1.2-1.2s.537-1.2 1.2-1.2c.315 0 .603.12.816.318a5.956 5.956 0 0 1 3.384-1.788l.72-3.384 2.94.624c.039-.327.312-.582.648-.582.363 0 .66.297.66.66s-.297.66-.66.66c-.234 0-.438-.123-.552-.306l-2.496-.528-.576 2.706a5.96 5.96 0 0 1 3.492 1.794c.213-.198.501-.318.816-.318.663 0 1.2.537 1.2 1.2zM9.6 13.2c-.48 0-.84.36-.84.84 0 .48.36.84.84.84s.84-.36.84-.84c0-.48-.36-.84-.84-.84zm4.8 0c-.48 0-.84.36-.84.84 0 .48.36.84.84.84s.84-.36.84-.84c0-.48-.36-.84-.84-.84zm-2.88 3.54c.48 0 .96.12 1.44.36.48-.24.96-.36 1.44-.36.18 0 .36-.18.36-.36s-.18-.36-.36-.36c-.66 0-1.26.18-1.74.48-.3-.18-.66-.3-1.14-.3s-.84.12-1.14.3c-.48-.3-1.08-.48-1.74-.48-.18 0-.36.18-.36.36s.18.36.36.36z"/></svg>
              </a>
              <a href="https://t.me/tradingtazosgame" target="_blank" rel="noopener noreferrer" aria-label="Telegram"
                className="flex items-center justify-center w-6 h-6 rounded-full border border-white/15 text-zinc-400 hover:text-ttg-twitter hover:border-ttg-twitter/50 transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.96 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.696.064-1.225-.46-1.9-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.24-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.1-.002.321.023.465.14.121.099.155.233.171.328.016.095.036.31.02.482z"/></svg>
              </a>
              <a href="https://discord.gg/4mUhnc2REb" target="_blank" rel="noopener noreferrer" aria-label="Discord"
                className="flex items-center justify-center w-6 h-6 rounded-full border border-white/15 text-zinc-400 hover:text-ttg-discord hover:border-ttg-discord/50 transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
              </a>
              <a href="https://www.instagram.com/tradingtazosgame/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="flex items-center justify-center w-6 h-6 rounded-full border border-white/15 text-zinc-400 hover:text-ttg-instagram hover:border-ttg-instagram/50 transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            </div>
            <div className="flex items-center gap-3">
            <span className="text-[8px] font-black text-white/15 uppercase tracking-[0.3em] whitespace-nowrap">
              © {new Date().getFullYear()} {SITE_CONFIG.name} · v{SITE_CONFIG.version}
            </span>
          </div>
          </div>
        </footer>


      </div>
    </>
  )
}
