// ============================================================
// Trading Tazos Game — Marketplace Section
// Browse listings, buy tazos from other players, sell your own.
// ============================================================
"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  Store, Coins, ShoppingCart, Loader2, X, AlertTriangle,
  Search, ChevronDown, Tag, User, Clock, ArrowUpDown,
  Shield, Swords, Zap, Flame, Sparkles,
} from "lucide-react"

interface TradeListing {
  id: string
  price: number
  status: string
  createdAt: string
  seller: { id: string; name: string; displayName: string | null }
  userTazo: {
    id: string; userId: string; tazoId: string; quantity: number
    wear: number; battleCount: number
    tazo: {
      id: string; name: string; displayName: string | null; slug: string
      imageUrl: string | null; rarity: string; finish: string
      creatureVariant: string; shinyImageUrl: string | null
      franchise: { name: string; slug: string; color: string }
      attack: number; defense: number; resistance: number; weight: number
      stability: number; spin: number; control: number; bounce: number; precision: number
    }
  } | null
}

const RARITY_COLORS: Record<string, string> = {
  common: "#9CA3AF", uncommon: "#22C55E", rare: "#3B82F6",
  "ultra-rare": "#A855F7", legendary: "#F59E0B",
}
const RARITY_LABELS: Record<string, string> = {
  common: "Common", uncommon: "Uncommon", rare: "Rare",
  "ultra-rare": "Ultra Rare", legendary: "Legendary",
}

const WEAR_TIER_LABELS: Record<string, string> = {
  mint: "Mint", light_play: "Lightly Played", played: "Played",
  heavy_play: "Heavily Played", damaged: "Damaged",
}
function getWearTier(wear: number) {
  if (wear <= 0) return "mint"
  if (wear <= 15) return "light_play"
  if (wear <= 40) return "played"
  if (wear <= 70) return "heavy_play"
  return "damaged"
}
const WEAR_COLORS: Record<string, { bg: string; text: string }> = {
  mint: { bg: "#22C55E15", text: "#22C55E" },
  light_play: { bg: "#FFCC0015", text: "#CCAA00" },
  played: { bg: "#FF880015", text: "#FF8800" },
  heavy_play: { bg: "#FF440015", text: "#FF4400" },
  damaged: { bg: "#CC000015", text: "#CC0000" },
}

// ── ListingCard ───────────────────────────────────────
function ListingCard({ listing, onBuy, onCancel, buying, isOwn, credits }: {
  listing: TradeListing
  onBuy: () => void
  onCancel: () => void
  buying: boolean
  isOwn: boolean
  credits: number
}) {
  const t = listing.userTazo?.tazo
  if (!t) return null

  const canBuy = !isOwn && credits >= listing.price
  const rarity = t.rarity || "common"
  const rarityColor = RARITY_COLORS[rarity] || "#9CA3AF"
  const wearTier = getWearTier(listing.userTazo?.wear || 0)
  const wearColor = WEAR_COLORS[wearTier]
  const totalPower = (t.attack || 0) + (t.defense || 0) + (t.stability || 0) + (t.spin || 0) + (t.control || 0) + (t.precision || 0)

  return (
    <div className="p-3 bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] flex items-center gap-3 group hover:shadow-[4px_4px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
      {/* Tazo image */}
      <div className="w-16 h-16 shrink-0 rounded-full border-2 border-[#1a1a1a] overflow-hidden relative"
        style={{ background: t.franchise?.color || "#FFCC00" }}>
        {t.imageUrl ? (
          <img src={t.imageUrl} alt={t.displayName || t.name} className="w-full h-full object-cover scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#1a1a1a]/20 text-xl font-black">?</div>
        )}
        {/* Wear indicator ring */}
        {wearTier !== "mint" && (
          <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: wearColor.text + "80" }} />
        )}
        {/* Rarity dot */}
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#1a1a1a]" style={{ background: rarityColor }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h3 className="text-xs font-black text-[#1a1a1a] truncate">{t.displayName || t.name}</h3>
          <span className="text-[8px] font-black px-1.5 py-0.5 border rounded-full" style={{ background: wearColor.bg, color: wearColor.text, borderColor: wearColor.text + "30" }}>
            {WEAR_TIER_LABELS[wearTier]}
          </span>
        </div>
        <p className="text-[8px] font-bold text-[#1a1a1a]/30 uppercase">{t.franchise?.name} · {RARITY_LABELS[rarity]}</p>
        <div className="flex items-center gap-2 text-[8px] font-black text-[#1a1a1a]/25 mt-0.5">
          <span className="flex items-center gap-0.5"><Swords className="w-2 h-2" />{totalPower}</span>
          <span>·</span>
          <span className="flex items-center gap-0.5"><User className="w-2 h-2" />{listing.seller.displayName || listing.seller.name}</span>
          <span>·</span>
          <span className="flex items-center gap-0.5"><Clock className="w-2 h-2" />{new Date(listing.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Price + Buy */}
      <div className="shrink-0 flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-1 text-sm font-black text-[#1a1a1a]">
          <Coins className="w-3.5 h-3.5 text-[#FFCC00]" />
          {listing.price}
        </div>
        {isOwn ? (
          <div className="flex flex-col gap-1 items-end">
            <span className="text-[8px] font-black text-[#1a1a1a]/25 uppercase">Your listing</span>
            <button
              onClick={onCancel}
              className="px-2 py-1 text-[7px] font-black uppercase border border-[#E3350D]/30 text-[#E3350D]/60 hover:bg-[#E3350D]/10 hover:text-[#E3350D] rounded-full transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={onBuy}
            disabled={!canBuy || buying}
            className={`px-3 py-1.5 text-[9px] font-black uppercase border-2 border-[#1a1a1a] transition-all ${
              canBuy && !buying
                ? "bg-[#22C55E] text-white shadow-[2px_2px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px]"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
            }`}
          >
            {buying ? <Loader2 className="w-3 h-3 animate-spin" /> : canBuy ? "BUY" : "Need CR"}
          </button>
        )}
      </div>
    </div>
  )
}

// ── SellTazoCard (select from collection to sell) ──────
function SellTazoCard({ ut, onSell, selling }: {
  ut: any
  onSell: (userTazoId: string, price: number) => void
  selling: boolean
}) {
  const t = ut.tazo
  const wearTier = getWearTier(ut.wear || 0)
  const wearColor = WEAR_COLORS[wearTier]
  const rarity = t.rarity || "common"
  const rarityColor = RARITY_COLORS[rarity] || "#9CA3AF"
  const totalPower = (t.attack || 0) + (t.defense || 0) + (t.stability || 0) + (t.spin || 0) + (t.control || 0) + (t.precision || 0)

  // Suggested price based on rarity + wear
  const basePrice: Record<string, number> = { common: 5, uncommon: 15, rare: 40, "ultra-rare": 100, legendary: 250 }
  const wearDiscount = 1 - (ut.wear || 0) / 200
  const suggestedPrice = Math.max(1, Math.floor((basePrice[rarity] || 5) * wearDiscount))
  const [price, setPrice] = useState(suggestedPrice)

  return (
    <div className="p-3 bg-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] space-y-2">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 shrink-0 rounded-full border-2 border-[#1a1a1a] overflow-hidden"
          style={{ background: t.franchise?.color || "#FFCC00" }}>
          {t.imageUrl ? (
            <img src={t.imageUrl} alt={t.displayName || t.name} className="w-full h-full object-cover scale-110" />
          ) : <div className="w-full h-full flex items-center justify-center text-[#1a1a1a]/20">?</div>}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-black text-[#1a1a1a] truncate">{t.displayName || t.name}</h3>
          <p className="text-[8px] font-bold text-[#1a1a1a]/30">{t.franchise?.name} · {RARITY_LABELS[rarity]} · {totalPower} power</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[8px] font-black px-1.5 py-0.5 border rounded-full" style={{ background: wearColor.bg, color: wearColor.text, borderColor: wearColor.text + "30" }}>
              {WEAR_TIER_LABELS[wearTier]} ({ut.wear}%)
            </span>
            {ut.quantity > 1 && <span className="text-[8px] font-black text-[#1a1a1a]/25">x{ut.quantity}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-1.5">
          <Coins className="w-3 h-3 text-[#FFCC00]" />
          <input
            type="number" min={1} max={9999} value={price}
            onChange={(e) => setPrice(Math.max(1, Number(e.target.value)))}
            className="w-20 px-2 py-1 text-xs font-black text-[#1a1a1a] bg-zinc-50 border-2 border-[#1a1a1a]/20 focus:border-[#1a1a1a] outline-none text-center"
          />
          <span className="text-[8px] font-bold text-[#1a1a1a]/25">cr</span>
          <span className="text-[7px] font-bold text-[#1a1a1a]/15 ml-1">suggested: {suggestedPrice}</span>
        </div>
        <button
          onClick={() => onSell(ut.id, price)}
          disabled={selling || ut.quantity < 1}
          className="px-3 py-1.5 text-[9px] font-black uppercase bg-[#FFCC00] text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-0 active:translate-y-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {selling ? <Loader2 className="w-3 h-3 animate-spin" /> : "LIST"}
        </button>
      </div>
    </div>
  )
}

// ── Marketplace Main ───────────────────────────────────
export default function MarketplaceSection({ credits: initialCredits }: { credits: number }) {
  const { user, token } = useAuth()
  const [tab, setTab] = useState<"buy" | "sell">("buy")
  const [listings, setListings] = useState<TradeListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [selling, setSelling] = useState(false)
  const [credits, setCredits] = useState(initialCredits)
  const [collection, setCollection] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<"newest" | "cheapest" | "rarity">("newest")

  // Load listings
  const loadListings = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch("/api/trade", { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setListings(data.listings || [])
    } catch { setError("Failed to load marketplace") }
    finally { setLoading(false) }
  }, [token])

  // Load user collection for selling
  const loadCollection = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch("/api/collection", { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setCollection(data.items || [])
    } catch { /* non-critical */ }
  }, [token])

  useEffect(() => { loadListings() }, [loadListings])
  useEffect(() => { if (tab === "sell") loadCollection() }, [tab, loadCollection])

  const handleBuy = useCallback(async (listing: TradeListing) => {
    if (!token || !listing.userTazo) return
    setBuyingId(listing.id); setError(null)
    try {
      const res = await fetch(`/api/trade/${listing.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setCredits(c => c - listing.price)
        loadListings()
      } else {
        setError(data.error || "Purchase failed")
      }
    } catch { setError("Connection error") }
    finally { setBuyingId(null) }
  }, [token, loadListings])

  const handleCancel = useCallback(async (listing: TradeListing) => {
    if (!token) return
    setBuyingId(listing.id); setError(null)
    try {
      const res = await fetch(`/api/trade/${listing.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        loadListings()
      } else {
        setError(data.error || "Cancel failed")
      }
    } catch { setError("Connection error") }
    finally { setBuyingId(null) }
  }, [token, loadListings])

  const handleSell = useCallback(async (userTazoId: string, price: number) => {
    if (!token) return
    setSelling(true); setError(null)
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userTazoId, price }),
      })
      const data = await res.json()
      if (res.ok) {
        loadCollection()
        loadListings()
      } else {
        setError(data.error || "Failed to list")
      }
    } catch { setError("Connection error") }
    finally { setSelling(false) }
  }, [token, loadCollection, loadListings])

  // Filter + sort
  const filtered = listings.filter(l => {
    if (!l.userTazo?.tazo) return false
    const t = l.userTazo.tazo
    const q = search.toLowerCase()
    return !q || (t.name || "").toLowerCase().includes(q) || (t.displayName || "").toLowerCase().includes(q) || (t.franchise?.name || "").toLowerCase().includes(q)
  })
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "cheapest") return a.price - b.price
    if (sort === "rarity") {
      const rarityOrder: Record<string, number> = { legendary: 5, "ultra-rare": 4, rare: 3, uncommon: 2, common: 1 }
      const ra = rarityOrder[a.userTazo?.tazo?.rarity || "common"] || 0
      const rb = rarityOrder[b.userTazo?.tazo?.rarity || "common"] || 0
      return rb - ra
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  if (!user) return null

  return (
    <div className="space-y-4">
      {/* ── Tabs ── */}
      <div className="flex gap-0">
        <button onClick={() => setTab("buy")}
          className={`flex-1 py-2.5 text-xs font-black uppercase border-3 transition-all ${
            tab === "buy"
              ? "bg-[#1a1a1a] text-[#FFCC00] border-[#1a1a1a]"
              : "bg-white text-[#1a1a1a]/30 border-[#1a1a1a]/10 hover:text-[#1a1a1a]/50"
          }`}>
          <Store className="w-3.5 h-3.5 inline mr-1" />Buy
        </button>
        <button onClick={() => setTab("sell")}
          className={`flex-1 py-2.5 text-xs font-black uppercase border-3 transition-all ${
            tab === "sell"
              ? "bg-[#1a1a1a] text-[#22C55E] border-[#1a1a1a]"
              : "bg-white text-[#1a1a1a]/30 border-[#1a1a1a]/10 hover:text-[#1a1a1a]/50"
          }`}>
          <Tag className="w-3.5 h-3.5 inline mr-1" />Sell
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-2 bg-red-50 border-2 border-red-300 flex items-center justify-between">
          <span className="text-[10px] font-black text-red-600">{error}</span>
          <button onClick={() => setError(null)} className="text-[8px] font-black"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Credits */}
      <div className="flex items-center gap-1.5 text-sm">
        <Coins className="w-4 h-4 text-[#FFCC00]" />
        <span className="font-black text-[#1a1a1a]">{credits}</span>
        <span className="text-[9px] font-bold text-[#1a1a1a]/30">cr available</span>
      </div>

      {/* ── BUY TAB ── */}
      {tab === "buy" && (
        <>
          {/* Search + sort */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1a1a1a]/20" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search marketplace…"
                className="w-full pl-7 pr-3 py-2 text-xs font-bold bg-white border-2 border-[#1a1a1a]/20 focus:border-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/15 text-[#1a1a1a]"
              />
            </div>
            <select value={sort} onChange={e => setSort(e.target.value as any)}
              className="px-2 py-2 text-[9px] font-bold bg-white border-2 border-[#1a1a1a]/20 text-[#1a1a1a] cursor-pointer">
              <option value="newest">Newest</option>
              <option value="cheapest">Cheapest</option>
              <option value="rarity">Rarity</option>
            </select>
          </div>

          {/* Listings */}
          {loading ? (
            <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[#1a1a1a]/15" /></div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Store className="w-12 h-12 mx-auto text-[#1a1a1a]/8" />
              <p className="text-sm font-bold text-[#1a1a1a]/20">No listings yet</p>
              <p className="text-[10px] font-bold text-[#1a1a1a]/10">Be the first to sell a tazo!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sorted.map(l => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  onBuy={() => handleBuy(l)}
                  onCancel={() => handleCancel(l)}
                  buying={buyingId === l.id}
                  isOwn={l.seller.id === user.id}
                  credits={credits}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── SELL TAB ── */}
      {tab === "sell" && (
        <div className="space-y-4">
          <div className="p-3 bg-zinc-50 border-2 border-[#1a1a1a]/10">
            <p className="text-[10px] font-bold text-[#1a1a1a]/40">
              <Tag className="w-3 h-3 inline mr-1" />
              Select a tazo from your collection to list for sale. Other players can buy it from the marketplace.
              You'll receive credits when someone purchases it.
            </p>
          </div>

          {collection.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 mx-auto text-[#1a1a1a]/8" />
              <p className="text-sm font-bold text-[#1a1a1a]/20">No tazos to sell</p>
              <p className="text-[10px] font-bold text-[#1a1a1a]/10">Open some bags first!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {collection
                .filter((item: any) => item.tazo && item.quantity > 0)
                .map((item: any) => (
                  <SellTazoCard
                    key={item.id}
                    ut={{ ...item, tazo: item.tazo, wear: item.wear || 0, battleCount: item.battleCount || 0 }}
                    onSell={handleSell}
                    selling={selling}
                  />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
