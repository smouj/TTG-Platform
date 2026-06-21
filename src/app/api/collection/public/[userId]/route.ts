// ============================================================
// TTG Public Collection API
// GET /api/collection/public/:userId
// Returns public-facing collection data for sharing.
// No auth required — only shows data users explicitly opt in to share.
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { SITE_CONFIG } from "@/lib/site-config"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params

  try {
    const [user, totalOwnedTazos] = await Promise.all([
      db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
      },
      }),
      db.userTazo.count({ where: { userId, quantity: { gt: 0 } } }),
    ])

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get public tazos (only published ones)
    const userTazos = await db.userTazo.findMany({
      where: {
        userId,
        quantity: { gt: 0 },
        tazo: { publishStatus: "published" },
      },
      include: {
        tazo: true,
      },
      orderBy: { acquiredAt: "desc" },
      take: 150,
    })

    const tazos = userTazos.map((ut) => ({
      id: ut.tazo.id,
      name: ut.tazo.name,
      slug: ut.tazo.slug,
      franchise: ut.tazo.franchiseId,
      imageUrl: ut.tazo.imageUrl || `/tazos-generated/${ut.tazo.franchiseId}/${ut.tazo.slug}.png`,
      rarity: ut.tazo.rarity,
      creature: ut.tazo.creatureVariant || null,
      acquiredAt: ut.acquiredAt,
    }))

    // Count by franchise
    const franchiseCounts = tazos.reduce((acc, t) => {
      const f = t.franchise || "unknown"
      acc[f] = (acc[f] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        totalTazos: totalOwnedTazos,
      },
      tazos,
      franchiseCounts,
      meta: {
        title: `${user.name}'s Collection — ${SITE_CONFIG.name}`,
        description: `${user.name} has collected ${tazos.length} tazos on ${SITE_CONFIG.name}. View their collection!`,
        imageUrl: tazos[0]?.imageUrl || `${SITE_CONFIG.canonicalUrl}/pwa-512.webp`,
      },
    })
  } catch (error) {
    console.error("Public collection error:", error)
    return NextResponse.json(
      { error: "Failed to load collection" },
      { status: 500 }
    )
  }
}
