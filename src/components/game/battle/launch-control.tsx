// ============================================================
// Trading Tazos Game — Launch Control
// Aim horizontal, aim vertical, charge power UI.
// ============================================================
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useI18n } from "@/lib/i18n"
import type { BattlePhase } from "@/lib/battle"
import { Crosshair, Zap, Target } from "lucide-react"

interface Props {
  phase: BattlePhase
  aimPhase: {
    horizontalAimValue: number
    horizontalAccuracy: number
    verticalAimValue: number
    verticalAccuracy: number
    powerValue: number
    powerAccuracyPenalty: number
  } | null
  onHorizontalAim: (value: number) => void
  onVerticalAim: (value: number) => void
  onPowerSet: (value: number) => void
  onThrow: () => void
}

export default function LaunchControl({
  phase, aimPhase, onHorizontalAim, onVerticalAim, onPowerSet, onThrow,
}: Props) {
  const { t } = useI18n()
  const [hSlider, setHSlider] = useState(0.5)
  const [vSlider, setVSlider] = useState(0.5)
  const [powerCircle, setPowerCircle] = useState(0.8)
  const [powerShrinking, setPowerShrinking] = useState(true)
  const animRef = useRef<number>(0)

  // Horizontal aim animation
  useEffect(() => {
    if (phase !== "aim_horizontal") return
    let dir = 1
    let val = 0.2
    const tick = () => {
      val += dir * 0.008
      if (val >= 0.8) dir = -1
      if (val <= 0.2) dir = 1
      setHSlider(val)
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [phase])

  // Vertical aim animation
  useEffect(() => {
    if (phase !== "aim_vertical") return
    let dir = 1
    let val = 0.2
    const tick = () => {
      val += dir * 0.01
      if (val >= 0.8) dir = -1
      if (val <= 0.2) dir = 1
      setVSlider(val)
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [phase])

  // Power circle animation
  useEffect(() => {
    if (phase !== "charge_power") return
    let size = 0.85
    let dir = -1
    const tick = () => {
      size += dir * 0.006
      if (size <= 0.15) dir = 1
      if (size >= 0.85) dir = -1
      setPowerCircle(size)
      setPowerShrinking(dir === -1)
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [phase])

  const handleHorizontalLock = useCallback(() => {
    if (phase !== "aim_horizontal") return
    cancelAnimationFrame(animRef.current)
    onHorizontalAim(hSlider)
  }, [phase, hSlider, onHorizontalAim])

  const handleVerticalLock = useCallback(() => {
    if (phase !== "aim_vertical") return
    cancelAnimationFrame(animRef.current)
    onVerticalAim(vSlider)
  }, [phase, vSlider, onVerticalAim])

  const handlePowerLock = useCallback(() => {
    if (phase !== "charge_power") return
    cancelAnimationFrame(animRef.current)
    const power = Math.round((1 - powerCircle) * 100) / 100
    onPowerSet(power)
  }, [phase, powerCircle, onPowerSet])

  // Auto-lock horizontal on space
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault()
        if (phase === "aim_horizontal") handleHorizontalLock()
        else if (phase === "aim_vertical") handleVerticalLock()
        else if (phase === "charge_power") handlePowerLock()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, handleHorizontalLock, handleVerticalLock, handlePowerLock])

  if (phase === "aim_horizontal") {
    return (
      <div className="p-4 bg-white border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#E3350D]" />
          <span className="font-black text-sm uppercase tracking-wider text-[#1a1a1a]">
            {t.aim_horizontal_title}
          </span>
        </div>
        <div className="relative h-10 bg-[#1a1a2e] border-2 border-[#1a1a1a] rounded overflow-hidden">
          <div
            className="absolute top-0 h-full w-2 bg-[#FFCC00] border-r-2 border-[#1a1a1a]"
            style={{ left: `${hSlider * 100}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-8 h-8 rounded-full border-2 border-white/50 flex items-center justify-center"
              style={{ position: "absolute", left: `50%`, background: "transparent" }}
            >
              <Crosshair className="w-4 h-4 text-white/50" />
            </div>
          </div>
        </div>
        <div className="flex justify-between text-[10px] font-bold text-[#1a1a1a]/60">
          <span>{t.aim_left}</span>
          <span>{t.aim_center}</span>
          <span>{t.aim_right}</span>
        </div>
        <div className="text-center text-xs font-bold text-[#1a1a1a]/50">
          {t.aim_accuracy}: {Math.round((1 - Math.abs(hSlider - 0.5) * 2) * 100)}%
        </div>
        <button
          onClick={handleHorizontalLock}
          className="w-full py-3 font-black text-sm uppercase tracking-wider bg-[#FFCC00] text-[#1a1a1a] border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
        >
          <Target className="w-4 h-4 inline mr-2" />
          {t.aim_horizontal_lock}
        </button>
      </div>
    )
  }

  if (phase === "aim_vertical") {
    const accuracy = Math.round((1 - Math.abs(vSlider - 0.5) * 2) * 100)
    return (
      <div className="p-4 bg-white border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#3B4CCA]" />
          <span className="font-black text-sm uppercase tracking-wider text-[#1a1a1a]">
            {t.aim_vertical_title}
          </span>
        </div>
        <div className="relative w-10 h-40 mx-auto bg-[#1a1a2e] border-2 border-[#1a1a1a] rounded overflow-hidden">
          <div
            className="absolute left-0 w-full h-2 bg-[#3B4CCA] border-b-2 border-[#1a1a1a]"
            style={{ top: `${vSlider * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-[#1a1a1a]/60 max-w-[200px] mx-auto">
          <span>{t.aim_top}</span>
          <span>{t.aim_center}</span>
          <span>{t.aim_bottom}</span>
        </div>
        <div className="text-center text-xs font-bold text-[#1a1a1a]/50">
          {t.aim_accuracy}: {accuracy}%
        </div>
        <button
          onClick={handleVerticalLock}
          className="w-full py-3 font-black text-sm uppercase tracking-wider bg-[#3B4CCA] text-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
        >
          <Target className="w-4 h-4 inline mr-2" />
          {t.aim_vertical_lock}
        </button>
      </div>
    )
  }

  if (phase === "charge_power") {
    const power = Math.round((1 - powerCircle) * 100)
    const risk = power > 70 ? t.aim_risk_high : power > 50 ? t.aim_risk_medium : t.aim_risk_low
    const riskColor = power > 70 ? "#E3350D" : power > 50 ? "#F59E0B" : "#22C55E"
    return (
      <div className="p-4 bg-white border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#F59E0B]" />
          <span className="font-black text-sm uppercase tracking-wider text-[#1a1a1a]">
            {t.aim_charge_title}
          </span>
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="relative w-48 h-48">
            <div className="absolute inset-0 rounded-full border-4 border-[#1a1a1a] bg-[#1a1a2e]" />
            <div
              className="absolute rounded-full transition-all duration-75"
              style={{
                width: `${powerCircle * 100}%`,
                height: `${powerCircle * 100}%`,
                top: `${(1 - powerCircle) * 50}%`,
                left: `${(1 - powerCircle) * 50}%`,
                background: power > 70
                  ? "radial-gradient(circle, #E3350D, #FF6B00)"
                  : power > 50
                  ? "radial-gradient(circle, #F59E0B, #FFCC00)"
                  : "radial-gradient(circle, #22C55E, #78C850)",
                border: "3px solid #1a1a1a",
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-white" style={{ textShadow: "2px 2px 0px #1a1a1a" }}>
                {power}%
              </span>
              <span className="text-xs font-bold mt-1" style={{ color: riskColor }}>
                {risk}
              </span>
            </div>
          </div>
        </div>
        <div className="text-center text-xs font-bold text-[#1a1a1a]/60">
          {powerShrinking ? t.aim_shrinking : t.aim_growing}
        </div>
        <button
          onClick={handlePowerLock}
          className="w-full py-3 font-black text-sm uppercase tracking-wider bg-[#E3350D] text-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
        >
          <Zap className="w-4 h-4 inline mr-2" />
          {t.aim_charge_throw}
        </button>
      </div>
    )
  }

  return null
}
