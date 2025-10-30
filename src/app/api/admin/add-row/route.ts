import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverId, table, data } = body;

    if (!serverId || !table || !data) {
      return NextResponse.json({ error: 'Server ID, table name, and data are required' }, { status: 400 });
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

    // Build INSERT query dynamically
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map(() => '?').join(', ');

    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    const result = await db.$queryRawUnsafe(query, ...values);

    return NextResponse.json({
      success: true,
      message: 'Row added successfully',
      insertId: result.insertId
    });

  } catch (error) {
    console.error('Add row error:', error);
    return NextResponse.json(
      { error: 'Failed to add row: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}