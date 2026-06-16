import type { MetadataRoute } from "next"
import { SITE_CONFIG } from "@/lib/site-config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/app/",
          "/*.json",
        ],
      },
      {
        userAgent: "GPTBot",
        disallow: ["/"],
      },
    ],
    sitemap: `${SITE_CONFIG.canonicalUrl}/sitemap.xml`,
  }
}
