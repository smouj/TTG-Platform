import type { Metadata } from "next"
import PublicPageShell from "@/components/layout/public-page-shell"

export const metadata: Metadata = {
  title: "Contact — Trading Tazos Game",
  description: "Get in touch with the Trading Tazos Game team. Support, feedback, and partnership inquiries.",
  robots: "index, follow",
  alternates: { canonical: "https://tradingtazosgame.com/contact" },
  openGraph: {
    title: "Contact — Trading Tazos Game",
    description: "Get in touch with the Trading Tazos Game team.",
    url: "https://tradingtazosgame.com/contact",
    siteName: "Trading Tazos Game",
    type: "website",
  },
}

export default function ContactPage() {
  return (
    <PublicPageShell>
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-2">Contact</h1>
        <p className="text-sm font-bold text-[#1a1a1a]/40 mb-8">We&apos;d love to hear from you</p>
        
        <div className="grid gap-6 sm:grid-cols-2 mb-12">
          <div className="p-6 border-[3px] border-[#1a1a1a] bg-white shadow-[4px_4px_0px_#1a1a1a]">
            <h2 className="text-sm font-black uppercase text-[#1a1a1a] mb-3">📧 Email Support</h2>
            <a href="mailto:support@tradingtazosgame.com" className="text-sm font-bold text-[#3B4CCA] hover:underline break-all">
              support@tradingtazosgame.com
            </a>
            <p className="text-[10px] font-bold text-[#1a1a1a]/30 mt-2">We respond within 24 hours</p>
          </div>
          
          <div className="p-6 border-[3px] border-[#1a1a1a] bg-white shadow-[4px_4px_0px_#1a1a1a]">
            <h2 className="text-sm font-black uppercase text-[#1a1a1a] mb-3">🐛 Bug Reports</h2>
            <a href="https://github.com/smouj/Trading-Tazos-Game/issues" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#3B4CCA] hover:underline break-all">
              GitHub Issues
            </a>
            <p className="text-[10px] font-bold text-[#1a1a1a]/30 mt-2">Public issue tracker</p>
          </div>
        </div>

        <div className="p-6 border-[3px] border-[#1a1a1a] bg-[#FFCC00]/5 shadow-[4px_4px_0px_#1a1a1a]">
          <h2 className="text-sm font-black uppercase text-[#1a1a1a] mb-3">💬 Community</h2>
          <p className="text-xs font-bold text-[#1a1a1a]/60 leading-relaxed">
            Join our community to discuss strategies, share collections, and report bugs.
            Check the <a href="/?page=faq" className="text-[#3B4CCA] hover:underline font-black">FAQ</a> for answers to common questions.
          </p>
        </div>
      </div>
    </PublicPageShell>
  )
}
