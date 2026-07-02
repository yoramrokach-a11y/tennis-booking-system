/**
 * User Model Entity
 * Matches the 'users' table structure in PostgreSQL.
 */
export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'PLAYER' | 'STAFF' | 'ADMIN';
  created_at: Date;
}

/**
 * Clean User representation for client responses.
 * Prevents password_hash leakage.
 */
export type UserResponse = Omit<User, 'password_hash'>;
