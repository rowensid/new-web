import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const session = await db.session.findUnique({
      where: { token },
      include: { user: { select: { id: true, role: true } } }
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get all table names from the database
    const tables = await db.$queryRaw`
      SELECT TABLE_NAME as tableName, 
             TABLE_COMMENT as tableComment,
             TABLE_ROWS as rowCount
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    ` as Array<{ tableName: string; tableComment: string; rowCount: number }>;

    // Get column information for each table
    const tableDetails = [];
    for (const table of tables) {
      try {
        const columns = await db.$queryRaw`
          SELECT COLUMN_NAME as columnName,
                 DATA_TYPE as dataType,
                 IS_NULLABLE as isNullable,
                 COLUMN_KEY as columnKey,
                 COLUMN_DEFAULT as defaultValue,
                 COLUMN_COMMENT as columnComment
          FROM information_schema.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = ${table.tableName}
          ORDER BY ORDINAL_POSITION
        ` as Array<{
          columnName: string;
          dataType: string;
          isNullable: string;
          columnKey: string;
          defaultValue: string | null;
          columnComment: string;
        }>;

        // Get sample data (first 5 rows)
        let sampleData = [];
        try {
          sampleData = await db.$queryRawUnsafe(`SELECT * FROM ${table.tableName} LIMIT 5`);
        } catch (error) {
          console.error(`Error getting sample data for ${table.tableName}:`, error);
        }

        tableDetails.push({
          tableName: table.tableName,
          tableComment: table.tableComment || '',
          estimatedRows: table.rowCount,
          columns: columns.map(col => ({
            name: col.columnName,
            type: col.dataType,
            nullable: col.isNullable === 'YES',
            isPrimary: col.columnKey === 'PRI',
            isUnique: col.columnKey === 'UNI',
            defaultValue: col.defaultValue,
            comment: col.columnComment || ''
          })),
          sampleData: sampleData
        });
      } catch (error) {
        console.error(`Error getting details for table ${table.tableName}:`, error);
        tableDetails.push({
          tableName: table.tableName,
          tableComment: table.tableComment || '',
          estimatedRows: table.rowCount,
          columns: [],
          sampleData: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: tableDetails,
      totalTables: tables.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database tables error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}