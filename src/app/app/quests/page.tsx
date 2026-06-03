// ============================================================
// Trading Tazos Game — Quests Page
// Daily, Weekly, Special quests with progress tracking.
// ============================================================
"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import {
  Target, Swords, ShoppingBag, Package, Layers, Crosshair,
  Star, Sparkles, BookOpen, Coins, Gift,
  Loader2, Check, Clock
} from "lucide-react"

interface QuestData {
  id: string; title: string; description: string; icon: string
  category: string; difficulty: string; requirement: string
  target: number; rewardCredits: number; rewardTazoId: string | null
  orderIndex: number
}

interface UserQuestData {
  id: string; questId: string; progress: number
  completed: boolean; claimed: boolean; completedAt: string | null
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Target, Swords, ShoppingBag, Package, Layers, Crosshair,
  Star, Sparkles, BookOpen, Coins, Gift,
}

function catText(c: string) { return { beginner: "text-green-600", daily: "text-blue-600", weekly: "text-purple-600", special: "text-amber-600" }[c] || "text-zinc-600" }

const CATEGORY_COLORS: Record<string, string> = {
  beginner: "#22C55E",
  daily: "#3B4CCA",
  weekly: "#A855F7",
  special: "#F59E0B",
}

const CATEGORY_NAMES: Record<string, string> = {
  beginner: "Beginner",
  daily: "Daily",
  weekly: "Weekly",
  special: "Special",
}

const DIFFICULTY_BADGES: Record<string, { color: string; label: string }> = {
  easy: { color: "#22C55E", label: "EASY" },
  medium: { color: "#F59E0B", label: "MEDIUM" },
  hard: { color: "#E3350D", label: "HARD" },
}

export default function QuestsPage() {
  const { t } = useI18n()
  const { user, token } = useAuth()
  const [quests, setQuests] = useState<QuestData[]>([])
  const [userQuests, setUserQuests] = useState<UserQuestData[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [category, setCategory] = useState("all")
  const [credits, setCredits] = useState(0)

  const loadQuests = useCallback(async () => {
    try {
      const res = await fetch("/api/quests")
      const data = await res.json()
      setQuests(data.quests || [])
      setUserQuests(data.userQuests || [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { loadQuests() }, [loadQuests]) // eslint-disable-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (!token) return
    fetch("/api/credits", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setCredits(d.credits ?? 0))
      .catch(() => {})
  }, [token])

  const getUQ = (questId: string) => userQuests.find(uq => uq.questId === questId)

  const handleClaim = async (questId: string) => {
    if (!token) return
    setClaiming(questId)
    try {
      const res = await fetch("/api/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questId }),
      })
      const data = await res.json()
      if (res.ok) {
        setUserQuests(prev => prev.map(uq => uq.questId === questId ? { ...uq, claimed: true } : uq))
        setCredits(data.credits)
      }
    } catch { /* ignore */ }
    setClaiming(null)
  }

  const filtered = category === "all" ? quests : quests.filter(q => q.category === category)
  const completed = userQuests.filter(uq => uq.completed && uq.claimed).length

  if (!user) {
    return (
      
        <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
          <Target className="w-16 h-16 mx-auto text-zinc-400" />
          <h1 className="text-2xl font-black uppercase tracking-wider text-[#1a1a1a]">QUESTS</h1>
          <p className="text-sm text-zinc-500">{t.auth_login} to track quests</p>
          <a href="/login" className="mag-btn inline-block bg-[#FFCC00] text-[#1a1a1a] font-black uppercase px-6 py-3 border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
            {t.auth_login}
          </a>
        </div>
      
    )
  }

  return (
    
      <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
        {/* Credits display */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a] flex items-center gap-2">
            <Target className="w-5 h-5 text-[#E3350D]" /> QUESTS
          </h2>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#FFCC00] border-3 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]">
            <Coins className="w-5 h-5 text-[#1a1a1a]" />
            <span className="font-black text-sm text-[#1a1a1a]">{credits}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mag-card bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-black text-xs uppercase tracking-wider text-[#1a1a1a]">
              {completed}/{quests.length} QUESTS COMPLETED
            </span>
            <span className="font-black text-xs text-[#E3350D]">
              {Math.round((completed / Math.max(quests.length, 1)) * 100)}%
            </span>
          </div>
          <div className="w-full h-3 bg-zinc-200 border-2 border-[#1a1a1a] overflow-hidden">
            <div
              className="h-full bg-[#FFCC00] transition-all duration-300"
              style={{ width: `${Math.round((completed / Math.max(quests.length, 1)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap">
          {["all", "beginner", "daily", "weekly", "special"].map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider border-2 transition-all ${
                category === cat
                  ? "bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]"
                  : "bg-white text-[#1a1a1a] border-zinc-300 shadow-[2px_2px_0px_#1a1a1a] hover:border-[#FFCC00]"
              }`}
            >
              {CATEGORY_NAMES[cat] || "All"}
            </button>
          ))}
        </div>

        {/* Quest cards */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FFCC00]" />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(q => {
              const uq = getUQ(q.id)
              const IconComp = ICON_MAP[q.icon] || Target
              const catColor = CATEGORY_COLORS[q.category] || "#FFCC00"
              const diffBadge = DIFFICULTY_BADGES[q.difficulty] || DIFFICULTY_BADGES.easy
              const progress = uq?.progress || 0
              const isComplete = uq?.completed || false
              const isClaimed = uq?.claimed || false

              return (
                <div
                  key={q.id}
                  className={`mag-card bg-white p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4 transition-all ${
                    isClaimed ? "opacity-60" : ""
                  }`}
                >
                  {/* Icon */}
                  <div
                    className="w-12 h-12 shrink-0 flex items-center justify-center border-3 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]"
                    style={{ backgroundColor: catColor + "20" }}
                  >
                    <IconComp className={`w-6 h-6 ${catText(q.category)}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-sm uppercase tracking-wider text-[#1a1a1a]">
                        {q.title}
                      </h3>
                      <span
                        className="px-2 py-0.5 text-[8px] font-black uppercase border"
                        style={{ borderColor: catColor, color: catColor }}
                      >
                        {CATEGORY_NAMES[q.category]}
                      </span>
                      <span
                        className="px-2 py-0.5 text-[8px] font-black uppercase text-white"
                        style={{ backgroundColor: diffBadge.color }}
                      >
                        {diffBadge.label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 font-bold mt-1">{q.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-black">
                      <span className="flex items-center gap-1 text-[#F59E0B]">
                        <Coins className="w-3.5 h-3.5" /> +{q.rewardCredits} credits
                      </span>
                      {q.rewardTazoId && (
                        <span className="flex items-center gap-1 text-[#A855F7]">
                          <Gift className="w-3.5 h-3.5" /> +1 Tazo
                        </span>
                      )}
                    </div>
                    {/* Progress bar */}
                    {!isClaimed && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-zinc-200 border border-zinc-300 overflow-hidden">
                          <div
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, Math.round((progress / q.target) * 100))}%`,
                              backgroundColor: isComplete ? "#22C55E" : "#FFCC00",
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-[#1a1a1a]">{progress}/{q.target}</span>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="shrink-0">
                    {isClaimed ? (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase text-[#22C55E]">
                        <Check className="w-4 h-4" /> Claimed
                      </span>
                    ) : isComplete ? (
                      <button
                        onClick={() => handleClaim(q.id)}
                        disabled={claiming === q.id}
                        className="mag-btn px-5 py-2 font-black text-xs uppercase bg-[#FFCC00] text-[#1a1a1a] border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
                      >
                        {claiming === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "CLAIM"}
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-black text-zinc-400">
                        <Clock className="w-3.5 h-3.5" /> In progress
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            {filtered.length === 0 && (
              <p className="text-center text-sm text-zinc-400 py-8">No quests in this category</p>
            )}
          </div>
        )}
      </div>
    
  )
}
