import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { db } from '@/lib/db'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const AVATARS_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars')

// ── Simple content moderation: detect known-bad patterns ──
function detectProhibited(buffer: Buffer): string | null {
  // Check PNG for embedded ICC profile with known-bad keywords
  const magic = buffer.toString('utf-8', 0, 8)
  const content = buffer.toString('utf-8', 0, Math.min(buffer.length, 2048))

  // Check for common inappropriate patterns
  const prohibitedPatterns = [
    /<\?php/i,           // no PHP shells in images
    /<script/i,          // no script injection
    /eval\s*\(/i,        // no eval
    /onerror\s*=/i,      // no event handlers
    /javascript\s*:/i,   // no JS URIs
  ]

  for (const pattern of prohibitedPatterns) {
    if (pattern.test(content)) {
      return `Prohibited content detected: ${pattern.source}`
    }
  }

  return null
}

// ── POST: Upload avatar ──
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('avatar') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `File type ${file.type} not allowed. Use JPEG, PNG, WebP, or GIF.` }, { status: 400 })
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `File too large. Maximum is 5MB.` }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Content moderation
    const prohibited = detectProhibited(buffer)
    if (prohibited) {
      // Security: blocked prohibited image upload
      return NextResponse.json({ error: prohibited }, { status: 400 })
    }

    // Ensure directory exists
    if (!fs.existsSync(AVATARS_DIR)) {
      fs.mkdirSync(AVATARS_DIR, { recursive: true })
    }

    // Generate unique filename
    const ext = file.type === 'image/gif' ? 'gif' : 'webp'
    const filename = `avatar-${user.id}-${Date.now()}.${ext}`
    const filepath = path.join(AVATARS_DIR, filename)

    // Process with sharp — resize to 256x256, convert to webp (or keep gif)
    if (file.type === 'image/gif') {
      fs.writeFileSync(filepath, buffer)
    } else {
      await sharp(buffer)
        .resize(256, 256, { fit: 'cover', position: 'center' })
        .webp({ quality: 85 })
        .toFile(filepath)
    }

    // Delete old avatar if exists
    const currentUser = await db.user.findUnique({ where: { id: user.id }, select: { avatarUrl: true } })
    if (currentUser?.avatarUrl) {
      const oldFilename = currentUser.avatarUrl.split('/').pop()
      if (oldFilename && !oldFilename.startsWith('http')) {
        const oldPath = path.join(AVATARS_DIR, oldFilename)
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath) } catch {}
        }
      }
    }

    const avatarUrl = `/uploads/avatars/${filename}`

    // Update user
    await db.user.update({
      where: { id: user.id },
      data: { avatarUrl },
    })

    return NextResponse.json({ avatarUrl })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
  }
}

// ── DELETE: Remove avatar ──
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const currentUser = await db.user.findUnique({ where: { id: user.id }, select: { avatarUrl: true } })
    if (currentUser?.avatarUrl) {
      const filename = currentUser.avatarUrl.split('/').pop()
      if (filename && !filename.startsWith('http')) {
        const filepath = path.join(AVATARS_DIR, filename)
        if (fs.existsSync(filepath)) {
          try { fs.unlinkSync(filepath) } catch {}
        }
      }
    }

    await db.user.update({
      where: { id: user.id },
      data: { avatarUrl: null },
    })

    return NextResponse.json({ avatarUrl: null })
  } catch (error) {
    console.error('Avatar delete error:', error)
    return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 })
  }
}
