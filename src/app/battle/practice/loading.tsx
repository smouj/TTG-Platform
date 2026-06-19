// Battle practice loading — dark arena magazine theme
export default function BattlePracticeLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: "#1a1a2e" }}>
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full bg-ttg-yellow/15 animate-ping" />
        <div className="absolute inset-0 rounded-full bg-ttg-yellow/10 animate-pulse" style={{ animationDuration: "2s" }} />
      </div>
      <div className="w-10 h-10 rounded-full border-[3px] border-ttg-yellow/10 border-t-ttg-yellow animate-spin" />
      <p className="text-xs font-black text-white/15 uppercase tracking-[0.3em] animate-pulse">
        Loading Practice Arena
      </p>
    </div>
  )
}
