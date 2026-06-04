# 🎴 THEME.md — Trading Tazos Game Design System

> **Canonical style guide for the 90s Nintendo Power / Minimon Magazine aesthetic.**
> Every new page, component, panel, or visual element MUST follow this document.
> When in doubt, refer here. Do not deviate.

---

## 1. COLOR PALETTE

### Primary Magazine Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--mag-yellow` | `#FFCC00` | Mastheads, badges, highlights, CTAs |
| `--mag-red` | `#E3350D` | Urgency, footers, sale badges, errors |
| `--mag-blue` | `#3B4CCA` | Secondary CTAs, links, accents |
| `--mag-black` | `#1a1a1a` | Borders, text, shadows |
| `--mag-cream` | `#fffbe6` | Page background |
| `--mag-white` | `#fffef0` | Card backgrounds, inputs |
| `--mag-orange` | `#FF6B00` | Dracobell franchise, warnings |
| `--mag-cyan` | `#00A1E9` | Cybermon franchise |
| `--mag-green` | `#78C850` | Success, confirmations |
| `--mag-purple` | `#A855F7` | Premium, rare elements |

### Franchise Gradients
```
Minimon:  linear-gradient(135deg, #FFCB05, #FF8C00)
Cybermon:  linear-gradient(135deg, #00A1E9, #0057B7)
Dracobell: linear-gradient(135deg, #FF6B00, #CC4400)
```

### Semantic Colors
```
Success:  #22C55E (green)
Error:    #E3350D (mag-red)
Warning:  #F59E0B (amber)
Info:     #3B4CCA (mag-blue)
```

---

## 2. TYPOGRAPHY

### Font Hierarchy
| Level | Classes | Usage |
|-------|---------|-------|
| **H1 — Masthead** | `font-black text-2xl uppercase tracking-tight` | Page titles, masthead names |
| **H2 — Section** | `font-black text-lg uppercase tracking-wider` | Section headers |
| **H3 — Card Title** | `font-black text-sm uppercase tracking-wider` | Card headers, panel titles |
| **H4 — Label** | `font-black text-xs uppercase tracking-wider` | Stat labels, form labels |
| **Body** | `font-bold text-sm` | Paragraphs, descriptions |
| **Caption** | `font-bold text-[10px]` | Small print, metadata |
| **Fine Print** | `text-[9px] font-medium` | Legal, timestamps |

### Rules
- **ALWAYS `font-black`** (900 weight) for titles, labels, buttons, badges
- **ALWAYS `uppercase`** for headings, labels, buttons, badges, tabs, nav
- **ALWAYS `tracking-wider` or `tracking-widest`** for uppercase text
- **NEVER use em dashes, curly quotes** — straight ASCII only
- **Font stack**: Geist Sans (body), Geist Mono (code/stats)

---

## 3. BORDERS & SHADOWS

### Border System
```
border      border-2    border-3    border-4
1px         2px         3px         4px
(default)   cards       main cards  mastheads
```

### Shadow System (always `#1a1a1a` / `--mag-black`)
```
shadow-[2px_2px_0px_#1a1a1a]    — Subtle (small cards, tags)
shadow-[3px_3px_0px_#1a1a1a]    — Standard (buttons, cards)
shadow-[4px_4px_0px_#1a1a1a]    — Heavy (hero cards, featured)
shadow-[6px_6px_0px_#1a1a1a]    — Hero (only for special callouts)
```

### The Golden Rule
> **Every interactive element gets `.mag-btn` or equivalent border+shadow combo.**
> **No flat design. No border-radius > 4px on magazine elements.**
> **Exceptions**: modals/dialogs can have `rounded-lg`, speech bubbles `rounded-2xl`.

---

## 4. CSS UTILITY CLASSES (from globals.css)

### Backgrounds
| Class | Effect |
|-------|--------|
| `mag-bg` | Cream background + 3 radial color gradients |
| `mag-stripes` | Diagonal stripe pattern (mastheads, headers) |
| `mag-dots` | Dot pattern overlay |
| `mag-halftone` | Halftone dot pattern (vintage print feel) |

### Cards
| Class | Effect |
|-------|--------|
| `mag-card` | White bg + border-3 + shadow-[4px_4px_0px] |
| `mag-card-yellow` | Yellow bg variant |
| `mag-card-red` | Red bg + white text |
| `mag-card-blue` | Blue bg + white text |

### Buttons
| Class | Effect |
|-------|--------|
| `mag-btn` | border-3 + shadow-[3px_3px_0px] + push-down on active |

### Text Effects
| Class | Effect |
|-------|--------|
| `mag-stroke` | Yellow text + 2px black outline |
| `mag-stroke-red` | Red text + 2px black outline |
| `mag-stroke-white` | White text + 1.5px black outline |
| `mag-stroke-sm` | Current color + 1px black outline |

### Special Effects
| Class | Effect |
|-------|--------|
| `mag-lift` / `tazo-card-hover` | Lift + slight rotate on hover |
| `legendary-glow` | Golden glow pulse animation |
| `holo-border` | Iridescent shimmer border |
| `metallic-effect` | Metallic shine overlay |
| `worn-overlay` | Scratched/worn texture |
| `speech-bubble` | Comic speech bubble with tail |
| `exclusive-badge` | Rotated red "EXCLUSIVE" badge |
| `mag-zigzag` | Zigzag bottom border |
| `mag-spinner` | Magazine-style rotating spinner |

### Scrollbar
| Class | Effect |
|-------|--------|
| `custom-scrollbar` | Thin 6px scrollbar matching theme |

---

## 5. COMPONENT ANATOMY

### Page Shell (every page)
```
┌─────────────────────────────────────────┐
│ <div className="min-h-screen flex flex-col mag-bg"> │
│  ┌───────────────────────────────────────┐ │
│  │ MASTHEAD (bg color + border-b-4)      │ │
│  │  ├─ Top bar (#1a1a1a bg, white text)  │ │
│  │  └─ Title row (logo + h1 + tagline)   │ │
│  ├───────────────────────────────────────┤ │
│  │ MAIN CONTENT (max-w-* mx-auto px-4)   │ │
│  │  └─ Cards, sections, grids            │ │
│  ├───────────────────────────────────────┤ │
│  │ FOOTER (colored bg + border-t-4)      │ │
│  │  └─ Copyright, links, disclaimer      │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Magazine Card
```
┌──────────────────────────────────┐
│ <div className="mag-card p-4 md:p-6 space-y-3"> │
│  ┌─ Card Header (h3 + optional badge)  │
│  ├─ Card Body (content)                │
│  └─ Card Footer (actions, links)       │
└──────────────────────────────────┘
```

### Magazine Button
```
┌─────────────────────────────────────┐
│ <button className="mag-btn px-4 py-2 bg-[#color] text-[#color] text-xs font-black uppercase"> │
│   {icon} {label}                     │
│ </button>                            │
│ ACTIVE: translate(2px,2px), shadow→1 │
└─────────────────────────────────────┘
```

---

## 6. INTERACTIVE STATES

### Buttons
```
Default:  shadow-[3px_3px_0px_#1a1a1a], translate(0,0)
Hover:    shadow-[2px_2px_0px_#1a1a1a], translate(1px,1px)
Active:   shadow-[1px_1px_0px_#1a1a1a], translate(2px,2px)
Disabled: opacity-50, cursor-not-allowed
```

### Cards (interactive)
```
Default:  shadow-[4px_4px_0px_#1a1a1a]
Hover:    shadow-[6px_6px_0px_#1a1a1a], translateY(-4px), rotate(-1deg)
Selected: border-[#FFCC00], ring-2 ring-[#FFCC00]
```

### Links
```
Default:  underline underline-offset-2
Hover:    text color change
```

---

## 7. SPACING & LAYOUT

### Page Layout
```
Container:  max-w-7xl mx-auto px-4
Sections:   space-y-6 or space-y-8
Cards gap:  gap-4
Grid:       grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
```

### Component Padding
```
Cards:      p-4 (mobile), p-6 (desktop)
Buttons:    px-4 py-2 (small), px-6 py-3 (medium), px-8 py-4 (large)
Inputs:     px-4 py-3
Sections:   py-8
```

---

## 8. ICONS & DECORATION

### Icon Library: Lucide React ONLY
```typescript
import { BookOpen, Swords, Scan, BarChart3, ShoppingBag,
         User, LogOut, Download, ArrowLeft, ArrowRight,
         Disc3, Coins, Star, Zap, Sparkles, Gift, Loader2,
         X, Check, ExternalLink, Globe, Smartphone, Terminal,
         Monitor, Apple, Gamepad2, Mail, Lock, Package, Layers,
         Github } from 'lucide-react'
```

### Rules
- **No emojis** in UI controls, buttons, or labels (use Lucide icons instead)
- Emojis allowed ONLY in franchise showcase/catalog cards where they act as decorative category indicators
- Icon size matches context: `w-4 h-4` (inline), `w-5 h-5` (standalone), `w-6 h-6` (feature)
- Icons inside buttons get `mr-1` or `mr-1.5`

### Decorative Elements
- Color dots row (5 franchise colors) between sections
- `★` star character with `mag-stroke` for badges
- Diagonal stripes on headers
- Dot patterns on backgrounds

---

## 9. RESPONSIVE BREAKPOINTS

```
Mobile-first. Use Tailwind breakpoints:

sm:  640px   — 2-col grids, larger text
md:  768px   — sidebars, larger padding
lg:  1024px  — 3-col grids
xl:  1280px  — max container width
```

### Text Scaling
```
Mobile         → Desktop
text-sm        → text-base
text-xs        → text-sm
text-[10px]    → text-xs
text-[9px]     → text-[10px]
```

---

## 10. ANTI-PATTERNS (DO NOT USE)

| ❌ Forbidden | ✅ Instead |
|-------------|-----------|
| `rounded-xl` or `rounded-2xl` on cards | `rounded` or `rounded-lg` |
| `shadow-md`, `shadow-lg`, `shadow-xl` | `shadow-[Xpx_Xpx_0px_#1a1a1a]` |
| `font-semibold` or `font-bold` | `font-black` (900 weight) |
| `border` (1px default) | `border-2` or `border-3` |
| Flat backgrounds | `mag-bg` or `mag-stripes` or `mag-dots` |
| Emojis in UI controls/buttons/labels | Lucide icons (ok as decorative indicators on catalog cards) |
| Gradient text | `mag-stroke` variants |
| `bg-gray-*`, `bg-slate-*`, `bg-neutral-*` | `bg-zinc-*` or magazine colors |
| `text-gray-*` | `text-zinc-*` or `text-[#1a1a1a]` |
| No shadow on interactive elements | ALWAYS magazine shadow |
| More than 2 font families | Geist Sans + Geist Mono only |
| `italic` for emphasis | `font-black` or `uppercase` |
| Border radius on buttons | Sharp corners or `rounded` only |

---

## 11. CHECKLIST FOR NEW COMPONENTS

Before merging any new visual component, verify:

- [ ] Uses magazine color palette (not Tailwind grays)
- [ ] `font-black` + `uppercase` for all labels/headings
- [ ] `border-2` or `border-3` with `border-[#1a1a1a]`
- [ ] `shadow-[Xpx_Xpx_0px_#1a1a1a]` (not Tailwind shadow utilities)
- [ ] Interactive push-down effect on buttons
- [ ] No emojis (use Lucide icons)
- [ ] Responsive: works at 375px, 768px, 1280px
- [ ] Dark mode handled (if applicable)
- [ ] `.mag-card` or equivalent for card containers
- [ ] `mag-bg` on page shell

---

*Last updated: 2026-06-04. This file is the single source of truth for TTG visual design.*
