import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BookingService } from '../../../services/booking.service';
import { Court } from '../../../models/booking.model';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="booking-form-container">
      <mat-card class="form-card">
        <mat-card-header>
          <div mat-card-avatar class="header-avatar">
            <mat-icon>add_circle</mat-icon>
          </div>
          <mat-card-title>Reserve a Court</mat-card-title>
          <mat-card-subtitle>Book your playing slot online</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="bookingForm" (ngSubmit)="onSubmit()" class="form-layout">
            
            <mat-form-field appearance="outline">
              <mat-label>Select Tennis Court</mat-label>
              <mat-select formControlName="courtId" required>
                <mat-option *ngFor="let court of courts" [value]="court.id">
                  {{ court.name }} {{ !court.isActive ? '(Maintenance)' : '' }}
                </mat-option>
              </mat-select>
              <mat-error *ngIf="bookingForm.get('courtId')?.hasError('required')">Please choose a court</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Booking Date</mat-label>
              <input matInput type="date" formControlName="bookingDate" [min]="minDate" required>
              <mat-error *ngIf="bookingForm.get('bookingDate')?.hasError('required')">Select a date for reservation</mat-error>
            </mat-form-field>

            <div class="time-duration-grid">
              <mat-form-field appearance="outline">
                <mat-label>Start Time (Hour)</mat-label>
                <mat-select formControlName="startHour" required>
                  <mat-option *ngFor="let hr of operatingHours" [value]="hr.val">
                    {{ hr.label }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="bookingForm.get('startHour')?.hasError('required')">Start time is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Duration (Hours)</mat-label>
                <mat-select formControlName="hours" required>
                  <mat-option [value]="1">1 Hour</mat-option>
                  <mat-option [value]="2">2 Hours</mat-option>
                  <mat-option [value]="3">3 Hours</mat-option>
                  <mat-option [value]="4">4 Hours</mat-option>
                </mat-select>
                <mat-error *ngIf="bookingForm.get('hours')?.hasError('required')">Duration is required</mat-error>
              </mat-form-field>
            </div>

            <!-- Dynamic Pricing Preview Panel -->
            <div class="pricing-panel" *ngIf="calculatedPrice > 0">
              <div class="price-row">
                <span class="price-lbl">Rate:</span>
                <span class="price-val">$50.00 / hour</span>
              </div>
              <div class="price-row total-row">
                <span class="price-lbl">Total Estimated Cost:</span>
                <span class="price-val total-val">\${{ calculatedPrice }}.00</span>
              </div>
            </div>

            <div class="actions-row">
              <button mat-stroked-button type="button" routerLink="/bookings">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="bookingForm.invalid || loading">
                {{ loading ? 'Saving Reservation...' : 'Confirm Reservation' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .booking-form-container {
      max-width: 600px;
      margin: 40px auto;
      padding: 0 16px;
    }
    .form-card {
      padding: 16px;
    }
    .header-avatar {
      background-color: #e8f5e9;
      color: #2e7d32;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .form-layout {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 24px;
    }
    .time-duration-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .pricing-panel {
      background-color: #f1f8e9;
      border: 1px dashed #a5d6a7;
      border-radius: 8px;
      padding: 16px;
      margin: 8px 0;
    }
    .price-row {
      display: flex;
      justify-content: space-between;
      color: #555;
      font-size: 14px;
    }
    .total-row {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #c8e6c9;
      color: #1b5e20;
      font-weight: 500;
    }
    .total-val {
      font-size: 18px;
      font-weight: 700;
    }
    .actions-row {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
    }
  `]
})
export class BookingFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private bookingService = inject(BookingService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  @Input() courtId?: string;

  public bookingForm!: FormGroup;
  public loading = false;
  public minDate = '';

  // Seeded physical court structures for mock UI selection
  public courts: Court[] = [
    { id: 1, name: 'Center Court 1 (Clay)', isActive: true },
    { id: 2, name: 'Show Court 2 (Grass)', isActive: true },
    { id: 3, name: 'Indoor Court 3 (Hard)', isActive: true },
    { id: 4, name: 'Grandstand Court 4 (Hard)', isActive: false }
  ];

  public operatingHours = [
    { val: 6, label: '06:00 AM' },
    { val: 7, label: '07:00 AM' },
    { val: 8, label: '08:00 AM' },
    { val: 9, label: '09:00 AM' },
    { val: 10, label: '10:00 AM' },
    { val: 11, label: '11:00 AM' },
    { val: 12, label: '12:00 PM' },
    { val: 13, label: '01:00 PM' },
    { val: 14, label: '02:00 PM' },
    { val: 15, label: '03:00 PM' },
    { val: 16, label: '04:00 PM' },
    { val: 17, label: '05:00 PM' },
    { val: 18, label: '06:00 PM' },
    { val: 19, label: '07:00 PM' },
    { val: 20, label: '08:00 PM' },
    { val: 21, label: '09:00 PM' },
    { val: 22, label: '10:00 PM' }
  ];

  public ngOnInit(): void {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.minDate = `${yyyy}-${mm}-${dd}`;

    const initialCourtId = this.courtId ? Number(this.courtId) : '';

    this.bookingForm = this.fb.group({
      courtId: [initialCourtId, Validators.required],
      bookingDate: [this.minDate, Validators.required],
      startHour: [10, Validators.required],
      hours: [1, Validators.required]
    });
  }

  public get calculatedPrice(): number {
    const hours = this.bookingForm?.get('hours')?.value;
    return hours ? hours * 50 : 0;
  }

  public onSubmit(): void {
    if (this.bookingForm.invalid) return;

    this.loading = true;
    this.bookingService.createBooking(this.bookingForm.value).subscribe({
      next: () => {
        this.snackBar.open('Court booked successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/bookings']);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.message || 'Overlap reservation occurred or invalid payload.', 'Close', { duration: 5000 });
      }
    });
  }
}
