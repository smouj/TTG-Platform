# TTG Gameplay Rules — Canonical Reference

**Version**: 1.0
**Last updated**: 2026-06-21
**Applies to**: All game modes (Practice, AI, PvP Casual, PvP Ranked)

---

## 1. Core Rules

### Deck & Hand
- **Deck size**: Exactly 20 tazos
- **Starting hand**: 5 tazos drawn from the deck at match start
- **Draw per turn**: 1 tazo (drawn after resolving the turn)
- **Max hand size**: 10 (excess discarded)

### Match Flow
```
MATCH_INTRO → ROUND_INTRO → STAKE_PLAYER → STAKE_REVEAL →
AIM → CHARGE → THROW → PHYSICS → STAKE_RESULT →
DRAW → TURN_END → (repeat or MATCH_END)
```

### Turn Structure
1. **Stake Phase** — Each player places 1 tazo on the arena center
2. **Aim Phase** — Active player aims crosshair at opponent's staked tazo
3. **Charge Phase** — Player holds to charge slam power (max ~2 seconds)
4. **Throw Phase** — Player releases; tazo slams vertically from above
5. **Physics Phase** — Impact simulation: collision, bounce, spin, flip
6. **Capture Phase** — Flipped tazos change ownership
7. **Draw Phase** — Each player draws 1 tazo (if deck not empty)
8. **End Turn** — Switch active player

### Vertical Slam Mechanic
- Tazo drops from above the arena center
- **Aim**: Control X/Z landing position with crosshair
- **Charge**: Hold to build power; release to slam
- **Impact**: Tazo hits staked discs below; physics determine flips
- **Capture**: Any tazo that flips face-down changes sides

---

## 2. Win Conditions

### Elimination Victory
All opponent tazos are captured (none left in hand or staked on arena).

### Points Victory
At round limit (configurable, default 15), the player with more captured tazos wins.

### Draw
Equal captures at round limit → draw.

### Forfeit
Player manually forfeits.

---

## 3. Tazo Stats (9 Combat Stats)

Each tazo has 9 stats on a 1-10 scale:

| Stat | Effect |
|------|--------|
| **Attack** | Slam impact force |
| **Defense** | Resistance to being flipped |
| **Resistance** | Durability against repeated hits |
| **Weight** | Heavier = harder to flip, harder to launch |
| **Stability** | Wobble recovery speed |
| **Spin** | Rotational force on impact |
| **Control** | Aim precision modifier |
| **Bounce** | Rebound elasticity |
| **Precision** | Landing accuracy bonus |

---

## 4. Arenas

| Arena | Gravity | Friction | Special |
|-------|---------|----------|---------|
| **Default** | 9.8 m/s² | 0.4 | Balanced |
| **Lava Pit** | 7.5 m/s² | 0.2 | Low gravity, chaotic |
| **Crystal Cave** | 9.8 m/s² | 0.6 | High friction, precision |
| **Zero-G** | 2.0 m/s² | 0.05 | Microgravity, huge |

Arena choice affects:
- Slam trajectory (gravity)
- Disc sliding after landing (friction)
- Wobble duration
- Visual theme (floor color, pillars, background)

---

## 5. AI Difficulty

| Difficulty | Strategy | Description |
|-----------|----------|-------------|
| **Novice** | Chaotic | Random bets, wild slams |
| **Skilled** | Balanced | Adaptive, moderate precision |
| **Master** | Aggressive → Defensive | Adapts based on score gap |

AI adapts mid-match: if behind, goes aggressive. If ahead, stays defensive.

---

## 6. Economy

### CREDITS
- Earned: 10 per battle win (max 10 wins/day), 25 daily bonus, 5×20 from rewarded ads
- Spent: 100 CREDITS per tazo bag

### Bags
- Each bag contains 1 random tazo from any series
- Welcome: 30 free bags + 100 CREDITS for new accounts
- Rarity distribution: Common 60%, Uncommon 25%, Rare 12%, Ultra Rare 3%

---

## 7. Collections

3 series, 139 published tazos (150 planned):

| Series | Published | Theme |
|--------|-----------|-------|
| **Minimon** 🟢 | 50 | Nature creatures from Luminara |
| **Dracobell** 🟠 | 45 | Martial fighters from Bellora |
| **Cybermon** 🔵 | 44 | Digital monsters from Neon Grid |

---

## 8. PvP

- WebSocket-based real-time battles
- Both players must have 20-tazo decks
- Turn-based: each player takes turns slamming
- Server-authoritative physics for fairness
- Disconnect = forfeit after 30s timeout

---

## 9. Anti-Cheat

- Server validates all actions
- Physics simulation runs server-side for PvP
- Rate limiting on all API endpoints
- Deck validation before match start
