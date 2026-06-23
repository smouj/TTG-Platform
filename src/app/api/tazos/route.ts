import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "dev@tradingtazosgame.com"

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
    const publishStatus = searchParams.get("publishStatus")
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
    if (publishStatus && publishStatus !== "all") {
      where.publishStatus = publishStatus
    } else if (!publishStatus) {
      // Public API: only show published tazos by default
      where.publishStatus = "published"
    }
    if (owned !== null && owned !== "") where.isOwned = owned === "true"
    if (search) where.name = { contains: search }

    const orderBy: any[] = []
    const allowedSorts = ["name", "number", "rarity", "condition", "category", "sourceStatus", "attack", "defense", "resistance", "weight", "stability", "spin", "control", "bounce", "precision", "role", "createdAt"]
    if (allowedSorts.includes(sortBy)) {
      // Default franchise ordering first, then user-specified sort
      orderBy.push({ franchise: { slug: "asc" } })
      orderBy.push({ [sortBy]: sortOrder === "desc" ? "desc" : "asc" })
    } else {
      orderBy.push({ franchise: { slug: "asc" } })
      orderBy.push({ number: "asc" })
    }

    const total = await db.tazo.count({ where })

    const tazos = await db.tazo.findMany({
      where,
      include: { franchise: true, collection: true },
      orderBy,
      skip,
      take: limit,
    })

    // Cache-buster: combines manual bump constant + layout lastModified
    // When user saves designer → lastModified updates → images auto-refresh
    const LAYOUTS_FILE = path.join(process.cwd(), "prisma", "tazo-layouts.json");
    let layoutTs = 0;
    try {
      if (fs.existsSync(LAYOUTS_FILE)) {
        const layoutStore = JSON.parse(fs.readFileSync(LAYOUTS_FILE, "utf-8"));
        layoutTs = layoutStore.lastModified || 0;
      }
    } catch {}
    const cacheBuster = `20260609v1-${layoutTs}`

    // Flatten franchise & collection to strings + add flat metadata fields
    const flatTazos = tazos.map(t => ({
      ...t,
      franchise: t.franchise?.slug || null,
      franchiseName: t.franchise?.name || null,
      franchiseColor: t.franchise?.color || null,
      franchiseSlug: t.franchise?.slug || null,
      collection: t.collection?.slug || null,
      collectionName: t.collection?.name || null,
      collectionSlug: t.collection?.slug || null,
      collectionYear: t.collection?.year || null,
      imageUrl: t.imageUrl ? `${t.imageUrl}?v=${cacheBuster}` : null,
      shinyImageUrl: t.shinyImageUrl ? `${t.shinyImageUrl}?v=${cacheBuster}` : null,
      backImageUrl: t.backImageUrl ? `${t.backImageUrl}?v=${cacheBuster}` : null,
    }))

    return NextResponse.json(
      { tazos: flatTazos, total, page, limit, totalPages: Math.ceil(total / limit), lastModified: cacheBuster },
      { headers: { "Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache", "Expires": "0" } }
    )
  } catch (error) {
    console.error("Error fetching tazos:", error)
    return NextResponse.json({ error: "Failed to fetch tazos" }, { status: 500 })
  }
}

