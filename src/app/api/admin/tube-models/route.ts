// GET  /api/admin/tube-models — list all
// POST /api/admin/tube-models — create
// PUT  /api/admin/tube-models — update
// DELETE /api/admin/tube-models?id=... — delete
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
    const models = await db.tubeModel.findMany({
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
    const { name, textureUrl, franchise, sortOrder } = body
    if (!name || !textureUrl || !franchise) {
      return NextResponse.json({ error: "name, textureUrl, franchise required" }, { status: 400 })
    }

    const model = await db.tubeModel.create({
      data: {
        name,
        textureUrl,
        franchise,
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
    const { id, name, textureUrl, franchise, sortOrder, isActive } = body
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const model = await db.tubeModel.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(textureUrl !== undefined && { textureUrl }),
        ...(franchise !== undefined && { franchise }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    })
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

    await db.tubeModel.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (e instanceof Response) throw e
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
