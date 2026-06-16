// ============================================================
// Trading Tazos Game — useSFX Hook
// Thin wrapper over the SFX engine for React components.
// Handles AudioContext unlock on first user gesture.
// ============================================================
"use client"
import { useEffect, useCallback, useRef } from "react"
import { createSFX, sfxEnsureUnlocked } from "@/lib/audio/sfx-engine"

export function useSFX() {
  const sfx = useRef(createSFX())

  useEffect(() => {
    sfxEnsureUnlocked()
  }, [])

  const playClick = useCallback(() => sfx.current.play("click", { volume: 0.25 }), [])
  const playNav = useCallback(() => sfx.current.play("nav", { volume: 0.15 }), [])
  const playHover = useCallback(() => sfx.current.play("hover", { volume: 0.5 }), [])
  const playCoin = useCallback(() => sfx.current.play("coin", { volume: 0.3 }), [])
  const playPageTurn = useCallback(() => sfx.current.play("page_turn", { volume: 0.2 }), [])
  const playDeckShuffle = useCallback(() => sfx.current.play("deck_shuffle", { volume: 0.25 }), [])
  const playTazoCollect = useCallback(() => sfx.current.play("tazo_collect", { volume: 0.3 }), [])
  const playShopPurchase = useCallback(() => sfx.current.play("shop_purchase", { volume: 0.3 }), [])
  const playLevelUp = useCallback(() => sfx.current.play("level_up", { volume: 0.3 }), [])
  const playError = useCallback(() => sfx.current.play("error", { volume: 0.3 }), [])
  const playUnlock = useCallback(() => sfx.current.play("unlock", { volume: 0.3 }), [])

  const isMuted = useCallback(() => sfx.current.isMuted(), [])
  const toggleMute = useCallback(() => sfx.current.toggle(), [])

  return {
    playClick,
    playNav,
    playHover,
    playCoin,
    playPageTurn,
    playDeckShuffle,
    playTazoCollect,
    playShopPurchase,
    playLevelUp,
    playError,
    playUnlock,
    isMuted,
    toggleMute,
  }
}
