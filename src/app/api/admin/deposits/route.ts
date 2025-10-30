import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
import { z } from 'zod'
import { DepositStatus } from '@prisma/client'

// Simple ID generator
function generateShortId(length = 6): string {
  const min = Math.pow(10, length - 1)
  const max = Math.pow(10, length) - 1
  return Math.floor(Math.random() * (max - min + 1) + min).toString()
}

function generateTransactionId(): string {
  return generateShortId(10)
}

const updateDepositSchema = z.object({
  status: z.enum(['PENDING', 'VALIDATING', 'APPROVED', 'REJECTED']).optional(),
  adminNotes: z.string().optional(),
  proofUrl: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // Try both cookie and authorization header
    const sessionToken = request.cookies.get('session-token')?.value ||
                       request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await db.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });

    if (!session || session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || 'all'
    const userId = searchParams.get('userId') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status !== 'all') {
      where.status = status
    }
    
    if (userId) {
      where.userId = userId
    }

    // Get total count
    const total = await db.depositRequest.count({ where })

    // Get deposits with user info
    const deposits = await db.depositRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
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

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      deposits,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    })

  } catch (error) {
    console.error('Failed to fetch admin deposits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deposits' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Try both cookie and authorization header
    const sessionToken = request.cookies.get('session-token')?.value ||
                       request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await db.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });

    if (!session || session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json()
    const { depositId, status, adminNotes, proofUrl } = body

    if (!depositId || !status) {
      return NextResponse.json(
        { error: 'Deposit ID and status are required' },
        { status: 400 }
      )
    }

    const validatedData = updateDepositSchema.parse({ status, adminNotes, proofUrl })

    // Get existing deposit
    const existingDeposit = await db.depositRequest.findUnique({
      where: { id: depositId },
      include: { user: true }
    })

    if (!existingDeposit) {
      return NextResponse.json(
        { error: 'Deposit not found' },
        { status: 404 }
      )
    }

    // If approving, create wallet transaction and update user balance
    let transaction = null
    if (validatedData.status === DepositStatus.APPROVED) {
      // Create wallet transaction with short ID
      const newBalance = existingDeposit.user.balance + existingDeposit.amount
      
      transaction = await db.walletTransaction.create({
        data: {
          id: generateTransactionId(), // Use short ID instead of cuid
          userId: existingDeposit.userId,
          type: 'TOP_UP',
          amount: existingDeposit.amount,
          description: `Top up ${existingDeposit.paymentMethod} - Approved by ${session.user.name}`,
          balance: newBalance,
          metadata: {
            paymentMethod: existingDeposit.paymentMethod,
            depositId: existingDeposit.id,
            approvedBy: session.user.id
          }
        }
      })

      // Update user balance
      await db.user.update({
        where: { id: existingDeposit.userId },
        data: { balance: newBalance }
      })
    }

    // Update deposit status
    const updatedDeposit = await db.depositRequest.update({
      where: { id: depositId },
      data: {
        status: validatedData.status,
        adminNotes: validatedData.adminNotes || null,
        proofUrl: validatedData.proofUrl || existingDeposit.proofUrl,
        processedBy: session.user.id,
        processedAt: new Date(),
        transactionId: transaction?.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            balance: true
          }
        }
      }
    })

    return NextResponse.json({
      message: `Deposit ${validatedData.status.toLowerCase()} successfully`,
      deposit: updatedDeposit,
      transaction
    })

  } catch (error) {
    console.error('Failed to update deposit:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update deposit' },
      { status: 500 }
    )
  }
}