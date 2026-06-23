// ============================================================
// TTG Wiki — Data loaders from JSON files
// ============================================================

import type { TTGWikiEntity, TTGWikiSeries } from "@/lib/wiki-types";
import minimonData from "@/data/wiki/minimon.json";
import cybermonData from "@/data/wiki/cybermon.json";
import dracoBellData from "@/data/wiki/draco-bell.json";
import allData from "@/data/wiki/all-wiki-entities.json";

const minimon: TTGWikiEntity[] = minimonData as TTGWikiEntity[];
const cybermon: TTGWikiEntity[] = cybermonData as TTGWikiEntity[];
const dracoBell: TTGWikiEntity[] = dracoBellData as TTGWikiEntity[];
const all: TTGWikiEntity[] = allData as TTGWikiEntity[];

export function getAllWikiEntities(): TTGWikiEntity[] {
  return all;
}

export function getWikiEntitiesBySeries(series: TTGWikiSeries): TTGWikiEntity[] {
  switch (series) {
    case "minimon": return minimon;
    case "cybermon": return cybermon;
    case "draco_bell": return dracoBell;
    default: return [];
  }
}

export function getWikiEntityBySlug(series: TTGWikiSeries, slug: string): TTGWikiEntity | undefined {
  const entities = getWikiEntitiesBySeries(series);
  return entities.find((e) => e.slug === slug);
}


/** Look up a wiki entity by slug across ALL series */
export function findWikiEntityBySlug(slug: string): TTGWikiEntity | undefined {
  return all.find((e) => e.slug === slug);
}

/** Get all wiki entity slugs for static generation */
export function getAllWikiEntitySlugs(): string[] {
  return all.map((e) => e.slug);
}

export function searchWikiEntities(
  query: string,
  series?: TTGWikiSeries
): TTGWikiEntity[] {
  const pool = series ? getWikiEntitiesBySeries(series) : all;
  const q = query.toLowerCase().trim();
  if (!q) return pool;
  return pool.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      e.types.some((t) => t.toLowerCase().includes(q)) ||
      (e.rarity && e.rarity.toLowerCase().includes(q)) ||
      (e.description && e.description.toLowerCase().includes(q))
  );
}

export function filterWikiEntities(
  entities: TTGWikiEntity[],
  filters: {
    entityType?: string;
    rarity?: string;
    stage?: string;
    type?: string;
    artStatus?: string;
  }
): TTGWikiEntity[] {
  return entities.filter((e) => {
    if (filters.entityType && e.entityType !== filters.entityType) return false;
    if (filters.rarity && e.rarity !== filters.rarity) return false;
    if (filters.stage && e.stage !== filters.stage) return false;
    if (filters.type && !e.types.includes(filters.type)) return false;
    if (filters.artStatus && e.image.status !== filters.artStatus) return false;
    return true;
  });
}

export function getUniqueValues(
  entities: TTGWikiEntity[],
  field: "entityType" | "rarity" | "stage" | "types" | "artStatus"
): string[] {
  const values = new Set<string>();
  for (const e of entities) {
    if (field === "types") {
      e.types.forEach((t) => values.add(t));
    } else if (field === "artStatus") {
      values.add(e.image.status);
    } else {
      const val = e[field];
      if (val) values.add(val);
    }
  }
  return Array.from(values).sort();
}
