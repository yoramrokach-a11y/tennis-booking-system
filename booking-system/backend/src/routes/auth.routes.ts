import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

/**
 * Authentication Route Setup
 * Sets up routing for user register and login.
 * 
 * @param controller AuthController instance
 * @returns Configured Express Router
 */
export function getAuthRouter(controller: AuthController): Router {
  const router = Router();

  // Public Endpoints
  router.post('/register', controller.register);
  router.post('/login', controller.login);

  return router;
}
