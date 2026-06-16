import { NextRequest, NextResponse } from "next/server"
import { hashPassword, generateToken } from "@/lib/auth"
import { db } from "@/lib/db"
import crypto from "crypto"
import { checkRateLimit } from "@/lib/rate-limit"
import { buildEmailVerificationUrl, sendTransactionalEmailSoon } from "@/lib/email"

export async function POST(request: NextRequest) {
  // Rate limit: 5 auth attempts per minute
  const rateLimit = checkRateLimit(request.headers, "auth")
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateLimit.resetAt),
        },
      }
    )
  }
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

    // Create user with email verification token
    const passwordHash = hashPassword(password)
    const emailVerifyToken = crypto.randomBytes(24).toString('hex')
    const emailVerifyExpires = new Date(Date.now() + 86400000) // 24 hours
    const user = await db.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name.trim(),
        displayName: name.trim(),
        emailVerifyToken,
        emailVerifyExpires,
      },
    })

    // Seed welcome pack (fire-and-forget — non-blocking)
    seedWelcomePack(user.id)

    sendTransactionalEmailSoon({
      template: "welcome",
      to: user.email,
      variables: {
        name: user.displayName || user.name,
        emailVerificationUrl: buildEmailVerificationUrl(emailVerifyToken),
      },
    })

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
    response.cookies.set("ttg_auth", token, {
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

/** Give 30 welcome bags — 10 per franchise so every player can build tube decks */
async function seedWelcomePack(userId: string) {
  try {
    const franchises = ["minimon", "cybermon", "dracobell"] as const
    const PER_FRANCHISE = 10

    const results: { franchise: string; count: number }[] = []

    for (const slug of franchises) {
      const tazos = await db.tazo.findMany({
        where: { franchise: { slug }, publishStatus: "published" },
        take: PER_FRANCHISE,
      })

      if (tazos.length === 0) {
        // No published tazos for franchise (non-critical)
        continue
      }

      // Pad to exactly PER_FRANCHISE bags with repeats if needed
      const selected: typeof tazos = []
      for (let i = 0; i < PER_FRANCHISE; i++) {
        selected.push(tazos[i % tazos.length])
      }

      const bags = selected.map((tazo) => ({
        userId,
        bagType: slug,  // franchise bag type for shop display
        cost: 0,
        tazoId: tazo.id,
        opened: false,
      }))

      await db.bagPurchase.createMany({ data: bags })
      results.push({ franchise: slug, count: bags.length })
    }

    const total = results.reduce((s, r) => s + r.count, 0)
    // Welcome pack seeded
  } catch (err) {
    console.error("Welcome pack seed error:", err)
  }
}
