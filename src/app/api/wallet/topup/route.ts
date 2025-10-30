import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { DepositStatus } from '@prisma/client'

// Simple ID generator
function generateShortId(length = 6): string {
  const min = Math.pow(10, length - 1)
  const max = Math.pow(10, length) - 1
  return Math.floor(Math.random() * (max - min + 1) + min).toString()
}

function generateDepositId(): string {
  return generateShortId(8)
}

const createDepositSchema = z.object({
  amount: z.number().min(10000, 'Minimum top-up is Rp 10,000'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
})

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
    const validatedData = createDepositSchema.parse(body)

    // Get payment settings for display
    const paymentSetting = await db.paymentSetting.findFirst({
      include: {
        banks: true,
        ewallets: true
      }
    })

    // Create deposit request with short ID
    const deposit = await db.depositRequest.create({
      data: {
        id: generateDepositId(), // Use short ID instead of cuid
        userId: session.userId,
        amount: validatedData.amount,
        paymentMethod: validatedData.paymentMethod,
        status: DepositStatus.PENDING,
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

    // Format payment info based on method
    let paymentInfo = {}
    let paymentMethodName = validatedData.paymentMethod

    // Handle different payment method ID formats
    if (validatedData.paymentMethod === 'qris-payment' && paymentSetting?.qrisImageUrl) {
      paymentInfo = {
        qrisImageUrl: paymentSetting.qrisImageUrl,
        qrisNumber: paymentSetting.qrisNumber
      }
      paymentMethodName = 'QRIS'
    } else if (validatedData.paymentMethod.startsWith('bank-') && paymentSetting) {
      const bankId = validatedData.paymentMethod.replace('bank-', '')
      const bank = paymentSetting.banks.find(b => b.id === bankId)
      
      if (bank) {
        paymentInfo = {
          bankName: bank.bankName,
          bankNumber: bank.bankNumber,
          bankAccount: bank.bankAccount
        }
        paymentMethodName = bank.bankName
      }
    } else if (validatedData.paymentMethod.startsWith('ewallet-') && paymentSetting) {
      const ewalletId = validatedData.paymentMethod.replace('ewallet-', '')
      const ewallet = paymentSetting.ewallets.find(e => e.id === ewalletId)
      
      if (ewallet) {
        paymentInfo = {
          ewalletName: ewallet.ewalletName,
          ewalletNumber: ewallet.ewalletNumber
        }
        paymentMethodName = ewallet.ewalletName
      }
    }

    return NextResponse.json({
      message: 'Deposit request created successfully',
      deposit: {
        id: deposit.id,
        amount: deposit.amount,
        paymentMethod: deposit.paymentMethod,
        status: deposit.status,
        createdAt: deposit.createdAt,
        user: deposit.user
      },
      paymentInfo,
      instructions: getPaymentInstructions(paymentMethodName, deposit.amount)
    })

  } catch (error) {
    console.error('Failed to create deposit:', error)
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors)
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create deposit request', message: error.message },
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
    const where: any = {
      userId: session.userId
    }
    
    if (status !== 'all') {
      where.status = status
    }

    // Get total count
    const total = await db.depositRequest.count({ where })

    // Get deposits
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
            email: true
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
    console.error('Failed to fetch deposits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deposits' },
      { status: 500 }
    )
  }
}

function getPaymentInstructions(method: string, amount: number): string[] {
  const instructions: Record<string, string[]> = {
    'QRIS': [
      `Scan QR code di atas menggunakan aplikasi e-wallet atau mobile banking`,
      `Masukkan jumlah Rp ${amount.toLocaleString('id-ID')}`,
      `Konfirmasi pembayaran`,
      `Upload bukti pembayaran setelah selesai`
    ],
    'BCA': [
      `Transfer ke rekening BCA yang tertera`,
      `Masukkan jumlah Rp ${amount.toLocaleString('id-ID')}`,
      `Tambahkan 3 digit terakhir nomor HP Anda (untuk verifikasi)`,
      `Upload bukti transfer`
    ],
    'BNI': [
      `Transfer ke rekening BNI yang tertera`,
      `Masukkan jumlah Rp ${amount.toLocaleString('id-ID')}`,
      `Tambahkan 3 digit terakhir nomor HP Anda (untuk verifikasi)`,
      `Upload bukti transfer`
    ],
    'BRI': [
      `Transfer ke rekening BRI yang tertera`,
      `Masukkan jumlah Rp ${amount.toLocaleString('id-ID')}`,
      `Tambahkan 3 digit terakhir nomor HP Anda (untuk verifikasi)`,
      `Upload bukti transfer`
    ],
    'MANDIRI': [
      `Transfer ke rekening Mandiri yang tertera`,
      `Masukkan jumlah Rp ${amount.toLocaleString('id-ID')}`,
      `Tambahkan 3 digit terakhir nomor HP Anda (untuk verifikasi)`,
      `Upload bukti transfer`
    ],
    'GOPAY': [
      `Transfer ke nomor GoPay yang tertera`,
      `Masukkan jumlah Rp ${amount.toLocaleString('id-ID')}`,
      `Upload bukti transfer dari aplikasi GoPay`
    ],
    'OVO': [
      `Transfer ke nomor OVO yang tertera`,
      `Masukkan jumlah Rp ${amount.toLocaleString('id-ID')}`,
      `Upload bukti transfer dari aplikasi OVO`
    ],
    'DANA': [
      `Transfer ke nomor DANA yang tertera`,
      `Masukkan jumlah Rp ${amount.toLocaleString('id-ID')}`,
      `Upload bukti transfer dari aplikasi DANA`
    ],
    'SHOPEEPAY': [
      `Transfer ke nomor ShopeePay yang tertera`,
      `Masukkan jumlah Rp ${amount.toLocaleString('id-ID')}`,
      `Upload bukti transfer dari aplikasi ShopeePay`
    ]
  }

  return instructions[method] || ['Follow the payment instructions provided']
}