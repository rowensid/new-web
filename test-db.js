const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  const db = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await db.$connect();
    console.log('✅ Database connected successfully');
    
    // Get user count
    const userCount = await db.user.count();
    console.log(`👥 Total users: ${userCount}`);
    
    // List users
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
    
    console.log('\n👥 Users:');
    users.forEach(user => {
      console.log(`- ${user.name || user.email} (${user.role})`);
    });
    
    // Update user to OWNER for testing
    if (users.length > 0) {
      const updatedUser = await db.user.update({
        where: { id: users[0].id },
        data: { role: 'OWNER' }
      });
      console.log(`\n🔑 Updated ${updatedUser.name || updatedUser.email} to OWNER role`);
      
      // Create a session for this user
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { userId: updatedUser.id, email: updatedUser.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      const session = await db.session.create({
        data: {
          id: Math.random().toString(36).substring(7),
          userId: updatedUser.id,
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });
      
      console.log(`\n🎫 Created session token: ${token}`);
      console.log(`📅 Session expires: ${session.expiresAt}`);
    }
    
    // Get server count
    const serverCount = await db.pterodactylServer.count();
    console.log(`\n📊 Total servers: ${serverCount}`);
    
    // Get servers with database settings
    const serversWithDb = await db.pterodactylServer.findMany({
      include: {
        settings: true
      }
    });
    
    console.log('\n📋 Server Details:');
    
    // Create demo servers for testing
    const demoServers = [
      {
        id: 'demo-server-1',
        pteroId: '1',
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        identifier: 'amerta1',
        name: 'AMERTA ROLEPLAY',
        description: 'FiveM Roleplay Server Indonesia',
        status: 'running',
        suspended: false,
        limits: { memory: 4096, swap: 1024, disk: 20480, io: 500, cpu: 150 },
        featureLimits: { databases: 3, allocations: 5, backups: 3 },
        userId: users[0].id,
        nodeId: '1',
        allocationId: '1',
        allocationIp: '192.168.1.100',
        allocationPort: 30120,
        nestId: '1',
        eggId: '1',
        container: {
          startup_command: './run.sh +exec server.cfg',
          image: 'ghcr.io/pterodactyl/yolks:fivem',
          installed: true,
          environment: { BUILD_TYPE: 'latest', MAX_CLIENTS: '32' }
        }
      },
      {
        id: 'demo-server-2',
        pteroId: '2',
        uuid: '456e7890-e89b-12d3-a456-426614174111',
        identifier: 'test1',
        name: 'Test Server 1',
        description: 'Development testing server',
        status: 'stopped',
        suspended: false,
        limits: { memory: 2048, swap: 512, disk: 10240, io: 500, cpu: 100 },
        featureLimits: { databases: 1, allocations: 2, backups: 1 },
        userId: null,
        nodeId: '1',
        allocationId: '2',
        allocationIp: '192.168.1.101',
        allocationPort: 30121,
        nestId: '1',
        eggId: '1',
        container: {
          startup_command: './run.sh +exec server.cfg',
          image: 'ghcr.io/pterodactyl/yolks:fivem',
          installed: true,
          environment: { BUILD_TYPE: 'latest', MAX_CLIENTS: '16' }
        }
      }
    ];
    
    // Insert demo servers
    for (const serverData of demoServers) {
      const existingServer = await db.pterodactylServer.findUnique({
        where: { pteroId: serverData.pteroId }
      });
      
      if (!existingServer) {
        await db.pterodactylServer.create({
          data: serverData
        });
        console.log(`✅ Created demo server: ${serverData.name}`);
      }
    }
    
    // Create database settings for AMERTA ROLEPLAY
    const amertaServer = await db.pterodactylServer.findUnique({
      where: { pteroId: '1' }
    });
    
    if (amertaServer && !amertaServer.settings) {
      await db.serverSettings.create({
        data: {
          id: 'settings-1',
          pterodactylServerId: '1',
          assignedUserId: users[0].id,
          panelUrl: 'https://panel.androwproject.cloud',
          txadminUrl: 'http://192.168.1.100:40120',
          databaseHost: 'localhost',
          databasePort: 3306,
          databaseName: 'amerta_roleplay',
          databaseUser: 'amerta_user',
          databasePassword: 'demo_password_123'
        }
      });
      console.log('✅ Created database settings for AMERTA ROLEPLAY');
    }
    
    // Get updated server list
    const updatedServers = await db.pterodactylServer.findMany({
      include: { settings: true }
    });
    
    console.log('\n📊 Updated Server List:');
    updatedServers.forEach(server => {
      console.log(`- ${server.name} (${server.identifier}) - ${server.status}`);
      if (server.settings) {
        console.log(`  🗄️  Database: ${server.settings.databaseHost}/${server.settings.databaseName}`);
      } else {
        console.log(`  ❌ No database configured`);
      }
    });
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await db.$disconnect();
  }
}

testDatabase();