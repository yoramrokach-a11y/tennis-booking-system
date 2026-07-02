import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar color="primary" class="header-toolbar">
      <span class="title-container" routerLink="/">
        <mat-icon class="logo-icon">sports_tennis</mat-icon>
        <span class="app-title">AceReserve</span>
      </span>
      <span class="spacer"></span>
      
      <ng-container *ngIf="authService.currentUser$ | async as user; else guest">
        <span class="welcome-text">Welcome, {{ user.name }}</span>
        <button mat-button routerLink="/dashboard">Courts</button>
        <button mat-button routerLink="/bookings">My Bookings</button>
        <button mat-button *ngIf="user.role === 'ADMIN'" routerLink="/admin" color="accent">Admin Panel</button>
        <button mat-button (click)="onLogout()">Logout</button>
      </ng-container>

      <ng-template #guest>
        <button mat-button routerLink="/login">Login</button>
        <button mat-raised-button color="accent" routerLink="/register">Register</button>
      </ng-template>
    </mat-toolbar>
  `,
  styles: [`
    .header-toolbar {
      display: flex;
      align-items: center;
      padding: 0 16px;
    }
    .title-container {
      display: flex;
      align-items: center;
      cursor: pointer;
    }
    .logo-icon {
      margin-right: 8px;
    }
    .app-title {
      font-weight: 500;
      letter-spacing: 0.5px;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .welcome-text {
      font-size: 14px;
      margin-right: 16px;
      opacity: 0.9;
    }
  `]
})
export class HeaderComponent {
  public authService = inject(AuthService);
  private router = inject(Router);

  public onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
