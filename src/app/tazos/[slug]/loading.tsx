// Tazo detail loading — magazine theme
export default function TazoDetailLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full bg-ttg-yellow/10 animate-ping" />
        <div className="absolute inset-0 rounded-full bg-ttg-yellow/5 animate-pulse" style={{ animationDuration: "2s" }} />
      </div>
      <div className="w-10 h-10 rounded-full border-[3px] border-ttg-black/10 border-t-ttg-yellow animate-spin" />
      <p className="text-xs font-black text-ttg-black/20 uppercase tracking-[0.3em] animate-pulse">
        Loading Tazo
      </p>
    </div>
  )
}
