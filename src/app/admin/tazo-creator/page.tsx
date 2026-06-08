"use client";

// ============================================================
// Trading Tazos Game — Admin Tazo Creator
// POST /api/admin/tazo-art
// ============================================================
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Shield, Wand2, Loader2, Check, AlertTriangle,
  Image as ImageIcon, Download, Sparkles, ChevronDown,
  Circle, Star, Info,
} from "lucide-react";
import Link from "next/link";
import TazoDiscImage from "@/components/game/tazo-disc-image";

// ── Constants ──
const FRANCHISES = [
  { slug: "minimon", name: "Minimon", color: "#FFCB05", desc: "Cute collectible creatures" },
  { slug: "cybermon", name: "Cybermon", color: "#00A1E9", desc: "Digital monster companions" },
  { slug: "dracobell", name: "Dracobell", color: "#FF6B00", desc: "Anime martial arts warriors" },
];

const RARITIES = [
  { slug: "common", name: "Common", color: "#9CA3AF", stars: 1, desc: "Basic design" },
  { slug: "uncommon", name: "Uncommon", color: "#22C55E", stars: 2, desc: "Subtle body glow" },
  { slug: "rare", name: "Rare", color: "#3B82F6", stars: 3, desc: "Blue crystalline accents" },
  { slug: "ultra-rare", name: "Ultra Rare", color: "#A855F7", stars: 4, desc: "Purple aura + metallic" },
  { slug: "legendary", name: "Legendary", color: "#FBBF24", stars: 5, desc: "Golden aura + godlike" },
];

const ROLES = [
  { slug: "attacker", name: "Attacker", icon: "⚔️" },
  { slug: "tank", name: "Tank", icon: "🛡️" },
  { slug: "technical", name: "Technical", icon: "🔧" },
  { slug: "bouncer", name: "Bouncer", icon: "🏀" },
  { slug: "heavy", name: "Heavy", icon: "🪨" },
  { slug: "light", name: "Light", icon: "🪶" },
  { slug: "balanced", name: "Balanced", icon: "⚖️" },
  { slug: "special", name: "Special", icon: "✨" },
];

// ── Disc Preview SVG ──
function DiscPreview({ franchise, rarity }: { franchise: string; rarity: string }) {
  const f = FRANCHISES.find(fr => fr.slug === franchise) || FRANCHISES[0];
  const r = RARITIES.find(ra => ra.slug === rarity) || RARITIES[0];
  return (
    <svg viewBox="0 0 256 256" className="w-full h-full">
      {/* Background */}
      <circle cx="128" cy="128" r="118" fill="#FEFEFA" stroke="#1a1a1a" strokeWidth="2" />
      {/* Franchise ring */}
      <circle cx="128" cy="128" r="110" fill="none" stroke={f.color} strokeWidth="2" opacity="0.6" />
      {/* Rarity ring */}
      <circle cx="128" cy="128" r="98" fill="none" stroke={r.color} strokeWidth="2" />
      {/* Creature placeholder */}
      <circle cx="128" cy="120" r="55" fill="#0000000a" stroke="#00000015" strokeWidth="1" strokeDasharray="4,3" />
      <text x="128" y="115" textAnchor="middle" fontFamily="Arial Black, sans-serif"
        fontWeight="900" fontSize="28" fill={f.color + "40"}>?</text>
      <text x="128" y="140" textAnchor="middle" fontFamily="Arial, sans-serif"
        fontWeight="700" fontSize="10" fill="#00000030" letterSpacing="2">CREATE</text>
      {/* Name */}
      <text x="128" y="220" textAnchor="middle" fontFamily="Arial Black, sans-serif"
        fontWeight="900" fontSize="11" fill="#1a1a1a" opacity="0.3">{f.name}</text>
    </svg>
  );
}

// ── Main component ──
export default function AdminTazoCreatorPage() {
  const { user, loading: authLoading } = useAuth();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [franchise, setFranchise] = useState("minimon");
  const [rarity, setRarity] = useState("common");
  const [role, setRole] = useState("balanced");
  const [customPrompt, setCustomPrompt] = useState("");

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [recentCreations, setRecentCreations] = useState<any[]>([]);

  const isAdmin = user?.email === "dev@tradingtazosgame.com";

  // Fetch recent creations
  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/tazo-art?limit=6", { credentials: "include" })
      .then(r => r.json())
      .then(d => setRecentCreations(d.data || []))
      .catch(() => {});
  }, [isAdmin, result]);

  // Handle generation
  const handleGenerate = useCallback(async () => {
    if (!name) return;
    setGenerating(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/admin/tazo-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          description: description || `${name} — ${FRANCHISES.find(f => f.slug === franchise)?.name} creature`,
          franchise,
          rarity,
          role,
          customPrompt: customPrompt.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Generation failed");
      }
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setGenerating(false);
    }
  }, [name, description, franchise, rarity, role, customPrompt]);

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen mag-bg"><Loader2 className="w-8 h-8 animate-spin text-[#FFCC00]" /></div>;
  }

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
    );
  }

  return (
    <div className="min-h-screen mag-bg">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b-4 border-[#FFCC00] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wand2 className="w-6 h-6 text-[#FFCC00]" />
            <div>
              <h1 className="text-lg font-black text-white uppercase tracking-wider">Tazo Creator</h1>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">AI-powered tazo art generation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-zinc-400">{user?.email}</span>
            <Link href="/admin" className="text-[10px] font-black text-[#FFCC00] hover:text-white uppercase tracking-wider">← Panel</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Name + Description */}
            <div className="mag-card p-5 border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-[#1a1a1a] flex items-center gap-2">
                <Info className="w-4 h-4" /> Creature Details
              </h2>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-[#1a1a1a]/50 mb-1.5 block">Name *</label>
                <input
                  type="text" value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Lumipuff, Datadrake, Sora Tide..."
                  className="w-full border-2 border-[#1a1a1a] bg-white px-3 py-2.5 text-sm font-bold text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 outline-none focus:border-[#FFCC00] focus:shadow-[3px_3px_0px_#FFCC00] transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-[#1a1a1a]/50 mb-1.5 block">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the creature's appearance, personality, elemental affinity..."
                  rows={3}
                  className="w-full border-2 border-[#1a1a1a] bg-white px-3 py-2.5 text-sm font-bold text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 outline-none focus:border-[#FFCC00] focus:shadow-[3px_3px_0px_#FFCC00] transition-all resize-none"
                />
              </div>
            </div>

            {/* Franchise + Rarity + Role */}
            <div className="grid sm:grid-cols-3 gap-4">
              {/* Franchise */}
              <div className="mag-card p-4 border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-[#1a1a1a]/50 mb-3">Franchise</h3>
                <div className="space-y-2">
                  {FRANCHISES.map(f => (
                    <button
                      key={f.slug}
                      onClick={() => setFranchise(f.slug)}
                      className={`w-full text-left px-3 py-2 border-2 border-[#1a1a1a] text-xs font-bold uppercase tracking-wider transition-all
                        ${franchise === f.slug
                          ? 'text-white shadow-[2px_2px_0px_#1a1a1a] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]'
                          : 'bg-white text-[#1a1a1a]/60 hover:shadow-[2px_2px_0px_#1a1a1a] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]'
                        }`}
                      style={{ backgroundColor: franchise === f.slug ? f.color : undefined }}
                    >
                      <span className="text-[11px]">{f.name}</span>
                      <span className="block text-[8px] opacity-70 normal-case tracking-normal mt-0.5">{f.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rarity */}
              <div className="mag-card p-4 border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-[#1a1a1a]/50 mb-3">Rarity</h3>
                <div className="space-y-2">
                  {RARITIES.map(r => (
                    <button
                      key={r.slug}
                      onClick={() => setRarity(r.slug)}
                      className={`w-full text-left px-3 py-2 border-2 border-[#1a1a1a] text-xs font-bold uppercase tracking-wider transition-all
                        ${rarity === r.slug
                          ? 'text-white shadow-[2px_2px_0px_#1a1a1a] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]'
                          : 'bg-white text-[#1a1a1a]/60 hover:shadow-[2px_2px_0px_#1a1a1a] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]'
                        }`}
                      style={{ backgroundColor: rarity === r.slug ? r.color : undefined }}
                    >
                      <span className="flex items-center gap-1.5">
                        {Array.from({ length: r.stars }).map((_, i) => (
                          <span key={i} className="text-[8px]" style={{ color: rarity === r.slug ? '#FFD700' : r.color }}>★</span>
                        ))}
                        <span className="text-[11px]">{r.name}</span>
                      </span>
                      <span className="block text-[8px] opacity-70 normal-case tracking-normal mt-0.5">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Role */}
              <div className="mag-card p-4 border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-[#1a1a1a]/50 mb-3">Role</h3>
                <div className="space-y-1.5">
                  {ROLES.map(rl => (
                    <button
                      key={rl.slug}
                      onClick={() => setRole(rl.slug)}
                      className={`w-full text-left px-3 py-1.5 border-2 border-[#1a1a1a] text-xs font-bold uppercase tracking-wider transition-all
                        ${role === rl.slug
                          ? 'bg-[#3B4CCA] text-white shadow-[2px_2px_0px_#1a1a1a] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]'
                          : 'bg-white text-[#1a1a1a]/60 hover:shadow-[2px_2px_0px_#1a1a1a] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]'
                        }`}
                    >
                      <span className="text-[11px]">{rl.icon} {rl.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Prompt */}
            <div className="mag-card p-5 border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-wider text-[#1a1a1a]/50 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" /> Custom Prompt Override
                </h2>
                <span className="text-[9px] font-bold text-[#1a1a1a]/30">Optional — overrides the builder</span>
              </div>
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="Paste a custom AI prompt here to override the automatic builder. Transparency and background rules are ALWAYS appended."
                rows={4}
                className="w-full border-2 border-[#1a1a1a]/20 bg-[#1a1a1a]/5 px-3 py-2.5 text-xs font-mono text-[#1a1a1a]/60 placeholder:text-[#1a1a1a]/20 outline-none focus:border-[#FFCC00] transition-all resize-none"
              />
            </div>

            {/* Action */}
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={generating || !name}
                className="mag-btn flex-1 py-3.5 text-sm bg-[#22C55E] text-white border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] font-black uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] flex items-center justify-center gap-2 transition-all"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate Tazo
                  </>
                )}
              </button>

              <Link
                href="/admin"
                className="mag-btn px-6 py-3.5 text-sm bg-[#fffef0] text-[#1a1a1a]/70 border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] font-black uppercase tracking-wider hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
              >
                Cancel
              </Link>
            </div>

            {/* Error */}
            {error && (
              <div className="border-3 border-[#E3350D] bg-[#E3350D08] p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#E3350D] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black uppercase text-[#E3350D]">Generation Failed</p>
                  <p className="text-xs font-bold text-[#E3350D]/70 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Success Result */}
            {result && (
              <div className="mag-card p-5 border-3 border-[#22C55E] shadow-[4px_4px_0px_#22C55E] bg-[#22C55E08] space-y-4">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#22C55E]" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-[#22C55E]">Tazo Created!</h2>
                  {result.hasAI !== undefined && (
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 border ml-auto ${result.hasAI ? 'bg-[#3B4CCA]/10 text-[#3B4CCA] border-[#3B4CCA]/30' : 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30'}`}>
                      {result.hasAI ? 'AI Generated' : 'Placeholder'}
                    </span>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Generated image */}
                  <div className="bg-[#1a1a1a] rounded-lg p-4 flex items-center justify-center">
                    <TazoDiscImage
                      src={result.imageUrl}
                      alt={result.name}
                      size={160}
                      scale={1.12}
                      borderWidth={3}
                      franchiseSlug={(result as any).franchise?.slug || "minimon"}
                    />
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-[#1a1a1a]/50">Name</span>
                      <span className="text-[#1a1a1a] font-black uppercase">{result.name}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-[#1a1a1a]/50">Slug</span>
                      <span className="text-[#1a1a1a] font-mono text-[10px]">{result.slug}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-[#1a1a1a]/50">Number</span>
                      <span className="text-[#1a1a1a] font-mono">{result.number}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-[#1a1a1a]/50">Rarity</span>
                      <span className="text-[#1a1a1a] uppercase" style={{ color: RARITIES.find(r => r.slug === result.rarity)?.color }}>
                        ★ {result.rarity}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-[#1a1a1a]/50">Role</span>
                      <span className="text-[#1a1a1a] uppercase">{result.role}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-[#1a1a1a]/50">Image</span>
                      <a href={result.imageUrl} target="_blank" rel="noreferrer" className="text-[#3B4CCA] underline text-[10px]">
                        View Full
                      </a>
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t border-[#1a1a1a]/10">
                      {['attack','defense','control'].map(s => (
                        <div key={s} className="text-center">
                          <span className="block text-[9px] font-black uppercase text-[#1a1a1a]/30">{s.slice(0,3)}</span>
                          <span className="block text-sm font-black text-[#1a1a1a]">{result[s]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <a
                    href={result.imageUrl}
                    download
                    className="mag-btn flex-1 py-2 text-xs bg-[#3B4CCA] text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PNG
                  </a>
                  <button
                    onClick={() => {
                      setResult(null);
                      setError("");
                    }}
                    className="mag-btn px-4 py-2 text-xs bg-[#fffef0] text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] font-bold uppercase tracking-wider hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                  >
                    Create Another
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Preview Panel */}
          <div className="space-y-6">
            {/* Live Preview */}
            <div className="mag-card p-5 border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] sticky top-24">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]/50 mb-4 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Live Preview
              </h3>

              {/* Disc preview */}
              <div className="bg-[#1a1a1a] rounded-lg p-6 mb-4">
                <div className="w-48 h-48 mx-auto">
                  <DiscPreview franchise={franchise} rarity={rarity} />
                </div>
              </div>

              {/* Prompt preview */}
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-wider text-[#1a1a1a]/30">PROMPT PREVIEW</p>
                <div className="bg-[#1a1a1a]/5 rounded p-3 text-[9px] font-mono text-[#1a1a1a]/50 leading-relaxed max-h-48 overflow-y-auto">
                  {name ? (
                    <>
                      <span className="text-[#3B4CCA]">Transparent character illustration</span> for tazo disc:{' '}
                      <strong className="text-[#1a1a1a]">{name}</strong>
                      {description && <>, <span className="text-[#1a1a1a]/40">{description}</span></>}.{' '}
                      <span className="text-[#1a1a1a]/40">
                        {FRANCHISES.find(f => f.slug === franchise)?.name} style.{' '}
                        {RARITIES.find(r => r.slug === rarity)?.desc} effects.{' '}
                        {role} role.
                      </span>
                      <span className="block mt-2 text-[#22C55E]">
                        ✓ Mandatory transparency guard appended<br />
                        ✓ Negative prompt applied
                      </span>
                    </>
                  ) : (
                    <span className="italic">Enter a creature name to see the prompt preview...</span>
                  )}
                </div>
              </div>

              {/* Rules */}
              <div className="mt-4 p-3 border-2 border-[#FFCC00]/30 bg-[#FFCC00]/5 rounded">
                <h4 className="text-[9px] font-black uppercase tracking-wider text-[#FFCC00] mb-2">Generation Rules</h4>
                <ul className="text-[9px] font-bold text-[#1a1a1a]/50 space-y-1">
                  <li>🎯 Character only — no backgrounds ever</li>
                  <li>🔮 Rarity effects attach to the character</li>
                  <li>🚫 No frames, borders, text, or watermarks</li>
                  <li>✅ Transparency validation on every output</li>
                  <li>🎨 Procedural tazo disc background added after</li>
                  <li>📊 Stats auto-calculated by role + rarity</li>
                </ul>
              </div>
            </div>

            {/* Recent Creations */}
            {recentCreations.length > 0 && (
              <div className="mag-card p-5 border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]/50 mb-4">Recent Creations</h3>
                <div className="space-y-2">
                  {recentCreations.slice(0, 6).map((t: any) => (
                    <div key={t.id} className="flex items-center gap-3 p-2 border-2 border-[#1a1a1a]/10 bg-white rounded">
                      <TazoDiscImage
                        src={t.imageUrl}
                        alt={t.name}
                        size={40}
                        scale={1.05}
                        borderWidth={2}
                        franchiseSlug={t.franchise?.slug || "minimon"}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase text-[#1a1a1a] truncate">{t.name}</p>
                        <p className="text-[8px] font-bold text-[#1a1a1a]/40 uppercase">{t.franchise?.slug} · {t.rarity} · {t.role}</p>
                      </div>
                      <span className="text-[8px] font-bold text-[#1a1a1a]/20 uppercase">#{t.number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
