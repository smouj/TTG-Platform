"use client"

// ============================================================
// Trading Tazos Game — Admin Panel Dashboard
// Only accessible by the developer email.
// ============================================================
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Users, Package, Database, Server, Activity, Loader2, Check, Wand2, Image as ImageIcon, Grid3X3, LayoutGrid, ShoppingBag, Settings } from "lucide-react"
import Link from "next/link"
import AdminShell from "@/components/admin/admin-shell"

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


  return (
    <AdminShell accentColor='var(--ttg-red)'>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {effectiveLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-ttg-yellow" /></div>
        ) : (
          <>
            {error && <div className="border-3 border-ttg-red bg-ttg-red/6 p-4 text-center text-sm font-bold text-ttg-red">{error}</div>}

            {/* Overview Cards */}
            {overview && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Users", value: overview.users, icon: Users, color: 'var(--ttg-blue)' },
                  { label: "Tazos", value: overview.tazos, icon: Package, color: 'var(--ttg-success)' },
                  { label: "With Art", value: overview.tazosWithArt, icon: ImageIcon, color: 'var(--ttg-purple)' },
                  { label: "Series", value: overview.franchises, icon: Activity, color: "var(--ttg-warning)" },
                  { label: "Bags", value: overview.bags, icon: Package, color: 'var(--ttg-red)' },
                  { label: "Decks", value: overview.decks, icon: Activity, color: "var(--ttg-cybermon)" },
                  { label: "Quests", value: overview.quests, icon: Activity, color: "#14B8A6" },
                  { label: "Version", value: null, icon: Server, color: "#6B7280", extra: overview.version },
                ].map((c, i) => (
                  <div key={i} className="mag-card p-4 border-3 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-ttg-black" style={{ background: c.color }}>
                        <c.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-ttg-black/50">{c.label}</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-ttg-black tabular-nums">
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
                  className="mag-card p-5 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] group hover:shadow-[2px_2px_0px_var(--ttg-black)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
                  style={{ background: 'linear-gradient(135deg, #22C55E15, #FFCC0010)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-ttg-black bg-ttg-success">
                      <Wand2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-ttg-black group-hover:text-ttg-success transition-colors">Tazo Creator</h3>
                      <p className="text-[9px] font-bold text-ttg-black/40 uppercase tracking-wider">AI-powered art generation</p>
                    </div>
                    <span className="ml-auto text-ttg-success text-lg font-black group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>

                <Link
                  href="/admin/tazo-designer"
                  className="mag-card p-5 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] group hover:shadow-[2px_2px_0px_var(--ttg-black)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
                  style={{ background: 'linear-gradient(135deg, #A855F715, #3B4CCA10)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-ttg-black bg-ttg-purple">
                      <LayoutGrid className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-ttg-black group-hover:text-ttg-purple transition-colors">Tazo Designer</h3>
                      <p className="text-[9px] font-bold text-ttg-black/40 uppercase tracking-wider">Visual drag &amp; drop editor</p>
                    </div>
                    <span className="ml-auto text-ttg-purple text-lg font-black group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>

                <Link
                  href="/admin/decks"
                  className="mag-card p-5 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] group hover:shadow-[2px_2px_0px_var(--ttg-black)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
                  style={{ background: 'linear-gradient(135deg, #FFCC0010, #FF6B0010)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-ttg-black bg-ttg-dracobell">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-ttg-black group-hover:text-ttg-dracobell transition-colors">Deck Textures</h3>
                      <p className="text-[9px] font-bold text-ttg-black/40 uppercase tracking-wider">Upload & manage deck wraps</p>
                    </div>
                    <span className="ml-auto text-ttg-dracobell text-lg font-black group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>

                <Link
                  href="/admin/deck-models"
                  className="mag-card p-5 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] group hover:shadow-[2px_2px_0px_var(--ttg-black)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
                  style={{ background: 'linear-gradient(135deg, #FF6B0010, #E3350D10)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-ttg-black bg-ttg-red">
                      <Database className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-ttg-black group-hover:text-ttg-red transition-colors">Deck Models</h3>
                      <p className="text-[9px] font-bold text-ttg-black/40 uppercase tracking-wider">Create & manage 3D deck models</p>
                    </div>
                    <span className="ml-auto text-ttg-red text-lg font-black group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>

                <Link
                  href="/admin/shop-bag-models"
                  className="mag-card p-5 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] group hover:shadow-[2px_2px_0px_var(--ttg-black)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
                  style={{ background: 'linear-gradient(135deg, #FF6B0010, #FFCC0010)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-ttg-black bg-ttg-dracobell">
                      <Server className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-ttg-black group-hover:text-ttg-dracobell transition-colors">Shop Bag Models</h3>
                      <p className="text-[9px] font-bold text-ttg-black/40 uppercase tracking-wider">Create 3D shop bag designs</p>
                    </div>
                    <span className="ml-auto text-ttg-dracobell text-lg font-black group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>

                <Link
                  href="/admin/shop-bags"
                  className="mag-card p-5 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] group hover:shadow-[2px_2px_0px_var(--ttg-black)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
                  style={{ background: 'linear-gradient(135deg, #8B5CF610, #A855F710)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-ttg-black bg-ttg-purple">
                      <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-ttg-black group-hover:text-ttg-purple transition-colors">Shop Bag Textures</h3>
                      <p className="text-[9px] font-bold text-ttg-black/40 uppercase tracking-wider">Upload shop bag material designs</p>
                    </div>
                    <span className="ml-auto text-ttg-purple text-lg font-black group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>

                <Link
                  href="/admin/site-config"
                  className="mag-card p-5 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] group hover:shadow-[2px_2px_0px_var(--ttg-black)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
                  style={{ background: 'linear-gradient(135deg, #00A1E910, #22C55E10)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-ttg-black bg-ttg-cybermon">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-ttg-black group-hover:text-ttg-cybermon transition-colors">Site Config</h3>
                      <p className="text-[9px] font-bold text-ttg-black/40 uppercase tracking-wider">Credits, promos &amp; settings</p>
                    </div>
                    <span className="ml-auto text-ttg-cybermon text-lg font-black group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>

                <Link
                  href="/admin/tazos"
                  className="mag-card p-5 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] group hover:shadow-[2px_2px_0px_var(--ttg-black)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
                  style={{ background: 'linear-gradient(135deg, #E3350D10, #FFCC0010)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-ttg-black bg-ttg-red">
                      <Grid3X3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-ttg-black group-hover:text-ttg-red transition-colors">Tazo Manager</h3>
                      <p className="text-[9px] font-bold text-ttg-black/40 uppercase tracking-wider">View & edit all {overview.tazos} tazos</p>
                    </div>
                    <span className="ml-auto text-ttg-red text-lg font-black group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>

                <Link
                  href="/?page=tazos"
                  className="mag-card p-5 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] group hover:shadow-[2px_2px_0px_var(--ttg-black)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
                  style={{ background: 'linear-gradient(135deg, #3B4CCA10, #FFCC0010)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-ttg-black bg-ttg-blue">
                      <ImageIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-ttg-black group-hover:text-ttg-blue transition-colors">Public Catalog</h3>
                      <p className="text-[9px] font-bold text-ttg-black/40 uppercase tracking-wider">Browse all tazos (public)</p>
                    </div>
                    <span className="ml-auto text-ttg-blue text-lg font-black group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              </div>
            )}

            {/* Server + Art Coverage */}
            {overview && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="mag-card p-5 border-3 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)]">
                  <h3 className="text-xs font-black uppercase tracking-wider text-ttg-black/50 mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4" /> Database Tables
                  </h3>
                  {dbStats && (
                    <div className="space-y-1.5">
                      {Object.entries(dbStats).map(([table, count]) => (
                        <div key={table} className="flex justify-between text-[10px] font-bold">
                          <span className="text-ttg-black/60">{table}</span>
                          <span className="text-ttg-black tabular-nums">{count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mag-card p-5 border-3 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)]">
                  <h3 className="text-xs font-black uppercase tracking-wider text-ttg-black/50 mb-3 flex items-center gap-2">
                    <Server className="w-4 h-4" /> Server
                  </h3>
                  <div className="space-y-1.5 text-[10px] font-bold">
                    <div className="flex justify-between"><span className="text-ttg-black/60">Version</span><span className="text-ttg-black">{overview.version}</span></div>
                    <div className="flex justify-between"><span className="text-ttg-black/60">Art Coverage</span><span className="text-ttg-success tabular-nums">{overview.tazosWithArt}/{overview.tazos} ({Math.round(overview.tazosWithArt / overview.tazos * 100)}%)</span></div>
                    <div className="flex justify-between"><span className="text-ttg-black/60">Server Time</span><span className="text-ttg-black">{new Date(overview.serverTime).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-ttg-black/60">Status</span><span className="text-ttg-success flex items-center gap-1"><Check className="w-3 h-3" /> Online</span></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  )
}
