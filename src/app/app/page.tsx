// ============================================================
// Trading Tazos Game — Dashboard Hub
// Authenticated landing page with stats, quick actions, activity.
// ============================================================
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { extractToken, verifyToken } from "@/lib/auth"
import { SITE_CONFIG } from "@/lib/site-config"
import { FRANCHISES } from "@/lib/franchise-config"
import { Swords, ShoppingBag, Album, Blocks, BarChart3, Settings, Sparkles } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export const metadata = {
  title: `Dashboard | ${SITE_CONFIG.name}`,
  description: "Your Trading Tazos dashboard — collection, battle, shop, and stats.",
}

async function getUserData() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("ttg_auth")?.value
    if (!token) return null

    const authUser = verifyToken(token)
    if (!authUser) return null

    // Fetch fresh credits + tazo count from DB
    const userRecord = await db.user.findUnique({
      where: { id: authUser.id },
      select: { credits: true },
    })

    const uniqueTazos = await db.userTazo.count({
      where: { userId: authUser.id },
    })

    const recentBattle = await db.battleRecord.findFirst({
      where: { userId: authUser.id },
      orderBy: { createdAt: "desc" },
      select: { winner: true, victoryType: true, score: true, createdAt: true },
    })

    return {
      id: authUser.id,
      name: authUser.name,
      displayName: authUser.displayName,
      credits: userRecord?.credits ?? 0,
      uniqueTazos,
      recentBattle,
    }
  } catch {
    return null
  }
}

const QUICK_ACTIONS = [
  { href: "/app/battle", label: "Battle", desc: "Challenge the AI", icon: Swords, color: "#E3350D", bg: "#FEF2F2" },
  { href: "/app/shop", label: "Shop", desc: "Buy tazo bags", icon: ShoppingBag, color: "#FFCC00", bg: "#FFFDF5" },
  { href: "/app/collection", label: "My Collection", desc: "View your tazos", icon: Album, color: "#3B82F6", bg: "#EFF6FF" },
  { href: "/app/decks", label: "Decks", desc: "Build battle decks", icon: Blocks, color: "#22C55E", bg: "#F0FDF4" },
  { href: "/app/stats", label: "Stats", desc: "Performance & rankings", icon: BarChart3, color: "#A855F7", bg: "#FAF5FF" },
  { href: "/app/settings", label: "Settings", desc: "Profile & account", icon: Settings, color: "#6B7280", bg: "#F9FAFB" },
]

export default async function DashboardPage() {
  const user = await getUserData()
  if (!user) redirect("/login?redirect=/app")

  const displayName = user.displayName || user.name

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* ── Greeting ── */}
      <div className="mag-card border-3 border-[#1a1a1a] bg-white overflow-hidden" style={{ boxShadow: "4px 4px 0px #FFCC0030" }}>
        <div className="p-4 sm:p-6">
          <h1 className="text-[13px] sm:text-[15px] font-black text-[#1a1a1a] uppercase tracking-tight">
            Welcome back, {displayName}
          </h1>
          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FFFDF5] border-2 border-[#FFCC00]/30 rounded-lg">
              <span className="text-[9px] font-black text-[#1a1a1a]/40 uppercase tracking-wider">Credits</span>
              <span className="text-[16px] font-black text-[#FFCC00]">{user.credits}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F0FDF4] border-2 border-[#22C55E]/30 rounded-lg">
              <span className="text-[9px] font-black text-[#1a1a1a]/40 uppercase tracking-wider">Tazos</span>
              <span className="text-[16px] font-black text-[#22C55E]">{user.uniqueTazos}</span>
              <span className="text-[9px] font-bold text-[#1a1a1a]/30">/150</span>
            </div>
            {user.recentBattle && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FEF2F2] border-2 border-[#E3350D]/30 rounded-lg">
                <span className="text-[9px] font-black text-[#1a1a1a]/40 uppercase tracking-wider">Last Battle</span>
                <span className="text-[13px] font-black text-[#E3350D]">
                  {user.recentBattle.winner === "player" ? "🏆 Won" : user.recentBattle.winner === "opponent" ? "💥 Lost" : "🤝 Draw"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="mag-card border-2 border-[#1a1a1a] group transition-all hover:-translate-y-0.5 active:scale-[0.98]"
            style={{ boxShadow: "3px 3px 0px #1a1a1a15" }}
          >
            <div className="p-3 sm:p-4 flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                style={{ background: action.bg }}>
                <action.icon className="w-5 h-5" style={{ color: action.color }} />
              </div>
              <div>
                <div className="text-[10px] sm:text-[11px] font-black text-[#1a1a1a] uppercase tracking-wide">
                  {action.label}
                </div>
                <div className="text-[8px] text-[#1a1a1a]/30 font-bold mt-0.5 hidden sm:block">
                  {action.desc}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Series Quick Links ── */}
      <div className="mag-card border-2 border-[#1a1a1a] bg-white" style={{ boxShadow: "3px 3px 0px #1a1a1a10" }}>
        <div className="p-4">
          <h2 className="text-[10px] font-black text-[#1a1a1a]/40 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <Sparkles className="w-3 h-3" /> Explore Series
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {FRANCHISES.map((f) => (
              <Link
                key={f.slug}
                href={`/?page=collections`}
                className="text-center group transition-all hover:-translate-y-0.5"
              >
                <div className="w-full aspect-square rounded-xl mb-1.5 border-2 border-[#1a1a1a]/10 transition-colors group-hover:border-[#1a1a1a]/30"
                  style={{ background: `${f.color}15` }}>
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[24px]">{f.slug === "cybermon" ? "🤖" : f.slug === "dracobell" ? "🐉" : "🌟"}</span>
                  </div>
                </div>
                <div className="text-[9px] font-black text-[#1a1a1a]/50 uppercase tracking-wider group-hover:text-[#1a1a1a]/80">
                  {f.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
