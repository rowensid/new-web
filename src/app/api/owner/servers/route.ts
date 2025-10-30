import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');
    const action = searchParams.get('action');

    // Load Pterodactyl config directly from database
    const config = await db.apiConfiguration.findFirst({
      where: { name: 'Pterodactyl', isActive: true }
    });

    if (!config) {
      return NextResponse.json({ error: 'Pterodactyl not configured' }, { status: 404 });
    }

    // Make direct request to Pterodactyl API
    const baseUrl = config.apiUrl.endsWith('/') ? config.apiUrl.slice(0, -1) : config.apiUrl;
    
    // Get specific server
    if (serverId && !action) {
      const response = await fetch(`${baseUrl}/api/application/servers/${serverId}`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch server: ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // Get server resources
    if (serverId && action === 'resources') {
      const response = await fetch(`${baseUrl}/api/application/servers/${serverId}/resources`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch server resources: ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // Get all servers
    const response = await fetch(`${baseUrl}/api/application/servers?include=egg,node,allocations`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch servers: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Servers API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch servers', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverId, action } = body;

    if (!serverId || !action) {
      return NextResponse.json({ error: 'Server ID and action required' }, { status: 400 });
    }

    // Validate action - ONLY ALLOW POWER ACTIONS, NOT DELETE
    const validActions = ['start', 'stop', 'restart', 'kill'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ 
        error: `Invalid action: ${action}. Only power actions allowed: ${validActions.join(', ')}` 
      }, { status: 400 });
    }

    // EXTRA SAFETY: NEVER ALLOW DELETE OPERATIONS
    if (action.toLowerCase().includes('delete') || action.toLowerCase().includes('remove')) {
      return NextResponse.json({ 
        error: 'Delete operations are not allowed through this endpoint' 
      }, { status: 403 });
    }

    // Load Pterodactyl config
    const config = await db.apiConfiguration.findFirst({
      where: { name: 'Pterodactyl', isActive: true }
    });

    if (!config) {
      return NextResponse.json({ error: 'Pterodactyl not configured' }, { status: 404 });
    }

    // Power actions - USING POST METHOD FOR START/STOP/RESTART
    const baseUrl = config.apiUrl.endsWith('/') ? config.apiUrl.slice(0, -1) : config.apiUrl;
    
    console.log(`Attempting ${action} on server ${serverId}`);
    console.log(`API URL: ${baseUrl}/api/application/servers/${serverId}/power`);
    
    const response = await fetch(`${baseUrl}/api/application/servers/${serverId}/power`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ signal: action })
    });

    console.log(`Response status: ${response.status}`);
    console.log(`Response ok: ${response.ok}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response: ${errorText}`);
      throw new Error(`Failed to perform server action: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log(`Success response:`, responseData);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Server action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform server action', details: error.message },
      { status: 500 }
    );
  }
}