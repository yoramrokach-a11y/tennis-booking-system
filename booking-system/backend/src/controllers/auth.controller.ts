import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { validateRegister, validateLogin } from '../dtos/auth.dto';

/**
 * Auth Controller
 * Interfaces with Express HTTP requests for user lifecycle operations.
 */
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Registers a new account, hashes password, and responds with credential details and a session JWT.
   */
  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Validate incoming JSON payload parameters
      const validatedDto = validateRegister(req.body);

      // 2. Delegate to Business Service layer
      const result = await this.authService.register(validatedDto);

      // 3. Dispatch standard successful JSON REST response
      res.status(201).json({
        success: true,
        message: 'Registration completed successfully.',
        data: result,
      });
    } catch (error) {
      next(error); // Route to Global Error Middleware
    }
  };

  /**
   * POST /auth/login
   * Validates account login, and responds with a fresh session token.
   */
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Validate payload format
      const validatedDto = validateLogin(req.body);

      // 2. Delegate credentials validation to Business Service
      const result = await this.authService.login(validatedDto);

      // 3. Dispatch token payload
      res.status(200).json({
        success: true,
        message: 'Authentication successful.',
        data: result,
      });
    } catch (error) {
      next(error); // Route to Global Error Middleware
    }
  };
}
