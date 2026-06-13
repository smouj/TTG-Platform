// ============================================================
// TTG Public Collection Page — /collection/[userId]
// ============================================================
// SEO-optimized public collection page for sharing.
// No auth required. Shows all collected tazos with stats.
// ============================================================

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import PublicCollectionView from "./PublicCollectionView"
import { SITE_CONFIG } from "@/lib/site-config"

const API_BASE = SITE_CONFIG.canonicalUrl

type Props = { params: Promise<{ userId: string }> }

async function getCollection(userId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/collection/public/${userId}`, {
      next: { revalidate: 300 }, // ISR: revalidate every 5 min
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params
  const data = await getCollection(userId)

  if (!data) {
    return { title: "Collection Not Found — TTG" }
  }

  const { user, meta } = data
  const ogImage = meta.imageUrl

  return {
    title: meta.title,
    description: meta.description,
    robots: "index, follow",
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${SITE_CONFIG.canonicalUrl}/collection/${userId}`,
      images: [{ url: ogImage, width: 880, height: 880 }],
      siteName: SITE_CONFIG.name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [ogImage],
    },
  }
}

export default async function PublicCollectionPage({ params }: Props) {
  const { userId } = await params
  const data = await getCollection(userId)

  if (!data) {
    notFound()
  }

  return <PublicCollectionView data={data} userId={userId} />
}
