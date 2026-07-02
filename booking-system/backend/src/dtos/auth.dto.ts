import { ValidationError } from '../utils/errors';

/**
 * Data Transfer Object for User Registration.
 */
export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  role?: 'PLAYER' | 'STAFF' | 'ADMIN';
}

/**
 * Data Transfer Object for User Login.
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Input validation helper for User Registration.
 */
export function validateRegister(dto: any): RegisterDto {
  if (!dto) {
    throw new ValidationError('Request body is missing.');
  }

  const { name, email, password, role } = dto;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new ValidationError('A valid name is required.');
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new ValidationError('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters long.');
  }

  if (role && !['PLAYER', 'STAFF', 'ADMIN'].includes(role)) {
    throw new ValidationError('Invalid role selection. Must be PLAYER, STAFF, or ADMIN.');
  }

  return {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role: role || 'PLAYER',
  };
}

/**
 * Input validation helper for User Login.
 */
export function validateLogin(dto: any): LoginDto {
  if (!dto) {
    throw new ValidationError('Request body is missing.');
  }

  const { email, password } = dto;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new ValidationError('A valid email address is required to login.');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    throw new ValidationError('Password is required.');
  }

  return {
    email: email.trim().toLowerCase(),
    password,
  };
}
