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
          role: true
        }
      }
    }
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  // Check if user is ADMIN or OWNER
  if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
    return null;
  }

  return session.user;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const { id: serverId } = await params;

    if (!serverId) {
      return NextResponse.json({ error: 'Server ID required' }, { status: 400 });
    }

    // Validate that the PterodactylServer exists
    const pteroServer = await db.pterodactylServer.findUnique({
      where: { pteroId: serverId },
      select: { pteroId: true, name: true }
    });

    if (!pteroServer) {
      console.log('PterodactylServer not found with pteroId:', serverId);
      return NextResponse.json({ 
        error: `Server dengan ID '${serverId}' tidak ditemukan di database. Pastikan server sudah di-sync dari Pterodactyl panel.`,
        details: `Server ID: ${serverId}. Pastikan server ini ada di Pterodactyl panel dan sudah di-sync ke sistem.`
      }, { status: 404 });
    }

    const settings = await db.serverSettings.findUnique({
      where: { pterodactylServerId: serverId },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ settings });

  } catch (error) {
    console.error('Get server settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch server settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('POST server-settings called for server:', (await params).id);
    
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      console.log('Authentication failed');
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.id, user.role);

    const body = await request.json();
    console.log('Request body:', body);
    
    const { settings } = body;
    const { id: serverId } = await params;

    if (!serverId) {
      console.log('Missing serverId');
      return NextResponse.json({ error: 'Server ID required' }, { status: 400 });
    }

    if (!settings) {
      console.log('Missing settings in request body');
      return NextResponse.json({ error: 'Settings data required' }, { status: 400 });
    }

    console.log('Processing server settings for pteroId:', serverId);

    // Validate that the PterodactylServer exists
    const pteroServer = await db.pterodactylServer.findUnique({
      where: { pteroId: serverId },
      select: { pteroId: true, name: true }
    });

    if (!pteroServer) {
      console.log('PterodactylServer not found with pteroId:', serverId);
      return NextResponse.json({ 
        error: `Server dengan ID '${serverId}' tidak ditemukan di database. Pastikan server sudah di-sync dari Pterodactyl panel.`,
        details: `Server ID: ${serverId}. Pastikan server ini ada di Pterodactyl panel dan sudah di-sync ke sistem.`
      }, { status: 404 });
    }

    console.log('PterodactylServer found:', pteroServer.name, pteroServer.pteroId);

    // Validate assignedUserId if provided
    let validAssignedUserId = null;
    if (settings.assignedUserId && settings.assignedUserId !== '' && settings.assignedUserId !== null) {
      console.log('Validating assignedUserId:', settings.assignedUserId);
      // Check if user exists
      const user = await db.user.findUnique({
        where: { id: settings.assignedUserId },
        select: { id: true }
      });
      
      if (user) {
        validAssignedUserId = settings.assignedUserId;
        console.log('User validation passed for user:', user.id);
      } else {
        console.log('User validation failed - user not found with ID:', settings.assignedUserId);
        // Continue with null assignedUserId instead of failing
      }
    } else {
      console.log('No assignedUserId provided or is empty');
    }

    console.log('Upserting server settings...');
    console.log('Data to upsert:', {
      pterodactylServerId: serverId,
      assignedUserId: validAssignedUserId,
      panelUrl: settings.panelUrl,
      txadminUrl: settings.txadminUrl,
      databaseHost: settings.databaseHost,
      databasePort: settings.databasePort,
      databaseName: settings.databaseName,
      databaseUser: settings.databaseUser,
      databasePassword: settings.databasePassword
    });

    // First try to create without relations to avoid foreign key issues
    try {
      const savedSettings = await db.serverSettings.upsert({
        where: { pterodactylServerId: serverId },
        update: {
          assignedUserId: validAssignedUserId,
          panelUrl: settings.panelUrl,
          txadminUrl: settings.txadminUrl,
          databaseHost: settings.databaseHost,
          databasePort: settings.databasePort,
          databaseName: settings.databaseName,
          databaseUser: settings.databaseUser,
          databasePassword: settings.databasePassword,
        },
        create: {
          pterodactylServerId: serverId,
          assignedUserId: validAssignedUserId,
          panelUrl: settings.panelUrl,
          txadminUrl: settings.txadminUrl,
          databaseHost: settings.databaseHost,
          databasePort: settings.databasePort,
          databaseName: settings.databaseName,
          databaseUser: settings.databaseUser,
          databasePassword: settings.databasePassword,
        },
        include: {
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      console.log('Settings saved successfully:', savedSettings.id);
      return NextResponse.json({ 
        success: true, 
        message: 'Server settings updated successfully',
        settings: savedSettings
      });
    } catch (upsertError) {
      console.error('Upsert failed:', upsertError);
      
      // If upsert fails due to foreign key, try without assignedUserId
      if (upsertError.message.includes('foreign key')) {
        console.log('Retrying without assignedUserId due to foreign key constraint');
        const savedSettings = await db.serverSettings.upsert({
          where: { pterodactylServerId: serverId },
          update: {
            assignedUserId: null,
            panelUrl: settings.panelUrl,
            txadminUrl: settings.txadminUrl,
            databaseHost: settings.databaseHost,
            databasePort: settings.databasePort,
            databaseName: settings.databaseName,
            databaseUser: settings.databaseUser,
            databasePassword: settings.databasePassword,
          },
          create: {
            pterodactylServerId: serverId,
            assignedUserId: null,
            panelUrl: settings.panelUrl,
            txadminUrl: settings.txadminUrl,
            databaseHost: settings.databaseHost,
            databasePort: settings.databasePort,
            databaseName: settings.databaseName,
            databaseUser: settings.databaseUser,
            databasePassword: settings.databasePassword,
          }
        });

        console.log('Settings saved without assignedUserId:', savedSettings.id);
        return NextResponse.json({ 
          success: true, 
          message: 'Server settings updated successfully (user assignment ignored)',
          settings: savedSettings
        });
      }
      
      throw upsertError;
    }

  } catch (error) {
    console.error('Update server settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update server settings: ' + error.message },
      { status: 500 }
    );
  }
}