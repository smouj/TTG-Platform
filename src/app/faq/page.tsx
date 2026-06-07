import PublicPageShell from "@/components/layout/public-page-shell"
import Link from "next/link"

const faqs = [
  {
    q: "What is Trading Tazos Game?",
    a: "Trading Tazos Game is a browser-based skill game where you collect and battle with digital tazos. Open bags to discover 319 unique tazos across 3 franchises — Minimon, Dracobell, and Cybermon. Build decks of 5, then enter the 3D arena where aim, power, and spin determine victory."
  },
  {
    q: "Is it free to play?",
    a: "Yes, completely free. You start with 10 free bags and earn credits by battling, completing quests, and daily logins — no credit card required."
  },
  {
    q: "How do I get started?",
    a: "Create a free account, open your 10 welcome bags in the Shop to discover your first tazos, build a deck of 5, and head to the Battle Arena to fight AI opponents."
  },
  {
    q: "How does the battle system work?",
    a: "Each turn you aim a crosshair on the 3D arena, charge your throw power with timing-based precision, and select a spin type (topspin, backspin, sidespin, or none). Your tazo slides across the arena — hit opponent tazos hard enough and they flip, capturing them. Win by capturing all opponent tazos or depleting their HP."
  },
  {
    q: "What are the combat stats?",
    a: "Each tazo has 9 stats: Attack, Defense, Resistance, Weight, Stability, Spin, Control, Bounce, and Precision. Stats determine throw accuracy, flip power, bounce behavior, and ring-out resistance. Building a balanced deck with complementary stats is key to winning."
  },
  {
    q: "Can I play on mobile?",
    a: "Yes! Trading Tazos Game is a PWA. Visit medaclawarena.com on your phone, install it to your home screen, and play full-screen. Desktop versions are also available on Windows, macOS, and Linux."
  },
  {
    q: "How do credits work?",
    a: "Credits are the in-game currency used to buy tazo bags in the Shop. Earn them by winning battles, completing quests, and daily login bonuses."
  },
  {
    q: "What quests and achievements are there?",
    a: "There are 17 quests across 4 categories (Beginner, Daily, Weekly, Special) and 18 achievements with 4 tiers (Bronze → Silver → Gold → Platinum). Complete them to earn credits and recognition."
  },
  {
    q: "What are the 3 franchises?",
    a: "Minimon (51 tazos, creature adventure theme), Dracobell (118 tazos, martial arts and dragon warriors), and Cybermon (150 tazos, digital companions and neon tech). 319 tazos total."
  },
  {
    q: "Can I play against friends?",
    a: "Friend battles now support WebSocket room codes for matchmaking. Practice AI battles are the fully playable mode today; turn-by-turn PvP sync is being rolled out in stages."
  },
  {
    q: "Is there a desktop app?",
    a: "Yes — native desktop apps for Windows (.exe), macOS (.dmg, Intel and Apple Silicon), and Linux (.AppImage and .deb). Download from the Downloads page or GitHub Releases."
  },
]

export default function FAQPage() {
  return (
    <PublicPageShell>
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-4">FAQ</h1>
        <p className="text-lg font-bold text-[#1a1a1a]/60 mb-10">Frequently asked questions about Trading Tazos Game.</p>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] bg-white group">
              <summary className="p-5 cursor-pointer font-black uppercase text-sm text-[#1a1a1a] hover:bg-[#FFCC00] transition-colors list-none flex items-center justify-between">
                {faq.q}
                <span className="text-lg ml-2 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="px-5 pb-5">
                <p className="text-sm font-bold text-[#1a1a1a]/60 leading-relaxed">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-12 text-center p-8 border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] bg-[#FFCC00]">
          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mb-2">Still have questions?</h2>
          <p className="text-sm font-bold text-[#1a1a1a]/60 mb-4">Reach out and we&apos;ll get back to you.</p>
          <a href="mailto:support@medaclawarena.com" className="inline-block bg-[#1a1a1a] text-white border-3 border-[#1a1a1a] px-6 py-3 text-xs font-black uppercase tracking-wider shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1a1a1a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
            support@medaclawarena.com
          </a>
        </div>
      </div>
    </PublicPageShell>
  )
}
