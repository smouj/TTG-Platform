// ============================================================
// Seed quests and achievements into the database
// Run: npx tsx prisma/seed-quests.ts
// ============================================================

import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

// ─── QUESTS ─────────────────────────────────────────────────

const QUESTS = [
  // Beginner quests
  { title: "First Collection", description: "Collect 5 tazos", icon: "Package", category: "beginner", difficulty: "easy", requirement: "collect_tazos", target: 5, rewardCredits: 50, orderIndex: 1 },
  { title: "Deck Builder", description: "Create your first battle deck", icon: "Layers", category: "beginner", difficulty: "easy", requirement: "create_deck", target: 1, rewardCredits: 75, orderIndex: 2 },
  { title: "First Battle", description: "Win your first practice battle", icon: "Swords", category: "beginner", difficulty: "easy", requirement: "win_battles", target: 1, rewardCredits: 100, orderIndex: 3 },
  { title: "Bag Opener", description: "Open 3 tazo bags", icon: "ShoppingBag", category: "beginner", difficulty: "easy", requirement: "open_bags", target: 3, rewardCredits: 80, orderIndex: 4 },

  // Daily quests
  { title: "Daily Battle", description: "Win 2 battles today", icon: "Swords", category: "daily", difficulty: "easy", requirement: "win_battles", target: 2, rewardCredits: 30, orderIndex: 10 },
  { title: "Daily Collector", description: "Collect 3 new tazos today", icon: "Package", category: "daily", difficulty: "easy", requirement: "collect_tazos", target: 3, rewardCredits: 40, orderIndex: 11 },
  { title: "Daily Shopper", description: "Open 2 bags today", icon: "ShoppingBag", category: "daily", difficulty: "easy", requirement: "open_bags", target: 2, rewardCredits: 35, orderIndex: 12 },
  { title: "Sharpshooter", description: "Land 5 perfect throws", icon: "Crosshair", category: "daily", difficulty: "medium", requirement: "perfect_throw", target: 5, rewardCredits: 50, orderIndex: 13 },

  // Weekly quests
  { title: "Weekend Warrior", description: "Win 10 battles this week", icon: "Trophy", category: "weekly", difficulty: "medium", requirement: "win_battles", target: 10, rewardCredits: 150, orderIndex: 20 },
  { title: "Master Collector", description: "Collect 20 tazos this week", icon: "Star", category: "weekly", difficulty: "medium", requirement: "collect_tazos", target: 20, rewardCredits: 120, orderIndex: 21 },
  { title: "Deck Master", description: "Create 3 battle decks", icon: "Layers", category: "weekly", difficulty: "medium", requirement: "create_deck", target: 3, rewardCredits: 100, orderIndex: 22 },
  { title: "Bag Hoarder", description: "Open 15 bags this week", icon: "ShoppingBag", category: "weekly", difficulty: "hard", requirement: "open_bags", target: 15, rewardCredits: 200, orderIndex: 23 },
  { title: "Perfect Aim", description: "Land 30 perfect throws", icon: "Crosshair", category: "weekly", difficulty: "hard", requirement: "perfect_throw", target: 30, rewardCredits: 180, orderIndex: 24 },

  // Special quests
  { title: "Legendary Hunter", description: "Find a legendary tazo", icon: "Sparkles", category: "special", difficulty: "hard", requirement: "collect_tazos", target: 1, rewardCredits: 300, orderIndex: 30 },
  { title: "Full Album", description: "Collect 100 unique tazos", icon: "BookOpen", category: "special", difficulty: "hard", requirement: "collect_tazos", target: 100, rewardCredits: 500, orderIndex: 31 },
  { title: "Battle Champion", description: "Win 50 battles", icon: "Trophy", category: "special", difficulty: "hard", requirement: "win_battles", target: 50, rewardCredits: 400, orderIndex: 32 },
  { title: "Credit Millionaire", description: "Earn 1000 total credits", icon: "Coins", category: "special", difficulty: "medium", requirement: "credits_earned", target: 1000, rewardCredits: 250, orderIndex: 33 },
]

// ─── ACHIEVEMENTS ────────────────────────────────────────────

const ACHIEVEMENTS = [
  // Collection achievements (tier 1-4)
  { name: "Novice Collector", description: "Collect 10 tazos", icon: "Package", category: "collection", requirement: "collect_count", target: 10, tier: 1, orderIndex: 1 },
  { name: "Avid Collector", description: "Collect 50 tazos", icon: "Package", category: "collection", requirement: "collect_count", target: 50, tier: 2, orderIndex: 2 },
  { name: "Master Collector", description: "Collect 100 tazos", icon: "BookOpen", category: "collection", requirement: "collect_count", target: 100, tier: 3, orderIndex: 3 },
  { name: "Grand Archive", description: "Collect 200 tazos", icon: "Library", category: "collection", requirement: "collect_count", target: 200, tier: 4, orderIndex: 4 },

  // Battle achievements
  { name: "Rookie Fighter", description: "Win 5 battles", icon: "Swords", category: "battle", requirement: "battle_wins", target: 5, tier: 1, orderIndex: 10 },
  { name: "Battle Hardened", description: "Win 25 battles", icon: "Swords", category: "battle", requirement: "battle_wins", target: 25, tier: 2, orderIndex: 11 },
  { name: "Arena Champion", description: "Win 100 battles", icon: "Trophy", category: "battle", requirement: "battle_wins", target: 100, tier: 3, orderIndex: 12 },
  { name: "Battle Legend", description: "Win 500 battles", icon: "Crown", category: "battle", requirement: "battle_wins", target: 500, tier: 4, orderIndex: 13 },
  { name: "Sharpshooter", description: "Land 10 perfect throws", icon: "Crosshair", category: "battle", requirement: "perfect_throws", target: 10, tier: 1, orderIndex: 14 },
  { name: "Bullseye Master", description: "Land 100 perfect throws", icon: "Target", category: "battle", requirement: "perfect_throws", target: 100, tier: 3, orderIndex: 15 },

  // Credit achievements
  { name: "Pocket Change", description: "Earn 500 total credits", icon: "Coins", category: "general", requirement: "credits_earned", target: 500, tier: 1, orderIndex: 20 },
  { name: "Tazo Tycoon", description: "Earn 5000 total credits", icon: "Coins", category: "general", requirement: "credits_earned", target: 5000, tier: 2, orderIndex: 21 },
  { name: "Credit Mogul", description: "Earn 25000 total credits", icon: "Gem", category: "general", requirement: "credits_earned", target: 25000, tier: 3, orderIndex: 22 },

  // Deck achievements
  { name: "Deck Apprentice", description: "Create 3 battle decks", icon: "Layers", category: "general", requirement: "deck_count", target: 3, tier: 1, orderIndex: 30 },
  { name: "Deck Strategist", description: "Create 10 battle decks", icon: "LayoutGrid", category: "general", requirement: "deck_count", target: 10, tier: 2, orderIndex: 31 },

  // Bag achievements
  { name: "Snack Attack", description: "Open 10 bags", icon: "ShoppingBag", category: "general", requirement: "bag_count", target: 10, tier: 1, orderIndex: 40 },
  { name: "Bag Addict", description: "Open 100 bags", icon: "ShoppingBag", category: "general", requirement: "bag_count", target: 100, tier: 2, orderIndex: 41 },
  { name: "Ultra Rare Find", description: "Find an ultra-rare tazo in a bag", icon: "Sparkles", category: "collection", requirement: "bag_count", target: 1, tier: 3, orderIndex: 42 },
]

async function main() {
  console.log("🌱 Seeding quests + achievements...")

  // Clear existing
  await prisma.userQuest.deleteMany()
  await prisma.userAchievement.deleteMany()
  await prisma.quest.deleteMany()
  await prisma.achievement.deleteMany()

  // Insert quests
  let qi = 0
  for (const q of QUESTS) {
    await prisma.quest.create({ data: q })
    qi++
  }
  console.log(`  ✅ ${qi} quests seeded`)

  // Insert achievements
  let ai = 0
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.create({ data: a })
    ai++
  }
  console.log(`  ✅ ${ai} achievements seeded`)
  console.log("Done!")
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
