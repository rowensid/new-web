import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find session by token
    const session = await db.session.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Get login history from database
    const loginHistory = await db.loginHistory.findMany({
      where: { userId: session.userId },
      orderBy: { loginTime: 'desc' },
      take: 20, // Get last 20 login records
      select: {
        id: true,
        loginTime: true,
        ip: true,
        userAgent: true,
        location: true,
        device: true,
        browser: true,
        isActive: true,
        createdAt: true
      }
    })

    // Format the response
    const formattedHistory = loginHistory.map((history) => ({
      id: history.id,
      loginTime: history.loginTime.toISOString(),
      ip: history.ip,
      userAgent: history.userAgent,
      location: history.location,
      device: history.device,
      browser: history.browser,
      isActive: history.isActive
    }))

    return NextResponse.json({
      history: formattedHistory,
      total: formattedHistory.length
    })

  } catch (error) {
    console.error('Failed to fetch login history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch login history' },
      { status: 500 }
    )
  }
}
