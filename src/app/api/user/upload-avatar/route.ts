import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Generate unique filename
function generateFilename(userId: string, originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  return `${userId}_${timestamp}_${random}.${extension}`
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' 
      }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size must be less than 5MB' 
      }, { status: 400 })
    }

    try {
      // Create avatars directory if it doesn't exist
      const avatarsDir = join(process.cwd(), 'public', 'avatars')
      if (!existsSync(avatarsDir)) {
        await mkdir(avatarsDir, { recursive: true })
      }

      // Generate unique filename
      const filename = generateFilename(decoded.userId, file.name)
      const filepath = join(avatarsDir, filename)

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filepath, buffer)

      // Generate public URL
      const avatarUrl = `/avatars/${filename}`

      // Update user avatar in database with file path
      await db.user.update({
        where: { id: decoded.userId },
        data: {
          avatar: avatarUrl,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({ 
        message: 'Avatar uploaded successfully',
        avatar: avatarUrl,
        size: Math.round(file.size / 1024) // size in KB
      })

    } catch (fileError: any) {
      console.error('File save error:', fileError)
      return NextResponse.json({ 
        error: 'Failed to save file' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Upload avatar error:', error)
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    
    // Get current user to find avatar file
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { avatar: true }
    })

    // Delete avatar file if it exists and is a local file
    if (user?.avatar && user.avatar.startsWith('/avatars/')) {
      try {
        const filepath = join(process.cwd(), 'public', user.avatar)
        const { unlink } = await import('fs/promises')
        await unlink(filepath)
      } catch (deleteError) {
        console.error('Failed to delete avatar file:', deleteError)
        // Continue even if file deletion fails
      }
    }

    // Remove avatar from database (set to null)
    await db.user.update({
      where: { id: decoded.userId },
      data: {
        avatar: null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      message: 'Avatar removed successfully'
    })

  } catch (error) {
    console.error('Remove avatar error:', error)
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 })
  }
}