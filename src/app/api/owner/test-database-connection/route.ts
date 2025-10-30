import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import mysql from 'mysql2/promise';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session and get user
    const session = await db.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date() || session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { host, port, database, username, password } = await request.json();

    if (!host || !database || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Test database connection
    let connection;
    try {
      connection = await mysql.createConnection({
        host,
        port: port || 3306,
        user: username,
        password,
        database
      });

      await connection.ping();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Database connection successful' 
      });
    } catch (dbError: any) {
      console.error('Database connection error:', dbError);
      return NextResponse.json({ 
        success: false, 
        error: dbError.message || 'Database connection failed' 
      });
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}