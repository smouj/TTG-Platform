// ============================================================
// Trading Tazos Game — Battle Color Constants
//
// Three.js (and other WebGL libraries) cannot parse CSS custom
// properties like `var(--ttg-player)`. They need real hex/rgb values.
//
// This file maps every CSS token used in 3D rendering to a
// plain string that Three.js's Color constructor can parse.
// ============================================================

/** Use these constants in all meshBasicMaterial / meshStandardMaterial / light color props. */
export const BATTLE_COLORS = {
  /** Player identity — cyan-blue glow  #29ADFF */
  player:         "#29ADFF",
  /** Opponent identity — hot pink     #FF004D */
  opponent:       "#FF004D",
  /** Magazine yellow accent           #FFCC00 */
  yellow:         "#FFCC00",
  /** Success green                    #22C55E */
  success:        "#22C55E",
  /** Warning / overcharge orange      #F59E0B */
  warning:        "#F59E0B",
  /** Classic red                      #E3350D */
  red:            "#E3350D",
  /** Classic blue                     #3B4CCA */
  blue:           "#3B4CCA",
  /** Arena background (nearly black)  #0A0A0A */
  arenaBg:        "#0A0A0A",
  /** Staked tazo neutral gray          */
  neutral:        "#888888",
} as const

/** Quick-access helpers for conditional colors */
export function playerOrOpponent(isPlayer: boolean): string {
  return isPlayer ? BATTLE_COLORS.player : BATTLE_COLORS.opponent
}

export function hudPlayerColor(): string {
  return BATTLE_COLORS.red
}

export function hudOpponentColor(): string {
  return BATTLE_COLORS.blue
}
