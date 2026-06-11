// ============================================================
// Trading Tazos Game — TazoDiscImage
// Reusable 2D tazo disc renderer with:
//  - Proper fill & scale
//  - Physical finish layers (holo, foil, glossy, etc.)
//  - Creature variant support (shiny, shadow, golden)
// Used by: Album, Collection, Decks, Shop reveal, Battle hand.
// ============================================================
"use client"

import { useState } from "react"
import "@/styles/tazo-finishes.css"
import type { TazoFinish, TazoCreatureVariant } from "@/lib/battle/game-loop"

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
  /** Physical finish: holo, foil, glossy, etc. (default: "normal") */
  finish?: TazoFinish
  /** Creature variant: shiny, shadow, golden, etc. (default: "standard") */
  creatureVariant?: TazoCreatureVariant
  /** Alternative shiny image URL (used when variant === "shiny" and available) */
  shinyImageUrl?: string | null
  /** Wear level 0-100: applies damage pattern overlay and stat penalties */
  wear?: number
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
  src, alt, size = 112, scale = 1.0,
  borderWidth = 0, borderColor = "transparent", bgColor,
  className = "", isBack = false, number, franchiseSlug,
  overlay, lazy = true, onClick, onFlip,
  finish = "normal", creatureVariant = "standard",
  shinyImageUrl, wear = 0,
}: TazoDiscImageProps) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const sizePx = typeof size === "number" ? `${size}px` : size
  const fallbackBg = franchiseSlug ? (FRANCHISE_FALLBACK_BG[franchiseSlug] || "#FFCC00") : "#FFCC00"
  const fallbackText = franchiseSlug ? (FRANCHISE_FALLBACK_TEXT[franchiseSlug] || "#7C2D12") : "#7C2D12"
  const innerBg = bgColor || (isBack ? "#fff" : fallbackBg)
  const effectiveFinish = finish || "normal"
  const effectiveVariant = creatureVariant || "standard"

  // Resolve which image to show for shiny
  const displaySrc = (effectiveVariant === "shiny" && shinyImageUrl) ? shinyImageUrl : src
  const renderImage = displaySrc && !imgError
  const showExternalNumber = number && typeof number === "string" && number.length < 10

  const finishClass = `tazo-finish-${effectiveFinish}`
  const variantClass = effectiveVariant !== "standard" ? `tazo-variant-${effectiveVariant}` : ""
  // Wear tier class
  const wearTierClass = wear <= 0 ? "tazo-wear-mint"
    : wear <= 15 ? "tazo-wear-light_play"
    : wear <= 40 ? "tazo-wear-played"
    : wear <= 70 ? "tazo-wear-heavy_play"
    : "tazo-wear-damaged"

  return (
    <div
      className={`tazo-disc-image shrink-0 ${finishClass} ${variantClass} ${wearTierClass} ${className}`}
      style={{
        width: sizePx,
        height: sizePx,
        borderRadius: "50%",
        border: `${borderWidth}px solid ${borderColor}`,
        background: borderWidth > 0 ? borderColor : "transparent",
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
      role={undefined}
      aria-label={onClick || onFlip ? alt : undefined}
    >
      {/* Inner circle — clips the image */}
      <div className="tazo-disc-image-inner absolute inset-0 rounded-full overflow-hidden">
        {renderImage ? (
          <img
            src={displaySrc}
            alt={alt}
            className={`w-full h-full tazo-character ${variantClass}`}
            style={{
              objectFit: "cover",
              display: "block",
              transform: `scale(${isBack ? 1.03 * scale : 1.14 * scale})`,
              transformOrigin: "center center",
              opacity: imgLoaded ? 1 : 0,
              transition: "opacity 0.2s ease-in",
            }}
            loading={lazy ? "lazy" : undefined}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
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

      {/* ── Finish layers (above image, below overlay) ── */}
      {!isBack && renderImage && imgLoaded && (
        <>
          {/* Primary finish layer (holo, prismatic, foil, etc.) */}
          <div className="tazo-finish-layer" />
          {/* Secondary finish layer (micro-lines, crinkle, sparkle, etc.) */}
          <div className="tazo-finish-layer-2" />
          {/* Glossy/reverse_holo overlay */}
          <div className="tazo-gloss-layer" />
          {/* Subtle print texture (all tazos) */}
          <div className="tazo-print-grain" />
          {/* Wear/condition degradation */}
          <div className="tazo-condition-layer" />
        </>
      )}

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
