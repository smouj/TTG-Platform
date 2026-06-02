import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'scanned')
    await mkdir(uploadDir, { recursive: true })

    // Process with sharp
    let image = sharp(buffer)
    const metadata = await image.metadata()

    const maxWidth = 1200
    const maxHeight = 1200

    let width = metadata.width || 800
    let height = metadata.height || 600

    // Resize if too large
    if (width > maxWidth || height > maxHeight) {
      image = image.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      // Recalculate dimensions
      const ratio = Math.min(maxWidth / width, maxHeight / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
    }

    const filename = `${randomUUID()}.jpg`
    const filepath = path.join(uploadDir, filename)

    await image.jpeg({ quality: 90 }).toFile(filepath)

    const imageUrl = `/uploads/scanned/${filename}`

    return NextResponse.json({ imageUrl, width, height })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
