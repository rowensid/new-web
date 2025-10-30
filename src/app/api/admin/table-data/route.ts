import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
import mysql from 'mysql2/promise';

// Helper function to verify authentication
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
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');
    const table = searchParams.get('table');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'id';
    const order = searchParams.get('order') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '25');

    if (!serverId || !table) {
      return NextResponse.json({ error: 'Server ID and table are required' }, { status: 400 });
    }

    // Get server settings (admin can access any server)
    const serverSetting = await db.serverSettings.findFirst({
      where: {
        pterodactylServerId: serverId
      }
    });

    if (!serverSetting) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    if (!serverSetting.databaseHost || !serverSetting.databaseName || 
        !serverSetting.databaseUser || !serverSetting.databasePassword) {
      return NextResponse.json({ error: 'Database settings not configured' }, { status: 400 });
    }

    const offset = (page - 1) * limit;

    // Connect to database
    let connection;
    try {
      connection = await mysql.createConnection({
        host: serverSetting.databaseHost,
        user: serverSetting.databaseUser,
        password: serverSetting.databasePassword,
        database: serverSetting.databaseName,
        connectTimeout: 10000
      });

      // Sanitize table name and sort column
      const tableName = mysql.escapeId(table);
      const sortColumn = mysql.escapeId(sort);
      const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      // Get total rows
      let countQuery = `SELECT COUNT(*) as total FROM ${tableName}`;
      let dataQuery = `SELECT * FROM ${tableName}`;

      if (search) {
        // Get columns first
        const [columns] = await connection.execute(`SHOW COLUMNS FROM ${tableName}`);
        const columnNames = (columns as any[]).map(col => col.Field);
        
        // Create search condition
        const searchConditions = columnNames.map(col => `${mysql.escapeId(col)} LIKE ?`).join(' OR ');
        const searchValues = columnNames.map(() => `%${search}%`);
        
        countQuery += ` WHERE ${searchConditions}`;
        dataQuery += ` WHERE ${searchConditions}`;
        
        // Add search values to queries
        const [countResult] = await connection.execute(countQuery, searchValues);
        const totalRows = (countResult as any[])[0].total;
        
        dataQuery += ` ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?`;
        const [rows] = await connection.execute(dataQuery, [...searchValues, limit, offset]);
        
        // Get columns
        const [columnInfo] = await connection.execute(`SHOW COLUMNS FROM ${tableName}`);
        const columns_list = (columnInfo as any[]).map(col => col.Field);
        
        return NextResponse.json({
          columns: columns_list,
          rows: rows as any[][],
          totalRows,
          currentPage: page,
          totalPages: Math.ceil(totalRows / limit)
        });
      } else {
        const [countResult] = await connection.execute(countQuery);
        const totalRows = (countResult as any[])[0].total;
        
        dataQuery += ` ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?`;
        const [rows] = await connection.execute(dataQuery, [limit, offset]);
        
        // Get columns
        const [columnInfo] = await connection.execute(`SHOW COLUMNS FROM ${tableName}`);
        const columns_list = (columnInfo as any[]).map(col => col.Field);
        
        return NextResponse.json({
          columns: columns_list,
          rows: rows as any[][],
          totalRows,
          currentPage: page,
          totalPages: Math.ceil(totalRows / limit)
        });
      }

    } catch (dbError) {
      console.error('Table data error:', dbError);
      return NextResponse.json({ error: 'Failed to fetch table data' }, { status: 500 });

    } finally {
      if (connection) {
        await connection.end();
      }
    }

  } catch (error) {
    console.error('Get admin table data error:', error);
    return NextResponse.json({ error: 'Failed to fetch table data' }, { status: 500 });
  }
}