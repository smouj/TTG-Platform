// ============================================================
// Trading Tazos Game — Tazo Back Editor
// Drag-and-drop editor for the BACK side of tazos.
// Reuses the same DraggableElement / coordinate system as front.
//
// Back elements:
//   - centerIcon: large franchise logo/emblem at center
//   - topLabel: "OFFICIAL TAZO" or edition text
//   - bottomLabel: franchise name or copyright
//   - cornerBadge: limited edition marker, rarity
//   - numberBadge: optional serial number
// ============================================================
"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import {
  Disc, Star, Crown, Flame, Zap, Cpu, Save,
  Undo2, Redo2, Lock, Unlock, Eye, EyeOff,
  Plus, Minus, RotateCcw, Copy, Check, HelpCircle,
} from "lucide-react"

// ── Types ──
interface BackLayoutElement {
  x: number
  y: number
  scale: number
  visible?: boolean
  opacity?: number
  rotation?: number
  color?: string
  customText?: string
}

interface BackLayoutConfig {
  centerIcon: BackLayoutElement
  topLabel: BackLayoutElement
  bottomLabel: BackLayoutElement
  cornerBadge: BackLayoutElement
  numberBadge: BackLayoutElement
}

type BackElementKey = keyof BackLayoutConfig

const BACK_ELEMENT_LABELS: Record<BackElementKey, string> = {
  centerIcon: "Center Icon",
  topLabel: "Top Label",
  bottomLabel: "Bottom Label",
  cornerBadge: "Corner Badge",
  numberBadge: "Number Badge",
}

const BACK_ELEMENT_COLORS: Record<BackElementKey, string> = {
  centerIcon: "#FFCC00",
  topLabel: "#E3350D",
  bottomLabel: "#3B4CCA",
  cornerBadge: "#A855F7",
  numberBadge: "#22C55E",
}

const DEFAULT_BACK_LAYOUT: BackLayoutConfig = {
  centerIcon: { x: 0, y: 0, scale: 1.0 },
  topLabel: { x: 0, y: -320, scale: 1.0 },
  bottomLabel: { x: 0, y: 320, scale: 1.0 },
  cornerBadge: { x: 280, y: -280, scale: 1.0 },
  numberBadge: { x: -280, y: 280, scale: 1.0 },
}

// ── Undo/Redo History (same as front editor) ──
interface HistoryState {
  present: BackLayoutConfig
  past: BackLayoutConfig[]
  future: BackLayoutConfig[]
  canUndo: boolean
  canRedo: boolean
}

function useHistory(initial: BackLayoutConfig) {
  const [state, setState] = useState<HistoryState>({
    present: initial, past: [], future: [], canUndo: false, canRedo: false,
  })

  const push = useCallback((next: BackLayoutConfig) => {
    setState(s => ({
      present: next,
      past: [...s.past.slice(-49), s.present],
      future: [],
      canUndo: true,
      canRedo: false,
    }))
  }, [])

  const undo = useCallback(() => {
    setState(s => {
      if (s.past.length === 0) return s
      const prev = s.past[s.past.length - 1]
      return {
        present: prev,
        past: s.past.slice(0, -1),
        future: [s.present, ...s.future],
        canUndo: s.past.length > 1,
        canRedo: true,
      }
    })
  }, [])

  const redo = useCallback(() => {
    setState(s => {
      if (s.future.length === 0) return s
      const next = s.future[0]
      return {
        present: next,
        past: [...s.past, s.present],
        future: s.future.slice(1),
        canUndo: true,
        canRedo: s.future.length > 1,
      }
    })
  }, [])

  return { ...state, push, undo, redo }
}

// ── DraggableElement (simplified from front) ──
function snapValue(val: number, grid: number): number {
  return Math.round(val / grid) * grid
}

function DraggableBackElement({
  id, x, y, scale = 1, color, label, active, locked,
  onActivate, onMove, onNudge, onScaleChange,
  onDragStart, onDragEnd, children,
}: {
  id: BackElementKey
  x: number; y: number; scale?: number; color: string; label: string
  active: boolean; locked: boolean
  onActivate: () => void
  onMove: (dx: number, dy: number) => void
  onNudge: (dx: number, dy: number) => void
  onScaleChange: (delta: number) => void
  onDragStart: () => void
  onDragEnd: () => void
  children: React.ReactNode
}) {
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, origX: x, origY: y })
  const [shiftHeld, setShiftHeld] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === "Shift") setShiftHeld(true) }
    const up = (e: KeyboardEvent) => { if (e.key === "Shift") setShiftHeld(false) }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up) }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (locked) return
    e.stopPropagation()
    onActivate()
    setDragging(true)
    onDragStart()
    dragStart.current = { x: e.clientX, y: e.clientY, origX: x, origY: y }
  }, [locked, onActivate, onDragStart, x, y])

  useEffect(() => {
    if (!dragging) return
    const move = (e: MouseEvent) => {
      let dx = e.clientX - dragStart.current.x
      let dy = e.clientY - dragStart.current.y
      if (shiftHeld) {
        dx = snapValue(dx, 10)
        dy = snapValue(dy, 10)
      }
      onMove(dx, dy)
      dragStart.current = { x: e.clientX, y: e.clientY, origX: x + dx, origY: y + dy }
    }
    const up = () => { setDragging(false); onDragEnd() }
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up) }
  }, [dragging, onMove, onDragEnd, shiftHeld])

  useEffect(() => {
    if (!active) return
    const key = (e: KeyboardEvent) => {
      const step = shiftHeld ? 10 : 1
      switch (e.key) {
        case "ArrowUp": e.preventDefault(); onNudge(0, -step); break
        case "ArrowDown": e.preventDefault(); onNudge(0, step); break
        case "ArrowLeft": e.preventDefault(); onNudge(-step, 0); break
        case "ArrowRight": e.preventDefault(); onNudge(step, 0); break
        case "=": case "+": e.preventDefault(); onScaleChange(0.1); break
        case "-": case "_": e.preventDefault(); onScaleChange(-0.1); break
      }
    }
    window.addEventListener("keydown", key)
    return () => window.removeEventListener("keydown", key)
  }, [active, onNudge, onScaleChange, shiftHeld])

  const boxSize = 16 * scale

  return (
    <div
      className={`absolute ${locked ? "cursor-not-allowed" : "cursor-grab"} ${active ? "z-30" : "z-10"}`}
      style={{
        left: x, top: y,
        width: boxSize, height: boxSize,
        transform: "translate(-50%, -50%)",
        userSelect: "none",
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Hit area */}
      <div
        className="w-full h-full rounded-full flex items-center justify-center"
        style={{
          border: active ? `2px solid ${color}` : `1px solid ${color}60`,
          background: active ? `${color}20` : "transparent",
        }}
      />
      {/* Label badge */}
      <div
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded text-[8px] font-black pointer-events-none"
        style={{
          top: boxSize + 2,
          background: color,
          color: "#fff",
          opacity: active ? 1 : 0.5,
        }}
      >
        {locked && <Lock className="w-2.5 h-2.5 inline mr-0.5" />}
        {label}
      </div>
      {/* Children (the actual element) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div style={{ transform: `scale(${scale})`, transformOrigin: "center" }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Back Element Renderers ──

function CenterIconElement({ franchise, edition }: { franchise: string; edition?: string }) {
  const icons: Record<string, string> = {
    minimon: "⭐", cybermon: "💾", dracobell: "🐉",
  }
  const isSpecial = edition === "limited" || edition === "legendary"
  return (
    <div
      className="flex items-center justify-center rounded-full shadow-xl border-[3px] border-[#1a1a1a]"
      style={{
        width: 64, height: 64,
        background: isSpecial
          ? "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)"
          : "linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.7)",
      }}
    >
      <span className="text-3xl" style={{ filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.3))" }}>
        {icons[franchise] || "🔄"}
      </span>
    </div>
  )
}

function BackLabelElement({ text, fontSize = 12 }: { text: string; fontSize?: number }) {
  return (
    <div
      className="font-black uppercase tracking-[0.1em] whitespace-nowrap px-3 py-1.5 rounded-md shadow-lg"
      style={{
        fontSize: `${fontSize}px`,
        background: "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)",
        color: "#1a1a1a",
        border: "2.5px solid #1a1a1a",
        boxShadow: "0 2px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
    >
      {text}
    </div>
  )
}

function CornerBadgeElement({ text, color = "#A855F7" }: { text: string; color?: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-full shadow-lg border-[2.5px] border-[#1a1a1a] font-black text-[10px] w-10 h-10"
      style={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        color: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
      }}
    >
      {text}
    </div>
  )
}

function BackNumberBadge({ number }: { number: string }) {
  return (
    <div
      className="font-black text-[10px] px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap"
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)",
        color: "#1a1a1a",
        border: "2px solid #1a1a1a",
        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
      }}
    >
      #{number}
    </div>
  )
}

// ── Franchise info for back text ──
const FRANCHISE_INFO: Record<string, { name: string; series: string; year: string }> = {
  minimon: { name: "MINIMON", series: "SERIES 1", year: "© 2000 MATUTANO" },
  cybermon: { name: "CYBERMON", series: "SERIES 1", year: "© 2000 MATUTANO" },
  dracobell: { name: "DRACOBELL", series: "SERIES 1", year: "© 2000 MATUTANO" },
}

// ── Props ──
interface TazoBackEditorProps {
  backImageUrl?: string
  franchise: string
  number: string
  layout: BackLayoutConfig
  onLayoutChange: (layout: BackLayoutConfig) => void
  onSave?: () => void
}

// ── Main Component ──
export default function TazoBackEditor({
  backImageUrl,
  franchise = "minimon",
  number = "1",
  layout: externalLayout,
  onLayoutChange,
  onSave,
}: TazoBackEditorProps) {
  const history = useHistory(externalLayout || DEFAULT_BACK_LAYOUT)
  const layout = history.present

  const [activeElement, setActiveElement] = useState<BackElementKey | null>(null)
  const [lockedElements, setLockedElements] = useState<Record<string, boolean>>({})
  const [showElements, setShowElements] = useState<Record<BackElementKey, boolean>>({
    centerIcon: true, topLabel: true, bottomLabel: true,
    cornerBadge: true, numberBadge: true,
  })
  const [previewSize] = useState(440)
  const [copied, setCopied] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  const franchiseInfo = FRANCHISE_INFO[franchise] || FRANCHISE_INFO.minimon

  // Sync history push to parent
  const pushLayout = useCallback((next: BackLayoutConfig) => {
    history.push(next)
    onLayoutChange(next)
  }, [history, onLayoutChange])

  const handleMove = useCallback((id: BackElementKey, dx: number, dy: number) => {
    if (lockedElements[id]) return
    pushLayout({ ...layout, [id]: { ...layout[id], x: layout[id].x + dx, y: layout[id].y + dy } })
  }, [layout, pushLayout, lockedElements])

  const handleNudge = useCallback((id: BackElementKey, dx: number, dy: number) => {
    if (lockedElements[id]) return
    handleMove(id, dx, dy)
  }, [handleMove, lockedElements])

  const handleScaleChange = useCallback((id: BackElementKey, delta: number) => {
    if (lockedElements[id]) return
    const s = Math.max(0.1, Math.min(3, (layout[id].scale || 1) + delta))
    pushLayout({ ...layout, [id]: { ...layout[id], scale: s } })
  }, [layout, pushLayout, lockedElements])

  const toggleLock = (elem: string) => {
    setLockedElements(s => ({ ...s, [elem]: !s[elem] }))
  }

  const toggleVisibility = (elem: BackElementKey) => {
    setShowElements(s => ({ ...s, [elem]: !s[elem] }))
    const next = { ...layout[elem], visible: !showElements[elem] }
    pushLayout({ ...layout, [elem]: next })
  }

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(layout, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const elementKeys: BackElementKey[] = ["centerIcon", "topLabel", "bottomLabel", "cornerBadge", "numberBadge"]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={history.undo} disabled={!history.canUndo}
          className="mag-chip gap-1 disabled:opacity-30" title="Undo (Ctrl+Z)">
          <Undo2 className="w-3.5 h-3.5" /> Undo
        </button>
        <button onClick={history.redo} disabled={!history.canRedo}
          className="mag-chip gap-1 disabled:opacity-30" title="Redo (Ctrl+Shift+Z)">
          <Redo2 className="w-3.5 h-3.5" /> Redo
        </button>
        <div className="w-px h-5 bg-[#1a1a1a]/20" />
        <span className="text-[9px] font-black text-[#1a1a1a]/40 uppercase tracking-wider">Back Side</span>
        <div className="flex-1" />
        <button onClick={copyJSON}
          className="mag-chip gap-1">
          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy JSON"}
        </button>
        <button onClick={() => setShowShortcuts(!showShortcuts)}
          className="mag-chip gap-1" title="Keyboard shortcuts">
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
        {onSave && (
          <button onClick={onSave}
            className="mag-chip gap-1 bg-[#FFCC00] text-[#1a1a1a] border-[#1a1a1a] hover:bg-[#FFD700]">
            <Save className="w-3.5 h-3.5" /> Save Back Layout
          </button>
        )}
      </div>

      {/* Shortcuts cheatsheet */}
      {showShortcuts && (
        <div className="mag-card bg-[#1a1a1a] text-white p-4 text-[10px] font-bold space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#FFCC00]">Back Editor Shortcuts</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div><kbd className="bg-white/10 px-1 rounded">↑↓←→</kbd> Nudge selected</div>
            <div><kbd className="bg-white/10 px-1 rounded">Shift+Drag</kbd> Snap 10px</div>
            <div><kbd className="bg-white/10 px-1 rounded">+/-</kbd> Scale ±0.1</div>
            <div><kbd className="bg-white/10 px-1 rounded">Ctrl+Z</kbd> Undo</div>
            <div><kbd className="bg-white/10 px-1 rounded">Ctrl+Shift+Z</kbd> Redo</div>
            <div><kbd className="bg-white/10 px-1 rounded">Esc</kbd> Deselect</div>
          </div>
        </div>
      )}

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Left: Element list */}
        <div className="w-full lg:w-48 space-y-2">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a]/40">Back Elements</h4>
          {elementKeys.map(key => (
            <div key={key} className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveElement(key)}
                className={`flex-1 flex items-center gap-2 px-3 py-2 rounded text-[10px] font-black border transition-all
                  ${activeElement === key
                    ? "border-[#FFCC00] bg-[#FFCC00]/10 text-[#1a1a1a]"
                    : "border-[#1a1a1a]/10 hover:border-[#1a1a1a]/30 text-[#1a1a1a]/50"
                  }`}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: BACK_ELEMENT_COLORS[key] }} />
                {BACK_ELEMENT_LABELS[key]}
              </button>
              <button onClick={() => toggleVisibility(key)}
                className="p-1 rounded hover:bg-[#1a1a1a]/5"
                title={showElements[key] ? "Hide" : "Show"}>
                {showElements[key] ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-[#1a1a1a]/30" />}
              </button>
              <button onClick={() => toggleLock(key)}
                className={`p-1 rounded hover:bg-[#1a1a1a]/5 ${lockedElements[key] ? "text-[#E3350D]" : ""}`}
                title={lockedElements[key] ? "Unlock" : "Lock"}>
                {lockedElements[key] ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 text-[#1a1a1a]/30" />}
              </button>
            </div>
          ))}
        </div>

        {/* Center: Preview */}
        <div className="flex-1">
          <div className="mag-card p-4 border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
            <div
              className="flex items-center justify-center relative rounded-lg overflow-hidden"
              style={{
                minHeight: previewSize + 160,
                backgroundImage: `url('data:image/svg+xml;base64,${btoa('<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" fill="#232323"/><rect width="20" height="20" fill="#1a1a1a"/></svg>')}')`,
              }}
              onClick={() => setActiveElement(null)}
            >
              {/* Disc background */}
              <div
                className="absolute rounded-full overflow-hidden"
                style={{
                  width: previewSize,
                  height: previewSize,
                  left: "50%", top: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "#111",
                  border: "3px solid #1a1a1a",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
                }}
              >
                {/* Back base image */}
                {backImageUrl ? (
                  <div className="w-full h-full" style={{ transform: "scale(1.04)", transformOrigin: "center" }}>
                    <img src={backImageUrl} alt="Back" className="w-full h-full" style={{ objectFit: "cover" }} />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[80px] font-black text-white/5">{franchiseInfo.name}</span>
                  </div>
                )}

                {/* Draggable back elements */}
                <div className="absolute inset-0" style={{ pointerEvents: "auto" }}>
                  {/* Center Icon */}
                  {showElements.centerIcon && (
                    <DraggableBackElement
                      id="centerIcon" x={layout.centerIcon.x * (previewSize / 880)} y={layout.centerIcon.y * (previewSize / 880)}
                      scale={layout.centerIcon.scale} color={BACK_ELEMENT_COLORS.centerIcon}
                      label="Center Icon" active={activeElement === "centerIcon"} locked={lockedElements["centerIcon"] || false}
                      onActivate={() => setActiveElement("centerIcon")}
                      onMove={(dx, dy) => handleMove("centerIcon", dx / (previewSize / 880), dy / (previewSize / 880))}
                      onNudge={(dx, dy) => handleNudge("centerIcon", dx, dy)}
                      onScaleChange={(d) => handleScaleChange("centerIcon", d)}
                      onDragStart={() => setIsDragging(true)} onDragEnd={() => setIsDragging(false)}
                    >
                      <CenterIconElement franchise={franchise} />
                    </DraggableBackElement>
                  )}

                  {/* Top Label */}
                  {showElements.topLabel && (
                    <DraggableBackElement
                      id="topLabel" x={layout.topLabel.x * (previewSize / 880)} y={layout.topLabel.y * (previewSize / 880)}
                      scale={layout.topLabel.scale} color={BACK_ELEMENT_COLORS.topLabel}
                      label="Top Label" active={activeElement === "topLabel"} locked={lockedElements["topLabel"] || false}
                      onActivate={() => setActiveElement("topLabel")}
                      onMove={(dx, dy) => handleMove("topLabel", dx / (previewSize / 880), dy / (previewSize / 880))}
                      onNudge={(dx, dy) => handleNudge("topLabel", dx, dy)}
                      onScaleChange={(d) => handleScaleChange("topLabel", d)}
                      onDragStart={() => setIsDragging(true)} onDragEnd={() => setIsDragging(false)}
                    >
                      <BackLabelElement text="OFFICIAL TAZO" fontSize={14} />
                    </DraggableBackElement>
                  )}

                  {/* Bottom Label */}
                  {showElements.bottomLabel && (
                    <DraggableBackElement
                      id="bottomLabel" x={layout.bottomLabel.x * (previewSize / 880)} y={layout.bottomLabel.y * (previewSize / 880)}
                      scale={layout.bottomLabel.scale} color={BACK_ELEMENT_COLORS.bottomLabel}
                      label="Bottom Label" active={activeElement === "bottomLabel"} locked={lockedElements["bottomLabel"] || false}
                      onActivate={() => setActiveElement("bottomLabel")}
                      onMove={(dx, dy) => handleMove("bottomLabel", dx / (previewSize / 880), dy / (previewSize / 880))}
                      onNudge={(dx, dy) => handleNudge("bottomLabel", dx, dy)}
                      onScaleChange={(d) => handleScaleChange("bottomLabel", d)}
                      onDragStart={() => setIsDragging(true)} onDragEnd={() => setIsDragging(false)}
                    >
                      <BackLabelElement text={franchiseInfo.name} fontSize={14} />
                    </DraggableBackElement>
                  )}

                  {/* Corner Badge */}
                  {showElements.cornerBadge && (
                    <DraggableBackElement
                      id="cornerBadge" x={layout.cornerBadge.x * (previewSize / 880)} y={layout.cornerBadge.y * (previewSize / 880)}
                      scale={layout.cornerBadge.scale} color={BACK_ELEMENT_COLORS.cornerBadge}
                      label="Corner Badge" active={activeElement === "cornerBadge"} locked={lockedElements["cornerBadge"] || false}
                      onActivate={() => setActiveElement("cornerBadge")}
                      onMove={(dx, dy) => handleMove("cornerBadge", dx / (previewSize / 880), dy / (previewSize / 880))}
                      onNudge={(dx, dy) => handleNudge("cornerBadge", dx, dy)}
                      onScaleChange={(d) => handleScaleChange("cornerBadge", d)}
                      onDragStart={() => setIsDragging(true)} onDragEnd={() => setIsDragging(false)}
                    >
                      <CornerBadgeElement text="LE" color="#A855F7" />
                    </DraggableBackElement>
                  )}

                  {/* Number Badge */}
                  {showElements.numberBadge && (
                    <DraggableBackElement
                      id="numberBadge" x={layout.numberBadge.x * (previewSize / 880)} y={layout.numberBadge.y * (previewSize / 880)}
                      scale={layout.numberBadge.scale} color={BACK_ELEMENT_COLORS.numberBadge}
                      label="Number Badge" active={activeElement === "numberBadge"} locked={lockedElements["numberBadge"] || false}
                      onActivate={() => setActiveElement("numberBadge")}
                      onMove={(dx, dy) => handleMove("numberBadge", dx / (previewSize / 880), dy / (previewSize / 880))}
                      onNudge={(dx, dy) => handleNudge("numberBadge", dx, dy)}
                      onScaleChange={(d) => handleScaleChange("numberBadge", d)}
                      onDragStart={() => setIsDragging(true)} onDragEnd={() => setIsDragging(false)}
                    >
                      <BackNumberBadge number={number} />
                    </DraggableBackElement>
                  )}
                </div>
              </div>

              {/* Guide crosshairs */}
              <div className="absolute pointer-events-none" style={{ left: "50%", top: "50%", width: previewSize, height: previewSize, transform: "translate(-50%, -50%)" }}>
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/5" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5" />
                <div className="absolute inset-0 rounded-full border border-white/10" />
              </div>

              {!activeElement && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1a1a1a]/80 backdrop-blur text-white text-[10px] font-bold px-3 py-1.5 rounded-full pointer-events-none">
                  Click an element to position it · Drag to move · Arrow keys to nudge
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Properties */}
        <div className="w-full lg:w-44 space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a]/40">Properties</h4>
          {activeElement && layout[activeElement] ? (
            <div className="space-y-2">
              <div className="text-[10px] font-black text-[#1a1a1a]">{BACK_ELEMENT_LABELS[activeElement]}</div>
              {(["x", "y"] as const).map(prop => (
                <div key={prop}>
                  <label className="text-[8px] font-bold text-[#1a1a1a]/40 uppercase">{prop}</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={Math.round(layout[activeElement][prop])}
                      onChange={e => {
                        const v = parseFloat(e.target.value) || 0
                        pushLayout({ ...layout, [activeElement]: { ...layout[activeElement], [prop]: v } })
                      }}
                      className="w-full text-[10px] font-bold bg-zinc-50 border border-zinc-200 rounded px-2 py-1 outline-none focus:border-[#FFCC00]"
                      step={1}
                    />
                  </div>
                </div>
              ))}
              <div>
                <label className="text-[8px] font-bold text-[#1a1a1a]/40 uppercase">Scale</label>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleScaleChange(activeElement, -0.1)} className="p-1 rounded border hover:bg-zinc-100"><Minus className="w-3 h-3" /></button>
                  <span className="text-[10px] font-black tabular-nums w-8 text-center">{(layout[activeElement].scale || 1).toFixed(1)}</span>
                  <button onClick={() => handleScaleChange(activeElement, 0.1)} className="p-1 rounded border hover:bg-zinc-100"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
              <button onClick={() => toggleLock(activeElement)}
                className={`w-full text-[10px] font-black px-2 py-1 rounded border ${lockedElements[activeElement] ? "bg-[#E3350D]/10 border-[#E3350D] text-[#E3350D]" : "border-zinc-200 text-zinc-500"}`}>
                {lockedElements[activeElement] ? <Lock className="w-3 h-3 inline mr-1" /> : <Unlock className="w-3 h-3 inline mr-1" />}
                {lockedElements[activeElement] ? "Locked" : "Lock"}
              </button>
            </div>
          ) : (
            <p className="text-[9px] text-[#1a1a1a]/30 font-bold">Select an element to edit its properties</p>
          )}
        </div>
      </div>
    </div>
  )
}
