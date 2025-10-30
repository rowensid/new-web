import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

const balanceSchema = z.object({
  action: z.enum(['withdraw', 'add', 'set']),
  amount: z.number().min(0),
  reason: z.string().optional()
})

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return decoded
  } catch {
    return null
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || (auth.role !== 'ADMIN' && auth.role !== 'OWNER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = params.id
    const body = await request.json()
    const { action, amount, reason } = balanceSchema.parse(body)

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, balance: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let newBalance = user.balance
    let transactionType: 'TOP_UP' | 'PAYMENT' | 'REFUND' | 'PENALTY' | 'BONUS' = 'PAYMENT'

    switch (action) {
      case 'withdraw':
        if (amount > user.balance) {
          return NextResponse.json(
            { error: 'Insufficient balance' },
            { status: 400 }
          )
        }
        newBalance = user.balance - amount
        transactionType = 'PAYMENT'
        break
      case 'add':
        newBalance = user.balance + amount
        transactionType = 'TOP_UP'
        break
      case 'set':
        newBalance = amount
        transactionType = amount >= user.balance ? 'TOP_UP' : 'PAYMENT'
        break
    }

    // Simple ID generator
    function generateShortId(length = 6): string {
      const min = Math.pow(10, length - 1)
      const max = Math.pow(10, length) - 1
      return Math.floor(Math.random() * (max - min + 1) + min).toString()
    }

    // Update user balance
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { balance: newBalance },
      select: {
        id: true,
        name: true,
        email: true,
        balance: true
      }
    })

    // Create transaction record
    const transaction = await db.walletTransaction.create({
      data: {
        id: generateShortId(10),
        userId: userId,
        type: transactionType,
        amount: action === 'withdraw' ? -amount : amount,
        description: `${action.charAt(0).toUpperCase() + action.slice(1)} by admin: ${reason || 'No reason provided'}`,
        balance: newBalance,
        metadata: {
          action,
          performedBy: auth.userId,
          previousBalance: user.balance,
          newBalance,
          reason: reason || 'No reason provided'
        }
      }
    })

    return NextResponse.json({
      message: `Balance ${action} successful`,
      user: updatedUser,
      transaction,
      newBalance
    })

  } catch (error) {
    console.error('Balance update error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || (auth.role !== 'ADMIN' && auth.role !== 'OWNER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = params.id

    // Get user with balance and transaction history
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        balance: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get recent transactions
    const transactions = await db.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        balance: true,
        createdAt: true,
        metadata: true
      }
    })

    return NextResponse.json({
      user,
      transactions
    })

  } catch (error) {
    console.error('Get balance error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}