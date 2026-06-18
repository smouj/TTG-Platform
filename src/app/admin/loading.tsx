// Admin loading skeleton — magazine theme
export default function AdminLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: "var(--ttg-cream)" }}>
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle, var(--ttg-black) 1px, transparent 1px)", backgroundSize: "6px 6px" }} />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full bg-ttg-red/10 animate-ping" />
          <div className="absolute inset-0 rounded-full bg-ttg-red/5 animate-pulse" style={{ animationDuration: "2s" }} />
        </div>
        <div className="w-10 h-10 rounded-full border-[3px] border-ttg-black/10 border-t-ttg-red animate-spin" />
        <p className="text-xs font-black text-ttg-black/25 uppercase tracking-[0.3em] animate-pulse">
          Loading Admin
        </p>
      </div>
    </div>
  )
}
