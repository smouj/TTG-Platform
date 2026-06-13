"use client";

// ============================================================
// Trading Tazos Game — Admin Shell
// Shared navigation header + auth guard for all admin pages.
// ============================================================
import { useAuth } from "@/lib/auth-context";
import {
  Shield, Users, Package, Database, Server, Activity,
  Wand2, LayoutGrid, Grid3X3, ShoppingBag, Loader2,
  ChevronRight, Home, Settings
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Navigation tabs definition — single source of truth
const ADMIN_TABS = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: Shield,
    color: "#E3350D",
    exact: true,
  },
  {
    href: "/admin/tazo-creator",
    label: "Creator",
    icon: Wand2,
    color: "#22C55E",
  },
  {
    href: "/admin/tazo-designer",
    label: "Designer",
    icon: LayoutGrid,
    color: "#A855F7",
  },
  {
    href: "/admin/tazos",
    label: "Tazos",
    icon: Grid3X3,
    color: "#F59E0B",
  },
  {
    href: "/admin/tubes",
    label: "Tubes",
    icon: Package,
    color: "#FF6B00",
  },
  {
    href: "/admin/tube-models",
    label: "Tube Models",
    icon: Database,
    color: "#EF4444",
  },
  {
    href: "/admin/bags",
    label: "Bags",
    icon: ShoppingBag,
    color: "#8B5CF6",
  },
  {
    href: "/admin/bag-models",
    label: "Bag Models",
    icon: Server,
    color: "#F97316",
  },
  {
    href: "/admin/site-config",
    label: "Site Config",
    icon: Settings,
    color: "#06B6D4",
  },
];

interface AdminShellProps {
  children: React.ReactNode;
  /** Color for the header bottom border. Matches the active tab. */
  accentColor?: string;
  /** Optional right-side actions in the header */
  actions?: React.ReactNode;
}

export default function AdminShell({
  children,
  accentColor = "#E3350D",
  actions,
}: AdminShellProps) {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();

  const isAdmin = user?.email === "dev@tradingtazosgame.com";

  // ---------- Loading ----------
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen mag-bg">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFCC00]" />
      </div>
    );
  }

  // ---------- Unauthorized ----------
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center mag-bg">
        <div className="mag-card p-8 text-center max-w-md mx-4 space-y-4">
          <Shield className="w-16 h-16 mx-auto text-[#E3350D]" />
          <h1 className="text-xl font-black uppercase text-[#1a1a1a]">Access Denied</h1>
          <p className="text-sm font-bold text-[#1a1a1a]/50">
            This panel is restricted to the developer account.
          </p>
          <Link
            href="/"
            className="mag-btn inline-block bg-[#E3350D] text-white px-6 py-3 text-xs font-black uppercase tracking-wider border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // ---------- Authorized ----------
  return (
    <div className="min-h-screen mag-bg flex flex-col">
      {/* === Top Header === */}
      <header
        className="bg-[#1a1a1a] sticky top-0 z-50"
        style={{ borderBottomWidth: "4px", borderBottomStyle: "solid", borderBottomColor: accentColor }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-white" />
            <h1 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
              Admin Panel
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-zinc-400 hidden sm:inline">
              {user?.email}
            </span>
            <Link
              href="/?page=tazos"
              className="text-[10px] font-black text-[#FFCC00] hover:text-white uppercase tracking-wider flex items-center gap-1"
              title="View public catalog"
            >
              <Home className="w-3 h-3" /> Public Site
            </Link>
            {actions}
          </div>
        </div>

        {/* === Navigation Tabs === */}
        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto gap-0 border-t border-zinc-700/50">
          {ADMIN_TABS.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  relative px-3 py-2.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap
                  transition-all duration-150 flex items-center gap-1.5
                  ${
                    isActive
                      ? "text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }
                `}
              >
                <tab.icon
                  className="w-3.5 h-3.5"
                  style={{ color: isActive ? tab.color : undefined }}
                />
                <span className="hidden sm:inline">{tab.label}</span>
                {/* Active indicator dot */}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[3px]"
                    style={{ backgroundColor: tab.color }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </header>

      {/* === Page Content === */}
      <main className="flex-1">{children}</main>

      {/* === Footer === */}
      <footer className="border-t-2 border-[#1a1a1a]/10 bg-[#1a1a1a]/[0.02] py-3">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[9px] font-bold text-[#1a1a1a]/25 uppercase tracking-wider">
            Admin Panel · Trading Tazos Game v0.6.5 · {user?.email}
          </p>
        </div>
      </footer>
    </div>
  );
}
