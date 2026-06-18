// ============================================================
// TTG Wiki — Launcher Content
// Renders Wiki inside the launcher SPA at /?page=wiki
// ============================================================
"use client"

import { WIKI_SERIES_CONFIG } from "@/lib/wiki-types"
import type { TTGWikiSeries } from "@/lib/wiki-types"
import { SITE_CONFIG } from "@/lib/site-config"
import Link from "next/link"

const SERIES_ORDER: TTGWikiSeries[] = ["minimon", "cybermon", "draco_bell"]
const TOTAL_ENTITIES = 351

export default function WikiLauncherContent() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* ── Hero ── */}
      <section className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-ttg-black uppercase tracking-[0.05em]">
          TTG Wiki
        </h1>
        <p className="text-sm sm:text-base font-bold text-ttg-black/50 max-w-xl mx-auto">
          Catálogo oficial del lore de Trading Tazos Game. {TOTAL_ENTITIES} tazos documentados con tipos, inspiraciones, evoluciones y relaciones entre series.
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ttg-yellow/10 border border-ttg-yellow/30 mt-1">
          <span className="text-[10px] font-black text-ttg-black/60 uppercase tracking-wider">
            {TOTAL_ENTITIES} TAZOS
          </span>
        </div>
      </section>

      {/* ── Series Cards ── */}
      <section className="grid md:grid-cols-3 gap-4 sm:gap-6">
        {SERIES_ORDER.map((key) => {
          const cfg = WIKI_SERIES_CONFIG[key]
          return (
            <Link
              key={key}
              href={`/wiki/${cfg.slug}`}
              className="group block mag-card border-3 border-ttg-black bg-white overflow-hidden hover:border-ttg-yellow transition-colors"
              style={{ boxShadow: `5px 5px 0px ${cfg.color}30` }}
            >
              {/* ── Color header ── */}
              <div
                className="px-4 sm:px-5 py-4 sm:py-5 border-b-2 border-ttg-black/10 relative overflow-hidden"
                style={{ backgroundColor: cfg.bgColor }}
              >
                {/* Halftone dots */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(circle, ${cfg.color} 1.5px, transparent 1.5px)`,
                    backgroundSize: "8px 8px",
                    opacity: 0.15,
                  }}
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg sm:text-xl font-black text-ttg-black uppercase tracking-tight">
                      {cfg.label}
                    </h2>
                    <span
                      className="text-[10px] font-black text-white px-2.5 py-1 border-2 border-ttg-black"
                      style={{
                        backgroundColor: cfg.color,
                        boxShadow: "3px 3px 0 var(--ttg-black)",
                      }}
                    >
                      {cfg.total}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-ttg-black/60 leading-relaxed">
                    {cfg.description}
                  </p>
                </div>
              </div>

              {/* ── Action ── */}
              <div className="px-4 sm:px-5 py-3 flex items-center justify-between">
                <span className="text-[10px] font-black text-ttg-black/40 uppercase tracking-wider">
                  Explorar catálogo
                </span>
                <span
                  className="text-[10px] font-black uppercase group-hover:translate-x-1 transition-transform"
                  style={{ color: cfg.color }}
                >
                  Ver {cfg.label} →
                </span>
              </div>
            </Link>
          )
        })}
      </section>

      {/* ── About Section ── */}
      <section className="mag-card border-3 border-ttg-black bg-white p-6 sm:p-8 space-y-4 relative overflow-hidden"
        style={{ boxShadow: "6px 6px 0px var(--ttg-black)0d" }}
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, var(--ttg-black) 0px, var(--ttg-black) 2px, transparent 2px, transparent 12px)" }} />
        <div className="relative z-10 space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-ttg-black uppercase tracking-tight">
            Sobre el Wiki
          </h2>
          <div className="prose max-w-none text-sm font-bold text-ttg-black/60 space-y-2">
            <p>
              El <strong className="text-ttg-black">TTG Wiki</strong> es el catálogo oficial de lore de Trading Tazos Game —
              un compendio de todas las criaturas, personajes, técnicas y elementos
              que componen el universo TTG.
            </p>
            <p>
              Cada entrada incluye tipos, rareza, evolución, inspiración original,
              estilo visual y relaciones con otras entidades. El lore es completamente
              original, sin referencias a franquicias externas.
            </p>
            <p>
              El catálogo crecerá junto con el arte de los tazos — las imágenes se
              añadirán a medida que el arte esté disponible.
            </p>
          </div>
        </div>
      </section>

      {/* ── Data stats ── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Entidades", value: "351", color: "var(--ttg-black)" },
          { label: "Series", value: "3", color: "var(--ttg-red)" },
          { label: "Tipos", value: "18", color: "var(--ttg-blue)" },
          { label: "Categorías", value: "9", color: "var(--ttg-success)" },
        ].map(stat => (
          <div key={stat.label}
            className="mag-card border-3 border-ttg-black bg-white p-4 text-center"
            style={{ boxShadow: `3px 3px 0px ${stat.color}25` }}
          >
            <p className="text-2xl sm:text-3xl font-black text-ttg-black">{stat.value}</p>
            <p className="text-[9px] sm:text-[10px] font-black text-ttg-black/40 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
