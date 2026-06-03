import PublicPageShell from "@/components/layout/public-page-shell"
import Link from "next/link"

export default function TazosCatalogPage() {
  return (
    <PublicPageShell>
      <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-4">Tazo Catalog</h1>
        <p className="text-lg font-bold text-[#1a1a1a]/60 mb-10">
          Browse all 319 tazos across 3 collections. Filter by franchise, rarity, category, and more.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            { name: "Minimon", slug: "minimon", count: 51, color: "#FFCC00", emoji: "⚡" },
            { name: "Dracobell", slug: "dracobell", count: 118, color: "#FF6B00", emoji: "🔥" },
            { name: "Cybermon", slug: "cybermon", count: 150, color: "#00B4D8", emoji: "🔮" },
          ].map((c) => (
            <Link
              key={c.slug}
              href={`/tazos?collection=${c.slug}`}
              className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] bg-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1a1a1a] transition-all p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{c.emoji}</span>
                <div>
                  <h3 className="text-base font-black uppercase text-[#1a1a1a]">{c.name}</h3>
                  <p className="text-xs font-bold text-[#1a1a1a]/50">{c.count} tazos</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="border-4 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a] bg-[#FFCC00] p-8 text-center">
          <h2 className="text-xl font-black uppercase text-[#1a1a1a] mb-3">Full Catalog Available In-App</h2>
          <p className="text-sm font-bold text-[#1a1a1a]/60 mb-6 max-w-md mx-auto">
            The complete tazo catalog with search, filters, pagination, and 9-stat detail views is available after signing in. Create your free account to browse all 319 tazos.
          </p>
          <Link href="/register" className="mag-btn inline-block bg-[#E3350D] text-white border-2 border-[#1a1a1a] px-8 py-4 text-sm font-black uppercase tracking-wider shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1a1a1a] transition-all">
            Sign Up to Browse
          </Link>
        </div>

        <div className="mt-8">
          <div className="border-3 border-[#1a1a1a] bg-white p-6">
            <h3 className="text-sm font-black uppercase text-[#1a1a1a] mb-3">Rarity Tiers</h3>
            <div className="grid grid-cols-5 gap-2 text-center text-xs font-bold">
              {[["★ Common", "text-gray-400"], ["★★ Uncommon", "text-green-600"], ["★★★ Rare", "text-blue-600"], ["★★★★ Ultra", "text-purple-600"], ["★★★★★ Legendary", "text-yellow-600"]].map(([r, col]) => (
                <div key={r} className="border-2 border-[#1a1a1a] p-3 bg-[#fffbe6]">
                  <span className={col}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PublicPageShell>
  )
}
