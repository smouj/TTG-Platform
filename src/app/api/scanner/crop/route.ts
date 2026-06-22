import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import path from 'path'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Auth check: only authenticated users can scan tazos
    const authUser = await getAuthUser(request).catch(() => null)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { imageUrl, region, tazoData } = body as {
      imageUrl: string
      region: { x: number; y: number; width: number; height: number }
      tazoData: Record<string, unknown>
    }

    if (!imageUrl || !region || !tazoData) {
      return NextResponse.json(
        { error: 'imageUrl, region, and tazoData are required' },
        { status: 400 }
      )
    }

    // Validate that franchiseId and collectionId reference existing records
    const franchiseId = tazoData.franchiseId as string | undefined
    const collectionId = tazoData.collectionId as string | undefined

    if (!franchiseId || !collectionId) {
      return NextResponse.json(
        { error: 'franchiseId and collectionId are required' },
        { status: 400 }
      )
    }

    const [franchise, collection] = await Promise.all([
      db.franchise.findUnique({ where: { id: franchiseId } }),
      db.collection.findUnique({ where: { id: collectionId } }),
    ])

    if (!franchise) {
      return NextResponse.json({ error: 'Invalid franchiseId' }, { status: 400 })
    }
    if (!collection) {
      return NextResponse.json({ error: 'Invalid collectionId' }, { status: 400 })
    }

    const publicDir = path.resolve(path.join(process.cwd(), 'public'))
    const sourcePath = path.resolve(path.join(publicDir, imageUrl.replace(/^\//, '')))

    // Path traversal protection
    if (!sourcePath.startsWith(publicDir + path.sep) && sourcePath !== publicDir) {
      return NextResponse.json({ error: 'Invalid image path' }, { status: 400 })
    }

    // Crop the region
    let croppedImage = sharp(sourcePath).extract({
      left: Math.round(region.x),
      top: Math.round(region.y),
      width: Math.round(region.width),
      height: Math.round(region.height),
    })

    // Resize to a standard tazo size (256x256)
    croppedImage = croppedImage.resize(256, 256, {
      fit: 'cover',
    })

    // Apply circular mask (SVG composite)
    const circleSvg = `<svg width="256" height="256">
      <circle cx="128" cy="128" r="124" fill="white"/>
    </svg>`

    const circleBuffer = Buffer.from(circleSvg)

    croppedImage = croppedImage.composite([
      {
        input: circleBuffer,
        blend: 'dest-in',
      },
    ])

    // Enhance contrast
    croppedImage = croppedImage
      .normalize()
      .sharpen()
      .modulate({ brightness: 1.05 })

    // Save as new tazo image
    const filename = `tazo-${randomUUID()}.png`
    const outputPath = path.join(
      process.cwd(),
      'public',
      'uploads',
      'scanned',
      filename
    )

    await croppedImage.png().toFile(outputPath)

    const tazoImageUrl = `/uploads/scanned/${filename}`

    // Scanner submissions belong to the uploader immediately, but stay out of
    // public/loot-pool rotation until an admin reviews and publishes them.
    const tazo = await db.$transaction(async (tx) => {
      const created = await tx.tazo.create({
        data: {
          name: (tazoData.name as string) || 'Unnamed Tazo',
          slug:
            (tazoData.slug as string) ||
            `tazo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          franchiseId,
          collectionId,
          number: (tazoData.number as string) || undefined,
          sourceStatus: 'pending_visual_check',
          publishStatus: 'pending_review',
          condition: (tazoData.condition as string) || 'good',
          physicalType: (tazoData.physicalType as string) || 'cardboard',
          combatType: (tazoData.combatType as string) || null,
          rarity: (tazoData.rarity as string) || 'common',
          imageUrl: tazoImageUrl,
          skill: (tazoData.skill as string) || null,
          skillDesc: (tazoData.skillDesc as string) || null,
          evolutionFrom: (tazoData.evolutionFrom as string) || null,
          evolutionTo: (tazoData.evolutionTo as string) || null,
          transformStage: (tazoData.transformStage as string) || null,
          transformOf: (tazoData.transformOf as string) || null,
          attack: (tazoData.attack as number) ?? 50,
          defense: (tazoData.defense as number) ?? 50,
          resistance: (tazoData.resistance as number) ?? 50,
          weight: (tazoData.weight as number) ?? 50,
          stability: (tazoData.stability as number) ?? 50,
          spin: (tazoData.spin as number) ?? 50,
          control: (tazoData.control as number) ?? 50,
          bounce: (tazoData.bounce as number) ?? 50,
          precision: (tazoData.precision as number) ?? 50,
          role: (tazoData.role as string) || null,
          isOwned: true,
        },
      })

      const userTazo = await tx.userTazo.create({
        data: {
          userId: authUser.id,
          tazoId: created.id,
          quantity: 1,
          obtainedFrom: 'scanner',
        },
      })

      await tx.tazoInstance.create({
        data: {
          userTazoId: userTazo.id,
          userId: authUser.id,
          tazoId: created.id,
          attack: created.attack,
          defense: created.defense,
          resistance: created.resistance,
          weight: created.weight,
          stability: created.stability,
          spin: created.spin,
          control: created.control,
          bounce: created.bounce,
          precision: created.precision,
          finish: created.finish,
          creatureVariant: created.creatureVariant,
          isNew: true,
        },
      })

      return tx.tazo.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          franchise: true,
          collection: true,
        },
      })
    })

    return NextResponse.json({ tazo, imageUrl: tazoImageUrl }, { status: 201 })
  } catch (error) {
    console.error('Error cropping tazo:', error)
    return NextResponse.json(
      { error: 'Failed to crop tazo from image' },
      { status: 500 }
    )
  }
}
