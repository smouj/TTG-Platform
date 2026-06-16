import type { Metadata } from "next"
import PublicPageShell from "@/components/layout/public-page-shell"
import { COOKIE_SECTIONS } from "@/lib/legal-content"

export const metadata: Metadata = {
  title: "Cookie Policy — Trading Tazos Game",
  description: "Cookie Policy for Trading Tazos Game — what cookies we use and how to manage them.",
  robots: "index, follow",
  alternates: { canonical: "https://tradingtazosgame.com/cookies" },
  openGraph: {
    title: "Cookie Policy — Trading Tazos Game",
    description: "What cookies we use and how to manage them.",
    url: "https://tradingtazosgame.com/cookies",
    siteName: "Trading Tazos Game",
    type: "website",
  },
}

export default function CookiesPage() {
  return (
    <PublicPageShell>
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-6">Cookie Policy</h1>
        <div className="prose prose-sm font-bold text-[#1a1a1a]/70 max-w-none space-y-6">
          {COOKIE_SECTIONS.map((s, i) => (
            <section key={i}>
              <h2 className="text-lg font-black text-[#1a1a1a] uppercase tracking-wide mb-2">{s.title}</h2>
              <p className="whitespace-pre-wrap leading-relaxed">{s.body}</p>
            </section>
          ))}
          <p className="text-[10px] text-[#1a1a1a]/30 pt-8">Last updated: June 2026</p>
        </div>
      </div>
    </PublicPageShell>
  )
}
