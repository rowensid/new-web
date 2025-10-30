import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        balance: true, // Add balance field!
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    
    const body = await request.json()
    const { name, email, avatar } = body

    // Validate input
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // For regular users, don't allow email changes
    // Only allow email updates for admin/owner
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let updateData: any = {
      name,
      avatar: avatar || null,
      updatedAt: new Date()
    }

    // Only allow email changes for admin/owner
    if (user.role === 'ADMIN' || user.role === 'OWNER') {
      if (email) {
        // Check if email is already taken by another user
        const existingUser = await db.user.findFirst({
          where: {
            email,
            id: { not: decoded.userId }
          }
        })

        if (existingUser) {
          return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
        }
        
        updateData.email = email
      }
    } else if (email) {
      // Regular user trying to change email - not allowed
      return NextResponse.json({ error: 'Email changes are not allowed. Please contact admin.' }, { status: 403 })
    }

    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        balance: true, // Add balance field!
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}