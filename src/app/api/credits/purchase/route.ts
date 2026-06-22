import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { withAsyncLock } from "@/lib/async-lock"
import { prisma } from "@/lib/prisma"
import { CREDIT_PACKAGES, isStripeConfigured, getStripePriceId } from "@/lib/monetization"
import { SITE_CONFIG } from "@/lib/site-config"

/**
 * POST /api/credits/purchase
 * Create a Stripe Checkout Session for a credit package.
 *
 * Body: { packageId: string }
 * Returns: { url: string } — redirect to Stripe Checkout
 */
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req as unknown as Request)
  if (!authUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { packageId } = await req.json().catch(() => ({}))
  if (!packageId) {
    return NextResponse.json({ error: "packageId is required" }, { status: 400 })
  }

  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId)
  if (!pkg) {
    return NextResponse.json({ error: "Invalid package" }, { status: 400 })
  }

  if (!isStripeConfigured() && process.env.NODE_ENV === "production") {
    console.error("[purchase] STRIPE_SECRET_KEY is not configured in production")
    return NextResponse.json(
      { error: "Payment service unavailable. Please try again later." },
      { status: 503 }
    )
  }

  if (!isStripeConfigured()) {
    // ── Dev mode: grant credits directly (atomic) ──
    // Rate limit: 1 purchase per 10 seconds in dev mode
    const txResult = await withAsyncLock(`credits:purchase:dev:${authUser.id}`, () => prisma.$transaction(async (tx) => {
      const recentPurchase = await tx.purchase.findFirst({
        where: {
          userId: authUser.id,
          status: "completed",
          createdAt: { gte: new Date(Date.now() - 10000) },
        },
      })
      if (recentPurchase) {
        return { rateLimited: true as const, credits: 0 }
      }

      const updated = await tx.user.update({
        where: { id: authUser.id },
        data: { credits: { increment: pkg.credits } },
      })
      await tx.purchase.create({
        data: {
          userId: authUser.id,
          packageId: `credit-${pkg.id}`,
          amount: pkg.credits,
          priceCents: 0,
          currency: "EUR",
          status: "completed",
        },
      })
      await tx.creditTransaction.create({
        data: {
          userId: authUser.id,
          amount: pkg.credits,
          source: "purchase",
          reference: `dev-${pkg.id}`,
        },
      })

      return { rateLimited: false as const, credits: updated.credits }
    }))

    if (txResult.rateLimited) {
      return NextResponse.json({
        error: "Please wait before purchasing again",
      }, { status: 429 })
    }

    return NextResponse.json({
      success: true,
      dev: true,
      credits: txResult.credits,
      message: `+${pkg.credits} credits (dev mode — Stripe not configured)`,
    })
  }

  // ── Production: Stripe Checkout ──
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY
    if (!stripeSecret) {
      console.error("[purchase] STRIPE_SECRET_KEY is not configured")
      return NextResponse.json(
        { error: "Payment service unavailable. Please try again later." },
        { status: 503 }
      )
    }

    const Stripe = await import("stripe")
    const stripe = new Stripe.default(stripeSecret)

    const priceId = getStripePriceId(pkg)

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: authUser.id,
      metadata: {
        userId: authUser.id,
        packageId: pkg.id,
        credits: String(pkg.credits),
        source: "ttg-credit-shop",
      },
      line_items: [
        {
          price_data: priceId
            ? undefined
            : {
                currency: "eur",
                product_data: {
                  name: `${pkg.name} — ${pkg.credits} Credits`,
                  description: `${SITE_CONFIG.name} in-game currency${pkg.bonusPct > 0 ? ` (+${pkg.bonusPct}% bonus)` : ""}`,
                },
                unit_amount: pkg.priceCents,
              },
          price: priceId || undefined,
          quantity: 1,
        },
      ],
      success_url: `${SITE_CONFIG.canonicalUrl}/app/shop?purchase=success&credits=${pkg.credits}`,
      cancel_url: `${SITE_CONFIG.canonicalUrl}/app/shop?purchase=cancelled`,
      billing_address_collection: "auto",
      tax_id_collection: { enabled: true },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error("[purchase] Stripe error:", error)
    return NextResponse.json(
      { error: "Payment service unavailable. Please try again later." },
      { status: 502 }
    )
  }
}
