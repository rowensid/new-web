import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { tableName: string } }
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

    const { searchParams } = new URL(request.url);
    const tableName = params.tableName;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    const search = searchParams.get('search') || '';

    // Validate table name to prevent SQL injection
    const validTableNames = [
      'User', 'Session', 'Service', 'Order', 'PterodactylServer', 
      'ServerSettings', 'ApiConfiguration', 'LoginHistory', 'StoreItem',
      'Invoice', 'WalletTransaction', 'DepositRequest', 'PaymentMethod',
      'PaymentSetting', 'BankAccount', 'EWalletAccount'
    ];

    if (!validTableNames.includes(tableName)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM ${tableName}`;
    let dataQuery = `SELECT * FROM ${tableName}`;
    
    if (search) {
      // Add search condition (this is a simple implementation)
      dataQuery += ` WHERE`;
      countQuery += ` WHERE`;
      
      // Get columns for this table to build search condition
      const columns = await db.$queryRaw`
        SELECT COLUMN_NAME 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = ${tableName}
          AND DATA_TYPE IN ('varchar', 'text', 'char', 'longtext', 'mediumtext', 'tinytext')
      ` as Array<{ COLUMN_NAME: string }>;

      if (columns.length > 0) {
        const searchConditions = columns.map(col => `${col.COLUMN_NAME} LIKE '%${search}%'`).join(' OR ');
        dataQuery += ` ${searchConditions}`;
        countQuery += ` ${searchConditions}`;
      }
    }

    dataQuery += ` ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;

    // Execute queries
    const [data, countResult] = await Promise.all([
      db.$queryRawUnsafe(dataQuery),
      db.$queryRawUnsafe(countQuery)
    ]);

    const total = Array.isArray(countResult) && countResult.length > 0 
      ? (countResult[0] as any).total 
      : 0;

    return NextResponse.json({
      success: true,
      data: Array.isArray(data) ? data : [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Table data error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tableName: string } }
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

    // Generate ID for new record
    const generateId = () => {
      const prefix = tableName.toLowerCase().slice(0, 3);
      return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    };

    // Add generated ID if not provided
    const recordData = {
      id: generateId(),
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert record
    const result = await (db as any)[tableName.toLowerCase()].create({
      data: recordData
    });

    return NextResponse.json({
      success: true,
      message: 'Record created successfully',
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Create record error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}