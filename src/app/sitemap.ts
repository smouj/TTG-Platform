import type { MetadataRoute } from "next"
import { SITE_CONFIG } from "@/lib/site-config"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_CONFIG.canonicalUrl
  const lastModified = new Date()

  const staticPages = [
    { path: "", priority: 1.0, changeFreq: "weekly" as const },
    { path: "?page=how-to-play", priority: 0.9, changeFreq: "monthly" as const },
    { path: "?page=collections", priority: 0.9, changeFreq: "weekly" as const },
    { path: "?page=tazos", priority: 0.9, changeFreq: "weekly" as const },
    { path: "?page=leaderboard", priority: 0.8, changeFreq: "daily" as const },
    { path: "?page=download", priority: 0.8, changeFreq: "monthly" as const },
    { path: "?page=faq", priority: 0.7, changeFreq: "monthly" as const },
    { path: "?page=shop", priority: 0.8, changeFreq: "weekly" as const },
    { path: "?page=privacy", priority: 0.4, changeFreq: "yearly" as const },
    { path: "?page=terms", priority: 0.4, changeFreq: "yearly" as const },
    { path: "?page=cookies", priority: 0.4, changeFreq: "yearly" as const },
    { path: "?page=contact", priority: 0.5, changeFreq: "monthly" as const },
    { path: "login", priority: 0.6, changeFreq: "monthly" as const },
    { path: "register", priority: 0.6, changeFreq: "monthly" as const },
    { path: "privacy", priority: 0.4, changeFreq: "yearly" as const },
    { path: "terms", priority: 0.4, changeFreq: "yearly" as const },
    { path: "cookies", priority: 0.4, changeFreq: "yearly" as const },
    { path: "disclaimer", priority: 0.4, changeFreq: "yearly" as const },
    { path: "refund-policy", priority: 0.4, changeFreq: "yearly" as const },
  ]

  return staticPages.map(({ path, priority, changeFreq }) => ({
    url: path ? `${baseUrl}/${path}` : baseUrl,
    lastModified,
    changeFrequency: changeFreq,
    priority,
  }))
}
