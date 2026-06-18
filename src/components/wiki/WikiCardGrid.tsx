"use client";
import { useState, useMemo } from "react";
import type { TTGWikiEntity } from "@/lib/wiki-types";
import { getUniqueValues } from "@/lib/wiki-data";
import WikiTazoCard from "./WikiTazoCard";
import WikiSearchBar from "./WikiSearchBar";
import WikiFilterBar from "./WikiFilterBar";
import { ENTITY_TYPE_LABELS } from "@/lib/wiki-types";

interface WikiCardGridProps {
  entities: TTGWikiEntity[];
  seriesLabel: string;
}

export default function WikiCardGrid({ entities, seriesLabel }: WikiCardGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [rarityFilter, setRarityFilter] = useState("");

  const filtered = useMemo(() => {
    let result = entities;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          e.types.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (entityTypeFilter) {
      result = result.filter((e) => e.entityType === entityTypeFilter);
    }
    if (rarityFilter) {
      result = result.filter((e) => e.rarity === rarityFilter);
    }
    return result;
  }, [entities, searchQuery, entityTypeFilter, rarityFilter]);

  const entityTypes = useMemo(
    () =>
      getUniqueValues(entities, "entityType").map((v) => ({
        label: ENTITY_TYPE_LABELS[v as keyof typeof ENTITY_TYPE_LABELS] || v,
        value: v,
      })),
    [entities]
  );

  const rarities = useMemo(
    () =>
      getUniqueValues(entities, "rarity").map((v) => ({ label: v, value: v })),
    [entities]
  );

  return (
    <div>
      {/* Search + Filters */}
      <div className="mb-6 space-y-4">
        <WikiSearchBar
          onSearch={setSearchQuery}
          placeholder={`Buscar en ${seriesLabel} por nombre, ID o tipo...`}
        />
        <div className="flex flex-wrap gap-4">
          {entityTypes.length > 1 && (
            <div>
              <span className="text-[10px] font-black text-ttg-black/40 uppercase tracking-wider block mb-1.5">
                Categoría
              </span>
              <WikiFilterBar
                filters={entityTypes}
                activeFilter={entityTypeFilter}
                onChange={setEntityTypeFilter}
              />
            </div>
          )}
          {rarities.length > 1 && (
            <div>
              <span className="text-[10px] font-black text-ttg-black/40 uppercase tracking-wider block mb-1.5">
                Rareza
              </span>
              <WikiFilterBar
                filters={rarities}
                activeFilter={rarityFilter}
                onChange={setRarityFilter}
              />
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-[10px] font-black text-ttg-black/40 uppercase tracking-wider mb-3">
        {filtered.length} de {entities.length} entradas
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((entity) => (
            <WikiTazoCard key={entity.slug} entity={entity} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-ttg-black/20">
          <p className="text-sm font-bold text-ttg-black/40">
            No se encontraron entradas con estos filtros.
          </p>
        </div>
      )}
    </div>
  );
}
