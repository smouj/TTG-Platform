import PublicPageShell from "@/components/layout/public-page-shell"
import Link from "next/link"

const faqs = [
  {
    q: "What is Trading Tazos Game?",
    a: "Trading Tazos Game is a browser-based skill game where you collect, trade, and battle with digital tazos. Album, shop, deck, and scanner views stay clear and readable in 2D; matches use a 3D arena where you aim, charge power, and throw your tazos. 319 verified tazos from 3 classic Spanish collections, with 9 combat stats each."
  },
  {
    q: "Is it free to play?",
    a: "Yes, completely free. Credits are earned by battling, completing quests, and daily logins, then used to open tazo bags and grow your collection."
  },
  {
    q: "How do I get started?",
    a: "1. Create a free account. 2. You'll receive a Welcome Pack with 10 starter tazos and a pre-built deck. 3. Head to the Battle Arena and start playing, or open tazo bags in the Shop to expand your collection."
  },
  {
    q: "How does the battle system work?",
    a: "Each turn you select a tazo, aim horizontally and vertically with timing-based precision, charge power, and throw. The tazo enters a 3D battle arena where it can collide with and flip rival tazos. Flip all rival tazos to win. Strategy matters — overpowering can cause self-flips or out-of-bounds throws."
  },
  {
    q: "What are tazo stats and roles?",
    a: "Each tazo has 9 combat stats (Attack, Defense, Resistance, Weight, Stability, Spin, Control, Bounce, Precision) and 1 of 8 roles (Attacker, Tank, Technical, Bouncer, Heavy, Light, Balanced, Special). Stats and roles determine performance in battle."
  },
  {
    q: "Can I play on mobile?",
    a: "Yes! Trading Tazos Game is a PWA (Progressive Web App). Visit medaclawarena.com on your phone and install it to your home screen for a full-screen app experience. Desktop users can also download the Linux Electron app; Windows and macOS builds are planned."
  },
  {
    q: "What are credits and how do I earn them?",
    a: "Credits are the in-game currency used to open tazo bags in the Shop. Earn credits by winning battles (+30), logging in daily (+25), and completing quests (+50-200)."
  },
  {
    q: "How do quests and achievements work?",
    a: "The quest system has 17 quests across 4 categories: Beginner, Daily, Weekly, and Special. Complete quests to earn credits. The achievement system has 18 achievements with 4 tiers (Bronze → Silver → Gold → Platinum)."
  },
  {
    q: "What are the collections?",
    a: "Three collections of verified Spanish tazos: Minimon (51 tazos, Matutano 2000), Dracobell (118 tazos, Matutano 1995, 7 categories), and Cybermon (150 tazos, Magic Box 2000). 319 tazos total."
  },
  {
    q: "Can I play against friends?",
    a: "PvP uses WebSocket matchmaking and is being kept behind account and deck requirements while the live service is tested. Both players need an account and an active battle deck of 5 tazos."
  },
  {
    q: "Is there a desktop app?",
    a: "Yes, an Electron desktop app is available for Linux (.AppImage and .deb). Windows and macOS builds are coming via CI/CD. Download from the Downloads page or GitHub Releases."
  },
  {
    q: "What is the CLI tool?",
    a: "The @trading-tazos-game/cli npm package lets you search, inspect, and simulate battles from your terminal. Install with: npm install -g @trading-tazos-game/cli"
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
          <p className="text-sm font-bold text-[#1a1a1a]/60 mb-4">Email us and we'll get back to you within 24 hours.</p>
          <a href="mailto:support@medaclawarena.com" className="mag-btn inline-block bg-[#1a1a1a] text-white border-2 border-[#1a1a1a] px-6 py-3 text-xs font-black uppercase tracking-wider shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1a1a1a] transition-all">
            support@medaclawarena.com
          </a>
        </div>
      </div>
    </PublicPageShell>
  )
}
