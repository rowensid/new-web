import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify token with session
    const session = await db.session.findUnique({
      where: { token },
      include: {
        user: {
          select: { id: true, role: true }
        }
      }
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get table info using Prisma queries
    const tables = [];
    
    // Get User table info
    try {
      const userCount = await db.user.count();
      tables.push({
        name: 'User',
        rows: userCount,
        size: '~N/A',
        engine: 'InnoDB',
        collation: 'utf8mb4_unicode_ci'
      });
    } catch (error) {
      console.error('Error getting User table info:', error);
    }

    // Get Service table info
    try {
      const serviceCount = await db.service.count();
      tables.push({
        name: 'Service',
        rows: serviceCount,
        size: '~N/A',
        engine: 'InnoDB',
        collation: 'utf8mb4_unicode_ci'
      });
    } catch (error) {
      console.error('Error getting Service table info:', error);
    }

    // Get Order table info
    try {
      const orderCount = await db.order.count();
      tables.push({
        name: 'Order',
        rows: orderCount,
        size: '~N/A',
        engine: 'InnoDB',
        collation: 'utf8mb4_unicode_ci'
      });
    } catch (error) {
      console.error('Error getting Order table info:', error);
    }

    // Get Session table info
    try {
      const sessionCount = await db.session.count();
      tables.push({
        name: 'Session',
        rows: sessionCount,
        size: '~N/A',
        engine: 'InnoDB',
        collation: 'utf8mb4_unicode_ci'
      });
    } catch (error) {
      console.error('Error getting Session table info:', error);
    }

    // Get PaymentMethod table info
    try {
      const paymentMethodCount = await db.paymentMethod.count();
      tables.push({
        name: 'PaymentMethod',
        rows: paymentMethodCount,
        size: '~N/A',
        engine: 'InnoDB',
        collation: 'utf8mb4_unicode_ci'
      });
    } catch (error) {
      console.error('Error getting PaymentMethod table info:', error);
    }

    // Get other tables
    const otherTables = [
      'PterodactylServer', 'ServerSettings', 'LoginHistory', 'StoreItem', 
      'Invoice', 'WalletTransaction', 'DepositRequest', 'BankAccount', 
      'EWalletAccount', 'PaymentSetting'
    ];

    for (const tableName of otherTables) {
      try {
        // Try to get count using Prisma model if it exists
        const model = (db as any)[tableName.toLowerCase()];
        if (model && typeof model.count === 'function') {
          const count = await model.count();
          tables.push({
            name: tableName,
            rows: count,
            size: '~N/A',
            engine: 'InnoDB',
            collation: 'utf8mb4_unicode_ci'
          });
        }
      } catch (error) {
        console.error(`Error getting ${tableName} table info:`, error);
      }
    }

    return NextResponse.json({ tables });

  } catch (error) {
    console.error('Get database tables error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database tables' },
      { status: 500 }
    );
  }
}