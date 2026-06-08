// ============================================================
// Trading Tazos Game — Admin Tazo Art Generator
// POST /api/admin/tazo-art
//
// Aligned with tazo-art-studio methodology:
//   1. Professional prompt with transparency guard (NO magenta hack)
//   2. Official frontal backgrounds from tazo-assets/
//   3. Transparency validation (4-corner alpha check)
//   4. z-ai-web-dev-sdk primary, OpenAI fallback
//   5. Back side generation with franchise back designs
//   6. Sharp-based compositing (65% of bg, not 130% of radius)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "dev@tradingtazosgame.com";

// ── Paths ──
const PUBLIC_DIR = path.join(process.cwd(), "public");
const TAZOS_DIR = path.join(PUBLIC_DIR, "tazos-generated");
const ASSETS_DIR = path.join(PUBLIC_DIR, "tazo-assets");
const FRONTAL_DIR = path.join(ASSETS_DIR, "frontal");
const BACK_DIR = path.join(ASSETS_DIR, "back");

// ── Background mapping (matches tazo-art-studio) ──
const FRONTAL_BG_FILES: Record<string, string[]> = {
  minimon: ["minimon-01.png","minimon-02.png","minimon-03.png","minimon-04.png","minimon-05.png","minimon-06.png"],
  cybermon: ["cybermon-01.png","cybermon-02.png","cybermon-03.png"],
  dracobell: ["dracobell-01.png","dracobell-02.png","dracobell-03.png","dracobell-04.png"],
};

const BACK_BG_FILES: Record<string, string> = {
  minimon: "back-minimon.png",
  cybermon: "back-cybermon.png",
  dracobell: "back-dracobell.png",
};

// ── Franchise display config ──
const FRANCHISE: Record<string, { name: string; primary: [number,number,number]; prefix: string }> = {
  minimon: { name: "Minimon", primary: [255,203,5], prefix: "m" },
  cybermon: { name: "Cybermon", primary: [0,161,233], prefix: "c" },
  dracobell: { name: "Dracobell", primary: [255,107,0], prefix: "d" },
};

// ── COLLECTION STYLES (character design only, no environment, NO MAGENTA) ──
const COLLECTION_STYLES: Record<string, string> = {
  minimon: "90s anime collectible creature style, expressive cute monster design, bold clean outlines, cel shading, toy-like proportions, readable silhouette, vibrant character colors",
  dracobell: "retro martial arts anime fighter style, dynamic combat pose, energy aura attached to the body, bold cel shading, expressive action silhouette, dramatic character lighting",
  cybermon: "retro digital monster anime style, cybernetic creature design, glowing circuit accents on the body, angular silhouette, metallic plates on the character, electric energy attached to the body",
};

const RARITY_VISUAL: Record<string, string> = {
  common: "simple clean character design, minimal body details, straightforward pose",
  uncommon: "subtle glow effect attached to the character silhouette only, slight shimmer on the body",
  rare: "blue energy highlights attached to the body, crystalline accents on the character, dynamic pose",
  "ultra-rare": "purple aura around the character body, metallic highlights on the character, powerful stance, dramatic lighting on the figure",
  legendary: "golden aura attached to the character, crown-like light effect above the head, magnificent character presence, godlike radiance from the body",
};

const ROLE_VISUAL: Record<string, string> = {
  attacker: "aggressive fighting stance, power focus, energy fists, forward-leaning pose",
  tank: "massive defensive posture, shield stance, armored body, grounded wide stance",
  technical: "analytical pose, holographic interface lines near the hands, precision focus",
  bouncer: "acrobatic position, spring-like coiled energy, mid-air jumping pose",
  heavy: "ground-shaking stance, massive frame, gravity ripple effect beneath the feet",
  light: "swift nimble pose, speed lines trailing the body, ethereal floating stance",
  balanced: "centered meditative stance, equilibrium pose, harmonious energy around the hands",
  special: "mysterious enigmatic aura attached to the body, otherworldly character presence, unique form",
};

// ── TRANSPARENCY GUARD — NO magenta hack, real alpha ──
const TRANSPARENCY_GUARD = `Mandatory output requirements:
- Real transparent alpha background — absolutely no background visible.
- Character only — isolated figure with no environment.
- No scenery, no landscape, no room, no sky, no ground.
- No circular frame, no tazo border, no card edge.
- No text, no letters, no numbers, no watermark, no logo.
- No white background, no black background, no gradient background.
- No background pattern, no stars background, no galaxy background.
- No dirty cutout edges — clean character silhouette.
- Soft transparent contact shadow beneath the feet only — no ground plane.`;

const NEGATIVE_PROMPT = "background, scenery, landscape, room, sky, stars background, galaxy background, gradient background, white background, black background, circular frame, coin frame, card border, text, letters, watermark, logo, UI, stats, number, nameplate, dirty cutout, square image background, environmental background, scene, platform, floor, ground, pedestal";

// ── Build prompt aligned with tazo-art-studio ──
function buildFinalPrompt(
  name: string, description: string,
  franchise: string, rarity: string, role: string,
  customPrompt?: string
): string {
  const baseStyle = COLLECTION_STYLES[franchise] || COLLECTION_STYLES.minimon;
  const rarityStyle = RARITY_VISUAL[rarity] || RARITY_VISUAL.common;
  const roleStyle = ROLE_VISUAL[role] || ROLE_VISUAL.balanced;

  if (customPrompt && customPrompt.trim().length > 0) {
    return `${customPrompt.trim()}\n\n${TRANSPARENCY_GUARD}`;
  }

  return `Transparent PNG character illustration for a collectible tazo disc: ${name}, ${description}.
${baseStyle}. ${rarityStyle}. ${roleStyle}.
Full body character only, centered composition, real alpha transparent background.
Clean silhouette, bold 90s anime outlines, cel shading, soft transparent contact shadow.
Designed to be composited over a separate tazo frontal background.
${TRANSPARENCY_GUARD}`;
}

// ── Transparency validation (4-corner alpha check) ──
async function checkTransparency(buffer: Buffer): Promise<{
  hasAlpha: boolean; cornersTransparent: boolean; warning?: string;
}> {
  try {
    const sharp = (await import("sharp")).default;
    const metadata = await sharp(buffer).metadata();
    const hasAlpha = metadata.hasAlpha === true;
    if (!hasAlpha) {
      return { hasAlpha: false, cornersTransparent: false, warning: "Image has no alpha channel — background is not transparent." };
    }
    const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;
    const sampleSize = 5;
    const corners = [
      { x: 0, y: 0 }, { x: width - sampleSize, y: 0 },
      { x: 0, y: height - sampleSize }, { x: width - sampleSize, y: height - sampleSize },
    ];
    let allTransparent = true;
    for (const corner of corners) {
      for (let dy = 0; dy < sampleSize && allTransparent; dy++) {
        for (let dx = 0; dx < sampleSize && allTransparent; dx++) {
          const idx = ((corner.y + dy) * width + (corner.x + dx)) * channels;
          if (data[idx + 3] > 10) { allTransparent = false; }
        }
      }
      if (!allTransparent) break;
    }
    return {
      hasAlpha: true,
      cornersTransparent: allTransparent,
      warning: allTransparent ? undefined : "Corners are not transparent — the AI may have added a background.",
    };
  } catch {
    return { hasAlpha: false, cornersTransparent: false, warning: "Could not verify transparency." };
  }
}

// ── Generate AI image — try z-ai-web-dev-sdk first, OpenAI fallback ──
async function generateCreatureImage(prompt: string): Promise<{ buffer: Buffer | null; provider: string; error?: string }> {
  // Try 1: z-ai-web-dev-sdk
  try {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();
    const response = await (zai.images.generations as any).create({
      prompt,
      negative_prompt: NEGATIVE_PROMPT,
      size: "1024x1024",
    });
    const base64 = response?.data?.[0]?.base64;
    if (base64) {
      return { buffer: Buffer.from(base64, "base64"), provider: "z-ai" };
    }
  } catch (e: any) {
    console.warn("z-ai-web-dev-sdk failed:", e?.message);
  }

  // Try 2: OpenAI DALL-E 3
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: openaiKey });
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1, size: "1024x1024", quality: "standard",
      });
      const imageUrl = response?.data?.[0]?.url;
      if (imageUrl) {
        const imgRes = await fetch(imageUrl);
        return { buffer: Buffer.from(await imgRes.arrayBuffer()), provider: "openai" };
      }
    } catch (e: any) {
      console.warn("OpenAI generation failed:", e?.message);
    }
  }

  return { buffer: null, provider: "none", error: "No image generation provider available. Set up z-ai-web-dev-sdk (.z-ai-config) or add OPENAI_API_KEY." };
}

// ── Composite character onto official tazo-art-studio background ──
async function compositeTazo(franchiseSlug: string, characterBuffer: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;

  // Pick a random frontal background for this franchise
  const bgFiles = FRONTAL_BG_FILES[franchiseSlug] || FRONTAL_BG_FILES.minimon;
  const selectedBg = bgFiles[Math.floor(Math.random() * bgFiles.length)];
  const bgPath = path.join(FRONTAL_DIR, franchiseSlug, selectedBg);

  if (!fs.existsSync(bgPath)) {
    throw new Error(`Background not found: ${bgPath}`);
  }

  const bgImage = sharp(bgPath);
  const bgMeta = await bgImage.metadata();
  const bgSize = bgMeta.width || 1254;

  // Resize character to 65% of background (matches tazo-art-studio)
  const characterSize = Math.round(bgSize * 0.65);
  const offset = Math.round((bgSize - characterSize) / 2);

  const resizedCharacter = await sharp(characterBuffer)
    .resize(characterSize, characterSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return await bgImage
    .composite([{ input: resizedCharacter, left: offset, top: offset }])
    .png()
    .toBuffer();
}

// ── Generate back side (official back design + franchise info) ──
async function generateBackSide(franchiseSlug: string, name: string, rarity: string): Promise<Buffer> {
  const backFile = BACK_BG_FILES[franchiseSlug];
  if (!backFile) return Buffer.alloc(0);

  const backPath = path.join(BACK_DIR, backFile);
  if (!fs.existsSync(backPath)) return Buffer.alloc(0);

  const sharp = (await import("sharp")).default;
  const backMeta = await sharp(backPath).metadata();

  // Overlay tazo name + rarity on back
  const f = FRANCHISE[franchiseSlug] || FRANCHISE.minimon;
  const size = backMeta.width || 1254;

  const overlaySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <text x="${size/2}" y="${size*0.75}" text-anchor="middle"
      font-family="Arial Black, sans-serif" font-weight="900"
      font-size="${Math.round(size*0.06)}" fill="#FFFFFF" opacity="0.9"
      letter-spacing="3">${name.toUpperCase()}</text>
    <text x="${size/2}" y="${size*0.82}" text-anchor="middle"
      font-family="Arial, sans-serif" font-weight="700"
      font-size="${Math.round(size*0.04)}" fill="rgba(${f.primary.join(",")},0.8)"
      letter-spacing="5">✦ ${rarity.toUpperCase()} ✦</text>
  </svg>`;

  const overlay = await sharp(Buffer.from(overlaySvg)).resize(size, size).png().toBuffer();

  return await sharp(backPath)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png()
    .toBuffer();
}

// ── Auth guard ──
async function isAdmin(req: NextRequest) {
  const user = await getAuthUser(req);
  return user?.email === ADMIN_EMAIL;
}

// ── Generate unique slug ──
async function nextSlug(franchiseSlug: string): Promise<string> {
  const prefix = FRANCHISE[franchiseSlug]?.prefix || "x";
  // Count existing tazos for this franchise + 1
  const franchiseRecord = await prisma.franchise.findUnique({ where: { slug: franchiseSlug } });
  if (!franchiseRecord) {
    const existing = await prisma.tazo.count();
    return `${prefix}-${(existing + 1).toString().padStart(3, "0")}`;
  }
  const existing = await prisma.tazo.count({ where: { franchiseId: franchiseRecord.id } });
  // Use a range above existing batch to avoid collisions
  const num = 900 + existing + 1;
  return `${prefix}-${num.toString().padStart(3, "0")}`;
}

// ═══════════════════════════════════════════════════════
// POST — Generate tazo art (tazo-art-studio aligned)
// ═══════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, description, franchise, rarity, role, collectionId, customPrompt,
      skill, skillDesc, combatType, category, finish } = body;

    if (!name || !franchise || !rarity || !role) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: name, franchise, rarity, role",
      }, { status: 400 });
    }

    const fSlug = franchise.toLowerCase();
    const fConfig = FRANCHISE[fSlug];
    if (!fConfig) {
      return NextResponse.json({ success: false, error: `Unknown franchise: ${franchise}` }, { status: 400 });
    }

    // Build prompt
    const prompt = buildFinalPrompt(name, description || name, fSlug, rarity, role, customPrompt);

    // Find or create franchise + collection in DB
    let franchiseRecord = await prisma.franchise.findUnique({ where: { slug: fSlug } });
    if (!franchiseRecord) {
      franchiseRecord = await prisma.franchise.create({
        data: { name: fConfig.name, slug: fSlug, color: `rgb(${fConfig.primary.join(",")})` },
      });
    }

    let collectionRecord = collectionId
      ? await prisma.collection.findUnique({ where: { id: collectionId } })
      : await prisma.collection.findFirst({ where: { franchiseId: franchiseRecord.id } });
    if (!collectionRecord) {
      const cSlug = `${fSlug}-series-1`;
      collectionRecord = await prisma.collection.create({
        data: { name: `${fConfig.name} Series 1`, slug: cSlug, franchiseId: franchiseRecord.id, totalTazos: 0 },
      });
    }

    const slug = await nextSlug(fSlug);
    const slugSuffixed = `${fSlug}-${slug}`;

    // ── Step 1: Generate creature image ──
    const genResult = await generateCreatureImage(prompt);
    const creatureBuffer = genResult.buffer;

    // ── Step 2: Transparency validation (if creature was generated) ──
    let transparencyCheck: { hasAlpha: boolean; cornersTransparent: boolean; warning?: string } = { hasAlpha: false, cornersTransparent: false, warning: "No image to check" };
    if (creatureBuffer) {
      transparencyCheck = await checkTransparency(creatureBuffer);
    }

    // ── Step 3: Composite onto official tazo-art-studio background ──
    let finalImageBuffer: Buffer;
    let usedBgFile = "none";

    if (creatureBuffer) {
      try {
        const bgFiles = FRONTAL_BG_FILES[fSlug] || [];
        usedBgFile = bgFiles[Math.floor(Math.random() * bgFiles.length)] || "unknown";
        finalImageBuffer = await compositeTazo(fSlug, creatureBuffer);
      } catch (compositeErr: any) {
        console.error("Composite failed, using raw creature:", compositeErr?.message);
        // Use creature directly as fallback
        const sharp = (await import("sharp")).default;
        finalImageBuffer = await sharp(creatureBuffer).resize(1024, 1024, { fit: "contain", background: { r: 26, g: 26, b: 26, alpha: 1 } }).png().toBuffer();
      }
    } else {
      // Placeholder — show creature name initials on a disc
      const sharp = (await import("sharp")).default;
      const initials = name.slice(0, 2).toUpperCase() || "?";
      const fColors = fConfig.primary;
      const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
        <rect width="1024" height="1024" fill="#1a1a1a"/>
        <circle cx="512" cy="512" r="440" fill="#222" stroke="#333" stroke-width="4"/>
        <circle cx="512" cy="512" r="420" fill="none" stroke="rgb(${fColors.join(",")})" stroke-width="2" opacity="0.4"/>
        <circle cx="512" cy="480" r="160" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2" stroke-dasharray="8,6"/>
        <text x="512" y="470" text-anchor="middle" font-family="Arial Black,sans-serif"
          font-weight="900" font-size="100" fill="rgba(${fColors.join(",")},0.3)" letter-spacing="4">${initials}</text>
        <text x="512" y="520" text-anchor="middle" font-family="Arial,sans-serif"
          font-weight="700" font-size="22" fill="rgba(255,255,255,0.3)">${rarity.toUpperCase()}</text>
        <text x="512" y="760" text-anchor="middle" font-family="Arial,sans-serif"
          font-weight="700" font-size="14" fill="rgba(255,255,255,0.2)">AI pending</text>
      </svg>`;
      finalImageBuffer = await sharp(Buffer.from(placeholderSvg)).resize(1024, 1024).png().toBuffer();
    }

    // ── Step 4: Generate back side ──
    let backImageBuffer: Buffer | null = null;
    try {
      backImageBuffer = await generateBackSide(fSlug, name, rarity);
    } catch { /* non-critical */ }

    // ── Step 5: Save to filesystem ──
    const franchiseDir = path.join(TAZOS_DIR, fSlug);
    fs.mkdirSync(franchiseDir, { recursive: true });

    const imageFileName = `${slugSuffixed}.png`;
    const imagePath = path.join(franchiseDir, imageFileName);
    fs.writeFileSync(imagePath, finalImageBuffer);

    const imageUrl = `/tazos-generated/${fSlug}/${imageFileName}`;

    let backImageUrl: string | null = null;
    if (backImageBuffer) {
      const backDir = path.join(TAZOS_DIR, fSlug, "back");
      fs.mkdirSync(backDir, { recursive: true });
      const backFileName = `${slugSuffixed}-back.png`;
      fs.writeFileSync(path.join(backDir, backFileName), backImageBuffer);
      backImageUrl = `/tazos-generated/${fSlug}/back/${backFileName}`;
    }

    // ── Step 6: Generate stats ──
    const roleStats: Record<string, Record<string, number>> = {
      attacker: { attack:80, defense:35, resistance:40, weight:50, stability:35, spin:55, control:45, bounce:40, precision:60 },
      tank: { attack:35, defense:85, resistance:80, weight:75, stability:70, spin:30, control:40, bounce:25, precision:35 },
      technical: { attack:50, defense:45, resistance:40, weight:40, stability:50, spin:65, control:80, bounce:55, precision:80 },
      bouncer: { attack:45, defense:40, resistance:35, weight:30, stability:30, spin:75, control:55, bounce:90, precision:50 },
      heavy: { attack:65, defense:70, resistance:75, weight:95, stability:80, spin:20, control:30, bounce:15, precision:25 },
      light: { attack:45, defense:30, resistance:25, weight:15, stability:25, spin:60, control:70, bounce:65, precision:75 },
      balanced: { attack:55, defense:55, resistance:55, weight:55, stability:55, spin:55, control:55, bounce:55, precision:55 },
      special: { attack:70, defense:55, resistance:60, weight:50, stability:60, spin:70, control:65, bounce:60, precision:65 },
    };
    const baseStats = roleStats[role] || roleStats.balanced;
    const rarityMultiplier: Record<string, number> = {
      common: 0.8, uncommon: 0.9, rare: 1.0, "ultra-rare": 1.1, legendary: 1.25,
    };
    const multiplier = rarityMultiplier[rarity] || 1.0;
    const clamp = (v: number) => Math.max(10, Math.min(99, v));
    const jitter = () => Math.round(Math.random() * 10 - 5);

    // ── Step 7: Save to database ──
    const tazo = await prisma.tazo.create({
      data: {
        name, displayName: name,
        slug: slugSuffixed,
        franchiseId: franchiseRecord.id,
        collectionId: collectionRecord.id,
        number: slug,
        rarity, role,
        imageUrl,
        backImageUrl: backImageUrl || null,
        attack: clamp(Math.round(baseStats.attack * multiplier + jitter())),
        defense: clamp(Math.round(baseStats.defense * multiplier + jitter())),
        resistance: clamp(Math.round(baseStats.resistance * multiplier + jitter())),
        weight: clamp(Math.round(baseStats.weight * multiplier + jitter())),
        stability: clamp(Math.round(baseStats.stability * multiplier + jitter())),
        spin: clamp(Math.round(baseStats.spin * multiplier + jitter())),
        control: clamp(Math.round(baseStats.control * multiplier + jitter())),
        bounce: clamp(Math.round(baseStats.bounce * multiplier + jitter())),
        precision: clamp(Math.round(baseStats.precision * multiplier + jitter())),
        skill: skill || null,
        skillDesc: skillDesc || null,
        combatType: combatType || role,
        category: category || null,
        finish: finish || "normal",
        sourceStatus: "verified",
      },
    });

    // Update collection tazo count
    await prisma.collection.update({
      where: { id: collectionRecord.id },
      data: { totalTazos: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...tazo,
        imageUrl,
        backImageUrl,
        hasAI: !!creatureBuffer,
        provider: genResult.provider || "none",
        transparency: transparencyCheck.hasAlpha
          ? transparencyCheck.cornersTransparent ? "ok" : "warning"
          : "no_alpha",
        transparencyDetails: transparencyCheck,
        prompt: process.env.NODE_ENV === "development" ? prompt : undefined,
      },
    });
  } catch (error: any) {
    console.error("Tazo art generation error:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || "Failed to generate tazo art",
    }, { status: 500 });
  }
}

// GET — List generated tazos (for admin preview)
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const franchise = searchParams.get("franchise");

    const tazos = await prisma.tazo.findMany({
      where: franchise ? { franchise: { slug: franchise } } : {},
      include: { franchise: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 50),
    });

    return NextResponse.json({ success: true, data: tazos, total: await prisma.tazo.count() });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch tazos" }, { status: 500 });
  }
}
