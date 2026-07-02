import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { BookingService } from '../services/booking.service';
import { validateCreateBooking } from '../dtos/booking.dto';

/**
 * Booking Controller
 * Exposes tennis court scheduling operations over REST.
 */
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  /**
   * POST /bookings
   * Creates a new booking reservation for a tennis court.
   */
  public create = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // 1. Validate the incoming request body
      const validatedDto = validateCreateBooking(req.body);

      // 2. Fetch authenticated user id from JWT session context
      // Fallback to user_id 1 (e.g., standard John Doe seeded user) if auth was bypassed
      const userId = req.user?.id || 1;

      // 3. Orchestrate through Service Layer
      const booking = await this.bookingService.createBooking(userId, validatedDto);

      // 4. Return exact required fields: booking id, calculated price, success message
      res.status(201).json({
        success: true,
        message: 'Court booked successfully.',
        bookingId: booking.id,
        calculatedPrice: booking.price,
        data: booking,
      });
    } catch (error) {
      next(error); // Pipe to Global Error Middleware
    }
  };

  /**
   * GET /bookings
   * Fetches list of bookings based on optional filters.
   */
  public getAll = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filters = {
        courtId: req.query.courtId ? Number(req.query.courtId) : undefined,
        date: req.query.date as string,
        userId: req.query.userId ? Number(req.query.userId) : undefined,
      };

      const bookings = await this.bookingService.getBookings(filters);

      res.status(200).json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /bookings/:id
   * Deletes/cancels an existing booking.
   */
  public delete = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const bookingId = Number(req.params.id);
      const userId = req.user?.id || 1;
      const userRole = req.user?.role || 'PLAYER';

      await this.bookingService.deleteBooking(bookingId, userId, userRole);

      res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully.',
      });
    } catch (error) {
      next(error);
    }
  };
}
