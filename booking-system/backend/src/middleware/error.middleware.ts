import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

/**
 * Global Error handling middleware for Express apps.
 * Intercepts uncaught thread failures, formats payloads, and prevents internal Postgres/code traces from leaking.
 */
export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Check if it is a known operational application exception
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.constructor.name,
        message: err.message,
        ...(err.statusCode === 500 && !isProduction ? { stack: err.stack } : {})
      }
    });
    return;
  }

  // 2. Intercept native pg (node-postgres) errors to sanitize database failures
  if ((err as any).code && (err as any).severity) {
    console.error('[Database Layer Failure Detail]:', {
      code: (err as any).code,
      detail: (err as any).detail,
      hint: (err as any).hint,
      message: err.message,
      stack: err.stack
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'DatabaseOperationError',
        message: isProduction 
          ? 'A transactional database constraint or execution failure occurred.' 
          : err.message, // Expose query failure in non-production for easier debugging
        ...(!isProduction ? { detail: (err as any).detail, hint: (err as any).hint } : {})
      }
    });
    return;
  }

  // 3. Fallback for completely unhandled systemic exceptions
  console.error('[Unexpected Severe Engine Error]:', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'InternalServerError',
      message: 'An unexpected operational failure occurred in our core systems.',
      ...(!isProduction ? { message_debug: err.message, stack: err.stack } : {})
    }
  });
}
