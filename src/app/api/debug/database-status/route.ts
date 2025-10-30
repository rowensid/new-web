import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get all servers with their database settings
    const servers = await db.pterodactylServer.findMany({
      include: {
        settings: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    const serverStatus = servers.map(server => ({
      id: server.id,
      pteroId: server.pteroId,
      name: server.name,
      identifier: server.identifier,
      status: server.status,
      hasDatabase: !!server.settings,
      databaseConfig: server.settings ? {
        host: server.settings.databaseHost,
        port: server.settings.databasePort,
        name: server.settings.databaseName,
        user: server.settings.databaseUser,
        hasPassword: !!server.settings.databasePassword
      } : null,
      assignedUser: server.user ? {
        id: server.user.id,
        name: server.user.name,
        email: server.user.email,
        role: server.user.role
      } : null
    }));

    return NextResponse.json({
      totalServers: servers.length,
      serversWithDatabase: servers.filter(s => s.settings).length,
      servers: serverStatus
    });

  } catch (error) {
    console.error('Database status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check database status' },
      { status: 500 }
    );
  }
}