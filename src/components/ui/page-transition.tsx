// ============================================================
// Trading Tazos Game — Page Transition
// Smooth enter/exit animation for page-level content.
// Composes with Next.js layout persistence (no full page remount).
// ============================================================
"use client"
import { type ReactNode } from "react"

interface PageTransitionProps {
  children: ReactNode
  className?: string
  /** Animation variant */
  variant?: "fade-up" | "fade-in" | "slide-left" | "scale-in"
  /** Delay before animation starts (ms) */
  delay?: number
}

const variants: Record<string, React.CSSProperties> = {
  "fade-up": {
    animation: "mag-entry-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
  },
  "fade-in": {
    animation: "mag-entry-fade-in 0.4s ease-out both",
  },
  "slide-left": {
    animation: "mag-entry-slide-left 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
  },
  "scale-in": {
    animation: "mag-entry-pop 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
  },
}

export function PageTransition({ children, className = "", variant = "fade-up", delay = 0 }: PageTransitionProps) {
  const baseStyle = variants[variant] || variants["fade-up"]
  return (
    <div
      className={className}
      style={{
        ...baseStyle,
        animationDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ── Staggered children wrapper ──
export function StaggerChildren({ children, className = "", staggerMs = 60 }: { children: ReactNode; className?: string; staggerMs?: number }) {
  return (
    <div className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div
              key={i}
              style={{
                animation: `mag-entry-fade-up 0.5s ${i * staggerMs}ms cubic-bezier(0.16, 1, 0.3, 1) both`,
              }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  )
}
