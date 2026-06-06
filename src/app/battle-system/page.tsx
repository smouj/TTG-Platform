import PublicPageShell from "@/components/layout/public-page-shell"
import Link from "next/link"

export default function BattleSystemPage() {
  return (
    <PublicPageShell>
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-4">Battle System</h1>
        <p className="text-lg font-bold text-[#1a1a1a]/60 mb-10">9 combat stats. Physics-driven 3D arena. Skill-based throws with spin control. Every match is unique.</p>

        <div className="space-y-10">
          {/* Combat Stats */}
          <section className="border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] bg-white p-6 sm:p-8">
            <h2 className="text-xl font-black uppercase text-[#1a1a1a] mb-5">9 Combat Stats</h2>
            <p className="text-xs font-bold text-[#1a1a1a]/50 mb-4">Each tazo has a unique profile across these 9 stats, determining how it performs in battle.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[["Attack (ATK)", "Impact power — how hard it hits and flips opponents", "#E3350D"],
                ["Defense (DEF)", "Flipping resistance — stays upright on impact", "#3B4CCA"],
                ["Resistance (RES)", "Difficulty to be pushed or displaced", "#8B5CF6"],
                ["Weight (WGT)", "Physical mass — affects pushing force and momentum transfer", "#FFCC00"],
                ["Stability (STB)", "Prevents knockbacks and ring-outs", "#00B4D8"],
                ["Spin (SPN)", "Maintains rotation and energy after landing", "#10B981"],
                ["Control (CTR)", "Reduces throw deviation for better aim", "#F97316"],
                ["Bounce (BNC)", "Improves wall rebounds and repositioning", "#06B6D4"],
                ["Precision (PRC)", "Tighter aim circle — less scatter on landing", "#EC4899"]
              ].map(([name, desc, color]) => (
                <div key={name} className="border-2 border-[#1a1a1a] p-3 bg-[#FFF9E6]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 border-2 border-[#1a1a1a] flex-shrink-0" style={{ backgroundColor: color }} />
                    <h3 className="text-sm font-black uppercase text-[#1a1a1a]">{name}</h3>
                  </div>
                  <p className="text-xs font-bold text-[#1a1a1a]/60">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Physics Arena */}
          <section className="border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] bg-white p-6 sm:p-8">
            <h2 className="text-xl font-black uppercase text-[#1a1a1a] mb-5">3D Physics Arena</h2>
            <div className="text-sm font-bold text-[#1a1a1a]/60 space-y-3 leading-relaxed">
              <p>The battle takes place in a <strong>3D coliseum-style arena</strong>. Every throw triggers a full physics simulation:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Momentum & friction</strong> — Your tazo slides across the surface, slowing down with simulated friction</li>
                <li><strong>Wall bouncing</strong> — Tazos rebound off arena walls at calculated angles based on impact speed and spin type</li>
                <li><strong>Disc collisions</strong> — When your tazo hits an opponent&apos;s, momentum transfers between them on impact</li>
                <li><strong>Flip mechanic</strong> — High-power throws against opponent tazos can flip them over, capturing them for your side</li>
                <li><strong>Ring-out system</strong> — Overpower your throw and your tazo may fly out of the arena entirely</li>
                <li><strong>Spin physics</strong> — Topspin, backspin, and sidespin each affect bounce behavior and trajectory differently</li>
              </ul>
            </div>
          </section>

          {/* Throw Phases */}
          <section className="border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] bg-white p-6 sm:p-8">
            <h2 className="text-xl font-black uppercase text-[#1a1a1a] mb-5">How a Throw Works</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                {
                  step: "1. Aim",
                  desc: "Position the crosshair on the arena where you want your tazo to land. Take your time — precision matters.",
                  color: "#E3350D",
                },
                {
                  step: "2. Power",
                  desc: "A pulsing circle shows your throw strength. Click or press SPACE to lock it in. Higher power = harder hits, but less accuracy.",
                  color: "#FFCC00",
                },
                {
                  step: "3. Spin",
                  desc: "Choose topspin (more bounce), backspin (stops faster), sidespin (curves), or no spin. Then launch!",
                  color: "#00A1E9",
                },
              ].map(({ step, desc, color }, i) => (
                <div key={i} className="border-2 border-[#1a1a1a] p-4 bg-[#FFF9E6]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 text-xs font-black text-white"
                      style={{ backgroundColor: color, border: "2px solid #1a1a1a" }}>
                      {i + 1}
                    </span>
                    <h3 className="text-sm font-black uppercase text-[#1a1a1a]">{step}</h3>
                  </div>
                  <p className="text-xs font-bold text-[#1a1a1a]/60">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Risk Table */}
          <section className="border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] bg-white p-6 sm:p-8">
            <h2 className="text-xl font-black uppercase text-[#1a1a1a] mb-5">Risk & Reward</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-[#1a1a1a]">
                <thead>
                  <tr className="bg-[#1a1a1a] text-white">
                    <th className="border-2 border-[#1a1a1a] p-3 text-xs font-black uppercase text-left">Power Level</th>
                    <th className="border-2 border-[#1a1a1a] p-3 text-xs font-black uppercase">Accuracy</th>
                    <th className="border-2 border-[#1a1a1a] p-3 text-xs font-black uppercase">Impact</th>
                    <th className="border-2 border-[#1a1a1a] p-3 text-xs font-black uppercase">Flip Chance</th>
                    <th className="border-2 border-[#1a1a1a] p-3 text-xs font-black uppercase">Ring-Out Risk</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-bold">
                  {[
                    ["Low", "High — easy to aim", "Weak — minimal push", "Low", "Safe"],
                    ["Medium", "Normal — moderate scatter", "Balanced impact", "Moderate", "Safe"],
                    ["High", "Reduced — harder to control", "Strong — flips most tazos", "High", "Possible if aimed near edge"],
                    ["Maximum", "Low — wide scatter area", "Devastating — guaranteed flip on contact", "Very high", "Risky — may fly out of bounds"],
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#FFF9E6]"}>
                      {row.map((cell, j) => (
                        <td key={j} className="border-2 border-[#1a1a1a] p-3">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs font-bold text-[#1a1a1a]/40 mt-3">Every throw is a calculated risk. The best players know when to play safe and when to go all in.</p>
          </section>

          {/* Game Modes */}
          <section className="border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] bg-white p-6 sm:p-8">
            <h2 className="text-xl font-black uppercase text-[#1a1a1a] mb-5">Game Modes</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="border-2 border-[#1a1a1a] p-4 bg-[#FFCC00]">
                <h3 className="text-sm font-black uppercase text-[#1a1a1a] mb-2">Practice</h3>
                <p className="text-xs font-bold text-[#1a1a1a]/60">Battle AI opponents at Novice, Skilled, or Master difficulty. Perfect for learning and testing new decks.</p>
              </div>
              <div className="border-2 border-[#1a1a1a] p-4 bg-[#E3350D] text-white">
                <h3 className="text-sm font-black uppercase mb-2">Ranked</h3>
                <p className="text-xs font-bold text-white/70">Connect to matchmaking and test your deck against other players. Full turn sync is rolling out in stages.</p>
              </div>
              <div className="border-2 border-[#1a1a1a] p-4 bg-[#3B4CCA] text-white">
                <h3 className="text-sm font-black uppercase mb-2">Friend Battle</h3>
                <p className="text-xs font-bold text-white/70">Create a room code and connect with a friend through the WebSocket lobby. Practice AI remains the fully playable battle mode.</p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link href="/register" className="inline-block bg-[#E3350D] text-white border-3 border-[#1a1a1a] px-10 py-4 text-sm font-black uppercase tracking-wider shadow-[6px_6px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#1a1a1a] transition-all">
            Create Account & Start Battling
          </Link>
        </div>
      </div>
    </PublicPageShell>
  )
}
