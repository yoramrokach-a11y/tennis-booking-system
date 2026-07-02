import { Router, Request, Response, NextFunction } from 'express';
import { dbPool } from '../config/database';

export const healthRouter = Router();

/**
 * GET /health
 * Performs real-time system and database health evaluations.
 * Essential for orchestration layers (Kubernetes, AWS ECS, GCP Cloud Run) to determine pod lifecycle.
 */
healthRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Connect to PostgreSQL and execute the test query
    await dbPool.query('SELECT 1');

    // Return status ok if successful
    res.status(200).json({ status: 'ok' });
  } catch (err: any) {
    console.error('[Health Check Failed]: Database connection error:', err);
    
    // Return error if DB connection fails
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      details: err.message || err,
    });
  }
});
