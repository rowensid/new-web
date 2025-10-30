import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authMiddleware } from '@/lib/auth'

// Simple ID generator
function generateShortId(length = 6): string {
  const min = Math.pow(10, length - 1)
  const max = Math.pow(10, length) - 1
  return Math.floor(Math.random() * (max - min + 1) + min).toString()
}

function generatePaymentSettingId(): string {
  return generateShortId(7)
}

// GET payment settings
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const auth = await authMiddleware(request)
    if (!auth.success || (auth.user.role !== 'OWNER' && auth.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get payment settings for the owner
    const paymentSettings = await db.paymentSetting.findFirst({
      where: {
        ownerUserId: auth.user.id
      }
    })

    return NextResponse.json(paymentSettings)
  } catch (error) {
    console.error('Error fetching payment settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST/UPDATE payment settings
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const auth = await authMiddleware(request)
    if (!auth.success || auth.user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      qrisImageUrl,
      qrisNumber,
      bankName,
      bankAccount,
      bankNumber,
      ewalletName,
      ewalletNumber,
      isActive
    } = body

    // Validate required fields
    if (isActive === undefined) {
      return NextResponse.json(
        { error: 'isActive field is required' },
        { status: 400 }
      )
    }

    // Check if payment settings already exist
    const existingSettings = await db.paymentSetting.findFirst({
      where: {
        ownerUserId: auth.user.id
      }
    })

    let paymentSettings

    if (existingSettings) {
      // Update existing settings
      paymentSettings = await db.paymentSetting.update({
        where: {
          id: existingSettings.id
        },
        data: {
          qrisImageUrl: qrisImageUrl || null,
          qrisNumber: qrisNumber || null,
          bankName: bankName || null,
          bankAccount: bankAccount || null,
          bankNumber: bankNumber || null,
          ewalletName: ewalletName || null,
          ewalletNumber: ewalletNumber || null,
          isActive: isActive
        }
      })
    } else {
      // Create new settings with short ID
      paymentSettings = await db.paymentSetting.create({
        data: {
          id: generatePaymentSettingId(), // Use short ID
          ownerUserId: auth.user.id,
          qrisImageUrl: qrisImageUrl || null,
          qrisNumber: qrisNumber || null,
          bankName: bankName || null,
          bankAccount: bankAccount || null,
          bankNumber: bankNumber || null,
          ewalletName: ewalletName || null,
          ewalletNumber: ewalletNumber || null,
          isActive: isActive
        }
      })
    }

    return NextResponse.json(paymentSettings)
  } catch (error) {
    console.error('Error saving payment settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}