import PublicPageShell from "@/components/layout/public-page-shell"
import Link from "next/link"

const collectionData = [
  {
    name: "Minimon",
    slug: "minimon",
    count: 51,
    year: 2000,
    origin: "Matutano",
    color: "#FFCC00",
    accent: "bg-[#FFCC00]",
    categories: ["Tazos", "Supertazos Voladores"],
    desc: "The original collection that started it all. 51 Minimon creatures with balanced combat stats — perfect for beginners learning the battle system. These classic starter creatures have moderate power across all stats, making them versatile in any deck.",
    highlights: [
      "Balanced stat distribution — great for learning",
      "Classic starter creatures with evolution chains",
      "Original 2000 Matutano series",
      "Includes Supertazos Voladores variants"
    ]
  },
  {
    name: "Dracobell",
    slug: "dracobell",
    count: 118,
    year: 1995,
    origin: "Matutano",
    color: "#FF6B00",
    accent: "bg-[#FF6B00]",
    categories: ["Tazos", "Megatazos", "Supertazos Octogonales", "Mastertazos", "Holo 3D", "Caps", "Gold"],
    desc: "The largest and most diverse collection. 118 warrior characters across 7 categories. High attack stats and powerful special abilities dominate this collection. Masters and Holo variants are the rarest finds.",
    highlights: [
      "7 unique categories with different shapes and rarities",
      "Highest average attack stats of all collections",
      "Includes rare Holo 3D and Gold variants",
      "Most diverse set — 7 times more variety than standard collections"
    ]
  },
  {
    name: "Cybermon",
    slug: "cybermon",
    count: 150,
    year: 2000,
    origin: "Magic Box",
    color: "#00B4D8",
    accent: "bg-[#00B4D8]",
    categories: ["Tazos", "Megatazos", "Supertazos Voladores"],
    desc: "The biggest digital-era collection. 150 Cybermon with extensive evolution trees and transformation paths. High precision and technical stats make these creatures excel in aim-based combat strategies.",
    highlights: [
      "Largest collection — 150 tazos total",
      "Complex evolution trees with multiple stages",
      "Highest precision and technical stats",
      "Magic Box 2000 series"
    ]
  }
]

export default function CollectionsPage() {
  return (
    <PublicPageShell>
      <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-4">Collections</h1>
        <p className="text-lg font-bold text-[#1a1a1a]/60 mb-10">319 verified tazos from 3 legendary Spanish collections. Every tazo with 9 unique combat stats.</p>

        <div className="space-y-8">
          {collectionData.map((c) => (
            <section key={c.slug} className="border-4 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a] bg-white overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="w-6 h-6 border-3 border-[#1a1a1a] rounded" style={{ backgroundColor: c.color }} />
                  <h2 className="text-2xl font-black uppercase text-[#1a1a1a]">{c.name}</h2>
                  <span className="text-4xl font-black text-[#1a1a1a] ml-auto">{c.count}</span>
                  <span className="text-sm font-bold uppercase text-[#1a1a1a]/40">tazos</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs font-bold bg-[#FFCC00] px-2 py-1 border-2 border-[#1a1a1a]">{c.origin}</span>
                  <span className="text-xs font-bold bg-[#FFCC00] px-2 py-1 border-2 border-[#1a1a1a]">{c.year}</span>
                  {c.categories.map(cat => (
                    <span key={cat} className="text-xs font-bold bg-white px-2 py-1 border-2 border-[#1a1a1a]">{cat}</span>
                  ))}
                </div>
                <p className="text-sm font-bold text-[#1a1a1a]/60 leading-relaxed mb-4">{c.desc}</p>
                <ul className="grid sm:grid-cols-2 gap-2 mb-4">
                  {c.highlights.map(h => (
                    <li key={h} className="text-xs font-bold text-[#1a1a1a]/50 flex items-start gap-2">
                      <span className="text-[#E3350D] mt-0.5">◆</span> {h}
                    </li>
                  ))}
                </ul>
                <Link href={`/collections/${c.slug}`} className="text-sm font-black uppercase text-[#E3350D] hover:underline underline-offset-4">
                  View full {c.name} collection →
                </Link>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/tazos" className="mag-btn inline-block bg-[#FFCC00] text-[#1a1a1a] border-2 border-[#1a1a1a] px-8 py-4 text-sm font-black uppercase tracking-wider shadow-[6px_6px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#1a1a1a] transition-all">
            Browse Complete Catalog
          </Link>
        </div>
      </div>
    </PublicPageShell>
  )
}
