import { db } from "@/lib/db"
import { getAuthUser } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "dev.viewer@medaclawarena.com"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const franchise = searchParams.get("franchise")
    const collection = searchParams.get("collection")
    const rarity = searchParams.get("rarity")
    const condition = searchParams.get("condition")
    const category = searchParams.get("category")
    const variant = searchParams.get("variant")
    const sourceStatus = searchParams.get("sourceStatus")
    const owned = searchParams.get("owned")
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sortBy") || "number"
    const sortOrder = searchParams.get("sortOrder") || "asc"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1)
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "100", 10) || 100), 500)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (franchise) where.franchise = { slug: franchise }
    if (collection) where.collection = { slug: collection }
    if (rarity) where.rarity = rarity
    if (condition) where.condition = condition
    if (category) where.category = category
    if (variant) where.variant = variant
    if (sourceStatus) where.sourceStatus = sourceStatus
    if (owned !== null && owned !== "") where.isOwned = owned === "true"
    if (search) where.name = { contains: search }

    const orderBy: Record<string, string> = {}
    const allowedSorts = ["name", "number", "rarity", "condition", "category", "sourceStatus", "attack", "defense", "resistance", "weight", "stability", "spin", "control", "bounce", "precision", "role", "createdAt"]
    if (allowedSorts.includes(sortBy)) {
      orderBy[sortBy] = sortOrder === "desc" ? "desc" : "asc"
    } else {
      orderBy.number = "asc"
    }

    const total = await db.tazo.count({ where })

    const tazos = await db.tazo.findMany({
      where,
      include: { franchise: true, collection: true },
      orderBy,
      skip,
      take: limit,
    })

    return NextResponse.json({ tazos, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error("Error fetching tazos:", error)
    return NextResponse.json({ error: "Failed to fetch tazos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin-only: authenticate user and verify admin email
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (authUser.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 })
    }

    const body = await request.json()

    const tazo = await db.tazo.create({
      data: {
        name: body.name,
        displayName: body.displayName || body.name,
        slug: body.slug || `tazo-${Date.now()}`,
        franchiseId: body.franchiseId,
        collectionId: body.collectionId,
        number: body.number || "",
        variant: body.variant || null,
        category: body.category || null,
        manufacturer: body.manufacturer || null,
        country: body.country || null,
        sourceStatus: body.sourceStatus || "pending_visual_check",
        condition: body.condition || "good",
        physicalType: body.physicalType || "cardboard",
        rarity: body.rarity || "common",
        imageUrl: body.imageUrl || null,
        skill: body.skill || null,
        skillDesc: body.skillDesc || null,
        evolutionFrom: body.evolutionFrom || null,
        evolutionTo: body.evolutionTo || null,
        transformStage: body.transformStage || null,
        transformOf: body.transformOf || null,
        attack: body.attack ?? 50,
        defense: body.defense ?? 50,
        resistance: body.resistance ?? 50,
        weight: body.weight ?? 50,
        stability: body.stability ?? 50,
        spin: body.spin ?? 50,
        control: body.control ?? 50,
        bounce: body.bounce ?? 50,
        precision: body.precision ?? 50,
        role: body.role || null,
        isOwned: body.isOwned ?? false,
      },
      include: { franchise: true, collection: true },
    })

    return NextResponse.json({ tazo }, { status: 201 })
  } catch (error) {
    console.error("Error creating tazo:", error)
    return NextResponse.json({ error: "Failed to create tazo" }, { status: 500 })
  }
}
