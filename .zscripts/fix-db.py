import sqlite3
from datetime import datetime, timezone

db = sqlite3.connect("/home/smouj/apps/ttg/Trading-Tazos-Game/prisma/dev.db")
now = datetime.now(timezone.utc).isoformat()

# Drop and recreate Quest
db.execute("DROP TABLE IF EXISTS Quest")
db.execute("""
CREATE TABLE Quest (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT "Target",
    category TEXT NOT NULL DEFAULT "daily",
    difficulty TEXT NOT NULL DEFAULT "easy",
    requirement TEXT NOT NULL DEFAULT "",
    target INTEGER NOT NULL DEFAULT 1,
    rewardCredits INTEGER NOT NULL DEFAULT 50,
    rewardTazoId TEXT,
    isActive INTEGER NOT NULL DEFAULT 1,
    orderIndex INTEGER NOT NULL DEFAULT 0,
    expiresAt TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
)
""")

QUESTS = [
    ("quest-1", "First Steps", "Win your first battle", "Swords", "beginner", "easy", "win_battles", 1, 100, None, 1, 1),
    ("quest-2", "Getting Stronger", "Win 10 battles", "Swords", "daily", "medium", "win_battles", 10, 200, None, 1, 4),
    ("quest-3", "Battle Veteran", "Win 50 battles", "Swords", "special", "hard", "win_battles", 50, 500, None, 1, 7),
    ("quest-4", "Tazo Collector", "Own 10 tazos", "Package", "beginner", "easy", "own_tazos", 10, 50, None, 1, 2),
    ("quest-5", "Tazo Hunter", "Own 50 tazos", "Package", "daily", "medium", "own_tazos", 50, 150, None, 1, 5),
    ("quest-6", "Tazo Master", "Own 200 tazos", "Package", "special", "hard", "own_tazos", 200, 500, None, 1, 8),
    ("quest-7", "Bag Opener", "Open 5 bags", "ShoppingBag", "daily", "easy", "open_bags", 5, 150, None, 1, 3),
    ("quest-8", "Big Spender", "Spend 500 credits in shop", "Coins", "daily", "medium", "spend_credits", 500, 100, None, 1, 6),
    ("quest-9", "Perfect Throw", "Land perfect throws 3 times", "Crosshair", "daily", "medium", "perfect_throws", 3, 200, None, 1, 9),
    ("quest-10", "Sharpshooter", "Land perfect throws 15 times", "Crosshair", "weekly", "hard", "perfect_throws", 15, 400, None, 1, 13),
    ("quest-11", "Deck Builder", "Create 3 custom decks", "Layers", "weekly", "medium", "create_decks", 3, 150, None, 1, 10),
    ("quest-12", "Weekly Warrior", "Win 20 battles this week", "Trophy", "weekly", "medium", "win_battles_weekly", 20, 300, None, 1, 11),
    ("quest-13", "Collectionist", "Complete one franchise collection", "Star", "weekly", "hard", "complete_franchise", 1, 400, None, 1, 12),
    ("quest-14", "Play 3 Days", "Log in 3 different days", "Calendar", "weekly", "easy", "login_days", 3, 100, None, 1, 14),
    ("quest-15", "All Stars", "Win a battle with all 9 stats above 60", "Sparkles", "special", "hard", "high_stat_battle", 1, 300, None, 1, 15),
    ("quest-16", "Perfectionist", "Complete all beginner quests", "Trophy", "special", "medium", "category_complete", 1, 250, None, 1, 16),
    ("quest-17", "Grand Tazo Master", "Own every single tazo in the game", "Sparkles", "special", "hard", "own_all", 319, 1000, None, 1, 17),
]

for q in QUESTS:
    db.execute(
        "INSERT INTO Quest (id, title, description, icon, category, difficulty, requirement, target, rewardCredits, rewardTazoId, isActive, orderIndex, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (*q, now, now))

# Drop and recreate Achievement with Int tier
db.execute("DROP TABLE IF EXISTS Achievement")
db.execute("""
CREATE TABLE Achievement (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT "Trophy",
    category TEXT NOT NULL DEFAULT "collection",
    requirement TEXT NOT NULL DEFAULT "",
    target INTEGER NOT NULL DEFAULT 1,
    tier INTEGER NOT NULL DEFAULT 1,
    orderIndex INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
)
""")

ACHIEVEMENTS = [
    ("ach-1", "First Win", "Win your first battle", "Swords", "battle", "win_battles", 1, 1, 1),
    ("ach-2", "Rising Star", "Win 10 battles", "Swords", "battle", "win_battles", 10, 2, 2),
    ("ach-3", "Battle Master", "Win 50 battles", "Swords", "battle", "win_battles", 50, 3, 3),
    ("ach-4", "Battle Legend", "Win 200 battles", "Swords", "battle", "win_battles", 200, 4, 4),
    ("ach-5", "New Collector", "Collect 5 tazos", "Package", "collection", "own_tazos", 5, 1, 5),
    ("ach-6", "Growing Album", "Collect 25 tazos", "Package", "collection", "own_tazos", 25, 1, 6),
    ("ach-7", "Tazo Expert", "Collect 100 tazos", "Package", "collection", "own_tazos", 100, 2, 7),
    ("ach-8", "Tazo Champion", "Collect 250 tazos", "Package", "collection", "own_tazos", 250, 3, 8),
    ("ach-9", "Complete Album", "Collect all 319 tazos", "Package", "collection", "own_tazos", 319, 4, 9),
    ("ach-10", "Bag Beginner", "Open 1 bag", "ShoppingBag", "shop", "open_bags", 1, 1, 10),
    ("ach-11", "Bag Enthusiast", "Open 10 bags", "ShoppingBag", "shop", "open_bags", 10, 2, 11),
    ("ach-12", "Big Opener", "Open 50 bags", "ShoppingBag", "shop", "open_bags", 50, 3, 12),
    ("ach-13", "Sharpshooter", "Land 10 perfect throws", "Crosshair", "skill", "perfect_throws", 10, 2, 13),
    ("ach-14", "Minimon Fan", "Collect all Minimon tazos", "Zap", "franchise", "complete_minimon", 51, 3, 15),
    ("ach-15", "Draco Bell Fan", "Collect all Draco Bell tazos", "Star", "franchise", "complete_dracobell", 118, 3, 16),
    ("ach-16", "Cybermon Fan", "Collect all Cybermon tazos", "Sparkles", "franchise", "complete_cybermon", 150, 3, 17),
    ("ach-17", "Deck Architect", "Create all 5 deck slots", "Layers", "deck", "create_decks", 5, 2, 14),
    ("ach-18", "Fortune Builder", "Accumulate 2000 credits", "Coins", "economy", "accumulate_credits", 2000, 2, 18),
]

for a in ACHIEVEMENTS:
    db.execute(
        "INSERT INTO Achievement (id, name, description, icon, category, requirement, target, tier, orderIndex, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        a + (now,))

db.commit()

print(f"Quests inserted: {db.execute('SELECT COUNT(*) FROM Quest').fetchone()[0]}")
print(f"Achievements inserted: {db.execute('SELECT COUNT(*) FROM Achievement').fetchone()[0]}")
db.close()
