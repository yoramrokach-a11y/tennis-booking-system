import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BookingService } from '../../../services/booking.service';
import { Booking } from '../../../models/booking.model';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  template: `
    <div class="booking-list-container">
      <div class="header-row">
        <div>
          <h1 class="page-title">My Scheduled Matches</h1>
          <p class="subtitle">Review and manage your active tennis court reservations</p>
        </div>
        <button mat-raised-button color="primary" routerLink="/bookings/new">
          <mat-icon>add</mat-icon> Book a Court
        </button>
      </div>

      <mat-progress-bar mode="indeterminate" *ngIf="bookingService.loading$ | async"></mat-progress-bar>

      <div class="table-container mat-elevation-z1" *ngIf="!(bookingService.loading$ | async)">
        <table mat-table [dataSource]="(bookingService.bookings$ | async) || []" class="bookings-table">
          
          <!-- Court Name Column -->
          <ng-container matColumnDef="court">
            <th mat-header-cell *matHeaderCellDef> CourtName </th>
            <td mat-cell *matCellDef="let booking" class="court-name-cell"> 
              <mat-icon class="court-icon">sports_tennis</mat-icon>
              <span>{{ getCourtName(booking.courtId) }}</span>
            </td>
          </ng-container>

          <!-- Date Column -->
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef> Date </th>
            <td mat-cell *matCellDef="let booking"> 
              <span class="date-text">{{ formatDate(booking.bookingDate) }}</span>
            </td>
          </ng-container>

          <!-- Time Column -->
          <ng-container matColumnDef="time">
            <th mat-header-cell *matHeaderCellDef> Scheduled Time </th>
            <td mat-cell *matCellDef="let booking"> 
              {{ formatHour(booking.startHour) }} - {{ formatHour(booking.startHour + booking.hours) }} 
            </td>
          </ng-container>

          <!-- Hours Column -->
          <ng-container matColumnDef="hours">
            <th mat-header-cell *matHeaderCellDef> Duration </th>
            <td mat-cell *matCellDef="let booking"> 
              <span class="duration-pill">{{ booking.hours }} {{ booking.hours === 1 ? 'hour' : 'hours' }}</span>
            </td>
          </ng-container>

          <!-- Price Column -->
          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef> Price </th>
            <td mat-cell *matCellDef="let booking" class="price-cell"> 
              \${{ booking.price }}.00 
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef> Actions </th>
            <td mat-cell *matCellDef="let booking">
              <button 
                mat-stroked-button 
                color="warn" 
                class="cancel-btn"
                (click)="onCancel(booking.id)"
              >
                <mat-icon>cancel</mat-icon> Cancel
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <!-- Empty State Graphic -->
        <div class="empty-state" *ngIf="((bookingService.bookings$ | async) || []).length === 0">
          <mat-icon class="empty-icon">calendar_today</mat-icon>
          <h3>No matches scheduled</h3>
          <p>You haven't reserved any tennis courts yet. Click "Book a Court" to select an arena and schedule your match.</p>
          <button mat-flat-button color="primary" class="mt-4" routerLink="/bookings/new">
            Book Now
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .booking-list-container {
      max-width: 1000px;
      margin: 40px auto;
      padding: 0 24px;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
    }
    .page-title {
      font-size: 26px;
      font-weight: 700;
      color: #1b5e20;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .subtitle {
      color: #666;
      font-size: 14px;
      margin: 6px 0 0 0;
    }
    .table-container {
      background-color: white;
      border-radius: 12px;
      overflow: hidden;
      margin-top: 16px;
      border: 1px solid #e0e0e0;
    }
    .bookings-table {
      width: 100%;
    }
    .bookings-table th {
      background-color: #f5f5f5;
      color: #333;
      font-weight: 600;
      font-size: 13px;
      padding: 16px;
    }
    .bookings-table td {
      padding: 16px;
      font-size: 14px;
      color: #444;
      border-bottom: 1px solid #eeeeee;
    }
    .court-name-cell {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 500;
      color: #222;
    }
    .court-icon {
      color: #2e7d32;
      font-size: 20px;
      height: 20px;
      width: 20px;
    }
    .date-text {
      font-weight: 500;
    }
    .duration-pill {
      font-size: 12px;
      background-color: #e8f5e9;
      color: #2e7d32;
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: 500;
      display: inline-block;
    }
    .price-cell {
      font-weight: 600;
      color: #1b5e20;
    }
    .cancel-btn {
      height: 32px;
      line-height: 30px;
      padding: 0 12px;
      font-size: 12px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .cancel-btn mat-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      margin-right: 2px;
    }
    .empty-state {
      padding: 64px 32px;
      text-align: center;
      color: #555;
    }
    .empty-icon {
      font-size: 56px;
      height: 56px;
      width: 56px;
      margin-bottom: 20px;
      color: #a5d6a7;
    }
    .empty-state h3 {
      margin: 0 0 10px 0;
      font-size: 20px;
      color: #222;
      font-weight: 600;
    }
    .empty-state p {
      margin: 0 0 20px 0;
      font-size: 14px;
      color: #666;
      max-width: 450px;
      margin-left: auto;
      margin-right: auto;
      line-height: 1.5;
    }
    .mt-4 {
      margin-top: 16px;
    }
  `]
})
export class BookingListComponent implements OnInit {
  public bookingService = inject(BookingService);
  private snackBar = inject(MatSnackBar);

  public displayedColumns: string[] = ['court', 'date', 'time', 'hours', 'price', 'actions'];

  public ngOnInit(): void {
    this.bookingService.loadBookings();
  }

  public getCourtName(courtId: number): string {
    const names: Record<number, string> = {
      1: 'Center Court 1 (Clay)',
      2: 'Show Court 2 (Grass)',
      3: 'Indoor Court 3 (Hard)',
      4: 'Grandstand Court 4 (Hard)'
    };
    return names[courtId] || `Court #${courtId}`;
  }

  public formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  public formatHour(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    let displayHour = hour % 12;
    if (displayHour === 0) displayHour = 12;
    return `${displayHour.toString().padStart(2, '0')}:00 ${period}`;
  }

  public onCancel(id: number): void {
    if (confirm('Are you sure you want to cancel this booking reservation?')) {
      this.bookingService.cancelBooking(id).subscribe({
        next: () => {
          this.snackBar.open('Reservation cancelled successfully.', 'Close', { duration: 3000 });
        },
        error: (err) => {
          this.snackBar.open(err.message || 'Failed to cancel reservation.', 'Close', { duration: 5000 });
        }
      });
    }
  }
}
