import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { User } from '../models/user.model';

/**
 * User Repository
 * Manages database persistence logic for the 'users' table.
 */
export class UserRepository extends BaseRepository<User> {
  constructor(db: Pool) {
    super(db, 'users');
  }

  /**
   * Retrieves a user profile by their unique email.
   */
  public async findByEmail(email: string): Promise<User | null> {
    const query = `SELECT * FROM "${this.tableName}" WHERE email = $1 LIMIT 1;`;
    const rows = await this.executeQuery<User>(query, [email.toLowerCase()]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Creates and persists a new user record.
   */
  public async create(data: {
    name: string;
    email: string;
    password_hash: string;
    role: 'PLAYER' | 'STAFF' | 'ADMIN';
  }): Promise<User> {
    const query = `
      INSERT INTO "${this.tableName}" (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, password_hash, role, created_at;
    `;
    const values = [data.name, data.email.toLowerCase(), data.password_hash, data.role];
    const rows = await this.executeQuery<User>(query, values);
    return rows[0];
  }
}
