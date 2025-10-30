import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get admin user
    const admin = await db.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });

    if (!admin) {
      return NextResponse.json({ error: 'No admin user found' }, { status: 404 });
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

    return NextResponse.json({ 
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      },
      servers,
      count: servers.length
    });

  } catch (error) {
    console.error('Admin test error:', error);
    return NextResponse.json({ error: 'Failed to test admin access' }, { status: 500 });
  }
}