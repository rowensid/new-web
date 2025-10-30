import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper function to verify authentication
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  // Verify token with session
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
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');

    if (!serverId) {
      return NextResponse.json(
        { error: 'Server ID is required' },
        { status: 400 }
      );
    }

    // Get server settings for this user
    const serverSetting = await db.serverSettings.findFirst({
      where: {
        pterodactylServerId: serverId,
        assignedUserId: user.id
      }
    });

    if (!serverSetting) {
      return NextResponse.json(
        { error: 'Server not found or not assigned to you' },
        { status: 404 }
      );
    }

    // Return database info
    const databaseInfo = {
      name: serverSetting.databaseName || 'database',
      host: serverSetting.databaseHost || 'localhost',
      username: serverSetting.databaseUser || 'user',
      password: serverSetting.databasePassword || 'password',
      status: 'connected', // For demo, always connected
      lastTested: new Date().toLocaleString()
    };

    return NextResponse.json({ databaseInfo });

  } catch (error) {
    console.error('Get database info error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database information' },
      { status: 500 }
    );
  }
}