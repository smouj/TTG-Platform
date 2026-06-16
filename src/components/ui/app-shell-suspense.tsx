"use client"
import { Suspense } from "react"
import type { ReactNode } from "react"

export function AppShellSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#FFF9E6" }}>
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle, #1a1a1a 1px, transparent 1px)", backgroundSize: "8px 8px" }} />
        
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-[#FFCC00]/15 animate-ping" />
            <img src="/logo/logo-tg-yellow.png" alt="" className="relative w-16 h-16 animate-pulse" />
          </div>
          
          <div className="w-8 h-8 rounded-full border-[3px] border-[#1a1a1a]/10 border-t-[#FFCC00] animate-spin" />
          
          <p className="text-xs font-bold text-[#1a1a1a]/25 uppercase tracking-[0.3em] animate-pulse">
            Loading game world
          </p>
        </div>
      </div>
    }>
      {children}
    </Suspense>
  )
}
