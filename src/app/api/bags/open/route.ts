// POST /api/bags/open — Open a purchased bag and reveal the tazo
import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { generateTGAGrade } from "@/lib/grading/tga"
import { refreshUserProgress } from "@/lib/progression"

// Randomize stats within ±20% of base values
// Ensure base is always a JS number (Prisma may return BigInt for large ints)
function randomizeStat(base: number | bigint): number {
  const n = typeof base === "bigint" ? Number(base) : base
  const variance = Math.floor(n * 0.2)
  const min = Math.max(10, n - variance)
  const max = Math.min(99, n + variance)
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

          const bonusTazoData = purchase.bonusTazo
            ? await db.tazo.findUnique({
                where: { id: purchase.bonusTazo },
                include: { franchise: { select: { name: true, slug: true, color: true } } },
              })
            : null
          const bonusGrant = bonusTazoData
            ? {
                tazo: bonusTazoData,
                finish: randomFinish(bonusTazoData.rarity || "common"),
              }
            : null
          const bTgaGrade = bonusGrant
            ? generateTGAGrade(bonusGrant.tazo.rarity || "common", bonusGrant.finish)
            : null

          const [instance, bonusInstance] = await db.$transaction(async (tx) => {
            const claim = await tx.bagPurchase.updateMany({
              where: { id, userId: user.id, opened: false, tazoId: tazo.id },
              data: { opened: true },
            })
            if (claim.count !== 1) throw new Error("Bag already opened")

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

            let bonusInst: typeof inst | null = null
            if (bonusGrant && bTgaGrade) {
              const bUserTazo = await tx.userTazo.upsert({
                where: { userId_tazoId: { userId: user.id, tazoId: bonusGrant.tazo.id } },
                create: { userId: user.id, tazoId: bonusGrant.tazo.id, quantity: 1, obtainedFrom },
                update: { quantity: { increment: 1 } },
              })
              bonusInst = await tx.tazoInstance.create({
                data: {
                  userTazoId: bUserTazo.id, userId: user.id, tazoId: bonusGrant.tazo.id,
                  attack: randomizeStat(bonusGrant.tazo.attack),
                  defense: randomizeStat(bonusGrant.tazo.defense),
                  resistance: randomizeStat(bonusGrant.tazo.resistance),
                  weight: randomizeStat(bonusGrant.tazo.weight),
                  stability: randomizeStat(bonusGrant.tazo.stability),
                  spin: randomizeStat(bonusGrant.tazo.spin),
                  control: randomizeStat(bonusGrant.tazo.control),
                  bounce: randomizeStat(bonusGrant.tazo.bounce),
                  precision: randomizeStat(bonusGrant.tazo.precision),
                  finish: bonusGrant.finish,
                  creatureVariant: bonusGrant.tazo.creatureVariant || "standard",
                  isNew: true,
                  tgaTier: bTgaGrade.tier, tgaGrade: bTgaGrade.grade,
                  tgaSurface: bTgaGrade.surface, tgaBorders: bTgaGrade.borders,
                  tgaCertNumber: bTgaGrade.certNumber,
                },
              })
            }

            return [inst, bonusInst] as const
          })

          results.push({
            tazo: { ...tazo, instanceId: instance.id, finish: instance.finish, creatureVariant: instance.creatureVariant,
              attack: instance.attack, defense: instance.defense, resistance: instance.resistance,
              weight: instance.weight, stability: instance.stability, spin: instance.spin,
              control: instance.control, bounce: instance.bounce, precision: instance.precision },
            bonusTazo: bonusGrant && bonusInstance ? {
              ...bonusGrant.tazo,
              instanceId: bonusInstance.id,
              finish: bonusInstance.finish,
              creatureVariant: bonusInstance.creatureVariant,
              attack: bonusInstance.attack,
              defense: bonusInstance.defense,
              resistance: bonusInstance.resistance,
              weight: bonusInstance.weight,
              stability: bonusInstance.stability,
              spin: bonusInstance.spin,
              control: bonusInstance.control,
              bounce: bonusInstance.bounce,
              precision: bonusInstance.precision,
              tgaGrade: bonusInstance.tgaGrade,
              tgaTier: bonusInstance.tgaTier,
            } : null,
            ownedBefore: false,
          })

        } catch (e) {
          console.error(`[bags/open] Bulk open failed for bag ${id}:`, e instanceof Error ? e.message : String(e))
        }
      }
      await refreshUserProgress(user.id)
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

    const bonusTazo = purchase.bonusTazo
      ? await db.tazo.findUnique({
          where: { id: purchase.bonusTazo },
          include: { franchise: { select: { name: true, slug: true, color: true } } },
        })
      : null
    const bonusGrant = bonusTazo
      ? {
          tazo: bonusTazo,
          finish: randomFinish(bonusTazo.rarity || "common"),
        }
      : null
    const bonusTgaGrade = bonusGrant
      ? generateTGAGrade(bonusGrant.tazo.rarity || "common", bonusGrant.finish)
      : null

    const [, instance, bonusInstance] = await db.$transaction(async (tx) => {
      const claim = await tx.bagPurchase.updateMany({
        where: { id: singleId, userId: user.id, opened: false, tazoId: tazo.id },
        data: { opened: true },
      })
      if (claim.count !== 1) throw new Error("Bag already opened")

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

      let bonusInst: typeof inst | null = null
      if (bonusGrant && bonusTgaGrade) {
        const bUserTazo = await tx.userTazo.upsert({
          where: { userId_tazoId: { userId: user.id, tazoId: bonusGrant.tazo.id } },
          create: { userId: user.id, tazoId: bonusGrant.tazo.id, quantity: 1, obtainedFrom },
          update: { quantity: { increment: 1 } },
        })
        bonusInst = await tx.tazoInstance.create({
          data: {
            userTazoId: bUserTazo.id, userId: user.id, tazoId: bonusGrant.tazo.id,
            attack: randomizeStat(bonusGrant.tazo.attack),
            defense: randomizeStat(bonusGrant.tazo.defense),
            resistance: randomizeStat(bonusGrant.tazo.resistance),
            weight: randomizeStat(bonusGrant.tazo.weight),
            stability: randomizeStat(bonusGrant.tazo.stability),
            spin: randomizeStat(bonusGrant.tazo.spin),
            control: randomizeStat(bonusGrant.tazo.control),
            bounce: randomizeStat(bonusGrant.tazo.bounce),
            precision: randomizeStat(bonusGrant.tazo.precision),
            finish: bonusGrant.finish,
            creatureVariant: bonusGrant.tazo.creatureVariant || "standard",
            isNew: true,
            tgaTier: bonusTgaGrade.tier, tgaGrade: bonusTgaGrade.grade,
            tgaSurface: bonusTgaGrade.surface, tgaBorders: bonusTgaGrade.borders,
            tgaCertNumber: bonusTgaGrade.certNumber,
          },
        })
      }

      return [ut, inst, bonusInst] as const
    })

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
        instanceId: bonusInstance?.id ?? null,
        name: bonusTazo.name,
        displayName: bonusTazo.displayName || bonusTazo.name,
        franchise: bonusTazo.franchise,
        rarity: bonusTazo.rarity,
        finish: bonusInstance?.finish ?? bonusGrant?.finish ?? null,
        creatureVariant: bonusInstance?.creatureVariant ?? bonusTazo.creatureVariant,
        attack: bonusInstance?.attack ?? null,
        defense: bonusInstance?.defense ?? null,
        resistance: bonusInstance?.resistance ?? null,
        weight: bonusInstance?.weight ?? null,
        stability: bonusInstance?.stability ?? null,
        spin: bonusInstance?.spin ?? null,
        control: bonusInstance?.control ?? null,
        bounce: bonusInstance?.bounce ?? null,
        precision: bonusInstance?.precision ?? null,
        tgaGrade: bonusInstance?.tgaGrade ?? bonusTgaGrade?.grade ?? null,
        tgaTier: bonusInstance?.tgaTier ?? bonusTgaGrade?.tier ?? null,
      } : null,
      isBonus: !!bonusTazo,
    })
  } catch (error) {
    console.error("Bag open error:", error)
    return NextResponse.json({ error: "Failed to open bag" }, { status: 500 })
  }
}
