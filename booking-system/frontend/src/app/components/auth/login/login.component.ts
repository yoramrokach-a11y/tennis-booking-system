import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>Account Login</mat-card-title>
          <mat-card-subtitle>Access tennis court bookings</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="form-layout">
            <mat-form-field appearance="outline">
              <mat-label>Email Address</mat-label>
              <input matInput type="email" formControlName="email" placeholder="john.doe@example.com" required>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">Please enter a valid email address</mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">Email is required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" required>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">Password is required</mat-error>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" [disabled]="loginForm.invalid || loading">
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>
        </mat-card-content>

        <mat-card-footer class="login-footer">
          <span>Don't have an account? <a routerLink="/register">Register here</a></span>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 64px);
      background-color: #fafafa;
      padding: 16px;
    }
    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 24px;
    }
    .form-layout {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 16px;
    }
    .login-footer {
      padding: 16px 24px;
      text-align: center;
      font-size: 14px;
      border-top: 1px solid #eee;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  public loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  public loading = false;

  public onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.authService.login(this.loginForm.value).subscribe({
next: (res: any) => {
  localStorage.setItem('token', res.data.token);
  localStorage.setItem('user', JSON.stringify(res.data.user));

  this.loading = false;

  const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/bookings';
  this.router.navigate([returnUrl]);

  this.snackBar.open('Logged in successfully!', 'Close', { duration: 3000 });
},
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.message, 'Close', { duration: 5000 });
      }
    });
  }
}
