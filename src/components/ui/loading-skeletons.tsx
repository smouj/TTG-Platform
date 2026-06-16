"use client"
import { cn } from "@/lib/utils"

// ── Base Skeleton ──
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg bg-[#1a1a1a]/[0.04] animate-pulse",
        className
      )}
      style={{
        animation: "mag-skeleton-shimmer 1.5s ease-in-out infinite",
      }}
    />
  )
}

// ── Tazo Card Skeleton ──
export function TazoCardSkeleton() {
  return (
    <div className="border-2 border-[#1a1a1a]/10 bg-white overflow-hidden">
      {/* Image area */}
      <div className="aspect-square bg-[#fafaf5] relative flex items-center justify-center">
        <div className="w-2/3 h-2/3 rounded-full bg-[#1a1a1a]/[0.04]" />
      </div>
      {/* Text area */}
      <div className="p-2.5 space-y-1.5">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-2 w-10 rounded-full" />
          <Skeleton className="h-2 w-8 rounded-full" />
        </div>
      </div>
    </div>
  )
}

// ── Tazo Grid Skeleton ──
export function TazoGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <TazoCardSkeleton key={i} />
      ))}
    </div>
  )
}

// ── Stats Panel Skeleton ──
export function StatsPanelSkeleton() {
  return (
    <div className="space-y-4">
      {/* Top cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-2 border-[#1a1a1a]/10 bg-white p-4 space-y-3">
            <Skeleton className="h-2.5 w-1/2" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        ))}
      </div>
      {/* Chart area */}
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

// ── Shop Bag Skeleton ──
export function ShopBagSkeleton() {
  return (
    <div className="border-2 border-[#1a1a1a]/10 bg-white overflow-hidden">
      <div className="aspect-[4/5] bg-[#fafaf5] flex items-center justify-center">
        <div className="w-1/2 h-2/3 rounded-lg bg-[#1a1a1a]/[0.04]" />
      </div>
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-2.5 w-1/3" />
        <Skeleton className="h-8 w-full mt-2 rounded-full" />
      </div>
    </div>
  )
}

// ── Deck Card Skeleton ──
export function DeckCardSkeleton() {
  return (
    <div className="border-2 border-[#1a1a1a]/10 bg-white p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-2.5 w-1/3" />
        </div>
        <Skeleton className="h-3 w-16 rounded-full" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="w-8 h-8 rounded-full" />
        ))}
      </div>
    </div>
  )
}

// ── Battle History Skeleton ──
export function BattleHistorySkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border-2 border-[#1a1a1a]/10 bg-white">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-2.5 w-1/3" />
            <Skeleton className="h-2 w-1/4" />
          </div>
          <Skeleton className="h-3 w-10 rounded-full" />
        </div>
      ))}
    </div>
  )
}

// ── Page Skeleton (full page layout) ──
export function PageSkeleton({ lines = 3, hero = false }: { lines?: number; hero?: boolean }) {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      {hero && <Skeleton className="h-40 sm:h-56 w-full" />}
      <div className="space-y-3 max-w-3xl">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded-md"
            style={{
              width: `${100 - i * 15}%`,
              background: "linear-gradient(90deg, #1a1a1a08 25%, #1a1a1a10 50%, #1a1a1a08 75%)",
              backgroundSize: "200% 100%",
              animation: "mag-skeleton-shimmer 1.5s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Button Skeleton (for action areas) ──
export function ButtonSkeleton() {
  return <Skeleton className="h-10 w-full rounded-full" />
}

// ── Image Skeleton ──
export function ImageSkeleton({ aspectRatio = "1/1", className }: { aspectRatio?: string; className?: string }) {
  return (
    <div className={cn("bg-[#fafaf5] flex items-center justify-center overflow-hidden", className)} style={{ aspectRatio }}>
      <div className="w-1/3 h-1/3 rounded-full bg-[#1a1a1a]/[0.04]" />
    </div>
  )
}
