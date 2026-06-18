"use client"

import Image from "next/image";
import { WIKI_SERIES_CONFIG } from "@/lib/wiki-types";
import type { TTGWikiSeries } from "@/lib/wiki-types";

interface WikiHeroProps {
  series?: TTGWikiSeries;
  title: string;
  subtitle?: string;
  total?: number;
}

const SERIES_LOGO_MAP: Record<TTGWikiSeries, string> = {
  minimon: "/logo/series-minimon.png",
  cybermon: "/logo/series-cybermon.png",
  draco_bell: "/logo/series-dracobell.png",
};

export default function WikiHero({ series, title, subtitle, total }: WikiHeroProps) {
  const cfg = series ? WIKI_SERIES_CONFIG[series] : null;
  const logoPath = series ? SERIES_LOGO_MAP[series] : null;

  return (
    <div
      className="relative overflow-hidden border-2 border-ttg-black mb-8"
      style={{
        backgroundColor: cfg?.bgColor || "var(--ttg-cream)",
        boxShadow: "6px 6px 0 var(--ttg-black)",
      }}
    >
      {/* ── Wallpaper: Halftone dots ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, ${cfg?.color || "var(--ttg-black)"} 1.5px, transparent 1.5px)`,
          backgroundSize: "10px 10px",
          opacity: 0.1,
        }}
      />

      {/* ── Wallpaper: Gradient sweep ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: cfg
            ? `linear-gradient(135deg, ${cfg.color}08 0%, transparent 40%, ${cfg.color}12 100%)`
            : "linear-gradient(135deg, #1a1a1a08 0%, transparent 40%, #FFCC0012 100%)",
        }}
      />

      {/* ── Corner accents ── */}
      <div className="absolute top-0 left-0 w-20 h-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[3px]" style={{ backgroundColor: cfg?.color || "var(--ttg-black)" }} />
        <div className="absolute top-0 left-0 w-[3px] h-full" style={{ backgroundColor: cfg?.color || "var(--ttg-black)" }} />
      </div>
      <div className="absolute bottom-0 right-0 w-20 h-20 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-full h-[3px]" style={{ backgroundColor: cfg?.color || "var(--ttg-black)" }} />
        <div className="absolute bottom-0 right-0 w-[3px] h-full" style={{ backgroundColor: cfg?.color || "var(--ttg-black)" }} />
      </div>

      <div className="relative px-6 py-8 sm:px-10 sm:py-12">
        {/* ── Series logo ── */}
        {logoPath && (
          <div className="mb-4">
            <Image
              src={logoPath}
              alt={`${cfg?.label || ""} series logo`}
              width={320}
              height={120}
              className="h-14 sm:h-20 w-auto object-contain"
              style={{ filter: "drop-shadow(3px 3px 0 rgba(26,26,26,0.2))" }}
            />
          </div>
        )}

        <h1 className="text-2xl sm:text-4xl font-black text-ttg-black uppercase tracking-[0.05em] leading-none">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm sm:text-base font-bold text-ttg-black/60 max-w-2xl">
            {subtitle}
          </p>
        )}
        {total !== undefined && (
          <div className="mt-4 flex items-center gap-2">
            <span
              className="text-xs font-black text-white px-3 py-1.5 border-2 border-ttg-black"
              style={{
                backgroundColor: cfg?.color || "var(--ttg-black)",
                boxShadow: "3px 3px 0 var(--ttg-black)",
              }}
            >
              {total} TAZOS
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
