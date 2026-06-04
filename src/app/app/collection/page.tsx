"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import { Package, Star, Swords, Shield, Target } from "lucide-react"

interface CollectionItem {
  id: string
  quantity: number
  isFavorite: boolean
  acquiredAt: string
  tazo: {
    id: string; name: string; displayName: string; number: string
    imageUrl: string; rarity: string; franchise: string; franchiseSlug: string
    attack: number; defense: number; resistance: number
    weight: number; stability: number; spin: number
    control: number; bounce: number; precision: number
    role?: string | null
  }
}

interface CollectionData { items: CollectionItem[]; total: number; franchiseSummary: Record<string, number> }

const FRANCHISE_BANNER: Record<string, string> = {
  minimon: "linear-gradient(135deg, #FFCB05, #FF8C00)",
  cybermon: "linear-gradient(135deg, #00A1E9, #0057B7)",
  dracobell: "linear-gradient(135deg, #FF6B00, #CC4400)",
}

export default function CollectionPage() {
  const { t } = useI18n()
  const { user, token, loading } = useAuth()
  const [data, setData] = useState<CollectionData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!token) return
    fetch("/api/collection", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((d) => { if (!cancelled) setData(d) })
      .catch((err) => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [token])

  if (loading || (token && !data && !error)) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="mag-spinner w-10 h-10 rounded-full border-4 border-[#FFCC00] border-t-[#E3350D]" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="py-20 text-center space-y-5">
        <Package className="w-14 h-14 text-[#1a1a1a]/15 mx-auto" />
        <p className="font-black text-sm text-[#1a1a1a]/40 uppercase tracking-wider">{t.auth_login_subtitle}</p>
        <Link
          href="/login"
          className="inline-block py-3 px-8 mag-btn bg-[#E3350D] text-white text-xs font-black uppercase tracking-widest"
        >
          {t.auth_login}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 space-y-4">
      {/* ═══════════════════════════════════════════ */}
      {/* MAGAZINE BANNER STRIP                      */}
      {/* ═══════════════════════════════════════════ */}
      <div
        className="mag-card-yellow rounded-none px-4 py-3 flex flex-wrap items-center gap-3"
        style={{ borderBottom: "4px solid #1a1a1a" }}
      >
        <div className="flex items-center gap-1.5">
          <Package className="w-5 h-5 text-[#1a1a1a]" />
          <span className="text-sm font-black text-[#1a1a1a] tracking-tight uppercase">
            {t.collection_title}
          </span>
        </div>
        {data && (
          <>
            <div className="w-px h-5 bg-[#1a1a1a]/30" />
            <span className="text-sm font-black text-[#E3350D] tracking-tight">
              {data.total} {t.collection_total}
            </span>
          </>
        )}
      </div>

      {/* Franchise summary chips */}
      {data?.franchiseSummary && Object.keys(data.franchiseSummary).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.franchiseSummary).map(([slug, count]) => {
            const gradient = FRANCHISE_BANNER[slug] || "#1a1a1a"
            return (
              <span
                key={slug}
                className="text-[10px] font-black text-white px-3 py-0.5 border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] uppercase tracking-wider"
                style={{ background: gradient }}
              >
                {slug.charAt(0).toUpperCase() + slug.slice(1)} ({count})
              </span>
            )
          })}
        </div>
      )}
        {data && data.items.length > 0 ? (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-3"
            style={{ background: "#fffef0", border: "3px solid #1a1a1a", boxShadow: "4px 4px 0px #1a1a1a" }}
          >
            {data.items.map((item) => {
              const gradient = FRANCHISE_BANNER[item.tazo.franchiseSlug] || "#1a1a1a"
              return (
                <div
                  key={item.id}
                  className="group border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] overflow-hidden hover:shadow-[5px_5px_0px_#1a1a1a] hover:-translate-y-[2px] transition-all"
                  style={{ background: "white" }}
                >
                  {/* Top franchise color strip */}
                  <div className="h-1.5" style={{ background: gradient }} />

                  {/* Image */}
                  <div className="p-2 flex items-center justify-center bg-[#fffef0]" style={{ aspectRatio: "1" }}>
                    {item.tazo.imageUrl ? (
                      <img
                        src={item.tazo.imageUrl}
                        alt={item.tazo.name || ""}
                        className="w-full h-full object-contain drop-shadow-sm"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-4xl font-black text-[#1a1a1a]/15">?</span>
                    )}
                  </div>

                  {/* Info strip */}
                  <div className="p-2 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[11px] font-black text-[#1a1a1a] truncate leading-tight">
                        {item.tazo.name || item.tazo.displayName || `#${item.tazo.number}`}
                      </p>
                      {item.quantity > 1 && (
                        <span className="text-[9px] font-black bg-[#FFCC00] text-[#1a1a1a] px-1 border border-[#1a1a1a]">
                          x{item.quantity}
                        </span>
                      )}
                    </div>

                    {/* Mini stats - 3 key stats */}
                    <div className="grid grid-cols-3 gap-0.5">
                      <div className="flex items-center gap-0.5 text-[8px] font-bold text-[#E3350D]" title={t.tazo_attack}>
                        <Swords className="w-2.5 h-2.5" /> {item.tazo.attack}
                      </div>
                      <div className="flex items-center gap-0.5 text-[8px] font-bold text-[#3B4CCA]" title={t.tazo_defense}>
                        <Shield className="w-2.5 h-2.5" /> {item.tazo.defense}
                      </div>
                      <div className="flex items-center gap-0.5 text-[8px] font-bold text-[#06B6D4]" title={t.tazo_precision}>
                        <Target className="w-2.5 h-2.5" /> {item.tazo.precision}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div
            className="text-center py-20 border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]"
            style={{ background: "#fffef0" }}
          >
            <Package className="w-20 h-20 text-[#1a1a1a]/15 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-[#E3350D] mb-2 uppercase tracking-wider mag-stroke-sm">
              {t.collection_empty}
            </h2>
            <Link
              href="/"
              className="inline-block mt-4 py-3 px-8 mag-btn bg-[#FFCC00] text-[#1a1a1a] text-sm font-black uppercase tracking-widest"
            >
              {t.collection_empty_cta}
            </Link>
          </div>
        )}
    </div>
  )
}
