// POST /api/bags/open — Open a purchased bag and reveal the tazo
import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { generateTGAGrade } from "@/lib/grading/tga"
import { refreshUserProgress } from "@/lib/progression"

// Randomize stats within ±20% of base values
function randomizeStat(base: number): number {
  const variance = Math.floor(base * 0.2)
  const min = Math.max(10, base - variance)
  const max = Math.min(99, base + variance)
  return min + Math.floor(Math.random() * (max - min + 1))
}

// Pick a random finish weighted by rarity
function randomFinish(rarity: string): string {
  const commonFinishes = ["normal", "matte", "glossy"]
  const uncommonFinishes = [...commonFinishes, "holo", "reverse_holo", "glitter"]
  const rareFinishes = [...uncommonFinishes, "foil", "prismatic", "stardust", "cracked_ice"]
  const ultraFinishes = [...rareFinishes, "metallic", "chrome", "aurora", "oil_slick"]
  const legendFinishes = [...ultraFinishes, "gold", "rainbow", "lenticular", "pearlescent"]

  const pool = rarity === "legendary" ? legendFinishes
    : rarity === "ultra-rare" ? ultraFinishes
    : rarity === "rare" ? rareFinishes
    : rarity === "uncommon" ? uncommonFinishes
    : commonFinishes

  return pool[Math.floor(Math.random() * pool.length)]
}

/** Validate and clean a single bag ID */
function cleanId(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  const trimmed = raw.trim()
  if (trimmed.length === 0 || trimmed === "undefined" || trimmed === "null") return null
  return trimmed
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request.headers, "write")
  if (!rl.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } })
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { bagId, bagIds } = await request.json().catch(() => ({}))

    // Build clean ID list
    const rawIds: unknown[] = bagIds && Array.isArray(bagIds) && bagIds.length > 0
      ? bagIds
      : bagId !== undefined && bagId !== null ? [bagId] : []

    const ids = rawIds.map(cleanId).filter((id): id is string => id !== null)

    if (ids.length === 0) {
      return NextResponse.json({ error: "bagId or bagIds required" }, { status: 400 })
    }
    const isBulk = ids.length > 1

    if (isBulk) {
      // ── BULK OPEN ────────────────────────
      const results: any[] = []
      for (const id of ids) {
        try {
          // Pre-fetch needed data outside transaction
          const purchase = await db.bagPurchase.findUnique({ where: { id } })
          if (!purchase || purchase.userId !== user.id) continue
          if (purchase.opened) continue
          if (!purchase.tazoId) continue

          const tazo = await db.tazo.findUnique({
            where: { id: purchase.tazoId },
            include: { franchise: { select: { name: true, slug: true, color: true } } },
          })
          if (!tazo) continue

          // Atomic: upsert + instance + mark opened in one transaction
          const obtainedFrom = purchase.bagType === "welcome" ? "starter" : "bag"
          const finish = randomFinish(tazo.rarity || "common")
          const tgaGrade = generateTGAGrade(tazo.rarity || "common", finish)

          const [instance] = await db.$transaction(async (tx) => {
            // Re-check not already opened
            const fresh = await tx.bagPurchase.findUnique({ where: { id } })
            if (!fresh || fresh.opened) throw new Error("Bag already opened")

            const userTazo = await tx.userTazo.upsert({
              where: { userId_tazoId: { userId: user.id, tazoId: tazo.id } },
              create: { userId: user.id, tazoId: tazo.id, quantity: 1, obtainedFrom },
              update: { quantity: { increment: 1 } },
            })

            const inst = await tx.tazoInstance.create({
              data: {
                userTazoId: userTazo.id, userId: user.id, tazoId: tazo.id,
                attack: randomizeStat(tazo.attack), defense: randomizeStat(tazo.defense),
                resistance: randomizeStat(tazo.resistance), weight: randomizeStat(tazo.weight),
                stability: randomizeStat(tazo.stability), spin: randomizeStat(tazo.spin),
                control: randomizeStat(tazo.control), bounce: randomizeStat(tazo.bounce),
                precision: randomizeStat(tazo.precision),
                finish, creatureVariant: tazo.creatureVariant || "standard", isNew: true,
                tgaTier: tgaGrade.tier, tgaGrade: tgaGrade.grade,
                tgaSurface: tgaGrade.surface, tgaBorders: tgaGrade.borders,
                tgaCertNumber: tgaGrade.certNumber,
              },
            })

            await tx.tazo.update({ where: { id: tazo.id }, data: { isOwned: true } })
            await tx.bagPurchase.update({ where: { id }, data: { opened: true } })

            return [inst]
          })

          results.push({
            tazo: { ...tazo, instanceId: instance.id, finish: instance.finish, creatureVariant: instance.creatureVariant,
              attack: instance.attack, defense: instance.defense, resistance: instance.resistance,
              weight: instance.weight, stability: instance.stability, spin: instance.spin,
              control: instance.control, bounce: instance.bounce, precision: instance.precision },
            ownedBefore: false,
          })
        } catch (_) { /* skip individual errors */ }
      }
      return NextResponse.json({ success: true, results, totalOpened: results.length })
    }

    const singleId = ids[0]

    const purchase = await db.bagPurchase.findUnique({
      where: { id: singleId },
    })

    if (!purchase || purchase.userId !== user.id) {
      return NextResponse.json({ error: "Bag not found" }, { status: 404 })
    }

    if (purchase.opened) {
      return NextResponse.json({ error: "Bag already opened" }, { status: 400 })
    }

    if (!purchase.tazoId) {
      return NextResponse.json({ error: "Bag is empty" }, { status: 500 })
    }

    // Get the revealed tazo
    const tazo = await db.tazo.findUnique({
      where: { id: purchase.tazoId },
      include: { franchise: { select: { name: true, slug: true, color: true } } },
    })

    if (!tazo) {
      return NextResponse.json({ error: "Tazo not found" }, { status: 500 })
    }

    // Auto-mark tazo as owned + add to user collection
    // Atomic open: upsert + instance + mark opened in one transaction
    const obtainedFrom = purchase.bagType === "welcome" ? "starter" : "bag"
    const finish = randomFinish(tazo.rarity || "common")
    const tgaGrade = generateTGAGrade(tazo.rarity || "common", finish)

    const [userTazo, instance] = await db.$transaction(async (tx) => {
      // Re-check not already opened inside tx (prevents race condition)
      const fresh = await tx.bagPurchase.findUnique({ where: { id: singleId } })
      if (!fresh || fresh.opened) throw new Error("Bag already opened")

      const ut = await tx.userTazo.upsert({
        where: { userId_tazoId: { userId: user.id, tazoId: tazo.id } },
        create: { userId: user.id, tazoId: tazo.id, quantity: 1, obtainedFrom },
        update: { quantity: { increment: 1 } },
      })

      const inst = await tx.tazoInstance.create({
        data: {
          userTazoId: ut.id, userId: user.id, tazoId: tazo.id,
          attack: randomizeStat(tazo.attack), defense: randomizeStat(tazo.defense),
          resistance: randomizeStat(tazo.resistance), weight: randomizeStat(tazo.weight),
          stability: randomizeStat(tazo.stability), spin: randomizeStat(tazo.spin),
          control: randomizeStat(tazo.control), bounce: randomizeStat(tazo.bounce),
          precision: randomizeStat(tazo.precision),
          finish, creatureVariant: tazo.creatureVariant || "standard", isNew: true,
          tgaTier: tgaGrade.tier, tgaGrade: tgaGrade.grade,
          tgaSurface: tgaGrade.surface, tgaBorders: tgaGrade.borders,
          tgaCertNumber: tgaGrade.certNumber,
        },
      })

      await tx.tazo.update({ where: { id: tazo.id }, data: { isOwned: true } })
      await tx.bagPurchase.update({ where: { id: singleId }, data: { opened: true } })

      return [ut, inst]
    })

    // Handle bonus tazo
    let bonusTazo: typeof tazo | null = null
    if (purchase.bonusTazo) {
      bonusTazo = await db.tazo.findUnique({
        where: { id: purchase.bonusTazo },
        include: { franchise: { select: { name: true, slug: true, color: true } } },
      })
      if (bonusTazo) {
        const bFinish = randomFinish(bonusTazo.rarity || "common")
        const bTgaGrade = generateTGAGrade(bonusTazo.rarity || "common", bFinish)
        await db.$transaction(async (tx) => {
          const bUserTazo = await tx.userTazo.upsert({
            where: { userId_tazoId: { userId: user.id, tazoId: bonusTazo!.id } },
            create: { userId: user.id, tazoId: bonusTazo!.id, quantity: 1, obtainedFrom },
            update: { quantity: { increment: 1 } },
          })
          await tx.tazoInstance.create({
            data: {
              userTazoId: bUserTazo.id, userId: user.id, tazoId: bonusTazo!.id,
              attack: randomizeStat(bonusTazo!.attack),
              defense: randomizeStat(bonusTazo!.defense),
              resistance: randomizeStat(bonusTazo!.resistance),
              weight: randomizeStat(bonusTazo!.weight),
              stability: randomizeStat(bonusTazo!.stability),
              spin: randomizeStat(bonusTazo!.spin),
              control: randomizeStat(bonusTazo!.control),
              bounce: randomizeStat(bonusTazo!.bounce),
              precision: randomizeStat(bonusTazo!.precision),
              finish: bFinish,
              creatureVariant: bonusTazo!.creatureVariant || "standard",
              isNew: true,
              tgaTier: bTgaGrade.tier, tgaGrade: bTgaGrade.grade,
              tgaSurface: bTgaGrade.surface, tgaBorders: bTgaGrade.borders,
              tgaCertNumber: bTgaGrade.certNumber,
            },
          })
        })
      }
    }

    await refreshUserProgress(user.id)

    return NextResponse.json({
      tazo: {
        id: tazo.id,
        instanceId: instance.id,
        name: tazo.name,
        displayName: tazo.displayName || tazo.name,
        slug: tazo.slug,
        number: tazo.number,
        franchise: tazo.franchise?.slug || tazo.franchise,
        franchiseName: tazo.franchise?.name || null,
        franchiseSlug: tazo.franchise?.slug || null,
        imageUrl: tazo.imageUrl,
        shinyImageUrl: tazo.shinyImageUrl,
        finish: instance.finish,
        creatureVariant: instance.creatureVariant,
        rarity: tazo.rarity,
        attack: instance.attack,
        defense: instance.defense,
        resistance: instance.resistance,
        weight: instance.weight,
        stability: instance.stability,
        spin: instance.spin,
        control: instance.control,
        bounce: instance.bounce,
        precision: instance.precision,
        role: tazo.role,
        isNew: true,
        tgaGrade: tgaGrade.grade,
        tgaTier: tgaGrade.tier,
      },
      bonusTazo: bonusTazo ? {
        id: bonusTazo.id,
        name: bonusTazo.name,
        displayName: bonusTazo.displayName || bonusTazo.name,
        franchise: bonusTazo.franchise,
        rarity: bonusTazo.rarity,
      } : null,
      isBonus: !!bonusTazo,
    })
  } catch (error) {
    console.error("Bag open error:", error)
    return NextResponse.json({ error: "Failed to open bag" }, { status: 500 })
  }
}
