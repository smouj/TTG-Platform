// ============================================================
// Trading Tazos Game — Auth Ping API
// GET /api/auth/ping — lightweight session check (cookie-based)
// Returns { authed: true, user: {...} } or { authed: false }
// No Bearer token needed — relies on ttg_auth cookie.
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { getAuthUser, generateToken } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ authed: false })
    }

    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: { _count: { select: { userTazos: true, decks: true } } },
    })

    if (!fullUser) {
      return NextResponse.json({ authed: false })
    }

    return NextResponse.json({
      authed: true,
      token: generateToken({ id: user.id, email: user.email, name: user.name, displayName: user.displayName, avatarUrl: user.avatarUrl }),
      user: {
        id: fullUser.id,
        email: fullUser.email,
        name: fullUser.name,
        displayName: fullUser.displayName,
        avatarUrl: fullUser.avatarUrl,
        tazoCount: fullUser._count.userTazos,
        deckCount: fullUser._count.decks,
      },
    })
  } catch {
    return NextResponse.json({ authed: false })
  }
}
