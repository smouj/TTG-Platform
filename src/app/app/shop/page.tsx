// ============================================================
// Trading Tazos Game — Bag Shop v2
// 3 bags at 3 price tiers: Classic (10cr), Premium (25cr), Mega (50cr)
// ============================================================
"use client"

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import {
  ShoppingBag, Coins, Zap, Star, Gift, Loader2, X,
  Crosshair, Trophy, Calendar, ShoppingCart, Scissors, ChevronRight,
  Flame, Swords, Store, PackageOpen,
} from "lucide-react"
import ConfettiBurst from "@/components/game/confetti-burst"
import { Skeleton, ShopBagSkeleton } from "@/components/ui/loading-skeletons"
import { pickBagVariant } from "@/lib/bag-variants"
import { playSFX, sfxEnsureUnlocked } from "@/lib/audio/sfx-engine"
import TazoDiscImage from "@/components/game/tazo-disc-image"

const BagOpener3D = dynamic(() => import("@/components/game/bag-opener-3d"), { ssr: false })
const WebGLGuard = dynamic(() => import("@/components/game/webgl-guard"), { ssr: false })
// BagOpener2D replaced by BagOpener3D

import MarketplaceSection from "@/components/game/marketplace-section"
interface BagConfig {
  type: string
  name: string
  cost: number
  bonusChance: number
  rareBoost: number
  color: string
  bgColor: string
  franchise: string
  icon: React.ReactNode
  tagline: string
  frontUrl?: string
  backUrl?: string
}

const DEFAULT_BAGS: BagConfig[] = [
  {
    type: "standard", name: "Classic Bag", cost: 50,
    bonusChance: 12, rareBoost: 2, color: 'var(--ttg-yellow)', bgColor: "#FFF8E7",
    franchise: "minimon", icon: <ShoppingBag className="w-4 h-4" />,
    tagline: "Original collection tazos",
  },
  {
    type: "premium", name: "Premium Bag", cost: 100,
    bonusChance: 20, rareBoost: 3, color: "#3B82F6", bgColor: "#EFF6FF",
    franchise: "cybermon", icon: <Star className="w-4 h-4" />,
    tagline: "Higher rare chance + bonus",
  },
  {
    type: "mega", name: "Mega Bag", cost: 200,
    bonusChance: 30, rareBoost: 5, color: "var(--ttg-dracobell)", bgColor: "#FFF7ED",
    franchise: "dracobell", icon: <Zap className="w-4 h-4" />,
    tagline: "Guaranteed rare or better",
  },
]

const RARITY_GRADIENT: Record<string, string> = {
  common: "linear-gradient(135deg, #9CA3AF, #6B7280)",
  uncommon: "linear-gradient(135deg, var(--ttg-success), var(--ttg-success))",
  rare: "linear-gradient(135deg, #3B82F6, #2563EB)",
  "ultra-rare": "linear-gradient(135deg, #A855F7, var(--ttg-purple))",
  legendary: "linear-gradient(135deg, #F59E0B, #D97706)",
}
const RARITY_LABELS: Record<string, string> = {
  common: "Common", uncommon: "Uncommon", rare: "Rare",
  "ultra-rare": "Ultra Rare", legendary: "Legendary",
}

const RARITY_STARS: Record<string, number> = {
  common: 1, uncommon: 2, rare: 3, "ultra-rare": 4, legendary: 5,
}
const RARITY_ORDER: Record<string, number> = {
  common: 0, uncommon: 1, rare: 2, "ultra-rare": 3, legendary: 4,
}

// ── BagCard (select view) ──────────────────────────────
function BagCard({ bag, selected, onSelect, onBuy, buying, credits }: {
  bag: BagConfig; selected: boolean; onSelect: () => void;
  onBuy: (qty: number) => void; buying: boolean; credits: number;
}) {
  const canAfford = credits >= bag.cost
  const variant = useMemo(() => pickBagVariant(bag.franchise), [bag.franchise])
  const frontUrl = bag.frontUrl || variant.frontUrl
  const backUrl = bag.backUrl || variant.backUrl

  return (
    <button
      onClick={onSelect}
      className={`relative flex flex-col text-left border-3 overflow-hidden transition-all duration-200 group ${
        selected
          ? "border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] -translate-x-0.5 -translate-y-0.5 bg-white"
          : "border-ttg-black/12 shadow-[3px_3px_0px_#1a1a1a15] bg-white/70 hover:border-ttg-black/30 hover:bg-white hover:shadow-[3px_3px_0px_var(--ttg-black)]"
      }`}
    >
      {/* Price badge */}
      <div className={`absolute top-2 right-2 z-10 px-2.5 py-1 flex items-center gap-1 border-2 text-[10px] font-black ${
        selected
          ? "bg-ttg-black text-ttg-yellow border-ttg-black"
          : "bg-white text-ttg-black border-ttg-black/20 group-hover:border-ttg-black"
      }`}>
        <Coins className="w-3 h-3" />
        {bag.cost}
      </div>

      {/* Franchise badge */}
      <div className={`absolute top-2 left-2 z-10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border ${
        selected ? "border-ttg-black bg-white" : "border-transparent bg-white/60"
      }`}>
        {bag.franchise}
      </div>

      {/* Bag preview image */}
      <div className="relative h-36 sm:h-44 flex items-center justify-center overflow-hidden"
        style={{ background: bag.bgColor }}>
        <div className="relative h-full w-28 sm:w-36">
          <img
            src={backUrl}
            alt={`${bag.name} back`}
            className="absolute right-0 top-6 h-[70%] w-auto rotate-8 object-contain opacity-75 drop-shadow-[4px_6px_0_rgba(26,26,26,0.18)] z-0"
            draggable={false}
          />
          <img
            src={frontUrl}
            alt={`${bag.name} front`}
            className="absolute left-0 top-3 h-[85%] w-auto -rotate-6 object-contain drop-shadow-[6px_8px_0_rgba(26,26,26,0.25)] z-10"
            draggable={false}
          />
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <h3 className="font-black text-xs uppercase text-ttg-black">{bag.name}</h3>
        <p className="text-[9px] font-bold text-ttg-black/40">{bag.tagline}</p>
        <div className="flex items-center gap-2 text-[8px] font-black">
          <span className="flex items-center gap-1 text-ttg-black/50">
            <Crosshair className="w-2.5 h-2.5" />{bag.rareBoost}x rare
          </span>
          <span className="flex items-center gap-1 text-ttg-black/50">
            <Gift className="w-2.5 h-2.5" />{bag.bonusChance}% bonus
          </span>
        </div>

        {/* Buy action */}
        <div className="pt-1.5">
          {selected && canAfford ? (
            <div className="pt-1.5 space-y-1.5">
              <div className="grid grid-cols-3 gap-1">
                <div role="button" onClick={(e) => { e.stopPropagation(); onBuy(1) }}
                  className="py-2 text-center text-[10px] font-black uppercase tracking-wider border-2 border-ttg-black bg-ttg-success text-white shadow-[3px_3px_0px_var(--ttg-black)] hover:shadow-[2px_2px_0px_var(--ttg-black)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                  {buying ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : <><Scissors className="w-3 h-3 inline mr-0.5" />x1</>}
                </div>
                <div role="button" onClick={(e) => { e.stopPropagation(); onBuy(5) }}
                  className="py-2 text-center text-[10px] font-black uppercase tracking-wider border-2 border-ttg-black bg-ttg-blue text-white shadow-[3px_3px_0px_var(--ttg-black)] hover:shadow-[2px_2px_0px_var(--ttg-black)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                  {buying ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : <><Zap className="w-3 h-3 inline mr-0.5" />x5</>}
                </div>
                <div role="button" onClick={(e) => { e.stopPropagation(); onBuy(20) }}
                  className="py-2 text-center text-[10px] font-black uppercase tracking-wider border-2 border-ttg-black bg-ttg-purple text-white shadow-[3px_3px_0px_var(--ttg-black)] hover:shadow-[2px_2px_0px_var(--ttg-black)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                  {buying ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : <><Flame className="w-3 h-3 inline mr-0.5" />x20</>}
                </div>
              </div>
              <div className="text-center text-[8px] font-bold text-ttg-black/25">
                {bag.cost} · {bag.cost * 5} · {bag.cost * 20} CREDITS
              </div>
            </div>
          ) : (
            <div className="pt-1.5">
              <div role="button"
                className={`w-full py-2 text-center text-[10px] font-black uppercase tracking-wider border-2 border-ttg-black transition-all ${
                  selected && !canAfford
                    ? "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                    : "bg-ttg-black/5 text-ttg-black/30 group-hover:text-ttg-black/50"
                }`}
              >
                {selected && !canAfford ? (
                  <span><Coins className="w-3 h-3 inline mr-1" />Need {bag.cost - credits} more</span>
                ) : (
                  <span>SELECT</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected indicator */}
      {selected && (
        <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ background: bag.color }} />
      )}
    </button>
  )
}

// ── StatsRow (reveal view) ─────────────────────────────
function StatsRow({ tazo }: { tazo: any }) {
  const val = (n: unknown) => typeof n === 'number' && !isNaN(n) ? n : 0
  const stats = [
    { label: "ATK", value: val(tazo?.attack), color: 'var(--ttg-red)' },
    { label: "DEF", value: val(tazo?.defense), color: 'var(--ttg-blue)' },
    { label: "SPD", value: Math.round((val(tazo?.bounce) + val(tazo?.spin) + val(tazo?.precision)) / 3), color: 'var(--ttg-success)' },
    { label: "WGT", value: val(tazo?.weight), color: "#78716C" },
    { label: "STA", value: val(tazo?.stability), color: "var(--ttg-warning)" },
    { label: "CTL", value: val(tazo?.control), color: "var(--ttg-cybermon)" },
  ]
  const total = stats.reduce((a, s) => a + s.value, 0)
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1.5">
        {stats.map(s => (
          <div key={s.label} className="p-2 text-center bg-white border-2 border-ttg-black/10 shadow-[1px_1px_0px_var(--ttg-black)]/5">
            <div className="text-[8px] font-black text-ttg-black/30 uppercase mb-0.5">{s.label}</div>
            <div className="text-sm font-black" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-1">
        <Flame className="w-3 h-3 text-ttg-red" />
        <span className="text-[9px] font-black text-ttg-black/40">TOTAL POWER</span>
        <span className="text-sm font-black text-ttg-red">{total}</span>
      </div>
    </div>
  )
}

// ── Main Shop Page ─────────────────────────────────────

// ═══ ErrorBoundary — prevents full blank screen on render crash ═══
class RevealErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null } }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error } }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error('[RevealErrorBoundary] Render crash:', error, info) }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center py-12"><div className="flex flex-col items-center gap-3 p-6 bg-red-50 border-2 border-red-300"><p className="text-sm font-black text-red-600 uppercase">Something went wrong</p><p className="text-[10px] text-red-400">{this.state.error?.message || "Render error"}</p><button onClick={() => this.setState({ hasError: false, error: null })} className="px-4 py-2 font-black text-xs bg-red-600 text-white uppercase border-2 border-red-800">Try Again</button></div></div>)
    }
    return this.props.children
  }
}

export default function BagShopPage() {
  const { t } = useI18n()
  const { user, token } = useAuth()
  const [credits, setCredits] = useState(0)
  const [bags, setBags] = useState<BagConfig[]>(DEFAULT_BAGS)
  const [selectedBag, setSelectedBag] = useState<BagConfig>(DEFAULT_BAGS[0])
  const [buying, setBuying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bagId, setBagId] = useState<string | null>(null)

  // Opening states
  const [stage, setStage] = useState<"select" | "opening" | "opening-bulk" | "reveal" | "reveal-bulk">("select")
  const [revealedTazo, setRevealedTazo] = useState<any>(null)
  const [revealedTazos, setRevealedTazos] = useState<any[]>([])
  const revealedTazoRef = useRef<any>(null)
  useEffect(() => { if (revealedTazo) revealedTazoRef.current = revealedTazo }, [revealedTazo])
  const [bonusTazo, setBonusTazo] = useState<any>(null)
  const [pendingBags, setPendingBags] = useState<number>(0)
  const [bulkIndex, setBulkIndex] = useState(0)
  const [bulkTotal, setBulkTotal] = useState(0)
  const [dailyClaimable, setDailyClaimable] = useState(false)
  const [claimingDaily, setClaimingDaily] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Shop tabs: bags | marketplace
  const [shopTab, setShopTab] = useState<"bags" | "marketplace">("bags")

  const bagIdRef = useRef<string | null>(null)
  useEffect(() => { bagIdRef.current = bagId }, [bagId])
  const bulkIndexRef = useRef(0)
  useEffect(() => { bulkIndexRef.current = bulkIndex }, [bulkIndex])

  // Poll bags + credits
  useEffect(() => {
    if (!token) return
    fetch("/api/bags", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setPendingBags(d.total ?? 0)).catch(() => {})
  }, [token, stage])
  useEffect(() => {
    if (!token) return
    fetch("/api/credits", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setCredits(d.credits ?? 0); setInitialLoading(false) }).catch(() => setInitialLoading(false))
  }, [token])
  useEffect(() => {
    if (!token) return
    fetch("/api/credits/daily", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setDailyClaimable(!!d.claimable)).catch(() => {})
  }, [token])

  // Fetch bag models from DB (falls back to defaults)
  useEffect(() => {
    fetch("/api/bag-models")
      .then(r => r.json())
      .then(data => {
        if (data.models?.length > 0) {
          const mapped: BagConfig[] = data.models.map((m: any) => ({
            type: m.type || m.name.toLowerCase().replace(/\s+/g, "-"),
            name: m.name,
            cost: m.cost,
            bonusChance: m.bonusChance,
            rareBoost: m.rareBoost,
            color: m.color,
            bgColor: m.bgColor,
            franchise: m.franchise,
            icon: <ShoppingBag className="w-4 h-4" />,
            tagline: m.tagline,
            frontUrl: m.frontUrl,
            backUrl: m.backUrl,
          }))
          setBags(mapped)
          setSelectedBag(mapped[0])
        }
      })
      .catch(() => {})
  }, [])

  const handleBuy = useCallback(async (bag: BagConfig, qty: number = 1) => {
    if (!token) return
    setSelectedBag(bag)
    setBuying(true)
    setError(null)
    try {
      const res = await fetch("/api/bags/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bagType: bag.type, quantity: qty }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Purchase failed"); setBuying(false); return }
      setCredits(data.creditsRemaining)
      const ids = data.bagIds || [data.bagId]
      if (ids.length > 1) {
        setBagId(ids[0])
        sessionStorage.setItem("bulk_bag_ids", JSON.stringify(ids))
        setBulkTotal(ids.length)
        setBulkIndex(0)
        setBuying(false)
        setStage("opening-bulk")
      } else {
        setBagId(ids[0])
        setBulkIndex(0)
        setBulkTotal(0)
        setBuying(false)
        setStage("opening")
      }
      sfxEnsureUnlocked()
      playSFX('coin', { volume: 0.35 })
    } catch {
      setError("Connection error")
      setBuying(false)
    }
  }, [token])

  const claimDaily = useCallback(async () => {
    if (!token || claimingDaily || !dailyClaimable) return
    setClaimingDaily(true); setError(null)
    try {
      const res = await fetch("/api/credits/daily", { method: "POST", headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Already claimed"); setDailyClaimable(false) }
      else { setCredits(data.credits ?? credits); setDailyClaimable(false); playSFX('coin', { volume: 0.35 }) }
    } catch { setError("Failed to claim") }
    finally { setClaimingDaily(false) }
  }, [token, claimingDaily, dailyClaimable, credits])

  const openBag = useCallback(async () => {
    const currentBagId = bagIdRef.current
    if (!token || !currentBagId || typeof currentBagId !== "string" || !currentBagId.trim()) {
      console.warn("[openBag] Missing bagId/token", { token: !!token, bagId: currentBagId })
      setStage("select")
      setError("Something went wrong — try again")
      return
    }
    try {
      const res = await fetch("/api/bags/open", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bagId: currentBagId.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.tazo) {
        playSFX('reveal', { volume: 0.5 })
        revealedTazoRef.current = data.tazo
        setRevealedTazo(data.tazo)
        setBonusTazo(data.bonusTazo || null)
        setStage("reveal")
      } else if (res.ok) {
        console.warn("[openBag] OK but no tazo in response")
        setError("Bag opened but no tazo found — please try again")
        setStage("select")
      } else {
        console.error("[openBag] API error:", data.error)
        setError(data.error || "Failed to open"); setStage("select")
      }
    } catch (err) {
      console.error("[openBag] Connection error:", err)
      setError("Connection error"); setStage("select")
    }
  }, [token])

  const handleReset = useCallback(() => {
    setStage("select"); setBagId(null); bagIdRef.current = null
    setRevealedTazo(null); setRevealedTazos([]); setBonusTazo(null)
    setBulkIndex(0); setBulkTotal(0)
    setError(null)
    revealedTazoRef.current = null
  }, [])

  // ── Bulk open sequencer (top-level hook, guarded internally) ──
  const openNextBulkBag = useCallback(async () => {
    const raw = sessionStorage.getItem("bulk_bag_ids")
    if (!raw) { handleReset(); return }
    let ids: string[] = []
    try {
      ids = JSON.parse(raw)
      if (!Array.isArray(ids) || ids.length === 0) { handleReset(); return }
    } catch {
      sessionStorage.removeItem("bulk_bag_ids")
      handleReset()
      return
    }
    const currentIndex = bulkIndexRef.current
    if (currentIndex >= ids.length) { handleReset(); return }
    const currentId = ids[currentIndex]
    if (!currentId || typeof currentId !== "string" || !currentId.trim()) {
      setBulkIndex(p => p + 1) // skip invalid entry
      return
    }
    try {
      const res = await fetch("/api/bags/open", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bagId: currentId.trim() }),
      })
      const data = await res.json()
      if (data?.tazo) {
        playSFX('reveal', { volume: 0.4 })
        const t = data.tazo
        setRevealedTazos(p => [...p, {
          name: t.displayName || t.name, rarity: t.rarity, imageUrl: t.imageUrl,
          franchise: t.franchiseName, attack: t.attack, defense: t.defense,
          resistance: t.resistance, weight: t.weight, spin: t.spin,
          control: t.control, bounce: t.bounce, precision: t.precision,
          finish: t.finish, creatureVariant: t.creatureVariant,
          shinyImageUrl: t.shinyImageUrl, number: t.number,
          franchiseSlug: t.franchiseSlug, id: t.id
        }])
      }
      setBulkIndex(p => p + 1)
    } catch {
      setBulkIndex(p => p + 1) // skip errored bag
    }
  }, [token, handleReset])

  // Bulk open effect — auto-transition when all bags done
  useEffect(() => {
    if (stage !== "opening-bulk") return
    if (bulkIndex >= bulkTotal && bulkTotal > 0) {
      const timer = setTimeout(() => {
        sessionStorage.removeItem("bulk_bag_ids")
        setStage("reveal-bulk")
      }, 1200)
      return () => clearTimeout(timer)
    }
    // No auto-advance — user interacts with BagOpener3D per bag
  }, [stage, bulkIndex, bulkTotal])

  // ── Guest ──
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
        <ShoppingBag className="w-16 h-16 mx-auto text-ttg-black/10" />
        <h1 className="text-2xl font-black uppercase tracking-wider text-ttg-black">
          {t.shop_title || "Tazo Shop"}
        </h1>
        <p className="text-sm font-bold text-ttg-black/30">{t.auth_login} to buy bags and open tazos</p>
        <Link href="/login"
          className="mag-btn inline-block bg-ttg-yellow text-ttg-black font-black uppercase px-6 py-3 border-3 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
          {t.auth_login}
        </Link>
      </div>
    )
  }

  // ── SELECT STAGE ──────────────────────────────────────
  if (stage === "select") {
    return (
      <div className="max-w-7xl mx-auto w-full py-4 sm:py-6 space-y-4">

        {/* ── Banner ── */}
        <div
          className="px-4 py-3 flex flex-wrap items-center gap-3 relative overflow-hidden"
          style={{
            background: "linear-gradient(90deg, var(--ttg-black) 0%, #2a2a2a 100%)",
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.025) 6px, rgba(255,255,255,0.025) 12px), linear-gradient(90deg, var(--ttg-black) 0%, #2a2a2a 100%)`,
            border: "3px solid var(--ttg-black)",
            boxShadow: "4px 4px 0px var(--ttg-yellow)",
          }}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-ttg-yellow" />
            <h1 className="text-sm sm:text-lg font-black text-white uppercase tracking-tight">
              {t.shop_title || "Tazo Shop"}
            </h1>
          </div>
          <div className="w-px h-5 bg-white/15" />
          <div className="flex items-center gap-1.5" title="Your credits to buy bags">
            <Coins className="w-4 h-4 text-ttg-yellow" />
            {initialLoading ? (
              <Skeleton className="h-4 w-12" />
            ) : (
              <span className="font-black text-sm text-white">{credits}</span>
            )}
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">CREDITS</span>
          </div>
          {pendingBags > 0 && (
            <>
              <div className="flex items-center gap-1.5" title="You have bags ready to open">
                <PackageOpen className="w-3.5 h-3.5 text-ttg-success" />
                <span className="font-black text-xs text-ttg-success">{pendingBags}</span>
                <span className="text-[9px] font-bold text-ttg-success/60 uppercase tracking-wider">TO OPEN</span>
              </div>
              <button
              onClick={async () => {
                if (!token) return; setError(null); setBuying(true)
                try {
                  const res = await fetch("/api/bags", { headers: { Authorization: `Bearer ${token}` } })
                  const data = await res.json()
                  if (data.bags?.length > 0) {
                    const first = data.bags[0]
                    setBagId(first.id)
                    setSelectedBag({ type: first.bagType || "standard", name: "Mystery Bag", cost: 0, bonusChance: 15, rareBoost: 2, color: 'var(--ttg-yellow)', bgColor: "#FFF8E7", franchise: first.preview?.franchise || "minimon", icon: <Gift className="w-4 h-4" />, tagline: "Free bag" })
                    setBuying(false); setStage("opening")
                    sfxEnsureUnlocked(); playSFX('coin', { volume: 0.35 })
                  }
                } catch { setError("Failed"); setBuying(false) }
              }}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 border-2 border-ttg-red bg-white text-[10px] font-black text-ttg-red uppercase hover:bg-ttg-red hover:text-white transition-colors shadow-[2px_2px_0px_var(--ttg-red)]"
            >
              <Gift className="w-3.5 h-3.5" />
              {pendingBags} free bag{pendingBags > 1 ? "s" : ""}
            </button>
          </>
          )}
        </div>

        {/* ── Shop Tabs ── */}
        <div className="flex gap-0">
          <button onClick={() => setShopTab("bags")}
            className={`flex-1 py-2.5 text-xs font-black uppercase border-3 transition-all ${
              shopTab === "bags"
                ? "bg-ttg-black text-ttg-yellow border-ttg-black"
                : "bg-white text-ttg-black/30 border-ttg-black/10 hover:text-ttg-black/50"
            }`}>
            <ShoppingBag className="w-3.5 h-3.5 inline mr-1" />Bags
          </button>
          <button onClick={() => setShopTab("marketplace")}
            className={`flex-1 py-2.5 text-xs font-black uppercase border-3 transition-all ${
              shopTab === "marketplace"
                ? "bg-ttg-black text-ttg-blue border-ttg-black"
                : "bg-white text-ttg-black/30 border-ttg-black/10 hover:text-ttg-black/50"
            }`}>
            <Store className="w-3.5 h-3.5 inline mr-1" />Marketplace
          </button>
        </div>

        {/* ── Marketplace Tab ── */}
        {shopTab === "marketplace" ? (
          <MarketplaceSection credits={credits} />
        ) : (
        <>
        {/* ── Error ── */}
        {error && (
          <div className="p-2 bg-red-50 border-2 border-red-300 text-center flex items-center justify-center gap-2">
            <p className="text-[10px] font-black text-red-600">{error}</p>
            <button onClick={() => setError(null)} className="text-[8px] font-black underline"><X className="w-2.5 h-2.5 inline" /></button>
          </div>
        )}

        {/* ── BAG CARDS ── */}
        {initialLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ShopBagSkeleton key={i} />
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {bags.map(bag => (
            <BagCard
              key={bag.type}
              bag={bag}
              selected={selectedBag.type === bag.type}
              onSelect={() => setSelectedBag(bag)}
              onBuy={(qty) => handleBuy(bag, qty)}
              buying={buying}
              credits={credits}
            />
          ))}
        </div>

        )}
        {/* ── How to earn ── */}
        <div className="p-3 bg-white border-3 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)]">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={claimDaily}
              disabled={!dailyClaimable || claimingDaily}
              className={`flex items-center gap-1.5 px-3 py-1.5 border-2 font-black text-[9px] uppercase transition-all ${
                dailyClaimable
                  ? "border-ttg-black bg-ttg-blue text-white shadow-[2px_2px_0px_var(--ttg-black)] hover:shadow-[1px_1px_0px_var(--ttg-black)] hover:translate-x-[1px] hover:translate-y-[1px]"
                  : "border-ttg-black/15 bg-zinc-100 text-zinc-400 cursor-not-allowed"
              }`}
            >
              {claimingDaily ? <Loader2 className="h-3 w-3 animate-spin" /> : <Calendar className="h-3 w-3" />}
              {dailyClaimable ? "Claim +25 CREDITS Daily" : "Claimed Today"}
            </button>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-bold text-ttg-black/40">
              <span className="flex items-center gap-1"><Swords className="w-2.5 h-2.5 text-ttg-red" />Battles +30 CREDITS</span>
              <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5 text-ttg-blue" />Daily +25 CREDITS</span>
              <span className="flex items-center gap-1"><Trophy className="w-2.5 h-2.5 text-ttg-warning" />Quests +50-200 CREDITS</span>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    )
  }

  // ── OPENING STAGE ──────────────────────────────────────
  if (stage === "opening") {
    return (
      <div className="max-w-2xl mx-auto py-3 sm:py-4 px-1 animate-fadeIn">
        <WebGLGuard fallback={
          <div className="text-center py-8 space-y-3">
            <button onClick={openBag} className="px-6 py-3 bg-ttg-yellow border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] font-black text-sm uppercase">
              ⚡ Open {selectedBag.name}
            </button>
          </div>
        }>
          <BagOpener3D
            bag={{ id: bagId!, bagType: selectedBag.type, preview: { franchise: { slug: selectedBag.franchise } } }}
            bagColor={selectedBag.color}
            onOpen={openBag}
          />
        </WebGLGuard>
      </div>
    )
  }

  if (stage === "opening-bulk") {
    if (bulkIndex >= bulkTotal) {
      return (
        <div className="max-w-lg mx-auto py-8 sm:py-12 px-4 text-center space-y-6 animate-fadeIn">
          <ConfettiBurst active={revealedTazos.some(t => t.rarity === "legendary" || t.rarity === "ultra-rare")} />
          <h2 className="text-xl font-black uppercase tracking-wider text-ttg-black">All {bulkTotal} bags opened!</h2>
          <div className="flex flex-wrap justify-center gap-3 min-h-[120px] items-start content-start">
            {revealedTazos.map((t, i) => (
              <div key={i}
                className="w-20 h-20 rounded-full border-3 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)] flex items-center justify-center overflow-hidden bg-ttg-black animate-bounce-in"
                style={{ animationDelay: `${i * 80}ms` }}>
                {t.imageUrl ? (
                  <TazoDiscImage src={t.imageUrl} alt={t.name} size="100%" borderWidth={0}
                    franchiseSlug={t.franchiseSlug} finish={t.finish} creatureVariant={t.creatureVariant}
                    shinyImageUrl={t.shinyImageUrl} className="w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xs font-black text-zinc-600">
                    {t.name?.charAt(0) || "?"}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setStage("reveal-bulk")}
            className="mag-btn px-8 py-3 font-black text-sm uppercase bg-ttg-yellow text-ttg-black border-3 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all animate-bounce-in">
            <ChevronRight className="w-4 h-4 inline mr-1" />View All {bulkTotal} Tazos
          </button>
        </div>
      )
    }
    return (
      <div className="max-w-2xl mx-auto py-3 sm:py-4 px-1 animate-fadeIn">
        <div className="text-center mb-2">
          <span className="text-[10px] font-black text-ttg-black/40 uppercase tracking-wider">
            Bag {bulkIndex + 1} of {bulkTotal}
          </span>
        </div>
        <WebGLGuard fallback={
          <div className="text-center py-8 space-y-3">
            <button onClick={openNextBulkBag} className="px-6 py-3 bg-ttg-yellow border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] font-black text-sm uppercase">
              ⚡ Open Bag {bulkIndex + 1}/{bulkTotal}
            </button>
          </div>
        }>
          <BagOpener3D
            key={`${bagId}-${bulkIndex}`}
            bag={{ id: bagId!, bagType: selectedBag.type, preview: { franchise: { slug: selectedBag.franchise } } }}
            bagColor={selectedBag.color}
            onOpen={() => { openNextBulkBag() }}
          />
        </WebGLGuard>
        {revealedTazos.length > 0 && (
          <div className="flex justify-center gap-2 mt-3 flex-wrap">
            {revealedTazos.map((t, i) => (
              <div key={i}
                className="w-14 h-14 rounded-full border-2 border-ttg-black/20 shadow-[2px_2px_0px_var(--ttg-black)]/20 flex items-center justify-center overflow-hidden bg-ttg-black/5 animate-bounce-in"
                style={{ animationDelay: `${i * 60}ms` }}>
                {t.imageUrl ? (
                  <TazoDiscImage src={t.imageUrl} alt={t.name} size="100%" borderWidth={0}
                    franchiseSlug={t.franchiseSlug} finish={t.finish} creatureVariant={t.creatureVariant}
                    shinyImageUrl={t.shinyImageUrl} className="w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[8px] font-black text-zinc-500">
                    {t.name?.charAt(0) || "?"}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }


  // ── REVEAL STAGE ───────────────────────────────────────
  // revealTazo from state, with ref fallback in case state gets clobbered
  const effectiveRevealedTazo = revealedTazo || revealedTazoRef.current
  if (stage === "reveal" && effectiveRevealedTazo) {
    const _tazo = effectiveRevealedTazo
    const rarityColor = RARITY_GRADIENT[_tazo.rarity] || "linear-gradient(135deg, #9CA3AF, #6B7280)"
    const rarityLabel = RARITY_LABELS[_tazo.rarity] || _tazo.rarity || "Common"
    const rndRarity = _tazo.rarity || "common"
    const isLegendary = rndRarity === "legendary"
    const isUltraRare = rndRarity === "ultra-rare"
    const isRare = rndRarity === "rare"
    const isHighRarity = isRare || isUltraRare || isLegendary
    const rarityStars = RARITY_STARS[rndRarity] || 1
    const franchiseSlug = _tazo.franchiseSlug || selectedBag.franchise || "minimon"

    return (
      <div className="max-w-lg mx-auto py-6 sm:py-8 px-4 space-y-6 text-center relative overflow-visible">
        <ConfettiBurst active />

        {/* Legendary golden flash — dramatic entrance */}
        {isLegendary && (
          <div className="absolute inset-0 pointer-events-none z-30 animate-[flashOut_0.8s_ease-out_both]"
            style={{ background: "radial-gradient(ellipse at 50% 40%, #f59e0baa 0%, #f59e0b40 40%, transparent 75%)" }}>
            <div className="absolute inset-0 animate-[flashShake_0.5s_ease-out]">
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full animate-ping opacity-30"
                style={{ background: "radial-gradient(circle, #f59e0b, transparent)", animationDuration: "1.2s" }} />
            </div>
          </div>
        )}

        {/* Legendary golden glow background */}
        {isLegendary && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-30 blur-3xl animate-pulse"
              style={{ background: "radial-gradient(circle, var(--ttg-warning), #f59e0b00)", animationDelay: "0.5s" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full opacity-20 blur-2xl animate-spin"
              style={{ background: "conic-gradient(from 0deg, var(--ttg-warning), var(--ttg-yellow), var(--ttg-warning), transparent)", animationDuration: "4s", animationDelay: "0.2s" }} />
          </div>
        )}

        {/* Ultra-rare purple aura */}
        {isUltraRare && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full opacity-25 blur-3xl animate-pulse"
              style={{ background: "radial-gradient(circle, var(--ttg-purple), #a855f700)" }} />
          </div>
        )}

        {/* Rare blue shimmer */}
        {isRare && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-20 blur-3xl animate-pulse"
              style={{ background: "radial-gradient(circle, var(--ttg-rarity-rare), #A855F700)" }} />
          </div>
        )}

        {/* Rarity badge — staggered entrance */}
        <div
          className={`inline-block px-5 py-2 font-black text-sm uppercase tracking-wider animate-[popUp_0.5s_ease-out_both] ${
            isHighRarity ? "animate-pulse" : ""
          }`}
          style={{
            border: `3px solid var(--ttg-black)`,
            background: isLegendary
              ? "linear-gradient(135deg, var(--ttg-warning), #D97706)"
              : isUltraRare
              ? "linear-gradient(135deg, var(--ttg-purple), var(--ttg-purple))"
              : isRare
              ? "linear-gradient(135deg, var(--ttg-rarity-rare), #2563EB)"
              : rarityColor || "var(--ttg-rarity-common)",
            color: "#fff",
            boxShadow: isLegendary
              ? "4px 4px 0px var(--ttg-black), 0 0 30px #f59e0b60, 0 0 60px #f59e0b30"
              : isUltraRare
              ? "4px 4px 0px var(--ttg-black), 0 0 24px #a855f760, 0 0 48px #a855f730"
              : isRare
              ? "4px 4px 0px var(--ttg-black), 0 0 18px #A855F760"
              : "4px 4px 0px var(--ttg-black)",
          }}>
          {Array.from({ length: rarityStars }).map((_, i) => (
            <Star key={i} className={`w-3 h-3 inline fill-current ${isLegendary ? "animate-spin" : ""}`}
              style={isLegendary ? { animationDuration: "2s" } : {}} />
          ))}{" "}
          {rarityLabel}
          {isLegendary && " ⚡"}
        </div>

        {/* Tazo disc — larger, centered, with entrance animation tuned per rarity */}

        {/* Dramatic pause text — flash for legendary */}
        {isLegendary && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="text-center"
          >
            <p className="text-[10px] font-black text-ttg-warning uppercase tracking-[0.5em] animate-pulse"
              style={{ textShadow: "0 0 20px #f59e0b80, 0 0 40px #f59e0b40" }}>
              ⚡ LEGENDARY PULL ⚡
            </p>
          </motion.div>
        )}

        {/* Pre-reveal shimmer for ultra rare */}
        {isUltraRare && (
          <div className="h-2 w-32 mx-auto rounded-full overflow-hidden bg-ttg-black/5">
            <div className="h-full w-full animate-[shimmer_0.6s_ease-out_both]"
              style={{ background: "linear-gradient(90deg, transparent, var(--ttg-purple), transparent)" }} />
          </div>
        )}
        <motion.div
          initial={{ scale: isLegendary ? 0.2 : isUltraRare ? 0.3 : 0.5, opacity: 0, rotate: isLegendary ? -25 : isUltraRare ? -12 : 0 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{
            duration: isLegendary ? 0.6 : isUltraRare ? 0.5 : isRare ? 0.35 : 0.25,
            ease: isLegendary ? [0.16, 0.86, 0.22, 1.05] : [0.175, 0.885, 0.32, 1.275],
            delay: 0.1,
          }}
          className={`mx-auto w-56 h-56 sm:w-64 sm:h-64 rounded-full flex items-center justify-center overflow-hidden ${
          isLegendary ? "border-[5px]" : "border-4"
        } ${isHighRarity ? "animate-pulse" : ""}`}
          style={{
            borderColor: isLegendary ? "var(--ttg-warning)" : isUltraRare ? 'var(--ttg-purple)' : isRare ? "var(--ttg-rarity-rare)" : 'var(--ttg-black)',
            background: 'var(--ttg-black)',
            boxShadow: isLegendary
              ? "8px 8px 0px var(--ttg-black), 0 0 40px #f59e0b50, 0 0 80px #f59e0b30, inset 0 0 40px #f59e0b15"
              : isUltraRare
              ? "8px 8px 0px var(--ttg-black), 0 0 30px #a855f750, inset 0 0 30px #a855f710"
              : isRare
              ? "6px 6px 0px var(--ttg-black), 0 0 20px #A855F740, inset 0 0 20px #A855F708"
              : "6px 6px 0px var(--ttg-black)",
          }}>
          {_tazo.imageUrl ? (
            <TazoDiscImage src={_tazo.imageUrl} alt={_tazo.name || ""}
              size="100%" borderWidth={0} franchiseSlug={_tazo.franchiseSlug}
              finish={_tazo.finish} creatureVariant={_tazo.creatureVariant} shinyImageUrl={_tazo.shinyImageUrl}
              className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: rarityColor || "var(--ttg-rarity-common)" }}>
              <span className="text-6xl font-black text-white/80">{(_tazo.name || "?")[0]}</span>
              <span className="text-[8px] font-black text-white/40 mt-1 uppercase tracking-wider">{_tazo.name || "Unknown Tazo"}</span>
            </div>
          )}
        </motion.div>

        {/* Name + franchise */}
        <div className="space-y-1 animate-[popUp_0.5s_ease-out_0.25s_both]">
          <h3 className={`uppercase font-black ${
            isLegendary ? "text-2xl sm:text-3xl" : isHighRarity ? "text-xl sm:text-2xl" : "text-xl"
          }`}
            style={{
              color: 'var(--ttg-black)',
              textShadow: isLegendary ? "0 0 20px #f59e0b40" : "none",
            }}>
            {_tazo.displayName || _tazo.name}
          </h3>
          <p className="text-xs font-bold text-ttg-black/35 uppercase tracking-wider">
            #{_tazo.number || _tazo.id?.slice(-3)} · {_tazo.franchiseName || selectedBag.franchise}
          </p>
        </div>

        {/* Stats with rarity-tuned staggered animation */}
        <div className="p-4 bg-white border-3 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)] animate-[popUp_0.5s_ease-out_both]"
          style={{ animationDelay: isLegendary ? "0.55s" : isUltraRare ? "0.45s" : isRare ? "0.25s" : "0.15s" }}>
          <StatsRow tazo={_tazo} />
        </div>

        {/* Legendary special message */}
        {isLegendary && (
          <div className="animate-[popUp_0.7s_ease-out_both]" style={{ animationDelay: "0.65s" }}>
            <div className="inline-block px-4 py-2 bg-ttg-yellow/10 border-2 border-ttg-warning"
              style={{ boxShadow: "0 0 20px #f59e0b30" }}>
              <p className="text-sm font-black text-ttg-dracobell uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-5 h-5" /> Legendary Find! <Trophy className="w-5 h-5" />
              </p>
              <p className="text-[9px] font-bold text-ttg-dracobell/50 mt-0.5 uppercase tracking-[0.2em]">
                One of the rarest tazos in the game
              </p>
            </div>
          </div>
        )}

        {/* Bonus tazo */}
        {bonusTazo && (
          <div className="p-4 border-3 animate-[popUp_0.5s_ease-out_0.55s_both]"
            style={{ borderColor: "var(--ttg-warning)", background: "linear-gradient(135deg, #FEF3C7, #FFF8E7)", boxShadow: "3px 3px 0px var(--ttg-warning)" }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-ttg-warning" />
              <p className="text-sm font-black uppercase text-ttg-warning">Bonus Tazo!</p>
            </div>
            <div className="flex items-center justify-center gap-4 p-2">
              {bonusTazo.imageUrl && (
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-ttg-black shadow-[2px_2px_0px_var(--ttg-black)]" style={{ background: 'var(--ttg-black)' }}>
                  <TazoDiscImage src={bonusTazo.imageUrl} alt={bonusTazo.name} size="100%" borderWidth={0}
                    franchiseSlug={bonusTazo.franchiseSlug} finish={bonusTazo.finish} creatureVariant={bonusTazo.creatureVariant} shinyImageUrl={bonusTazo.shinyImageUrl}
                    className="w-full h-full" />
                </div>
              )}
              <div className="text-left">
                <p className="font-black text-sm text-ttg-black">{bonusTazo.displayName || bonusTazo.name}</p>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 border"
                  style={{ borderColor: RARITY_GRADIENT[bonusTazo.rarity] || "var(--ttg-rarity-common)", color: RARITY_GRADIENT[bonusTazo.rarity] || "var(--ttg-rarity-common)" }}>
                  {RARITY_LABELS[bonusTazo.rarity] || bonusTazo.rarity}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions — delayed entrance for drama */}
        <div className="flex flex-wrap gap-3 justify-center animate-[popUp_0.5s_ease-out_both]"
          style={{ animationDelay: isLegendary ? "0.8s" : isHighRarity ? "0.5s" : "0.3s" }}>
          <button onClick={handleReset}
            className="mag-btn px-6 py-3 font-black text-xs uppercase bg-ttg-yellow text-ttg-black border-3 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
            <ShoppingBag className="w-4 h-4 inline mr-1" />Open Another
          </button>
          <Link href="/app/collection"
            className="mag-btn px-6 py-3 font-black text-xs uppercase bg-ttg-black text-ttg-yellow border-3 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
            <ChevronRight className="w-4 h-4 inline mr-1" />Collection
          </Link>
          <button onClick={handleReset}
            className="mag-btn px-6 py-3 font-black text-xs uppercase bg-white text-ttg-black/40 border-2 border-ttg-black/10 active:translate-x-0.5 active:translate-y-0.5 transition-all">
            Close
          </button>
        </div>
      </div>
    )
  }

  // ── BULK REVEAL  // ── BULK REVEAL STAGE ────────────────────────────────────
  if (stage === "reveal-bulk" && revealedTazos.length > 0) {
    const rarityCounts: Record<string, number> = {}
    let maxRarity = "common"
    for (const t of revealedTazos) {
      rarityCounts[t.rarity] = (rarityCounts[t.rarity] || 0) + 1
      if (RARITY_ORDER[t.rarity] > (RARITY_ORDER[maxRarity] || 0)) maxRarity = t.rarity
    }
    const hasLegendary = maxRarity === "legendary"
    const hasUltra = maxRarity === "ultra-rare"

    return (
      <div className="max-w-3xl mx-auto py-6 sm:py-8 px-4 space-y-6 text-center animate-fadeIn">
        <ConfettiBurst active={hasLegendary || hasUltra} />

        {/* Header */}
        <div className="space-y-1">
          <div className={`inline-block px-4 py-1.5 border-3 text-sm font-black uppercase tracking-wider ${hasLegendary ? "animate-pulse" : ""}`}
            style={{
              borderColor: 'var(--ttg-black)',
              background: RARITY_GRADIENT[maxRarity] || "var(--ttg-rarity-common)",
              color: "#fff",
              boxShadow: "3px 3px 0px var(--ttg-black)",
            }}>
            <Gift className="w-4 h-4 inline mr-1" />
            {revealedTazos.length} Tazos Opened!
          </div>
          <p className="text-[10px] font-bold text-ttg-black/30">
            From {bulkTotal} {selectedBag.name}{bulkTotal > 1 ? "s" : ""}
          </p>
        </div>

        {/* Rarity summary */}
        <div className="flex flex-wrap justify-center gap-1.5">
          {Object.entries(rarityCounts).sort((a, b) => (RARITY_ORDER[b[0]] || 0) - (RARITY_ORDER[a[0]] || 0)).map(([r, c]) => (
            <span key={r} className="px-2 py-0.5 border-2 text-[8px] font-black uppercase"
              style={{ borderColor: RARITY_GRADIENT[r] || "var(--ttg-rarity-common)", color: RARITY_GRADIENT[r] || "var(--ttg-rarity-common)", backgroundColor: `${RARITY_GRADIENT[r]}10` }}>
              {RARITY_LABELS[r] || r}: {c}
            </span>
          ))}
        </div>

        {/* Tazo grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
          {revealedTazos.map((t, i) => (
            <div key={i}
              className="flex flex-col items-center gap-1 p-2 bg-white border-2 border-ttg-black/10 shadow-[2px_2px_0px_var(--ttg-black)]/3 hover:border-ttg-black/30 hover:shadow-[2px_2px_0px_#1a1a1a15] transition-all animate-bounce-in"
              style={{ animationDelay: `${i * 60}ms` }}>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-ttg-black/20 flex items-center justify-center overflow-hidden"
                style={{ background: `radial-gradient(circle at 30% 30%, ${RARITY_GRADIENT[t.rarity] || "var(--ttg-rarity-common)"}20, var(--ttg-black))` }}>
                {t.imageUrl ? (
                  <TazoDiscImage src={t.imageUrl} alt={t.name} size="100%" borderWidth={0}
                    franchiseSlug={t.franchiseSlug} finish={t.finish} creatureVariant={t.creatureVariant}
                    shinyImageUrl={t.shinyImageUrl} className="w-full h-full" />
                ) : (
                  <span className="text-ttg-yellow/40 text-lg font-black">?</span>
                )}
              </div>
              <span className="text-[8px] font-black text-ttg-black text-center leading-tight line-clamp-2">{t.name}</span>
              <span className="text-[7px] font-bold uppercase px-1 py-0.5"
                style={{ backgroundColor: `${RARITY_GRADIENT[t.rarity] || "var(--ttg-rarity-common)"}15`, color: RARITY_GRADIENT[t.rarity] || "var(--ttg-rarity-common)" }}>
                {RARITY_LABELS[t.rarity] || t.rarity}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={handleReset}
            className="mag-btn px-6 py-3 font-black text-xs uppercase bg-ttg-yellow text-ttg-black border-3 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
            <ShoppingBag className="w-4 h-4 inline mr-1" />Buy More
          </button>
          <Link href="/app/collection"
            className="mag-btn px-6 py-3 font-black text-xs uppercase bg-ttg-black text-ttg-yellow border-3 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
            <ChevronRight className="w-4 h-4 inline mr-1" />Collection
          </Link>
        </div>
      </div>
    )
  }

  // Loading/unknown state — show spinner, never blank
  return (
    <div className="flex items-center justify-center py-12 animate-fadeIn">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-ttg-black/10 border-t-ttg-yellow rounded-full animate-spin" />
        <p className="text-xs font-bold text-ttg-black/30 uppercase tracking-wider">Loading…</p>
      </div>
    </div>
  )
}
