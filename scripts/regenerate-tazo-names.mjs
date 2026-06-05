// Script: regenerate-tazo-names.mjs
// Renames ALL 319 tazos with completely original names per franchise
// Minimon = cute creatures, Cybermon = digital monsters, Dracobell = martial artists
//
// Usage: node scripts/regenerate-tazo-names.mjs
// Prerequisites: sqlite3 CLI available

const MINIMON_NAMES = [
  // Cute creature names — completely original
  "Lumipuff", "Bubblit", "Emberkit", "Leafroll", "Voltbud",     // artgen 001-005
  "Plumfuzz", "Nimbikoo", "Twinklump", "Sproutlet", "Froskit",   // 006-010
  "Glowbun", "Pebblit", "Dewdrop", "Snugleaf", "Fizzpuff",       // 011-015
  "Tumblepop", "Mossling", "Starwhiff", "Fluffern", "Bloombit",  // 016-020
  "Corkit", "Lullabud", "Wispikoo", "Bounceleaf", "Chirplet",    // 021-025
  "Puffball", "Squeaknip", "Glintail", "Trufflit", "Petaloo",    // 026-030
  "Marbit", "Flitter", "Snoozle", "Glimpet", "Tinkit",           // 031-035
  "Waddleplum", "Snapvine", "Furnip", "Skitter", "Bramblet",     // 036-040
  "Pondleap", "Gustwhirl", "Quillbee", "Mossberg", "Ripplefin",  // 041-045
  "Stonibble", "Fluffernix", "Cinderpuff", "Glacub", "Berrytuft",// 046-050
  "Zapplet"                                                       // 051
];

const CYBERMON_NAMES = [
  // Digital monster names — completely original
  "Voltcrab-X", "Datadrake", "Bytefang",                          // artgen 001-003
  "Kryptoworm", "Hexashell", "Synthclaw", "Bitdrone", "Glitchfang",    // 004-008
  "Circuitusk", "Voidraptor", "Nulldrake", "Pixelwyrm", "Datablight",  // 009-013
  "Necrobyte", "Shardbeast", "Phantocode", "Cryptospine", "Nullfang",  // 014-018
  "Rasterclaw", "Vexdrake", "Malwarex", "Codeghast", "Bitwraith",      // 019-023
  "Hexafang", "Synthshard", "Glitchraptor", "Voidcrawl", "Datarex",    // 024-028
  "Pyxelisk", "Circuitile", "Phagehound", "Neuraptor", "Cipherclaw",   // 029-033
  "Skemdrake", "Vexbyte", "Noxtusk", "Rastermaw", "Cryptohorn",        // 034-038
  "Nullwurm", "Shardraptor", "Bitbane", "Glitchvex", "Codeclaw",       // 039-043
  "Hexadrone", "Phantobeast", "Voidfang", "Dataspine", "Synthraptor",  // 044-048
  "Malweaver", "Necrodrake", "Pixelshard", "Glitchmaw", "Rasterbeast", // 049-053
  "Cryptowing", "Voidtusk", "Neuroclaw", "Hexadrake", "Bithorn",       // 054-058
  "Cipherbeast", "Shardwing", "Nullraptor", "Datanox", "Vexmaw",       // 059-063
  "Synthfang", "Pyxclaw", "Glitchspine", "Codebeast", "Noxtail",       // 064-068
  "Bitraptor", "Hexatusk", "Voidclaw", "Rasterdrake", "Phantorn",      // 069-073
  "Cryptohtooth", "Datavore", "Nullbeast", "Circuitmaw", "Shardraptor",// 074-078
  "Glitchdrone", "Hexafang", "Voidspine", "Synthdraken", "Bytedrake",  // 079-083
  "Vextalon", "Rastertusk", "Nullwing", "Cryptobeast", "Neurox",       // 084-088
  "Shardclaw", "Phantobeast", "Datamaw", "Hexadrone", "Glitchvex",     // 089-093
  "Codewurm", "Voidfang", "Bitbeast", "Synthcore", "Rasterfang",       // 094-098
  "Cipherdrake", "Nullmaw", "Cryptowing", "Shardhorn", "Glitchcore",   // 099-103
  "Noxclaw", "Hexavex", "Voiddrake", "Neurobeast", "Bitspine",         // 104-108
  "Dataraptor", "Circuitfang", "Phantodrake", "Rasterclaw", "Shardvex",// 109-113
  "Vextusk", "Glitchwing", "Cryptodrone", "Nullraptor", "Synthmaw",    // 114-118
  "Codebeast", "Hexaspine", "Bitclaw", "Voidcore", "Rastervex",        // 119-123
  "Dataraptor-X", "Glitchmancer", "Nullbyte", "Cryptodusker", "Shardwing-X",  // 124-128
  "Voidmaw-X", "Hexadrakon", "Bitable", "Synthvex", "Codewarden",      // 129-133
  "Rasterlord", "Glitchking", "Datavisor", "Nullshard", "Cryptovere",  // 134-138
  "Shardemperor", "Voidreaver", "Hexatitan", "Bitsovereign", "Noxqueen", // 139-143
  "Circuitlord", "Phantomagus", "Dataking", "Rasterlord-X", "Synthmaster", // 144-148
  "Glitchoverlord", "Voidsovereign"                                     // 149-150
];

const DRACOBELL_NAMES = [
  // Martial arts fighter names — completely original
  "Rai Kendo", "Tenzan Blaze", "Mizu Shiro",                          // artgen 001-003
  "Kenji Storm", "Hikari Flame", "Takeshi Frost", "Yuki Thunder",           // 004-007
  "Ren Stone", "Akira Gale", "Haru Ember", "Sora Tide", "Kaito Steel",      // 008-012
  "Michi Wind", "Riku Ash", "Nami Wave", "Taro Spark", "Jiro Iron",         // 013-017
  "Shin Blaze", "Koji Frost", "Yoru Shadow", "Asahi Dawn", "Daiki Quake",   // 018-022
  "Ryo Lightning", "Goro Titan", "Isamu Fang", "Kenta Shield", "Makoto Fist", // 023-027
  "Shota Storm", "Yuto Claw", "Hiroki Fang", "Naoki Blade", "Takuya Vortex", // 028-032
  "Ryuji Phoenix", "Kazuki Serpent", "Daichi Wolf", "Sho Crane", "Jun Tiger",// 033-037
  "Kota Bear", "Tsubasa Hawk", "Raiden Storm", "Hayato Blaze", "Yamato Tide",// 038-042
  "Seiji Frost", "Masaru Iron", "Noboru Gale", "Osamu Thunder", "Takumi Ash",// 043-047
  "Itsuki Wave", "Hideki Ember", "Fumio Steel", "Rin Shadow", "Haruki Dawn", // 048-052
  "Akio Fang", "Saburo Shield", "Shiro Fist", "Jin Claw", "Kane Blade",      // 053-057
  "Tetsuya Storm", "Masaki Vortex", "Koichi Phoenix", "Genji Wolf",          // 058-061
  "Daizen Tiger", "Raiga Bear", "Shingen Hawk", "Nobunaga Crane",            // 062-065
  "Kageyama Shadow", "Matsuo Steel", "Ishikawa Stone", "Tanaka Iron",        // 066-069
  "Yamamoto Tide", "Watanabe Wave", "Suzuki Flame", "Sato Thunder",          // 070-073
  "Takahashi Blaze", "Kobayashi Gale", "Nakamura Frost", "Ito Storm",        // 074-077
  "Sasaki Ash", "Kato Ember", "Yoshida Spark", "Yamada Vortex",              // 078-081
  "Murakami Fist", "Shimizu Blade", "Ono Claw", "Maeda Phoenix",             // 082-085
  "Fujita Wolf", "Ogawa Tiger", "Goto Bear", "Okada Serpent",                // 086-089
  "Hasegawa Hawk", "Ishii Crane", "Sakamoto Storm", "Endo Blaze",            // 090-093
  "Aoki Frost", "Fujii Tide", "Kinoshita Iron", "Miura Gale",                // 094-097
  "Arai Thunder", "Shibata Ash", "Kudo Spark", "Otsuka Flame",               // 098-101
  "Yokoyama Wave", "Saito Steel", "Matsuda Shadow", "Inoue Vortex",          // 102-105
  "Kimura Phoenix", "Hayashi Wolf", "Shimizu Tiger", "Yamazaki Bear",        // 106-109
  "Ikeda Hawk", "Hashimoto Crane", "Mori Fist", "Yoshikawa Claw",            // 110-113
  "Miyazaki Blade", "Kobayashi Storm", "Suzuki Blaze", "Tanaka Frost",       // 114-117
  "Watanabe Iron"                                                             // 118
];

// Master/variant Dracobell tazos (non-numeric numbers like MASTER-A18)
const DRACOBELL_MASTER_NAMES = {
  'MASTER-A18':         'Mecha Sentinel',
  'MASTER-A18-BLACK':   'Mecha Sentinel Dark',
  'MASTER-A18-GOLD':    'Mecha Sentinel Gold',
  'MASTER-FREEZER':     'Frost Tyrant',
  'MASTER-GOKU':        'Zen Striker',
  'MASTER-SHENRON':     'Dragon Ascendant',
  'MASTER-SHENRON-BLACK':'Dragon Ascendant Dark',
  'MASTER-VEGETA':      'Prince Rival'
};

const BATCH_SIZE = 50;

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const DB_PATH = process.env.DB_PATH || 'prisma/dev.db';

function sql(cmd) {
  try {
    return execSync(`sqlite3 "${DB_PATH}" "${cmd.replace(/"/g, '\\"')}"`, { encoding: 'utf8', timeout: 5000 }).trim();
  } catch (e) {
    console.error(`SQL error: ${e.message}`);
    return '';
  }
}

function main() {
  console.log('🔧 TTG Tazo Rename Tool');
  console.log('=======================\n');

  // Get all tazos with franchise info
  const result = sql(`
    SELECT t.id, t.number, t.name, t.displayName, f.slug as franchise
    FROM Tazo t JOIN Franchise f ON t.franchiseId = f.id
    ORDER BY f.slug, CAST(t.number AS INTEGER)
  `);

  const rows = result.split('\n').filter(Boolean).map(r => {
    const [id, number, name, displayName, franchise] = r.split('|');
    return { id, number, name, displayName, franchise };
  });

  console.log(`Found ${rows.length} tazos across 3 franchises\n`);

  let updates = [];
  let counts = { minimon: 0, cybermon: 0, dracobell: 0 };

  for (const tazo of rows) {
    const num = parseInt(tazo.number) || 0;
    let newName = null;

    if (tazo.franchise === 'minimon' && num > 0 && num <= MINIMON_NAMES.length) {
      newName = MINIMON_NAMES[num - 1];
    } else if (tazo.franchise === 'cybermon' && num > 0 && num <= CYBERMON_NAMES.length) {
      newName = CYBERMON_NAMES[num - 1];
    } else if (tazo.franchise === 'dracobell' && num > 0 && num <= DRACOBELL_NAMES.length) {
      newName = DRACOBELL_NAMES[num - 1];
    } else if (tazo.franchise === 'dracobell' && DRACOBELL_MASTER_NAMES[tazo.number]) {
      newName = DRACOBELL_MASTER_NAMES[tazo.number];
    }

    if (newName) {
      updates.push({ id: tazo.id, oldName: tazo.name, oldDisplay: tazo.displayName, newName, franchise: tazo.franchise, number: tazo.number });
      counts[tazo.franchise]++;
    }
  }

  console.log('📋 Planned renames:');
  console.log(`   Minimon:  ${counts.minimon}`);
  console.log(`   Cybermon: ${counts.cybermon}`);
  console.log(`   Dracobell: ${counts.dracobell}`);
  console.log(`   TOTAL:    ${updates.length}\n`);

  // Show samples
  console.log('📝 Sample renames:');
  for (const u of updates.slice(0, 5)) {
    console.log(`   #${u.number} ${u.franchise}: "${u.oldName}" → "${u.newName}"`);
  }
  console.log('   ...\n');

  // Execute updates
  if (process.argv.includes('--dry-run')) {
    console.log('🔍 DRY RUN — no changes made. Use --apply to execute.');
    return;
  }

  if (!process.argv.includes('--apply')) {
    console.log('⚠️  Run with --apply to execute renames, or --dry-run to preview.');
    return;
  }

  console.log('⚙️  Applying renames...');
  let applied = 0;
  for (const u of updates) {
    try {
      // Update both name and displayName
      sql(`UPDATE Tazo SET name = '${u.newName.replace(/'/g, "''")}', displayName = '${u.newName.replace(/'/g, "''")}' WHERE id = '${u.id}'`);
      applied++;
      if (applied % 50 === 0) console.log(`   ${applied}/${updates.length}...`);
    } catch (e) {
      console.error(`   ❌ Failed #${u.number}: ${e.message}`);
    }
  }
  console.log(`✅ ${applied}/${updates.length} tazos renamed!\n`);

  // Verify
  console.log('🔍 Verification:');
  const v = sql(`SELECT t.number, t.name, f.slug FROM Tazo t JOIN Franchise f ON t.franchiseId = f.id ORDER BY f.slug, CAST(t.number AS INTEGER) LIMIT 5`);
  console.log(v);
  const v2 = sql(`SELECT t.number, t.name, f.slug FROM Tazo t JOIN Franchise f ON t.franchiseId = f.id ORDER BY f.slug DESC, CAST(t.number AS INTEGER) LIMIT 5`);
  console.log(v2);
}

main();
