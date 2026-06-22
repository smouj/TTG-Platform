import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAsyncLock } from "@/lib/async-lock"

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events.
 */
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature")
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY
  if (!stripeSecret) {
    console.error("[stripe-webhook] STRIPE_SECRET_KEY not configured")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  let event: any
  try {
    const body = await req.text()
    const Stripe = await import("stripe")
    const stripe = new Stripe.default(stripeSecret)
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error(`[stripe-webhook] Signature verification failed:`, err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        const userId = session.client_reference_id || session.metadata?.userId
        const credits = parseInt(session.metadata?.credits || "0", 10)
        const packageId = session.metadata?.packageId || "unknown"

        if (!userId || !credits) {
          console.error("[stripe-webhook] Missing userId or credits in session metadata")
          return NextResponse.json({ error: "Invalid metadata" }, { status: 400 })
        }

        // Idempotency check INSIDE transaction to prevent concurrent double-spend.
        // Stripe may deliver the same event multiple times simultaneously;
        // checking outside the transaction creates a race condition.
        let alreadyProcessed = false
        await withAsyncLock(`stripe:checkout:${session.id}`, async () => {
          await prisma.$transaction(async (tx) => {
            const existing = await tx.purchase.findFirst({
              where: { stripeSessionId: session.id },
            })
            if (existing) {
              alreadyProcessed = true
              return
            }

            await tx.user.update({
              where: { id: userId },
              data: { credits: { increment: credits } },
            })
            await tx.purchase.create({
              data: {
                userId,
                packageId: `credit-${packageId}`,
                amount: credits,
                priceCents: session.amount_total || 0,
                currency: (session.currency || "eur").toUpperCase(),
                stripeSessionId: session.id,
                stripePaymentId: session.payment_intent,
                status: "completed",
              },
            })
            await tx.creditTransaction.create({
              data: {
                userId,
                amount: credits,
                source: "purchase",
                reference: session.id,
              },
            })
          })
        })

        if (alreadyProcessed) {
          console.log(`[stripe-webhook] Session ${session.id} already processed`)
          return NextResponse.json({ received: true, alreadyProcessed: true })
        }

        console.log(`[stripe-webhook] ✅ +${credits} credits to user ${userId}`)
        break
      }

      case "checkout.session.expired": {
        const session = event.data.object
        const userId = session.client_reference_id || session.metadata?.userId
        if (userId) {
          await prisma.purchase.updateMany({
            where: { stripeSessionId: session.id },
            data: { status: "failed" },
          })
        }
        break
      }

      case "charge.refunded": {
        const charge = event.data.object
        if (charge.payment_intent) {
          // Move idempotency check inside transaction to prevent double-refund
          const paymentIntent = charge.payment_intent as string
          await withAsyncLock(`stripe:refund:${paymentIntent}`, async () => {
            await prisma.$transaction(async (tx) => {
              const purchase = await tx.purchase.findFirst({
                where: { stripePaymentId: paymentIntent },
              })
              if (!purchase || purchase.status === "refunded") return

              await tx.user.update({
                where: { id: purchase.userId },
                data: { credits: { decrement: purchase.amount } },
              })
              await tx.purchase.update({
                where: { id: purchase.id },
                data: { status: "refunded", refundedAt: new Date() },
              })
              await tx.creditTransaction.create({
                data: {
                  userId: purchase.userId,
                  amount: -purchase.amount,
                  source: "refund",
                  reference: charge.id as string,
                },
              })
              console.log(`[stripe-webhook] 🔙 Refunded ${purchase.amount} credits`)
            })
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error(`[stripe-webhook] Error processing ${event.type}:`, error)
    return NextResponse.json({ received: true, error: error.message })
  }
}
