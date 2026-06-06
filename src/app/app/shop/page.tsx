// ============================================================
// Trading Tazos Game — Bag Shop Page
// Buy potato chip bags with credits and open them.
// ============================================================
"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import dynamic from "next/dynamic"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { ShoppingBag, Coins, Zap, Star, Gift, Loader2, X, Sparkles, Crosshair, Trophy, Calendar, Check, ShoppingCart, Scissors } from "lucide-react"
import ConfettiBurst from "@/components/game/confetti-burst"
import type { BagData } from "@/components/game/bag-opener-3d"
import { pickBagVariant } from "@/lib/bag-variants"
import { playSFX, sfxEnsureUnlocked } from "@/lib/audio/sfx-engine"

// Dynamic imports for 3D components (SSR-safe)
const BagOpener3D = dynamic(() => import("@/components/game/bag-opener-3d"), { ssr: false })

interface BagConfig {
  type: string
  name: string
  cost: number
  bonusChance: number
  rareBoost: number
  color: string
  franchise: string
  icon: React.ReactNode
}

const BAGS: BagConfig[] = [
  {
    type: "standard",
    name: "Classic Bag",
    cost: 25,
    bonusChance: 12,
    rareBoost: 1,
    color: "#FFCC00",
    franchise: "minimon",
    icon: <ShoppingBag className="w-5 h-5" />,
  },
  {
    type: "premium",
    name: "Premium Bag",
    cost: 25,
    bonusChance: 18,
    rareBoost: 2,
    color: "#3B82F6",
    franchise: "cybermon",
    icon: <Star className="w-5 h-5" />,
  },
  {
    type: "mega",
    name: "Mega Bag",
    cost: 25,
    bonusChance: 25,
    rareBoost: 3,
    color: "#F97316",
    franchise: "dracobell",
    icon: <Zap className="w-5 h-5" />,
  },
]

const RARITY_COLORS: Record<string, string> = {
  common: "#9CA3AF",
  uncommon: "#22C55E",
  rare: "#3B82F6",
  "ultra-rare": "#A855F7",
  legendary: "#F59E0B",
}

const RARITY_LABELS: Record<string, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  "ultra-rare": "Ultra Rare",
  legendary: "Legendary",
}

function BagPreview({ bag }: { bag: BagConfig }) {
  const variant = useMemo(() => pickBagVariant(bag.franchise), [bag.franchise])
  return (
    <div
      className="relative w-full h-full overflow-hidden border-2 border-[#1a1a1a] bg-[#fffbe6] shadow-[2px_2px_0px_#1a1a1a]"
      style={{
        background:
          "radial-gradient(circle at 25% 20%, rgba(255,255,255,0.9), transparent 22%), repeating-linear-gradient(-8deg, rgba(26,26,26,0.04) 0 6px, transparent 6px 13px), #fffbe6",
      }}
    >
      <div className="absolute left-3 top-3 z-10 border-2 border-[#1a1a1a] bg-[#FFCC00] px-2 py-1 text-[9px] font-black uppercase tracking-widest text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]">
        {bag.franchise}
      </div>
      <div
        className="absolute right-3 top-3 z-10 h-7 w-7 border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]"
        style={{ backgroundColor: bag.color }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center px-8 py-5">
        <div className="relative h-full w-full max-w-[10rem]">
          <img
            src={variant.frontUrl}
            alt={`${bag.name} front`}
            className="absolute left-[12%] top-2 h-[88%] w-auto max-w-[70%] -rotate-6 object-contain drop-shadow-[8px_10px_0_rgba(26,26,26,0.22)]"
            draggable={false}
          />
          <img
            src={variant.backUrl}
            alt={`${bag.name} back`}
            className="absolute right-[2%] top-8 h-[72%] w-auto max-w-[58%] rotate-6 object-contain opacity-80 drop-shadow-[5px_7px_0_rgba(26,26,26,0.18)]"
            draggable={false}
          />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 border-t-3 border-[#1a1a1a] bg-white/90 px-3 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/55">
        Front + back preview
      </div>
    </div>
  )
}

export default function BagShopPage() {
  const { t } = useI18n()
  const { user, token } = useAuth()
  const [credits, setCredits] = useState(0)
  const [selectedBag, setSelectedBag] = useState<BagConfig>(BAGS[0])
  const [buying, setBuying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bagId, setBagId] = useState<string | null>(null)

  // Opening states
  const [stage, setStage] = useState<"select" | "buying" | "opening" | "reveal">("select")
  const [tearProgress, setTearProgress] = useState(0)
  const [revealedTazo, setRevealedTazo] = useState<any>(null)
  const [bonusTazo, setBonusTazo] = useState<any>(null)
  const [openingAnim, setOpeningAnim] = useState(false)
  const [pendingBags, setPendingBags] = useState<number>(0)
  const [dailyClaimable, setDailyClaimable] = useState(false)
  const [claimingDaily, setClaimingDaily] = useState(false)

  const tearIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const bagIdRef = useRef<string | null>(null)

  // Keep ref in sync with state so callbacks always read latest bagId
  useEffect(() => { bagIdRef.current = bagId }, [bagId])

  // Load pending bags count
  useEffect(() => {
    if (!token) return
    fetch("/api/bags", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setPendingBags(d.total ?? 0))
      .catch(() => {})
  }, [token, stage])

  // Load credits
  useEffect(() => {
    if (!token) return
    fetch("/api/credits", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setCredits(d.credits ?? 0))
      .catch(() => {})
  }, [token])

  useEffect(() => {
    if (!token) return
    fetch("/api/credits/daily", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setDailyClaimable(!!d.claimable))
      .catch(() => {})
  }, [token])

  const handleBuy = useCallback(async (bag?: BagConfig) => {
    const targetBag = bag || selectedBag
    if (!token) return
    setBuying(true)
    setError(null)
    try {
      const res = await fetch("/api/bags/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bagType: targetBag.type }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Purchase failed")
        setBuying(false)
        return
      }
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
  }, [token, selectedBag])

  const claimDaily = useCallback(async () => {
    if (!token || claimingDaily || !dailyClaimable) return
    setClaimingDaily(true)
    setError(null)
    try {
      const res = await fetch("/api/credits/daily", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Daily bonus already claimed")
        setDailyClaimable(false)
        return
      }
      setCredits(data.credits ?? credits)
      setDailyClaimable(false)
      playSFX('coin', { volume: 0.35 })
    } catch {
      setError("Failed to claim daily bonus")
    } finally {
      setClaimingDaily(false)
    }
  }, [token, claimingDaily, dailyClaimable, credits])

  const startTearAnimation = () => {
    // Prevent double animation start
    if (tearIntervalRef.current) clearInterval(tearIntervalRef.current)
    setOpeningAnim(true)
    const duration = 2000
    const interval = 50
    const steps = duration / interval
    let step = 0
    tearIntervalRef.current = setInterval(() => {
      step++
      const progress = Math.min(1, step / steps)
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2
      setTearProgress(eased)
      if (step >= steps) {
        if (tearIntervalRef.current) clearInterval(tearIntervalRef.current)
        tearIntervalRef.current = null
        openBag()
      }
    }, interval)
  }

  const openBag = async () => {
    const currentBagId = bagIdRef.current
    if (!token || !currentBagId) {
      console.warn("openBag called without token or bagId", { token: !!token, bagId: currentBagId })
      setStage("select")
      setOpeningAnim(false)
      setError("Something went wrong — please try again")
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
          setBonusTazo(data.bonusTazo)
          setStage("reveal")
          setOpeningAnim(false)
        }, 500)
      } else {
        setError(data.error || "Failed to open bag")
        setStage("select")
        setOpeningAnim(false)
      }
    } catch {
      setError("Connection error")
      setStage("select")
      setOpeningAnim(false)
    }
  }

  const handleReset = () => {
    if (tearIntervalRef.current) clearInterval(tearIntervalRef.current)
    tearIntervalRef.current = null
    setStage("select")
    setBagId(null)
    bagIdRef.current = null
    setRevealedTazo(null)
    setBonusTazo(null)
    setTearProgress(0)
    setOpeningAnim(false)
    setError(null)
  }

  const creditDisplay = (
    <div className="flex items-center gap-2 px-4 py-2 bg-[#FFCC00] border-3 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]">
      <Coins className="w-5 h-5 text-[#1a1a1a]" />
      <span className="font-black text-sm text-[#1a1a1a]">{credits}</span>
      <span className="text-[10px] font-bold text-[#1a1a1a]/60 uppercase">credits</span>
    </div>
  )

  // ── Guest ──
  if (!user) {
    return (
        <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
          <ShoppingBag className="w-16 h-16 mx-auto text-zinc-400" />
          <h1 className="text-2xl font-black uppercase tracking-wider text-[#1a1a1a]">
            {t.shop_title || "Tazo Shop"}
          </h1>
          <p className="text-sm text-zinc-500">{t.auth_login} {t.shop_login_cta || "to buy bags"}</p>
          <Link href="/login" className="mag-btn inline-block bg-[#FFCC00] text-[#1a1a1a] font-black uppercase px-6 py-3 border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
            {t.auth_login}
          </Link>
        </div>
    )
  }

  // ── Select stage ──
  if (stage === "select") {
    return (
        <div className="max-w-5xl mx-auto py-2 px-2 space-y-2 flex flex-col h-[calc(100vh-140px)] overflow-hidden">
          {/* ═══════════════════════════════════════════ */}
          {/* MAGAZINE BANNER STRIP                      */}
          {/* ═══════════════════════════════════════════ */}
          <div className="mag-card-yellow rounded-none px-3 py-1.5 flex flex-wrap items-center gap-2 flex-shrink-0" style={{ borderBottom: "3px solid #1a1a1a" }}>
            <div className="flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-[#E3350D]" />
              <h1 className="text-sm font-black text-[#1a1a1a] tracking-tight uppercase">
                {t.shop_title || "Tazo Shop"}
              </h1>
            </div>
            <div className="w-px h-4 bg-[#1a1a1a]/30" />
            <div className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-[#1a1a1a]" />
              <span className="font-black text-sm text-[#1a1a1a]">{credits}</span>
              <span className="text-[9px] font-bold text-[#1a1a1a]/50 uppercase">cr</span>
            </div>
            {pendingBags > 0 && (
              <>
                <div className="w-px h-4 bg-[#1a1a1a]/30" />
                <button
                  onClick={async () => {
                    if (!token) return
                    setError(null)
                    setBuying(true)
                    try {
                      const res = await fetch("/api/bags", { headers: { Authorization: `Bearer ${token}` } })
                      const data = await res.json()
                      if (data.bags?.length > 0) {
                        const firstBag = data.bags[0]
                        setBagId(firstBag.id)
                        const franchiseSlug = firstBag.preview?.franchise || "minimon"
                        setSelectedBag({ type: firstBag.bagType || "standard", name: "Mystery Bag", cost: 0, bonusChance: 10, rareBoost: 1, color: firstBag.preview?.franchiseColor || "#FFCC00", franchise: franchiseSlug, icon: <Gift className="w-5 h-5" /> })
                        setBuying(false)
                        setStage("opening")
                        setTearProgress(0)
                        setOpeningAnim(false)
                        sfxEnsureUnlocked()
                        playSFX('coin', { volume: 0.35 })
                      }
                    } catch {
                      setError("Failed to fetch bags")
                      setBuying(false)
                    }
                  }}
                  disabled={buying}
                  className="text-[10px] font-black text-[#E3350D] uppercase hover:underline flex items-center gap-1"
                >
                  <Gift className="w-3.5 h-3.5" />
                  {pendingBags} free bag{pendingBags > 1 ? 's' : ''} — open now
                </button>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-1.5 bg-red-50 border-2 border-red-300 text-center flex-shrink-0">
              <p className="text-[10px] font-black text-red-600">{error}</p>
              <button onClick={() => setError(null)} className="text-[8px] underline font-black">
                <X className="w-2.5 h-2.5 inline" /> Dismiss
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* BAG GRID — 3 cards fill available height  */}
          {/* ═══════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1 min-h-0">
            {BAGS.map(bag => {
              const isSelected = selectedBag.type === bag.type
              const canAfford = credits >= bag.cost
              return (
              <button
                key={bag.type}
                data-bag-card={bag.type}
                onClick={() => { setSelectedBag(bag) }}
                className={`relative p-2 flex flex-col text-left border-2 transition-all ${
                  isSelected
                    ? "border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] -translate-x-0.5 -translate-y-0.5 bg-white"
                    : "border-zinc-200 shadow-[2px_2px_0px_#1a1a1a] bg-white/60 hover:border-[#FFCC00] hover:bg-white"
                }`}
              >
                {/* 3D bag preview */}
                <div className="flex-1 min-h-0 mb-1.5">
                  <BagPreview bag={bag} />
                </div>

                {/* Info row */}
                <div className="flex-shrink-0 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-[11px] uppercase text-[#1a1a1a]">{bag.name}</h3>
                    <span className="text-[9px] font-black text-[#1a1a1a]/30 uppercase">{bag.franchise}</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-black text-zinc-500">
                    <span className="flex items-center gap-1"><Crosshair className="w-2.5 h-2.5" />{bag.rareBoost}x rare</span>
                    <span className="flex items-center gap-1"><Gift className="w-2.5 h-2.5" />{bag.bonusChance}% bonus</span>
                  </div>

                  {/* BUY button — inline within card */}
                  <div className="pt-1">
                    <div
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedBag(bag)
                        if (canAfford && !buying) handleBuy(bag)
                      }}
                      className={`w-full py-1.5 text-center text-[10px] font-black uppercase tracking-wider border-2 border-[#1a1a1a] transition-all ${
                        isSelected && canAfford
                          ? "bg-[#22C55E] text-white shadow-[2px_2px_0px_#1a1a1a] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#1a1a1a]"
                          : isSelected && !canAfford
                          ? "bg-zinc-400 text-white/60 cursor-not-allowed"
                          : "bg-[#1a1a1a] text-[#FFCC00] opacity-70 hover:opacity-100"
                      }`}
                    >
                      {buying && isSelected ? (
                        <span className="flex items-center justify-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> ...</span>
                      ) : isSelected ? (
                        canAfford ? <span><ShoppingBag className="w-3 h-3 inline mr-1" />BUY · {bag.cost} CR</span>
                                  : <span><Coins className="w-3 h-3 inline mr-1" />NEED {bag.cost - credits} MORE</span>
                      ) : (
                        <span>SELECT · {bag.cost} CR</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )})}
          </div>

          {/* How to earn — compact footer */}
          <div className="px-3 py-1.5 bg-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={claimDaily}
                disabled={!dailyClaimable || claimingDaily}
                className="flex items-center gap-1 border-2 border-[#1a1a1a] bg-[#3B4CCA] px-2 py-1 text-[9px] font-black uppercase text-white shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1a1a1a] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 disabled:shadow-none transition-all"
              >
                {claimingDaily ? <Loader2 className="h-3 w-3 animate-spin" /> : <Calendar className="h-3 w-3" />}
                {dailyClaimable ? "Claim +25" : "Claimed"}
              </button>
              <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-500">
                <span className="flex items-center gap-0.5"><Trophy className="w-2.5 h-2.5 text-[#F59E0B]" /> Battles +30</span>
                <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5 text-[#3B4CCA]" /> Daily +25</span>
                <span className="flex items-center gap-0.5"><Check className="w-2.5 h-2.5 text-[#22C55E]" /> Quests +50-200</span>
              </div>
            </div>
          </div>
        </div>
    )
  }

  // ── Opening stage — 3D bag with real textures ──
  if (stage === "opening") {
    const bagPreview: BagData = {
      id: bagId || "",
      bagType: selectedBag.type,
      preview: null, // API doesn't return preview on buy; derive from selection
    }
    // Try to determine franchise from bag type or fallback
    const franchiseSlug = selectedBag.franchise || "minimon"
    const bagData = { ...bagPreview, preview: { franchise: { slug: franchiseSlug }, rarity: "common" } }

    return (
        <div className="max-w-2xl mx-auto py-6 px-4 text-center space-y-3">
          <h2 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a]">
            <Scissors className="w-4 h-4 inline mr-1" /> Drag to tear open!
          </h2>
          <p className="text-xs font-black text-zinc-400">
            {tearProgress < 0.3 ? "Drag your finger/mouse across the bag to rip it open..." :
             tearProgress < 0.7 ? "Almost there — keep tearing!" : "Something shiny inside!"}
          </p>
          <div className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] overflow-hidden">
            <BagOpener3D
              bag={bagData}
              opening={openingAnim}
              progress={tearProgress}
              onOpen={() => {
                setOpeningAnim(true)
                playSFX('bag_tear')
                setTimeout(() => openBag(), 400)
              }}
              onSkip={() => {
                playSFX('bag_tear')
                setOpeningAnim(true)
                setTearProgress(1)
                setTimeout(() => openBag(), 150)
              }}
            />
          </div>
          <p className="text-xs font-bold text-zinc-500">
            {tearProgress < 0.02 ? 'Drag across the bag to tear it open!' :
             tearProgress < 1 ? "Tearing open..." : "Revealing tazo..."}
          </p>
        </div>
    )
  }

  // ── Reveal stage ──
  if (stage === "reveal" && revealedTazo) {
    const rarityColor = RARITY_COLORS[revealedTazo.rarity] || "#9CA3AF"
    const rarityLabel = RARITY_LABELS[revealedTazo.rarity] || revealedTazo.rarity

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-[#F59E0B]" />
            <h2 className="text-xl font-black uppercase tracking-wider text-[#1a1a1a]">
              Tazo Revealed!
            </h2>
            <Sparkles className="w-5 h-5 text-[#F59E0B]" />
          </div>

          {/* 2D Tazo reveal with card flip */}
          <ConfettiBurst active />
          <div className="h-72 perspective-[800px] flex items-center justify-center p-6">
            <div className="card-flip-reveal w-52 h-52">
              <div
                className="relative w-full h-full rounded-full border-4 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] flex items-center justify-center overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${revealedTazo.franchise?.color || "#FFCC00"}, #fffef0)`,
                }}
              >
                {revealedTazo.imageUrl ? (
                  <img
                    src={revealedTazo.imageUrl}
                    alt={revealedTazo.displayName || revealedTazo.name || "Tazo"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={`/tazos-artgen/backs/${revealedTazo.franchise?.slug || "minimon"}-back.png`}
                    alt={revealedTazo.franchise?.name || "series back"}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Tazo info card */}
          <div className="mag-card p-6 space-y-3 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a]">
                {revealedTazo.displayName || revealedTazo.name}
              </h3>
              <span
                className="px-3 py-1 text-[10px] font-black uppercase border-2 rounded"
                style={{ borderColor: rarityColor, color: rarityColor }}
              >
                {rarityLabel}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-bold">
              {revealedTazo.franchise?.name || revealedTazo.franchise?.slug}
            </p>
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2">
              {["attack", "defense", "resistance", "weight", "stability", "spin", "control", "bounce", "precision"].map(stat => (
                <div key={stat} className="text-center p-1.5 bg-zinc-50 border border-zinc-200 rounded">
                  <div className="text-[9px] font-bold text-zinc-400 uppercase">{stat.substring(0, 3)}</div>
                  <div className="text-sm font-black text-[#1a1a1a]">{revealedTazo[stat]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bonus tazo */}
          {bonusTazo && (
            <div className="p-4 bg-[#F59E0B10] border-3 border-[#F59E0B]">
              <p className="text-xs font-black uppercase text-[#F59E0B] flex items-center justify-center gap-1">
                <Gift className="w-4 h-4" /> Bonus Tazo!
              </p>
              <p className="text-sm font-black text-[#1a1a1a] mt-1">
                {bonusTazo.displayName || bonusTazo.name}
              </p>
              <span
                className="inline-block mt-1 px-2 py-0.5 text-[9px] font-black uppercase border"
                style={{ borderColor: (RARITY_COLORS[bonusTazo.rarity] || "#9CA3AF"), color: (RARITY_COLORS[bonusTazo.rarity] || "#9CA3AF") }}
              >
                {RARITY_LABELS[bonusTazo.rarity] || bonusTazo.rarity}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleReset}
              className="mag-btn px-6 py-3 font-black text-sm uppercase bg-[#FFCC00] text-[#1a1a1a] border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              <ShoppingBag className="w-4 h-4 inline mr-1" /> Buy Another
            </button>
            <Link
              href="/app/collection"
              className="mag-btn px-6 py-3 font-black text-sm uppercase bg-[#3B4CCA] text-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              View Collection
            </Link>
          </div>
        </div>
    )
  }

  return null
}
