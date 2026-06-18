"use client";

import { useState } from "react";
import type { ElementKey, LayoutConfig } from "@/components/admin/tazo-visual-editor";
import {
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Eye, EyeOff, Lock, Unlock,
  SlidersHorizontal,
} from "lucide-react";

const ELEMENT_LABELS: Record<ElementKey, string> = {
  collection: "Collection Label",
  badge: "Combat Badge",
  number: "Number Badge",  
  name: "Creature Name",
  rarity: "Rarity Stars",
  creature: "Creature Art",
};

const ELEMENT_COLORS: Record<ElementKey, string> = {
  collection: "var(--ttg-cybermon)",
  badge: "var(--ttg-purple)",
  number: "var(--ttg-rarity-rare)",
  name: "var(--ttg-success)",
  rarity: "var(--ttg-yellow)",
  creature: "var(--ttg-red)",
};

interface Props {
  activeElement: ElementKey | null;
  layout: LayoutConfig;
  onLayoutChange: (layout: LayoutConfig) => void;
  onNudge: (id: ElementKey, dx: number, dy: number) => void;
  onScaleChange: (id: ElementKey, delta: number) => void;
  visibleElements: Record<string, boolean>;
  onToggleVisibility: (id: string) => void;
  lockedElements: Record<string, boolean>;
  onToggleLock: (id: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onReset: () => void;
}

export default function ElementProperties({
  activeElement,
  layout,
  onLayoutChange,
  onNudge,
  onScaleChange: _onScaleChange,
  visibleElements,
  onToggleVisibility,
  lockedElements,
  onToggleLock,
  undo,
  redo,
  canUndo,
  canRedo,
  onReset,
}: Props) {
  const [showAll, setShowAll] = useState(true);
  const allKeys: ElementKey[] = ["collection", "badge", "number", "name", "rarity", "creature"];

  const handleSetX = (id: ElementKey, value: number) => {
    onLayoutChange({
      ...layout,
      [id]: { ...layout[id], x: value },
    });
  };

  const handleSetY = (id: ElementKey, value: number) => {
    onLayoutChange({
      ...layout,
      [id]: { ...layout[id], y: value },
    });
  };

  const handleSetScale = (id: ElementKey, value: number) => {
    onLayoutChange({
      ...layout,
      [id]: { ...layout[id], scale: Math.max(0.1, Math.min(5, value)) },
    });
  };

  return (
    <div className="space-y-1.5">
      {/* History + Global */}
      <div className="mag-card p-3 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)]">
        <div className="flex items-center gap-1.5 mb-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded bg-ttg-black/5 hover:bg-ttg-black/10 text-ttg-black/50 disabled:opacity-20 transition-all"
            title="Undo (Ctrl+Z)"
          >
            ↩ Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded bg-ttg-black/5 hover:bg-ttg-black/10 text-ttg-black/50 disabled:opacity-20 transition-all"
            title="Redo (Ctrl+Shift+Z)"
          >
            ↪ Redo
          </button>
          <button
            onClick={onReset}
            className="text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded bg-ttg-red/5 hover:bg-ttg-red/10 text-ttg-red/50 ml-auto transition-all"
          >
            ↺ Reset All
          </button>
        </div>
      </div>

      {/* Element list */}
      <div className="mag-card p-3 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-ttg-black flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Properties
          </h3>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[7px] font-black uppercase text-ttg-black/30 hover:text-ttg-black/60"
          >
            {showAll ? "collapse" : "expand all"}
          </button>
        </div>

        <div className="space-y-1">
          {allKeys.map((key) => {
            const el = layout[key];
            const isActive = activeElement === key;
            const isVisible = visibleElements[key] !== false;
            const isLocked = lockedElements[key] === true;
            const showDetails = showAll || isActive;

            return (
              <div
                key={key}
                className={`rounded border transition-all ${
                  isActive
                    ? "border-ttg-yellow bg-ttg-yellow/5"
                    : "border-transparent bg-ttg-black/3 hover:bg-ttg-black/5"
                }`}
              >
                {/* Header row */}
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: ELEMENT_COLORS[key] }}
                  />
                  <span className="text-[9px] font-bold text-ttg-black flex-1 truncate">
                    {ELEMENT_LABELS[key]}
                  </span>

                  <button
                    onClick={() => onToggleVisibility(key)}
                    className={`p-0.5 rounded transition-all ${
                      isVisible
                        ? "text-ttg-success hover:bg-ttg-success/10"
                        : "text-ttg-black/15 hover:bg-ttg-black/5"
                    }`}
                    title={isVisible ? "Hide" : "Show"}
                  >
                    {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>

                  <button
                    onClick={() => onToggleLock(key)}
                    className={`p-0.5 rounded transition-all ${
                      isLocked
                        ? "text-ttg-red hover:bg-ttg-red/10"
                        : "text-ttg-black/15 hover:bg-ttg-black/5"
                    }`}
                    title={isLocked ? "Unlock" : "Lock"}
                  >
                    {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>

                  {/* Quick nudge */}
                  <div className="flex gap-0">
                    <button
                      onClick={() => onNudge(key, -5, 0)}
                      className="p-0.5 text-ttg-black/20 hover:text-ttg-black/50 rounded"
                    >
                      <ArrowLeft className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() => onNudge(key, 0, -5)}
                      className="p-0.5 text-ttg-black/20 hover:text-ttg-black/50 rounded"
                    >
                      <ArrowUp className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() => onNudge(key, 0, 5)}
                      className="p-0.5 text-ttg-black/20 hover:text-ttg-black/50 rounded"
                    >
                      <ArrowDown className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() => onNudge(key, 5, 0)}
                      className="p-0.5 text-ttg-black/20 hover:text-ttg-black/50 rounded"
                    >
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {/* Detail sliders */}
                {showDetails && !isLocked && (
                  <div className="px-2 pb-2 space-y-1 border-t border-ttg-black/5 pt-1.5">
                    {/* X position */}
                    <div className="flex items-center gap-2">
                      <span className="text-[7px] font-bold text-ttg-black/25 w-3">X</span>
                      <input
                        type="range"
                        min="-435"
                        max="435"
                        step="1"
                        value={el.x}
                        onChange={(e) => handleSetX(key, Number(e.target.value))}
                        className="flex-1 h-1 appearance-none rounded cursor-pointer"
                        style={{ accentColor: ELEMENT_COLORS[key] }}
                      />
                      <input
                        type="number"
                        value={el.x}
                        onChange={(e) => handleSetX(key, Number(e.target.value))}
                        className="w-12 text-[8px] font-mono font-bold text-ttg-black/60 bg-transparent border border-ttg-black/10 rounded px-1 py-0.5 text-center"
                        step="1"
                      />
                    </div>

                    {/* Y position */}
                    <div className="flex items-center gap-2">
                      <span className="text-[7px] font-bold text-ttg-black/25 w-3">Y</span>
                      <input
                        type="range"
                        min="-435"
                        max="435"
                        step="1"
                        value={el.y}
                        onChange={(e) => handleSetY(key, Number(e.target.value))}
                        className="flex-1 h-1 appearance-none rounded cursor-pointer"
                        style={{ accentColor: ELEMENT_COLORS[key] }}
                      />
                      <input
                        type="number"
                        value={el.y}
                        onChange={(e) => handleSetY(key, Number(e.target.value))}
                        className="w-12 text-[8px] font-mono font-bold text-ttg-black/60 bg-transparent border border-ttg-black/10 rounded px-1 py-0.5 text-center"
                        step="1"
                      />
                    </div>

                    {/* Scale */}
                    <div className="flex items-center gap-2">
                      <span className="text-[7px] font-bold text-ttg-black/25 w-3">S</span>
                      <input
                        type="range"
                        min="0.1"
                        max="3"
                        step="0.05"
                        value={el.scale}
                        onChange={(e) => handleSetScale(key, Number(e.target.value))}
                        className="flex-1 h-1 appearance-none rounded cursor-pointer"
                        style={{ accentColor: ELEMENT_COLORS[key] }}
                      />
                      <input
                        type="number"
                        value={el.scale}
                        onChange={(e) => handleSetScale(key, Number(e.target.value))}
                        className="w-14 text-[8px] font-mono font-bold text-ttg-black/60 bg-transparent border border-ttg-black/10 rounded px-1 py-0.5 text-center"
                        step="0.05"
                        min="0.1"
                        max="5"
                      />
                    </div>
                  </div>
                )}

                {showDetails && isLocked && (
                  <div className="px-2 pb-2 text-[7px] font-bold text-ttg-black/15 italic">
                    🔒 Locked — unlock to edit
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick position presets */}
        <div className="mt-2 pt-2 border-t border-ttg-black/10">
          <p className="text-[7px] font-black uppercase text-ttg-black/20 mb-1">Center</p>
          <div className="flex gap-1 flex-wrap">
            {[
              { label: "C", x: 0, y: 0 },
              { label: "↑", x: 0, y: -280 },
              { label: "↓", x: 0, y: 280 },
              { label: "←", x: -280, y: 0 },
              { label: "→", x: 280, y: 0 },
              { label: "↖", x: -200, y: -200 },
              { label: "↗", x: 200, y: -200 },
              { label: "↙", x: -200, y: 200 },
              { label: "↘", x: 200, y: 200 },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  if (activeElement && !lockedElements[activeElement]) {
                    onLayoutChange({
                      ...layout,
                      [activeElement]: { ...layout[activeElement], x: p.x, y: p.y },
                    });
                  }
                }}
                disabled={!activeElement || lockedElements[activeElement || ""]}
                className={`text-[8px] font-black px-1.5 py-0.5 rounded border transition-all
                  ${activeElement && !lockedElements[activeElement]
                    ? "border-ttg-black/10 hover:bg-ttg-black/10 text-ttg-black/40 hover:text-ttg-black/70"
                    : "border-transparent text-ttg-black/10 cursor-not-allowed"
                  }`}
                title={`Snap to ${p.label} (${p.x}, ${p.y})`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
