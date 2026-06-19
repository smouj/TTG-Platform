// Battle play loading — dark fullscreen arena entrance
export default function BattlePlayLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6" style={{ background: "#0a0a14" }}>
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full bg-ttg-yellow/20 animate-ping" />
        <div className="absolute inset-0 rounded-full bg-ttg-yellow/10 animate-pulse" style={{ animationDuration: "2s" }} />
      </div>
      <div className="w-12 h-12 rounded-full border-[4px] border-ttg-yellow/10 border-t-ttg-yellow animate-spin" />
      <p className="text-xs font-black text-white/15 uppercase tracking-[0.3em] animate-pulse">
        Entering Arena
      </p>
    </div>
  )
}
