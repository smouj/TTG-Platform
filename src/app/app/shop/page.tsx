// ============================================================
// Trading Tazos Game — Bag Shop Page
// Buy potato chip bags with credits, open them in 3D.
// ============================================================
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import dynamic from "next/dynamic"
import Link from "next/link"
import { ShoppingBag, Coins, Zap, Star, Gift, Loader2, X, Sparkles, Crosshair, Trophy, Calendar, Check, ShoppingCart } from "lucide-react"

// Dynamic 3D imports (no SSR)
const Scene3D = dynamic(() => import("@/components/game/3d/scene-3d"), { ssr: false })
const ChipBag3D = dynamic(() => import("@/components/game/3d/chip-bag-3d"), { ssr: false })
const TazoDisc3D = dynamic(() => import("@/components/game/3d/tazo-disc-3d"), { ssr: false })

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

  const tearIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
        openBag()
      }
    }, interval)
  }

  const openBag = async () => {
    if (!token || !bagId) return
    try {
      const res = await fetch("/api/bags/open", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bagId }),
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
    setStage("select")
    setBagId(null)
    setRevealedTazo(null)
    setBonusTazo(null)
    setTearProgress(0)
    setOpeningAnim(false)
    setError(null)
    if (tearIntervalRef.current) clearInterval(tearIntervalRef.current)
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
        <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
          {/* Header row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a] flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#E3350D]" /> {t.shop_title || "Tazo Shop"}
            </h2>
            {creditDisplay}
          </div>

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
                {/* Bag 3D preview */}
                <div className="h-40 mb-3">
                  <Scene3D cameraPosition={[0, 0, 2.5]} controls={false} autoRotate={false}>
                    <ChipBag3D color={bag.color} brand="TAZOS" size={0.9} />
                  </Scene3D>
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

  // ── Opening stage ──
  if (stage === "opening") {
    return (
        <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
          <h2 className="text-xl font-black uppercase tracking-wider text-[#1a1a1a]">
            Opening {selectedBag.name}...
          </h2>
          <div className="h-80 bg-white border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] rounded-lg overflow-hidden">
            <Scene3D cameraPosition={[0, 0.3, 2.8]} controls={false} autoRotate={false}>
              <ChipBag3D
                color={selectedBag.color}
                brand="TAZOS"
                isOpen={true}
                tearProgress={tearProgress}
                size={1}
              />
              {tearProgress > 0.3 && (
                <pointLight
                  position={[0, 0.8, 0.3]}
                  intensity={tearProgress * 2}
                  color="#FFCC00"
                  distance={2}
                />
              )}
            </Scene3D>
          </div>
          <p className="text-sm font-black text-zinc-500 animate-pulse">
            {tearProgress < 1 ? "Tearing open..." : "Revealing tazo..."}
          </p>
          <div className="w-full max-w-xs mx-auto bg-zinc-200 h-2 rounded-full overflow-hidden border-2 border-[#1a1a1a]">
            <div
              className="h-full bg-[#FFCC00] transition-all duration-100"
              style={{ width: `${Math.round(tearProgress * 100)}%` }}
            />
          </div>
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

          {/* 3D Tazo */}
          <div className="h-72 bg-white border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] rounded-lg overflow-hidden">
            <Scene3D cameraPosition={[0, 0.2, 3]} controls={true} autoRotate={true}>
              <TazoDisc3D
                name={revealedTazo.displayName || revealedTazo.name}
                franchise={revealedTazo.franchise?.slug || "minimon"}
                color={revealedTazo.franchise?.color}
                size={1.2}
                rotationSpeed={0.5}
              />
            </Scene3D>
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
