"use client"

// ============================================================
// Trading Tazos Game — Admin Site Configuration
// Credits manager, promo codes, site toggles & general settings
// ============================================================
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  Settings, Coins, TicketPercent, Search, Loader2, Check, X,
  AlertTriangle, Save, Plus, Trash2, Edit3, Calendar, Clock,
  ToggleLeft, ToggleRight, Shield, Zap, Globe, ShoppingBag,
  RefreshCw, Gift, Key, Tag
} from "lucide-react"
import AdminShell from "@/components/admin/admin-shell"

// ── Types ──
interface ConfigEntry {
  key: string; value: any; updatedAt?: string; updatedBy?: string; isDefault?: boolean
}
interface PromoCode {
  id: string; code: string; description: string | null; type: string
  value: number; maxUses: number; usedCount: number; minLevel: number
  expiresAt: string | null; isActive: boolean; createdBy: string | null; createdAt: string
}
interface UserResult {
  id: string; email: string; name: string; displayName: string | null; credits: number
}
interface UserDetail extends UserResult {
  creditTransactions: { id: string; amount: number; source: string; reference: string | null; createdAt: string }[]
}

type TabId = "credits" | "promos" | "settings"

const TAB_DEFS: { id: TabId; label: string; icon: any; color: string }[] = [
  { id: "credits", label: "Credits", icon: Coins, color: 'var(--ttg-yellow)' },
  { id: "promos", label: "Promo Codes", icon: TicketPercent, color: 'var(--ttg-success)' },
  { id: "settings", label: "Settings", icon: Settings, color: 'var(--ttg-blue)' },
]

const PROMO_TYPES = [
  { slug: "credits", name: "Credits Bonus", icon: Coins, color: 'var(--ttg-yellow)', desc: "Gives credits to the redeeming user" },
  { slug: "bag", name: "Free Bag", icon: ShoppingBag, color: "var(--ttg-dracobell)", desc: "Grants a free bag purchase" },
  { slug: "design", name: "Design Slot", icon: Edit3, color: 'var(--ttg-purple)', desc: "Unlocks a custom tazo design" },
  { slug: "premium", name: "Premium Access", icon: Shield, color: "var(--ttg-yellow)", desc: "Grants premium features" },
]

const TYPE_COLORS: Record<string, string> = {
  credits: 'var(--ttg-yellow)', bag: "var(--ttg-dracobell)", design: 'var(--ttg-purple)', premium: "var(--ttg-yellow)",
}

// ── Main Component ──
export default function AdminSiteConfigPage() {
  const { user, loading: authLoading } = useAuth()
  const isAdmin = user?.email === "dev@tradingtazosgame.com"

  const [activeTab, setActiveTab] = useState<TabId>("credits")
  const [loading, setLoading] = useState(true)

  // ── Credits State ──
  const [userSearch, setUserSearch] = useState("")
  const [users, setUsers] = useState<UserResult[]>([])
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [creditAmount, setCreditAmount] = useState(100)
  const [creditNote, setCreditNote] = useState("")
  const [creditSaving, setCreditSaving] = useState(false)
  const [creditMsg, setCreditMsg] = useState("")

  // ── Promo Codes State ──
  const [promos, setPromos] = useState<PromoCode[]>([])
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null)
  const [showNewPromo, setShowNewPromo] = useState(false)
  const [promoMsg, setPromoMsg] = useState("")
  const [promoSaving, setPromoSaving] = useState(false)

  // New promo form
  const [newCode, setNewCode] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newType, setNewType] = useState("credits")
  const [newValue, setNewValue] = useState(100)
  const [newMaxUses, setNewMaxUses] = useState(100)
  const [newMinLevel, setNewMinLevel] = useState(0)
  const [newExpiresAt, setNewExpiresAt] = useState("")

  // Edit promo fields
  const [editCode, setEditCode] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editType, setEditType] = useState("credits")
  const [editValue, setEditValue] = useState(0)
  const [editMaxUses, setEditMaxUses] = useState(0)
  const [editMinLevel, setEditMinLevel] = useState(0)
  const [editExpiresAt, setEditExpiresAt] = useState("")
  const [editActive, setEditActive] = useState(true)

  // ── Settings State ──
  const [configs, setConfigs] = useState<ConfigEntry[]>([])
  const [configSaving, setConfigSaving] = useState<Record<string, boolean>>({})
  const [configMsg, setConfigMsg] = useState("")

  // ── Load Data ──
  useEffect(() => {
    if (!isAdmin) return
    const load = async () => {
      setLoading(true)
      try {
        const [promoRes, configRes] = await Promise.all([
          fetch("/api/admin/promo-codes", { credentials: "include" }).then(r => r.json()),
          fetch("/api/admin/site-config", { credentials: "include" }).then(r => r.json()),
        ])
        setPromos(promoRes.codes || [])
        setConfigs(configRes.configs || [])
      } catch (e) {
        console.error("Failed to load config data", e)
      }
      setLoading(false)
    }
    load()
  }, [isAdmin])

  // ── User Search ──
  const searchUsers = async () => {
    if (!userSearch.trim()) return
    try {
      const res = await fetch(`/api/admin/credits?search=${encodeURIComponent(userSearch)}`, { credentials: "include" })
      const data = await res.json()
      setUsers(data.users || [])
    } catch { /* ignore */ }
  }

  const loadUserDetail = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/credits?userId=${userId}`, { credentials: "include" })
      const data = await res.json()
      setSelectedUser(data.user || null)
    } catch { /* ignore */ }
  }

  // ── Give Credits ──
  const handleGiveCredits = async () => {
    if (!selectedUser || creditAmount === 0) return
    setCreditSaving(true)
    setCreditMsg("")
    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: creditAmount,
          note: creditNote || "Manual admin adjustment",
        }),
      })
      const data = await res.json()
      if (data.success) {
        setCreditMsg(`✅ ${creditAmount > 0 ? "Added" : "Removed"} ${Math.abs(creditAmount)} credits. New balance: ${data.user.credits}cr`)
        setSelectedUser(prev => prev ? { ...prev, credits: data.user.credits } : null)
      } else {
        setCreditMsg(`❌ ${data.error}`)
      }
    } catch (e: any) {
      setCreditMsg(`❌ ${e?.message || "Failed"}`)
    } finally {
      setCreditSaving(false)
    }
  }

  // ── Promo Code CRUD ──
  const createPromo = async () => {
    if (!newCode.trim()) return
    setPromoSaving(true)
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code: newCode, description: newDesc, type: newType, value: newValue,
          maxUses: newMaxUses, minLevel: newMinLevel,
          expiresAt: newExpiresAt || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setPromoMsg("✅ Promo code created!")
        setPromos(prev => [data.code, ...prev])
        setNewCode(""); setNewDesc(""); setShowNewPromo(false)
      } else {
        setPromoMsg(`❌ ${data.error}`)
      }
    } catch (e: any) {
      setPromoMsg(`❌ ${e?.message || "Failed"}`)
    } finally {
      setPromoSaving(false)
    }
  }

  const updatePromo = async (id: string) => {
    setPromoSaving(true)
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id, code: editCode, description: editDesc, type: editType, value: editValue,
          maxUses: editMaxUses, minLevel: editMinLevel, isActive: editActive,
          expiresAt: editExpiresAt || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setPromoMsg("✅ Promo code updated!")
        setPromos(prev => prev.map(p => p.id === id ? data.code : p))
        setEditingPromoId(null)
      } else {
        setPromoMsg(`❌ ${data.error}`)
      }
    } catch (e: any) {
      setPromoMsg(`❌ ${e?.message || "Failed"}`)
    } finally {
      setPromoSaving(false)
    }
  }

  const togglePromo = async (promo: PromoCode) => {
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: promo.id, isActive: !promo.isActive }),
      })
      const data = await res.json()
      if (data.success) {
        setPromos(prev => prev.map(p => p.id === promo.id ? data.code : p))
      }
    } catch { /* ignore */ }
  }

  const deletePromo = async (id: string) => {
    if (!confirm("Delete this promo code?")) return
    try {
      await fetch(`/api/admin/promo-codes?id=${id}`, { method: "DELETE", credentials: "include" })
      setPromos(prev => prev.filter(p => p.id !== id))
      setPromoMsg("🗑️ Promo code deleted")
    } catch { /* ignore */ }
  }

  const startEditPromo = (p: PromoCode) => {
    setEditingPromoId(p.id)
    setEditCode(p.code); setEditDesc(p.description || ""); setEditType(p.type)
    setEditValue(p.value); setEditMaxUses(p.maxUses); setEditMinLevel(p.minLevel)
    setEditActive(p.isActive)
    setEditExpiresAt(p.expiresAt ? new Date(p.expiresAt).toISOString().slice(0, 16) : "")
  }

  // ── Config CRUD ──
  const saveConfig = async (key: string, value: any) => {
    setConfigSaving(prev => ({ ...prev, [key]: true }))
    try {
      await fetch("/api/admin/site-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ key, value }),
      })
      setConfigs(prev => prev.map(c => c.key === key ? { ...c, value, isDefault: false } : c))
      setConfigMsg("✅ Setting saved")
      setTimeout(() => setConfigMsg(""), 2000)
    } catch {
      setConfigMsg("❌ Failed to save")
    } finally {
      setConfigSaving(prev => ({ ...prev, [key]: false }))
    }
  }

  // ── Config renders ──
  const CONFIG_LABELS: Record<string, { label: string; desc: string; type: "toggle" | "number" }> = {
    maintenance_mode: { label: "Maintenance Mode", desc: "Show maintenance page to all non-admin visitors", type: "toggle" },
    welcome_credits: { label: "Welcome Credits", desc: "Credits given to new users on registration", type: "number" },
    daily_quest_reward: { label: "Daily Quest Reward", desc: "Default credit reward for daily quests", type: "number" },
    pvp_enabled: { label: "PvP Battles", desc: "Enable player-vs-player matchmaking", type: "toggle" },
    shop_enabled: { label: "Shop Access", desc: "Enable the credit shop for purchases", type: "toggle" },
    trading_enabled: { label: "Trading System", desc: "Enable player-to-player tazo trading", type: "toggle" },
    registrations_open: { label: "Registrations", desc: "Allow new user registrations", type: "toggle" },
    max_tazos_per_collection: { label: "Max Tazos/Collection", desc: "Maximum tazos allowed per series collection", type: "number" },
  }

  if (!isAdmin && !authLoading) return <AdminShell accentColor="var(--ttg-cybermon)"><div className="p-10" /></AdminShell>

  return (
    <AdminShell accentColor="var(--ttg-cybermon)">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-ttg-cybermon" />
          <h1 className="text-lg font-black uppercase text-ttg-black tracking-wider">Site Configuration</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-ttg-yellow" /></div>
        ) : (
          <>
            {/* Tab Switcher */}
            <div className="flex bg-white border-2 border-ttg-black p-0.5 shadow-[2px_2px_0px_var(--ttg-black)] w-fit">
              {TAB_DEFS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? "text-white"
                      : "text-ttg-black/40 hover:text-ttg-black"
                  }`}
                  style={{ backgroundColor: activeTab === tab.id ? tab.color : "transparent" }}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ═══════ CREDITS TAB ═══════ */}
            {activeTab === "credits" && (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* User Search */}
                <div className="lg:col-span-1">
                  <div className="mag-card p-5 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] space-y-4 sticky top-24">
                    <h2 className="text-sm font-black uppercase tracking-wider text-ttg-black flex items-center gap-2">
                      <Search className="w-4 h-4 text-ttg-yellow" /> Find User
                    </h2>
                    <div className="flex gap-2">
                      <input
                        type="text" value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && searchUsers()}
                        placeholder="Search by email or name..."
                        className="flex-1 border-2 border-ttg-black bg-white px-3 py-2 text-xs font-bold text-ttg-black placeholder:text-ttg-black/30 outline-none focus:border-ttg-yellow"
                      />
                      <button onClick={searchUsers}
                        className="px-3 py-2 bg-ttg-yellow text-ttg-black border-2 border-ttg-black shadow-[2px_2px_0px_var(--ttg-black)] font-black text-[10px] uppercase tracking-wider hover:shadow-[1px_1px_0px] transition-all">
                        Find
                      </button>
                    </div>

                    {users.length > 0 && (
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {users.map(u => (
                          <button
                            key={u.id}
                            onClick={() => loadUserDetail(u.id)}
                            className={`w-full text-left px-3 py-2 border-2 text-xs transition-all ${
                              selectedUser?.id === u.id
                                ? "border-ttg-yellow bg-ttg-yellow/5"
                                : "border-ttg-black/10 hover:border-ttg-yellow/30 bg-white"
                            }`}
                          >
                            <p className="font-black text-ttg-black truncate">{u.displayName || u.name}</p>
                            <p className="text-[9px] font-bold text-ttg-black/40">{u.email}</p>
                            <p className="text-[9px] font-black text-ttg-yellow">{u.credits} cr</p>
                          </button>
                        ))}
                      </div>
                    )}

                    {userSearch && users.length === 0 && (
                      <p className="text-[10px] font-bold text-ttg-black/30 text-center py-4">No users found</p>
                    )}
                  </div>
                </div>

                {/* Credit Action */}
                <div className="lg:col-span-2 space-y-4">
                  {selectedUser ? (
                    <>
                      <div className="mag-card p-5 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] bg-white">
                        <h2 className="text-sm font-black uppercase tracking-wider text-ttg-black mb-4">Credit Adjustment</h2>
                        <div className="grid sm:grid-cols-2 gap-4 mb-4">
                          <div className="bg-ttg-black/5 p-3 border border-ttg-black/10">
                            <span className="text-[8px] font-black uppercase text-ttg-black/40">User</span>
                            <p className="text-sm font-black text-ttg-black">{selectedUser.displayName || selectedUser.name}</p>
                            <p className="text-[9px] font-bold text-ttg-black/40">{selectedUser.email}</p>
                          </div>
                          <div className="bg-ttg-yellow/10 p-3 border border-ttg-yellow/20">
                            <span className="text-[8px] font-black uppercase text-ttg-yellow/60">Current Balance</span>
                            <p className="text-2xl font-black text-ttg-yellow tabular-nums">{selectedUser.credits} <span className="text-sm">cr</span></p>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-3 mb-4">
                          <div>
                            <label className="block text-[9px] font-black uppercase text-ttg-black/40 mb-1">Amount</label>
                            <div className="flex gap-1">
                              <input type="number" value={creditAmount}
                                onChange={e => setCreditAmount(parseInt(e.target.value) || 0)}
                                className="w-full border-2 border-ttg-black bg-white px-3 py-2 text-sm font-black text-ttg-black outline-none focus:border-ttg-yellow tabular-nums"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[9px] font-black uppercase text-ttg-black/40 mb-1">Quick Amounts</label>
                            <div className="flex gap-1">
                              {[50, 100, 500, 1000].map(a => (
                                <button key={a} onClick={() => setCreditAmount(a)}
                                  className={`px-2 py-2 text-[9px] font-black border-2 transition-all tabular-nums ${
                                    creditAmount === a
                                      ? "bg-ttg-yellow border-ttg-black text-ttg-black shadow-[1px_1px_0px_var(--ttg-black)]"
                                      : "bg-white border-ttg-black/20 text-ttg-black/40 hover:border-ttg-yellow"
                                  }`}>+{a}</button>
                              ))}
                            </div>
                          </div>
                          <div>
                          </div>
                        </div>
                        <div className="mb-4">
                          <label className="block text-[9px] font-black uppercase text-ttg-black/40 mb-1">Note (visible in transaction history)</label>
                          <input type="text" value={creditNote}
                            onChange={e => setCreditNote(e.target.value)}
                            placeholder="e.g. Bug bounty reward, compensation..."
                            className="w-full border-2 border-ttg-black bg-white px-3 py-2 text-xs font-bold text-ttg-black placeholder:text-ttg-black/20 outline-none focus:border-ttg-yellow"
                          />
                        </div>

                        <div className="flex gap-2 items-center">
                          <button onClick={handleGiveCredits} disabled={creditSaving || creditAmount === 0}
                            className={`mag-btn px-5 py-2.5 text-[10px] font-black uppercase tracking-wider border-2 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)] hover:shadow-[1px_1px_0px] hover:translate-x-[0.5px] hover:translate-y-[0.5px] transition-all flex items-center gap-1.5 disabled:opacity-40 ${
                              creditAmount > 0 ? "bg-ttg-success text-white" : "bg-ttg-red text-white"
                            }`}>
                            {creditSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : creditAmount > 0 ? <Plus className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            {creditAmount > 0 ? `Give ${creditAmount} Credits` : `Remove ${Math.abs(creditAmount)} Credits`}
                          </button>
                          <button onClick={() => { setCreditAmount(-Math.abs(creditAmount)) }}
                            className="text-[9px] font-bold text-ttg-red/50 hover:text-ttg-red underline">
                            Switch to Remove
                          </button>
                        </div>

                        {creditMsg && (
                          <div className={`mt-3 p-3 border-2 text-xs font-bold ${
                            creditMsg.startsWith("✅") ? "border-ttg-success bg-ttg-success/5 text-ttg-success" : "border-ttg-red bg-ttg-red/5 text-ttg-red"
                          }`}>{creditMsg}</div>
                        )}
                      </div>

                      {/* Transaction History */}
                      <div className="mag-card p-5 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] bg-white">
                        <h3 className="text-xs font-black uppercase tracking-wider text-ttg-black/50 mb-3 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" /> Recent Transactions
                        </h3>
                        {selectedUser.creditTransactions.length === 0 ? (
                          <p className="text-[10px] font-bold text-ttg-black/20 text-center py-4">No transactions yet</p>
                        ) : (
                          <div className="space-y-1 max-h-64 overflow-y-auto">
                            {selectedUser.creditTransactions.map(tx => (
                              <div key={tx.id} className="flex items-center justify-between py-1.5 px-2 border-b border-ttg-black/5 text-[10px]">
                                <div>
                                  <span className="font-black text-ttg-black">{tx.source}</span>
                                  {tx.reference && <span className="text-ttg-black/30 ml-2 font-bold">{tx.reference}</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-bold text-ttg-black/20">{new Date(tx.createdAt).toLocaleDateString()}</span>
                                  <span className={`font-black tabular-nums ${tx.amount > 0 ? "text-ttg-success" : "text-ttg-red"}`}>
                                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="mag-card p-10 border-3 border-ttg-black border-dashed text-center">
                      <Search className="w-10 h-10 text-ttg-black/10 mx-auto mb-3" />
                      <p className="text-sm font-black text-ttg-black/20 uppercase">Search for a user to manage credits</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══════ PROMO CODES TAB ═══════ */}
            {activeTab === "promos" && (
              <div className="space-y-4">
                {/* Message */}
                {promoMsg && (
                  <div className={`p-3 border-3 text-sm font-black ${
                    promoMsg.startsWith("✅") || promoMsg.startsWith("🗑️")
                      ? "border-ttg-success bg-ttg-success/5 text-ttg-success"
                      : "border-ttg-red bg-ttg-red/5 text-ttg-red"
                  }`}>{promoMsg}</div>
                )}

                {/* Create Promo Form */}
                {showNewPromo && (
                  <div className="mag-card p-5 border-3 border-ttg-success shadow-[4px_4px_0px_var(--ttg-success)] bg-white">
                    <h3 className="text-sm font-black uppercase tracking-wider text-ttg-success mb-4 flex items-center gap-2">
                      <Gift className="w-4 h-4" /> New Promo Code
                    </h3>
                    <div className="grid sm:grid-cols-3 gap-3 mb-4">
                      <div>
                        <label className="text-[9px] font-black uppercase text-ttg-black/40 mb-0.5 block">Code *</label>
                        <input type="text" value={newCode}
                          onChange={e => setNewCode(e.target.value.toUpperCase())}
                          placeholder="WELCOME50"
                          className="w-full border-2 border-ttg-black bg-white px-3 py-2 text-sm font-black text-ttg-black uppercase placeholder:text-ttg-black/15 outline-none focus:border-ttg-success"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-ttg-black/40 mb-0.5 block">Type</label>
                        <select value={newType} onChange={e => setNewType(e.target.value)}
                          className="w-full border-2 border-ttg-black bg-white px-3 py-2 text-xs font-bold text-ttg-black uppercase outline-none focus:border-ttg-success">
                          {PROMO_TYPES.map(t => <option key={t.slug} value={t.slug}>{t.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-ttg-black/40 mb-0.5 block">
                          {newType === "credits" ? "Credits" : newType === "bag" ? "Bag ID" : newType === "design" ? "Design ID" : "Value"}
                        </label>
                        <input type="number" value={newValue}
                          onChange={e => setNewValue(parseInt(e.target.value) || 0)}
                          className="w-full border-2 border-ttg-black bg-white px-3 py-2 text-sm font-black text-ttg-black tabular-nums outline-none focus:border-ttg-success"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-ttg-black/40 mb-0.5 block">Max Uses</label>
                        <input type="number" value={newMaxUses}
                          onChange={e => setNewMaxUses(parseInt(e.target.value) || 0)}
                          className="w-full border-2 border-ttg-black bg-white px-3 py-2 text-sm font-black text-ttg-black tabular-nums outline-none focus:border-ttg-success"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-ttg-black/40 mb-0.5 block">Min Level</label>
                        <input type="number" value={newMinLevel}
                          onChange={e => setNewMinLevel(parseInt(e.target.value) || 0)}
                          className="w-full border-2 border-ttg-black bg-white px-3 py-2 text-sm font-black text-ttg-black tabular-nums outline-none focus:border-ttg-success"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-ttg-black/40 mb-0.5 block">Expires (optional)</label>
                        <input type="datetime-local" value={newExpiresAt}
                          onChange={e => setNewExpiresAt(e.target.value)}
                          className="w-full border-2 border-ttg-black bg-white px-3 py-2 text-xs font-bold text-ttg-black outline-none focus:border-ttg-success"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-ttg-black/40 mb-0.5 block">Description</label>
                        <input type="text" value={newDesc}
                          onChange={e => setNewDesc(e.target.value)}
                          placeholder="Admin note..."
                          className="w-full border-2 border-ttg-black bg-white px-3 py-2 text-xs font-bold text-ttg-black placeholder:text-ttg-black/20 outline-none focus:border-ttg-success"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={createPromo} disabled={promoSaving || !newCode.trim()}
                        className="mag-btn px-5 py-2.5 text-[10px] font-black uppercase bg-ttg-success text-white border-2 border-ttg-black shadow-[2px_2px_0px_var(--ttg-black)] flex items-center gap-1.5 hover:shadow-[1px_1px_0px] transition-all disabled:opacity-40">
                        <Plus className="w-3.5 h-3.5" /> Create Code
                      </button>
                      <button onClick={() => setShowNewPromo(false)}
                        className="mag-btn px-5 py-2.5 text-[10px] font-black uppercase bg-white border-2 border-ttg-black flex items-center gap-1.5 hover:shadow-[1px_1px_0px] transition-all">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                )}
                {!showNewPromo && (
                  <button onClick={() => setShowNewPromo(true)}
                    className="mag-btn px-5 py-3 text-[10px] font-black uppercase bg-ttg-success text-white border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] flex items-center gap-2 hover:shadow-[2px_2px_0px] hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                    <Plus className="w-4 h-4" /> Create New Promo Code
                  </button>
                )}

                {/* Promo List */}
                {promos.length === 0 ? (
                  <div className="mag-card p-10 border-3 border-dashed border-ttg-black text-center">
                    <TicketPercent className="w-10 h-10 text-ttg-black/10 mx-auto mb-3" />
                    <p className="text-sm font-black text-ttg-black/20 uppercase">No promo codes yet</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {promos.map(p => {
                      const isEditing = editingPromoId === p.id
                      const expired = p.expiresAt && new Date(p.expiresAt) < new Date()
                      const exhausted = p.maxUses > 0 && p.usedCount >= p.maxUses
                      const typeColor = TYPE_COLORS[p.type] || "#999"

                      return (
                        <div key={p.id} className={`mag-card border-3 bg-white shadow-[3px_3px_0px_var(--ttg-black)] transition-all ${
                          p.isActive && !expired && !exhausted ? "border-ttg-black/10" : "border-ttg-black/5 opacity-60"
                        }`}>
                          <div className="p-4">
                            {isEditing ? (
                              <div className="grid sm:grid-cols-4 gap-2 mb-3">
                                <div><label className="text-[8px] font-black text-ttg-black/40 uppercase">Code</label><input value={editCode} onChange={e => setEditCode(e.target.value.toUpperCase())} className="w-full p-1.5 border-2 border-ttg-black text-xs font-black uppercase" /></div>
                                <div><label className="text-[8px] font-black text-ttg-black/40 uppercase">Type</label><select value={editType} onChange={e => setEditType(e.target.value)} className="w-full p-1.5 border-2 border-ttg-black text-xs font-bold">{PROMO_TYPES.map(t => <option key={t.slug} value={t.slug}>{t.name}</option>)}</select></div>
                                <div><label className="text-[8px] font-black text-ttg-black/40 uppercase">Value</label><input type="number" value={editValue} onChange={e => setEditValue(parseInt(e.target.value) || 0)} className="w-full p-1.5 border-2 border-ttg-black text-xs font-bold tabular-nums" /></div>
                                <div><label className="text-[8px] font-black text-ttg-black/40 uppercase">Active</label><select value={editActive ? "true" : "false"} onChange={e => setEditActive(e.target.value === "true")} className="w-full p-1.5 border-2 border-ttg-black text-xs font-bold"><option value="true">✅ Active</option><option value="false">❌ Disabled</option></select></div>
                                <div><label className="text-[8px] font-black text-ttg-black/40 uppercase">Max Uses</label><input type="number" value={editMaxUses} onChange={e => setEditMaxUses(parseInt(e.target.value) || 0)} className="w-full p-1.5 border-2 border-ttg-black text-xs font-bold tabular-nums" /></div>
                                <div><label className="text-[8px] font-black text-ttg-black/40 uppercase">Min Level</label><input type="number" value={editMinLevel} onChange={e => setEditMinLevel(parseInt(e.target.value) || 0)} className="w-full p-1.5 border-2 border-ttg-black text-xs font-bold tabular-nums" /></div>
                                <div><label className="text-[8px] font-black text-ttg-black/40 uppercase">Expires</label><input type="datetime-local" value={editExpiresAt} onChange={e => setEditExpiresAt(e.target.value)} className="w-full p-1.5 border-2 border-ttg-black text-xs font-bold" /></div>
                                <div><label className="text-[8px] font-black text-ttg-black/40 uppercase">Description</label><input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full p-1.5 border-2 border-ttg-black text-xs font-bold" /></div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-ttg-black" style={{ backgroundColor: typeColor + "20" }}>
                                  <Key className="w-5 h-5" style={{ color: typeColor }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-sm font-black text-ttg-black font-mono tracking-wider">{p.code}</h3>
                                    <span className="text-[8px] font-black px-1.5 py-0.5 border uppercase" style={{ color: typeColor, borderColor: typeColor + "40" }}>{p.type}</span>
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 border uppercase ${
                                      p.isActive && !expired && !exhausted ? "text-ttg-success border-ttg-success/30" : "text-ttg-red border-ttg-red/30"
                                    }`}>
                                      {p.isActive ? (expired ? "EXPIRED" : exhausted ? "EXHAUSTED" : "ACTIVE") : "DISABLED"}
                                    </span>
                                  </div>
                                  <div className="flex gap-3 mt-1 text-[9px] font-bold text-ttg-black/30">
                                    <span>{p.type === "credits" ? `${p.value}cr` : `ID: ${p.value}`}</span>
                                    <span>· Uses: {p.usedCount}/{p.maxUses || "∞"}</span>
                                    {p.minLevel > 0 && <span>· Min Lv. {p.minLevel}</span>}
                                    {p.expiresAt && <span className={expired ? "text-ttg-red" : ""}>· {expired ? "Expired " : "Expires "}{new Date(p.expiresAt).toLocaleDateString()}</span>}
                                  </div>
                                  {p.description && <p className="text-[9px] font-bold text-ttg-black/20 mt-0.5">{p.description}</p>}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-1 mt-3 pt-3 border-t border-ttg-black/5">
                              {isEditing ? (
                                <>
                                  <button onClick={() => updatePromo(p.id)} disabled={promoSaving}
                                    className="p-2 hover:bg-ttg-success/10 transition-colors" title="Save">
                                    <Check className="w-4 h-4 text-ttg-success" />
                                  </button>
                                  <button onClick={() => setEditingPromoId(null)}
                                    className="p-2 hover:bg-ttg-red/10 transition-colors" title="Cancel">
                                    <X className="w-4 h-4 text-ttg-red" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEditPromo(p)}
                                    className="p-2 hover:bg-ttg-yellow/10 transition-colors" title="Edit">
                                    <Edit3 className="w-4 h-4 text-ttg-black/50" />
                                  </button>
                                  <button onClick={() => togglePromo(p)}
                                    className="p-2 hover:bg-ttg-yellow/10 transition-colors" title={p.isActive ? "Active — click to disable" : "Disabled — click to activate"}>
                                    <span className={`text-[9px] font-black px-1 py-0.5 border ${p.isActive ? "text-ttg-success border-ttg-success/30" : "text-ttg-red border-ttg-red/30"}`}>{p.isActive ? "ON" : "OFF"}</span>
                                  </button>
                                  <button onClick={() => deletePromo(p.id)}
                                    className="p-2 hover:bg-ttg-red/10 transition-colors" title="Delete">
                                    <Trash2 className="w-4 h-4 text-ttg-red/50" />
                                  </button>
                                </>
                              )}
                              <span className="ml-auto text-[8px] font-bold text-ttg-black/15">
                                {p.createdBy && <>by {p.createdBy} · </>}
                                {new Date(p.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═══════ SETTINGS TAB ═══════ */}
            {activeTab === "settings" && (
              <div className="space-y-4">
                {configMsg && (
                  <div className={`p-3 border-3 text-sm font-black ${configMsg.startsWith("✅") ? "border-ttg-success bg-ttg-success/5 text-ttg-success" : "border-ttg-red bg-ttg-red/5 text-ttg-red"}`}>{configMsg}</div>
                )}

                <div className="mag-card border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] bg-white">
                  <div className="px-5 py-3 border-b-2 border-ttg-black bg-ttg-black/0.02">
                    <h2 className="text-sm font-black uppercase tracking-wider text-ttg-black flex items-center gap-2">
                      <Globe className="w-4 h-4 text-ttg-blue" /> Site Settings
                    </h2>
                  </div>
                  <div className="divide-y divide-ttg-black/5">
                    {configs.filter(c => CONFIG_LABELS[c.key]).map(cfg => {
                      const meta = CONFIG_LABELS[cfg.key]
                      const isSaving = configSaving[cfg.key]

                      return (
                        <div key={cfg.key} className="p-4 flex items-center justify-between gap-4 hover:bg-ttg-black/0.01 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-black uppercase text-ttg-black">{meta.label}</h3>
                              {!cfg.isDefault && <span className="text-[7px] font-black bg-ttg-warning/10 text-ttg-warning px-1.5 py-0.5 uppercase">Custom</span>}
                            </div>
                            <p className="text-[9px] font-bold text-ttg-black/30 mt-0.5">{meta.desc}</p>
                            {cfg.updatedAt && !cfg.isDefault && (
                              <p className="text-[7px] font-bold text-ttg-black/15 mt-0.5">
                                Updated {new Date(cfg.updatedAt).toLocaleDateString()} by {cfg.updatedBy || "—"}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {meta.type === "toggle" ? (
                              <button
                                onClick={() => saveConfig(cfg.key, !cfg.value)}
                                disabled={isSaving}
                                className="transition-transform hover:scale-110 active:scale-95"
                                title={cfg.value ? "Enabled — click to disable" : "Disabled — click to enable"}
                              >
                                {cfg.value ? (
                                  <ToggleRight className="w-8 h-8 text-ttg-success" />
                                ) : (
                                  <ToggleLeft className="w-8 h-8 text-ttg-black/20" />
                                )}
                              </button>
                            ) : (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={cfg.value}
                                  onChange={e => {
                                    const v = parseInt(e.target.value) || 0
                                    setConfigs(prev => prev.map(c => c.key === cfg.key ? { ...c, value: v } : c))
                                  }}
                                  className="w-20 border-2 border-ttg-black px-2 py-1.5 text-xs font-black text-ttg-black tabular-nums outline-none focus:border-ttg-blue text-center"
                                />
                                <button
                                  onClick={() => saveConfig(cfg.key, cfg.value)}
                                  disabled={isSaving}
                                  className="p-1.5 hover:bg-ttg-success/10 transition-colors"
                                  title="Save"
                                >
                                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-ttg-blue" /> : <Save className="w-4 h-4 text-ttg-success" />}
                                </button>
                              </div>
                            )}
                            {isSaving && meta.type === "toggle" && <Loader2 className="w-4 h-4 animate-spin text-ttg-blue" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Unconfigured keys info */}
                <div className="mag-card p-4 border-2 border-ttg-black/10 bg-ttg-black/0.01">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-3.5 h-3.5 text-ttg-black/30" />
                    <span className="text-[10px] font-black uppercase text-ttg-black/30">
                      Config Keys — {configs.length} total
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {configs.map(c => (
                      <span key={c.key}
                        className={`text-[8px] font-mono font-bold px-1.5 py-0.5 border ${
                          c.isDefault ? "text-ttg-black/20 border-ttg-black/5" : "text-ttg-blue border-ttg-blue/20"
                        }`}>
                        {c.key}
                      </span>
                    ))}
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
