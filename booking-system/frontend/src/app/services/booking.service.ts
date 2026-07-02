import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Booking, CreateBookingDto } from '../models/booking.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root' // Standalone injection in root injector
})
export class BookingService {
  // Inject modern Angular HttpClient
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bookings`;

  // Local state container for reactive streaming
  private bookingsSubject = new BehaviorSubject<Booking[]>([]);
  public bookings$: Observable<Booking[]> = this.bookingsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  /**
   * Fetch bookings and feed the stream reactively
   */
  public loadBookings(date?: string, courtId?: number): void {
    this.loadingSubject.next(true);
    let params = new HttpParams();
    
    if (date) params = params.set('date', date);
    if (courtId) params = params.set('courtId', courtId.toString());

    this.http.get<{ success: boolean; data: Booking[] }>(this.apiUrl, { params }).pipe(
      map(response => response.data),
      tap(bookings => this.bookingsSubject.next(bookings)),
      catchError(err => {
        this.loadingSubject.next(false);
        return throwError(() => new Error(err.message || 'Failed to load bookings'));
      })
    ).subscribe(() => this.loadingSubject.next(false));
  }

  /**
   * Post a new booking
   */
  public createBooking(dto: CreateBookingDto): Observable<Booking> {
    return this.http.post<{ success: boolean; data: Booking }>(this.apiUrl, dto).pipe(
      map(response => response.data),
      tap(newBooking => {
        // Optimistically update or prepend to local stream
        const currentBookings = this.bookingsSubject.getValue();
        this.bookingsSubject.next([newBooking, ...currentBookings]);
      }),
      catchError(err => throwError(() => new Error(err.error?.message || 'Failed to create booking')))
    );
  }

  /**
   * Cancel/Delete booking
   */
  public cancelBooking(id: number): Observable<any> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Multi-cast state synchronization: remove deleted item
        const remainingBookings = this.bookingsSubject.getValue().filter(b => b.id !== id);
        this.bookingsSubject.next(remainingBookings);
      }),
      catchError(err => throwError(() => new Error(err.error?.message || 'Failed to cancel booking')))
    );
  }
}
