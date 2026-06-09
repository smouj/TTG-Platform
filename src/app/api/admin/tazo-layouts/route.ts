import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const LAYOUTS_FILE = path.join(process.cwd(), "prisma", "tazo-layouts.json");

interface LayoutElement {
  x: number;
  y: number;
  scale: number;
  visible?: boolean;    // show/hide this element
  opacity?: number;     // 0-1 opacity override
  rotation?: number;    // degrees rotation
  color?: string;       // custom CSS color override
  customText?: string;  // override auto-text (name, number, collection)
}

interface LayoutConfig {
  collection: LayoutElement;
  badge: LayoutElement;
  number: LayoutElement;
  name: LayoutElement;
  rarity: LayoutElement;
  creature: LayoutElement;
}

// Back side elements — different set than front
interface BackLayoutConfig {
  centerIcon: LayoutElement;   // franchise logo/icon at center
  topLabel: LayoutElement;     // "OFFICIAL TAZO" or edition label
  bottomLabel: LayoutElement;  // franchise name or year
  cornerBadge: LayoutElement;  // limited edition marker
  numberBadge: LayoutElement;  // optional number on back
}

interface LayoutStore {
  defaults: Record<string, LayoutConfig>;         // front franchise → layout
  overrides: Record<string, LayoutConfig>;         // front tazo-slug → layout
  backDefaults: Record<string, BackLayoutConfig>;  // back franchise → layout
  backOverrides: Record<string, BackLayoutConfig>; // back tazo-slug → layout
  lastModified: number; // unix timestamp of last layout change
}

function readStore(): LayoutStore {
  try {
    if (fs.existsSync(LAYOUTS_FILE)) {
      return JSON.parse(fs.readFileSync(LAYOUTS_FILE, "utf-8"));
    }
  } catch {}
  return { defaults: {}, overrides: {}, backDefaults: {}, backOverrides: {}, lastModified: 0 };
}

function writeStore(store: LayoutStore) {
  fs.mkdirSync(path.dirname(LAYOUTS_FILE), { recursive: true });
  fs.writeFileSync(LAYOUTS_FILE, JSON.stringify(store, null, 2));
}

// GET /api/admin/tazo-layouts?franchise=minimon&slug=boltling&type=back
export async function GET(req: NextRequest) {
  const franchise = req.nextUrl.searchParams.get("franchise");
  const slug = req.nextUrl.searchParams.get("slug");
  const side = req.nextUrl.searchParams.get("side") || "front"; // "front" | "back"
  const store = readStore();

  if (side === "back") {
    const backDefaults: BackLayoutConfig = {
      centerIcon: { x: 0, y: 0, scale: 1.0 },
      topLabel: { x: 0, y: -320, scale: 1.0 },
      bottomLabel: { x: 0, y: 320, scale: 1.0 },
      cornerBadge: { x: 280, y: -280, scale: 1.0 },
      numberBadge: { x: -280, y: 280, scale: 1.0 },
    };

    if (slug && store.backOverrides[slug]) {
      return NextResponse.json({ layout: store.backOverrides[slug], source: "override", side: "back" });
    }
    if (franchise && store.backDefaults[franchise]) {
      return NextResponse.json({ layout: store.backDefaults[franchise], source: "default", side: "back" });
    }
    return NextResponse.json({ layout: backDefaults, source: "hardcoded", side: "back" });
  }

  // Front layouts
  if (slug && store.overrides[slug]) {
    return NextResponse.json({ layout: store.overrides[slug], source: "override", side: "front" });
  }

  if (franchise && store.defaults[franchise]) {
    return NextResponse.json({ layout: store.defaults[franchise], source: "default", side: "front" });
  }

  // Return hardcoded defaults (matches DEFAULT_LAYOUT in tazo-visual-editor.tsx)
  const defaults: LayoutConfig = {
    collection: { x: 0, y: -447, scale: 1.0 },
    badge: { x: 0, y: -340, scale: 1.0 },
    number: { x: 310, y: 310, scale: 1.0 },
    name: { x: 0, y: 370, scale: 1.0 },
    rarity: { x: 0, y: -295, scale: 1.0 },
    creature: { x: 0, y: 0, scale: 1.0 },
  };

  return NextResponse.json({ layout: defaults, source: "hardcoded", side: "front" });
}

// POST /api/admin/tazo-layouts
// Body: { franchise, slug?, layout, side: "front"|"back" }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { franchise, slug, layout, side = "front" } = body;

  if (!layout) {
    return NextResponse.json({ error: "layout required" }, { status: 400 });
  }

  const store = readStore();

  if (side === "back") {
    if (slug) {
      store.backOverrides[slug] = layout;
    } else if (franchise) {
      store.backDefaults[franchise] = layout;
    } else {
      return NextResponse.json({ error: "franchise or slug required" }, { status: 400 });
    }
  } else {
    if (slug) {
      store.overrides[slug] = layout;
    } else if (franchise) {
      store.defaults[franchise] = layout;
    } else {
      return NextResponse.json({ error: "franchise or slug required" }, { status: 400 });
    }
  }

  store.lastModified = Date.now();
  writeStore(store);
  return NextResponse.json({ success: true, source: slug ? "override" : "default", side });
}
