import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
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
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    // Check if user is admin or owner
    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get ALL servers (admin/owner can access all)
    const pteroServers = await db.pterodactylServer.findMany({
      include: {
        settings: {
          include: {
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });

    const servers = pteroServers.map(server => ({
      id: server.id,
      pteroId: server.pteroId,
      identifier: server.identifier,
      name: server.name,
      description: server.description,
      status: server.status,
      suspended: server.suspended,
      databaseSettings: server.settings ? {
        host: server.settings.databaseHost,
        name: server.settings.databaseName,
        username: server.settings.databaseUser,
        password: server.settings.databasePassword
      } : null,
      assignedUser: server.settings?.assignedUser ? {
        id: server.settings.assignedUser.id,
        name: server.settings.assignedUser.name,
        email: server.settings.assignedUser.email,
        role: server.settings.assignedUser.role
      } : null
    }));

    return NextResponse.json({ servers });

  } catch (error) {
    console.error('Get admin database servers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch servers' },
      { status: 500 }
    );
  }
}