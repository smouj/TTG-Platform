-- ============================================================
-- Demo User SQL Seed for Trading Tazos Game
-- Run on VPS: sqlite3 prisma/dev.db < scripts/seed-demo.sql
-- ============================================================

-- Remove existing demo user if present
DELETE FROM UserTazo WHERE userId = (SELECT id FROM User WHERE email = 'demo@tradingtazosgame.com');
DELETE FROM DeckTazo WHERE deckId IN (SELECT id FROM Deck WHERE userId = (SELECT id FROM User WHERE email = 'demo@tradingtazosgame.com'));
DELETE FROM Deck WHERE userId = (SELECT id FROM User WHERE email = 'demo@tradingtazosgame.com');
DELETE FROM CreditTransaction WHERE userId = (SELECT id FROM User WHERE email = 'demo@tradingtazosgame.com');
DELETE FROM BattleRecord WHERE userId = (SELECT id FROM User WHERE email = 'demo@tradingtazosgame.com');
DELETE FROM UserQuest WHERE userId = (SELECT id FROM User WHERE email = 'demo@tradingtazosgame.com');
DELETE FROM UserAchievement WHERE userId = (SELECT id FROM User WHERE email = 'demo@tradingtazosgame.com');
DELETE FROM User WHERE email = 'demo@tradingtazosgame.com';

-- Create demo user
INSERT INTO User (id, email, passwordHash, name, credits, emailVerified, createdAt, updatedAt)
VALUES (
  'demo_user_001',
  'demo@tradingtazosgame.com',
  '$scrypt$03OsaUFKID8lV9HhBjKs-MiBU_WM9TMzbsHBy0NQAQw$5-V5Qtt4kvpUoChG1q0aEU2vb8REJsJjU9dHdYcrypYoIAapS-0SVqDinMpXwiDyC27_GrD8ckiu_yw8TpSw8w',
  'DemoTrainer',
  2500,
  1,
  datetime('now'),
  datetime('now')
);

-- Give them 30 tazos (10 from each franchise, avoiding existing user's tazos)
INSERT INTO UserTazo (id, userId, tazoId, quantity, obtainedFrom, acquiredAt)
SELECT
  'ut_demo_' || t.id,
  'demo_user_001',
  t.id,
  1,
  'starter',
  datetime('now')
FROM (
  SELECT id FROM Tazo WHERE publishStatus = 'published'
  ORDER BY id ASC
  LIMIT 30
) t
WHERE NOT EXISTS (
  SELECT 1 FROM UserTazo WHERE userId = 'demo_user_001' AND tazoId = t.id
);

-- Create a deck with first 5 assigned tazos
INSERT INTO Deck (id, userId, name, isActive, createdAt, updatedAt)
VALUES ('deck_demo_001', 'demo_user_001', 'Demo Deck', 1, datetime('now'), datetime('now'));

INSERT INTO DeckTazo (id, deckId, tazoId)
SELECT
  'dt_demo_' || t.id,
  'deck_demo_001',
  t.id
FROM (
  SELECT id FROM Tazo WHERE publishStatus = 'published'
  ORDER BY id ASC
  LIMIT 5
) t;

-- Add credit transaction
INSERT INTO CreditTransaction (id, userId, amount, source, reference, createdAt)
VALUES ('ct_demo_seed', 'demo_user_001', 2500, 'admin', 'demo_seed', datetime('now'));

-- Add a battle record
INSERT INTO BattleRecord (id, userId, playerTazos, opponentTazos, winner, createdAt)
SELECT
  'br_demo_001',
  'demo_user_001',
  json_array(t1.id, t2.id, t3.id),
  json_array(t4.id, t5.id),
  'player',
  datetime('now', '-1 hour')
FROM
  (SELECT id FROM Tazo WHERE publishStatus = 'published' ORDER BY id LIMIT 1 OFFSET 0) t1,
  (SELECT id FROM Tazo WHERE publishStatus = 'published' ORDER BY id LIMIT 1 OFFSET 1) t2,
  (SELECT id FROM Tazo WHERE publishStatus = 'published' ORDER BY id LIMIT 1 OFFSET 2) t3,
  (SELECT id FROM Tazo WHERE publishStatus = 'published' ORDER BY id LIMIT 1 OFFSET 3) t4,
  (SELECT id FROM Tazo WHERE publishStatus = 'published' ORDER BY id LIMIT 1 OFFSET 4) t5;
