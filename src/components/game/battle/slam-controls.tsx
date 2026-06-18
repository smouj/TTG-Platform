// ============================================================
// Trading Tazos Game — Slam Controls v6: Auto-Aim Reticle
//
// AIM phase: reticle auto-moves based on tazo stats (control & precision).
// High CONTROL = slow, rhythmic sweep. Low CONTROL = fast, erratic.
// High PRECISION = minimal jitter. Low PRECISION = twitchy wobble.
// User clicks to LOCK aim, then flows into CHARGE → TILT → SLAM.
// ============================================================
"use client"

import { useCallback, useRef, useEffect, useState } from "react"
import { Crosshair, Zap, Lock } from "lucide-react"
import { playSfx, stopSfx } from "@/lib/battle/sfx"

export interface SlamControlsProps {
  phase: "aim" | "charge" | "tilt"
  tazoName: string; tazoFranchise: string
  tazoControl: number     // 0-100, higher = slower/easier reticle movement
  tazoPrecision: number   // 0-100, higher = less jitter
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
  const { phase, tazoName, tazoControl, tazoPrecision, reticleX, reticleZ,
    charge, tiltDeg, spinIntensity,
    onReticleMove, onCharge, onChargeComplete, onTilt, onSpin, onRelease, onBack } = props

  const chargeInt = useRef<ReturnType<typeof setInterval> | null>(null)
  const cbRef = useRef({ onCharge, onChargeComplete })
  cbRef.current = { onCharge, onChargeComplete }

  // ─── Auto-moving reticle animation (AIM phase) ───
  // Uses requestAnimationFrame for 60fps smooth movement.
  // Orbit is an ellipse centered on the arena, sweeping past the two staked tazos.
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const [aimLocked, setAimLocked] = useState(false)

  useEffect(() => {
    if (phase !== "aim") {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      return
    }

    // Stats → movement params
    // control: 100 = glacial (0.18 rad/s), 0 = wild (1.2 rad/s)
    const omega = 1.2 - (tazoControl / 100) * 1.02
    // precision: 100 = zero jitter, 0 = ±0.2 jitter
    const jitterAmp = ((100 - tazoPrecision) / 100) * 0.18
    const orbitX = 0.65  // ellipse semi-major axis (passes near staked tazos at ±0.55)
    const orbitZ = 0.28  // ellipse semi-minor axis
    let noisePhase = Math.random() * Math.PI * 2
    let lastTick = 0 // throttled aim_tick SFX

    startTimeRef.current = performance.now()

    const tick = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000  // seconds
      
      // Aim tick SFX — every ~400ms based on control stat (slower = less frequent)
      const tickInterval = 0.25 + (tazoControl / 100) * 0.55 // 250-800ms
      if (elapsed - lastTick >= tickInterval && !aimLocked) {
        lastTick = elapsed
        playSfx("aim_tick", 0.15)
      }
      
      const angle = omega * elapsed

      // Primary elliptical orbit
      let x = orbitX * Math.cos(angle)
      let z = orbitZ * Math.sin(angle)

      // Jitter (precision-based pseudo-noise)
      if (jitterAmp > 0.001) {
        x += jitterAmp * Math.sin(elapsed * 7.3 + noisePhase)
        z += jitterAmp * Math.cos(elapsed * 5.7 + noisePhase * 1.3)
        x += jitterAmp * 0.6 * Math.cos(elapsed * 11.1 + noisePhase * 2.1)
        z += jitterAmp * 0.6 * Math.sin(elapsed * 8.9 + noisePhase * 0.7)
      }

      // Clamp to valid range (-1 to 1)
      x = Math.max(-1, Math.min(1, x))
      z = Math.max(-1, Math.min(1, z))

      if (!aimLocked) {
        onReticleMove(x, z)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null } }
  }, [phase, tazoControl, tazoPrecision, aimLocked, onReticleMove])

  // Charge phase SFX
  const chargeHumRef = useRef<any>(null)
  useEffect(() => {
    if (phase === "charge") {
      chargeHumRef.current = playSfx("charge_start", 0.25)
    } else {
      stopSfx(chargeHumRef.current)
      chargeHumRef.current = null
    }
    return () => { stopSfx(chargeHumRef.current); chargeHumRef.current = null }
  }, [phase])
  useEffect(() => {
    if (phase === "charge") {
      let level = 0
      cbRef.current.onCharge(0)
      chargeInt.current = setInterval(() => {
        level = Math.min(1, level + 0.025)
        cbRef.current.onCharge(level)
        if (level >= 1) {
          if (chargeInt.current) clearInterval(chargeInt.current)
          chargeInt.current = null
          playSfx("charge_peak", 0.35)
          cbRef.current.onChargeComplete(level)
        }
      }, 50)
      return () => { if (chargeInt.current) { clearInterval(chargeInt.current); chargeInt.current = null } }
    } else {
      if (chargeInt.current) { clearInterval(chargeInt.current); chargeInt.current = null }
    }
  }, [phase])

  useEffect(() => { return () => { if (chargeInt.current) clearInterval(chargeInt.current) } }, [])

  const tiltDrag = useCallback((cx: number, cy: number, rect: DOMRect) => {
    const mx = rect.left + rect.width / 2; const my = rect.top + rect.height / 2
    const dx = cx - mx; const dy = cy - my
    onTilt(Math.atan2(dy, dx) * (180 / Math.PI), Math.min(1, Math.sqrt(dx * dx + dy * dy) / (rect.width * 0.4)))
  }, [onTilt])

  // Critical timing zones: PERFECT 68-76%, GOOD 60-82%, OVERCHARGE >82%, WEAK <30%
  const timingQuality = charge >= 0.68 && charge <= 0.76 ? "PERFECT" : charge >= 0.60 && charge <= 0.82 ? "GOOD" : charge > 0.82 ? "OVERCHARGE" : charge < 0.30 ? "WEAK" : "OK"
  const isPerfect = timingQuality === "PERFECT"
  const isGood = timingQuality === "GOOD" || isPerfect
  const isOver = timingQuality === "OVERCHARGE"
  const isWeak = timingQuality === "WEAK"
    // (isOver defined above)
  const barColor = isOver ? "var(--ttg-opponent)" : isPerfect ? "var(--ttg-success)" : isGood ? "var(--ttg-yellow)" : isWeak ? "#888" : charge > 0.15 ? "#FFCC0080" : "#FFCC0040"

  // ═════════════════════════════════════
  // AIM — auto-moving reticle
  // ═════════════════════════════════════
  if (phase === "aim") {
    const ctrlLabel = tazoControl >= 70 ? "Smooth" : tazoControl >= 40 ? "Normal" : "Wild"
    const ctrlColor = tazoControl >= 70 ? "var(--ttg-success)" : tazoControl >= 40 ? "var(--ttg-yellow)" : "#FF8800"
    const precLabel = tazoPrecision >= 70 ? "Steady" : tazoPrecision >= 40 ? "Okay" : "Shaky"
    const precColor = tazoPrecision >= 70 ? "var(--ttg-success)" : tazoPrecision >= 40 ? "var(--ttg-yellow)" : "#FF8800"

    return (
      <div className="animate-[fadeInLeft_0.25s_ease-out]">
        {/* Reticle pad — magazine-issue frame */}
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col">
          <div className="flex-1 flex items-center justify-center p-8 pb-32">
            <div className="relative w-full max-w-[340px] aspect-square bg-black/40 backdrop-blur-sm  overflow-hidden pointer-events-none"
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "inset 0 0 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,204,0,0.04)",
              }}>
              {/* Magazine page-edge accent line */}
              <div className="absolute top-0 left-3 right-3 h-px bg-white/4" />
              <div className="absolute bottom-0 left-3 right-3 h-px bg-white/4" />
              
              {/* Concentric reference rings */}
              <div className="absolute inset-4 flex items-center justify-center">
                <div className="border border-white/6 rounded-full w-full h-full" />
                <div className="absolute border border-white/4 rounded-full w-[70%] h-[70%]" />
                <div className="absolute border border-white/3 rounded-full w-[40%] h-[40%]" />
              </div>

              {/* Stake position indicators */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute top-1/2 -translate-y-1/2 left-[22%] w-10 h-10 rounded-full border-2 border-ttg-player/20 bg-ttg-player/5"
                  style={{ transform: "translate(-50%, -50%)" }}>
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[7px] font-black text-ttg-player/30 tracking-[0.2em] uppercase">Stake</span>
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 right-[22%] w-10 h-10 rounded-full border-2 border-ttg-opponent/20 bg-ttg-opponent/5"
                  style={{ transform: "translate(50%, -50%)" }}>
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[7px] font-black text-ttg-opponent/30 tracking-[0.2em] uppercase">Stake</span>
                </div>
              </div>

              {/* Auto-moving crosshair */}
              <div className="absolute w-10 h-10 -ml-5 -mt-5 transition-none pointer-events-none"
                style={{ left: `${((reticleX + 1) / 2) * 100}%`, top: `${(((-reticleZ) + 1) / 2) * 100}%` }}>
                <Crosshair
                  className={`w-full h-full text-ttg-yellow ${aimLocked ? "scale-125" : ""}`}
                  style={{
                    filter: aimLocked
                      ? "drop-shadow(0 0 18px rgba(255,204,0,1)) drop-shadow(0 0 4px rgba(255,204,0,0.5))"
                      : "drop-shadow(0 0 10px rgba(255,204,0,0.8))",
                    transition: aimLocked ? "filter 0.2s, transform 0.2s" : "none",
                  }}
                  strokeWidth={1.5}
                />
              </div>

              {/* Orbit trail hint — faint ellipse where reticle moves */}
              <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                <ellipse
                  cx="50" cy="50"
                  rx={0.65 * 50 * 1.18} ry={0.28 * 50 * 1.18}
                  fill="none"
                  stroke="var(--ttg-yellow)"
                  strokeWidth="0.2"
                  strokeDasharray="2 3"
                  opacity="0.15"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom bar — editorial control strip */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 pointer-events-none">
          <button onClick={onBack}
            className="px-4 py-1.5 text-[9px] font-black text-white/25 hover:text-white/50 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full border border-white/5 uppercase tracking-wider pointer-events-auto transition-all">
            ← Back
          </button>

          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-white/50 tracking-wider">{tazoName}</span>
              <span className="text-[7px] font-black px-2 py-0.5 rounded-full border" style={{ color: ctrlColor, borderColor: ctrlColor + "40", background: ctrlColor + "08" }}>
                {ctrlLabel}
              </span>
              <span className="text-[7px] font-black px-2 py-0.5 rounded-full border" style={{ color: precColor, borderColor: precColor + "40", background: precColor + "08" }}>
                {precLabel}
              </span>
            </div>
            <span className="text-[6px] font-black text-ttg-yellow/25 tracking-[0.2em] uppercase">
              {aimLocked ? "AIM LOCKED — release when ready" : "Watching reticle… click to LOCK"}
            </span>
          </div>

          <button
            onClick={() => {
              playSfx("aim_lock", 0.4)
              if (aimLocked) onRelease()
              else setAimLocked(true)
            }}
            className={`px-5 py-2 font-black text-[10px] uppercase rounded-full tracking-wider pointer-events-auto transition-all active:scale-95 ${
              aimLocked
                ? "bg-ttg-success hover:bg-ttg-success/90 text-[#0a0a0a] shadow-[0_0_24px_rgba(34,197,94,0.5)]"
                : "bg-ttg-yellow hover:bg-[#FFD633] text-[#0a0a0a] shadow-[0_0_20px_rgba(255,204,0,0.3)] hover:shadow-[0_0_32px_rgba(255,204,0,0.5)]"
            }`}>
            {aimLocked ? <><Lock className="w-3 h-3 inline mr-1" />CHARGE</> : <><Crosshair className="w-3 h-3 inline mr-1" />LOCK AIM</>}
          </button>
        </div>
      </div>
    )
  }

  // ═════════════════════════════════════
  // CHARGE — meter + release button
  // ═════════════════════════════════════
  if (phase === "charge") return (
    <div className="animate-[fadeInLeft_0.25s_ease-out] absolute bottom-0 left-0 right-0 z-20 p-4 pointer-events-none">
      <div className="max-w-md mx-auto space-y-3">
        {/* Editorial header */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[8px] font-black text-white/15 uppercase tracking-[0.3em]">Force</span>
          <span className="text-[13px] font-black tracking-wider" style={{ color: barColor, textShadow: `0 0 16px ${barColor}40` }}>
            {timingQuality === "PERFECT" ? <span className="inline-flex items-center gap-1.5 animate-pulse text-ttg-success"><Zap className="w-3.5 h-3.5" />PERFECT</span> : timingQuality === "GOOD" ? <span className="inline-flex items-center gap-1.5 text-ttg-yellow"><Zap className="w-3 h-3" />GOOD</span> : timingQuality === "OVERCHARGE" ? <span className="inline-flex items-center gap-1.5 text-ttg-opponent">⚠ OVER</span> : timingQuality === "WEAK" ? <span className="inline-flex items-center gap-1.5 text-gray-500">WEAK</span> : Math.round(charge * 100) + "%"}
          </span>
        </div>
        {/* Magazine-rule progress bar */}
        <div className="relative w-full h-9 rounded-full overflow-hidden"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.5), rgba(0,0,0,0.3))",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.4)",
          }}>
          <div className="h-full transition-all duration-75 rounded-full" style={{
            width: `${charge * 100}%`,
            background: `linear-gradient(90deg, ${barColor}22, ${barColor})`,
            boxShadow: isPerfect || isOver ? `0 0 20px ${barColor}40, inset 0 -1px 0 ${barColor}20` : "inset 0 -1px 0 rgba(0,0,0,0.3)",
          }} />
          {/* Perfect zone marker */}
          <div className="absolute top-0 left-[60%] w-[22%] h-full bg-ttg-success/8 border-l border-r border-ttg-success/15" />
        </div>
        <div className="flex items-center gap-3">
          <span className="flex-1 text-center text-[7px] font-black text-white/12 tracking-[0.15em] uppercase">Auto-charging…</span>
          <button onClick={() => { stopSfx(chargeHumRef.current); chargeHumRef.current = null; playSfx("slam_launch", 0.4); onRelease() }}
            className={`px-5 py-2 font-black text-[10px] uppercase rounded-full tracking-wider active:scale-95 pointer-events-auto transition-all ${
              isPerfect
                ? "bg-ttg-success hover:bg-ttg-success/90 text-[#0a0a0a] shadow-[0_0_32px_rgba(34,197,94,0.6)] animate-pulse"
                : "bg-ttg-yellow hover:bg-[#FFD633] text-[#0a0a0a] shadow-[0_0_16px_rgba(255,204,0,0.3)]"
            }`}>
            {isPerfect ? <><Zap className="w-3 h-3 inline mr-1" />READY!</> : "RELEASE"}
          </button>
        </div>
      </div>
    </div>
  )

  // ═════════════════════════════════════
  // TILT — direction + spin + SLAM
  // ═════════════════════════════════════
  return (
    <div className="animate-[fadeInLeft_0.25s_ease-out] absolute bottom-0 left-0 right-0 z-20 p-3 pointer-events-none">
      <div className="max-w-md mx-auto flex items-end gap-4">
        {/* Tilt pad — magazine editorial widget */}
        <div className="flex-1 space-y-1.5">
          <span className="block text-center text-[7px] font-black text-white/10 uppercase tracking-[0.3em]">Tilt</span>
          <div
            className="relative w-full aspect-square max-w-[120px] mx-auto cursor-grab active:cursor-grabbing pointer-events-auto"
            style={{
              background: "radial-gradient(circle at center, rgba(255,204,0,0.04), transparent)",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "inset 0 0 40px rgba(0,0,0,0.3)",
            }}
            onMouseMove={(e) => tiltDrag(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())}
            onTouchMove={(e) => { e.preventDefault(); tiltDrag(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget.getBoundingClientRect()) }}
          >
            <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-white/4" strokeWidth={1} />
            {/* Crosshair guides */}
            <div className="absolute inset-4 border border-white/3 rounded-full" />
            <div className="absolute top-1/2 left-2 right-2 h-px bg-white/3" />
            <div className="absolute top-2 bottom-2 left-1/2 w-px bg-white/3" />
            {/* Tilt indicator needle */}
            <div className="absolute top-1/2 left-1/2 w-1.5 h-8 -mt-4 rounded-full origin-bottom shadow-[0_0_12px_rgba(255,204,0,0.4)]"
              style={{ background: "linear-gradient(to top, #FFCC00, #FFE066)", transform: `translateX(-50%) rotate(${tiltDeg}deg)` }} />
          </div>
        </div>
        
        {/* Spin + SLAM column */}
        <div className="flex-1 space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[7px] font-black text-white/10 uppercase tracking-[0.3em]">Spin</span>
              <span className="text-[10px] font-black text-ttg-yellow tracking-wider">{Math.round(spinIntensity * 100)}%</span>
            </div>
            <input type="range" min="0" max="100" value={spinIntensity * 100}
              onChange={(e) => onSpin(Number(e.target.value) / 100)}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#FFCC00] pointer-events-auto
                [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-ttg-yellow [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0a0a0a]
                [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(255,204,0,0.5)]"
              style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
          <button onClick={() => { playSfx("slam_launch", 0.4); onRelease() }}
            className="w-full py-3 font-black text-sm uppercase tracking-wider shadow-[0_0_24px_rgba(255,204,0,0.4)] active:scale-95 pointer-events-auto transition-all"
            style={{ background: "linear-gradient(135deg, #FFCC00, #FFD633)", color: "var(--ttg-arena-bg)" }}>
            <Zap className="w-4 h-4 inline mr-1.5" /> SLAM!
          </button>
        </div>
      </div>
    </div>
  )
}
