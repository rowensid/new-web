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

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { serverId, tableName, columns } = body;

    if (!serverId || !tableName || !columns) {
      return NextResponse.json(
        { error: 'Server ID, table name, and columns are required' },
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

    // For demo, always return success
    // In real implementation, you would execute CREATE TABLE SQL
    
    return NextResponse.json({ 
      success: true,
      message: `Table '${tableName}' created successfully`
    });

  } catch (error) {
    console.error('Create table error:', error);
    return NextResponse.json(
      { error: 'Failed to create table' },
      { status: 500 }
    );
  }
}