#!/usr/bin/env python3
"""
Master Tazo Generator — generates 150 tazo definitions as JSON (Season 1).
Output: scripts/all-tazos.json
"""

import json, hashlib, os

MINIMON_TARGET = 61
DRACOBELL_TARGET = 128
CYBERMON_TARGET = 160

# ── Name components ──
MINIMON_PREFIXES = ["Lumi","Pyro","Aqua","Terra","Zephy","Flora","Glaci","Noct","Auro","Bolt",
    "Volt","Gravi","Cinder","Mysto","Verda","Frost","Sand","Nova","Crag","Venom",
    "Luna","Storm","Puddle","Thorn","Ember","Gale","Shiver","Blaze","Magne","Sprout",
    "Dusk","Boulder","Spar","Tidal","Flint","Iron","Vaper","Mud","Sky","Quill",
    "Coral","Wisp","Talon","Pebble","Myco","Aether","Snap","Glimmer","Hollow","Chill",
    "Bramble","Sun","Muddy","Cloud","Razor","Prism","Tremor","Breeze","Void","Puffer","Grasp"]
MINIMON_SUFFIXES = ["puff","kit","fin","don","rix","mora","pod","urna","ling","shroud",
    "bright","shell","mist","beak","hop","hide","spire","fang","tusk","moth",
    "claw","xis","mist","spark","petal","nox","slide","sheer","spike","lith",
    "flare","tide","skip","moss","wing","jaw","min","raze","coil","hog",
    "scorch","puppy","keep","leaf","mite","scale","zeta","crest","ling","nut",
    "horn","flame","shade","petal","strike","coil","talon"]

DRACOBELL_PREFIXES = ["Kaji","Sora","Tetsu","Mizu","Riku","Hikaru","Ikari","Kaze","Koori","Yami",
    "Buru","Denki","Kumo","Hone","Tsuki","Honoo","Kenshi","Jishin","Raijin","Nendo",
    "Nensho","Hoshi","Tsubasa","Yoroi","Suisei","Tokage","Kinzoku","Shinku","Byakko","Hebi",
    "Kuroku","Taiyo","Shippu","Rensa","Kiba","Yugure","Arashi","Genshi","Hagane","Atsui",
    "Genki","Kaen","Jiku","Kodai","Maboro","Seirei","Ryuujin","Chikara","Hayate","Shizuka",
    "Tatakai","Hibana","Kyojin","Reikan","Saiho","Tenku","Daichi","Kasai","Mugen","Shin'en",
    "Kodoku","Mezame","Kusari","Hakai","Akuma","Seijin","Kessho","Yajuu","Umi","Kiri",
    "Toge","Jigen","Enmu","Rekka","Roshi","Kami","Arata","Kyofu"]
DRACOBELL_LABELS = ["Flame","Tide","Iron","Wave","Stone","Light","Rage","Wind","Frost","Shadow",
    "Force","Shock","Cloud","Bone","Moon","Blaze","Sword","Quake","Storm","Clay",
    "Burn","Star","Wing","Armor","Comet","Lizard","Metal","Void","Tiger","Snake",
    "Black","Sun","Gale","Chain","Fang","Dusk","Tempest","Atom","Steel","Heat",
    "Spirit","Inferno","Warp","Ancient","Illusion","Sprite","Dragon","Power","Swift","Calm",
    "Battle","Spark","Giant","Aura","Cell","Sky","Earth","Firestorm","Infinite","Abyss",
    "Lone","Awaken","Lock","Destroy","Demon","Sage","Crystal","Beast","Ocean","Mist",
    "Thorn","Dimension","Dream","Blaze","Master","Divine","New","Fear"]

CYBERMON_PREFIXES = ["Data","Neural","Quantum","Binary","Digital","Vector","Synth","Logic","Cypher",
    "Mecha","Techno","Cyber","Hexa","Omni","Ultra","Nano","Hyper","Proto","Meta",
    "Alpha","Beta","Gamma","Delta","Sigma","Omega","Zeta","Kappa","Theta","Epsilon",
    "Lambda","Rho","Tau","Phi","Chi","Psi","Nova","Pulse","Flux","Glyph",
    "Cache","Stack","Queue","Array","Hash","Crypto","Nexus","Matrix","Voxel","Wired",
    "Photon","Plasma","Ion","Fusion","Fission","Entropy","Singular","Aether","Vanta","Prism"]
CYBERMON_SUFFIXES = ["tron","byte","droid","ware","bot","net","code","link","grid","node",
    "core","chip","drive","cast","pulse","hub","flux","tek","scan","sync",
    "shift","forge","mesh","vault","gate","key","lock","beam","wave","sphere",
    "forge","cast","morph","type","form","line","path","port","plex","stack"]

RARITY_POOL = ["common"]*15 + ["uncommon"]*12 + ["rare"]*8 + ["ultra"]*4 + ["legendary"]*1
ROLES = ["attacker","tank","technical","bouncer","light","heavy","balanced","special"]

SKILLS = {
    "attacker": [
        ["Power Strike","Deals +20 damage"],
        ["Critical Edge","Increased critical hit chance"],
        ["Berserker Mode","+15 attack, -10 defense"],
        ["Rampage","Attacks twice this turn"],
        ["Finishing Blow","Deals 2x damage to targets below 50% HP"],
    ],
    "tank": [
        ["Iron Wall","+30 defense for 2 turns"],
        ["Fortress","Reduces all incoming damage by 50%"],
        ["Last Stand","Survives with 1 HP from fatal attack"],
        ["Guardian Barrier","Protects all allies for 1 turn"],
        ["Stone Skin","Becomes immune to knockback"],
    ],
    "technical": [
        ["Precision Shot","Next attack cannot miss"],
        ["Stat Swap","Swaps attack and defense with enemy"],
        ["Energy Drain","Steals 10 spin from enemy"],
        ["Gravity Lock","Enemy cannot move next turn"],
        ["Disable","Negates enemy's next skill"],
    ],
    "bouncer": [
        ["Ricochet","Bounces between 3 enemies"],
        ["Spring Load","Next bounce deals double damage"],
        ["Airborne","Avoids all ground-based attacks"],
        ["Rebound","Redirects incoming attack at enemy"],
        ["Pinball","Gains speed with each bounce"],
    ],
    "light": [
        ["Quick Dodge","100% dodge next attack"],
        ["Speed Boost","+30 spin for 3 turns"],
        ["Wind Walker","Moves first regardless of speed"],
        ["Flash Step","Instant reposition to any spot"],
        ["Nimble","Reduces damage by 20% from heavy tazos"],
    ],
    "heavy": [
        ["Crushing Slam","Deals bonus damage based on weight"],
        ["Unstoppable","Cannot be pushed or displaced"],
        ["Earth Shatter","AoE damage around impact point"],
        ["Titan's Grip","Holds enemy in place"],
        ["Avalanche","Gains power while moving forward"],
    ],
    "balanced": [
        ["All-Rounder","+5 to all stats for 3 turns"],
        ["Adapt","Copies enemy's highest stat"],
        ["Flow State","Enters a perfect balance trance"],
        ["Harmony","Heals self for 15 HP"],
        ["Steady Pulse","Consistent damage with no RNG"],
    ],
    "special": [
        ["Chaos Zone","Randomizes all enemy positions"],
        ["Mind Control","Enemy attacks their ally"],
        ["Time Freeze","All enemies skip next turn"],
        ["Reality Warp","Swaps arena terrain"],
        ["Ultimate Sacrifice","Deals massive damage to all"],
    ],
}

def stable_hash(s):
    return int(hashlib.md5(s.encode()).hexdigest()[:8], 16)

def make_stats(seed):
    return {
        "attack": 30 + stable_hash(f"{seed}-atk") % 55,
        "defense": 25 + stable_hash(f"{seed}-def") % 55,
        "resistance": 25 + stable_hash(f"{seed}-res") % 50,
        "weight": 10 + stable_hash(f"{seed}-wt") % 65,
        "stability": 20 + stable_hash(f"{seed}-stab") % 50,
        "spin": 15 + stable_hash(f"{seed}-spin") % 65,
        "control": 20 + stable_hash(f"{seed}-ctrl") % 55,
        "bounce": 10 + stable_hash(f"{seed}-bnc") % 70,
        "precision": 20 + stable_hash(f"{seed}-prec") % 55,
    }

def make_tazo(seed, franchise, rarity_pool=RARITY_POOL):
    h = stable_hash(seed)
    rarity = rarity_pool[h % len(rarity_pool)]
    role = ROLES[h % len(ROLES)]
    skill_list = SKILLS.get(role, SKILLS["balanced"])
    skill = skill_list[(h // 8) % len(skill_list)]
    return {
        "rarity": rarity, "role": role,
        "stats": make_stats(seed),
        "skill": skill[0], "skillDesc": skill[1],
        "category": "tazos",
    }

# ── Existing tazos (hardcoded, must not be overwritten) ──
EXISTING_SLUGS = {
    "lumipuff", "pyrokit", "aquafin", "terradon", "zephyrix", "floramora",
    "glacipod", "nocturna", "aurorix", "boltling",
    "kaji-flame", "sora-tide", "tetsu-iron", "mizu-wave", "riku-stone",
    "hikaru-light", "ikari-rage", "kaze-wind", "koori-frost", "yami-shadow",
    "dracobell-sv-11",
    "datadrake", "circuitron", "neurabyte", "pixelisk", "glitchorb",
    "cipherion", "mainframe", "debugger", "firewall", "kerneloid",
}

def generate():
    tazos = []
    seen = set()

    def add(tazo):
        if tazo["slug"] not in seen:
            seen.add(tazo["slug"])
            tazos.append(tazo)

    # ── Minimon (61) ──
    for i in range(MINIMON_TARGET):
        pre = MINIMON_PREFIXES[stable_hash(f"min-{i}-pre") % len(MINIMON_PREFIXES)]
        suf = MINIMON_SUFFIXES[stable_hash(f"min-{i}-suf") % len(MINIMON_SUFFIXES)]
        name = pre + suf.capitalize()
        slug = name.lower()
        if slug in EXISTING_SLUGS:
            # Skip existing — will be registered separately
            continue
        t = make_tazo(f"minimon-{i}", "minimon")
        t["name"] = name
        t["displayName"] = name
        t["slug"] = slug
        t["franchise"] = "minimon"
        add(t)

    # ── Dracobell (128) ──
    for i in range(DRACOBELL_TARGET):
        pre = DRACOBELL_PREFIXES[stable_hash(f"dra-{i}-pre") % len(DRACOBELL_PREFIXES)]
        lab = DRACOBELL_LABELS[stable_hash(f"dra-{i}-lab") % len(DRACOBELL_LABELS)]
        name = f"{pre} {lab}"
        slug = name.lower().replace(" ", "-")
        if slug in EXISTING_SLUGS:
            continue
        t = make_tazo(f"dracobell-{i}", "dracobell")
        t["name"] = name
        t["displayName"] = name
        t["slug"] = slug
        t["franchise"] = "dracobell"
        add(t)

    # ── Cybermon (160) ──
    for i in range(CYBERMON_TARGET):
        pre = CYBERMON_PREFIXES[stable_hash(f"cyb-{i}-pre") % len(CYBERMON_PREFIXES)]
        suf = CYBERMON_SUFFIXES[stable_hash(f"cyb-{i}-suf") % len(CYBERMON_SUFFIXES)]
        name = pre + suf.capitalize()
        slug = name.lower()
        if slug in EXISTING_SLUGS:
            continue
        t = make_tazo(f"cybermon-{i}", "cybermon")
        t["name"] = name
        t["displayName"] = name
        t["slug"] = slug
        t["franchise"] = "cybermon"
        add(t)

    return tazos

if __name__ == "__main__":
    tazos = generate()
    counts = {}
    rare_counts = {}
    for t in tazos:
        counts[t["franchise"]] = counts.get(t["franchise"], 0) + 1
        key = f"{t['franchise']}/{t['rarity']}"
        rare_counts[key] = rare_counts.get(key, 0) + 1

    print(f"\n📊 Generated: {len(tazos)} tazos")
    for fr in ["minimon","dracobell","cybermon"]:
        print(f"  {fr}: {counts.get(fr, 0)}")
        for r in ["common","uncommon","rare","ultra","legendary"]:
            c = rare_counts.get(f"{fr}/{r}", 0)
            if c > 0:
                print(f"    {r}: {c}")

    out = "scripts/all-tazos.json"
    with open(out, "w") as f:
        json.dump(tazos, f, indent=2)
    print(f"\n✅ Saved to {out} ({len(tazos)} tazos)")

    # Save stats for reference
    stat_path = "scripts/tazo-counts.json"
    with open(stat_path, "w") as f:
        json.dump({"total": len(tazos), "byFranchise": counts, "byRarity": rare_counts}, f, indent=2)
    print(f"✅ Stats saved to {stat_path}")
