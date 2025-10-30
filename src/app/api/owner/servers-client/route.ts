import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');
    const action = searchParams.get('action');

    // Load Pterodactyl config from database
    const config = await db.apiConfiguration.findFirst({
      where: { name: 'Pterodactyl', isActive: true }
    });

    if (!config) {
      return NextResponse.json({ error: 'Pterodactyl not configured' }, { status: 404 });
    }

    // Return config for client-side request
    return NextResponse.json({
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
      serverId,
      action
    });
  } catch (error) {
    console.error('Client servers API error:', error);
    return NextResponse.json(
      { error: 'Failed to get server config' },
      { status: 500 }
    );
  }
}