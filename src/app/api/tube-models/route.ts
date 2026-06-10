// GET /api/tube-models — public endpoint for deck builder
// Returns active tube models ordered by sortOrder.
// Falls back to hardcoded defaults if DB is empty.
import { NextResponse } from "next/server"
import { db } from "@/lib/db"

const DEFAULT_TUBES = [
  { slug: "minimon", name: "Minimon", textureUrl: "/tazos-tubes/tube-minimon.png", franchise: "minimon", color: "#FFCC00" },
  { slug: "cybermon", name: "Cybermon", textureUrl: "/tazos-tubes/tube-cybermon.png", franchise: "cybermon", color: "#00B4D8" },
  { slug: "dracobell", name: "Dracobell", textureUrl: "/tazos-tubes/tube-dracobell.png", franchise: "dracobell", color: "#FF6B00" },
]

const FRANCHISE_COLORS: Record<string, string> = {
  minimon: "#FFCC00", cybermon: "#00B4D8", dracobell: "#FF6B00",
}

export async function GET() {
  try {
    const models = await db.tubeModel.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    })

    if (models.length === 0) {
      return NextResponse.json({ models: DEFAULT_TUBES })
    }

    return NextResponse.json({
      models: models.map(m => ({
        slug: m.name.toLowerCase().replace(/\s+/g, "-"),
        name: m.name,
        textureUrl: m.textureUrl,
        franchise: m.franchise,
        color: FRANCHISE_COLORS[m.franchise] || "#FFCC00",
      })),
    })
  } catch {
    return NextResponse.json({ models: DEFAULT_TUBES })
  }
}
