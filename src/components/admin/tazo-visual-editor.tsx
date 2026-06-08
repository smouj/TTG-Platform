"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Move, RotateCw, ZoomIn, ZoomOut, Save, Download,
  Eye, EyeOff, GripHorizontal, RefreshCw, SlidersHorizontal,
  LayoutGrid, Image as ImageIcon, ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Disc,
} from "lucide-react";

// ── Types ──
export interface LayoutConfig {
  badge: { x: number; y: number; scale: number };
  number: { x: number; y: number; scale: number };
  name: { x: number; y: number; scale: number };
  rarity: { x: number; y: number; scale: number };
  creature: { x: number; y: number; scale: number };
}

export const DEFAULT_LAYOUT: LayoutConfig = {
  badge: { x: 0, y: -280, scale: 1.0 },        // top of disc (0=center, negative=up)
  number: { x: -280, y: 250, scale: 1.0 },       // bottom-left
  name: { x: 0, y: 330, scale: 1.0 },            // bottom center
  rarity: { x: 280, y: 250, scale: 1.0 },        // bottom-right
  creature: { x: 0, y: 0, scale: 1.0 },          // center
};

export type ElementKey = keyof LayoutConfig;

const ELEMENT_LABELS: Record<ElementKey, string> = {
  badge: "Badge",
  number: "Number",
  name: "Name",
  rarity: "Rarity",
  creature: "Creature",
};

const ELEMENT_COLORS: Record<ElementKey, string> = {
  badge: "#A855F7",
  number: "#3B82F6",
  name: "#22C55E",
  rarity: "#FBBF24",
  creature: "#E3350D",
};

// ── Props ──
interface TazoVisualEditorProps {
  tazoImageUrl?: string;
  franchise: string;
  rarity: string;
  displayName: string;
  number: string;
  combatType?: string;
  layout: LayoutConfig;
  onLayoutChange: (layout: LayoutConfig) => void;
  publishedTazos?: any[]; // for the browser
  onSelectTazo?: (tazo: any) => void;
  children?: React.ReactNode;
}

// ── Draggable element ──
function DraggableElement({
  id,
  x,
  y,
  scale,
  color,
  label,
  children,
  active,
  onActivate,
  onMove,
  onNudge,
  onScaleChange,
}: {
  id: ElementKey;
  x: number;
  y: number;
  scale: number;
  color: string;
  label: string;
  children: React.ReactNode;
  active: boolean;
  onActivate: () => void;
  onMove: (dx: number, dy: number) => void;
  onNudge: (dx: number, dy: number) => void;
  onScaleChange: (delta: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onActivate();
      dragging.current = true;
      startPos.current = { x: e.clientX, y: e.clientY };

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const dx = ev.clientX - startPos.current.x;
        const dy = ev.clientY - startPos.current.y;
        startPos.current = { x: ev.clientX, y: ev.clientY };
        onMove(dx, dy);
      };

      const onMouseUp = () => {
        dragging.current = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [onActivate, onMove]
  );

  // Keyboard nudging when active
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 10 : 1;
      switch (e.key) {
        case "ArrowUp": e.preventDefault(); onNudge(0, -step); break;
        case "ArrowDown": e.preventDefault(); onNudge(0, step); break;
        case "ArrowLeft": e.preventDefault(); onNudge(-step, 0); break;
        case "ArrowRight": e.preventDefault(); onNudge(step, 0); break;
        case "+": case "=": e.preventDefault(); onScaleChange(0.05); break;
        case "-": e.preventDefault(); onScaleChange(-0.05); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, onNudge, onScaleChange]);

  return (
    <div
      ref={ref}
      onMouseDown={handleMouseDown}
      className={`absolute cursor-grab active:cursor-grabbing select-none transition-shadow
        ${active ? "z-50" : "z-10"}
        ${active ? "ring-2 ring-offset-1 ring-white/80 rounded" : ""}
      `}
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: "center",
      }}
    >
      {children}
      {/* Active indicator */}
      {active && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#1a1a1a] text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow">
          {label}
        </div>
      )}
      {/* Hitbox handle */}
      <div
        className="absolute inset-0 rounded-full opacity-0"
        style={{ border: `1px dashed ${color}` }}
      />
    </div>
  );
}

// ── Badge renderer ──
function BadgeElement({ combatType }: { combatType?: string }) {
  const typeColors: Record<string, { bg: string; icon: string }> = {
    fire: { bg: "#E3350D", icon: "🔥" },
    water: { bg: "#3B82F6", icon: "💧" },
    electric: { bg: "#FBBF24", icon: "⚡" },
    ghost: { bg: "#A855F7", icon: "👻" },
    grass: { bg: "#22C55E", icon: "🌿" },
    ice: { bg: "#06B6D4", icon: "❄️" },
    psychic: { bg: "#EC4899", icon: "🔮" },
    dark: { bg: "#1a1a1a", icon: "🌑" },
    earth: { bg: "#92400E", icon: "🪨" },
    light: { bg: "#FEF3C7", icon: "✨" },
    human: { bg: "#F59E0B", icon: "👤" },
    saiyan: { bg: "#E3350D", icon: "💪" },
    namekian: { bg: "#22C55E", icon: "👽" },
    melee: { bg: "#DC2626", icon: "⚔️" },
    ranged: { bg: "#2563EB", icon: "🏹" },
    hybrid: { bg: "#7C3AED", icon: "🔀" },
    support: { bg: "#059669", icon: "💊" },
    data: { bg: "#0EA5E9", icon: "💾" },
    virus: { bg: "#DC2626", icon: "🦠" },
    tech: { bg: "#6366F1", icon: "⚙️" },
  };
  const t = combatType?.toLowerCase() || "";
  const cfg = typeColors[t] || { bg: "#6B7280", icon: "◆" };

  return (
    <div
      className="flex items-center justify-center rounded-full shadow-lg border-2 border-[#1a1a1a] text-white font-black text-[10px] w-10 h-10"
      style={{ backgroundColor: cfg.bg }}
    >
      {cfg.icon}
    </div>
  );
}

// ── Number renderer ──
function NumberElement({ number }: { number: string }) {
  return (
    <div className="bg-[#1a1a1a]/90 backdrop-blur text-white font-black text-xs px-2 py-0.5 rounded-full border border-white/20 shadow-lg">
      #{number}
    </div>
  );
}

// ── Name renderer ──
function NameElement({ name }: { name: string }) {
  return (
    <div className="bg-[#1a1a1a]/85 backdrop-blur text-white font-black text-[10px] px-2.5 py-1 rounded-md border border-white/10 shadow-lg whitespace-nowrap tracking-wider uppercase">
      {name}
    </div>
  );
}

// ── Rarity stars renderer ──
function RarityElement({ rarity }: { rarity: string }) {
  const stars: Record<string, number> = {
    common: 1, uncommon: 2, rare: 3, "ultra-rare": 4, legendary: 5,
    ultra: 4,
  };
  const count = stars[rarity] || 1;
  const color = rarity === "legendary" ? "#FBBF24" : rarity === "ultra-rare" || rarity === "ultra" ? "#A855F7" : "#EAB308";

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-full border border-[#1a1a1a]/30 shadow"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

// ── Main Component ──
export default function TazoVisualEditor({
  tazoImageUrl,
  franchise,
  rarity,
  displayName,
  number,
  combatType,
  layout,
  onLayoutChange,
  publishedTazos = [],
  onSelectTazo,
  children,
}: TazoVisualEditorProps) {
  const [activeElement, setActiveElement] = useState<ElementKey | null>(null);
  const [showElements, setShowElements] = useState<Record<ElementKey, boolean>>({
    badge: true, number: true, name: true, rarity: true, creature: true,
  });
  const [previewSize, setPreviewSize] = useState(440);
  const [showBrowser, setShowBrowser] = useState(false);
  const [browserPage, setBrowserPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 8;

  const handleMove = useCallback(
    (id: ElementKey, dx: number, dy: number) => {
      onLayoutChange({
        ...layout,
        [id]: {
          ...layout[id],
          x: layout[id].x + dx,
          y: layout[id].y + dy,
        },
      });
    },
    [layout, onLayoutChange]
  );

  const handleNudge = useCallback(
    (id: ElementKey, dx: number, dy: number) => {
      handleMove(id, dx, dy);
    },
    [handleMove]
  );

  const handleScaleChange = useCallback(
    (id: ElementKey, delta: number) => {
      onLayoutChange({
        ...layout,
        [id]: {
          ...layout[id],
          scale: Math.max(0.3, Math.min(3, layout[id].scale + delta)),
        },
      });
    },
    [layout, onLayoutChange]
  );

  // Reset layout to default
  const resetLayout = () => {
    onLayoutChange({ ...DEFAULT_LAYOUT });
  };

  // Save layout
  const saveLayout = async () => {
    try {
      await fetch("/api/admin/tazo-layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ franchise, layout }),
      });
    } catch (e) {
      console.error("Failed to save layout", e);
    }
  };

  // Load saved layout
  useEffect(() => {
    if (!franchise) return;
    fetch(`/api/admin/tazo-layouts?franchise=${franchise}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.layout) onLayoutChange(d.layout);
      })
      .catch(() => {});
  }, [franchise]);

  const totalPages = Math.ceil(publishedTazos.length / PAGE_SIZE);
  const pagedTazos = publishedTazos.slice(
    browserPage * PAGE_SIZE,
    (browserPage + 1) * PAGE_SIZE
  );

  return (
    <div className="flex flex-col gap-4" ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-[#1a1a1a]/5 rounded-lg p-1">
          {(Object.keys(ELEMENT_LABELS) as ElementKey[]).map((key) => (
            <button
              key={key}
              onClick={() => {
                setActiveElement(key);
                setShowElements((p) => ({ ...p, [key]: true }));
              }}
              className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded transition-all flex items-center gap-1
                ${activeElement === key
                  ? "text-white shadow"
                  : "text-[#1a1a1a]/40 hover:text-[#1a1a1a]/70"
                }`}
              style={{
                backgroundColor: activeElement === key ? ELEMENT_COLORS[key] : undefined,
              }}
            >
              <GripHorizontal className="w-3 h-3" />
              {ELEMENT_LABELS[key]}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-[#1a1a1a]/10" />

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPreviewSize((s) => Math.max(200, s - 40))}
            className="p-1.5 rounded bg-[#1a1a1a]/5 hover:bg-[#1a1a1a]/10 text-[#1a1a1a]/50"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[9px] font-bold text-[#1a1a1a]/30 w-10 text-center">{previewSize}px</span>
          <button
            onClick={() => setPreviewSize((s) => Math.min(800, s + 40))}
            className="p-1.5 rounded bg-[#1a1a1a]/5 hover:bg-[#1a1a1a]/10 text-[#1a1a1a]/50"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-6 w-px bg-[#1a1a1a]/10" />

        <button
          onClick={resetLayout}
          className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded bg-[#1a1a1a]/5 hover:bg-[#1a1a1a]/10 text-[#1a1a1a]/50 flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Reset
        </button>

        <button
          onClick={saveLayout}
          className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] flex items-center gap-1"
        >
          <Save className="w-3 h-3" />
          Save Layout
        </button>

        {/* Toggle visibility */}
        {(Object.keys(ELEMENT_LABELS) as ElementKey[]).map((key) => (
          <button
            key={`toggle-${key}`}
            onClick={() => setShowElements((p) => ({ ...p, [key]: !p[key] }))}
            className={`text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-all
              ${showElements[key]
                ? "bg-[#1a1a1a]/10 text-[#1a1a1a]/60"
                : "bg-transparent text-[#1a1a1a]/20 line-through"
              }`}
          >
            {showElements[key] ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
            {ELEMENT_LABELS[key][0]}
          </button>
        ))}

        {/* Browser toggle */}
        <button
          onClick={() => setShowBrowser(!showBrowser)}
          className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded flex items-center gap-1 transition-all
            ${showBrowser
              ? "bg-[#3B4CCA] text-white"
              : "bg-[#1a1a1a]/5 text-[#1a1a1a]/50 hover:bg-[#1a1a1a]/10"
            }`}
        >
          <LayoutGrid className="w-3 h-3" />
          Published ({publishedTazos.length})
        </button>

        {children}
      </div>

      <div className="flex gap-4">
        {/* Main Editor */}
        <div className="flex-1">
          <div className="mag-card p-4 border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
            {/* Preview area */}
            <div className="flex items-center justify-center min-h-[600px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNmOGY4ZjgiLz48cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiNmMGYwZjAiLz48L3N2Zz4=')] rounded-lg relative overflow-hidden"
              style={{ height: previewSize + 160 }}
            >
              {/* Disc background */}
              <div
                className="absolute rounded-full overflow-hidden shadow-2xl"
                style={{
                  width: previewSize,
                  height: previewSize,
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                {/* Tazo image or placeholder */}
                {tazoImageUrl ? (
                  <img
                    src={tazoImageUrl}
                    alt={displayName || "Tazo"}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                    <Disc className="w-16 h-16 text-zinc-700" />
                  </div>
                )}

                {/* Draggable elements layer */}
                <div className="absolute inset-0" style={{ pointerEvents: "auto" }}>
                  {/* Badge */}
                  {showElements.badge && (
                    <DraggableElement
                      id="badge"
                      x={layout.badge.x * (previewSize / 880)}
                      y={layout.badge.y * (previewSize / 880)}
                      scale={layout.badge.scale}
                      color={ELEMENT_COLORS.badge}
                      label="Badge"
                      active={activeElement === "badge"}
                      onActivate={() => setActiveElement("badge")}
                      onMove={(dx, dy) => handleMove("badge", dx / (previewSize / 880), dy / (previewSize / 880))}
                      onNudge={(dx, dy) => handleNudge("badge", dx, dy)}
                      onScaleChange={(d) => handleScaleChange("badge", d)}
                    >
                      <BadgeElement combatType={combatType} />
                    </DraggableElement>
                  )}

                  {/* Number */}
                  {showElements.number && (
                    <DraggableElement
                      id="number"
                      x={layout.number.x * (previewSize / 880)}
                      y={layout.number.y * (previewSize / 880)}
                      scale={layout.number.scale}
                      color={ELEMENT_COLORS.number}
                      label="Number"
                      active={activeElement === "number"}
                      onActivate={() => setActiveElement("number")}
                      onMove={(dx, dy) => handleMove("number", dx / (previewSize / 880), dy / (previewSize / 880))}
                      onNudge={(dx, dy) => handleNudge("number", dx, dy)}
                      onScaleChange={(d) => handleScaleChange("number", d)}
                    >
                      <NumberElement number={number} />
                    </DraggableElement>
                  )}

                  {/* Name */}
                  {showElements.name && (
                    <DraggableElement
                      id="name"
                      x={layout.name.x * (previewSize / 880)}
                      y={layout.name.y * (previewSize / 880)}
                      scale={layout.name.scale}
                      color={ELEMENT_COLORS.name}
                      label="Name"
                      active={activeElement === "name"}
                      onActivate={() => setActiveElement("name")}
                      onMove={(dx, dy) => handleMove("name", dx / (previewSize / 880), dy / (previewSize / 880))}
                      onNudge={(dx, dy) => handleNudge("name", dx, dy)}
                      onScaleChange={(d) => handleScaleChange("name", d)}
                    >
                      <NameElement name={displayName || "Tazo Name"} />
                    </DraggableElement>
                  )}

                  {/* Rarity stars */}
                  {showElements.rarity && (
                    <DraggableElement
                      id="rarity"
                      x={layout.rarity.x * (previewSize / 880)}
                      y={layout.rarity.y * (previewSize / 880)}
                      scale={layout.rarity.scale}
                      color={ELEMENT_COLORS.rarity}
                      label="Rarity"
                      active={activeElement === "rarity"}
                      onActivate={() => setActiveElement("rarity")}
                      onMove={(dx, dy) => handleMove("rarity", dx / (previewSize / 880), dy / (previewSize / 880))}
                      onNudge={(dx, dy) => handleNudge("rarity", dx, dy)}
                      onScaleChange={(d) => handleScaleChange("rarity", d)}
                    >
                      <RarityElement rarity={rarity} />
                    </DraggableElement>
                  )}
                </div>
              </div>

              {/* Guide crosshairs */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: "50%",
                  top: "50%",
                  width: previewSize,
                  height: previewSize,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {/* Center cross */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
                {/* Outline of disc */}
                <div className="absolute inset-0 rounded-full border border-white/10" />
              </div>

              {/* Instructions overlay */}
              {!activeElement && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1a1a1a]/80 backdrop-blur text-white text-[10px] font-bold px-3 py-1.5 rounded-full pointer-events-none">
                  Click an element above to start positioning · Drag to move · Arrow keys to nudge · +/- to scale
                </div>
              )}
            </div>

            {/* Position info for active element */}
            {activeElement && (
              <div className="mt-3 p-3 bg-[#1a1a1a]/5 rounded-lg border border-[#1a1a1a]/10">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: ELEMENT_COLORS[activeElement] }}>
                    {ELEMENT_LABELS[activeElement]}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-[#1a1a1a]/50">
                    X: {layout[activeElement].x.toFixed(0)}px &nbsp; Y: {layout[activeElement].y.toFixed(0)}px
                  </span>
                  <span className="text-[9px] font-mono font-bold text-[#1a1a1a]/50">
                    Scale: {layout[activeElement].scale.toFixed(2)}x
                  </span>
                  <div className="flex items-center gap-0.5 ml-auto">
                    {([
                      [0, -1, ArrowUp],
                      [0, 1, ArrowDown],
                      [-1, 0, ArrowLeft],
                      [1, 0, ArrowRight],
                    ] as [number, number, any][]).map(([dx, dy, Icon], i) => (
                      <button
                        key={i}
                        onClick={() => handleNudge(activeElement, dx * 5, dy * 5)}
                        className="p-1 rounded hover:bg-[#1a1a1a]/10 text-[#1a1a1a]/40 hover:text-[#1a1a1a]/70"
                        title={`Nudge ${dx > 0 ? "right" : dx < 0 ? "left" : dy > 0 ? "down" : "up"} 5px`}
                      >
                        <Icon className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Published tazos browser (sidebar) */}
        {showBrowser && (
          <div className="w-72 flex-shrink-0">
            <div className="mag-card p-3 border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] sticky top-24 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-[#1a1a1a] flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5" /> Published Tazos
                </h3>
                <span className="text-[9px] font-bold text-[#1a1a1a]/30">{publishedTazos.length} total</span>
              </div>

              <div className="space-y-1.5">
                {pagedTazos.map((tazo: any) => (
                  <button
                    key={tazo.id || tazo.slug}
                    onClick={() => onSelectTazo?.(tazo)}
                    className="w-full flex items-center gap-2 p-2 rounded border border-[#1a1a1a]/10 hover:border-[#3B4CCA]/30 hover:bg-[#3B4CCA]/5 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-[#1a1a1a]/5 border border-[#1a1a1a]/10">
                      {tazo.imageUrl ? (
                        <img src={tazo.imageUrl} alt={tazo.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-[#1a1a1a]/20" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-[#1a1a1a] truncate">{tazo.displayName || tazo.name}</p>
                      <p className="text-[8px] font-bold text-[#1a1a1a]/30 uppercase">
                        {tazo.franchise?.slug || tazo.franchiseSlug || "—"} · {tazo.rarity}
                      </p>
                    </div>
                    <span className="text-[8px] font-mono text-[#1a1a1a]/20">#{tazo.number}</span>
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#1a1a1a]/10">
                  <button
                    onClick={() => setBrowserPage((p) => Math.max(0, p - 1))}
                    disabled={browserPage === 0}
                    className="p-1 rounded hover:bg-[#1a1a1a]/10 disabled:opacity-20"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[9px] font-bold text-[#1a1a1a]/40">
                    {browserPage + 1}/{totalPages}
                  </span>
                  <button
                    onClick={() => setBrowserPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={browserPage >= totalPages - 1}
                    className="p-1 rounded hover:bg-[#1a1a1a]/10 disabled:opacity-20"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
