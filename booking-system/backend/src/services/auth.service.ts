import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { RegisterDto, LoginDto } from '../dtos/auth.dto';
import { UserResponse } from '../models/user.model';
import { ValidationError, UnauthorizedError } from '../utils/errors';

/**
 * Authentication Service
 * Manages logic for user registration, login, session token signing, and hashing.
 */
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(private readonly userRepository: UserRepository) {
    this.jwtSecret = process.env.JWT_SECRET || 'super-secure-tennis-secret-key-change-in-prod';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  /**
   * Registers a brand new user and returns their credentials alongside a session JWT.
   */
  public async register(dto: RegisterDto): Promise<{ user: UserResponse; token: string }> {
    // 1. Verify email uniqueness
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ValidationError('A user with this email address already exists.');
    }

    // 2. Hash password securely
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // 3. Persist new user
    const newUser = await this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password_hash: passwordHash,
      role: dto.role || 'PLAYER',
    });

    // 4. Clean user response details
    const userResponse: UserResponse = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      created_at: newUser.created_at,
    };

    // 5. Generate session token
    const token = this.generateToken(userResponse);

    return { user: userResponse, token };
  }

  /**
   * Logs an existing user in, verifying credentials and delivering a session token.
   */
  public async login(dto: LoginDto): Promise<{ user: UserResponse; token: string }> {
    // 1. Find user by email
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    // 2. Verify password match
    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    // 3. Clean user response details
    const userResponse: UserResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    };

    // 4. Generate session token
    const token = this.generateToken(userResponse);

    return { user: userResponse, token };
  }

  /**
   * Generates a signed jsonwebtoken for authorized request authentication.
   */
private generateToken(user: UserResponse): string {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const secret: jwt.Secret = process.env.JWT_SECRET as string;

  const expiresIn: jwt.SignOptions['expiresIn'] =
    (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']) || '1d';

  return jwt.sign(payload, secret, { expiresIn });
}
}
