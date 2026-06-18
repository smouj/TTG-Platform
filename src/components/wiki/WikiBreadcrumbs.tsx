import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { WIKI_SERIES_CONFIG } from "@/lib/wiki-types";
import type { TTGWikiSeries } from "@/lib/wiki-types";

interface WikiBreadcrumbsProps {
  series?: TTGWikiSeries;
  entityName?: string;
  entitySlug?: string;
}

export default function WikiBreadcrumbs({
  series,
  entityName,
}: WikiBreadcrumbsProps) {
  const crumbs: { label: string; href: string }[] = [
    { label: "TTG Wiki", href: "/wiki" },
  ];

  if (series) {
    const cfg = WIKI_SERIES_CONFIG[series];
    crumbs.push({ label: cfg.label, href: `/wiki/${cfg.slug}` });
  }

  if (entityName && series) {
    const cfg = WIKI_SERIES_CONFIG[series];
    crumbs.push({
      label: entityName,
      href: `/wiki/${cfg.slug}/${entityName.toLowerCase().replace(/\s+/g, "-")}`,
    });
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-xs font-bold text-ttg-black/60">
        {crumbs.map((crumb, i) => (
          <li key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3 h-3" />}
            {i < crumbs.length - 1 ? (
              <Link
                href={crumb.href}
                className="hover:text-ttg-black hover:underline transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-ttg-black/90">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
