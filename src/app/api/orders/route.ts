import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateOrderId } from '@/lib/id-generator'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    console.log('Order request body:', body)
    
    const { storeId, amount, paymentMethod, notes } = body

    if (!storeId || !amount || !paymentMethod) {
      console.log('Validation failed:', { storeId, amount, paymentMethod })
      return NextResponse.json(
        { error: 'Store ID, amount, and payment method are required' },
        { status: 400 }
      )
    }

    // Validate store item exists and is active
    const storeItem = await db.storeItem.findUnique({
      where: { id: storeId }
    })

    if (!storeItem) {
      console.log('Store item not found:', storeId)
      return NextResponse.json(
        { error: 'Store item not found' },
        { status: 404 }
      )
    }

    if (!storeItem.isActive) {
      console.log('Store item inactive:', storeId)
      return NextResponse.json(
        { error: 'Store item is inactive' },
        { status: 404 }
      )
    }

    // Validate amount matches store item price
    if (amount !== storeItem.price) {
      console.log('Amount mismatch:', { expected: storeItem.price, received: amount })
      return NextResponse.json(
        { error: 'Amount does not match store item price' },
        { status: 400 }
      )
    }

    // Check wallet balance for WALLET payment method
    if (paymentMethod === 'WALLET') {
      const userBalance = session.user.balance || 0
      if (userBalance < amount) {
        return NextResponse.json(
          { error: 'Insufficient wallet balance' },
          { status: 400 }
        )
      }
    }

    // Create order - ALWAYS start as PENDING for owner/admin approval
    const order = await db.order.create({
      data: {
        id: generateOrderId(), // Generate proper order ID
        userId: session.userId,
        storeId,
        amount,
        paymentMethod,
        status: 'PENDING' // Always PENDING first, owner/admin will validate
      }
    })

    // For WALLET payment, reserve the balance but don't deduct yet
    let reservedBalance = null
    if (paymentMethod === 'WALLET') {
      const userBalance = session.user.balance || 0
      if (userBalance < amount) {
        return NextResponse.json(
          { error: 'Insufficient wallet balance' },
          { status: 400 }
        )
      }
      reservedBalance = userBalance - amount
    }

    // If this is a hosting/service type, create a service record
    if (['HOSTING', 'SERVER'].includes(storeItem.category)) {
      try {
        await db.service.create({
          data: {
            userId: session.userId,
            name: storeItem.title,
            type: storeItem.category === 'HOSTING' ? 'RDP' : 'GAME_HOSTING',
            status: 'PENDING',
            price: amount,
            description: storeItem.description,
            config: {
              orderId: order.id,
              storeItemId: storeId,
              notes: notes || '',
              category: storeItem.category
            }
          }
        })
      } catch (serviceError) {
        console.error('Failed to create service record:', serviceError)
        // Continue with order creation even if service record fails
      }
    }

    return NextResponse.json({
      message: 'Order created successfully',
      order: {
        id: order.id,
        amount: order.amount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt.toISOString()
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Failed to create order:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || 'all'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = { userId: session.userId }
    
    if (status !== 'all') {
      where.status = status
    }

    // Get total count
    const total = await db.order.count({ where })

    // Get orders
    const orders = await db.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        storeItem: {
          select: {
            title: true,
            category: true,
            description: true
          }
        },
        service: {
          select: {
            name: true,
            type: true,
            status: true,
            config: true
          }
        }
      }
    })

    const pages = Math.ceil(total / limit)

    // Format orders
    const formattedOrders = orders.map(order => ({
      id: order.id,
      title: order.storeItem?.title || order.service?.name || 'Unknown Service',
      type: order.storeItem?.category || order.service?.type || 'UNKNOWN',
      amount: order.amount,
      status: order.status,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      serviceStatus: order.service?.status || null,
      config: order.service?.config || null
    }))

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    })

  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}