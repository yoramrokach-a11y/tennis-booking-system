import { Pool, PoolConfig } from 'pg';

/**
 * Production-ready Database Configuration for PostgreSQL Connection Pool.
 * Uses environment variables with standard production defaults and fallback values.
 */
const getPoolConfig = (): PoolConfig => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'tennis_court_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    
    // Connection Pool Sizing
    max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Limit of active clients
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),  // Minimum idle connections to keep
    
    // Timeouts
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10), // How long a client remains idle before closure
    connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONN_TIMEOUT || '2000', 10), // How long to wait for connection before failing
    
    // SSL Configuration (Critical for hosted DBs like Cloud SQL / Supabase)
    ssl: isProduction 
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' } 
      : undefined,
  };
};

/**
 * Singleton database pool instance.
 */
export const dbPool = new Pool(getPoolConfig());

// Pool event logging to assist in operational debugging
dbPool.on('connect', () => {
  console.log('[PostgreSQL]: Safe connection established with client pool.');
});

dbPool.on('error', (err) => {
  console.error('[PostgreSQL]: Unexpected idle client database pool failure.', err);
});

/**
 * Standardized database query helper method.
 * Enforces transaction telemetry and execution metrics in development mode.
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const start = Date.now();
  const client = await dbPool.connect();
  try {
    const res = await client.query(sql, params);
    
    // Telemetry trace for performance optimization
    if (process.env.NODE_ENV !== 'production') {
      const duration = Date.now() - start;
      console.log(`[DB Query Executed]: "${sql.replace(/\s+/g, ' ').substring(0, 80)}..." | Time: ${duration}ms | Rows: ${res.rowCount}`);
    }

    return res.rows;
  } finally {
    client.release(); // Return client to database connection pool
  }
}
