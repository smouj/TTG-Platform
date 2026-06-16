import type { MetadataRoute } from "next"
import { SITE_CONFIG } from "@/lib/site-config"
import { db } from "@/lib/db"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_CONFIG.canonicalUrl
  const lastModified = new Date()

  // ── Static pages ──
  const staticPages = [
    { path: "", priority: 1.0, changeFreq: "weekly" as const },
    { path: "?page=how-to-play", priority: 0.9, changeFreq: "monthly" as const },
    { path: "?page=collections", priority: 0.9, changeFreq: "weekly" as const },
    { path: "?page=tazos", priority: 0.9, changeFreq: "weekly" as const },
    { path: "?page=leaderboard", priority: 0.8, changeFreq: "daily" as const },
    { path: "?page=download", priority: 0.8, changeFreq: "monthly" as const },
    { path: "?page=faq", priority: 0.7, changeFreq: "monthly" as const },
    { path: "?page=shop", priority: 0.8, changeFreq: "weekly" as const },
    { path: "battle/practice", priority: 0.9, changeFreq: "weekly" as const },
    { path: "?page=privacy", priority: 0.4, changeFreq: "yearly" as const },
    { path: "?page=terms", priority: 0.4, changeFreq: "yearly" as const },
    { path: "?page=cookies", priority: 0.4, changeFreq: "yearly" as const },
    { path: "?page=contact", priority: 0.5, changeFreq: "monthly" as const },
    { path: "?page=refund-policy", priority: 0.4, changeFreq: "yearly" as const },
    { path: "?page=disclaimer", priority: 0.4, changeFreq: "yearly" as const },
    { path: "login", priority: 0.6, changeFreq: "monthly" as const },
    { path: "register", priority: 0.6, changeFreq: "monthly" as const },
  ]

  const entries: MetadataRoute.Sitemap = staticPages.map(({ path, priority, changeFreq }) => ({
    url: path ? `${baseUrl}/${path}` : baseUrl,
    lastModified,
    changeFrequency: changeFreq,
    priority,
  }))

  // NOTE: /collections/[slug] series pages currently redirect to /?page=collections.
  // Once dedicated series pages exist, re-add them here with db.franchise query.

  // ── Dynamic: individual tazo pages (up to 150) ──
  try {
    const tazos = await db.tazo.findMany({
      where: {},
      select: { slug: true },
      take: 200,
    })
    for (const t of tazos) {
      entries.push({
        url: `${baseUrl}/tazos/${t.slug}`,
        lastModified,
        changeFrequency: "monthly",
        priority: 0.65,
      })
    }
  } catch {
    // Sitemap still valid without dynamic entries
  }

  return entries
}
