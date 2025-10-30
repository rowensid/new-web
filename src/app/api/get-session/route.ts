import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get a valid session token
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
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'No valid session found' }, { status: 404 })
    }

    return NextResponse.json({
      token: session.token,
      user: session.user,
      expiresAt: session.expiresAt
    })

  } catch (error) {
    console.error('Error getting session:', error)
    return NextResponse.json(
      { error: 'Failed to get session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}