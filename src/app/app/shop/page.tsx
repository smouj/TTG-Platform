// ============================================================
// Trading Tazos Game — Bag Shop Page
// Buy potato chip bags with credits and open them.
// ============================================================
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { ShoppingBag, Coins, Zap, Star, Gift, Loader2, X, Sparkles, Crosshair, Trophy, Calendar, Check, ShoppingCart } from "lucide-react"
import ConfettiBurst from "@/components/game/confetti-burst"
import BagOpener3D, { type BagData } from "@/components/game/bag-opener-3d"

interface BagConfig {
  type: string
  name: string
  cost: number
  bonusChance: number
  rareBoost: number
  color: string
  icon: React.ReactNode
}

const BAGS: BagConfig[] = [
  {
    type: "standard",
    name: "Bolsa Clasica",
    cost: 50,
    bonusChance: 8,
    rareBoost: 1,
    color: "#FFCC00",
    icon: <ShoppingBag className="w-5 h-5" />,
  },
  {
    type: "premium",
    name: "Bolsa Premium",
    cost: 150,
    bonusChance: 15,
    rareBoost: 2,
    color: "#E3350D",
    icon: <Star className="w-5 h-5" />,
  },
  {
    type: "mega",
    name: "Mega Bolsa",
    cost: 400,
    bonusChance: 25,
    rareBoost: 3,
    color: "#7C3AED",
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
  common: "Comun",
  uncommon: "Poco Comun",
  rare: "Raro",
  "ultra-rare": "Ultra Raro",
  legendary: "Legendario",
}

function BagPreview({ bag, open = false, progress = 0 }: { bag: BagConfig; open?: boolean; progress?: number }) {
  return (
    <div className="relative h-full min-h-[150px] flex items-center justify-center overflow-hidden bg-[#fffef0] border-3 border-[#1a1a1a]">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(#1a1a1a 1px, transparent 1px)",
          backgroundSize: "10px 10px",
        }}
      />
      <div
        className="relative w-28 h-36 border-4 border-[#1a1a1a] shadow-[5px_5px_0px_#1a1a1a] flex flex-col items-center justify-between p-3 transition-transform duration-300"
        style={{
          background: `linear-gradient(145deg, ${bag.color}, #fffef0 160%)`,
          transform: open ? `rotate(${(progress - 0.5) * 8}deg) translateY(-4px)` : "rotate(-3deg)",
          clipPath: "polygon(10% 0, 90% 0, 100% 12%, 94% 100%, 6% 100%, 0 12%)",
        }}
      >
        <div className="w-full h-3 bg-white/45 border-2 border-[#1a1a1a]" />
        <div className="text-center">
          <ShoppingBag className="w-10 h-10 mx-auto text-[#1a1a1a]" />
          <p className="mt-2 text-[13px] font-black text-[#1a1a1a] tracking-wider">TAZOS</p>
          <p className="text-[8px] font-black text-[#1a1a1a]/60 uppercase">{bag.type}</p>
        </div>
        <div className="w-full h-5 bg-white border-2 border-[#1a1a1a] flex items-center justify-center text-[8px] font-black text-[#1a1a1a]">
          {bag.cost} CR
        </div>
        {open && (
          <div
            className="absolute left-2 right-2 top-4 h-1 bg-white border border-[#1a1a1a]"
            style={{ transform: `scaleX(${Math.max(0.05, progress)})`, transformOrigin: "left" }}
          />
        )}
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

  const handleBuy = useCallback(async () => {
    if (!token) return
    setBuying(true)
    setError(null)
    try {
      const res = await fetch("/api/bags/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bagType: selectedBag.type }),
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
      startTearAnimation()
    } catch {
      setError("Connection error")
      setBuying(false)
    }
  }, [token, selectedBag])

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
        <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
          {/* ═══════════════════════════════════════════ */}
          {/* MAGAZINE BANNER STRIP                      */}
          {/* ═══════════════════════════════════════════ */}
          <div className="mag-card-yellow rounded-none px-4 py-3 flex flex-wrap items-center gap-3" style={{ borderBottom: "4px solid #1a1a1a" }}>
            <div className="flex items-center gap-1.5">
              <ShoppingCart className="w-5 h-5 text-[#E3350D]" />
              <span className="text-sm font-black text-[#1a1a1a] tracking-tight uppercase">
                {t.shop_title || "Tazo Shop"}
              </span>
            </div>
            <div className="w-px h-5 bg-[#1a1a1a]/30" />
            {creditDisplay}
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* PENDING FREE BAGS                         */}
          {/* ═══════════════════════════════════════════ */}
          {pendingBags > 0 && (
            <div className="p-5 bg-[#FFCC00] border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Gift className="w-6 h-6 text-[#1a1a1a]" />
                <span className="text-lg font-black uppercase text-[#1a1a1a]">
                  {pendingBags} Bags to Open!
                </span>
              </div>
              <p className="text-xs font-black text-[#1a1a1a]/70">
                Potato chip bags with tazos inside — open them to grow your collection!
              </p>
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
                      setSelectedBag({ type: firstBag.bagType || "standard", name: "Mystery Bag", cost: 0, bonusChance: 10, rareBoost: 1, color: firstBag.preview?.franchiseColor || "#FFCC00", icon: <Gift className="w-5 h-5" /> })
                      setBuying(false)
                      setStage("opening")
                      setTearProgress(0)
                      startTearAnimation()
                    }
                  } catch {
                    setError("Failed to fetch bags")
                    setBuying(false)
                  }
                }}
                disabled={buying}
                className="mag-btn px-8 py-3 font-black text-base uppercase tracking-wider bg-[#22C55E] text-white border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#1a1a1a] transition-all disabled:opacity-40"
              >
                {buying ? <Loader2 className="w-5 h-5 animate-spin inline" /> : "Open Next Bag"}
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border-2 border-red-300 text-center">
              <p className="text-xs font-black text-red-600">{error}</p>
              <button onClick={() => setError(null)} className="text-[10px] underline mt-1 font-black">
                <X className="w-3 h-3 inline" /> Dismiss
              </button>
            </div>
          )}

          {/* Bag selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BAGS.map(bag => (
              <button
                key={bag.type}
                onClick={() => setSelectedBag(bag)}
                className={`relative p-6 text-left border-3 transition-all ${
                  selectedBag.type === bag.type
                    ? "border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] -translate-x-0.5 -translate-y-0.5 bg-white"
                    : "border-zinc-200 shadow-[2px_2px_0px_#1a1a1a] bg-white/60 hover:border-[#FFCC00]"
                }`}
              >
                {/* 2D bag preview */}
                <div className="h-40 mb-3">
                  <BagPreview bag={bag} />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  {bag.icon}
                  <h3 className="font-black text-sm uppercase text-[#1a1a1a]">{bag.name}</h3>
                </div>
                <div className="space-y-1 text-[10px] font-black text-zinc-500">
                  <p className="flex items-center gap-1"><Crosshair className="w-3 h-3" /> {bag.rareBoost}x rare boost</p>
                  <p className="flex items-center gap-1"><Gift className="w-3 h-3" /> {bag.bonusChance}% bonus tazo</p>
                  <p className="flex items-center gap-1 mt-2">
                    <Coins className="w-3 h-3" />
                    <span className="text-sm font-black text-[#1a1a1a]">{bag.cost}</span>
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Buy button */}
          <div className="text-center">
            <button
              onClick={handleBuy}
              disabled={buying || credits < selectedBag.cost}
              className="mag-btn px-8 py-4 font-black text-lg uppercase tracking-wider bg-[#22C55E] text-white border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#1a1a1a] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {buying ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> {t.common_loading || "Buying..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  {t.shop_buy || "Buy"} {selectedBag.name} -- {selectedBag.cost} <Coins className="w-4 h-4 inline" />
                </span>
              )}
            </button>
            {credits < selectedBag.cost && (
              <p className="mt-2 text-xs font-black text-red-500">
                Need {selectedBag.cost - credits} more credits
              </p>
            )}
          </div>

          {/* How to earn */}
          <div className="p-4 bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
            <h3 className="font-black text-xs uppercase tracking-wider text-[#1a1a1a] mb-2 flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#F59E0B]" /> How to earn credits
            </h3>
            <ul className="space-y-1 text-xs text-zinc-600 font-bold">
              <li className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-[#F59E0B]" /> Win battles: +30 credits</li>
              <li className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[#3B4CCA]" /> Daily login: +25 credits</li>
              <li className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-[#22C55E]" /> Complete quests: +50-200 credits</li>
              <li className="flex items-center gap-1"><Crosshair className="w-3.5 h-3.5 text-[#E3350D]" /> Perfect throws: +10 bonus</li>
            </ul>
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
    const franchiseSlug = selectedBag.type === "premium" ? "dracobell" :
      selectedBag.type === "mega" ? "cybermon" : "minimon"
    const bagData = { ...bagPreview, preview: { franchise: { slug: franchiseSlug }, rarity: "common" } }

    return (
        <div className="max-w-2xl mx-auto py-6 px-4 text-center space-y-3">
          <h2 className="text-xl font-black uppercase tracking-wider text-[#1a1a1a]">
            Opening {selectedBag.name}...
          </h2>
          <p className="text-xs font-black text-zinc-400">
            {tearProgress < 0.3 ? "Rip the bag open to reveal your tazo..." :
             tearProgress < 0.7 ? "Almost there..." : "Something shiny inside!"}
          </p>
          <div className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] overflow-hidden">
            <BagOpener3D
              bag={bagData}
              opening={openingAnim}
              progress={tearProgress}
              onOpen={() => {
                if (!tearIntervalRef.current) {
                  startTearAnimation()
                }
              }}
              onSkip={() => {
                if (tearIntervalRef.current) clearInterval(tearIntervalRef.current)
                tearIntervalRef.current = null
                setTearProgress(1)
                setTimeout(() => openBag(), 150)
              }}
            />
          </div>
          <p className="text-xs font-bold text-zinc-500">
            {tearProgress < 0.05 ? 'Click "Open Bag!" to start' :
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
