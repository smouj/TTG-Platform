// ============================================================
// Trading Tazos Game — App-level Loading UI
// Magazine-themed splash with branded logo + skeleton grid
// ============================================================

export default function AppLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8" style={{ background: "#FFF9E6" }}>
      {/* Halftone */}
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle, #1a1a1a 1px, transparent 1px)", backgroundSize: "6px 6px" }} />
      
      {/* Brand logo spacer */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full bg-[#FFCC00]/15 animate-ping" />
          <img src="/logo/logo-tg-yellow.png" alt="" className="relative w-14 h-14" style={{ animation: "mag-entry-hero 0.6s cubic-bezier(0.16, 1, 0.3, 1) both" }} />
        </div>
        <p className="text-sm font-black text-[#1a1a1a]/25 uppercase tracking-[0.2em]" style={{ animation: "mag-entry-fade-in 0.5s 0.2s ease-out both" }}>
          Loading Arena
        </p>
      </div>

      {/* Skeleton grid — staggered entry */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 w-full max-w-3xl relative z-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl border-2 border-[#1a1a1a]/10 bg-white overflow-hidden"
            style={{
              animation: `mag-entry-fade-up 0.5s ${0.1 + i * 0.08}s cubic-bezier(0.16, 1, 0.3, 1) both`,
            }}
          >
            <div className="w-full h-full flex items-center justify-center bg-[#fafaf5]">
              <div className="w-2/3 h-2/3 rounded-full" style={{
                background: "#1a1a1a06",
                animation: "mag-skeleton-shimmer 1.5s ease-in-out infinite",
                animationDelay: `${i * 0.15}s`,
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom loading bar */}
      <div className="relative z-10 w-full max-w-xs mt-2">
        <div className="h-1 w-full bg-[#1a1a1a]/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: "40%",
              background: "linear-gradient(90deg, #FFCC00, #E3350D, #FFCC00)",
              backgroundSize: "200% 100%",
              animation: "mag-skeleton-shimmer 2s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    </div>
  )
}
