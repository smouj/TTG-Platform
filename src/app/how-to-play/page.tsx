import PublicPageShell from "@/components/layout/public-page-shell"
import Link from "next/link"

export default function HowToPlayPage() {
  return (
    <PublicPageShell>
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-4">How to Play</h1>
        <p className="text-lg font-bold text-[#1a1a1a]/60 mb-10">Master the art of tazo throwing. From your first collection to your first battle victory.</p>

        <div className="space-y-10">
          {/* Step 1 */}
          <section className="border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] bg-white p-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="inline-flex items-center justify-center w-12 h-12 border-3 border-[#1a1a1a] bg-[#FFCC00] text-xl font-black text-[#1a1a1a]">1</span>
              <h2 className="text-xl font-black uppercase text-[#1a1a1a]">Create Your Account</h2>
            </div>
            <p className="text-sm font-bold text-[#1a1a1a]/60 leading-relaxed">
              Sign up for free at <Link href="/register" className="text-[#E3350D] underline underline-offset-4">the registration page</Link>. You&apos;ll receive a Welcome Pack with 10 starter tazos and a pre-built battle deck. No credit card required — the game is completely free to play.
            </p>
          </section>

          {/* Step 2 */}
          <section className="border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] bg-white p-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="inline-flex items-center justify-center w-12 h-12 border-3 border-[#1a1a1a] bg-[#FF6B00] text-xl font-black text-white">2</span>
              <h2 className="text-xl font-black uppercase text-[#1a1a1a]">Build Your Collection</h2>
            </div>
            <p className="text-sm font-bold text-[#1a1a1a]/60 leading-relaxed">
              Collect tazos by opening potato chip bags in the <Link href="/shop" className="text-[#E3350D] underline underline-offset-4">Tazo Shop</Link>. Use credits earned from battles, daily logins, and quests. Each bag type has different rarity chances. You can also scan physical tazos with the Scanner tool to add them to your digital collection.
            </p>
          </section>

          {/* Step 3 */}
          <section className="border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] bg-white p-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="inline-flex items-center justify-center w-12 h-12 border-3 border-[#1a1a1a] bg-[#3B4CCA] text-xl font-black text-white">3</span>
              <h2 className="text-xl font-black uppercase text-[#1a1a1a]">Build Your Deck</h2>
            </div>
            <p className="text-sm font-bold text-[#1a1a1a]/60 leading-relaxed">
              Go to your <Link href="/decks" className="text-[#E3350D] underline underline-offset-4">Decks</Link> and choose 5 tazos for battle. Balance 8 roles (Attacker, Tank, Technical, Bouncer, Heavy, Light, Balanced, Special) with 9 stats (Attack, Defense, Resistance, Weight, Stability, Spin, Control, Bounce, Precision). The right deck composition wins battles.
            </p>
          </section>

          {/* Step 4 */}
          <section className="border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] bg-white p-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="inline-flex items-center justify-center w-12 h-12 border-3 border-[#1a1a1a] bg-[#E3350D] text-xl font-black text-white">4</span>
              <h2 className="text-xl font-black uppercase text-[#1a1a1a]">Enter the Battle Arena</h2>
            </div>
            <div className="text-sm font-bold text-[#1a1a1a]/60 space-y-3 leading-relaxed">
              <p>Head to the <Link href="/app/battle" className="text-[#E3350D] underline underline-offset-4">Battle Arena</Link>. Here&apos;s how a turn works:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Select</strong> a tazo from your active deck</li>
                <li><strong>Aim</strong> horizontally — time the swing for maximum precision</li>
                <li><strong>Aim</strong> vertically — control drop angle</li>
                <li><strong>Charge</strong> power — more impact, less accuracy</li>
                <li><strong>Throw!</strong> Your tazo enters the physics arena</li>
              </ul>
              <p>If your tazo hits a rival tazo hard enough, it <strong>flips</strong> and becomes yours. Flip all rival tazos to win!</p>
            </div>
          </section>

          {/* Step 5 */}
          <section className="border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] bg-white p-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="inline-flex items-center justify-center w-12 h-12 border-3 border-[#1a1a1a] bg-[#1a1a1a] text-xl font-black text-[#FFCC00]">5</span>
              <h2 className="text-xl font-black uppercase text-[#1a1a1a]">Risk & Reward</h2>
            </div>
            <div className="text-sm font-bold text-[#1a1a1a]/60 space-y-3 leading-relaxed">
              <p>Power management is critical. The more power you charge, the harder you hit — but the less accurate you become.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Low power</strong>: Safe, accurate, weak impact</li>
                <li><strong>Medium power</strong>: Balanced risk/reward</li>
                <li><strong>High power</strong>: Strong impact, may miss</li>
                <li><strong>Maximum power</strong>: Devastating hit, but high chance of self-flip or flying out of bounds</li>
              </ul>
              <p>If you miss, your tazo stays on the field — vulnerable. If you overpower and fly out, the rival gets to place it anywhere. Strategy matters.</p>
            </div>
          </section>

          {/* Step 6 */}
          <section className="border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] bg-white p-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="inline-flex items-center justify-center w-12 h-12 border-3 border-[#1a1a1a] bg-[#E3350D] text-xl font-black text-white">★</span>
              <h2 className="text-xl font-black uppercase text-[#1a1a1a]">Keep Progressing</h2>
            </div>
            <div className="text-sm font-bold text-[#1a1a1a]/60 space-y-3 leading-relaxed">
              <p>Between battles, continue building your collection:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Complete <strong>quests</strong> for bonus credits</li>
                <li>Earn <strong>achievements</strong> (Bronze → Platinum tiers)</li>
                <li>Open <strong>tazo bags</strong> with your accumulated credits</li>
                <li>Climb the <strong>global leaderboard</strong></li>
                <li>Battle friends via <strong>PvP multiplayer</strong></li>
              </ul>
            </div>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link href="/register" className="mag-btn inline-block bg-[#E3350D] text-white border-2 border-[#1a1a1a] px-10 py-4 text-sm font-black uppercase tracking-wider shadow-[6px_6px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#1a1a1a] transition-all">
            Ready? Start Playing Now
          </Link>
        </div>
      </div>
    </PublicPageShell>
  )
}
