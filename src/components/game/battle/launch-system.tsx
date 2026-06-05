// ============================================================
// Trading Tazos Game — Launch System (Magazine Panels)
// Aim crosshair + Power timing in magazine-style cards.
// ============================================================
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Target, Zap } from "lucide-react"

interface Props {
  phase: "aim" | "power"
  onAimLock: (x: number, y: number, accuracy: number) => void
  onPowerLock: (power: number, accuracy: number) => void
  throwingTazoName: string
  throwingTazoFranchise: string
}

const F_COLORS: Record<string, string> = {
  minimon: "#FFCB05", cybermon: "#00A1E9", dracobell: "#FF6B00",
}

export default function LaunchSystem({ phase, onAimLock, onPowerLock, throwingTazoName, throwingTazoFranchise }: Props) {
  const [ax, setAx] = useState(0.5); const [ay, setAy] = useState(0.5)
  const [al, setAl] = useState(false)
  const [pw, setPw] = useState(0.5); const [pl, setPl] = useState(false)
  const ar = useRef(0); const ad = useRef({ x: 1, y: 1 })
  const pr = useRef(0); const pd = useRef(1)
  const fc = F_COLORS[throwingTazoFranchise] || "#FFCC00"

  useEffect(() => {
    if (phase !== "aim" || al) return; let ok = true
    const tick = () => { if (!ok) return;
      setAx(p => { let n = p + ad.current.x * 0.0045; if (n >= 0.8) ad.current.x = -1; if (n <= 0.2) ad.current.x = 1; return n })
      setAy(p => { let n = p + ad.current.y * 0.0065; if (n >= 0.8) ad.current.y = -1; if (n <= 0.2) ad.current.y = 1; return n })
      ar.current = requestAnimationFrame(tick) }
    ar.current = requestAnimationFrame(tick)
    return () => { ok = false; cancelAnimationFrame(ar.current) }
  }, [phase, al])

  useEffect(() => {
    if (phase !== "power" || pl) return; let ok = true
    const tick = () => { if (!ok) return;
      setPw(p => { let n = p + pd.current * 0.009; if (n >= 0.88) { pd.current = -1; return 0.88 } if (n <= 0.12) { pd.current = 1; return 0.12 } return n })
      pr.current = requestAnimationFrame(tick) }
    pr.current = requestAnimationFrame(tick)
    return () => { ok = false; cancelAnimationFrame(pr.current) }
  }, [phase, pl])

  const lockAim = useCallback(() => {
    if (phase !== "aim" || al) return; cancelAnimationFrame(ar.current); setAl(true)
    onAimLock(ax * 2 - 1, ay * 2 - 1, Math.max(0.1, 1 - (Math.abs(ax - 0.5) + Math.abs(ay - 0.5)) * 0.75))
  }, [phase, al, ax, ay, onAimLock])

  const lockPower = useCallback(() => {
    if (phase !== "power" || pl) return; cancelAnimationFrame(pr.current); setPl(true)
    onPowerLock(pw, 1 - pw * 0.35)
  }, [phase, pl, pw, onPowerLock])

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault()
        if (phase === "aim") lockAim()
        else lockPower()
      }
    }
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k)
  }, [phase, lockAim, lockPower])

  // Reset locked state when phase changes away from aim/power (deferred to avoid cascade renders)
  useEffect(() => {
    if (phase !== "aim" && phase !== "power") {
      const id = requestAnimationFrame(() => { setAl(false); setPl(false) })
      return () => cancelAnimationFrame(id)
    }
  }, [phase])

  const tazoTag = (
    <span className="text-[9px] font-black px-2 py-0.5 border-2 border-[#1a1a1a] bg-white"
      style={{ color: fc }}>
      {throwingTazoName}
    </span>
  )

  // ─── AIM ───
  if (phase === "aim") return (
    <div className="mag-card rounded-none overflow-hidden">
      <div className="bg-[#1a1a1a] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#FFCC00]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#FFCC00]">Aim Throw</span>
        </div>
        {tazoTag}
      </div>
      <div className="p-3 sm:p-4 mag-dots space-y-3">
        <div className="relative h-36 sm:h-44 bg-[#1a1a1a] border-3 border-[#1a1a1a] overflow-hidden">
          <div className="absolute inset-0 opacity-[0.08]"
            style={{ backgroundImage: "linear-gradient(#fff2 1px,transparent 1px),linear-gradient(90deg,#fff2 1px,transparent 1px)", backgroundSize: "14px 14px" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-white/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full border border-white/05" />
          <div className="absolute transition-none pointer-events-none"
            style={{ left: `${ax * 100}%`, top: `${ay * 100}%`, transform: "translate(-50%,-50%)" }}>
            <Target className="w-8 h-8 text-[#FFCC00] drop-shadow-[0_0_10px_#FFCC00]" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#1a1a1a]/25 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-[#1a1a1a]/8 text-[8px] font-black rounded border border-[#1a1a1a]/15">SPACE</kbd>
            to lock aim
          </span>
        </div>
        <button onClick={lockAim}
          className="w-full py-3 font-black text-xs uppercase tracking-[0.15em] bg-[#FFCC00] text-[#1a1a1a] border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
          <Target className="w-4 h-4 inline mr-1.5" /> Lock Aim
        </button>
      </div>
    </div>
  )

  // ─── POWER ───
  if (phase === "power") {
    const pct = Math.round(pw * 100)
    const risk = pw > 0.68 ? "RISKY" : pw > 0.42 ? "GOOD" : "SAFE"
    const rc = pw > 0.68 ? "#E3350D" : pw > 0.42 ? "#F59E0B" : "#22C55E"
    return (
      <div className="mag-card rounded-none overflow-hidden">
        <div className="bg-[#1a1a1a] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#F59E0B]">Throw Power</span>
          </div>
          {tazoTag}
        </div>
        <div className="p-3 sm:p-4 mag-dots space-y-3">
          <div className="flex items-center justify-center py-1">
            <div className="relative w-40 h-40 sm:w-44 sm:h-44">
              <div className="absolute inset-0 rounded-full border-4 border-[#1a1a1a] bg-[#1a1a1a]" />
              <div className="absolute rounded-full border-3 border-[#1a1a1a] transition-none"
                style={{ width: `${pw*100}%`, height: `${pw*100}%`, top: `${(1-pw)*50}%`, left: `${(1-pw)*50}%`,
                  background: pw > 0.68 ? "radial-gradient(circle, #E3350D, #991B1B)" : pw > 0.42 ? "radial-gradient(circle, #F59E0B, #D97706)" : "radial-gradient(circle, #22C55E, #15803D)" }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl sm:text-5xl font-black text-white" style={{ textShadow: "3px 3px 0px #1a1a1a" }}>{pct}%</span>
                <span className="text-[10px] font-black mt-1 tracking-[0.15em]" style={{ color: rc }}>{risk}</span>
              </div>
            </div>
          </div>
          <div className="w-full h-3 bg-white border-2 border-[#1a1a1a] overflow-hidden">
            <div className="h-full transition-none" style={{ width: `${pw*100}%`, background: "linear-gradient(90deg, #22C55E, #F59E0B 50%, #E3350D)" }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#1a1a1a]/25 flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#1a1a1a]/8 text-[8px] font-black rounded border border-[#1a1a1a]/15">SPACE</kbd>
              to launch!
            </span>
            <span className="text-[10px] font-black" style={{ color: rc }}>{risk}</span>
          </div>
          <button onClick={lockPower}
            className="w-full py-3 font-black text-xs uppercase tracking-[0.15em] bg-[#E3350D] text-white border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
            <Zap className="w-4 h-4 inline mr-1.5" /> Launch Tazo!
          </button>
        </div>
      </div>
    )
  }

  return null
}
