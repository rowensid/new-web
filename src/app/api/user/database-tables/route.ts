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
      },
      include: {
        pterodactylServer: {
          select: { name: true }
        }
      }
    });

    if (!serverSetting) {
      return NextResponse.json(
        { error: 'Server not found or not assigned to you' },
        { status: 404 }
      );
    }

    // Return different tables based on server type
    let tables = [];
    
    if (serverSetting.pterodactylServer.name.includes('FiveM')) {
      // FiveM Server Tables
      tables = [
        {
          name: 'users',
          rows: 1250,
          size: '2.8 MB',
          engine: 'InnoDB',
          collation: 'utf8mb4_unicode_ci'
        },
        {
          name: 'player_characters',
          rows: 3420,
          size: '4.2 MB',
          engine: 'InnoDB',
          collation: 'utf8mb4_unicode_ci'
        },
        {
          name: 'vehicles',
          rows: 890,
          size: '1.5 MB',
          engine: 'InnoDB',
          collation: 'utf8mb4_unicode_ci'
        },
        {
          name: 'player_inventory',
          rows: 15600,
          size: '8.7 MB',
          engine: 'InnoDB',
          collation: 'utf8mb4_unicode_ci'
        },
        {
          name: 'properties',
          rows: 450,
          size: '890 KB',
          engine: 'InnoDB',
          collation: 'utf8mb4_unicode_ci'
        },
        {
          name: 'jobs',
          rows: 28,
          size: '156 KB',
          engine: 'InnoDB',
          collation: 'utf8mb4_unicode_ci'
        },
        {
          name: 'bank_accounts',
          rows: 1250,
          size: '2.1 MB',
          engine: 'InnoDB',
          collation: 'utf8mb4_unicode_ci'
        },
        {
          name: 'server_logs',
          rows: 45680,
          size: '23.4 MB',
          engine: 'InnoDB',
          collation: 'utf8mb4_unicode_ci'
        }
      ];
    } else if (serverSetting.pterodactylServer.name.includes('RDP')) {
      // RDP Server Tables
      tables = [
        {
          name: 'rdp_sessions',
          rows: 156,
          size: '456 KB',
          engine: 'InnoDB',
          collation: 'utf8mb4_unicode_ci'
        },
        {
          name: 'user_accounts',
          rows: 89,
          size: '234 KB',
          engine: 'InnoDB',
          collation: 'utf8mb4_unicode_ci'
        },
        {
          name: 'application_logs',
          rows: 3420,
          size: '1.8 MB',
          engine: 'InnoDB',
          collation: 'utf8mb4_unicode_ci'
        },
        {
          name: 'system_metrics',
          rows: 15240,
          size: '12.3 MB',
          engine: 'InnoDB',
          collation: 'utf8mb4_unicode_ci'
        },
        {
          name: 'file_access',
          rows: 5670,
          size: '3.4 MB',
          engine: 'InnoDB',
          collation: 'utf8mb4_unicode_ci'
        }
      ];
    } else if (serverSetting.pterodactylServer.name.includes('Development')) {
      // Development Server Tables
      tables = [
        {
          name: 'projects',
          rows: 45,
          size: '128 KB',
          engine: 'InnoDB',
          collation: 'utf8mb4_unicode_ci'
        },
        {
          name: 'code_revisions',
          rows: 892,
          size: '2.1 MB',
          engine: 'InnoDB',
          collation: 'utf8mb4_unicode_ci'
        },
        {
          name: 'build_logs',
          rows: 3450,
          size: '5.6 MB',
          engine: 'InnoDB',
          collation: 'utf8mb4_unicode_ci'
        },
        {
          name: 'test_results',
          rows: 12340,
          size: '8.9 MB',
          engine: 'InnoDB',
          collation: 'utf8mb4_unicode_ci'
        },
        {
          name: 'deployments',
          rows: 234,
          size: '567 KB',
          engine: 'InnoDB',
          collation: 'utf8mb4_unicode_ci'
        },
        {
          name: 'api_keys',
          rows: 12,
          size: '45 KB',
          engine: 'InnoDB',
          collation: 'utf8mb4_unicode_ci'
        }
      ];
    } else {
      // Default tables
      tables = [
        {
          name: 'users',
          rows: 150,
          size: '45.2 KB',
          engine: 'InnoDB',
          collation: 'utf8mb4_unicode_ci'
        },
        {
          name: 'settings',
          rows: 25,
          size: '12.8 KB',
          engine: 'InnoDB',
          collation: 'utf8mb4_unicode_ci'
        },
        {
          name: 'logs',
          rows: 8950,
          size: '15.6 MB',
          engine: 'InnoDB',
          collation: 'utf8mb4_unicode_ci'
        }
      ];
    }

    return NextResponse.json({ tables });

  } catch (error) {
    console.error('Get database tables error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database tables' },
      { status: 500 }
    );
  }
}