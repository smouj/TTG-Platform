// GET /api/credits — Get user credits
// NOTE: POST was removed — credit mutations must use dedicated endpoints
//       (credits/daily, admin/credits, bags/buy, etc.) which apply proper guards
import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const currentUser = await db.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    })

    return NextResponse.json({
      credits: currentUser?.credits ?? 0,
    })
  } catch {
    return NextResponse.json({ error: "Failed to get credits" }, { status: 500 })
  }
}
