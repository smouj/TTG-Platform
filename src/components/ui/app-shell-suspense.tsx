"use client"
import Image from "next/image"
import { Suspense } from "react"
import type { ReactNode } from "react"

export function AppShellSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--ttg-cream)" }}>
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle, var(--ttg-black) 1px, transparent 1px)", backgroundSize: "8px 8px" }} />
        
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-ttg-yellow/15 animate-ping" />
            <Image src="/logo/logo-tg-yellow.png" alt="" width={64} height={64} className="relative animate-pulse" priority />
          </div>
          
          <div className="w-8 h-8 rounded-full border-[3px] border-ttg-black/10 border-t-[#FFCC00] animate-spin" />
          
          <p className="text-xs font-bold text-ttg-black/25 uppercase tracking-[0.3em] animate-pulse">
            Loading game world
          </p>
        </div>
      </div>
    }>
      {children}
    </Suspense>
  )
}
