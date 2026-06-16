"use client"

import { useState, useEffect } from "react"
import { Crosshair, ArrowDown, Zap, Swords, Target, Hand, ChevronRight, X } from "lucide-react"

const TUTORIAL_KEY = "ttg_battle_tutorial_done"

interface TutorialStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  position: "center" | "bottom" | "top"
  highlight?: string
}

const STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to the Arena!",
    description: "Two trainers face off. Each round you bet a tazo, then slam it into the arena to knock out your opponent's tazos. Last trainer standing wins!",
    icon: <Swords className="w-8 h-8 text-[#FFCC00]" />,
    position: "center",
  },
  {
    id: "betting",
    title: "Pick your fighter",
    description: "Click a tazo from your hand at the bottom to stake it. Higher stats mean better aim and impact. Choose wisely — you can't use a knocked-out tazo again!",
    icon: <Hand className="w-8 h-8 text-[#FFCC00]" />,
    position: "bottom",
    highlight: "battle-hand",
  },
  {
    id: "aiming",
    title: "Lock your target",
    description: "Move the reticle to aim at the opponent's stack. The closer you are to their tazos, the more damage you'll deal. Precision matters!",
    icon: <Crosshair className="w-8 h-8 text-[#FFCC00]" />,
    position: "center",
    highlight: "battle-arena",
  },
  {
    id: "charging",
    title: "Charge your slam",
    description: "Hold and release to build power. The sweet spot is around 60-80% — too weak and you'll miss, too strong and you'll lose control!",
    icon: <Zap className="w-8 h-8 text-[#FFCC00]" />,
    position: "bottom",
    highlight: "battle-hud",
  },
  {
    id: "slamming",
    title: "Release to SLAM!",
    description: "Let go to launch your tazo. Watch it fly across the arena and crash into the opponent's stack. Each impact can score points or knock out tazos!",
    icon: <ArrowDown className="w-8 h-8 text-[#FFCC00]" />,
    position: "center",
    highlight: "battle-arena",
  },
  {
    id: "scoring",
    title: "Score & Survive",
    description: "Deal damage to earn points. Knock out all opponent tazos to win the match instantly! Your score and remaining tazos are shown at the top.",
    icon: <Target className="w-8 h-8 text-[#FFCC00]" />,
    position: "top",
    highlight: "battle-hud",
  },
]

export default function BattleTutorial({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(true)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => onClose(), 300)
      return () => clearTimeout(t)
    }
  }, [visible, onClose])

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem(TUTORIAL_KEY, "1")
      setVisible(false)
    } else {
      setStep(s => s + 1)
    }
  }

  const handleSkip = () => {
    localStorage.setItem(TUTORIAL_KEY, "1")
    setVisible(false)
  }

  const posClasses = current.position === "bottom" ? "bottom-24"
    : current.position === "top" ? "top-20" : "top-1/2 -translate-y-1/2"

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={handleSkip} />

      {/* Spot glow for highlight area */}
      {current.highlight === "battle-arena" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-[65vw] h-[55vh]"
            style={{
              background: "transparent",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.65), inset 0 0 0 3px rgba(255,204,0,0.6)",
              animation: "pulse-glow 2s ease-in-out infinite",
            }}
          />
        </div>
      )}
      {current.highlight === "battle-hand" && (
        <div className="absolute bottom-0 left-0 right-0 h-44 pointer-events-none z-10"
          style={{
            background: "transparent",
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.65), inset 0 3px 0 0 rgba(255,204,0,0.6)",
            animation: "pulse-glow 2s ease-in-out infinite",
          }}
        />
      )}
      {current.highlight === "battle-hud" && (
        <div className="absolute top-0 left-0 right-0 h-28 pointer-events-none z-10"
          style={{
            background: "transparent",
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.65), inset 0 -3px 0 0 rgba(255,204,0,0.6)",
            animation: "pulse-glow 2s ease-in-out infinite",
          }}
        />
      )}

      {/* Card */}
      <div className={`relative z-10 ${posClasses} ${current.position === "center" ? "absolute" : "absolute left-1/2 -translate-x-1/2"}`}>
        <div className="rounded-3xl p-6 max-w-sm mx-auto backdrop-blur-2xl relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(10,10,10,0.92), rgba(20,20,20,0.85))",
            border: "1px solid rgba(255,204,0,0.12)",
            boxShadow: "0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,204,0,0.04), 0 0 60px rgba(255,204,0,0.06)",
          }}>
          {/* Magazine page-edge accents */}
          <div className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-[#FFCC00]/20 to-transparent" />
          <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-[#FFCC00]/20 to-transparent" />
          {/* Step dots */}
          <div className="flex gap-1.5 mb-4 justify-center">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === step ? "bg-[#FFCC00] w-4" : i < step ? "bg-[#FFCC00]/50" : "bg-white/20"
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-3">{current.icon}</div>

          {/* Content */}
          <h3 className="text-lg font-black text-[#FFCC00] text-center mb-2">{current.title}</h3>
          <p className="text-xs text-white/60 text-center leading-relaxed mb-5">{current.description}</p>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleSkip}
              className="text-[10px] font-black text-white/25 hover:text-white/50 uppercase tracking-wider transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Skip
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleNext}
                className="px-5 py-2.5 bg-[#FFCC00] text-black text-xs font-black uppercase tracking-wider hover:bg-[#FFD940] transition-colors flex items-center gap-1.5 shadow-lg shadow-[#FFCC00]/20"
              >
                {isLast ? "Let's Go!" : "Next"} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function isTutorialDone(): boolean {
  return localStorage.getItem(TUTORIAL_KEY) === "1"
}
