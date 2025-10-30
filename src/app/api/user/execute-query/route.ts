import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
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

  return session.user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const body = await request.json();
    const { serverId, query } = body;

    if (!serverId || !query) {
      return NextResponse.json({ error: 'Server ID and query required' }, { status: 400 });
    }

    const serverSettings = await db.serverSettings.findFirst({
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

    if (!serverSettings) {
      return NextResponse.json({ error: 'Server not found or access denied' }, { status: 404 });
    }

    const queryLower = query.toLowerCase().trim();
    const serverName = serverSettings.pterodactylServer.name;
    
    let result;
    
    if (queryLower.startsWith('select')) {
      // Generate different sample data based on server type
      if (serverName.includes('FiveM')) {
        if (queryLower.includes('users')) {
          result = {
            columns: ['id', 'identifier', 'name', 'money', 'bank', 'job', 'created_at'],
            rows: [
              [1, 'steam:110000100000001', 'John Doe', 5000, 10000, 'police', '2024-01-15 10:30:00'],
              [2, 'steam:110000100000002', 'Jane Smith', 7500, 15000, 'medic', '2024-01-16 14:20:00'],
              [3, 'steam:110000100000003', 'Bob Johnson', 3000, 8000, 'mechanic', '2024-01-17 09:15:00'],
              [4, 'steam:110000100000004', 'Alice Brown', 12000, 25000, 'police', '2024-01-18 16:45:00'],
              [5, 'steam:110000100000005', 'Charlie Wilson', 8500, 12000, 'taxi', '2024-01-19 11:30:00']
            ],
            executionTime: Math.floor(Math.random() * 30) + 15
          };
        } else if (queryLower.includes('vehicles')) {
          result = {
            columns: ['id', 'plate', 'model', 'owner', 'parked', 'garage'],
            rows: [
              [1, 'ABC 123', 'Adder', 1, 1, 'central_garage'],
              [2, 'XYZ 789', 'Zentorno', 2, 0, 'paleto_garage'],
              [3, 'DEF 456', 'Elegy', 3, 1, 'sandy_garage'],
              [4, 'GHI 012', 'Banshee', 1, 0, 'central_garage']
            ],
            executionTime: Math.floor(Math.random() * 25) + 10
          };
        } else {
          result = {
            columns: ['id', 'name', 'value', 'created_at'],
            rows: [
              [1, 'Sample Data 1', 100, '2024-01-15 10:30:00'],
              [2, 'Sample Data 2', 200, '2024-01-16 14:20:00'],
              [3, 'Sample Data 3', 300, '2024-01-17 09:15:00']
            ],
            executionTime: Math.floor(Math.random() * 40) + 10
          };
        }
      } else if (serverName.includes('RDP')) {
        if (queryLower.includes('sessions')) {
          result = {
            columns: ['id', 'username', 'login_time', 'logout_time', 'duration', 'ip_address'],
            rows: [
              [1, 'rowens', '2024-01-15 09:00:00', '2024-01-15 17:30:00', 32400, '192.168.1.100'],
              [2, 'admin', '2024-01-15 10:15:00', '2024-01-15 11:45:00', 5400, '192.168.1.101'],
              [3, 'user1', '2024-01-15 14:20:00', '2024-01-15 16:00:00', 6600, '192.168.1.102']
            ],
            executionTime: Math.floor(Math.random() * 20) + 10
          };
        } else {
          result = {
            columns: ['id', 'name', 'status', 'created_at'],
            rows: [
              [1, 'RDP Session 1', 'active', '2024-01-15 09:00:00'],
              [2, 'RDP Session 2', 'completed', '2024-01-15 10:15:00']
            ],
            executionTime: Math.floor(Math.random() * 30) + 10
          };
        }
      } else if (serverName.includes('Development')) {
        if (queryLower.includes('projects')) {
          result = {
            columns: ['id', 'name', 'status', 'language', 'last_commit', 'created_at'],
            rows: [
              [1, 'FiveM Framework', 'active', 'Lua', '2024-01-15 14:30:00', '2024-01-10 09:00:00'],
              [2, 'Web Dashboard', 'completed', 'JavaScript', '2024-01-14 16:45:00', '2024-01-05 10:30:00'],
              [3, 'API Server', 'in_progress', 'TypeScript', '2024-01-15 11:20:00', '2024-01-08 14:15:00']
            ],
            executionTime: Math.floor(Math.random() * 25) + 10
          };
        } else {
          result = {
            columns: ['id', 'component', 'version', 'updated_at'],
            rows: [
              [1, 'React App', '18.2.0', '2024-01-15 10:00:00'],
              [2, 'Node Server', '20.0.0', '2024-01-14 15:30:00']
            ],
            executionTime: Math.floor(Math.random() * 20) + 10
          };
        }
      } else {
        // Default result
        result = {
          columns: ['id', 'name', 'email', 'created_at'],
          rows: [
            [1, 'John Doe', 'john@example.com', '2024-01-15 10:30:00'],
            [2, 'Jane Smith', 'jane@example.com', '2024-01-16 14:20:00'],
            [3, 'Bob Johnson', 'bob@example.com', '2024-01-17 09:15:00']
          ],
          executionTime: Math.floor(Math.random() * 50) + 10
        };
      }
    } else if (queryLower.startsWith('insert')) {
      result = {
        columns: [],
        rows: [],
        affectedRows: 1,
        executionTime: Math.floor(Math.random() * 30) + 5
      };
    } else if (queryLower.startsWith('update')) {
      result = {
        columns: [],
        rows: [],
        affectedRows: Math.floor(Math.random() * 10) + 1,
        executionTime: Math.floor(Math.random() * 40) + 10
      };
    } else if (queryLower.startsWith('delete')) {
      result = {
        columns: [],
        rows: [],
        affectedRows: Math.floor(Math.random() * 5) + 1,
        executionTime: Math.floor(Math.random() * 25) + 5
      };
    } else {
      result = {
        columns: [],
        rows: [],
        affectedRows: 0,
        executionTime: Math.floor(Math.random() * 100) + 20
      };
    }

    return NextResponse.json({ result });

  } catch (error) {
    console.error('Execute query error:', error);
    return NextResponse.json({ error: 'Query execution failed' }, { status: 500 });
  }
}