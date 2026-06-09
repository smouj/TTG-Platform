// ============================================================
// Trading Tazos Game — Admin API
// ============================================================
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getAuthUser } from "@/lib/auth"

const prisma = new PrismaClient()
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "dev@tradingtazosgame.com"

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
      version: "0.5.0",
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
    const franchiseFilter = searchParams.get("franchise")
    const rarityFilter = searchParams.get("rarity")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "100")

    const where: any = {}
    if (franchiseFilter) where.franchiseId = franchiseFilter
    if (rarityFilter) where.rarity = rarityFilter
    if (search) where.name = { contains: search }

    const [tazos, total] = await Promise.all([
      prisma.tazo.findMany({
        where,
        include: { franchise: { select: { name: true, slug: true } } },
        orderBy: [{ franchiseId: "asc" }, { number: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tazo.count({ where }),
    ])
    return NextResponse.json({ tazos, total, page, limit, pages: Math.ceil(total / limit) })
  }

  if (section === "db-stats") {
    const stats: Record<string, number> = {}
    const tables = ["User", "Tazo", "Franchise", "BagPurchase", "Deck", "Quest", "UserQuest", "Achievement", "UserAchievement"]
    for (const table of tables) {
      stats[table] = await (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)].count()
    }
    return NextResponse.json({ stats })
  }

  if (section === "franchises") {
    const franchises = await prisma.franchise.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    })
    return NextResponse.json({ franchises })
  }

  return NextResponse.json({ error: "Unknown section" }, { status: 400 })
}

// ── PATCH: Update tazo fields ──
export async function PATCH(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { id, ...fields } = body

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    // Only allow updating safe fields
    const allowedFields = [
      "name", "displayName", "description", "rarity", "imageUrl", "backImageUrl",
      "skill", "skillDesc", "category", "publishStatus",
      "attack", "defense", "resistance", "weight", "stability", "spin",
      "control", "bounce", "precision", "role", "combatType", "finish",
      "creatureVariant", "shinyImageUrl", "isOwned", "stackable", "maxStackOn",
    ]
    const updateData: any = {}
    for (const key of Object.keys(fields)) {
      if (allowedFields.includes(key)) {
        updateData[key] = fields[key]
      }
    }

    const tazo = await prisma.tazo.update({
      where: { id },
      data: updateData,
      include: { franchise: { select: { name: true, slug: true } } },
    })

    return NextResponse.json({ success: true, tazo })
  } catch (err: any) {
    console.error("PATCH /api/admin tazo error:", err.message)
    return NextResponse.json({ error: err.message || "Update failed" }, { status: 500 })
  }
}

// ── DELETE: Remove a tazo ──
export async function DELETE(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const tazo = await prisma.tazo.delete({ where: { id } })
    return NextResponse.json({ success: true, tazo })
  } catch (err: any) {
    console.error("DELETE /api/admin tazo error:", err.message)
    return NextResponse.json({ error: err.message || "Delete failed" }, { status: 500 })
  }
}
