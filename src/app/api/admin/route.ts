// ============================================================
// Trading Tazos Game — Admin API
// ============================================================
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getAuthUser } from "@/lib/auth"

const prisma = new PrismaClient()
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "dev.viewer@tradingtazosgame.com"

async function isAdmin(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return false
  return user.email === ADMIN_EMAIL
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const section = searchParams.get("section") || "overview"

  if (section === "overview") {
    const [userCount, tazoCount, franchiseCount, bagCount, deckCount, questCount] = await Promise.all([
      prisma.user.count(),
      prisma.tazo.count(),
      prisma.franchise.count(),
      prisma.bagPurchase.count(),
      prisma.deck.count(),
      prisma.quest.count(),
    ])

    // Count tazos with art
    const tazosWithArt = await prisma.tazo.count({ where: { imageUrl: { not: null } } })

    return NextResponse.json({
      users: userCount,
      tazos: tazoCount,
      tazosWithArt,
      franchises: franchiseCount,
      bags: bagCount,
      decks: deckCount,
      quests: questCount,
      serverTime: new Date().toISOString(),
      version: "0.3.1",
    })
  }

  if (section === "users") {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, email: true, name: true, displayName: true,
        credits: true, createdAt: true,
        _count: { select: { userTazos: true, decks: true } },
      },
    })
    return NextResponse.json({ users })
  }

  if (section === "tazos") {
    const tazos = await prisma.tazo.findMany({
      include: { franchise: { select: { name: true, slug: true } } },
      orderBy: [{ franchiseId: "asc" }, { number: "asc" }],
      take: 100,
    })
    return NextResponse.json({ tazos, total: await prisma.tazo.count() })
  }

  if (section === "db-stats") {
    const stats: Record<string, number> = {}
    const tables = ["User", "Tazo", "Franchise", "BagPurchase", "Deck", "Quest", "UserQuest", "Achievement", "UserAchievement"]
    for (const table of tables) {
      stats[table] = await (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)].count()
    }
    return NextResponse.json({ stats })
  }

  return NextResponse.json({ error: "Unknown section" }, { status: 400 })
}
