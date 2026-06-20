import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import path from 'path'
import { getAuthUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { imageUrl } = body as { imageUrl: string }

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      )
    }

    // Load image from public directory (with path traversal protection)
    const publicDir = path.resolve(path.join(process.cwd(), 'public'))
    const filepath = path.resolve(path.join(publicDir, imageUrl.replace(/^\//, '')))
    if (!filepath.startsWith(publicDir + path.sep) && filepath !== publicDir) {
      return NextResponse.json({ error: 'Invalid image path' }, { status: 400 })
    }

    const metadata = await sharp(filepath).metadata()
    const width = metadata.width || 800
    const height = metadata.height || 600

    // Grid-based detection: divide image into cells and suggest circular crop regions
    // For MVP, we use a simple approach based on common tazo layout patterns
    const regions: { x: number; y: number; width: number; height: number }[] = []

    // Determine grid size based on image dimensions
    // Typical tazo sheets have 3-5 columns and 2-4 rows
    const aspectRatio = width / height

    let cols: number
    let rows: number

    if (aspectRatio > 1.5) {
      // Wide image: more columns
      cols = 5
      rows = 3
    } else if (aspectRatio > 1) {
      cols = 4
      rows = 3
    } else {
      // Tall or square image
      cols = 3
      rows = 4
    }

    const cellWidth = Math.floor(width / cols)
    const cellHeight = Math.floor(height / rows)

    // Generate regions for each cell
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * cellWidth + Math.floor(cellWidth * 0.1)
        const y = row * cellHeight + Math.floor(cellHeight * 0.1)
        const regionSize = Math.min(cellWidth, cellHeight) * 0.8

        regions.push({
          x,
          y,
          width: Math.round(regionSize),
          height: Math.round(regionSize),
        })
      }
    }

    return NextResponse.json({ regions, count: regions.length })
  } catch (error) {
    console.error('Error detecting tazos:', error)
    return NextResponse.json(
      { error: 'Failed to detect tazos in image' },
      { status: 500 }
    )
  }
}
