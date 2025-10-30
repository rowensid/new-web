import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
import mysql from 'mysql2/promise';

// Helper function to verify authentication
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) {
      return null;
    }

    // Check if session exists and is valid
    const session = await db.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            role: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return session.user;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');

    if (!serverId) {
      return NextResponse.json({ error: 'Server ID is required' }, { status: 400 });
    }

    // Get server settings (admin can access any server)
    const serverSetting = await db.serverSettings.findFirst({
      where: {
        pterodactylServerId: serverId
      }
    });

    if (!serverSetting) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (!serverSetting.databaseHost || !serverSetting.databaseName || 
        !serverSetting.databaseUser || !serverSetting.databasePassword) {
      return NextResponse.json({ error: 'Database settings not configured' }, { status: 400 });
    }

    // Connect to database and get tables
    let connection;
    try {
      connection = await mysql.createConnection({
        host: serverSetting.databaseHost,
        user: serverSetting.databaseUser,
        password: serverSetting.databasePassword,
        database: serverSetting.databaseName,
        connectTimeout: 10000
      });

      const [tables] = await connection.execute(
        'SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH, ENGINE, TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME',
        [serverSetting.databaseName]
      );

      const formattedTables = (tables as any[]).map(table => ({
        name: table.TABLE_NAME,
        rows: table.TABLE_ROWS || 0,
        size: formatBytes((table.DATA_LENGTH || 0) + (table.INDEX_LENGTH || 0)),
        engine: table.ENGINE || 'Unknown',
        collation: table.TABLE_COLLATION || 'Unknown'
      }));

      return NextResponse.json({ tables: formattedTables });

    } catch (dbError) {
      console.error('Database tables error:', dbError);
      return NextResponse.json({ error: 'Failed to fetch database tables' }, { status: 500 });

    } finally {
      if (connection) {
        await connection.end();
      }
    }

  } catch (error) {
    console.error('Get admin database tables error:', error);
    return NextResponse.json({ error: 'Failed to fetch database tables' }, { status: 500 });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}