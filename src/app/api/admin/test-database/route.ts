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
      return NextResponse.json({ status: 'error' });
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
      return NextResponse.json({ status: 'connected' });

    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json({ status: 'error' });

    } finally {
      if (connection) {
        await connection.end();
      }
    }

  } catch (error) {
    console.error('Test admin database error:', error);
    return NextResponse.json({ status: 'error' });
  }
}