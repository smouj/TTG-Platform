// ============================================================
// Trading Tazos Game — Admin Tazo Art Generator
// POST /api/admin/tazo-art
//
// Generates AI creature art, composites onto tazo disc background,
// and saves to the database + filesystem.
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "dev@tradingtazosgame.com";

// ── Output paths ──
const PUBLIC_DIR = path.join(process.cwd(), "public");
const TAZOS_DIR = path.join(PUBLIC_DIR, "tazos-generated");

// ── Franchise config (matches generate-tazo-art.py) ──
const FRANCHISE: Record<string, {
  name: string;
  primary: [number, number, number];
  secondary: [number, number, number];
  dark: [number, number, number];
  accent: [number, number, number];
  bgLight: [number, number, number];
  bgMid: [number, number, number];
  collectionName: string;
  ringColors: [number, number, number][];
  prefix: string;
}> = {
  minimon: {
    name: "Minimon", primary: [255, 203, 5], secondary: [34, 197, 94],
    dark: [124, 45, 18], accent: [34, 197, 94],
    bgLight: [252, 252, 240], bgMid: [240, 250, 230],
    collectionName: "MINIMON TAZOS SERIES 1", prefix: "m",
    ringColors: [[255, 203, 5], [34, 197, 94], [124, 45, 18]],
  },
  cybermon: {
    name: "Cybermon", primary: [0, 161, 233], secondary: [0, 87, 183],
    dark: [30, 58, 95], accent: [6, 182, 212],
    bgLight: [220, 245, 255], bgMid: [190, 230, 250],
    collectionName: "CYBERMON DIGI-TAZOS 2000", prefix: "c",
    ringColors: [[0, 161, 233], [0, 87, 183], [30, 58, 95]],
  },
  dracobell: {
    name: "Dracobell", primary: [255, 107, 0], secondary: [204, 68, 0],
    dark: [124, 45, 18], accent: [227, 53, 13],
    bgLight: [255, 245, 225], bgMid: [255, 230, 200],
    collectionName: "DRACOBELL MASTER SERIES", prefix: "d",
    ringColors: [[255, 107, 0], [204, 68, 0], [124, 45, 18]],
  },
};

// ── Rarity config ──
const RARITY: Record<string, { border: [number, number, number]; stars: number; glow: [number, number, number] | null }> = {
  common: { border: [156, 163, 175], stars: 1, glow: null },
  uncommon: { border: [34, 197, 94], stars: 2, glow: [34, 197, 94] },
  rare: { border: [59, 130, 246], stars: 3, glow: [59, 130, 246] },
  "ultra-rare": { border: [168, 85, 247], stars: 4, glow: [168, 85, 247] },
  legendary: { border: [251, 191, 36], stars: 5, glow: [251, 191, 36] },
};

// ── COLLECTION STYLES (for AI prompt — character design only, no background) ──
const COLLECTION_STYLES: Record<string, string> = {
  minimon: "90s anime collectible creature style, expressive cute monster design, bold clean outlines, cel shading, toy-like proportions, readable silhouette, vibrant character colors",
  dracobell: "retro martial arts anime fighter style, dynamic combat pose, energy aura attached to the body, bold cel shading, expressive action silhouette, dramatic character lighting",
  cybermon: "retro digital monster anime style, cybernetic creature design, glowing circuit accents on the body, angular silhouette, metallic plates on the character, electric energy attached to the body",
};

// ── RARITY VISUAL (character-attached only, NO backgrounds) ──
const RARITY_VISUAL: Record<string, string> = {
  common: "simple clean character design, minimal body details, straightforward pose",
  uncommon: "subtle glow effect attached to the character silhouette only, slight shimmer on the body",
  rare: "blue energy highlights attached to the body, crystalline accents on the character, dynamic pose",
  "ultra-rare": "purple aura around the character body, metallic highlights on the character, powerful stance, dramatic lighting on the figure",
  legendary: "golden aura attached to the character, crown-like light effect above the head, magnificent character presence, godlike radiance from the body",
};

// ── ROLE VISUAL ──
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

// ── MANDATORY TRANSPARENCY GUARD ──
const TRANSPARENCY_GUARD = `Mandatory output requirements:
- Character on a SOLID MAGENTA (#FF00FF) background — this will be automatically removed.
- Character only — isolated figure with no environment.
- No scenery, no landscape, no room, no sky, no ground.
- No circular frame, no tazo border, no card edge.
- No text, no letters, no numbers, no watermark, no logo.
- No white background, no black background, no gradient background.
- No background pattern, no stars background, no galaxy background.
- Clean character silhouette against the solid magenta background.`;

// ── NEGATIVE PROMPT ──
const NEGATIVE_PROMPT = "background, scenery, landscape, room, sky, stars background, galaxy background, gradient background, white background, black background, circular frame, coin frame, card border, text, letters, watermark, logo, UI, stats, number, nameplate, dirty cutout, square image background, environmental background, scene, platform, floor, ground, pedestal";

// ── Build the final prompt ──
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

  return `Transparent character illustration for a collectible tazo disc: ${name}, ${description}.
${baseStyle}. ${rarityStyle}. ${roleStyle}.
Full body character only, centered composition, on a SOLID MAGENTA (#FF00FF) background.
Clean silhouette, bold 90s anime outlines, cel shading.
${TRANSPARENCY_GUARD}`;
}

// ── Generate slug from franchise + next number ──
async function nextSlug(franchiseSlug: string): Promise<string> {
  const prefix = FRANCHISE[franchiseSlug]?.prefix || "x";
  const existing = await prisma.tazo.count({ where: { franchiseId: { not: undefined } } });
  const num = existing + 1;
  return `${prefix}-${num.toString().padStart(3, "0")}`;
}

// ── Auth guard ──
async function isAdmin(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return false;
  return user.email === ADMIN_EMAIL;
}

// ── Color helpers ──
function rgb(r: number, g: number, b: number): string { return `rgb(${r},${g},${b})`; }

// ── Generate procedural tazo disc background as SVG ──
function makeTazoDiscSVG(franchiseSlug: string, rarityKey: string): string {
  const f = FRANCHISE[franchiseSlug] || FRANCHISE.minimon;
  const r = RARITY[rarityKey] || RARITY.common;
  const SIZE = 1024;
  const CENTER = SIZE / 2;
  const RADIUS = 440;

  // Star SVG path
  const starPath = (cx: number, cy: number, r: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 5; i++) {
      const outerAngle = (Math.PI / 2) * -1 + (i * 2 * Math.PI) / 5;
      const innerAngle = outerAngle + Math.PI / 5;
      pts.push(`${cx + r * Math.cos(outerAngle)},${cy + r * Math.sin(outerAngle)}`);
      pts.push(`${cx + r * 0.4 * Math.cos(innerAngle)},${cy + r * 0.4 * Math.sin(innerAngle)}`);
    }
    return pts.join(" ");
  };

  const stars = Array.from({ length: r.stars }, (_, i) => {
    const angle = (i / r.stars) * 2 * Math.PI - Math.PI / 2;
    const sr = RADIUS * 0.85;
    const sx = CENTER + sr * Math.cos(angle);
    const sy = CENTER + sr * Math.sin(angle);
    return `<polygon points="${starPath(sx, sy, 28)}" fill="${rgb(...r.border)}" stroke="${rgb(26, 26, 26)}" stroke-width="2" />`;
  }).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${rgb(...f.bgLight)}" />
      <stop offset="65%" stop-color="${rgb(...f.bgMid)}" />
      <stop offset="100%" stop-color="${rgb(...f.accent)}" />
    </radialGradient>
    <radialGradient id="creatureBg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${rgb(...f.bgLight)}" stop-opacity="0.3" />
      <stop offset="60%" stop-color="${rgb(...f.bgLight)}" stop-opacity="0.6" />
      <stop offset="100%" stop-color="${rgb(...f.bgMid)}" stop-opacity="0.9" />
    </radialGradient>
  </defs>

  <!-- Outer disc -->
  <circle cx="${CENTER}" cy="${CENTER}" r="${RADIUS}" fill="url(#bgGrad)" />
  <circle cx="${CENTER}" cy="${CENTER}" r="${RADIUS}" fill="none" 
    stroke="${rgb(...f.dark)}" stroke-width="8" />

  <!-- Inner ring -->
  <circle cx="${CENTER}" cy="${CENTER}" r="${RADIUS - 30}" fill="none"
    stroke="${rgb(...f.primary)}" stroke-width="3" opacity="0.7" />

  <!-- Second inner ring -->
  <circle cx="${CENTER}" cy="${CENTER}" r="${RADIUS - 50}" fill="none"
    stroke="${rgb(...f.secondary)}" stroke-width="2" opacity="0.5" />

  <!-- Rarity border ring -->
  <circle cx="${CENTER}" cy="${CENTER}" r="${RADIUS - 16}" fill="none"
    stroke="${rgb(...r.border)}" stroke-width="${rarityKey === 'legendary' ? 6 : 4}" />

  <!-- Creature inner background (semi-transparent) -->
  <circle cx="${CENTER}" cy="${CENTER}" r="${RADIUS - 60}" fill="url(#creatureBg)" />

  ${stars}

  <!-- Collection arc text (top) — wrapped in individual text elements -->
  <text x="${CENTER}" y="${RADIUS - 100}" text-anchor="middle"
    font-family="Arial Black, sans-serif" font-weight="900"
    font-size="24" fill="${rgb(...f.dark)}" opacity="0.3"
    letter-spacing="8">${f.collectionName}</text>

  <!-- Separator diamonds -->
  <polygon points="${CENTER - 60},${RADIUS - 60} ${CENTER},${RADIUS - 70} ${CENTER + 60},${RADIUS - 60}"
    fill="${rgb(...f.primary)}" opacity="0.6" />
</svg>`;
}

// ── POST: Generate tazo art ──
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      name, description, franchise, rarity, role,
      collectionId, customPrompt,
    } = body;

    if (!name || !franchise || !rarity || !role) {
      return NextResponse.json({ success: false, error: "Missing required fields: name, franchise, rarity, role" }, { status: 400 });
    }

    const fSlug = franchise.toLowerCase();
    const fConfig = FRANCHISE[fSlug];
    if (!fConfig) {
      return NextResponse.json({ success: false, error: `Unknown franchise: ${franchise}` }, { status: 400 });
    }

    // Build the prompt
    const prompt = buildFinalPrompt(name, description || name, fSlug, rarity, role, customPrompt);

    // Find or fallback franchise + collection in DB
    let franchiseRecord = await prisma.franchise.findUnique({ where: { slug: fSlug } });
    if (!franchiseRecord) {
      franchiseRecord = await prisma.franchise.create({ data: { name: fConfig.name, slug: fSlug, color: `rgb(${fConfig.primary.join(",")})` } });
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

    // ── Step 1: Generate creature image via OpenAI ──
    let creatureBuffer: Buffer | null = null;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (openaiKey) {
      try {
        const OpenAI = (await import("openai")).default;
        const openai = new OpenAI({ apiKey: openaiKey });

        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });

        const imageUrl = response?.data?.[0]?.url;
        if (imageUrl) {
          const imgRes = await fetch(imageUrl);
          const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

          // Remove magenta (#FF00FF) background → transparent PNG
          const sharp = (await import("sharp")).default;
          const { data, info } = await sharp(imgBuffer)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

          const { width, height, channels } = info;
          const newData = Buffer.alloc(data.length);

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            // Check if pixel is magenta-ish (R>200, B>200, G<100)
            if (r > 180 && b > 180 && g < 100) {
              newData[i + 3] = 0; // Set alpha to 0 (transparent)
              newData[i] = 0; newData[i + 1] = 0; newData[i + 2] = 0;
            } else {
              newData[i] = r; newData[i + 1] = g; newData[i + 2] = b;
              newData[i + 3] = data[i + 3]; // Keep original alpha
            }
          }

          creatureBuffer = await sharp(newData, { raw: { width, height, channels: 4 } })
            .png()
            .toBuffer();
        }
      } catch (genError: any) {
        console.error("OpenAI generation error:", genError?.message || genError);
        // Fall through to placeholder
      }
    }

    // ── Step 2: Composite onto tazo disc background ──
    const sharp = (await import("sharp")).default;

    // Render SVG background to PNG
    const discSvg = makeTazoDiscSVG(fSlug, rarity);
    const discBg = await sharp(Buffer.from(discSvg)).resize(1024, 1024).png().toBuffer();

    // If we have a creature, composite it onto the disc
    let finalImageBuffer: Buffer;

    if (creatureBuffer) {
      // Resize creature to fit within the disc (65% of radius)
      const CREATURE_SIZE = Math.round(440 * 1.3); // ~572px
      const offsetX = Math.round((1024 - CREATURE_SIZE) / 2);
      const offsetY = Math.round((1024 - CREATURE_SIZE) / 2) - 30; // slight upward offset

      const resizedCreature = await sharp(creatureBuffer)
        .resize(CREATURE_SIZE, CREATURE_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

      // Composite: disc bg first, then creature on top, then overlay rings
      finalImageBuffer = await sharp(discBg)
        .composite([
          { input: resizedCreature, top: offsetY, left: offsetX },
        ])
        .png()
        .toBuffer();
    } else {
      // No creature — generate a placeholder silhouette on the disc
      const fColors = fConfig;
      const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
        <circle cx="512" cy="490" r="180" fill="none" stroke="rgba(26,26,26,0.2)" stroke-width="3" stroke-dasharray="8,6" />
        <text x="512" y="480" text-anchor="middle" font-family="Arial Black, sans-serif"
          font-weight="900" font-size="120" fill="rgba(${fColors.primary.join(",")},0.4)"
          letter-spacing="4">${name.slice(0, 2).toUpperCase()}</text>
        <text x="512" y="530" text-anchor="middle" font-family="Arial, sans-serif"
          font-weight="700" font-size="24" fill="rgba(26,26,26,0.4)">${rarity.toUpperCase()}</text>
      </svg>`;

      const placeholder = await sharp(Buffer.from(placeholderSvg)).resize(1024, 1024).png().toBuffer();
      finalImageBuffer = await sharp(discBg)
        .composite([{ input: placeholder, top: 0, left: 0 }])
        .png()
        .toBuffer();
    }

    // ── Step 3: Save to filesystem ──
    const franchiseDir = path.join(TAZOS_DIR, fSlug);
    fs.mkdirSync(franchiseDir, { recursive: true });

    const imageFileName = `${slugSuffixed}.png`;
    const imagePath = path.join(franchiseDir, imageFileName);
    fs.writeFileSync(imagePath, finalImageBuffer);

    const imageUrl = `/tazos-generated/${fSlug}/${imageFileName}`;

    // ── Step 4: Generate stats ──
    const roleStats: Record<string, Record<string, number>> = {
      attacker: { attack: 80, defense: 35, resistance: 40, weight: 50, stability: 35, spin: 55, control: 45, bounce: 40, precision: 60 },
      tank: { attack: 35, defense: 85, resistance: 80, weight: 75, stability: 70, spin: 30, control: 40, bounce: 25, precision: 35 },
      technical: { attack: 50, defense: 45, resistance: 40, weight: 40, stability: 50, spin: 65, control: 80, bounce: 55, precision: 80 },
      bouncer: { attack: 45, defense: 40, resistance: 35, weight: 30, stability: 30, spin: 75, control: 55, bounce: 90, precision: 50 },
      heavy: { attack: 65, defense: 70, resistance: 75, weight: 95, stability: 80, spin: 20, control: 30, bounce: 15, precision: 25 },
      light: { attack: 45, defense: 30, resistance: 25, weight: 15, stability: 25, spin: 60, control: 70, bounce: 65, precision: 75 },
      balanced: { attack: 55, defense: 55, resistance: 55, weight: 55, stability: 55, spin: 55, control: 55, bounce: 55, precision: 55 },
      special: { attack: 70, defense: 55, resistance: 60, weight: 50, stability: 60, spin: 70, control: 65, bounce: 60, precision: 65 },
    };
    const baseStats = roleStats[role] || roleStats.balanced;
    const rarityMultiplier: Record<string, number> = {
      common: 0.8, uncommon: 0.9, rare: 1.0, "ultra-rare": 1.1, legendary: 1.25,
    };
    const multiplier = rarityMultiplier[rarity] || 1.0;
    const clamp = (v: number) => Math.max(10, Math.min(99, v));
    const jitter = () => Math.round(Math.random() * 10 - 5);

    // ── Step 5: Save to database ──
    const tazo = await prisma.tazo.create({
      data: {
        name: name,
        displayName: name,
        slug: slugSuffixed,
        franchiseId: franchiseRecord.id,
        collectionId: collectionRecord.id,
        number: slug,
        rarity: rarity,
        role: role,
        imageUrl: imageUrl,
        // Stats with rarity multiplier + jitter
        attack: clamp(Math.round(baseStats.attack * multiplier + jitter())),
        defense: clamp(Math.round(baseStats.defense * multiplier + jitter())),
        resistance: clamp(Math.round(baseStats.resistance * multiplier + jitter())),
        weight: clamp(Math.round(baseStats.weight * multiplier + jitter())),
        stability: clamp(Math.round(baseStats.stability * multiplier + jitter())),
        spin: clamp(Math.round(baseStats.spin * multiplier + jitter())),
        control: clamp(Math.round(baseStats.control * multiplier + jitter())),
        bounce: clamp(Math.round(baseStats.bounce * multiplier + jitter())),
        precision: clamp(Math.round(baseStats.precision * multiplier + jitter())),
        combatType: role,
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
        imageUrl: imageUrl,
        hasAI: !!creatureBuffer,
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

// ── GET: List generated tazos (for admin preview) ──
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
