"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Move, RotateCw, ZoomIn, ZoomOut, Save, Download,
  Eye, EyeOff, GripHorizontal, RefreshCw, SlidersHorizontal,
  LayoutGrid, Image as ImageIcon, ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Disc,
  Scissors, Gauge, Undo2, Redo2, Lock, Unlock, Crosshair,
  Clipboard, ClipboardCheck, BookOpen, Copy,
} from "lucide-react";
import LayersPanel, { ALL_LAYERS } from "@/components/admin/layers-panel";
import CreatureViewer from "@/components/admin/creature-viewer";
import ScratchOverlay from "@/components/admin/scratch-overlay";
import ElementProperties from "@/components/admin/element-properties";
import TazoDiscImage from "@/components/game/tazo-disc-image";

// ── Types ──
export interface LayoutConfig {
  collection: { x: number; y: number; scale: number };
  badge: { x: number; y: number; scale: number };
  number: { x: number; y: number; scale: number };
  name: { x: number; y: number; scale: number };
  rarity: { x: number; y: number; scale: number };
  creature: { x: number; y: number; scale: number };
}

export const DEFAULT_LAYOUT: LayoutConfig = {
  collection: { x: 0, y: -300, scale: 1.0 },
  badge: { x: 290, y: 0, scale: 1.0 },
  number: { x: -290, y: 0, scale: 1.0 },
  name: { x: 0, y: 300, scale: 1.0 },
  rarity: { x: 0, y: -250, scale: 1.0 },
  creature: { x: 0, y: 0, scale: 1.0 },
};

export type ElementKey = keyof LayoutConfig;

// ── Undo/Redo hook ──
function useHistory(initial: LayoutConfig) {
  const [past, setPast] = useState<LayoutConfig[]>([]);
  const [present, setPresent] = useState<LayoutConfig>(initial);
  const [future, setFuture] = useState<LayoutConfig[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const push = useCallback((next: LayoutConfig) => {
    setPast((p) => [...p.slice(-49), present]);
    setPresent(next);
    setFuture([]);
    setCanUndo(true);
    setCanRedo(false);
  }, [present]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    setFuture((f) => [present, ...f]);
    setPresent(prev);
    setPast((p) => p.slice(0, -1));
    setCanUndo(past.length > 1);
    setCanRedo(true);
  }, [past, present]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setPast((p) => [...p, present]);
    setPresent(next);
    setFuture((f) => f.slice(1));
    setCanUndo(true);
    setCanRedo(future.length > 1);
  }, [future, present]);

  const reset = useCallback((layout: LayoutConfig) => {
    setPast([]);
    setPresent(layout);
    setFuture([]);
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  return { present, push, undo, redo, reset, canUndo, canRedo };
}

const ELEMENT_LABELS: Record<ElementKey, string> = {
  collection: "Collection",
  badge: "Badge",
  number: "Number",
  name: "Name",
  rarity: "Rarity",
  creature: "Creature",
};

const ELEMENT_COLORS: Record<ElementKey, string> = {
  collection: "#06B6D4",
  badge: "var(--ttg-purple)",
  number: "var(--ttg-rarity-rare)",
  name: "var(--ttg-success)",
  rarity: "#FBBF24",
  creature: "var(--ttg-red)",
};

// ── Props ──
interface TazoVisualEditorProps {
  tazoImageUrl?: string;
  creatureImageUrl?: string;
  slug?: string;
  franchise: string;
  rarity: string;
  displayName: string;
  number: string;
  collectionName?: string;
  combatType?: string;
  layout: LayoutConfig;
  onLayoutChange: (layout: LayoutConfig) => void;
  wearLevel?: number;
  onWearLevelChange?: (level: number) => void;
  publishedTazos?: any[];
  onSelectTazo?: (tazo: any) => void;
  children?: React.ReactNode;
  finish?: string;
  creatureVariant?: string;
  shinyImageUrl?: string;
}

// ── Draggable element (enhanced with snap + coordinates display) ──
function snapValue(val: number, grid: number): number {
  return Math.round(val / grid) * grid;
}

function DraggableElement({
  id,
  x,
  y,
  scale,
  color,
  label,
  children,
  active,
  locked,
  onActivate,
  onMove,
  onNudge,
  onScaleChange,
  onDragStart,
  onDragEnd,
}: {
  id: ElementKey;
  x: number;
  y: number;
  scale: number;
  color: string;
  label: string;
  children: React.ReactNode;
  active: boolean;
  locked: boolean;
  onActivate: () => void;
  onMove: (dx: number, dy: number) => void;
  onNudge: (dx: number, dy: number) => void;
  onScaleChange: (delta: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const [isSnapped, setIsSnapped] = useState(false);
  const snapRef = useRef<{ x: boolean; y: boolean }>({ x: false, y: false });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (locked) return;
      e.preventDefault();
      e.stopPropagation();
      onActivate();
      onDragStart?.();
      dragging.current = true;
      startPos.current = { x: e.clientX, y: e.clientY };

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        let dx = ev.clientX - startPos.current.x;
        let dy = ev.clientY - startPos.current.y;
        
        // Snap to grid when Shift held
        if (ev.shiftKey) {
          dx = snapValue(dx, 10);
          dy = snapValue(dy, 10);
          setIsSnapped(true);
        } else {
          setIsSnapped(false);
        }
        
        startPos.current = { x: ev.clientX, y: ev.clientY };
        onMove(dx, dy);
      };

      const onMouseUp = () => {
        dragging.current = false;
        setIsSnapped(false);
        onDragEnd?.();
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [locked, onActivate, onMove, onDragStart, onDragEnd]
  );

  // Keyboard nudging when active (respects lock)
  useEffect(() => {
    if (!active || locked) return;
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
  }, [active, locked, onNudge, onScaleChange]);

  return (
    <div
      ref={ref}
      onMouseDown={handleMouseDown}
      className={`absolute select-none transition-shadow
        ${locked ? "cursor-not-allowed opacity-50" : "cursor-grab active:cursor-grabbing"}
        ${active ? "z-50" : "z-10"}
        ${active ? "ring-2 ring-offset-1 ring-ttg-yellow rounded" : ""}
        ${isSnapped ? "ring-[#22C55E]" : ""}
        ${locked ? "ring-ttg-red" : ""}
      `}
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: "center",
      }}
    >
      {children}
      {/* Active indicator with coordinates */}
      {active && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-ttg-black text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1.5">
          {locked && <Lock className="w-2 h-2 text-ttg-red" />}
          {label}
          <span className="text-[7px] font-mono text-white/50">({Math.round(x)}, {Math.round(y)})</span>
        </div>
      )}
      {/* Hitbox handle */}
      <div
        className="absolute inset-0 rounded-full opacity-0"
        style={{ border: `1px dashed ${locked ? "var(--ttg-red)" : color}` }}
      />
    </div>
  );
}

// ── Badge renderer — classic white tazo badge with black border ──
function BadgeElement({ combatType }: { combatType?: string }) {
  const typeIcons: Record<string, string> = {
    fire: "🔥", water: "💧", electric: "⚡", ghost: "👻", grass: "🌿",
    ice: "❄️", psychic: "🔮", dark: "🌑", earth: "🪨", light: "☀️",
    striker: "⚔️", guardian: "🛡️", auralord: "✨", beastborn: "🐾",
    monkblade: "🗡️", stormfist: "⚡", voidwalker: "🌑", sunborn: "☀️",
    ironbody: "⬢", skyfighter: "🪽", dragonkin: "◆", bell_sage: "🔔",
    melee: "⚔️", ranged: "🏹", hybrid: "🔀", support: "💊",
    data: "💾", virus: "🦠", tech: "⚙️",
  };
  const t = combatType?.toLowerCase() || "";
  const icon = typeIcons[t] || "◆";

  return (
    <div
      className="flex items-center justify-center rounded-full shadow-lg border-[2.5px] border-ttg-black font-black text-[12px] w-12 h-12"
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
    >
      <span style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.3))" }}>{icon}</span>
    </div>
  );
}

// ── Number renderer — white pill badge with black border ──
function NumberElement({ number }: { number: string }) {
  return (
    <div
      className="font-black text-[11px] px-3 py-1 rounded-full shadow-lg whitespace-nowrap"
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)",
        color: "var(--ttg-black)",
        border: "2.5px solid var(--ttg-black)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
    >
      #{number}
    </div>
  );
}

// ── Name renderer — white label with black border ──
function NameElement({ name }: { name: string }) {
  return (
    <div
      className="font-black text-[10px] px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap tracking-wider uppercase"
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)",
        color: "var(--ttg-black)",
        border: "2.5px solid var(--ttg-black)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
    >
      {name}
    </div>
  );
}

// ── Collection label renderer — white pill with black border ──
function CollectionElement({ name }: { name: string }) {
  return (
    <div
      className="text-[8px] font-black uppercase tracking-[0.15em] whitespace-nowrap px-3 py-1 rounded-full"
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)",
        color: "var(--ttg-black)",
        border: "2px solid var(--ttg-black)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
    >
      {name}
    </div>
  );
}

// ── Rarity stars renderer — gold stars with black outline ──
function RarityElement({ rarity }: { rarity: string }) {
  const stars: Record<string, number> = {
    common: 1, uncommon: 2, rare: 3, "ultra-rare": 4, legendary: 5,
    ultra: 4,
  };
  const count = stars[rarity] || 1;

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-4 h-4 rounded-full border-[2px] border-ttg-black shadow-md"
          style={{
            background: "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)",
          }}
        />
      ))}
    </div>
  );
}

// ── Main Component ──
export default function TazoVisualEditor({
  tazoImageUrl,
  creatureImageUrl,
  slug = "",
  franchise,
  rarity,
  displayName,
  number,
  collectionName,
  combatType,
  layout: externalLayout,
  onLayoutChange,
  wearLevel: externalWearLevel = 0,
  onWearLevelChange,
  publishedTazos = [],
  onSelectTazo,
  children,
  finish = "normal",
  creatureVariant = "standard",
  shinyImageUrl,
}: TazoVisualEditorProps) {
  const history = useHistory(externalLayout);
  const layout = history.present;
  
  const [activeElement, setActiveElement] = useState<ElementKey | null>(null);
  const [showElements, setShowElements] = useState<Record<ElementKey, boolean>>({
    collection: true, badge: true, number: true, name: true, rarity: true, creature: true,
  });
  const [lockedElements, setLockedElements] = useState<Record<string, boolean>>({});
  const [previewSize, setPreviewSize] = useState(440);
  const [showBrowser, setShowBrowser] = useState(false);
  const [browserPage, setBrowserPage] = useState(0);
  const [showLayers, setShowLayers] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [showCreature, setShowCreature] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [wearLevel, setWearLevel] = useState(externalWearLevel);
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>({});
  const [currentCreatureUrl, setCurrentCreatureUrl] = useState(creatureImageUrl);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Finish & variant classes for preview canvas ──
  const wearTierClass = !wearLevel ? "tazo-wear-mint"
    : wearLevel <= 15 ? "tazo-wear-light_play"
    : wearLevel <= 40 ? "tazo-wear-played"
    : wearLevel <= 70 ? "tazo-wear-heavy_play"
    : "tazo-wear-damaged";

  // Sync history push to parent
  const pushLayout = useCallback((next: LayoutConfig) => {
    history.push(next);
    onLayoutChange(next);
  }, [history, onLayoutChange]);

  const PAGE_SIZE = 8;

  const handleMove = useCallback(
    (id: ElementKey, dx: number, dy: number) => {
      if (lockedElements[id]) return;
      pushLayout({
        ...layout,
        [id]: {
          ...layout[id],
          x: layout[id].x + dx,
          y: layout[id].y + dy,
        },
      });
    },
    [layout, pushLayout, lockedElements]
  );

  const handleNudge = useCallback(
    (id: ElementKey, dx: number, dy: number) => {
      if (lockedElements[id]) return;
      handleMove(id, dx, dy);
    },
    [handleMove, lockedElements]
  );

  const handleScaleChange = useCallback(
    (id: ElementKey, delta: number) => {
      if (lockedElements[id]) return;
      pushLayout({
        ...layout,
        [id]: {
          ...layout[id],
          scale: Math.max(0.1, Math.min(5, layout[id].scale + delta)),
        },
      });
    },
    [layout, pushLayout, lockedElements]
  );

  // Reset layout to default
  const resetLayout = () => {
    pushLayout({ ...DEFAULT_LAYOUT });
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

  // Copy layout JSON
  const copyLayout = () => {
    navigator.clipboard.writeText(JSON.stringify(layout, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Ctrl+Z / Ctrl+Shift+Z global handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        history.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        history.redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [history]);

  // Load saved layout
  useEffect(() => {
    if (!franchise) return;
    fetch(`/api/admin/tazo-layouts?franchise=${franchise}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.layout) {
          history.reset(d.layout);
          onLayoutChange(d.layout);
        }
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
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Undo/Redo */}
        <button
          onClick={history.undo}
          disabled={!history.canUndo}
          className="p-1.5 rounded bg-ttg-black/5 hover:bg-ttg-black/10 disabled:opacity-20 text-ttg-black/50 transition-all"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={history.redo}
          disabled={!history.canRedo}
          className="p-1.5 rounded bg-ttg-black/5 hover:bg-ttg-black/10 disabled:opacity-20 text-ttg-black/50 transition-all"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="h-6 w-px bg-ttg-black/10" />

        {/* Element selectors */}
        <div className="flex items-center gap-0.5 bg-ttg-black/5 rounded-lg p-0.5">
          {(Object.keys(ELEMENT_LABELS) as ElementKey[]).map((key) => {
            const isLocked = lockedElements[key];
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveElement(key);
                  setShowElements((p) => ({ ...p, [key]: true }));
                }}
                className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded transition-all flex items-center gap-1
                  ${activeElement === key
                    ? "text-white shadow"
                    : "text-ttg-black/40 hover:text-ttg-black/70"
                  }`}
                style={{
                  backgroundColor: activeElement === key ? ELEMENT_COLORS[key] : undefined,
                }}
              >
                {isLocked && <Lock className="w-2 h-2" />}
                <GripHorizontal className="w-3 h-3" />
                {ELEMENT_LABELS[key]}
              </button>
            );
          })}
        </div>

        <div className="h-6 w-px bg-ttg-black/10" />

        {/* Zoom */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setPreviewSize((s) => Math.max(200, s - 40))}
            className="p-1.5 rounded bg-ttg-black/5 hover:bg-ttg-black/10 text-ttg-black/50"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[9px] font-bold text-ttg-black/30 w-10 text-center tabular-nums">{previewSize}</span>
          <button
            onClick={() => setPreviewSize((s) => Math.min(800, s + 40))}
            className="p-1.5 rounded bg-ttg-black/5 hover:bg-ttg-black/10 text-ttg-black/50"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-6 w-px bg-ttg-black/10" />

        {/* Save / Copy / Reset */}
        <button
          onClick={saveLayout}
          className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded bg-ttg-success/10 hover:bg-ttg-success/20 text-ttg-success flex items-center gap-1 transition-all"
        >
          <Save className="w-3 h-3" /> Save
        </button>

        <button
          onClick={copyLayout}
          className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded flex items-center gap-1 transition-all ${
            copied
              ? "bg-ttg-success/10 text-ttg-success"
              : "bg-ttg-black/5 hover:bg-ttg-black/10 text-ttg-black/50"
          }`}
        >
          {copied ? <ClipboardCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "JSON"}
        </button>

        <button
          onClick={resetLayout}
          className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded bg-ttg-red/5 hover:bg-ttg-red/10 text-ttg-red/50 flex items-center gap-1 transition-all"
        >
          <RefreshCw className="w-3 h-3" /> Reset
        </button>

        <div className="h-6 w-px bg-ttg-black/10" />

        {/* Panel toggles */}
        <button
          onClick={() => setShowProperties(!showProperties)}
          className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded flex items-center gap-1 transition-all ${
            showProperties
              ? "bg-ttg-purple text-white"
              : "bg-ttg-black/5 text-ttg-black/50 hover:bg-ttg-black/10"
          }`}
        >
          <SlidersHorizontal className="w-3 h-3" /> Props
        </button>

        <button
          onClick={() => setShowLayers(!showLayers)}
          className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded flex items-center gap-1 transition-all ${
            showLayers
              ? "bg-[#6366F1] text-white"
              : "bg-ttg-black/5 text-ttg-black/50 hover:bg-ttg-black/10"
          }`}
        >
          <Eye className="w-3 h-3" /> Layers
        </button>

        <button
          onClick={() => setShowBrowser(!showBrowser)}
          className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded flex items-center gap-1 transition-all ${
            showBrowser
              ? "bg-ttg-blue text-white"
              : "bg-ttg-black/5 text-ttg-black/50 hover:bg-ttg-black/10"
          }`}
        >
          <LayoutGrid className="w-3 h-3" /> ({publishedTazos.length})
        </button>

        <button
          onClick={() => setShowCreature(!showCreature)}
          className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded flex items-center gap-1 transition-all ${
            showCreature
              ? "bg-ttg-red text-white"
              : "bg-ttg-black/5 text-ttg-black/50 hover:bg-ttg-black/10"
          }`}
        >
          <Scissors className="w-3 h-3" /> Creature
        </button>

        {/* Shortcuts help */}
        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded flex items-center gap-1 transition-all ${
            showShortcuts
              ? "bg-[#FBBF24] text-ttg-black"
              : "bg-ttg-black/5 text-ttg-black/50 hover:bg-ttg-black/10"
          }`}
          title="Keyboard shortcuts"
        >
          <BookOpen className="w-3 h-3" /> ?
        </button>

        {children}
      </div>

      {/* Shortcuts cheatsheet */}
      {showShortcuts && (
        <div className="mag-card p-3 border-2 border-[#FBBF24] bg-[#FBBF24]/5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5">
            {[
              ["🖱️ Drag", "Move element"],
              ["🖱️ Shift+Drag", "Snap to 10px grid"],
              ["⌨️ Arrows", "Nudge ±1px"],
              ["⌨️ Shift+Arrow", "Nudge ±10px"],
              ["⌨️ +/-", "Scale element"],
              ["⌨️ Ctrl+Z", "Undo"],
              ["⌨️ Ctrl+Shift+Z", "Redo"],
              ["⌨️ Ctrl+←/→", "Prev/next tazo"],
              ["🔒 Click lock icon", "Lock element"],
              ["👁️ Click eye icon", "Toggle visibility"],
              ["📋 Copy JSON", "Export layout"],
              ["💾 Save", "Persist to server"],
            ].map(([key, desc]) => (
              <div key={key as string} className="flex items-center gap-1.5">
                <span className="text-[8px] font-black text-ttg-black">{key}</span>
                <span className="text-[8px] font-medium text-ttg-black/40">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {/* Left sidebar: Layers + Wear */}
        {showLayers && (
          <div className="w-52 flex-shrink-0">
            <div className="sticky top-24 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
              <LayersPanel
                visibleLayers={visibleLayers}
                onToggleLayer={(id) =>
                  setVisibleLayers((p) => ({ ...p, [id]: p[id] === false ? true : false }))
                }
                onToggleAll={(v) => {
                  const all: Record<string, boolean> = {};
                  ALL_LAYERS.forEach((l) => (all[l.id] = v));
                  setVisibleLayers(all);
                }}
              />

              <div className="mag-card p-3 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)]">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-ttg-black flex items-center gap-1.5 mb-2">
                  <Gauge className="w-3.5 h-3.5" /> Wear Level
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={wearLevel}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setWearLevel(v);
                      onWearLevelChange?.(v);
                    }}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #22C55E ${wearLevel * 0.4}%, #FBBF24 ${wearLevel * 0.7}%, #E3350D ${wearLevel}%)`,
                      accentColor: wearLevel > 60 ? "var(--ttg-red)" : wearLevel > 30 ? "#FBBF24" : "var(--ttg-success)",
                    }}
                  />
                  <span className="text-[10px] font-black text-ttg-black w-8 text-right tabular-nums">
                    {wearLevel}%
                  </span>
                </div>
                <div className="flex justify-between text-[7px] font-bold text-ttg-black/20 mt-1">
                  <span>Mint</span>
                  <span>Played</span>
                  <span>Heavy</span>
                  <span>Damaged</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Editor */}
        <div className="flex-1">
          <div className="mag-card p-4 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)]">
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
                  background: "var(--ttg-black)",
                }}
              >
              {/* Tazo disc rendered via the canonical TazoDiscImage —
                  same finish system used across the entire site */}
              <div className="absolute inset-0">
                <TazoDiscImage
                  src={shinyImageUrl && creatureVariant === "shiny" ? shinyImageUrl : tazoImageUrl}
                  alt={displayName || "Tazo"}
                  size="100%"
                  borderWidth={0}
                  franchiseSlug={franchise}
                  finish={finish as any}
                  creatureVariant={creatureVariant as any}
                  shinyImageUrl={shinyImageUrl}
                  wear={wearLevel}
                />
              </div>

                {/* Scratch overlay */}
                {wearLevel > 0 && (
                  <ScratchOverlay
                    wearLevel={wearLevel}
                    tazoSlug={slug}
                    size={previewSize}
                  />
                )}

                {/* Draggable elements layer — above finishes (z-indexes 3-6) */}
                <div className="absolute inset-0 z-10" style={{ pointerEvents: "auto" }}>
                  {/* Collection Label */}
                  {showElements.collection && (
                    <DraggableElement
                      id="collection"
                      x={layout.collection.x * (previewSize / 880)}
                      y={layout.collection.y * (previewSize / 880)}
                      scale={layout.collection.scale}
                      color={ELEMENT_COLORS.collection}
                      label="Collection"
                      active={activeElement === "collection"}
                      locked={lockedElements["collection"] || false}
                      onActivate={() => setActiveElement("collection")}
                      onMove={(dx, dy) => handleMove("collection", dx / (previewSize / 880), dy / (previewSize / 880))}
                      onNudge={(dx, dy) => handleNudge("collection", dx, dy)}
                      onScaleChange={(d) => handleScaleChange("collection", d)}
                      onDragStart={() => setIsDragging(true)}
                      onDragEnd={() => setIsDragging(false)}
                    >
                      <CollectionElement name={collectionName || franchise.toUpperCase() + " TAZOS"} />
                    </DraggableElement>
                  )}

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
                      locked={lockedElements["badge"] || false}
                      onActivate={() => setActiveElement("badge")}
                      onMove={(dx, dy) => handleMove("badge", dx / (previewSize / 880), dy / (previewSize / 880))}
                      onNudge={(dx, dy) => handleNudge("badge", dx, dy)}
                      onScaleChange={(d) => handleScaleChange("badge", d)}
                      onDragStart={() => setIsDragging(true)}
                      onDragEnd={() => setIsDragging(false)}
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
                      locked={lockedElements["number"] || false}
                      onActivate={() => setActiveElement("number")}
                      onMove={(dx, dy) => handleMove("number", dx / (previewSize / 880), dy / (previewSize / 880))}
                      onNudge={(dx, dy) => handleNudge("number", dx, dy)}
                      onScaleChange={(d) => handleScaleChange("number", d)}
                      onDragStart={() => setIsDragging(true)}
                      onDragEnd={() => setIsDragging(false)}
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
                      locked={lockedElements["name"] || false}
                      onActivate={() => setActiveElement("name")}
                      onMove={(dx, dy) => handleMove("name", dx / (previewSize / 880), dy / (previewSize / 880))}
                      onNudge={(dx, dy) => handleNudge("name", dx, dy)}
                      onScaleChange={(d) => handleScaleChange("name", d)}
                      onDragStart={() => setIsDragging(true)}
                      onDragEnd={() => setIsDragging(false)}
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
                      locked={lockedElements["rarity"] || false}
                      onActivate={() => setActiveElement("rarity")}
                      onMove={(dx, dy) => handleMove("rarity", dx / (previewSize / 880), dy / (previewSize / 880))}
                      onNudge={(dx, dy) => handleNudge("rarity", dx, dy)}
                      onScaleChange={(d) => handleScaleChange("rarity", d)}
                      onDragStart={() => setIsDragging(true)}
                      onDragEnd={() => setIsDragging(false)}
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
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-ttg-black/80 backdrop-blur text-white text-[10px] font-bold px-3 py-1.5 rounded-full pointer-events-none">
                  Click an element above to start positioning · Drag to move · Arrow keys to nudge · +/- to scale
                </div>
              )}
            </div>

            {/* Snap guides (visible during drag) */}
            {isDragging && activeElement && (
              <>
                {/* Center snap lines */}
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
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-ttg-yellow/40" />
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-ttg-yellow/40" />
                  <div className="absolute inset-0 rounded-full border border-ttg-yellow/20" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right sidebar: Properties */}
        {showProperties && (
          <div className="w-60 flex-shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-200px)] overflow-y-auto">
              <ElementProperties
                activeElement={activeElement}
                layout={layout}
                onLayoutChange={pushLayout}
                onNudge={handleNudge}
                onScaleChange={handleScaleChange}
                visibleElements={showElements}
                onToggleVisibility={(id) =>
                  setShowElements((p) => ({ ...p, [id]: p[id] === false ? true : false }))
                }
                lockedElements={lockedElements}
                onToggleLock={(id) =>
                  setLockedElements((p) => ({ ...p, [id]: !p[id] }))
                }
                undo={history.undo}
                redo={history.redo}
                canUndo={history.canUndo}
                canRedo={history.canRedo}
                onReset={resetLayout}
              />
            </div>
          </div>
        )}

        {/* Published tazos browser (sidebar) */}
        {showBrowser && (
          <div className="w-72 flex-shrink-0">
            <div className="mag-card p-3 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)] sticky top-24 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-ttg-black flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5" /> Published Tazos
                </h3>
                <span className="text-[9px] font-bold text-ttg-black/30">{publishedTazos.length} total</span>
              </div>

              <div className="space-y-1.5">
                {pagedTazos.map((tazo: any) => (
                  <button
                    key={tazo.id || tazo.slug}
                    onClick={() => onSelectTazo?.(tazo)}
                    className="w-full flex items-center gap-2 p-2 rounded border border-ttg-black/10 hover:border-ttg-blue/30 hover:bg-ttg-blue/5 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-ttg-black/5 border border-ttg-black/10">
                      {tazo.imageUrl ? (
                        <img
                          src={`/tazos-base/${tazo.franchiseSlug || tazo.franchise?.slug || "unknown"}/${tazo.slug}.png`}
                          alt={tazo.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = tazo.imageUrl; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-ttg-black/20" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-ttg-black truncate">{tazo.displayName || tazo.name}</p>
                      <p className="text-[8px] font-bold text-ttg-black/30 uppercase">
                        {tazo.franchise?.slug || tazo.franchiseSlug || "—"} · {tazo.rarity}
                      </p>
                    </div>
                    <span className="text-[8px] font-mono text-ttg-black/20">#{tazo.number}</span>
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-ttg-black/10">
                  <button
                    onClick={() => setBrowserPage((p) => Math.max(0, p - 1))}
                    disabled={browserPage === 0}
                    className="p-1 rounded hover:bg-ttg-black/10 disabled:opacity-20"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[9px] font-bold text-ttg-black/40">
                    {browserPage + 1}/{totalPages}
                  </span>
                  <button
                    onClick={() => setBrowserPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={browserPage >= totalPages - 1}
                    className="p-1 rounded hover:bg-ttg-black/10 disabled:opacity-20"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Creature Viewer (right sidebar) */}
        {showCreature && (
          <div className="w-72 flex-shrink-0">
            <div className="sticky top-24 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
              <CreatureViewer
                creatureUrl={currentCreatureUrl}
                franchise={franchise}
                slug={slug}
                onCreatureProcessed={(newUrl) => setCurrentCreatureUrl(newUrl)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
