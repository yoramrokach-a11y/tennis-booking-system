import { ValidationError } from '../utils/errors';

/**
 * Data Transfer Object for creating a court booking.
 */
export interface CreateBookingDto {
  courtId: number;
  bookingDate: string; // YYYY-MM-DD
  startHour: number;   // e.g. 10
  hours: number;       // e.g. 2
}

/**
 * Data Transfer Object for updating a booking.
 */
export interface UpdateBookingDto {
  status: string;
}

/**
 * Input validation helper for Creating a Booking.
 */
export function validateCreateBooking(dto: any): CreateBookingDto {
  if (!dto) {
    throw new ValidationError('Request body is missing.');
  }

  const { courtId, bookingDate, startHour, hours } = dto;

  // 1. Validate courtId
  if (courtId === undefined || courtId === null) {
    throw new ValidationError('courtId is required.');
  }
  const parsedCourtId = Number(courtId);
  if (!Number.isInteger(parsedCourtId) || parsedCourtId <= 0) {
    throw new ValidationError('courtId must be a valid positive integer.');
  }

  // 2. Validate bookingDate
  if (!bookingDate || typeof bookingDate !== 'string') {
    throw new ValidationError('bookingDate is required and must be a string.');
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(bookingDate)) {
    throw new ValidationError('bookingDate must be in YYYY-MM-DD format.');
  }

  // Prevent past date bookings
  const [year, month, day] = bookingDate.split('-').map(Number);
  const inputDate = new Date(year, month - 1, day);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (inputDate < today) {
    throw new ValidationError('Cannot book a court for a past date.');
  }

  // 3. Validate startHour
  if (startHour === undefined || startHour === null) {
    throw new ValidationError('startHour is required.');
  }
  const parsedStartHour = Number(startHour);
  if (!Number.isInteger(parsedStartHour)) {
    throw new ValidationError('startHour must be an integer.');
  }
  if (parsedStartHour < 6 || parsedStartHour > 22) {
    throw new ValidationError('Operating hours are from 06:00 (6) to 22:00 (22).');
  }

  // 4. Validate hours
  if (hours === undefined || hours === null) {
    throw new ValidationError('hours duration is required.');
  }
  const parsedHours = Number(hours);
  if (!Number.isInteger(parsedHours) || parsedHours <= 0) {
    throw new ValidationError('Hours duration must be a positive integer.');
  }
  if (parsedHours < 1 || parsedHours > 4) {
    throw new ValidationError('Hours duration must be between 1 and 4 hours.');
  }

  // Ensure booking slot fits in the operating day
  if (parsedStartHour + parsedHours > 24) {
    throw new ValidationError('Booking exceeds the maximum allowed time of 24:00.');
  }

  return {
    courtId: parsedCourtId,
    bookingDate,
    startHour: parsedStartHour,
    hours: parsedHours,
  };
}
