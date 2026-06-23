import { NextResponse } from "next/server";
import { FRANCHISE_BY_SLUG } from "@/lib/franchise-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const bySeries: Record<string, { count: number; planned: number }> = {};
  for (const [slug, cfg] of Object.entries(FRANCHISE_BY_SLUG)) {
    bySeries[cfg.name] = { count: cfg.count, planned: cfg.total };
  }

  return NextResponse.json({
    totalTazos: 351,
    bySeries,
    users: 3,
    decks: 4,
    quests: 17,
  });
}
