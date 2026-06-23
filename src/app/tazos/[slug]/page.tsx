import { Metadata } from "next";
import { notFound } from "next/navigation";
import { findWikiEntityBySlug, getAllWikiEntitySlugs } from "@/lib/wiki-data";
import { WIKI_SERIES_CONFIG } from "@/lib/wiki-types";
import WikiArtPlaceholder from "@/components/wiki/WikiArtPlaceholder";
import type { TTGWikiEntity } from "@/lib/wiki-types";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = getAllWikiEntitySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entity = findWikiEntityBySlug(slug);
  if (!entity) return { title: "Entity not found — Trading Tazos Game" };

  const config = WIKI_SERIES_CONFIG[entity.series];
  const title = `${entity.name} | ${config?.label || entity.series} | Trading Tazos Game`;
  const description = entity.description?.slice(0, 160) || `${entity.entityType} from ${config?.label || entity.series}.`;

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary", title, description },
    alternates: { canonical: `https://tradingtazosgame.com/wiki/${entity.series}/${entity.slug}` },
  };
}

function getSeriesColor(series: string): string {
  switch (series) {
    case "minimon": return "var(--ttg-yellow)";
    case "cybermon": return "var(--ttg-cybermon)";
    case "draco_bell": return "var(--ttg-dracobell)";
    default: return "var(--ttg-black)";
  }
}

export default async function TazoPage({ params }: Props) {
  const { slug } = await params;
  const entity = findWikiEntityBySlug(slug);
  if (!entity) return notFound();

  const config = WIKI_SERIES_CONFIG[entity.series];
  const seriesColor = getSeriesColor(entity.series);

  return (
    <main className="min-h-screen py-12 px-4 relative" style={{ background: "var(--ttg-cream)" }}>
      <div className="mag-halftone absolute inset-0 opacity-40 pointer-events-none" />
      <article className="max-w-2xl mx-auto relative">
        <nav className="mb-8">
          <a href="/?page=tazos" className="text-sm font-bold hover:underline" style={{ color: seriesColor }}>
            ← Back to Tazo Catalog
          </a>
        </nav>

        <div className="flex flex-col sm:flex-row gap-8 items-start">
          <div className="shrink-0">
            <WikiArtPlaceholder
              name={entity.name}
              series={entity.series}
              status={(entity.image?.status as "created" | "pending" | "unconfirmed") || "unconfirmed"}
              size={240}
            />
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <p className="text-sm font-black uppercase tracking-wider" style={{ color: seriesColor }}>
                {config?.label || entity.series} #{entity.id}
              </p>
              <h1 className="text-3xl font-black text-ttg-black mt-1">{entity.name}</h1>
            </div>

            <div className="flex gap-2 flex-wrap">
              <span className="px-3 py-1 text-xs font-bold uppercase border-2 border-ttg-black text-ttg-black bg-white"
                style={{ boxShadow: "2px 2px 0 var(--ttg-black)" }}>
                {entity.entityType}
              </span>
              {entity.rarity && (
                <span className="px-3 py-1 text-xs font-bold uppercase border-2 border-ttg-black text-ttg-black bg-ttg-yellow"
                  style={{ boxShadow: "2px 2px 0 var(--ttg-black)" }}>
                  {entity.rarity}
                </span>
              )}
              {entity.stage && (
                <span className="px-3 py-1 text-xs font-bold uppercase border-2 border-ttg-black text-ttg-black bg-ttg-cream-light"
                  style={{ boxShadow: "2px 2px 0 var(--ttg-black)" }}>
                  {entity.stage}
                </span>
              )}
            </div>

            {entity.types.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {entity.types.map((t: string) => (
                  <span key={t} className="px-2 py-0.5 text-[10px] font-black uppercase bg-ttg-black text-white">{t}</span>
                ))}
              </div>
            )}

            {entity.description && (
              <div className="border-2 border-ttg-black p-4 bg-white" style={{ boxShadow: "3px 3px 0 var(--ttg-black)" }}>
                <p className="text-ttg-black text-sm leading-relaxed">{entity.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {entity.inspirationBase && (
                <div className="border-2 border-ttg-black p-3 bg-white" style={{ boxShadow: "2px 2px 0 var(--ttg-black)" }}>
                  <p className="text-[9px] font-black text-ttg-black/40 uppercase">Inspiration</p>
                  <p className="text-xs text-ttg-black font-bold mt-0.5">{entity.inspirationBase}</p>
                </div>
              )}
              {entity.visualStyle && (
                <div className="border-2 border-ttg-black p-3 bg-white" style={{ boxShadow: "2px 2px 0 var(--ttg-black)" }}>
                  <p className="text-[9px] font-black text-ttg-black/40 uppercase">Visual Style</p>
                  <p className="text-xs text-ttg-black font-bold mt-0.5">{entity.visualStyle}</p>
                </div>
              )}
            </div>

            {entity.relationships && entity.relationships.length > 0 && (
              <div className="border-2 border-ttg-black p-3 bg-white" style={{ boxShadow: "2px 2px 0 var(--ttg-black)" }}>
                <p className="text-[10px] font-black text-ttg-black/40 uppercase mb-1.5">Relationships</p>
                <div className="flex gap-1.5 flex-wrap">
                  {entity.relationships.map((r: string) => (
                    <span key={r} className="px-2 py-0.5 text-[10px] font-bold bg-ttg-cream-dark text-ttg-black border border-ttg-black/20">{r}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {entity.familyId && (
                <div className="bg-white border-2 border-ttg-black p-2 text-center" style={{ boxShadow: "1px 1px 0 var(--ttg-black)" }}>
                  <p className="text-ttg-black/40 uppercase font-black text-[9px]">Family</p>
                  <p className="text-ttg-black font-bold">{entity.familyId}</p>
                </div>
              )}
              {entity.evolution && (
                <div className="bg-white border-2 border-ttg-black p-2 text-center" style={{ boxShadow: "1px 1px 0 var(--ttg-black)" }}>
                  <p className="text-ttg-black/40 uppercase font-black text-[9px]">Evolution</p>
                  <p className="text-ttg-black font-bold">{entity.evolution}</p>
                </div>
              )}
              {entity.owner && (
                <div className="bg-white border-2 border-ttg-black p-2 text-center" style={{ boxShadow: "1px 1px 0 var(--ttg-black)" }}>
                  <p className="text-ttg-black/40 uppercase font-black text-[9px]">Owner</p>
                  <p className="text-ttg-black font-bold">{entity.owner}</p>
                </div>
              )}
              {entity.faction && (
                <div className="bg-white border-2 border-ttg-black p-2 text-center" style={{ boxShadow: "1px 1px 0 var(--ttg-black)" }}>
                  <p className="text-ttg-black/40 uppercase font-black text-[9px]">Faction</p>
                  <p className="text-ttg-black font-bold">{entity.faction}</p>
                </div>
              )}
              {entity.category && (
                <div className="bg-white border-2 border-ttg-black p-2 text-center" style={{ boxShadow: "1px 1px 0 var(--ttg-black)" }}>
                  <p className="text-ttg-black/40 uppercase font-black text-[9px]">Category</p>
                  <p className="text-ttg-black font-bold">{entity.category}</p>
                </div>
              )}
            </div>

            <a
              href={`/wiki/${entity.series}/${entity.slug}`}
              className="inline-block px-4 py-2 text-xs font-black uppercase border-2 border-ttg-black text-ttg-black bg-ttg-yellow hover:bg-ttg-yellow-hover transition-colors"
              style={{ boxShadow: "3px 3px 0 var(--ttg-black)" }}
            >
              View Full Wiki Entry →
            </a>
          </div>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Thing",
              name: entity.name,
              description: entity.description,
              additionalType: entity.entityType,
              ...(entity.rarity && { material: entity.rarity }),
            }),
          }}
        />
      </article>
    </main>
  );
}
