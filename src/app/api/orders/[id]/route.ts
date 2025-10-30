import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const orderId = params.id

    // Get order with service info
    const order = await db.order.findFirst({
      where: {
        id: orderId,
        userId: session.userId // Only allow user to see their own orders
      },
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
            description: true,
            status: true,
            config: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Format order response
    const formattedOrder = {
      id: order.id,
      amount: order.amount,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentProof: order.paymentProof,
      adminNotes: order.adminNotes,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      service: order.storeItem ? {
        name: order.storeItem.title,
        type: order.storeItem.category,
        description: order.storeItem.description,
        status: null,
        config: null
      } : order.service || {
        name: 'Unknown Service',
        type: 'UNKNOWN',
        description: null,
        status: null,
        config: null
      },
      user: order.user
    }

    return NextResponse.json({
      order: formattedOrder
    })

  } catch (error) {
    console.error('Failed to fetch order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const orderId = params.id
    const body = await request.json()
    const { paymentProof } = body

    if (!paymentProof) {
      return NextResponse.json(
        { error: 'Payment proof is required' },
        { status: 400 }
      )
    }

    // Check if order exists and belongs to user
    const existingOrder = await db.order.findFirst({
      where: {
        id: orderId,
        userId: session.userId
      }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (existingOrder.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Order is not in pending status' },
        { status: 400 }
      )
    }

    // Update order with payment proof
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        paymentProof,
        status: 'VALIDATING'
      },
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
            description: true,
            status: true,
            config: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Format response
    const formattedOrder = {
      id: updatedOrder.id,
      amount: updatedOrder.amount,
      status: updatedOrder.status,
      paymentMethod: updatedOrder.paymentMethod,
      paymentProof: updatedOrder.paymentProof,
      adminNotes: updatedOrder.adminNotes,
      createdAt: updatedOrder.createdAt.toISOString(),
      updatedAt: updatedOrder.updatedAt.toISOString(),
      service: updatedOrder.storeItem ? {
        name: updatedOrder.storeItem.title,
        type: updatedOrder.storeItem.category,
        description: updatedOrder.storeItem.description,
        status: null,
        config: null
      } : updatedOrder.service || {
        name: 'Unknown Service',
        type: 'UNKNOWN',
        description: null,
        status: null,
        config: null
      },
      user: updatedOrder.user
    }

    return NextResponse.json({
      message: 'Payment proof uploaded successfully',
      order: formattedOrder
    })

  } catch (error) {
    console.error('Failed to upload payment proof:', error)
    return NextResponse.json(
      { error: 'Failed to upload payment proof' },
      { status: 500 }
    )
  }
}