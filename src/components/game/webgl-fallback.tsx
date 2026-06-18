// ============================================================
// Trading Tazos Game — WebGL Fallback UI
// Shown when the browser doesn't support WebGL (headless,
// old GPU, software renderer). Magazine-themed so it doesn't
// feel like a crash — it's a "coming soon" / "upgrade" card.
// ============================================================
"use client"

import { Disc3, Monitor, ArrowLeft, ExternalLink } from "lucide-react"
import Link from "next/link"

interface WebGLFallbackProps {
  /** Optional callback to retry WebGL detection */
  onRetry?: () => void
  /** If true, render as a full-page takeover (for practice arena) */
  fullPage?: boolean
}

export default function WebGLFallback({ onRetry, fullPage = false }: WebGLFallbackProps) {
  const containerClasses = fullPage
    ? "fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]"
    : "min-h-[70vh] flex flex-col items-center justify-center gap-6 p-8"

  return (
    <div className={containerClasses}>
      {/* Halftone overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "6px 6px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-5 max-w-sm text-center">
        {/* Icon */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-[4px] border-ttg-yellow/20 bg-ttg-yellow/5 flex items-center justify-center">
            <Monitor className="w-10 h-10 text-ttg-yellow/60" />
          </div>
          {/* Crosshair ring */}
          <div className="absolute -inset-2 rounded-full border-[2px] border-ttg-yellow/10" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white uppercase tracking-[0.1em]">
            3D Arena
          </h2>
          <p className="text-[10px] font-black text-ttg-yellow/60 uppercase tracking-[0.3em]">
            WebGL required
          </p>
        </div>

        {/* Description */}
        <p className="text-sm text-white/40 leading-relaxed">
          The battle arena needs a graphics card with WebGL acceleration. Your current
          browser or device doesn&apos;t support it.
        </p>

        {/* Tips */}
        <div className="space-y-2 w-full">
          <div className="flex items-start gap-2 text-[11px] text-white/25">
            <span className="text-ttg-yellow/40 mt-px">•</span>
            <span>Try Chrome, Firefox, or Edge on desktop</span>
          </div>
          <div className="flex items-start gap-2 text-[11px] text-white/25">
            <span className="text-ttg-yellow/40 mt-px">•</span>
            <span>Make sure hardware acceleration is enabled</span>
          </div>
          <div className="flex items-start gap-2 text-[11px] text-white/25">
            <span className="text-ttg-yellow/40 mt-px">•</span>
            <span>Download the desktop app for best performance</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border-2 border-white/10 text-white/60 text-xs font-black uppercase tracking-wider hover:bg-white/10 hover:text-white/80 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back Home
          </Link>
          <Link
            href="/?page=collections"
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border-2 border-white/10 text-white/60 text-xs font-black uppercase tracking-wider hover:bg-white/10 hover:text-white/80 transition-all"
          >
            <Disc3 className="w-3.5 h-3.5" />
            Browse Tazos
          </Link>
          <Link
            href="/?page=download"
            className="flex items-center gap-2 px-5 py-2.5 bg-ttg-yellow text-black text-xs font-black uppercase tracking-wider hover:bg-[#FFD940] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Desktop App
          </Link>
        </div>

        {/* Retry button (only if callback provided) */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-1.5 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] hover:text-white/40 transition-colors"
          >
            Retry detection
          </button>
        )}
      </div>
    </div>
  )
}
