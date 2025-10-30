import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

export const runtime = 'nodejs'

const bankAccountSchema = z.object({
  id: z.string().optional(),
  bankName: z.string().min(1, 'Bank name is required'),
  bankNumber: z.string().min(1, 'Bank number is required'),
  bankAccount: z.string().min(1, 'Account name is required'),
  isActive: z.boolean().default(true),
})

const ewalletAccountSchema = z.object({
  id: z.string().optional(),
  ewalletName: z.string().min(1, 'E-wallet name is required'),
  ewalletNumber: z.string().min(1, 'E-wallet number is required'),
  isActive: z.boolean().default(true),
})

const paymentSettingSchema = z.object({
  qrisImageUrl: z.string().url().optional().or(z.literal('')),
  qrisNumber: z.string().optional(),
  isActive: z.boolean().default(true),
  banks: z.array(bankAccountSchema).optional(),
  ewallets: z.array(ewalletAccountSchema).optional(),
})

// GET payment settings
export async function GET() {
  try {
    const paymentSetting = await db.paymentSetting.findFirst({
      include: {
        ownerUser: {
          select: {
            name: true,
            email: true,
          }
        },
        banks: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        ewallets: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    return NextResponse.json(paymentSetting)
  } catch (error) {
    console.error('Error fetching payment settings:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil pengaturan pembayaran' },
      { status: 500 }
    )
  }
}

// POST/UPDATE payment settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = paymentSettingSchema.parse(body)

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user and get owner user ID
    const authResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!authResponse.ok) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const authData = await authResponse.json()
    
    // Only OWNER role can manage payment settings
    if (authData.user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Check if payment setting already exists
    const existingSetting = await db.paymentSetting.findFirst()

    if (existingSetting) {
      // Update existing setting
      const updatedSetting = await db.paymentSetting.update({
        where: { id: existingSetting.id },
        data: {
          qrisImageUrl: validatedData.qrisImageUrl,
          qrisNumber: validatedData.qrisNumber,
          isActive: validatedData.isActive,
        },
        include: {
          ownerUser: {
            select: {
              name: true,
              email: true,
            }
          },
          banks: {
            orderBy: {
              createdAt: 'asc'
            }
          },
          ewallets: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      })

      // Handle banks update
      if (validatedData.banks) {
        // Delete existing banks
        await db.bankAccount.deleteMany({
          where: { paymentSettingId: existingSetting.id }
        })

        // Create new banks
        if (validatedData.banks.length > 0) {
          await db.bankAccount.createMany({
            data: validatedData.banks.map(bank => ({
              ...bank,
              paymentSettingId: existingSetting.id,
            }))
          })
        }
      }

      // Handle e-wallets update
      if (validatedData.ewallets) {
        // Delete existing e-wallets
        await db.eWalletAccount.deleteMany({
          where: { paymentSettingId: existingSetting.id }
        })

        // Create new e-wallets
        if (validatedData.ewallets.length > 0) {
          await db.eWalletAccount.createMany({
            data: validatedData.ewallets.map(ewallet => ({
              ...ewallet,
              paymentSettingId: existingSetting.id,
            }))
          })
        }
      }

      // Fetch updated setting with relations
      const finalSetting = await db.paymentSetting.findFirst({
        where: { id: existingSetting.id },
        include: {
          ownerUser: {
            select: {
              name: true,
              email: true,
            }
          },
          banks: {
            orderBy: {
              createdAt: 'asc'
            }
          },
          ewallets: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      })

      return NextResponse.json(finalSetting)
    } else {
      // Create new setting with the actual owner user ID
      const newSetting = await db.paymentSetting.create({
        data: {
          qrisImageUrl: validatedData.qrisImageUrl,
          qrisNumber: validatedData.qrisNumber,
          isActive: validatedData.isActive,
          ownerUserId: authData.user.id,
        },
        include: {
          ownerUser: {
            select: {
              name: true,
              email: true,
            }
          },
          banks: {
            orderBy: {
              createdAt: 'asc'
            }
          },
          ewallets: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      })

      // Create banks if provided
      if (validatedData.banks && validatedData.banks.length > 0) {
        await db.bankAccount.createMany({
          data: validatedData.banks.map(bank => ({
            ...bank,
            paymentSettingId: newSetting.id,
          }))
        })
      }

      // Create e-wallets if provided
      if (validatedData.ewallets && validatedData.ewallets.length > 0) {
        await db.eWalletAccount.createMany({
          data: validatedData.ewallets.map(ewallet => ({
            ...ewallet,
            paymentSettingId: newSetting.id,
          }))
        })
      }

      // Fetch final setting with relations
      const finalSetting = await db.paymentSetting.findFirst({
        where: { id: newSetting.id },
        include: {
          ownerUser: {
            select: {
              name: true,
              email: true,
            }
          },
          banks: {
            orderBy: {
              createdAt: 'asc'
            }
          },
          ewallets: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      })

      return NextResponse.json(finalSetting)
    }
  } catch (error) {
    console.error('Error saving payment settings:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Gagal menyimpan pengaturan pembayaran' },
      { status: 500 }
    )
  }
}