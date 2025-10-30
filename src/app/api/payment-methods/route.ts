import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const GetPaymentMethodsSchema = z.object({
  onlyActive: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('onlyActive') !== 'false';

    // Get payment setting from owner panel
    const paymentSetting = await db.paymentSetting.findFirst({
      include: {
        banks: {
          orderBy: { createdAt: 'asc' }
        },
        ewallets: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    // If no payment setting exists, return maintenance mode
    if (!paymentSetting || !paymentSetting.isActive) {
      return NextResponse.json({
        success: false,
        maintenance: true,
        message: 'Deposit is currently under maintenance',
        data: []
      });
    }

    // Transform payment methods from PaymentSetting
    const paymentMethods = [];

    // Add QRIS if active
    if (paymentSetting.qrisImageUrl && paymentSetting.isActive) {
      paymentMethods.push({
        id: 'qris-payment',
        name: 'QRIS',
        type: 'QRIS',
        isActive: true,
        config: {
          qrUrl: paymentSetting.qrisImageUrl,
          merchantName: 'Your Company',
          qrisNumber: paymentSetting.qrisNumber
        }
      });
    }

    // Add active banks
    const activeBanks = onlyActive 
      ? paymentSetting.banks.filter(bank => bank.isActive)
      : paymentSetting.banks;

    activeBanks.forEach(bank => {
      paymentMethods.push({
        id: `bank-${bank.id}`,
        name: bank.bankName,
        type: 'BANK_TRANSFER',
        isActive: bank.isActive,
        config: {
          accountNumber: bank.bankNumber,
          accountName: bank.bankAccount,
          bankName: bank.bankName,
        }
      });
    });

    // Add active e-wallets
    const activeEwallets = onlyActive 
      ? paymentSetting.ewallets.filter(ewallet => ewallet.isActive)
      : paymentSetting.ewallets;

    activeEwallets.forEach(ewallet => {
      paymentMethods.push({
        id: `ewallet-${ewallet.id}`,
        name: ewallet.ewalletName,
        type: 'EWALLET',
        isActive: ewallet.isActive,
        config: {
          phoneNumber: ewallet.ewalletNumber,
          accountName: 'Your Company',
        }
      });
    });

    // If no active payment methods, return maintenance
    if (paymentMethods.length === 0) {
      return NextResponse.json({
        success: false,
        maintenance: true,
        message: 'No payment methods available at the moment',
        data: []
      });
    }

    return NextResponse.json({
      success: true,
      maintenance: false,
      data: paymentMethods,
      count: paymentMethods.length,
    });

  } catch (error) {
    console.error('Get payment methods error:', error);
    return NextResponse.json(
      { 
        success: false, 
        maintenance: true,
        message: 'Payment system temporarily unavailable',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}