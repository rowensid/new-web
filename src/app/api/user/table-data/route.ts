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
    const table = searchParams.get('table');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';

    if (!serverId || !table) {
      return NextResponse.json(
        { error: 'Server ID and table name are required' },
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

    const serverName = serverSetting.pterodactylServer.name;
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    // Generate different sample data based on server type and table
    let columns: string[] = [];
    let rows: any[][] = [];
    let totalRows = 0;

    if (serverName.includes('FiveM')) {
      if (table === 'users') {
        columns = ['id', 'identifier', 'name', 'money', 'bank', 'job', 'created_at'];
        const sampleUsers = [
          [1, 'steam:110000100000001', 'John Doe', 5000, 10000, 'police', '2024-01-15 10:30:00'],
          [2, 'steam:110000100000002', 'Jane Smith', 7500, 15000, 'medic', '2024-01-16 14:20:00'],
          [3, 'steam:110000100000003', 'Bob Johnson', 3000, 8000, 'mechanic', '2024-01-17 09:15:00'],
          [4, 'steam:110000100000004', 'Alice Brown', 12000, 25000, 'police', '2024-01-18 16:45:00'],
          [5, 'steam:110000100000005', 'Charlie Wilson', 8500, 12000, 'taxi', '2024-01-19 11:30:00'],
          [6, 'steam:110000100000006', 'Diana Prince', 15000, 30000, 'lawyer', '2024-01-20 13:15:00'],
          [7, 'steam:110000100000007', 'Edward Norton', 6000, 9000, 'firefighter', '2024-01-21 08:45:00'],
          [8, 'steam:110000100000008', 'Frank Castle', 20000, 50000, 'police', '2024-01-22 15:30:00'],
          [9, 'steam:110000100000009', 'Grace Kelly', 4500, 7000, 'judge', '2024-01-23 10:00:00'],
          [10, 'steam:110000100000010', 'Henry Ford', 3500, 6000, 'mechanic', '2024-01-24 12:20:00'],
          [11, 'steam:110000100000011', 'Irene Adler', 9000, 12000, 'detective', '2024-01-25 14:10:00'],
          [12, 'steam:110000100000012', 'Jack Reacher', 8000, 11000, 'security', '2024-01-26 09:30:00'],
          [13, 'steam:110000100000013', 'Kate Beckett', 7000, 9500, 'writer', '2024-01-27 16:45:00'],
          [14, 'steam:110000100000014', 'Liam Neeson', 11000, 18000, 'actor', '2024-01-28 11:20:00'],
          [15, 'steam:110000100000015', 'Mona Lisa', 13000, 22000, 'artist', '2024-01-29 13:55:00'],
          [16, 'steam:110000100000016', 'Nathan Drake', 10000, 15000, 'treasure_hunter', '2024-01-30 10:15:00'],
          [17, 'steam:110000100000017', 'Olivia Pope', 8500, 13000, 'lawyer', '2024-01-31 14:40:00'],
          [18, 'steam:110000100000018', 'Peter Parker', 6000, 8000, 'photographer', '2024-02-01 09:25:00'],
          [19, 'steam:110000100000019', 'Quentin Tarantino', 25000, 45000, 'director', '2024-02-02 16:10:00'],
          [20, 'steam:110000100000020', 'Rachel Green', 4000, 6000, 'waitress', '2024-02-03 12:50:00']
        ];
        
        totalRows = 1250;
        rows = sampleUsers.slice(offset, offset + pageSize);
        
        if (search) {
          rows = sampleUsers.filter(row => 
            row.some(cell => cell.toString().toLowerCase().includes(search.toLowerCase()))
          );
          totalRows = rows.length;
        }
      } else if (table === 'vehicles') {
        columns = ['id', 'plate', 'model', 'owner', 'parked', 'garage', 'color'];
        const sampleVehicles = [
          [1, 'ABC 123', 'Adder', 1, 1, 'central_garage', 'Red'],
          [2, 'XYZ 789', 'Zentorno', 2, 0, 'paleto_garage', 'Blue'],
          [3, 'DEF 456', 'Elegy', 3, 1, 'sandy_garage', 'Black'],
          [4, 'GHI 012', 'Banshee', 1, 0, 'central_garage', 'White'],
          [5, 'JKL 345', 'Turismo', 4, 1, 'davis_garage', 'Green'],
          [6, 'MNO 678', 'Comet', 5, 0, 'paleto_garage', 'Yellow'],
          [7, 'PQR 901', 'Infernus', 2, 1, 'sandy_garage', 'Orange'],
          [8, 'STU 234', 'Sultan', 6, 1, 'central_garage', 'Purple'],
          [9, 'VWX 567', 'Feltzer', 3, 0, 'davis_garage', 'Pink'],
          [10, 'YZA 890', 'Blista', 4, 1, 'paleto_garage', 'Silver']
        ];
        
        totalRows = 890;
        rows = sampleVehicles.slice(offset, offset + pageSize);
        
        if (search) {
          rows = sampleVehicles.filter(row => 
            row.some(cell => cell.toString().toLowerCase().includes(search.toLowerCase()))
          );
          totalRows = rows.length;
        }
      } else if (table === 'player_characters') {
        columns = ['id', 'user_id', 'first_name', 'last_name', 'age', 'gender', 'job', 'created_at'];
        const sampleCharacters = [
          [1, 1, 'John', 'Doe', 28, 'Male', 'Police Officer', '2024-01-15 10:30:00'],
          [2, 2, 'Jane', 'Smith', 25, 'Female', 'Paramedic', '2024-01-16 14:20:00'],
          [3, 3, 'Bob', 'Johnson', 32, 'Male', 'Mechanic', '2024-01-17 09:15:00'],
          [4, 4, 'Alice', 'Brown', 29, 'Female', 'Police Officer', '2024-01-18 16:45:00'],
          [5, 5, 'Charlie', 'Wilson', 35, 'Male', 'Taxi Driver', '2024-01-19 11:30:00'],
          [6, 6, 'Diana', 'Prince', 31, 'Female', 'Lawyer', '2024-01-20 13:15:00'],
          [7, 7, 'Edward', 'Norton', 40, 'Male', 'Firefighter', '2024-01-21 08:45:00'],
          [8, 8, 'Frank', 'Castle', 45, 'Male', 'Police Officer', '2024-01-22 15:30:00'],
          [9, 9, 'Grace', 'Kelly', 38, 'Female', 'Judge', '2024-01-23 10:00:00'],
          [10, 10, 'Henry', 'Ford', 42, 'Male', 'Mechanic', '2024-01-24 12:20:00']
        ];
        
        totalRows = 3420;
        rows = sampleCharacters.slice(offset, offset + pageSize);
        
        if (search) {
          rows = sampleCharacters.filter(row => 
            row.some(cell => cell.toString().toLowerCase().includes(search.toLowerCase()))
          );
          totalRows = rows.length;
        }
      } else {
        // Default table structure
        columns = ['id', 'name', 'value', 'created_at'];
        const sampleData = [
          [1, 'Sample Data 1', 100, '2024-01-15 10:30:00'],
          [2, 'Sample Data 2', 200, '2024-01-16 14:20:00'],
          [3, 'Sample Data 3', 300, '2024-01-17 09:15:00'],
          [4, 'Sample Data 4', 400, '2024-01-18 16:45:00'],
          [5, 'Sample Data 5', 500, '2024-01-19 11:30:00']
        ];
        
        totalRows = 50;
        rows = sampleData.slice(offset, offset + pageSize);
        
        if (search) {
          rows = sampleData.filter(row => 
            row.some(cell => cell.toString().toLowerCase().includes(search.toLowerCase()))
          );
          totalRows = rows.length;
        }
      }
    } else if (serverName.includes('RDP')) {
      if (table === 'rdp_sessions') {
        columns = ['id', 'username', 'login_time', 'logout_time', 'duration', 'ip_address', 'status'];
        const sampleSessions = [
          [1, 'rowens', '2024-01-15 09:00:00', '2024-01-15 17:30:00', 32400, '192.168.1.100', 'completed'],
          [2, 'admin', '2024-01-15 10:15:00', '2024-01-15 11:45:00', 5400, '192.168.1.101', 'completed'],
          [3, 'user1', '2024-01-15 14:20:00', '2024-01-15 16:00:00', 6600, '192.168.1.102', 'completed'],
          [4, 'user2', '2024-01-16 08:30:00', '2024-01-16 12:00:00', 12600, '192.168.1.103', 'completed'],
          [5, 'user3', '2024-01-16 13:45:00', '2024-01-16 18:00:00', 15300, '192.168.1.104', 'completed']
        ];
        
        totalRows = 156;
        rows = sampleSessions.slice(offset, offset + pageSize);
        
        if (search) {
          rows = sampleSessions.filter(row => 
            row.some(cell => cell.toString().toLowerCase().includes(search.toLowerCase()))
          );
          totalRows = rows.length;
        }
      } else {
        columns = ['id', 'name', 'status', 'created_at'];
        const sampleData = [
          [1, 'RDP Session 1', 'active', '2024-01-15 09:00:00'],
          [2, 'RDP Session 2', 'completed', '2024-01-15 10:15:00']
        ];
        
        totalRows = 50;
        rows = sampleData.slice(offset, offset + pageSize);
        
        if (search) {
          rows = sampleData.filter(row => 
            row.some(cell => cell.toString().toLowerCase().includes(search.toLowerCase()))
          );
          totalRows = rows.length;
        }
      }
    } else if (serverName.includes('Development')) {
      if (table === 'projects') {
        columns = ['id', 'name', 'status', 'language', 'last_commit', 'created_at'];
        const sampleProjects = [
          [1, 'FiveM Framework', 'active', 'Lua', '2024-01-15 14:30:00', '2024-01-10 09:00:00'],
          [2, 'Web Dashboard', 'completed', 'JavaScript', '2024-01-14 16:45:00', '2024-01-05 10:30:00'],
          [3, 'API Server', 'in_progress', 'TypeScript', '2024-01-15 11:20:00', '2024-01-08 14:15:00'],
          [4, 'Mobile App', 'planning', 'React Native', '2024-01-16 10:00:00', '2024-01-12 15:30:00'],
          [5, 'Database Migration', 'completed', 'SQL', '2024-01-14 09:15:00', '2024-01-01 11:00:00']
        ];
        
        totalRows = 45;
        rows = sampleProjects.slice(offset, offset + pageSize);
        
        if (search) {
          rows = sampleProjects.filter(row => 
            row.some(cell => cell.toString().toLowerCase().includes(search.toLowerCase()))
          );
          totalRows = rows.length;
        }
      } else {
        columns = ['id', 'component', 'version', 'updated_at'];
        const sampleData = [
          [1, 'React App', '18.2.0', '2024-01-15 10:00:00'],
          [2, 'Node Server', '20.0.0', '2024-01-14 15:30:00']
        ];
        
        totalRows = 50;
        rows = sampleData.slice(offset, offset + pageSize);
        
        if (search) {
          rows = sampleData.filter(row => 
            row.some(cell => cell.toString().toLowerCase().includes(search.toLowerCase()))
          );
          totalRows = rows.length;
        }
      }
    } else {
      // Default table
      columns = ['id', 'name', 'email', 'created_at'];
      const sampleData = [
        [1, 'John Doe', 'john@example.com', '2024-01-15 10:30:00'],
        [2, 'Jane Smith', 'jane@example.com', '2024-01-16 14:20:00'],
        [3, 'Bob Johnson', 'bob@example.com', '2024-01-17 09:15:00']
      ];
      
      totalRows = 50;
      rows = sampleData.slice(offset, offset + pageSize);
      
      if (search) {
        rows = sampleData.filter(row => 
          row.some(cell => cell.toString().toLowerCase().includes(search.toLowerCase()))
        );
        totalRows = rows.length;
      }
    }

    const totalPages = Math.ceil(totalRows / pageSize);

    return NextResponse.json({ 
      columns,
      rows,
      totalRows,
      currentPage: page,
      totalPages
    });

  } catch (error) {
    console.error('Get table data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table data' },
      { status: 500 }
    );
  }
}