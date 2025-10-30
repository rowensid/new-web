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
      return NextResponse.json({ error: 'Server ID required' }, { status: 400 });
    }

    // No need to convert serverId - it's already pteroId from Pterodactyl API
    const serverIdString = serverId.toString();

    const settings = await db.serverSettings.findUnique({
      where: { pterodactylServerId: serverIdString },
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

export async function POST(request: NextRequest) {
  try {
    console.log('POST server-settings called');
    
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
    
    const { serverId, assignedUserId, panelUrl, txadminUrl, databaseHost, databaseName, databaseUser, databasePassword } = body;

    if (!serverId) {
      console.log('Missing serverId');
      return NextResponse.json({ error: 'Server ID required' }, { status: 400 });
    }

    console.log('Processing server settings for pteroId:', serverId);

    // No need to convert serverId - it's already pteroId from Pterodactyl API
    const serverIdString = serverId.toString();
    console.log('Looking for server settings with pterodactylServerId:', serverIdString);

    // Validate assignedUserId if provided
    let validAssignedUserId = null;
    if (assignedUserId && assignedUserId !== '' && assignedUserId !== null) {
      console.log('Validating assignedUserId:', assignedUserId);
      // Check if user exists
      const user = await db.user.findUnique({
        where: { id: assignedUserId },
        select: { id: true }
      });
      
      if (user) {
        validAssignedUserId = assignedUserId;
        console.log('User validation passed for user:', user.id);
      } else {
        console.log('User validation failed - user not found with ID:', assignedUserId);
        // Continue with null assignedUserId instead of failing
      }
    } else {
      console.log('No assignedUserId provided or is empty');
    }

    console.log('Upserting server settings...');
    console.log('Data to upsert:', {
      pterodactylServerId: serverIdString,
      assignedUserId: validAssignedUserId,
      panelUrl,
      txadminUrl,
      databaseHost,
      databaseName,
      databaseUser,
      databasePassword
    });

    // First try to create without relations to avoid foreign key issues
    try {
      const settings = await db.serverSettings.upsert({
        where: { pterodactylServerId: serverIdString },
        update: {
          assignedUserId: validAssignedUserId,
          panelUrl,
          txadminUrl,
          databaseHost,
          databaseName,
          databaseUser,
          databasePassword,
        },
        create: {
          pterodactylServerId: serverIdString,
          assignedUserId: validAssignedUserId,
          panelUrl,
          txadminUrl,
          databaseHost,
          databaseName,
          databaseUser,
          databasePassword,
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

      console.log('Settings saved successfully:', settings.id);
      return NextResponse.json({ 
        success: true, 
        message: 'Server settings updated successfully',
        settings 
      });
    } catch (upsertError) {
      console.error('Upsert failed:', upsertError);
      
      // If upsert fails due to foreign key, try without assignedUserId
      if (upsertError.message.includes('foreign key')) {
        console.log('Retrying without assignedUserId due to foreign key constraint');
        const settings = await db.serverSettings.upsert({
          where: { pterodactylServerId: serverIdString },
          update: {
            assignedUserId: null,
            panelUrl,
            txadminUrl,
            databaseHost,
            databaseName,
            databaseUser,
            databasePassword,
          },
          create: {
            pterodactylServerId: serverIdString,
            assignedUserId: null,
            panelUrl,
            txadminUrl,
            databaseHost,
            databaseName,
            databaseUser,
            databasePassword,
          }
        });

        console.log('Settings saved without assignedUserId:', settings.id);
        return NextResponse.json({ 
          success: true, 
          message: 'Server settings updated successfully (user assignment ignored)',
          settings 
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