import express, { Express } from 'express';
import { dbPool } from './config/database';

// Repositories
import { UserRepository } from './repositories/user.repository';
import { CourtRepository } from './repositories/court.repository';
import { BookingRepository } from './repositories/booking.repository';

// Services
import { AuthService } from './services/auth.service';
import { BookingService } from './services/booking.service';

// Controllers
import { AuthController } from './controllers/auth.controller';
import { BookingController } from './controllers/booking.controller';

// Routers
import { getAuthRouter } from './routes/auth.routes';
import { getBookingRouter } from './routes/booking.routes';
import { healthRouter } from './routes/health.routes';

// Interceptor Middleware
import { globalErrorHandler } from './middleware/error.middleware';

/**
 * Express Application Bootstrapper
 * Configures express server instance, wires dependency injections, and plugs global interceptor chains.
 */
export function createApplication(): Express {
  const app = express();

  // 1. Global Middleware Pipelines
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 2. Setup Dependency Injection
  const userRepository = new UserRepository(dbPool);
  const courtRepository = new CourtRepository(dbPool);
  const bookingRepository = new BookingRepository(dbPool);

  const authService = new AuthService(userRepository);
  const bookingService = new BookingService(bookingRepository, courtRepository);

  const authController = new AuthController(authService);
  const bookingController = new BookingController(bookingService);

  // 3. Register Routing Modules
  app.use('/health', healthRouter);
  app.use('/api/auth', getAuthRouter(authController));
  app.use('/api/v1/auth', getAuthRouter(authController));
  
  // Register Bookings under both requested paths for complete client compatibility
  app.use('/api/bookings', getBookingRouter(bookingController));
  app.use('/api/v1/bookings', getBookingRouter(bookingController));

  // 4. Global Error Capturing Interceptor
  app.use(globalErrorHandler);

  return app;
}

/**
 * Initialize Server Listener if executed directly as entrypoint.
 */
const app = createApplication();

const PORT = parseInt(process.env.PORT || process.env.SERVER_PORT || '5000', 10);
const HOST = process.env.SERVER_HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
