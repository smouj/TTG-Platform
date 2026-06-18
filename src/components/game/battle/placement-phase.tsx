// ============================================================
// Trading Tazos Game — Placement Phase v1
//
// Manual stake placement: player drags/drops their tazo
// onto the arena at the exact position they want.
// Magazine editorial styling, sharp corners.
// ============================================================
"use client"

import { useCallback, useRef, useState, useEffect } from "react"
import { Crosshair, Hand, Check, ArrowDown } from "lucide-react"
import { playSfx } from "@/lib/battle/sfx"
import TazoDiscImage from "@/components/game/tazo-disc-image"

interface PlacementPhaseProps {
  tazoName: string
  tazoFranchise: string
  tazoImageUrl: string | null
  stakeX: number
  stakeZ: number
  onPlace: (x: number, z: number) => void
  onBack: () => void
}

export default function PlacementPhase({
  tazoName, tazoFranchise, tazoImageUrl,
  stakeX, stakeZ, onPlace, onBack,
}: PlacementPhaseProps) {
  const padRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [localX, setLocalX] = useState(stakeX)
  const [localZ, setLocalZ] = useState(stakeZ)
  const [placed, setPlaced] = useState(false)

  const fColor = tazoFranchise === "minimon" ? "var(--ttg-yellow)"
    : tazoFranchise === "cybermon" ? "#00B4D8"
    : "var(--ttg-dracobell)"

  // Convert normalized coords (-1..1) to pad percentage
  const toPad = useCallback((pad: DOMRect, x: number, z: number) => {
    const px = ((x + 1) / 2) * pad.width
    const pz = ((-z + 1) / 2) * pad.height
    return { px, pz }
  }, [])

  const fromPad = useCallback((pad: DOMRect, px: number, pz: number) => {
    const x = (px / pad.width) * 2 - 1
    const z = -((pz / pad.height) * 2 - 1)
    return { x: Math.max(-1, Math.min(1, x)), z: Math.max(-1, Math.min(1, z)) }
  }, [])

  // Auto-position: start at player's stake marker (-0.55)
  useEffect(() => {
    setLocalX(-0.55)
    setLocalZ(0)
  }, [])

  const handlePadInteraction = useCallback((clientX: number, clientY: number) => {
    if (placed) return
    const pad = padRef.current?.getBoundingClientRect()
    if (!pad) return
    const px = clientX - pad.left
    const pz = clientY - pad.top
    const { x, z } = fromPad(pad, px, pz)
    setLocalX(x)
    setLocalZ(z)
    if (!dragging) {
      setDragging(true)
      playSfx("aim_tick", 0.15)
    }
  }, [placed, dragging, fromPad])

  const handleRelease = useCallback(() => {
    if (placed) return
    setDragging(false)
  }, [placed])

  const handleConfirm = useCallback(() => {
    setPlaced(true)
    playSfx("tazo_secure", 0.3)
    onPlace(localX, localZ)
  }, [localX, localZ, onPlace])

  // Convert to pad % for visual
  const padX = ((localX + 1) / 2) * 100
  const padZ = ((-localZ + 1) / 2) * 100

  return (
    <div className="animate-[fadeInLeft_0.3s_ease-out]">
      {/* ── Placement pad overlay ── */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col">
        <div className="flex-1 flex items-center justify-center p-8 pb-40">
          <div
            ref={padRef}
            className="relative w-full max-w-[360px] aspect-square bg-black/40 backdrop-blur-sm overflow-hidden"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "inset 0 0 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,204,0,0.04)",
              cursor: placed ? "default" : "crosshair",
              pointerEvents: "auto",
            }}
            onMouseMove={(e) => handlePadInteraction(e.clientX, e.clientY)}
            onMouseUp={handleRelease}
            onMouseLeave={handleRelease}
            onTouchMove={(e) => {
              e.preventDefault()
              handlePadInteraction(e.touches[0].clientX, e.touches[0].clientY)
            }}
            onTouchEnd={handleRelease}
          >
            {/* Concentric rings */}
            <div className="absolute inset-4 flex items-center justify-center pointer-events-none">
              <div className="border border-white/6 rounded-full w-full h-full" />
              <div className="absolute border border-white/4 rounded-full w-[70%] h-[70%]" />
              <div className="absolute border border-white/3 rounded-full w-[40%] h-[40%]" />
            </div>

            {/* Arena center crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full border border-ttg-yellow/10" />
              <div className="absolute w-1 h-20 bg-white/3" />
              <div className="absolute w-20 h-1 bg-white/3" />
            </div>

            {/* Player stake zone hint */}
            <div className="absolute top-1/2 -translate-y-1/2 left-[20%] w-14 h-14 rounded-full border-2 border-dashed border-ttg-player/20 pointer-events-none"
              style={{ transform: "translate(-50%, -50%)" }}>
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[7px] font-black text-ttg-player/25 tracking-[0.2em] uppercase">
                Your zone
              </span>
            </div>

            {/* Opponent zone hint */}
            <div className="absolute top-1/2 -translate-y-1/2 right-[20%] w-14 h-14 rounded-full border-2 border-dashed border-ttg-opponent/20 pointer-events-none"
              style={{ transform: "translate(50%, -50%)" }}>
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[7px] font-black text-ttg-opponent/25 tracking-[0.2em] uppercase">
                AI zone
              </span>
            </div>

            {/* ── Tazo ghost at placement position ── */}
            <div
              className="absolute w-14 h-14 rounded-full pointer-events-none transition-all duration-75"
              style={{
                left: `${padX}%`,
                top: `${padZ}%`,
                transform: "translate(-50%, -50%)",
                boxShadow: placed
                  ? "0 0 28px rgba(34,197,94,0.7), 0 0 8px rgba(34,197,94,0.4)"
                  : dragging
                    ? "0 0 20px rgba(255,204,0,0.5), 0 0 6px rgba(255,204,0,0.3)"
                    : "0 0 14px rgba(255,255,255,0.15)",
                border: placed
                  ? "2px solid #22C55E"
                  : dragging
                    ? "2px solid #FFCC00"
                    : "2px solid rgba(255,255,255,0.1)",
                background: tazoImageUrl
                  ? `url(${tazoImageUrl}) center/cover`
                  : `linear-gradient(135deg, ${fColor}44, ${fColor}11)`,
              }}
            >
              {!tazoImageUrl && (
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white/20">
                  {tazoName?.[0] || "?"}
                </span>
              )}
            </div>

            {/* Drag trail hint */}
            {dragging && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[7px] font-black text-ttg-yellow/25 tracking-[0.25em] uppercase">
                  Release to set
                </span>
              </div>
            )}

            {/* Placed confirmation */}
            {placed && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-ttg-success/10 backdrop-blur-sm px-6 py-3 border border-ttg-success/30">
                  <Check className="w-6 h-6 text-ttg-success mx-auto mb-1" strokeWidth={3} />
                  <span className="text-[9px] font-black text-ttg-success tracking-[0.15em] uppercase">Placed</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 pointer-events-none">
        <button onClick={onBack}
          className="px-4 py-1.5 text-[9px] font-black text-white/25 hover:text-white/50 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full border border-white/5 uppercase tracking-wider pointer-events-auto transition-all">
          ← Back
        </button>

        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white/50 tracking-wider">{tazoName}</span>
            <span className="w-2 h-2 rounded-full" style={{ background: fColor, boxShadow: `0 0 6px ${fColor}` }} />
          </div>
          <span className="text-[7px] font-black text-ttg-yellow/30 tracking-[0.2em] uppercase">
            {dragging ? "Dragging..." : placed ? "✓ Position set" : "Drag to place your stake"}
          </span>
        </div>

        <button
          onClick={handleConfirm}
          disabled={placed}
          className={`px-5 py-2 font-black text-[10px] uppercase rounded-full tracking-wider pointer-events-auto transition-all active:scale-95 ${
            placed
              ? "bg-ttg-success/30 text-ttg-success/50 cursor-not-allowed"
              : "bg-ttg-yellow hover:bg-[#FFD633] text-[#0a0a0a] shadow-[0_0_20px_rgba(255,204,0,0.3)] hover:shadow-[0_0_32px_rgba(255,204,0,0.5)]"
          }`}>
          {placed ? (
            <><Check className="w-3 h-3 inline mr-1" />Set</>
          ) : (
            <><Hand className="w-3 h-3 inline mr-1" />Place Stake</>
          )}
        </button>
      </div>
    </div>
  )
}
