import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { Booking } from '../models/booking.model';

/**
 * Booking Repository
 * Handles database transaction logic for booking tennis courts.
 */
export class BookingRepository extends BaseRepository<Booking> {
  constructor(db: Pool) {
    super(db, 'bookings');
  }

  /**
   * Insert a new booking record into the database.
   */
  public async create(data: {
    userId: number;
    courtId: number;
    bookingDate: string;
    startHour: number;
    hours: number;
    price: number;
  }): Promise<Booking> {
    const query = `
      INSERT INTO bookings (user_id, court_id, booking_date, start_hour, hours, price)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id, 
        user_id as "userId", 
        court_id as "courtId", 
        booking_date::text as "bookingDate", 
        start_hour as "startHour", 
        hours, 
        price::float as price,
        created_at as "createdAt"
    `;
    const values = [
      data.userId,
      data.courtId,
      data.bookingDate,
      data.startHour,
      data.hours,
      data.price,
    ];
    const rows = await this.executeQuery<any>(query, values);
    return rows[0];
  }

  /**
   * Prevent overlapping bookings.
   * Compares the start_hour and hours duration of court bookings on a given date.
   */
  public async hasOverlappingBooking(
    courtId: number,
    bookingDate: string,
    startHour: number,
    hours: number
  ): Promise<boolean> {
    const endHour = startHour + hours;
    const query = `
      SELECT EXISTS (
        SELECT 1 FROM bookings
        WHERE court_id = $1 
          AND booking_date = $2
          AND start_hour < $3
          AND (start_hour + hours) > $4
      )
    `;
    const rows = await this.executeQuery<{ exists: boolean }>(query, [
      courtId,
      bookingDate,
      endHour,
      startHour,
    ]);
    return rows[0].exists;
  }

  /**
   * Retrieves a single booking details by its id.
   */
  public override async findById(id: number): Promise<Booking | null> {
    const query = `
      SELECT 
        id, 
        user_id as "userId", 
        court_id as "courtId", 
        booking_date::text as "bookingDate", 
        start_hour as "startHour", 
        hours, 
        price::float as price,
        created_at as "createdAt"
      FROM bookings 
      WHERE id = $1
    `;
    const rows = await this.executeQuery<any>(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Retrieves bookings using dynamic filters.
   */
  public async findFiltered(filters: {
    courtId?: number;
    date?: string;
    userId?: number;
  }): Promise<Booking[]> {
    let query = `
      SELECT 
        id, 
        user_id as "userId", 
        court_id as "courtId", 
        booking_date::text as "bookingDate", 
        start_hour as "startHour", 
        hours, 
        price::float as price,
        created_at as "createdAt"
      FROM bookings
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramCounter = 1;

    if (filters.courtId) {
      query += ` AND court_id = $${paramCounter++}`;
      values.push(filters.courtId);
    }

    if (filters.userId) {
      query += ` AND user_id = $${paramCounter++}`;
      values.push(filters.userId);
    }

    if (filters.date) {
      query += ` AND booking_date = $${paramCounter++}`;
      values.push(filters.date);
    }

    query += ' ORDER BY booking_date ASC, start_hour ASC';
    const rows = await this.executeQuery<any>(query, values);
    return rows;
  }
}
