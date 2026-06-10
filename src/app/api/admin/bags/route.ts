// GET /api/admin/bags — List all bag textures
// POST /api/admin/bags — Upload a new bag texture
// DELETE /api/admin/bags?file=... — Delete a bag texture
import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import fs from "fs"
import path from "path"
import { writeFile, unlink } from "fs/promises"

const BAGS_DIR = path.join(process.cwd(), "public", "textures", "bags")
const ALLOWED_FRANCHISES = ["minimon", "cybermon", "dracobell"]

function ensureDir(franchise: string) {
  const dir = path.join(BAGS_DIR, franchise)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function listTextures(): { name: string; url: string; franchise: string; size: number }[] {
  const results: { name: string; url: string; franchise: string; size: number }[] = []
  if (!fs.existsSync(BAGS_DIR)) return results
  for (const franchise of ALLOWED_FRANCHISES) {
    const dir = path.join(BAGS_DIR, franchise)
    if (!fs.existsSync(dir)) continue
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".png"))
    for (const f of files) {
      const stats = fs.statSync(path.join(dir, f))
      results.push({
        name: f,
        url: `/textures/bags/${franchise}/${f}`,
        franchise,
        size: stats.size,
      })
    }
  }
  return results
}

export async function GET() {
  try {
    const textures = listTextures()
    return NextResponse.json({ textures })
  } catch {
    return NextResponse.json({ error: "Failed to list textures" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (user?.email !== "dev@tradingtazosgame.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const franchise = formData.get("franchise") as string

    if (!file || !franchise) {
      return NextResponse.json({ error: "File and franchise required" }, { status: 400 })
    }
    if (!ALLOWED_FRANCHISES.includes(franchise)) {
      return NextResponse.json({ error: "Invalid franchise" }, { status: 400 })
    }
    if (!file.name.endsWith(".png")) {
      return NextResponse.json({ error: "Only PNG files allowed" }, { status: 400 })
    }

    const dir = ensureDir(franchise)

    // Keep original filename but sanitize
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/\.png$/i, "") + ".png"
    const filePath = path.join(dir, safeName)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    return NextResponse.json({
      success: true,
      texture: {
        name: safeName,
        url: `/textures/bags/${franchise}/${safeName}`,
        franchise,
        size: buffer.length,
      },
    })
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (user?.email !== "dev@tradingtazosgame.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const fileName = request.nextUrl.searchParams.get("file")
    const franchise = request.nextUrl.searchParams.get("franchise")
    if (!fileName || !franchise) {
      return NextResponse.json({ error: "File name and franchise required" }, { status: 400 })
    }
    if (!ALLOWED_FRANCHISES.includes(franchise)) {
      return NextResponse.json({ error: "Invalid franchise" }, { status: 400 })
    }

    // Prevent path traversal
    const safeName = path.basename(fileName)
    if (!safeName.endsWith(".png")) {
      return NextResponse.json({ error: "Invalid file name" }, { status: 400 })
    }

    const filePath = path.join(BAGS_DIR, franchise, safeName)
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    await unlink(filePath)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
