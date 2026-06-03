import type { Metadata } from "next"
import Link from "next/link"
import PublicPageShell from "@/components/layout/public-page-shell"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Collect, Trade & Battle 319 Classic Tazos",
  description:
    "Trading Tazos Game is a skill-based physical tazo battle game. Aim, throw, flip, and capture in a real-time physics arena. Build your collection of 319 tazos across Minimon, Dracobell, and Cybermon.",
  openGraph: {
    title: "Trading Tazos Game — Aim. Throw. Flip. Capture.",
    description:
      "319 classic tazos. 9 combat stats. Real-time physics arena. Battle your friends online.",
    images: [{ url: "/logo/social-preview.png", width: 1200, height: 630 }],
  },
}

const collections = [
  { name: "Minimon", count: 51, color: "#FFCC00", year: 2000, desc: "51 tazos from the original Matutano collection. Classic favorites with balanced stats." },
  { name: "Dracobell", count: 118, color: "#FF6B00", year: 1995, desc: "118 tazos across 7 categories. The largest collection with the most variety." },
  { name: "Cybermon", count: 150, color: "#00B4D8", year: 2000, desc: "150 tazos from Magic Box. The biggest digital-era collection with Cybermon evolutions." },
]

const features = [
  { title: "Battle Arena", icon: "⚔️", desc: "Real-time physics arena. Aim, charge power, and throw your tazos to flip and capture rival tazos." },
  { title: "Collect Album", icon: "📚", desc: "319 verified tazos across 3 collections. Filter by franchise, rarity, category. Track your progress." },
  { title: "Deck Builder", icon: "🃏", desc: "Build your dream team of 5. 8 combat roles. 9 unique stats per tazo. Synergize your strategy." },
  { title: "Tazo Shop", icon: "🛍️", desc: "Open 3D tazo bags with tear animation. Standard, Premium, and Mega bags with rarity boost." },
  { title: "Quests System", icon: "🎯", desc: "17 quests across 4 categories. Daily, weekly, and special challenges. Earn credits and rewards." },
  { title: "Leaderboard", icon: "🏆", desc: "Global rankings. Compete by credits earned, tazos collected, or battles won. Be the champion." },
]

export default function LandingPage() {
  return (
    <PublicPageShell>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-[#FFCC00] border-b-4 border-[#1a1a1a]">
        <div className="mag-stripes absolute inset-0 opacity-[0.06]" />
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24 lg:py-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="inline-block bg-[#E3350D] text-white text-xs font-black uppercase px-3 py-1 border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] mb-5 tracking-[0.15em]">
                Free to Play — Browser & Desktop
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-[1.05] text-[#1a1a1a] mb-5">
                Aim. Throw.<br />
                <span className="text-[#E3350D]">Flip.</span> Capture.
              </h1>
              <p className="text-base sm:text-lg font-bold text-[#1a1a1a]/70 max-w-lg mb-8">
                319 classic tazos. 9 combat stats. Real-time physics arena. This is <strong>not</strong> an auto-battle card game — you physically aim, charge power, and throw your tazos.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="mag-btn inline-block bg-[#E3350D] text-white border-2 border-[#1a1a1a] px-8 py-4 text-sm font-black uppercase tracking-wider shadow-[6px_6px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#1a1a1a] transition-all"
                >
                  Start Your Collection
                </Link>
                <Link
                  href="/how-to-play"
                  className="mag-btn inline-block bg-white text-[#1a1a1a] border-2 border-[#1a1a1a] px-8 py-4 text-sm font-black uppercase tracking-wider shadow-[6px_6px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#1a1a1a] transition-all"
                >
                  How to Play
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-80 h-80">
                <div className="absolute inset-0 bg-[#1a1a1a] border-4 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a] rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-8xl">🎴</div>
                    <p className="text-white font-black text-xs tracking-[0.2em] mt-2">TRADING TAZOS</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUE PROP ── */}
      <section className="py-16 sm:py-20 bg-[#fffbe6] border-b-3 border-[#1a1a1a]">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-black uppercase text-[#1a1a1a] mb-4">
            Not an Auto-Battle Card Game
          </h2>
          <p className="text-base sm:text-lg font-bold text-[#1a1a1a]/60 max-w-2xl mx-auto">
            Other games compare stats. Here, <strong>you throw the tazo</strong>. Your aim, your power, your strategy. Every battle is a physical challenge — overpower and you might flip yourself. Miss and your tazo is vulnerable on the field.
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 sm:py-20 bg-white border-b-3 border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-black uppercase text-[#1a1a1a] mb-12 text-center">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Collect", desc: "Open tazo bags, scan physical tazos, and build your collection of 319 tazos." },
              { step: "2", title: "Build Deck", desc: "Choose 5 tazos for your battle deck. Balance 8 roles and 9 stats for your strategy." },
              { step: "3", title: "Enter Arena", desc: "Face off in a 2D physics arena. Aim with precision, charge your power, and release." },
              { step: "4", title: "Flip & Capture", desc: "Impact rival tazos to flip them. Chain rebounds. Capture them all to win." },
            ].map((item) => (
              <div key={item.step} className="border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] bg-[#FFCC00] p-5 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 border-3 border-[#1a1a1a] bg-white text-[#E3350D] text-2xl font-black mb-4">
                  {item.step}
                </div>
                <h3 className="text-base font-black uppercase text-[#1a1a1a] mb-2">{item.title}</h3>
                <p className="text-sm font-bold text-[#1a1a1a]/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COLLECTIONS ── */}
      <section className="py-16 sm:py-20 bg-[#fffbe6] border-b-3 border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-black uppercase text-[#1a1a1a] mb-3 text-center">
            Three Legendary Collections
          </h2>
          <p className="text-base font-bold text-[#1a1a1a]/60 text-center mb-10 max-w-xl mx-auto">
            319 verified tazos from the golden age of Spanish collections. Every tazo with 9 unique combat stats.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {collections.map((c) => (
              <Link
                key={c.name}
                href={`/collections/${c.name.toLowerCase()}`}
                className="border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] bg-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#1a1a1a] transition-all p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-4 h-4 border-2 border-[#1a1a1a]" style={{ backgroundColor: c.color }} />
                  <h3 className="text-lg font-black uppercase text-[#1a1a1a]">{c.name}</h3>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-4xl font-black text-[#1a1a1a]">{c.count}</span>
                  <span className="text-sm font-bold uppercase text-[#1a1a1a]/50">tazos</span>
                  <span className="ml-auto text-xs font-bold bg-[#FFCC00] px-2 py-1 border-2 border-[#1a1a1a]">{c.year}</span>
                </div>
                <p className="text-sm font-bold text-[#1a1a1a]/60">{c.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-16 sm:py-20 bg-white border-b-3 border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-black uppercase text-[#1a1a1a] mb-12 text-center">
            Everything You Need
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] p-5">
                <div className="text-2xl mb-2">{f.icon}</div>
                <h3 className="text-sm font-black uppercase text-[#1a1a1a] mb-1">{f.title}</h3>
                <p className="text-xs font-bold text-[#1a1a1a]/60 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 sm:py-20 bg-[#E3350D] border-b-4 border-[#1a1a1a]">
        <div className="mag-stripes absolute inset-0 opacity-[0.04]" />
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl font-black uppercase text-white mb-4">
            Start Your Collection Today
          </h2>
          <p className="text-base font-bold text-white/80 mb-8 max-w-lg mx-auto">
            Free to play. No pay-to-win. All 319 tazos are earnable through gameplay. Join the arena and start flipping.
          </p>
          <Link
            href="/register"
            className="mag-btn inline-block bg-[#FFCC00] text-[#1a1a1a] border-2 border-[#1a1a1a] px-10 py-4 text-sm font-black uppercase tracking-wider shadow-[6px_6px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#1a1a1a] transition-all"
          >
            Create Free Account
          </Link>
          <p className="text-xs font-bold text-white/50 mt-4">
            Already have an account? <Link href="/login" className="underline underline-offset-4 hover:text-white">Sign in</Link>
          </p>
        </div>
      </section>
    </PublicPageShell>
  )
}
