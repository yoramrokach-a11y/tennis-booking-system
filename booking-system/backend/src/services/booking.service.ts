import { BookingRepository } from '../repositories/booking.repository';
import { CourtRepository } from '../repositories/court.repository';
import { CreateBookingDto } from '../dtos/booking.dto';
import { Booking } from '../models/booking.model';
import { ValidationError, NotFoundError } from '../utils/errors';

/**
 * Booking Service
 * Orchestrates business logic for tennis court reservations.
 */
export class BookingService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly courtRepository: CourtRepository
  ) {}

  /**
   * Business Logic wrapper for booking a court.
   */
  public async createBooking(userId: number, dto: CreateBookingDto): Promise<Booking> {
    // 1. Verify court exists and is active
    const court = await this.courtRepository.findById(dto.courtId);
    if (!court) {
      throw new NotFoundError(`Tennis court with ID ${dto.courtId} was not found.`);
    }
    if (!court.isActive) {
      throw new ValidationError(`The requested court (${court.name}) is currently inactive/under maintenance.`);
    }

    // 2. Extra safety constraints check
    if (dto.hours <= 0) {
      throw new ValidationError('Reservation duration must be greater than zero hours.');
    }

    // 3. Ensure no scheduling overlaps exist on the same court and day
    const isOverlapping = await this.bookingRepository.hasOverlappingBooking(
      dto.courtId,
      dto.bookingDate,
      dto.startHour,
      dto.hours
    );

    if (isOverlapping) {
      throw new ValidationError('Overlapping Reservation: The selected court is already booked during this time range.');
    }

    // 4. Calculate Server-Side Pricing (price = hours * 50)
    const price = dto.hours * 50;

    // 5. Save record to PostgreSQL database via Repository
    const booking = await this.bookingRepository.create({
      userId,
      courtId: dto.courtId,
      bookingDate: dto.bookingDate,
      startHour: dto.startHour,
      hours: dto.hours,
      price,
    });

    return booking;
  }

  /**
   * Retrieves bookings using filtering conditions.
   */
  public async getBookings(filters: {
    courtId?: number;
    date?: string;
    userId?: number;
  }): Promise<Booking[]> {
    return this.bookingRepository.findFiltered(filters);
  }

  /**
   * Cancel/Delete a booking by its primary key ID.
   */
  public async deleteBooking(id: number, userId: number, userRole: string): Promise<void> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new NotFoundError(`Booking with ID ${id} was not found.`);
    }

    // Security: standard users can only delete their own bookings, admins can delete any
    if (userRole !== 'ADMIN' && booking.userId !== userId) {
      throw new ValidationError('You do not have permission to delete this booking.');
    }

    await this.bookingRepository.delete(id);
  }
}
