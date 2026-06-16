// ============================================================
// Trading Tazos Game — Root Loading UI
// Magazine-themed splash shown during initial page load
// ============================================================

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center" style={{ background: "#FFF9E6" }}>
      {/* Magazine halftone overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle, #1a1a1a 1px, transparent 1px)", backgroundSize: "6px 6px" }}
      />
      
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-24 h-24 border-t-[6px] border-l-[6px] border-[#1a1a1a]/10" />
      <div className="absolute top-0 right-0 w-24 h-24 border-t-[6px] border-r-[6px] border-[#1a1a1a]/10" />
      <div className="absolute bottom-0 left-0 w-24 h-24 border-b-[6px] border-l-[6px] border-[#1a1a1a]/10" />
      <div className="absolute bottom-0 right-0 w-24 h-24 border-b-[6px] border-r-[6px] border-[#1a1a1a]/10" />

      {/* Logo section */}
      <div className="relative mb-8">
        {/* Outer rings — rotating */}
        <div className="absolute -inset-10 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-[5px] border-[#E3350D]/20 animate-spin" style={{ animationDuration: "4s" }} />
          <div className="absolute w-20 h-20 rounded-full border-[4px] border-[#FFCC00]/30 animate-spin" style={{ animationDuration: "3s", animationDirection: "reverse" }} />
        </div>
        
        {/* Logo pulse */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-[#FFCC00]/20 animate-ping" style={{ animationDuration: "2s" }} />
          <img
            src="/logo/logo-tg-yellow.png"
            alt="Trading Tazos Game"
            className="relative w-20 h-20 object-contain animate-pulse"
            style={{ animationDuration: "1.5s" }}
          />
        </div>
      </div>

      {/* Brand text */}
      <h1 className="text-2xl font-black text-[#1a1a1a] uppercase tracking-[0.15em] animate-pulse" style={{ animationDuration: "2s" }}>
        Trading Tazos
      </h1>
      <p className="text-[10px] font-bold text-[#1a1a1a]/30 uppercase tracking-[0.4em] mt-1">
        Collect · Trade · Battle
      </p>

      {/* Progress dots */}
      <div className="flex gap-2 mt-8">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[#1a1a1a]/15"
            style={{
              animation: `mag-skeleton-shimmer 1.5s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
