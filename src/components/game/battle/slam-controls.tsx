// ============================================================
// Trading Tazos Game — Vertical Slam Controls
// Controls for the vertical slam throw mechanic:
//  - Reticle positioning (tap/drag on arena)
//  - Charge meter (hold to charge vertical force)
//  - Tilt adjustment (drag direction after charge)
//  - Release to slam
// ============================================================
"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Crosshair, ArrowDown, Zap } from "lucide-react"

export interface SlamControlsProps {
  phase: "aim" | "charge" | "tilt"
  tazoName: string
  tazoFranchise: string
  /** Current reticle position normalized 0-1 */
  reticleX: number
  reticleZ: number
  /** Current charge 0-1 */
  charge: number
  /** Tilt angle in degrees */
  tiltDeg: number
  /** Spin intensity 0-1 */
  spinIntensity: number
  /** Callbacks */
  onReticleMove: (x: number, z: number) => void
  onCharge: (level: number) => void
  onChargeComplete: (level: number) => void
  onTilt: (degrees: number, intensity: number) => void
  onSpin: (intensity: number) => void
  onRelease: () => void
  onBack: () => void
}

export default function SlamControls({
  phase, tazoName, tazoFranchise,
  reticleX, reticleZ, charge, tiltDeg, spinIntensity,
  onReticleMove, onCharge, onChargeComplete, onTilt, onSpin, onRelease, onBack,
}: SlamControlsProps) {
  const [charging, setCharging] = useState(false)
  const chargeRef = useRef(0)
  const chargeInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Charge animation ──
  const startCharge = useCallback(() => {
    setCharging(true)
    chargeRef.current = 0
    onCharge(0)

    chargeInterval.current = setInterval(() => {
      chargeRef.current = Math.min(1, chargeRef.current + 0.03)
      onCharge(chargeRef.current)

      if (chargeRef.current >= 1) {
        onChargeComplete(chargeRef.current)
        stopCharge()
      }
    }, 50)
  }, [onCharge, onChargeComplete])

  const stopCharge = useCallback(() => {
    setCharging(false)
    if (chargeInterval.current) {
      clearInterval(chargeInterval.current)
      chargeInterval.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (chargeInterval.current) clearInterval(chargeInterval.current)
    }
  }, [])

  // ── Reticle pad (touch/mouse area for aiming) ──
  const handlePadMove = useCallback((clientX: number, clientY: number, rect: DOMRect) => {
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    // Map 0-1 to -1..1 arena space
    const ax = (x - 0.5) * 2
    const az = -(y - 0.5) * 2  // Invert Y for 3D Z
    onReticleMove(ax, az)
  }, [onReticleMove])

  // ── Tilt adjustment ──
  const handleTiltDrag = useCallback((clientX: number, clientY: number, rect: DOMRect) => {
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = clientX - cx
    const dy = clientY - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx) * (180 / Math.PI)
    const intensity = Math.min(1, dist / (rect.width * 0.4))
    onTilt(angle, intensity)
  }, [onTilt])

  const franchiseColor = tazoFranchise === "minimon" ? "#FFCC00"
    : tazoFranchise === "cybermon" ? "#00A1E9"
    : "#E3350D"

  return (
    <div className="w-full bg-black/70 backdrop-blur-md border-t border-white/10">
      {/* Tazo info bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <button onClick={onBack} className="text-[9px] font-black text-white/30 hover:text-white/60 uppercase tracking-wider">
          ← Back
        </button>
        <div className="text-center">
          <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">
            {phase === "aim" ? "AIM" : phase === "charge" ? "CHARGE" : "TILT & SPIN"}
          </span>
          <div className="text-xs font-black text-white truncate max-w-[180px]">
            <span style={{ color: franchiseColor }}>⬤</span> {tazoName}
          </div>
        </div>
        <span className="text-[8px] font-black text-white/20 uppercase">SLAM</span>
      </div>

      {/* ── AIM PHASE: Reticle pad ── */}
      {phase === "aim" && (
        <div className="p-3 space-y-3">
          <div
            className="relative w-full aspect-square max-h-[200px] mx-auto bg-white/5 rounded-lg border border-white/10 overflow-hidden cursor-crosshair"
            onMouseMove={(e) => handlePadMove(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())}
            onTouchMove={(e) => {
              e.preventDefault()
              const t = e.touches[0]
              handlePadMove(t.clientX, t.clientY, e.currentTarget.getBoundingClientRect())
            }}
          >
            {/* Arena mini-map */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[70%] h-[70%] rounded-full border border-white/10" />
              <div className="w-[50%] h-[50%] rounded-full border border-white/5" />
            </div>
            {/* Reticle */}
            <div
              className="absolute w-6 h-6 -ml-3 -mt-3 pointer-events-none"
              style={{
                left: `${((reticleX + 1) / 2) * 100}%`,
                top: `${((-reticleZ + 1) / 2) * 100}%`,
              }}
            >
              <Crosshair className="w-full h-full text-[#FFCC00] drop-shadow-[0_0_6px_rgba(255,204,0,0.6)]" strokeWidth={1.5} />
            </div>
            {/* Center markers */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/20" />
          </div>

          <button
            onMouseDown={startCharge}
            onTouchStart={(e) => { e.preventDefault(); startCharge() }}
            className="w-full py-3 bg-[#FFCC00] hover:bg-[#FFD633] text-[#1a1a1a] font-black text-sm uppercase rounded-lg transition-colors"
          >
            Hold to Charge
          </button>
        </div>
      )}

      {/* ── CHARGE PHASE: Force meter ── */}
      {phase === "charge" && (
        <div className="p-4 space-y-4">
          {/* Force meter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[9px] font-black text-white/40 uppercase">
              <span>Force</span>
              <span>{Math.round(charge * 100)}%</span>
            </div>
            <div className="relative w-full h-6 bg-white/10 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full transition-all duration-75 rounded-full"
                style={{
                  width: `${charge * 100}%`,
                  background: charge > 0.75
                    ? "linear-gradient(90deg, #FFCC00, #FF8800, #FF004D)"
                    : charge > 0.4
                      ? "linear-gradient(90deg, #FFCC00, #FFAA00)"
                      : "linear-gradient(90deg, #BBA800, #FFCC00)",
                }}
              />
              {/* Sweet spot */}
              <div className="absolute top-0 left-[70%] w-0.5 h-full bg-white/30" />
            </div>
          </div>

          {/* Sweet spot indicator */}
          <div className="text-center">
            {charge < 0.25 && (
              <span className="text-[9px] font-black text-white/30">Too weak...</span>
            )}
            {charge >= 0.25 && charge < 0.6 && (
              <span className="text-[9px] font-black text-[#FFCC00]">Good force</span>
            )}
            {charge >= 0.6 && charge < 0.82 && (
              <span className="text-[9px] font-black text-[#22C55E]">⚡ Perfect range!</span>
            )}
            {charge >= 0.82 && (
              <span className="text-[9px] font-black text-[#FF004D]">OVERCHARGED!</span>
            )}
          </div>

          {/* Release button */}
          <button
            onMouseUp={() => {
              stopCharge()
              onRelease()
            }}
            onMouseLeave={() => {
              if (charging) {
                stopCharge()
                onRelease()
              }
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              stopCharge()
              onRelease()
            }}
            className="w-full py-3 bg-[#FF004D] hover:bg-[#FF1A5C] text-white font-black text-sm uppercase rounded-lg transition-colors"
          >
            <ArrowDown className="w-4 h-4 inline mr-2" />
            RELEASE
          </button>
        </div>
      )}

      {/* ── TILT PHASE: Direction + spin ── */}
      {phase === "tilt" && (
        <div className="p-4 space-y-4">
          {/* Tilt pad */}
          <div
            className="relative w-full aspect-square max-h-[160px] mx-auto bg-white/5 rounded-lg border border-white/10 cursor-grab active:cursor-grabbing"
            onMouseMove={(e) => handleTiltDrag(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())}
            onTouchMove={(e) => {
              e.preventDefault()
              const t = e.touches[0]
              handleTiltDrag(t.clientX, t.clientY, e.currentTarget.getBoundingClientRect())
            }}
          >
            {/* Center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <Zap className="w-6 h-6 text-white/20" strokeWidth={1.5} />
            </div>
            {/* Tilt indicator */}
            <div
              className="absolute top-1/2 left-1/2 w-1.5 h-6 -mt-3 bg-[#FFCC00] rounded-full origin-bottom transition-transform duration-100"
              style={{ transform: `translateX(-50%) rotate(${tiltDeg}deg)` }}
            />
            {/* Direction labels */}
            <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] font-black text-white/20">FORWARD</span>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-black text-white/20">BACK</span>
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-white/20">LEFT</span>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-white/20">RIGHT</span>
          </div>

          {/* Spin slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[9px] font-black text-white/40 uppercase">
              <span>Spin</span>
              <span>{Math.round(spinIntensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={spinIntensity * 100}
              onChange={(e) => onSpin(Number(e.target.value) / 100)}
              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FFCC00]
                [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#1a1a1a]"
            />
          </div>

          {/* Release button */}
          <button
            onClick={onRelease}
            className="w-full py-3 bg-[#FF004D] hover:bg-[#FF1A5C] text-white font-black text-sm uppercase rounded-lg transition-colors"
          >
            <ArrowDown className="w-4 h-4 inline mr-2" />
            SLAM!
          </button>
        </div>
      )}
    </div>
  )
}
