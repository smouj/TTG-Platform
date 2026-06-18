import type { TTGWikiEntity } from "@/lib/wiki-types";
import { WIKI_SERIES_CONFIG, ENTITY_TYPE_LABELS } from "@/lib/wiki-types";
import WikiBreadcrumbs from "./WikiBreadcrumbs";
import WikiArtPlaceholder from "./WikiArtPlaceholder";
import WikiSeoJsonLd from "./WikiSeoJsonLd";
import { Sparkles, AlertCircle, Disc3, Link as LinkIcon } from "lucide-react";

interface WikiDetailShellProps {
  entity: TTGWikiEntity;
}

const STATUS_LABELS: Record<string, string> = {
  created: "Arte creado",
  pending: "Arte pendiente",
  unconfirmed: "Arte no confirmado",
};

export default function WikiDetailShell({ entity }: WikiDetailShellProps) {
  const cfg = WIKI_SERIES_CONFIG[entity.series];

  return (
    <>
      <WikiSeoJsonLd entity={entity} />

      <WikiBreadcrumbs
        series={entity.series}
        entityName={entity.name}
        entitySlug={entity.slug}
      />

      <article
        className="border-2 border-ttg-black bg-white"
        style={{ boxShadow: "4px 4px 0 var(--ttg-black)" }}
      >
        {/* Header */}
        <div
          className="h-2 w-full"
          style={{ backgroundColor: cfg.color }}
        />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Image / Placeholder */}
            <div className="shrink-0 flex flex-col items-center">
              <WikiArtPlaceholder
                name={entity.name}
                series={entity.series}
                status={entity.image.status}
                size={180}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* ID + Series */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-xs font-black text-white px-3 py-1 border-2 border-ttg-black"
                  style={{
                    backgroundColor: cfg.color,
                    boxShadow: "2px 2px 0 var(--ttg-black)",
                  }}
                >
                  {cfg.label} #{entity.id}
                </span>
                <span
                  className="text-xs font-bold px-3 py-1 border-2"
                  style={{
                    borderColor: cfg.color,
                    color: cfg.color,
                    backgroundColor: `${cfg.color}08`,
                  }}
                >
                  {ENTITY_TYPE_LABELS[entity.entityType] || entity.entityType}
                </span>
                {entity.rarity && (
                  <span className="text-xs font-bold px-3 py-1 border-2 border-ttg-black/20 text-ttg-black/60">
                    {entity.rarity}
                  </span>
                )}
              </div>

              {/* Name */}
              <h1 className="text-2xl sm:text-3xl font-black text-ttg-black uppercase tracking-[0.03em] leading-tight">
                {entity.name}
              </h1>

              {/* Description */}
              <p className="text-sm text-ttg-black/70 leading-relaxed max-w-2xl">
                {entity.description}
              </p>

              {/* Types */}
              <div className="flex flex-wrap gap-1.5">
                {entity.types.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-bold text-ttg-black/60 border border-ttg-black/20 px-2 py-0.5"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {entity.stage && (
                  <div className="border border-ttg-black/15 p-2">
                    <span className="text-ttg-black/40 font-black uppercase text-[9px]">Etapa</span>
                    <p className="font-bold text-ttg-black mt-0.5">{entity.stage}</p>
                  </div>
                )}
                {entity.evolution && (
                  <div className="border border-ttg-black/15 p-2">
                    <span className="text-ttg-black/40 font-black uppercase text-[9px]">Evolución</span>
                    <p className="font-bold text-ttg-black mt-0.5">{entity.evolution}</p>
                  </div>
                )}
                {entity.faction && (
                  <div className="border border-ttg-black/15 p-2">
                    <span className="text-ttg-black/40 font-black uppercase text-[9px]">Facción</span>
                    <p className="font-bold text-ttg-black mt-0.5">{entity.faction}</p>
                  </div>
                )}
                {entity.owner && (
                  <div className="border border-ttg-black/15 p-2">
                    <span className="text-ttg-black/40 font-black uppercase text-[9px]">Vínculo</span>
                    <p className="font-bold text-ttg-black mt-0.5">{entity.owner}</p>
                  </div>
                )}
                {entity.category && (
                  <div className="border border-ttg-black/15 p-2">
                    <span className="text-ttg-black/40 font-black uppercase text-[9px]">Categoría</span>
                    <p className="font-bold text-ttg-black mt-0.5">{entity.category}</p>
                  </div>
                )}
                <div className="border border-ttg-black/15 p-2">
                  <span className="text-ttg-black/40 font-black uppercase text-[9px]">Arte</span>
                  <p className="font-bold text-ttg-black mt-0.5">{STATUS_LABELS[entity.image.status]}</p>
                </div>
              </div>

              {/* Inspiration */}
              {entity.inspirationBase && (
                <div className="border border-ttg-black/15 p-3 bg-ttg-cream/50">
                  <span className="text-[10px] font-black text-ttg-black/40 uppercase tracking-wider">
                    Inspiración base
                  </span>
                  <p className="text-xs text-ttg-black/70 mt-1 leading-relaxed">
                    {entity.inspirationBase}
                  </p>
                </div>
              )}

              {/* Visual style */}
              <div className="border border-ttg-black/15 p-3">
                <span className="text-[10px] font-black text-ttg-black/40 uppercase tracking-wider">
                  Estilo visual
                </span>
                <p className="text-xs text-ttg-black/70 mt-1 leading-relaxed">
                  {entity.visualStyle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
