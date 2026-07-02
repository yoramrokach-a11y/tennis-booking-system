import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { Court } from '../models/court.model';

/**
 * Court Repository
 * Manages database persistence logic for physical tennis court assets.
 */
export class CourtRepository extends BaseRepository<Court> {
  constructor(db: Pool) {
    super(db, 'courts');
  }

  /**
   * Overrides base findById to correctly map is_active database column to isActive TypeScript property.
   */
  public override async findById(id: number): Promise<Court | null> {
    const query = `
      SELECT id, name, is_active as "isActive"
      FROM "${this.tableName}"
      WHERE id = $1 LIMIT 1;
    `;
    const rows = await this.executeQuery<any>(query, [id]);
    
    if (rows.length === 0) {
      return null;
    }

    return {
      id: rows[0].id,
      name: rows[0].name,
      isActive: rows[0].isActive,
    };
  }
}
