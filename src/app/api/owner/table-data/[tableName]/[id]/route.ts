import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { tableName: string; id: string } }
) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const session = await db.session.findUnique({
      where: { token },
      include: { user: { select: { id: true, role: true } } }
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const tableName = params.tableName;
    const recordId = params.id;
    const body = await request.json();

    // Validate table name
    const validTableNames = [
      'User', 'Session', 'Service', 'Order', 'PterodactylServer', 
      'ServerSettings', 'ApiConfiguration', 'LoginHistory', 'StoreItem',
      'Invoice', 'WalletTransaction', 'DepositRequest', 'PaymentMethod',
      'PaymentSetting', 'BankAccount', 'EWalletAccount'
    ];

    if (!validTableNames.includes(tableName)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    // Add updatedAt timestamp
    const updateData = {
      ...body,
      updatedAt: new Date()
    };

    // Update record
    const result = await (db as any)[tableName.toLowerCase()].update({
      where: { id: recordId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Record updated successfully',
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update record error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tableName: string; id: string } }
) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const session = await db.session.findUnique({
      where: { token },
      include: { user: { select: { id: true, role: true } } }
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const tableName = params.tableName;
    const recordId = params.id;

    // Validate table name
    const validTableNames = [
      'User', 'Session', 'Service', 'Order', 'PterodactylServer', 
      'ServerSettings', 'ApiConfiguration', 'LoginHistory', 'StoreItem',
      'Invoice', 'WalletTransaction', 'DepositRequest', 'PaymentMethod',
      'PaymentSetting', 'BankAccount', 'EWalletAccount'
    ];

    if (!validTableNames.includes(tableName)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    // Prevent deletion of current owner
    if (tableName === 'User' && recordId === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Delete record
    const result = await (db as any)[tableName.toLowerCase()].delete({
      where: { id: recordId }
    });

    return NextResponse.json({
      success: true,
      message: 'Record deleted successfully',
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete record error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}