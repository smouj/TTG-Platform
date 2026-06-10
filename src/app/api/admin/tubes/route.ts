// GET /api/admin/tubes — List all tube textures
// POST /api/admin/tubes — Upload a new tube texture
// DELETE /api/admin/tubes?file=... — Delete a tube texture
import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import fs from "fs"
import path from "path"
import { writeFile, unlink } from "fs/promises"

const TUBES_DIR = path.join(process.cwd(), "public", "tazos-tubes")
const ALLOWED_FRANCHISES = ["minimon", "cybermon", "dracobell"]

function ensureDir() {
  if (!fs.existsSync(TUBES_DIR)) fs.mkdirSync(TUBES_DIR, { recursive: true })
}

function listTextures() {
  ensureDir()
  const files = fs.readdirSync(TUBES_DIR).filter(f => f.endsWith(".png"))
  return files.map(f => {
    const stats = fs.statSync(path.join(TUBES_DIR, f))
    // Detect franchise from filename: tube-minimon.png -> minimon
    const franchise = ALLOWED_FRANCHISES.find(fr => f.includes(fr)) || "other"
    return {
      name: f,
      url: `/tazos-tubes/${f}`,
      franchise,
      size: stats.size,
    }
  })
}

export async function GET() {
  try {
    const textures = listTextures()
    return NextResponse.json({ textures })
  } catch (error) {
    console.error("Tube textures GET error:", error)
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

    ensureDir()

    // Generate filename: tube-{franchise}-{timestamp}.png
    const ts = Date.now()
    const safeName = `tube-${franchise}-${ts}.png`
    const filePath = path.join(TUBES_DIR, safeName)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    return NextResponse.json({
      success: true,
      texture: {
        name: safeName,
        url: `/tazos-tubes/${safeName}`,
        franchise,
        size: buffer.length,
      },
    })
  } catch (error) {
    console.error("Tube texture upload error:", error)
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
    if (!fileName) {
      return NextResponse.json({ error: "File name required" }, { status: 400 })
    }

    // Prevent path traversal
    const safeName = path.basename(fileName)
    if (!safeName.endsWith(".png") || safeName !== fileName) {
      return NextResponse.json({ error: "Invalid file name" }, { status: 400 })
    }

    ensureDir()
    const filePath = path.join(TUBES_DIR, safeName)
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    await unlink(filePath)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Tube texture delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
