/**
 * Court Model Entity
 * Matches the 'courts' table structure in PostgreSQL.
 */
export interface Court {
  id: number;
  name: string;
  isActive: boolean;
}
