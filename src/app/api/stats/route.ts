import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get stats using Prisma
    const [
      totalUsers,
      totalServices,
      totalOrders,
      totalRevenue,
      recentUsers
    ] = await Promise.all([
      // Total users
      db.user.count({
        where: { isActive: true }
      }),
      
      // Total services
      db.service.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Total orders
      db.order.count(),
      
      // Total revenue
      db.order.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      
      // Recent users (last 30 days)
      db.user.count({
        where: {
          isActive: true,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    const stats = {
      totalUsers,
      totalServices,
      totalOrders,
      totalRevenue: totalRevenue._sum.amount || 0,
      recentUsers,
      recentServices: 0, // Will be calculated later
      servicesByType: [], // Will be populated based on your services table structure
      uptime: "99.9%",
      systemStatus: "online",
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch stats',
        message: error instanceof Error ? error.message : 'Unknown error',
        systemStatus: "offline"
      },
      { status: 500 }
    )
  }
}