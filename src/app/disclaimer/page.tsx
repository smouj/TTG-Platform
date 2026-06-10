import PublicPageShell from "@/components/layout/public-page-shell"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Disclaimer — Trading Tazos Game",
  description: "Legal disclaimer for Trading Tazos Game — an independent fictional digital tazo game. Not affiliated with any third-party brand.",
  robots: "index, follow",
  alternates: {
    canonical: "https://tradingtazosgame.com/disclaimer",
    languages: {
      "en": "https://tradingtazosgame.com/disclaimer",
      "es": "https://tradingtazosgame.com/disclaimer?lang=es",
    },
  },
  openGraph: {
    title: "Disclaimer — Trading Tazos Game",
    description: "Independent fictional digital tazo game — not affiliated with any third-party brand.",
    url: "https://tradingtazosgame.com/disclaimer",
    siteName: "Trading Tazos Game",
    type: "website",
  },
}

export default function DisclaimerPage() {
  return (
    <PublicPageShell>
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-6">Disclaimer</h1>
        <div className="prose prose-sm font-bold text-[#1a1a1a]/70 max-w-none space-y-4">
          <p><strong>Last updated:</strong> June 10, 2026</p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">1. Fan-Made Experience</h2>
          <p>
            Trading Tazos Game is a fan-made digital collectible experience. It is not affiliated with, endorsed by,
            or connected to any tazo manufacturer, snack brand, or original franchise. Minimon, Dracobell, and Cybermon
            are completely original fictional IPs created for this game. Any resemblance to existing franchises is coincidental.
          </p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">2. No Warranty</h2>
          <p>
            The service is provided &ldquo;as is&rdquo; without any warranty, express or implied.
            We do not guarantee that the service will be error-free, uninterrupted, or secure.
            Gameplay features, stats, and balances may change as the game evolves.
          </p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">3. Virtual Items</h2>
          <p>
            All items in TTG — tazos, credits, bags, and collectibles — are virtual and have no real-world monetary value.
            They cannot be exchanged for real currency, goods, or services. Purchases of virtual currency are final
            and non-refundable except as required by applicable law.
          </p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">4. Scanner Feature</h2>
          <p>
            The scanner feature is provided for entertainment purposes. Image recognition results are not guaranteed
            to be accurate or complete. Do not rely on the scanner for authentication or valuation of physical items.
            By using the scanner, you confirm you have the right to upload the images you submit.
          </p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">5. External Links</h2>
          <p>
            Our website may link to external sites (e.g. GitHub, social media). We are not responsible for the content,
            privacy practices, or availability of these third-party services.
          </p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">6. Content Removal</h2>
          <p>
            If you believe any content on TTG infringes your rights or violates our policies, contact
            us at <a href="mailto:support@tradingtazosgame.com" className="text-[#E3350D] underline">support@tradingtazosgame.com</a>.
            We will review and respond within 48 hours.
          </p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">7. Contact</h2>
          <p>Email: <a href="mailto:support@tradingtazosgame.com" className="text-[#E3350D] underline">support@tradingtazosgame.com</a></p>
        </div>
      </div>
    </PublicPageShell>
  )
}
