import PublicPageShell from "@/components/layout/public-page-shell"
import Link from "next/link"

export default function BattleSystemPage() {
  return (
    <PublicPageShell>
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-4">Battle System</h1>
        <p className="text-lg font-bold text-[#1a1a1a]/60 mb-10">9 combat stats. 8 roles. Real-time 2D physics. Every battle is unique.</p>

        <div className="space-y-10">
          {/* Combat Stats */}
          <section className="border-4 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a] bg-white p-8">
            <h2 className="text-xl font-black uppercase text-[#1a1a1a] mb-5">9 Combat Stats</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[["Attack (ATK)", "Impact power — how hard it hits opponents", "#E3350D"],
                ["Defense (DEF)", "Flipping resistance — stay upright on impact", "#3B4CCA"],
                ["Resistance (RES)", "Difficulty to be flipped or pushed", "#8B5CF6"],
                ["Weight (WGT)", "Physical mass — affects damage, push force, stability", "#FFCC00"],
                ["Stability (STB)", "Prevents self-flips, knockbacks, out-of-bounds", "#00B4D8"],
                ["Spin (SPN)", "Maintains rotation and energy after landing", "#10B981"],
                ["Control (CTR)", "Reduces throw deviation for better accuracy", "#F97316"],
                ["Bounce (BNC)", "Improves rebounds and chained multi-hits", "#06B6D4"],
                ["Precision (PRC)", "Improves aim, reduces horizontal/vertical error", "#EC4899"]
              ].map(([name, desc, color]) => (
                <div key={name} className="border-2 border-[#1a1a1a] p-3 bg-[#fffbe6]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 border-2 border-[#1a1a1a]" style={{ backgroundColor: color }} />
                    <h3 className="text-sm font-black uppercase text-[#1a1a1a]">{name}</h3>
                  </div>
                  <p className="text-xs font-bold text-[#1a1a1a]/60">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Roles */}
          <section className="border-4 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a] bg-white p-8">
            <h2 className="text-xl font-black uppercase text-[#1a1a1a] mb-5">8 Tazo Roles</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[["Attacker", "High ATK, moderate everything else"],
                ["Tank", "High DEF/RES/WGT, low SPN"],
                ["Technical", "High CTR/PRC, moderate ATK"],
                ["Bouncer", "High BNC/SPN, low DEF"],
                ["Heavy", "Very high WGT, low CTR"],
                ["Light", "High SPN/CTR, very low WGT"],
                ["Balanced", "Even distribution across all stats"],
                ["Special", "Unique stat profile per tazo"]
              ].map(([role, desc]) => (
                <div key={role} className="border-2 border-[#1a1a1a] p-3 bg-[#fffbe6]">
                  <h3 className="text-sm font-black uppercase text-[#1a1a1a] mb-1">{role}</h3>
                  <p className="text-xs font-bold text-[#1a1a1a]/60">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Physics */}
          <section className="border-4 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a] bg-white p-8">
            <h2 className="text-xl font-black uppercase text-[#1a1a1a] mb-5">Physics Arena</h2>
            <div className="text-sm font-bold text-[#1a1a1a]/60 space-y-3 leading-relaxed">
              <p>The battle happens in a <strong>2D canvas physics arena</strong>. When you throw a tazo:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Collision detection</strong> calculates exact impact point and angle</li>
                <li><strong>Momentum transfer</strong> determines how much force is transferred on impact</li>
                <li><strong>Chain rebounds</strong> allow one throw to hit multiple tazos in sequence</li>
                <li><strong>Boundary physics</strong> — if a tazo hits the edge, it bounces or flies out</li>
                <li><strong>Self-flip mechanic</strong> — overpower a throw and you might flip YOURSELF</li>
              </ul>
            </div>
          </section>

          {/* Risk Table */}
          <section className="border-4 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a] bg-white p-8">
            <h2 className="text-xl font-black uppercase text-[#1a1a1a] mb-5">Throw Risk / Reward</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-[#1a1a1a]">
                <thead>
                  <tr className="bg-[#1a1a1a] text-white">
                    <th className="border-2 border-[#1a1a1a] p-3 text-xs font-black uppercase text-left">Power Level</th>
                    <th className="border-2 border-[#1a1a1a] p-3 text-xs font-black uppercase">Circle Size</th>
                    <th className="border-2 border-[#1a1a1a] p-3 text-xs font-black uppercase">Impact</th>
                    <th className="border-2 border-[#1a1a1a] p-3 text-xs font-black uppercase">Accuracy</th>
                    <th className="border-2 border-[#1a1a1a] p-3 text-xs font-black uppercase">Risk</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-bold">
                  {[["Low", "Large", "Weak", "High", "Safe — stays in bounds"],
                    ["Medium", "Medium", "Balanced", "Normal", "Standard risk"],
                    ["High", "Small", "Strong", "Low", "May scatter unpredictably"],
                    ["Maximum", "Tiny", "Devastating", "Very Low", "High chance of self-flip or flying out"]
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#fffbe6]"}>
                      {row.map((cell, j) => (
                        <td key={j} className="border-2 border-[#1a1a1a] p-3">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs font-bold text-[#1a1a1a]/40 mt-3">Strategy matters. The best players know when to play safe and when to risk it all.</p>
          </section>

          {/* Game Modes */}
          <section className="border-4 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a] bg-white p-8">
            <h2 className="text-xl font-black uppercase text-[#1a1a1a] mb-5">Game Modes</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="border-2 border-[#1a1a1a] p-4 bg-[#FFCC00]">
                <h3 className="text-sm font-black uppercase text-[#1a1a1a] mb-2">Classic</h3>
                <p className="text-xs font-bold text-[#1a1a1a]/60">Flip and capture all rival tazos to win. Complete domination. No turn limit.</p>
              </div>
              <div className="border-2 border-[#1a1a1a] p-4 bg-[#FFCC00]">
                <h3 className="text-sm font-black uppercase text-[#1a1a1a] mb-2">Rounds</h3>
                <p className="text-xs font-bold text-[#1a1a1a]/60">Points-based scoring across multiple rounds. Win by points, not just captures.</p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link href="/register" className="mag-btn inline-block bg-[#E3350D] text-white border-2 border-[#1a1a1a] px-10 py-4 text-sm font-black uppercase tracking-wider shadow-[6px_6px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#1a1a1a] transition-all">
            Create Account & Start Battling
          </Link>
        </div>
      </div>
    </PublicPageShell>
  )
}
