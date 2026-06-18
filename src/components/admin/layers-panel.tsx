"use client";

import { Eye, EyeOff, ChevronDown, ChevronRight, Layers } from "lucide-react";
import { useState } from "react";

export interface LayerInfo {
  id: string;
  name: string;
  category: "disc" | "creature" | "element" | "overlay";
  description: string;
  color: string;
}

export const ALL_LAYERS: LayerInfo[] = [
  { id: "bg", name: "Background", category: "disc", description: "Base frontal background texture", color: "#6366F1" },
  { id: "creature", name: "Creature Art", category: "creature", description: "AI-generated creature illustration", color: "var(--ttg-red)" },
  { id: "ring-black", name: "Black Border", category: "disc", description: "Outermost black ring (R+12 w8)", color: "var(--ttg-black)" },
  { id: "ring-dark", name: "Dark Separator", category: "disc", description: "Inner dark separator ring (R-6 w3)", color: "#374151" },
  { id: "ring-deco1", name: "Deco Ring Outer", category: "disc", description: "Decorative white ring (R-16 w1)", color: "#E5E7EB" },
  { id: "ring-deco2", name: "Deco Ring Mid", category: "disc", description: "Decorative colored ring (R-26 w1)", color: "var(--ttg-yellow)" },
  { id: "ring-deco3", name: "Deco Ring Inner", category: "disc", description: "Decorative white ring (R-36 w1)", color: "#E5E7EB" },
  { id: "ring-dots", name: "Dots Ring", category: "disc", description: "Dotted ring border (classic tazo style)", color: "var(--ttg-warning)" },
  { id: "ring-inner", name: "Inner Border", category: "disc", description: "Thin inner ring (R-46 w1)", color: "#D1D5DB" },
  { id: "collection", name: "Collection Label", category: "element", description: "Top text label (e.g. 'Dracobell')", color: "var(--ttg-success)" },
  { id: "badge", name: "Combat Badge", category: "element", description: "Type badge with icon", color: "var(--ttg-purple)" },
  { id: "name-overlay", name: "Name Overlay", category: "overlay", description: "Large creature name on disc", color: "#EC4899" },
  { id: "number", name: "Number Badge", category: "element", description: "Tazo number (e.g. Nº 001)", color: "var(--ttg-rarity-rare)" },
  { id: "rarity-stars", name: "Rarity Stars", category: "element", description: "Star rating by rarity tier", color: "var(--ttg-yellow)" },
  { id: "legendary-burst", name: "Legendary Burst", category: "overlay", description: "Radiating line burst (legendary only)", color: "var(--ttg-warning)" },
  { id: "inner-shadow", name: "Inner Shadow", category: "overlay", description: "Radial shadow overlay for depth", color: "#6B7280" },
  { id: "shine", name: "Center Shine", category: "overlay", description: "Glossy highlight effect", color: "#94A3B8" },
];

interface LayersPanelProps {
  visibleLayers: Record<string, boolean>;
  onToggleLayer: (layerId: string) => void;
  onToggleAll: (visible: boolean) => void;
}

export default function LayersPanel({ visibleLayers, onToggleLayer, onToggleAll }: LayersPanelProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const categories = ["disc", "creature", "element", "overlay"] as const;
  const catNames: Record<string, string> = {
    disc: "Disc Structure",
    creature: "Creature",
    element: "Elements",
    overlay: "Effects & Overlays",
  };
  const catColors: Record<string, string> = {
    disc: "#6366F1",
    creature: "var(--ttg-red)",
    element: "var(--ttg-success)",
    overlay: "var(--ttg-warning)",
  };

  const allVisible = Object.values(visibleLayers).every(Boolean);
  const visibleCount = Object.values(visibleLayers).filter(Boolean).length;

  return (
    <div className="mag-card p-3 border-3 border-ttg-black shadow-[4px_4px_0px_var(--ttg-black)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-ttg-black flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" /> Layers
        </h3>
        <div className="flex items-center gap-1">
          <span className="text-[8px] font-bold text-ttg-black/30">{visibleCount}/{ALL_LAYERS.length}</span>
          <button
            onClick={() => onToggleAll(!allVisible)}
            className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-ttg-black/5 hover:bg-ttg-black/10 text-ttg-black/50"
          >
            {allVisible ? "Hide all" : "Show all"}
          </button>
        </div>
      </div>

      <div className="space-y-0.5">
        {categories.map((cat) => {
          const catLayers = ALL_LAYERS.filter((l) => l.category === cat);
          const isCollapsed = collapsed[cat] || false;

          return (
            <div key={cat}>
              {/* Category header */}
              <button
                onClick={() => setCollapsed((p) => ({ ...p, [cat]: !isCollapsed }))}
                className="w-full flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-ttg-black/5 transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3 text-ttg-black/20" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-ttg-black/20" />
                )}
                <span className="text-[8px] font-black uppercase tracking-wider text-ttg-black/40">
                  {catNames[cat]}
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: catColors[cat] }}
                />
              </button>

              {!isCollapsed && (
                <div className="ml-2 space-y-0">
                  {catLayers.map((layer) => {
                    const visible = visibleLayers[layer.id] !== false; // default true
                    return (
                      <button
                        key={layer.id}
                        onClick={() => onToggleLayer(layer.id)}
                        className={`w-full flex items-center gap-1.5 py-1 px-1.5 rounded text-left transition-all group
                          ${visible ? "hover:bg-ttg-black/5" : "opacity-40 hover:opacity-60"}`}
                      >
                        {visible ? (
                          <Eye className="w-3 h-3 flex-shrink-0 text-ttg-success" />
                        ) : (
                          <EyeOff className="w-3 h-3 flex-shrink-0 text-ttg-black/20" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-bold text-ttg-black truncate leading-tight">
                            {layer.name}
                          </p>
                          <p className="text-[7px] font-medium text-ttg-black/25 truncate leading-tight">
                            {layer.description}
                          </p>
                        </div>
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-50"
                          style={{ backgroundColor: layer.color }}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
