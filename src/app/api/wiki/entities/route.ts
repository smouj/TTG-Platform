import { NextRequest, NextResponse } from "next/server";
import { getAllWikiEntities, getWikiEntitiesBySeries } from "@/lib/wiki-data";
import type { TTGWikiSeries, TTGWikiEntity } from "@/lib/wiki-types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const franchise = searchParams.get("franchise");
    const search = searchParams.get("search")?.toLowerCase();
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50),
      500
    );

    let entities: TTGWikiEntity[];
    if (franchise) {
      entities = getWikiEntitiesBySeries(franchise as TTGWikiSeries);
    } else {
      entities = getAllWikiEntities();
    }

    if (search) {
      entities = entities.filter(
        (e) =>
          e.name.toLowerCase().includes(search) ||
          e.id.toLowerCase().includes(search) ||
          e.slug.toLowerCase().includes(search)
      );
    }

    const tazos = entities.slice(0, limit).map((e) => ({
      id: e.slug,
      name: e.name,
      displayName: e.name,
      slug: e.slug,
      imageUrl: null,
      franchise: e.series,
      franchiseSlug: e.series,
      franchiseName: e.series === "draco_bell" ? "Dracobell" : e.series.charAt(0).toUpperCase() + e.series.slice(1),
      rarity: e.rarity || "common",
      entityType: e.entityType,
      types: e.types,
      description: e.description?.slice(0, 120),
      imageStatus: e.image?.status || "unconfirmed",
      publishStatus: "published",
    }));

    return NextResponse.json({
      tazos,
      total: entities.length,
      page: 1,
      limit,
      franchise: franchise || "all",
    });
  } catch (error) {
    console.error("Error fetching wiki entities:", error);
    return NextResponse.json({ error: "Failed to fetch entities" }, { status: 500 });
  }
}
