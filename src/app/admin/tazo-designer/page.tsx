"use client";

// ============================================================
// Trading Tazos Game — Admin Tazo Designer
// Visual drag-and-drop editor for tazo element positioning

// Cache-buster: bump when images are regenerated with structural changes
const IMG_CACHE_BUSTER = "v3";
// ============================================================
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Shield, Wand2, Loader2, LayoutGrid, RefreshCw,
  ArrowLeft, Download, Save, Eye, Zap, FlipHorizontal, FlipVertical,
} from "lucide-react";
import Link from "next/link";
import TazoVisualEditor from "@/components/admin/tazo-visual-editor";
import type { LayoutConfig } from "@/components/admin/tazo-visual-editor";
import { DEFAULT_LAYOUT } from "@/components/admin/tazo-visual-editor";
import TazoBackEditor from "@/components/admin/tazo-back-editor";

const FRANCHISE_ORDER = ["cybermon", "dracobell", "minimon"];

export default function AdminTazoDesignerPage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.email === "dev@tradingtazosgame.com";

  const [publishedTazos, setPublishedTazos] = useState<any[]>([]);
  const [selectedTazo, setSelectedTazo] = useState<any>(null);
  const [layout, setLayout] = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [loading, setLoading] = useState(true);
  const [activeFranchise, setActiveFranchise] = useState<string>("");
  const [viewMode, setViewMode] = useState<"editor" | "grid">("editor");
  const [saving, setSaving] = useState(false);
  const [designerSide, setDesignerSide] = useState<"front" | "back">("front");
  const [backLayout, setBackLayout] = useState<any>({});

  // Fetch all published tazos
  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/tazos?publishStatus=published&limit=100", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const tazos = (data.tazos || []).map((t: any) => ({
          ...t,
          // API already flattens franchise to string; don't overwrite franchiseSlug
          franchiseSlug: t.franchiseSlug || (typeof t.franchise === 'string' ? t.franchise : t.franchise?.slug) || "",
        }));
        setPublishedTazos(tazos);
        if (tazos.length > 0 && !selectedTazo) {
          setSelectedTazo(tazos[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAdmin]);

  // Load layout when tazo changes
  useEffect(() => {
    if (!selectedTazo) return;
    const fs = selectedTazo.franchiseSlug || selectedTazo.franchise?.slug || "";
    setActiveFranchise(fs);
    // Load front layout
    fetch(
      `/api/admin/tazo-layouts?franchise=${fs}&slug=${selectedTazo.slug}`,
      { credentials: "include" }
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.layout) setLayout(d.layout);
      })
      .catch(() => setLayout(DEFAULT_LAYOUT));
    // Load back layout
    fetch(
      `/api/admin/tazo-layouts?side=back&franchise=${fs}&slug=${selectedTazo.slug}`,
      { credentials: "include" }
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.layout) setBackLayout(d.layout);
      })
      .catch(() => setBackLayout({}));
  }, [selectedTazo?.slug, selectedTazo?.franchiseSlug]);

  // Navigate tazos with keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && e.ctrlKey) {
        const idx = publishedTazos.findIndex((t) => t.slug === selectedTazo?.slug);
        if (idx < publishedTazos.length - 1) {
          setSelectedTazo(publishedTazos[idx + 1]);
        }
      }
      if (e.key === "ArrowLeft" && e.ctrlKey) {
        const idx = publishedTazos.findIndex((t) => t.slug === selectedTazo?.slug);
        if (idx > 0) setSelectedTazo(publishedTazos[idx - 1]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [publishedTazos, selectedTazo]);

  const handleSaveLayout = useCallback(async () => {
    if (!activeFranchise) return;
    setSaving(true);
    try {
      await fetch("/api/admin/tazo-layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ franchise: activeFranchise, layout }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [activeFranchise, layout]);

  const handleApplyToAll = useCallback(async () => {
    if (!activeFranchise) return;
    setSaving(true);
    try {
      // Save layout
      await fetch("/api/admin/tazo-layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ franchise: activeFranchise, layout }),
      });
      // Regenerate all tazos for this franchise
      const fTazos = publishedTazos.filter(
        (t) => (t.franchiseSlug || t.franchise?.slug) === activeFranchise
      );
      // Show feedback
      alert(`Layout saved for ${activeFranchise}. ${fTazos.length} tazos will use this layout on next regeneration.`);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [activeFranchise, layout, publishedTazos]);

  const handleSaveBackLayout = useCallback(async () => {
    if (!activeFranchise) return;
    setSaving(true);
    try {
      await fetch("/api/admin/tazo-layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          franchise: activeFranchise,
          layout: backLayout,
          side: "back",
        }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [activeFranchise, backLayout]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen mag-bg">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFCC00]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center mag-bg">
        <div className="mag-card p-8 text-center max-w-md mx-4 space-y-4">
          <Shield className="w-16 h-16 mx-auto text-[#E3350D]" />
          <h1 className="text-xl font-black uppercase text-[#1a1a1a]">Access Denied</h1>
          <p className="text-sm font-bold text-[#1a1a1a]/50">Developer only.</p>
          <Link href="/" className="mag-btn inline-block bg-[#E3350D] text-white px-6 py-3 text-xs font-black uppercase border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
            Back
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen mag-bg">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFCC00]" />
      </div>
    );
  }

  // Group tazos by franchise for the grid view
  const tazosByFranchise: Record<string, any[]> = {};
  for (const t of publishedTazos) {
    const fs = t.franchiseSlug || t.franchise?.slug || "unknown";
    if (!tazosByFranchise[fs]) tazosByFranchise[fs] = [];
    tazosByFranchise[fs].push(t);
  }

  return (
    <div className="min-h-screen mag-bg">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b-4 border-[#FFCC00] sticky top-0 z-40">
        <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-zinc-500 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Wand2 className="w-6 h-6 text-[#FFCC00]" />
              <div>
                <h1 className="text-lg font-black text-white uppercase tracking-wider">Tazo Designer</h1>
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                  Visual editor · Drag & drop elements
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tazo navigator */}
            {selectedTazo && (
              <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-1.5">
                <button
                  onClick={() => {
                    const idx = publishedTazos.findIndex((t) => t.slug === selectedTazo.slug);
                    if (idx > 0) setSelectedTazo(publishedTazos[idx - 1]);
                  }}
                  className="text-zinc-500 hover:text-white"
                >
                  ◀
                </button>
                <span className="text-[10px] font-black text-white uppercase whitespace-nowrap">
                  {selectedTazo.displayName || selectedTazo.name}
                </span>
                <span className="text-[8px] font-bold text-zinc-600">
                  {publishedTazos.findIndex((t) => t.slug === selectedTazo.slug) + 1}/{publishedTazos.length}
                </span>
                <button
                  onClick={() => {
                    const idx = publishedTazos.findIndex((t) => t.slug === selectedTazo.slug);
                    if (idx < publishedTazos.length - 1) setSelectedTazo(publishedTazos[idx + 1]);
                  }}
                  className="text-zinc-500 hover:text-white"
                >
                  ▶
                </button>
              </div>
            )}

            {/* View mode */}
            <div className="flex bg-zinc-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("editor")}
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded transition-all ${
                  viewMode === "editor" ? "bg-[#FFCC00] text-[#1a1a1a]" : "text-zinc-500 hover:text-white"
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded transition-all ${
                  viewMode === "grid" ? "bg-[#FFCC00] text-[#1a1a1a]" : "text-zinc-500 hover:text-white"
                }`}
              >
                <LayoutGrid className="w-3 h-3 inline mr-1" /> Grid
              </button>
            </div>

            <span className="text-[10px] font-bold text-zinc-400">{user?.email}</span>
          </div>
        </div>
      </header>

      <main className="max-w-full mx-auto px-4 py-4">
        {viewMode === "editor" && selectedTazo && (
          <>
            {/* Side toggle tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setDesignerSide("front")}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg border-2 transition-all ${
                  designerSide === "front"
                    ? "bg-[#FFCC00] text-[#1a1a1a] border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]"
                    : "bg-white text-[#1a1a1a]/40 border-[#1a1a1a]/10 hover:border-[#FFCC00]/50"
                }`}
              >
                <FlipHorizontal className="w-3.5 h-3.5 inline mr-1" /> Front
              </button>
              <button
                onClick={() => setDesignerSide("back")}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg border-2 transition-all ${
                  designerSide === "back"
                    ? "bg-[#1a1a1a] text-[#FFCC00] border-[#FFCC00] shadow-[2px_2px_0px_#FFCC00]"
                    : "bg-white text-[#1a1a1a]/40 border-[#1a1a1a]/10 hover:border-[#1a1a1a]/30"
                }`}
              >
                <FlipVertical className="w-3.5 h-3.5 inline mr-1" /> Back
              </button>
            </div>

            {designerSide === "front" ? (
              <TazoVisualEditor
                tazoImageUrl={`/tazos-base/${selectedTazo.franchiseSlug || selectedTazo.franchise?.slug || "unknown"}/${selectedTazo.slug}.png?v=${IMG_CACHE_BUSTER}`}
                creatureImageUrl={`/tazo-creatures/${selectedTazo.franchiseSlug || selectedTazo.franchise?.slug || "unknown"}/${selectedTazo.slug}.png`}
                slug={selectedTazo.slug || ""}
                franchise={selectedTazo.franchiseSlug || selectedTazo.franchise?.slug || ""}
                rarity={selectedTazo.rarity}
                displayName={selectedTazo.displayName || selectedTazo.name}
                number={selectedTazo.number || "—"}
                collectionName={selectedTazo.collectionName || (selectedTazo.franchiseSlug || selectedTazo.franchise?.slug || "").toUpperCase() + " TAZOS SERIES 1"}
                combatType={selectedTazo.combatType}
                layout={layout}
                onLayoutChange={setLayout}
                wearLevel={selectedTazo.wearLevel || 0}
                onWearLevelChange={(level) => setSelectedTazo((t: any) => ({ ...t, wearLevel: level }))}
                publishedTazos={publishedTazos}
                onSelectTazo={setSelectedTazo}
              >
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={handleSaveLayout}
                    disabled={saving}
                    className="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded bg-[#22C55E] text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] flex items-center gap-1 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Save for {activeFranchise}
                  </button>
                  <button
                    onClick={handleApplyToAll}
                    disabled={saving}
                    className="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded bg-[#3B4CCA] text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] flex items-center gap-1 disabled:opacity-50"
                  >
                    <Zap className="w-3 h-3" />
                    Apply to all {activeFranchise}
                  </button>
                </div>
              </TazoVisualEditor>
            ) : (
              <TazoBackEditor
                backImageUrl={`/tazos-artgen/backs/${activeFranchise}-back.png`}
                franchise={activeFranchise}
                number={selectedTazo.number || "1"}
                layout={backLayout}
                onLayoutChange={setBackLayout}
                onSave={handleSaveBackLayout}
              />
            )}
          </>
        )}

        {viewMode === "grid" && (
          <div className="space-y-8">
            {FRANCHISE_ORDER.map((fs) => {
              const tazos = tazosByFranchise[fs] || [];
              if (tazos.length === 0) return null;
              const fName = fs === "minimon" ? "Minimon" : fs === "cybermon" ? "Cybermon" : "Dracobell";
              const fColor = fs === "minimon" ? "#FFCB05" : fs === "cybermon" ? "#00A1E9" : "#FF6B00";

              return (
                <div key={fs} className="mag-card p-4 border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
                  <h2 className="text-sm font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: fColor }} />
                    {fName}
                    <span className="text-[9px] font-bold text-[#1a1a1a]/30">({tazos.length} tazos)</span>
                  </h2>

                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                    {tazos.map((tazo: any) => (
                      <button
                        key={tazo.slug}
                        onClick={() => {
                          setSelectedTazo(tazo);
                          setViewMode("editor");
                        }}
                        className="group flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-[#3B4CCA]/5 hover:scale-105 transition-all"
                      >
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#1a1a1a]/10 group-hover:border-[#3B4CCA]/50 shadow-md bg-[#1a1a1a]/5 relative">
                          {tazo.imageUrl ? (
                            <img
                              src={`/tazos-base/${tazo.franchiseSlug || tazo.franchise?.slug || "unknown"}/${tazo.slug}.png?v=${IMG_CACHE_BUSTER}`}
                              alt={tazo.name}
                              className="w-full h-full object-cover"
                              style={{ borderRadius: '50%' }}
                              onError={(e) => { (e.target as HTMLImageElement).src = tazo.imageUrl; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#1a1a1a]/20">
                              <Eye className="w-6 h-6" />
                            </div>
                          )}
                          {/* Rarity dot */}
                          <div
                            className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border border-white/50 shadow"
                            style={{
                              backgroundColor:
                                tazo.rarity === "legendary" ? "#FBBF24" :
                                tazo.rarity === "ultra" ? "#A855F7" :
                                tazo.rarity === "rare" ? "#3B82F6" :
                                tazo.rarity === "uncommon" ? "#22C55E" : "#9CA3AF",
                            }}
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] font-black text-[#1a1a1a] leading-tight truncate max-w-[80px]">
                            {tazo.displayName || tazo.name}
                          </p>
                          <p className="text-[7px] font-bold text-[#1a1a1a]/30 uppercase">
                            #{tazo.number} · {tazo.rarity}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Keyboard shortcuts */}
        <div className="mt-6 p-3 bg-[#1a1a1a]/5 rounded-lg border border-[#1a1a1a]/10 flex items-center gap-4 flex-wrap">
          <span className="text-[9px] font-black uppercase text-[#1a1a1a]/40">Shortcuts:</span>
          <span className="text-[9px] font-mono font-bold text-[#1a1a1a]/30">Click element → drag to move</span>
          <span className="text-[9px] font-mono font-bold text-[#1a1a1a]/30">Arrow keys → nudge 1px</span>
          <span className="text-[9px] font-mono font-bold text-[#1a1a1a]/30">Shift+Arrow → nudge 10px</span>
          <span className="text-[9px] font-mono font-bold text-[#1a1a1a]/30">+/- → scale element</span>
          <span className="text-[9px] font-mono font-bold text-[#1a1a1a]/30">Ctrl+←/→ → prev/next tazo</span>
        </div>
      </main>
    </div>
  );
}
