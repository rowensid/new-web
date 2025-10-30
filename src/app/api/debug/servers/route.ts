import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Check PterodactylServer
    const pteroServers = await db.pterodactylServer.findMany({
      select: {
        id: true,
        pteroId: true,
        name: true,
        status: true
      },
      take: 5
    });

    // Check ServerSettings
    const serverSettings = await db.serverSettings.findMany({
      include: {
        pterodactylServer: {
          select: {
            id: true,
            pteroId: true,
            name: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      take: 5
    });

    // Check users
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      take: 5
    });

    return NextResponse.json({
      pteroServers,
      serverSettings,
      users,
      counts: {
        pteroServers: await db.pterodactylServer.count(),
        serverSettings: await db.serverSettings.count(),
        users: await db.user.count()
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
}