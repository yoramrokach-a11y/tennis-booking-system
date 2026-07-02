/**
 * Base Application Error
 * Extends JS Error to append operational flags, standard HTTP statuses, and client safe messages.
 */
export class AppError extends Error {
  public readonly isOperational: boolean;

  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validations, contract, or format constraint violation errors.
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

/**
 * Access tokens, JWT validation, or authentication validation failures.
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Access unauthorized. Valid login required.') {
    super(message, 401);
  }
}

/**
 * Permission issues, roles scope violations.
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden. Insufficient permissions.') {
    super(message, 403);
  }
}

/**
 * Resource missing errors.
 */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

/**
 * Database structural exceptions, timeout limits, or unique constraints violations.
 */
export class DatabaseError extends AppError {
  constructor(message: string, public readonly detail?: string) {
    super(message, 500);
  }
}
