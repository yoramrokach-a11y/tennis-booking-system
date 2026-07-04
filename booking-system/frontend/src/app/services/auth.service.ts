import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { User, AuthResponse } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

 private currentUserSubject = new BehaviorSubject<any>(this.loadUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.loadPersistedUser();
  }

setUser(user: any) {
  this.currentUserSubject.next(user);
  localStorage.setItem('user', JSON.stringify(user));
}  

private loadUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}  

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Load user details from LocalStorage on application startup
   */
  private loadPersistedUser(): void {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (token && userJson) {
      try {
        this.currentUserSubject.next(JSON.parse(userJson));
      } catch (e) {
        this.logout();
      }
    }
  }

  /**
   * Register a new user account
   */
  public register(payload: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload).pipe(
      catchError(err => throwError(() => new Error(err.error?.message || 'Registration failed')))
    );
  }

  /**
   * Authenticate credentials and establish local session
   */
  public login(payload: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap(res => {
        if (res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
        }
      }),
      catchError(err => throwError(() => new Error(err.error?.message || 'Login failed')))
    );
  }

  /**
   * Clear session details
   */
  public logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  /**
   * Helper to check if current user has administrator role privileges
   */
  public isAdmin(): boolean {
    const user = this.currentUserValue;
    return user ? user.role === 'ADMIN' : false;
  }
}
