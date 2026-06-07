// ============================================================
// Trading Tazos Game — Vertical Slam Controls v2
// Bigger, bolder, more game-like feel
// ============================================================
"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Crosshair, ArrowDown, Zap, Target, Gauge } from "lucide-react"

export interface SlamControlsProps {
  phase: "aim" | "charge" | "tilt"
  tazoName: string
  tazoFranchise: string
  reticleX: number; reticleZ: number
  charge: number
  tiltDeg: number; spinIntensity: number
  onReticleMove: (x: number, z: number) => void
  onCharge: (level: number) => void
  onChargeComplete: (level: number) => void
  onTilt: (degrees: number, intensity: number) => void
  onSpin: (intensity: number) => void
  onRelease: () => void
  onBack: () => void
}

export default function SlamControls(props: SlamControlsProps) {
  const { phase, tazoName, tazoFranchise, reticleX, reticleZ, charge, tiltDeg, spinIntensity,
    onReticleMove, onCharge, onChargeComplete, onTilt, onSpin, onRelease, onBack } = props

  const [charging, setCharging] = useState(false)
  const chargeRef = useRef(0)
  const chargeInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCharge = useCallback(() => {
    setCharging(true); chargeRef.current = 0; onCharge(0)
    chargeInterval.current = setInterval(() => {
      chargeRef.current = Math.min(1, chargeRef.current + 0.025)
      onCharge(chargeRef.current)
      if (chargeRef.current >= 1) { onChargeComplete(chargeRef.current); stopCharge() }
    }, 50)
  }, [onCharge, onChargeComplete])

  const stopCharge = useCallback(() => {
    setCharging(false)
    if (chargeInterval.current) { clearInterval(chargeInterval.current); chargeInterval.current = null }
  }, [])

  useEffect(() => { return () => { if (chargeInterval.current) clearInterval(chargeInterval.current) } }, [])

  const handlePadMove = useCallback((cx: number, cy: number, rect: DOMRect) => {
    const x = Math.max(0, Math.min(1, (cx - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (cy - rect.top) / rect.height))
    onReticleMove((x - 0.5) * 2, -(y - 0.5) * 2)
  }, [onReticleMove])

  const handleTiltDrag = useCallback((cx: number, cy: number, rect: DOMRect) => {
    const mx = rect.left + rect.width / 2; const my = rect.top + rect.height / 2
    const dx = cx - mx; const dy = cy - my
    const dist = Math.sqrt(dx*dx + dy*dy)
    const angle = Math.atan2(dy, dx) * (180 / Math.PI)
    onTilt(angle, Math.min(1, dist / (rect.width * 0.4)))
  }, [onTilt])

  // Charge quality indicator
  const chargeLabel = charge < 0.25 ? "Weak" : charge < 0.6 ? "Good" : charge < 0.82 ? "PERFECT!" : "OVERCHARGED!"
  const chargeColor = charge < 0.25 ? "#FFCC0050" : charge < 0.6 ? "#FFCC00" : charge < 0.82 ? "#22C55E" : "#FF004D"
  const chargeBarColor = charge > 0.82 ? "#FF004D" : charge > 0.6 ? "#22C55E" : charge > 0.25 ? "#FFCC00" : "#FFCC0050"

  return (
    <div className="w-full bg-gradient-to-t from-black/90 via-black/85 to-black/70 backdrop-blur-xl border-t border-white/10">
      {/* ════════════════ TOP BAR ════════════════ */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
        <button onClick={onBack} className="text-[10px] font-black text-white/25 hover:text-white/50 uppercase tracking-wider transition-colors">
          ← Back
        </button>
        <div className="flex items-center gap-2">
          {/* Phase pills */}
          <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider transition-all ${
            phase === "aim" ? "text-[#FFCC00] border-[#FFCC00]/40 bg-[#FFCC00]/10" : "text-white/15 border-white/5"
          }`}><Target className="w-3 h-3 inline mr-1" />AIM</span>
          <span className="text-white/10 text-[8px]">→</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider transition-all ${
            phase === "charge" ? "text-[#FF8800] border-[#FF8800]/40 bg-[#FF8800]/10" : "text-white/15 border-white/5"
          }`}><Gauge className="w-3 h-3 inline mr-1" />CHARGE</span>
          <span className="text-white/10 text-[8px]">→</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider transition-all ${
            phase === "tilt" ? "text-[#FF004D] border-[#FF004D]/40 bg-[#FF004D]/10" : "text-white/15 border-white/5"
          }`}>↗ TILT</span>
          <span className="text-white/10 text-[8px]">→</span>
          <span className="text-[10px] font-black px-2 py-0.5 rounded border border-[#FFCC00]/20 text-[#FFCC00]/40 uppercase tracking-wider">💥 SLAM</span>
        </div>
        <span className="text-[9px] font-black text-white/15 uppercase">{tazoName}</span>
      </div>

      {/* ════════════════ AIM PHASE ════════════════ */}
      {phase === "aim" && (
        <div className="p-4 space-y-3">
          <div
            className="relative w-full aspect-[2/1] max-h-[180px] mx-auto bg-black/40 rounded-xl border-2 border-white/10 overflow-hidden cursor-crosshair hover:border-[#FFCC00]/30 transition-colors"
            onMouseMove={(e) => handlePadMove(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())}
            onTouchMove={(e) => { e.preventDefault(); const t = e.touches[0]; handlePadMove(t.clientX, t.clientY, e.currentTarget.getBoundingClientRect()) }}
          >
            {/* Mini arena */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border border-white/8 rounded-full" style={{ width: "70%", paddingBottom: "35%" }} />
              <div className="absolute border border-white/5 rounded-full" style={{ width: "50%", paddingBottom: "25%" }} />
              <div className="absolute w-2 h-2 rounded-full bg-white/10" />
            </div>
            {/* Stake positions */}
            <div className="absolute top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-[#29ADFF]/30 bg-[#29ADFF]/5" />
            <div className="absolute top-1/2 left-[70%] -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-[#FF004D]/30 bg-[#FF004D]/5" />
            {/* Reticle */}
            <div className="absolute w-8 h-8 -ml-4 -mt-4 pointer-events-none"
              style={{ left: `${((reticleX + 1) / 2) * 100}%`, top: `${((-reticleZ + 1) / 2) * 100}%` }}>
              <Crosshair className="w-full h-full text-[#FFCC00] drop-shadow-[0_0_8px_rgba(255,204,0,0.7)]" strokeWidth={1.5} />
            </div>
          </div>
          <button
            onMouseDown={startCharge}
            onTouchStart={(e) => { e.preventDefault(); startCharge() }}
            className="w-full py-4 bg-[#FFCC00] hover:bg-[#FFD633] active:bg-[#FFB800] text-[#1a1a1a] font-black text-base uppercase rounded-xl tracking-wider transition-all shadow-[0_4px_15px_rgba(255,204,0,0.3)] hover:shadow-[0_6px_25px_rgba(255,204,0,0.5)] active:scale-[0.98]"
          >
            ⚡ HOLD TO CHARGE
          </button>
          <p className="text-center text-[8px] font-bold text-white/20">Aim where you want the tazo to hit</p>
        </div>
      )}

      {/* ════════════════ CHARGE PHASE ════════════════ */}
      {phase === "charge" && (
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Force</span>
              <span className="text-sm font-black" style={{ color: chargeColor }}>{chargeLabel}</span>
            </div>
            {/* Big charge bar */}
            <div className="relative w-full h-10 bg-black/40 rounded-xl overflow-hidden border-2 border-white/10">
              <div className="absolute inset-0 flex">
                {/* Bar fill */}
                <div className="h-full transition-all duration-75 rounded-l-xl" style={{
                  width: `${charge * 100}%`,
                  background: `linear-gradient(90deg, ${chargeBarColor}44, ${chargeBarColor})`,
                }} />
              </div>
              {/* Sweet spot zone */}
              <div className="absolute top-0 left-[60%] w-[22%] h-full bg-[#22C55E]/10 border-l-2 border-r-2 border-[#22C55E]/20" />
              <div className="absolute top-0 left-[60%] h-full w-0.5 bg-[#22C55E]/40" />
              <div className="absolute top-0 left-[82%] h-full w-0.5 bg-[#22C55E]/40" />
              {/* Center label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-sm font-black text-white/30 tracking-widest">
                  {charge > 0 ? `${Math.round(charge * 100)}%` : "HOLD..."}
                </span>
              </div>
            </div>
            {/* Labels */}
            <div className="flex justify-between text-[7px] font-black text-white/15">
              <span>0%</span><span>25%</span><span>60%</span><span>82%</span><span>100%</span>
            </div>
          </div>
          <button
            onMouseUp={() => { stopCharge(); onRelease() }}
            onMouseLeave={() => { if (charging) { stopCharge(); onRelease() } }}
            onTouchEnd={(e) => { e.preventDefault(); stopCharge(); onRelease() }}
            className="w-full py-5 bg-gradient-to-r from-[#FF004D] to-[#FF1A5C] hover:from-[#FF1A5C] hover:to-[#FF3355] text-white font-black text-lg uppercase rounded-xl tracking-wider transition-all shadow-[0_4px_20px_rgba(255,0,77,0.35)] hover:shadow-[0_6px_30px_rgba(255,0,77,0.5)] active:scale-[0.97]"
          >
            <ArrowDown className="w-5 h-5 inline mr-2 animate-bounce" />
            RELEASE!
          </button>
        </div>
      )}

      {/* ════════════════ TILT PHASE ════════════════ */}
      {phase === "tilt" && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Tilt pad */}
            <div className="space-y-2">
              <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Tilt Direction</span>
              <div
                className="relative w-full aspect-square bg-black/40 rounded-xl border-2 border-white/10 cursor-grab active:cursor-grabbing hover:border-white/20 transition-colors"
                onMouseMove={(e) => handleTiltDrag(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())}
                onTouchMove={(e) => { e.preventDefault(); handleTiltDrag(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget.getBoundingClientRect()) }}
              >
                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-white/10" strokeWidth={1.5} />
                <div className="absolute top-1/2 left-1/2 w-2 h-8 -mt-4 bg-[#FFCC00] rounded-full origin-bottom shadow-[0_0_10px_rgba(255,204,0,0.4)]"
                  style={{ transform: `translateX(-50%) rotate(${tiltDeg}deg)` }} />
                <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[7px] font-black text-white/10">↑</span>
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[7px] font-black text-white/10">↓</span>
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[7px] font-black text-white/10">←</span>
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[7px] font-black text-white/10">→</span>
              </div>
            </div>
            {/* Spin control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Spin</span>
                <span className="text-[10px] font-black text-[#FFCC00]">{Math.round(spinIntensity * 100)}%</span>
              </div>
              <div className="flex-1 flex items-center">
                <input type="range" min="0" max="100" value={spinIntensity * 100}
                  onChange={(e) => onSpin(Number(e.target.value) / 100)}
                  className="w-full h-3 bg-black/40 rounded-full appearance-none cursor-pointer accent-[#FFCC00]
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FFCC00]
                    [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-[#1a1a1a]
                    [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(255,204,0,0.4)]" />
              </div>
              <div className="flex justify-between text-[7px] font-black text-white/10">
                <span>Straight</span><span>Max curve</span>
              </div>
            </div>
          </div>
          <button onClick={onRelease}
            className="w-full py-5 bg-gradient-to-r from-[#FFCC00] to-[#FFD633] hover:from-[#FFD633] hover:to-[#FFE066] text-[#1a1a1a] font-black text-lg uppercase rounded-xl tracking-wider transition-all shadow-[0_4px_20px_rgba(255,204,0,0.4)] hover:shadow-[0_6px_30px_rgba(255,204,0,0.6)] active:scale-[0.97]">
            <ArrowDown className="w-5 h-5 inline mr-2" />
            SLAM!
          </button>
        </div>
      )}
    </div>
  )
}
