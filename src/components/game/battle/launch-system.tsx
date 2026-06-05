// ============================================================
// Trading Tazos Game — Launch System (Magazine Edition)
// Aim (crosshair), Power (timing), Spin selector.
// Comic action-panel aesthetic.
// ============================================================
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { SpinType } from "@/lib/battle/game-loop"
import { Crosshair, Zap, Disc3, Target } from "lucide-react"

interface Props {
  phase: "aim" | "power"
  onAimLock: (x: number, y: number, accuracy: number) => void
  onPowerLock: (power: number, accuracy: number) => void
  onSpinLock?: (spin: SpinType) => void
  throwingTazoName: string
  throwingTazoFranchise: string
}

const FRANCHISE_COLORS: Record<string, string> = {
  minimon: "#FFCB05", cybermon: "#00A1E9", dracobell: "#FF6B00",
}

export default function LaunchSystem({
  phase, onAimLock, onPowerLock, throwingTazoName, throwingTazoFranchise,
}: Props) {
  const [aimX, setAimX] = useState(0.5)
  const [aimY, setAimY] = useState(0.5)
  const [aimLocked, setAimLocked] = useState(false)
  const [power, setPower] = useState(0.5)
  const [powerLocked, setPowerLocked] = useState(false)
  const aimRaf = useRef(0)
  const aimDir = useRef({ x: 1, y: 1 })
  const powerRaf = useRef(0)
  const powerDir = useRef(1)

  const fcolor = FRANCHISE_COLORS[throwingTazoFranchise] || "#FFCC00"

  // Aim bounce animation
  useEffect(() => {
    if (phase !== "aim" || aimLocked) return
    let ok = true
    const tick = () => {
      if (!ok) return
      setAimX(p => {
        let n = p + aimDir.current.x * 0.005
        if (n >= 0.82) aimDir.current.x = -1
        if (n <= 0.18) aimDir.current.x = 1
        return n
      })
      setAimY(p => {
        let n = p + aimDir.current.y * 0.007
        if (n >= 0.82) aimDir.current.y = -1
        if (n <= 0.18) aimDir.current.y = 1
        return n
      })
      aimRaf.current = requestAnimationFrame(tick)
    }
    aimRaf.current = requestAnimationFrame(tick)
    return () => { ok = false; cancelAnimationFrame(aimRaf.current) }
  }, [phase, aimLocked])

  // Power pulse
  useEffect(() => {
    if (phase !== "power" || powerLocked) return
    let ok = true
    const tick = () => {
      if (!ok) return
      setPower(p => {
        let n = p + powerDir.current * 0.01
        if (n >= 0.9) { powerDir.current = -1; return 0.9 }
        if (n <= 0.1) { powerDir.current = 1; return 0.1 }
        return n
      })
      powerRaf.current = requestAnimationFrame(tick)
    }
    powerRaf.current = requestAnimationFrame(tick)
    return () => { ok = false; cancelAnimationFrame(powerRaf.current) }
  }, [phase, powerLocked])

  const lockAim = useCallback(() => {
    if (phase !== "aim" || aimLocked) return
    cancelAnimationFrame(aimRaf.current)
    setAimLocked(true)
    const acc = Math.max(0.1, 1 - (Math.abs(aimX - 0.5) + Math.abs(aimY - 0.5)) * 0.8)
    onAimLock(aimX * 2 - 1, aimY * 2 - 1, acc)
  }, [phase, aimLocked, aimX, aimY, onAimLock])

  const lockPower = useCallback(() => {
    if (phase !== "power" || powerLocked) return
    cancelAnimationFrame(powerRaf.current)
    setPowerLocked(true)
    const acc = 1 - power * 0.4
    onPowerLock(power, acc)
  }, [phase, powerLocked, power, onPowerLock])

  // Keyboard
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault()
        if (phase === "aim") lockAim()
        else if (phase === "power") lockPower()
      }
    }
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  }, [phase, lockAim, lockPower])

  useEffect(() => { setAimLocked(false); setPowerLocked(false) }, [phase])

  // ─── AIM ───
  if (phase === "aim") {
    const tazoTag = (
      <span className="text-[9px] font-black px-2 py-0.5 border-2 border-[#1a1a1a] rounded"
        style={{ color: fcolor, backgroundColor: `${fcolor}10` }}>
        {throwingTazoName}
      </span>
    )

    return (
      <div className="mag-card rounded-none p-3 sm:p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#E3350D]" />
            <span className="font-black text-xs uppercase tracking-[0.1em] text-[#1a1a1a]">Aim</span>
          </div>
          {tazoTag}
        </div>

        {/* Crosshair arena */}
        <div className="relative h-36 sm:h-44 bg-[#0a0a0a] border-3 border-[#1a1a1a] overflow-hidden"
          style={{ boxShadow: "inset 0 0 40px rgba(0,0,0,0.4)" }}>
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.12]"
            style={{ backgroundImage: "linear-gradient(#ffffff20 1px, transparent 1px), linear-gradient(90deg, #ffffff20 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
          {/* Center ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/15" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-white/08" />

          {/* Crosshair */}
          <div className="absolute transition-none pointer-events-none"
            style={{ left: `${aimX * 100}%`, top: `${aimY * 100}%`, transform: "translate(-50%, -50%)" }}>
            <Crosshair className="w-8 h-8 text-[#FFCC00] drop-shadow-[0_0_8px_#FFCC00]" />
          </div>
        </div>

        <div className="text-center text-[10px] font-bold text-[#1a1a1a]/30 flex items-center justify-center gap-1">
          <span className="w-5 h-5 rounded bg-[#1a1a1a]/10 flex items-center justify-center text-[9px] font-black text-[#1a1a1a]/40">SPACE</span>
          to lock aim
        </div>

        <button
          onClick={lockAim}
          className="w-full py-3 font-black text-xs uppercase tracking-[0.15em] text-[#1a1a1a] bg-[#FFCC00] border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
        >
          <Target className="w-4 h-4 inline mr-1.5" /> Lock Aim
        </button>
      </div>
    )
  }

  // ─── POWER ───
  if (phase === "power") {
    const pct = Math.round(power * 100)
    const risk = power > 0.7 ? "RISKY" : power > 0.45 ? "GOOD" : "SAFE"
    const riskColor = power > 0.7 ? "#E3350D" : power > 0.45 ? "#F59E0B" : "#22C55E"

    return (
      <div className="mag-card rounded-none p-3 sm:p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#F59E0B]" />
          <span className="font-black text-xs uppercase tracking-[0.1em] text-[#1a1a1a]">Throw Power</span>
        </div>

        {/* Power circle */}
        <div className="flex items-center justify-center py-1">
          <div className="relative w-40 h-40 sm:w-44 sm:h-44">
            {/* Background */}
            <div className="absolute inset-0 rounded-full border-4 border-[#1a1a1a] bg-[#0a0a0a]" />
            {/* Pulsing circle */}
            <div className="absolute rounded-full border-3 border-[#1a1a1a] transition-none"
              style={{
                width: `${power * 100}%`, height: `${power * 100}%`,
                top: `${(1 - power) * 50}%`, left: `${(1 - power) * 50}%`,
                background: power > 0.7
                  ? "radial-gradient(circle, #E3350D, #991B1B)"
                  : power > 0.45
                  ? "radial-gradient(circle, #F59E0B, #D97706)"
                  : "radial-gradient(circle, #22C55E, #15803D)",
              }} />
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl sm:text-5xl font-black text-white"
                style={{ textShadow: "3px 3px 0px #1a1a1a" }}>{pct}%</span>
              <span className="text-[10px] font-black mt-1 tracking-[0.15em]" style={{ color: riskColor }}>
                {risk}
              </span>
            </div>
          </div>
        </div>

        {/* Power bar */}
        <div className="w-full h-3 bg-zinc-200 border-2 border-[#1a1a1a] overflow-hidden">
          <div className="h-full transition-none" style={{
            width: `${power * 100}%`,
            background: "linear-gradient(90deg, #22C55E, #F59E0B 50%, #E3350D)",
          }} />
        </div>

        <div className="text-center text-[10px] font-bold text-[#1a1a1a]/30 flex items-center justify-center gap-1">
          <span className="w-5 h-5 rounded bg-[#1a1a1a]/10 flex items-center justify-center text-[9px] font-black text-[#1a1a1a]/40">SPACE</span>
          to launch!
        </div>

        <button
          onClick={lockPower}
          className="w-full py-3 font-black text-xs uppercase tracking-[0.15em] text-white bg-[#E3350D] border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
        >
          <Zap className="w-4 h-4 inline mr-1.5" /> Launch!
        </button>
      </div>
    )
  }

  return null
}
