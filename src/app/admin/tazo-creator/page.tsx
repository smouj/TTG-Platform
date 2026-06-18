"use client";

// ============================================================
// Trading Tazos Game — Admin Tazo Creator
// POST /api/admin/tazo-art
// v2: skill/skillDesc/combatType/category/finish + stats preview
// ============================================================
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Shield, Wand2, Loader2, Check, AlertTriangle,
  Image as ImageIcon, Download, Sparkles,
  Circle, Star, Info, Swords, Zap, Gauge, Crosshair,
  Eye, EyeOff, Settings2,
  Wrench, Anchor, Feather, Scale,
  Target, Palette, Ban, BarChart3, Gamepad2,
} from "lucide-react";
import Link from "next/link";
import AdminShell from "@/components/admin/admin-shell";
import TazoDiscImage from "@/components/game/tazo-disc-image";

// ── Constants ──
const FRANCHISES = [
  { slug: "minimon", name: "Minimon", color: "var(--ttg-minimon)", desc: "Creature companions from the world of Luminara" },
  { slug: "cybermon", name: "Cybermon", color: "var(--ttg-cybermon)", desc: "Living digital code from the Neon Grid" },
  { slug: "dracobell", name: "Dracobell", color: "var(--ttg-dracobell)", desc: "Warriors of the Bellora clans" },
];

const RARITIES = [
  { slug: "common", name: "Common", color: "var(--ttg-rarity-common)", stars: 1, desc: "Basic design" },
  { slug: "uncommon", name: "Uncommon", color: 'var(--ttg-success)', stars: 2, desc: "Subtle glow" },
  { slug: "rare", name: "Rare", color: "#3B82F6", stars: 3, desc: "Crystalline accents" },
  { slug: "ultra-rare", name: "Ultra Rare", color: 'var(--ttg-purple)', stars: 4, desc: "Purple aura + metallic" },
  { slug: "legendary", name: "Legendary", color: "#FBBF24", stars: 5, desc: "Golden aura + godlike" },
];

const ROLE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  attacker: Swords,
  tank: Shield,
  technical: Wrench,
  bouncer: Circle,
  heavy: Anchor,
  light: Feather,
  balanced: Scale,
  special: Sparkles,
};

const ROLES = [
  { slug: "attacker", name: "Attacker" },
  { slug: "tank", name: "Tank" },
  { slug: "technical", name: "Technical" },
  { slug: "bouncer", name: "Bouncer" },
  { slug: "heavy", name: "Heavy" },
  { slug: "light", name: "Light" },
  { slug: "balanced", name: "Balanced" },
  { slug: "special", name: "Special" },
];

const FINISHES = [
  { slug: "normal", name: "Normal" },
  { slug: "holo", name: "Holo" },
  { slug: "reverse_holo", name: "Reverse Holo" },
  { slug: "prismatic", name: "Prismatic" },
  { slug: "foil", name: "Foil" },
  { slug: "glossy", name: "Glossy" },
  { slug: "metallic", name: "Metallic" },
  { slug: "chrome", name: "Chrome" },
  { slug: "gold", name: "Gold" },
  { slug: "rainbow", name: "Rainbow" },
  { slug: "glitter", name: "Glitter" },
  { slug: "stardust", name: "Stardust" },
  { slug: "aurora", name: "Aurora" },
  { slug: "cracked_ice", name: "Cracked Ice" },
  { slug: "oil_slick", name: "Oil Slick" },
  { slug: "lenticular", name: "Lenticular" },
  { slug: "pearlescent", name: "Pearlescent" },
  { slug: "matte", name: "Matte" },
];

const COMBAT_TYPES = [
  // Minimon
  { slug: "fire", name: "Fire" },
  { slug: "water", name: "Water" },
  { slug: "grass", name: "Grass" },
  { slug: "electric", name: "Electric" },
  { slug: "psychic", name: "Psychic" },
  { slug: "ghost", name: "Ghost" },
  { slug: "dragon", name: "Dragon" },
  { slug: "normal", name: "Normal" },
  // Cybermon
  { slug: "data", name: "Data" },
  { slug: "virus", name: "Virus" },
  { slug: "vaccine", name: "Vaccine" },
  { slug: "free", name: "Free" },
  // Dracobell
  { slug: "striker", name: "Striker" },
  { slug: "guardian", name: "Guardian" },
  { slug: "auralord", name: "Auralord" },
  { slug: "beastborn", name: "Beastborn" },
  { slug: "monkblade", name: "Monkblade" },
  { slug: "stormfist", name: "Stormfist" },
  { slug: "voidwalker", name: "Voidwalker" },
  { slug: "sunborn", name: "Sunborn" },
  { slug: "ironbody", name: "Ironbody" },
  { slug: "skyfighter", name: "Skyfighter" },
  { slug: "dragonkin", name: "Dragonkin" },
  { slug: "bell_sage", name: "Bell Sage" },
];

const CATEGORIES = [
  { slug: "creature", name: "Creature" },
  { slug: "trainer", name: "Trainer" },
  { slug: "equipment", name: "Equipment" },
  { slug: "arena", name: "Arena" },
  { slug: "special", name: "Special" },
];

// Key stat labels
const STAT_LABELS: Record<string, [string, string]> = {
  attack: ["ATK", 'var(--ttg-red)'],
  defense: ["DEF", 'var(--ttg-blue)'],
  resistance: ["RES", 'var(--ttg-success)'],
  weight: ["WT", "var(--ttg-warning)"],
  stability: ["STB", 'var(--ttg-purple)'],
  spin: ["SPIN", "#EC4899"],
  control: ["CTRL", "#06B6D4"],
  bounce: ["BNC", "#F97316"],
  precision: ["PREC", "#8B5CF6"],
};

// ── Disc Preview SVG ──
function DiscPreview({ franchise, rarity }: { franchise: string; rarity: string }) {
  const f = FRANCHISES.find(fr => fr.slug === franchise) || FRANCHISES[0];
  const r = RARITIES.find(ra => ra.slug === rarity) || RARITIES[0];
  return (
    <svg viewBox="0 0 256 256" className="w-full h-full">
      <circle cx="128" cy="128" r="118" fill="#FEFEFA" stroke='var(--ttg-black)' strokeWidth="2" />
      <circle cx="128" cy="128" r="110" fill="none" stroke={f.color} strokeWidth="2" opacity="0.6" />
      <circle cx="128" cy="128" r="98" fill="none" stroke={r.color} strokeWidth="2" />
      <circle cx="128" cy="120" r="55" fill="#0000000a" stroke="#00000015" strokeWidth="1" strokeDasharray="4,3" />
      <text x="128" y="115" textAnchor="middle" fontFamily="Arial Black, sans-serif"
        fontWeight="900" fontSize="28" fill={f.color + "40"}>?</text>
      <text x="128" y="140" textAnchor="middle" fontFamily="Arial, sans-serif"
        fontWeight="700" fontSize="10" fill="#00000030" letterSpacing="2">CREATE</text>
      <text x="128" y="220" textAnchor="middle" fontFamily="Arial Black, sans-serif"
        fontWeight="900" fontSize="11" fill='var(--ttg-black)' opacity="0.3">{f.name}</text>
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
  const [combatType, setCombatType] = useState("data");
  const [finish, setFinish] = useState("normal");
  const [category, setCategory] = useState("creature");
  const [skillName, setSkillName] = useState("");
  const [skillDesc, setSkillDesc] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  // Advanced panel toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Stats (previewed before creation)
  const [stats, setStats] = useState<Record<string, number>>({
    attack: 55, defense: 55, resistance: 55, weight: 55,
    stability: 55, spin: 55, control: 55, bounce: 55, precision: 55,
  });
  const [statsLocked, setStatsLocked] = useState(false);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [recentCreations, setRecentCreations] = useState<any[]>([]);

  const isAdmin = user?.email === "dev@tradingtazosgame.com";

  // Auto-calculate stats from role + rarity
  useEffect(() => {
    if (statsLocked) return;
    const roleStats: Record<string, Record<string, number>> = {
      attacker: { attack:80, defense:35, resistance:40, weight:50, stability:35, spin:55, control:45, bounce:40, precision:60 },
      tank: { attack:35, defense:85, resistance:80, weight:75, stability:70, spin:30, control:40, bounce:25, precision:35 },
      technical: { attack:50, defense:45, resistance:40, weight:40, stability:50, spin:65, control:80, bounce:55, precision:80 },
      bouncer: { attack:45, defense:40, resistance:35, weight:30, stability:30, spin:75, control:55, bounce:90, precision:50 },
      heavy: { attack:65, defense:70, resistance:75, weight:95, stability:80, spin:20, control:30, bounce:15, precision:25 },
      light: { attack:45, defense:30, resistance:25, weight:15, stability:25, spin:60, control:70, bounce:65, precision:75 },
      balanced: { attack:55, defense:55, resistance:55, weight:55, stability:55, spin:55, control:55, bounce:55, precision:55 },
      special: { attack:70, defense:55, resistance:60, weight:50, stability:60, spin:70, control:65, bounce:60, precision:65 },
    };
    const baseStats = roleStats[role] || roleStats.balanced;
    const rarityMultiplier: Record<string, number> = {
      common: 0.8, uncommon: 0.9, rare: 1.0, "ultra-rare": 1.1, legendary: 1.25,
    };
    const multiplier = rarityMultiplier[rarity] || 1.0;
    const newStats: Record<string, number> = {};
    for (const [k, v] of Object.entries(baseStats)) {
      newStats[k] = Math.max(10, Math.min(99, Math.round(v * multiplier)));
    }
    setStats(newStats);
  }, [role, rarity, statsLocked]);

  // Fetch recent creations
  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/tazo-art?limit=6", { credentials: "include" })
      .then(r => r.json())
      .then(d => setRecentCreations(d.data || []))
      .catch(() => {});
  }, [isAdmin, result]);

  const updateStat = (field: string, value: number) => {
    setStatsLocked(true);
    setStats(prev => ({ ...prev, [field]: Math.max(10, Math.min(99, value)) }));
  };

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
          combatType: combatType || undefined,
          finish: finish || "normal",
          category: category || undefined,
          skill: skillName.trim() || undefined,
          skillDesc: skillDesc.trim() || undefined,
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
  }, [name, description, franchise, rarity, role, combatType, finish, category, skillName, skillDesc, customPrompt]);

  return (
    <AdminShell accentColor='var(--ttg-success)'>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Wand2 className="w-5 h-5 text-ttg-success" />
          <h1 className="text-lg font-black uppercase text-ttg-black tracking-wider">Tazo Creator</h1>
          <span className="text-[10px] font-bold text-ttg-black/30 uppercase">AI-powered tazo art generation</span>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Name + Description */}
            <div className="mag-card p-5 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-ttg-black flex items-center gap-2">
                <Info className="w-4 h-4" /> Creature Details
              </h2>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-ttg-black/50 mb-1.5 block">Name *</label>
                <input
                  type="text" value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Lumipuff, Datadrake, Sora Tide..."
                  className="w-full border-2 border-ttg-black bg-white px-3 py-2.5 text-sm font-bold text-ttg-black placeholder:text-ttg-black/30 outline-none focus:border-ttg-yellow focus:shadow-[3px_3px_0px_var(--ttg-yellow)] transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-ttg-black/50 mb-1.5 block">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the creature's appearance, personality, elemental affinity..."
                  rows={3}
                  className="w-full border-2 border-ttg-black bg-white px-3 py-2.5 text-sm font-bold text-ttg-black placeholder:text-ttg-black/30 outline-none focus:border-ttg-yellow focus:shadow-[3px_3px_0px_var(--ttg-yellow)] transition-all resize-none"
                />
              </div>
            </div>

            {/* Franchise + Rarity + Role */}
            <div className="grid sm:grid-cols-3 gap-4">
              {/* Franchise */}
              <div className="mag-card p-4 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)]">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-ttg-black/50 mb-3">Series</h3>
                <div className="space-y-2">
                  {FRANCHISES.map(f => (
                    <button
                      key={f.slug}
                      onClick={() => setFranchise(f.slug)}
                      className={`w-full text-left px-3 py-2 border-2 border-ttg-black text-xs font-bold uppercase tracking-wider transition-all
                        ${franchise === f.slug
                          ? 'text-white shadow-[2px_2px_0px_var(--ttg-black)]'
                          : 'bg-white text-ttg-black/60 hover:shadow-[2px_2px_0px_var(--ttg-black)]'
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
              <div className="mag-card p-4 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)]">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-ttg-black/50 mb-3">Rarity</h3>
                <div className="space-y-2">
                  {RARITIES.map(r => (
                    <button
                      key={r.slug}
                      onClick={() => setRarity(r.slug)}
                      className={`w-full text-left px-3 py-2 border-2 border-ttg-black text-xs font-bold uppercase tracking-wider transition-all
                        ${rarity === r.slug
                          ? 'text-white shadow-[2px_2px_0px_var(--ttg-black)]'
                          : 'bg-white text-ttg-black/60 hover:shadow-[2px_2px_0px_var(--ttg-black)]'
                        }`}
                      style={{ backgroundColor: rarity === r.slug ? r.color : undefined }}
                    >
                      <span className="flex items-center gap-1.5">
                        {Array.from({ length: r.stars }).map((_, i) => (
                          <Star
                            key={i}
                            className="w-2.5 h-2.5"
                            fill={rarity === r.slug ? '#FFD700' : r.color}
                            stroke={rarity === r.slug ? '#FFD700' : r.color}
                          />
                        ))}
                        <span className="text-[11px]">{r.name}</span>
                      </span>
                      <span className="block text-[8px] opacity-70 normal-case tracking-normal mt-0.5">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Role */}
              <div className="mag-card p-4 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)]">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-ttg-black/50 mb-3">Role</h3>
                <div className="space-y-1.5">
                  {ROLES.map(rl => {
                    const IconComponent = ROLE_ICON_MAP[rl.slug] || Circle;
                    return (
                      <button
                        key={rl.slug}
                        onClick={() => setRole(rl.slug)}
                        className={`w-full text-left px-3 py-1.5 border-2 border-ttg-black text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2
                          ${role === rl.slug
                            ? 'bg-ttg-blue text-white shadow-[2px_2px_0px_var(--ttg-black)]'
                            : 'bg-white text-ttg-black/60 hover:shadow-[2px_2px_0px_var(--ttg-black)]'
                          }`}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                        <span className="text-[11px]">{rl.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Combat Type + Finish + Category */}
            <div className="grid sm:grid-cols-3 gap-4">
              {/* Combat Type */}
              <div className="mag-card p-4 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)]">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-ttg-black/50 mb-2 flex items-center gap-1.5">
                  <Swords className="w-3 h-3" /> Combat Type
                </h3>
                <div className="space-y-1.5">
                  {COMBAT_TYPES.map(ct => (
                    <button
                      key={ct.slug}
                      onClick={() => setCombatType(ct.slug)}
                      className={`w-full text-left px-2.5 py-1 border-2 border-ttg-black text-[10px] font-bold uppercase tracking-wider transition-all
                        ${combatType === ct.slug
                          ? 'bg-ttg-black text-white'
                          : 'bg-white text-ttg-black/50 hover:bg-ttg-black/5'
                        }`}
                    >{ct.name}</button>
                  ))}
                </div>
              </div>

              {/* Finish */}
              <div className="mag-card p-4 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)]">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-ttg-black/50 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Finish
                </h3>
                <div className="space-y-1.5">
                  {FINISHES.map(fn => (
                    <button
                      key={fn.slug}
                      onClick={() => setFinish(fn.slug)}
                      className={`w-full text-left px-2.5 py-1 border-2 border-ttg-black text-[10px] font-bold uppercase tracking-wider transition-all
                        ${finish === fn.slug
                          ? 'bg-ttg-warning text-white'
                          : 'bg-white text-ttg-black/50 hover:bg-ttg-black/5'
                        }`}
                    >{fn.name}</button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="mag-card p-4 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)]">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-ttg-black/50 mb-2 flex items-center gap-1.5">
                  <Gauge className="w-3 h-3" /> Category
                </h3>
                <div className="space-y-1.5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.slug}
                      onClick={() => setCategory(cat.slug)}
                      className={`w-full text-left px-2.5 py-1 border-2 border-ttg-black text-[10px] font-bold uppercase tracking-wider transition-all
                        ${category === cat.slug
                          ? 'bg-ttg-purple text-white'
                          : 'bg-white text-ttg-black/50 hover:bg-ttg-black/5'
                        }`}
                    >{cat.name}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Skill + SkillDesc */}
            <div className="mag-card p-5 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-ttg-black/50 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" /> Skill & Description
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-ttg-black/50 mb-1.5 block">Skill Name</label>
                  <input
                    type="text" value={skillName}
                    onChange={e => setSkillName(e.target.value)}
                    placeholder="e.g. Flame Burst, Shadow Strike..."
                    className="w-full border-2 border-ttg-black bg-white px-3 py-2 text-xs font-bold text-ttg-black placeholder:text-ttg-black/30 outline-none focus:border-ttg-yellow transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-ttg-black/50 mb-1.5 block">Skill Description</label>
                  <input
                    type="text" value={skillDesc}
                    onChange={e => setSkillDesc(e.target.value)}
                    placeholder="What the skill does in battle..."
                    className="w-full border-2 border-ttg-black bg-white px-3 py-2 text-xs font-bold text-ttg-black placeholder:text-ttg-black/30 outline-none focus:border-ttg-yellow transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Stats Preview */}
            <div className="mag-card p-5 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-wider text-ttg-black flex items-center gap-2">
                  <Crosshair className="w-4 h-4" /> Stats Preview
                  <span className="text-[9px] font-bold text-ttg-black/30">(auto from Role + Rarity)</span>
                </h2>
                <button
                  onClick={() => setStatsLocked(!statsLocked)}
                  className={`text-[9px] font-black uppercase tracking-wider flex items-center gap-1 px-2 py-1 border-2 transition-all
                    ${statsLocked
                      ? 'bg-ttg-warning border-ttg-warning text-white'
                      : 'bg-white border-ttg-black/20 text-ttg-black/40 hover:border-ttg-black'
                    }`}
                >
                  {statsLocked ? <><EyeOff className="w-3 h-3" /> Locked</> : <><Eye className="w-3 h-3" /> Lock</>}
                </button>
              </div>
              <p className="text-[9px] font-bold text-ttg-black/30">
                {statsLocked
                  ? "Stats are locked — they won't change with role/rarity. Click a stat bar below to adjust manually."
                  : "Stats auto-calculate from Role + Rarity. Click Lock to customize manually."}
              </p>
              <div className="grid sm:grid-cols-3 gap-x-4 gap-y-1.5">
                {Object.entries(stats).map(([key, value]) => {
                  const [label, color] = STAT_LABELS[key] || [key.toUpperCase(), "#999"];
                  return (
                    <div key={key} className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[7px] font-black w-8" style={{ color }}>{label}</span>
                        <input
                          type="range"
                          min={10} max={99}
                          value={value}
                          onChange={e => updateStat(key, parseInt(e.target.value))}
                          className="flex-1 h-1 accent-current"
                          style={{ accentColor: color }}
                        />
                        <span className="text-[9px] font-bold w-5 text-right tabular-nums text-ttg-black/50">{value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Prompt */}
            <div className="mag-card p-5 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] space-y-3">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-ttg-black/50 hover:text-ttg-black transition-colors"
              >
                <Settings2 className="w-4 h-4" /> Advanced Options {showAdvanced ? "\u25B2" : "\u25BC"}
              </button>
              {showAdvanced && (
                <>
                  <span className="text-[9px] font-bold text-ttg-black/30">Optional — overrides the automatic prompt builder. Transparency guard always appended.</span>
                  <textarea
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    placeholder="Paste a custom AI prompt here to override the automatic builder..."
                    rows={4}
                    className="w-full border-2 border-ttg-black/20 bg-ttg-black/5 px-3 py-2.5 text-xs font-mono text-ttg-black/60 placeholder:text-ttg-black/20 outline-none focus:border-ttg-yellow transition-all resize-none"
                  />
                </>
              )}
            </div>

            {/* Action */}
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={generating || !name}
                className="mag-btn flex-1 py-3.5 text-sm bg-ttg-success text-white border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] font-black uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[2px_2px_0px_var(--ttg-black)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] flex items-center justify-center gap-2 transition-all"
              >
                {generating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
                ) : (
                  <><Wand2 className="w-5 h-5" /> Generate Tazo</>
                )}
              </button>

              <Link
                href="/admin"
                className="mag-btn px-6 py-3.5 text-sm bg-ttg-cream text-ttg-black/70 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] font-black uppercase tracking-wider hover:shadow-[2px_2px_0px_var(--ttg-black)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
              >
                Cancel
              </Link>
            </div>

            {/* Error */}
            {error && (
              <div className="border-3 border-ttg-red bg-ttg-red/3 p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-ttg-red flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black uppercase text-ttg-red">Generation Failed</p>
                  <p className="text-xs font-bold text-ttg-red/70 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Success Result */}
            {result && (
              <div className="mag-card p-5 border-3 border-ttg-success shadow-[4px_4px_0px_var(--ttg-success)] bg-ttg-success/3 space-y-4">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-ttg-success" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-ttg-success">Tazo Created!</h2>
                  <div className="flex items-center gap-1.5 ml-auto">
                    {result.provider && (
                      <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 bg-zinc-800 text-zinc-400">{result.provider}</span>
                    )}
                    {result.transparency && (
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 border ${
                        result.transparency === 'ok' ? 'bg-green-900/30 text-green-400 border-green-600/30' :
                        result.transparency === 'warning' ? 'bg-amber-900/30 text-amber-400 border-amber-600/30' :
                        'bg-red-900/30 text-red-400 border-red-600/30'
                      }`}>α-{result.transparency}</span>
                    )}
                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 border ${result.hasAI ? 'bg-ttg-blue/10 text-ttg-blue border-ttg-blue/30' : 'bg-ttg-warning/10 text-ttg-warning border-ttg-warning/30'}`}>
                      {result.hasAI ? 'AI' : 'PH'}
                    </span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="bg-ttg-black p-3 flex items-center justify-center relative">
                      <span className="text-[7px] font-bold text-zinc-500 absolute top-1 left-2">FRONT</span>
                      <TazoDiscImage
                        src={result.imageUrl}
                        alt={result.name}
                        size={140} borderWidth={0}
                        franchiseSlug={(result as any).franchise?.slug || franchise}
                        finish={(result as any).finish || "normal"}
                        creatureVariant={(result as any).creatureVariant || "standard"}
                        shinyImageUrl={(result as any).shinyImageUrl}
                      />
                    </div>
                    {result.backImageUrl && (
                      <div className="bg-ttg-black p-3 flex items-center justify-center relative">
                        <span className="text-[7px] font-bold text-zinc-500 absolute top-1 left-2">BACK</span>
                        <img src={result.backImageUrl} alt="Back side" className="max-w-[110px]" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-bold"><span className="text-ttg-black/50">Name</span><span className="text-ttg-black font-black uppercase">{result.name}</span></div>
                    <div className="flex justify-between font-bold"><span className="text-ttg-black/50">Slug</span><span className="text-ttg-black font-mono text-[10px]">{result.slug}</span></div>
                    <div className="flex justify-between font-bold"><span className="text-ttg-black/50">Number</span><span className="text-ttg-black font-mono">{result.number}</span></div>
                    <div className="flex justify-between font-bold">
                      <span className="text-ttg-black/50">Rarity</span>
                      <span className="text-ttg-black uppercase flex items-center gap-1" style={{ color: RARITIES.find(r => r.slug === result.rarity)?.color }}>
                        {Array.from({ length: RARITIES.find(r => r.slug === result.rarity)?.stars || 1 }).map((_, i) => (
                          <Star key={i} className="w-3 h-3" fill="currentColor" stroke="currentColor" />
                        ))}
                        {result.rarity}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold"><span className="text-ttg-black/50">Role</span><span className="text-ttg-black uppercase">{result.role}</span></div>
                    {result.combatType && <div className="flex justify-between font-bold"><span className="text-ttg-black/50">Combat</span><span className="text-ttg-black uppercase">{result.combatType}</span></div>}
                    {result.finish && <div className="flex justify-between font-bold"><span className="text-ttg-black/50">Finish</span><span className="text-ttg-black uppercase">{result.finish}</span></div>}
                    <div className="flex justify-between font-bold"><span className="text-ttg-black/50">Image</span><a href={result.imageUrl} target="_blank" rel="noreferrer" className="text-ttg-blue underline text-[10px]">View Full</a></div>
                    <div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t border-ttg-black/10">
                      {['attack','defense','control'].map(s => (
                        <div key={s} className="text-center">
                          <span className="block text-[9px] font-black uppercase text-ttg-black/30">{s.slice(0,3)}</span>
                          <span className="block text-sm font-black text-ttg-black">{result[s]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a href={result.imageUrl} download
                    className="mag-btn flex-1 py-2 text-xs bg-ttg-blue text-white border-2 border-ttg-black shadow-[2px_2px_0px_var(--ttg-black)] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:shadow-[1px_1px_0px_var(--ttg-black)] hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
                    <Download className="w-3.5 h-3.5" /> Download PNG
                  </a>
                  <button onClick={() => { setResult(null); setError(""); }}
                    className="mag-btn px-4 py-2 text-xs bg-ttg-cream text-ttg-black border-2 border-ttg-black shadow-[2px_2px_0px_var(--ttg-black)] font-bold uppercase tracking-wider hover:shadow-[1px_1px_0px_var(--ttg-black)] hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
                    Create Another
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Preview Panel */}
          <div className="space-y-6">
            <div className="mag-card p-5 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] sticky top-24">
              <h3 className="text-xs font-black uppercase tracking-wider text-ttg-black/50 mb-4 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Live Preview
              </h3>
              <div className="bg-ttg-black p-6 mb-4">
                <div className="w-48 h-48 mx-auto">
                  <DiscPreview franchise={franchise} rarity={rarity} />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-wider text-ttg-black/30">PROMPT PREVIEW</p>
                <div className="bg-ttg-black/5 p-3 text-[9px] font-mono text-ttg-black/50 leading-relaxed max-h-48 overflow-y-auto">
                  {name ? (
                    <>
                      <span className="text-ttg-blue">Transparent character illustration</span> for tazo disc:{' '}
                      <strong className="text-ttg-black">{name}</strong>
                      {description && <>, <span className="text-ttg-black/40">{description}</span></>}.{' '}
                      <span className="text-ttg-black/40">
                        {FRANCHISES.find(f => f.slug === franchise)?.name} style.{' '}
                        {RARITIES.find(r => r.slug === rarity)?.desc} effects.{' '}
                        {role} role.
                      </span>
                      <span className="block mt-2 text-ttg-success">
                        Transparency guard appended{"\n"}
                        Negative prompt applied{"\n"}
                        Official tazo-art-studio frontal bg
                      </span>
                    </>
                  ) : (
                    <span className="italic">Enter a creature name to see the prompt preview...</span>
                  )}
                </div>
              </div>
              <div className="mt-4 p-3 border-2 border-ttg-yellow/30 bg-ttg-yellow/5">
                <h4 className="text-[9px] font-black uppercase tracking-wider text-ttg-yellow mb-2">Generation Rules</h4>
                <ul className="text-[9px] font-bold text-ttg-black/50 space-y-1">
                  <li className="flex items-center gap-1.5"><Target className="w-3 h-3 text-ttg-red" /> Character only — no backgrounds</li>
                  <li className="flex items-center gap-1.5"><Wand2 className="w-3 h-3 text-ttg-purple" /> Rarity effects attach to character</li>
                  <li className="flex items-center gap-1.5"><Ban className="w-3 h-3 text-ttg-red" /> No frames, borders, text, watermarks</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-ttg-success" /> 4-corner alpha transparency validation</li>
                  <li className="flex items-center gap-1.5"><Palette className="w-3 h-3 text-ttg-blue" /> Official tazo-art-studio backgrounds</li>
                  <li className="flex items-center gap-1.5"><Download className="w-3 h-3 text-ttg-warning" /> Back side with series design</li>
                  <li className="flex items-center gap-1.5"><BarChart3 className="w-3 h-3 text-ttg-cybermon" /> Stats: Role + Rarity x multiplier</li>
                  <li className="flex items-center gap-1.5"><Gamepad2 className="w-3 h-3 text-ttg-success" /> Skill + Combat Type for gameplay</li>
                </ul>
              </div>
            </div>

            {recentCreations.length > 0 && (
              <div className="mag-card p-5 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)]">
                <h3 className="text-xs font-black uppercase tracking-wider text-ttg-black/50 mb-4">Recent Creations</h3>
                <div className="space-y-2">
                  {recentCreations.slice(0, 6).map((t: any) => (
                    <div key={t.id} className="flex items-center gap-3 p-2 border-2 border-ttg-black/10 bg-white">
                      <TazoDiscImage src={t.imageUrl} alt={t.name} size={40} borderWidth={0}
                        franchiseSlug={t.franchise?.slug || "minimon"}
                        finish={t.finish} creatureVariant={t.creatureVariant} shinyImageUrl={t.shinyImageUrl} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase text-ttg-black truncate">{t.name}</p>
                        <p className="text-[8px] font-bold text-ttg-black/40 uppercase">{t.franchise?.slug} &middot; {t.rarity} &middot; {t.role}{t.combatType ? ` &middot; ${t.combatType}` : ''}</p>
                      </div>
                      <span className="text-[8px] font-bold text-ttg-black/20 uppercase">#{t.number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
