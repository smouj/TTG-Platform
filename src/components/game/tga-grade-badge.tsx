"use client"

import { getTGADisplay } from "@/lib/grading/tga"

interface TGAGradeBadgeProps {
  tgaGrade?: number | null
  tgaTier?: number | null
  tgaSurface?: number | null
  tgaBorders?: number | null
  size?: "sm" | "md"
  showSubGrades?: boolean
}

export function TGAGradeBadge({
  tgaGrade,
  tgaTier,
  tgaSurface,
  tgaBorders,
  size = "sm",
  showSubGrades = false,
}: TGAGradeBadgeProps) {
  if (tgaGrade == null || tgaTier == null) return null

  const display = getTGADisplay({
    tier: tgaTier as 1 | 2 | 3 | 4,
    grade: tgaGrade,
    surface: tgaSurface ?? tgaGrade,
    borders: tgaBorders ?? tgaGrade,
    certNumber: "",
  })
  if (!display) return null

  const isSm = size === "sm"

  return (
    <div
      className={`inline-flex flex-col items-center ${isSm ? "gap-0" : "gap-0.5"} leading-none`}
      style={{
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      }}
    >
      {/* Grade number + range label */}
      <div className={`flex items-center ${isSm ? "gap-0.5" : "gap-1"}`}>
        <span className={`font-black tabular-nums ${isSm ? "text-[10px]" : "text-xs"}`} style={{ color: display.rangeColor }}>
          {display.grade.toFixed(1)}
        </span>
        {!isSm && (
          <span
            className="text-[7px] font-black uppercase px-1 py-0.5 border tracking-wider"
            style={{ borderColor: display.rangeColor, color: display.rangeColor }}
          >
            {display.rangeLabel}
          </span>
        )}
      </div>

      {/* Sub-grades for larger display */}
      {showSubGrades && !isSm && (
        <div className="flex gap-1.5 text-[7px] font-bold text-ttg-black/30 uppercase">
          <span>SUR {display.surface.toFixed(1)}</span>
          <span>BDR {display.borders.toFixed(1)}</span>
        </div>
      )}

      {/* TGA label */}
      <span className={`${isSm ? "text-[6px]" : "text-[7px]"} font-black text-ttg-black/20 uppercase tracking-[0.15em]`}>
        TGA
      </span>
    </div>
  )
}

/**
 * Compact version: just "TGA 85.2" with color
 */
export function TGAGradeLabel({
  tgaGrade,
  tgaTier,
}: {
  tgaGrade?: number | null
  tgaTier?: number | null
}) {
  if (tgaGrade == null || tgaTier == null) return null

  const display = getTGADisplay({
    tier: tgaTier as 1 | 2 | 3 | 4,
    grade: tgaGrade,
    surface: tgaGrade,
    borders: tgaGrade,
    certNumber: "",
  })
  if (!display) return null

  return (
    <span
      className="font-black tabular-nums text-[9px]"
      style={{ color: display.rangeColor }}
    >
      TGA {display.grade.toFixed(1)}
    </span>
  )
}
