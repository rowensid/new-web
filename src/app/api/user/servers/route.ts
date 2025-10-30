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

    // Get servers assigned to this user
    const serverSettings = await db.serverSettings.findMany({
      where: {
        assignedUserId: user.id
      },
      include: {
        pterodactylServer: {
          select: {
            id: true,
            pteroId: true,
            identifier: true,
            name: true,
            description: true,
            status: true,
            suspended: true
          }
        }
      }
    });

    const servers = serverSettings.map(setting => ({
      id: setting.pterodactylServer.id,
      pteroId: setting.pterodactylServer.pteroId,
      identifier: setting.pterodactylServer.identifier,
      name: setting.pterodactylServer.name,
      description: setting.pterodactylServer.description,
      status: setting.pterodactylServer.status,
      suspended: setting.pterodactylServer.suspended,
      databaseSettings: {
        host: setting.databaseHost,
        name: setting.databaseName,
        username: setting.databaseUser,
        password: setting.databasePassword
      }
    }));

    return NextResponse.json({ servers });

  } catch (error) {
    console.error('Get user servers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch servers' },
      { status: 500 }
    );
  }
}