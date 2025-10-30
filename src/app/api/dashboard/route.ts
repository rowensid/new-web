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

    const userId = session.userId

    // Get user statistics
    const [
      totalOrders,
      completedOrders,
      pendingOrders,
      totalSpent,
      recentOrders,
      activeServices
    ] = await Promise.all([
      // Total orders count
      db.order.count({
        where: { userId }
      }),
      
      // Completed orders count
      db.order.count({
        where: { 
          userId,
          status: 'COMPLETED'
        }
      }),
      
      // Pending orders count
      db.order.count({
        where: { 
          userId,
          status: 'PENDING'
        }
      }),
      
      // Total amount spent
      db.order.aggregate({
        where: { 
          userId,
          status: 'COMPLETED'
        },
        _sum: { amount: true }
      }),
      
      // Recent orders (last 5)
      db.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          service: {
            select: {
              name: true,
              type: true,
              status: true
            }
          },
          storeItem: {
            select: {
              title: true,
              category: true
            }
          }
        }
      }),
      
      // Active services
      db.service.count({
        where: { 
          userId,
          status: 'ACTIVE'
        }
      })
    ])

    // Calculate statistics
    const stats = {
      totalOrders,
      completedOrders,
      pendingOrders,
      totalSpent: totalSpent._sum.amount || 0,
      activeServices,
      completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
    }

    // Format recent orders
    const formattedRecentOrders = recentOrders.map(order => {
      // Use service name if available, otherwise use store item title
      const title = order.service?.name || order.storeItem?.title || 'Unknown Service'
      // Use service type if available, otherwise use store item category, otherwise default to UNKNOWN
      const type = order.service?.type || order.storeItem?.category || 'UNKNOWN'
      
      return {
        id: order.id,
        title,
        type,
        amount: order.amount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        adminNotes: order.adminNotes,
        createdAt: order.createdAt.toISOString(),
        serviceStatus: order.service?.status || null
      }
    })

    return NextResponse.json({
      stats,
      recentOrders: formattedRecentOrders,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Failed to fetch user dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}