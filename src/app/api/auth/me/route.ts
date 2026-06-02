import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
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

    return NextResponse.json({
      user: {
        id: fullUser.id,
        email: fullUser.email,
        name: fullUser.name,
        displayName: fullUser.displayName,
        avatarUrl: fullUser.avatarUrl,
        tazoCount: fullUser._count.userTazos,
        deckCount: fullUser._count.decks,
        createdAt: fullUser.createdAt,
      },
    })
  } catch (error) {
    if (error instanceof Response) throw error
    console.error("Me error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
