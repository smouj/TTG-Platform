"use client"

// ============================================================
// TTG Public Collection View — Client component for /collection/[userId]
// ============================================================

import Link from "next/link"
import Image from "next/image"
import { Share2, Puzzle } from "lucide-react"
import { useState } from "react"
import { SITE_CONFIG } from "@/lib/site-config"

interface TazoEntry {
  id: string
  name: string
  slug: string
  franchise: string
  imageUrl: string
  rarity: string
  creature: string | null
  acquiredAt: string
}

interface CollectionData {
  user: { id: string; name: string; totalTazos: number }
  tazos: TazoEntry[]
  franchiseCounts: Record<string, number>
}

const FRANCHISE_COLORS: Record<string, { bg: string; border: string }> = {
  cybermon: { bg: "#1a1a1a", border: "#E3350D" },
  dracobell: { bg: "#1a1a1a", border: "#3B4CCA" },
  minimon: { bg: "#1a1a1a", border: "#22C55E" },
}

export default function PublicCollectionView({
  data,
  userId,
}: {
  data: CollectionData
  userId: string
}) {
  const [filter, setFilter] = useState<string | null>(null)
  const shareUrl = `${SITE_CONFIG.canonicalUrl}/collection/${userId}`

  const filtered = filter
    ? data.tazos.filter((t) => t.franchise === filter)
    : data.tazos

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {})
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <header
        style={{
          background: "#1a1a1a",
          borderBottom: "4px solid #FFCC00",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <Image src="/pwa-512.webp" alt="TTG" width={32} height={32} style={{ borderRadius: 6 }} />
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Trading Tazos Game
          </span>
        </Link>
        <button
          onClick={copyShareLink}
          style={{
            background: "#FFCC00",
            color: "#1a1a1a",
            border: "2px solid #1a1a1a",
            padding: "6px 14px",
            fontSize: 10,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Share2 size={12} /> Share
        </button>
      </header>

      {/* Hero section */}
      <section
        style={{
          background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
          padding: "40px 24px",
          textAlign: "center",
          borderBottom: "4px solid #FFCC00",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "#FFCC00",
            margin: "0 auto 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "3px solid #1a1a1a",
          }}
        >
          <span style={{ fontSize: 28, fontWeight: 900, color: "#1a1a1a" }}>
            {data.user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: "#fff",
            textTransform: "uppercase",
            margin: "0 0 4px",
            letterSpacing: "0.05em",
          }}
        >
          {data.user.name}&apos;s Collection
        </h1>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#FFCC00", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 20px" }}>
          {data.user.totalTazos} tazos collected
        </p>

        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          {Object.entries(data.franchiseCounts).map(([franchise, count]) => {
            const colors = FRANCHISE_COLORS[franchise] || { bg: "#333", border: "#666" }
            return (
              <button
                key={franchise}
                onClick={() => setFilter(filter === franchise ? null : franchise)}
                style={{
                  background: filter === franchise ? colors.border : colors.bg,
                  border: `2px solid ${colors.border}`,
                  padding: "8px 16px",
                  cursor: "pointer",
                  opacity: filter && filter !== franchise ? 0.5 : 1,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 900, color: filter === franchise ? "#fff" : colors.border }}>
                  {count}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: 8,
                    fontWeight: 700,
                    color: filter === franchise ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {franchise}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Tazo grid */}
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 12,
          }}
        >
          {filtered.map((tazo) => (
            <Link
              key={tazo.id}
              href={`/tazos/${tazo.slug}`}
              style={{
                display: "block",
                background: "#fff",
                border: "3px solid #1a1a1a",
                boxShadow: "3px 3px 0 #1a1a1a",
                overflow: "hidden",
                textDecoration: "none",
                transition: "transform 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
            >
              <div style={{ aspectRatio: "1", background: "#eee", position: "relative" }}>
                <Image
                  src={tazo.imageUrl}
                  alt={tazo.name}
                  fill
                  sizes="140px"
                  style={{ objectFit: "contain" }}
                />
                {/* Rarity badge */}
                {tazo.rarity && (
                  <span
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      background: "#1a1a1a",
                      color: "#FFCC00",
                      padding: "2px 6px",
                      fontSize: 7,
                      fontWeight: 900,
                      textTransform: "uppercase",
                    }}
                  >
                    {tazo.rarity}
                  </span>
                )}
              </div>
              <div style={{ padding: "8px 10px" }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    color: "#1a1a1a",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tazo.name}
                </div>
                <div
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    color: "#999",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {tazo.franchise}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Puzzle style={{ width: 48, height: 48, color: "#ccc", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase" }}>
              No tazos in this franchise yet
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          background: "#1a1a1a",
          borderTop: "4px solid #1a1a1a",
          padding: "16px 24px",
          textAlign: "center",
          marginTop: 40,
        }}
      >
        <p
          style={{
            fontSize: 8,
            fontWeight: 700,
            color: "rgba(255,255,255,0.15)",
            textTransform: "uppercase",
            letterSpacing: "0.3em",
            margin: 0,
          }}
        >
          © 2026 {SITE_CONFIG.name} · v{SITE_CONFIG.version}
        </p>
      </footer>
    </div>
  )
}
