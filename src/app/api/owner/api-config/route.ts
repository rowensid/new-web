import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (name) {
      // Get specific API configuration
      const config = await db.apiConfiguration.findUnique({
        where: { name }
      });

      if (!config) {
        return NextResponse.json({ error: 'API configuration not found' }, { status: 404 });
      }

      // Don't expose the full API key in response
      const { apiKey, ...configWithoutKey } = config;
      return NextResponse.json({
        ...configWithoutKey,
        apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : null
      });
    }

    // Get all API configurations
    const configs = await db.apiConfiguration.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Don't expose full API keys
    const sanitizedConfigs = configs.map(config => ({
      ...config,
      apiKey: config.apiKey ? `${config.apiKey.substring(0, 8)}...` : null
    }));

    return NextResponse.json(sanitizedConfigs);
  } catch (error) {
    console.error('Failed to fetch API configurations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API configurations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, apiUrl, apiKey, description } = body;

    if (!name || !apiUrl || !apiKey) {
      return NextResponse.json(
        { error: 'Name, API URL, and API Key are required' },
        { status: 400 }
      );
    }

    // Check if configuration already exists
    const existingConfig = await db.apiConfiguration.findUnique({
      where: { name }
    });

    if (existingConfig) {
      // Update existing configuration
      const updatedConfig = await db.apiConfiguration.update({
        where: { name },
        data: {
          apiUrl,
          apiKey,
          description,
          updatedAt: new Date()
        }
      });

      const { apiKey: _, ...configWithoutKey } = updatedConfig;
      return NextResponse.json({
        ...configWithoutKey,
        apiKey: `${updatedConfig.apiKey.substring(0, 8)}...`
      });
    }

    // Create new configuration
    const config = await db.apiConfiguration.create({
      data: {
        id: `api_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name,
        apiUrl,
        apiKey,
        description
      }
    });

    const { apiKey: _, ...configWithoutKey } = config;
    return NextResponse.json({
      ...configWithoutKey,
      apiKey: `${config.apiKey.substring(0, 8)}...`
    });
  } catch (error) {
    console.error('Failed to save API configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save API configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const config = await db.apiConfiguration.update({
      where: { name },
      data: { isActive }
    });

    const { apiKey, ...configWithoutKey } = config;
    return NextResponse.json({
      ...configWithoutKey,
      apiKey: config.apiKey ? `${config.apiKey.substring(0, 8)}...` : null
    });
  } catch (error) {
    console.error('Failed to update API configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update API configuration' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    await db.apiConfiguration.delete({
      where: { name }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete API configuration:', error);
    return NextResponse.json(
      { error: 'Failed to delete API configuration' },
      { status: 500 }
    );
  }
}