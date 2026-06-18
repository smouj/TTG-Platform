import Link from "next/link";
import type { TTGWikiEntity } from "@/lib/wiki-types";
import { WIKI_SERIES_CONFIG, ENTITY_TYPE_LABELS } from "@/lib/wiki-types";
import { Disc3, Sparkles, AlertCircle } from "lucide-react";

interface WikiTazoCardProps {
  entity: TTGWikiEntity;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  created: <Disc3 className="w-3 h-3" />,
  pending: <AlertCircle className="w-3 h-3" />,
  unconfirmed: <AlertCircle className="w-3 h-3" />,
};

const STATUS_COLORS: Record<string, string> = {
  created: "text-green-700 border-green-300 bg-green-50",
  pending: "text-yellow-700 border-yellow-300 bg-yellow-50",
  unconfirmed: "text-gray-400 border-gray-200 bg-gray-50",
};

const RARITY_COLORS: Record<string, string> = {
  "Común": "bg-gray-100 text-gray-700 border-gray-300",
  "Comun": "bg-gray-100 text-gray-700 border-gray-300",
  "Poco común": "bg-blue-50 text-blue-700 border-blue-200",
  "Poco comun": "bg-blue-50 text-blue-700 border-blue-200",
  "Raro": "bg-purple-50 text-purple-700 border-purple-200",
  "Ultra": "bg-amber-50 text-amber-700 border-amber-200",
  "Legendario": "bg-red-50 text-red-700 border-red-200",
  "Mítico": "bg-pink-50 text-pink-700 border-pink-200",
  "Mitico": "bg-pink-50 text-pink-700 border-pink-200",
};

export default function WikiTazoCard({ entity }: WikiTazoCardProps) {
  const seriesCfg = WIKI_SERIES_CONFIG[entity.series];
  const href = `/wiki/${seriesCfg.slug}/${entity.slug}`;
  const rarityColor = entity.rarity
    ? RARITY_COLORS[entity.rarity] || "bg-gray-100 text-gray-700 border-gray-300"
    : "";

  return (
    <Link
      href={href}
      className="group block border-2 border-ttg-black bg-white overflow-hidden transition-all hover:-translate-y-0.5"
      style={{ boxShadow: "3px 3px 0 var(--ttg-black)" }}
    >
      {/* Top color bar */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: seriesCfg.color }}
      />

      <div className="p-3">
        {/* Header with ID */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black text-ttg-black/40 uppercase tracking-wider">
            #{entity.id}
          </span>
          <div className="flex items-center gap-1">
            {/* Art status badge */}
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold border ${STATUS_COLORS[entity.image.status]}`}
            >
              {STATUS_ICONS[entity.image.status]}
            </span>
          </div>
        </div>

        {/* Name */}
        <h3 className="text-sm font-black text-ttg-black leading-tight mb-1.5 group-hover:underline">
          {entity.name}
        </h3>

        {/* Entity type badge */}
        <div className="flex items-center gap-1 mb-2">
          <span
            className="text-[9px] font-bold uppercase px-1.5 py-0.5 border"
            style={{
              borderColor: seriesCfg.color,
              color: seriesCfg.color,
              backgroundColor: `${seriesCfg.color}10`,
            }}
          >
            {ENTITY_TYPE_LABELS[entity.entityType] || entity.entityType}
          </span>
          {entity.rarity && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 border ${rarityColor}`}>
              {entity.rarity}
            </span>
          )}
        </div>

        {/* Types */}
        <div className="flex flex-wrap gap-1">
          {entity.types.map((t) => (
            <span
              key={t}
              className="text-[9px] font-bold text-ttg-black/50 border border-ttg-black/15 px-1 py-0.5"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Description snippet */}
        <p className="text-[10px] text-ttg-black/50 mt-2 line-clamp-2 leading-relaxed">
          {entity.description}
        </p>
      </div>

      {/* Bottom series bar */}
      <div
        className="h-0.5 w-full"
        style={{ backgroundColor: seriesCfg.color, opacity: 0.6 }}
      />
    </Link>
  );
}
