// ============================================================
// Trading Tazos Game — App-level Loading UI
// Shown instantly during route transitions (Suspense boundary)
// Matches the magazine-style brand aesthetic
// ============================================================
import { Zap } from "lucide-react"

export default function AppLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-8">
      {/* Brand spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-[#1a1a1a]/10 animate-ping" />
        <div className="absolute inset-0 rounded-full border-4 border-t-[#3B4CCA] border-r-[#FF3E3E] border-b-[#FFD700] border-l-[#1a1a1a] animate-spin" />
        <div className="absolute inset-1 rounded-full bg-white" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Zap className="w-5 h-5 text-[#1a1a1a]" />
        </div>
      </div>
      <p className="text-sm font-bold text-[#1a1a1a]/40 uppercase tracking-widest animate-pulse">
        Loading
      </p>

      {/* Skeleton cards — magazine grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 w-full max-w-3xl">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl bg-[#f5f5f5] border-2 border-[#1a1a1a]/10 animate-pulse flex items-center justify-center"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <div className="w-2/3 h-2/3 rounded-full bg-[#00000008]" />
          </div>
        ))}
      </div>

      {/* Subtitle hits */}
      <div className="flex flex-col items-center gap-1.5 w-full max-w-md">
        <div className="h-3 w-48 rounded bg-[#f0f0f0] animate-pulse" style={{ animationDelay: "100ms" }} />
        <div className="h-3 w-32 rounded bg-[#f0f0f0] animate-pulse" style={{ animationDelay: "200ms" }} />
      </div>
    </div>
  )
}
