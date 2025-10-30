import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');
    const table = searchParams.get('table');

    if (!serverId || !table) {
      return NextResponse.json({ error: 'Server ID and table name are required' }, { status: 400 });
    }

    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    const session = await db.session.findUnique({
      where: { token },
      include: { user: { select: { id: true, role: true } } }
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get table schema
    const schema = await db.$queryRaw`
      SELECT 
        COLUMN_NAME as columnName,
        DATA_TYPE as dataType,
        IS_NULLABLE as isNullable,
        COLUMN_DEFAULT as defaultValue,
        COLUMN_KEY as columnKey,
        EXTRA as extra,
        CHARACTER_MAXIMUM_LENGTH as maxLength,
        NUMERIC_PRECISION as numericPrecision,
        NUMERIC_SCALE as numericScale
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${table}
      ORDER BY ORDINAL_POSITION
    `;

    return NextResponse.json({ schema });

  } catch (error) {
    console.error('Get table schema error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table schema' },
      { status: 500 }
    );
  }
}