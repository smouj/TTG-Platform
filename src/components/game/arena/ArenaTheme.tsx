// ============================================================
// Trading Tazos Game — Arena Theme Colors
// Shared theme config for all arena sub-components.
// ============================================================

export const THEME_COLORS: Record<string, {
  floor: string[]
  accent: string
  pillar: string
  bgGradient: string
  ringGlow: string
}> = {
  default: {
    floor: ["#fffaf0", "#f5ead0", "#e0d4b8", "#c8b898", "#a09070"],
    accent: "#FFCC00",
    pillar: "#b8a888",
    bgGradient: "radial-gradient(ellipse at center, #2a2a2a 0%, #1a1a1a 55%, #0a0a0a 100%)",
    ringGlow: "#FFCC00",
  },
  lava: {
    floor: ["#3a1000", "#5a1a00", "#6a2505", "#4a1805", "#2a0a00"],
    accent: "#FF4400",
    pillar: "#8B0000",
    bgGradient: "radial-gradient(ellipse at center, #3a1000 0%, #1a0500 55%, #0a0000 100%)",
    ringGlow: "#FF6600",
  },
  crystal: {
    floor: ["#e0f0ff", "#c8e0f8", "#a0d0f0", "#80b8e0", "#6090c0"],
    accent: "#00CCFF",
    pillar: "#4488CC",
    bgGradient: "radial-gradient(ellipse at center, #0a1a30 0%, #051020 55%, #020810 100%)",
    ringGlow: "#00DDFF",
  },
  "zero-g": {
    floor: ["#f0f0ff", "#d8d0f0", "#c0b8e0", "#a098c8", "#7068a0"],
    accent: "#9944FF",
    pillar: "#6655AA",
    bgGradient: "radial-gradient(ellipse at center, #1a0a2e 0%, #0d0520 55%, #050210 100%)",
    ringGlow: "#AA55FF",
  },
}
