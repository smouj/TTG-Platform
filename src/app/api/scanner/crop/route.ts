import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import path from 'path'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
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

    const sourcePath = path.join(
      process.cwd(),
      'public',
      imageUrl.replace(/^\//, '')
    )

    const size = Math.min(region.width, region.height)

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

    // Create the tazo in the database
    const tazo = await db.tazo.create({
      data: {
        name: (tazoData.name as string) || 'Unnamed Tazo',
        slug:
          (tazoData.slug as string) ||
          `tazo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        franchiseId: (tazoData.franchiseId as string) || '',
        collectionId: (tazoData.collectionId as string) || '',
        printedNumber: (tazoData.printedNumber as string) || null,
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
        spin: (tazoData.spin as number) ?? 50,
        weight: (tazoData.weight as number) ?? 50,
        aura: (tazoData.aura as number) ?? 50,
        control: (tazoData.control as number) ?? 50,
        isOwned: (tazoData.isOwned as boolean) ?? false,
      },
      include: {
        franchise: true,
        collection: true,
      },
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
