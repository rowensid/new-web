import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || '103.42.116.70',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'u14_cNvsEAgmnT',
  password: process.env.MYSQL_PASSWORD || 'BVXPapybA%3DAlt1RwBJVtT%40s3',
  database: process.env.MYSQL_DATABASE || 's14_answebsite',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Query helper function
export async function query(sql: string, params?: any[]) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Get single record
export async function queryOne(sql: string, params?: any[]) {
  try {
    const rows = await query(sql, params) as any[];
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Insert record
export async function insert(table: string, data: Record<string, any>) {
  const fields = Object.keys(data).join(', ');
  const placeholders = Object.keys(data).map(() => '?').join(', ');
  const values = Object.values(data);
  
  const sql = `INSERT INTO ${table} (${fields}) VALUES (${placeholders})`;
  
  try {
    const result = await pool.execute(sql, values) as any;
    return result[0].insertId;
  } catch (error) {
    console.error('Database insert error:', error);
    throw error;
  }
}

// Update record
export async function update(table: string, data: Record<string, any>, where: Record<string, any>) {
  const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
  const values = [...Object.values(data), ...Object.values(where)];
  
  const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
  
  try {
    const result = await pool.execute(sql, values) as any;
    return result[0].affectedRows;
  } catch (error) {
    console.error('Database update error:', error);
    throw error;
  }
}

// Delete record
export async function deleteRecord(table: string, where: Record<string, any>) {
  const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
  const values = Object.values(where);
  
  const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
  
  try {
    const result = await pool.execute(sql, values) as any;
    return result[0].affectedRows;
  } catch (error) {
    console.error('Database delete error:', error);
    throw error;
  }
}

// Close connection pool
export async function closeConnection() {
  try {
    await pool.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

export default pool;