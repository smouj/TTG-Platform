import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/site-config";
import { WIKI_SERIES_CONFIG } from "@/lib/wiki-types";
import type { TTGWikiSeries } from "@/lib/wiki-types";
import WikiLayout from "@/components/wiki/WikiLayout";
import WikiHero from "@/components/wiki/WikiHero";

export const metadata: Metadata = {
  title: "TTG Wiki — Catálogo Oficial de Criaturas, Héroes y Villanos | Trading Tazos Game",
  description:
    "Explora el catálogo oficial de Trading Tazos Game: 151 Minimon, 128 Cybermon y 72 Draco Bell. Criaturas, personajes, villanos, aliados, técnicas y más.",
  alternates: { canonical: `${SITE_CONFIG.canonicalUrl}/wiki` },
  openGraph: {
    title: "TTG Wiki — Catálogo Oficial | Trading Tazos Game",
    description:
      "351 tazos documentados con lore, tipos, rarezas y evoluciones. Minimon, Cybermon y Draco Bell.",
    url: `${SITE_CONFIG.canonicalUrl}/wiki`,
  },
};

export default function WikiHomePage() {
  const seriesList = Object.entries(WIKI_SERIES_CONFIG) as [TTGWikiSeries, typeof WIKI_SERIES_CONFIG[TTGWikiSeries]][];

  return (
    <WikiLayout>
      <WikiHero
        title="TTG Wiki"
        subtitle="Catálogo oficial de criaturas, héroes, villanos, tazos y lore de Trading Tazos Game."
        total={351}
      />

      {/* Series cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {seriesList.map(([key, cfg]) => (
          <a
            key={key}
            href={`/wiki/${cfg.slug}`}
            className="group block border-2 border-ttg-black bg-white overflow-hidden transition-all hover:-translate-y-1"
            style={{ boxShadow: "4px 4px 0 var(--ttg-black)" }}
          >
            <div className="h-2 w-full" style={{ backgroundColor: cfg.color }} />
            <div className="p-5">
              <h2
                className="text-lg font-black uppercase tracking-[0.05em] mb-1"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </h2>
              <p className="text-xs text-ttg-black/60 leading-relaxed mb-3">
                {cfg.description}
              </p>
              <span
                className="inline-block text-[10px] font-black text-white px-3 py-1 border-2 border-ttg-black"
                style={{
                  backgroundColor: cfg.color,
                  boxShadow: "2px 2px 0 var(--ttg-black)",
                }}
              >
                {cfg.total} TAZOS →
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* About section */}
      <section className="border-2 border-ttg-black/20 p-6 mb-10">
        <h2 className="text-lg font-black text-ttg-black uppercase tracking-[0.05em] mb-2">
          Sobre el Wiki
        </h2>
        <p className="text-sm text-ttg-black/60 leading-relaxed">
          El TTG Wiki documenta cada tazo, personaje, criatura, villano, aliado, técnica,
          transformación y objeto de las tres series oficiales de Trading Tazos Game.
          Todo el contenido es original de TTG y sigue el canon establecido.
          Este wiki está en constante expansión.
        </p>
      </section>
    </WikiLayout>
  );
}
