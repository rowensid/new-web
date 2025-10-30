import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sign } from 'jsonwebtoken'

export async function GET() {
  try {
    // Get any valid session
    const session = await db.session.findFirst({
      where: {
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'No valid session found' }, { status: 404 })
    }

    // Create fresh JWT token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret'
    const token = sign(
      {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role
      },
      jwtSecret,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      token,
      user: session.user
    })

  } catch (error) {
    console.error('Error creating token:', error)
    return NextResponse.json(
      { error: 'Failed to create token', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}