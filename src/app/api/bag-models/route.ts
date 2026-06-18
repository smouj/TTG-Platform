// GET /api/bag-models — public endpoint for shop
// Returns active bag models ordered by sortOrder.
// If no models exist in DB, returns default hardcoded models.
import { NextResponse } from "next/server"
import { db } from "@/lib/db"

const DEFAULT_BAGS = [
  {
    type: "standard", name: "Classic Bag", cost: 100,
    bonusChance: 15, rareBoost: 2, color: "var(--ttg-yellow)", bgColor: "#FFF8E7",
    franchise: "minimon", tagline: "Original collection tazos",
  },
  {
    type: "premium", name: "Premium Bag", cost: 100,
    bonusChance: 15, rareBoost: 2, color: "#3B82F6", bgColor: "#EFF6FF",
    franchise: "cybermon", tagline: "Digital monsters and tech",
  },
  {
    type: "mega", name: "Mega Bag", cost: 100,
    bonusChance: 15, rareBoost: 2, color: "#F97316", bgColor: "#FFF7ED",
    franchise: "dracobell", tagline: "Legendary auras, top rarity",
  },
]

export async function GET() {
  try {
    const models = await db.bagModel.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    })

    if (models.length === 0) {
      // No models in DB yet — return defaults
      return NextResponse.json({ models: DEFAULT_BAGS })
    }

    return NextResponse.json({
      models: models.map(m => ({
        id: m.id,
        type: m.name.toLowerCase().replace(/\s+/g, "-"),
        name: m.name,
        cost: m.cost,
        bonusChance: m.bonusChance,
        rareBoost: m.rareBoost,
        color: m.color,
        bgColor: m.bgColor,
        franchise: m.franchise,
        frontUrl: m.frontUrl,
        backUrl: m.backUrl,
        tagline: m.tagline,
      })),
    })
  } catch {
    return NextResponse.json({ models: DEFAULT_BAGS })
  }
}
