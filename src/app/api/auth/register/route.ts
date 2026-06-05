import { NextRequest, NextResponse } from "next/server"
import { hashPassword, generateToken } from "@/lib/auth"
import { db, isoNow } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // Validate
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password and name are required" }, { status: 400 })
    }
    if (password.length < 10) {
      return NextResponse.json({ error: "Password must be at least 10 characters" }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Check uniqueness
    const existing = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    // Create user
    const passwordHash = await hashPassword(password)
    const user = await db.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name.trim(),
        displayName: name.trim(),
      },
    })

    // Seed welcome pack (fire-and-forget — non-blocking)
    seedWelcomePack(user.id)

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    })

    const response = NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: user.displayName,
      },
    })

    // Set auth cookie for middleware (httpOnly)
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

    // Companion cookie for client-side session detection (not httpOnly)
    response.cookies.set("ttg_session", "1", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    if (error instanceof Response) throw error
    console.error("Register error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/** Give 10 free potato chip bags to new users — 4 Minimon, 3 Cybermon, 3 Dracobell */
async function seedWelcomePack(userId: string) {
  try {
    // Select tazos balanced across franchises
    const [min, cyb, dra] = await Promise.all([
      db.tazo.findMany({ where: { franchise: { slug: "minimon" } }, take: 4 }),
      db.tazo.findMany({ where: { franchise: { slug: "cybermon" } }, take: 3 }),
      db.tazo.findMany({ where: { franchise: { slug: "dracobell" } }, take: 3 }),
    ])
    const selected = [...min, ...cyb, ...dra]

    if (selected.length === 0) { console.warn("No tazos available for welcome bags"); return }

    // Create 10 unopened BagPurchase records — one per tazo
    const bags = selected.map((tazo) => ({
      userId,
      bagType: "welcome",
      cost: 0,
      tazoId: tazo.id,
      opened: false,
    }))

    await db.bagPurchase.createMany({ data: bags })

    console.log(`Welcome bags seeded for user ${userId}: ${bags.length} unopened bags`)
  } catch (err) {
    console.error("Welcome pack seed error:", err)
  }
}
