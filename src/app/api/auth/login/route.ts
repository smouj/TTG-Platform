import { NextRequest, NextResponse } from "next/server"
import { verifyPassword, generateToken, migratePasswordIfNeeded, seedAdminUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"

// Ensure admin user exists on first request
seedAdminUser()

export async function POST(request: NextRequest) {
  // Rate limit: 5 auth attempts per minute
  const rateLimit = checkRateLimit(request.headers, "auth")
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
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
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // OAuth-only users have no password — redirect them to OAuth login
    if (!user.passwordHash) {
      const provider = user.oauthProvider || "your OAuth provider"
      return NextResponse.json({ error: `This account uses ${provider}. Please sign in with ${provider}.` }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Auto-migrate legacy bcrypt hashes to scrypt (non-blocking, fire-and-forget)
    const newHash = await migratePasswordIfNeeded(password, user.passwordHash)
    if (newHash) {
      db.user.update({ where: { id: user.id }, data: { passwordHash: newHash } })
        
    }

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
      maxAge: 60 * 60 * 24 * 7, // 7 days
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
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
