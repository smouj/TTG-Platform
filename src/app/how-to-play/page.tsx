import PublicPageShell from "@/components/layout/public-page-shell"
import Link from "next/link"

export default function HowToPlayPage() {
  return (
    <PublicPageShell>
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-4">How to Play</h1>
        <p className="text-lg font-bold text-[#1a1a1a]/60 mb-10">From your first bag to your first victory — everything you need to know.</p>

        <div className="space-y-10">
          {/* Step 1 */}
          <section className="border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] bg-white p-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="inline-flex items-center justify-center w-12 h-12 border-3 border-[#1a1a1a] bg-[#FFCC00] text-xl font-black text-[#1a1a1a]">1</span>
              <h2 className="text-xl font-black uppercase text-[#1a1a1a]">Create Your Account</h2>
            </div>
            <p className="text-sm font-bold text-[#1a1a1a]/60 leading-relaxed">
              Sign up for free — you&apos;ll receive <strong>10 free bags</strong> with surprise tazos inside. Open them in the Shop to start your collection. No credit card required — the game is completely free to play.
            </p>
            <Link href="/register" className="inline-block mt-3 text-xs font-black text-[#E3350D] uppercase underline underline-offset-4 hover:text-[#1a1a1a] transition-colors">
              Create free account →
            </Link>
          </section>

          {/* Step 2 */}
          <section className="border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] bg-white p-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="inline-flex items-center justify-center w-12 h-12 border-3 border-[#1a1a1a] bg-[#FF6B00] text-xl font-black text-white">2</span>
              <h2 className="text-xl font-black uppercase text-[#1a1a1a]">Open Bags & Collect Tazos</h2>
            </div>
            <div className="text-sm font-bold text-[#1a1a1a]/60 space-y-2 leading-relaxed">
              <p>Each bag contains a random tazo from the collection. Open them to reveal what&apos;s inside:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Standard Bags</strong> — Common and uncommon tazos</li>
                <li><strong>Premium Bags</strong> — Better odds for rare tazos</li>
                <li><strong>Mega Bags</strong> — Highest chance for ultra rare and legendary</li>
              </ul>
              <p>You can buy more bags with credits — earned by winning battles and completing quests.</p>
            </div>
          </section>

          {/* Step 3 */}
          <section className="border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] bg-white p-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="inline-flex items-center justify-center w-12 h-12 border-3 border-[#1a1a1a] bg-[#3B4CCA] text-xl font-black text-white">3</span>
              <h2 className="text-xl font-black uppercase text-[#1a1a1a]">Build Your Battle Deck</h2>
            </div>
            <div className="text-sm font-bold text-[#1a1a1a]/60 space-y-2 leading-relaxed">
              <p>Choose <strong>5 tazos</strong> to form your battle deck. Each tazo has <strong>9 combat stats</strong>:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Attack</strong> — Impact power on opponent tazos</li>
                <li><strong>Defense</strong> — Resistance to being flipped</li>
                <li><strong>Resistance</strong> — Stays in place under pressure</li>
                <li><strong>Weight</strong> — Mass for pushing power</li>
                <li><strong>Stability</strong> — Prevents ring-outs and knockbacks</li>
                <li><strong>Spin</strong> — Maintains momentum after landing</li>
                <li><strong>Control</strong> — Reduces throw deviation</li>
                <li><strong>Bounce</strong> — Improves wall rebounds</li>
                <li><strong>Precision</strong> — Better aim accuracy</li>
              </ul>
              <p>Balance high-attack tazos with defensive ones for the best results.</p>
            </div>
          </section>

          {/* Step 4 */}
          <section className="border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] bg-white p-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="inline-flex items-center justify-center w-12 h-12 border-3 border-[#1a1a1a] bg-[#E3350D] text-xl font-black text-white">4</span>
              <h2 className="text-xl font-black uppercase text-[#1a1a1a]">Enter the Battle Arena</h2>
            </div>
            <div className="text-sm font-bold text-[#1a1a1a]/60 space-y-3 leading-relaxed">
              <p>Head to the Battle Arena and challenge AI opponents. Each turn has 3 phases:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Aim</strong> — Position the crosshair where you want your tazo to land</li>
                <li><strong>Power</strong> — Charge your throw strength with timing-based precision</li>
                <li><strong>Spin</strong> — Choose topspin, backspin, sidespin, or none</li>
              </ul>
              <p>Your tazo slides across the 3D arena, bouncing off walls and colliding with opponent tazos. Hit hard enough and you&apos;ll <strong>flip</strong> them — capturing them for points and removing them from play.</p>
            </div>
          </section>

          {/* Step 5 */}
          <section className="border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] bg-white p-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="inline-flex items-center justify-center w-12 h-12 border-3 border-[#1a1a1a] bg-[#1a1a1a] text-xl font-black text-[#FFCC00]">5</span>
              <h2 className="text-xl font-black uppercase text-[#1a1a1a]">Master the Risk System</h2>
            </div>
            <div className="text-sm font-bold text-[#1a1a1a]/60 space-y-3 leading-relaxed">
              <p>Power management is the key to victory. The more power you charge, the harder you hit — but the less accurate your throw becomes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Low power</strong> — Safe, accurate, but weak impact</li>
                <li><strong>Medium power</strong> — Balanced throw with decent flip chance</li>
                <li><strong>High power</strong> — Strong impact, flips most tazos on contact</li>
                <li><strong>Maximum power</strong> — Devastating hit, but hard to control — risking a ring-out</li>
              </ul>
              <p>If your tazo flies <strong>out of bounds</strong>, it&apos;s removed from play. Every throw is a calculated risk.</p>
            </div>
          </section>

          {/* Step 6 */}
          <section className="border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] bg-white p-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="inline-flex items-center justify-center w-12 h-12 border-3 border-[#1a1a1a] bg-[#E3350D] text-xl font-black text-white">★</span>
              <h2 className="text-xl font-black uppercase text-[#1a1a1a]">Keep Progressing</h2>
            </div>
            <div className="text-sm font-bold text-[#1a1a1a]/60 space-y-3 leading-relaxed">
              <p>There&apos;s always something to do:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Complete <strong>17 quests</strong> across 4 categories for bonus credits</li>
                <li>Earn <strong>18 achievements</strong> — from Bronze to Platinum tiers</li>
                <li>Open more <strong>tazo bags</strong> with your earned credits</li>
                <li>Climb the <strong>global leaderboard</strong></li>
                <li>Challenge harder <strong>AI opponents</strong> — Novice, Skilled, and Master</li>
                <li>Collect all <strong>319 tazos</strong> across 3 franchises</li>
              </ul>
            </div>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link href="/register" className="inline-block bg-[#E3350D] text-white border-3 border-[#1a1a1a] px-10 py-4 text-sm font-black uppercase tracking-wider shadow-[6px_6px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#1a1a1a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
            Ready? Start Playing Now
          </Link>
        </div>
      </div>
    </PublicPageShell>
  )
}
