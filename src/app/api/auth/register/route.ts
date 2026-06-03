import { NextRequest, NextResponse } from "next/server"
import { hashPassword, generateToken } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // Validate
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password and name are required" }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
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

    // Set auth cookie for middleware
    response.cookies.set("auth_token", token, {
      httpOnly: true,
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

/** Seed welcome tazos and a starter deck for new users */
async function seedWelcomePack(userId: string) {
  try {
    // Pick 10 random tazos (balanced across franchises)
    const [pkm, dbz, digi] = await Promise.all([
      db.tazo.findMany({ where: { franchise: { slug: "pokemon" } }, take: 4, orderBy: { attack: "desc" } }),
      db.tazo.findMany({ where: { franchise: { slug: "dragon-ball-z" } }, take: 3, orderBy: { attack: "desc" } }),
      db.tazo.findMany({ where: { franchise: { slug: "digimon" } }, take: 3, orderBy: { attack: "desc" } }),
    ])
    const welcomeTazos = [...pkm, ...dbz, ...digi]

    // Add to user's collection
    for (const tazo of welcomeTazos) {
      await db.userTazo.create({
        data: { userId, tazoId: tazo.id, quantity: 1 },
      })
    }

    // Create starter deck with first 7
    const deckTazos = welcomeTazos.slice(0, 7)
    await db.deck.create({
      data: {
        userId,
        name: "Starter Squad",
        isActive: true,
        deckTazos: {
          create: deckTazos.map((t) => ({ tazoId: t.id })),
        },
      },
    })

    console.log(`Welcome pack seeded for user ${userId}: ${welcomeTazos.length} tazos + 1 deck`)
  } catch (err) {
    console.error("Welcome pack seed error:", err)
    // Non-fatal — user can still play without welcome pack
  }
}
