"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import { Package, ArrowLeft } from "lucide-react"

interface CollectionItem {
  id: string
  quantity: number
  isFavorite: boolean
  acquiredAt: string
  tazo: {
    id: string
    name: string
    displayName: string
    number: string
    imageUrl: string
    rarity: string
    franchise: string
    franchiseSlug: string
    attack: number
    defense: number
    spin: number
  }
}

interface CollectionData {
  items: CollectionItem[]
  total: number
  franchiseSummary: Record<string, number>
}

export default function CollectionPage() {
  const { t } = useI18n()
  const { user, token, loading } = useAuth()
  const [data, setData] = useState<CollectionData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!token) return

    fetch("/api/collection", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((d) => { if (!cancelled) setData(d) })
      .catch((err) => { if (!cancelled) setError(err.message) })

    return () => { cancelled = true }
  }, [token])

  if (loading || (token && !data && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Package className="w-12 h-12 text-zinc-600 mx-auto" />
          <p className="text-zinc-400">{t.auth_login_subtitle}</p>
          <Link
            href="/login"
            className="inline-block bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
          >
            {t.auth_login}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-white">{t.collection_title}</h1>
          {data && (
            <span className="text-sm text-zinc-400 ml-auto">
              {data.total} {t.collection_total}
            </span>
          )}
        </div>
      </header>

      {/* Franchise summary */}
      {data?.franchiseSummary && Object.keys(data.franchiseSummary).length > 0 && (
        <div className="max-w-7xl mx-auto w-full px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.franchiseSummary).map(([slug, count]) => (
              <span
                key={slug}
                className="text-xs bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1 text-zinc-300"
              >
                {slug} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4">
        {data && data.items.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {data.items.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col items-center gap-2 hover:border-zinc-700 transition-colors group"
              >
                {item.tazo.imageUrl ? (
                  <img
                    src={item.tazo.imageUrl}
                    alt={item.tazo.name || ""}
                    className="w-full aspect-square object-contain bg-zinc-800 rounded-lg"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-square bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-600 text-2xl font-black">
                    ?
                  </div>
                )}
                <div className="w-full text-center">
                  <p className="text-xs font-semibold text-white truncate leading-tight">
                    {item.tazo.name || item.tazo.displayName || `#${item.tazo.number}`}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    {item.tazo.franchise} {item.quantity > 1 ? `x${item.quantity}` : ""}
                  </p>
                </div>
                {/* Mini stats */}
                <div className="flex gap-1">
                  {["attack", "defense", "spin"].map((stat) => (
                    <span
                      key={stat}
                      className="text-[9px] bg-zinc-800 text-zinc-400 px-1 py-0.5 rounded"
                    >
                      {(item.tazo as any)[stat]}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">{t.collection_empty}</p>
            <Link
              href="/?view=album"
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              {t.collection_empty_cta}
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
