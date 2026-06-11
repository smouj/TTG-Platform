#!/usr/bin/env node
// composite-tazo.js — Composite transparent creature onto tazo disc background
// Usage: node composite-tazo.js <franchise> <name> [rarity] [title]
// Disc design matches the established procedural tazo SVGs (400px → 1024px scale=2.56x)

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ── Config ──
const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();
const CREATURES_DIR = process.env.CREATURES_DIR || path.join(PROJECT_ROOT, 'scripts', 'tazo-creatures');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const OUTPUT_DIR = path.join(PUBLIC_DIR, 'tazos-generated');

const SIZE = 1024;
const CENTER = SIZE / 2;

// ── Franchise styles matching old procedural SVGs ──
const FRANCHISE = {
  minimon: {
    name: 'Minimon',
    gradient: { start: '#FFCB05', startOp: 0.9, mid: '#FFCB05', midOp: 0.6, end: '#FF8C00', endOp: 0.85 },
    stroke: '#FFCB05',
    collectionName: 'POK\u00c9MON TAZOS 1',
    category: 'Tazos',
  },
  cybermon: {
    name: 'Cybermon',
    gradient: { start: '#00A1E9', startOp: 0.9, mid: '#00A1E9', midOp: 0.6, end: '#0057B7', endOp: 0.85 },
    stroke: '#00A1E9',
    collectionName: 'CYBERMON DIGITAL SERIES',
    category: 'Caps',
  },
  dracobell: {
    name: 'Dracobell',
    gradient: { start: '#FF6B00', startOp: 0.9, mid: '#FF6B00', midOp: 0.6, end: '#CC4400', endOp: 0.85 },
    stroke: '#FF6B00',
    collectionName: 'DBZ MATUTANO 1995',
    category: 'Tazos',
  },
};

const RARITY_STARS = {
  common: 1, uncommon: 2, rare: 3, 'ultra-rare': 4, legendary: 5,
};

// Scale factor from 400px (old) to 1024px (new): 2.56x
const S = 2.56;
function s(v) { return Math.round(v * S); }

function buildSvgDisc(franchiseKey, rarityKey, title, number) {
  const f = FRANCHISE[franchiseKey];
  const stars = RARITY_STARS[rarityKey] || 1;
  const g = f.gradient;
  const uid = `${franchiseKey}${Date.now()}`;

  // Dot positions (8 around the circle at original radius 168, scaled to s(168))
  const dotR = s(168);
  const dots = [0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
    const rad = deg * Math.PI / 180;
    return `<circle cx="${s(200) + dotR * Math.cos(rad)}" cy="${s(200) + dotR * Math.sin(rad)}" r="${s(3)}" fill="white" opacity="0.4"/>`;
  }).join('');

  // Star positions (bottom area)
  let starSvg = '';
  for (let i = 0; i < stars; i++) {
    const sx = s(200) - (stars - 1) * s(22) + i * s(44);
    const sy = s(340);
    starSvg += `<polygon points="${sx},${sy - s(10)} ${sx + s(4)},${sy - s(3)} ${sx + s(10)},${sy - s(3)} ${sx + s(6)},${sy + s(1)} ${sx + s(8)},${sy + s(8)} ${sx},${sy + s(4)} ${sx - s(8)},${sy + s(8)} ${sx - s(6)},${sy + s(1)} ${sx - s(10)},${sy - s(3)} ${sx - s(4)},${sy - s(3)}" fill="#FBBF24" stroke="#1a1a1a" stroke-width="1"/>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <!-- Full-canvas dark background — ensures no transparency at edges -->
  <rect width="${SIZE}" height="${SIZE}" fill="${g.end}" />
  <defs>
    <radialGradient id="g_${uid}" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="${g.start}" stop-opacity="1"/>
      <stop offset="60%" stop-color="${g.mid}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${g.end}" stop-opacity="1"/>
    </radialGradient>
    <filter id="sh_${uid}">
      <feDropShadow dx="${s(3)}" dy="${s(3)}" stdDeviation="${s(4)}" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Main disc -->
  <circle cx="${s(200)}" cy="${s(200)}" r="${s(180)}" fill="url(#g_${uid})" filter="url(#sh_${uid})" stroke="${f.stroke}" stroke-width="${s(4)}"/>

  <!-- Inner rings -->
  <circle cx="${s(200)}" cy="${s(200)}" r="${s(168)}" fill="none" stroke="white" stroke-width="${s(2)}" opacity="0.5"/>
  <circle cx="${s(200)}" cy="${s(200)}" r="${s(160)}" fill="none" stroke="white" stroke-width="${s(1.5)}" opacity="0.3"/>

  <!-- Shine arc -->
  <path d="M ${s(50)} ${s(200)} A ${s(150)} ${s(150)} 0 0 1 ${s(350)} ${s(200)}" fill="none" stroke="white" stroke-width="${s(6)}" opacity="0.2" stroke-linecap="round"/>

  <!-- Decorative dots -->
  ${dots}

  <!-- Collection name (top) -->
  <text x="${s(200)}" y="${s(28)}" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="${s(11)}" font-weight="900" fill="white" stroke="#1a1a1a" stroke-width="${s(1)}" opacity="0.9" letter-spacing="2" paint-order="stroke fill">${f.collectionName}</text>

  <!-- Category (below collection name) -->
  <text x="${s(200)}" y="${s(55)}" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="${s(10)}" font-weight="900" fill="white" stroke="#1a1a1a" stroke-width="${s(1)}" paint-order="stroke fill" letter-spacing="1">${f.category}</text>

  <!-- Stars -->
  ${starSvg}

  <!-- Number badge -->
  <rect x="${s(164)}" y="${s(325)}" width="${s(72)}" height="${s(28)}" rx="${s(14)}" fill="white" stroke="#1a1a1a" stroke-width="${s(2)}"/>
  <text x="${s(200)}" y="${s(347)}" text-anchor="middle" dominant-baseline="middle" font-family="Arial Black,Courier New,monospace" font-size="${s(16)}" font-weight="900" fill="#1a1a1a">#${number || '?'}</text>

  <!-- Creature name (bottom) -->
  <text x="${s(200)}" y="${s(370)}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${s(10)}" font-weight="700" fill="#9CA3AF" opacity="0.9">${(title || '').toUpperCase()}</text>
</svg>`;
}

async function composite(franchiseKey, creatureName, rarityKey, title, number) {
  const creaturePath = path.join(CREATURES_DIR, franchiseKey, `${creatureName}.png`);
  if (!fs.existsSync(creaturePath)) {
    console.error(`❌ Creature not found: ${creaturePath}`);
    process.exit(1);
  }

  const outDir = path.join(OUTPUT_DIR, franchiseKey);
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${creatureName}.png`);

  // 1. Render SVG disc to PNG
  const svg = buildSvgDisc(franchiseKey, rarityKey, title || creatureName, number);
  const discBuf = await sharp(Buffer.from(svg)).resize(SIZE, SIZE).png().toBuffer();

  // 2. Read creature, resize to fill center of disc
  // Inner area is s(160)*2 = ~819px. Creature at ~85% = 696px
  const creatureMaxSize = Math.round(s(160) * 2 * 0.85);
  const creatureBuf = await sharp(creaturePath)
    .resize(creatureMaxSize, creatureMaxSize, { fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer();

  const creatureMeta = await sharp(creatureBuf).metadata();

  // 3. Composite creature centered where the letter used to be
  // Old letter position: y=s(212), center=s(200)
  const finalBuf = await sharp(discBuf)
    .composite([{
      input: creatureBuf,
      top: Math.round(s(212) - (creatureMeta.height || creatureMaxSize) / 2),
      left: Math.round(s(200) - (creatureMeta.width || creatureMaxSize) / 2),
    }])
    .png()
    .toBuffer();

  fs.writeFileSync(outPath, finalBuf);
  const sizeKB = (finalBuf.length / 1024).toFixed(0);
  console.log(`✅ ${outPath} (${sizeKB}KB) [${rarityKey}] ${starsEmoji(rarityKey)}`);
  return outPath;
}

function starsEmoji(rarityKey) {
  const n = RARITY_STARS[rarityKey] || 1;
  return '⭐'.repeat(n);
}

// ── Main ──
const args = process.argv.slice(2);
const useDB = args.includes('--db');
const cleanArgs = args.filter(a => !a.startsWith('--'));

if (cleanArgs.length < 2) {
  console.error('Usage: node composite-tazo.js <franchise> <name> [rarity] [title] [number] [--db]');
  console.error('  franchise: minimon | cybermon | dracobell');
  console.error('  name: creature filename (without .png)');
  console.error('  rarity: common | uncommon | rare | ultra-rare | legendary (default: uncommon)');
  console.error('  title: display name (default: capitalized name)');
  console.error('  number: tazo number (default: ?)');
  process.exit(1);
}

const franchise = cleanArgs[0].toLowerCase();
const name = cleanArgs[1].toLowerCase();
const rarity = cleanArgs[2] || 'uncommon';
const title = cleanArgs[3] || name.charAt(0).toUpperCase() + name.slice(1);
const number = cleanArgs[4] || '';

if (!FRANCHISE[franchise]) {
  console.error(`Unknown franchise: ${franchise}. Use: minimon, cybermon, dracobell`);
  process.exit(1);
}

composite(franchise, name, rarity, title, number)
  .then((outPath) => {
    console.log(`\n🎴 Tazo complete: ${outPath}`);
  })
  .catch(e => { console.error(e); process.exit(1); });
