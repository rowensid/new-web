import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverId, table, id, data } = body;

    if (!serverId || !table || !id || !data) {
      return NextResponse.json({ error: 'Server ID, table name, id, and data are required' }, { status: 400 });
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

    // Build UPDATE query dynamically
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];

    const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
    
    const result = await db.$queryRawUnsafe(query, ...values);

    return NextResponse.json({
      success: true,
      message: 'Row updated successfully',
      affectedRows: result.affectedRows
    });

  } catch (error) {
    console.error('Update row error:', error);
    return NextResponse.json(
      { error: 'Failed to update row: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}