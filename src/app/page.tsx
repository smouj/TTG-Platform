import type { Metadata } from "next"
import { Suspense } from "react"
import LauncherView from "@/components/game/launcher-view"
import { SITE_CONFIG, PAGE_META, getLanguageAlternates } from "@/lib/site-config"
import { ServerPageContent } from "@/components/game/server-page-content"

export const dynamic = "force-dynamic"
export const revalidate = 0

type Props = {
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page } = await searchParams
  const meta = page ? PAGE_META[page] : null
  const ogImage = `${SITE_CONFIG.canonicalUrl}/logo/social-preview.webp`

  if (meta) {
    return {
      title: meta.title,
      description: meta.description,
      robots: meta.noIndex ? { index: false } : { index: true, follow: true },
      alternates: getLanguageAlternates(meta.canonicalPath || ""),
      openGraph: {
        title: meta.title,
        description: meta.description,
        url: `${SITE_CONFIG.canonicalUrl}${meta.canonicalPath || ""}`,
        images: [{ url: ogImage, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        site: "@tazosgame",
        creator: "@tazosgame",
        title: meta.title,
        description: meta.description,
        images: [ogImage],
      },
    }
  }

  // Default home page
  return {
    title: `Collect, Trade & Battle ${SITE_CONFIG.totalTazos} Tazos — Free Online Game`,
    description:
      `Trading Tazos Game is a free browser-based skill game where you collect ${SITE_CONFIG.totalTazos} tazos across Minimon, Dracobell & Cybermon collections. Build a 20-tazo deck (draw 5 to start, 1 per turn) and battle in a physics-driven 3D arena.` +
      (SITE_CONFIG.disclaimer ? ` ${SITE_CONFIG.disclaimer}` : ""),
    robots: { index: true, follow: true },
    alternates: getLanguageAlternates(),
    openGraph: {
      title: "Trading Tazos Game — Aim. Throw. Flip. Capture.",
      description:
        `${SITE_CONFIG.totalTazos} tazos across 3 collections. ${SITE_CONFIG.statsCount} combat stats. 2D collection views and a skill-based 3D battle arena. Free to play.`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@tazosgame",
      creator: "@tazosgame",
      title: "Trading Tazos Game — Aim. Throw. Flip. Capture.",
      description: `${SITE_CONFIG.totalTazos} tazos, 3 collections, ${SITE_CONFIG.statsCount} combat stats, skill-based 3D battle arena. Free to play.`,
      images: [ogImage],
    },
  }
}

export default async function HomePage({ searchParams }: Props) {
  const { page } = await searchParams
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "var(--ttg-cream)" }} />}>
      <ServerPageContent page={page || ""} />
      <LauncherView initialPage={page || "home"} />
    </Suspense>
  )
}
