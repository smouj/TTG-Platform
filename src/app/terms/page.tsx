import type { Metadata } from "next"
import PublicPageShell from "@/components/layout/public-page-shell"
import { TERMS_SECTIONS } from "@/lib/legal-content"

export const metadata: Metadata = {
  title: "Terms of Service — Trading Tazos Game",
  description: "Terms of Service for Trading Tazos Game — rules, responsibilities, and legal terms.",
  robots: "index, follow",
  alternates: { canonical: "https://tradingtazosgame.com/terms" },
  openGraph: {
    title: "Terms of Service — Trading Tazos Game",
    description: "Rules, responsibilities, and legal terms for using the service.",
    url: "https://tradingtazosgame.com/terms",
    siteName: "Trading Tazos Game",
    type: "website",
  },
}

export default function TermsPage() {
  return (
    <PublicPageShell>
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-6">Terms of Service</h1>
        <div className="prose prose-sm font-bold text-[#1a1a1a]/70 max-w-none space-y-6">
          {TERMS_SECTIONS.map((s, i) => (
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
