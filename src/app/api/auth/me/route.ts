import { NextRequest, NextResponse } from "next/server"
import { getAuthUser, generateToken } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.slice(7) || null
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch fresh user data with counts
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        _count: {
          select: { userTazos: true, decks: true },
        },
      },
    })

    if (!fullUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Keep token payload minimal (only fields needed for auth)
    const freshToken = token || generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
    })

    const response = NextResponse.json({
      token: freshToken,
      user: {
        id: fullUser.id,
        email: fullUser.email,
        name: fullUser.name,
        displayName: fullUser.displayName,
        avatarUrl: fullUser.avatarUrl,
        bio: fullUser.bio,
        credits: fullUser.credits,
        tazoCount: fullUser._count.userTazos,
        deckCount: fullUser._count.decks,
        createdAt: fullUser.createdAt,
        // Level / XP system
        level: (fullUser as any).level ?? 1,
        xp: (fullUser as any).xp ?? 0,
        xpToNext: (fullUser as any).xpToNext ?? 100,
        totalBattles: (fullUser as any).totalBattles ?? 0,
        totalWins: (fullUser as any).totalWins ?? 0,
        totalLosses: (fullUser as any).totalLosses ?? 0,
        totalTazosOwned: (fullUser as any).totalTazosOwned ?? 0,
        totalBagsOpened: (fullUser as any).totalBagsOpened ?? 0,
        totalQuestsDone: (fullUser as any).totalQuestsDone ?? 0,
        joinDate: (fullUser as any).joinDate ?? fullUser.createdAt,
      },
    })

    // Refresh companion session cookie
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
    console.error("Me error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
