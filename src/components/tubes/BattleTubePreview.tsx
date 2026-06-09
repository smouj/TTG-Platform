// ============================================================
// Trading Tazos Game — Battle Tube Preview
// Shows a 3D cylindrical tube with texture wrapper + tazos inside.
// Falls back to CSS 2D on older browsers.
// ============================================================
"use client"

import dynamic from "next/dynamic"
import TazoDiscImage from "@/components/game/tazo-disc-image"

const TubeCylinder3DStatic = dynamic(
  () => import("@/components/tubes/TubeCylinder3D").then(m => ({ default: m.TubeCylinder3DStatic })),
  { ssr: false, loading: () => <TubeLoadingFallback /> }
)

interface TubeTazo {
  id: string
  name: string
  displayName?: string
  imageUrl: string | null
  finish?: string | null
  creatureVariant?: string | null
  shinyImageUrl?: string | null
  franchiseSlug?: string
  franchise?: string
}

interface BattleTubePreviewProps {
  name?: string
  color?: string
  count?: number
  maxCount?: number
  tazos?: TubeTazo[]
  starters?: string[]
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

const TUBE_TEXTURES: Record<string, string> = {
  minimon: "/tazos-tubes/tube-minimon.png",
  cybermon: "/tazos-tubes/tube-cybermon.png",
  dracobell: "/tazos-tubes/tube-dracobell.png",
}

const FRANCHISE_COLORS: Record<string, string> = {
  minimon: "#FFCC00",
  cybermon: "#00B4D8",
  dracobell: "#E3350D",
}

function getTubeTexture(tazos: TubeTazo[]): string {
  // Detect franchise from first tazo
  for (const t of tazos) {
    const slug = t.franchiseSlug || t.franchise || ""
    if (slug && TUBE_TEXTURES[slug]) return TUBE_TEXTURES[slug]
  }
  return TUBE_TEXTURES.minimon
}

function getFranchiseColor(tazos: TubeTazo[]): string {
  for (const t of tazos) {
    const slug = t.franchiseSlug || t.franchise || ""
    if (slug && FRANCHISE_COLORS[slug]) return FRANCHISE_COLORS[slug]
  }
  return "#FFCC00"
}

function TubeLoadingFallback() {
  return (
    <div className="rounded-2xl bg-[#1a1a1a]/5 animate-pulse"
      style={{ width: 120, height: 180 }} />
  )
}

export default function BattleTubePreview({
  name, color = "#E3350D", count = 0, maxCount = 20,
  tazos = [], starters = [],
  size = "md", showLabel = true,
  className = "",
}: BattleTubePreviewProps) {
  const sizes = {
    sm: { width: 80, height: 120 },
    md: { width: 130, height: 190 },
    lg: { width: 200, height: 290 },
  }
  const s = sizes[size]
  const tubeTexture = getTubeTexture(tazos)
  const tubeColor = getFranchiseColor(tazos) || color
  const tazoUrls = tazos.filter(t => t.imageUrl).map(t => t.imageUrl!) as string[]
  const labelText = name ? name.toUpperCase() : "EMPTY TUBE"
  const fillPct = Math.min(100, maxCount > 0 ? (count / maxCount) * 100 : 0)

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* ═══ 3D Tube ═══ */}
      <div style={{ width: s.width, height: s.height }}>
        <TubeCylinder3DStatic
          textureUrl={tubeTexture}
          color={tubeColor}
          rotationSpeed={0.25}
          showTazos={count > 0}
          tazoImageUrls={tazoUrls}
          style={{ width: "100%", height: "100%" }}
          className="rounded-lg overflow-hidden"
        />
      </div>

      {/* ═══ LABEL / STICKER ═══ */}
      {showLabel && (
        <div
          className="relative -mt-1 border-2 border-[#1a1a1a] flex-shrink-0"
          style={{
            width: s.width + 14,
            padding: "4px 6px",
            background: `repeating-linear-gradient(
              -30deg, transparent, transparent 3px,
              rgba(255,255,255,0.3) 3px, rgba(255,255,255,0.3) 6px
            ), linear-gradient(135deg, ${tubeColor} 0%, ${tubeColor} 100%)`,
            boxShadow: `2px 2px 0 #1a1a1a`,
          }}
        >
          <p className="text-[8px] font-black text-white text-center uppercase tracking-[0.12em] leading-tight truncate"
            style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.3)" }}>
            {labelText}
          </p>
          <p className="text-[7px] font-black text-white/70 text-center leading-tight">
            {count}/{maxCount} TAZOS
          </p>
        </div>
      )}

      {/* Fill bar */}
      {maxCount > 0 && (
        <div className="w-full max-w-[80px] mt-1.5">
          <div className="w-full h-1.5 rounded-full bg-[#1a1a1a]/10 overflow-hidden border border-[#1a1a1a]/10">
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${fillPct}%`,
                background: count >= maxCount
                  ? `linear-gradient(90deg, #22C55E 0%, #16A34A 100%)`
                  : `linear-gradient(90deg, ${tubeColor} 0%, ${tubeColor}88 100%)`,
              }} />
          </div>
          {count >= maxCount && (
            <p className="text-[7px] font-black text-[#22C55E] text-center uppercase tracking-[0.2em] mt-0.5">Sealed</p>
          )}
        </div>
      )}
    </div>
  )
}
