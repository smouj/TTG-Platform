// ============================================================
// Trading Tazos Game — Healthcheck API
// GET /api/health — monitoring endpoint for uptime, DB, stats
// ============================================================
import { NextResponse } from "next/server"
import { db as prisma } from "@/lib/db"
import { SITE_CONFIG } from "@/lib/site-config"

export async function GET() {
  try {
    const start = Date.now()

    // DB health check: run counts (validates connection)
    let dbConnected = false
    let tazoCount = 0, userCount = 0, deckCount = 0, questCount = 0
    
    try {
      [tazoCount, userCount, deckCount, questCount] = await Promise.all([
        prisma.tazo.count({ where: { publishStatus: "published" } }),
        prisma.user.count(),
        prisma.deck.count(),
        prisma.quest.count(),
      ])
      dbConnected = true
    } catch {
      dbConnected = false
    }
    const dbLatency = Date.now() - start

    return NextResponse.json({
      status: "ok",
      version: SITE_CONFIG.version,
      uptime: process.uptime(),
      db: { connected: dbConnected, latencyMs: dbLatency },
      counts: { tazos: tazoCount, users: userCount, decks: deckCount, quests: questCount },
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (err: any) {
    return NextResponse.json({
      status: "error",
      error: err.message || "Unknown error",
      timestamp: new Date().toISOString(),
    }, {
      status: 500,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Access-Control-Allow-Origin": "*",
      },
    })
  }
}
