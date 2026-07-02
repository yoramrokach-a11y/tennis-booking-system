import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { BookingService } from '../../services/booking.service';
import { Court, Booking } from '../../models/booking.model';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

interface CourtUI extends Court {
  surface: string;
  type: 'Indoor' | 'Outdoor';
  price: number;
  image: string;
  description: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Welcome Hero Section -->
      <div class="hero-banner">
        <div class="hero-text-content">
          <h1 class="hero-title">Discover & Reserve Tennis Courts</h1>
          <p class="hero-subtitle">Select a professional-grade court and schedule your next match instantly</p>
        </div>
        <div class="hero-badge">
          <mat-icon>sports_tennis</mat-icon>
          <span>Professional Facilities</span>
        </div>
      </div>

      <!-- Quick Stats / Facility Info Row -->
      <div class="facility-bar">
        <div class="facility-item">
          <mat-icon>schedule</mat-icon>
          <div>
            <strong>Operating Hours</strong>
            <span>06:00 AM - 10:00 PM</span>
          </div>
        </div>
        <div class="facility-item">
          <mat-icon>payments</mat-icon>
          <div>
            <strong>Hourly Rate</strong>
            <span>Flat $50.00 / hour</span>
          </div>
        </div>
        <div class="facility-item">
          <mat-icon>verified</mat-icon>
          <div>
            <strong>Equipment</strong>
            <span>Racket & Ball Rentals Available</span>
          </div>
        </div>
      </div>

      <!-- Main Courts Heading -->
      <div class="section-header">
        <h2 class="section-title">Our Professional Arenas</h2>
        <p class="section-desc">Real-time availability for today ({{ todayStr }})</p>
      </div>

      <!-- Grid of Courts -->
      <div class="courts-grid">
        <mat-card class="court-card" *ngFor="let court of courtsUI" [ngClass]="{'court-disabled': !court.isActive}">
          <!-- Header Banner -->
          <div class="court-media" [style.background-image]="'url(' + court.image + ')'">
            <div class="court-overlay">
              <span class="court-surface-badge">{{ court.surface }}</span>
              <span class="court-type-badge" [ngClass]="court.type.toLowerCase()">{{ court.type }}</span>
            </div>
          </div>

          <mat-card-header class="court-header">
            <mat-card-title class="court-title">{{ court.name }}</mat-card-title>
            <mat-card-subtitle class="court-subtitle">Rate: \${{ court.price }}/hour</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content class="court-body">
            <p class="court-desc">{{ court.description }}</p>
            
            <mat-divider></mat-divider>

            <!-- Status and Real-time Availability Analysis -->
            <div class="availability-section">
              <div class="status-indicator-row">
                <span class="status-dot" [ngClass]="court.isActive ? 'dot-active' : 'dot-inactive'"></span>
                <span class="status-label">
                  {{ court.isActive ? 'Operational / Available' : 'Under Maintenance' }}
                </span>
              </div>

              <!-- Occupancy Bar -->
              <ng-container *ngIf="court.isActive; else maintenanceInfo">
                <div class="occupancy-summary">
                  <span>Today's Reservation Schedule:</span>
                  <strong class="slots-free-count">
                    {{ getRemainingSlotsCount(court.id, (bookings$ | async) || []) }} hours available
                  </strong>
                </div>

                <!-- Small hourly preview blocks for visual feedback -->
                <div class="hourly-timeline">
                  <div 
                    *ngFor="let hr of timelineHours" 
                    class="hour-block" 
                    [ngClass]="{'booked': isHourBooked(court.id, hr, (bookings$ | async) || [])}"
                    [title]="getHourTitle(court.id, hr, (bookings$ | async) || [])"
                  >
                    <span class="hour-text">{{ hr }}:00</span>
                  </div>
                </div>
              </ng-container>

              <ng-template #maintenanceInfo>
                <div class="maintenance-box">
                  <mat-icon>warning_amber</mat-icon>
                  <div>
                    <strong>Court Temporarily Suspended</strong>
                    <p>Closed for routine clay resurfacing and net repairs. Reopening scheduled soon.</p>
                  </div>
                </div>
              </ng-template>
            </div>
          </mat-card-content>

          <mat-card-actions class="court-actions">
            <button 
              mat-raised-button 
              color="primary" 
              class="w-full"
              [disabled]="!court.isActive"
              (click)="onBookCourt(court.id)"
            >
              <mat-icon>calendar_today</mat-icon> Book Court
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1200px;
      margin: 32px auto;
      padding: 0 24px;
    }

    /* Hero Banner Styling */
    .hero-banner {
      background: linear-gradient(135deg, #1b5e20 0%, #33691e 100%);
      color: white;
      border-radius: 12px;
      padding: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      box-shadow: 0 4px 15px rgba(27, 94, 32, 0.2);
    }
    .hero-title {
      font-size: 32px;
      font-weight: 700;
      margin: 0 0 12px 0;
      letter-spacing: -0.5px;
    }
    .hero-subtitle {
      font-size: 16px;
      margin: 0;
      opacity: 0.9;
    }
    .hero-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(255, 255, 255, 0.15);
      padding: 16px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.25);
    }
    .hero-badge mat-icon {
      font-size: 40px;
      height: 40px;
      width: 40px;
      margin-bottom: 8px;
    }
    .hero-badge span {
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    /* Facility Attributes Bar */
    .facility-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      margin-bottom: 40px;
    }
    .facility-item {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .facility-item mat-icon {
      color: #2e7d32;
      font-size: 28px;
      height: 28px;
      width: 28px;
    }
    .facility-item div {
      display: flex;
      flex-direction: column;
    }
    .facility-item strong {
      font-size: 14px;
      color: #333;
    }
    .facility-item span {
      font-size: 13px;
      color: #666;
    }

    /* Section Headings */
    .section-header {
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 24px;
      font-weight: 500;
      margin: 0;
      color: #1b5e20;
    }
    .section-desc {
      font-size: 14px;
      color: #666;
      margin: 4px 0 0 0;
    }

    /* Grid layout */
    .courts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    /* Cards Styling */
    .court-card {
      display: flex;
      flex-direction: column;
      border-radius: 12px !important;
      overflow: hidden;
      background-color: white;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .court-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important;
    }
    .court-disabled {
      opacity: 0.85;
    }
    .court-disabled:hover {
      transform: none;
    }

    .court-media {
      height: 160px;
      background-size: cover;
      background-position: center;
      position: relative;
    }
    .court-overlay {
      position: absolute;
      bottom: 12px;
      left: 12px;
      right: 12px;
      display: flex;
      justify-content: space-between;
    }
    .court-surface-badge {
      background-color: rgba(0,0,0,0.7);
      color: #fff;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .court-type-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .court-type-badge.indoor {
      background-color: #e3f2fd;
      color: #0d47a1;
    }
    .court-type-badge.outdoor {
      background-color: #e8f5e9;
      color: #1b5e20;
    }

    .court-header {
      padding: 16px 16px 8px 16px;
    }
    .court-title {
      font-size: 18px;
      font-weight: 700;
      color: #222;
    }
    .court-subtitle {
      font-size: 14px;
      color: #2e7d32;
      font-weight: 500;
    }

    .court-body {
      padding: 0 16px 16px 16px;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
    }
    .court-desc {
      font-size: 13px;
      line-height: 1.5;
      color: #555;
      margin: 0 0 16px 0;
      min-height: 40px;
    }

    /* Availability */
    .availability-section {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .status-indicator-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .status-dot {
      height: 8px;
      width: 8px;
      border-radius: 50%;
    }
    .dot-active {
      background-color: #4caf50;
      box-shadow: 0 0 6px #4caf50;
    }
    .dot-inactive {
      background-color: #f44336;
    }
    .status-label {
      font-size: 12px;
      font-weight: 500;
      color: #444;
    }

    .occupancy-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #555;
    }
    .slots-free-count {
      color: #2e7d32;
    }

    /* Hourly blocks timeline visualizer */
    .hourly-timeline {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 4px;
      margin-top: 4px;
    }
    .hour-block {
      background-color: #e8f5e9;
      height: 18px;
      border-radius: 3px;
      border: 1px solid #c8e6c9;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: help;
    }
    .hour-block.booked {
      background-color: #ffebee;
      border-color: #ffcdd2;
    }
    .hour-block .hour-text {
      font-size: 8px;
      color: #555;
      opacity: 0.6;
    }
    .hour-block.booked .hour-text {
      color: #b71c1c;
    }

    .maintenance-box {
      display: flex;
      gap: 12px;
      background-color: #fff3e0;
      border: 1px solid #ffe0b2;
      padding: 12px;
      border-radius: 8px;
      color: #e65100;
    }
    .maintenance-box mat-icon {
      font-size: 24px;
      height: 24px;
      width: 24px;
    }
    .maintenance-box strong {
      font-size: 13px;
      display: block;
      margin-bottom: 2px;
    }
    .maintenance-box p {
      font-size: 11px;
      margin: 0;
      line-height: 1.4;
      opacity: 0.9;
    }

    .court-actions {
      padding: 8px 16px 16px 16px;
    }
    .w-full {
      width: 100%;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private bookingService = inject(BookingService);
  private router = inject(Router);

  public bookings$!: Observable<Booking[]>;
  public todayStr = '';

  // Standard business hours we want to display on our timeline
  public timelineHours = [8, 10, 12, 14, 16, 18];

  // Professional descriptive properties for tennis court objects
  public courtsUI: CourtUI[] = [
    { 
      id: 1, 
      name: 'Center Court 1 (Clay)', 
      isActive: true,
      surface: 'Clay',
      type: 'Outdoor',
      price: 50,
      image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=600&auto=format&fit=crop',
      description: 'Prestige red clay court matching French Open specs. Excellent slide control and high bounce characteristics.'
    },
    { 
      id: 2, 
      name: 'Show Court 2 (Grass)', 
      isActive: true,
      surface: 'Grass',
      type: 'Outdoor',
      price: 50,
      image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600&auto=format&fit=crop',
      description: 'Premium natural ryegrass turf. Lightning-fast play pace and classic low bounce, mimicking Wimbledon standards.'
    },
    { 
      id: 3, 
      name: 'Indoor Court 3 (Hard)', 
      isActive: true,
      surface: 'Hardcourt',
      type: 'Indoor',
      price: 50,
      image: 'https://images.unsplash.com/photo-1538386393326-fa92e4858ee7?q=80&w=600&auto=format&fit=crop',
      description: 'All-weather cushioned acrylic hardcourt. Climate-controlled indoor space with professional reflection-free lighting.'
    },
    { 
      id: 4, 
      name: 'Grandstand Court 4 (Hard)', 
      isActive: false,
      surface: 'Hardcourt',
      type: 'Outdoor',
      price: 50,
      image: 'https://images.unsplash.com/photo-1511067007398-7e4b90cfa4bc?q=80&w=600&auto=format&fit=crop',
      description: 'Outdoor acrylic hardcourt with ample grandstand spectator seating. Great medium-fast court velocity.'
    }
  ];

  public ngOnInit(): void {
    // 1. Establish localized today's date string representation (YYYY-MM-DD)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.todayStr = `${yyyy}-${mm}-${dd}`;

    // 2. Fetch current reservations from API to calculate actual bookings
    this.bookingService.loadBookings();
    this.bookings$ = this.bookingService.bookings$;
  }

  /**
   * Evaluates if a court has a reservation occupying a specific standard hour today.
   */
  public isHourBooked(courtId: number, hour: number, bookings: Booking[]): boolean {
    return bookings.some(b => 
      b.courtId === courtId && 
      b.bookingDate === this.todayStr &&
      b.status !== 'CANCELLED' &&
      hour >= b.startHour && 
      hour < (b.startHour + b.hours)
    );
  }

  /**
   * Helper to return tooltip metadata about a specific slot.
   */
  public getHourTitle(courtId: number, hour: number, bookings: Booking[]): string {
    const isBooked = this.isHourBooked(courtId, hour, bookings);
    const label = hour >= 12 ? `${hour === 12 ? 12 : hour - 12}:00 PM` : `${hour}:00 AM`;
    return isBooked ? `${label} - Booked` : `${label} - Available`;
  }

  /**
   * Calculates how many total hours are open today during operational range (06:00 to 22:00)
   */
  public getRemainingSlotsCount(courtId: number, bookings: Booking[]): number {
    const totalOperatingHours = 16; // 6 to 22 is 16 total hours
    
    // Find all hours that are currently reserved on this court today
    let reservedHoursCount = 0;
    const courtBookingsToday = bookings.filter(b => 
      b.courtId === courtId && 
      b.bookingDate === this.todayStr && 
      b.status !== 'CANCELLED'
    );

    courtBookingsToday.forEach(b => {
      // Find the overlap with operating hours
      const start = Math.max(6, b.startHour);
      const end = Math.min(22, b.startHour + b.hours);
      if (end > start) {
        reservedHoursCount += (end - start);
      }
    });

    const availableHours = totalOperatingHours - reservedHoursCount;
    return availableHours > 0 ? availableHours : 0;
  }

  /**
   * Handles pre-selection routing
   */
  public onBookCourt(courtId: number): void {
    this.router.navigate(['/bookings/new'], { queryParams: { courtId } });
  }
}
