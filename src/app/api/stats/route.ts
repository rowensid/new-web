import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get real stats from database
    const [
      totalUsers,
      totalServices,
      totalOrders,
      totalRevenue,
      recentUsers,
      servicesByType
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
      
      // Total revenue from completed orders
      db.order.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      
      // Recent users (last 30 days)
      db.user.count({
        where: {
          isActive: true,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
          }
        }
      }),
      
      // Services by type
      db.service.groupBy({
        by: ['type'],
        where: { status: 'ACTIVE' },
        _count: { type: true }
      })
    ])

    const stats = {
      totalUsers,
      totalServices,
      totalOrders,
      totalRevenue: totalRevenue._sum.amount || 0,
      recentUsers,
      recentServices: 0, // Will be calculated later
      servicesByType: servicesByType.map(s => ({
        type: s.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        _count: { type: s._count.type }
      })),
      uptime: "99.9%",
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}