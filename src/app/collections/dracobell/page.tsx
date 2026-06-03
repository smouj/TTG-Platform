import PublicPageShell from "@/components/layout/public-page-shell"
import Link from "next/link"

export default function DracobellCollectionPage() {
  return (
    <PublicPageShell>
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-6 h-6 border-3 border-[#1a1a1a]" style={{ backgroundColor: "#FF6B00" }} />
          <span className="text-sm font-black uppercase text-[#1a1a1a]/50">Collection</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-2">Dracobell</h1>
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="text-5xl font-black text-[#1a1a1a]">118</span>
          <span className="text-lg font-bold text-[#1a1a1a]/40">tazos</span>
          <span className="text-xs font-bold bg-[#FFCC00] px-2 py-1 border-2 border-[#1a1a1a]">Matutano 1995</span>
        </div>
        <p className="text-base font-bold text-[#1a1a1a]/60 mb-2">Categories: Tazos, Megatazos, Supertazos Octogonales, Mastertazos, Holo 3D, Caps, Gold</p>

        <p className="text-sm font-bold text-[#1a1a1a]/50 leading-relaxed mb-8">
          Each tazo in this collection has been verified against the original 1995 Matutano series. 
          All 118 tazos have 9 balanced combat stats, a tactical role, and evolutive relationships 
          where applicable. Browse the full catalog to see individual tazo stats and details.
        </p>

        <Link href="/tazos?collection=dracobell" className="mag-btn inline-block bg-[#E3350D] text-white border-2 border-[#1a1a1a] px-8 py-4 text-sm font-black uppercase tracking-wider shadow-[6px_6px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#1a1a1a] transition-all">
          Browse Dracobell Tazos
        </Link>
      </div>
    </PublicPageShell>
  )
}
