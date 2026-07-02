import { Pool } from 'pg';

/**
 * Base Repository Abstract Class
 * Encapsulates standard PostgreSQL relational patterns, transaction capabilities, and safe query executions.
 */
export abstract class BaseRepository<T> {
  protected constructor(
    protected readonly db: Pool,
    protected readonly tableName: string
  ) {}

  /**
   * Safe execution wrapper for direct parameterized SQL.
   */
  protected async executeQuery<R = any>(sql: string, params: any[] = []): Promise<R[]> {
    const client = await this.db.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Retrieves a record dynamically by its primary key ID.
   */
  public async findById(id: number): Promise<T | null> {
    const query = `SELECT * FROM "${this.tableName}" WHERE id = $1 LIMIT 1;`;
    const rows = await this.executeQuery<T>(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Returns all rows within the repository's target table.
   * Encourages standard pagination limits to prevent memory exhaustion in production.
   */
  public async findAll(limit: number = 50, offset: number = 0): Promise<T[]> {
    const query = `
      SELECT * FROM "${this.tableName}" 
      ORDER BY id DESC 
      LIMIT $1 OFFSET $2;
    `;
    return this.executeQuery<T>(query, [limit, offset]);
  }

  /**
   * Standard delete execution mapping.
   */
  public async delete(id: number): Promise<boolean> {
    const query = `DELETE FROM "${this.tableName}" WHERE id = $1 RETURNING id;`;
    const rows = await this.executeQuery(query, [id]);
    return rows.length > 0;
  }

  /**
   * Helper utility to dynamically map filter objects to safe WHERE syntax clauses and param bounds.
   */
  protected buildWhereClause(filters: Record<string, any>): { sql: string; values: any[] } {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        conditions.push(`"${key}" = $${paramIndex}`);
        values.push(val);
        paramIndex++;
      }
    });

    const sql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { sql, values };
  }
}
