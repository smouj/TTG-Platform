import type { MetadataRoute } from "next"
import { SITE_CONFIG } from "@/lib/site-config"
import { getAllWikiEntitySlugs } from "@/lib/wiki-data"

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
    { path: "?page=wiki", priority: 0.85, changeFreq: "weekly" as const },
    { path: "?page=privacy", priority: 0.3, changeFreq: "yearly" as const },
    { path: "?page=terms", priority: 0.3, changeFreq: "yearly" as const },
    { path: "?page=cookies", priority: 0.3, changeFreq: "yearly" as const },
    { path: "?page=contact", priority: 0.5, changeFreq: "monthly" as const },
    { path: "?page=refund-policy", priority: 0.3, changeFreq: "yearly" as const },
    { path: "?page=disclaimer", priority: 0.3, changeFreq: "yearly" as const },
  ]

  const entries: MetadataRoute.Sitemap = staticPages.map(({ path, priority, changeFreq }) => ({
    url: path ? `${baseUrl}/${path}` : baseUrl,
    lastModified,
    changeFrequency: changeFreq,
    priority,
  }))

  // NOTE: /collections/[slug] series pages currently redirect to /?page=collections.
  // Once dedicated series pages exist, re-add them here with db.franchise query.

    // ── Dynamic: individual tazo pages (351 wiki entities) ──
  try {
    const wikiSlugs = getAllWikiEntitySlugs()
    for (const slug of wikiSlugs.slice(0, 500)) {
      entries.push({
        url: `${baseUrl}/tazos/${slug}`,
        lastModified,
        changeFrequency: "monthly",
        priority: 0.65,
      })
    }
  } catch {
    // Site will still work without dynamic tazo pages
  }

  return entries
}
