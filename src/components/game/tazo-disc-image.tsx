// ============================================================
// Trading Tazos Game — TazoDiscImage
// Reusable 2D tazo disc renderer with proper fill & scale.
// Used by: Album, Collection, Decks, Shop reveal, Battle hand.
// Ensures tazos occupy the full circular area with configurable
// scale compensation for transparent margins in source assets.
// ============================================================
"use client"

import { useState } from "react"

export interface TazoDiscImageProps {
  /** Image URL (front art or back art) */
  src: string | null | undefined
  /** Alt text — fallback shown when no image */
  alt: string
  /** Diameter in pixels or CSS value (default: 112px) */
  size?: number | string
  /** Scale factor to compensate transparent margins (1.0 = no scaling) */
  scale?: number
  /** Border width on the circle (default: 3px) */
  borderWidth?: number
  /** Border color (default: #1a1a1a) */
  borderColor?: string
  /** Inner background color (shown behind the image) */
  bgColor?: string
  /** CSS class overrides for the container */
  className?: string
  /** Whether this is a back-art image (renders darker bg) */
  isBack?: boolean
  /** Optional number badge (shown bottom-center) */
  number?: number | string | null
  /** Optional franchise slug for fallback styling */
  franchiseSlug?: string
  /** Optional overlay (lock icon, star, etc.) */
  overlay?: React.ReactNode
  /** Whether to lazy load the image */
  lazy?: boolean
  /** Click handler */
  onClick?: () => void
  /** Flip handler (separate from click) */
  onFlip?: () => void
}

// Radial gradients matching composite-tazo.js disc backgrounds
const FRANCHISE_FALLBACK_BG: Record<string, string> = {
  minimon: "radial-gradient(circle at 50% 50%, #FFF5E1 0%, #FFE6C8 70%, rgba(255,203,5,0.3) 100%)",
  cybermon: "radial-gradient(circle at 50% 50%, #E1F5FF 0%, #C8E6FF 70%, rgba(0,161,233,0.3) 100%)",
  dracobell: "radial-gradient(circle at 50% 50%, #FFF5E1 0%, #FFE6C8 70%, rgba(227,53,13,0.3) 100%)",
}

const FRANCHISE_FALLBACK_TEXT: Record<string, string> = {
  minimon: "#7C2D12",
  cybermon: "#FFFFFF",
  dracobell: "#FFFFFF",
}

export default function TazoDiscImage({
  src, alt, size = 112, scale = 1.16,
  borderWidth = 3, borderColor = "#1a1a1a", bgColor,
  className = "", isBack = false, number, franchiseSlug,
  overlay, lazy = true, onClick, onFlip,
}: TazoDiscImageProps) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const sizePx = typeof size === "number" ? `${size}px` : size
  const fallbackBg = franchiseSlug ? (FRANCHISE_FALLBACK_BG[franchiseSlug] || "#FFCC00") : "#FFCC00"
  const fallbackText = franchiseSlug ? (FRANCHISE_FALLBACK_TEXT[franchiseSlug] || "#7C2D12") : "#7C2D12"
  const innerBg = bgColor || (isBack ? "#111" : fallbackBg)

  const renderImage = src && !imgError
  const isGeneratedDisc = !!src?.includes("/tazos-generated/")
  // All tazo images use the same scale for visual consistency.
  // Generated tazos (1024×1024, disc at ~445px radius) need ~1.15×
  // to fill the container circle; non-generated images also need
  // similar scale compensation for transparent margins.
  const effectiveScale = scale
  const showExternalNumber = !isGeneratedDisc && number

  return (
    <div
      className={`tazo-disc-image shrink-0 ${className}`}
      style={{
        width: sizePx,
        height: sizePx,
        borderRadius: "50%",
        border: `${borderWidth}px solid ${borderColor}`,
        background: innerBg,
        position: "relative",
        overflow: "hidden",
        cursor: onClick || onFlip ? "pointer" : undefined,
        boxSizing: "border-box",
      }}
      onClick={(e) => {
        if (onFlip) {
          e.stopPropagation()
          onFlip()
          return
        }
        onClick?.()
      }}
      role={onClick || onFlip ? "button" : undefined}
      tabIndex={onClick || onFlip ? 0 : undefined}
      aria-label={alt}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          if (onFlip) { onFlip(); return }
          onClick?.()
        }
      }}
    >
      {/* Inner circle — clips the image */}
      <div className="tazo-disc-image-inner absolute inset-0 rounded-full overflow-hidden">
        {renderImage ? (
          <div
            className="w-full h-full rounded-full overflow-hidden relative"
            style={{
              transform: `scale(${effectiveScale})`,
              transformOrigin: "center center",
              opacity: imgLoaded ? 1 : 0,
              transition: "opacity 0.2s ease-in",
            }}
          >
            <img
              src={src}
              alt={alt}
              className="w-full h-full rounded-full"
              style={{ objectFit: "cover", display: "block" }}
              loading={lazy ? "lazy" : undefined}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          /* Fallback — franchise-colored disc with "?" */
          <div
            className="w-full h-full rounded-full flex items-center justify-center"
            style={{ background: fallbackBg }}
          >
            <span
              className="text-[48px] font-black leading-none"
              style={{ color: fallbackText, opacity: 0.4 }}
            >
              ?
            </span>
            {number && (
              <span
                className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-black px-1.5 rounded-sm leading-tight"
                style={{
                  color: "#1a1a1a",
                  background: "rgba(255,255,255,0.9)",
                  border: "1px solid #1a1a1a",
                }}
              >
                #{number}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Number badge — only when image loaded successfully */}
      {renderImage && imgLoaded && showExternalNumber && (
        <span
          className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-black px-1.5 rounded-sm leading-tight z-10"
          style={{
            color: "#1a1a1a",
            background: "rgba(255,255,255,0.92)",
            border: "1px solid #1a1a1a",
          }}
        >
          #{number}
        </span>
      )}

      {/* Overlay (lock, star, deck indicator, etc.) */}
      {overlay && (
        <div className="absolute inset-0 rounded-full flex items-center justify-center z-20 pointer-events-none">
          {overlay}
        </div>
      )}
    </div>
  )
}
