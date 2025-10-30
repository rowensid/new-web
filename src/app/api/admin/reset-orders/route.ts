import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const runtime = 'nodejs'

// POST - Reset all orders
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from session directly
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

    // Only OWNER role can reset orders
    if (session.user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only OWNER can reset orders.' },
        { status: 403 }
      )
    }

    // Get count before deletion
    const orderCount = await db.order.count()
    
    if (orderCount === 0) {
      return NextResponse.json({
        message: 'No orders found to reset',
        deletedCount: 0,
        status: 'already_clean'
      })
    }

    // Delete all orders
    const deletedResult = await db.order.deleteMany({})

    // Clean up old sessions (optional)
    const oldDate = new Date()
    oldDate.setHours(oldDate.getHours() - 24)
    
    const deletedSessions = await db.session.deleteMany({
      where: {
        createdAt: {
          lt: oldDate
        }
      }
    })

    return NextResponse.json({
      message: 'Orders reset successfully',
      deletedCount: deletedResult.count,
      deletedSessions: deletedSessions.count,
      resetAt: new Date().toISOString(),
      status: 'success'
    })

  } catch (error) {
    console.error('Error resetting orders:', error)
    return NextResponse.json(
      { error: 'Failed to reset orders' },
      { status: 500 }
    )
  }
}

// GET - Check current status
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from session directly
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

    // Only OWNER role can check reset status
    if (session.user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get current counts
    const orderCount = await db.order.count()
    const sessionCount = await db.session.count()
    const userCount = await db.user.count()
    const storeItemCount = await db.storeItem.count()
    const paymentSettingsCount = await db.paymentSetting.count()

    return NextResponse.json({
      status: 'success',
      data: {
        orders: orderCount,
        sessions: sessionCount,
        users: userCount,
        storeItems: storeItemCount,
        paymentSettings: paymentSettingsCount
      },
      message: orderCount === 0 ? 'No orders found - Ready for fresh testing!' : `Found ${orderCount} orders that can be reset`
    })

  } catch (error) {
    console.error('Error checking reset status:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}