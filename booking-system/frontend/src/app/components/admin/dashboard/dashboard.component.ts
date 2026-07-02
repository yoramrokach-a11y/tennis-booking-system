import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BookingService } from '../../../services/booking.service';
import { Booking } from '../../../models/booking.model';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  template: `
    <div class="admin-container">
      <div class="header-row">
        <div>
          <h1 class="page-title">Admin Dashboard</h1>
          <p class="subtitle">System-wide physical asset reservations overview</p>
        </div>
      </div>

      <!-- Quick Metrics Ribbon -->
      <div class="metrics-grid">
        <mat-card class="metric-card bg-blue">
          <mat-card-content class="metric-content">
            <mat-icon class="metric-icon">payments</mat-icon>
            <div class="metric-details">
              <span class="metric-value">\${{ grossRevenue$ | async }}.00</span>
              <span class="metric-label">Gross Revenue</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card bg-green">
          <mat-card-content class="metric-content">
            <mat-icon class="metric-icon">schedule</mat-icon>
            <div class="metric-details">
              <span class="metric-value">{{ totalHours$ | async }}h</span>
              <span class="metric-label">Booked Hours</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card bg-orange">
          <mat-card-content class="metric-content">
            <mat-icon class="metric-icon">event_available</mat-icon>
            <div class="metric-details">
              <span class="metric-value">{{ totalBookings$ | async }}</span>
              <span class="metric-label">Total Reservations</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-progress-bar mode="indeterminate" *ngIf="bookingService.loading$ | async"></mat-progress-bar>

      <!-- All Bookings Master Table -->
      <div class="table-container mat-elevation-z1" *ngIf="!(bookingService.loading$ | async)">
        <h2 class="section-title">All System Bookings</h2>
        <table mat-table [dataSource]="(bookingService.bookings$ | async) || []" class="bookings-table">
          
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef> Booking ID </th>
            <td mat-cell *matCellDef="let booking"> #{{ booking.id }} </td>
          </ng-container>

          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef> User ID </th>
            <td mat-cell *matCellDef="let booking"> User #{{ booking.userId }} </td>
          </ng-container>

          <ng-container matColumnDef="court">
            <th mat-header-cell *matHeaderCellDef> Court ID </th>
            <td mat-cell *matCellDef="let booking"> Court {{ booking.courtId }} </td>
          </ng-container>

          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef> Booking Date </th>
            <td mat-cell *matCellDef="let booking"> {{ booking.bookingDate }} </td>
          </ng-container>

          <ng-container matColumnDef="time">
            <th mat-header-cell *matHeaderCellDef> Time Range </th>
            <td mat-cell *matCellDef="let booking"> 
              {{ formatHour(booking.startHour) }} - {{ formatHour(booking.startHour + booking.hours) }} 
              <span class="duration-label">({{ booking.hours }}h)</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef> Price </th>
            <td mat-cell *matCellDef="let booking"> \${{ booking.price }}.00 </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef> Status </th>
            <td mat-cell *matCellDef="let booking">
              <span class="status-badge" [ngClass]="booking.status?.toLowerCase() || 'confirmed'">
                {{ booking.status || 'CONFIRMED' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef> Administrative Override </th>
            <td mat-cell *matCellDef="let booking">
              <button 
                mat-button 
                color="warn" 
                *ngIf="booking.status !== 'CANCELLED'" 
                (click)="onCancel(booking.id)"
              >
                Force Cancel
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      max-width: 1100px;
      margin: 40px auto;
      padding: 0 16px;
    }
    .header-row {
      margin-bottom: 24px;
    }
    .page-title {
      font-size: 24px;
      font-weight: 500;
      margin: 0;
    }
    .subtitle {
      color: #666;
      margin: 4px 0 0 0;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .metric-card {
      padding: 8px;
      border-radius: 8px;
    }
    .metric-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .metric-icon {
      font-size: 36px;
      height: 36px;
      width: 36px;
    }
    .bg-blue {
      background-color: #e3f2fd;
      color: #1565c0;
    }
    .bg-green {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    .bg-orange {
      background-color: #fff3e0;
      color: #e65100;
    }
    .metric-details {
      display: flex;
      flex-direction: column;
    }
    .metric-value {
      font-size: 24px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 4px;
    }
    .metric-label {
      font-size: 13px;
      font-weight: 500;
      opacity: 0.8;
    }
    .table-container {
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      margin-top: 16px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 500;
      padding: 16px 24px;
      margin: 0;
      border-bottom: 1px solid #eee;
    }
    .bookings-table {
      width: 100%;
    }
    .duration-label {
      font-size: 11px;
      color: #777;
    }
    .status-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .status-badge.confirmed {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    .status-badge.cancelled {
      background-color: #ffebee;
      color: #c62828;
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  public bookingService = inject(BookingService);
  private snackBar = inject(MatSnackBar);

  public displayedColumns: string[] = ['id', 'user', 'court', 'date', 'time', 'price', 'status', 'actions'];

  // Reactive computed metrics streams for statistical reporting
  public grossRevenue$!: Observable<number>;
  public totalHours$!: Observable<number>;
  public totalBookings$!: Observable<number>;

  public ngOnInit(): void {
    this.bookingService.loadBookings();

    // Compute metrics
    this.grossRevenue$ = this.bookingService.bookings$.pipe(
      map(bookings => bookings
        .filter(b => b.status !== 'CANCELLED')
        .reduce((sum, b) => sum + b.price, 0)
      )
    );

    this.totalHours$ = this.bookingService.bookings$.pipe(
      map(bookings => bookings
        .filter(b => b.status !== 'CANCELLED')
        .reduce((sum, b) => sum + b.hours, 0)
      )
    );

    this.totalBookings$ = this.bookingService.bookings$.pipe(
      map(bookings => bookings.filter(b => b.status !== 'CANCELLED').length)
    );
  }

  public formatHour(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    let displayHour = hour % 12;
    if (displayHour === 0) displayHour = 12;
    return `${displayHour.toString().padStart(2, '0')}:00 ${period}`;
  }

  public onCancel(id: number): void {
    if (confirm('[ADMIN PANEL] Do you wish to override and force cancel reservation #' + id + '?')) {
      this.bookingService.cancelBooking(id).subscribe({
        next: () => {
          this.snackBar.open('Administrative override: booking cancelled.', 'Close', { duration: 3000 });
        },
        error: (err) => {
          this.snackBar.open(err.message, 'Close', { duration: 5000 });
        }
      });
    }
  }
}
