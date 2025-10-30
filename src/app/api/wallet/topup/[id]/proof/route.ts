import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DepositStatus } from '@prisma/client'

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

    const depositId = params.id
    const body = await request.json()
    const { proofUrl } = body

    if (!proofUrl) {
      return NextResponse.json(
        { error: 'Payment proof is required' },
        { status: 400 }
      )
    }

    // Check if deposit exists and belongs to user
    const existingDeposit = await db.depositRequest.findFirst({
      where: {
        id: depositId,
        userId: session.userId
      }
    })

    if (!existingDeposit) {
      return NextResponse.json(
        { error: 'Deposit not found' },
        { status: 404 }
      )
    }

    if (existingDeposit.status !== DepositStatus.PENDING) {
      return NextResponse.json(
        { error: 'Deposit is not in pending status' },
        { status: 400 }
      )
    }

    // Update deposit with payment proof
    const updatedDeposit = await db.depositRequest.update({
      where: { id: depositId },
      data: {
        proofUrl,
        status: DepositStatus.VALIDATING,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Payment proof uploaded successfully',
      deposit: updatedDeposit
    })

  } catch (error) {
    console.error('Failed to upload payment proof:', error)
    return NextResponse.json(
      { error: 'Failed to upload payment proof' },
      { status: 500 }
    )
  }
}