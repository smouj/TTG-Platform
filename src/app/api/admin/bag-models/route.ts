// GET  /api/admin/bag-models — list all
// POST /api/admin/bag-models — create
// PUT  /api/admin/bag-models — update
// DELETE /api/admin/bag-models?id=... — delete
import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { db } from "@/lib/db"

function adminOnly(user: any) {
  if (user?.email !== "dev@tradingtazosgame.com") {
    throw NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
}

export async function GET() {
  try {
    const models = await db.bagModel.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    })
    return NextResponse.json({ models })
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    adminOnly(user)

    const body = await request.json()
    const { name, frontUrl, backUrl, franchise, cost, bonusChance, rareBoost, color, bgColor, tagline, sortOrder } = body
    if (!name || !frontUrl || !backUrl || !franchise) {
      return NextResponse.json({ error: "name, frontUrl, backUrl, franchise required" }, { status: 400 })
    }

    const model = await db.bagModel.create({
      data: {
        name, frontUrl, backUrl, franchise,
        cost: cost ?? 100,
        bonusChance: bonusChance ?? 15,
        rareBoost: rareBoost ?? 2,
        color: color ?? "var(--ttg-yellow)",
        bgColor: bgColor ?? "#FFF8E7",
        tagline: tagline ?? "",
        sortOrder: sortOrder ?? 0,
        isActive: true,
      },
    })
    return NextResponse.json({ model })
  } catch (e: any) {
    if (e instanceof Response) throw e
    return NextResponse.json({ error: "Create failed" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    adminOnly(user)

    const body = await request.json()
    const { id, ...fields } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const allowedFields = new Set(["name", "frontUrl", "backUrl", "franchise", "cost", "bonusChance", "rareBoost", "color", "bgColor", "tagline", "sortOrder", "isActive"])
    const updateData: any = {}
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined && allowedFields.has(k)) updateData[k] = v
    }

    const model = await db.bagModel.update({ where: { id }, data: updateData })
    return NextResponse.json({ model })
  } catch (e: any) {
    if (e instanceof Response) throw e
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    adminOnly(user)

    const id = request.nextUrl.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    await db.bagModel.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (e instanceof Response) throw e
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
