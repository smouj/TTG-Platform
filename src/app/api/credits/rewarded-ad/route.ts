import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MAX_REWARDED_ADS_PER_DAY, REWARDED_AD_CREDITS, REWARDED_AD_COOLDOWN_SECONDS } from "@/lib/monetization"

/**
 * POST /api/credits/rewarded-ad
 * Claim credits after watching a rewarded ad.
 * Rate-limited per user to prevent abuse.
 */
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req as unknown as Request)
  if (!authUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = authUser.id
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // ── Rate limit: max per day ──
  const todayCount = await prisma.creditTransaction.count({
    where: {
      userId,
      source: "rewarded_ad",
      createdAt: { gte: today },
    },
  })

  if (todayCount >= MAX_REWARDED_ADS_PER_DAY) {
    return NextResponse.json(
      {
        error: `You've reached the daily limit of ${MAX_REWARDED_ADS_PER_DAY} rewarded ads. Come back tomorrow!`,
        remaining: 0,
        resetsAt: new Date(today.getTime() + 86400000),
      },
      { status: 429 }
    )
  }

  // ── Cooldown between ads ──
  const lastAd = await prisma.creditTransaction.findFirst({
    where: { userId, source: "rewarded_ad" },
    orderBy: { createdAt: "desc" },
  })

  if (lastAd) {
    const cooldownMs = REWARDED_AD_COOLDOWN_SECONDS * 1000
    const elapsed = Date.now() - lastAd.createdAt.getTime()
    if (elapsed < cooldownMs) {
      const waitSeconds = Math.ceil((cooldownMs - elapsed) / 1000)
      return NextResponse.json(
        {
          error: `Please wait ${waitSeconds}s before claiming another rewarded ad.`,
          cooldownRemaining: waitSeconds,
        },
        { status: 429 }
      )
    }
  }

  // ── Grant credits atomically to prevent race conditions ──
  // Re-checks daily cap and cooldown inside transaction
  const txResult = await prisma.$transaction(async (tx) => {
    // Re-check daily cap inside transaction
    const recentCount = await tx.creditTransaction.count({
      where: { userId, source: "rewarded_ad", createdAt: { gte: today } },
    })
    if (recentCount >= MAX_REWARDED_ADS_PER_DAY) {
      return { blocked: true as const, remaining: 0, credits: 0 }
    }

    // Re-check cooldown inside transaction
    const recent = await tx.creditTransaction.findFirst({
      where: { userId, source: "rewarded_ad" },
      orderBy: { createdAt: "desc" },
    })
    if (recent) {
      const elapsed = Date.now() - recent.createdAt.getTime()
      if (elapsed < REWARDED_AD_COOLDOWN_SECONDS * 1000) {
        return { blocked: true as const, remaining: 0, credits: 0 }
      }
    }

    const updated = await tx.user.update({
      where: { id: userId },
      data: { credits: { increment: REWARDED_AD_CREDITS } },
    })

    await tx.creditTransaction.create({
      data: {
        userId,
        amount: REWARDED_AD_CREDITS,
        source: "rewarded_ad",
        reference: `ad_${Date.now()}`,
      },
    })

    const remaining = MAX_REWARDED_ADS_PER_DAY - recentCount - 1
    return { blocked: false as const, remaining, credits: updated.credits }
  })

  if (txResult.blocked) {
    return NextResponse.json(
      {
        error: `You've reached the daily limit of ${MAX_REWARDED_ADS_PER_DAY} rewarded ads.`,
        remaining: txResult.remaining,
        resetsAt: new Date(today.getTime() + 86400000),
      },
      { status: 429 }
    )
  }

  return NextResponse.json({
    success: true,
    credits: txResult.credits,
    earned: REWARDED_AD_CREDITS,
    remaining: txResult.remaining,
    dailyLimit: MAX_REWARDED_ADS_PER_DAY,
  })
}

/**
 * GET /api/credits/rewarded-ad
 * Check daily ad status without claiming.
 */
export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req as unknown as Request)
  if (!authUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = authUser.id
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayCount = await prisma.creditTransaction.count({
    where: {
      userId,
      source: "rewarded_ad",
      createdAt: { gte: today },
    },
  })

  const lastAd = await prisma.creditTransaction.findFirst({
    where: { userId, source: "rewarded_ad" },
    orderBy: { createdAt: "desc" },
  })

  let cooldownRemaining = 0
  if (lastAd) {
    const elapsed = Date.now() - lastAd.createdAt.getTime()
    const cooldownMs = REWARDED_AD_COOLDOWN_SECONDS * 1000
    cooldownRemaining = Math.max(0, Math.ceil((cooldownMs - elapsed) / 1000))
  }

  return NextResponse.json({
    used: todayCount,
    remaining: MAX_REWARDED_ADS_PER_DAY - todayCount,
    dailyLimit: MAX_REWARDED_ADS_PER_DAY,
    reward: REWARDED_AD_CREDITS,
    cooldownRemaining,
  })
}
