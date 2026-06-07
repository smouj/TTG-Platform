#!/usr/bin/env node
// register-tazos.js — Batch register generated tazos in the database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TAZOS = [
  // ── Minimon (9) ──
  { name: "Lumipuff", slug: "lumipuff", franchise: "minimon", rarity: "uncommon", role: "light",
    stats: { attack:45, defense:35, resistance:30, weight:20, stability:40, spin:55, control:50, bounce:60, precision:45 },
    skill: "Glow Pulse", skillDesc: "Heals 5 HP and blinds opponent for 1 turn" },
  { name: "Pyrokit", slug: "pyrokit", franchise: "minimon", rarity: "common", role: "attacker",
    stats: { attack:60, defense:30, resistance:35, weight:30, stability:35, spin:40, control:45, bounce:30, precision:50 },
    skill: "Ember Strike", skillDesc: "Deals +10 fire damage" },
  { name: "Aquafin", slug: "aquafin", franchise: "minimon", rarity: "uncommon", role: "technical",
    stats: { attack:35, defense:40, resistance:45, weight:35, stability:50, spin:60, control:55, bounce:45, precision:40 },
    skill: "Bubble Shield", skillDesc: "Reduces incoming damage by 15 for 2 turns" },
  { name: "Terradon", slug: "terradon", franchise: "minimon", rarity: "common", role: "tank",
    stats: { attack:30, defense:65, resistance:55, weight:60, stability:50, spin:25, control:30, bounce:20, precision:35 },
    skill: "Rock Armor", skillDesc: "+20 defense for 3 turns" },
  { name: "Zephyrix", slug: "zephyrix", franchise: "minimon", rarity: "rare", role: "bouncer",
    stats: { attack:40, defense:35, resistance:30, weight:15, stability:30, spin:70, control:55, bounce:75, precision:60 },
    skill: "Gust Dash", skillDesc: "Attacks twice in one turn" },
  { name: "Floramora", slug: "floramora", franchise: "minimon", rarity: "uncommon", role: "balanced",
    stats: { attack:45, defense:45, resistance:45, weight:40, stability:45, spin:45, control:45, bounce:45, precision:45 },
    skill: "Petal Dance", skillDesc: "Confuses opponent for 2 turns" },
  { name: "Glacipod", slug: "glacipod", franchise: "minimon", rarity: "rare", role: "tank",
    stats: { attack:30, defense:70, resistance:60, weight:55, stability:55, spin:20, control:25, bounce:15, precision:30 },
    skill: "Frost Shell", skillDesc: "Freezes attacker on contact" },
  { name: "Nocturna", slug: "nocturna", franchise: "minimon", rarity: "ultra-rare", role: "special",
    stats: { attack:55, defense:40, resistance:45, weight:25, stability:35, spin:65, control:60, bounce:55, precision:70 },
    skill: "Shadow Veil", skillDesc: "Becomes untargetable for 1 turn, then strikes for 2x" },
  { name: "Aurorix", slug: "aurorix", franchise: "minimon", rarity: "legendary", role: "special",
    stats: { attack:70, defense:50, resistance:55, weight:30, stability:45, spin:70, control:65, bounce:60, precision:75 },
    skill: "Starfall", skillDesc: "AoE attack hitting all enemy tazos for 30 damage" },

  // ── Cybermon (10) ──
  { name: "Datadrake", slug: "datadrake", franchise: "cybermon", rarity: "rare", role: "attacker",
    stats: { attack:65, defense:35, resistance:40, weight:35, stability:40, spin:50, control:45, bounce:40, precision:55 },
    skill: "Data Stream", skillDesc: "Steals 10 HP from opponent" },
  { name: "Circuitron", slug: "circuitron", franchise: "cybermon", rarity: "uncommon", role: "technical",
    stats: { attack:40, defense:45, resistance:50, weight:40, stability:50, spin:55, control:60, bounce:35, precision:45 },
    skill: "Overclock", skillDesc: "+15 speed for 3 turns" },
  { name: "Neurabyte", slug: "neurabyte", franchise: "cybermon", rarity: "ultra-rare", role: "special",
    stats: { attack:60, defense:45, resistance:55, weight:20, stability:35, spin:70, control:65, bounce:50, precision:70 },
    skill: "Mind Hack", skillDesc: "Takes control of opponent tazo for 1 turn" },
  { name: "Pixelisk", slug: "pixelisk", franchise: "cybermon", rarity: "common", role: "bouncer",
    stats: { attack:35, defense:30, resistance:25, weight:15, stability:25, spin:65, control:50, bounce:70, precision:55 },
    skill: "Pixel Dash", skillDesc: "Dodges next attack entirely" },
  { name: "Glitchorb", slug: "glitchorb", franchise: "cybermon", rarity: "uncommon", role: "technical",
    stats: { attack:45, defense:35, resistance:40, weight:25, stability:40, spin:60, control:55, bounce:50, precision:50 },
    skill: "Corrupt", skillDesc: "Randomly swaps opponent stats for 2 turns" },
  { name: "Cipherion", slug: "cipherion", franchise: "cybermon", rarity: "rare", role: "balanced",
    stats: { attack:50, defense:50, resistance:50, weight:45, stability:45, spin:45, control:45, bounce:45, precision:45 },
    skill: "Decode", skillDesc: "Negates opponent's skill effect" },
  { name: "Mainframe", slug: "mainframe", franchise: "cybermon", rarity: "common", role: "tank",
    stats: { attack:25, defense:70, resistance:55, weight:65, stability:55, spin:20, control:25, bounce:15, precision:30 },
    skill: "Firewall", skillDesc: "Blocks next 20 damage" },
  { name: "Debugger", slug: "debugger", franchise: "cybermon", rarity: "uncommon", role: "light",
    stats: { attack:40, defense:35, resistance:30, weight:20, stability:35, spin:60, control:55, bounce:65, precision:50 },
    skill: "Patch", skillDesc: "Restores 10 HP to an ally" },
  { name: "Firewall", slug: "firewall", franchise: "cybermon", rarity: "rare", role: "tank",
    stats: { attack:35, defense:65, resistance:60, weight:50, stability:60, spin:25, control:30, bounce:20, precision:35 },
    skill: "Guard Protocol", skillDesc: "Allies take 50% less damage for 1 turn" },
  { name: "Kerneloid", slug: "kerneloid", franchise: "cybermon", rarity: "legendary", role: "heavy",
    stats: { attack:75, defense:60, resistance:55, weight:70, stability:60, spin:35, control:40, bounce:25, precision:50 },
    skill: "System Crash", skillDesc: "Massive strike dealing 3x damage but loses 1 turn" },

  // ── Dracobell (5) ──
  { name: "Kaji Flame", slug: "kaji-flame", franchise: "dracobell", rarity: "rare", role: "attacker",
    stats: { attack:70, defense:35, resistance:40, weight:35, stability:40, spin:50, control:45, bounce:35, precision:50 },
    skill: "Blazing Fist", skillDesc: "Deals +15 fire damage, burns opponent" },
  { name: "Sora Tide", slug: "sora-tide", franchise: "dracobell", rarity: "legendary", role: "attacker",
    stats: { attack:75, defense:45, resistance:50, weight:35, stability:45, spin:65, control:60, bounce:55, precision:65 },
    skill: "Sky Breaker", skillDesc: "Ultimate aerial strike, ignores 50% defense" },
  { name: "Tetsu Iron", slug: "tetsu-iron", franchise: "dracobell", rarity: "uncommon", role: "tank",
    stats: { attack:40, defense:70, resistance:60, weight:65, stability:55, spin:20, control:30, bounce:15, precision:35 },
    skill: "Iron Fortress", skillDesc: "Takes 0 damage for 1 turn" },
  { name: "Mizu Wave", slug: "mizu-wave", franchise: "dracobell", rarity: "uncommon", role: "technical",
    stats: { attack:45, defense:40, resistance:50, weight:30, stability:45, spin:55, control:60, bounce:45, precision:50 },
    skill: "Tidal Flow", skillDesc: "Pushes opponent back, reducing their precision" },
  { name: "Riku Stone", slug: "riku-stone", franchise: "dracobell", rarity: "common", role: "heavy",
    stats: { attack:55, defense:55, resistance:50, weight:65, stability:55, spin:25, control:30, bounce:20, precision:35 },
    skill: "Boulder Slam", skillDesc: "+10 damage per 10 weight difference" },
];

const FRANCHISE_IDS = {
  minimon: { fid: "cmpxcefdu0000wfad1pgxwo6j", cid: "cmpxcefgn0004wfadrqf63ucj" },
  cybermon: { fid: "cmpxcefg70002wfadxp6iwu9e", cid: "cmpxcefii0008wfado9e74zkx" },
  dracobell: { fid: "cmpxcefe90001wfadlrk7od29", cid: "cmpxcefh10006wfadlyethcw0" },
};

async function main() {
  let created = 0;
  for (const t of TAZOS) {
    const { fid, cid } = FRANCHISE_IDS[t.franchise];
    const imageUrl = `/tazos-generated/${t.franchise}/${t.slug}.png`;
    
    const existing = await prisma.tazo.findFirst({ where: { slug: t.slug, franchiseId: fid } });
    if (existing) {
      console.log(`  ⏭️  ${t.name} (already exists, updating imageUrl)`);
      await prisma.tazo.update({ where: { id: existing.id }, data: { imageUrl } });
      continue;
    }

    await prisma.tazo.create({
      data: {
        name: t.name, displayName: t.name, slug: t.slug,
        franchiseId: fid, collectionId: cid,
        rarity: t.rarity, role: t.role,
        imageUrl,
        ...t.stats,
        skill: t.skill || "", skillDesc: t.skillDesc || "",
        number: "", sourceStatus: "verified", condition: "mint",
        physicalType: "cardboard", category: "tazos",
      }
    });
    console.log(`  ✅ ${t.name} [${t.rarity}] (${t.role}) — ${t.skill}`);
    created++;
  }
  console.log(`\n🎴 ${created} new tazos created, ${TAZOS.length - created} already existed`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
