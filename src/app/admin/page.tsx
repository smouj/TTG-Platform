"use client"

// ============================================================
// Trading Tazos Game — Admin Panel
// Only accessible by the developer email.
// ============================================================
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Shield, Users, Package, Database, Server, Activity, Loader2, AlertTriangle, Check, Wand2, Image as ImageIcon, Grid3X3 } from "lucide-react"
import Link from "next/link"

interface OverviewData {
  users: number; tazos: number; tazosWithArt: number; franchises: number
  bags: number; decks: number; quests: number
  serverTime: string; version: string
}

interface DbStats { [key: string]: number }

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [dbStats, setDbStats] = useState<DbStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const isAdmin = user?.email === "dev@tradingtazosgame.com"
  const effectiveLoading = loading && isAdmin

  useEffect(() => {
    if (!isAdmin) return
    Promise.all([
      fetch("/api/admin?section=overview", { credentials: "include" }).then(r => r.json()),
      fetch("/api/admin?section=db-stats", { credentials: "include" }).then(r => r.json()),
    ]).then(([overviewData, dbStatsData]) => {
      setOverview(overviewData)
      setDbStats(dbStatsData.stats)
      setLoading(false)
    }).catch(() => {
      setError("Failed to load admin data")
      setLoading(false)
    })
  }, [isAdmin])

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-[#FFCC00]" /></div>

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center mag-bg">
        <div className="mag-card p-8 text-center max-w-md mx-4 space-y-4">
          <Shield className="w-16 h-16 mx-auto text-[#E3350D]" />
          <h1 className="text-xl font-black uppercase text-[#1a1a1a]">Access Denied</h1>
          <p className="text-sm font-bold text-[#1a1a1a]/50">This panel is restricted to the developer account.</p>
          <Link href="/" className="mag-btn inline-block bg-[#E3350D] text-white px-6 py-3 text-xs font-black uppercase tracking-wider border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">Back to Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen mag-bg">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b-4 border-[#E3350D] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#E3350D]" />
            <h1 className="text-lg font-black text-white uppercase tracking-wider">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-zinc-400">{user?.email}</span>
            <Link href="/app/collection" className="text-[10px] font-black text-[#FFCC00] hover:text-white uppercase tracking-wider">Dashboard →</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {effectiveLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#FFCC00]" /></div>
        ) : (
          <>
            {error && <div className="border-3 border-[#E3350D] bg-[#E3350D10] p-4 text-center text-sm font-bold text-[#E3350D]">{error}</div>}

            {/* Overview Cards */}
            {overview && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Users", value: overview.users, icon: Users, color: "#3B4CCA" },
                  { label: "Tazos", value: overview.tazos, icon: Package, color: "#22C55E" },
                  { label: "With Art", value: overview.tazosWithArt, icon: ImageIcon, color: "#A855F7" },
                  { label: "Franchises", value: overview.franchises, icon: Activity, color: "#F59E0B" },
                  { label: "Bags", value: overview.bags, icon: Package, color: "#E3350D" },
                  { label: "Decks", value: overview.decks, icon: Activity, color: "#00A1E9" },
                  { label: "Quests", value: overview.quests, icon: Activity, color: "#14B8A6" },
                  { label: "Version", value: null, icon: Server, color: "#6B7280", extra: overview.version },
                ].map((c, i) => (
                  <div key={i} className="mag-card p-4 border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#1a1a1a]" style={{ background: c.color }}>
                        <c.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#1a1a1a]/50">{c.label}</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-[#1a1a1a] tabular-nums">
                      {c.extra || c.value?.toLocaleString() || "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            {overview && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                <Link
                  href="/admin/tazo-creator"
                  className="mag-card p-5 border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] group hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
                  style={{ background: 'linear-gradient(135deg, #22C55E15, #FFCC0010)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-[#1a1a1a] bg-[#22C55E]">
                      <Wand2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-[#1a1a1a] group-hover:text-[#22C55E] transition-colors">Tazo Creator</h3>
                      <p className="text-[9px] font-bold text-[#1a1a1a]/40 uppercase tracking-wider">AI-powered art generation</p>
                    </div>
                    <span className="ml-auto text-[#22C55E] text-lg font-black group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>

                <Link
                  href="/admin/tazos"
                  className="mag-card p-5 border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] group hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
                  style={{ background: 'linear-gradient(135deg, #E3350D10, #FFCC0010)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-[#1a1a1a] bg-[#E3350D]">
                      <Grid3X3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-[#1a1a1a] group-hover:text-[#E3350D] transition-colors">Tazo Manager</h3>
                      <p className="text-[9px] font-bold text-[#1a1a1a]/40 uppercase tracking-wider">View & edit all {overview.tazos} tazos</p>
                    </div>
                    <span className="ml-auto text-[#E3350D] text-lg font-black group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>

                <Link
                  href="/tazos"
                  className="mag-card p-5 border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] group hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
                  style={{ background: 'linear-gradient(135deg, #3B4CCA10, #FFCC0010)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-[#1a1a1a] bg-[#3B4CCA]">
                      <ImageIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-[#1a1a1a] group-hover:text-[#3B4CCA] transition-colors">Public Catalog</h3>
                      <p className="text-[9px] font-bold text-[#1a1a1a]/40 uppercase tracking-wider">Browse all tazos (public)</p>
                    </div>
                    <span className="ml-auto text-[#3B4CCA] text-lg font-black group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              </div>
            )}

            {/* Server + Art Coverage */}
            {overview && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="mag-card p-5 border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]/50 mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4" /> Database Tables
                  </h3>
                  {dbStats && (
                    <div className="space-y-1.5">
                      {Object.entries(dbStats).map(([table, count]) => (
                        <div key={table} className="flex justify-between text-[10px] font-bold">
                          <span className="text-[#1a1a1a]/60">{table}</span>
                          <span className="text-[#1a1a1a] tabular-nums">{count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mag-card p-5 border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]/50 mb-3 flex items-center gap-2">
                    <Server className="w-4 h-4" /> Server
                  </h3>
                  <div className="space-y-1.5 text-[10px] font-bold">
                    <div className="flex justify-between"><span className="text-[#1a1a1a]/60">Version</span><span className="text-[#1a1a1a]">{overview.version}</span></div>
                    <div className="flex justify-between"><span className="text-[#1a1a1a]/60">Art Coverage</span><span className="text-[#22C55E] tabular-nums">{overview.tazosWithArt}/{overview.tazos} ({Math.round(overview.tazosWithArt / overview.tazos * 100)}%)</span></div>
                    <div className="flex justify-between"><span className="text-[#1a1a1a]/60">Server Time</span><span className="text-[#1a1a1a]">{new Date(overview.serverTime).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-[#1a1a1a]/60">Status</span><span className="text-[#22C55E] flex items-center gap-1"><Check className="w-3 h-3" /> Online</span></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
