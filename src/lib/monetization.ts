/**
 * Monetization system — credit packages, rewarded ads, Stripe integration.
 *
 * Architecture:
 *   1. Credit packages (Stripe) — real-money purchase of credit bundles
 *   2. Rewarded ads (AdSense) — watch an ad, earn free credits (limited per day)
 *   3. Daily bonus — free credits once per day
 *
 * Legal compliance:
 *   - All prices displayed inclusive of VAT where applicable
 *   - Refund policy accessible at /refund-policy
 *   - Terms of Service cover purchases at /terms
 *   - Privacy Policy covers payment data at /privacy
 *   - No auto-renewing subscriptions — one-time purchases only
 *   - Clear "Buy" CTAs with price before purchase
 */

import { SITE_CONFIG } from "@/lib/site-config"

// ─── Credit Package Definitions ────────────────────────────

export interface CreditPackageDef {
  id: string
  name: string
  credits: number
  priceCents: number   // in EUR cents
  bonusPct: number      // e.g. 20 = "+20% EXTRA"
  isPopular: boolean
  stripePriceId?: string
  stripePriceIdTest?: string
}

/**
 * Credit packages available for purchase.
 * Prices in EUR (approximate from USD cents).
 * Stripe Price IDs must be created in Stripe Dashboard and added here.
 */
export const CREDIT_PACKAGES: CreditPackageDef[] = [
  {
    id: "starter",
    name: "Starter Pack",
    credits: 500,
    priceCents: 299,    // €2.99
    bonusPct: 0,
    isPopular: false,
    stripePriceIdTest: "price_1ThJ3d1KB51dvcAfMaIrteyu",
  },
  {
    id: "booster",
    name: "Booster Pack",
    credits: 1200,
    priceCents: 599,    // €5.99
    bonusPct: 20,       // +20% vs base rate
    isPopular: true,
    stripePriceIdTest: "price_1ThJ3e1KB51dvcAfcUN77sOC",
  },
  {
    id: "pro",
    name: "Pro Pack",
    credits: 3000,
    priceCents: 1199,   // €11.99
    bonusPct: 50,       // +50% vs base rate
    isPopular: false,
    stripePriceIdTest: "price_1ThJ3e1KB51dvcAfHKs6kVyM",
  },
  {
    id: "mega",
    name: "Mega Pack",
    credits: 7500,
    priceCents: 2499,   // €24.99
    bonusPct: 80,       // +80% vs base rate
    isPopular: false,
    stripePriceIdTest: "price_1ThJ3f1KB51dvcAfIfWtjtJO",
  },
]

/** Format cents as EUR price string */
export function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`
}

/** Format credits with locale */
export function formatCredits(n: number): string {
  return n.toLocaleString()
}

// ─── Rewarded Ads ─────────────────────────────────────────

/** Max rewarded ads per user per day */
export const MAX_REWARDED_ADS_PER_DAY = 5

/** Credits earned per rewarded ad view */
export const REWARDED_AD_CREDITS = 20

/** Cooldown between rewarded ads (seconds) */
export const REWARDED_AD_COOLDOWN_SECONDS = 120

// ─── Stripe Helpers ───────────────────────────────────────

/** Check if Stripe is configured */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

/** Get the appropriate Stripe Price ID (test vs live) */
export function getStripePriceId(pkg: CreditPackageDef): string | undefined {
  const isLive = process.env.STRIPE_MODE === "live"
  return isLive ? pkg.stripePriceId : (pkg.stripePriceIdTest || pkg.stripePriceId)
}

// ─── Seed Data ────────────────────────────────────────────

export const SEED_CREDIT_PACKAGES = CREDIT_PACKAGES.map((pkg, i) => ({
  id: `credit-${pkg.id}`,
  name: pkg.name,
  credits: pkg.credits,
  priceCents: pkg.priceCents,
  bonusPct: pkg.bonusPct,
  isPopular: pkg.isPopular,
  isActive: true,
  sortOrder: i,
}))

// ─── Legal ────────────────────────────────────────────────

export const PURCHASE_TERMS = {
  refundWindowDays: 14,
  refundPolicyUrl: `${SITE_CONFIG.canonicalUrl}/refund-policy`,
  termsUrl: `${SITE_CONFIG.canonicalUrl}/terms`,
  privacyUrl: `${SITE_CONFIG.canonicalUrl}/privacy`,
  contactEmail: SITE_CONFIG.supportEmail,
  vatNotice:
    "Prices include VAT where applicable. Trading Tazos Game is operated by an individual developer in Spain (EU). For EU consumers, a 14-day right of withdrawal applies to digital purchases unless the service has been fully performed with your consent.",
} as const
