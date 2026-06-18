// ============================================================
// Trading Tazos Game — Battle Tube Preview
// Shows a 3D cylindrical tube with texture wrapper + tazos inside.
// Falls back to CSS 2D on older browsers.
// ============================================================
"use client"

import TazoDiscImage from "@/components/game/tazo-disc-image"
import { canUseWebGL } from "@/lib/browser/webgl-detector"
import { useState, useEffect } from "react"

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
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

const TUBE_TEXTURES: Record<string, string> = {
  minimon: "/tazos-tubes/tube-minimon.png",
  cybermon: "/tazos-tubes/tube-cybermon.png",
  dracobell: "/tazos-tubes/tube-dracobell.png",
}

export { TUBE_TEXTURES }

export const TUBE_TEXTURE_OPTIONS = [
  { slug: "minimon", name: "Minimon", textureUrl: TUBE_TEXTURES.minimon, color: "var(--ttg-yellow)" },
  { slug: "cybermon", name: "Cybermon", textureUrl: TUBE_TEXTURES.cybermon, color: "#00B4D8" },
  { slug: "dracobell", name: "Dracobell", textureUrl: TUBE_TEXTURES.dracobell, color: "var(--ttg-dracobell)" },
]

const FRANCHISE_COLORS: Record<string, string> = {
  minimon: "var(--ttg-yellow)",
  cybermon: "#00B4D8",
  dracobell: "var(--ttg-red)",
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
  return "var(--ttg-yellow)"
}

function TubeLoadingFallback() {
  return (
    <div className="bg-ttg-black/5 animate-pulse"
      style={{ width: 120, height: 180 }} />
  )
}

export default function BattleTubePreview({
  name, color = "var(--ttg-red)", textureUrl, count = 0, maxCount = 20,
  tazos = [],
  size = "md", showLabel = true,
  className = "",
}: BattleTubePreviewProps & { textureUrl?: string }) {
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null)
  const [Tube3D, setTube3D] = useState<React.ComponentType<any> | null>(null)

  useEffect(() => {
    const webglOK = canUseWebGL()
    setHasWebGL(webglOK)
    if (webglOK) {
      // Only load Three.js when WebGL is confirmed available
      import("@/components/tubes/TubeCylinder3D").then(m => {
        setTube3D(() => m.TubeCylinder3DStatic)
      })
    }
  }, [])

  const sizes = {
    sm: { width: 80, height: 120 },
    md: { width: 130, height: 190 },
    lg: { width: 200, height: 290 },
  }
  const s = sizes[size]
  const tubeTexture = textureUrl || getTubeTexture(tazos)
  const tubeColor = getFranchiseColor(tazos) || color
  const tazoUrls = tazos.filter(t => t.imageUrl).map(t => t.imageUrl!) as string[]
  const labelText = name ? name.toUpperCase() : "EMPTY TUBE"
  const fillPct = Math.min(100, maxCount > 0 ? (count / maxCount) * 100 : 0)

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* ═══ 3D Tube (only when WebGL available) ═══ */}
      <div style={{ width: s.width, height: s.height }}>
        {hasWebGL === true && Tube3D ? (
          <Tube3D
            textureUrl={tubeTexture}
            color={tubeColor}
            rotationSpeed={0.25}
            showTazos={count > 0}
            tazoImageUrls={tazoUrls}
            style={{ width: "100%", height: "100%" }}
            className="overflow-hidden"
          />
        ) : hasWebGL === false ? (
          <div style={{
            width: "100%", height: "100%",
            background: `linear-gradient(135deg, ${tubeColor}22 0%, ${tubeColor}08 100%)`,
            border: `3px solid ${tubeColor}33`,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 4,
          }}>
            {tazoUrls.length > 0 && (
              <div style={{ display: "flex", gap: -8, flexWrap: "wrap", justifyContent: "center", maxWidth: "80%" }}>
                {tazoUrls.slice(0, 4).map((url, i) => (
                  <div key={i} style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: `url(${url}) center/cover`,
                    border: "2px solid var(--ttg-black)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                  }} />
                ))}
              </div>
            )}
            <p style={{ fontSize: 8, fontWeight: 700, color: `${tubeColor}99`, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {count}/{maxCount}
            </p>
          </div>
        ) : (
          <TubeLoadingFallback />
        )}
      </div>

      {/* ═══ LABEL / STICKER ═══ */}
      {showLabel && (
        <div
          className="relative -mt-1 border-2 border-ttg-black flex-shrink-0"
          style={{
            width: s.width + 14,
            padding: "4px 6px",
            background: `repeating-linear-gradient(
              -30deg, transparent, transparent 3px,
              rgba(255,255,255,0.3) 3px, rgba(255,255,255,0.3) 6px
            ), linear-gradient(135deg, ${tubeColor} 0%, ${tubeColor} 100%)`,
            boxShadow: `2px 2px 0 var(--ttg-black)`,
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
          <div className="w-full h-1.5 rounded-full bg-ttg-black/10 overflow-hidden border border-ttg-black/10">
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${fillPct}%`,
                background: count >= maxCount
                  ? `linear-gradient(90deg, var(--ttg-success) 0%, var(--ttg-success) 100%)`
                  : `linear-gradient(90deg, ${tubeColor} 0%, ${tubeColor}88 100%)`,
              }} />
          </div>
          {count >= maxCount && (
            <p className="text-[7px] font-black text-ttg-success text-center uppercase tracking-[0.2em] mt-0.5">Sealed</p>
          )}
        </div>
      )}
    </div>
  )
}
