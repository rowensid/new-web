import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
      },
      include: {
        pterodactylServer: true
      }
    });

    if (!serverSetting) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (!serverSetting.databaseHost || !serverSetting.databaseName || 
        !serverSetting.databaseUser || !serverSetting.databasePassword) {
      return NextResponse.json({ error: 'Database settings not configured' }, { status: 400 });
    }

    // Test database connection
    let connection;
    try {
      connection = await mysql.createConnection({
        host: serverSetting.databaseHost,
        user: serverSetting.databaseUser,
        password: serverSetting.databasePassword,
        database: serverSetting.databaseName,
        connectTimeout: 10000
      });

      await connection.ping();

      const databaseInfo = {
        name: serverSetting.databaseName,
        host: serverSetting.databaseHost,
        username: serverSetting.databaseUser,
        password: serverSetting.databasePassword,
        status: 'connected' as const,
        lastTested: new Date().toLocaleString()
      };

      return NextResponse.json({ databaseInfo });

    } catch (dbError) {
      console.error('Database connection error:', dbError);
      
      const databaseInfo = {
        name: serverSetting.databaseName,
        host: serverSetting.databaseHost,
        username: serverSetting.databaseUser,
        password: serverSetting.databasePassword,
        status: 'error' as const,
        lastTested: new Date().toLocaleString()
      };

      return NextResponse.json({ databaseInfo });

    } finally {
      if (connection) {
        await connection.end();
      }
    }

  } catch (error) {
    console.error('Get admin database info error:', error);
    return NextResponse.json({ error: 'Failed to get database info' }, { status: 500 });
  }
}