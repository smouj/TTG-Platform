// ============================================================
// Trading Tazos Game — Admin Tazo Art Generator
// POST /api/admin/tazo-art
//
// Canonical pipeline: calls the same Python script as CLI
// (generate-tazo-art.py) to guarantee 100% consistency between
// admin panel, CLI, and art-studio.
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "dev@tradingtazosgame.com";

const SCRIPTS_DIR = path.join(process.cwd(), "scripts");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const TAZOS_DIR = path.join(PUBLIC_DIR, "tazos-generated");

const FRANCHISE_SLUGS = ["minimon", "cybermon", "dracobell"] as const;

// ── POST: Generate tazo art ──
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tazoId, slug, franchiseSlug, regenerateAll } = body;

    // ── Regenerate all published tazos ──
    if (regenerateAll) {
      const result = runRegenerateAll();
      return NextResponse.json({ success: true, ...result });
    }

    // ── Regenerate single tazo ──
    const targetSlug = slug || tazoId;
    if (!targetSlug || !franchiseSlug) {
      return NextResponse.json({ error: "slug and franchiseSlug required" }, { status: 400 });
    }

    if (!FRANCHISE_SLUGS.includes(franchiseSlug)) {
      return NextResponse.json({ error: `Invalid franchise: ${franchiseSlug}` }, { status: 400 });
    }

    // Call the canonical Python generator
    const result = runGenerateSingle(franchiseSlug, targetSlug);
    
    // Update DB
    const imageUrl = `/tazos-generated/${franchiseSlug}/${targetSlug}.png`;
    await db.tazo.updateMany({
      where: { slug: targetSlug },
      data: { imageUrl },
    });

    return NextResponse.json({ success: true, imageUrl, ...result });
  } catch (err: any) {
    console.error("[tazo-art] Error:", err);
    return NextResponse.json({ error: err.message || "Generation failed" }, { status: 500 });
  }
}

// ── GET: Check if composite exists OR list recent tazos ──
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const franchiseSlug = searchParams.get("franchiseSlug");
    const limit = parseInt(searchParams.get("limit") || "0", 10);

    // Mode: list recent tazos (used by tazo-creator sidebar)
    if (limit > 0) {
      const recent = await db.tazo.findMany({
        where: { imageUrl: { not: null } },
        orderBy: { updatedAt: "desc" },
        take: Math.min(limit, 50),
        select: {
          id: true, slug: true, name: true, displayName: true,
          imageUrl: true, rarity: true, franchiseId: true,
          franchise: { select: { slug: true, name: true } },
        },
      });
      return NextResponse.json({ data: recent });
    }

    // Mode: check if a specific tazo composite exists
    if (!slug || !franchiseSlug) {
      return NextResponse.json({ error: "slug and franchiseSlug required (or use ?limit=N)" }, { status: 400 });
    }

    const compositePath = path.join(TAZOS_DIR, franchiseSlug, `${slug}.png`);
    const exists = fs.existsSync(compositePath);

    return NextResponse.json({
      exists,
      imageUrl: exists ? `/tazos-generated/${franchiseSlug}/${slug}.png` : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── Helpers ──

function runGenerateSingle(franchise: string, slug: string) {
  const script = path.join(SCRIPTS_DIR, "generate-tazo-art.py");
  if (!fs.existsSync(script)) {
    throw new Error(`Python generator not found at ${script}`);
  }

  try {
    const result = execSync(
      `python3 "${script}" --franchise ${franchise} --slug ${slug}`,
      { cwd: process.cwd(), timeout: 30000, encoding: "utf-8" }
    );
    return { output: result.trim() };
  } catch (e: any) {
    // If the script doesn't support --franchise/--slug flags,
    // fall back to generating all (the script will use DB)
    // Single tazo flag not supported, generating batch
    return runRegenerateAll();
  }
}

function runRegenerateAll() {
  const script = path.join(SCRIPTS_DIR, "regenerate-all.py");
  const altScript = path.join(SCRIPTS_DIR, "generate-tazo-art.py");
  
  const useScript = fs.existsSync(script) ? script : altScript;
  
  try {
    const result = execSync(`python3 "${useScript}"`, {
      cwd: process.cwd(),
      timeout: 120000,
      encoding: "utf-8",
    });
    return { output: result.trim().split("\n").slice(-5).join("\n") };
  } catch (e: any) {
    throw new Error(`Python generator failed: ${e.message}`);
  }
}
