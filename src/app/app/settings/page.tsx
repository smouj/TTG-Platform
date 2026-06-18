// ============================================================
// Trading Tazos Game — Settings Page v2
// Magazine style with: Profile, Connections, Language,
// Visual, Sound, Account sections.
// ============================================================
"use client"
import Image from "next/image"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import { type Lang } from "@/lib/i18n/types"
import { TOTAL_PLANNED } from "@/lib/franchise-config"
import {
  User, Settings, LogOut, Disc3, Layers, Coins,
  Mail, Calendar, Shield, Edit3, Check, X, Upload, Trash2, Lock, FileJson, AlertCircle,
  Globe, Volume2, VolumeX, Sun, Moon, Monitor,
  Music, Radio, Link as LinkIcon, TicketPercent,
  Loader2,
} from "lucide-react"
import UserIdCard from "@/components/game/user-id-card"

// ── localStorage helpers ────────────────────────────
const LS_KEYS = {
  soundEnabled: "ttg-sound",
  musicEnabled: "ttg-music",
  sfxEnabled: "ttg-sfx",
  masterVolume: "ttg-volume",
  theme: "ttg-theme",
  reducedMotion: "ttg-reduced-motion",
  effectsEnabled: "ttg-effects",
} as const

function getLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const v = localStorage.getItem(key)
    return v !== null ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function setLS<T>(key: string, value: T) {
  if (typeof window === "undefined") return
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

// ── Toggle row component ─────────────────────────────
function ToggleRow({ icon: Icon, label, description, checked, onChange }: {
  icon: any; label: string; description?: string
  checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b-2 border-ttg-black/05 last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="w-4 h-4 text-ttg-black/40 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-black text-ttg-black uppercase">{label}</p>
          {description && <p className="text-[9px] font-bold text-ttg-black/30">{description}</p>}
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full border-2 transition-colors flex-shrink-0 ${checked ? "bg-ttg-success border-ttg-success" : "bg-ttg-black/10 border-ttg-black/20"}`}
      >
        <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white border border-ttg-black/20 transition-transform ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  )
}

// ── Slider row ───────────────────────────────────────
function SliderRow({ icon: Icon, label, value, onChange, min = 0, max = 100 }: {
  icon: any; label: string; value: number; onChange: (v: number) => void
  min?: number; max?: number
}) {
  return (
    <div className="flex items-center gap-3 py-3 px-4">
      <Icon className="w-4 h-4 text-ttg-black/40 flex-shrink-0" />
      <span className="text-xs font-black text-ttg-black uppercase w-20 flex-shrink-0">{label}</span>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-2 appearance-none bg-ttg-black/10 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ttg-yellow [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-ttg-black [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[2px_2px_0px_var(--ttg-black)]"
      />
      <span className="text-[10px] font-black text-ttg-black/50 w-8 text-right tabular-nums">{value}%</span>
    </div>
  )
}

export default function SettingsPage() {
  const { t, lang, setLang, langs } = useI18n()
  const { user, logout, token, refresh } = useAuth()
  const [credits, setCredits] = useState<number | null>(null)
  const [memberSince, setMemberSince] = useState<string>("2026")

  // ── Redeem Code ──
  const [redeemCode, setRedeemCode] = useState("")
  const [redeemStatus, setRedeemStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [redeemMessage, setRedeemMessage] = useState("")

  // ── Local state ──
  const [editingName, setEditingName] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [editingAvatar, setEditingAvatar] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [bio, setBio] = useState("")
  const [editingBio, setEditingBio] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imgError, setImgError] = useState(false)

  // Password change
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{type: "success"|"error", text: string} | null>(null)

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [musicEnabled, setMusicEnabled] = useState(true)
  const [sfxEnabled, setSfxEnabled] = useState(true)
  const [masterVolume, setMasterVolume] = useState(80)

  // Visual settings
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("auto")
  const [reducedMotion, setReducedMotion] = useState(false)
  const [effectsEnabled, setEffectsEnabled] = useState(true)

  // ── Load from localStorage ──
  useEffect(() => {
    setSoundEnabled(getLS(LS_KEYS.soundEnabled, true))
    setMusicEnabled(getLS(LS_KEYS.musicEnabled, true))
    setSfxEnabled(getLS(LS_KEYS.sfxEnabled, true))
    setMasterVolume(getLS(LS_KEYS.masterVolume, 80))
    setTheme(getLS(LS_KEYS.theme, "auto"))
    setReducedMotion(getLS(LS_KEYS.reducedMotion, false))
    setEffectsEnabled(getLS(LS_KEYS.effectsEnabled, true))
  }, [])

  // ── Persist to localStorage ──
  const persistBool = useCallback((key: string, setter: (v: boolean) => void) => (val: boolean) => {
    setter(val); setLS(key, val)
  }, [])
  const persistNum = useCallback((key: string, setter: (v: number) => void) => (val: number) => {
    setter(val); setLS(key, val)
  }, [])

  // ── Fetch credits ──
  useEffect(() => {
    if (!token) return
    fetch("/api/credits", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setCredits(d.credits ?? 0))
      .catch(() => setCredits(0))
  }, [token])

  // ── Member since ──
  useEffect(() => {
    if (!user) return
    const createdAt = (user as any).createdAt || (user as any).created_at
    if (createdAt) {
      try {
        setMemberSince(new Date(createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }))
      } catch {}
    }
  }, [user])

  // ── Init fields ──
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.name || "")
      setAvatarUrl(user.avatarUrl || "")
      setBio((user as any).bio || "")
    }
  }, [user])

  // ── Save profile ──
  const saveProfile = async () => {
    if (!token) return
    setSaving(true)
    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName || null, avatarUrl: avatarUrl || null, bio: bio || null }),
      })
      if (res.ok) {
        // Update user state via refresh
        if (refresh) refresh()
        setEditingName(false)
        setEditingAvatar(false)
        setEditingBio(false)
      }
    } catch {} finally { setSaving(false) }
  }


  // ── Upload avatar from computer ──
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        setAvatarUrl(data.avatarUrl)
        if (refresh) refresh()
      } else {
        alert(data.error || 'Upload failed')
      }
    } catch {
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  // ── Remove avatar ──
  const handleRemoveAvatar = async () => {
    if (!token) return
    try {
      await fetch('/api/user/avatar', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setAvatarUrl('')
      if (refresh) refresh()
    } catch {}
  }

  // ── Change password ──
  const handlePasswordChange = async () => {
    if (!token || !currentPassword || !newPassword) return
    if (newPassword.length < 10) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 10 characters' })
      return
    }
    setChangingPassword(true)
    setPasswordMessage(null)
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully' })
        setCurrentPassword('')
        setNewPassword('')
        setShowPasswordChange(false)
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password' })
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setChangingPassword(false)
    }
  }

  // ── Not logged in ──
  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-5">
        <Shield className="w-14 h-14 mx-auto text-ttg-black/15" />
        <p className="text-sm font-black uppercase tracking-wider text-ttg-black/40">
          {t.auth_login || "Sign In"} to view settings
        </p>
        <Link href={`/login?redirect=${encodeURIComponent("/app/settings")}`}
          className="mag-btn inline-block bg-ttg-red text-white px-8 py-3.5 text-xs font-black uppercase tracking-widest border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_var(--ttg-black)] transition-all">
          {t.auth_login || "Sign In"}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto w-full py-4 sm:py-6 space-y-4 sm:space-y-5">

      {/* ═══ BANNER ═══ */}
      <div className="px-4 py-3 flex flex-wrap items-center gap-3 relative overflow-hidden"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.025) 6px, rgba(255,255,255,0.025) 12px), linear-gradient(90deg, var(--ttg-black) 0%, #2a2a2a 100%)`,
          border: "3px solid var(--ttg-black)",
          boxShadow: "4px 4px 0px var(--ttg-yellow)",
        }}>
        <div className="flex items-center gap-1.5">
          <Settings className="w-5 h-5 text-ttg-yellow" />
          <h1 className="text-sm sm:text-lg font-black text-white uppercase tracking-tight">
            {t.settings_title || "SETTINGS"}
          </h1>
        </div>
        <div className="w-px h-5 bg-white/15" />
        <div className="flex items-center gap-1">
          <Disc3 className="w-4 h-4 text-ttg-yellow" />
          <span className="text-sm font-black text-ttg-yellow tracking-tight">{user.tazoCount ?? 0} TAZOS</span>
        </div>
        <div className="w-px h-5 bg-white/15" />
        <div className="flex items-center gap-1">
          <Layers className="w-4 h-4 text-ttg-blue" />
          <span className="text-sm font-black text-ttg-blue tracking-tight">{user.deckCount ?? 0} DECKS</span>
        </div>
        <span className="text-xs font-black text-white/30 uppercase tracking-wider ml-auto truncate max-w-[200px]">{user.email}</span>
      </div>

      {/* ═══ User ID Card ═══ */}
      {user && (
        <UserIdCard
          user={{
            id: user.id,
            name: user.name || "",
            displayName: user.displayName || null,
            avatarUrl: user.avatarUrl || null,
            bio: user.bio || null,
            level: (user as any).level || 1,
            xp: (user as any).xp || 0,
            xpToNext: (user as any).xpToNext || 100,
            credits: user.credits || 0,
            totalBattles: (user as any).totalBattles || 0,
            totalWins: (user as any).totalWins || 0,
            totalLosses: (user as any).totalLosses || 0,
            totalTazosOwned: (user as any).totalTazosOwned || 0,
            totalBagsOpened: (user as any).totalBagsOpened || 0,
            totalQuestsDone: (user as any).totalQuestsDone || 0,
            joinDate: (user as any).joinDate || (user as any).createdAt || new Date().toISOString(),
          }}
          variant="compact"
        />
      )}

      {/* ═══ CONTENT GRID ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">

          {/* ── PROFILE CARD ── */}
          <div className="border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] p-5 sm:p-6 space-y-5 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-ttg-black/40 uppercase tracking-[0.2em] flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Profile
              </h2>
              <button onClick={saveProfile} disabled={saving}
                className="mag-btn bg-ttg-success text-white px-4 py-1.5 text-[10px] font-black uppercase tracking-wider border-2 border-ttg-black shadow-[2px_2px_0px_var(--ttg-black)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>

            {/* Avatar row */}
            <div className="flex items-start gap-4">
              <div className="relative group">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-ttg-yellow border-3 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)] flex items-center justify-center overflow-hidden">
                  {avatarUrl && !imgError ? (
                    <Image src={avatarUrl} alt="" fill className="object-cover" sizes="96px" unoptimized
                      onError={() => setImgError(true)} />
                  ) : (
                    <User className="w-10 h-10 sm:w-12 sm:h-12 text-ttg-black/40" />
                  )}
                </div>
                <button onClick={() => setEditingAvatar(!editingAvatar)}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-ttg-black border-2 border-ttg-yellow flex items-center justify-center hover:bg-ttg-black/80 transition-colors">
                  <Edit3 className="w-3 h-3 text-ttg-yellow" />
                </button>
              </div>
              <div className="flex-1 space-y-3 min-w-0">
                {/* Display name */}
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm font-black text-ttg-black border-2 border-ttg-black bg-ttg-cream focus:outline-none focus:border-ttg-yellow uppercase"
                      placeholder="Display name" autoFocus maxLength={30} />
                    <button onClick={() => setEditingName(false)} className="p-1.5 hover:bg-red-50"><X className="w-3.5 h-3.5 text-red-500" /></button>
                    <button onClick={() => { saveProfile(); setEditingName(false) }} className="p-1.5 hover:bg-green-50"><Check className="w-3.5 h-3.5 text-green-500" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/name">
                    <h3 className="text-lg sm:text-xl font-black text-ttg-black uppercase tracking-tight truncate">
                      {displayName || user.name}
                    </h3>
                    <button onClick={() => setEditingName(true)}
                      className="opacity-0 group-hover/name:opacity-100 p-1 hover:bg-ttg-black/05 transition-all">
                      <Edit3 className="w-3 h-3 text-ttg-black/30" />
                    </button>
                  </div>
                )}
                <p className="text-[11px] font-bold text-ttg-black/40 flex items-center gap-1 uppercase tracking-wider">
                  <Mail className="w-3 h-3" /> {user.email}
                </p>
                <p className="text-[10px] font-black text-ttg-black/30 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Member since {memberSince}
                </p>
                {/* Bio */}
                {editingBio ? (
                  <div className="mt-3 flex items-start gap-2">
                    <textarea value={bio} onChange={e => setBio(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs font-bold border-2 border-ttg-black bg-ttg-cream focus:outline-none focus:border-ttg-yellow resize-none"
                      placeholder="Tell others about your Tazo collection..." rows={3} maxLength={200} autoFocus />
                    <div className="flex flex-col gap-1">
                      <button onClick={() => { saveProfile(); setEditingBio(false) }} className="p-1.5 hover:bg-green-50"><Check className="w-3.5 h-3.5 text-green-500" /></button>
                      <button onClick={() => setEditingBio(false)} className="p-1.5 hover:bg-red-50"><X className="w-3.5 h-3.5 text-red-500" /></button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 group/bio">
                    {bio ? (
                      <p className="text-[11px] font-bold text-ttg-black/50 leading-relaxed">{bio}</p>
                    ) : (
                      <p className="text-[11px] font-bold text-ttg-black/15 italic">Add a bio...</p>
                    )}
                    <button onClick={() => setEditingBio(true)}
                      className="mt-1 opacity-0 group-hover/bio:opacity-100 text-[10px] font-black text-ttg-black/30 uppercase hover:text-ttg-yellow transition-all">
                      Edit Bio
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* Avatar editor — URL OR upload */}
            {editingAvatar && (
              <div className="space-y-2 p-3 border-2 border-ttg-yellow bg-ttg-cream">
                {/* URL input */}
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-ttg-black/40 flex-shrink-0" />
                  <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs font-bold border-2 border-ttg-black bg-white focus:outline-none focus:border-ttg-yellow"
                    placeholder="https://example.com/avatar.jpg" />
                </div>
                {/* Upload from computer */}
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="mag-btn bg-ttg-blue text-white px-4 py-2 text-[10px] font-black uppercase tracking-wider border-2 border-ttg-black shadow-[2px_2px_0px_var(--ttg-black)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-3 h-3" />
                    {uploading ? 'Uploading...' : 'Upload from Computer'}
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
                  </label>
                  {avatarUrl && !avatarUrl.startsWith('http') && (
                    <button onClick={handleRemoveAvatar}
                      className="mag-btn bg-ttg-red text-white px-3 py-2 text-[10px] font-black uppercase tracking-wider border-2 border-ttg-black shadow-[2px_2px_0px_var(--ttg-black)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  )}
                  <button onClick={() => setEditingAvatar(false)} className="p-1 hover:bg-red-50"><X className="w-3.5 h-3.5 text-red-500" /></button>
                  <button onClick={() => { saveProfile(); setEditingAvatar(false) }} className="p-1 hover:bg-green-50"><Check className="w-3.5 h-3.5 text-green-500" /></button>
                </div>
                <p className="text-[8px] font-bold text-ttg-black/30 uppercase">Max 5MB · JPEG, PNG, WebP, GIF · Auto-resized to 256×256</p>
              </div>
            )}

            {/* Progress bars */}
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-black uppercase text-ttg-red flex items-center gap-1"><Disc3 className="w-3.5 h-3.5" /> Tazos Collected</span>
                  <span className="text-[10px] font-black text-ttg-black">{user.tazoCount ?? 0} / {TOTAL_PLANNED}</span>
                </div>
                <div className="h-3.5 border-2 border-ttg-black bg-ttg-cream overflow-hidden">
                  <div className="h-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, ((user.tazoCount ?? 0) / TOTAL_PLANNED) * 100)}%`,
                      background: "repeating-linear-gradient(-45deg, var(--ttg-red), var(--ttg-red) 3px, #CC2200 3px, #CC2200 6px)",
                      borderRight: (user.tazoCount ?? 0) > 0 && (user.tazoCount ?? 0) < TOTAL_PLANNED ? "2px solid var(--ttg-black)" : "none",
                    }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-black uppercase text-ttg-blue flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Decks Built</span>
                  <span className="text-[10px] font-black text-ttg-black">{user.deckCount ?? 0}</span>
                </div>
                <div className="h-3.5 border-2 border-ttg-black bg-ttg-cream overflow-hidden">
                  <div className="h-full"
                    style={{
                      width: `${Math.min(100, (user.deckCount ?? 0) * 20)}%`,
                      background: "repeating-linear-gradient(-45deg, #3B4CCA, #3B4CCA 3px, #2D3AAD 3px, #2D3AAD 6px)",
                      borderRight: (user.deckCount ?? 0) > 0 ? "2px solid var(--ttg-black)" : "none",
                    }} />
                </div>
              </div>
            </div>
          </div>

          {/* ── SOUND SETTINGS ── */}
          <div className="border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] bg-white overflow-hidden">
            <div className="px-5 sm:px-6 py-3 border-b-3 border-ttg-black flex items-center gap-2"
              style={{ background: "repeating-linear-gradient(-45deg, #ffcc0010, #ffcc0010 4px, transparent 4px, transparent 8px)" }}>
              <Volume2 className="w-4 h-4 text-ttg-black" />
              <h2 className="text-xs font-black text-ttg-black uppercase tracking-[0.2em]">Sound</h2>
            </div>
            <ToggleRow icon={Volume2} label="Sound Effects" description="Battle sounds, menu clicks, bag rips" checked={sfxEnabled}
              onChange={persistBool(LS_KEYS.sfxEnabled, setSfxEnabled)} />
            <ToggleRow icon={Music} label="Music" description="Background music and ambient tracks" checked={musicEnabled}
              onChange={persistBool(LS_KEYS.musicEnabled, setMusicEnabled)} />
            <SliderRow icon={Radio} label="Volume" value={masterVolume}
              onChange={persistNum(LS_KEYS.masterVolume, setMasterVolume)} />
            <ToggleRow icon={soundEnabled ? Volume2 : VolumeX} label="Master Sound" description="Enable or disable all audio" checked={soundEnabled}
              onChange={(v: boolean) => { persistBool(LS_KEYS.soundEnabled, setSoundEnabled)(v) }} />
          </div>

          {/* ── VISUAL SETTINGS ── */}
          <div className="border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] bg-white overflow-hidden">
            <div className="px-5 sm:px-6 py-3 border-b-3 border-ttg-black flex items-center gap-2"
              style={{ background: "repeating-linear-gradient(-45deg, #3b4cca10, #3b4cca10 4px, transparent 4px, transparent 8px)" }}>
              <Monitor className="w-4 h-4 text-ttg-black" />
              <h2 className="text-xs font-black text-ttg-black uppercase tracking-[0.2em]">Visual</h2>
            </div>

            {/* Theme selector */}
            <div className="py-3 px-4 border-b-2 border-ttg-black/05">
              <div className="flex items-center gap-3 mb-2">
                <Sun className="w-4 h-4 text-ttg-black/40 flex-shrink-0" />
                <span className="text-xs font-black text-ttg-black uppercase">Theme</span>
              </div>
              <div className="flex gap-2">
                {(["auto", "light", "dark"] as const).map(mode => (
                  <button key={mode}
                    onClick={() => { setTheme(mode); setLS(LS_KEYS.theme, mode) }}
                    className={`flex-1 px-3 py-2 text-[10px] font-black uppercase border-2 transition-all ${theme === mode ? "border-ttg-black bg-ttg-yellow text-ttg-black shadow-[2px_2px_0px_var(--ttg-black)]" : "border-ttg-black/20 bg-white text-ttg-black/40 hover:border-ttg-black/40"}`}>
                    {mode === "auto" ? <Monitor className="w-3 h-3 inline mr-1" /> : mode === "light" ? <Sun className="w-3 h-3 inline mr-1" /> : <Moon className="w-3 h-3 inline mr-1" />}
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <ToggleRow icon={Monitor} label="Finish Effects" description="Holo, foil, and shader visual effects on tazos" checked={effectsEnabled}
              onChange={persistBool(LS_KEYS.effectsEnabled, setEffectsEnabled)} />
            <ToggleRow icon={Monitor} label="Reduced Motion" description="Minimize animations and transitions" checked={reducedMotion}
              onChange={persistBool(LS_KEYS.reducedMotion, setReducedMotion)} />
          </div>


          {/* ── PASSWORD ── */}
          <div className="border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] bg-white overflow-hidden">
            <div className="px-5 sm:px-6 py-3 border-b-3 border-ttg-black flex items-center gap-2"
              style={{ background: "repeating-linear-gradient(-45deg, #f59e0b10, #f59e0b10 4px, transparent 4px, transparent 8px)" }}>
              <Lock className="w-4 h-4 text-ttg-black" />
              <h2 className="text-xs font-black text-ttg-black uppercase tracking-[0.2em]">Password</h2>
            </div>
            <div className="p-4 space-y-3">
              {(user as any).oauthProvider ? (
                <p className="text-[10px] font-bold text-ttg-black/30 text-center py-2">
                  Password management is handled by {(user as any).oauthProvider}
                </p>
              ) : !showPasswordChange ? (
                <button onClick={() => setShowPasswordChange(true)}
                  className="w-full mag-btn border-2 border-ttg-black px-4 py-3 text-xs font-black uppercase tracking-wider bg-white text-ttg-black hover:bg-ttg-black/05 transition-colors shadow-[2px_2px_0px_var(--ttg-black)]">
                  <Lock className="w-3.5 h-3.5 inline mr-2" /> Change Password
                </button>
              ) : (
                <div className="space-y-3">
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-bold border-2 border-ttg-black bg-ttg-cream focus:outline-none border-ttg-warning placeholder:text-ttg-black/20 uppercase tracking-wider"
                    placeholder="Current Password" />
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-bold border-2 border-ttg-black bg-ttg-cream focus:outline-none border-ttg-warning placeholder:text-ttg-black/20 uppercase tracking-wider"
                    placeholder="New Password (min 10 chars)" />
                  <div className="flex gap-2">
                    <button onClick={handlePasswordChange} disabled={changingPassword || !currentPassword || !newPassword}
                      className="flex-1 mag-btn bg-ttg-warning text-white px-4 py-2.5 text-xs font-black uppercase tracking-wider border-2 border-ttg-black shadow-[2px_2px_0px_var(--ttg-black)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                      {changingPassword ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
                      {changingPassword ? 'Changing...' : 'Update Password'}
                    </button>
                    <button onClick={() => { setShowPasswordChange(false); setPasswordMessage(null); setCurrentPassword(''); setNewPassword('') }}
                      className="mag-btn border-2 border-ttg-black bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_var(--ttg-black)] hover:bg-ttg-black/05 transition-all">
                      Cancel
                    </button>
                  </div>
                  {passwordMessage && (
                    <div className={`flex items-center gap-2 p-2.5 border-2 ${passwordMessage.type === 'success' ? 'border-ttg-success bg-ttg-success/5' : 'border-ttg-red bg-ttg-red/5'}`}>
                      {passwordMessage.type === 'success' ? <Check className="w-3.5 h-3.5 text-ttg-success" /> : <AlertCircle className="w-3.5 h-3.5 text-ttg-red" />}
                      <p className="text-[10px] font-black uppercase" style={{ color: passwordMessage.type === 'success' ? 'var(--ttg-success)' : 'var(--ttg-red)' }}>{passwordMessage.text}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── LANGUAGE ── */}
          <div className="border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] bg-white overflow-hidden">
            <div className="px-5 sm:px-6 py-3 border-b-3 border-ttg-black flex items-center gap-2"
              style={{ background: "repeating-linear-gradient(-45deg, #22c55e10, #22c55e10 4px, transparent 4px, transparent 8px)" }}>
              <Globe className="w-4 h-4 text-ttg-black" />
              <h2 className="text-xs font-black text-ttg-black uppercase tracking-[0.2em]">Language</h2>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {langs.map(({ code, nativeLabel }) => (
                <button key={code}
                  onClick={() => setLang(code as Lang)}
                  className={`px-3 py-2 text-[10px] font-black uppercase border-2 transition-all ${lang === code ? "border-ttg-black bg-ttg-success text-white shadow-[2px_2px_0px_var(--ttg-black)]" : "border-ttg-black/20 bg-white text-ttg-black/50 hover:border-ttg-black/40 hover:text-ttg-black"}`}>
                  {nativeLabel}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4 sm:space-y-5">

          {/* ── QUICK STATS ── */}
          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: Disc3, label: "Tazos", value: user.tazoCount ?? 0, color: 'var(--ttg-red)' },
              { icon: Layers, label: "Decks", value: user.deckCount ?? 0, color: 'var(--ttg-blue)' },
              { icon: Coins, label: "Credits", value: credits != null ? credits : "...", color: "var(--ttg-warning)" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="border-3 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)] p-4 text-center bg-white">
                <Icon className="w-6 h-6 mx-auto mb-1.5" style={{ color }} />
                <p className="text-2xl font-black text-ttg-black leading-none">{value}</p>
                <p className="text-[9px] font-black uppercase tracking-wider text-ttg-black/40 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* ── ACCOUNT CONNECTIONS ── */}
          <div className="border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] bg-white overflow-hidden">
            <div className="px-5 py-3 border-b-3 border-ttg-black flex items-center gap-2"
              style={{ background: "repeating-linear-gradient(-45deg, #e3350d10, #e3350d10 4px, transparent 4px, transparent 8px)" }}>
              <LinkIcon className="w-4 h-4 text-ttg-black" />
              <h2 className="text-xs font-black text-ttg-black uppercase tracking-[0.2em]">Connections</h2>
            </div>
            <div className="divide-y-2 divide-ttg-black/05">
              {/* Discord */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-ttg-discord flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-ttg-black uppercase">Discord</p>
                    <p className="text-[9px] font-bold text-ttg-black/30">Not connected</p>
                  </div>
                </div>
                <span className="text-[8px] font-black text-ttg-black/20 uppercase px-2 py-1 border border-ttg-black/10">Coming soon</span>
              </div>

              {/* Google */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-ttg-black/10 flex items-center justify-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-ttg-black uppercase">Google</p>
                    <p className="text-[9px] font-bold text-ttg-black/30">Not connected</p>
                  </div>
                </div>
                <span className="text-[8px] font-black text-ttg-black/20 uppercase px-2 py-1 border border-ttg-black/10">Coming soon</span>
              </div>

              {/* Twitter/X */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-ttg-black flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-ttg-black uppercase">X / Twitter</p>
                    <p className="text-[9px] font-bold text-ttg-black/30">Not connected</p>
                  </div>
                </div>
                <span className="text-[8px] font-black text-ttg-black/20 uppercase px-2 py-1 border border-ttg-black/10">Coming soon</span>
              </div>
            </div>
          </div>

          {/* ── REDEEM CODE ── */}
          <div className="border-3 border-ttg-warning bg-white overflow-hidden">
            <div className="px-5 py-3 border-b-3 border-ttg-warning flex items-center gap-2"
              style={{ background: "repeating-linear-gradient(-45deg, #f59e0b08, #f59e0b08 4px, transparent 4px, transparent 8px)" }}>
              <TicketPercent className="w-4 h-4 text-ttg-warning" />
              <h2 className="text-xs font-black text-ttg-warning uppercase tracking-[0.2em]">Redeem Code</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <input
                  value={redeemCode}
                  onChange={e => { setRedeemCode(e.target.value.toUpperCase()); if (redeemStatus !== "idle") { setRedeemStatus("idle"); setRedeemMessage("") } }}
                  placeholder="ENTER CODE"
                  maxLength={24}
                  disabled={redeemStatus === "loading"}
                  className="flex-1 px-3 py-2.5 text-sm font-black text-ttg-black border-2 border-ttg-black bg-ttg-cream focus:outline-none border-ttg-warning placeholder:text-ttg-black/15 uppercase tracking-widest disabled:opacity-50"
                />
                <button
                  onClick={async () => {
                    if (!redeemCode.trim() || !token) return
                    setRedeemStatus("loading")
                    setRedeemMessage("")
                    try {
                      const res = await fetch("/api/promo/redeem", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                        body: JSON.stringify({ code: redeemCode.trim() }),
                      })
                      const data = await res.json()
                      if (res.ok) {
                        setRedeemStatus("success")
                        setRedeemMessage(data.message || "Code redeemed!")
                        setRedeemCode("")
                        // Refresh credits
                        if (refresh) refresh()
                        setCredits(prev => prev !== null ? prev + (data.creditsAwarded || 0) : prev)
                      } else {
                        setRedeemStatus("error")
                        setRedeemMessage(data.error || "Failed to redeem code.")
                      }
                    } catch {
                      setRedeemStatus("error")
                      setRedeemMessage("Network error. Please try again.")
                    }
                  }}
                  disabled={!redeemCode.trim() || redeemStatus === "loading"}
                  className="mag-btn bg-ttg-warning text-white px-4 py-2.5 text-xs font-black uppercase tracking-wider border-2 border-ttg-black shadow-[2px_2px_0px_var(--ttg-black)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {redeemStatus === "loading" ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Redeeming...</>
                  ) : (
                    "Redeem"
                  )}
                </button>
              </div>
              {redeemStatus === "success" && (
                <div className="flex items-center gap-2 p-2.5 border-2 border-ttg-success bg-ttg-success/5">
                  <Check className="w-3.5 h-3.5 text-ttg-success flex-shrink-0" />
                  <p className="text-[10px] font-black text-ttg-success uppercase">{redeemMessage}</p>
                </div>
              )}
              {redeemStatus === "error" && (
                <div className="flex items-center gap-2 p-2.5 border-2 border-ttg-red bg-ttg-red/5">
                  <X className="w-3.5 h-3.5 text-ttg-red flex-shrink-0" />
                  <p className="text-[10px] font-black text-ttg-red uppercase">{redeemMessage}</p>
                </div>
              )}
              <p className="text-[8px] font-bold text-ttg-black/20 uppercase text-center">
                Enter a promo code to earn CREDITS or rewards
              </p>
            </div>
          </div>

          {/* ── ACCOUNT ACTIONS ── */}
          <div className="border-3 border-ttg-red bg-white overflow-hidden">
            <div className="px-5 py-3 border-b-3 border-ttg-red flex items-center gap-2"
              style={{ background: "repeating-linear-gradient(-45deg, #e3350d08, #e3350d08 4px, transparent 4px, transparent 8px)" }}>
              <Shield className="w-4 h-4 text-ttg-red" />
              <h2 className="text-xs font-black text-ttg-red uppercase tracking-[0.2em]">Account</h2>
            </div>
            <div className="p-4 space-y-3">
              <button onClick={logout}
                className="w-full mag-btn bg-ttg-red text-white px-6 py-3.5 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_var(--ttg-black)] transition-all">
                <LogOut className="w-4 h-4" />
                {t.auth_logout || "Log Out"}
              </button>
              <p className="text-[8px] font-bold text-ttg-black/20 text-center uppercase">
                You will be signed out of all devices
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
