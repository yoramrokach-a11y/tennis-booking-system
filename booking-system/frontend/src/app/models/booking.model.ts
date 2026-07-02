export interface Booking {
  id: number;
  userId: number;
  courtId: number;
  bookingDate: string; // YYYY-MM-DD
  startHour: number;   // 24-hour integer, e.g., 9
  hours: number;       // Duration in hours
  price: number;       // Calculated price
  status?: 'CONFIRMED' | 'CANCELLED';
  createdAt?: string;
}

export interface CreateBookingDto {
  courtId: number;
  bookingDate: string;
  startHour: number;
  hours: number;
}

export interface Court {
  id: number;
  name: string;
  isActive: boolean;
}
