#!/usr/bin/env node
/**
 * Master Tazo Definitions — 150 Tazos Season 1 (Single Source of Truth)
 * 
 * Usage:
 *   node scripts/tazo-definitions.mjs --register    Register all in DB
 *   node scripts/tazo-definitions.mjs --export      Export to JSON
 *   node scripts/tazo-definitions.mjs --count        Show counts per franchise
 * 
 * Import in other scripts:
 *   const { TAZO_DEFINITIONS } = require('./tazo-definitions.mjs');
 */

const TAZO_DEFINITIONS = [
  // ═══════════════════════════════════════════════════
  // MINIMON — 61 tazos (Pokémon-style creatures)
  // ═══════════════════════════════════════════════════
  // EXISTING (10):
  { name: "Lumipuff", slug: "lumipuff", franchise: "minimon", rarity: "uncommon", role: "light", category: "tazos",
    stats: { attack:45, defense:35, resistance:30, weight:20, stability:40, spin:55, control:50, bounce:60, precision:45 },
    skill: "Glow Pulse", skillDesc: "Heals 5 HP and blinds opponent for 1 turn" },
  { name: "Pyrokit", slug: "pyrokit", franchise: "minimon", rarity: "common", role: "attacker", category: "tazos",
    stats: { attack:60, defense:30, resistance:35, weight:30, stability:35, spin:40, control:45, bounce:30, precision:50 },
    skill: "Ember Strike", skillDesc: "Deals +10 fire damage" },
  { name: "Aquafin", slug: "aquafin", franchise: "minimon", rarity: "uncommon", role: "technical", category: "tazos",
    stats: { attack:35, defense:40, resistance:45, weight:35, stability:50, spin:60, control:55, bounce:45, precision:40 },
    skill: "Bubble Shield", skillDesc: "Reduces incoming damage by 15 for 2 turns" },
  { name: "Terradon", slug: "terradon", franchise: "minimon", rarity: "common", role: "tank", category: "tazos",
    stats: { attack:30, defense:65, resistance:55, weight:60, stability:50, spin:25, control:30, bounce:20, precision:35 },
    skill: "Rock Armor", skillDesc: "+20 defense for 3 turns" },
  { name: "Zephyrix", slug: "zephyrix", franchise: "minimon", rarity: "rare", role: "bouncer", category: "tazos",
    stats: { attack:40, defense:35, resistance:30, weight:15, stability:30, spin:70, control:55, bounce:75, precision:60 },
    skill: "Gust Dash", skillDesc: "Attacks twice in one turn" },
  { name: "Floramora", slug: "floramora", franchise: "minimon", rarity: "uncommon", role: "balanced", category: "tazos",
    stats: { attack:45, defense:45, resistance:45, weight:40, stability:45, spin:45, control:45, bounce:45, precision:45 },
    skill: "Petal Dance", skillDesc: "Confuses opponent for 2 turns" },
  { name: "Glacipod", slug: "glacipod", franchise: "minimon", rarity: "rare", role: "tank", category: "tazos",
    stats: { attack:30, defense:70, resistance:60, weight:55, stability:55, spin:20, control:25, bounce:15, precision:30 },
    skill: "Frost Shell", skillDesc: "Freezes attacker on contact" },
  { name: "Nocturna", slug: "nocturna", franchise: "minimon", rarity: "ultra", role: "special", category: "tazos",
    stats: { attack:55, defense:40, resistance:45, weight:25, stability:35, spin:65, control:60, bounce:55, precision:70 },
    skill: "Shadow Veil", skillDesc: "Becomes untargetable for 1 turn, then strikes for 2x" },
  { name: "Aurorix", slug: "aurorix", franchise: "minimon", rarity: "legendary", role: "special", category: "tazos",
    stats: { attack:70, defense:50, resistance:55, weight:30, stability:45, spin:70, control:65, bounce:60, precision:75 },
    skill: "Starfall", skillDesc: "AoE attack hitting all enemy tazos for 30 damage" },
  { name: "Boltling", slug: "boltling", franchise: "minimon", rarity: "common", role: "technical", category: "tazos",
    stats: { attack:50, defense:30, resistance:35, weight:20, stability:30, spin:60, control:50, bounce:55, precision:55 },
    skill: "Static Shock", skillDesc: "Paralyzes opponent, reducing precision by 15" },

  // NEW Minimon (51 more):
  { name: "Voltrex", slug: "voltrex", franchise: "minimon", rarity: "rare", role: "attacker", category: "tazos",
    stats: { attack:65, defense:35, resistance:40, weight:25, stability:35, spin:55, control:50, bounce:40, precision:55 },
    skill: "Thunder Crash", skillDesc: "Deals +20 electric damage, 10% chance to paralyze" },
  { name: "Gravitus", slug: "gravitus", franchise: "minimon", rarity: "uncommon", role: "heavy", category: "tazos",
    stats: { attack:50, defense:55, resistance:50, weight:70, stability:55, spin:20, control:35, bounce:15, precision:40 },
    skill: "Gravity Well", skillDesc: "Pulls all tazos closer to center" },
  { name: "Cindermaw", slug: "cindermaw", franchise: "minimon", rarity: "uncommon", role: "attacker", category: "tazos",
    stats: { attack:55, defense:30, resistance:35, weight:35, stability:30, spin:45, control:40, bounce:35, precision:50 },
    skill: "Flame Bite", skillDesc: "Deals fire damage + burn over time" },
  { name: "Mystora", slug: "mystora", franchise: "minimon", rarity: "rare", role: "special", category: "tazos",
    stats: { attack:45, defense:40, resistance:50, weight:20, stability:40, spin:60, control:65, bounce:50, precision:60 },
    skill: "Mind Warp", skillDesc: "Swaps random opponent stat with their lowest" },
  { name: "Verdantusk", slug: "verdantusk", franchise: "minimon", rarity: "common", role: "tank", category: "tazos",
    stats: { attack:40, defense:60, resistance:50, weight:55, stability:50, spin:25, control:30, bounce:20, precision:35 },
    skill: "Root Bind", skillDesc: "Traps opponent, preventing retreat" },
  { name: "Frostbite", slug: "frostbite", franchise: "minimon", rarity: "uncommon", role: "technical", category: "tazos",
    stats: { attack:40, defense:35, resistance:40, weight:25, stability:35, spin:55, control:50, bounce:45, precision:55 },
    skill: "Ice Shard", skillDesc: "Deals damage + reduces enemy spin by 10" },
  { name: "Sandshroud", slug: "sandshroud", franchise: "minimon", rarity: "common", role: "bouncer", category: "tazos",
    stats: { attack:35, defense:40, resistance:45, weight:30, stability:40, spin:50, control:45, bounce:55, precision:45 },
    skill: "Sand Veil", skillDesc: "Increases dodge chance for 2 turns" },
  { name: "Novabright", slug: "novabright", franchise: "minimon", rarity: "rare", role: "light", category: "tazos",
    stats: { attack:50, defense:30, resistance:35, weight:15, stability:30, spin:70, control:65, bounce:70, precision:60 },
    skill: "Solar Flare", skillDesc: "Blinds all enemies for 1 turn" },
  { name: "Cragshell", slug: "cragshell", franchise: "minimon", rarity: "common", role: "tank", category: "tazos",
    stats: { attack:35, defense:65, resistance:55, weight:60, stability:55, spin:20, control:25, bounce:15, precision:30 },
    skill: "Stone Guard", skillDesc: "Reflects 25% damage back at attacker" },
  { name: "Venomist", slug: "venomist", franchise: "minimon", rarity: "uncommon", role: "attacker", category: "tazos",
    stats: { attack:55, defense:35, resistance:30, weight:25, stability:30, spin:50, control:45, bounce:40, precision:55 },
    skill: "Toxic Spray", skillDesc: "Poisons enemy, dealing 8 damage per turn" },
  { name: "Lunafrost", slug: "lunafrost", franchise: "minimon", rarity: "ultra", role: "special", category: "tazos",
    stats: { attack:60, defense:45, resistance:50, weight:25, stability:40, spin:65, control:60, bounce:50, precision:65 },
    skill: "Moon Blast", skillDesc: "Deals massive damage under low-light conditions" },
  { name: "Stormbeak", slug: "stormbeak", franchise: "minimon", rarity: "rare", role: "bouncer", category: "tazos",
    stats: { attack:45, defense:35, resistance:35, weight:18, stability:30, spin:65, control:55, bounce:70, precision:60 },
    skill: "Tempest Wing", skillDesc: "Creates wind that displaces enemy tazos" },
  { name: "Puddlehop", slug: "puddlehop", franchise: "minimon", rarity: "common", role: "light", category: "tazos",
    stats: { attack:30, defense:30, resistance:35, weight:15, stability:35, spin:55, control:50, bounce:65, precision:45 },
    skill: "Splash Dash", skillDesc: "Dodges next attack and counterattacks" },
  { name: "Thornhide", slug: "thornhide", franchise: "minimon", rarity: "uncommon", role: "tank", category: "tazos",
    stats: { attack:40, defense:60, resistance:50, weight:50, stability:50, spin:25, control:30, bounce:20, precision:35 },
    skill: "Spike Skin", skillDesc: "Deals contact damage to attackers" },
  { name: "Emberling", slug: "emberling", franchise: "minimon", rarity: "common", role: "attacker", category: "tazos",
    stats: { attack:50, defense:25, resistance:30, weight:20, stability:25, spin:45, control:40, bounce:35, precision:50 },
    skill: "Tiny Flame", skillDesc: "Deals 15 fire damage + small knockback" },
  { name: "Galespire", slug: "galespire", franchise: "minimon", rarity: "rare", role: "bouncer", category: "tazos",
    stats: { attack:40, defense:35, resistance:30, weight:12, stability:25, spin:75, control:60, bounce:80, precision:55 },
    skill: "Hurricane Rush", skillDesc: "Multiple bouncing strikes in sequence" },
  { name: "Shiverpod", slug: "shiverpod", franchise: "minimon", rarity: "uncommon", role: "balanced", category: "tazos",
    stats: { attack:45, defense:45, resistance:50, weight:35, stability:45, spin:45, control:40, bounce:35, precision:45 },
    skill: "Chill Wave", skillDesc: "Reduces enemy stability by 20" },
  { name: "Blazefang", slug: "blazefang", franchise: "minimon", rarity: "uncommon", role: "attacker", category: "tazos",
    stats: { attack:60, defense:30, resistance:30, weight:30, stability:30, spin:50, control:45, bounce:40, precision:50 },
    skill: "Inferno Claw", skillDesc: "Deals heavy fire damage, 15% burn chance" },
  { name: "Magnetusk", slug: "magnetusk", franchise: "minimon", rarity: "rare", role: "technical", category: "tazos",
    stats: { attack:45, defense:50, resistance:45, weight:40, stability:45, spin:50, control:55, bounce:35, precision:55 },
    skill: "Magna Pull", skillDesc: "Pulls all metal tazos to center, stunning them" },
  { name: "Sproutkin", slug: "sproutkin", franchise: "minimon", rarity: "common", role: "balanced", category: "tazos",
    stats: { attack:35, defense:40, resistance:45, weight:30, stability:45, spin:40, control:40, bounce:40, precision:40 },
    skill: "Heal Seed", skillDesc: "Restores 20 HP to self" },
  { name: "Duskmoth", slug: "duskmoth", franchise: "minimon", rarity: "ultra", role: "special", category: "tazos",
    stats: { attack:55, defense:35, resistance:40, weight:15, stability:30, spin:65, control:70, bounce:60, precision:65 },
    skill: "Eclipse Wing", skillDesc: "Steals 15 HP from all enemies" },
  { name: "Boulderclaw", slug: "boulderclaw", franchise: "minimon", rarity: "uncommon", role: "heavy", category: "tazos",
    stats: { attack:55, defense:55, resistance:50, weight:65, stability:50, spin:20, control:30, bounce:15, precision:35 },
    skill: "Landslide", skillDesc: "Heavy slam that pushes all enemies back" },
  { name: "Sparxis", slug: "sparxis", franchise: "minimon", rarity: "rare", role: "technical", category: "tazos",
    stats: { attack:50, defense:35, resistance:40, weight:20, stability:30, spin:65, control:60, bounce:55, precision:60 },
    skill: "Spark Chain", skillDesc: "Lightning arcs between multiple enemies" },
  { name: "Tidalmist", slug: "tidalmist", franchise: "minimon", rarity: "uncommon", role: "technical", category: "tazos",
    stats: { attack:40, defense:45, resistance:50, weight:30, stability:45, spin:50, control:55, bounce:40, precision:50 },
    skill: "Mist Shroud", skillDesc: "Creates fog reducing all enemies' precision" },
  { name: "Flintspark", slug: "flintspark", franchise: "minimon", rarity: "common", role: "attacker", category: "tazos",
    stats: { attack:55, defense:25, resistance:30, weight:20, stability:25, spin:45, control:40, bounce:35, precision:45 },
    skill: "Spark Strike", skillDesc: "Deals electric damage with 20% stun" },
  { name: "Ironpetal", slug: "ironpetal", franchise: "minimon", rarity: "uncommon", role: "tank", category: "tazos",
    stats: { attack:35, defense:60, resistance:55, weight:50, stability:50, spin:25, control:30, bounce:20, precision:35 },
    skill: "Metal Bloom", skillDesc: "+15 defense for self and adjacent allies" },
  { name: "Vapernox", slug: "vapernox", franchise: "minimon", rarity: "rare", role: "special", category: "tazos",
    stats: { attack:55, defense:40, resistance:45, weight:20, stability:35, spin:60, control:60, bounce:50, precision:60 },
    skill: "Phase Shift", skillDesc: "Becomes intangible for 1 turn, dodging all attacks" },
  { name: "Mudslide", slug: "mudslide", franchise: "minimon", rarity: "common", role: "tank", category: "tazos",
    stats: { attack:35, defense:50, resistance:45, weight:50, stability:50, spin:20, control:30, bounce:25, precision:30 },
    skill: "Mud Tackle", skillDesc: "Heavy tackle that slows enemy spin" },
  { name: "Skysheer", slug: "skysheer", franchise: "minimon", rarity: "ultra", role: "bouncer", category: "tazos",
    stats: { attack:55, defense:30, resistance:35, weight:12, stability:25, spin:75, control:65, bounce:85, precision:60 },
    skill: "Aero Slice", skillDesc: "Ultra-fast strike, always hits first" },
  { name: "Quillspike", slug: "quillspike", franchise: "minimon", rarity: "uncommon", role: "attacker", category: "tazos",
    stats: { attack:55, defense:30, resistance:35, weight:25, stability:30, spin:45, control:40, bounce:35, precision:50 },
    skill: "Needle Rain", skillDesc: "Fires quills dealing 10 damage 3 times" },
  { name: "Coralith", slug: "coralith", franchise: "minimon", rarity: "rare", role: "tank", category: "tazos",
    stats: { attack:30, defense:65, resistance:60, weight:55, stability:60, spin:20, control:25, bounce:15, precision:30 },
    skill: "Coral Shield", skillDesc: "Grants barrier absorbing next 25 damage" },
  { name: "Wispflare", slug: "wispflare", franchise: "minimon", rarity: "common", role: "light", category: "tazos",
    stats: { attack:35, defense:25, resistance:30, weight:10, stability:25, spin:60, control:55, bounce:65, precision:50 },
    skill: "Wisp Guide", skillDesc: "Increases ally precision by 20 for 2 turns" },
  { name: "Talontide", slug: "talontide", franchise: "minimon", rarity: "ultra", role: "attacker", category: "tazos",
    stats: { attack:70, defense:40, resistance:45, weight:30, stability:40, spin:60, control:55, bounce:50, precision:60 },
    skill: "Razor Dive", skillDesc: "Sweeping attack hitting all enemies in line" },
  { name: "Pebbleskip", slug: "pebbleskip", franchise: "minimon", rarity: "common", role: "bouncer", category: "tazos",
    stats: { attack:30, defense:35, resistance:35, weight:25, stability:35, spin:50, control:45, bounce:60, precision:45 },
    skill: "Ricochet", skillDesc: "Bounces between enemies hitting up to 3" },
  { name: "Mycomoss", slug: "mycomoss", franchise: "minimon", rarity: "uncommon", role: "technical", category: "tazos",
    stats: { attack:35, defense:45, resistance:55, weight:35, stability:50, spin:35, control:40, bounce:30, precision:40 },
    skill: "Spore Cloud", skillDesc: "Puts enemy to sleep for 2 turns" },
  { name: "Aetherwing", slug: "aetherwing", franchise: "minimon", rarity: "legendary", role: "special", category: "tazos",
    stats: { attack:75, defense:45, resistance:55, weight:20, stability:40, spin:75, control:70, bounce:65, precision:75 },
    skill: "Divine Wind", skillDesc: "Ultimate ability — resets the arena state" },
  { name: "Snapjaw", slug: "snapjaw", franchise: "minimon", rarity: "common", role: "attacker", category: "tazos",
    stats: { attack:60, defense:25, resistance:30, weight:35, stability:25, spin:35, control:40, bounce:25, precision:45 },
    skill: "Crunch", skillDesc: "Bites through enemy defense" },
  { name: "Glimmermin", slug: "glimmermin", franchise: "minimon", rarity: "rare", role: "light", category: "tazos",
    stats: { attack:40, defense:30, resistance:35, weight:12, stability:30, spin:65, control:60, bounce:70, precision:55 },
    skill: "Shimmer Dust", skillDesc: "Restores 10 HP to all allies" },
  { name: "Hollowraze", slug: "hollowraze", franchise: "minimon", rarity: "ultra", role: "attacker", category: "tazos",
    stats: { attack:65, defense:40, resistance:45, weight:30, stability:40, spin:55, control:50, bounce:45, precision:60 },
    skill: "Void Slash", skillDesc: "Ignores all defense buffs" },
  { name: "Chillcoil", slug: "chillcoil", franchise: "minimon", rarity: "uncommon", role: "technical", category: "tazos",
    stats: { attack:45, defense:40, resistance:50, weight:30, stability:45, spin:50, control:50, bounce:40, precision:50 },
    skill: "Frost Bind", skillDesc: "Freezes enemy in place for 1 turn" },
  { name: "Bramblehog", slug: "bramblehog", franchise: "minimon", rarity: "common", role: "tank", category: "tazos",
    stats: { attack:35, defense:55, resistance:50, weight:50, stability:50, spin:25, control:30, bounce:20, precision:30 },
    skill: "Bramble Wall", skillDesc: "Creates thorn barrier damaging attackers" },
  { name: "Sunscorch", slug: "sunscorch", franchise: "minimon", rarity: "rare", role: "attacker", category: "tazos",
    stats: { attack:65, defense:30, resistance:35, weight:25, stability:30, spin:50, control:45, bounce:40, precision:55 },
    skill: "Solar Beam", skillDesc: "Charged beam dealing massive damage after 1 turn" },
  { name: "Mudpuppy", slug: "mudpuppy", franchise: "minimon", rarity: "common", role: "balanced", category: "tazos",
    stats: { attack:35, defense:40, resistance:40, weight:35, stability:40, spin:35, control:35, bounce:35, precision:35 },
    skill: "Mud Play", skillDesc: "Coats enemy in mud reducing their bounce" },
  { name: "Cloudkeep", slug: "cloudkeep", franchise: "minimon", rarity: "uncommon", role: "tank", category: "tazos",
    stats: { attack:30, defense:55, resistance:50, weight:40, stability:55, spin:30, control:35, bounce:25, precision:35 },
    skill: "Cloud Cover", skillDesc: "Creates defensive mist protecting allies" },
  { name: "Razorleaf", slug: "razorleaf", franchise: "minimon", rarity: "uncommon", role: "attacker", category: "tazos",
    stats: { attack:55, defense:30, resistance:35, weight:20, stability:30, spin:50, control:45, bounce:40, precision:50 },
    skill: "Leaf Blade", skillDesc: "Sharp leaf strike with high critical rate" },
  { name: "Prismite", slug: "prismite", franchise: "minimon", rarity: "rare", role: "special", category: "tazos",
    stats: { attack:45, defense:30, resistance:40, weight:10, stability:25, spin:55, control:65, bounce:60, precision:70 },
    skill: "Prism Beam", skillDesc: "Beam of light that splits hitting 3 targets" },
  { name: "Tremorscale", slug: "tremorscale", franchise: "minimon", rarity: "uncommon", role: "heavy", category: "tazos",
    stats: { attack:55, defense:50, resistance:45, weight:60, stability:50, spin:20, control:30, bounce:15, precision:30 },
    skill: "Earth Shatter", skillDesc: "Stomps ground, reducing all enemy stability" },
  { name: "Breezeta", slug: "breezeta", franchise: "minimon", rarity: "common", role: "bouncer", category: "tazos",
    stats: { attack:30, defense:25, resistance:30, weight:10, stability:25, spin:55, control:50, bounce:65, precision:50 },
    skill: "Tailwind", skillDesc: "Boosts ally speed and bounce for 2 turns" },
  { name: "Frostcrest", slug: "frostcrest", franchise: "minimon", rarity: "uncommon", role: "tank", category: "tazos",
    stats: { attack:35, defense:60, resistance:55, weight:50, stability:50, spin:20, control:25, bounce:15, precision:30 },
    skill: "Glacial Armor", skillDesc: "Massive defense boost for 1 turn" },
  { name: "Voidling", slug: "voidling", franchise: "minimon", rarity: "legendary", role: "special", category: "tazos",
    stats: { attack:70, defense:50, resistance:55, weight:25, stability:45, spin:65, control:70, bounce:55, precision:70 },
    skill: "Void Collapse", skillDesc: "Creates a vortex pulling all tazos to the center" },
  { name: "Puffernut", slug: "puffernut", franchise: "minimon", rarity: "common", role: "light", category: "tazos",
    stats: { attack:25, defense:30, resistance:35, weight:10, stability:30, spin:50, control:45, bounce:55, precision:40 },
    skill: "Puff Up", skillDesc: "Inflates reducing damage by 30%" },
  { name: "Grasptalon", slug: "grasptalon", franchise: "minimon", rarity: "rare", role: "attacker", category: "tazos",
    stats: { attack:60, defense:35, resistance:40, weight:35, stability:35, spin:45, control:40, bounce:35, precision:55 },
    skill: "Death Grip", skillDesc: "Grabs enemy locking them in place" },
  { name: "Cindercoil", slug: "cindercoil", franchise: "minimon", rarity: "uncommon", role: "attacker", category: "tazos",
    stats: { attack:55, defense:30, resistance:30, weight:25, stability:25, spin:50, control:45, bounce:40, precision:50 },
    skill: "Coil Burn", skillDesc: "Wraps around enemy dealing fire damage over time" },
  { name: "Wavestrike", slug: "wavestrike", franchise: "minimon", rarity: "uncommon", role: "technical", category: "tazos",
    stats: { attack:45, defense:40, resistance:45, weight:30, stability:40, spin:50, control:50, bounce:45, precision:50 },
    skill: "Tidal Slash", skillDesc: "Water blade that pushes enemy back" },
  { name: "Ridgehorn", slug: "ridgehorn", franchise: "minimon", rarity: "rare", role: "heavy", category: "tazos",
    stats: { attack:65, defense:50, resistance:45, weight:60, stability:45, spin:25, control:30, bounce:15, precision:35 },
    skill: "Mountain Rush", skillDesc: "Charges forward crashing through all enemies" },
  { name: "Specflame", slug: "specflame", franchise: "minimon", rarity: "common", role: "attacker", category: "tazos",
    stats: { attack:50, defense:25, resistance:25, weight:15, stability:20, spin:45, control:40, bounce:35, precision:45 },
    skill: "Quick Burn", skillDesc: "Fast fire attack, ignores turn order" },
  { name: "Moonshade", slug: "moonshade", franchise: "minimon", rarity: "rare", role: "special", category: "tazos",
    stats: { attack:50, defense:35, resistance:45, weight:15, stability:30, spin:60, control:65, bounce:55, precision:65 },
    skill: "Lunar Eclipse", skillDesc: "Turns all enemies' buffs into debuffs" },
  { name: "Driftpetal", slug: "driftpetal", franchise: "minimon", rarity: "common", role: "light", category: "tazos",
    stats: { attack:25, defense:30, resistance:30, weight:8, stability:25, spin:55, control:50, bounce:60, precision:45 },
    skill: "Petal Drift", skillDesc: "Floats over obstacles and enemy attacks" },
  // ── End Minimon (61) ──

  // ═══════════════════════════════════════════════════
  // DRACOBELL — Season 1 martial-aura fighters
  // ═══════════════════════════════════════════════════
  // EXISTING (11):
  { name: "Kaji Flame", slug: "kaji-flame", franchise: "dracobell", rarity: "rare", role: "attacker", category: "tazos",
    stats: { attack:70, defense:35, resistance:40, weight:35, stability:40, spin:50, control:45, bounce:35, precision:50 },
    skill: "Blazing Fist", skillDesc: "Deals +15 fire damage, burns opponent" },
  { name: "Sora Tide", slug: "sora-tide", franchise: "dracobell", rarity: "legendary", role: "attacker", category: "tazos",
    stats: { attack:75, defense:45, resistance:50, weight:35, stability:45, spin:65, control:60, bounce:55, precision:65 },
    skill: "Sky Breaker", skillDesc: "Ultimate aerial strike, ignores 50% defense" },
  { name: "Tetsu Iron", slug: "tetsu-iron", franchise: "dracobell", rarity: "uncommon", role: "tank", category: "tazos",
    stats: { attack:40, defense:70, resistance:60, weight:65, stability:55, spin:20, control:30, bounce:15, precision:35 },
    skill: "Iron Fortress", skillDesc: "Takes 0 damage for 1 turn" },
  { name: "Mizu Wave", slug: "mizu-wave", franchise: "dracobell", rarity: "uncommon", role: "technical", category: "tazos",
    stats: { attack:45, defense:40, resistance:50, weight:30, stability:45, spin:55, control:60, bounce:45, precision:50 },
    skill: "Tidal Flow", skillDesc: "Pushes opponent back, reducing their precision" },
  { name: "Riku Stone", slug: "riku-stone", franchise: "dracobell", rarity: "common", role: "heavy", category: "tazos",
    stats: { attack:55, defense:55, resistance:50, weight:65, stability:55, spin:25, control:30, bounce:20, precision:35 },
    skill: "Boulder Slam", skillDesc: "+10 damage per 10 weight difference" },
  { name: "Hikaru Light", slug: "hikaru-light", franchise: "dracobell", rarity: "rare", role: "light", category: "tazos",
    stats: { attack:45, defense:30, resistance:35, weight:15, stability:35, spin:65, control:60, bounce:70, precision:55 },
    skill: "Flash Step", skillDesc: "Instant reposition, next attack deals +20" },
  { name: "Ikari Rage", slug: "ikari-rage", franchise: "dracobell", rarity: "ultra", role: "attacker", category: "tazos",
    stats: { attack:85, defense:35, resistance:45, weight:40, stability:35, spin:55, control:50, bounce:40, precision:50 },
    skill: "Berserker Fury", skillDesc: "+30 attack for 2 turns, but loses 10% HP" },
  { name: "Kaze Wind", slug: "kaze-wind", franchise: "dracobell", rarity: "uncommon", role: "bouncer", category: "tazos",
    stats: { attack:40, defense:35, resistance:35, weight:15, stability:30, spin:65, control:55, bounce:70, precision:55 },
    skill: "Gale Force", skillDesc: "Knocks back all nearby enemies" },
  { name: "Koori Frost", slug: "koori-frost", franchise: "dracobell", rarity: "rare", role: "technical", category: "tazos",
    stats: { attack:45, defense:45, resistance:50, weight:30, stability:45, spin:55, control:60, bounce:40, precision:55 },
    skill: "Absolute Zero", skillDesc: "Freezes all enemies for 1 turn" },
  { name: "Yami Shadow", slug: "yami-shadow", franchise: "dracobell", rarity: "ultra", role: "special", category: "tazos",
    stats: { attack:60, defense:40, resistance:50, weight:25, stability:40, spin:65, control:60, bounce:55, precision:65 },
    skill: "Dark Void", skillDesc: "Banishes enemy to shadow realm for 2 turns" },
  { name: "Dracobell SV-11", slug: "dracobell-sv-11", franchise: "dracobell", rarity: "uncommon", role: "balanced", category: "tazos",
    stats: { attack:50, defense:50, resistance:50, weight:40, stability:45, spin:45, control:45, bounce:45, precision:45 },
    skill: "Spirit Wave", skillDesc: "Balanced energy wave dealing 25 damage" },

  // NEW Dracobell (117 more):
  { name: "Buru Force", slug: "buru-force", franchise: "dracobell", rarity: "rare", role: "attacker", category: "tazos",
    stats: { attack:70, defense:35, resistance:40, weight:40, stability:40, spin:50, control:45, bounce:30, precision:50 },
    skill: "Force Cannon", skillDesc: "Concentrated ki blast dealing +25 damage" },
  { name: "Denki Shock", slug: "denki-shock", franchise: "dracobell", rarity: "uncommon", role: "technical", category: "tazos",
    stats: { attack:50, defense:35, resistance:40, weight:25, stability:35, spin:60, control:55, bounce:50, precision:55 },
    skill: "Thunder Strike", skillDesc: "Electric attack stunning enemy" },
  { name: "Kumo Cloud", slug: "kumo-cloud", franchise: "dracobell", rarity: "common", role: "light", category: "tazos",
    stats: { attack:30, defense:30, resistance:35, weight:10, stability:30, spin:55, control:50, bounce:65, precision:45 },
    skill: "Cloud Walk", skillDesc: "Floats above the arena avoiding collisions" },
  { name: "Hone Bone", slug: "hone-bone", franchise: "dracobell", rarity: "common", role: "tank", category: "tazos",
    stats: { attack:40, defense:55, resistance:50, weight:55, stability:50, spin:20, control:30, bounce:15, precision:30 },
    skill: "Bone Armor", skillDesc: "Hardens body reducing damage by 50%" },
  { name: "Tsuki Moon", slug: "tsuki-moon", franchise: "dracobell", rarity: "rare", role: "special", category: "tazos",
    stats: { attack:55, defense:40, resistance:45, weight:20, stability:35, spin:60, control:65, bounce:50, precision:65 },
    skill: "Moon Beam", skillDesc: "Heals allies while damaging enemies" },
  { name: "Honoo Blaze", slug: "honoo-blaze", franchise: "dracobell", rarity: "uncommon", role: "attacker", category: "tazos",
    stats: { attack:60, defense:30, resistance:35, weight:30, stability:30, spin:50, control:45, bounce:35, precision:50 },
    skill: "Hellfire", skillDesc: "Intense flame attack that spreads to nearby enemies" },
  { name: "Kenshi Sword", slug: "kenshi-sword", franchise: "dracobell", rarity: "rare", role: "attacker", category: "tazos",
    stats: { attack:75, defense:30, resistance:35, weight:35, stability:35, spin:45, control:40, bounce:25, precision:55 },
    skill: "Sacred Blade", skillDesc: "Sword strike ignoring all resistance" },
  { name: "Jishin Quake", slug: "jishin-quake", franchise: "dracobell", rarity: "uncommon", role: "heavy", category: "tazos",
    stats: { attack:55, defense:55, resistance:50, weight:65, stability:55, spin:20, control:30, bounce:15, precision:30 },
    skill: "Earthquake", skillDesc: "Shakes the arena destabilizing all tazos" },
  { name: "Raijin Storm", slug: "raijin-storm", franchise: "dracobell", rarity: "ultra", role: "special", category: "tazos",
    stats: { attack:65, defense:45, resistance:50, weight:30, stability:40, spin:65, control:60, bounce:50, precision:65 },
    skill: "Thunder God", skillDesc: "Summons lightning strikes on all enemies" },
  { name: "Nendo Clay", slug: "nendo-clay", franchise: "dracobell", rarity: "common", role: "balanced", category: "tazos",
    stats: { attack:40, defense:45, resistance:45, weight:40, stability:45, spin:35, control:40, bounce:30, precision:40 },
    skill: "Clay Meld", skillDesc: "Absorbs enemy stats boosting own" },
  { name: "Nensho Burn", slug: "nensho-burn", franchise: "dracobell", rarity: "common", role: "attacker", category: "tazos",
    stats: { attack:55, defense:25, resistance:30, weight:25, stability:25, spin:45, control:40, bounce:30, precision:45 },
    skill: "Scorch", skillDesc: "Fire damage that weakens enemy defense" },
  { name: "Hoshi Star", slug: "hoshi-star", franchise: "dracobell", rarity: "rare", role: "light", category: "tazos",
    stats: { attack:50, defense:30, resistance:35, weight:12, stability:30, spin:65, control:60, bounce:70, precision:60 },
    skill: "Starfall", skillDesc: "Falls from above dealing massive area damage" },
  { name: "Tsubasa Wing", slug: "tsubasa-wing", franchise: "dracobell", rarity: "uncommon", role: "bouncer", category: "tazos",
    stats: { attack:40, defense:30, resistance:30, weight:12, stability:25, spin:65, control:55, bounce:75, precision:55 },
    skill: "Wing Beat", skillDesc: "Creates gust pushing all enemies backward" },
  { name: "Yoroi Armor", slug: "yoroi-armor", franchise: "dracobell", rarity: "uncommon", role: "tank", category: "tazos",
    stats: { attack:35, defense:70, resistance:55, weight:60, stability:55, spin:20, control:25, bounce:10, precision:30 },
    skill: "Samurai Guard", skillDesc: "Deflects next attack back at attacker" },
  { name: "Suisei Comet", slug: "suisei-comet", franchise: "dracobell", rarity: "ultra", role: "attacker", category: "tazos",
    stats: { attack:80, defense:35, resistance:40, weight:35, stability:35, spin:55, control:50, bounce:40, precision:50 },
    skill: "Comet Rush", skillDesc: "Charges at extreme speed crushing through defense" },
  { name: "Tokage Lizard", slug: "tokage-lizard", franchise: "dracobell", rarity: "common", role: "technical", category: "tazos",
    stats: { attack:40, defense:35, resistance:40, weight:25, stability:35, spin:50, control:45, bounce:50, precision:45 },
    skill: "Tail Whip", skillDesc: "Swift tail strike that also displaces enemy" },
  { name: "Kinzoku Metal", slug: "kinzoku-metal", franchise: "dracobell", rarity: "rare", role: "tank", category: "tazos",
    stats: { attack:45, defense:75, resistance:60, weight:70, stability:55, spin:15, control:25, bounce:10, precision:30 },
    skill: "Metal Body", skillDesc: "Becomes almost indestructible for 1 turn" },
  { name: "Shinku Void", slug: "shinku-void", franchise: "dracobell", rarity: "legendary", role: "special", category: "tazos",
    stats: { attack:75, defense:50, resistance:55, weight:30, stability:45, spin:65, control:70, bounce:50, precision:70 },
    skill: "Vacuum Wave", skillDesc: "Creates void absorbing all projectiles" },
  { name: "Byakko Tiger", slug: "byakko-tiger", franchise: "dracobell", rarity: "ultra", role: "attacker", category: "tazos",
    stats: { attack:75, defense:40, resistance:45, weight:35, stability:40, spin:55, control:50, bounce:45, precision:55 },
    skill: "White Tiger", skillDesc: "Feral assault with guaranteed critical" },
  { name: "Hebi Snake", slug: "hebi-snake", franchise: "dracobell", rarity: "uncommon", role: "technical", category: "tazos",
    stats: { attack:45, defense:35, resistance:40, weight:20, stability:35, spin:55, control:55, bounce:50, precision:55 },
    skill: "Venom Strike", skillDesc: "Poisonous bite dealing damage over 5 turns" },
  { name: "Kuroku Black", slug: "kuroku-black", franchise: "dracobell", rarity: "rare", role: "special", category: "tazos",
    stats: { attack:60, defense:40, resistance:50, weight:25, stability:40, spin:60, control:60, bounce:50, precision:60 },
    skill: "Dark Matter", skillDesc: "Creates a gravity well slowing all enemies" },
  { name: "Taiyo Sun", slug: "taiyo-sun", franchise: "dracobell", rarity: "legendary", role: "attacker", category: "tazos",
    stats: { attack:80, defense:45, resistance:50, weight:35, stability:45, spin:60, control:55, bounce:50, precision:60 },
    skill: "Solar Eruption", skillDesc: "Unleashes the power of the sun on all enemies" },
  { name: "Shippu Gale", slug: "shippu-gale", franchise: "dracobell", rarity: "rare", role: "bouncer", category: "tazos",
    stats: { attack:45, defense:35, resistance:35, weight:12, stability:25, spin:70, control:60, bounce:80, precision:55 },
    skill: "Hurricane Kick", skillDesc: "Spinning kick that hits all adjacent enemies" },
  { name: "Rensa Chain", slug: "rensa-chain", franchise: "dracobell", rarity: "uncommon", role: "technical", category: "tazos",
    stats: { attack:50, defense:40, resistance:45, weight:35, stability:40, spin:45, control:50, bounce:35, precision:50 },
    skill: "Chain Bind", skillDesc: "Wraps chain around enemy immobilizing them" },
  { name: "Kiba Fang", slug: "kiba-fang", franchise: "dracobell", rarity: "common", role: "attacker", category: "tazos",
    stats: { attack:60, defense:25, resistance:30, weight:30, stability:25, spin:40, control:35, bounce:25, precision:45 },
    skill: "Fang Strike", skillDesc: "Bite attack that causes bleeding" },
  { name: "Yugure Dusk", slug: "yugure-dusk", franchise: "dracobell", rarity: "rare", role: "special", category: "tazos",
    stats: { attack:55, defense:40, resistance:50, weight:20, stability:35, spin:60, control:65, bounce:50, precision:60 },
    skill: "Twilight Zone", skillDesc: "Creates a field where time moves slower" },
  { name: "Arashi Tempest", slug: "arashi-tempest", franchise: "dracobell", rarity: "ultra", role: "bouncer", category: "tazos",
    stats: { attack:60, defense:40, resistance:45, weight:25, stability:35, spin:70, control:60, bounce:75, precision:55 },
    skill: "Tempest Dance", skillDesc: "Spinning dance dealing damage to all enemies" },
  { name: "Genshi Atom", slug: "genshi-atom", franchise: "dracobell", rarity: "ultra", role: "special", category: "tazos",
    stats: { attack:70, defense:45, resistance:55, weight:30, stability:40, spin:60, control:65, bounce:45, precision:65 },
    skill: "Atomic Split", skillDesc: "Splits into 3 copies attacking simultaneously" },
  { name: "Hagane Steel", slug: "hagane-steel", franchise: "dracobell", rarity: "uncommon", role: "heavy", category: "tazos",
    stats: { attack:50, defense:60, resistance:55, weight:70, stability:55, spin:15, control:25, bounce:10, precision:30 },
    skill: "Steel Crush", skillDesc: "Massive weight slam on single target" },
  { name: "Atsui Heat", slug: "atsui-heat", franchise: "dracobell", rarity: "common", role: "attacker", category: "tazos",
    stats: { attack:55, defense:25, resistance:30, weight:25, stability:25, spin:45, control:40, bounce:30, precision:45 },
    skill: "Heat Wave", skillDesc: "Area fire attack affecting all enemies" },
  // ── More Dracobell (117 total new — continuing with franchise-appropriate names) ──
  { name: "Genki Spirit", slug: "genki-spirit", franchise: "dracobell", rarity: "common", role: "balanced", category: "tazos",
    stats: { attack:40, defense:40, resistance:45, weight:35, stability:40, spin:40, control:40, bounce:35, precision:40 },
    skill: "Spirit Ball", skillDesc: "Throws an energy ball that tracks the target" },
  { name: "Kaen Inferno", slug: "kaen-inferno", franchise: "dracobell", rarity: "rare", role: "attacker", category: "tazos",
    stats: { attack:70, defense:30, resistance:35, weight:30, stability:30, spin:55, control:50, bounce:35, precision:50 },
    skill: "Inferno Blast", skillDesc: "Devastating fire blast with splash damage" },
  { name: "Jiku Warp", slug: "jiku-warp", franchise: "dracobell", rarity: "rare", role: "technical", category: "tazos",
    stats: { attack:50, defense:40, resistance:45, weight:20, stability:35, spin:65, control:60, bounce:55, precision:60 },
    skill: "Space Warp", skillDesc: "Teleports to any position on the arena" },
  { name: "Kodai Ancient", slug: "kodai-ancient", franchise: "dracobell", rarity: "ultra", role: "heavy", category: "tazos",
    stats: { attack:70, defense:60, resistance:55, weight:70, stability:55, spin:25, control:30, bounce:15, precision:35 },
    skill: "Ancient Power", skillDesc: "Unleashes primordial energy raising all stats" },
  { name: "Maboro Illusion", slug: "maboro-illusion", franchise: "dracobell", rarity: "uncommon", role: "special", category: "tazos",
    stats: { attack:40, defense:35, resistance:40, weight:15, stability:30, spin:60, control:65, bounce:55, precision:60 },
    skill: "Illusion Strike", skillDesc: "Creates 3 clones that attack together" },
  { name: "Seirei Sprite", slug: "seirei-sprite", franchise: "dracobell", rarity: "common", role: "light", category: "tazos",
    stats: { attack:30, defense:30, resistance:35, weight:10, stability:30, spin:55, control:50, bounce:60, precision:50 },
    skill: "Sprite Dance", skillDesc: "Heals ally for 15 HP and boosts their next attack" },
  { name: "Ryuujin Dragon", slug: "ryuujin-dragon", franchise: "dracobell", rarity: "legendary", role: "attacker", category: "tazos",
    stats: { attack:85, defense:50, resistance:55, weight:40, stability:50, spin:60, control:55, bounce:50, precision:60 },
    skill: "Dragon God", skillDesc: "Ultimate dragon form — all stats +25 for 3 turns" },
  { name: "Chikara Power", slug: "chikara-power", franchise: "dracobell", rarity: "uncommon", role: "heavy", category: "tazos",
    stats: { attack:65, defense:45, resistance:45, weight:60, stability:45, spin:25, control:30, bounce:15, precision:35 },
    skill: "Power Slam", skillDesc: "Charges up and slams for massive damage" },
  { name: "Hayate Swift", slug: "hayate-swift", franchise: "dracobell", rarity: "rare", role: "bouncer", category: "tazos",
    stats: { attack:45, defense:30, resistance:30, weight:10, stability:25, spin:75, control:65, bounce:80, precision:60 },
    skill: "Swift Strike", skillDesc: "Attacks so fast it hits twice in one turn" },
  { name: "Shizuka Calm", slug: "shizuka-calm", franchise: "dracobell", rarity: "uncommon", role: "technical", category: "tazos",
    stats: { attack:35, defense:50, resistance:55, weight:30, stability:55, spin:40, control:45, bounce:30, precision:45 },
    skill: "Calm Mind", skillDesc: "Meditates gaining +30 to a random stat" },
  { name: "Tatakai Battle", slug: "tatakai-battle", franchise: "dracobell", rarity: "common", role: "attacker", category: "tazos",
    stats: { attack:55, defense:35, resistance:35, weight:35, stability:30, spin:40, control:35, bounce:30, precision:40 },
    skill: "Battle Cry", skillDesc: "War cry that intimidates reducing enemy attack" },
  { name: "Hibana Spark", slug: "hibana-spark", franchise: "dracobell", rarity: "common", role: "technical", category: "tazos",
    stats: { attack:45, defense:30, resistance:35, weight:20, stability:30, spin:55, control:50, bounce:45, precision:50 },
    skill: "Spark Flash", skillDesc: "Blinds enemy with bright flash" },
  { name: "Kyojin Giant", slug: "kyojin-giant", franchise: "dracobell", rarity: "rare", role: "heavy", category: "tazos",
    stats: { attack:70, defense:55, resistance:50, weight:75, stability:50, spin:20, control:25, bounce:10, precision:30 },
    skill: "Giant Stomp", skillDesc: "Massive stomp shaking the entire arena" },
  { name: "Reikan Aura", slug: "reikan-aura", franchise: "dracobell", rarity: "uncommon", role: "special", category: "tazos",
    stats: { attack:50, defense:40, resistance:45, weight:20, stability:35, spin:55, control:55, bounce:50, precision:55 },
    skill: "Aura Shield", skillDesc: "Creates an aura that reflects 30% damage" },
  { name: "Hagane Claw", slug: "hagane-claw", franchise: "dracobell", rarity: "uncommon", role: "attacker", category: "tazos",
    stats: { attack:60, defense:30, resistance:35, weight:30, stability:30, spin:45, control:40, bounce:30, precision:45 },
    skill: "Steel Claw", skillDesc: "Razor-sharp claws that bypass armor" },
  { name: "Saiho Cell", slug: "saiho-cell", franchise: "dracobell", rarity: "rare", role: "technical", category: "tazos",
    stats: { attack:45, defense:45, resistance:50, weight:25, stability:40, spin:55, control:55, bounce:45, precision:55 },
    skill: "Cell Regeneration", skillDesc: "Heals 30 HP over 3 turns" },
  { name: "Tenku Sky", slug: "tenku-sky", franchise: "dracobell", rarity: "rare", role: "bouncer", category: "tazos",
    stats: { attack:50, defense:30, resistance:35, weight:10, stability:25, spin:70, control:60, bounce:80, precision:55 },
    skill: "Sky Dance", skillDesc: "Attacks from above with +50% damage" },
  { name: "Daichi Earth", slug: "daichi-earth", franchise: "dracobell", rarity: "common", role: "tank", category: "tazos",
    stats: { attack:35, defense:60, resistance:55, weight:60, stability:55, spin:20, control:25, bounce:15, precision:30 },
    skill: "Earth Guard", skillDesc: "Burrows partially underground for protection" },
  { name: "Kasai Firestorm", slug: "kasai-firestorm", franchise: "dracobell", rarity: "ultra", role: "attacker", category: "tazos",
    stats: { attack:80, defense:35, resistance:40, weight:35, stability:35, spin:55, control:50, bounce:40, precision:50 },
    skill: "Firestorm", skillDesc: "Engulfs entire arena in flames" },
  { name: "Mugen Infinite", slug: "mugen-infinite", franchise: "dracobell", rarity: "legendary", role: "special", category: "tazos",
    stats: { attack:75, defense:55, resistance:60, weight:35, stability:50, spin:65, control:65, bounce:55, precision:65 },
    skill: "Infinite Power", skillDesc: "Unlimited energy — cannot be exhausted" },
  { name: "Shin'en Abyss", slug: "shinen-abyss", franchise: "dracobell", rarity: "ultra", role: "special", category: "tazos",
    stats: { attack:65, defense:45, resistance:55, weight:25, stability:40, spin:60, control:60, bounce:50, precision:60 },
    skill: "Abyss Gaze", skillDesc: "Enemies caught in gaze lose 20% of all stats" },
  { name: "Kodoku Lone", slug: "kodoku-lone", franchise: "dracobell", rarity: "uncommon", role: "attacker", category: "tazos",
    stats: { attack:65, defense:30, resistance:40, weight:30, stability:35, spin:45, control:40, bounce:30, precision:50 },
    skill: "Lone Wolf", skillDesc: "+20% all stats when fighting alone" },
  { name: "Mezame Awaken", slug: "mezame-awaken", franchise: "dracobell", rarity: "rare", role: "balanced", category: "tazos",
    stats: { attack:55, defense:50, resistance:50, weight:40, stability:45, spin:45, control:45, bounce:40, precision:45 },
    skill: "Awakening", skillDesc: "Transforms doubling power for 3 turns" },
  { name: "Kusari Lock", slug: "kusari-lock", franchise: "dracobell", rarity: "uncommon", role: "technical", category: "tazos",
    stats: { attack:40, defense:45, resistance:45, weight:35, stability:45, spin:40, control:50, bounce:30, precision:50 },
    skill: "Chain Lock", skillDesc: "Locks enemy in place for 3 turns" },
  { name: "Hakai Destroy", slug: "hakai-destroy", franchise: "dracobell", rarity: "legendary", role: "attacker", category: "tazos",
    stats: { attack:90, defense:40, resistance:45, weight:40, stability:40, spin:50, control:45, bounce:35, precision:50 },
    skill: "Destruction", skillDesc: "Erases target from existence (massive damage)" },
  { name: "Akuma Demon", slug: "akuma-demon", franchise: "dracobell", rarity: "ultra", role: "attacker", category: "tazos",
    stats: { attack:80, defense:35, resistance:45, weight:30, stability:35, spin:60, control:55, bounce:45, precision:55 },
    skill: "Demon Rush", skillDesc: "Rapid dark-energy strikes hitting 5 times" },
  { name: "Seijin Sage", slug: "seijin-sage", franchise: "dracobell", rarity: "rare", role: "technical", category: "tazos",
    stats: { attack:40, defense:50, resistance:55, weight:25, stability:50, spin:50, control:60, bounce:40, precision:60 },
    skill: "Sage Wisdom", skillDesc: "Reveals enemy weakness increasing ally precision" },
  { name: "Kessho Crystal", slug: "kessho-crystal", franchise: "dracobell", rarity: "rare", role: "tank", category: "tazos",
    stats: { attack:35, defense:70, resistance:65, weight:55, stability:60, spin:20, control:25, bounce:10, precision:30 },
    skill: "Crystal Wall", skillDesc: "Creates an impenetrable crystal barrier" },
  { name: "Yajuu Beast", slug: "yajuu-beast", franchise: "dracobell", rarity: "ultra", role: "heavy", category: "tazos",
    stats: { attack:70, defense:55, resistance:50, weight:70, stability:50, spin:35, control:35, bounce:25, precision:40 },
    skill: "Beast Rampage", skillDesc: "Berserk mode — attacks all enemies uncontrollably" },
  // ── Dracobell continuing — filling to 128 ──
  { name: "Umi Ocean", slug: "umi-ocean", franchise: "dracobell", rarity: "common", role: "technical", category: "tazos",
    stats: { attack:40, defense:40, resistance:45, weight:30, stability:40, spin:45, control:45, bounce:40, precision:45 },
    skill: "Ocean Wave", skillDesc: "Sweeps enemies to the edge of the arena" },
  { name: "Kiri Mist", slug: "kiri-mist", franchise: "dracobell", rarity: "common", role: "light", category: "tazos",
    stats: { attack:30, defense:30, resistance:35, weight:12, stability:30, spin:50, control:55, bounce:55, precision:50 },
    skill: "Mist Veil", skillDesc: "Becomes invisible for 1 turn" },
  { name: "Toge Thorn", slug: "toge-thorn", franchise: "dracobell", rarity: "uncommon", role: "attacker", category: "tazos",
    stats: { attack:55, defense:30, resistance:35, weight:25, stability:30, spin:45, control:40, bounce:35, precision:45 },
    skill: "Thorn Barrage", skillDesc: "Fires 5 thorns dealing stacking damage" },
  { name: "Jigen Dimension", slug: "jigen-dimension", franchise: "dracobell", rarity: "ultra", role: "special", category: "tazos",
    stats: { attack:60, defense:45, resistance:55, weight:25, stability:40, spin:65, control:65, bounce:50, precision:65 },
    skill: "Dimension Cut", skillDesc: "Slices through space dealing true damage" },
  { name: "Enmu Dream", slug: "enmu-dream", franchise: "dracobell", rarity: "uncommon", role: "special", category: "tazos",
    stats: { attack:45, defense:35, resistance:40, weight:15, stability:30, spin:55, control:60, bounce:50, precision:60 },
    skill: "Dream Eater", skillDesc: "Puts enemy to sleep and steals their energy" },
  { name: "Rekka Blaze", slug: "rekka-blaze", franchise: "dracobell", rarity: "rare", role: "attacker", category: "tazos",
    stats: { attack:70, defense:30, resistance:35, weight:30, stability:30, spin:50, control:45, bounce:35, precision:50 },
    skill: "Raging Fire", skillDesc: "Flame chain that links between enemies" },
  { name: "Roshi Master", slug: "roshi-master", franchise: "dracobell", rarity: "ultra", role: "balanced", category: "tazos",
    stats: { attack:60, defense:55, resistance:55, weight:40, stability:50, spin:50, control:55, bounce:45, precision:60 },
    skill: "Master's Teachings", skillDesc: "Boosts all allies' stats by 10" },
  { name: "Kami Divine", slug: "kami-divine", franchise: "dracobell", rarity: "legendary", role: "special", category: "tazos",
    stats: { attack:70, defense:60, resistance:65, weight:30, stability:55, spin:60, control:70, bounce:50, precision:70 },
    skill: "Divine Judgment", skillDesc: "Judgment from above — instant KO if below 30% HP" },
  { name: "Arata New", slug: "arata-new", franchise: "dracobell", rarity: "common", role: "balanced", category: "tazos",
    stats: { attack:45, defense:40, resistance:40, weight:35, stability:40, spin:40, control:40, bounce:35, precision:40 },
    skill: "Fresh Start", skillDesc: "Resets all stat changes on self" },
  { name: "Kyofu Fear", slug: "kyofu-fear", franchise: "dracobell", rarity: "uncommon", role: "technical", category: "tazos",
    stats: { attack:45, defense:35, resistance:40, weight:20, stability:30, spin:50, control:55, bounce:45, precision:55 },
    skill: "Fear Aura", skillDesc: "Reduces all enemy stats by 5" },
  // Dracobell continues below with generated names...
];

// ═══════════════════════════════════════════════════
// AUTO-FILL — generates remaining tazos to reach targets
// ═══════════════════════════════════════════════════

function generateRemainingTazos(definitions) {
  const MINIMON_TARGET = 61;
  const DRACOBELL_TARGET = 128;
  const CYBERMON_TARGET = 160;

  const counts = {};
  for (const t of definitions) {
    counts[t.franchise] = (counts[t.franchise] || 0) + 1;
  }

  // Franchise-specific name generators
  const minimonPrefixes = ["Blaze","Hydro","Terra","Veno","Crysta","Magna","Psycho","Dendro","Anemo","Electro","Pyro","Cryo","Lumi","Umbra","Flora","Nebula","Plasma","Quanta","Mythra","Velox"];
  const minimonSuffixes = ["gon","pod","wing","maw","horn","tail","fin","claw","spark","drake","beak","shell","thorn","mane","gem","shard","fury","crest","storm","blade"];

  const dracobellPrefixes = ["Goku","Jin","Ken","Shin","Gin","Fu","Ryu","Tao","Bao","Dan","Zetsu","Rai","Katsu","Shou","Jinzo","Ginga","Tobira","Bara","Renga","Tenchu"];
  const dracobellLabels = ["Fist","Punch","Kick","Beam","Wave","Blast","Rush","Strike","Guard","Break","Storm","Flash","Soul","Force","Power","Speed","Focus","Will","Edge","Roar"];

  const cybermonPrefixes = ["Data","Neural","Quantum","Binary","Digital","Vector","Synth","Logic","Cypher","Mecha","Techno","Cyber","Hexa","Omni","Ultra","Nano","Hyper","Proto","Meta","Alpha"];
  const cybermonSuffixes = ["tron","byte","droid","ware","bot","net","code","link","grid","node","core","chip","drive","cast","pulse","ware","hub","flux","tek","scan"];

  const rarityPool = ["common","common","common","common","common","uncommon","uncommon","uncommon","rare","rare","ultra"];
  const roles = ["attacker","tank","technical","bouncer","light","heavy","balanced","special"];
  const skills = {
    attacker: [
      { name:"Power Strike", desc:"Deals +20 damage" },
      { name:"Critical Edge", desc:"Increased critical hit chance" },
      { name:"Berserker Mode", desc:"+15 attack, -10 defense" },
      { name:"Rampage", desc:"Attacks twice this turn" },
      { name:"Finishing Blow", desc:"Deals 2x damage to targets below 50% HP" },
    ],
    tank: [
      { name:"Iron Wall", desc:"+30 defense for 2 turns" },
      { name:"Fortress", desc:"Reduces all incoming damage by 50%" },
      { name:"Last Stand", desc:"Survives with 1 HP from fatal attack" },
      { name:"Guardian Barrier", desc:"Protects all allies for 1 turn" },
      { name:"Stone Skin", desc:"Becomes immune to knockback" },
    ],
    technical: [
      { name:"Precision Shot", desc:"Next attack cannot miss" },
      { name:"Stat Swap", desc:"Swaps attack and defense with enemy" },
      { name:"Energy Drain", desc:"Steals 10 spin from enemy" },
      { name:"Gravity Lock", desc:"Enemy cannot move next turn" },
      { name:"Disable", desc:"Negates enemy's next skill" },
    ],
    bouncer: [
      { name:"Ricochet", desc:"Bounces between 3 enemies" },
      { name:"Spring Load", desc:"Next bounce deals double damage" },
      { name:"Airborne", desc:"Avoids all ground-based attacks" },
      { name:"Rebound", desc:"Redirects incoming attack at enemy" },
      { name:"Pinball", desc:"Gains speed with each bounce" },
    ],
    light: [
      { name:"Quick Dodge", desc:"100% dodge next attack" },
      { name:"Speed Boost", desc:"+30 spin for 3 turns" },
      { name:"Wind Walker", desc:"Moves first regardless of speed" },
      { name:"Flash Step", desc:"Instant reposition to any spot" },
      { name:"Nimble", desc:"Reduces damage by 20% from heavy tazos" },
    ],
    heavy: [
      { name:"Crushing Slam", desc:"Deals bonus damage based on weight" },
      { name:"Unstoppable", desc:"Cannot be pushed or displaced" },
      { name:"Earth Shatter", desc:"AoE damage around impact point" },
      { name:"Titan's Grip", desc:"Holds enemy in place" },
      { name:"Avalanche", desc:"Gains power while moving forward" },
    ],
    balanced: [
      { name:"All-Rounder", desc:"+5 to all stats for 3 turns" },
      { name:"Adapt", desc:"Copies enemy's highest stat" },
      { name:"Flow State", desc:"Enters a perfect balance trance" },
      { name:"Harmony", desc:"Heals self for 15 HP" },
      { name:"Steady Pulse", desc:"Consistent damage with no RNG" },
    ],
    special: [
      { name:"Chaos Zone", desc:"Randomizes all enemy positions" },
      { name:"Mind Control", desc:"Enemy attacks their ally" },
      { name:"Time Freeze", desc:"All enemies skip next turn" },
      { name:"Reality Warp", desc:"Swaps arena terrain" },
      { name:"Ultimate Sacrifice", desc:"Deals massive damage to all" },
    ],
  };

  const hash = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  };

  const generated = [...definitions];

  // Fill minimon to 61
  while (generated.filter(t => t.franchise === "minimon").length < MINIMON_TARGET) {
    const idx = generated.filter(t => t.franchise === "minimon").length;
    const prefix = minimonPrefixes[hash(`min-${idx}-pre`) % minimonPrefixes.length];
    const suffix = minimonSuffixes[hash(`min-${idx}-suf`) % minimonSuffixes.length];
    const name = prefix + suffix.charAt(0).toUpperCase() + suffix.slice(1);
    const slug = name.toLowerCase();
    const rarity = rarityPool[hash(`min-r-${idx}`) % rarityPool.length];
    const role = roles[hash(`min-role-${idx}`) % roles.length];
    const skillPool = skills[role] || skills.balanced;
    const skill = skillPool[hash(`min-sk-${idx}`) % skillPool.length];

    if (generated.find(t => t.slug === slug || t.name === name)) continue;

    generated.push({
      name, slug, franchise: "minimon", rarity, role, category: "tazos",
      stats: {
        attack: 30 + hash(`ma-${idx}`) % 55,
        defense: 25 + hash(`md-${idx}`) % 55,
        resistance: 25 + hash(`mr-${idx}`) % 50,
        weight: 10 + hash(`mw-${idx}`) % 65,
        stability: 20 + hash(`ms-${idx}`) % 50,
        spin: 15 + hash(`mp-${idx}`) % 65,
        control: 20 + hash(`mc-${idx}`) % 55,
        bounce: 10 + hash(`mb-${idx}`) % 70,
        precision: 20 + hash(`mpr-${idx}`) % 55,
      },
      skill: skill.name,
      skillDesc: skill.desc,
    });
  }

  // Fill dracobell to 128
  while (generated.filter(t => t.franchise === "dracobell").length < DRACOBELL_TARGET) {
    const idx = generated.filter(t => t.franchise === "dracobell").length;
    const prefix = dracobellPrefixes[hash(`dra-${idx}-pre`) % dracobellPrefixes.length];
    const label = dracobellLabels[hash(`dra-${idx}-lab`) % dracobellLabels.length];
    const name = `${prefix} ${label}`;
    const slug = name.toLowerCase().replace(/ /g, "-");
    const rarity = rarityPool[hash(`dra-r-${idx}`) % rarityPool.length];
    const role = roles[hash(`dra-role-${idx}`) % roles.length];
    const skillPool = skills[role] || skills.balanced;
    const skill = skillPool[hash(`dra-sk-${idx}`) % skillPool.length];

    if (generated.find(t => t.slug === slug || t.name === name)) continue;

    generated.push({
      name, slug, franchise: "dracobell", rarity, role, category: "tazos",
      stats: {
        attack: 30 + hash(`da-${idx}`) % 60,
        defense: 25 + hash(`dd-${idx}`) % 55,
        resistance: 25 + hash(`dr-${idx}`) % 50,
        weight: 15 + hash(`dw-${idx}`) % 65,
        stability: 20 + hash(`ds-${idx}`) % 50,
        spin: 15 + hash(`dp-${idx}`) % 65,
        control: 20 + hash(`dc-${idx}`) % 55,
        bounce: 10 + hash(`db-${idx}`) % 70,
        precision: 20 + hash(`dpr-${idx}`) % 55,
      },
      skill: skill.name,
      skillDesc: skill.desc,
    });
  }

  // Fill cybermon to 160
  while (generated.filter(t => t.franchise === "cybermon").length < CYBERMON_TARGET) {
    const idx = generated.filter(t => t.franchise === "cybermon").length;
    const prefix = cybermonPrefixes[hash(`cyb-${idx}-pre`) % cybermonPrefixes.length];
    const suffix = cybermonSuffixes[hash(`cyb-${idx}-suf`) % cybermonSuffixes.length];
    const name = prefix + suffix.charAt(0).toUpperCase() + suffix.slice(1);
    const slug = name.toLowerCase();
    const rarity = rarityPool[hash(`cyb-r-${idx}`) % rarityPool.length];
    const role = roles[hash(`cyb-role-${idx}`) % roles.length];
    const skillPool = skills[role] || skills.balanced;
    const skill = skillPool[hash(`cyb-sk-${idx}`) % skillPool.length];

    if (generated.find(t => t.slug === slug || t.name === name)) continue;

    generated.push({
      name, slug, franchise: "cybermon", rarity, role, category: "tazos",
      stats: {
        attack: 30 + hash(`ca-${idx}`) % 60,
        defense: 25 + hash(`cd-${idx}`) % 55,
        resistance: 25 + hash(`cr-${idx}`) % 50,
        weight: 15 + hash(`cw-${idx}`) % 65,
        stability: 20 + hash(`cs-${idx}`) % 50,
        spin: 15 + hash(`cp-${idx}`) % 65,
        control: 20 + hash(`cc-${idx}`) % 55,
        bounce: 10 + hash(`cb-${idx}`) % 70,
        precision: 20 + hash(`cpr-${idx}`) % 55,
      },
      skill: skill.name,
      skillDesc: skill.desc,
    });
  }

  return generated;
}

let _ALL_TAZOS = null;
function getAllTazos() {
  if (!_ALL_TAZOS) _ALL_TAZOS = generateRemainingTazos(TAZO_DEFINITIONS);
  return _ALL_TAZOS;
}
const ALL_TAZOS = new Proxy({}, {
  get(_, prop) { return getAllTazos()[prop]; },
  ownKeys() { return Reflect.ownKeys(getAllTazos()); },
  getOwnPropertyDescriptor() { return { enumerable: true, configurable: true }; }
});
// Force materialize
getAllTazos();

// ── CLI ──
if (require.main === module) {
  const mode = process.argv[2] || '--count';
  
  if (mode === '--count' || mode === '--stats') {
    const counts = {};
    const rarityCounts = {};
    for (const t of ALL_TAZOS) {
      counts[t.franchise] = (counts[t.franchise] || 0) + 1;
      const key = `${t.franchise}/${t.rarity}`;
      rarityCounts[key] = (rarityCounts[key] || 0) + 1;
    }
    console.log(`\n📊 Tazo Stats: ${ALL_TAZOS.length} total\n`);
    for (const [fr, count] of Object.entries(counts)) {
      console.log(`  ${fr}: ${count}`);
      for (const [key, rc] of Object.entries(rarityCounts)) {
        if (key.startsWith(fr + '/')) console.log(`    ${key.split('/')[1]}: ${rc}`);
      }
    }
  }
  
  if (mode === '--export') {
    const path = 'scripts/all-tazos.json';
    require('fs').writeFileSync(path, JSON.stringify(ALL_TAZOS, null, 2));
    console.log(`✅ Exported ${ALL_TAZOS.length} tazos to ${path}`);
  }
  
  if (mode === '--register') {
    require('./register-tazos.js');
  }
}

if (typeof module !== 'undefined') { module.exports = { TAZO_DEFINITIONS, ALL_TAZOS, generateRemainingTazos }; }
