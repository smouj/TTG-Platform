import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const full = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, name: true, email: true, displayName: true,
        avatarUrl: true, bio: true, credits: true,
        createdAt: true,
      },
    })

    if (!full) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json({ user: full })
  } catch (error) {
    console.error('User settings GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { displayName, avatarUrl, bio } = body

    const updates: Record<string, string | null> = {}

    if (displayName !== undefined) {
      updates.displayName = displayName.trim() || null
    }
    if (avatarUrl !== undefined) {
      updates.avatarUrl = avatarUrl || null
    }
    if (bio !== undefined) {
      updates.bio = (bio || '').trim() || null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: updates,
      select: { id: true, name: true, email: true, displayName: true, avatarUrl: true, bio: true, credits: true },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('User settings update error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
