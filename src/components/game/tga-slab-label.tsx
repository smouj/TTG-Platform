"use client"

import { getTGADisplay } from "@/lib/grading/tga"

interface TGASlabLabelProps {
  tazoName: string
  setName?: string
  setYear?: string
  franchiseName?: string
  tgaGrade?: number | null
  tgaTier?: number | null
  tgaSurface?: number | null
  tgaBorders?: number | null
  tgaCertNumber?: string | null
}

export function TGASlabLabel({
  tazoName,
  setName = "TRADING TAZOS",
  setYear = "2026",
  franchiseName,
  tgaGrade,
  tgaTier,
  tgaSurface,
  tgaBorders,
  tgaCertNumber,
}: TGASlabLabelProps) {
  if (tgaGrade == null || tgaTier == null) return null

  const display = getTGADisplay({
    tier: tgaTier as 1 | 2 | 3 | 4,
    grade: tgaGrade,
    surface: tgaSurface ?? tgaGrade,
    borders: tgaBorders ?? tgaGrade,
    certNumber: tgaCertNumber ?? "",
  })
  if (!display) return null

  return (
    <div
      className="border-2 border-ttg-black bg-white shadow-[3px_3px_0px_var(--ttg-black)] overflow-hidden"
      style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
    >
      {/* Header bar */}
      <div className="bg-ttg-black text-white px-3 py-1.5 flex items-center justify-between">
        <span className="text-[8px] font-black tracking-[0.2em] uppercase">
          TAZO GRADING ASSOCIATION
        </span>
        <span className="text-[7px] font-bold text-ttg-yellow">[TGA]</span>
      </div>

      {/* Set info */}
      <div className="px-3 pt-2 pb-1 border-b border-ttg-black/10">
        <p className="text-[7px] font-bold text-ttg-black/40 uppercase tracking-wider">
          {setYear} {setName}
          {franchiseName && ` / ${franchiseName.toUpperCase()}`}
        </p>
        <p className="text-[10px] font-black text-ttg-black uppercase leading-tight truncate">
          {tazoName}
        </p>
      </div>

      {/* Grade display */}
      <div className="px-3 py-2 flex items-center justify-between">
        {/* Tier badge */}
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-[7px] font-bold text-ttg-black/30 uppercase">
            TIER {display.tier}: {display.tierLabel.toUpperCase()}
          </span>
          <div className="flex gap-2 text-[7px] font-bold text-ttg-black/25 uppercase">
            <span>SURFACE: {display.surface.toFixed(1)}</span>
            <span>BORDERS: {display.borders.toFixed(1)}</span>
          </div>
        </div>

        {/* Grade number */}
        <div className="flex flex-col items-end">
          <span
            className="text-2xl font-black tabular-nums leading-none"
            style={{ color: display.rangeColor }}
          >
            {display.grade.toFixed(1)}
          </span>
          <span
            className="text-[8px] font-black uppercase tracking-wider"
            style={{ color: display.rangeColor }}
          >
            {display.rangeLabel}
          </span>
        </div>
      </div>

      {/* Cert number */}
      <div className="px-3 py-1.5 bg-[#fffef0] border-t border-ttg-black/10 flex items-center justify-between">
        <span className="text-[7px] font-bold text-ttg-black/25 uppercase">
          CERT #
        </span>
        <span className="text-[8px] font-black text-ttg-black/50 tabular-nums">
          {display.certNumber || "PENDING"}
        </span>
      </div>

      {/* Scale legend */}
      <div className="px-3 py-1.5 bg-white border-t border-ttg-black/5">
        <div className="flex gap-0.5 justify-center">
          {[
            { min: 0, max: 20, color: "var(--ttg-red)", label: "DMG" },
            { min: 20, max: 55, color: "#F97316", label: "PLY" },
            { min: 55, max: 85, color: "#84CC16", label: "EXC" },
            { min: 85, max: 95, color: "var(--ttg-success)", label: "MNT" },
            { min: 95, max: 100, color: "#0096FF", label: "GEM" },
            { min: 100, max: 100.1, color: "#B8860B", label: "PRF" },
          ].map((seg) => {
            const isActive = display.grade >= seg.min && display.grade <= seg.max
            return (
              <div
                key={seg.label}
                className={`flex-1 h-1.5 border ${isActive ? "border-ttg-black" : "border-ttg-black/10"}`}
                style={{
                  backgroundColor: isActive ? seg.color : "transparent",
                  opacity: isActive ? 1 : 0.3,
                }}
                title={`${seg.label}: ${seg.min}-${seg.max}`}
              />
            )
          })}
        </div>
        <div className="flex justify-between text-[6px] font-bold text-ttg-black/15 uppercase mt-0.5">
          <span>0.1</span>
          <span>100.0</span>
        </div>
      </div>
    </div>
  )
}
