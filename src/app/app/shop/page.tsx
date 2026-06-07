// ============================================================
// Trading Tazos Game — Bag Shop v2
// 3 bags at 3 price tiers: Classic (10cr), Premium (25cr), Mega (50cr)
// ============================================================
"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import dynamic from "next/dynamic"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import {
  ShoppingBag, Coins, Zap, Star, Gift, Loader2, X, Sparkles,
  Crosshair, Trophy, Calendar, ShoppingCart, Scissors, ChevronRight,
  Flame, Shield, Swords, Store, Tag,
} from "lucide-react"
import ConfettiBurst from "@/components/game/confetti-burst"
import type { BagData } from "@/components/game/bag-opener-3d"
import { pickBagVariant } from "@/lib/bag-variants"
import { playSFX, sfxEnsureUnlocked } from "@/lib/audio/sfx-engine"

const BagOpener3D = dynamic(() => import("@/components/game/bag-opener-3d"), { ssr: false })

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
}
const BAGS: BagConfig[] = [
  {
    type: "standard", name: "Classic Bag", cost: 10,
    bonusChance: 12, rareBoost: 1, color: "#FFCC00", bgColor: "#FFF8E7",
    franchise: "minimon", icon: <ShoppingBag className="w-4 h-4" />,
    tagline: "Original collection tazos",
  },
  {
    type: "premium", name: "Premium Bag", cost: 25,
    bonusChance: 18, rareBoost: 2, color: "#3B82F6", bgColor: "#EFF6FF",
    franchise: "cybermon", icon: <Star className="w-4 h-4" />,
    tagline: "Digital monsters and tech",
  },
  {
    type: "mega", name: "Mega Bag", cost: 50,
    bonusChance: 30, rareBoost: 4, color: "#F97316", bgColor: "#FFF7ED",
    franchise: "dracobell", icon: <Zap className="w-4 h-4" />,
    tagline: "Legendary auras, top rarity",
  },
]

const RARITY_GRADIENT: Record<string, string> = {
  common: "linear-gradient(135deg, #9CA3AF, #6B7280)",
  uncommon: "linear-gradient(135deg, #22C55E, #16A34A)",
  rare: "linear-gradient(135deg, #3B82F6, #2563EB)",
  "ultra-rare": "linear-gradient(135deg, #A855F7, #7C3AED)",
  legendary: "linear-gradient(135deg, #F59E0B, #D97706)",
}
const RARITY_LABELS: Record<string, string> = {
  common: "Common", uncommon: "Uncommon", rare: "Rare",
  "ultra-rare": "Ultra Rare", legendary: "Legendary",
}
const RARITY_EMOJI: Record<string, string> = {
  common: "⚪", uncommon: "🟢", rare: "🔵",
  "ultra-rare": "🟣", legendary: "👑",
}

// ── BagCard (select view) ──────────────────────────────
function BagCard({ bag, selected, onSelect, onBuy, buying, credits }: {
  bag: BagConfig; selected: boolean; onSelect: () => void;
  onBuy: () => void; buying: boolean; credits: number;
}) {
  const canAfford = credits >= bag.cost
  const variant = useMemo(() => pickBagVariant(bag.franchise), [bag.franchise])

  return (
    <button
      onClick={onSelect}
      className={`relative flex flex-col text-left border-3 overflow-hidden transition-all duration-200 group ${
        selected
          ? "border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] -translate-x-0.5 -translate-y-0.5 bg-white"
          : "border-[#1a1a1a]/12 shadow-[3px_3px_0px_#1a1a1a15] bg-white/70 hover:border-[#1a1a1a]/30 hover:bg-white hover:shadow-[3px_3px_0px_#1a1a1a]"
      }`}
    >
      {/* Price badge */}
      <div className={`absolute top-2 right-2 z-10 px-2.5 py-1 flex items-center gap-1 border-2 text-[10px] font-black ${
        selected
          ? "bg-[#1a1a1a] text-[#FFCC00] border-[#1a1a1a]"
          : "bg-white text-[#1a1a1a] border-[#1a1a1a]/20 group-hover:border-[#1a1a1a]"
      }`}>
        <Coins className="w-3 h-3" />
        {bag.cost}
      </div>

      {/* Franchise badge */}
      <div className={`absolute top-2 left-2 z-10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border ${
        selected ? "border-[#1a1a1a] bg-white" : "border-transparent bg-white/60"
      }`}>
        {bag.franchise}
      </div>

      {/* Bag preview image */}
      <div className="relative h-36 sm:h-44 flex items-center justify-center overflow-hidden"
        style={{ background: bag.bgColor }}>
        <div className="relative h-full w-28 sm:w-36">
          <img
            src={variant.backUrl}
            alt={`${bag.name} back`}
            className="absolute right-0 top-6 h-[70%] w-auto rotate-8 object-contain opacity-75 drop-shadow-[4px_6px_0_rgba(26,26,26,0.18)] z-0"
            draggable={false}
          />
          <img
            src={variant.frontUrl}
            alt={`${bag.name} front`}
            className="absolute left-0 top-3 h-[85%] w-auto -rotate-6 object-contain drop-shadow-[6px_8px_0_rgba(26,26,26,0.25)] z-10"
            draggable={false}
          />
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <h3 className="font-black text-xs uppercase text-[#1a1a1a]">{bag.name}</h3>
        <p className="text-[9px] font-bold text-[#1a1a1a]/40">{bag.tagline}</p>
        <div className="flex items-center gap-2 text-[8px] font-black">
          <span className="flex items-center gap-1 text-[#1a1a1a]/50">
            <Crosshair className="w-2.5 h-2.5" />{bag.rareBoost}x rare
          </span>
          <span className="flex items-center gap-1 text-[#1a1a1a]/50">
            <Gift className="w-2.5 h-2.5" />{bag.bonusChance}% bonus
          </span>
        </div>

        {/* Buy action */}
        <div className="pt-1.5">
          <div
            role="button"
            onClick={(e) => { e.stopPropagation(); if (canAfford) onBuy() }}
            className={`w-full py-2 text-center text-[10px] font-black uppercase tracking-wider border-2 border-[#1a1a1a] transition-all ${
              selected && canAfford
                ? "bg-[#22C55E] text-white shadow-[3px_3px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px]"
                : selected && !canAfford
                ? "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                : "bg-[#1a1a1a]/5 text-[#1a1a1a]/30 group-hover:text-[#1a1a1a]/50"
            }`}
          >
            {buying && selected ? (
              <span className="flex items-center justify-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Opening...</span>
            ) : selected ? (
              canAfford ? <span><Scissors className="w-3 h-3 inline mr-1" />BUY · {bag.cost} CR</span>
                        : <span><Coins className="w-3 h-3 inline mr-1" />Need {bag.cost - credits} more</span>
            ) : (
              <span>SELECT</span>
            )}
          </div>
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
  const stats = [
    { label: "ATK", value: tazo.attack, color: "#E3350D" },
    { label: "DEF", value: tazo.defense, color: "#3B4CCA" },
    { label: "SPD", value: Math.round((tazo.bounce + tazo.spin + tazo.precision) / 3), color: "#22C55E" },
    { label: "WGT", value: tazo.weight, color: "#78716C" },
    { label: "STA", value: tazo.stability, color: "#F59E0B" },
    { label: "CTL", value: tazo.control, color: "#06B6D4" },
  ]
  const total = stats.reduce((a, s) => a + s.value, 0)
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1.5">
        {stats.map(s => (
          <div key={s.label} className="p-2 text-center bg-white border-2 border-[#1a1a1a]/10 shadow-[1px_1px_0px_#1a1a1a10]">
            <div className="text-[8px] font-black text-[#1a1a1a]/30 uppercase mb-0.5">{s.label}</div>
            <div className="text-sm font-black" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-1">
        <Flame className="w-3 h-3 text-[#E3350D]" />
        <span className="text-[9px] font-black text-[#1a1a1a]/40">TOTAL POWER</span>
        <span className="text-sm font-black text-[#E3350D]">{total}</span>
      </div>
    </div>
  )
}

// ── Main Shop Page ─────────────────────────────────────
export default function BagShopPage() {
  const { t } = useI18n()
  const { user, token } = useAuth()
  const [credits, setCredits] = useState(0)
  const [selectedBag, setSelectedBag] = useState<BagConfig>(BAGS[0])
  const [buying, setBuying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bagId, setBagId] = useState<string | null>(null)

  // Opening states
  const [stage, setStage] = useState<"select" | "opening" | "reveal">("select")
  const [tearProgress, setTearProgress] = useState(0)
  const [revealedTazo, setRevealedTazo] = useState<any>(null)
  const [bonusTazo, setBonusTazo] = useState<any>(null)
  const [openingAnim, setOpeningAnim] = useState(false)
  const [pendingBags, setPendingBags] = useState<number>(0)
  const [dailyClaimable, setDailyClaimable] = useState(false)
  const [claimingDaily, setClaimingDaily] = useState(false)

  // Shop tabs: bags | marketplace
  const [shopTab, setShopTab] = useState<"bags" | "marketplace">("bags")

  const bagIdRef = useRef<string | null>(null)
  useEffect(() => { bagIdRef.current = bagId }, [bagId])

  // Poll bags + credits
  useEffect(() => {
    if (!token) return
    fetch("/api/bags", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setPendingBags(d.total ?? 0)).catch(() => {})
  }, [token, stage])
  useEffect(() => {
    if (!token) return
    fetch("/api/credits", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setCredits(d.credits ?? 0)).catch(() => {})
  }, [token])
  useEffect(() => {
    if (!token) return
    fetch("/api/credits/daily", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setDailyClaimable(!!d.claimable)).catch(() => {})
  }, [token])

  const handleBuy = useCallback(async (bag: BagConfig) => {
    if (!token) return
    setSelectedBag(bag)
    setBuying(true)
    setError(null)
    try {
      const res = await fetch("/api/bags/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bagType: bag.type }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Purchase failed"); setBuying(false); return }
      setCredits(data.creditsRemaining)
      setBagId(data.bagId)
      setBuying(false)
      setStage("opening")
      setTearProgress(0)
      setOpeningAnim(false)
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
    if (!token || !currentBagId) {
      setStage("select"); setOpeningAnim(false)
      setError("Something went wrong — try again")
      return
    }
    try {
      const res = await fetch("/api/bags/open", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bagId: currentBagId }),
      })
      const data = await res.json()
      if (res.ok) {
        setTimeout(() => {
          playSFX('reveal', { volume: 0.5 })
          setRevealedTazo(data.tazo)
          setBonusTazo(data.bonusTazo || null)
          setStage("reveal")
          setOpeningAnim(false)
        }, 400)
      } else {
        setError(data.error || "Failed to open"); setStage("select"); setOpeningAnim(false)
      }
    } catch {
      setError("Connection error"); setStage("select"); setOpeningAnim(false)
    }
  }, [token])

  const handleReset = useCallback(() => {
    setStage("select"); setBagId(null); bagIdRef.current = null
    setRevealedTazo(null); setBonusTazo(null)
    setTearProgress(0); setOpeningAnim(false); setError(null)
  }, [])

  // ── Guest ──
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
        <ShoppingBag className="w-16 h-16 mx-auto text-[#1a1a1a]/10" />
        <h1 className="text-2xl font-black uppercase tracking-wider text-[#1a1a1a]">
          {t.shop_title || "Tazo Shop"}
        </h1>
        <p className="text-sm font-bold text-[#1a1a1a]/30">{t.auth_login} to buy bags and open tazos</p>
        <Link href="/login"
          className="mag-btn inline-block bg-[#FFCC00] text-[#1a1a1a] font-black uppercase px-6 py-3 border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
          {t.auth_login}
        </Link>
      </div>
    )
  }

  // ── SELECT STAGE ──────────────────────────────────────
  if (stage === "select") {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 space-y-4">

        {/* ── Banner ── */}
        <div
          className="px-4 py-3 flex flex-wrap items-center gap-3 relative overflow-hidden"
          style={{
            background: "linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 100%)",
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.025) 6px, rgba(255,255,255,0.025) 12px), linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 100%)`,
            border: "3px solid #1a1a1a",
            boxShadow: "4px 4px 0px #FFCC00",
          }}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#FFCC00]" />
            <h1 className="text-sm font-black text-white uppercase tracking-tight">
              {t.shop_title || "Tazo Shop"}
            </h1>
          </div>
          <div className="w-px h-5 bg-white/15" />
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-[#FFCC00]" />
            <span className="font-black text-sm text-white">{credits}</span>
            <span className="text-[9px] font-bold text-white/40 uppercase">cr</span>
          </div>
          {pendingBags > 0 && (
            <button
              onClick={async () => {
                if (!token) return; setError(null); setBuying(true)
                try {
                  const res = await fetch("/api/bags", { headers: { Authorization: `Bearer ${token}` } })
                  const data = await res.json()
                  if (data.bags?.length > 0) {
                    const first = data.bags[0]
                    setBagId(first.id)
                    setSelectedBag({ type: first.bagType || "standard", name: "Mystery Bag", cost: 0, bonusChance: 10, rareBoost: 1, color: "#FFCC00", bgColor: "#FFF8E7", franchise: first.preview?.franchise || "minimon", icon: <Gift className="w-4 h-4" />, tagline: "Free bag" })
                    setBuying(false); setStage("opening"); setTearProgress(0); setOpeningAnim(false)
                    sfxEnsureUnlocked(); playSFX('coin', { volume: 0.35 })
                  }
                } catch { setError("Failed"); setBuying(false) }
              }}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#E3350D] bg-white text-[10px] font-black text-[#E3350D] uppercase hover:bg-[#E3350D] hover:text-white transition-colors shadow-[2px_2px_0px_#E3350D]"
            >
              <Gift className="w-3.5 h-3.5" />
              {pendingBags} free bag{pendingBags > 1 ? "s" : ""}
            </button>
          )}
        </div>

        {/* ── Shop Tabs ── */}
        <div className="flex gap-0">
          <button onClick={() => setShopTab("bags")}
            className={`flex-1 py-2.5 text-xs font-black uppercase border-3 transition-all ${
              shopTab === "bags"
                ? "bg-[#1a1a1a] text-[#FFCC00] border-[#1a1a1a]"
                : "bg-white text-[#1a1a1a]/30 border-[#1a1a1a]/10 hover:text-[#1a1a1a]/50"
            }`}>
            <ShoppingBag className="w-3.5 h-3.5 inline mr-1" />Bags
          </button>
          <button onClick={() => setShopTab("marketplace")}
            className={`flex-1 py-2.5 text-xs font-black uppercase border-3 transition-all ${
              shopTab === "marketplace"
                ? "bg-[#1a1a1a] text-[#3B82F6] border-[#1a1a1a]"
                : "bg-white text-[#1a1a1a]/30 border-[#1a1a1a]/10 hover:text-[#1a1a1a]/50"
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {BAGS.map(bag => (
            <BagCard
              key={bag.type}
              bag={bag}
              selected={selectedBag.type === bag.type}
              onSelect={() => setSelectedBag(bag)}
              onBuy={() => handleBuy(bag)}
              buying={buying}
              credits={credits}
            />
          ))}
        </div>

        {/* ── How to earn ── */}
        <div className="p-3 bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={claimDaily}
              disabled={!dailyClaimable || claimingDaily}
              className={`flex items-center gap-1.5 px-3 py-1.5 border-2 font-black text-[9px] uppercase transition-all ${
                dailyClaimable
                  ? "border-[#1a1a1a] bg-[#3B4CCA] text-white shadow-[2px_2px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px]"
                  : "border-[#1a1a1a]/15 bg-zinc-100 text-zinc-400 cursor-not-allowed"
              }`}
            >
              {claimingDaily ? <Loader2 className="h-3 w-3 animate-spin" /> : <Calendar className="h-3 w-3" />}
              {dailyClaimable ? "Claim +25cr Daily" : "Claimed Today"}
            </button>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-bold text-[#1a1a1a]/40">
              <span className="flex items-center gap-1"><Swords className="w-2.5 h-2.5 text-[#E3350D]" />Battles +30cr</span>
              <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5 text-[#3B4CCA]" />Daily +25cr</span>
              <span className="flex items-center gap-1"><Trophy className="w-2.5 h-2.5 text-[#F59E0B]" />Quests +50-200cr</span>
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
      <div className="max-w-2xl mx-auto py-6 px-4 text-center space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a] flex items-center justify-center gap-2">
            <Scissors className="w-5 h-5 text-[#E3350D]" />
            Tear the bag open!
          </h2>
          <p className="text-xs font-bold text-[#1a1a1a]/30">
            Drag your finger across the bag to rip it
          </p>
        </div>

        <div className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] overflow-hidden">
          <BagOpener3D
            bag={{ id: bagId || "", bagType: selectedBag.type, preview: { franchise: { slug: selectedBag.franchise || "minimon" } } }}
            opening={openingAnim}
            progress={tearProgress}
            onOpen={() => { setOpeningAnim(true); playSFX('bag_tear'); setTimeout(() => openBag(), 350) }}
            onSkip={() => { playSFX('bag_tear'); setOpeningAnim(true); setTearProgress(1); setTimeout(() => openBag(), 150) }}
          />
        </div>

        <p className="text-[10px] font-bold text-[#1a1a1a]/25">
          {tearProgress < 0.02 ? "Hold and drag horizontally to tear" :
           tearProgress < 1 ? "Tearing..." : "Opening tazo..."}
        </p>
      </div>
    )
  }

  // ── REVEAL STAGE ───────────────────────────────────────
  if (stage === "reveal" && revealedTazo) {
    const rarityColor = RARITY_GRADIENT[revealedTazo.rarity]
    const rarityLabel = RARITY_LABELS[revealedTazo.rarity] || revealedTazo.rarity
    const rndRarity = revealedTazo.rarity
    const isHighRarity = rndRarity === "rare" || rndRarity === "ultra-rare" || rndRarity === "legendary"
    // const franchiseSlug = revealedTazo.franchiseSlug || revealedTazo.franchise || "minimon"
    const franchiseColor = (revealedTazo as any).franchiseColor || "#FFCC00"

    return (
      <div className="max-w-lg mx-auto py-6 sm:py-8 px-4 space-y-6 text-center">
        <ConfettiBurst active />

        {/* Header */}
        <div className={`inline-block px-4 py-1.5 border-3 text-sm font-black uppercase tracking-wider ${isHighRarity ? "animate-pulse" : ""}`}
          style={{
            borderColor: "#1a1a1a",
            background: rarityColor || "#9CA3AF",
            color: "#fff",
            boxShadow: "3px 3px 0px #1a1a1a",
          }}>
          {RARITY_EMOJI[rndRarity] || ""} {rarityLabel} Tazo!
        </div>

        {/* Tazo disc */}
        <div className="mx-auto w-52 h-52 rounded-full border-4 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] flex items-center justify-center overflow-hidden"
          style={{ background: franchiseColor }}>
          {revealedTazo.imageUrl ? (
            <img src={revealedTazo.imageUrl} alt={revealedTazo.name || ""}
              className="w-full h-full object-cover scale-110" />
          ) : (
            <div className="text-[#1a1a1a]/20 text-6xl">?</div>
          )}
        </div>

        {/* Name + franchise */}
        <div className="space-y-0.5">
          <h3 className="text-xl font-black text-[#1a1a1a] uppercase">
            {revealedTazo.displayName || revealedTazo.name}
          </h3>
          <p className="text-xs font-bold text-[#1a1a1a]/35 uppercase tracking-wider">
            #{(revealedTazo as any).number || revealedTazo.id?.slice(-3)} · {(revealedTazo as any).franchiseName || selectedBag.franchise}
          </p>
        </div>

        {/* Stats */}
        <div className="p-4 bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
          <StatsRow tazo={revealedTazo} />
        </div>

        {/* Bonus tazo */}
        {bonusTazo && (
          <div className="p-4 border-3 animate-bounce-in"
            style={{ borderColor: "#F59E0B", background: "linear-gradient(135deg, #FEF3C7, #FFF8E7)", boxShadow: "3px 3px 0px #F59E0B" }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-[#F59E0B]" />
              <p className="text-sm font-black uppercase text-[#F59E0B]">Bonus Tazo!</p>
            </div>
            <div className="flex items-center justify-center gap-4 p-2">
              {bonusTazo.imageUrl && (
                <img src={bonusTazo.imageUrl} alt={bonusTazo.name}
                  className="w-16 h-16 rounded-full border-2 border-[#1a1a1a] object-cover shadow-[2px_2px_0px_#1a1a1a]" />
              )}
              <div className="text-left">
                <p className="font-black text-sm text-[#1a1a1a]">{bonusTazo.displayName || bonusTazo.name}</p>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 border"
                  style={{ borderColor: RARITY_GRADIENT[bonusTazo.rarity] || "#9CA3AF", color: RARITY_GRADIENT[bonusTazo.rarity] || "#9CA3AF" }}>
                  {RARITY_LABELS[bonusTazo.rarity] || bonusTazo.rarity}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={handleReset}
            className="mag-btn px-6 py-3 font-black text-xs uppercase bg-[#FFCC00] text-[#1a1a1a] border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
            <ShoppingBag className="w-4 h-4 inline mr-1" />Open Another
          </button>
          <Link href="/app/collection"
            className="mag-btn px-6 py-3 font-black text-xs uppercase bg-[#1a1a1a] text-[#FFCC00] border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
            <ChevronRight className="w-4 h-4 inline mr-1" />Collection
          </Link>
        </div>
      </div>
    )
  }

  return null
}
