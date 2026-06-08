import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const LAYOUTS_FILE = path.join(process.cwd(), "prisma", "tazo-layouts.json");

interface LayoutElement {
  x: number;
  y: number;
  scale: number;
}

interface LayoutConfig {
  badge: LayoutElement;
  number: LayoutElement;
  name: LayoutElement;
  rarity: LayoutElement;
  creature: LayoutElement;
}

interface LayoutStore {
  defaults: Record<string, LayoutConfig>; // franchise → layout
  overrides: Record<string, LayoutConfig>; // tazo-slug → layout
}

function readStore(): LayoutStore {
  try {
    if (fs.existsSync(LAYOUTS_FILE)) {
      return JSON.parse(fs.readFileSync(LAYOUTS_FILE, "utf-8"));
    }
  } catch {}
  return { defaults: {}, overrides: {} };
}

function writeStore(store: LayoutStore) {
  fs.mkdirSync(path.dirname(LAYOUTS_FILE), { recursive: true });
  fs.writeFileSync(LAYOUTS_FILE, JSON.stringify(store, null, 2));
}

// GET /api/admin/tazo-layouts?franchise=minimon&slug=boltling
export async function GET(req: NextRequest) {
  const franchise = req.nextUrl.searchParams.get("franchise");
  const slug = req.nextUrl.searchParams.get("slug");
  const store = readStore();

  if (slug && store.overrides[slug]) {
    return NextResponse.json({ layout: store.overrides[slug], source: "override" });
  }

  if (franchise && store.defaults[franchise]) {
    return NextResponse.json({ layout: store.defaults[franchise], source: "default" });
  }

  // Return hardcoded defaults
  const defaults: LayoutConfig = {
    badge: { x: 0, y: -280, scale: 1.0 },
    number: { x: -280, y: 250, scale: 1.0 },
    name: { x: 0, y: 330, scale: 1.0 },
    rarity: { x: 280, y: 250, scale: 1.0 },
    creature: { x: 0, y: 0, scale: 1.0 },
  };

  return NextResponse.json({ layout: defaults, source: "hardcoded" });
}

// POST /api/admin/tazo-layouts
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { franchise, slug, layout } = body;

  if (!layout) {
    return NextResponse.json({ error: "layout required" }, { status: 400 });
  }

  const store = readStore();

  if (slug) {
    store.overrides[slug] = layout;
  } else if (franchise) {
    store.defaults[franchise] = layout;
  } else {
    return NextResponse.json({ error: "franchise or slug required" }, { status: 400 });
  }

  writeStore(store);
  return NextResponse.json({ success: true, source: slug ? "override" : "default" });
}
