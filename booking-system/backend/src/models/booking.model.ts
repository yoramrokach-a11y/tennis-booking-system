/**
 * Booking Model Entity
 * Matches the 'bookings' table structure in PostgreSQL.
 */
export interface Booking {
  id: number;
  userId: number;
  courtId: number;
  bookingDate: string; // DATE representation as 'YYYY-MM-DD'
  startHour: number;   // 24h clock integer value (e.g., 9 for 09:00, 14 for 14:00)
  hours: number;       // Duration of the reservation in hours
  price: number;       // Calculated total cost
  createdAt?: Date;
}
