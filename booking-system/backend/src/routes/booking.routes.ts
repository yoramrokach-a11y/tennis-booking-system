import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { authenticateToken } from '../middleware/auth.middleware';

/**
 * Booking Router Setup
 * 
 * @param controller BookingController instance
 * @returns Configured Express Router
 */
export function getBookingRouter(controller: BookingController): Router {
  const router = Router();

  // Apply authentication middleware to protect all scheduling actions
  router.post('/', authenticateToken, controller.create);
  router.get('/', authenticateToken, controller.getAll);
  router.delete('/:id', authenticateToken, controller.delete);

  return router;
}
