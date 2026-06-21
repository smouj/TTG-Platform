// ============================================================
// POST /api/promo/redeem — Redeem a promotion code
// ============================================================
import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { code?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const rawCode = (body.code || "").trim().toUpperCase()
  if (!rawCode || rawCode.length < 3 || rawCode.length > 32) {
    return NextResponse.json({ error: "Please enter a valid code (3-32 characters)" }, { status: 400 })
  }

  // Find the active promotion code
  const promo = await prisma.promotionCode.findUnique({ where: { code: rawCode } })
  if (!promo) {
    return NextResponse.json({ error: "Invalid code. Please check and try again." }, { status: 404 })
  }
  if (!promo.isActive) {
    return NextResponse.json({ error: "This code is no longer active." }, { status: 410 })
  }
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    return NextResponse.json({ error: "This code has expired." }, { status: 410 })
  }
  if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
    return NextResponse.json({ error: "This code has reached its usage limit." }, { status: 410 })
  }

  // Check if user already redeemed this code
  const existing = await prisma.promoRedemption.findUnique({
    where: { userId_promoCodeId: { userId: user.id, promoCodeId: promo.id } },
  })
  if (existing) {
    return NextResponse.json({ error: "You've already redeemed this code." }, { status: 409 })
  }

  // Check minimum level requirement
  if (promo.minLevel > 0) {
    // For now minLevel is a soft gate — could be extended with actual level system
    const userTazoCount = await prisma.userTazo.count({ where: { userId: user.id } })
    if (userTazoCount < promo.minLevel) {
      return NextResponse.json({
        error: `You need at least ${promo.minLevel} tazos to redeem this code. You currently have ${userTazoCount}.`,
      }, { status: 403 })
    }
  }

  // Apply the reward atomically (re-check conditions inside tx)
  let awarded = false
  try {
    await prisma.$transaction(async (tx) => {
      // Double-check user hasn't already redeemed (race condition between different requests)
      const alreadyRedeemed = await tx.promoRedemption.findUnique({
        where: { userId_promoCodeId: { userId: user.id, promoCodeId: promo.id } },
      })
      if (alreadyRedeemed) return

      // Claim one available use atomically before granting credits.
      const promoClaim = await tx.promotionCode.updateMany({
        where: {
          id: promo.id,
          isActive: true,
          ...(promo.maxUses > 0 ? { usedCount: { lt: promo.maxUses } } : {}),
        },
        data: { usedCount: { increment: 1 } },
      })
      if (promoClaim.count !== 1) return

      await tx.user.update({ where: { id: user.id }, data: { credits: { increment: promo.value } } })
      await tx.promoRedemption.create({
        data: { userId: user.id, promoCodeId: promo.id, rewardType: promo.type, rewardValue: promo.value },
      })
      await tx.creditTransaction.create({
        data: { userId: user.id, amount: promo.value, source: "promo_code", reference: rawCode },
      })
      awarded = true
    })
  } catch (txError) {
    console.error('Promo redeem transaction error:', txError)
    return NextResponse.json({ error: 'This code has reached its usage limit.' }, { status: 410 })
  }

  if (!awarded) {
    return NextResponse.json({ error: 'This code has reached its usage limit.' }, { status: 410 })
  }

  return NextResponse.json({
    success: true,
    message: `Success! ${promo.value} credits have been added to your account.`,
    creditsAwarded: promo.value,
  })
}
